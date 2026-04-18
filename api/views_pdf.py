"""
Views para geração de PDFs dinâmicos via IA
Permite que o assistente IA gere relatórios personalizados
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum, Count, Q
from datetime import datetime, date
from decimal import Decimal
import logging

# Importar models
from .models import Venda, Cliente, Produto, VendaItem
# Importar serviço de PDF fiscal
from .services_pdf_fiscal import PDFFiscalService

logger = logging.getLogger(__name__)

# Instância do serviço
pdf_fiscal_service = PDFFiscalService()


class GerarRelatorioPDFView(APIView):
    """
    Gera relatórios customizados em PDF
    
    POST /api/ai/gerar-pdf/
    Body: {
        "tipo": "vendas|financeiro|estoque|customizado",
        "periodo": {"inicio": "2026-03-01", "fim": "2026-03-31"},
        "filtros": {}
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Gera PDF do relatório solicitado"""
        try:
            tipo_relatorio = request.data.get('tipo', 'customizado')
            periodo = request.data.get('periodo', {})
            filtros = request.data.get('filtros', {})
            
            # ===== RELATÓRIOS ESPECÍFICOS (Vendas por Operação, CT-e, etc.) =====
            # Se for vendas_operacao ou vendas com agrupamento por operação
            if tipo_relatorio == 'vendas_operacao' or (tipo_relatorio == 'vendas' and filtros.get('agrupar_por') == 'operacao'):
                try:
                    # Extrair datas do período
                    data_inicio_str = periodo.get('inicio')
                    data_fim_str = periodo.get('fim')
                    
                    if not data_inicio_str or not data_fim_str:
                        return Response({
                            'sucesso': False,
                            'mensagem': 'Período com data de início e fim é obrigatório para relatórios de vendas por operação'
                        }, status=400)
                    
                    data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
                    data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date()
                    
                    # Chamar serviço especializado
                    pdf_buffer = pdf_fiscal_service.gerar_pdf_vendas_operacao(data_inicio, data_fim)
                    
                    # Retornar PDF
                    filename = f'Vendas_por_Operacao_{data_inicio.strftime("%Y%m%d")}_{data_fim.strftime("%Y%m%d")}.pdf'
                    response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
                    response['Content-Disposition'] = f'attachment; filename="{filename}"'
                    
                    return response
                    
                except ValueError as ve:
                    return Response({
                        'sucesso': False,
                        'mensagem': f'Formato de data inválido. Use YYYY-MM-DD. Erro: {str(ve)}'
                    }, status=400)
                except Exception as e:
                    logger.error(f"Erro ao gerar PDF de vendas por operação: {e}", exc_info=True)
                    return Response({
                        'sucesso': False,
                        'mensagem': f'Erro ao gerar relatório: {str(e)}'
                    }, status=500)
            
            # ===== RELATÓRIOS GENÉRICOS =====
            # Importa ReportLab se disponível
            try:
                from reportlab.lib.pagesizes import A4
                from reportlab.lib import colors
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
                from reportlab.lib.units import cm
                from io import BytesIO
                
                # Cria buffer em memória
                buffer = BytesIO()
                
                # Cria documento PDF
                doc = SimpleDocTemplate(
                    buffer,
                    pagesize=A4,
                    rightMargin=2*cm,
                    leftMargin=2*cm,
                    topMargin=2*cm,
                    bottomMargin=2*cm
                )
                
                # Container para elementos do documento
                elements = []
                styles = getSampleStyleSheet()
                
                # Título
                titulo_style = ParagraphStyle(
                    'CustomTitle',
                    parent=styles['Heading1'],
                    fontSize=18,
                    textColor=colors.HexColor('#1976d2'),
                    spaceAfter=20,
                    alignment=1  # Centro
                )
                
                titulo_map = {
                    'vendas': 'Relatório de Vendas',
                    'vendas_operacao': 'Relatório de Vendas por Operação',
                    'financeiro': 'Relatório Financeiro',
                    'estoque': 'Relatório de Estoque',
                    'customizado': 'Relatório Customizado'
                }
                
                titulo = Paragraph(titulo_map.get(tipo_relatorio, 'Relatório'), titulo_style)
                elements.append(titulo)
                elements.append(Spacer(1, 0.5*cm))
                
                # Info do período
                data_inicio = None
                data_fim = None
                
                if periodo.get('inicio') and periodo.get('fim'):
                    periodo_text = f"Período: {periodo['inicio']} a {periodo['fim']}"
                    # Converter strings para datetime
                    try:
                        data_inicio = datetime.strptime(periodo['inicio'], '%Y-%m-%d').date()
                        data_fim = datetime.strptime(periodo['fim'], '%Y-%m-%d').date()
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Erro ao converter período: {e}")
                else:
                    periodo_text = f"Gerado em: {timezone.now().strftime('%d/%m/%Y %H:%M')}"
                
                periodo_para = Paragraph(periodo_text, styles['Normal'])
                elements.append(periodo_para)
                elements.append(Spacer(1, 1*cm))
                
                # ===== BUSCAR DADOS REAIS DO BANCO =====
                total_vendas = 0  # Inicializar variável
                
                if tipo_relatorio == 'vendas':
                    # Filtro de vendas
                    filtro = Q()
                    if data_inicio and data_fim:
                        # Converter date para datetime para filtrar corretamente
                        from django.utils import timezone as django_tz
                        dt_inicio = django_tz.make_aware(datetime.combine(data_inicio, datetime.min.time()))
                        dt_fim = django_tz.make_aware(datetime.combine(data_fim, datetime.max.time()))
                        filtro &= Q(data_documento__gte=dt_inicio) & Q(data_documento__lte=dt_fim)
                    
                    # Buscar vendas
                    vendas = Venda.objects.filter(filtro).select_related('id_cliente', 'id_vendedor1', 'id_operacao')
                    
                    # Calcular totais
                    total_vendas = vendas.count()
                    valor_total = vendas.aggregate(total=Sum('valor_total'))['total'] or Decimal('0.00')
                    
                    # Formatar valor em formato brasileiro (R$)
                    valor_formatado = f"{float(valor_total):,.2f}"
                    valor_formatado = valor_formatado.replace(',', '|').replace('.', ',').replace('|', '.')
                    
                    # Info resumo
                    resumo = Paragraph(f"""
                        <b>Resumo do Período:</b><br/>
                        Total de Vendas: {total_vendas}<br/>
                        Valor Total: R$ {valor_formatado}<br/>
                    """, styles['Normal'])
                    elements.append(resumo)
                    elements.append(Spacer(1, 0.5*cm))
                    
                    # Tabela com vendas detalhadas (últimas 50)
                    data = [['Data', 'Documento', 'Cliente', 'Valor']]
                    
                    for venda in vendas.order_by('-data_documento')[:50]:
                        data_venda = venda.data_documento.strftime('%d/%m/%Y') if venda.data_documento else '-'
                        numero_doc = venda.numero_documento or str(venda.pk)
                        cliente = venda.id_cliente.nome_razao_social if venda.id_cliente else 'N/A'
                        # Formatar valor em formato brasileiro
                        valor_num = f"{float(venda.valor_total):,.2f}"
                        valor = "R$ " + valor_num.replace(',', '|').replace('.', ',').replace('|', '.')
                        
                        data.append([data_venda, numero_doc, cliente[:30], valor])
                    
                    # Se não houver vendas
                    if total_vendas == 0:
                        data.append(['', 'Nenhuma venda encontrada', '', ''])
                    
                else:
                    # Para outros tipos, mensagem indicativa
                    conteudo = Paragraph(f"""
                        <b>Relatório {tipo_relatorio.title()}</b><br/><br/>
                        
                        Em desenvolvimento. Para relatórios completos:<br/>
                        1. Acesse o módulo de Relatórios<br/>
                        2. Selecione o relatório desejado<br/>
                        3. Clique em "Exportar PDF"
                    """, styles['Normal'])
                    elements.append(conteudo)
                    elements.append(Spacer(1, 1*cm))
                    
                    # Tabela básica
                    data = [
                        ['Métrica', 'Valor'],
                        ['Total', 'R$ 0,00'],
                        ['Quantidade', '0'],
                    ]
                
                # Criar tabela
                if tipo_relatorio == 'vendas' and total_vendas > 0:
                    # Tabela de vendas com 4 colunas
                    table = Table(data, colWidths=[3*cm, 3*cm, 7*cm, 3*cm])
                else:
                    # Tabela básica com 2 colunas
                    table = Table(data, colWidths=[8*cm, 8*cm])
                
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                ]))
                
                elements.append(table)
                
                # Rodapé
                elements.append(Spacer(1, 2*cm))
                rodape = Paragraph(
                    f'<i>Relatório gerado em {timezone.now().strftime("%d/%m/%Y às %H:%M")}</i>',
                    styles['Normal']
                )
                elements.append(rodape)
                
                # Gera o PDF
                doc.build(elements)
                
                # Retorna o PDF
                buffer.seek(0)
                response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="relatorio_{tipo_relatorio}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
                
                return response
                
            except ImportError:
                # ReportLab não instalado
                return Response({
                    'sucesso': False,
                    'mensagem': 'Biblioteca ReportLab não instalada. Execute: pip install reportlab',
                    'instrucoes': 'Para habilitar geração de PDF, instale: pip install reportlab'
                }, status=503)
                
        except Exception as e:
            logger.error(f"Erro ao gerar PDF: {e}", exc_info=True)
            return Response({
                'sucesso': False,
                'mensagem': f'Erro ao gerar PDF: {str(e)}'
            }, status=500)


class PreviewRelatorioPDFView(APIView):
    """
    Retorna informações sobre o PDF que será gerado (para preview)
    
    POST /api/ai/preview-pdf/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Retorna estrutura do PDF que seria gerado"""
        tipo_relatorio = request.data.get('tipo', 'customizado')
        periodo = request.data.get('periodo', {})
        
        estrutura = {
            'titulo': f'Relatório de {tipo_relatorio.title()}',
            'periodo': periodo,
            'secoes': [],
            'formato': 'A4',
            'orientacao': 'retrato',
            'disponivel': True
        }
        
        if tipo_relatorio == 'vendas':
            estrutura['secoes'] = [
                'Resumo Executivo',
                'Vendas por Período',
                'Top Produtos',
                'Top Clientes',
                'Análise de Tendências'
            ]
        elif tipo_relatorio == 'vendas_operacao':
            estrutura['secoes'] = [
                'Resumo por Operação Fiscal',
                'Detalhamento de Vendas',
                'Total de Notas por Operação',
                'Valor Total por CFOP'
            ]
            estrutura['titulo'] = 'Relatório de Vendas por Operação'
        elif tipo_relatorio == 'financeiro':
            estrutura['secoes'] = [
                'Resumo Financeiro',
                'Contas a Receber',
                'Contas a Pagar',
                'Fluxo de Caixa',
                'Indicadores'
            ]
        elif tipo_relatorio == 'estoque':
            estrutura['secoes'] = [
                'Resumo de Estoque',
                'Produtos com Estoque Baixo',
                'Movimentações',
                'Valor em Estoque'
            ]
        
        return Response({
            'sucesso': True,
            'estrutura': estrutura,
            'instrucoes': 'Use o endpoint /api/ai/gerar-pdf/ para baixar o PDF'
        })
