import io
import logging
import re
import xml.etree.ElementTree as ET
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode import code128, qr
from reportlab.lib.colors import black
from decimal import Decimal
from datetime import datetime

logger = logging.getLogger(__name__)

class DanfeGenerator:
    def __init__(self, venda):
        self.venda = venda
        self.width, self.height = A4
        self.c = None

    def gerar_pdf(self):
        """Gera o PDF do DANFE e retorna o buffer (bytes)"""
        buffer = io.BytesIO()
        self.c = canvas.Canvas(buffer, pagesize=A4)
        self.c.setTitle(f"DANFE NFe {self.venda.numero_nfe}")
        
        # Obter Configuração
        from api.models import EmpresaConfig
        empresa = EmpresaConfig.get_ativa()
        is_homologacao = empresa and empresa.ambiente_nfe == '2'

        # Estrutura do DANFE Simplificado (Layout Retrato)
        # 1. Cabeçalho (Emitente + DANFE + Chave + Cód Barras)
        self._desenhar_cabecalho(empresa)
        
        # 2. Destinatário
        self._desenhar_destinatario(is_homologacao)
        
        # 3. Dados da Fatura / Duplicatas (Simplificado)
        # self._desenhar_fatura()
        
        # 3. Cálculo do Imposto
        self._desenhar_impostos()
        
        # 4. Transportador
        self._desenhar_transportador()
        
        # 5. Itens
        self._desenhar_itens()
        
        # 6. Dados Adicionais
        self._desenhar_rodape()

        # 7. Marca D'água se Homologação
        if is_homologacao:
            self._desenhar_marca_dagua_homologacao()
        
        self.c.showPage()
        self.c.save()
        buffer.seek(0)
        return buffer

    def _desenhar_marca_dagua_homologacao(self):
        """Desenha 'SEM VALOR FISCAL' na diagonal"""
        self.c.saveState()
        self.c.translate(105*mm, 148*mm) # Centro da página
        self.c.rotate(45)
        self.c.setFillColorRGB(0.8, 0.8, 0.8, 0.5) # Cinza claro transparente
        self.c.setFont("Helvetica-Bold", 60)
        self.c.drawCentredString(0, 0, "SEM VALOR FISCAL")
        self.c.drawCentredString(0, -60, "AMBIENTE DE HOMOLOGAÇÃO")
        self.c.restoreState()

    def _rect(self, x, y, w, h):
        self.c.rect(x*mm, y*mm, w*mm, h*mm)

    def _text(self, x, y, text, size=8, align="left", font="Helvetica"):
        self.c.setFont(font, size)
        if text is None:
            text = ""
        else:
            text = str(text)
            
        if align == "center":
            self.c.drawCentredString(x*mm, y*mm, text)
        elif align == "right":
            self.c.drawRightString(x*mm, y*mm, text)
        else:
            self.c.drawString(x*mm, y*mm, text)
            
    def _text_bold(self, x, y, text, size=8, align="left"):
        self._text(x, y, text, size=size, align=align, font="Helvetica-Bold")
        
    def _field_box(self, x, y, w, h, label, value, align="left"):
        self._rect(x, y, w, h)
        self._text(x+1, y+h-2.5, label, size=5)
        self._text_bold(x+1 if align=="left" else x+w-1, y+1.5, value, size=7, align=align)

    def _desenhar_cabecalho(self, empresa=None):
        if not empresa:
            from api.models import EmpresaConfig
            empresa = EmpresaConfig.get_ativa()
        
        # Área Principal
        top = 285
        
        # -- CANHOTO -- (Topo da folha)
        self._rect(5, top-18, 180, 15)
        self._text(6, top-6, "RECEBEMOS DE " + (empresa.nome_razao_social or "") + " OS PRODUTOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO", size=6)
        
        self._rect(5, top-18, 50, 8) # Data Recebimento
        self._text(6, top-17, "DATA DE RECEBIMENTO", size=5)
        
        self._rect(55, top-18, 105, 8) # Assinatura
        self._text(56, top-17, "IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR", size=5)
        
        # NF-e Canhoto
        self._rect(185, top-18, 20, 15)
        self._text_bold(195, top-8, "NF-e", size=10, align="center")
        self._text_bold(195, top-12, f"Nº {self.venda.numero_nfe or '0'}", size=8, align="center")
        self._text_bold(195, top-15, f"SÉRIE {self.venda.serie_nfe or '1'}", size=6, align="center")
        
        # -- LOGO E DADOS EMITENTE --
        y_emit = top - 20 - 30 # 235
        h_emit = 32
        
        # Quadro Emitente
        self._rect(5, y_emit, 80, h_emit)
        
        # Lógica para Logo
        has_logo = False
        if empresa.logo_url:
            import os
            logo_path = empresa.logo_url
            
            # Se não encontrar o arquivo direto, tenta resolver caminhos relativos conhecidos do projeto
            if not os.path.exists(logo_path):
                filename = os.path.basename(logo_path)
                possible_paths = [
                    # Caminho Frontend (dentro do Backend)
                    os.path.join(os.getcwd(), 'frontend', 'public', 'logos'),
                    # Caminho Relativo Genérico
                    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/logos")),
                ]
                
                for p in possible_paths:
                    full_p = os.path.join(p, filename)
                    if os.path.exists(full_p):
                        logo_path = full_p
                        logger.info(f"Logo encontrado em: {logo_path}")
                        break

            try:
                # Desenha logo na esquerda (x=6mm) - Reduzido levemente para dar espaço ao texto
                # y_emit é a base. Altura do box é h_emit(32).
                # Width reduzido de 28 para 25mm
                self.c.drawImage(logo_path, 6*mm, (y_emit+3)*mm, width=25*mm, height=25*mm, preserveAspectRatio=True, mask='auto', anchor='c')
                has_logo = True
            except Exception as e:
                logger.warning(f"Erro ao desenhar logo DANFE: {e} | Path tentado: {logo_path}")

        if empresa.nome_razao_social:
            if has_logo:
                # Com Logo: Alinhar à Esquerda
                # Logo vai até x=31 (6+25). Vamos começar em x=33 para ganhar espaço.
                c_x = 33
                align_mode = "left"
                
                # Ajuste dinâmico de Fonte para não cortar
                max_width_mm = 50 # 85 (fim box) - 33 (inicio) - 2 (margem) = 50mm
                font_size = 8
                nome = empresa.nome_razao_social
                
                # Loop simples para reduzir fonte até caber
                # Aprox: Helvetica-Bold width ~ size * 0.7 * len
                # Melhor usar canvas stringWidth se possível, mas aqui vamos estimar com segurança
                # Se len > 30 caracteres e tem logo, reduz fonte
                if len(nome) > 28:
                    font_size = 7
                if len(nome) > 35:
                    font_size = 6
                
                # Truncar hard limit se ainda muito grande visivelmente
                limit = 55 # Aumentado pois a fonte diminui
            else:
                # Sem Logo: Centralizado no Box (5 a 85 -> Centro 45)
                c_x = 45
                align_mode = "center"
                limit = 45
                font_size = 9
                nome = empresa.nome_razao_social

            # Nome da Empresa
            self._text_bold(c_x, y_emit+h_emit-5, nome[:limit], size=font_size, align=align_mode)
            
            # Endereço e Dados
            self._text(c_x, y_emit+h_emit-9, empresa.endereco or "", size=6, align=align_mode)
            self._text(c_x, y_emit+h_emit-12, f"{empresa.cidade or ''} - {empresa.estado or ''}", size=6, align=align_mode)
            self._text(c_x, y_emit+h_emit-15, f"CNPJ: {empresa.cpf_cnpj}", size=6, align=align_mode)
            self._text(c_x, y_emit+h_emit-18, f"IE: {empresa.inscricao_estadual}", size=6, align=align_mode)
            self._text(c_x, y_emit+h_emit-25, f"Fone: {empresa.telefone}", size=6, align=align_mode)

        # Quadro DANFE Centro
        x_danfe = 88
        w_danfe = 30
        self._rect(x_danfe, y_emit, w_danfe, h_emit)
        self._text_bold(x_danfe+w_danfe/2, y_emit+25, "DANFE", size=12, align="center")
        self._text(x_danfe+w_danfe/2, y_emit+22, "Documento Auxiliar", size=6, align="center")
        self._text(x_danfe+w_danfe/2, y_emit+19, "da Nota Fiscal", size=6, align="center")
        self._text(x_danfe+w_danfe/2, y_emit+17, "Eletrônica", size=6, align="center")
        
        tp_nf = "1" # 1-Saída (Default)
        self._text(x_danfe+5, y_emit+10, "0 - Entrada", size=6)
        self._text(x_danfe+5, y_emit+7,  "1 - Saída", size=6)
        self._rect(x_danfe+20, y_emit+7, 6, 6)
        self._text_bold(x_danfe+23, y_emit+8, tp_nf, size=9, align="center")
        
        self._text_bold(x_danfe+w_danfe/2, y_emit+4, f"Nº {self.venda.numero_nfe}", size=8, align="center")
        self._text(x_danfe+w_danfe/2, y_emit+1, f"SÉRIE {self.venda.serie_nfe or '1'}", size=6, align="center")

        # Código de Barras e Chave
        x_bars = x_danfe + w_danfe + 3 # 121
        w_bars = 205 - x_bars # 84
        self._rect(x_bars, y_emit, w_bars, h_emit)
        
        chave = self.venda.chave_nfe
        if chave and len(chave) == 44:
            # Code 128 C
            try:
                # Ajustar largura e altura para caber
                # Reportlab usa units de pontos, Code128 espera x, y, height...
                # Convert mm to points
                bc = code128.Code128(chave, barHeight=12*mm, barWidth=0.25*mm)
                bc.drawOn(self.c, x_bars*mm + 2*mm, y_emit*mm + 15*mm)
            except Exception as e:
                logger.error(f"Erro barcode: {e}")
                self._text(x_bars+2, y_emit+18, "Erro Código Barras")
            
            self._text(x_bars+2, y_emit+11, "CHAVE DE ACESSO", size=6)
            self._text_bold(x_bars+2, y_emit+8, " ".join([chave[i:i+4] for i in range(0, 44, 4)]), size=7)
        else:
             self._text(x_bars+2, y_emit+15, "SEM CHAVE DE ACESSO VÁLIDA - MODO CONTIGÊNCIA OU ERRO", size=6)

        # Protocolo
        y_prot = y_emit - 10
        self._rect(5, y_prot, 120, 9)
        self._text(6, y_prot+6, "NATUREZA DA OPERAÇÃO", size=5)
        
        # Buscar Natureza pelo CFOP
        op_nome = self._get_natureza_operacao_pelo_cfop()
        # Fallback para nome da operação se retornar string vazia ou se usuário preferir misto (mas user pediu pelo CFOP)
        if not op_nome:
            op_nome = self.venda.id_operacao.nome_operacao if self.venda.id_operacao else "VENDA"
            
        self._text_bold(6, y_prot+2, op_nome[:70], size=7)
        
        # Protocolo Auth
        self._rect(128, y_prot, 77, 9)
        self._text(129, y_prot+6, "PROTOCOLO DE AUTORIZAÇÃO DE USO", size=5)
        self._text_bold(129, y_prot+2, f"{self.venda.protocolo_nfe or ''} - {(self.venda.data_documento or datetime.now()).strftime('%d/%m/%Y %H:%M:%S')}", size=7)

    def _get_natureza_operacao_pelo_cfop(self):
        """Busca a descrição da Natureza da Operação baseada no CFOP do primeiro item do XML"""
        # Mapa de Descrições Padrão por CFOP
        cfop_desc = {
            '5101': 'VENDA DE PRODUCÃO DO ESTABELECIMENTO',
            '5102': 'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS',
            '5103': 'VENDA DE PRODUCÃO DO ESTABELECIMENTO EFETUADA FORA DO ESTABELECIMENTO',
            '5104': 'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS, EFETUADA FORA DO ESTABELECIMENTO',
            '5115': 'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS', 
            '5401': 'VENDA DE PRODUCÃO DO ESTABELECIMENTO EM OPERACÃO COM PRODUTO SUJEITO A ST',
            '5403': 'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS EM OPERACÃO COM ST',
            '5405': 'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS EM OPERACÃO COM ST NA CONDICÃO DE SUBSTITUIDO',
            '6101': 'VENDA DE PRODUCÃO DO ESTABELECIMENTO',
            '6102': 'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS',
            '6107': 'VENDA DE PRODUCÃO DO ESTABELECIMENTO DESTINADA A NÃO CONTRIBUINTE',
            '6108': 'VENDA DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS DESTINADA A NÃO CONTRIBUINTE',
            # Devoluções
            '1201': 'DEVOLUCÃO DE VENDAS DE PRODUCÃO DO ESTABELECIMENTO',
            '1202': 'DEVOLUCÃO DE VENDAS DE MERCADORIA ADQUIRIDA OU RECEBIDA DE TERCEIROS',
            '5201': 'DEVOLUCÃO DE COMPRA PARA INDUSTRIALIZACÃO',
            '5202': 'DEVOLUCÃO DE COMPRA PARA COMERCIALIZACÃO',
        }

        # 1. Tentar ler do XML (Mais preciso)
        if self.venda.xml_nfe:
            try:
                # Namespace NFe
                ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
                # Parse simples 
                xml_clean = self.venda.xml_nfe
                # Limpeza simples de declaração encoding se necessário
                if xml_clean.startswith('<?xml'):
                    idx = xml_clean.find('?>')
                    if idx != -1:
                        xml_clean = xml_clean[idx+2:]
                
                root = ET.fromstring(xml_clean)
                
                # Procurar CFOP no primeiro item (det nItem="1")
                found_cfop = None
                
                # Tentativa 1: Com namespace
                det = root.find('.//nfe:det', ns)
                if det:
                    prod = det.find('nfe:prod', ns)
                    if prod:
                        cfop_node = prod.find('nfe:CFOP', ns)
                        if cfop_node is not None:
                            found_cfop = cfop_node.text

                # Tentativa 2: Sem namespace 
                if not found_cfop:
                     # Remove namespaces from tag searches if strict search fails
                     for elem in root.iter():
                         if elem.tag.endswith('CFOP'):
                             found_cfop = elem.text
                             break
                
                if found_cfop:
                    # Retorna descrição mapeada ou texto genérico com o código
                    return cfop_desc.get(found_cfop, f"OUTRAS SAIDAS - CFOP {found_cfop}")

            except Exception as e:
                logger.error(f"Erro ao ler CFOP do XML: {e}")

        # 2. Fallback: Se não tem XML processado mas tem itens, podemos tentar adivinhar 
        # (Mas sem Regra Fiscal complexa, vamos assumir o padrão 5102 que é usado no XML Builder por enquanto)
        return cfop_desc.get('5102')

    def _desenhar_destinatario(self, is_homologacao=False):
        cli = self.venda.id_cliente
        if not cli:
            return 
            
        y = 210
        self._text_bold(5, y+2, "DESTINATÁRIO / REMETENTE", 7)
        
        y_box = y - 9
        # Nome / Razão
        nome_destinatario = "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR" if is_homologacao else cli.nome_razao_social
        self._field_box(5, y_box, 110, 8, "NOME / RAZÃO SOCIAL", nome_destinatario)
        # CNPJ
        self._field_box(118, y_box, 35, 8, "CNPJ / CPF", cli.cpf_cnpj)
        # Data Emissão
        self._field_box(156, y_box, 49, 8, "DATA DA EMISSÃO", self.venda.data_documento.strftime("%d/%m/%Y") if self.venda.data_documento else "")
        
        y_box -= 9
        # Endereço
        end = f"{cli.endereco or ''}, {cli.numero or ''}"
        self._field_box(5, y_box, 90, 8, "ENDEREÇO", end)
        # Bairro
        self._field_box(98, y_box, 40, 8, "BAIRRO / DISTRITO", cli.bairro)
        # CEP
        self._field_box(141, y_box, 25, 8, "CEP", cli.cep)
        # Data Saída
        self._field_box(169, y_box, 36, 8, "DATA DA SAÍDA/ENTRADA", self.venda.data_documento.strftime("%d/%m/%Y") if self.venda.data_documento else "")
        
        y_box -= 9
        # Município
        self._field_box(5, y_box, 90, 8, "MUNICÍPIO", cli.cidade)
        # Fone
        self._field_box(98, y_box, 35, 8, "FONE / FAX", cli.telefone)
        # UF
        self._field_box(136, y_box, 10, 8, "UF", cli.estado)
        # IE
        self._field_box(149, y_box, 56, 8, "INSCRIÇÃO ESTADUAL", cli.inscricao_estadual)

    def _desenhar_impostos(self):
        # Simplificado - Valores Zerados pois cálculo preciso requer leitura XML complexa
        # Idealmente ler do XML, mas aqui faremos placeholder se não tivermos parseado o XML em detalhe
        # Vamos assumir valores totais da venda por enquanto
        y = 175
        self._text_bold(5, y+2, "CÁLCULO DO IMPOSTO", 7)
        
        h = 8
        y_box = y - h
        
        # Grid de Impostos (Base ICMS, Vl ICMS, Base ST, Vl ST, Vl Prod, Frete, Seguro, Desc, Outro, IPI, Vl Total)
        w = 17
        self._field_box(5, y_box, w, h, "BASE CÁLC. ICMS", "0,00", "right")
        self._field_box(5+w, y_box, w, h, "VALOR DO ICMS", "0,00", "right")
        self._field_box(5+2*w, y_box, w, h, "BASE CÁLC. ST", "0,00", "right")
        self._field_box(5+3*w, y_box, w, h, "VALOR DO ICMS ST", "0,00", "right")
        self._field_box(5+4*w, y_box, 20, h, "V. IMP. IMPORTAÇÃO", "0,00", "right")
        self._field_box(5+4*w+20, y_box, 15, h, "V. ICMS UF REM.", "0,00", "right")
        self._field_box(5+4*w+35, y_box, 15, h, "V. FCP UF DEST.", "0,00", "right")
        self._field_box(5+4*w+50, y_box, w+5, h, "VALOR PIS", "0,00", "right")
        self._field_box(5+5*w+55, y_box, 28, h, "VALOR TOTAL PROD.", f"{self.venda.valor_total:.2f}", "right")
        
        y_box -= 9
        self._field_box(5, y_box, w, h, "VALOR DO FRETE", f"{self.venda.taxa_entrega or 0:.2f}", "right")
        self._field_box(5+w, y_box, w, h, "VALOR DO SEGURO", "0,00", "right")
        self._field_box(5+2*w, y_box, w, h, "DESCONTO", "0,00", "right")
        self._field_box(5+3*w, y_box, w, h, "OUTRAS DESP.", "0,00", "right")
        self._field_box(5+4*w, y_box, w, h, "VALOR DO IPI", "0,00", "right")
        self._field_box(5+5*w, y_box, w, h, "VALOR DA COFINS", "0,00", "right")
        self._field_box(5+6*w, y_box, w+10, h, "VALOR PIS", "0,00", "right")
        
        total_nota = self.venda.valor_total + (self.venda.taxa_entrega or Decimal("0.00"))
        self._field_box(5+7*w+10, y_box, 36, h, "VALOR TOTAL NOTA", f"{total_nota:.2f}", "right")

    def _desenhar_transportador(self):
        y = 150
        self._text_bold(5, y+2, "TRANSPORTADOR / VOLUMES TRANSPORTADOS", 7)
        
        y_box = y - 9
        # Nome
        self._field_box(5, y_box, 90, 8, "RAZÃO SOCIAL", "O MESMO" if self.venda.tipo_frete == 9 else "")
        # Frete por conta
        mod_frete = "9-Sem Frete" 
        if self.venda.tipo_frete == 0: mod_frete = "0-Emitente"
        if self.venda.tipo_frete == 1: mod_frete = "1-Destinatário"
        
        self._field_box(98, y_box, 30, 8, "FRETE POR CONTA", mod_frete)
        self._field_box(131, y_box, 20, 8, "CÓDIGO ANTT", self.venda.rntrc)
        self._field_box(154, y_box, 20, 8, "PLACA VEÍCULO", self.venda.placa_veiculo)
        self._field_box(177, y_box, 28, 8, "UF", self.venda.uf_veiculo)
        
        y_box -= 9
        self._field_box(5, y_box, 90, 8, "ENDEREÇO", "")
        self._field_box(98, y_box, 90, 8, "MUNICÍPIO", "")
        self._field_box(191, y_box, 14, 8, "UF", "")
        
        y_box -= 9
        self._field_box(5, y_box, 20, 8, "QUANTIDADE", str(self.venda.quantidade_volumes))
        self._field_box(28, y_box, 40, 8, "ESPÉCIE", self.venda.especie_volumes)
        self._field_box(71, y_box, 40, 8, "MARCA", self.venda.marca_volumes)
        self._field_box(114, y_box, 40, 8, "NUMERAÇÃO", "")
        self._field_box(157, y_box, 24, 8, "PESO BRUTO", f"{self.venda.peso_bruto:.3f}")
        self._field_box(184, y_box, 21, 8, "PESO LÍQUIDO", f"{self.venda.peso_liquido:.3f}")

    def _desenhar_itens(self):
        y = 115
        self._text_bold(5, y+2, "DADOS DO PRODUTO / SERVIÇO", 7)
        
        self._rect(5, 50, 200, y - 50) # Quadro Itens Grande
        
        # Header da Tabela
        hd = y - 5
        self._text(6, hd, "CÓDIGO", size=5)
        self._text(25, hd, "DESCRIÇÃO DO PRODUTO / SERVIÇO", size=5)
        self._text(90, hd, "NCM/SH", size=5)
        self._text(105, hd, "CST", size=5)
        self._text(113, hd, "CFOP", size=5)
        self._text(123, hd, "UNID.", size=5)
        self._text(133, hd, "QTD.", size=5)
        self._text(145, hd, "V. UNIT.", size=5)
        self._text(160, hd, "V. TOTAL", size=5)
        self._text(175, hd, "BC ICMS", size=5)
        self._text(188, hd, "V. ICMS", size=5)
        self._text(198, hd, "ALÍQ", size=5)
        self._text(5, hd-1, "_"*145, size=5) # Linha
        
        y_item = hd - 4
        
        # Listar Itens (Limitado visualmente, nao farei paginacao para manter simples)
        for item in self.venda.itens.all():
            if y_item < 55: break # End of box
            
            prod = item.id_produto
            codigo = prod.codigo_produto if prod else "000"
            nome = prod.nome_produto[:50] if prod else "ITEM"
            ncm = prod.ncm if prod else ""
            cst = "000" # Placeholder
            cfop = "5102" # Placeholder
            unid = prod.unidade_medida if prod else "UN"
            
            self._text(6, y_item, codigo, size=6)
            self._text(25, y_item, nome, size=6)
            self._text(90, y_item, ncm, size=6)
            self._text(105, y_item, cst, size=6)
            self._text(113, y_item, cfop, size=6)
            self._text(123, y_item, unid, size=6)
            self._text(140, y_item, f"{item.quantidade:.2f}", size=6, align="right")
            self._text(155, y_item, f"{item.valor_unitario:.2f}", size=6, align="right")
            self._text(170, y_item, f"{item.valor_total:.2f}", size=6, align="right")
            
            y_item -= 3.5

    def _desenhar_rodape(self):
        y = 45
        self._text_bold(5, y+2, "DADOS ADICIONAIS", 7)
        
        h = 25
        self._rect(5, y-h, 130, h)
        self._text(6, y-3, "INFORMAÇÕES COMPLEMENTARES", 5)
        
        obs = f"{self.venda.observacao_contribuinte or ''} {self.venda.observacao_fisco or ''}"
        # Wrap text simples
        import textwrap
        lines = textwrap.wrap(obs, 90)
        ly = y - 7
        for line in lines[:4]:
            self._text(6, ly, line, size=6)
            ly -= 3
            
        # Reservado ao Fisco
        self._rect(140, y-h, 65, h)
        self._text(141, y-3, "RESERVADO AO FISCO", 5)

