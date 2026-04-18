from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from .models import Catalogo, CatalogoItem
from .serializers import CatalogoSerializer, CatalogoItemSerializer
import logging
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
import urllib.request
from PIL import Image as PILImage

logger = logging.getLogger(__name__)

class CatalogoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar catálogos completos com seus itens.
    Aceita o payload do frontend: {nome_catalogo, descricao, itens: [{id_produto, ...}]}
    """
    queryset = Catalogo.objects.prefetch_related('itens__produto').all()
    serializer_class = CatalogoSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ativo']
    search_fields = ['nome_catalogo', 'descricao']
    ordering_fields = ['data_cadastro', 'nome_catalogo']
    ordering = ['-data_cadastro']
    
    def create(self, request, *args, **kwargs):
        """Override create para logging detalhado"""
        try:
            print(f"{'='*60}")
            print(f" POST /api/catalogos/ recebido")
            print(f" request.data = {request.data}")
            print(f" request.data.keys() = {list(request.data.keys())}")
            print(f" Content-Type = {request.content_type}")
            print(f" Authorization presente = {bool(request.META.get('HTTP_AUTHORIZATION'))}")
            print(f"{'='*60}")
        except Exception as e:
            print(f" Erro ao logar payload: {e}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f" Erros de validação: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        logger.info(f" Catálogo criado com sucesso: ID={serializer.data.get('id')}")
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=False, methods=['get'], url_path='ativos')
    def catalogos_ativos(self, request):
        """Retorna apenas catálogos ativos"""
        catalogos = self.queryset.filter(ativo=True)
        serializer = self.get_serializer(catalogos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='gerar-pdf')
    def gerar_pdf(self, request, pk=None):
        """Gera PDF do catálogo com todos os produtos e suas imagens"""
        catalogo = self.get_object()
        
        # Criar buffer em memória
        buffer = io.BytesIO()
        
        # Criar documento PDF
        doc = SimpleDocTemplate(buffer, pagesize=A4,
                                rightMargin=1.5*cm, leftMargin=1.5*cm,
                                topMargin=2*cm, bottomMargin=2*cm)
        
        # Container para elementos
        elements = []
        
        # Estilos
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=20,
            alignment=TA_CENTER
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#7f8c8d'),
            spaceAfter=15,
            alignment=TA_CENTER
        )
        
        product_name_style = ParagraphStyle(
            'ProductName',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=3,
            fontName='Helvetica-Bold'
        )
        
        product_price_style = ParagraphStyle(
            'ProductPrice',
            parent=styles['Normal'],
            fontSize=14,
            textColor=colors.HexColor('#27ae60'),
            fontName='Helvetica-Bold',
            spaceAfter=3
        )
        
        product_desc_style = ParagraphStyle(
            'ProductDesc',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#7f8c8d'),
            spaceAfter=3
        )
        
        # Título
        elements.append(Paragraph(catalogo.nome_catalogo, title_style))
        
        # Descrição
        if catalogo.descricao:
            elements.append(Paragraph(catalogo.descricao, subtitle_style))
        
        # Data de geração
        data_geracao = datetime.now().strftime('%d/%m/%Y %H:%M')
        elements.append(Paragraph(f'Gerado em: {data_geracao}', subtitle_style))
        elements.append(Spacer(1, 0.5*cm))
        
        # Produtos
        itens = catalogo.itens.select_related('produto').filter(ativo=True).order_by('ordem')
        
        if itens.exists():
            # Layout em grade: 3 produtos por linha
            produtos_por_linha = 3
            card_width = 5.5*cm
            img_size = 4*cm
            
            row_data = []
            row_atual = []
            
            for item in itens:
                produto = item.produto
                valor = item.valor_catalogo if item.valor_catalogo else (produto.valor_venda if hasattr(produto, 'valor_venda') else 0)
                valor_formatado = f'R$ {valor:.2f}' if valor else 'Consulte'
                
                # Imagem do produto
                img_element = None
                if produto.imagem_url:
                    try:
                        # Baixar imagem
                        img_data = urllib.request.urlopen(produto.imagem_url, timeout=5).read()
                        img_buffer = io.BytesIO(img_data)
                        
                        # Abrir com PIL para verificar e redimensionar
                        pil_img = PILImage.open(img_buffer)
                        
                        # Redimensionar mantendo proporção
                        pil_img.thumbnail((300, 300), PILImage.Resampling.LANCZOS)
                        
                        # Salvar em buffer
                        final_buffer = io.BytesIO()
                        pil_img.save(final_buffer, format='PNG', optimize=True)
                        final_buffer.seek(0)
                        
                        # Criar imagem ReportLab
                        img_element = Image(final_buffer, width=img_size, height=img_size)
                    except Exception as e:
                        # Se falhar, usar placeholder de texto
                        img_element = Paragraph('[Sem imagem]', product_desc_style)
                else:
                    img_element = Paragraph('[Sem imagem]', product_desc_style)
                
                # Montar card
                card_data = [
                    [img_element],
                    [Paragraph(produto.nome_produto[:50], product_name_style)],
                    [Paragraph(valor_formatado, product_price_style)]
                ]
                
                if produto.codigo_produto:
                    card_data.append([Paragraph(f'Cód: {produto.codigo_produto}', product_desc_style)])
                
                # Criar tabela do card
                card_table = Table(card_data, colWidths=[card_width])
                card_table.setStyle(TableStyle([
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e0e0e0')),
                    ('BACKGROUND', (0, 0), (-1, -1), colors.white),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ('LEFTPADDING', (0, 0), (-1, -1), 5),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ]))
                
                row_atual.append(card_table)
                
                # Se completou uma linha ou é o último item
                if len(row_atual) == produtos_por_linha or item == itens.last():
                    # Preencher linha com células vazias se necessário
                    while len(row_atual) < produtos_por_linha:
                        row_atual.append('')
                    
                    row_data.append(row_atual)
                    row_atual = []
            
            # Criar tabela principal com os cards
            main_table = Table(row_data, colWidths=[card_width] * produtos_por_linha)
            main_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            
            elements.append(main_table)
            elements.append(Spacer(1, 0.5*cm))
            
            # Rodapé
            footer_style = ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.HexColor('#95a5a6'),
                alignment=TA_CENTER
            )
            elements.append(Paragraph(f'Total de produtos: {itens.count()}', footer_style))
        else:
            elements.append(Paragraph('Nenhum produto ativo neste catálogo.', subtitle_style))
        
        # Construir PDF
        doc.build(elements)
        
        # Preparar resposta
        buffer.seek(0)
        filename = f'catalogo_{catalogo.id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        logger.info(f'PDF gerado para catálogo ID={catalogo.id}')
        return response
    
    @action(detail=True, methods=['post'], url_path='enviar-whatsapp')
    def enviar_whatsapp(self, request, pk=None):
        """Envia catálogo via WhatsApp"""
        catalogo = self.get_object()
        numero = request.data.get('numero')
        
        if not numero:
            return Response(
                {'error': 'Número do WhatsApp é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar número (remover caracteres não numéricos)
        numero_limpo = ''.join(filter(str.isdigit, numero))
        
        if len(numero_limpo) < 10:
            return Response(
                {'error': 'Número de WhatsApp inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar produtos ativos
        itens = catalogo.itens.select_related('produto').filter(ativo=True).order_by('ordem')
        
        if not itens.exists():
            return Response(
                {'error': 'Não há produtos ativos neste catálogo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Construir mensagem
        mensagem = f'*{catalogo.nome_catalogo}*%0A%0A'
        
        if catalogo.descricao:
            mensagem += f'{catalogo.descricao}%0A%0A'
        
        mensagem += f' *Lista de Produtos:*%0A%0A'
        
        for idx, item in enumerate(itens, 1):
            produto = item.produto
            mensagem += f'{idx}. *{produto.nome_produto}*%0A'
            if produto.codigo_produto:
                mensagem += f'   Código: {produto.codigo_produto}%0A'
            if produto.descricao:
                desc = produto.descricao[:100] + '...' if len(produto.descricao) > 100 else produto.descricao
                mensagem += f'   {desc}%0A'
            mensagem += '%0A'
        
        mensagem += f'%0A_Catálogo gerado em {datetime.now().strftime("%d/%m/%Y às %H:%M")}_'
        
        # URL do WhatsApp Web/App
        whatsapp_url = f'https://wa.me/{numero_limpo}?text={mensagem}'
        
        logger.info(f'Link WhatsApp gerado para catálogo ID={catalogo.id}, número={numero_limpo}')
        
        return Response({
            'success': True,
            'message': 'Link gerado com sucesso',
            'whatsapp_url': whatsapp_url,
            'numero': numero_limpo,
            'total_produtos': itens.count()
        })
    
    @action(detail=True, methods=['post'], url_path='ativar')
    def ativar(self, request, pk=None):
        """Ativa um catálogo"""
        catalogo = self.get_object()
        catalogo.ativo = True
        catalogo.save()
        serializer = self.get_serializer(catalogo)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='desativar')
    def desativar(self, request, pk=None):
        """Desativa um catálogo"""
        catalogo = self.get_object()
        catalogo.ativo = False
        catalogo.save()
        serializer = self.get_serializer(catalogo)
        return Response(serializer.data)


class WhatsAppViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'], url_path='enviar-catalogo')
    def enviar_catalogo(self, request):
        """Endpoint para enviar catálogo via WhatsApp"""
        numero = request.data.get('numero')
        
        if not numero:
            return Response(
                {'error': 'Número do WhatsApp é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar produtos ativos do catálogo
        catalogo = CatalogoItem.objects.filter(ativo=True).select_related('produto')
        
        if not catalogo.exists():
            return Response(
                {'error': 'Não há produtos ativos no catálogo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Aqui você implementará a lógica de envio para WhatsApp
        # Por enquanto, apenas retornamos sucesso
        
        return Response({
            'message': 'Catálogo enviado com sucesso',
            'numero': numero,
            'total_produtos': catalogo.count()
        })
