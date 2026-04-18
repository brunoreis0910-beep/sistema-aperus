"""
Serviço para geração do SPED Contribuições (EFD-Contribuições)
Escrituração Fiscal Digital da Contribuição para o PIS/Pasep e da Cofins

Baseado no layout versão 1.35 (2024)
Guia Prático EFD-Contribuições
"""

import logging
import datetime
from decimal import Decimal
from django.db.models import Sum, Q
from django.utils import timezone
from api.models import EmpresaConfig, Venda, VendaItem, Cliente, Produto, TributacaoProduto, Operacao

logger = logging.getLogger(__name__)


class SpedContribuicoesGenerator:
    """
    Gerador de arquivo SPED Contribuições (EFD-Contribuições)
    Layout versão 1.35 - Válido a partir de 01/01/2024
    """
    
    def __init__(self, data_inicio, data_fim, operacoes_ids=None, versao='135', blocos_gerar=None):
        """
        Inicializa o gerador de SPED Contribuições
        
        :param data_inicio: datetime or date object
        :param data_fim: datetime or date object
        :param operacoes_ids: list of int (id_operacao) to filter
        :param versao: string - Versão do layout SPED Contribuições (ex: '135' = 1.35)
        :param blocos_gerar: list of str - Blocos a gerar (ex: ['A', 'C', 'D', 'F', 'M', '1'])
        """
        self.data_inicio = data_inicio
        self.data_fim = data_fim
        self.operacoes_ids = operacoes_ids
        self.versao = versao
        self.blocos_gerar = blocos_gerar if blocos_gerar else ['C', 'F', 'M']
        
        # Controle de registros para o Bloco 9
        self.block_counts = {}
        self.lines = []
        
        # Acumuladores para apuração - PIS
        self.total_bc_pis = Decimal(0)
        self.total_pis = Decimal(0)
        self.total_credito_pis = Decimal(0)
        
        # Acumuladores para apuração - COFINS
        self.total_bc_cofins = Decimal(0)
        self.total_cofins = Decimal(0)
        self.total_credito_cofins = Decimal(0)
        
        # Carregar dados da empresa
        self.empresa = EmpresaConfig.get_ativa()
        if not self.empresa:
            raise Exception("Configurações da empresa não encontradas.")
        
        # Carregar vendas do período
        self._carregar_vendas()
        
        # Carregar CTes se existirem
        self._carregar_ctes()
    
    def _carregar_vendas(self):
        """Carrega as vendas do período com filtros adequados"""
        # Converte datas para datetime se necessário
        if isinstance(self.data_inicio, datetime.date) and not isinstance(self.data_inicio, datetime.datetime):
            dt_ini_datetime = timezone.make_aware(datetime.datetime.combine(self.data_inicio, datetime.datetime.min.time()))
        else:
            dt_ini_datetime = self.data_inicio
            
        if isinstance(self.data_fim, datetime.date) and not isinstance(self.data_fim, datetime.datetime):
            dt_fim_datetime = timezone.make_aware(datetime.datetime.combine(self.data_fim, datetime.datetime.max.time()))
        else:
            dt_fim_datetime = self.data_fim
        
        # Filtro de período
        query = Q(data_documento__gte=dt_ini_datetime) & \
                Q(data_documento__lte=dt_fim_datetime)
        
        # Incluir apenas vendas emitidas/autorizadas/canceladas
        query &= Q(status_nfe__in=['EMITIDA', 'CANCELADA', 'AUTORIZADA'])
        
        # Filtro de operações se especificado
        if self.operacoes_ids:
            query &= Q(id_operacao__in=self.operacoes_ids)
            logger.info(f"SPED Contribuições: Filtrando por operações {self.operacoes_ids}")
        
        self.vendas = Venda.objects.filter(query).order_by('data_documento', 'numero_nfe')
        logger.info(f"SPED Contribuições: {self.vendas.count()} vendas encontradas no período")
    
    def _carregar_ctes(self):
        """Carrega os CTes do período se o módulo existir"""
        try:
            from cte.models import ConhecimentoTransporte
            
            dt_ini = self.data_inicio if isinstance(self.data_inicio, datetime.datetime) else \
                     timezone.make_aware(datetime.datetime.combine(self.data_inicio, datetime.datetime.min.time()))
            dt_fim = self.data_fim if isinstance(self.data_fim, datetime.datetime) else \
                     timezone.make_aware(datetime.datetime.combine(self.data_fim, datetime.datetime.max.time()))
            
            self.ctes = ConhecimentoTransporte.objects.filter(
                data_emissao__gte=dt_ini,
                data_emissao__lte=dt_fim,
                status_cte__in=['EMITIDO', 'ENVIADO', 'AUTORIZADO', 'CANCELADO']
            ).order_by('data_emissao', 'numero_cte')
            
            logger.info(f"SPED Contribuições: {self.ctes.count()} CTes encontrados no período")
        except ImportError:
            logger.warning("Módulo CTe não disponível")
            self.ctes = []
    
    def gerar(self):
        """Gera o arquivo SPED Contribuições completo"""
        try:
            logger.info("Iniciando geração do SPED Contribuições...")
            
            # Bloco 0 - Abertura, Identificação e Referências (OBRIGATÓRIO)
            self._gerar_bloco_0()
            
            # Bloco A - Documentos Fiscais - Serviços (ISS) - OBRIGATÓRIO (mesmo que vazio)
            self._gerar_bloco_a()
            
            # Bloco C - Documentos Fiscais I - Mercadorias (ICMS/IPI)
            if 'C' in self.blocos_gerar:
                self._gerar_bloco_c()
            
            # Bloco D - Documentos Fiscais II - Serviços (ICMS) - OBRIGATÓRIO (mesmo que vazio)
            self._gerar_bloco_d()
            
            # Bloco F - Demais Documentos e Operações - OBRIGATÓRIO (mesmo que vazio)
            self._gerar_bloco_f()
            
            # Bloco M - Apuração da Contribuição e Crédito
            if 'M' in self.blocos_gerar:
                self._gerar_bloco_m()
            
            # Bloco 1 - Complemento da Escrituração
            # OBRIGATÓRIO (mesmo que vazio) para fechar o arquivo corretamente antes do bloco 9
            self._gerar_bloco_1()
            
            # Bloco 9 - Controle e Encerramento (OBRIGATÓRIO)
            self._gerar_bloco_9()
            
            logger.info("SPED Contribuições gerado com sucesso!")
            return '\r\n'.join(self.lines) + '\r\n'
            
        except Exception as e:
            logger.error(f"Erro gerando SPED Contribuições: {e}")
            raise
    
    def _add_line(self, reg, *campos):
        """Adiciona uma linha ao arquivo SPED"""
        # Remove None e converte para string
        campos_str = [str(c) if c is not None else '' for c in campos]
        linha = f"|{reg}|{'|'.join(campos_str)}|"
        self.lines.append(linha)
        
        # Incrementa contador do bloco
        bloco = reg[0]
        self.block_counts[bloco] = self.block_counts.get(bloco, 0) + 1
    
    def _formatar_data(self, data):
        """Formata data para o padrão SPED (DDMMAAAA)"""
        if isinstance(data, str):
            return data
        return data.strftime('%d%m%Y')
    
    def _formatar_valor(self, valor, decimais=2):
        """Formata valor decimal para o padrão SPED"""
        if valor is None or valor == '':
            return ''
        if isinstance(valor, str):
            return valor
        return f"{float(valor):.{decimais}f}".replace('.', ',')
    
    def _calcular_impostos_venda(self, venda):
        """Calcula os impostos da venda a partir dos itens"""
        totais = {
            'desconto': Decimal(0),
            'total_produtos': Decimal(0),
            'base_calculo_pis': Decimal(0),
            'valor_pis': Decimal(0),
            'base_calculo_cofins': Decimal(0),
            'valor_cofins': Decimal(0)
        }
        
        itens = venda.itens.all()
        for item in itens:
            # Desconto
            totais['desconto'] += (item.desconto_valor or Decimal(0))
            
            # Total de produtos
            totais['total_produtos'] += item.valor_total
            
            # Buscar tributação do produto
            produto = item.id_produto
            if produto:
                try:
                    tributacao = produto.tributacao_detalhada

                    # Base de cálculo é o valor total do item
                    base_calculo = item.valor_total or Decimal(0)

                    # Determinar CST configurado no produto (se houver)
                    raw_cst = ''
                    try:
                        raw_cst = str(tributacao.cst_pis_cofins or '').strip().zfill(2)
                    except Exception:
                        raw_cst = ''

                    # Determinar regime da empresa (1=cumulativo,2=nc,3=ambos)
                    regime_emp = str(getattr(self.empresa, 'regime_apuracao_pis_cofins', '2') or '2')

                    # PIS - aplicar alíquota conforme CST e regime (CST=01 tributado)
                    aliquota_pis = tributacao.pis_aliquota or Decimal(0)
                    if raw_cst == '01':
                        if regime_emp == '1':  # Cumulativo: sempre 0,65% (fixo)
                            aliquota_pis = Decimal('0.65')
                        else:
                            # não-cumulativo padrão
                            aliquota_pis = getattr(self.empresa, 'aliquota_pis_padrao', None) or Decimal('1.65')

                    totais['base_calculo_pis'] += base_calculo
                    totais['valor_pis'] += (base_calculo * aliquota_pis / Decimal(100))

                    # COFINS
                    aliquota_cofins = tributacao.cofins_aliquota or Decimal(0)
                    if raw_cst == '01':
                        if regime_emp == '1':  # Cumulativo: sempre 3,00% (fixo)
                            aliquota_cofins = Decimal('3.00')
                        else:
                            aliquota_cofins = getattr(self.empresa, 'aliquota_cofins_padrao', None) or Decimal('7.60')

                    totais['base_calculo_cofins'] += base_calculo
                    totais['valor_cofins'] += (base_calculo * aliquota_cofins / Decimal(100))

                except TributacaoProduto.DoesNotExist:
                    # Se não tem tributação cadastrada, skip
                    pass
        
        return totais
    
    # ==================== BLOCO 0 - ABERTURA ====================
    
    def _gerar_bloco_0(self):
        """Bloco 0 - Abertura, Identificação e Referências"""
        logger.info("Gerando Bloco 0 - Abertura...")
        
        # 0000 - Abertura do Arquivo Digital
        # Layout: REG|COD_VER|TIPO_ESCRIT|IND_SIT_ESP|NUM_REC_ANTERIOR|DT_INI|DT_FIN|NOME|CNPJ|UF|COD_MUN|SUFRAMA|IND_NAT_PJ|IND_ATIV
        self._add_line(
            '0000',
            # Ajuste de versão conforme data
            # Para 2026 pode ser necessário versão superior, mas 006 é comum hoje.
            # Se self.versao for '135', converte para '006' para manter compatibilidade com o que estava no erro (006)
            '006' if self.versao in ['135', '1.35'] else self.versao.zfill(3),  # COD_VER
            '0',  # TIPO_ESCRIT - 0=Original (Corrigido de 1 para 0 pois geralmente é original, se for retificadora o usuário deve informar)
            '',   # IND_SIT_ESP - Vazio para regular (ou 0 dependendo da validação, mas guia diz texto)
            '',   # NUM_REC_ANTERIOR
            self._formatar_data(self.data_inicio),  # DT_INI
            self._formatar_data(self.data_fim),  # DT_FIN
            self.empresa.nome_razao_social,  # NOME
            self.empresa.cpf_cnpj,  # CNPJ
            self.empresa.estado,  # UF
            self.empresa.codigo_municipio_ibge,  # COD_MUN
            '',   # SUFRAMA
            '00', # IND_NAT_PJ - 00=Sociedade empresária em geral (Verificar tabela. 00 é padrao PJ em geral no SPED Fiscal, aqui pode ser diferente)
            '0'   # IND_ATIV - 0=Industrial ou equiparado, 1=Prestador de serviços, 2=Atividade de comércio, 3=Outros, 4=Atividade Financeira
        )
        
        # 0001 - Abertura do Bloco 0
        self._add_line('0001', '0')  # IND_MOV - 0=Bloco com dados
        
        # 0100 - Dados do Contabilista
        contador_nome = getattr(self.empresa, 'contador_nome', 'NÃO INFORMADO')
        contador_cpf = getattr(self.empresa, 'contador_cpf', '') or ''
        contador_cpf = ''.join(filter(str.isdigit, contador_cpf))
        # CPF deve ter 11 dígitos - se inválido, deixar vazio (campo obrigatório mas vazio gera erro menor)
        if len(contador_cpf) != 11:
            contador_cpf = ''
        contador_crc = getattr(self.empresa, 'contador_crc', '') or ''
        contador_cnpj = getattr(self.empresa, 'contador_cnpj', '') or ''
        contador_cnpj = ''.join(filter(str.isdigit, contador_cnpj))
        if len(contador_cnpj) != 14:
            contador_cnpj = ''
        contador_cep = getattr(self.empresa, 'contador_cep', '') or ''
        contador_cep = ''.join(filter(str.isdigit, contador_cep))
        contador_cod_mun = getattr(self.empresa, 'codigo_municipio_ibge', '') or '9999999'
        
        self._add_line(
            '0100',
            contador_nome or 'NAO INFORMADO',
            contador_cpf,
            contador_crc,
            contador_cnpj,
            contador_cep,  # CEP
            '',  # END
            '',  # NUM
            '',  # COMPL
            '',  # BAIRRO
            '',  # FONE
            '',  # FAX
            getattr(self.empresa, 'contador_email', '') or '',
            contador_cod_mun   # COD_MUN - '9999999' se não informado
        )
        
        # 0110 - Regimes de Apuração da Contribuição Social e de Apropriação de Crédito
        regime_apuracao = getattr(self.empresa, 'regime_apuracao_pis_cofins', '1') # 1=Cumulativo, 2=Não-cumulativo, 3=Ambos
        regime_credito = getattr(self.empresa, 'regime_cred_pis_cofins', '1')
        
        # Validação conforme Guia Prático
        # COD_INC_TRIB: 1=Não-cumulativo, 2=Cumulativo, 3=Ambos
        # Se regime_apuracao=1 (Cumulativo), COD_INC_TRIB=2
        # Se regime_apuracao=2 (Não-cumulativo), COD_INC_TRIB=1
        ind_apro_cred = ''
        cod_tipo_cont = ''
        ind_reg_cum = ''

        if regime_apuracao in ['2', '3']:
             ind_apro_cred = '1' # 1-Apropriação Direta
             cod_tipo_cont = '1' # 1-Contribuição Não-Cumulativa
             if regime_apuracao == '3':
                 ind_reg_cum = '9' # Regime misto
        
        # COD_INC_TRIB correto: 
        # regime_apuracao='1' (empresa cumulativa) -> COD_INC_TRIB='2' (escrituração cumulativa)
        # regime_apuracao='2' (empresa não-cumulativa) -> COD_INC_TRIB='1' (escrituração não-cumulativa)
        if regime_apuracao == '1':
             self._add_line('0110', '2', '', '', '')  # Cumulativo
        elif regime_apuracao == '2':
             self._add_line('0110', '1', '1', '1', '')  # Não-cumulativo
        else:
             self._add_line('0110', '3', '1', '1', '9')  # Ambos

        
        # 0111 - Tabela de Receita Bruta Mensal para Fins de Rateio de Créditos Comuns
        # Incluir se necessário para rateio de créditos
        
        # 0120 - Identificação de Períodos Dispensados da Escrituração
        # Incluir se houver períodos dispensados
        
        # 0140 - Tabela de Cadastro de Estabelecimento
        # Layout: REG|COD_EST|NOME|CNPJ|UF|IE|COD_MUN|IM|SUFRAMA
        self._add_line(
            '0140',
            '',  # COD_EST - Código do estabelecimento (matriz/filial), vazio se único
            self.empresa.nome_razao_social,  # NOME
            self.empresa.cpf_cnpj,  # CNPJ
            self.empresa.estado or '',  # UF (Corrigido: estava endereco)
            self.empresa.inscricao_estadual or '',  # IE
            self.empresa.codigo_municipio_ibge,  # COD_MUN
            self.empresa.inscricao_municipal or '',  # IM
            ''   # SUFRAMA
        )
        
        # 0145 - Regime de Apuração da Contribuição Previdenciária sobre a Receita Bruta
        # Este registro é obrigatório apenas para quem está sujeito à CPRB (Lei 12.546/2011)
        # Se regime_apuracao for '1' (Cumulativo) ou '2' (Não-Cumulativo), geralmente não se gera 0145 a menos que haja CPRB.
        # Porém, se gerar, a estrutura é: REG|COD_INC_TRIB|VL_REC_TOT|VL_REC_ATIV|VL_REC_DEMAIS_ATIV|INFO_COMPL
        
        # Vamos assumir que se não tem info específica de CPRB, não gera ou gera vazio se validado.
        # Mas o erro indicava estrutura inválida. Vamos corrigir a estrutura removendo o campo extra vazio no início.
        
        # Se for SIMPLES ou MEI, não deve gerar. Se for Lucro Presumido/Real, verifica.
        # Por padrão, vamos gerar apenas se houver configuração explícita ou deixar comentado se não obrigatório.
        # O Guia Prático diz: "Registro obrigatório para PJ sujeita à contribuição previdenciária sobre a receita bruta"
        
        # Vou comentar por enquanto pois muitas empresas não tem CPRB. Se o validador exigir (obrigatório de nível hierárquico), descomentamos com a estrutura correta.
        # self._add_line(
        #     '0145',
        #     regime_apuracao,  # COD_INC_TRIB
        #     '',  # VL_REC_TOT
        #     '',  # VL_REC_ATIV
        #     '',  # VL_REC_DEMAIS_ATIV
        #     ''   # INFO_COMPL
        # )

        
        # 0150 - Tabela de Cadastro do Participante
        self._gerar_registro_0150()
        
        # 0190 - Identificação das Unidades de Medida
        self._gerar_registro_0190()
        
        # 0200 - Tabela de Identificação do Item (Produto e Serviços)
        self._gerar_registro_0200()
        
        # 0500 - Plano de Contas Contábeis
        self._gerar_registro_0500()
        
        # 0990 - Encerramento do Bloco 0
        self._add_line('0990', str(self.block_counts.get('0', 0) + 1))  # +1 para incluir o próprio 0990
    
    def _gerar_registro_0150(self):
        """0150 - Tabela de Cadastro do Participante"""
        # Obter todos os clientes únicos das vendas
        clientes_ids = self.vendas.values_list('id_cliente', flat=True).distinct()
        clientes = Cliente.objects.filter(id_cliente__in=clientes_ids)
        
        for cliente in clientes:
            # Determinar tipo de pessoa pelo tamanho do CPF/CNPJ (11 dígitos = PF, 14 = PJ)
            import re
            cpf_cnpj_limpo = re.sub(r'[^0-9]', '', cliente.cpf_cnpj or '')
            tipo_pessoa = 'J' if len(cpf_cnpj_limpo) == 14 else 'F'
            
            # Determinar se é PJ ou PF (e remover caracteres não numéricos)
            cpf_cnpj_limpo = re.sub(r'[^0-9]', '', cliente.cpf_cnpj or '')
            
            # Formatar argumentos para add_line
            # IMPORTANTE: No EFD Contribuições, 0150 tem menos campos que no EFD-ICMS/IPI
            # Campos: REG|COD_PART|NOME|COD_PAIS|CNPJ|CPF|IE|COD_MUN|SUFRAMA|END|NUM|COMPL|BAIRRO
            
            cnpj_val = cpf_cnpj_limpo if len(cpf_cnpj_limpo) == 14 else ''
            cpf_val = cpf_cnpj_limpo if (len(cpf_cnpj_limpo) == 11 and cpf_cnpj_limpo != '00000000000') else ''
            
            # Se não tiver CPF nem CNPJ válido, e for do Brasil, não gerar registro 0150
            # (Exceto se for estrangeiro, mas estamos assumindo 1058=Brasil aqui)
            if not cnpj_val and not cpf_val:
                continue

            self._add_line(
                '0150',
                str(cliente.id_cliente).zfill(8),  # COD_PART
                (cliente.nome_razao_social or 'CONSUMIDOR FINAL')[:60],  # NOME
                '1058',  # COD_PAIS (Brasil) - Tabela IBGE é 1058
                cnpj_val,  # CNPJ
                cpf_val,   # CPF
                re.sub(r'[^0-9]', '', cliente.inscricao_estadual or ''),  # IE
                cliente.codigo_municipio_ibge or '9999999',  # COD_MUN - '9999999' se não informado (Brasil)
                '',  # SUFRAMA
                (cliente.endereco or '')[:60],  # END
                (cliente.numero or '')[:10],  # NUM
                '',  # COMPL
                (cliente.bairro or '')[:60]  # BAIRRO
            )

    
    def _gerar_registro_0190(self):
        """0190 - Identificação das Unidades de Medida"""
        unidades_usadas = set()
        
        # Coletar unidades dos itens das vendas
        for venda in self.vendas:
            itens = VendaItem.objects.filter(id_venda=venda)
            for item in itens:
                if item.id_produto:
                    produto = item.id_produto
                    unidade = produto.unidade_medida or 'UN'
                    unidades_usadas.add(unidade)
        
        # Adicionar unidades padrão
        unidades_usadas.update(['UN', 'KG', 'MT', 'LT', 'PC', 'CX'])
        
        for unidade in sorted(unidades_usadas):
            descricao = {
                'UN': 'UNIDADE',
                'KG': 'QUILOGRAMA',
                'MT': 'METRO',
                'LT': 'LITRO',
                'PC': 'PEÇA',
                'CX': 'CAIXA',
                'DZ': 'DUZIA',
                'GR': 'GRAMA',
                'TON': 'TONELADA'
            }.get(unidade, unidade)
            
            self._add_line('0190', unidade, descricao)
    
    def _gerar_registro_0200(self):
        """0200 - Tabela de Identificação do Item (Produto e Serviços)"""
        # Obter todos os produtos únicos das vendas
        itens_vendidos = VendaItem.objects.filter(
            id_venda__in=self.vendas
        ).select_related('id_produto')
        
        produtos_ids = set()
        for item in itens_vendidos:
            if item.id_produto:
                produtos_ids.add(item.id_produto.id_produto)
        
        produtos = Produto.objects.filter(id_produto__in=produtos_ids)
        
        for produto in produtos:
            tipo_item = '00'  # 00=Mercadoria para Revenda, 01=Matéria-Prima, etc.
            
            # Buscar alíquota de PIS da tributação (se existir)
            aliq_pis = 0
            try:
                if hasattr(produto, 'tributacao_detalhada'):
                    aliq_pis = produto.tributacao_detalhada.pis_aliquota or 0
            except TributacaoProduto.DoesNotExist:
                pass
            
            self._add_line(
                '0200',
                str(produto.id_produto).zfill(8),  # COD_ITEM
                produto.descricao or produto.nome_produto,  # DESCR_ITEM
                '',  # COD_BARRA - Código de barras (não disponível em Produto)
                '',  # COD_ANT_ITEM - Código anterior do item
                produto.unidade_medida or 'UN',  # UNID_INV - Unidade de medida
                tipo_item,  # TIPO_ITEM
                produto.ncm or '',  # COD_NCM
                '',  # EX_IPI
                '',  # COD_GEN - Código do gênero
                '',  # COD_LST - Código do serviço (item de serviço)
                self._formatar_valor(aliq_pis, 2)  # ALIQ_ICMS - Alíquota de ICMS
            )
            
            # 0206 - Código de Produto conforme Tabela ANP (Combustíveis)
            # Adicionar se o produto for combustível
    
    def _gerar_registro_0500(self):
        """0500 - Plano de Contas Contábeis"""
        # Gerar conta analítica padrão para receita de vendas
        # Estrutura: REG|DT_ALT|COD_NAT_CC|IND_CTA|NIVEL|COD_CTA|NOME_CTA|COD_CTA_SUP|NAT_CTA_SUP
        # Layout versão 1.35: 9 campos
        
        # Conta principal: Receita Bruta de Vendas (sintética)
        self._add_line(
            '0500',
            self._formatar_data(self.data_inicio),  # DT_ALT - Data da inclusão/alteração
            '01',  # COD_NAT_CC - 01=Conta sintética, 02=Conta analítica
            'R',   # IND_CTA - R=Resultado (receita/despesa)
            '1',   # NIVEL - Nível da conta
            '3.1.01',  # COD_CTA - Código da conta
            'RECEITA BRUTA DE VENDAS',  # NOME_CTA
            '',    # COD_CTA_SUP - Código da conta superior (vazio para nível 1)
            ''     # NAT_CTA_SUP - Natureza da conta superior (vazio)
        )
        
        # Conta analítica para referenciar nos registros C/D
        self._add_line(
            '0500',
            self._formatar_data(self.data_inicio),
            '02',  # Conta analítica
            'R',   # Resultado
            '2',   # Nível 2
            '3.1.01.001',  # Código da conta analítica
            'VENDAS DE MERCADORIAS',
            '3.1.01',  # COD_CTA_REF - Código de referência (conta superior)
            ''      # CNPJ_EST - CNPJ do estabelecimento (vazio para matriz única)
        )
    
    # ==================== BLOCO A - SERVIÇOS ISS ====================
    
    def _gerar_bloco_a(self):
        """Bloco A - Documentos Fiscais - Serviços (ISS)"""
        logger.info("Gerando Bloco A - Serviços (ISS)...")
        
        # A001 - Abertura do Bloco A
        # IND_MOV=1 pois não há NFS-e escrituradas aqui (somente NF-e/NFC-e no Bloco C)
        self._add_line('A001', '1')  # IND_MOV - 1=Bloco sem dados
        
        # A010 - Serviços - Documentos Fiscais
        # Incluir aqui notas de serviço (NFS-e) se houver
        
        # A990 - Encerramento do Bloco A
        self._add_line('A990', str(self.block_counts.get('A', 0) + 1))
    
    # ==================== BLOCO C - MERCADORIAS ====================
    
    def _gerar_bloco_c(self):
        """Bloco C - Documentos Fiscais I - Mercadorias (ICMS/IPI)"""
        logger.info("Gerando Bloco C - Mercadorias...")
        
        # C001 - Abertura do Bloco C
        self._add_line('C001', '0')  # IND_MOV - 0=Bloco com dados
        
        # Agrupar vendas por período (mensal)
        vendas_por_periodo = {}
        
        for venda in self.vendas:
            # Chave: AAAA-MM
            periodo = venda.data_documento.strftime('%Y%m')
            
            if periodo not in vendas_por_periodo:
                vendas_por_periodo[periodo] = []
            vendas_por_periodo[periodo].append(venda)
        
        # Gerar registros por período
        for periodo in sorted(vendas_por_periodo.keys()):
            vendas_periodo = vendas_por_periodo[periodo]
            
            # C010 - Identificação do Estabelecimento
            # Layout: REG|CNPJ|IND_ESCRI
            # CNPJ é obrigatório.
            cnpj_est = self.empresa.cpf_cnpj
            import re
            cnpj_est = re.sub(r'[^0-9]', '', cnpj_est)
            
            self._add_line('C010', cnpj_est, '1')  # CNPJ, IND_ESCRI (1=Consolidado)
            
            # Processar vendas do período
            for venda in vendas_periodo:
                self._gerar_registro_c100(venda)
            
            # C990 - Encerramento do Período
        
        # C990 - Encerramento do Bloco C
        self._add_line('C990', str(self.block_counts.get('C', 0) + 1))
    
    def _gerar_registro_c100(self, venda):
        """C100 - Documento - Nota Fiscal (Código 01), Nota Fiscal Avulsa (Código 1B), 
        Nota Fiscal de Produtor (Código 04) e NF-e (Código 55)"""
        
        # Determinar código do modelo a partir da chave NFe (posições 20-21, base 0)
        # Estrutura da chave: cUF(2)+AAMM(4)+CNPJ(14)+mod(2)+serie(3)+nNF(9)+tpEmis(1)+cNF(8)+cDV(1)
        chv_nfe_limpa = (venda.chave_nfe or '').strip()
        if len(chv_nfe_limpa) == 44:
            cod_mod = chv_nfe_limpa[20:22]  # posição 20-21 da chave = modelo
        elif hasattr(venda, 'modelo_nfe') and venda.modelo_nfe:
            cod_mod = str(venda.modelo_nfe).zfill(2)
        else:
            # Fallback: verificar se é NFC-e ou NF-e pelo status
            cod_mod = '65'  # NFC-e padrão
        
        # Indicador de operação: 0=Entrada, 1=Saída
        ind_oper = '1'  # Saída (venda)
        
        # Indicador emitente: 0=Emissão própria, 1=Terceiros
        ind_emit = '0'  # Emissão própria
        
        # Código do participante (cliente)
        # Só incluir se o cliente tiver CPF/CNPJ válido (para ter gerado registro 0150)
        cod_part = ''
        if venda.id_cliente:
            import re
            cpf_cnpj = re.sub(r'[^0-9]', '', getattr(venda.id_cliente, 'cpf_cnpj', '') or '')
            if len(cpf_cnpj) == 14 or (len(cpf_cnpj) == 11 and cpf_cnpj != '00000000000'):
                cod_part = str(venda.id_cliente.id_cliente).zfill(8)

        # Código da situação do documento
        # 00=Regular, 01=Extemporânea, 02=Cancelada, 03=Cancelada extemporânea, etc.
        cod_sit = '02' if venda.status_nfe == 'CANCELADA' else '00'
        
        # Série do documento
        serie = str(venda.serie_nfe or 1)
        
        # Número do documento
        num_doc = str(venda.numero_nfe or 0)
        
        # Chave da NFe
        chv_nfe = venda.chave_nfe or ''
        
        # Datas
        dt_doc = self._formatar_data(venda.data_documento)
        dt_e_s = dt_doc  # Data de entrada/saída
        
        # Calcular impostos da venda
        impostos = self._calcular_impostos_venda(venda)
        
        # Valores
        vl_doc = self._formatar_valor(venda.valor_total or 0)
        vl_desc = self._formatar_valor(impostos['desconto'])
        vl_merc = self._formatar_valor(impostos['total_produtos'])
        vl_bc_pis = self._formatar_valor(impostos['base_calculo_pis'])
        vl_pis = self._formatar_valor(impostos['valor_pis'])
        vl_bc_cofins = self._formatar_valor(impostos['base_calculo_cofins'])
        vl_cofins = self._formatar_valor(impostos['valor_cofins'])
        
        # Acumular totais para apuração
        if venda.status_nfe != 'CANCELADA':
            self.total_bc_pis += impostos['base_calculo_pis']
            self.total_pis += impostos['valor_pis']
            self.total_bc_cofins += impostos['base_calculo_cofins']
            self.total_cofins += impostos['valor_cofins']
        
        # C100 - Documento - Nota Fiscal
        # Layout: REG|IND_OPER|IND_EMIT|COD_PART|COD_MOD|COD_SIT|SER|NUM_DOC|CHV_NFE|DT_DOC|DT_E_S|VL_DOC|IND_PGTO|VL_DESC|VL_ABAT_NT|VL_MERC|IND_FRT|VL_FRT|VL_SEG|VL_OUT_DA|VL_BC_ICMS|VL_ICMS|VL_BC_ICMS_ST|VL_ICMS_ST|VL_IPI|VL_PIS|VL_COFINS|VL_PIS_ST|VL_COFINS_ST
        # Atenção: C100 no EFD-Contribuições é diferente do EFD-ICMS/IPI
        
        # Layout SPED Contribuições (Guia 1.35):
        # 01 REG
        # 02 IND_OPER
        # 03 IND_EMIT
        # 04 COD_PART
        # 05 COD_MOD
        # 06 COD_SIT
        # 07 SER
        # 08 NUM_DOC
        # 09 CHV_NFE
        # 10 DT_DOC
        # 11 DT_E_S
        # 12 VL_DOC
        # 13 IND_PGTO
        # 14 VL_DESC
        # 15 VL_ABAT_NT
        # 16 VL_MERC
        # 17 IND_FRT
        # 18 VL_FRT
        # 19 VL_SEG
        # 20 VL_OUT_DA
        # 21 VL_BC_ICMS
        # 22 VL_ICMS
        # 23 VL_BC_ICMS_ST
        # 24 VL_ICMS_ST
        # 25 VL_IPI (Não tem BC PIS e BC COFINS aqui no C100! Tem PIS e COFINS totais)
        # 26 VL_PIS
        # 27 VL_COFINS
        # 28 VL_PIS_ST
        # 29 VL_COFINS_ST
        
        self._add_line(
            'C100',
            ind_oper,  # IND_OPER
            ind_emit,  # IND_EMIT
            cod_part,  # COD_PART
            cod_mod,   # COD_MOD
            cod_sit,   # COD_SIT
            serie,     # SER
            num_doc,   # NUM_DOC
            chv_nfe,   # CHV_NFE
            dt_doc,    # DT_DOC
            dt_e_s,    # DT_E_S
            vl_doc,    # VL_DOC
            '0',       # IND_PGTO - 0=À Vista (Padrão) - Deve ser validado
            vl_desc,   # VL_DESC
            '0,00',    # VL_ABAT_NT
            vl_merc,   # VL_MERC
            '9',       # IND_FRT
            '0,00',    # VL_FRT
            '0,00',    # VL_SEG
            '0,00',    # VL_OUT_DA
            '0,00',    # VL_BC_ICMS (Não temos fácil acesso, deixar 0)
            '0,00',    # VL_ICMS
            '0,00',    # VL_BC_ICMS_ST
            '0,00',    # VL_ICMS_ST
            '0,00',    # VL_IPI
            vl_pis,    # VL_PIS
            vl_cofins, # VL_COFINS
            '0,00',    # VL_PIS_ST
            '0,00'     # VL_COFINS_ST
        )
        
        # C110 - Informação Complementar da Nota Fiscal (Código 01, 1B, 04 e 55)
        # Incluir informações complementares se houver
        
        # C111 - Processo Referenciado
        # Incluir se houver processos judiciais/administrativos
        
        # C120 - Complemento do Documento - Operações de Importação
        # Incluir se for operação de importação
        
        # C170 - Itens do Documento (Código 01, 1B, 04 e 55)
        if cod_mod in ['01', '1B', '04', '55']:
            self._gerar_registro_c170(venda)
        
        # C175 - Registro Analítico do Documento (Código 65)
        if cod_mod == '65':  # NFC-e
            self._gerar_registro_c175(venda)
        
        # C180 - Consolidação dos Documentos Emitidos por ECF (Código 02, 2D e 59)
        # Incluir se houver vendas por ECF
        
        # C190 - Registro Analítico do Documento (NÃO EXISTE NO SPED CONTRIBUIÇÕES - C190 é do SPED FISCAL)
        # No SPED Contribuições, a analise é feita via C170 (Analítico Item) para NF-e ou C175 (Analítico) para NFC-e
        # O registro C190 não consta no layout do Guia Prático da EFD-Contribuições.
        # Os registros filhos de C100 são C110, C111, C120, C170, C175.
        
        # Comentando a chamada para evitar erro de hierarquia
        # self._gerar_registro_c190(venda)

    
    def _gerar_registro_c170(self, venda):
        """C170 - Itens do Documento (Código 01, 1B, 04 e 55)"""
        itens = VendaItem.objects.filter(id_venda=venda).select_related('id_produto')
        
        num_item = 0
        for item in itens:
            num_item += 1
            
            produto = item.id_produto
            if not produto:
                continue
            
            cod_item = str(produto.id_produto).zfill(8)
            descr_compl = ''  # Descrição complementar
            qtd = self._formatar_valor(item.quantidade or 1, 4)
            unid = produto.unidade_medida or 'UN'
            vl_item = self._formatar_valor(item.valor_total or 0)
            vl_desc = self._formatar_valor(item.desconto_valor or 0)
            ind_mov = '0'  # 0=Sim (movimenta estoque), 1=Não
            
            # Buscar tributação do produto
            cst_pis = '01'
            cst_cofins = '01'
            aliq_pis_decimal = Decimal(0)
            aliq_cofins_decimal = Decimal(0)
            
            try:
                if hasattr(produto, 'tributacao_detalhada'):
                    tributacao = produto.tributacao_detalhada
                    if tributacao.cst_pis_cofins:
                        raw_cst = str(tributacao.cst_pis_cofins).strip()
                        cst_pis = raw_cst.zfill(2)[-2:]
                        cst_cofins = raw_cst.zfill(2)[-2:]
                    aliq_pis_decimal = tributacao.pis_aliquota or Decimal(0)
                    aliq_cofins_decimal = tributacao.cofins_aliquota or Decimal(0)
            except TributacaoProduto.DoesNotExist:
                pass
            
            # Auto-corrigir CST "00" (não configurado) para código válido
            if cst_pis in ('00', ''):
                cst_pis = '01'
            if cst_cofins in ('00', ''):
                cst_cofins = '01'
            
            # Quando CST=01, alíquota deve corresponder ao regime da empresa
            _regime_c170 = str(getattr(self.empresa, 'regime_apuracao_pis_cofins', '2') or '2')
            if cst_pis == '01':
                if _regime_c170 == '1':  # Cumulativo: sempre 0,65% (fixo)
                    aliq_pis_decimal = Decimal('0.65')
                elif aliq_pis_decimal <= 0:  # Não-cumulativo: usar configurado ou padrão
                    aliq_pis_decimal = getattr(self.empresa, 'aliquota_pis_padrao', None) or Decimal('1.65')
            if cst_cofins == '01':
                if _regime_c170 == '1':  # Cumulativo: sempre 3,00% (fixo)
                    aliq_cofins_decimal = Decimal('3.00')
                elif aliq_cofins_decimal <= 0:  # Não-cumulativo: usar configurado ou padrão
                    aliq_cofins_decimal = getattr(self.empresa, 'aliquota_cofins_padrao', None) or Decimal('7.60')

            # Calcular base de cálculo (valor total do item - desconto)
            base_calculo = (item.valor_total or Decimal(0))
            
            # Calcular PIS e COFINS
            vl_pis_calc = (base_calculo * aliq_pis_decimal / Decimal(100))
            vl_cofins_calc = (base_calculo * aliq_cofins_decimal / Decimal(100))
            
            # Formatar valores
            vl_bc_pis = self._formatar_valor(base_calculo)
            aliq_pis = self._formatar_valor(aliq_pis_decimal, 4)
            vl_pis = self._formatar_valor(vl_pis_calc)
            
            # CST COFINS
            vl_bc_cofins = self._formatar_valor(base_calculo)
            aliq_cofins = self._formatar_valor(aliq_cofins_decimal, 4)
            vl_cofins = self._formatar_valor(vl_cofins_calc)
            
            # CFOP - buscar da operação ou da tributação, default 5102
            cfop_item = ''
            try:
                if venda.id_operacao and hasattr(venda.id_operacao, 'cfop'):
                    cfop_item = str(venda.id_operacao.cfop or '')
            except Exception:
                pass
            if not cfop_item:
                cfop_item = '5102'  # saída simples de mercadoria
            
            # C170 layout EFD-Contribuições (39 campos incluindo REG):
            # REG|NUM_ITEM|COD_ITEM|DESCR_COMPL|QTD|UNID|VL_ITEM|VL_DESC|IND_MOV|
            # CST_ICMS|CFOP|COD_NAT|VL_BC_ICMS|ALIQ_ICMS|VL_ICMS|VL_BC_ICMS_ST|
            # ALIQ_ST|VL_ICMS_ST|IND_APUR|CST_IPI|COD_ENQ|VL_BC_IPI|ALIQ_IPI|VL_IPI|
            # CST_PIS|VL_BC_PIS|ALIQ_PIS_%|QUANT_BC_PIS|ALIQ_PIS_QUANT|VL_PIS|
            # CST_COFINS|VL_BC_COFINS|ALIQ_COFINS_%|QUANT_BC_COFINS|ALIQ_COFINS_QUANT|VL_COFINS|
            # VL_PIS_ST|VL_COFINS_ST|COD_CTA
            self._add_line(
                'C170',
                str(num_item),  # 02 NUM_ITEM
                cod_item,       # 03 COD_ITEM
                descr_compl,    # 04 DESCR_COMPL
                qtd,            # 05 QTD
                unid,           # 06 UNID
                vl_item,        # 07 VL_ITEM
                vl_desc,        # 08 VL_DESC
                ind_mov,        # 09 IND_MOV
                '',             # 10 CST_ICMS
                cfop_item,      # 11 CFOP
                '',             # 12 COD_NAT
                '0,00',         # 13 VL_BC_ICMS
                '0,00',         # 14 ALIQ_ICMS
                '0,00',         # 15 VL_ICMS
                '0,00',         # 16 VL_BC_ICMS_ST
                '0,00',         # 17 ALIQ_ST
                '0,00',         # 18 VL_ICMS_ST
                '',             # 19 IND_APUR
                '',             # 20 CST_IPI
                '',             # 21 COD_ENQ
                '0,00',         # 22 VL_BC_IPI
                '0,00',         # 23 ALIQ_IPI
                '0,00',         # 24 VL_IPI
                cst_pis,        # 25 CST_PIS
                vl_bc_pis,      # 26 VL_BC_PIS
                aliq_pis,       # 27 ALIQ_PIS_%
                '',             # 28 QUANT_BC_PIS
                '',             # 29 ALIQ_PIS_QUANT
                vl_pis,         # 30 VL_PIS
                cst_cofins,     # 31 CST_COFINS
                vl_bc_cofins,   # 32 VL_BC_COFINS
                aliq_cofins,    # 33 ALIQ_COFINS_%
                '',             # 34 QUANT_BC_COFINS
                '',             # 35 ALIQ_COFINS_QUANT
                vl_cofins,      # 36 VL_COFINS
                '',             # 37 COD_CTA
            )
            
            # C171 - Complemento do Item - Armazenamento de Combustíveis
            # Incluir se o produto for combustível
            
            # C172 - Complemento do Item - Operações com ISSQN
            # Incluir se for item de serviço com ISSQN
            
            # C173 - Operações com Produtos Sujeitos a Selo de Controle
            # Incluir se aplicável
            
            # C174 - Operações com Medicamentos
            # Incluir se o produto for medicamento
            
            # C175 - Registro Anal do Documento CUPOM FISCAL ELETRÔNICO - SAT (Código 59)
            # Incluir se for CF-e SAT
            
            # C176 - Ressarcimento de ICMS em Operações com Substituição Tributária
            # Incluir se aplicável
            
            # C177 - Complemento do Item - Operações com Veículos Novos
            # Incluir se o produto for veículo novo
            
            # C178 - Operações com Produtos Sujeitos a Tributação de IPI por Unidade
            # Incluir se aplicável
            
            # C179 - Informações Complementares ST
            # Incluir se aplicável
    
    def _gerar_registro_c175(self, venda):
        """C175 - Registro Analítico do Documento (Código 65 - NFC-e)"""
        # Consolidação dos itens por CST/CFOP/Alíquotas
        itens = VendaItem.objects.filter(id_venda=venda)
        
        # Agrupar por chave única de tributação
        grupos = {}
        
        for item in itens:
            # Buscar dados de tributação do produto
            produto = item.id_produto
            
            cst_pis_item = '01'
            cst_cofins_item = '01'
            aliq_pis_item = Decimal(0)
            aliq_cofins_item = Decimal(0)
            
            if produto:
                try:
                    if hasattr(produto, 'tributacao_detalhada'):
                        tributacao = produto.tributacao_detalhada
                        if tributacao.cst_pis_cofins:
                            cst_pis_item = tributacao.cst_pis_cofins
                            cst_cofins_item = tributacao.cst_pis_cofins
                        aliq_pis_item = tributacao.pis_aliquota or Decimal(0)
                        aliq_cofins_item = tributacao.cofins_aliquota or Decimal(0)
                except TributacaoProduto.DoesNotExist:
                    pass
            
            # Auto-corrigir CST "000" ou "00" (não configurado) para código válido
            if str(cst_pis_item).strip() in ('00', '000', ''):
                cst_pis_item = '01'
            if str(cst_cofins_item).strip() in ('00', '000', ''):
                cst_cofins_item = '01'
            
            # Quando CST=01, alíquota deve corresponder ao regime da empresa
            _regime_c175 = str(getattr(self.empresa, 'regime_apuracao_pis_cofins', '2') or '2')
            if str(cst_pis_item).strip().zfill(2) == '01':
                if _regime_c175 == '1':  # Cumulativo: sempre 0,65% (fixo)
                    aliq_pis_item = Decimal('0.65')
                elif aliq_pis_item <= 0:  # Não-cumulativo: usar configurado ou padrão
                    aliq_pis_item = getattr(self.empresa, 'aliquota_pis_padrao', None) or Decimal('1.65')
            if str(cst_cofins_item).strip().zfill(2) == '01':
                if _regime_c175 == '1':  # Cumulativo: sempre 3,00% (fixo)
                    aliq_cofins_item = Decimal('3.00')
                elif aliq_cofins_item <= 0:  # Não-cumulativo: usar configurado ou padrão
                    aliq_cofins_item = getattr(self.empresa, 'aliquota_cofins_padrao', None) or Decimal('7.60')
            
            cfop = (item.cfop if hasattr(item, 'cfop') else None) or ''
            if not cfop:
                try:
                    if venda.id_operacao and hasattr(venda.id_operacao, 'cfop'):
                        cfop = str(venda.id_operacao.cfop or '')
                except Exception:
                    pass
            cfop = cfop or '5102'
            
            # Chave de agrupamento: CFOP + CST_PIS + ALIQ_PIS + CST_COFINS + ALIQ_COFINS
            chave = f"{cfop}|{cst_pis_item}|{aliq_pis_item}|{cst_cofins_item}|{aliq_cofins_item}"
            
            if chave not in grupos:
                grupos[chave] = {
                    'cfop': cfop,
                    'cst_pis': cst_pis_item,
                    'aliq_pis': aliq_pis_item,
                    'cst_cofins': cst_cofins_item,
                    'aliq_cofins': aliq_cofins_item,
                    'vl_oper': Decimal(0),
                    'vl_desc': Decimal(0),
                    'vl_bc_pis': Decimal(0),
                    'vl_pis': Decimal(0),
                    'vl_bc_cofins': Decimal(0),
                    'vl_cofins': Decimal(0)
                }
                
            grupo = grupos[chave]
            
            # Valores do item
            valor_item = item.valor_total or Decimal(0)
            desconto_item = item.desconto_valor or Decimal(0)
            
            # Calcular impostos deste item
            base_calculo = valor_item # Assumindo sem desconto na BC por simplificação ou regra configurada
            vl_pis_calc = (base_calculo * aliq_pis_item / Decimal(100))
            vl_cofins_calc = (base_calculo * aliq_cofins_item / Decimal(100))
            
            # Acumular no grupo
            grupo['vl_oper'] += valor_item
            grupo['vl_desc'] += desconto_item
            grupo['vl_bc_pis'] += base_calculo
            grupo['vl_pis'] += vl_pis_calc
            grupo['vl_bc_cofins'] += base_calculo
            grupo['vl_cofins'] += vl_cofins_calc
            
        # Gerar registros C175 para cada grupo
        for chave, dados in grupos.items():
            # Corrigir CST para 2 dígitos e validar
            # Se vier 000 ou 00, e tiver alíquota > 0, assume 01 (Tributado Básica)
            # Se vier 000 ou 00, e tiver alíquota = 0, assume 04 (Monofásica/Aliq Zero) ou 06 (Aliq Zero) ou 49/99
            
            cst_pis_formatado = str(dados['cst_pis']).zfill(2)[-2:] 
            cst_cofins_formatado = str(dados['cst_cofins']).zfill(2)[-2:]
            
            # Validação simples para evitar erro de validação do SPED (CST inválido)
            if cst_pis_formatado == '00':
                if dados['aliq_pis'] > 0:
                    cst_pis_formatado = '01'
                else:
                    cst_pis_formatado = '49' # Outras operações de saída
            
            if cst_cofins_formatado == '00':
                if dados['aliq_cofins'] > 0:
                    cst_cofins_formatado = '01'
                else:
                    cst_cofins_formatado = '49' # Outras operações de saída
            
            self._add_line(
                'C175',
                str(dados['cfop']),                             # CFOP
                self._formatar_valor(dados['vl_oper']),         # VL_OPR - Valor da operação
                self._formatar_valor(dados['vl_desc']),         # VL_DESC - Valor do desconto
                cst_pis_formatado,                              # CST_PIS
                self._formatar_valor(dados['vl_bc_pis']),       # VL_BC_PIS
                self._formatar_valor(dados['aliq_pis'], 4),     # ALIQ_PIS
                '',                                             # QUANT_BC_PIS
                '',                                             # ALIQ_PIS_QUANT
                self._formatar_valor(dados['vl_pis']),          # VL_PIS
                cst_cofins_formatado,                           # CST_COFINS
                self._formatar_valor(dados['vl_bc_cofins']),    # VL_BC_COFINS
                self._formatar_valor(dados['aliq_cofins'], 4),  # ALIQ_COFINS
                '',                                             # QUANT_BC_COFINS
                '',                                             # ALIQ_COFINS_QUANT
                self._formatar_valor(dados['vl_cofins']),       # VL_COFINS
                '3.1.01.001',                                   # COD_CTA - Código da conta contábil
                ''                                              # INFO_COMPL
            )
    
    def _gerar_registro_c190(self, venda):
        """C190 - Registro Analítico do Documento (Código 01, 1B, 04, 55 e 65)"""
        # Consolidação dos itens por CST
        itens = VendaItem.objects.filter(id_venda=venda)
        
        # Agrupar por CST
        grupos_cst = {}
        
        for item in itens:
            # Buscar dados de tributação do produto se não existirem no item
            produto = item.id_produto
            
            cst_pis_item = '01'
            cst_cofins_item = '01'
            aliq_pis_item = Decimal(0)
            aliq_cofins_item = Decimal(0)
            
            if produto:
                try:
                    if hasattr(produto, 'tributacao_detalhada'):
                        tributacao = produto.tributacao_detalhada
                        if tributacao.cst_pis_cofins:
                            cst_pis_item = tributacao.cst_pis_cofins.zfill(2)
                            cst_cofins_item = tributacao.cst_pis_cofins.zfill(2)
                        aliq_pis_item = tributacao.pis_aliquota or Decimal(0)
                        aliq_cofins_item = tributacao.cofins_aliquota or Decimal(0)
                except TributacaoProduto.DoesNotExist:
                    pass
            
            # Usar valores do item se existirem (mas não existem no model atual)
            # Então calculamos dinamicamente
            
            cfop = (item.cfop if hasattr(item, 'cfop') else None) or ''
            if not cfop:
                try:
                    if venda.id_operacao and hasattr(venda.id_operacao, 'cfop'):
                        cfop = str(venda.id_operacao.cfop or '')
                except Exception:
                    pass
            cfop = cfop or '5102'  # saída simples de mercadoria (fallback)
            
            chave = f"{cfop}|{cst_pis_item}|{cst_cofins_item}|{aliq_pis_item}|{aliq_cofins_item}"
            
            if chave not in grupos_cst:
                grupos_cst[chave] = {
                    'cfop': cfop,
                    'cst_pis': cst_pis_item,
                    'cst_cofins': cst_cofins_item,
                    'aliq_pis': aliq_pis_item,
                    'aliq_cofins': aliq_cofins_item,
                    'vl_oper': Decimal(0),
                    'vl_bc_pis': Decimal(0),
                    'vl_pis': Decimal(0),
                    'vl_bc_cofins': Decimal(0),
                    'vl_cofins': Decimal(0),
                }
            
            grupo = grupos_cst[chave]
            
            valor_item = item.valor_total or Decimal(0)
            desconto_item = item.desconto_valor or Decimal(0)
            base_calculo = valor_item # Em tese deveria descontar desconto se for incondicional
            
            grupo['vl_oper'] += valor_item
            
            # Calcular impostos
            vl_pis_calc = (base_calculo * aliq_pis_item / Decimal(100))
            vl_cofins_calc = (base_calculo * aliq_cofins_item / Decimal(100))
            
            grupo['vl_bc_pis'] += base_calculo
            grupo['vl_pis'] += vl_pis_calc
            grupo['vl_bc_cofins'] += base_calculo
            grupo['vl_cofins'] += vl_cofins_calc
        
        # Gerar registros C190
        for chave, grupo in grupos_cst.items():
            self._add_line(
                'C190',
                '',  # IND_OPER - Herdado do C100
                '',  # IND_EMIT - Herdado do C100
                grupo['cfop'],  # CFOP
                grupo['aliq_pis'],  # ALIQ_PIS
                grupo['cst_pis'],  # CST_PIS
                self._formatar_valor(grupo['vl_oper']),  # VL_OPER
                self._formatar_valor(grupo['vl_bc_pis']),  # VL_BC_PIS
                self._formatar_valor(grupo['vl_pis']),  # VL_PIS
                grupo['aliq_cofins'],  # ALIQ_COFINS
                grupo['cst_cofins'],  # CST_COFINS
                self._formatar_valor(grupo['vl_bc_cofins']),  # VL_BC_COFINS
                self._formatar_valor(grupo['vl_cofins']),  # VL_COFINS
                '',  # COD_CTA - Código da conta analítica contábil
                '',  # DESC_DOC_OPER - Descrição da operação
            )
    
    # ==================== BLOCO D - SERVIÇOS ICMS ====================
    
    def _gerar_bloco_d(self):
        """Bloco D - Documentos Fiscais II - Serviços (ICMS)"""
        logger.info("Gerando Bloco D - Serviços (ICMS)...")
        
        # D001 - Abertura do Bloco D
        tem_dados = len(self.ctes) > 0
        self._add_line('D001', '0' if tem_dados else '1')  # IND_MOV
        
        if tem_dados:
            # D010 - Identificação do Estabelecimento (SPED Contribuições: REG|CNPJ)
            import re
            cnpj_empresa = re.sub(r'[^0-9]', '', self.empresa.cpf_cnpj or '')
            self._add_line('D010', cnpj_empresa)  # CNPJ
            
            # Processar CTes
            for cte in self.ctes:
                self._gerar_registro_d100(cte)
        
        # D990 - Encerramento do Bloco D
        self._add_line('D990', str(self.block_counts.get('D', 0) + 1))
    
    def _gerar_registro_d100(self, cte):
        """D100 - Aquisição de Serviços de Transporte"""
        # Similar ao C100 mas para CTe
        pass
    
    # ==================== BLOCO F - DEMAIS DOCUMENTOS ====================
    
    def _gerar_bloco_f(self):
        """Bloco F - Demais Documentos e Operações"""
        logger.info("Gerando Bloco F - Demais Documentos...")
        
        # F001 - Abertura do Bloco F
        self._add_line('F001', '1')  # IND_MOV - 1=Bloco sem dados
        
        # F010 - Identificação do Estabelecimento
        # F100 - Demais Documentos
        # F111 - Processo Referenciado
        # F120 - Bens Incorporados ao Ativo Imobilizado
        # F130 - Bens Incorporados ao Ativo Imobilizado - Operações Geradoras de Crédito
        
        # F990 - Encerramento do Bloco F
        self._add_line('F990', str(self.block_counts.get('F', 0) + 1))
    
    # ==================== BLOCO M - APURAÇÃO ====================
    
    def _gerar_bloco_m(self):
        """Bloco M - Apuração da Contribuição e Crédito de PIS/PASEP e da COFINS"""
        logger.info("Gerando Bloco M - Apuração...")
        
        # M001 - Abertura do Bloco M
        self._add_line('M001', '0')  # IND_MOV - 0=Bloco com dados
        
        # M100 - Crédito de PIS Relativo ao Período
        if self.total_credito_pis > 0:
            self._add_line(
                'M100',
                '101',  # COD_CRED - 101=Crédito vinculado à receita tributada no mercado interno (Básico) - Ajustar conforme necessidade
                '0',    # IND_CRED_ORI - 0=Operação própria
                self._formatar_valor(self.total_bc_pis),  # VL_BC_PIS
                '1,65', # ALIQ_PIS (Exemplo, ideal é vir dinâmico ou média)
                '',     # QUANT_BC_PIS
                '',     # ALIQ_PIS_QUANT
                self._formatar_valor(self.total_credito_pis),  # VL_CRED
                '0,00', # VL_AJUS_ACRES
                '0,00', # VL_AJUS_REDUC
                '0,00', # VL_CRED_DIF
                self._formatar_valor(self.total_credito_pis),  # VL_CRED_DISP
                '0',    # IND_DESC_CRED
                '0,00', # VL_CRED_DESC
                self._formatar_valor(self.total_credito_pis), # SLD_CRED
            )
        
        # M105 - Detalhamento da Base de Cálculo do Crédito
        # M110 - Ajustes do Crédito de PIS/PASEP Apurado
        # M115 - Ajuste Detalhamento dos Ajustes do Crédito
        
        # M200 - Consolidação da Contribuição para o PIS/PASEP do Período
        vl_pis_apurado = self.total_pis - self.total_credito_pis
        
        # Regime: 1=Cumulativo, 2=Não-cumulativo, 3=Ambos
        regime = str(getattr(self.empresa, 'regime_apuracao_pis_cofins', '2') or '2')
        
        # Separar valores NC e CUM conforme regime
        if regime == '1':  # exclusivamente cumulativo
            vl_nc_pis = Decimal(0)
            vl_cred_nc_pis = Decimal(0)
            vl_nc_dev_pis = Decimal(0)
            vl_nc_rec_pis = Decimal(0)
            vl_cum_pis = self.total_pis
            vl_cum_rec_pis = vl_pis_apurado if vl_pis_apurado > 0 else Decimal(0)
        elif regime == '2':  # exclusivamente não-cumulativo
            vl_nc_pis = self.total_pis
            vl_cred_nc_pis = self.total_credito_pis
            vl_nc_dev_pis = vl_pis_apurado if vl_pis_apurado > 0 else Decimal(0)
            vl_nc_rec_pis = vl_pis_apurado if vl_pis_apurado > 0 else Decimal(0)
            vl_cum_pis = Decimal(0)
            vl_cum_rec_pis = Decimal(0)
        else:  # 3 = ambos
            vl_nc_pis = self.total_pis
            vl_cred_nc_pis = self.total_credito_pis
            vl_nc_dev_pis = vl_pis_apurado if vl_pis_apurado > 0 else Decimal(0)
            vl_nc_rec_pis = vl_pis_apurado if vl_pis_apurado > 0 else Decimal(0)
            vl_cum_pis = self.total_pis
            vl_cum_rec_pis = vl_pis_apurado if vl_pis_apurado > 0 else Decimal(0)

        vl_total_rec_pis = max(vl_nc_rec_pis, vl_cum_rec_pis)

        # M200 - Consolidação da Contribuição para o PIS/PASEP do Período
        # Layout v1.35: REG(01)|VL_TOT_CONT_NC_PER(02)|VL_TOT_CRED_DESC(03)|VL_TOT_AJ_REDUC_NC(04)|
        #   VL_TOT_CONT_NC_DEV(05)|VL_RET_NC(06)|VL_OUT_DED_NC(07)|VL_CONT_NC_REC(08)|
        #   VL_TOT_CONT_CUM_PER(09)|VL_RET_CUM(10)|VL_OUT_DED_CUM(11)|VL_CONT_CUM_REC(12)|
        #   VL_TOT_CONT_REC(13)|NUM_PROC(14)
        self._add_line(
            'M200',
            self._formatar_valor(vl_nc_pis),          # 02 VL_TOT_CONT_NC_PER
            self._formatar_valor(vl_cred_nc_pis),     # 03 VL_TOT_CRED_DESC
            '0,00',                                   # 04 VL_TOT_AJ_REDUC_NC
            self._formatar_valor(vl_nc_dev_pis),      # 05 VL_TOT_CONT_NC_DEV
            self._formatar_valor(0),                  # 06 VL_RET_NC
            self._formatar_valor(0),                  # 07 VL_OUT_DED_NC
            self._formatar_valor(vl_nc_rec_pis),      # 08 VL_CONT_NC_REC
            self._formatar_valor(vl_cum_pis),         # 09 VL_TOT_CONT_CUM_PER
            self._formatar_valor(0),                  # 10 VL_RET_CUM
            self._formatar_valor(0),                  # 11 VL_OUT_DED_CUM
            self._formatar_valor(vl_cum_rec_pis),     # 12 VL_CONT_CUM_REC
            self._formatar_valor(vl_total_rec_pis),   # 13 VL_TOT_CONT_REC
        )

        # M205 - Contribuição para o PIS/PASEP a Recolher - Detalhamento por Código de Receita
        cod_receita_pis = str(getattr(self.empresa, 'codigo_receita_pis', '') or '').strip()
        if not cod_receita_pis:
            cod_receita_pis = '8101' if regime == '1' else '6912'  # 8101=PIS cum (default), 6912=PIS não-cum

        if vl_total_rec_pis > 0:
            # NUM_CAMPO: 12=VL_CONT_CUM_REC (cumulativo), 08=VL_CONT_NC_REC (não-cumulativo)
            num_campo_m205 = '12' if regime == '1' else '08'
            self._add_line(
                'M205',
                num_campo_m205,
                cod_receita_pis,
                self._formatar_valor(vl_total_rec_pis),
            )

        # M210 - Detalhamento da Contribuição para o PIS/PASEP (filho do M200)
        # Layout EFD-Contribuições 1.35: REG + 15 campos = 16 total
        if vl_nc_pis > 0:
            aliq_pis_padrao = getattr(self.empresa, 'aliquota_pis_padrao', None) or Decimal('1.65')
            self._add_line(
                'M210',
                '01',                                      # 02 COD_CONT
                self._formatar_valor(self.total_bc_pis),   # 03 VL_REC_BRT
                self._formatar_valor(self.total_bc_pis),   # 04 VL_BC_CONT
                '',                                        # 05 ALIQ_PIS_OT
                self._formatar_valor(aliq_pis_padrao, 2),  # 06 ALIQ_PIS_%
                '',                                        # 07 QUANT_BC_PIS
                '',                                        # 08 ALIQ_PIS_QUANT
                self._formatar_valor(vl_nc_pis),           # 09 VL_CONT_APUR
                '0,00',                                    # 10 VL_AJUS_ACRES
                '0,00',                                    # 11 VL_AJUS_REDUC
                '0,00',                                    # 12 VL_CONT_DIFER
                '0,00',                                    # 13 VL_CONT_ATIV
                '0,00',                                    # 14 VL_RET_FT
                '0,00',                                    # 15 VL_OUT_DED
                self._formatar_valor(vl_nc_pis),           # 16 VL_CONT_REC
            )

        # M210 para valores CUMULATIVOS
        if vl_cum_pis > 0:
            aliq_pis_padrao = Decimal('0.65')  # Alíquota cumulativa fixa
            self._add_line(
                'M210',
                '51',                                      # 02 COD_CONT (Cumulativo básico)
                self._formatar_valor(self.total_bc_pis),   # 03 VL_REC_BRT
                self._formatar_valor(self.total_bc_pis),   # 04 VL_BC_CONT
                '',                                        # 05 ALIQ_PIS_OT
                self._formatar_valor(aliq_pis_padrao, 2),  # 06 ALIQ_PIS_%
                '',                                        # 07 QUANT_BC_PIS
                '',                                        # 08 ALIQ_PIS_QUANT
                self._formatar_valor(vl_cum_pis),          # 09 VL_CONT_APUR
                '0,00',                                    # 10 VL_AJUS_ACRES
                '0,00',                                    # 11 VL_AJUS_REDUC
                '0,00',                                    # 12 VL_CONT_DIFER
                '0,00',                                    # 13 VL_CONT_ATIV
                '0,00',                                    # 14 VL_RET_FT
                '0,00',                                    # 15 VL_OUT_DED
                self._formatar_valor(vl_cum_pis),          # 16 VL_CONT_REC
            )

        # M220 - Ajustes da Contribuição para o PIS/PASEP Apurada
        # M225 - Ajustes - Detalhamento dos Ajustes da Contribuição
        # M230 - Informações Adicionais de Diferimento
        
        # M300 - Contribuição de PIS/Pasep Diferida em Períodos Anteriores
        # M350 - PIS/Pasep - Folha de Salários
        
        # M400 - Receitas Isentas, Não Alcançadas pela Incidência da Contribuição, 
        # Sujeitas a Alíquota Zero ou de Vendas com Suspensão - PIS/PASEP
        
        # M500 - Crédito de COFINS Relativo ao Período
        if self.total_credito_cofins > 0:
            self._add_line(
                'M500',
                '101',  # COD_CRED - 101=Crédito vinculado à receita tributada no mercado interno (Básico)
                '0',    # IND_CRED_ORI - 0=Operação própria
                self._formatar_valor(self.total_bc_cofins),  # VL_BC_COFINS
                '7,60', # ALIQ_COFINS (Exemplo)
                '',     # QUANT_BC_COFINS
                '',     # ALIQ_COFINS_QUANT
                self._formatar_valor(self.total_credito_cofins),  # VL_CRED
                '0,00', # VL_AJUS_ACRES
                '0,00', # VL_AJUS_REDUC
                '0,00', # VL_CRED_DIF
                self._formatar_valor(self.total_credito_cofins),  # VL_CRED_DISP
                '0',    # IND_DESC_CRED
                '0,00', # VL_CRED_DESC
                self._formatar_valor(self.total_credito_cofins), # SLD_CRED
            )
        
        # M505 - Detalhamento da Base de Cálculo do Crédito
        # M510 - Ajustes do Crédito de COFINS Apurado
        # M515 - Ajuste - Detalhamento dos Ajustes do Crédito
        
        # M600 - Consolidação da Contribuição para a COFINS do Período
        vl_cofins_apurado = self.total_cofins - self.total_credito_cofins

        # Regime: 1=Cumulativo, 2=Não-cumulativo, 3=Ambos
        if regime == '1':  # exclusivamente cumulativo
            vl_nc_cofins = Decimal(0)
            vl_cred_nc_cofins = Decimal(0)
            vl_nc_dev_cofins = Decimal(0)
            vl_nc_rec_cofins = Decimal(0)
            vl_cum_cofins = self.total_cofins
            vl_cum_rec_cofins = vl_cofins_apurado if vl_cofins_apurado > 0 else Decimal(0)
        elif regime == '2':  # exclusivamente não-cumulativo
            vl_nc_cofins = self.total_cofins
            vl_cred_nc_cofins = self.total_credito_cofins
            vl_nc_dev_cofins = vl_cofins_apurado if vl_cofins_apurado > 0 else Decimal(0)
            vl_nc_rec_cofins = vl_cofins_apurado if vl_cofins_apurado > 0 else Decimal(0)
            vl_cum_cofins = Decimal(0)
            vl_cum_rec_cofins = Decimal(0)
        else:  # 3 = ambos
            vl_nc_cofins = self.total_cofins
            vl_cred_nc_cofins = self.total_credito_cofins
            vl_nc_dev_cofins = vl_cofins_apurado if vl_cofins_apurado > 0 else Decimal(0)
            vl_nc_rec_cofins = vl_cofins_apurado if vl_cofins_apurado > 0 else Decimal(0)
            vl_cum_cofins = self.total_cofins
            vl_cum_rec_cofins = vl_cofins_apurado if vl_cofins_apurado > 0 else Decimal(0)

        vl_total_rec_cofins = max(vl_nc_rec_cofins, vl_cum_rec_cofins)

        # Layout v1.35: REG(01)|VL_TOT_CONT_NC_PER(02)|VL_TOT_CRED_DESC(03)|VL_TOT_AJ_REDUC_NC(04)|
        #   VL_TOT_CONT_NC_DEV(05)|VL_RET_NC(06)|VL_OUT_DED_NC(07)|VL_CONT_NC_REC(08)|
        #   VL_TOT_CONT_CUM_PER(09)|VL_RET_CUM(10)|VL_OUT_DED_CUM(11)|VL_CONT_CUM_REC(12)|
        #   VL_TOT_CONT_REC(13)|NUM_PROC(14)
        self._add_line(
            'M600',
            self._formatar_valor(vl_nc_cofins),        # 02 VL_TOT_CONT_NC_PER
            self._formatar_valor(vl_cred_nc_cofins),   # 03 VL_TOT_CRED_DESC
            '0,00',                                    # 04 VL_TOT_AJ_REDUC_NC
            self._formatar_valor(vl_nc_dev_cofins),    # 05 VL_TOT_CONT_NC_DEV
            self._formatar_valor(0),                   # 06 VL_RET_NC
            self._formatar_valor(0),                   # 07 VL_OUT_DED_NC
            self._formatar_valor(vl_nc_rec_cofins),    # 08 VL_CONT_NC_REC
            self._formatar_valor(vl_cum_cofins),       # 09 VL_TOT_CONT_CUM_PER
            self._formatar_valor(0),                   # 10 VL_RET_CUM
            self._formatar_valor(0),                   # 11 VL_OUT_DED_CUM
            self._formatar_valor(vl_cum_rec_cofins),   # 12 VL_CONT_CUM_REC
            self._formatar_valor(vl_total_rec_cofins), # 13 VL_TOT_CONT_REC
        )

        # M605 - Contribuição para a COFINS a Recolher - Detalhamento por Código de Receita
        cod_receita_cofins = str(getattr(self.empresa, 'codigo_receita_cofins', '') or '').strip()
        if not cod_receita_cofins:
            cod_receita_cofins = '2172' if regime == '1' else '5856'  # 2172=COFINS cum, 5856=COFINS não-cum

        if vl_total_rec_cofins > 0:
            # NUM_CAMPO: 12=VL_CONT_CUM_REC (cumulativo), 08=VL_CONT_NC_REC (não-cumulativo)
            num_campo_m605 = '12' if regime == '1' else '08'
            self._add_line(
                'M605',
                num_campo_m605,
                cod_receita_cofins,
                self._formatar_valor(vl_total_rec_cofins),
            )

        # M610 para valores CUMULATIVOS
        if vl_cum_cofins > 0:
            aliq_cofins_padrao = Decimal('3.00')  # Alíquota cumulativa fixa
            self._add_line(
                'M610',
                '51',                                          # 02 COD_CONT (Cumulativo básico)
                self._formatar_valor(self.total_bc_cofins),    # 03 VL_REC_BRT
                self._formatar_valor(self.total_bc_cofins),    # 04 VL_BC_CONT
                '',                                            # 05 ALIQ_COFINS_OT
                self._formatar_valor(aliq_cofins_padrao, 2),   # 06 ALIQ_COFINS_%
                '',                                            # 07 QUANT_BC_COFINS
                '',                                            # 08 ALIQ_COFINS_QUANT
                self._formatar_valor(vl_cum_cofins),           # 09 VL_CONT_APUR
                '0,00',                                        # 10 VL_AJUS_ACRES
                '0,00',                                        # 11 VL_AJUS_REDUC
                '0,00',                                        # 12 VL_CONT_DIFER
                '0,00',                                        # 13 VL_CONT_ATIV
                '0,00',                                        # 14 VL_RET_FT
                '0,00',                                        # 15 VL_OUT_DED
                self._formatar_valor(vl_cum_cofins),           # 16 VL_CONT_REC
            )

        # M610 - Detalhamento da Contribuição para a COFINS (filho do M600)
        # Layout EFD-Contribuições 1.35: 16 campos (REG + 15)
        if vl_nc_cofins > 0:
            aliq_cofins_padrao = getattr(self.empresa, 'aliquota_cofins_padrao', None) or Decimal('7.60')
            self._add_line(
                'M610',
                '01',                                          # 02 COD_CONT
                self._formatar_valor(self.total_bc_cofins),    # 03 VL_REC_BRT
                self._formatar_valor(self.total_bc_cofins),    # 04 VL_BC_CONT
                '',                                            # 05 ALIQ_COFINS_OT
                self._formatar_valor(aliq_cofins_padrao, 2),   # 06 ALIQ_COFINS_%
                '',                                            # 07 QUANT_BC_COFINS
                '',                                            # 08 ALIQ_COFINS_QUANT
                self._formatar_valor(vl_nc_cofins),            # 09 VL_CONT_APUR
                '0,00',                                        # 10 VL_AJUS_ACRES
                '0,00',                                        # 11 VL_AJUS_REDUC
                '0,00',                                        # 12 VL_CONT_DIFER
                '0,00',                                        # 13 VL_CONT_ATIV
                '0,00',                                        # 14 VL_RET_FT
                '0,00',                                        # 15 VL_OUT_DED
                self._formatar_valor(vl_nc_cofins),            # 16 VL_CONT_REC
            )

        # M620 - Ajustes da Contribuição para a COFINS Apurada
        # M625 - Ajustes - Detalhamento dos Ajustes da Contribuição
        # M630 - Informações Adicionais de Diferimento
        
        # M700 - Contribuição de COFINS Diferida em Períodos Anteriores
        # M800 - Receitas Isentas, Não Alcançadas pela Incidência da Contribuição, 
        # Sujeitas a Alíquota Zero ou de Vendas com Suspensão - COFINS
        
        # M990 - Encerramento do Bloco M
        self._add_line('M990', str(self.block_counts.get('M', 0) + 1))
    
    # ==================== BLOCO 1 - COMPLEMENTO ====================
    
    def _gerar_bloco_1(self):
        """Bloco 1 - Complemento da Escrituração"""
        logger.info("Gerando Bloco 1 - Complemento...")
        
        # 1001 - Abertura do Bloco 1
        self._add_line('1001', '1')  # IND_MOV - 1=Bloco sem dados
        
        # 1010 - Processo Referenciado
        # 1020 - Operações com Produtos Sujeitos à Tributação
        # 1050 - Consolidação de Operações da Pessoa Jurídica Submetida ao Regime
        # 1100 - Controle de Créditos Fiscais - PIS/PASEP
        # 1101 - Apuração de Crédito Extemporâneo - Documentos e Operações de Períodos Anteriores
        # 1102 - Detalhamento do Crédito Extemporâneo - PIS/PASEP
        # 1200 - Controle de Créditos Fiscais - COFINS
        # 1210 - Utilização de Créditos Fiscais - COFINS
        # 1220 - Créditos de Períodos Anteriores não Utilizados - COFINS

        # 1300 - Controle dos Valores Retidos na Fonte - PIS/PASEP
        # 1500 - Controle dos Valores Retidos na Fonte - COFINS
        # 1700 - Controle dos Valores Diferidos - PIS/PASEP
        # 1900 - Consolidação dos Documentos Emitidos por Pessoa Jurídica Sujeita ao Regime de Tributação
        
        # 1990 - Encerramento do Bloco 1
        self._add_line('1990', str(self.block_counts.get('1', 0) + 1))
    
    # ==================== BLOCO 9 - ENCERRAMENTO ====================
    
    def _gerar_bloco_9(self):
        """Bloco 9 - Controle e Encerramento do Arquivo Digital"""
        logger.info("Gerando Bloco 9 - Encerramento...")
        
        # 9001 - Abertura do Bloco 9
        self._add_line('9001', '0')  # IND_MOV - 0=Bloco com dados
        
        # 9900 - Registros do Arquivo (totalizadores por registro)
        # Contar registros gerados até o momento (exceto 9900, 9990, 9999)
        registros_existentes = {}
        for linha in self.lines:
            if linha.startswith('|'):
                try:
                    parts = linha.split('|')
                    if len(parts) > 1:
                        reg = parts[1]
                        registros_existentes[reg] = registros_existentes.get(reg, 0) + 1
                except:
                    pass
        
        # Definir quais totalizadores teremos
        chaves_finais = set(registros_existentes.keys())
        chaves_finais.add('9900')
        chaves_finais.add('9990')
        chaves_finais.add('9999')
        
        # O registro 9900 tem uma linha para CADA tipo de registro presente no arquivo
        # Então a quantidade de linhas 9900 é igual ao número de CHAVES únicas de registros
        qtd_linhas_9900 = len(chaves_finais)
        
        # Preparar dicionário completo para escrita
        contagens_finais = registros_existentes.copy()
        contagens_finais['9900'] = qtd_linhas_9900
        contagens_finais['9990'] = 1
        contagens_finais['9999'] = 1
        
        # Escrever todos os registros 9900
        for reg in sorted(chaves_finais):
            qtd = contagens_finais[reg]
            self._add_line('9900', reg, str(qtd))
            
        # 9990 - Encerramento do Bloco 9
        # Total de linhas do Bloco 9 = 1 (9001) + N (9900) + 1 (9990) + 1 (9999)
        # O validador do SPED Contribuições inclui o 9999 na contagem do QTD_LIN_9
        qtd_9001 = registros_existentes.get('9001', 0)
        qtd_bloco_9 = qtd_9001 + qtd_linhas_9900 + 1 + 1  # +1 para 9990, +1 para 9999
        self._add_line('9990', str(qtd_bloco_9))

        # 9999 - Encerramento do Arquivo Digital
        # Total de linhas = soma de todas as quantidades de todos os registros
        total_linhas_arquivo = sum(contagens_finais.values())
        self._add_line('9999', str(total_linhas_arquivo))
