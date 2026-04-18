"""
Serviço para gerar relatório fiscal em PDF
Agrupa documentos por CFOP, CST, PIS, COFINS, IPI
"""
import os
from datetime import date, datetime, time
from decimal import Decimal
from collections import defaultdict
from django.utils import timezone
from api.models import Venda, VendaItem
import logging

logger = logging.getLogger(__name__)

try:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    REPORTLAB_AVAILABLE = True
except ImportError:
    logger.warning("ReportLab não está instalado. Relatórios PDF não estarão disponíveis.")
    REPORTLAB_AVAILABLE = False


class SpedReportService:
    def __init__(self, data_inicio: date, data_fim: date, operacoes_ids: list, empresa_config):
        """
        Inicializa o serviço de geração de relatório.
        
        Args:
            data_inicio: Data inicial do período
            data_fim: Data final do período
            operacoes_ids: Lista de IDs de operações a incluir
            empresa_config: Objeto EmpresaConfig com dados da empresa
        """
        # Converter date para datetime timezone-aware para funcionar com DateTimeField
        dt_inicio_naive = datetime.combine(data_inicio, time.min)
        dt_fim_naive = datetime.combine(data_fim, time.max)
        self.data_inicio_dt = timezone.make_aware(dt_inicio_naive)
        self.data_fim_dt = timezone.make_aware(dt_fim_naive)
        self.data_inicio = data_inicio  # Manter para formatação
        self.data_fim = data_fim
        self.operacoes_ids = operacoes_ids
        self.empresa = empresa_config
        
    def _extrair_cfop(self, venda):
        """
        Extrai o CFOP da venda.
        Lógica: usa padrões baseados no tipo de operação.
        """
        # Verificar se é entrada ou saída
        if venda.id_operacao:
            if venda.id_operacao.transacao == 'Saida':
                # Vendas: CFOP 5xxx ou 6xxx
                return '5102'  # Venda de mercadoria adquirida (padrão)
            elif venda.id_operacao.transacao == 'Entrada':
                return '1102'  # Compra para comercialização
        
        return '5102'  # Padrão
    
    def _agregar_dados(self, modelos):
        """
        Agrega os dados de vendas por CFOP, CST, PIS, COFINS, IPI.
        Retorna um dicionário com as agregações.
        modelos: lista de modelos a filtrar (ex: ['55'], ['65'])
        """
        # Estrutura: {(cfop, cst_icms, cst_pis, aliq_pis, aliq_cofins): {dados}}
        agregacao = defaultdict(lambda: {
            'quantidade_docs': 0,
            'valor_contabil': Decimal('0.00'),
            'base_icms': Decimal('0.00'),
            'valor_icms': Decimal('0.00'),
            'base_pis': Decimal('0.00'),
            'valor_pis': Decimal('0.00'),
            'base_cofins': Decimal('0.00'),
            'valor_cofins': Decimal('0.00'),
            'base_ipi': Decimal('0.00'),
            'valor_ipi': Decimal('0.00'),
        })
        
        # Buscar vendas do período
        # Filtrar por modelo documento na Operação ou Venda
        # Assumindo que id_operacao.modelo_documento é confiável ou Venda.modelo_documento
        
        vendas = Venda.objects.filter(
            data_documento__gte=self.data_inicio_dt,
            data_documento__lte=self.data_fim_dt,
            id_operacao__id_operacao__in=self.operacoes_ids,
            status_nfe__in=['EMITIDA', 'AUTORIZADA']
        ).filter(
            id_operacao__modelo_documento__in=modelos
        ).prefetch_related('itens__id_produto__tributacao_detalhada').select_related('id_operacao')
        
        logger.info(f"Processando {vendas.count()} vendas (Modelos: {modelos}) para relatório")
        
        for venda in vendas:
            cfop = self._extrair_cfop(venda)
            
            # Processar cada item da venda
            for item in venda.itens.all():
                # Buscar tributação do produto
                produto = item.id_produto
                if not produto:
                    continue
                
                try:
                    tributacao = produto.tributacao_detalhada
                except:
                    # Produto sem tributação cadastrada
                    tributacao = None
                
                # Extrair dados tributários
                cst_icms = tributacao.cst_icms if tributacao else '000'
                cst_pis = tributacao.cst_pis_cofins if tributacao else '01'
                aliq_pis = float(tributacao.pis_aliquota) if tributacao else 0.00
                aliq_cofins = float(tributacao.cofins_aliquota) if tributacao else 0.00
                aliq_ipi = float(tributacao.ipi_aliquota) if tributacao else 0.00
                aliq_icms = float(tributacao.icms_aliquota) if tributacao else 0.00
                
                # Chave de agregação
                key = (cfop, cst_icms, cst_pis, aliq_pis, aliq_cofins, aliq_ipi)
                
                # Valores
                valor_item = item.valor_total
                
                # Calcular bases e valores (simplificado)
                # Em um sistema real, esses valores viriam do XML ou de cálculos mais complexos
                base_icms = valor_item if aliq_icms > 0 else Decimal('0.00')
                valor_icms = (valor_item * Decimal(str(aliq_icms)) / Decimal('100')) if aliq_icms > 0 else Decimal('0.00')
                
                base_pis = valor_item if aliq_pis > 0 else Decimal('0.00')
                valor_pis = (valor_item * Decimal(str(aliq_pis)) / Decimal('100')) if aliq_pis > 0 else Decimal('0.00')
                
                base_cofins = valor_item if aliq_cofins > 0 else Decimal('0.00')
                valor_cofins = (valor_item * Decimal(str(aliq_cofins)) / Decimal('100')) if aliq_cofins > 0 else Decimal('0.00')
                
                base_ipi = valor_item if aliq_ipi > 0 else Decimal('0.00')
                valor_ipi = (valor_item * Decimal(str(aliq_ipi)) / Decimal('100')) if aliq_ipi > 0 else Decimal('0.00')
                
                # Agregar
                agregacao[key]['quantidade_docs'] += 1
                agregacao[key]['valor_contabil'] += valor_item
                agregacao[key]['base_icms'] += base_icms
                agregacao[key]['valor_icms'] += valor_icms
                agregacao[key]['base_pis'] += base_pis
                agregacao[key]['valor_pis'] += valor_pis
                agregacao[key]['base_cofins'] += base_cofins
                agregacao[key]['valor_cofins'] += valor_cofins
                agregacao[key]['base_ipi'] += base_ipi
                agregacao[key]['valor_ipi'] += valor_ipi
        
        return dict(agregacao)

    def _listar_docs_inativos(self):
        """
        Retorna lista de documentos cancelados ou inutilizados.
        """
        vendas = Venda.objects.filter(
            data_documento__gte=self.data_inicio_dt,
            data_documento__lte=self.data_fim_dt,
            id_operacao__id_operacao__in=self.operacoes_ids,
            status_nfe__in=['CANCELADA', 'INUTILIZADA', 'DENEGADA', 'ERRO', 'REJEITADA']
        ).select_related('id_operacao').order_by('numero_nfe')
        
        docs = []
        for v in vendas:
            modelo = v.id_operacao.modelo_documento if v.id_operacao else '??'
            numero = v.numero_nfe or v.numero_documento or 'S/N'
            serie = v.serie_nfe or v.id_operacao.serie_nf if v.id_operacao else ''
            
            docs.append({
                'modelo': modelo,
                'serie': serie,
                'numero': numero,
                'status': v.status_nfe,
                'data': v.data_documento.strftime('%d/%m/%Y'),
                'chave': v.chave_nfe or ''
            })
        return docs
    
    def _agregar_dados_cte(self):
        """
        Agrega os dados de CTes por CFOP e CST ICMS.
        Retorna um dicionário com as agregações.
        """
        # Estrutura: {(cfop, cst_icms): {dados}}
        agregacao = defaultdict(lambda: {
            'quantidade_docs': 0,
            'valor_servico': Decimal('0.00'),
            'base_icms': Decimal('0.00'),
            'valor_icms': Decimal('0.00'),
        })
        
        try:
            from cte.models import ConhecimentoTransporte
            
            # Buscar todos os CTes do período
            ctes = ConhecimentoTransporte.objects.filter(
                data_emissao__gte=self.data_inicio_dt,
                data_emissao__lte=self.data_fim_dt,
                status_cte__in=['EMITIDO', 'ENVIADO', 'AUTORIZADO']
            )
            
            logger.info(f"Processando {ctes.count()} CTes para relatório")
            
            for cte in ctes:
                cfop = cte.cfop or '5353'  # CFOP padrão para transporte
                cst_icms = cte.cst_icms or '00'
                
                key = (cfop, cst_icms)
                
                agregacao[key]['quantidade_docs'] += 1
                agregacao[key]['valor_servico'] += cte.valor_total_servico or Decimal('0.00')
                agregacao[key]['base_icms'] += cte.v_bc_icms or Decimal('0.00')
                agregacao[key]['valor_icms'] += cte.v_icms or Decimal('0.00')
        
        except ImportError:
            logger.warning("Modelo ConhecimentoTransporte não disponível")
        except Exception as e:
            logger.error(f"Erro ao processar CTes: {str(e)}")
        
        return dict(agregacao)
    
    def gerar_pdf(self, filepath):
        """
        Gera o relatório PDF e salva no caminho especificado.
        """
        if not REPORTLAB_AVAILABLE:
            raise Exception("ReportLab não está instalado. Execute: pip install reportlab")
        
        # Verificar se é Simples Nacional
        is_simples = False
        if self.empresa and getattr(self.empresa, 'crt', None) == '1':
            is_simples = True
        
        # Agregar dados Separados
        dados_nfe = self._agregar_dados(modelos=['55'])
        dados_nfce = self._agregar_dados(modelos=['65'])
        dados_cte = self._agregar_dados_cte()
        docs_inativos = self._listar_docs_inativos()
        
        if not dados_nfe and not dados_nfce and not dados_cte and not docs_inativos:
            logger.warning("Nenhum dado para gerar relatório")
            return False
        
        # Criar documento PDF em paisagem (landscape)
        doc = SimpleDocTemplate(filepath, pagesize=landscape(A4))
        elements = []
        
        # Estilos
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#666666'),
            spaceAfter=20,
            alignment=TA_CENTER
        )
        
        h2_style = ParagraphStyle(
             'CustomH2',
             parent=styles['Heading2'],
             fontSize=12,
             textColor=colors.HexColor('#2c3e50'),
             spaceBefore=12,
             spaceAfter=6
        )

        
        # Título
        elements.append(Paragraph(f"RELATÓRIO FISCAL - SPED", title_style))
        crt_desc = "Simples Nacional" if is_simples else "Regime Normal"
        elements.append(Paragraph(
            f"{self.empresa.nome_razao_social if self.empresa else 'Empresa não configurada'}<br/>"
            f"CNPJ: {self.empresa.cpf_cnpj if self.empresa else 'N/A'} - CRT: {crt_desc}<br/>"
            f"Período: {self.data_inicio.strftime('%d/%m/%Y')} a {self.data_fim.strftime('%d/%m/%Y')}",
            subtitle_style
        ))
        elements.append(Spacer(1, 0.5*cm))
        
        # Função auxiliar para gerar tabelas fiscais
        def criar_tabela_fiscal(dados, titulo):
            if not dados:
                return
            
            elements.append(Paragraph(titulo, h2_style))
            elements.append(Spacer(1, 0.3*cm))
            
            # Definir colunas com base no regime tributário
            if is_simples:
                cols = ['CFOP', 'CST\nICMS', 'Qtd', 'Valor\nContábil', 'Base\nICMS', 'Valor\nICMS']
            else:
                cols = ['CFOP', 'CST\nICMS', 'CST\nPIS', 'Aliq\nPIS', 'Aliq\nCOF', 'Qtd', 'V. Cont.', 'BC ICMS', 'V. ICMS', 'V. PIS', 'V. COF', 'V. IPI']

            table_data = [cols]
            
            # Totalizadores
            totais = {
                'valor_contabil': Decimal('0.00'),
                'valor_icms': Decimal('0.00'),
                'valor_pis': Decimal('0.00'),
                'valor_cofins': Decimal('0.00'),
                'valor_ipi': Decimal('0.00'),
            }
            
            for key in sorted(dados.keys()):
                cfop, cst_icms, cst_pis, aliq_pis, aliq_cofins, aliq_ipi = key
                vals = dados[key]
                
                if is_simples:
                    line = [
                        cfop,
                        cst_icms,
                        str(vals['quantidade_docs']),
                        f"{vals['valor_contabil']:,.2f}",
                        f"{vals['base_icms']:,.2f}",
                        f"{vals['valor_icms']:,.2f}",
                    ]
                else:
                    line = [
                        cfop,
                        cst_icms,
                        cst_pis,
                        f"{aliq_pis:.2f}",
                        f"{aliq_cofins:.2f}",
                        str(vals['quantidade_docs']),
                        f"{vals['valor_contabil']:,.2f}",
                        f"{vals['base_icms']:,.2f}",
                        f"{vals['valor_icms']:,.2f}",
                        f"{vals['valor_pis']:,.2f}",
                        f"{vals['valor_cofins']:,.2f}",
                        f"{vals['valor_ipi']:,.2f}",
                    ]
                
                table_data.append(line)
                
                # Acumular totais
                totais['valor_contabil'] += vals['valor_contabil']
                totais['valor_icms'] += vals['valor_icms']
                totais['valor_pis'] += vals['valor_pis']
                totais['valor_cofins'] += vals['valor_cofins']
                totais['valor_ipi'] += vals['valor_ipi']
            
            # Linha final (Totais)
            if is_simples:
                total_line = ['TOTAL', '', '', f"{totais['valor_contabil']:,.2f}", '', f"{totais['valor_icms']:,.2f}"]
            else:
                 total_line = [
                     'TOTAL', '', '', '', '', '',
                     f"{totais['valor_contabil']:,.2f}",
                     '',
                     f"{totais['valor_icms']:,.2f}",
                     f"{totais['valor_pis']:,.2f}",
                     f"{totais['valor_cofins']:,.2f}",
                     f"{totais['valor_ipi']:,.2f}",
                 ]
            table_data.append(total_line)

            t = Table(table_data, repeatRows=1)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4a90e2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8 if not is_simples else 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#2c3e50')),
                ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 0.5*cm))

        # 1. Tabela NFe (Modelo 55)
        criar_tabela_fiscal(dados_nfe, "NOTAS FISCAIS ELETRÔNICAS - NFe (Modelo 55)")
        
        # 2. Tabela NFCe (Modelo 65)
        criar_tabela_fiscal(dados_nfce, "NOTAS FISCAIS DE CONSUMIDOR - NFCe (Modelo 65)")

        # 3. Tabela CTe
        if dados_cte:
            elements.append(Paragraph("CONHECIMENTOS DE TRANSPORTE - CTe (Modelo 57)", h2_style))
            elements.append(Spacer(1, 0.3*cm))
            
            cte_cols = ['CFOP', 'CST ICMS', 'Qtd', 'Valor Serviço', 'Base ICMS', 'Valor ICMS']
            cte_data = [cte_cols]
            
            tot_cte = {'serv': Decimal(0), 'icms': Decimal(0)}
            
            for key in sorted(dados_cte.keys()):
                cfop, cst_icms = key
                vals = dados_cte[key]
                cte_data.append([
                    cfop, cst_icms, str(vals['quantidade_docs']),
                    f"{vals['valor_servico']:,.2f}",
                    f"{vals['base_icms']:,.2f}",
                    f"{vals['valor_icms']:,.2f}"
                ])
                tot_cte['serv'] += vals['valor_servico']
                tot_cte['icms'] += vals['valor_icms']
                
            cte_data.append(['TOTAL', '', '', f"{tot_cte['serv']:,.2f}", '', f"{tot_cte['icms']:,.2f}"])
            
            t_cte = Table(cte_data, repeatRows=1)
            t_cte.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e67e22')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#d35400')),
                ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
            ]))
            elements.append(t_cte)
            elements.append(Spacer(1, 0.5*cm))

        # 4. Tabela de Inativos (Cancelados/Inutilizados)
        if docs_inativos:
            elements.append(Paragraph("DOCUMENTOS CANCELADOS / INUTILIZADOS / COM ERRO", h2_style))
            elements.append(Spacer(1, 0.3*cm))
            
            inativos_cols = ['Modelo', 'Série', 'Número', 'Status', 'Data', 'Chave (se houver)']
            inativos_data = [inativos_cols]
            
            for doc_in in docs_inativos:
                inativos_data.append([
                    str(doc_in['modelo']),
                    str(doc_in['serie']),
                    str(doc_in['numero']),
                    doc_in['status'],
                    doc_in['data'],
                    doc_in['chave'][:25] + '...' if len(doc_in['chave']) > 25 else doc_in['chave']
                ])
            
            t_inativos = Table(inativos_data, repeatRows=1)
            t_inativos.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#c0392b')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            elements.append(t_inativos)

        # Rodapé
        elements.append(Spacer(1, 1*cm))
        elements.append(Paragraph(
            f"Relatório gerado em {date.today().strftime('%d/%m/%Y')}",
            styles['Normal']
        ))
        
        # Gerar PDF
        try:
            doc.build(elements)
            logger.info(f"Relatório PDF gerado: {filepath}")
            return True
        except Exception as e:
            logger.error(f"Erro ao buildar PDF: {e}")
            return False
