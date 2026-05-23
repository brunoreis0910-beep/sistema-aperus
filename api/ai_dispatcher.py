"""
AI Dispatcher - Traduz linguagem natural em ações executáveis
Transforma a IA de "explicadora" para "executora"

Autor: Bruno (Sistema Gerencial)
Data: 17/03/2026
"""
import re
import datetime
import logging
from django.urls import reverse
from django.utils import timezone
from typing import Dict, Any, Optional, Tuple
from api.models import CentroCusto, ContaBancaria, FormaPagamento

logger = logging.getLogger(__name__)


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
        # 0. Identifica comando de hotelaria
        palavras_hotel = ['quarto', 'reserva', 'limpeza', 'manutenção', 'manutencao', 'limpar', 'sujo']
        if any(w in self.query for w in palavras_hotel):
            resultado_hotel = self._resolver_comando_hotel()
            if resultado_hotel:
                return resultado_hotel

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

    def _extrair_filtros_financeiros(self) -> Dict[str, str]:
        """
        Extrai filtros financeiros da query, buscando IDs no banco de dados.
        """
        filtros = {}
        query_lower = self.query.lower()

        # Mapeamento de termos para nomes de campo e modelos
        mapa_filtros = {
            'centro de custo': ('centro_custo_id', CentroCusto, 'nome_centro_custo'),
            'cc': ('centro_custo_id', CentroCusto, 'nome_centro_custo'),
            'conta de baixa': ('conta_baixa_id', ContaBancaria, 'nome_conta'),
            'conta baixa': ('conta_baixa_id', ContaBancaria, 'nome_conta'),
            'conta de lançamento': ('conta_lancamento_id', ContaBancaria, 'nome_conta'),
            'conta lançamento': ('conta_lancamento_id', ContaBancaria, 'nome_conta'),
            'forma de pagamento': ('forma_pagamento', FormaPagamento, 'nome_forma'),
        }

        for termo, (campo_filtro, modelo, campo_modelo) in mapa_filtros.items():
            # Usa regex para encontrar o valor após o termo
            # Ex: "centro de custo VENDAS" -> captura "VENDAS"
            match = re.search(f'{termo}\\s+([\\w\\s\\-]+)', query_lower)
            if match:
                valor_str = match.group(1).strip()
                try:
                    # Busca o objeto no banco para obter o ID ou o nome exato
                    filtro_lookup = {f'{campo_modelo}__iexact': valor_str}
                    objeto = modelo.objects.filter(**filtro_lookup).first()
                    
                    if objeto:
                        if 'id' in campo_filtro:
                            filtros[campo_filtro] = objeto.pk
                        else:
                            filtros[campo_filtro] = getattr(objeto, campo_modelo)
                        
                        logger.info(f"Filtro financeiro encontrado: {campo_filtro} = {filtros[campo_filtro]}")

                except modelo.DoesNotExist:
                    logger.warning(f"Valor de filtro financeiro '{valor_str}' não encontrado para o modelo {modelo.__name__}")
                except Exception as e:
                    logger.error(f"Erro ao buscar filtro financeiro '{valor_str}': {e}")
        
        return filtros

    def _resolver_comando_hotel(self) -> Optional[Dict[str, Any]]:
        """Resolve comandos de hotelaria usando a IA do Gemini ou fallback Regex"""
        try:
            from api.services.ai_service import ai_service
            if not ai_service.is_available():
                return self._resolver_comando_hotel_regex()
                
            prompt = f"""Você é o analisador de intenções de hotelaria/PMS do APERUS.
Sua tarefa é extrair comandos estruturados em JSON a partir da pergunta do usuário.

Ações possíveis:
1. "manutencao_quarto": Colocar um quarto em manutenção.
   Args: {{"quarto": "301"}}
2. "limpeza_quarto": Mudar status de limpeza/limpeza pendente do quarto.
   Args: {{"quarto": "102", "status": "sujo" (se precisa de limpeza) ou "disponivel" (se foi limpo e está liberado)}}
   Nota: Se o usuário diz "limpeza no quarto X" ou "limpar quarto X", assuma "status": "sujo" (colocar na fila de limpeza). Se diz "quarto X limpo" ou "limpeza feita", use "status": "disponivel".
3. "reserva_quarto": Abrir/criar uma reserva.
   Args: {{"quarto": "103", "horas": 2 (se mencionado), "data_inicio": "YYYY-MM-DD HH:MM:SS" (ou null), "data_fim": "YYYY-MM-DD HH:MM:SS" (ou null), "hospede": "Nome" (ou null)}}

Data/Hora de referência atual do sistema: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')} (dia da semana: {timezone.now().strftime('%A')})

Regras para datas da reserva:
- Se não for especificada data_inicio, use a data/hora atual.
- Se for especificado um período (ex: "hoje às 14:00 até amanhã às 12:00"), calcule os datetimes no formato YYYY-MM-DD HH:MM:SS.
- Se for especificado "reserva de X horas" e nenhuma data/hora fim for dada, calcule data_fim = data_inicio + X horas.
- Se nenhuma data/hora for mencionada, use data_inicio = agora, data_fim = agora + 24 horas.

Pergunta: "{self.query}"

Retorne APENAS um JSON válido no formato:
{{
    "identificado": true/false,
    "acao": "manutencao_quarto|limpeza_quarto|reserva_quarto|null",
    "args": {{ ... }}
}}"""
            
            # Chama a API do Gemini
            texto_resposta = ai_service._chamar_gemini_com_retry(prompt, max_tentativas=2, delay_inicial=1.5)
            
            # Limpa o markdown usando regex robusto
            texto_resposta = texto_resposta.strip()
            match_json = re.search(r'```json\s*(\{.*?\})\s*```', texto_resposta, re.DOTALL)
            if match_json:
                texto_resposta = match_json.group(1)
            else:
                match_any_code = re.search(r'```\s*(\{.*?\})\s*```', texto_resposta, re.DOTALL)
                if match_any_code:
                    texto_resposta = match_any_code.group(1)
            texto_resposta = texto_resposta.strip()
            
            import json
            dados = json.loads(texto_resposta)
            
            if dados.get('identificado') and dados.get('acao'):
                res_exec = self._executar_acao_hotel(dados['acao'], dados.get('args', {}))
                return {
                    'tipo': 'text',
                    'acao': 'comando_hotel_executado',
                    'conteudo': res_exec['msg'],
                    'titulo': 'Hospedagem / PMS'
                }
                
        except Exception as e:
            logger.error(f"Erro ao resolver comando de hotelaria via IA: {e}")
            
        # Fallback para Regex
        return self._resolver_comando_hotel_regex()

    def _resolver_comando_hotel_regex(self) -> Optional[Dict[str, Any]]:
        """Fallback para parsing simples de hotelaria usando Regex"""
        import re
        query_lower = self.query
        
        # 1. Manutenção
        match_maint = re.search(r'(?:manutenção|manutencao).*?quarto\s+(\d+)|quarto\s+(\d+).*?(?:manutenção|manutencao)', query_lower)
        if match_maint:
            quarto = match_maint.group(1) or match_maint.group(2)
            res_exec = self._executar_acao_hotel('manutencao_quarto', {'quarto': quarto})
            return {
                'tipo': 'text',
                'acao': 'comando_hotel_executado',
                'conteudo': res_exec['msg'],
                'titulo': 'Hospedagem / PMS'
            }
            
        # 2. Limpeza
        match_clean = re.search(r'(?:limpeza|limpar).*?quarto\s+(\d+)|quarto\s+(\d+).*?(?:limpeza|limpar)', query_lower)
        if match_clean:
            quarto = match_clean.group(1) or match_clean.group(2)
            status = 'disponivel' if any(w in query_lower for w in ['limpo', 'concluido', 'feita', 'pronto']) else 'sujo'
            res_exec = self._executar_acao_hotel('limpeza_quarto', {'quarto': quarto, 'status': status})
            return {
                'tipo': 'text',
                'acao': 'comando_hotel_executado',
                'conteudo': res_exec['msg'],
                'titulo': 'Hospedagem / PMS'
            }
            
        # 3. Reserva
        match_res = re.search(r'(?:reserva|reservar).*?quarto\s+(\d+)|quarto\s+(\d+).*?(?:reserva|reservar)', query_lower)
        if match_res:
            quarto = match_res.group(1) or match_res.group(2)
            res_exec = self._executar_acao_hotel('reserva_quarto', {'quarto': quarto})
            return {
                'tipo': 'text',
                'acao': 'comando_hotel_executado',
                'conteudo': res_exec['msg'],
                'titulo': 'Hospedagem / PMS'
            }
            
        return None

    def _executar_acao_hotel(self, acao: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Executa a ação correspondente no banco de dados"""
        from api.models_hotel import Quarto, Reserva, TipoQuarto
        from api.models import Cliente
        from django.utils import timezone
        import datetime
        from decimal import Decimal

        if acao == 'manutencao_quarto':
            quarto_num = args.get('quarto')
            if not quarto_num:
                return {'sucesso': False, 'msg': 'Número do quarto não especificado.'}
            
            quarto = Quarto.objects.filter(numero_quarto=quarto_num).first()
            if not quarto:
                return {'sucesso': False, 'msg': f'Quarto {quarto_num} não encontrado no sistema.'}
            
            quarto.status_atual = 'manutencao'
            quarto.save()
            return {
                'sucesso': True,
                'msg': f'🔧 **Quarto {quarto_num}** foi colocado em **Manutenção** com sucesso.'
            }

        elif acao == 'limpeza_quarto':
            quarto_num = args.get('quarto')
            status_limpeza = args.get('status', 'sujo')
            if not quarto_num:
                return {'sucesso': False, 'msg': 'Número do quarto não especificado.'}
            
            quarto = Quarto.objects.filter(numero_quarto=quarto_num).first()
            if not quarto:
                return {'sucesso': False, 'msg': f'Quarto {quarto_num} não encontrado no sistema.'}
            
            status_map = {
                'sujo': 'sujo',
                'disponivel': 'disponivel',
                'limpo': 'disponivel'
            }
            quarto.status_atual = status_map.get(status_limpeza, 'sujo')
            quarto.save()
            
            status_label = 'Sujo / Aguardando Limpeza' if quarto.status_atual == 'sujo' else 'Disponível / Limpo'
            return {
                'sucesso': True,
                'msg': f'🧹 Status do **Quarto {quarto_num}** alterado para **{status_label}**.'
            }

        elif acao == 'reserva_quarto':
            quarto_num = args.get('quarto')
            if not quarto_num:
                return {'sucesso': False, 'msg': 'Número do quarto não especificado para a reserva.'}
            
            quarto = Quarto.objects.filter(numero_quarto=quarto_num).first()
            if not quarto:
                return {'sucesso': False, 'msg': f'Quarto {quarto_num} não encontrado no sistema.'}
            
            # Parsing das datas
            ahora = timezone.now()
            start_str = args.get('data_inicio')
            end_str = args.get('data_fim')
            horas = args.get('horas')
            
            try:
                if start_str:
                    # Tenta converter string YYYY-MM-DD HH:MM:SS para datetime com fuso horário
                    dt_naive = datetime.datetime.strptime(start_str, '%Y-%m-%d %H:%M:%S')
                    start_dt = timezone.make_aware(dt_naive)
                else:
                    start_dt = ahora
                
                if end_str:
                    dt_naive = datetime.datetime.strptime(end_str, '%Y-%m-%d %H:%M:%S')
                    end_dt = timezone.make_aware(dt_naive)
                elif horas:
                    end_dt = start_dt + datetime.timedelta(hours=int(horas))
                else:
                    end_dt = start_dt + datetime.timedelta(days=1)
            except Exception as dt_err:
                logger.error(f"Erro ao converter datas da reserva: {dt_err}")
                start_dt = ahora
                end_dt = ahora + datetime.timedelta(days=1)
                
            # Seleção do hóspede
            hospede_nome = args.get('hospede')
            cliente = None
            if hospede_nome:
                cliente = Cliente.objects.filter(nome_razao_social__icontains=hospede_nome).first()
            
            if not cliente:
                # Busca cliente padrão CONSUMIDOR
                cliente = Cliente.objects.filter(nome_razao_social='CONSUMIDOR').first()
                if not cliente:
                    cliente = Cliente.objects.filter(nome_razao_social__icontains='hospede').first()
                if not cliente:
                    cliente = Cliente.objects.first()
                    
            if not cliente:
                return {'sucesso': False, 'msg': 'Não foi possível encontrar um cliente/hóspede cadastrado para a reserva.'}
                
            # Criação da reserva
            reserva = Reserva.objects.create(
                hospede=cliente,
                quarto=quarto,
                data_entrada_prevista=start_dt,
                data_saida_prevista=end_dt,
                status_reserva='confirmada',
                valor_diaria_aplicada=quarto.tipo.valor_diaria_padrao,
                observacoes="Reserva criada via comando de voz/chat da IA."
            )
            
            periodo_formatado = f"de **{start_dt.strftime('%d/%m/%Y %H:%M')}** até **{end_dt.strftime('%d/%m/%Y %H:%M')}**"
            return {
                'sucesso': True,
                'msg': f'🔑 **Reserva nº {reserva.id_reserva}** criada com sucesso!\n'
                       f'- **Quarto**: {quarto.numero_quarto} ({quarto.tipo.nome})\n'
                       f'- **Hóspede**: {cliente.nome_razao_social}\n'
                       f'- **Período**: {periodo_formatado}\n'
                       f'- **Diária Aplicada**: R$ {reserva.valor_diaria_aplicada:,.2f}'
            }
            
        return {'sucesso': False, 'msg': 'Ação de hotelaria não identificada.'}

