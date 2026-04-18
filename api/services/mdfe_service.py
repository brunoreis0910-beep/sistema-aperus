"""
Service para emissão de MDF-e (Manifesto Eletrônico de Documentos Fiscais)
"""
import logging
from datetime import datetime
from decimal import Decimal
from io import BytesIO
from lxml import etree
import requests
from django.conf import settings
from django.utils import timezone
from api.models import EmpresaConfig

from .mdfe_signer_native import MDFeSignerNative

logger = logging.getLogger('django')


class MDFeService:
    """Serviço para geração e emissão de MDF-e"""
    
    URL_MDFE_HOMOLOGACAO = "https://mdfe-homologacao.svrs.rs.gov.br/ws/mdfeRecepcaoSinc/MDFeRecepcaoSinc.asmx"
    URL_MDFE_PRODUCAO = "https://mdfe.svrs.rs.gov.br/ws/mdfeRecepcaoSinc/MDFeRecepcaoSinc.asmx"
    NAMESPACE_MDFE = "http://www.portalfiscal.inf.br/mdfe"
    NAMESPACE_WSDL = "http://www.portalfiscal.inf.br/mdfe/wsdl/MDFeRecepcaoSinc"
    NAMESPACE_SOAP = "http://www.w3.org/2003/05/soap-envelope"
    
    # URL MG para envio de eventos (Encerramento/Cancelamento) (O MDF-e é nacional na SVRS, então a SVRS é usada para todos os estados)
    URL_EVENTO_HOMOLOGACAO = "https://mdfe-homologacao.svrs.rs.gov.br/ws/mdfeRecepcaoEvento/MDFeRecepcaoEvento.asmx"
    URL_EVENTO_PRODUCAO = "https://mdfe.svrs.rs.gov.br/ws/mdfeRecepcaoEvento/MDFeRecepcaoEvento.asmx"

    def __init__(self):
        self.empresa = EmpresaConfig.get_ativa()
        if not self.empresa:
            raise Exception("EmpresaConfig não configurado.")
            
        self.ambiente = getattr(settings, 'NFE_AMBIENTE', self.empresa.ambiente_nfe if hasattr(self.empresa, 'ambiente_nfe') else 2)
        self.uf_emitente = self.empresa.estado or 'SP'
        
        try:
            self.signer = MDFeSignerNative(
                self.empresa.certificado_digital,
                self.empresa.senha_certificado
            )
            logger.info("[MDFE] Assinador nativo carregado com sucesso.")
        except Exception as e:
            logger.error(f"[MDFE] Falha ao carregar certificado digital: {e}")
            self.signer = None

    def emitir_mdfe(self, mdfe):
        """
        
        Args:
            mdfe: Objeto ManifestoEletronico
        
        Returns:
            dict com resultado da emissão
        """
        logger.info(f"[MDFE] Iniciando emissão do MDF-e {mdfe.id_mdfe}")
        
        try:
            # 1. Gerar número e chave
            self._gerar_numero_chave(mdfe)
            
            # 2. Gerar XML
            xml_root = self._gerar_xml_mdfe(mdfe)
            xml_str = etree.tostring(xml_root, encoding='unicode', pretty_print=False)
            # Adicionar declaração XML manualmente
            xml_str = '<?xml version="1.0" encoding="UTF-8"?>' + xml_str
            
            # 3. Assinar XML (simulado em homologação)
            xml_assinado = self._assinar_xml(xml_str, mdfe)
            
            # 4. Enviar para SEFAZ (simulado em homologação)
            if self.ambiente == 2:
                resultado = self._enviar_homologacao(xml_assinado, mdfe)
            else:
                resultado = self._enviar_producao(xml_assinado, mdfe)
            
            # 5. Processar retorno
            if resultado['autorizado']:
                mdfe.status_mdfe = 'EMITIDO'
                mdfe.protocolo_mdfe = resultado['protocolo']
                mdfe.cstat = resultado['cstat']
                mdfe.xmotivo = (resultado.get('xmotivo') or '')[:250]
                mdfe.xml_mdfe = xml_assinado
                mdfe.qrcode_url = self._gerar_url_qrcode(mdfe)
                mdfe.save()
                
                logger.info(f"[MDFE] MDF-e {mdfe.numero_mdfe} autorizado - Protocolo: {resultado['protocolo']}")
                
                return {
                    'success': True,
                    'message': 'MDF-e autorizado com sucesso',
                    'protocolo': resultado['protocolo'],
                    'chave': mdfe.chave_mdfe
                }
            else:
                # Erro na autorização
                mdfe.status_mdfe = 'ERRO'
                mdfe.cstat = resultado['cstat']
                mdfe.xmotivo = (resultado.get('xmotivo') or '')[:250]
                mdfe.save()
                
                raise Exception(f"Erro {resultado['cstat']}: {resultado['xmotivo']}")
        
        except Exception as e:
            logger.error(f"[MDFE] Erro ao emitir MDF-e {mdfe.id_mdfe}: {str(e)}")
            mdfe.status_mdfe = 'ERRO'
            mdfe.xmotivo = str(e)[:255]
            mdfe.save()
            raise
    
    def _gerar_numero_chave(self, mdfe):
        """Gera número e chave de acesso do MDF-e"""
        from mdfe.models import ManifestoEletronico

        # Buscar próximo número
        if not mdfe.numero_mdfe:
            ultimo = ManifestoEletronico.objects.filter(
                serie_mdfe=mdfe.serie_mdfe
            ).exclude(pk=mdfe.pk).order_by('-numero_mdfe').first()

            mdfe.numero_mdfe = (ultimo.numero_mdfe + 1) if ultimo and ultimo.numero_mdfe else 1

        # Gerar chave de acesso (44 dígitos)
        empresa_cnpj = ''.join(filter(str.isdigit, self.empresa.cpf_cnpj)).zfill(14) if self.empresa.cpf_cnpj else '00000000000000'
        uf_codigo = self._get_codigo_uf(self.uf_emitente)
        ano_mes = datetime.now().strftime('%y%m')
        modelo = '58'  # MDF-e
        serie = str(mdfe.serie_mdfe).zfill(3)
        numero = str(mdfe.numero_mdfe).zfill(9)
        tipo_emissao = '1'  # Normal
        codigo_numerico = str(mdfe.id_mdfe).zfill(8)
        
        chave_sem_dv = f"{uf_codigo}{ano_mes}{empresa_cnpj}{modelo}{serie}{numero}{tipo_emissao}{codigo_numerico}"
        dv = self._calcular_dv_chave(chave_sem_dv)
        
        mdfe.chave_mdfe = chave_sem_dv + str(dv)
        mdfe.save()
        
        logger.info(f"[MDFE] Chave gerada: {mdfe.chave_mdfe}")
    
    def _calcular_dv_chave(self, chave):
        """Calcula dígito verificador da chave de acesso"""
        soma = 0
        peso = 2
        
        for i in range(len(chave) - 1, -1, -1):
            soma += int(chave[i]) * peso
            peso += 1
            if peso > 9:
                peso = 2
        
        resto = soma % 11
        dv = 11 - resto if resto > 1 else 0
        
        return dv
    
    def _get_codigo_uf(self, uf):
        """Retorna código IBGE da UF"""
        codigos = {
            'AC': '12', 'AL': '27', 'AP': '16', 'AM': '13', 'BA': '29',
            'CE': '23', 'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21',
            'MT': '51', 'MS': '50', 'MG': '31', 'PA': '15', 'PB': '25',
            'PR': '41', 'PE': '26', 'PI': '22', 'RJ': '33', 'RN': '24',
            'RS': '43', 'RO': '11', 'RR': '14', 'SC': '42', 'SP': '35',
            'SE': '28', 'TO': '17'
        }
        return codigos.get(uf, '35')
    
    def _gerar_xml_mdfe(self, mdfe):
        """Gera XML do MDF-e"""
        # Namespace
        ns = 'http://www.portalfiscal.inf.br/mdfe'
        nsmap = {None: ns}

        # Raiz
        root = etree.Element('MDFe', nsmap=nsmap)

        # infMDFe
        inf_mdfe = etree.SubElement(root, 'infMDFe', versao='3.00', Id=f'MDFe{mdfe.chave_mdfe}')
        
        # ide
        ide = etree.SubElement(inf_mdfe, 'ide')
        etree.SubElement(ide, 'cUF').text = self._get_codigo_uf(self.uf_emitente)
        etree.SubElement(ide, 'tpAmb').text = str(self.ambiente)
        etree.SubElement(ide, 'tpEmit').text = str(mdfe.tipo_emitente)
        
        # tpTransp so pode ser informado se tpEmit=1 ou tem proprietario do veiculo de tracao info
        if mdfe.tipo_emitente == '1' and mdfe.tipo_transporte:
            etree.SubElement(ide, 'tpTransp').text = str(mdfe.tipo_transporte)
        etree.SubElement(ide, 'mod').text = mdfe.modelo
        etree.SubElement(ide, 'serie').text = str(mdfe.serie_mdfe)
        etree.SubElement(ide, 'nMDF').text = str(mdfe.numero_mdfe)
        etree.SubElement(ide, 'cMDF').text = mdfe.chave_mdfe[35:43]
        etree.SubElement(ide, 'cDV').text = mdfe.chave_mdfe[43]
        etree.SubElement(ide, 'modal').text = str(int(mdfe.modal)) if str(mdfe.modal).isdigit() else str(mdfe.modal)
        data_emissao = mdfe.data_emissao.strftime('%Y-%m-%dT%H:%M:%S-03:00')
        etree.SubElement(ide, 'dhEmi').text = data_emissao
        etree.SubElement(ide, 'tpEmis').text = '1'  # Normal
        etree.SubElement(ide, 'procEmi').text = '0'  # Aplicativo do contribuinte
        etree.SubElement(ide, 'verProc').text = '1.0.0'
        etree.SubElement(ide, 'UFIni').text = mdfe.uf_inicio or self.uf_emitente
        etree.SubElement(ide, 'UFFim').text = mdfe.uf_fim or self.uf_emitente
        
        # Município de Carregamento
        carregamentos = mdfe.carregamentos.all()
        if carregamentos.exists():
            for carregamento in carregamentos:
                inf_mun_carrega = etree.SubElement(ide, 'infMunCarrega')
                etree.SubElement(inf_mun_carrega, 'cMunCarrega').text = str(carregamento.municipio_codigo_ibge)
                etree.SubElement(inf_mun_carrega, 'xMunCarrega').text = carregamento.municipio_nome
        else:
            inf_mun_carrega = etree.SubElement(ide, 'infMunCarrega')
            etree.SubElement(inf_mun_carrega, 'cMunCarrega').text = getattr(settings, 'EMPRESA_CODIGO_MUNICIPIO', '3550308')
            etree.SubElement(inf_mun_carrega, 'xMunCarrega').text = getattr(settings, 'EMPRESA_MUNICIPIO', 'São Paulo')
        
        # Percurso (UFs intermediárias)
        for percurso in mdfe.percursos.all().order_by('ordem'):
            inf_percurso = etree.SubElement(ide, 'infPercurso')
            etree.SubElement(inf_percurso, 'UFPer').text = percurso.uf
        
        # emit (Emitente)
        emit = etree.SubElement(inf_mdfe, 'emit')
        emp_cnpj = (getattr(self.empresa, 'cpf_cnpj', '') or '00000000000000').replace('.', '').replace('/', '').replace('-', '')
        etree.SubElement(emit, 'CNPJ').text = emp_cnpj
        
        ie = (getattr(self.empresa, 'inscricao_estadual', '') or '').replace('.', '').strip()
        if not ie or ie.upper() == 'ISENTO':
            etree.SubElement(emit, 'IE').text = 'ISENTO'
        else:
            etree.SubElement(emit, 'IE').text = ie
            
        etree.SubElement(emit, 'xNome').text = getattr(self.empresa, 'nome_razao_social', '') or 'Empresa'
        etree.SubElement(emit, 'xFant').text = getattr(self.empresa, 'nome_fantasia', '') or getattr(self.empresa, 'nome_razao_social', '') or 'Empresa'
        
        # enderEmit
        ender_emit = etree.SubElement(emit, 'enderEmit')
        etree.SubElement(ender_emit, 'xLgr').text = getattr(self.empresa, 'endereco', '') or 'Rua Exemplo'
        etree.SubElement(ender_emit, 'nro').text = getattr(self.empresa, 'numero', '') or '0'
        etree.SubElement(ender_emit, 'xBairro').text = getattr(self.empresa, 'bairro', '') or 'Centro'
        etree.SubElement(ender_emit, 'cMun').text = str(getattr(self.empresa, 'codigo_municipio_ibge', '')) or '3550308'
        etree.SubElement(ender_emit, 'xMun').text = getattr(self.empresa, 'cidade', '') or 'São Paulo'
        etree.SubElement(ender_emit, 'CEP').text = (getattr(self.empresa, 'cep', '') or '01310100').replace('-', '')
        etree.SubElement(ender_emit, 'UF').text = getattr(self.empresa, 'estado', '') or self.uf_emitente
        telefone = (getattr(self.empresa, 'telefone', '') or '1100000000').replace('(', '').replace(')', '').replace('-', '').replace(' ', '')
        if telefone:
            etree.SubElement(ender_emit, 'fone').text = telefone
        
        # infPag - Pagamento
        
        # infModal - rodoviário
        inf_modal = etree.SubElement(inf_mdfe, 'infModal', versaoModal='3.00')
        rodo = etree.SubElement(inf_modal, 'rodo')
        
        # Veículo de tração
        veiculo_tracao = etree.SubElement(rodo, 'veicTracao')
        etree.SubElement(veiculo_tracao, 'cInt').text = '1'
        etree.SubElement(veiculo_tracao, 'placa').text = mdfe.placa_veiculo.upper().replace('-', '')
        etree.SubElement(veiculo_tracao, 'tara').text = '0'
        etree.SubElement(veiculo_tracao, 'capKG').text = '0'
        
        # Condutor
        condutor = etree.SubElement(veiculo_tracao, 'condutor')
        etree.SubElement(condutor, 'xNome').text = mdfe.condutor_nome
        etree.SubElement(condutor, 'CPF').text = mdfe.condutor_cpf.replace('.', '').replace('-', '')
        
        # tpRod, tpCar, UF
        etree.SubElement(veiculo_tracao, 'tpRod').text = '01'
        etree.SubElement(veiculo_tracao, 'tpCar').text = '00'
        etree.SubElement(veiculo_tracao, 'UF').text = self.empresa.estado if self.empresa and self.empresa.estado else 'MG'

        
        
        
        # infDoc - Só criar se houver documentos vinculados
        if mdfe.documentos_vinculados.exists():
            inf_doc = etree.SubElement(inf_mdfe, 'infDoc')

            # Obter município de descarga do banco de dados
            descarregamento = mdfe.descarregamentos.first()
            if descarregamento:
                codigo_municipio_descarga = descarregamento.municipio_codigo_ibge
                nome_municipio_descarga = descarregamento.municipio_nome
            else:
                # Fallback para settings se não houver descarregamento cadastrado
                codigo_municipio_descarga = getattr(settings, 'EMPRESA_CODIGO_MUNICIPIO', '3550308')
                nome_municipio_descarga = getattr(settings, 'EMPRESA_MUNICIPIO', 'São Paulo')
            
            inf_mun_descarga = etree.SubElement(inf_doc, 'infMunDescarga')
            etree.SubElement(inf_mun_descarga, 'cMunDescarga').text = str(codigo_municipio_descarga)
            etree.SubElement(inf_mun_descarga, 'xMunDescarga').text = nome_municipio_descarga
            for doc in mdfe.documentos_vinculados.all():
                if doc.tipo_documento == 'CTE':
                    inf_cte = etree.SubElement(inf_mun_descarga, 'infCTe')
                    etree.SubElement(inf_cte, 'chCTe').text = doc.chave_acesso
                elif doc.tipo_documento == 'NFE':
                    inf_nfe = etree.SubElement(inf_mun_descarga, 'infNFe')
                    etree.SubElement(inf_nfe, 'chNFe').text = doc.chave_acesso
                elif doc.tipo_documento == 'MDFE':
                    inf_mdfe_transp = etree.SubElement(inf_mun_descarga, 'infMDFeTransp')
                    etree.SubElement(inf_mdfe_transp, 'chMDFe').text = doc.chave_acesso

        # seg (Seguro)
        if mdfe.nome_seguradora:
            seg = etree.SubElement(inf_mdfe, 'seg')
            inf_resp = etree.SubElement(seg, 'infResp')
            etree.SubElement(inf_resp, 'respSeg').text = mdfe.responsavel_seguro
            etree.SubElement(inf_resp, 'CNPJ').text = mdfe.cnpj_seguradora.replace('.', '').replace('/', '').replace('-', '')
            
            inf_seg = etree.SubElement(seg, 'infSeg')
            etree.SubElement(inf_seg, 'xSeg').text = mdfe.nome_seguradora
            etree.SubElement(inf_seg, 'CNPJ').text = mdfe.cnpj_seguradora.replace('.', '').replace('/', '').replace('-', '')
        
        # tot (Totalizadores) - CALCULAR QUANTIDADE REAL DE DOCUMENTOS
        # Contar documentos vinculados reais ao invés de usar campos que podem estar desatualizados
        qtd_nfe_real = mdfe.documentos_vinculados.filter(tipo_documento='NFE').count()
        qtd_cte_real = mdfe.documentos_vinculados.filter(tipo_documento='CTE').count()
        qtd_mdfe_real = mdfe.documentos_vinculados.filter(tipo_documento='MDFE').count()
        
        tot = etree.SubElement(inf_mdfe, 'tot')
        # Só adicionar qCTe se houver CT-e
        if qtd_cte_real > 0:
            etree.SubElement(tot, 'qCTe').text = str(qtd_cte_real)
        # Só adicionar qNFe se houver NF-e
        if qtd_nfe_real > 0:
            etree.SubElement(tot, 'qNFe').text = str(qtd_nfe_real)
        # Só adicionar qMDFe se houver MDF-e vinculado (transporte de outra carga já manifestada)
        if qtd_mdfe_real > 0:
            etree.SubElement(tot, 'qMDFe').text = str(qtd_mdfe_real)
        etree.SubElement(tot, 'vCarga').text = f'{mdfe.valor_total_carga:.2f}'
        etree.SubElement(tot, 'cUnid').text = '01'  # KG
        etree.SubElement(tot, 'qCarga').text = f'{mdfe.peso_total_kg:.4f}'
        
        # infAdic (Informações Adicionais)
        if mdfe.observacoes:
            inf_adic = etree.SubElement(inf_mdfe, 'infAdic')
            etree.SubElement(inf_adic, 'infCpl').text = mdfe.observacoes
        
        # infMDFeSupl - Informações Suplementares do MDF-e (QR Code)
        # Deve ser adicionado APÓS infMDFe, mas ANTES da assinatura
        inf_mdfe_supl = etree.SubElement(root, 'infMDFeSupl')
        qrcode_url = self._gerar_url_qrcode(mdfe)
        # O QR Code deve estar em CDATA conforme especificação SEFAZ
        qr_cod_mdfe = etree.SubElement(inf_mdfe_supl, 'qrCodMDFe')
        qr_cod_mdfe.text = etree.CDATA(qrcode_url)
        
        # Salvar URL do QR Code no banco
        mdfe.qrcode_url = qrcode_url
        mdfe.save()
        
        return root
    
    def _assinar_xml(self, xml_str, mdfe):
        """
        Assina XML MDF-e (Nativo)
        """
        if not self.signer:
            raise Exception("Assinador não configurado. Verifique o certificado digital.")

        logger.info("[MDFE] Assinando XML do MDF-e...")
        try:
            xml_signed = self.signer.sign_mdfe_xml(xml_str)
            return xml_signed
        except Exception as e:
            logger.error(f"[MDFE] Erro ao assinar XML: {e}")
            raise Exception(f"Erro ao assinar XML do MDF-e: {e}")

    def _assinar_evento(self, xml_str):
        """
        Assina XML Evento MDF-e
        """
        if not self.signer:
            raise Exception("Assinador não configurado.")

        logger.info("[MDFE] Assinando XML de evento...")
        try:
            return self.signer.sign_evento_mdfe_xml(xml_str)
        except Exception as e:
            logger.error(f"[MDFE] Erro ao assinar Evento: {e}")
            raise Exception(f"Erro ao assinar Evento do MDF-e: {e}")

    def _criar_envelope_soap(self, content):
        """
        Cria o envelope SOAP para envio à Sefaz
        """
        env = (
            f'<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
            f'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
            f'xmlns:soap12="{self.NAMESPACE_SOAP}">'
            f'<soap12:Header>'
            f'<mdfeCabecMsg xmlns="{self.NAMESPACE_WSDL}">'
            f'<cUF>{self._get_codigo_uf(self.uf_emitente)}</cUF>'
            f'<versaoDados>3.00</versaoDados>'
            f'</mdfeCabecMsg>'
            f'</soap12:Header>'
            f'<soap12:Body>'
            f'<mdfeDadosMsg xmlns="{self.NAMESPACE_WSDL}">'
            f'{content}'
            f'</mdfeDadosMsg>'
            f'</soap12:Body>'
            f'</soap12:Envelope>'
        )
        return env

    def _processar_retorno_soap(self, response_text):
        """
        Processa retorno XML/SOAP da SEFAZ
        """
        logger.info("[MDFE] ===== PROCESSANDO RETORNO SEFAZ =====")
        try:
            root = etree.fromstring(response_text.encode('utf-8'))
            
            # Verificar se é evento
            ret_evento = root.xpath('//*[local-name()="retEventoMDFe"]')
            if ret_evento:
                ret = ret_evento[0]
                cStat = (ret.xpath('.//*[local-name()="cStat"]') or [None])[0]
                cStat = cStat.text if cStat is not None else "999"
                xMotivo = (ret.xpath('.//*[local-name()="xMotivo"]') or [None])[0]
                xMotivo = xMotivo.text if xMotivo is not None else "Erro Desconhecido"
                
                # Check for "135" (Evento vinculado)
                autorizado = cStat in ["135", "136", "101"]
                return {
                    'autorizado': autorizado,
                    'cstat': cStat,
                    'xmotivo': xMotivo,
                    'protocolo': (ret.xpath('.//*[local-name()="nProt"]') or [None])[0].text if autorizado and ret.xpath('.//*[local-name()="nProt"]') else None
                }
            
            # Buscar retEnviMDFe (Resposta de envio normal)
            ret_env = root.xpath('//*[local-name()="retEnviMDFe"]')
            ret_any = root.xpath('//*[local-name()="retMDFe"]')
            ret_evento = root.xpath('//*[local-name()="retEventoMDFe"]')
            
            ret = None
            if ret_env:
                ret = ret_env[0]
            elif ret_any:
                ret = ret_any[0]
            elif ret_evento:
                ret = ret_evento[0]
                
            if ret is None:
                cstat_loose = root.xpath('//*[local-name()="cStat"]')
                if cstat_loose:
                    cStat = cstat_loose[0].text
                    xMotivo = root.xpath('//*[local-name()="xMotivo"]')[0].text
                    return {
                        'autorizado': False,
                        'cstat': cStat,
                        'xmotivo': xMotivo
                    }
                raise ValueError("Elementos de retorno (retEnviMDFe, retMDFe ou retEventoMDFe) não encontrados no XML da Sefaz.")
                
            # Extrair dados de retorno
            cStat = (ret.xpath('.//*[local-name()="cStat"]') or [None])[0]
            cStat = cStat.text if cStat is not None else "999"
            
            xMotivo = (ret.xpath('.//*[local-name()="xMotivo"]') or [None])[0]
            xMotivo = xMotivo.text if xMotivo is not None else "Erro Desconhecido"
            
            # ProtMDFe
            prot_mdfe = ret.xpath('.//*[local-name()="protMDFe"]')
            
            protocolo = None
            if prot_mdfe:
                nProt = prot_mdfe[0].xpath('.//*[local-name()="nProt"]')
                if nProt:
                    protocolo = nProt[0].text
                    
            if cStat == "100":
                return {
                    'autorizado': True,
                    'protocolo': protocolo,
                    'cstat': cStat,
                    'xmotivo': xMotivo
                }
            else:
                return {
                    'autorizado': False,
                    'protocolo': protocolo,
                    'cstat': cStat,
                    'xmotivo': xMotivo
                }
        except Exception as e:
            logger.error(f"[MDFE] Erro ao processar retorno SOAP: {e}")
            return {
                'autorizado': False,
                'cstat': '999',
                'xmotivo': f'Erro interno Sefaz: {str(e)}'
            }

    def _enviar_sefaz_soap(self, xml_assinado):
        """Envia para Sefaz Real (Emissão MDFe)"""
        import gzip
        import base64
        
        # O envio do MDFe na receita mudou para mdfeRecepcaoSinc (Síncrono)
        # Primeiro, precisamos do conteúdo GZIP e base64
        
        out = BytesIO()
        with gzip.GzipFile(fileobj=out, mode='wb') as f:
            f.write(xml_assinado.encode('utf-8'))
        xml_gzip_b64 = base64.b64encode(out.getvalue()).decode('utf-8')
        
        envelope = self._criar_envelope_soap(xml_gzip_b64)
        
        url = self.URL_MDFE_PRODUCAO if self.ambiente == 1 else self.URL_MDFE_HOMOLOGACAO
        
        headers = {
            'Content-Type': f'application/soap+xml; charset=utf-8; action="{self.NAMESPACE_WSDL}/mdfeRecepcaoSinc"',
            'Accept': 'application/soap+xml'
        }
        
        return self._efetuar_post_soap(url, headers, envelope)

    def _enviar_evento_sefaz(self, xml_assinado):
        """Envia um evento (Cancelamento/Encerramento) para a Sefaz"""
        # A Sefaz espera o XML assinado do evento COM nodes XML, não CDATA e SEM <?xml version...>
        xml_limpo = xml_assinado.replace('<?xml version="1.0" encoding="UTF-8"?>', '').replace('<?xml version="1.0" encoding="utf-8"?>', '').strip()
        
        envelope = (
            f'<?xml version="1.0" encoding="utf-8"?>'
            f'<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
            f'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
            f'xmlns:soap12="{self.NAMESPACE_SOAP}">'
            f'<soap12:Header>'
            f'<mdfeCabecMsg xmlns="http://www.portalfiscal.inf.br/mdfe/wsdl/MDFeRecepcaoEvento">'
            f'<cUF>{self.empresa.codigo_ibge_cidade[:2] if getattr(self.empresa, "codigo_ibge_cidade", None) else "31"}</cUF>'
            f'<versaoDados>3.00</versaoDados>'
            f'</mdfeCabecMsg>'
            f'</soap12:Header>'
            f'<soap12:Body>'
            f'<mdfeDadosMsg xmlns="http://www.portalfiscal.inf.br/mdfe/wsdl/MDFeRecepcaoEvento">'
            f'{xml_limpo}'
            f'</mdfeDadosMsg>'
            f'</soap12:Body>'
            f'</soap12:Envelope>'
        )

        url = self.URL_EVENTO_PRODUCAO if self.ambiente == 1 else self.URL_EVENTO_HOMOLOGACAO
        
        headers = {
            'Content-Type': f'application/soap+xml; charset=utf-8; action="http://www.portalfiscal.inf.br/mdfe/wsdl/MDFeRecepcaoEvento/mdfeRecepcaoEvento"',
            'Accept': 'application/soap+xml'
        }
        
        return self._efetuar_post_soap(url, headers, envelope)
        
    def _efetuar_post_soap(self, url, headers, envelope):
        from api.services.signer_service import SignerService
        
        try:
            cert_service = SignerService(
                self.empresa.certificado_digital, 
                self.empresa.senha_certificado
            )
            cert_path, key_path = cert_service.get_cert_key_pem()
        except Exception as e:
            logger.error(f"[MDFE] Erro ao carregar certificado digital PEM: {e}")
            raise Exception(f"Certificado não configurado corretamente: {e}")
            
        try:
            requests.packages.urllib3.disable_warnings() 
            
            logger.info(f"[MDFE] Enviando para Sefaz {url}")
            response = requests.post(
                url,
                data=envelope.encode('utf-8'),
                headers=headers,
                cert=(cert_path, key_path),
                verify=False,
                timeout=30
            )
            
            logger.info(f"[MDFE] Status da Resposta: {response.status_code}")
            logger.info(f"[MDFE] Corpo da Resposta: {response.text}")
            
            return self._processar_retorno_soap(response.text)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"[MDFE] Erro de rede Sefaz: {e}")
            raise Exception(f"Sefaz Indisponível: {str(e)}")
        finally:
            if 'cert_service' in locals() and hasattr(cert_service, 'cleanup'):
                cert_service.cleanup()
                
    def _enviar_homologacao(self, xml, mdfe):
        """Redireciona para o envio real"""
        return self._enviar_sefaz_soap(xml)

    def _enviar_producao(self, xml, mdfe):
        """Redireciona para o envio real"""
        return self._enviar_sefaz_soap(xml)

    def _gerar_url_qrcode(self, mdfe):
        """Gera URL do QR Code do MDF-e conforme padrão SEFAZ"""
        ambiente = self.ambiente
        
        # URL do QR Code do MDF-e (padrão SVRS que atende a maioria dos estados)
        if ambiente == 2:
            # Homologação
            url_base = "https://dfe-portal.svrs.rs.gov.br/mdfe/qrCode"
        else:
            # Produção
            url_base = "https://dfe-portal.svrs.rs.gov.br/mdfe/qrCode"
        
        # Formato: url_base?chMDFe=CHAVE_44_DIGITOS&tpAmb=AMBIENTE
        return f"{url_base}?chMDFe={mdfe.chave_mdfe}&tpAmb={ambiente}"
    
    def encerrar_mdfe(self, mdfe, dados=None):
        """
        Encerra MDF-e (avisa SEFAZ que viagem foi concluída)
        """
        logger.info(f"[MDFE] Encerrando MDF-e {mdfe.numero_mdfe}")
        
        if not mdfe.chave_mdfe:
            raise Exception("MDF-e não possui chave para ser encerrado")
            
        codigo_uf = self.empresa.codigo_ibge_cidade[:2] if getattr(self.empresa, "codigo_ibge_cidade", None) else "31"
        cnpj = "".join(filter(str.isdigit, self.empresa.cpf_cnpj or ''))
        
        tp_evento = "110112" # Encerramento
        seq_evento = "1"
        dh_evento = datetime.now().strftime('%Y-%m-%dT%H:%M:%S-03:00')
        id_evento = f"ID{tp_evento}{mdfe.chave_mdfe}{seq_evento.zfill(2)}"
        
        # O município de encerramento geralmente é o de descarga ou final da viagem
        descarga = mdfe.descarregamentos.first()
        cMun_enc = descarga.municipio_codigo_ibge if descarga and descarga.municipio_codigo_ibge else (self.empresa.codigo_ibge_cidade or "3100000")
        cUF_enc = cMun_enc[:2]
        
        xml_evento = (
            f'<eventoMDFe xmlns="{self.NAMESPACE_MDFE}" versao="3.00">'
            f'<infEvento Id="{id_evento}">'
            f'<cOrgao>{codigo_uf}</cOrgao>'
            f'<tpAmb>{self.ambiente}</tpAmb>'
            f'<CNPJ>{cnpj}</CNPJ>'
            f'<chMDFe>{mdfe.chave_mdfe}</chMDFe>'
            f'<dhEvento>{dh_evento}</dhEvento>'
            f'<tpEvento>{tp_evento}</tpEvento>'
            f'<nSeqEvento>{seq_evento}</nSeqEvento>'
            f'<detEvento versaoEvento="3.00">'
            f'<evEncMDFe>'
            f'<descEvento>Encerramento</descEvento>'
            f'<nProt>{mdfe.protocolo_mdfe}</nProt>'
            f'<dtEnc>{datetime.now().strftime("%Y-%m-%d")}</dtEnc>'
            f'<cUF>{cUF_enc}</cUF>'
            f'<cMun>{cMun_enc}</cMun>'
            f'</evEncMDFe>'
            f'</detEvento>'
            f'</infEvento>'
            f'</eventoMDFe>'
        )
        
        xml_assinado = self._assinar_evento(xml_evento)
        
        retorno = self._enviar_evento_sefaz(xml_assinado)
        
        if retorno.get('autorizado'):
            mdfe.status_mdfe = 'ENCERRADO'
            mdfe.save()
            return {'success': True, 'message': 'MDF-e encerrado com sucesso'}
        else:
            raise Exception(f"Erro ao encerrar MDF-e na Sefaz: {retorno.get('cstat')} - {retorno.get('xmotivo')}")
    
    def cancelar_mdfe(self, mdfe, justificativa):
        """
        Cancela MDF-e
        """
        logger.info(f"[MDFE] Cancelando MDF-e {mdfe.numero_mdfe}")
        
        if not mdfe.chave_mdfe:
            raise Exception("MDF-e não possui chave para ser cancelado")
            
        if not mdfe.protocolo_mdfe:
            raise Exception("MDF-e não possui protocolo de autorização")
            
        codigo_uf = self.empresa.codigo_ibge_cidade[:2] if getattr(self.empresa, "codigo_ibge_cidade", None) else "31"
        cnpj = "".join(filter(str.isdigit, self.empresa.cpf_cnpj or ''))
        
        tp_evento = "110111" # Cancelamento
        seq_evento = "1"
        dh_evento = datetime.now().strftime('%Y-%m-%dT%H:%M:%S-03:00')
        id_evento = f"ID{tp_evento}{mdfe.chave_mdfe}{seq_evento.zfill(2)}"
        
        xml_evento = (
            f'<eventoMDFe xmlns="{self.NAMESPACE_MDFE}" versao="3.00">'
            f'<infEvento Id="{id_evento}">'
            f'<cOrgao>{codigo_uf}</cOrgao>'
            f'<tpAmb>{self.ambiente}</tpAmb>'
            f'<CNPJ>{cnpj}</CNPJ>'
            f'<chMDFe>{mdfe.chave_mdfe}</chMDFe>'
            f'<dhEvento>{dh_evento}</dhEvento>'
            f'<tpEvento>{tp_evento}</tpEvento>'
            f'<nSeqEvento>{seq_evento}</nSeqEvento>'
            f'<detEvento versaoEvento="3.00">'
            f'<evCancMDFe>'
            f'<descEvento>Cancelamento</descEvento>'
            f'<nProt>{mdfe.protocolo_mdfe}</nProt>'
            f'<xJust>{justificativa}</xJust>'
            f'</evCancMDFe>'
            f'</detEvento>'
            f'</infEvento>'
            f'</eventoMDFe>'
        )
        
        xml_assinado = self._assinar_evento(xml_evento)
        
        retorno = self._enviar_evento_sefaz(xml_assinado)
        
        if retorno.get('autorizado'):
            mdfe.status_mdfe = 'CANCELADO'
            mdfe.xmotivo = f'Cancelado: {justificativa}'
            mdfe.save()
            return {'success': True, 'message': 'MDF-e cancelado com sucesso'}
        else:
            raise Exception(f"Erro ao cancelar MDF-e na Sefaz: {retorno.get('cstat')} - {retorno.get('xmotivo')}")
    
    def consultar_status_mdfe(self, mdfe):
        """
        Consulta status do MDF-e na SEFAZ
        """
        return {
            'chave': mdfe.chave_mdfe,
            'status': mdfe.status_mdfe,
            'protocolo': mdfe.protocolo_mdfe,
            'cstat': mdfe.cstat,
            'xmotivo': mdfe.xmotivo
        }
    
    def gerar_damdfe(self, mdfe):
        """
        Gera DAMDFE (Documento Auxiliar do MDF-e) em PDF no formato oficial
        """
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
        from reportlab.lib import colors
        from reportlab.lib.utils import ImageReader
        import qrcode
        import barcode
        from barcode.writer import ImageWriter
        
        # Buscar documentos vinculados e configuração da empresa
        from mdfe.models import MDFeDocumentoVinculado, MDFePercurso, MDFeCarregamento, MDFeDescarregamento
        from api.models import EmpresaConfig, Veiculo
        
        # Buscar configuração da empresa
        empresa = EmpresaConfig.get_ativa()
        if not empresa:
            raise Exception("Configuração da empresa não encontrada. Acesse Configurações > Empresa.")
        
        # Buscar veículo para dados complementares
        veiculo = None
        if mdfe.placa_veiculo:
            veiculo = Veiculo.objects.filter(placa=mdfe.placa_veiculo).first()
        
        # Contar documentos vinculados dinamicamente
        docs_nfe = MDFeDocumentoVinculado.objects.filter(mdfe=mdfe, tipo_documento='NFE').count()
        docs_cte = MDFeDocumentoVinculado.objects.filter(mdfe=mdfe, tipo_documento='CTE').count()
        
        # Buscar municípios de carregamento e descarregamento
        carregamentos = MDFeCarregamento.objects.filter(mdfe=mdfe)
        descarregamentos = MDFeDescarregamento.objects.filter(mdfe=mdfe)
        
        # Obter nomes dos municípios
        municipio_carregamento = ''
        municipio_descarregamento = ''
        if carregamentos.exists():
            mun_carreg = carregamentos.first()
            municipio_carregamento = f"{mun_carreg.municipio_nome}/{mun_carreg.uf}" if mun_carreg.municipio_nome else mdfe.uf_inicio or ''
        else:
            municipio_carregamento = mdfe.uf_inicio or ''
        
        if descarregamentos.exists():
            mun_descarreg = descarregamentos.first()
            municipio_descarregamento = f"{mun_descarreg.municipio_nome}/{mun_descarreg.uf}" if mun_descarreg.municipio_nome else mdfe.uf_fim or ''
        else:
            municipio_descarregamento = mdfe.uf_fim or ''
        
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # Configurações
        margin = 10 * mm
        y = height - margin
        
        # Função auxiliar para desenhar caixas
        def draw_box(x, y, w, h, label, value, font_size=8):
            c.setLineWidth(0.5)
            c.rect(x, y - h, w, h)
            # Label
            c.setFont("Helvetica-Bold", 6)
            c.drawString(x + 2, y - 8, label)
            # Value
            c.setFont("Helvetica", font_size)
            text_y = y - h + 5 if font_size < 8 else y - h + 8
            c.drawString(x + 2, text_y, str(value) if value else '')
            return y - h
        
        # Função para desenhar linha
        def draw_line(y_pos):
            c.setLineWidth(0.5)
            c.line(margin, y_pos, width - margin, y_pos)
            return y_pos
        
        # ============= CABEÇALHO =============
        # Logo empresa (se existir)
        has_logo = False
        if empresa.logo_url:
            try:
                from PIL import Image
                import os
                logo_path = empresa.logo_url
                
                # Se não encontrar o arquivo direto, tenta resolver caminhos relativos conhecidos do projeto
                if not os.path.exists(logo_path):
                    filename = os.path.basename(logo_path)
                    possible_paths = [
                        # Caminho na pasta media do backend
                        os.path.join(os.getcwd(), 'media', filename),
                        os.path.join(os.getcwd(), 'media', 'logos', filename),
                        # Caminho Frontend (dentro do Backend)
                        os.path.join(os.getcwd(), 'frontend', 'public', 'logos'),
                        # Caminho Relativo Genérico
                        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/logos")),
                    ]
                    
                    for p in possible_paths:
                        if os.path.isdir(p):
                            full_p = os.path.join(p, filename)
                        else:
                            full_p = p
                        if os.path.exists(full_p):
                            logo_path = full_p
                            logger.info(f"Logo DAMDFE encontrado em: {logo_path}")
                            break
                
                if os.path.exists(logo_path):
                    c.drawImage(logo_path, margin, y - 60, width=50, height=50, preserveAspectRatio=True, mask='auto')
                    has_logo = True
                else:
                    logger.warning(f"Logo não encontrado: {empresa.logo_url}")
            except Exception as e:
                logger.warning(f"Erro ao carregar logo DAMDFE: {e}")
        
        # Informações da empresa (do banco de dados)
        empresa_nome = empresa.nome_razao_social or 'EMPRESA TRANSPORTADORA LTDA'
        empresa_cnpj = empresa.cpf_cnpj or '00.000.000/0000-00'
        empresa_ie = empresa.inscricao_estadual or ''
        
        # Montar endereço completo
        endereco_partes = []
        if empresa.endereco:
            endereco_partes.append(empresa.endereco)
        if empresa.numero:
            endereco_partes.append(f"Nº {empresa.numero}")
        if empresa.bairro:
            endereco_partes.append(empresa.bairro)
        empresa_endereco = ', '.join(endereco_partes) if endereco_partes else 'Endereço não cadastrado'
        
        empresa_cidade = empresa.cidade or ''
        empresa_uf = empresa.estado or ''
        empresa_telefone = empresa.telefone or ''
        
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin + 55, y - 15, empresa_nome)
        c.setFont("Helvetica", 7)
        c.drawString(margin + 55, y - 25, f"CNPJ: {empresa_cnpj}")
        c.drawString(margin + 55, y - 33, empresa_endereco)
        c.drawString(margin + 55, y - 41, f"{empresa_cidade} - {empresa_uf}")
        c.drawString(margin + 55, y - 49, f"FONE/FAX: {empresa_telefone}")
        if empresa_ie:
            c.drawString(margin + 55, y - 57, f"INSCRIÇÃO ESTADUAL: {empresa_ie}")
        
        # QR Code no canto superior direito
        if mdfe.qrcode_url:
            qr = qrcode.QRCode(version=1, box_size=3, border=1)
            qr.add_data(mdfe.qrcode_url)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white")
            qr_buffer = BytesIO()
            qr_img.save(qr_buffer, format='PNG')
            qr_buffer.seek(0)
            c.drawImage(ImageReader(qr_buffer), width - margin - 50, y - 50, width=50, height=50)
        
        y -= 65
        
        # ============= TÍTULO DAMDFE =============
        c.setFont("Helvetica-Bold", 11)
        c.drawString(margin, y, "Documento Auxiliar do Manifesto de Documentos Fiscais Eletrônicos")
        y -= 15
        
        # ============= INFORMAÇÕES DO MDFE (TABELA SUPERIOR) =============
        # Calcular larguras das colunas
        col1_width = 60  # MODELO
        col2_width = 60  # SÉRIE
        col3_width = 100 # NÚMERO
        col4_width = (width - 2 * margin) - col1_width - col2_width - col3_width  # FL
        
        # Altura padrão das células
        cell_height = 20
        
        # LINHA 1: MODELO | SÉRIE | NÚMERO | FL
        x_pos = margin
        c.setLineWidth(0.5)
        
        # MODELO
        c.rect(x_pos, y - cell_height, col1_width, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "MODELO")
        c.setFont("Helvetica", 9)
        c.drawString(x_pos + 2, y - 16, mdfe.modelo or "58")
        x_pos += col1_width
        
        # SÉRIE
        c.rect(x_pos, y - cell_height, col2_width, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "SÉRIE")
        c.setFont("Helvetica", 9)
        c.drawString(x_pos + 2, y - 16, str(mdfe.serie_mdfe or "1"))
        x_pos += col2_width
        
        # NÚMERO
        c.rect(x_pos, y - cell_height, col3_width, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "NÚMERO")
        c.setFont("Helvetica", 9)
        c.drawString(x_pos + 2, y - 16, str(mdfe.numero_mdfe or ""))
        x_pos += col3_width
        
        # FL
        c.rect(x_pos, y - cell_height, col4_width, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "FL")
        c.setFont("Helvetica", 9)
        c.drawString(x_pos + 2, y - 16, "1/1")
        
        y -= cell_height
        
        # LINHA 2: DATA/HORA EMISSÃO | MUN. CARREG. | MUN. DESCARREG.
        x_pos = margin
        col_data_width = (width - 2 * margin) / 2
        col_mun_width = (width - 2 * margin) / 4
        
        # DATA E HORA DE EMISSÃO
        c.rect(x_pos, y - cell_height, col_data_width, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "DATA/HORA DE EMISSÃO")
        c.setFont("Helvetica", 8)
        data_emissao = mdfe.data_emissao.strftime('%d/%m/%Y %H:%M:%S') if mdfe.data_emissao else ''
        c.drawString(x_pos + 2, y - 16, data_emissao)
        x_pos += col_data_width
        
        # MUN. CARREG.
        c.rect(x_pos, y - cell_height, col_mun_width, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "MUN. CARREG.")
        c.setFont("Helvetica", 7)
        # Truncar se muito longo
        mun_carreg_display = municipio_carregamento[:18] if len(municipio_carregamento) > 18 else municipio_carregamento
        c.drawString(x_pos + 2, y - 16, mun_carreg_display)
        x_pos += col_mun_width
        
        # MUN. DESCARREG.
        c.rect(x_pos, y - cell_height, col_mun_width, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "MUN. DESCARREG.")
        c.setFont("Helvetica", 7)
        # Truncar se muito longo
        mun_descarreg_display = municipio_descarregamento[:18] if len(municipio_descarregamento) > 18 else municipio_descarregamento
        c.drawString(x_pos + 2, y - 16, mun_descarreg_display)
        
        y -= cell_height
        
        # LINHA 3: FORMA DE EMISSÃO | TIPO DO EMITENTE | MODAL
        x_pos = margin
        col_forma_width = (width - 2 * margin) / 4
        col_tipo_width = (width - 2 * margin) / 2
        col_modal_width = (width - 2 * margin) / 4
        
        # FORMA DE EMISSÃO
        c.rect(x_pos, y - cell_height, col_forma_width, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "FORMA DE EMISSÃO")
        c.setFont("Helvetica", 8)
        forma_emissao_map = {1: "Normal", 2: "Contingência"}
        c.drawString(x_pos + 2, y - 16, forma_emissao_map.get(mdfe.tipo_emissao, "Normal"))
        x_pos += col_forma_width
        
        # TIPO DO EMITENTE
        c.rect(x_pos, y - cell_height, col_tipo_width, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "TIPO DO EMITENTE")
        c.setFont("Helvetica", 8)
        tipo_emitente_map = {1: "Prestador de Serviço", 2: "Transp. Carga Própria", 3: "CT-e Globalizado"}
        tipo_texto = tipo_emitente_map.get(mdfe.tipo_emitente, "")
        c.drawString(x_pos + 2, y - 16, tipo_texto)
        x_pos += col_tipo_width
        
        # MODAL
        c.rect(x_pos, y - cell_height, col_modal_width, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "MODAL")
        c.setFont("Helvetica", 8)
        modal_map = {"01": "Rodoviário", "02": "Aéreo", "03": "Aquaviário", "04": "Ferroviário"}
        c.drawString(x_pos + 2, y - 16, modal_map.get(mdfe.modal, mdfe.modal or ""))
        
        y -= cell_height + 5
        
        # ============= PROTOCOLO E CHAVE =============
        if mdfe.protocolo_mdfe:
            c.setFont("Helvetica-Bold", 7)
            c.drawString(margin, y, f"PROTOCOLO DE AUTORIZAÇÃO: {mdfe.protocolo_mdfe}")
            y -= 10
            c.drawString(margin, y, f"Data de Autorização: {mdfe.data_emissao.strftime('%d/%m/%Y %H:%M:%S') if mdfe.data_emissao else ''}")
            y -= 15
        
        # Chave de acesso em destaque
        if mdfe.chave_mdfe:
            c.setFont("Helvetica-Bold", 8)
            c.drawString(margin, y, "CHAVE DE ACESSO:")
            y -= 12
            c.setFont("Helvetica", 10)
            # Formatar chave com espaços: 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000
            chave_formatada = ' '.join([mdfe.chave_mdfe[i:i+4] for i in range(0, len(mdfe.chave_mdfe), 4)])
            c.drawString(margin + 10, y, chave_formatada)
            y -= 15
            
            # Código de barras
            try:
                barcode_class = barcode.get_barcode_class('code128')
                barcode_img = barcode_class(mdfe.chave_mdfe, writer=ImageWriter())
                barcode_buffer = BytesIO()
                barcode_img.write(barcode_buffer, options={'write_text': False, 'module_height': 8})
                barcode_buffer.seek(0)
                c.drawImage(ImageReader(barcode_buffer), margin + 50, y - 30, width=400, height=25)
                y -= 40
            except Exception as e:
                logger.warning(f"Erro ao gerar código de barras: {e}")
                y -= 15
        
        y -= 10
        
        # ============= MODAL RODOVIÁRIO DE CARGA =============
        c.setFont("Helvetica-Bold", 9)
        c.drawString(margin, y, "MODAL RODOVIÁRIO DE CARGA")
        y -= 12
        
        # ============= VEÍCULOS =============
        c.setFont("Helvetica-Bold", 8)
        c.drawString(margin, y, "VEÍCULOS")
        y -= 10
        
        x_start = margin
        # Reduzido para 4 colunas (removida RENAVAM que não existe)
        box_width_small = (width - 2 * margin) / 4
        
        # Cabeçalho da tabela de veículos
        c.setLineWidth(0.5)
        c.rect(x_start, y - 15, width - 2 * margin, 15)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(x_start + 2, y - 10, "PLACA")
        c.drawString(x_start + box_width_small + 2, y - 10, "UF")
        c.drawString(x_start + box_width_small * 2 + 2, y - 10, "RNTRC")
        c.drawString(x_start + box_width_small * 3 + 2, y - 10, "TARA (KG)")
        
        # Linhas verticais
        for i in range(1, 4):
            c.line(x_start + box_width_small * i, y - 15, x_start + box_width_small * i, y)
        
        y -= 15
        
        # Dados do veículo (buscar RNTRC do cadastro de veículo se disponível)
        rntrc_display = mdfe.rntrc_veiculo
        if not rntrc_display and veiculo and veiculo.rntrc:
            rntrc_display = veiculo.rntrc
        
        c.rect(x_start, y - 15, width - 2 * margin, 15)
        c.setFont("Helvetica", 7)
        c.drawString(x_start + 2, y - 10, mdfe.placa_veiculo or "")
        c.drawString(x_start + box_width_small + 2, y - 10, mdfe.uf_veiculo or "")
        c.drawString(x_start + box_width_small * 2 + 2, y - 10, rntrc_display or "")
        c.drawString(x_start + box_width_small * 3 + 2, y - 10, str(mdfe.veiculo_tara_kg) if mdfe.veiculo_tara_kg else "")
        
        for i in range(1, 4):
            c.line(x_start + box_width_small * i, y - 15, x_start + box_width_small * i, y)
        
        y -= 25
        
        # ============= INFORMAÇÕES DA CARGA =============
        c.setFont("Helvetica-Bold", 8)
        c.drawString(margin, y, "INFORMAÇÕES DA CARGA")
        y -= 10
        
        # Calcular larguras das colunas
        col_qtd_width = (width - 2 * margin) / 3
        col_valor_width = (width - 2 * margin) / 3
        col_peso_width = (width - 2 * margin) / 3
        
        x_pos = margin
        
        # QTD / NFe/CTe
        c.rect(x_pos, y - cell_height, col_qtd_width, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "QTD/ NFe/CTe:")
        c.setFont("Helvetica", 8)
        # Usar contagem dinâmica de documentos
        qtd_texto = f"{docs_nfe} / {docs_cte}"
        c.drawString(x_pos + 2, y - 16, qtd_texto)
        x_pos += col_qtd_width
        
        # VALOR TOTAL
        c.rect(x_pos, y - cell_height, col_valor_width, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "VALOR TOTAL")
        c.setFont("Helvetica", 8)
        valor_formatado = f"R$ {mdfe.valor_total_carga:,.2f}" if mdfe.valor_total_carga else "R$ 0,00"
        c.drawString(x_pos + 2, y - 16, valor_formatado)
        x_pos += col_valor_width
        
        # PESO TOTAL (KG)
        c.rect(x_pos, y - cell_height, col_peso_width, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "PESO TOTAL (KG)")
        c.setFont("Helvetica", 8)
        peso_formatado = f"{mdfe.peso_total_kg:,.4f}" if mdfe.peso_total_kg else "0,0000"
        c.drawString(x_pos + 2, y - 16, peso_formatado)
        
        y -= cell_height
        
        # PRODUTO PREDOMINANTE (linha separada, ocupando toda a largura)
        x_pos = margin
        c.rect(x_pos, y - cell_height, width - 2 * margin, cell_height)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(x_pos + 2, y - 8, "PRODUTO PREDOMINANTE")
        c.setFont("Helvetica", 8)
        c.drawString(x_pos + 2, y - 16, mdfe.produto_predominante or "Diversos")
        
        y -= cell_height + 15
        
        # ============= CONDUTORES =============
        c.setFont("Helvetica-Bold", 8)
        c.drawString(margin, y, "CONDUTORES")
        y -= 10
        
        x_start = margin
        box_width = (width - 2 * margin) / 2
        
        c.rect(x_start, y - 15, width - 2 * margin, 15)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(x_start + 2, y - 10, "NOME")
        c.drawString(x_start + box_width + 2, y - 10, "CPF")
        c.line(x_start + box_width, y - 15, x_start + box_width, y)
        
        y -= 15
        
        c.rect(x_start, y - 15, width - 2 * margin, 15)
        c.setFont("Helvetica", 7)
        c.drawString(x_start + 2, y - 10, mdfe.condutor_nome or "")
        c.drawString(x_start + box_width + 2, y - 10, mdfe.condutor_cpf or "")
        c.line(x_start + box_width, y - 15, x_start + box_width, y)
        
        y -= 25
        
        # ============= PERCURSO =============
        c.setFont("Helvetica-Bold", 8)
        c.drawString(margin, y, "PERCURSO")
        y -= 10
        
        percursos = MDFePercurso.objects.filter(mdfe=mdfe).order_by('ordem')
        if percursos.exists():
            percurso_text = " → ".join([p.uf for p in percursos if p.uf])
        else:
            percurso_text = f"{mdfe.uf_inicio or ''} → {mdfe.uf_fim or ''}"
        
        c.setFont("Helvetica", 8)
        c.drawString(margin + 5, y, percurso_text)
        y -= 15
        
        # ============= DOCUMENTOS VINCULADOS =============
        c.setFont("Helvetica-Bold", 8)
        c.drawString(margin, y, "INFORMAÇÕES DA COMPOSIÇÃO DA CARGA")
        y -= 10
        
        # Cabeçalho da tabela
        c.setLineWidth(0.5)
        c.rect(margin, y - 15, width - 2 * margin, 15)
        c.setFont("Helvetica-Bold", 6)
        col_widths = [50, 100, 250]
        cols = ["TIPO", "MUNICÍPIO CARREG.", "CHAVE DE ACESSO"]
        x_pos = margin + 2
        for i, col in enumerate(cols):
            c.drawString(x_pos, y - 10, col)
            if i < len(cols) - 1:
                x_pos_line = margin + sum(col_widths[:i+1])
                c.line(x_pos_line, y - 15, x_pos_line, y)
            x_pos += col_widths[i]
        
        y -= 15
        
        # Dados dos documentos
        documentos = MDFeDocumentoVinculado.objects.filter(mdfe=mdfe)[:15]  # Limitar a 15 por página
        c.setFont("Helvetica", 6)
        
        for doc in documentos:
            c.rect(margin, y - 12, width - 2 * margin, 12)
            
            # Tipo documento
            tipo = "NF-e" if doc.tipo_documento == 'NFE' else "CT-e"
            c.drawString(margin + 2, y - 8, tipo)
            
            # Município carregamento
            municipio = doc.municipio_carregamento or ""
            c.drawString(margin + 52, y - 8, municipio[:25])
            
            # Chave de acesso (formatada com espaços)
            if doc.chave_acesso:
                chave_formatada = ' '.join([doc.chave_acesso[i:i+4] for i in range(0, min(len(doc.chave_acesso), 44), 4)])
                c.drawString(margin + 152, y - 8, chave_formatada)
            
            # Linhas verticais
            for i in range(1, len(col_widths)):
                x_pos_line = margin + sum(col_widths[:i])
                c.line(x_pos_line, y - 12, x_pos_line, y)
            
            y -= 12
        
        y -= 10
        
        # ============= INFORMAÇÕES COMPLEMENTARES =============
        c.setFont("Helvetica-Bold", 8)
        c.drawString(margin, y, "INFORMAÇÕES COMPLEMENTARES DE INTERESSE DO CONTRIBUINTE")
        y -= 10
        
        c.setLineWidth(0.5)
        c.rect(margin, y - 40, width - 2 * margin, 40)
        c.setFont("Helvetica", 7)
        
        # RNTRC - buscar do prestador, veículo ou cadastro de veículos
        rntrc_info = mdfe.rntrc_prestador
        if not rntrc_info and mdfe.rntrc_veiculo:
            rntrc_info = mdfe.rntrc_veiculo
        if not rntrc_info and veiculo and veiculo.rntrc:
            rntrc_info = veiculo.rntrc
        
        if rntrc_info:
            info_text = f"RNTRC: {rntrc_info}"
            c.drawString(margin + 5, y - 15, info_text)
        
        y_info = y - 15 if not rntrc_info else y - 25
        if mdfe.nome_seguradora:
            c.drawString(margin + 5, y_info, f"Seguradora: {mdfe.nome_seguradora}")
            y_info -= 10
        if mdfe.numero_apolice:
            c.drawString(margin + 5, y_info, f"Apólice: {mdfe.numero_apolice}")
        
        y -= 45
        
        # ============= MARCA D'ÁGUA HOMOLOGAÇÃO =============
        if self.ambiente == 2:  # Homologação
            c.saveState()
            c.setFont("Helvetica-Bold", 60)
            c.setFillColor(colors.Color(0.9, 0.9, 0.9, alpha=0.3))
            c.translate(width / 2, height / 2)
            c.rotate(45)
            c.drawCentredString(0, 0, "SEM VALOR FISCAL")
            c.restoreState()
        
        # Finalizar
        c.showPage()
        c.save()
        buffer.seek(0)
        return buffer
