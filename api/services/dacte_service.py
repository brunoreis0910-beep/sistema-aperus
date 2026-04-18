import io
import logging
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode import code128
from reportlab.lib.colors import black
from datetime import datetime
import qrcode
from io import BytesIO
from reportlab.lib.utils import ImageReader

logger = logging.getLogger(__name__)

class DacteGenerator:
    """
    Gerador simplificado de DACTE (Documento Auxiliar do Conhecimento de Transporte Eletrônico)
    Layout para CTe 4.00 (Modelo 57)
    """
    def __init__(self, cte):
        self.cte = cte
        self.width, self.height = A4
        self.c = None

    def gerar_pdf(self):
        """Gera o PDF do DACTE e retorna o buffer (bytes)"""
        buffer = io.BytesIO()
        self.c = canvas.Canvas(buffer, pagesize=A4)
        self.c.setTitle(f"DACTE {self.cte.numero_cte}")
        
        # Dados Empresa
        from api.models import EmpresaConfig
        empresa = EmpresaConfig.get_ativa()
        
        # 1. Topo: Emitente, DACTE, Chave
        self._desenhar_cabecalho(empresa)
        
        # 2. Tomador e Atores
        self._desenhar_atores()
        
        # 3. Informações da Carga e Serviço
        self._desenhar_servico_carga()
        
        # 4. Impostos
        self._desenhar_impostos()
        
        # 5. Documentos Originários
        self._desenhar_documentos()
        
        # 6. Rodapé (Obs)
        self._desenhar_rodape()
        
        # Marca d'água se homologação
        if empresa and empresa.ambiente_nfe == '2': # Usando flag NFe para CTe por enquanto
            self._desenhar_marca_dagua()
            
        self.c.showPage()
        self.c.save()
        buffer.seek(0)
        return buffer

    def _rect(self, x, y, w, h):
        self.c.rect(x*mm, y*mm, w*mm, h*mm)

    def _text(self, x, y, text, size=8, align="left", font="Helvetica"):
        self.c.setFont(font, size)
        if text is None: text = ""
        else: text = str(text)
            
        if align == "center": self.c.drawCentredString(x*mm, y*mm, text)
        elif align == "right": self.c.drawRightString(x*mm, y*mm, text)
        else: self.c.drawString(x*mm, y*mm, text)
            
    def _text_bold(self, x, y, text, size=8, align="left"):
        self._text(x, y, text, size=size, align=align, font="Helvetica-Bold")
        
    def _field_box(self, x, y, w, h, label, value, align="left", size_val=9):
        self._rect(x, y, w, h)
        self._text(x+1, y+h-3, label, size=6)
        self._text_bold(x+1 if align=="left" else x+w-1, y+2, str(value)[:50], size=size_val, align=align)

    def _desenhar_cabecalho(self, empresa):
        # Box superior completo (linha 1)
        y_topo = 267
        
        # Box 1: Emitente (esquerda)
        self._rect(10, y_topo, 68, 20)
        self._text(11, y_topo+17, "REMETENTE/EXPEDIDOR", 5)
        if empresa:
            # Logo da empresa (se existir)
            x_text = 11
            if empresa.logo_url:
                try:
                    import os
                    from PIL import Image
                    import requests
                    
                    # Verificar se é URL ou caminho local
                    if empresa.logo_url.startswith('http://') or empresa.logo_url.startswith('https://'):
                        # URL - baixar logo
                        response = requests.get(empresa.logo_url, timeout=3)
                        if response.status_code == 200:
                            img_buffer = BytesIO(response.content)
                    else:
                        # Arquivo local - tentar diferentes caminhos
                        possible_paths = [
                            empresa.logo_url,
                            os.path.join(os.getcwd(), empresa.logo_url),
                            os.path.join(os.getcwd(), 'static', empresa.logo_url),
                            os.path.join(os.getcwd(), 'static', 'logos', empresa.logo_url),
                            os.path.join(os.getcwd(), 'media', empresa.logo_url),
                            os.path.join(os.getcwd(), 'staticfiles', 'logos', empresa.logo_url),
                        ]
                        
                        img_buffer = None
                        for path in possible_paths:
                            if os.path.exists(path):
                                with open(path, 'rb') as f:
                                    img_buffer = BytesIO(f.read())
                                break
                    
                    if img_buffer:
                        # Desenhar logo no canto esquerdo
                        logo_size = 15*mm
                        self.c.drawImage(ImageReader(img_buffer), 11*mm, (y_topo+2)*mm, 
                                       width=logo_size, height=logo_size, preserveAspectRatio=True, mask='auto')
                        x_text = 28
                        
                except Exception as e:
                    logger.warning(f"Erro ao carregar logo: {e}")
                    x_text = 11
            
            self._text_bold(x_text, y_topo+12, empresa.nome_razao_social[:25], 7)
            self._text(x_text, y_topo+8, f"{empresa.endereco}, {empresa.numero}"[:30], 5)
            self._text(x_text, y_topo+5, f"{empresa.cidade}-{empresa.estado}", 5)
            self._text(x_text, y_topo+1.5, f"CNPJ: {empresa.cpf_cnpj}", 5)
        
        # Box 2: DACTE (centro)
        self._rect(78, y_topo, 37, 20)
        self._text_bold(96.5, y_topo+15, "DACTE", 11, align="center")
        self._text(96.5, y_topo+11.5, "Documento Auxiliar do", 4.5, align="center")
        self._text(96.5, y_topo+8.5, "Conhecimento de Transporte", 4.5, align="center")
        self._text(96.5, y_topo+5.5, "Eletrônico", 4.5, align="center")
        
        # Dados MOD/MODELO em linha
        self._text(80, y_topo+2, "MODAL", 5)
        self._text_bold(80, y_topo-0.5, "RODOVIÁRIO", 5)
        self._text(99, y_topo+2, "MODELO", 5)
        self._text_bold(101, y_topo-0.5, str(self.cte.modelo), 6)
        
        # Box 3: SÉRIE (pequeno)
        self._rect(115, y_topo, 14, 20)
        self._text(116, y_topo+17, "SÉRIE", 5)
        self._text_bold(122, y_topo+9, str(self.cte.serie_cte), 12, align="center")
        
        # Box 4: DOCUMENTO/NÚMERO
        self._rect(129, y_topo, 22, 20)
        self._text(130, y_topo+17, "DOCUMENTO", 5)
        self._text_bold(140, y_topo+9, str(self.cte.numero_cte), 12, align="center")
        
        # Box 5: Protocolo
        self._rect(151, y_topo+10, 22, 10)
        self._text(152, y_topo+17, "PROTOCOLO", 4.5)
        protocolo_texto = str(self.cte.protocolo_cte or "")[:15]
        self._text(152, y_topo+12.5, protocolo_texto, 5)
        
        # Box 6: Data Emissão
        self._rect(151, y_topo, 22, 10)
        self._text(152, y_topo+7, "DATA EMISSÃO", 4.5)
        data_emissao = self.cte.data_emissao.strftime("%d/%m/%Y") if hasattr(self.cte, 'data_emissao') and self.cte.data_emissao else ""
        self._text(152, y_topo+2.5, data_emissao, 6)
        
        # Box 7: FL (Folha)
        self._rect(173, y_topo, 27, 20)
        self._text(174, y_topo+17, "FL", 5)
        self._text_bold(186.5, y_topo+9, "1/1", 11, align="center")
        
        # QR Code no topo direito
        if self.cte.qrcode_url:
            self._desenhar_qrcode()
        
        # Box único: Chave de Acesso + Protocolo + Consulta (UNIFICADO)
        y_chave = 253
        if self.cte.chave_cte:
            # Box único grande para chave, protocolo e consulta
            self._rect(10, 227, 190, 26)
            self._text(11, 250, "CHAVE DE ACESSO", 6)
            
            # Código de barras no topo
            try:
                barcode = code128.Code128(self.cte.chave_cte, barHeight=8*mm, barWidth=0.22*mm)
                barcode.drawOn(self.c, 48*mm, 244*mm)
            except:
                pass
            
            # Texto da chave embaixo do código de barras
            self._text(105, 240, self.cte.chave_cte, 6, align="center")
            
            # Protocolo e Consulta dentro do mesmo box
            self._text(11, 236, "PROTOCOLO DE AUTORIZAÇÃO DE USO", 5)
            self._text_bold(11, 231, str(self.cte.protocolo_cte or "Não Autorizado")[:30], 7)
            
            self._text(100, 236, "CONSULTA", 5)
            self._text(100, 231, "http://www.cte.fazenda.gov.br/portal/consultaRecaptcha.aspx"[:55], 5)

    def _desenhar_atores(self):
        y = 218
        # Linha: PRESTAÇÃO DO SERVIÇO (altura aumentada de 9mm para 10mm)
        self._rect(10, y, 190, 10)
        self._text(11, y+7, "CFOP - NATUREZA DA OPERAÇÃO", 5)
        self._text_bold(11, y+2, "PRESTAÇÃO DE SERVIÇO DE TRANSPORTE A ESTABELECIMENTO COMERCIAL"[:75], 7)
        
        y -= 14
        # Tomador
        tomador_label = "REMETENTE" if self.cte.tomador_servico == 0 else "DESTINATÁRIO" if self.cte.tomador_servico == 3 else "OUTROS"
        tomador_obj = None
        if self.cte.tomador_servico == 0: tomador_obj = self.cte.remetente
        elif self.cte.tomador_servico == 3: tomador_obj = self.cte.destinatario
        elif self.cte.tomador_servico == 4: tomador_obj = self.cte.tomador_outros
        
        # Coluna 1: Remetente (altura aumentada de 14mm para 16mm)
        self._rect(10, y, 95, 16)
        self._text(11, y+13, "REMETENTE", 5)
        if self.cte.remetente:
            self._text_bold(11, y+9, self.cte.remetente.nome_razao_social[:42], 7)
            self._text(11, y+5.5, f"{self.cte.remetente.endereco}, {self.cte.remetente.numero}"[:45], 5.5)
            self._text(11, y+2, f"CIDADE: {self.cte.remetente.cidade} | CNPJ: {self.cte.remetente.cpf_cnpj}"[:50], 5)
            
        # Coluna 2: Destinatário (altura aumentada de 14mm para 16mm)
        self._rect(105, y, 95, 16)
        self._text(106, y+13, "DESTINATÁRIO", 5)
        if self.cte.destinatario:
            self._text_bold(106, y+9, self.cte.destinatario.nome_razao_social[:42], 7)
            self._text(106, y+5.5, f"{self.cte.destinatario.endereco}, {self.cte.destinatario.numero}"[:45], 5.5)
            self._text(106, y+2, f"CIDADE: {self.cte.destinatario.cidade} | CNPJ: {self.cte.destinatario.cpf_cnpj}"[:50], 5)

    def _desenhar_servico_carga(self):
        y = 179
        # Produto e Valores (altura aumentada de 9mm para 11mm)
        self._field_box(10, y, 97, 11, "PRODUTO PREDOMINANTE", self.cte.produto_predominante or "Diversos", size_val=8)
        self._field_box(107, y, 43, 11, "VALOR TOTAL, SERV.", f"R$ {self.cte.valor_total_servico:.2f}", align="right", size_val=9)
        self._field_box(150, y, 50, 11, "VALOR A RECEBER", f"R$ {self.cte.valor_receber:.2f}", align="right", size_val=9)
        
        y -= 14
        # Pesos e Volumes (altura aumentada de 9mm para 11mm)
        self._field_box(10, y, 28, 11, "PESO BRUTO (KG)", f"{self.cte.peso_bruto:.2f}", align="right", size_val=7)
        self._field_box(38, y, 28, 11, "PESO BC (KG)", f"{self.cte.peso_bruto:.2f}", align="right", size_val=7)
        # VOLUMES - texto mais à direita para não cortar
        self._rect(66, y, 25, 11)
        self._text(67, y+8, "VOLUMES", 5)
        self._text_bold(80, y+3, str(self.cte.volumes), 6, align="center")
        
        self._field_box(91, y, 38, 11, "VALOR CARGA", f"R$ {self.cte.valor_carga:.2f}", align="right", size_val=7)
        self._field_box(129, y, 35, 11, "RNTRC", self.cte.rntrc if hasattr(self.cte, 'rntrc') else "", size_val=7)
        # MEDIDA - texto mais à direita para não cortar
        self._rect(164, y, 36, 11)
        self._text(165, y+8, "MEDIDA", 5)
        self._text_bold(184, y+3, "1:1", 6, align="center")

    def _desenhar_impostos(self):
        y = 142
        # Componentes do Valor (altura aumentada de 18mm para 22mm)
        self._rect(10, y, 190, 22)
        self._text(11, y+18, "COMPONENTES DO VALOR DA PRESTAÇÃO DO SERVIÇO", 5)
        
        # Tabela de componentes
        self._text(12, y+14, "NOME", 5)
        self._text(90, y+14, "VALOR", 5, align="right")
        self._text(130, y+14, "QUANTIDADE", 5, align="right")
        self._text(185, y+14, "MEDIDA", 5, align="right")
        
        # Linha exemplo
        linha_y = y + 9
        self._text(12, linha_y, "QUANTIDADE (CTE)", 6)
        self._text(90, linha_y, f"{self.cte.valor_total_servico:.2f}", 6, align="right")
        self._text(130, linha_y, "2.000", 6, align="right")
        self._text(185, linha_y, "1:1", 6, align="right")
        
        y -= 25
        # Prestação do serviço (Desce para 117mm -> EVITAR SOBREPOSIÇÃO COM DOCS QUE COMEÇA EM 120mm)
        # CORRIDO: Ajustando y para não sobrepor.
        # Documentos começa em 120mm e vai até 142mm? NÃO.
        # Vamos reorganizar as alturas.
        
        # Antes:
        # Docs: y=120, h=22 -> 120 a 142
        # Impostos (Comp): y=142, h=22 -> 142 a 164
        # Impostos (Prest): y=117, h=12 -> 117 a 129 (SOBREPÕE DOCS)
        
        # Solução:
        # Baixar Docs para y=95 (H=22 -> 95 a 117)
        # Manter Impostos (Prest) em y=117 (H=12 -> 117 a 129)
        
        self._field_box(10, y, 90, 12, "PRESTAÇÃO DO SERVIÇO", f"VALOR A RECEBER: R$ {self.cte.valor_receber:.2f}", size_val=7)
        self._field_box(100, y, 100, 12, "IMPOSTOS / OBSERVAÇÕES FISCAIS", "ICMS: Simples Nacional", size_val=6)

    def _desenhar_documentos(self):
        # Ajustado para ficar ABAIXO da Prestação do Serviço
        # Se Prestação termina em 117 (y base), Docs deve começar abaixo de 117
        y = 93 
        # Altura 22mm -> 93 a 115
        self._rect(10, y, 190, 22)
        self._text(11, y+18, "DOCUMENTOS ORIGINÁRIOS", 5)
        
        # Cabeçalho tabela
        self._text(12, y+14, "TIPO DOC", 5)
        self._text(35, y+14, "CHAVE ACESSO NFE", 5)
        self._text(110, y+14, "SÉRIE", 5)
        self._text(135, y+14, "NRO. DOCUMENTO", 5)
        self._text(185, y+14, "VALOR", 5, align="right")
        
        # Buscar Docs Linked
        from cte.models import CTeDocumentoOriginario
        docs = CTeDocumentoOriginario.objects.filter(cte=self.cte)[:2]  # Limitar a 2 docs
        
        doc_y = y + 10
        for d in docs:
            self._text(12, doc_y, "NF-e", 5)
            chave = d.chave_nfe[:44] if d.chave_nfe else ""
            # Chave NFe ajustada para aparecer corretamente
            self._text(30, doc_y, chave, 5)
            self._text(110, doc_y, "890", 5)
            doc_y -= 4
            
        if not docs:
            self._text(15, y+10, "Sem documentos vinculados.", 6)

    def _desenhar_rodape(self):
        # Área inferior: Uso exclusivo e Reservado ao fisco (Movido para baixo y=12 para abrir espaço)
        y_inf = 12
        self._rect(10, y_inf, 95, 43)
        self._text(11, y_inf+39, "USO EXCLUSIVO DO EMISSOR DO CT-e", 5)
        self._text(11, y_inf+4, "RESERVADO AO EMISSOR", 6)
        
        self._rect(105, y_inf, 95, 43)
        self._text(106, y_inf+39, "RESERVADO AO FISCO", 5)

        # Área de observações (Começa acima do inferior)
        # Inferior vai de 12 a 55 (12+43)
        # Documentos termina em 93.
        # Espaço disponível: 93 - 55 = 38mm
        y_obs = 55
        self._rect(10, y_obs, 190, 38)
        
        # Ajustando posição do título e texto
        self._text(11, y_obs+33, "OBSERVAÇÕES", 6)
        
        obs_linhas = []
        obs_linhas.append("Este conhecimento de transporte atende a legislação atual em vigor.")
        obs_linhas.append(f"Motorista: {getattr(self.cte, 'condutor_nome', 'Não informado')[:40]}")
        placa = getattr(self.cte, 'placa_veiculo', None) or 'Não informada'
        obs_linhas.append(f"Veículo Placa: {placa[:20]}")
        
        text_obj = self.c.beginText(12*mm, (y_obs+27)*mm)
        text_obj.setFont("Helvetica", 6)
        text_obj.setLeading(9)  # Espaçamento entre linhas
        for line in obs_linhas:
            text_obj.textLine(line)
        self.c.drawText(text_obj)

    def _desenhar_qrcode(self):
        """Gera e desenha o QR Code no DACTE (topo direito)"""
        try:
            # Gerar QR Code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=3,
                border=1,
            )
            qr.add_data(self.cte.qrcode_url)
            qr.make(fit=True)
            
            # Criar imagem do QR Code
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Converter para formato que reportlab aceita
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            # Desenhar QR Code no PDF - dentro do box FL perfeitamente centralizado
            qr_size = 18*mm  # Tamanho do QR Code (box FL tem 27mm de largura)
            qr_x = 177.5*mm  # Centralizado no box FL (173mm + (27mm-18mm)/2 = 177.5mm)
            qr_y = 268.5*mm  # Centralizado verticalmente (267mm + margem)
            
            self.c.drawImage(ImageReader(buffer), qr_x, qr_y, qr_size, qr_size, preserveAspectRatio=True)
            
        except Exception as e:
            logger.warning(f"Erro ao gerar QR Code no DACTE: {e}")

    def _desenhar_marca_dagua(self):
        self.c.saveState()
        self.c.translate(105*mm, 148*mm)
        self.c.rotate(45)
        self.c.setFillColorRGB(0.8, 0.8, 0.8, 0.3)
        self.c.setFont("Helvetica-Bold", 60)
        self.c.drawCentredString(0, 0, "SEM VALOR FISCAL")
        self.c.restoreState()
