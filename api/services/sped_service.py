import logging
import datetime
from decimal import Decimal
from django.db.models import Sum, Q
from django.utils import timezone
from api.models import EmpresaConfig, Venda, VendaItem, Cliente, Produto, TributacaoProduto, Operacao

logger = logging.getLogger(__name__)

class SpedEFDGenerator:
    def __init__(self, data_inicio, data_fim, operacoes_ids=None, versao='020', blocos_gerar=None):
        """
        :param data_inicio: datetime or date object
        :param data_fim: datetime or date object
        :param operacoes_ids: list of int (id_operacao) to filter
        :param versao: string - Versão do layout SPED (ex: '020', '019')
        :param blocos_gerar: list of str - Blocos a gerar (ex: ['C', 'D', 'E', 'G', 'H', 'K'])
        """
        self.data_inicio = data_inicio
        self.data_fim = data_fim
        self.operacoes_ids = operacoes_ids
        self.versao = versao
        self.blocos_gerar = blocos_gerar if blocos_gerar else ['C', 'E']
        
        # Cache for block 9 counts
        self.block_counts = {}
        self.lines = []
        self.total_vl_icms = Decimal(0)  # Acumulador para o bloco E110
        
        # Load Company Data
        self.empresa = EmpresaConfig.get_ativa()
        
        # Load Sales
        # Converte data_inicio e data_fim para datetime se necessário
        if isinstance(self.data_inicio, datetime.date) and not isinstance(self.data_inicio, datetime.datetime):
            dt_ini_datetime = timezone.make_aware(datetime.datetime.combine(self.data_inicio, datetime.datetime.min.time()))
        else:
            dt_ini_datetime = self.data_inicio
            
        if isinstance(self.data_fim, datetime.date) and not isinstance(self.data_fim, datetime.datetime):
            dt_fim_datetime = timezone.make_aware(datetime.datetime.combine(self.data_fim, datetime.datetime.max.time()))
        else:
            dt_fim_datetime = self.data_fim
        
        # Primeiro, vê todas as vendas do período SEM filtro de operação
        query_periodo = Q(data_documento__gte=dt_ini_datetime) & \
                        Q(data_documento__lte=dt_fim_datetime)
        
        # Incluir apenas vendas EMITIDAS (que geraram nota fiscal)
        # Aceita: EMITIDA, CANCELADA (também vão pro SPED com indicador 02)
        # Exclui: ERRO, PENDENTE, None/vazio
        query_periodo &= Q(status_nfe__in=['EMITIDA', 'CANCELADA', 'AUTORIZADA'])
        
        vendas_periodo = Venda.objects.filter(query_periodo)
        total_periodo = vendas_periodo.count()
        
        if total_periodo > 0:
            ops_no_periodo = vendas_periodo.values_list('id_operacao', flat=True).distinct()
            logger.info(f"SPED DEBUG: {total_periodo} vendas EMITIDAS/CANCELADAS/AUTORIZADAS no período {self.data_inicio} a {self.data_fim}")
            logger.info(f"SPED DEBUG: Operações nas vendas do período: {list(ops_no_periodo)}")
        else:
            logger.warning(f"SPED ALERTA: Nenhuma venda EMITIDA/CANCELADA/AUTORIZADA no período {self.data_inicio} a {self.data_fim}")
            # Verifica se há vendas com outros status
            vendas_outros = Venda.objects.filter(
                data_documento__gte=dt_ini_datetime,
                data_documento__lte=dt_fim_datetime
            )
            if vendas_outros.count() > 0:
                status_counts = {}
                for v in vendas_outros:
                    st = v.status_nfe or 'NULL'
                    status_counts[st] = status_counts.get(st, 0) + 1
                logger.warning(f"SPED ALERTA: Existem {vendas_outros.count()} vendas no período com outros status: {status_counts}")
        
        # Agora aplica o filtro de operações
        query = query_periodo
        if self.operacoes_ids:
            query &= Q(id_operacao__in=self.operacoes_ids)
            logger.info(f"Filtrando SPED por operações dos conjuntos: {self.operacoes_ids}")
            
        # Busca as vendas finais
        self.vendas = Venda.objects.filter(query).order_by('data_documento', 'numero_nfe')
        
        logger.info(f"SPED RESULTADO: {self.vendas.count()} vendas após filtro de operações")
        
        if self.vendas.count() == 0 and total_periodo > 0:
            logger.warning(f"SPED PROBLEMA: Existem {total_periodo} vendas EMITIDAS no período, mas NENHUMA com as operações {self.operacoes_ids}")
        
        # Buscar CTes (Conhecimentos de Transporte Eletrônico) para Bloco D
        try:
            from cte.models import ConhecimentoTransporte
            self.ctes = ConhecimentoTransporte.objects.filter(
                data_emissao__gte=dt_ini_datetime,
                data_emissao__lte=dt_fim_datetime,
                status_cte__in=['EMITIDO', 'ENVIADO', 'AUTORIZADO', 'CANCELADO']
            ).order_by('data_emissao', 'numero_cte')
            logger.info(f"SPED RESULTADO: {self.ctes.count()} CTes encontrados no período")
        except ImportError:
            logger.warning("Modelo ConhecimentoTransporte não disponível")
            self.ctes = []
        except Exception as e:
            logger.error(f"Erro ao buscar CTes: {str(e)}")
            self.ctes = []
        
        
    def format_date(self, dt):
        if not dt: return ""
        if isinstance(dt, datetime.datetime):
            dt = dt.date()
        return dt.strftime("%d%m%Y")
        
    def format_decimal(self, value, places=2):
        if value is None: value = Decimal('0.00')
        return f"{value:.{places}f}".replace('.', ',')
        
    def format_str(self, value, length=None):
        if value is None: return ""
        s = str(value).strip()
        s = s.replace("|", "")  # Remove pipe to avoid breaking CSV
        s = s.replace("\n", " ").replace("\r", " ")  # Remove quebras de linha
        s = s.replace("\t", " ")  # Remove tabs
        if length:
            return s[:length]
        return s

    def add_line(self, reg, *args):
        line_data = [reg] + list(args) + [''] # Ends with |
        line = "|".join([self.format_str(x) if not isinstance(x, (float, Decimal)) else self.format_decimal(x) for x in line_data])
        # SPED exige pipe no início da linha
        line = "|" + line
        self.lines.append(line)
        
        # Count registers
        self.block_counts[reg] = self.block_counts.get(reg, 0) + 1
        
        # Count Block Totalizers (e.g. C990 counting C records)
        block_char = reg[0]
        # Logic for closing blocks will be handled at the end
        
    def generate(self):
        try:
            self.generate_block_0()
            
            # Block B é obrigatório (mesmo sem movimento)
            self.generate_block_b()
            
            # Gera blocos selecionados ou sem movimento (todos obrigatórios)
            if 'C' in self.blocos_gerar:
                self.generate_block_c()
            else:
                self.generate_block_c_empty()
            
            # Bloco D sempre obrigatório
            if 'D' in self.blocos_gerar:
                self.generate_block_d()
            else:
                self.generate_block_d_empty()
            
            # Bloco E sempre obrigatório
            if 'E' in self.blocos_gerar:
                self.generate_block_e()
            else:
                self.generate_block_e_empty()
            
            # Blocos G, H, K sempre obrigatórios (sempre sem movimento)
            self.generate_block_g()
            self.generate_block_h()
            self.generate_block_k()
            
            # Bloco 1 (Outras Informações - obrigatório)
            self.generate_block_1()
            
            self.generate_block_9()
            # SPED exige \r\n no final da última linha também
            return "\r\n".join(self.lines) + "\r\n"
        except Exception as e:
            logger.error(f"Erro gerando SPED: {e}")
            raise

    def generate_block_0(self):
        """Abertura, Identificação e Referências"""
        # 0000: Abertura do Arquivo Digital e Identificação da Entidade
        ver = self.versao  # Versão do leiaute (ex: 020, 019, 018)
        fin = "0" # 0=Original, 1=Retificadora
        
        nome = self.empresa.nome_razao_social if self.empresa else "EMPRESA NAO CONFIGURADA"
        # Remove CNPJ/CPF formatado do início do nome (ex: "48.010.363 BRUNO..." -> "BRUNO...")
        import re
        nome = re.sub(r'^[\d\.\-/\s]+', '', nome).strip()
        
        cnpj = self.empresa.cpf_cnpj if self.empresa else ""
        # Remove formatação do CNPJ (pontos, traços, barras)
        cnpj = re.sub(r'[^\d]', '', cnpj)
        
        uf = self.empresa.estado if self.empresa else ""
        ie = self.empresa.inscricao_estadual if self.empresa else ""
        cod_mun = ""  # Código IBGE do município - deixar vazio se não tiver
        if hasattr(self.empresa, 'codigo_municipio_limpo'):
            cod_mun = self.empresa.codigo_municipio_limpo
        im = self.empresa.inscricao_municipal if self.empresa else ""
        
        # Obter Perfil e Atividade configurados
        perfil = "A"
        ativ = "1"
        suframa = ""
        if self.empresa:
            if hasattr(self.empresa, 'ind_perfil') and self.empresa.ind_perfil:
                perfil = self.empresa.ind_perfil
            if hasattr(self.empresa, 'ind_atividade') and self.empresa.ind_atividade:
                ativ = self.empresa.ind_atividade
            if hasattr(self.empresa, 'suframa') and self.empresa.suframa:
                suframa = re.sub(r'[^\d]', '', self.empresa.suframa)  # Remove formatação

        # 0000|COD_VER|COD_FIN|DT_INI|DT_FIN|NOME|CNPJ|CPF|UF|IE|COD_MUN|IM|SUFRAMA|IND_PERFIL|IND_ATIV|
        self.add_line("0000", ver, fin, self.format_date(self.data_inicio), self.format_date(self.data_fim),
                      nome, cnpj, "", uf, ie, cod_mun, im, suframa, perfil, ativ)
        
        self.add_line("0001", "0") # Abertura do Bloco 0 (0-Com dados)
        
        # 0005: Dados Complementares da entidade
        # Campos: REG, FANTASIA, CEP, END, NUM, COMPL, BAIRRO, FONE, FAX, EMAIL
        
        fantasia = self.empresa.nome_fantasia or self.empresa.nome_razao_social
        endereco = self.empresa.classificacao.endereco if hasattr(self.empresa, 'classificacao') else "Rua"
        # Ajuste para campos corretos da empresa
        endereco = self.empresa.endereco or "Rua"
        numero = self.empresa.numero or "S/N"
        complemento = "" 
        bairro = self.empresa.bairro or "Bairro"
        cep = re.sub(r'[^\d]', '', self.empresa.cep or "00000000")
        
        telefone = re.sub(r'[^\d]', '', getattr(self.empresa, 'telefone_1', '') or getattr(self.empresa, 'telefone', '') or "")
        fax = ""
        email = self.empresa.email or "email@email.com"

        self.add_line("0005", fantasia, cep, endereco, numero, complemento, bairro, telefone, fax, email)

        # 0100: Dados do Contabilista
        if self.empresa.contador_nome and self.empresa.contador_cpf:
            cpf_cont = re.sub(r'[^\d]', '', self.empresa.contador_cpf or "")
            cnpj_cont = re.sub(r'[^\d]', '', self.empresa.contador_cnpj or "")
            cep_cont = re.sub(r'[^\d]', '', self.empresa.contador_cep or "")
            fone_cont = re.sub(r'[^\d]', '', self.empresa.contador_fone or "")
            fax_cont = re.sub(r'[^\d]', '', self.empresa.contador_fax or "")
            
            # 0100|NOME|CPF|CRC|CNPJ|CEP|END|NUM|COMPL|BAIRRO|FONE|FAX|EMAIL|COD_MUN|
            self.add_line("0100", 
                          self.format_str(self.empresa.contador_nome, 60),
                          cpf_cont,
                          self.format_str(self.empresa.contador_crc, 15),
                          cnpj_cont,
                          cep_cont,
                          self.format_str(self.empresa.contador_endereco, 60),
                          self.format_str(self.empresa.contador_numero, 10),
                          self.format_str(self.empresa.contador_complemento, 60),
                          self.format_str(self.empresa.contador_bairro, 60),
                          fone_cont,
                          fax_cont,
                          self.format_str(self.empresa.contador_email, 60),
                          self.format_str(self.empresa.contador_cod_mun, 7)
                         )

        # Participantes référenciados
        participantes = set()
        
        # Iterar sobre as vendas para coletar participantes USADOS
        for v in self.vendas:
            # Para NFC-e (65), não usar participante no C100, logo não deve aparecer no 0150 se só tiver NFC-e
            modelo = "55"
            op = v.id_operacao
            if op and op.modelo_documento:
                modelo = op.modelo_documento
            elif v.chave_nfe and len(v.chave_nfe) == 44:
                modelo = v.chave_nfe[20:22]
            
            # Se for NFC-e (65), participante não vai no C100
            if modelo == "65":
                continue

            if v.id_cliente:
                participantes.add(v.id_cliente.id_cliente)
        
        # Coletar participantes dos CTes (remetente, destinatário, tomador)
        for cte in self.ctes:
            if cte.remetente:
                participantes.add(cte.remetente.id_cliente)
            if cte.destinatario:
                participantes.add(cte.destinatario.id_cliente)
            if cte.tomador_outros:
                participantes.add(cte.tomador_outros.id_cliente)
            if cte.expedidor:
                participantes.add(cte.expedidor.id_cliente)
            if cte.recebedor:
                participantes.add(cte.recebedor.id_cliente)
                
        # Iterar clientes unicos
        for cid in participantes:
            if not cid: continue
            cli = Cliente.objects.filter(id_cliente=cid).first()
            if not cli: continue
            
            # 0150|COD_PART|NOME|COD_PAIS|CNPJ|CPF|IE|COD_MUN|SUFRAMA|END|NUM|COMP|BAIRRO|
            
            # Limpa nome do cliente (remove CPF/CNPJ do início)
            nome_cli = re.sub(r'^[\d\.\-/\s]+', '', cli.nome_razao_social).strip()
            
            # Remove formatação do CPF/CNPJ
            cpf_cnpj = re.sub(r'[^\d]', '', cli.cpf_cnpj or '')
            
            # Código do município do cliente (deixar vazio se não tiver)
            cod_mun_cli = ""
            if hasattr(cli, 'codigo_municipio_limpo'):
                cod_mun_cli = cli.codigo_municipio_limpo
            
            self.add_line("0150", 
                          f"C{cli.id_cliente}", 
                          nome_cli, 
                          "1058",  # Brasil
                          cpf_cnpj if len(cpf_cnpj) == 14 else "",  # CNPJ
                          cpf_cnpj if len(cpf_cnpj) == 11 else "",  # CPF
                          cli.inscricao_estadual or "",
                          cod_mun_cli,  # Código IBGE do município
                          "", 
                          cli.endereco or "", 
                          cli.numero or "", 
                          "", 
                          cli.bairro or "")

        # 0190: Unidades de Medida (gerar apenas uma vez por unidade)
        # 0200: Tabela de Identificação do Item (Produto)
        # Apenas para produtos que aparecem em registros que referenciam itens (C170, C800, D100, etc.)
        # Para NF-e/NFC-e (55/65) que só têm C190, NÃO gerar 0190/0200
        
        # Filtrar apenas vendas com modelos que exigem C170
        vendas_com_c170 = []
        for v in self.vendas:
            modelo = "55"
            if v.id_operacao and v.id_operacao.modelo_documento:
                modelo = v.id_operacao.modelo_documento
            elif v.chave_nfe and len(v.chave_nfe) == 44:
                modelo = v.chave_nfe[20:22]
            
            if modelo not in ['55', '65']:  # Apenas modelos que geram C170
                vendas_com_c170.append(v.id_venda)
        
        # Se há vendas com C170, gerar 0190/0200
        if vendas_com_c170:
            produtos_ids = VendaItem.objects.filter(id_venda__in=vendas_com_c170).values_list('id_produto', flat=True).distinct()
            
            # Coleta unidades únicas
            unidades_usadas = set()
            produtos_list = []
            for pid in produtos_ids:
                prod = Produto.objects.filter(id_produto=pid).first()
                if prod:
                    unidade = prod.unidade_medida or "UN"
                    unidades_usadas.add(unidade)
                    produtos_list.append((prod, unidade))
            
            # Gera 0190 apenas uma vez por unidade
            for unidade in unidades_usadas:
                self.add_line("0190", unidade, unidade)
            
            # Gera 0200 para cada produto
            for prod, unidade in produtos_list:
                # 0200|COD_ITEM|DESCR_ITEM|COD_BARRA|COD_ANT_ITEM|UNID_INV|TIPO_ITEM|COD_NCM|EX_IPI|COD_GEN|COD_LST|ALIQ_ICMS|CEST|
                # Tentar achar aliquota padrao
                aliq = "0"
                if hasattr(prod, 'tributacao_detalhada'):
                    aliq = prod.tributacao_detalhada.icms_aliquota
                
                self.add_line("0200", 
                              prod.codigo_produto, 
                              prod.nome_produto, 
                              "", # Barcode
                              "", # COD_ANT_ITEM
                              unidade, 
                              "00", # TIPO_ITEM: Mercadoria para revenda
                              prod.ncm or "", 
                              "", # EX_IPI
                              (prod.ncm or "")[:2], # COD_GEN: 2 primeiros dígitos do NCM
                              "", # COD_LST
                              self.format_decimal(aliq), # ALIQ_ICMS
                              "" # CEST
                             )
                             
        self.add_line("0990", self.count_reg_block("0"))

    def generate_block_b(self):
        """Escrituração e Apuração do ISS (Block B obrigatório mesmo sem movimento)"""
        self.add_line("B001", "1")  # 1 = Sem movimento
        self.add_line("B990", self.count_reg_block("B"))

    def generate_block_c(self):
        """Documentos Fiscais de Mercadorias (ICMS/IPI)"""
        self.add_line("C001", "0") # Abertura

        for venda in self.vendas:
            # C100: Nota Fiscal (Código 01), Nota Fiscal Avulsa (Código 1B), Nota Fiscal de Produtor (Código 04), NF-e (Código 55) e NFC-e (Código 65)
            # |C100|IND_OPER|IND_EMIT|COD_PART|COD_MOD|COD_SIT|SER|NUM_DOC|CHV_NFE|DT_DOC|DT_E_S|VL_DOC|IND_PGTO|VL_DESC|VL_ABAT_NT|VL_MERC|IND_FRT|VL_FRT|VL_SEG|VL_OUT_DA|VL_BC_ICMS|VL_ICMS|VL_BC_ICMS_ST|VL_ICMS_ST|VL_IPI|VL_PIS|VL_COFINS|VL_PIS_ST|VL_COFINS_ST|
            
            # Determinar Modelo
            modelo = "55" # Default NFe
            op = venda.id_operacao
            if op and op.modelo_documento:
                modelo = str(op.modelo_documento)
            elif venda.chave_nfe and len(venda.chave_nfe) == 44:
                modelo = venda.chave_nfe[20:22]
            
            # Cod Part (Cliente) - NFC-e (65) não deve ter COD_PART
            cod_part = ""
            if modelo != "65" and venda.id_cliente:
                cod_part = f"C{venda.id_cliente.id_cliente}"
            
            # Situacao
            # 00 Documento regular
            # 02 Documento cancelado
            cod_sit = "00"
            if venda.status_nfe == 'CANCELADA':
                cod_sit = "02"
                
            # Valores
            itens_venda = venda.itens.all()
            total_desconto = itens_venda.aggregate(Sum('desconto_valor'))['desconto_valor__sum'] or Decimal(0)
            
            vl_doc = venda.valor_total
            vl_desc = total_desconto
            vl_merc = venda.valor_total + total_desconto # Subtotal bruto aproximado
            
            # Calcular totais de ICMS dos itens
            vl_bc_icms_total = Decimal(0)
            vl_icms_total = Decimal(0)
            
            if cod_sit == "00":  # Somente se documento regular
                for item in itens_venda:
                    prod = item.id_produto
                    if not prod: continue
                    
                    trib = getattr(prod, 'tributacao_detalhada', None)
                    cst_icms = trib.cst_icms if trib else "000"
                    cst_icms = cst_icms[-3:] if cst_icms else "000"
                    
                    aliq_icms = trib.icms_aliquota if trib else Decimal(0)
                    vl_bc_icms = item.valor_total if cst_icms in ['000', '020', '090'] else Decimal(0)
                    vl_icms = vl_bc_icms * (aliq_icms / 100) if vl_bc_icms > 0 else Decimal(0)
                    
                    vl_bc_icms_total += vl_bc_icms
                    vl_icms_total += vl_icms
            
            # Se a venda tiver IPI/ST somado no total, precisaria descontar para achar vl_merc real. 
            # Simplificação assumindo Total = Merc - Desc
            
            # Para NFC-e (65), campos de impostos devem ser vazios
            if modelo == "65":
                self.add_line("C100", 
                              "1" if "ENTRADA" in (op.nome_operacao.upper() if op else "") else "1", 
                              "0", 
                              "", # COD_PART deve ser vazio para NFC-e
                              modelo, 
                              cod_sit, 
                              venda.serie_nfe, 
                              venda.numero_nfe, 
                              venda.chave_nfe or "", 
                              self.format_date(venda.data_documento), 
                              self.format_date(venda.data_documento), 
                              self.format_decimal(vl_doc), 
                              "0" if venda.vista else "1", 
                              self.format_decimal(vl_desc), 
                              "0,00", 
                              self.format_decimal(vl_merc), 
                              "9", # Frete 9-Sem Frete
                              "0,00", "0,00", "0,00", # Frete, Seg, Outras
                              self.format_decimal(vl_bc_icms_total), # BC ICMS
                              self.format_decimal(vl_icms_total),    # ICMS
                              "", "", # ST (Vazio para NFC-e)
                              "", "", "", # IPI, PIS, COFINS (Vazio para NFC-e)
                              "", "" # PIS ST, COFINS ST (Vazio para NFC-e)
                             )
            else:
                self.add_line("C100", 
                              "1" if "ENTRADA" in (op.nome_operacao.upper() if op else "") else "1", 
                              "0", 
                              cod_part, 
                              modelo, 
                              cod_sit, 
                              venda.serie_nfe, 
                              venda.numero_nfe, 
                              venda.chave_nfe or "", 
                              self.format_date(venda.data_documento), 
                              self.format_date(venda.data_documento), 
                              self.format_decimal(vl_doc), 
                              "0" if venda.vista else "1", 
                              self.format_decimal(vl_desc), 
                              "0,00", 
                              self.format_decimal(vl_merc), 
                              "9", # Frete 9-Sem Frete
                              "0,00", "0,00", "0,00", # Frete, Seg, Outras
                              self.format_decimal(vl_bc_icms_total), # BC ICMS (soma dos itens)
                              self.format_decimal(vl_icms_total),    # ICMS (soma dos itens)
                              "0,00", "0,00", # ST
                              "0,00", "0,00", "0,00", # IPI, PIS, COFINS
                              "0,00", "0,00" # PIS ST, COFINS ST
                             )

            if cod_sit == "00": # Se Regular, tem itens
                itens = itens_venda
                c190_agg = {}

                # Para NF-e (55) e NFC-e (65): NÃO gerar C170, apenas C190
                # Para outros modelos (01, 04, etc.): gerar C170 e C190
                gerar_c170 = modelo not in ['55', '65']

                for item in itens:
                     prod = item.id_produto
                     if not prod: continue
                     
                     # Buscar dados fiscais
                     trib = getattr(prod, 'tributacao_detalhada', None)
                     cst_icms = trib.cst_icms if trib else "000"
                     cst_icms = cst_icms[-3:] if cst_icms else "000"
                     
                     cfop = "5102" 
                     if cst_icms in ['060', '500']: cfop = "5405"
                     
                     aliq_icms = trib.icms_aliquota if trib else Decimal(0)
                     vl_bc_icms = item.valor_total if cst_icms in ['000', '020', '090'] else Decimal(0)
                     vl_icms = vl_bc_icms * (aliq_icms / 100) if vl_bc_icms > 0 else Decimal(0)
                     
                     # Somente gera C170 para modelos que não sejam NF-e/NFC-e
                     if gerar_c170:
                         self.add_line("C170", 
                                       str(item.id_item),                                # NUM_ITEM
                                       prod.codigo_produto,                              # COD_ITEM
                                       "",                                               # DESCR_COMPL
                                       self.format_decimal(item.quantidade, 3),         # QTD
                                       prod.unidade_medida or "UN",                     # UNID
                                       self.format_decimal(item.valor_total),           # VL_ITEM
                                       self.format_decimal(item.desconto_valor or 0),   # VL_DESC
                                       "0",                                              # IND_MOV
                                       cst_icms,                                         # CST_ICMS
                                       cfop,                                             # CFOP
                                       "",                                               # COD_NAT
                                       self.format_decimal(vl_bc_icms),                 # VL_BC_ICMS
                                       self.format_decimal(aliq_icms),                  # ALIQ_ICMS
                                       self.format_decimal(vl_icms),                    # VL_ICMS
                                       "0,00",                                           # VL_BC_ICMS_ST
                                       "0,00",                                           # ALIQ_ST
                                       "0,00",                                           # VL_ICMS_ST
                                       "0",                                              # IND_APUR
                                       "50",                                             # CST_IPI
                                       "",                                               # COD_ENQ
                                       "0,00",                                           # VL_BC_IPI
                                       "0,00",                                           # ALIQ_IPI
                                       "0,00",                                           # VL_IPI
                                       "01",                                             # CST_PIS
                                       "0,00",                                           # VL_BC_PIS
                                       "0,00",                                           # ALIQ_PIS_PERCENTUAL
                                       "0,00",                                           # QUANT_BC_PIS
                                       "0,00",                                           # ALIQ_PIS_REAIS
                                       "0,00",                                           # VL_PIS
                                       "01",                                             # CST_COFINS
                                       "0,00",                                           # VL_BC_COFINS
                                       "0,00",                                           # ALIQ_COFINS_PERCENTUAL
                                       "0,00",                                           # QUANT_BC_COFINS
                                       "0,00",                                           # ALIQ_COFINS_REAIS
                                       "0,00",                                           # VL_COFINS
                                       "",                                               # COD_CTA
                                       "0,00"                                            # VL_ABAT_NT
                                      )
                     
                     # Aggregate C190 (sempre gera, independente do modelo)
                     key = (cst_icms, cfop, aliq_icms)
                     if key not in c190_agg:
                         c190_agg[key] = {'vl_opr': Decimal(0), 'vl_bc': Decimal(0), 'vl_icms': Decimal(0)}
                     c190_agg[key]['vl_opr'] += item.valor_total
                     c190_agg[key]['vl_bc'] += vl_bc_icms
                     c190_agg[key]['vl_icms'] += vl_icms

                # Se não gerou nenhum C190 (venda sem itens?), garantir pelo menos um C190 zerado para não dar erro de validação
                if not c190_agg:
                     c190_agg[("000", "5102", Decimal(0))] = {'vl_opr': venda.valor_total, 'vl_bc': Decimal(0), 'vl_icms': Decimal(0)}

                # C190: Registro Analítico (12 campos: REG + 11 parâmetros) - sempre gera
                # |C190|CST_ICMS|CFOP|ALIQ_ICMS|VL_OPR|VL_BC_ICMS|VL_ICMS|VL_BC_ICMS_ST|ALIQ_ST|VL_ICMS_ST|VL_RED_BC|COD_OBS|
                for (cst, cfop, aliq), vals in c190_agg.items():
                    # Acumular total de ICMS para E110
                    self.total_vl_icms += vals['vl_icms']
                    
                    self.add_line("C190", 
                                  cst,                                   # CST_ICMS
                                  cfop,                                  # CFOP
                                  self.format_decimal(aliq),            # ALIQ_ICMS
                                  self.format_decimal(vals['vl_opr']),  # VL_OPR
                                  self.format_decimal(vals['vl_bc']),   # VL_BC_ICMS
                                  self.format_decimal(vals['vl_icms']), # VL_ICMS
                                  "0,00",                                # VL_BC_ICMS_ST
                                  "0,00",                                # ALIQ_ST
                                  "0,00",                                # VL_ICMS_ST
                                  "0,00",                                # VL_RED_BC
                                  ""                                     # COD_OBS
                                 )


        self.add_line("C990", self.count_reg_block("C"))

    def generate_block_c_empty(self):
        """Bloco C sem movimento"""
        self.add_line("C001", "1")  # 1 = Sem movimento
        self.add_line("C990", self.count_reg_block("C"))

    def generate_block_d(self):
        """Documentos Fiscais de Serviços - incluindo CTes (Conhecimento de Transporte Eletrônico)"""
        
        if not self.ctes or len(self.ctes) == 0:
            # Sem movimento
            self.add_line("D001", "1")
            self.add_line("D990", self.count_reg_block("D"))
            return
        
        # Com movimento
        self.add_line("D001", "0")
        
        for cte in self.ctes:
            # Determinar o participante (tomador do serviço)
            cod_part = ""
            tomador_id = None
            
            # Identificar o tomador conforme o campo tomador_servico
            # 0=Remetente, 1=Expedidor, 2=Recebedor, 3=Destinatário, 4=Outros
            if cte.tomador_servico == 0 and cte.remetente:
                tomador_id = cte.remetente.id_cliente
            elif cte.tomador_servico == 1 and cte.expedidor:
                tomador_id = cte.expedidor.id_cliente
            elif cte.tomador_servico == 2 and cte.recebedor:
                tomador_id = cte.recebedor.id_cliente
            elif cte.tomador_servico == 3 and cte.destinatario:
                tomador_id = cte.destinatario.id_cliente
            elif cte.tomador_servico == 4 and cte.tomador_outros:
                tomador_id = cte.tomador_outros.id_cliente
            elif cte.destinatario:  # Fallback para destinatário
                tomador_id = cte.destinatario.id_cliente
            
            if tomador_id:
                cod_part = f"C{tomador_id}"
            
            # Código da situação do documento
            cod_sit = "00"  # Regular
            if cte.status_cte == "CANCELADO":
                cod_sit = "02"
            
            # IND_OPER: 1 = Prestação de serviço (saída)
            # IND_EMIT: 0 = Emissão própria
            ind_oper = "1"
            ind_emit = "0"
            
            # Tipo do CT-e
            tp_cte = str(cte.tipo_cte or 0)
            
            # Valores
            vl_doc = self.format_decimal(cte.valor_total_servico or Decimal('0.00'))
            vl_serv = self.format_decimal(cte.valor_receber or cte.valor_total_servico or Decimal('0.00'))
            vl_bc_icms = self.format_decimal(cte.v_bc_icms or Decimal('0.00'))
            vl_icms = self.format_decimal(cte.v_icms or Decimal('0.00'))
            
            # Data de emissão
            dt_doc = self.format_date(cte.data_emissao)
            dt_ap = dt_doc  # Data de aquisição/prestação = data de emissão

            # D100: Nota Fiscal de Serviço de Transporte (Modelo 57 = CT-e)
            # Layout Guia Prático EFD ICMS IPI v3.1.6
            # 01 REG "D100"
            # 02 IND_OPER: '0'-Entrada, '1'-Saída
            # 03 IND_EMIT: '0'-Própria, '1'-Terceiros
            # 04 COD_PART
            # 05 COD_MOD: '57'
            # 06 COD_SIT: '00'-Regular, etc
            # 07 SER
            # 08 SUB
            # 09 NUM_DOC
            # 10 CHV_CTE
            # 11 DT_DOC
            # 12 DT_A_P (Data de Aquisição/Prestação)
            # 13 TP_CT-e
            # 14 CHV_CTE_REF
            # 15 VL_DOC
            # 16 VL_DESC
            # 17 IND_FRT (Indicador do tipo do frete: 0=Conta/Remetente, 1=Conta/Destinatário, 2=Conta/Terceiros, 9=Sem cobrança)
            # 18 VL_SERV (Valor tributado dos serviços)
            # 19 VL_BC_ICMS
            # 20 VL_ICMS
            # 21 VL_NT (Valor Não Tributado)
            # 22 COD_INF (Informação complementar)
            # 23 COD_CTA (Conta Contábil)
            # 24 COD_MUN_ORIG (Código Mun Origem - Novo v3.1)
            # 25 COD_MUN_DEST (Código Mun Destino - Novo v3.1)
            
            # Ajuste de versão e campos novos
            # Se for layout mais recente, pode precisar de COD_MUN_ORIG e COD_MUN_DEST
            
            # Buscar códigos de município (tenta do banco primeiro, depois do XML)
            cod_mun_orig = getattr(cte, 'cidade_origem_ibge', "") or ""
            cod_mun_dest = getattr(cte, 'cidade_destino_ibge', "") or ""
            
            if (not cod_mun_orig or not cod_mun_dest) and cte.xml_cte:
                import re
                if not cod_mun_orig:
                    # XML tag: <cMunIni>...</cMunIni>
                    match = re.search(r'<cMunIni>\s*(\d{7})\s*</cMunIni>', cte.xml_cte)
                    if match: cod_mun_orig = match.group(1)
                
                if not cod_mun_dest:
                    # XML tag: <cMunFim>...</cMunFim>
                    match = re.search(r'<cMunFim>\s*(\d{7})\s*</cMunFim>', cte.xml_cte)
                    if match: cod_mun_dest = match.group(1)
            
            if not cod_mun_orig: cod_mun_orig = "3148103"  # Fallback temporário (Patrocínio-MG)
            if not cod_mun_dest: cod_mun_dest = "3148103"  # Fallback temporário (Patrocínio-MG)
            
            ind_frt = "0" # Default 0 (Por conta do emitente/remetente)
            if cte.tomador_servico == 0: ind_frt = "0"
            elif cte.tomador_servico == 3: ind_frt = "1"
            
            # Padronizar CST para 3 dígitos: 00 -> 000
            cst_icms = str(cte.cst_icms or "00").zfill(3)
            
            self.add_line("D100",
                          ind_oper,              # 02 IND_OPER
                          ind_emit,              # 03 IND_EMIT
                          cod_part,              # 04 COD_PART
                          "57",                  # 05 COD_MOD (CTe)
                          cod_sit,               # 06 COD_SIT
                          str(cte.serie_cte or 1),  # 07 SER
                          "",                    # 08 SUB
                          str(cte.numero_cte or ""),  # 09 NUM_DOC
                          cte.chave_cte or "",   # 10 CHV_CTE
                          dt_doc,                # 11 DT_DOC
                          dt_ap,                 # 12 DT_A_P
                          tp_cte,                # 13 TP_CT-e
                          "",                    # 14 CHV_CTE_REF
                          vl_doc,                # 15 VL_DOC
                          "0,00",                # 16 VL_DESC
                          ind_frt,               # 17 IND_FRT
                          vl_serv,               # 18 VL_SERV
                          vl_bc_icms,            # 19 VL_BC_ICMS
                          vl_icms,               # 20 VL_ICMS
                          "0,00",                # 21 VL_NT
                          "",                    # 22 COD_INF
                          "",                    # 23 COD_CTA
                          cod_mun_orig,          # 24 COD_MUN_ORIG
                          cod_mun_dest           # 25 COD_MUN_DEST
                         )
            
            # D190: Registro Analítico dos Documentos (Resumo por CST ICMS)
            # |D190|CST_ICMS|CFOP|ALIQ_ICMS|VL_OPR|VL_BC_ICMS|VL_ICMS|VL_RED_BC|COD_OBS|
            
            cfop = cte.cfop or "5353"
            aliq_icms = self.format_decimal(cte.p_icms or Decimal('0.00'))
            
            self.add_line("D190",
                          cst_icms,              # CST_ICMS (Agora com 3 dígitos)
                          cfop,                  # CFOP
                          aliq_icms,             # ALIQ_ICMS
                          vl_serv,               # VL_OPR
                          vl_bc_icms,            # VL_BC_ICMS
                          vl_icms,               # VL_ICMS
                          "0,00",                # VL_RED_BC
                          ""                     # COD_OBS
                         )
        
        self.add_line("D990", self.count_reg_block("D"))

    def generate_block_d_empty(self):
        """Bloco D sem movimento"""
        self.add_line("D001", "1")  # 1 = Sem movimento
        self.add_line("D990", self.count_reg_block("D"))

    def generate_block_e(self):
        """Apuração do ICMS e IPI"""
        self.add_line("E001", "0")  # Com movimento (se houve vendas) ou 1 sem
        
        # E100: Período de Apuração do ICMS (apenas 3 campos no layout 020)
        # |E100|DT_INI|DT_FIM|
        self.add_line("E100", self.format_date(self.data_inicio), self.format_date(self.data_fim))
        
        # E110: Apuração do ICMS - Operações Próprias (obrigatório se E100 informado)
        # Campos principais zerados se não houver lógica complexa de apuração
        # |E110|VL_TOT_DEBITOS|VL_AJ_DEBITOS|VL_TOT_AJ_DEBITOS|VL_ESTORNOS_CRED|VL_TOT_CREDITOS|VL_AJ_CREDITOS|
        #      |VL_TOT_AJ_CREDITOS|VL_ESTORNOS_DEB|VL_SLD_CREDOR_ANT|VL_SLD_APURADO|VL_TOT_DED|VL_ICMS_RECOLHER|
        #      |VL_SLD_CREDOR_TRANSPORTAR|DEB_ESP|
        
        tot_deb = self.format_decimal(self.total_vl_icms)
        tot_cred = "0,00"
        sld_apur = tot_deb # Saldo Devedor (se Deb > Cred)
        vl_recolher = tot_deb
        
        self.add_line("E110", 
                      tot_deb, "0,00", "0,00", "0,00",  # Débitos e ajustes
                      tot_cred, "0,00", "0,00", "0,00",  # Créditos e estornos
                      "0,00", sld_apur, "0,00", vl_recolher,  # Saldos e deduções (Saldo Apurado e A Recolher)
                      "0,00", "0,00"                   # Saldo final e débito especial
                     )
        
        # E116: Obrigações do ICMS Recolhido ou a Recolher - Operações Próprias
        # Obrigatório se houver valor a recolher (VL_ICMS_RECOLHER do E110 > 0)
        # E se houver código de receita configurado válido
        cod_receita = getattr(self.empresa, 'codigo_receita_icms', None) or ""
        cod_receita = cod_receita.strip()
        
        # Só gera E116 se tiver ICMS a recolher E código de receita válido (não vazio e diferente de "000")
        if self.total_vl_icms > 0 and cod_receita and cod_receita != "000":
            # Vencimento padrão: dia 20 do mês seguinte is a reasonable default approximation
            month = self.data_inicio.month
            year = self.data_inicio.year
            if month == 12:
                next_month = 1
                next_year = year + 1
            else:
                next_month = month + 1
                next_year = year
            
            dt_vcto = f"20{next_month:02d}{next_year}"

            self.add_line("E116", 
                          "000",          # COD_OR: Obrigação a recolher - ICMS Próprio
                          vl_recolher,    # VL_OR: Valor da obrigação total (igual ao E110)
                          dt_vcto,        # DT_VCTO: Data de vencimento
                          cod_receita,    # COD_REC
                          "",             # NUM_PROC: Processo
                          "",             # IND_PROC: Indicador de origem
                          "",             # PROC: Descrição do processo
                          "",             # TXT_COMPL
                          f"{month:02d}{year}" # MES_REF: Mês de referência (MMAAAA)
                         )

        self.add_line("E990", self.count_reg_block("E"))

    def generate_block_e_empty(self):
        """Bloco E sem movimento"""
        self.add_line("E001", "1")  # 1 = Sem movimento
        self.add_line("E990", self.count_reg_block("E"))

    def generate_block_g(self):
        """Bloco G - CIAP (Crédito ICMS do Ativo Permanente)"""
        self.add_line("G001", "1")  # 1 = Sem movimento
        self.add_line("G990", self.count_reg_block("G"))

    def generate_block_h(self):
        """Bloco H - Inventário Físico"""
        # Para escriturações de janeiro a março, deve informar inventário de 31/12 do ano anterior
        # MOT_INV = '01' (No final do período) e DT_INV = 31/12/ano_anterior
        
        # Verifica se é escrituração de janeiro a março
        mes_referencia = self.data_inicio.month
        eh_inicio_ano = mes_referencia <= 3
        
        if eh_inicio_ano:
            self.add_line("H001", "0")  # 0 = Com movimento (tem inventário)
            
            # H005: Total do Inventário
            # Usa 31/12 do ano anterior
            ano_anterior = self.data_inicio.year - 1
            dt_inv = f"31122025" if ano_anterior == 2025 else f"3112{ano_anterior}"
            
            self.add_line("H005", 
                          dt_inv,      # DT_INV: Data do inventário
                          "0,00",      # VL_INV: Valor total do inventário
                          "01"         # MOT_INV: 01 = No final do período
                         )
        else:
            self.add_line("H001", "1")  # 1 = Sem movimento
        
        self.add_line("H990", self.count_reg_block("H"))

    def generate_block_k(self):
        """Bloco K - Controle da Produção e do Estoque"""
        self.add_line("K001", "1")  # 1 = Sem movimento
        self.add_line("K990", self.count_reg_block("K"))

    def generate_block_1(self):
        """Bloco 1 - Outras Informações"""
        self.add_line("1001", "0")  # 0 = Com movimento
        
        # 1010: Obrigatoriedade de Registros do Bloco 1
        # IND_EXP | IND_CCRF | IND_COMB | IND_USINA | IND_VA | IND_EE | IND_CART | IND_FORM | IND_AER
        # + IND_GIAF_1 | IND_GIAF_3 | IND_GIAF_4 | IND_REST_RESSARC_COMPL_ICMS (desde Layout 013+)
        # N = Não
        self.add_line("1010", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N")
        
        self.add_line("1990", self.count_reg_block("1"))

    def generate_block_9(self):
        """Controle e Encerramento"""
        self.add_line("9001", "0")
        
        # 9900: Registros do Arquivo - totaliza TODOS os registros incluindo os do bloco 9
        # Snapshot dos registros antes de adicionar os 9900
        block_counts_snapshot = dict(self.block_counts)
        
        # Contar quantos 9900 serão gerados (todos os registros existentes + o próprio 9900 + 9990 + 9999)
        num_9900 = len(block_counts_snapshot) + 3  # +3 para 9900, 9990, 9999 (9001 já está no snapshot)
        
        # Gera um 9900 para cada tipo de registro já existente
        for reg, count in sorted(block_counts_snapshot.items()):
            self.add_line("9900", reg, str(count))
        
        # Adiciona 9900 para os registros do próprio bloco 9
        self.add_line("9900", "9900", str(num_9900))
        self.add_line("9900", "9990", "1")
        self.add_line("9900", "9999", "1")
        
        # 9990: Total de linhas do bloco 9 (9001 + todas as 9900 + 9990 + 9999)
        total_block9 = 1 + num_9900 + 1 + 1  # 9001 + 9900s + 9990 + 9999
        self.add_line("9990", str(total_block9))
        
        # 9999: Total de linhas do arquivo
        total_lines = len(self.lines) + 1  # +1 para o próprio 9999
        self.add_line("9999", str(total_lines))

    def count_reg_block(self, block_char):
        count = 0
        # Cria uma lista das chaves para evitar modificação durante iteração
        for reg in list(self.block_counts.keys()):
            if reg.startswith(block_char):
                count += self.block_counts[reg]
        return str(count + 1) # +1 for the X990 record itself

