"""
AI Dispatcher - Traduz linguagem natural em ações executáveis
Transforma a IA de "explicadora" para "executora"

Autor: Bruno (Sistema Gerencial)
Data: 17/03/2026
"""
import re
import datetime
from django.urls import reverse
from django.utils import timezone
from typing import Dict, Any, Optional, Tuple


class AIDispatcher:
    """
    Dispatcher que interpreta comandos em linguagem natural e os 
    transforma em ações concretas (geração de relatórios, consultas, etc.)
    """
    
    # Padrões de comando
    COMANDOS_RELATORIOS = {
        'cte': ['relatório de cte', 'relatorio cte', 'relatório de transporte', 'conhecimentos de transporte'],
        'vendas_operacao': ['vendas por operação', 'vendas operação', 'operações fiscais', 'vendas fiscais'],
        'vendas_geral': ['relatório de vendas', 'relatorio vendas', 'vendas do período'],
        'estoque': ['relatório de estoque', 'relatorio estoque', 'produtos em estoque'],
        'financeiro': ['relatório financeiro', 'relatorio financeiro', 'contas a receber', 'contas a pagar'],
    }
    
    def __init__(self, user_query: str, user=None):
        """
        Args:
            user_query: Comando do usuário em linguagem natural
            user: Usuário Django (para contexto de permissões)
        """
        self.query = user_query.lower()
        self.user = user
        self.hoje = timezone.now().date()
        
    def resolver(self) -> Dict[str, Any]:
        """
        Analisa a query e retorna uma ação estruturada
        
        Returns:
            dict: {
                'tipo': 'file' | 'text' | 'data',
                'acao': str,
                'conteudo': Any,
                'titulo': str,
                'url': str (se tipo='file'),
                'formato': str (se tipo='file')
            }
        """
        # Extrai datas do comando
        data_inicio, data_fim = self._extrair_periodo()
        
        # 1. Identifica Relatório de CT-e
        if self._match_comando('cte'):
            return self._gerar_resposta_cte(data_inicio, data_fim)
        
        # 2. Identifica Relatório de Vendas por Operação
        if self._match_comando('vendas_operacao'):
            return self._gerar_resposta_vendas_operacao(data_inicio, data_fim)
        
        # 3. Identifica Relatório Geral de Vendas
        if self._match_comando('vendas_geral'):
            return self._gerar_resposta_vendas_geral(data_inicio, data_fim)
        
        # 4. Identifica Relatório de Estoque
        if self._match_comando('estoque'):
            return self._gerar_resposta_estoque()
        
        # 5. Identifica Relatório Financeiro
        if self._match_comando('financeiro'):
            return self._gerar_resposta_financeiro(data_inicio, data_fim)
        
        # Não identificou comando específico
        return {
            'tipo': 'text',
            'acao': 'comando_nao_identificado',
            'conteudo': self._mensagem_ajuda(),
            'titulo': 'Comando não identificado'
        }
    
    def _match_comando(self, tipo: str) -> bool:
        """Verifica se a query corresponde a um tipo de comando"""
        padroes = self.COMANDOS_RELATORIOS.get(tipo, [])
        return any(padrao in self.query for padrao in padroes)
    
    def _extrair_periodo(self) -> Tuple[datetime.date, datetime.date]:
        """
        Extrai período (data_inicio, data_fim) da query
        
        Suporta:
        - "01/02/2026 até hoje"
        - "01/02 a 15/03"
        - "fevereiro"
        - "este mês"
        - "hoje"
        - "última semana"
        """
        hoje = self.hoje
        
        # Padrão: DD/MM/YYYY até DD/MM/YYYY
        match_range = re.search(r'(\d{1,2})/(\d{1,2})(?:/(\d{4}))?\s*(?:até|a|ate)\s*(\d{1,2})/(\d{1,2})(?:/(\d{4}))?', self.query)
        if match_range:
            dia1, mes1, ano1, dia2, mes2, ano2 = match_range.groups()
            ano1 = int(ano1) if ano1 else hoje.year
            ano2 = int(ano2) if ano2 else hoje.year
            data_inicio = datetime.date(ano1, int(mes1), int(dia1))
            data_fim = datetime.date(ano2, int(mes2), int(dia2))
            return data_inicio, data_fim
        
        # Padrão: DD/MM até hoje
        match_ate_hoje = re.search(r'(\d{1,2})/(\d{1,2})(?:/(\d{4}))?\s*(?:até|a|ate)\s*hoje', self.query)
        if match_ate_hoje:
            dia, mes, ano = match_ate_hoje.groups()
            ano = int(ano) if ano else hoje.year
            data_inicio = datetime.date(ano, int(mes), int(dia))
            return data_inicio, hoje
        
        # Padrão: apenas DD/MM (assume até hoje)
        match_single = re.search(r'(\d{1,2})/(\d{1,2})(?:/(\d{4}))?', self.query)
        if match_single:
            dia, mes, ano = match_single.groups()
            ano = int(ano) if ano else hoje.year
            data_inicio = datetime.date(ano, int(mes), int(dia))
            return data_inicio, hoje
        
        # Atalhos
        if 'hoje' in self.query:
            return hoje, hoje
        
        if 'esta semana' in self.query or 'última semana' in self.query or 'semana passada' in self.query:
            inicio_semana = hoje - datetime.timedelta(days=hoje.weekday())
            return inicio_semana, hoje
        
        if 'este mês' in self.query or 'mês atual' in self.query:
            inicio_mes = hoje.replace(day=1)
            return inicio_mes, hoje
        
        if 'mês passado' in self.query or 'último mês' in self.query:
            primeiro_dia_mes_atual = hoje.replace(day=1)
            ultimo_dia_mes_passado = primeiro_dia_mes_atual - datetime.timedelta(days=1)
            primeiro_dia_mes_passado = ultimo_dia_mes_passado.replace(day=1)
            return primeiro_dia_mes_passado, ultimo_dia_mes_passado
        
        # Padrão: nome do mês
        meses = {
            'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
            'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
            'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
        }
        for nome_mes, num_mes in meses.items():
            if nome_mes in self.query:
                ano = hoje.year if num_mes <= hoje.month else hoje.year - 1
                data_inicio = datetime.date(ano, num_mes, 1)
                # Último dia do mês
                if num_mes == 12:
                    data_fim = datetime.date(ano, 12, 31)
                else:
                    data_fim = datetime.date(ano, num_mes + 1, 1) - datetime.timedelta(days=1)
                return data_inicio, data_fim
        
        # Default: Primeiro dia do mês atual até hoje
        inicio_mes = hoje.replace(day=1)
        return inicio_mes, hoje
    
    def _gerar_resposta_cte(self, data_inicio: datetime.date, data_fim: datetime.date) -> Dict[str, Any]:
        """Gera resposta para relatório de CT-e"""
        url = f'/api/relatorios/cte/pdf/?data_inicio={data_inicio}&data_fim={data_fim}'
        
        return {
            'tipo': 'file',
            'acao': 'gerar_relatorio_cte',
            'formato': 'pdf',
            'titulo': f'Relatório de CT-e ({data_inicio.strftime("%d/%m/%Y")} - {data_fim.strftime("%d/%m/%Y")})',
            'url': url,
            'conteudo': (
                f'📄 **Relatório Consolidado de Conhecimentos de Transporte (CT-e)**\n\n'
                f'Período: {data_inicio.strftime("%d/%m/%Y")} até {data_fim.strftime("%d/%m/%Y")}\n\n'
                f'O relatório inclui:\n'
                f'- Todos os CT-e emitidos no período\n'
                f'- Valores de frete por tipo de serviço\n'
                f'- Status de autorização (AUTORIZADO/PENDENTE/CANCELADO)\n'
                f'- Remetentes e destinatários\n'
                f'- Totalizadores por status e período\n\n'
                f'Clique no botão abaixo para fazer o download.'
            ),
            'data_inicio': data_inicio.isoformat(),
            'data_fim': data_fim.isoformat()
        }
    
    def _gerar_resposta_vendas_operacao(self, data_inicio: datetime.date, data_fim: datetime.date) -> Dict[str, Any]:
        """Gera resposta para relatório de vendas por operação fiscal"""
        url = f'/api/relatorios/vendas-operacao/pdf/?data_inicio={data_inicio}&data_fim={data_fim}'
        
        return {
            'tipo': 'file',
            'acao': 'gerar_relatorio_vendas_operacao',
            'formato': 'pdf',
            'titulo': f'Vendas por Operação Fiscal ({data_inicio.strftime("%d/%m/%Y")} - {data_fim.strftime("%d/%m/%Y")})',
            'url': url,
            'conteudo': (
                f'📊 **Análise de Vendas por Operação Fiscal**\n\n'
                f'Período: {data_inicio.strftime("%d/%m/%Y")} até {data_fim.strftime("%d/%m/%Y")}\n\n'
                f'Este relatório detalha:\n'
                f'- Volume de vendas por tipo de operação (Estadual, Interestadual, Exportação)\n'
                f'- Totalizadores por CFOP\n'
                f'- Análise de devoluções e cancelamentos\n'
                f'- Base de cálculo ICMS por operação\n'
                f'- Comparativo mensal\n\n'
                f'Ideal para conferência fiscal e planejamento tributário.'
            ),
            'data_inicio': data_inicio.isoformat(),
            'data_fim': data_fim.isoformat()
        }
    
    def _gerar_resposta_vendas_geral(self, data_inicio: datetime.date, data_fim: datetime.date) -> Dict[str, Any]:
        """Gera resposta para relatório geral de vendas"""
        url = f'/api/relatorios/vendas/pdf/?data_inicio={data_inicio}&data_fim={data_fim}'
        
        return {
            'tipo': 'file',
            'acao': 'gerar_relatorio_vendas',
            'formato': 'pdf',
            'titulo': f'Relatório de Vendas ({data_inicio.strftime("%d/%m/%Y")} - {data_fim.strftime("%d/%m/%Y")})',
            'url': url,
            'conteudo': (
                f'💰 **Relatório Completo de Vendas**\n\n'
                f'Período: {data_inicio.strftime("%d/%m/%Y")} até {data_fim.strftime("%d/%m/%Y")}\n\n'
                f'Inclui:\n'
                f'- Todas as vendas do período\n'
                f'- Produtos mais vendidos\n'
                f'- Ranking de clientes\n'
                f'- Formas de pagamento\n'
                f'- Vendedores com melhor performance\n'
                f'- Gráficos de evolução\n'
            ),
            'data_inicio': data_inicio.isoformat(),
            'data_fim': data_fim.isoformat()
        }
    
    def _gerar_resposta_estoque(self) -> Dict[str, Any]:
        """Gera resposta para relatório de estoque"""
        url = '/api/relatorios/estoque/pdf/'
        
        return {
            'tipo': 'file',
            'acao': 'gerar_relatorio_estoque',
            'formato': 'pdf',
            'titulo': 'Relatório de Estoque Atual',
            'url': url,
            'conteudo': (
                f'📦 **Posição de Estoque Atual**\n\n'
                f'Data: {self.hoje.strftime("%d/%m/%Y")}\n\n'
                f'Este relatório apresenta:\n'
                f'- Quantidade disponível por produto\n'
                f'- Produtos com estoque baixo (abaixo do mínimo)\n'
                f'- Produtos sem movimentação (estoque parado)\n'
                f'- Valor total do estoque\n'
                f'- Produtos zerados\n'
                f'- Curva ABC de produtos\n'
            )
        }
    
    def _gerar_resposta_financeiro(self, data_inicio: datetime.date, data_fim: datetime.date) -> Dict[str, Any]:
        """Gera resposta para relatório financeiro"""
        url = f'/api/relatorios/financeiro/pdf/?data_inicio={data_inicio}&data_fim={data_fim}'
        
        return {
            'tipo': 'file',
            'acao': 'gerar_relatorio_financeiro',
            'formato': 'pdf',
            'titulo': f'Relatório Financeiro ({data_inicio.strftime("%d/%m/%Y")} - {data_fim.strftime("%d/%m/%Y")})',
            'url': url,
            'conteudo': (
                f'💵 **Análise Financeira Consolidada**\n\n'
                f'Período: {data_inicio.strftime("%d/%m/%Y")} até {data_fim.strftime("%d/%m/%Y")}\n\n'
                f'Detalhamento:\n'
                f'- Contas a Receber (vencidas/a vencer)\n'
                f'- Contas a Pagar (vencidas/a vencer)\n'
                f'- Fluxo de Caixa\n'
                f'- Inadimplência por cliente\n'
                f'- Previsão de recebimentos\n'
                f'- Resumo DRE (Receitas - Despesas)\n'
            ),
            'data_inicio': data_inicio.isoformat(),
            'data_fim': data_fim.isoformat()
        }
    
    def _mensagem_ajuda(self) -> str:
        """Retorna mensagem de ajuda com comandos disponíveis"""
        return """
🤖 **Comandos disponíveis do Agente de Execução:**

**Relatórios Fiscais:**
- "Relatório de CT-e de 01/02 até hoje"
- "Relatório de vendas por operação de fevereiro"
- "Relatório de transporte deste mês"

**Relatórios Gerenciais:**
- "Relatório de vendas de 01/01 a 15/03"
- "Relatório de vendas este mês"
- "Relatório de estoque"
- "Relatório financeiro de março"

**Dicas:**
- Use datas no formato DD/MM ou DD/MM/YYYY
- Experimente "este mês", "mês passado", "hoje"
- Combine períodos: "01/02 até hoje"

*Tente reformular seu pedido usando um dos exemplos acima.*
        """.strip()
    
    def pode_executar(self) -> bool:
        """
        Verifica se o dispatcher identificou um comando válido
        
        Returns:
            bool: True se identificou um comando executável
        """
        resultado = self.resolver()
        return resultado['acao'] != 'comando_nao_identificado'