class DanfceGenerator:
    """
    Gera DANFCE (Cupom Fiscal Eletrônico NFC-e modelo 65) em formato 80 mm de largura.
    Usado para impressão de NFC-e no ponto de venda.
    """

    PAGE_W = 80 * mm        # largura da página em pontos
    MX     = 2  * mm        # margem horizontal
    CW     = 76 * mm        # largura de conteúdo (PAGE_W - 2*MX)
    LH     = 3.8 * mm       # altura de linha padrão
    LH_SM  = 3.0 * mm       # altura de linha pequena

    def __init__(self, venda):
        self.venda = venda
        self.c = None
        self.y = 0          # posição y corrente (decresce ao desenhar para baixo)

    # ------------------------------------------------------------------ helpers

    def _adv(self, h=None):
        """Avança a posição y para baixo."""
        self.y -= (h if h is not None else self.LH)

    def _sep(self, gap=0.8):
        """Linha separadora horizontal."""
        self.y -= gap * mm
        self.c.setLineWidth(0.3)
        self.c.setStrokeColorRGB(0.3, 0.3, 0.3)
        self.c.line(self.MX, self.y, self.PAGE_W - self.MX, self.y)
        self.y -= gap * mm

    def _hline_dashed(self):
        self.c.setLineWidth(0.2)
        self.c.setDash(2, 2)
        self.c.line(self.MX, self.y, self.PAGE_W - self.MX, self.y)
        self.c.setDash(1, 0)

    def _txt(self, text, size=7, bold=False, align='left', x=None, y=None, color=None):
        """Desenha texto na posição corrente sem avançar y."""
        font = 'Helvetica-Bold' if bold else 'Helvetica'
        self.c.setFont(font, size)
        rgb = color if color else (0, 0, 0)
        self.c.setFillColorRGB(*rgb)
        cx = x if x is not None else self.MX
        cy = y if y is not None else self.y
        if align == 'center':
            self.c.drawCentredString(self.PAGE_W / 2, cy, str(text or ''))
        elif align == 'right':
            self.c.drawRightString(self.PAGE_W - self.MX, cy, str(text or ''))
        else:
            self.c.drawString(cx, cy, str(text or ''))

    def _tline(self, text, size=7, bold=False, align='left', lh=None, wrap=True):
        """Desenha linha(s) de texto e avança y."""
        lh_use = lh if lh is not None else self.LH
        font = 'Helvetica-Bold' if bold else 'Helvetica'
        lines = self._wrap(str(text or ''), size, font) if wrap else [str(text or '')]
        for line in lines:
            self._txt(line, size=size, bold=bold, align=align)
            self.y -= lh_use

    def _lr(self, left, right, size=7, bold=False, lh=None):
        """Linha com rótulo à esquerda e valor à direita."""
        font = 'Helvetica-Bold' if bold else 'Helvetica'
        self.c.setFont(font, size)
        self.c.setFillColorRGB(0, 0, 0)
        self.c.drawString(self.MX, self.y, str(left or ''))
        self.c.drawRightString(self.PAGE_W - self.MX, self.y, str(right or ''))
        self.y -= (lh if lh is not None else self.LH)

    def _wrap(self, text, size, font='Helvetica'):
        from reportlab.pdfbase.pdfmetrics import stringWidth
        if not text:
            return ['']
        words = text.split()
        lines, cur = [], ''
        for w in words:
            test = (cur + ' ' + w).strip()
            if stringWidth(test, font, size) <= self.CW:
                cur = test
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines or ['']

    def _wrap_count(self, text, size, font='Helvetica'):
        return len(self._wrap(str(text or ''), size, font))

    # ------------------------------------------------------ page height calc

    def _calc_height(self, itens, pagamentos):
        h = 38 * mm     # cabeçalho
        for item in itens:
            nome = str(getattr(item.id_produto, 'nome_produto', '') or 'Produto')
            h += self._wrap_count(nome, 6.5) * self.LH_SM + self.LH + 0.5 * mm
        h += 18 * mm    # totais + separadores
        h += (len(pagamentos) + 2) * self.LH + 10 * mm
        h += 44 * mm    # QR code
        h += 28 * mm    # chave + rodapé
        return max(h, 120 * mm)

    # ------------------------------------------------------------------ main

    def gerar_pdf(self):
        from api.models import EmpresaConfig, FinanceiroConta

        empresa = EmpresaConfig.get_ativa()
        is_homologacao = bool(empresa and empresa.ambiente_nfe == '2')

        itens = list(self.venda.itens.select_related('id_produto').all())

        pagamentos = list(
            FinanceiroConta.objects.filter(
                id_venda_origem=self.venda.pk,
                tipo_conta='RECEBER'
            ).values('forma_pagamento', 'valor_parcela').order_by('id_conta')
        )
        if not pagamentos:
            pagamentos = [{
                'forma_pagamento': 'NÃO INFORMADO',
                'valor_parcela': self.venda.valor_total or Decimal('0.00')
            }]

        ph = self._calc_height(itens, pagamentos)
        buf = io.BytesIO()
        self.c = canvas.Canvas(buf, pagesize=(self.PAGE_W, ph))
        self.y = ph - self.MX

        self._header(empresa, is_homologacao)
        self._items(itens)
        self._totals(itens)
        self._payments(pagamentos)
        self._qrcode()
        self._footer(is_homologacao)

        self.c.showPage()
        self.c.save()
        buf.seek(0)
        return buf

    # ---------------------------------------------------------------- sections

    def _header(self, empresa, is_homologacao):
        if empresa:
            nome      = (empresa.nome_fantasia or empresa.nome_razao_social or '').upper()
            cnpj      = empresa.cpf_cnpj or ''
            ie        = empresa.inscricao_estadual or ''
            endereco  = ', '.join(x for x in [empresa.endereco, empresa.numero] if x)
            localid   = ' - '.join(x for x in [empresa.bairro, empresa.cidade, empresa.estado] if x)
            telefone  = empresa.telefone or ''
        else:
            nome = cnpj = ie = endereco = localid = telefone = ''

        self._tline(nome, size=8.5, bold=True, align='center')
        if endereco:
            self._tline(endereco, size=6, align='center')
        if localid:
            self._tline(localid, size=6, align='center')
        if telefone:
            self._tline(f'Tel: {telefone}', size=6, align='center')

        cnpj_ie = f'CNPJ: {cnpj}' + (f'  IE: {ie}' if ie else '')
        self._tline(cnpj_ie, size=6, align='center')
        self._sep()

        titulo = 'CUPOM FISCAL ELETRÔNICO - NFC-e'
        if is_homologacao:
            titulo += ' [HOMOLOGAÇÃO]'
        self._tline(titulo, size=7, bold=True, align='center')

        numero = self.venda.numero_nfe or self.venda.numero_documento or self.venda.pk
        serie  = getattr(self.venda, 'serie_nfe', 1) or 1
        try:
            num_fmt = f'{int(numero):06d}'
        except (TypeError, ValueError):
            num_fmt = str(numero)

        # Usar data/hora ATUAL da impressão ao invés da data do documento
        data_atual = datetime.now()
        data_str = data_atual.strftime('%d/%m/%Y %H:%M:%S')
        
        self._tline(f'Nº {num_fmt}  Série {int(serie):03d}', size=6.5, align='center')
        if data_str:
            self._tline(f'Emissão: {data_str}', size=6.5, align='center')

        # consumidor
        cliente = self.venda.id_cliente
        if cliente:
            nome_c = getattr(cliente, 'nome_razao_social', None) or str(cliente)
            if nome_c and nome_c.lower() not in ('none', ''):
                cpf_c  = getattr(cliente, 'cpf_cnpj', '') or ''
                c_line = f'Cons.: {nome_c[:26]}'
                if cpf_c:
                    c_line += f'  Doc: {cpf_c}'
                self._tline(c_line, size=6, align='center')

        self._sep()

    def _items(self, itens):
        # cabeçalho da tabela de itens
        self._txt('#', size=6.5, bold=True)
        self._txt('DESCRIÇÃO', size=6.5, bold=True, x=self.MX + 7 * mm)
        self._txt('TOTAL', size=6.5, bold=True, align='right')
        self._adv(self.LH_SM)
        self._hline_dashed()
        self._adv(1 * mm)

        for idx, item in enumerate(itens, 1):
            prod   = item.id_produto
            nome   = str(getattr(prod, 'nome_produto', '') or 'Produto')
            qty    = float(item.quantidade or 0)
            vunit  = float(item.valor_unitario or 0)
            vtotal = float(item.valor_total or 0)

            nome_lines = self._wrap(nome, 6.5)
            for i, nl in enumerate(nome_lines):
                if i == 0:
                    self.c.setFont('Helvetica', 6.5)
                    self.c.setFillColorRGB(0, 0, 0)
                    self.c.drawString(self.MX, self.y, str(idx))
                    self.c.drawString(self.MX + 7 * mm, self.y, nl)
                    self.c.drawRightString(self.PAGE_W - self.MX, self.y, f'R${vtotal:.2f}')
                else:
                    self.c.setFont('Helvetica', 6.5)
                    self.c.setFillColorRGB(0, 0, 0)
                    self.c.drawString(self.MX + 7 * mm, self.y, nl)
                self._adv(self.LH_SM)

            qty_str = str(int(qty)) if qty == int(qty) else f'{qty:.3f}'.rstrip('0')
            self.c.setFont('Helvetica', 6.5)
            self.c.drawString(self.MX, self.y, f'   {qty_str} x R${vunit:.2f}')
            self._adv(self.LH)

        self._sep()

    def _totals(self, itens):
        subtotal = sum(float(i.valor_total  or 0) for i in itens)
        desconto = sum(float(i.desconto_valor or 0) for i in itens)
        frete    = float(self.venda.taxa_entrega or 0)
        total    = float(self.venda.valor_total  or 0)

        self._lr('Subtotal:', f'R$ {subtotal:.2f}')
        if desconto > 0.005:
            self._lr('(-) Desconto:', f'R$ {desconto:.2f}')
        if frete > 0.005:
            self._lr('(+) Frete:', f'R$ {frete:.2f}')

        self.y -= 0.5 * mm
        self.c.setLineWidth(0.5)
        self.c.setStrokeColorRGB(0, 0, 0)
        self.c.line(self.MX, self.y, self.PAGE_W - self.MX, self.y)
        self.y -= 0.5 * mm
        self._lr('TOTAL A PAGAR:', f'R$ {total:.2f}', size=8, bold=True)
        self.y -= 1 * mm

    def _payments(self, pagamentos):
        self._sep()
        self._tline('FORMA DE PAGAMENTO', size=6.5, bold=True, align='center')

        total_pago = Decimal('0.00')
        for pag in pagamentos:
            forma = str(pag.get('forma_pagamento') or 'DINHEIRO').upper()
            val   = pag.get('valor_parcela') or 0
            try:
                val_f = float(val)
                total_pago += Decimal(str(round(val_f, 2)))
            except Exception:
                val_f = 0.0
            self._lr(forma + ':', f'R$ {val_f:.2f}')

        troco = float(total_pago) - float(self.venda.valor_total or 0)
        if troco > 0.005:
            self._lr('Troco:', f'R$ {troco:.2f}')

    def _qrcode(self):
        qr_data = self.venda.qrcode_nfe
        if not qr_data:
            return

        self._sep()
        self._tline('Consulte pela chave de acesso em qualquer', size=6, align='center', lh=self.LH_SM)
        self._tline('browser ou leia o QR Code abaixo:', size=6, align='center', lh=self.LH_SM)
        self.y -= 1.5 * mm

        try:
            from reportlab.graphics.shapes import Drawing
            from reportlab.graphics.barcode.qr import QrCodeWidget
            from reportlab.graphics import renderPDF

            qr_size   = 32 * mm
            qr_widget = QrCodeWidget(qr_data)
            b = qr_widget.getBounds()
            w, h = b[2] - b[0], b[3] - b[1]
            d = Drawing(qr_size, qr_size,
                        transform=[qr_size / w, 0, 0, qr_size / h, 0, 0])
            d.add(qr_widget)
            qr_x = (self.PAGE_W - qr_size) / 2
            renderPDF.draw(d, self.c, qr_x, self.y - qr_size)
            self.y -= (qr_size + 2 * mm)
        except Exception as exc:
            logger.warning(f'[DanfceGenerator] QR Code error: {exc}')
            self._tline('[QR Code indisponível]', size=6, align='center')

    def _footer(self, is_homologacao):
        self._sep(gap=0.5)

        chave     = self.venda.chave_nfe or ''
        chave_num = re.sub(r'\D', '', chave)

        if len(chave_num) == 44:
            self._tline('Chave de Acesso:', size=6.5, bold=True, align='center', lh=self.LH_SM)
            g1 = ' '.join(chave_num[i:i+4] for i in range(0,  22, 4))
            g2 = ' '.join(chave_num[i:i+4] for i in range(22, 44, 4))
            self._tline(g1, size=5.5, align='center', lh=self.LH_SM)
            self._tline(g2, size=5.5, align='center', lh=self.LH_SM)
        elif chave_num:
            self._tline('Chave de Acesso:', size=6.5, bold=True, align='center', lh=self.LH_SM)
            half = len(chave_num) // 2
            self._tline(chave_num[:half], size=5.5, align='center', lh=self.LH_SM)
            self._tline(chave_num[half:], size=5.5, align='center', lh=self.LH_SM)

        protocolo = self.venda.protocolo_nfe or ''
        if protocolo:
            self._tline(f'Protocolo: {protocolo}', size=6, align='center')

        self.y -= 2 * mm

        if is_homologacao:
            self._txt('SEM VALOR FISCAL - HOMOLOGAÇÃO', size=7, bold=True,
                      align='center', color=(0.8, 0, 0))
            self._adv(self.LH)

        self.y -= 3 * mm  # margem inferior