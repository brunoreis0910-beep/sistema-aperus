"""
Services para Geração de PDFs Gerenciais
Relatórios Financeiro, DRE, etc. usando ReportLab

Autor: Bruno (Sistema Gerencial)
Data: 11/05/2026
"""
from django.db.models import Sum, Q
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from typing import Dict, Any

from api.models import FinanceiroConta, CentroCusto, FormaPagamento, ContaBancaria
from api.services_pdf_fiscal import PDFFiscalService


class PDFGerencialService:
    """Serviço para geração de relatórios gerenciais em PDF"""

    @staticmethod
    def _criar_tabela_resumo(elements, titulo, data):
        styles = getSampleStyleSheet()
        titulo_style = ParagraphStyle('Resumo', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, spaceAfter=4, textColor=colors.HexColor('#0d47a1'))
        elements.append(Paragraph(titulo, titulo_style))

        table = Table(data, colWidths=[5*cm, 4*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#E3F2FD')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 0.6*cm))

    @staticmethod
    def _criar_tabela_detalhada(elements, titulo, data, col_widths):
        styles = getSampleStyleSheet()
        titulo_style = ParagraphStyle('Detalhe', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, spaceAfter=4, textColor=colors.HexColor('#1565c0'))
        elements.append(Paragraph(titulo, titulo_style))

        if len(data) <= 1:
            elements.append(Paragraph("Nenhum registro encontrado para esta seção.", styles['Italic']))
            elements.append(Spacer(1, 0.5*cm))
            return

        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976D2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (3, 1), (3, -1), 'RIGHT'),
        ]))
        elements.append(table)

    @staticmethod
    def gerar_pdf_financeiro(filtros: Dict[str, Any]) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=1.5*cm, bottomMargin=1.5*cm)
        elements = []
        styles = getSampleStyleSheet()

        data_inicio = filtros['data_inicio']
        data_fim = filtros['data_fim']

        periodo_str = f"{data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}"
        PDFFiscalService._criar_cabecalho(elements, 'RELATÓRIO FINANCEIRO', periodo_str)

        query = Q(data_emissao__range=[data_inicio, data_fim])
        
        if filtros.get('centro_custo_id'):
            query &= Q(id_centro_custo=filtros['centro_custo_id'])
        if filtros.get('forma_pagamento'):
            query &= Q(forma_pagamento__iexact=filtros['forma_pagamento'])
        if filtros.get('conta_baixa_id'):
            query &= Q(id_conta_baixa=filtros['conta_baixa_id'])
        if filtros.get('conta_lancamento_id'):
            query &= Q(id_conta_cobranca=filtros['conta_lancamento_id'])

        contas = FinanceiroConta.objects.filter(query).select_related(
            'id_cliente_fornecedor', 'id_centro_custo', 'id_conta_baixa', 'id_conta_cobranca'
        )

        if not contas.exists():
            elements.append(Paragraph('<i>Nenhuma conta encontrada no período com os filtros aplicados.</i>', styles['Normal']))
        else:
            receber_qs = contas.filter(tipo_conta='Receber').order_by('data_vencimento')
            pagar_qs = contas.filter(tipo_conta='Pagar').order_by('data_vencimento')

            totais_receber = receber_qs.aggregate(total=Sum('valor_parcela'), pago=Sum('valor_liquidado', filter=Q(status_conta='Paga')))
            totais_pagar = pagar_qs.aggregate(total=Sum('valor_parcela'), pago=Sum('valor_liquidado', filter=Q(status_conta='Paga')))
            
            saldo = (totais_receber.get('pago', 0) or 0) - (totais_pagar.get('pago', 0) or 0)
            
            PDFGerencialService._criar_tabela_resumo(elements, 'Resultado do Período', [
                ['Total Recebido', f"R$ {totais_receber.get('pago', 0) or 0:,.2f}"],
                ['Total Pago', f"R$ {totais_pagar.get('pago', 0) or 0:,.2f}"],
                ['Saldo Operacional', f"R$ {saldo:,.2f}"],
            ])
            elements.append(Spacer(1, 0.8*cm))

            # Contas a Receber
            data_receber = [['Venc.', 'Cliente', 'Descrição', 'Valor', 'Status']]
            for c in receber_qs[:100]:
                data_receber.append([
                    c.data_vencimento.strftime('%d/%m/%Y'),
                    c.id_cliente_fornecedor.nome_razao_social[:30] if c.id_cliente_fornecedor else '',
                    c.descricao[:35], f"R$ {c.valor_parcela:,.2f}", c.status_conta
                ])
            PDFGerencialService._criar_tabela_detalhada(elements, 'Detalhes - Contas a Receber', data_receber, [2*cm, 6*cm, 5.5*cm, 2.5*cm, 2*cm])
            
            elements.append(PageBreak())

            # Contas a Pagar
            data_pagar = [['Venc.', 'Fornecedor', 'Descrição', 'Valor', 'Status']]
            for c in pagar_qs[:100]:
                 data_pagar.append([
                    c.data_vencimento.strftime('%d/%m/%Y'),
                    c.id_cliente_fornecedor.nome_razao_social[:30] if c.id_cliente_fornecedor else '',
                    c.descricao[:35], f"R$ {c.valor_parcela:,.2f}", c.status_conta
                ])
            PDFGerencialService._criar_tabela_detalhada(elements, 'Detalhes - Contas a Pagar', data_pagar, [2*cm, 6*cm, 5.5*cm, 2.5*cm, 2*cm])

        doc.build(elements)
        buffer.seek(0)
        return buffer
