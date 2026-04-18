"""
Services para Geração de PDFs Fiscais
Relatórios de CT-e e Vendas por Operação usando ReportLab

Autor: Bruno (Sistema Gerencial)
Data: 17/03/2026
"""
from django.db.models import Sum, Count, Q
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
import datetime
from typing import List, Dict, Any

from cte.models import ConhecimentoTransporte
from api.models import Venda, VendaItem, Operacao, EmpresaConfig, FinanceiroConta, FinanceiroBancario, FormaPagamento, Produto, GrupoProduto, Cliente


class PDFFiscalService:
    """Serviço para geração de relatórios fiscais em PDF"""
    
    @staticmethod
    def _get_empresa_info() -> Dict[str, str]:
        """Retorna informações da empresa para cabeçalho dos relatórios"""
        try:
            empresa = EmpresaConfig.get_ativa()
            if empresa:
                return {
                    'razao_social': empresa.razao_social or '',
                    'cnpj': empresa.cnpj or '',
                    'endereco': f"{empresa.logradouro or ''}, {empresa.numero or ''} - {empresa.bairro or ''}",
                    'cidade': f"{empresa.municipio or ''}/{empresa.uf or ''}",
                    'telefone': empresa.telefone or ''
                }
        except:
            pass
        
        return {
            'razao_social': '',
            'cnpj': '',
            'endereco': '',
            'cidade': '',
            'telefone': ''
        }
    
    @staticmethod
    def _criar_cabecalho(elements: List, titulo: str, periodo: str = None):
        """Cria cabeçalho padrão para os relatórios"""
        styles = getSampleStyleSheet()
        empresa = PDFFiscalService._get_empresa_info()
        
        # Título
        titulo_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1976d2'),
            spaceAfter=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        elements.append(Paragraph(titulo, titulo_style))
        
        # Informações da empresa
        empresa_style = ParagraphStyle(
            'Empresa',
            parent=styles['Normal'],
            fontSize=9,
            alignment=TA_CENTER,
            textColor=colors.grey
        )
        
        info_empresa = f"{empresa['razao_social']}"
        if empresa['cnpj']:
            info_empresa += f" - CNPJ: {empresa['cnpj']}"
        if empresa['cidade']:
            info_empresa += f" - {empresa['cidade']}"
        
        elements.append(Paragraph(info_empresa, empresa_style))
        
        # Período
        if periodo:
            periodo_style = ParagraphStyle(
                'Periodo',
                parent=styles['Normal'],
                fontSize=10,
                alignment=TA_CENTER,
                spaceAfter=20
            )
            elements.append(Paragraph(f"<b>Período:</b> {periodo}", periodo_style))
        
        elements.append(Spacer(1, 0.5*cm))
    
    @staticmethod
    def gerar_pdf_cte(data_inicio: datetime.date, data_fim: datetime.date) -> BytesIO:
        """
        Gera PDF do relatório de CT-e
        
        Args:
            data_inicio: Data inicial do período
            data_fim: Data final do período
            
        Returns:
            BytesIO: Buffer com o PDF gerado
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=1*cm,
            leftMargin=1*cm,
            topMargin=1*cm,
            bottomMargin=1*cm
        )
        
        elements = []
        
        # Cabeçalho
        periodo_str = f"{data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}"
        PDFFiscalService._criar_cabecalho(
            elements,
            'RELATÓRIO DE CONHECIMENTOS DE TRANSPORTE (CT-e)',
            periodo_str
        )
        
        # Busca CT-es do período
        ctes = ConhecimentoTransporte.objects.filter(
            data_emissao__range=[data_inicio, data_fim]
        ).select_related('remetente', 'destinatario').order_by('-data_emissao')
        
        if not ctes.exists():
            styles = getSampleStyleSheet()
            elements.append(Paragraph(
                '<i>Nenhum CT-e encontrado no período especificado.</i>',
                styles['Normal']
            ))
        else:
            # Totalizadores
            total_geral = ctes.aggregate(total=Sum('valor_total_servico'))['total'] or 0
            total_autorizados = ctes.filter(status_cte='AUTORIZADO').count()
            total_pendentes = ctes.filter(status_cte='PENDENTE').count()
            total_cancelados = ctes.filter(status_cte='CANCELADO').count()
            
            # Tabela de resumo
            resumo_data = [
                ['Total de CT-es', str(ctes.count())],
                ['Autorizados', str(total_autorizados)],
                ['Pendentes', str(total_pendentes)],
                ['Cancelados', str(total_cancelados)],
                ['Valor Total', f'R$ {total_geral:,.2f}']
            ]
            
            resumo_table = Table(resumo_data, colWidths=[6*cm, 4*cm])
            resumo_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e3f2fd')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            elements.append(resumo_table)
            elements.append(Spacer(1, 0.8*cm))
            
            # Tabela detalhada de CT-es
            data = [['Nº CT-e', 'Data Emissão', 'Chave', 'Remetente', 'Destinatário', 'Valor', 'Status']]
            
            for cte in ctes:
                chave_resumida = cte.chave_cte[-8:] if cte.chave_cte else '-'
                remetente = cte.remetente.nome_razao_social[:25] if cte.remetente else '-'
                destinatario = cte.destinatario.nome_razao_social[:25] if cte.destinatario else '-'
                
                data.append([
                    str(cte.numero_cte or '-'),
                    cte.data_emissao.strftime('%d/%m/%Y') if cte.data_emissao else '-',
                    f'...{chave_resumida}',
                    remetente,
                    destinatario,
                    f'R$ {float(cte.valor_total_servico or 0):,.2f}',
                    cte.status_cte or '-'
                ])
            
            table = Table(data, colWidths=[2*cm, 2.5*cm, 3*cm, 5.5*cm, 5.5*cm, 3*cm, 2.5*cm])
            table.setStyle(TableStyle([
                # Cabeçalho
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                
                # Corpo
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (5, 1), (5, -1), 'RIGHT'),  # Valores alinhados à direita
                ('ALIGN', (6, 1), (6, -1), 'CENTER'),  # Status centralizado
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                
                # Zebrado
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
            ]))
            
            elements.append(table)
        
        # Rodapé
        elements.append(Spacer(1, 1*cm))
        styles = getSampleStyleSheet()
        rodape_style = ParagraphStyle(
            'Rodape',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        elements.append(Paragraph(
            f'Relatório gerado em {timezone.now().strftime("%d/%m/%Y às %H:%M")}',
            rodape_style
        ))
        
        # Gera o PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def gerar_pdf_vendas_operacao(data_inicio: datetime.date, data_fim: datetime.date) -> BytesIO:
        """
        Gera PDF do relatório de vendas por operação fiscal
        
        Args:
            data_inicio: Data inicial do período
            data_fim: Data final do período
            
        Returns:
            BytesIO: Buffer com o PDF gerado
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=1*cm,
            bottomMargin=1*cm
        )
        
        elements = []
        
        # Cabeçalho
        periodo_str = f"{data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}"
        PDFFiscalService._criar_cabecalho(
            elements,
            'RELATÓRIO DE VENDAS POR OPERAÇÃO FISCAL',
            periodo_str
        )
        
        # Busca vendas do período
        vendas = Venda.objects.filter(
            data_documento__range=[data_inicio, data_fim]
        ).select_related('id_operacao')
        
        if not vendas.exists():
            styles = getSampleStyleSheet()
            elements.append(Paragraph(
                '<i>Nenhuma venda encontrada no período especificado.</i>',
                styles['Normal']
            ))
        else:
            # Agrupa por operação
            operacoes_stats = vendas.values(
                'id_operacao__nome_operacao'
            ).annotate(
                quantidade=Count('id_venda'),
                total=Sum('valor_total')
            ).order_by('-total')
            
            # Totalizadores gerais
            total_vendas = vendas.count()
            valor_total = vendas.aggregate(total=Sum('valor_total'))['total'] or 0
            
            # Tabela de resumo
            resumo_data = [
                ['Total de Vendas', str(total_vendas)],
                ['Valor Total', f'R$ {valor_total:,.2f}'],
                ['Ticket Médio', f'R$ {(valor_total/total_vendas if total_vendas > 0 else 0):,.2f}']
            ]
            
            resumo_table = Table(resumo_data, colWidths=[6*cm, 5*cm])
            resumo_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e8f5e9')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
            ]))
            
            elements.append(resumo_table)
            elements.append(Spacer(1, 0.8*cm))
            
            # Título da seção
            styles = getSampleStyleSheet()
            secao_style = ParagraphStyle(
                'Secao',
                parent=styles['Heading2'],
                fontSize=12,
                spaceAfter=10,
                textColor=colors.HexColor('#1976d2')
            )
            elements.append(Paragraph('Detalhamento por Operação Fiscal:', secao_style))
            elements.append(Spacer(1, 0.3*cm))
            
            # Tabela por operação
            data = [['Operação', 'Qtd. Vendas', 'Valor Total', '% do Total']]
            
            for op in operacoes_stats:
                descricao = op['id_operacao__nome_operacao'] or 'Sem Operação'
                quantidade = op['quantidade']
                total = op['total'] or 0
                percentual = (total / valor_total * 100) if valor_total > 0 else 0
                
                data.append([
                    descricao[:50],  # Trunca descrição longa
                    str(quantidade),
                    f'R$ {total:,.2f}',
                    f'{percentual:.1f}%'
                ])
            
            table = Table(data, colWidths=[9*cm, 2.5*cm, 3.5*cm, 2.5*cm])
            table.setStyle(TableStyle([
                # Cabeçalho
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                
                # Corpo
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('ALIGN', (0, 1), (0, -1), 'LEFT'),
                ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
                ('ALIGN', (3, 1), (3, -1), 'RIGHT'),
                ('ALIGN', (4, 1), (4, -1), 'RIGHT'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 1), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                
                # Zebrado
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
            ]))
            
            elements.append(table)
            
            # Observações
            elements.append(Spacer(1, 1*cm))
            obs_style = ParagraphStyle(
                'Observacao',
                parent=styles['Normal'],
                fontSize=8,
                textColor=colors.HexColor('#666666')
            )
            elements.append(Paragraph(
                '<b>Observações:</b><br/>'
                '• Valores consideram todas as vendas do período<br/>'
                '• Percentuais calculados sobre o valor total do período<br/>'
                '• Análise agrupa vendas por tipo de operação fiscal configurada no sistema',
                obs_style
            ))
        
        # Rodapé
        elements.append(Spacer(1, 0.5*cm))
        styles = getSampleStyleSheet()
        rodape_style = ParagraphStyle(
            'Rodape',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        elements.append(Paragraph(
            f'Relatório gerado em {timezone.now().strftime("%d/%m/%Y às %H:%M")}',
            rodape_style
        ))
        
        # Gera o PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def gerar_pdf_vendas_completo(filtros: Dict[str, Any]) -> BytesIO:
        """
        Gera PDF completo do relatório de vendas com múltiplos resumos:
        - Resumo Geral
        - Resumo por Forma de Pagamento
        - Resumo por Grupo de Produtos
        - Resumo por Operação Fiscal
        - Resumo por Cidade
        - Resumo por Cliente (Top 10)
        
        Args:
            filtros: Dict com filtros (data_inicio, data_fim, cliente_id, vendedor_id, etc)
            
        Returns:
            BytesIO: Buffer com o PDF gerado
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=1*cm,
            bottomMargin=1*cm
        )
        
        elements = []
        styles = getSampleStyleSheet()
        
        # Extrai filtros
        data_inicio = filtros['data_inicio']
        data_fim = filtros['data_fim']
        cliente_id = filtros.get('cliente_id')
        vendedor_id = filtros.get('vendedor_id')
        operacao_id = filtros.get('operacao_id')
        status_filtro = filtros.get('status', 'todos')
        # Seções a incluir: lista de strings. None = todas
        resumos = filtros.get('resumos')  # ex: ['listagem', 'pagamento', 'grupo', 'operacao', 'cidade', 'clientes']
        if resumos is None:
            resumos = ['listagem', 'pagamento', 'grupo', 'operacao', 'cidade', 'clientes']

        def mostrar(secao):
            return secao in resumos
        
        # Cabeçalho
        periodo_str = f"{data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}"
        PDFFiscalService._criar_cabecalho(
            elements,
            'RELATÓRIO COMPLETO DE VENDAS',
            periodo_str
        )
        
        # Monta query com filtros
        query = Q(data_documento__range=[data_inicio, data_fim])
        
        if cliente_id:
            query &= Q(id_cliente=cliente_id)
        
        if vendedor_id:
            query &= Q(id_vendedor1=vendedor_id)
        
        if operacao_id:
            query &= Q(id_operacao=operacao_id)
        
        if status_filtro and status_filtro != 'todos':
            if status_filtro == 'faturada':
                query &= Q(status_venda='Faturada')
            elif status_filtro == 'cancelada':
                query &= Q(status_venda='Cancelada')
            elif status_filtro == 'aberta':
                query &= Q(status_venda='Aberta')
        
        # Busca vendas
        vendas = Venda.objects.filter(query).select_related(
            'id_cliente', 'id_vendedor1', 'id_operacao'
        )
        
        if not vendas.exists():
            elements.append(Paragraph(
                '<i>Nenhuma venda encontrada com os filtros especificados.</i>',
                styles['Normal']
            ))
        else:
            # ===== RESUMO GERAL (sempre exibido) =====
            total_vendas = vendas.count()
            valor_total = vendas.aggregate(total=Sum('valor_total'))['total'] or 0
            
            # Calcula desconto total somando os descontos dos itens
            desconto_total = VendaItem.objects.filter(
                id_venda__in=vendas.values_list('id_venda', flat=True)
            ).aggregate(total=Sum('desconto_valor'))['total'] or 0
            
            ticket_medio = valor_total / total_vendas if total_vendas > 0 else 0
            
            # Tabela de resumo geral
            resumo_data = [
                ['Total de Vendas', f'{total_vendas:,}'],
                ['Valor Total', f'R$ {valor_total:,.2f}'],
                ['Descontos', f'R$ {desconto_total:,.2f}'],
                ['Ticket Médio', f'R$ {ticket_medio:,.2f}']
            ]
            
            titulo_style = ParagraphStyle(
                'TituloSecao',
                parent=styles['Heading2'],
                fontSize=12,
                spaceAfter=10,
                textColor=colors.HexColor('#1976d2'),
                spaceBefore=15
            )
            
            elements.append(Paragraph('📊 RESUMO GERAL', titulo_style))
            
            resumo_table = Table(resumo_data, colWidths=[7*cm, 5*cm])
            resumo_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e3f2fd')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
            ]))
            
            elements.append(resumo_table)
            elements.append(Spacer(1, 0.8*cm))

            # ===== LISTAGEM DAS VENDAS =====
            if mostrar('listagem'):
                elements.append(Paragraph('🛒 LISTAGEM DE VENDAS', titulo_style))
                
                lista_vendas = vendas.select_related('id_cliente', 'id_operacao').order_by('data_documento')[:200]
                
                lista_data = [['Data', 'Nº Doc', 'Cliente', 'Operação', 'Valor']]
                for v in lista_vendas:
                    lista_data.append([
                        v.data_documento.strftime('%d/%m/%Y') if v.data_documento else '-',
                        str(v.numero_documento or v.id_venda),
                        (v.id_cliente.nome_razao_social[:25] if v.id_cliente else 'Consumidor')[:25],
                        (v.id_operacao.nome_operacao[:20] if v.id_operacao else '-')[:20],
                        f'R$ {v.valor_total:,.2f}',
                    ])
                
                lista_table = Table(lista_data, colWidths=[2*cm, 2.2*cm, 6*cm, 4.5*cm, 3.3*cm])
                lista_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                    ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 7.5),
                    ('ALIGN', (0, 1), (1, -1), 'CENTER'),
                    ('ALIGN', (2, 1), (3, -1), 'LEFT'),
                    ('ALIGN', (4, 1), (4, -1), 'RIGHT'),
                    ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 1), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
                ]))
                elements.append(lista_table)
                if total_vendas > 200:
                    elements.append(Paragraph(
                        f'<i>* Exibindo as primeiras 200 de {total_vendas} vendas. Use filtros para refinar.</i>',
                        ParagraphStyle('aviso', parent=styles['Normal'], fontSize=7, textColor=colors.grey)
                    ))
                elements.append(Spacer(1, 0.6*cm))

            # ===== RESUMO POR FORMA DE PAGAMENTO =====
            if mostrar('pagamento'):
                elements.append(Paragraph('💳 RESUMO POR FORMA DE PAGAMENTO', titulo_style))

                # Busca pagamentos relacionados às vendas (tipo Receber)
                financeiro = FinanceiroConta.objects.filter(
                    id_venda_origem__in=vendas.values_list('id_venda', flat=True),
                    tipo_conta='Receber'
                ).values(
                    'forma_pagamento'
                ).annotate(
                    quantidade=Count('id_conta'),
                    total=Sum('valor_parcela')
                ).order_by('-total')

                if financeiro.exists():
                    pg_data = [['Forma de Pagamento', 'Qtd.', 'Valor', '% do Total']]

                    for fin in financeiro:
                        forma = fin['forma_pagamento'] or 'Não Definido'
                        # Limpa formatação de forma de pagamento se houver (ex: "PIX: R$ 100,00" -> "PIX")
                        if ':' in forma and 'R$' in forma:
                            forma = forma.split(':')[0].strip()

                        qtd = fin['quantidade']
                        total_pg = fin['total'] or 0
                        perc = (total_pg / valor_total * 100) if valor_total > 0 else 0

                        pg_data.append([
                            forma[:40],
                            str(qtd),
                            f'R$ {total_pg:,.2f}',
                            f'{perc:.1f}%'
                        ])

                    pg_table = Table(pg_data, colWidths=[7*cm, 2*cm, 3.5*cm, 2.5*cm])
                    pg_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4caf50')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 9),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
                        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 1), (-1, -1), 8),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('TOPPADDING', (0, 1), (-1, -1), 5),
                        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
                    ]))
                    elements.append(pg_table)
                else:
                    elements.append(Paragraph('<i>Sem informações de pagamento</i>', styles['Normal']))

                elements.append(Spacer(1, 0.6*cm))

            # ===== RESUMO POR GRUPO DE PRODUTOS =====
            if mostrar('grupo'):
                elements.append(Paragraph('📦 RESUMO POR GRUPO DE PRODUTOS', titulo_style))

                # Busca itens de venda agrupados por grupo
                itens = VendaItem.objects.filter(
                    id_venda__in=vendas.values_list('id_venda', flat=True)
                ).select_related('id_produto__id_grupo').values(
                    'id_produto__id_grupo__nome_grupo'
                ).annotate(
                    quantidade=Sum('quantidade'),
                    total=Sum('valor_total')
                ).order_by('-total')

                if itens.exists():
                    grupo_data = [['Grupo', 'Qtd. Itens', 'Valor', '% do Total']]

                    for item in itens:
                        grupo = item['id_produto__id_grupo__nome_grupo'] or 'Sem Grupo'
                        qtd = item['quantidade'] or 0
                        total_grupo = item['total'] or 0
                        perc = (total_grupo / valor_total * 100) if valor_total > 0 else 0

                        grupo_data.append([
                            grupo[:40],
                            f'{qtd:.2f}',
                            f'R$ {total_grupo:,.2f}',
                            f'{perc:.1f}%'
                        ])

                    grupo_table = Table(grupo_data, colWidths=[7*cm, 2*cm, 3.5*cm, 2.5*cm])
                    grupo_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ff9800')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 9),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
                        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 1), (-1, -1), 8),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('TOPPADDING', (0, 1), (-1, -1), 5),
                        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
                    ]))
                    elements.append(grupo_table)
                else:
                    elements.append(Paragraph('<i>Sem informações de grupos</i>', styles['Normal']))

                elements.append(Spacer(1, 0.6*cm))

            # ===== RESUMO POR OPERAÇÃO FISCAL =====
            if mostrar('operacao'):
                elements.append(Paragraph('📋 RESUMO POR OPERAÇÃO FISCAL', titulo_style))

                operacoes_stats = vendas.values(
                    'id_operacao__nome_operacao'
                ).annotate(
                    quantidade=Count('id_venda'),
                    total=Sum('valor_total')
                ).order_by('-total')

                if operacoes_stats.exists():
                    op_data = [['Operação', 'Qtd.', 'Valor', '% do Total']]

                    for op in operacoes_stats:
                        nome_op = op['id_operacao__nome_operacao'] or 'Sem Operação'
                        qtd = op['quantidade']
                        total_op = op['total'] or 0
                        perc = (total_op / valor_total * 100) if valor_total > 0 else 0

                        op_data.append([
                            nome_op[:45],
                            str(qtd),
                            f'R$ {total_op:,.2f}',
                            f'{perc:.1f}%'
                        ])

                    op_table = Table(op_data, colWidths=[7*cm, 2*cm, 3.5*cm, 2.5*cm])
                    op_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2196f3')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 9),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
                        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 1), (-1, -1), 8),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('TOPPADDING', (0, 1), (-1, -1), 5),
                        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
                    ]))
                    elements.append(op_table)
                else:
                    elements.append(Paragraph('<i>Sem informações de operação</i>', styles['Normal']))

                elements.append(Spacer(1, 0.6*cm))

            # ===== RESUMO POR CIDADE =====
            if mostrar('cidade'):
                elements.append(Paragraph('🏙️ RESUMO POR CIDADE DO CLIENTE', titulo_style))

                cidades_stats = vendas.values(
                    'id_cliente__cidade'
                ).annotate(
                    quantidade=Count('id_venda'),
                    total=Sum('valor_total')
                ).order_by('-total')[:15]  # Top 15 cidades

                if cidades_stats.exists():
                    cidade_data = [['Cidade', 'Qtd.', 'Valor', '% do Total']]

                    for cidade in cidades_stats:
                        nome_cidade = cidade['id_cliente__cidade'] or 'Não Informada'
                        qtd = cidade['quantidade']
                        total_cidade = cidade['total'] or 0
                        perc = (total_cidade / valor_total * 100) if valor_total > 0 else 0

                        cidade_data.append([
                            nome_cidade[:35],
                            str(qtd),
                            f'R$ {total_cidade:,.2f}',
                            f'{perc:.1f}%'
                        ])

                    cidade_table = Table(cidade_data, colWidths=[7*cm, 2*cm, 3.5*cm, 2.5*cm])
                    cidade_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#9c27b0')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 9),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
                        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 1), (-1, -1), 8),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('TOPPADDING', (0, 1), (-1, -1), 5),
                        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
                    ]))
                    elements.append(cidade_table)
                else:
                    elements.append(Paragraph('<i>Sem informações de cidade</i>', styles['Normal']))

                elements.append(Spacer(1, 0.6*cm))

            # ===== TOP 10 CLIENTES =====
            if mostrar('clientes'):
                elements.append(Paragraph('🏆 TOP 10 CLIENTES', titulo_style))

                clientes_stats = vendas.values(
                    'id_cliente__nome_razao_social',
                    'id_cliente__cidade'
                ).annotate(
                    quantidade=Count('id_venda'),
                    total=Sum('valor_total')
                ).order_by('-total')[:10]

                if clientes_stats.exists():
                    cliente_data = [['Cliente', 'Cidade', 'Qtd.', 'Valor']]

                    for cli in clientes_stats:
                        nome = cli['id_cliente__nome_razao_social'] or 'Não Informado'
                        cidade_cli = cli['id_cliente__cidade'] or '-'
                        qtd = cli['quantidade']
                        total_cli = cli['total'] or 0

                        cliente_data.append([
                            nome[:28],
                            cidade_cli[:15],
                            str(qtd),
                            f'R$ {total_cli:,.2f}'
                        ])

                    cliente_table = Table(cliente_data, colWidths=[6*cm, 3*cm, 1.5*cm, 3.5*cm])
                    cliente_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f44336')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 9),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                        ('ALIGN', (0, 1), (1, -1), 'LEFT'),
                        ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 1), (-1, -1), 8),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('TOPPADDING', (0, 1), (-1, -1), 5),
                        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
                    ]))
                    elements.append(cliente_table)
                else:
                    elements.append(Paragraph('<i>Sem informações de clientes</i>', styles['Normal']))

            # Observações finais
            elements.append(Spacer(1, 0.8*cm))
            obs_style = ParagraphStyle(
                'Observacao',
                parent=styles['Normal'],
                fontSize=8,
                textColor=colors.HexColor('#666666')
            )
            elements.append(Paragraph(
                '<b>Observações:</b><br/>'
                '• Valores consideram todas as vendas do período selecionado<br/>'
                '• Percentuais calculados sobre o valor total bruto do período<br/>'
                '• Relatório gerado com filtros ativos conforme especificado',
                obs_style
            ))
        
        # Rodapé
        elements.append(Spacer(1, 0.5*cm))
        rodape_style = ParagraphStyle(
            'Rodape',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        elements.append(Paragraph(
            f'Relatório gerado em {timezone.now().strftime("%d/%m/%Y às %H:%M")}',
            rodape_style
        ))
        
        # Gera o PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer

    @staticmethod
    def gerar_pdf_conferencia(filtros: Dict[str, Any]) -> BytesIO:
        """
        Gera PDF do Relatório de Conferência – cruza Vendas x Contas a Receber x
        Valores Recebidos x Bancário e destaca divergências.

        Args:
            filtros: dict com data_inicio, data_fim (date objects)
        """
        from decimal import Decimal

        data_inicio = filtros['data_inicio']
        data_fim = filtros['data_fim']

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5 * cm,
            leftMargin=1.5 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )
        styles = getSampleStyleSheet()
        elements = []

        # ── Estilos ────────────────────────────────────────────────────────────
        titulo_doc_style = ParagraphStyle(
            'TituloDoc',
            parent=styles['Title'],
            fontSize=16,
            textColor=colors.HexColor('#1a237e'),
            spaceAfter=4,
            alignment=TA_CENTER,
        )
        subtitulo_style = ParagraphStyle(
            'Subtitulo',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#424242'),
            spaceAfter=2,
            alignment=TA_CENTER,
        )
        secao_style = ParagraphStyle(
            'Secao',
            parent=styles['Normal'],
            fontSize=10,
            fontName='Helvetica-Bold',
            textColor=colors.white,
            spaceAfter=0,
            spaceBefore=0,
            leftIndent=6,
        )
        ok_style = ParagraphStyle(
            'OK',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#1b5e20'),
        )
        div_style = ParagraphStyle(
            'Div',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#b71c1c'),
            fontName='Helvetica-Bold',
        )
        obs_style = ParagraphStyle(
            'Obs',
            parent=styles['Normal'],
            fontSize=7.5,
            textColor=colors.HexColor('#666666'),
        )

        def secao_header(texto, cor):
            t = Table([[Paragraph(texto, secao_style)]], colWidths=[doc.width])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), cor),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ]))
            return t

        def tabela_padrao(data, col_widths, cor_header):
            t = Table(data, colWidths=col_widths, repeatRows=1)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), cor_header),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 7.5),
                ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#cccccc')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 1), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
            ]))
            return t

        # ── Empresa ────────────────────────────────────────────────────────────
        empresa = PDFFiscalService._get_empresa_info()
        periodo_str = f"{data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}"

        elements.append(Paragraph('RELATÓRIO DE CONFERÊNCIA', titulo_doc_style))
        elements.append(Paragraph(empresa.get('nome', ''), subtitulo_style))
        elements.append(Paragraph(f'Período: {periodo_str}', subtitulo_style))
        elements.append(Paragraph(
            f'Emitido em: {timezone.now().strftime("%d/%m/%Y às %H:%M")}',
            subtitulo_style,
        ))
        elements.append(Spacer(1, 0.5 * cm))

        # ── Coleta de dados ────────────────────────────────────────────────────
        d_inicio_dt = timezone.make_aware(
            timezone.datetime(data_inicio.year, data_inicio.month, data_inicio.day, 0, 0, 0)
        )
        d_fim_dt = timezone.make_aware(
            timezone.datetime(data_fim.year, data_fim.month, data_fim.day, 23, 59, 59)
        )

        vendas_qs = Venda.objects.filter(
            data_documento__range=[d_inicio_dt, d_fim_dt]
        ).select_related('id_cliente', 'id_operacao').order_by('data_documento')

        ids_vendas = list(vendas_qs.values_list('id_venda', flat=True))

        # Contas a Receber geradas por vendas do período
        contas_receber_qs = FinanceiroConta.objects.filter(
            tipo_conta='Receber',
            id_venda_origem__in=ids_vendas,
        )

        # Contas de fato baixadas/recebidas (data de pagamento no período)
        contas_recebidas_qs = FinanceiroConta.objects.filter(
            tipo_conta='Receber',
            status_conta__in=['Pago', 'Baixado', 'Liquidado', 'Paga', 'Baixada'],
            data_pagamento__range=[data_inicio, data_fim],
        )

        # Bancário – entradas de crédito no período
        bancario_qs = FinanceiroBancario.objects.filter(
            tipo_movimento='C',
            data_pagamento__range=[data_inicio, data_fim],
        ).select_related('id_conta_bancaria')

        # ── Totalizadores ──────────────────────────────────────────────────────
        from django.db.models import Sum as DSum, Count as DCount
        agg_vendas = vendas_qs.aggregate(total=DSum('valor_total'), qtd=DCount('id_venda'))
        total_vendas = agg_vendas['total'] or Decimal('0')
        qtd_vendas = agg_vendas['qtd']

        agg_cr = contas_receber_qs.aggregate(total=DSum('valor_parcela'), qtd=DCount('id_conta'))
        total_cr = agg_cr['total'] or Decimal('0')
        qtd_cr = agg_cr['qtd']

        agg_rec = contas_recebidas_qs.aggregate(
            total_liq=DSum('valor_liquidado'),
            qtd=DCount('id_conta'),
        )
        total_recebido = agg_rec['total_liq'] or Decimal('0')
        qtd_recebido = agg_rec['qtd']

        agg_banc = bancario_qs.aggregate(total=DSum('valor_movimento'), qtd=DCount('id_movimento'))
        total_bancario = agg_banc['total'] or Decimal('0')
        qtd_bancario = agg_banc['qtd']

        # ── QUADRO DE CONFERÊNCIA (topo) ───────────────────────────────────────
        elements.append(secao_header('📊  QUADRO DE CONFERÊNCIA', colors.HexColor('#1a237e')))
        elements.append(Spacer(1, 0.15 * cm))

        LIMIAR = Decimal('0.01')

        diff_venda_cr = total_vendas - total_cr
        diff_cr_rec = total_cr - total_recebido
        diff_rec_banc = total_recebido - total_bancario

        def fmt(v):
            return f'R$ {v:,.2f}'

        def status_diff(diff):
            if abs(diff) <= LIMIAR:
                return Paragraph('✅  OK', ok_style)
            sinal = '+' if diff > 0 else ''
            return Paragraph(f'⚠️  DIVERGÊNCIA: {sinal}{fmt(diff)}', div_style)

        quad_data = [
            ['Indicador', 'Valor', 'Qtd.', 'Status'],
            ['Vendas (emitidas no período)', fmt(total_vendas), str(qtd_vendas),
             Paragraph('—', styles['Normal'])],
            ['Contas a Receber (geradas pelas vendas)', fmt(total_cr), str(qtd_cr),
             status_diff(diff_venda_cr)],
            ['Valores Recebidos / Baixados (no período)', fmt(total_recebido), str(qtd_recebido),
             Paragraph('—', styles['Normal'])],
            ['Entradas Bancárias (créditos no período)', fmt(total_bancario), str(qtd_bancario),
             status_diff(diff_rec_banc)],
        ]

        quad_table = Table(quad_data, colWidths=[7 * cm, 3 * cm, 1.5 * cm, 6 * cm])
        quad_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#283593')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8.5),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8.5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#9fa8da')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#e8eaf6'), colors.white]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 1), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
            ('ALIGN', (1, 1), (2, -1), 'CENTER'),
        ]))
        elements.append(quad_table)
        elements.append(Spacer(1, 0.3 * cm))

        # Linha de divergências resumidas
        divs = []
        if abs(diff_venda_cr) > LIMIAR:
            divs.append(
                f'• Vendas vs. Contas a Receber: diferença de {fmt(abs(diff_venda_cr))} '
                f'({qtd_vendas - qtd_cr:+d} registros sem C/R)'
            )
        if abs(diff_cr_rec) > LIMIAR:
            divs.append(
                f'• Contas a Receber vs. Recebido: {fmt(abs(diff_cr_rec))} ainda pendente/não baixado'
            )
        if abs(diff_rec_banc) > LIMIAR:
            divs.append(
                f'• Recebido (financeiro) vs. Bancário: diferença de {fmt(abs(diff_rec_banc))}'
            )

        if divs:
            alerta_style = ParagraphStyle(
                'Alerta', parent=styles['Normal'],
                fontSize=8.5, textColor=colors.HexColor('#b71c1c'),
                backColor=colors.HexColor('#ffebee'), borderPad=6,
                leading=14,
            )
            elements.append(Paragraph(
                '<b>⚠️  DIVERGÊNCIAS ENCONTRADAS:</b><br/>' + '<br/>'.join(divs),
                alerta_style,
            ))
        else:
            elements.append(Paragraph(
                '✅  Todos os valores conferem. Nenhuma divergência encontrada.',
                ok_style,
            ))
        elements.append(Spacer(1, 0.6 * cm))

        # ── SEÇÃO 1: VENDAS ────────────────────────────────────────────────────
        elements.append(secao_header('🛒  VENDAS DO PERÍODO', colors.HexColor('#1565c0')))
        elements.append(Spacer(1, 0.15 * cm))

        if vendas_qs.exists():
            v_data = [['Data', 'Nº Doc', 'Cliente', 'Operação', 'Valor Total', 'C/R Gerado?']]
            vendas_ids_com_cr = set(
                contas_receber_qs.values_list('id_venda_origem', flat=True)
            )
            for v in vendas_qs[:300]:
                tem_cr = '✅' if v.id_venda in vendas_ids_com_cr else '⚠️ Não'
                v_data.append([
                    v.data_documento.strftime('%d/%m/%Y') if v.data_documento else '-',
                    str(v.numero_documento or v.id_venda)[:15],
                    (v.id_cliente.nome_razao_social[:22] if v.id_cliente else 'Consumidor'),
                    (v.id_operacao.nome_operacao[:18] if v.id_operacao else '-'),
                    f'R$ {v.valor_total:,.2f}',
                    tem_cr,
                ])
            v_table = tabela_padrao(
                v_data,
                [2 * cm, 2.2 * cm, 4.5 * cm, 4 * cm, 3 * cm, 2.1 * cm],
                colors.HexColor('#1565c0'),
            )
            # Destacar linhas sem C/R em amarelo
            for i, row in enumerate(v_data[1:], start=1):
                if row[5] == '⚠️ Não':
                    v_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, i), (-1, i), colors.HexColor('#fff9c4')),
                    ]))
            elements.append(v_table)
            if qtd_vendas > 300:
                elements.append(Paragraph(
                    f'<i>* Exibindo 300 de {qtd_vendas} vendas.</i>', obs_style
                ))
        else:
            elements.append(Paragraph('<i>Nenhuma venda encontrada no período.</i>', styles['Normal']))

        elements.append(Spacer(1, 0.6 * cm))

        # ── SEÇÃO 2: CONTAS A RECEBER ──────────────────────────────────────────
        elements.append(secao_header('📋  CONTAS A RECEBER (GERADAS PELAS VENDAS)', colors.HexColor('#00695c')))
        elements.append(Spacer(1, 0.15 * cm))

        if contas_receber_qs.exists():
            cr_data = [['Venda Orig.', 'Descrição', 'Vencimento', 'Valor', 'Status', 'Forma Pgto']]
            for c in contas_receber_qs.order_by('data_vencimento')[:300]:
                cr_data.append([
                    str(c.id_venda_origem or '-'),
                    c.descricao[:28],
                    c.data_vencimento.strftime('%d/%m/%Y') if c.data_vencimento else '-',
                    f'R$ {c.valor_parcela:,.2f}',
                    c.status_conta or 'Pendente',
                    (c.forma_pagamento or '-')[:15],
                ])
            cr_table = tabela_padrao(
                cr_data,
                [2 * cm, 5 * cm, 2.5 * cm, 2.5 * cm, 2 * cm, 3.8 * cm],
                colors.HexColor('#00695c'),
            )
            # Destacar pendentes
            for i, row in enumerate(cr_data[1:], start=1):
                if row[4] in ('Pendente', 'Aberto', 'Em Aberto'):
                    cr_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, i), (-1, i), colors.HexColor('#fff9c4')),
                    ]))
            elements.append(cr_table)
        else:
            elements.append(Paragraph(
                '<i>Nenhuma conta a receber gerada pelas vendas do período.</i>', styles['Normal']
            ))

        elements.append(Spacer(1, 0.6 * cm))

        # ── SEÇÃO 3: VALORES RECEBIDOS ─────────────────────────────────────────
        elements.append(secao_header('💰  VALORES RECEBIDOS / BAIXADOS NO PERÍODO', colors.HexColor('#e65100')))
        elements.append(Spacer(1, 0.15 * cm))

        if contas_recebidas_qs.exists():
            rec_data = [['Data Baixa', 'Descrição', 'Venda Orig.', 'Valor Parcela', 'Valor Recebido', 'Forma Pgto']]
            for c in contas_recebidas_qs.order_by('data_pagamento')[:300]:
                rec_data.append([
                    c.data_pagamento.strftime('%d/%m/%Y') if c.data_pagamento else '-',
                    c.descricao[:25],
                    str(c.id_venda_origem or '-'),
                    f'R$ {c.valor_parcela:,.2f}',
                    f'R$ {c.valor_liquidado:,.2f}',
                    (c.forma_pagamento or '-')[:15],
                ])
            rec_table = tabela_padrao(
                rec_data,
                [2.3 * cm, 4.5 * cm, 2 * cm, 2.7 * cm, 2.7 * cm, 3.6 * cm],
                colors.HexColor('#e65100'),
            )
            elements.append(rec_table)
        else:
            elements.append(Paragraph(
                '<i>Nenhum recebimento registrado no período.</i>', styles['Normal']
            ))

        elements.append(Spacer(1, 0.6 * cm))

        # ── SEÇÃO 4: BANCÁRIO ──────────────────────────────────────────────────
        elements.append(secao_header('🏦  ENTRADAS BANCÁRIAS (CRÉDITOS NO PERÍODO)', colors.HexColor('#4a148c')))
        elements.append(Spacer(1, 0.15 * cm))

        if bancario_qs.exists():
            banc_data = [['Data', 'Conta Bancária', 'Descrição', 'Doc Nº', 'Forma Pgto', 'Valor']]
            for b in bancario_qs.order_by('data_pagamento')[:300]:
                banc_data.append([
                    b.data_pagamento.strftime('%d/%m/%Y') if b.data_pagamento else '-',
                    (b.id_conta_bancaria.nome_conta[:18] if b.id_conta_bancaria else '-'),
                    b.descricao[:25],
                    (b.documento_numero or '-')[:12],
                    (b.forma_pagamento or '-')[:12],
                    f'R$ {b.valor_movimento:,.2f}',
                ])
            banc_table = tabela_padrao(
                banc_data,
                [2.3 * cm, 3.2 * cm, 4.5 * cm, 2 * cm, 2.2 * cm, 3.6 * cm],
                colors.HexColor('#4a148c'),
            )
            elements.append(banc_table)
        else:
            elements.append(Paragraph(
                '<i>Nenhuma entrada bancária registrada no período.</i>', styles['Normal']
            ))

        elements.append(Spacer(1, 0.6 * cm))

        # ── RODAPÉ ─────────────────────────────────────────────────────────────
        elements.append(Paragraph(
            f'Relatório de Conferência gerado em {timezone.now().strftime("%d/%m/%Y às %H:%M")} | '
            f'Período: {periodo_str}',
            obs_style,
        ))

        doc.build(elements)
        buffer.seek(0)
        return buffer


# Instância singleton do serviço
pdf_fiscal_service = PDFFiscalService()
