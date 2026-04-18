import io
import logging
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black, white
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from decimal import Decimal
from datetime import datetime

logger = logging.getLogger(__name__)

class DPSGenerator:
    def __init__(self, os_obj):
        self.os = os_obj
        self.width, self.height = A4
        self.c = None
        self.empresa = None

    def gerar_pdf(self):
        """Gera o PDF da DPS e retorna o buffer (bytes)"""
        buffer = io.BytesIO()
        self.c = canvas.Canvas(buffer, pagesize=A4)
        
        # Obter Configuração
        from api.models import EmpresaConfig
        self.empresa = EmpresaConfig.get_ativa()
        is_homologacao = hasattr(self.empresa, 'ambiente_nfse') and self.empresa.ambiente_nfse == '2'

        self.c.setTitle(f"DANFSe - OS {self.os.id_os}")
        
        # LAYOUT DANFSe PADRÃO
        
        # Y Start (Top of page)
        y = 285
        
        # 1. Header (Logo | Title | Prefeitura)
        y = self._draw_header(y)
        
        # 2. Chave de Acesso / QR Code
        y = self._draw_keys_block(y)
        
        # 3. Info Row (Num, Comp, Dt, DPS...)
        y = self._draw_info_row(y)
        
        # 4. Prestador
        y = self._draw_prestador(y)
        
        # 5. Tomador
        y = self._draw_tomador(y)
        
        # 6. Intermediário (Placeholder empty)
        y = self._draw_intermediario(y)
        
        # 7. Serviço Prestado / Itens
        y = self._draw_servicos(y)
        
        # 8. Tributação Municipal
        y = self._draw_tributos_municipais(y)
        
        # 9. Tributação Federal
        y = self._draw_tributos_federais(y)
        
        # 10. Totais
        y = self._draw_totais(y)
        
        # 11. Info Compl
        self._draw_info_compl(y)
        
        # MArka D'agua
        if is_homologacao:
            self._draw_watermark()
        
        self.c.showPage()
        self.c.save()
        buffer.seek(0)
        return buffer

    # --- DRAWING HELPER METHODS ---

    def _rect(self, x, y, w, h, fill=0):
        self.c.rect(x*mm, y*mm, w*mm, h*mm, fill=fill)

    def _line(self, x1, y1, x2, y2):
        self.c.line(x1*mm, y1*mm, x2*mm, y2*mm)

    def _text(self, x, y, text, size=7, font="Helvetica", align="left", width=None):
        self.c.setFont(font, size)
        text = str(text) if text is not None else ""
        
        if align == "center":
            self.c.drawCentredString(x*mm, y*mm, text)
        elif align == "right":
            self.c.drawRightString(x*mm, y*mm, text)
        else:
            self.c.drawString(x*mm, y*mm, text)

    def _text_bold(self, x, y, text, size=7, align="left", width=None):
        self._text(x, y, text, size, "Helvetica-Bold", align, width)

    def _field_label_val(self, x, y, w, label, value, label_size=5, val_size=7, align="left"):
        # Helper for standard fields: Label tiny above, Value bold below
        self._text(x, y + 2.5, label, size=label_size)
        
        # Truncate value if needed (simplified)
        str_val = str(value) if value is not None else "-"
        self._text_bold(x, y, str_val, size=val_size, align=align)

    def _box_with_label(self, x, y, w, h, label, value, align="left"):
        self._rect(x, y, w, h)
        self._text(x+1, y+h-2.5, label, size=5)
        self._text_bold(x+1 if align=="left" else x+w-1, y+2, str(value or ""), size=7, align=align)

    # --- SECTIONS ---

    def _draw_header(self, y):
        h = 20
        y_start = y
        y_bot = y - h
        
        # Outer Box
        self._rect(10, y_bot, 190, h)
        
        # Left Logo Area (Placeholder)
        self._rect(10, y_bot, 30, h)
        self.c.setFillColorRGB(0.1, 0.6, 0.3)
        self._text_bold(25, y_bot + 10, "NFSe", size=18, align="center")
        self._text(25, y_bot + 5, "Nota Fiscal de", size=5, align="center")
        self._text(25, y_bot + 2, "Serviço Eletrônica", size=5, align="center")
        self.c.setFillColor(black)
        
        # Center Title
        self._text_bold(105, y_bot + 12, "DANFSe v1.0", size=10, align="center")
        self._text(105, y_bot + 8, "Documento Auxiliar da NFS-e", size=9, align="center")
        
        # Right Municipality
        # Tenta pegar nome da cidade da empresa ou padrão
        muni = self.empresa.cidade.upper() if self.empresa and self.empresa.cidade else "MUNICIPIO"
        self._text_bold(170, y_bot + 12, f"Prefeitura Municipal de", size=7, align="center")
        self._text_bold(170, y_bot + 8, muni, size=8, align="center")
        self._text(170, y_bot + 4, "Secretaria Municipal de Fazenda", size=5, align="center")
        
        return y_bot

    def _draw_keys_block(self, y):
        h = 15
        y_bot = y - h
        self._rect(10, y_bot, 190, h)
        
        # Obter chave real se existir
        chave_real = getattr(self.os, 'chave_nfse', None)
        status_nfse = getattr(self.os, 'status_nfse', 'Não Emitida')
        
        if chave_real and status_nfse == 'Autorizada':
            chave_display = chave_real
            # Link oficial de produção ou homologação conforme chave (simplificado para link nacional)
            qr_data = f"https://nfse-nacional.receita.fazenda.gov.br/consulta/{chave_display}"
            label_chave = "Chave de Acesso da NFS-e"
            generate_qr = True
        else:
            # Chave Fictícia para Layout de DPS
            # Formato: 00000000(ID_OS) + DDMMYYYY + Zeros (Total 33 chars approx)
            # Mas vamos usar algo mais claro que é SIMULACAO
            chave_display = f"00000000{self.os.id_os:010d}{datetime.now().strftime('%d%m%Y')}00000000"
            # Não gerar QR Code para nota não transmitida para evitar links quebrados
            qr_data = None
            label_chave = "Chave de Acesso (DADOS PROVISÓRIOS)"
            generate_qr = False

        # Chave Acesso Label
        self._text(12, y - 4, label_chave, size=6)
        
        # Chave Value
        self._text_bold(12, y - 8, chave_display, size=8)
        
        # QR Code AREA
        if generate_qr and qr_data:
            try:
                qr_code = qr.QrCodeWidget(qr_data)
                bounds = qr_code.getBounds()
                width = bounds[2] - bounds[0]
                height = bounds[3] - bounds[1]
                
                # Tamanho desejado do QR
                qr_size = 13 * mm 
                
                # Escala
                scale_x = qr_size / width
                scale_y = qr_size / height
                
                d = Drawing(qr_size, qr_size, transform=[scale_x, 0, 0, scale_y, 0, 0])
                d.add(qr_code)
                
                # Posição
                renderPDF.draw(d, self.c, 172 * mm, (y_bot + 1) * mm)
                
            except Exception as e:
                logger.error(f"Erro ao gerar QR Code: {e}")
                self._draw_qr_placeholder(y_bot)
        else:
            # Placeholder visual se não tiver QR
            self._draw_qr_placeholder(y_bot, text="SEM QR CODE\n(Não Transmitida)")
        
        return y_bot

    def _draw_qr_placeholder(self, y_bot, text="QR CODE ERROR"):
        self._rect(170, y_bot + 1, 28, 13)
        
        # Draw multiline text centered
        self.c.setFont("Helvetica", 4)
        lines = text.split('\n')
        curr_y = y_bot + 8
        if len(lines) > 1: curr_y += 2
            
        for line in lines:
            self.c.drawCentredString(184 * mm, curr_y * mm, line)
            curr_y -= 2

    def _draw_info_row(self, y):
        h = 12
        y_bot = y - h
        self._rect(10, y_bot, 190, h)
        
        # Cols: Num NFSe | Competencia | Data Emi NFSe | Num DPS | Serie DPS | Data Emi DPS
        # W: 190 total
        cols = [30, 30, 35, 25, 25, 45]
        labels = [
            "Número da NFS-e",
            "Competência da NFS-e",
            "Data e Hora da emissão da NFS-e",
            "Número da DPS",
            "Série da DPS",
            "Data e Hora da emissão da DPS"
        ]
        
        curr_x = 10
        numero_nfse = getattr(self.os, 'numero_nfse', '-') 
        dt_emi = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        comp = datetime.now().strftime("%m/%Y")
        
        # Lógica Número DPS: 1) Do objeto OS (Salvo), 2) Provisório (Sugerido da config + 1)
        if hasattr(self.os, 'numero_dps') and self.os.numero_dps:
             num_dps = str(self.os.numero_dps)
        else:
             # Se não tem salvo, é pré-visualização. Tentar pegar o "próximo"
             try:
                ult_num = getattr(self.empresa, 'ultimo_numero_dps', 0) or 0
                num_dps = f"{ult_num + 1} (Prov.)"
             except:
                num_dps = str(self.os.id_os)
                
        serie = getattr(self.empresa, 'serie_dps', '1') if self.empresa else '1'
        
        values = [numero_nfse, comp, dt_emi, num_dps, serie, dt_emi]

        for i, w in enumerate(cols):
            self._field_label_val(curr_x + 1, y_bot + 2, w, labels[i], values[i])
            curr_x += w
            
        # Add authenticity text on the right (actually looking at the image, text is on right of QR, but let's put slightly below or right)
        # The prompt image has text right below the QR code area usually or side.
        # Let's stick to the row logic for clarity.
            
        return y_bot

    def _draw_prestador(self, y):
        h = 30
        y_bot = y - h
        
        # Title Bar
        self._rect(10, y_bot, 190, h)
        # self._line(10, y - 5, 200, y - 5)
        
        self._text_bold(12, y - 4, "EMITENTE DA NFS-e", size=7)
        self._text(12, y - 7, "Prestador do Serviço", size=6)
        
        # Divide columns
        # Col 1: Name/Dados (Width 100)
        # Col 2: Inscr/Contact (Width 90)
        
        if self.empresa:
            razao = self.empresa.nome_razao_social
            cnpj = self.empresa.cpf_cnpj
            im = self.empresa.inscricao_municipal or "-"
            fone = self.empresa.telefone or ""
            email = self.empresa.email or ""
            end = f"{self.empresa.endereco}, {self.empresa.numero}"
            if self.empresa.bairro: end += f", {self.empresa.bairro}"
            cidade_uf = f"{self.empresa.cidade} - {self.empresa.estado}"
            cep = self.empresa.cep or ""
            regime = self.empresa.regime_tributario or "-"
        else:
            razao = "EMPRESA NÃO CONFIGURADA"
            cnpj, im, fone, email, end, cidade_uf, cep, regime = [""] * 8

        # Line 1: CNPJ
        self._text(80, y - 4, "CNPJ / CPF / NIF", size=5)
        self._text(140, y - 4, "Inscrição Municipal", size=5)
        self._text(175, y - 4, "Telefone", size=5)
        
        self._text_bold(80, y - 7, cnpj)
        self._text_bold(140, y - 7, im)
        self._text_bold(175, y - 7, fone)

        # Line 2: Nome
        self._text(12, y - 10, "Nome / Nome Empresarial", size=5)
        self._text(140, y - 10, "E-mail", size=5)
        
        self._text_bold(12, y - 13, razao)
        self._text_bold(140, y - 13, email)

        # Line 3: Endereco / Muni / CEP
        self._text(12, y - 16, "Endereço", size=5)
        self._text(140, y - 16, "Município", size=5)
        self._text(175, y - 16, "CEP", size=5)
        
        self._text_bold(12, y - 19, end)
        self._text_bold(140, y - 19, cidade_uf)
        self._text_bold(175, y - 19, cep)
        
        # Line 4: Regime
        self._text(12, y - 22, "Simples Nacional na Data de Competência", size=5)
        self._text(140, y - 22, "Regime de Apuração Tributária pelo SN", size=5)
        
        is_simples = "Sim" if regime == 'SIMPLES' or regime == 'MEI' else "Não"
        self._text_bold(12, y - 25, is_simples)
        self._text_bold(140, y - 25, "-")

        return y_bot

    def _draw_tomador(self, y):
        h = 25
        y_bot = y - h
        self._rect(10, y_bot, 190, h)
        
        self._text_bold(12, y - 4, "TOMADOR DO SERVIÇO", size=7)
        
        cli = self.os.id_cliente
        
        if cli:
            nome = cli.nome_razao_social
            doc = cli.cpf_cnpj
            im = cli.inscricao_estadual or "-" # Usando IE como IM aqui ou vazio
            fone = cli.telefone or ""
            email = cli.email or ""
            end = f"{cli.endereco or ''}, {cli.numero or ''}, {cli.bairro or ''}"
            cidade_uf = f"{cli.cidade or ''} - {cli.estado or ''}"
            cep = cli.cep or ""
        else:
            nome = "CONSUMIDOR FINAL"
            doc = "-"
            im = "-"
            fone = "-"
            email = "-"
            end = "-"
            cidade_uf = "-"
            cep = "-"
            
        # Header Row
        self._text(80, y - 4, "CNPJ / CPF / NIF", size=5)
        self._text(140, y - 4, "Inscrição Municipal", size=5)
        self._text(175, y - 4, "Telefone", size=5)
        
        self._text_bold(80, y - 7, doc)
        self._text_bold(140, y - 7, im)
        self._text_bold(175, y - 7, fone)
        
        # Name Row
        self._text(12, y - 10, "Nome / Nome Empresarial", size=5)
        self._text(140, y - 10, "E-mail", size=5)
        
        self._text_bold(12, y - 13, nome)
        self._text_bold(140, y - 13, email)
        
        # Addr Row
        self._text(12, y - 16, "Endereço", size=5)
        self._text(140, y - 16, "Município", size=5)
        self._text(175, y - 16, "CEP", size=5)
        
        self._text_bold(12, y - 19, end)
        self._text_bold(140, y - 19, cidade_uf)
        self._text_bold(175, y - 19, cep)
        
        return y_bot

    def _draw_intermediario(self, y):
        h = 5
        y_bot = y - h
        self._rect(10, y_bot, 190, h)
        self._text(105, y_bot + 1.5, "INTERMEDIÁRIO DO SERVIÇO NÃO IDENTIFICADO NA NFS-e", size=6, align="center")
        return y_bot

    def _draw_servicos(self, y):
        # Header info
        h_header = 15
        y_bot = y - h_header
        self._rect(10, y_bot, 190, h_header)
        
        self._text_bold(12, y - 3, "SERVIÇO PRESTADO", size=7)
        
        # Info Columns
        # Cod Trib Nac | Cod Trib Muni | Local Prestacao | Pais
        self._text(12, y - 6, "Código de Tributação Nacional", size=5)
        self._text(80, y - 6, "Código de Tributação Municipal", size=5)
        self._text(140, y - 6, "Local da Prestação", size=5)
        self._text(175, y - 6, "País da Prestação", size=5)
        
        # Mock values or generic
        self._text_bold(12, y - 9, "01.01.01 - Licenciamento ou cessão...", size=6)
        self._text_bold(80, y - 9, "001 - Licenciamento...", size=6)
        
        muni_prest = self.empresa.cidade if self.empresa else "BRASIL"
        self._text_bold(140, y - 9, f"{muni_prest} - {self.empresa.estado if self.empresa else ''}", size=6)
        self._text_bold(175, y - 9, "Brasil", size=6)
        
        self._text(12, y - 12, "Descrição do Serviço", size=5)

        # Lista de Itens (Box variavel)
        # Vamos fazer um box fixo grande o suficiente ou dinamico
        # Para simplificar aqui, vamos usar um box fixo de altura razoavel
        h_list = 30
        y_list_bot = y_bot - h_list
        self._rect(10, y_list_bot, 190, h_list)
        
        # Render items text
        items = self.os.itens_servicos.all()
        start_text_y = y_bot - 4
        
        text_lines = []
        if items:
            for item in items:
                desc = item.descricao_servico
                val = f"R$ {item.valor_total:.2f}"
                text_lines.append(f"- {desc} ({val})")
        else:
             if self.os.descricao_problema:
                 text_lines.append(self.os.descricao_problema)
             else:
                 text_lines.append("Serviços diversos conforme OS.")
        
        # Draw desc lines
        cur_text_y = y_bot - 16 # Abaixo do header "Descricao do servico"
        for line in text_lines[:6]: # Limit lines
            self._text(12, cur_text_y, line, size=7)
            cur_text_y -= 4
            
        return y_list_bot

    def _draw_tributos_municipais(self, y):
        h = 25
        y_bot = y - h
        self._rect(10, y_bot, 190, h)
        
        self._text_bold(12, y - 3, "TRIBUTAÇÃO MUNICIPAL", size=7)
        
        # Grid layout simulation
        # Row 1
        y_r1 = y - 7
        self._field_label_val(12, y_r1, 50, "Tributação do ISSQN", "Operação Tributável")
        self._field_label_val(70, y_r1, 50, "País Resultado da Prestação do Serviço", "-")
        self._field_label_val(130, y_r1, 50, "Município de Incidência do ISSQN", self.empresa.cidade if self.empresa else "")
        self._field_label_val(170, y_r1, 20, "Regime Especial", "Nenhum")

        # Row 2
        y_r2 = y - 13
        valor_serv = self.os.valor_total_servicos or Decimal('0.00')
        self._field_label_val(12, y_r2, 30, "Valor do Serviço", f"R$ {valor_serv:.2f}")
        self._field_label_val(50, y_r2, 30, "Desconto Incondicionado", "-")
        self._field_label_val(90, y_r2, 30, "Total Deduções/Reduções", "-")
        self._field_label_val(130, y_r2, 30, "Cálculo do BM", "-")
        
        # Row 3
        y_r3 = y - 19
        iss_aliq = Decimal('2.00') # Mock
        iss_val = valor_serv * (iss_aliq / 100)
        
        self._field_label_val(12, y_r3, 30, "BC ISSQN", f"R$ {valor_serv:.2f}")
        self._field_label_val(50, y_r3, 30, "Alíquota Aplicada", f"{iss_aliq:.2f}%")
        self._field_label_val(90, y_r3, 30, "Retenção do ISSQN", "Não Retido")
        self._field_label_val(130, y_r3, 30, "ISSQN Apurado", f"R$ {iss_val:.2f}")
        
        return y_bot

    def _draw_tributos_federais(self, y):
        h = 10
        y_bot = y - h
        self._rect(10, y_bot, 190, h)
        
        self._text_bold(12, y - 3, "TRIBUTAÇÃO FEDERAL", size=7)
        
        # Simplificado
        y_r1 = y - 7
        labels = ["IRRF", "CP", "CSLL", "PIS", "COFINS", "Retenção PIS/COFINS"]
        x_pos = 12
        for l in labels:
            self._field_label_val(x_pos, y_r1, 20, l, "-")
            x_pos += 30
            
        return y_bot

    def _draw_totais(self, y):
        h = 15
        y_bot = y - h
        self._rect(10, y_bot, 190, h)
        
        self._text_bold(12, y - 3, "VALOR TOTAL DA NFS-e", size=7)
        
        valor = self.os.valor_total_servicos or Decimal('0.00')
        
        y_r1 = y - 7
        self._field_label_val(12, y_r1, 40, "Valor do Serviço", f"R$ {valor:.2f}")
        self._field_label_val(60, y_r1, 40, "Desconto Condicionado", "R$ 0,00")
        self._field_label_val(110, y_r1, 40, "Desconto Incondicionado", "R$ 0,00")
        self._field_label_val(160, y_r1, 40, "ISSQN Retido", "-")
        
        y_r2 = y - 12
        self._field_label_val(12, y_r2, 60, "IRRF, CP, CSLL - Retidos", "R$ 0,00")
        self._field_label_val(80, y_r2, 60, "PIS/COFINS Retidos", "-")
        self._field_label_val(160, y_r2, 40, "Valor Líquido da NFS-e", f"R$ {valor:.2f}", val_size=8)
        
        return y_bot

    def _draw_info_compl(self, y):
        h = 20
        y_bot = y - h
        self._rect(10, y_bot, 190, h)
        
        self._text_bold(12, y - 3, "INFORMAÇÕES COMPLEMENTARES", size=7)
        
        # Info texto
        text = "Documento emitido por ME ou EPP optante pelo Simples Nacional."
        if self.os.id_os:
            text += f" Referente à OS {self.os.id_os}."
            
        self._text(12, y - 7, text, size=6)

    def _draw_watermark(self):
        self.c.saveState()
        self.c.translate(105*mm, 148*mm)
        self.c.rotate(45)
        self.c.setFillColorRGB(0.8, 0.8, 0.8, 0.5)
        self.c.setFont("Helvetica-Bold", 60)
        self.c.drawCentredString(0, 0, "SEM VALOR FISCAL")
        self.c.drawCentredString(0, -20*mm, "HOMOLOGAÇÃO / DPS")
        self.c.restoreState()
