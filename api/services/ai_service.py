"""
Serviço de Inteligência Artificial para o Sistema Gerencial
Integra Google Gemini para consultas em linguagem natural
Inclui busca na internet para NCM e erros fiscais
Integra com AI Dispatcher para execução de comandos
"""
import os
import json
import logging
import re
import urllib.request
import urllib.parse
import time
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, Any, List, Optional
from django.db.models import Sum, Count, Avg, Q, F
from django.conf import settings
from decouple import config

logger = logging.getLogger(__name__)

# Importa o dispatcher para execução de comandos
from api.ai_dispatcher import AIDispatcher

try:
    from google import genai
    from google.genai import types as genai_types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai_types = None
    logger.warning("Google Gemini não instalado. Execute: pip install google-genai")


class AIService:
    """Serviço principal de IA para análise de dados e chat"""
    
    def __init__(self):
        """Inicializa o serviço de IA"""
        self.client = None
        self.model_name = 'gemini-2.5-flash-preview-04-17'  # Modelo mais recente disponível
        if GEMINI_AVAILABLE:
            # A chave da API agora é gerenciada centralmente
            api_key = settings.GEMINI_API_KEY
            if api_key:
                # v1alpha é necessário para modelos Gemini 2.x e preview
                self.client = genai.Client(
                    api_key=api_key,
                    http_options=genai_types.HttpOptions(api_version='v1alpha')
                )
                logger.info("Google Gemini configurado com sucesso via settings (v1alpha)")
            else:
                logger.warning("GEMINI_API_KEY não configurada nas settings do Django")
    
    def is_available(self) -> bool:
        """Verifica se o serviço está disponível"""
        return self.client is not None
    
    # Modelos em ordem de preferência para fallback
    MODELOS_FALLBACK = [
        'gemini-2.5-flash-preview-04-17',
        'gemini-2.5-pro-preview-03-25',
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash',
    ]

    def _chamar_gemini_com_retry(self, prompt: str, max_tentativas: int = 3, delay_inicial: float = 2.0, config: dict = None) -> str:
        """
        Chama a API do Gemini com retry automático em caso de erro 503 (alta demanda)
        e fallback de modelo em caso de 429 (quota excedida).
        """
        modelos_para_tentar = [self.model_name] + [
            m for m in self.MODELOS_FALLBACK if m != self.model_name
        ]

        for modelo_idx, modelo_atual in enumerate(modelos_para_tentar):
            for tentativa in range(1, max_tentativas + 1):
                try:
                    logger.info(f"Chamando Gemini modelo={modelo_atual} (tentativa {tentativa}/{max_tentativas})...")
                    
                    response = self.client.models.generate_content(
                        model=modelo_atual,
                        contents=prompt,
                    )
                    
                    logger.info(f"Gemini respondeu com sucesso (modelo={modelo_atual}, tentativa {tentativa})")
                    return response.text
                    
                except Exception as e:
                    erro_str = str(e)
                    
                    # NOVO: Tratamento específico para API Key Expirada/Inválida
                    if 'API key expired' in erro_str or 'API_KEY_INVALID' in erro_str:
                        logger.error(f"A chave da API do Gemini expirou ou é inválida. {erro_str}")
                        raise Exception(f"400 INVALID_ARGUMENT. {erro_str}")

                    # Erro 429 RESOURCE_EXHAUSTED (quota excedida)
                    if '429' in erro_str or 'RESOURCE_EXHAUSTED' in erro_str:
                        # Extrair tempo de retry sugerido pela API
                        retry_delay = 20  # default 20s
                        import re as _re
                        match = _re.search(r'retryDelay.*?(\d+)', erro_str)
                        if match:
                            retry_delay = int(match.group(1)) + 1
                        
                        # Se temos outro modelo para tentar, pula para ele
                        if modelo_idx < len(modelos_para_tentar) - 1:
                            proximo_modelo = modelos_para_tentar[modelo_idx + 1]
                            logger.warning(
                                f"Quota excedida para {modelo_atual}. "
                                f"Tentando modelo alternativo: {proximo_modelo}"
                            )
                            break  # Sai do loop de tentativas, vai para próximo modelo
                        
                        # Último modelo: tenta esperar e re-tentar
                        if tentativa < max_tentativas:
                            logger.warning(
                                f"Quota excedida para {modelo_atual}. "
                                f"Aguardando {retry_delay}s antes de tentar novamente..."
                            )
                            time.sleep(retry_delay)
                            continue
                        else:
                            raise Exception(
                                f"429 RESOURCE_EXHAUSTED. {erro_str}"
                            )
                    
                    # Erro 503 (UNAVAILABLE)
                    elif '503' in erro_str or 'UNAVAILABLE' in erro_str:
                        if tentativa < max_tentativas:
                            delay = delay_inicial * (2 ** (tentativa - 1))
                            logger.warning(
                                f"Gemini sobrecarregado (503) na tentativa {tentativa}. "
                                f"Aguardando {delay}s..."
                            )
                            time.sleep(delay)
                            continue
                        else:
                            # Retries esgotados para este modelo; tenta o próximo se disponível
                            if modelo_idx < len(modelos_para_tentar) - 1:
                                proximo_modelo = modelos_para_tentar[modelo_idx + 1]
                                logger.warning(
                                    f"Gemini 503 após {max_tentativas} tentativas em {modelo_atual}. "
                                    f"Tentando modelo alternativo: {proximo_modelo}"
                                )
                                break  # Sai do loop de tentativas, vai para próximo modelo
                            logger.error(f"Gemini ainda sobrecarregado após {max_tentativas} tentativas.")
                            raise Exception(
                                "O serviço do Google Gemini está temporariamente sobrecarregado. "
                                "Por favor, tente novamente em 1-2 minutos."
                            )
                    else:
                        logger.error(f"Erro ao chamar Gemini: {e}", exc_info=True)
                        raise
            else:
                # Loop de tentativas esgotou sem break (não foi 429 com fallback)
                continue
            # Se deu break (429 com fallback disponível), continua para próximo modelo
            continue
        
        raise Exception("Todos os modelos Gemini falharam. Tente novamente mais tarde.")
    
    def processar_consulta(self, pergunta: str, usuario) -> Dict[str, Any]:
        """
        Processa uma pergunta em linguagem natural e retorna dados relevantes
        
        NOVO: Integrado com AI Dispatcher para Agente de Execução
        - Primeiro tenta resolver via dispatcher (comandos diretos)
        - Se não identificar comando, usa análise conversacional tradicional
        
        Args:
            pergunta: Pergunta do usuário
            usuario: Usuário autenticado (User object)
            
        Returns:
            Dict com resposta e dados
        """
        if not self.is_available():
            return {
                'sucesso': False,
                'mensagem': 'Serviço de IA não disponível. Configure GEMINI_API_KEY no arquivo .env',
                'tipo': 'erro'
            }
        
        try:
            # NOVO: Tenta resolver via Dispatcher (Agente de Execução)
            dispatcher = AIDispatcher(pergunta, usuario)
            if dispatcher.pode_executar():
                logger.info(f"✅ Dispatcher identificou comando executável na pergunta: {pergunta[:50]}...")
                resultado = dispatcher.resolver()
                
                # Formata resposta no padrão do AIService
                return {
                    'sucesso': True,
                    'resposta': resultado['conteudo'],
                    'tipo': resultado.get('acao', 'file'),
                    'titulo': resultado.get('titulo'),
                    'url': resultado.get('url'),
                    'formato': resultado.get('formato'),
                    'data_inicio': resultado.get('data_inicio'),
                    'data_fim': resultado.get('data_fim'),
                    'modo': 'agente_execucao'  # Identifica que veio do dispatcher
                }
            
            # Se dispatcher não identificou comando, segue fluxo conversacional tradicional
            logger.info(f"ℹ️ Dispatcher não identificou comando. Usando análise conversacional para: {pergunta[:50]}...")
            # Analisa a intenção da pergunta
            intencao = self._analisar_intencao(pergunta)
            
            # Busca dados relevantes do banco
            dados = self._buscar_dados(intencao, usuario, pergunta)
            
            # Mapeia tipo para rota de navegação
            ROTAS_NAVEGACAO = {
                'fiscal_cte': '/cte',
                'fiscal_nfe': '/nfe',
                'fiscal_nfce': '/nfce',
                'fiscal_mdfe': '/fiscal/mdfe',
                'relatorios': '/relatorios',
                'vendas': '/vendas',
                'financeiro': '/financeiro',
                'clientes': '/clientes',
                'estoque': '/produtos',
                'comandas': '/comandas',
            }
            tipo = intencao.get('tipo', 'geral')
            rota = ROTAS_NAVEGACAO.get(tipo)
            deve_navegar = intencao.get('navegar', False) and rota is not None
            
            # Gera resposta contextualizada
            resposta = self._gerar_resposta(pergunta, intencao, dados)
            
            result = {
                'sucesso': True,
                'resposta': resposta,
                'dados': dados,
                'tipo': tipo,
            }
            
            # Se for gerar PDF, adiciona ação de PDF (não navegação)
            if tipo == 'gerar_pdf':
                result['acao_pdf'] = {
                    'tipo_relatorio': dados.get('tipo_relatorio', 'vendas'),
                    'periodo': dados.get('periodo', {})
                }
            elif deve_navegar:
                result['acao_navegar'] = {'rota': rota, 'label': self._label_rota(tipo)}
            
            return result
            
        except Exception as e:
            logger.error(f"Erro ao processar consulta: {e}", exc_info=True)
            return {
                'sucesso': False,
                'mensagem': f'Erro ao processar consulta: {str(e)}',
                'tipo': 'erro'
            }
    
    def _label_rota(self, tipo: str) -> str:
        """Retorna label amigável para o tipo de navegação"""
        labels = {
            'fiscal_cte': 'Abrir CT-e',
            'fiscal_nfe': 'Abrir NF-e',
            'fiscal_nfce': 'Abrir NFC-e',
            'fiscal_mdfe': 'Abrir MDF-e',
            'relatorios': 'Ver Relatórios',
            'vendas': 'Ir para Vendas',
            'financeiro': 'Ir para Financeiro',
            'clientes': 'Ver Clientes',
            'estoque': 'Ver Produtos/Estoque',
            'comandas': 'Ver Comandas',
        }
        return labels.get(tipo, 'Abrir módulo')

    def _analisar_intencao(self, pergunta: str) -> Dict[str, Any]:
        """Analisa a intenção da pergunta usando IA"""
        
        prompt = f"""Analise a seguinte pergunta sobre um sistema de gestão empresarial e identifique:
1. Tipo de consulta (vendas, estoque, financeiro, NCM, análise de erro, geração de PDF, etc)
2. Período temporal mencionado (hoje, ontem, esta semana, este mês, último mês, este ano, etc)
3. Filtros específicos (produto, cliente, vendedor, status, etc)
4. Tipo de agregação (total, média, contagem, lista, etc)

Pergunta: "{pergunta}"

Retorne APENAS um JSON válido com a estrutura:
{{
    "tipo": "vendas|estoque|financeiro|clientes|produtos|comandas|fiscal_cte|fiscal_nfe|fiscal_nfce|fiscal_mdfe|relatorios|ncm_produto|analise_erro|gerar_pdf|geral",
    "navegar": true/false (true se o usuário quer ir para uma tela, gerar/emitir/criar algo, ou abrir um relatório),
    "periodo": {{
        "tipo": "hoje|ontem|esta_semana|este_mes|ultimo_mes|este_ano|ultimo_ano|customizado",
        "inicio": "YYYY-MM-DD ou null",
        "fim": "YYYY-MM-DD ou null"
    }},
    "filtros": {{
        "produto": "nome ou null",
        "cliente": "nome ou null",
        "status": "valor ou null"
    }},
    "agregacao": "total|media|contagem|lista|comparacao",
    "entidades": ["lista de entidades relevantes mencionadas"]
}}"""

        try:
            texto_resposta = self._chamar_gemini_com_retry(prompt, max_tentativas=2, delay_inicial=1.5)
            
            # Remove markdown se presente
            if texto_resposta.startswith('```json'):
                texto_resposta = texto_resposta[7:]
            if texto_resposta.startswith('```'):
                texto_resposta = texto_resposta[3:]
            if texto_resposta.endswith('```'):
                texto_resposta = texto_resposta[:-3]
            texto_resposta = texto_resposta.strip()
            
            intencao = json.loads(texto_resposta)
            
            # Processa período automaticamente se não foi especificado
            if intencao.get('periodo', {}).get('tipo'):
                intencao['periodo'] = self._calcular_periodo(intencao['periodo']['tipo'])
            
            return intencao
            
        except Exception as e:
            logger.error(f"Erro ao analisar intenção: {e}")
            # Fallback: análise básica por palavras-chave
            return self._analisar_intencao_simples(pergunta)
    
    def _analisar_intencao_simples(self, pergunta: str) -> Dict[str, Any]:
        """Análise simples de intenção sem IA (fallback)"""
        pergunta_lower = pergunta.lower()
        
        # Detecta tipo — documentos fiscais têm prioridade
        if any(word in pergunta_lower for word in ['ncm', 'nomenclatura comum', 'código ncm', 'codigo ncm']):
            tipo = 'ncm_produto'
        elif any(word in pergunta_lower for word in ['erro', 'exception', 'traceback', 'bug', 'falha', 'crash']):
            tipo = 'analise_erro'
        elif any(word in pergunta_lower for word in ['gerar pdf', 'exportar pdf', 'salvar pdf', 'relatório pdf', 'relatorio pdf']):
            tipo = 'gerar_pdf'
        elif any(word in pergunta_lower for word in ['ct-e', 'cte', 'conhecimento de transporte', 'frete']):
            tipo = 'fiscal_cte'
        elif any(word in pergunta_lower for word in ['nf-e', 'nfe', 'nota fiscal eletrônica', 'nota fiscal']):
            tipo = 'fiscal_nfe'
        elif any(word in pergunta_lower for word in ['nfc-e', 'nfce', 'cupom fiscal']):
            tipo = 'fiscal_nfce'
        elif any(word in pergunta_lower for word in ['mdf-e', 'mdfe', 'manifesto']):
            tipo = 'fiscal_mdfe'
        elif any(word in pergunta_lower for word in ['relatório', 'relatorio', 'dre', 'comissão', 'comissoes']):
            tipo = 'relatorios'
        elif any(word in pergunta_lower for word in ['vend', 'fatur', 'receit']):
            tipo = 'vendas'
        elif any(word in pergunta_lower for word in ['estoque', 'produto']):
            tipo = 'estoque'
        elif any(word in pergunta_lower for word in ['pagar', 'receber', 'financeiro', 'contas']):
            tipo = 'financeiro'
        elif any(word in pergunta_lower for word in ['cliente', 'consumidor']):
            tipo = 'clientes'
        elif any(word in pergunta_lower for word in ['comanda', 'mesa']):
            tipo = 'comandas'
        else:
            tipo = 'geral'
        
        # Detecta intenção de navegação (gerar/emitir/acessar/ir para)
        navegar = any(word in pergunta_lower for word in [
            'gerar', 'emitir', 'criar', 'novo', 'nova', 'abrir', 'acessar',
            'ir para', 'ir ate', 'ir até', 'mostrar', 'ver', 'listar', 'relatório'
        ])
        
        # Detecta período
        hoje = date.today()
        if 'hoje' in pergunta_lower:
            periodo_tipo = 'hoje'
            inicio = fim = hoje
        elif 'ontem' in pergunta_lower:
            periodo_tipo = 'ontem'
            inicio = fim = hoje - timedelta(days=1)
        elif any(word in pergunta_lower for word in ['esta semana', 'nesta semana', 'semana']):
            periodo_tipo = 'esta_semana'
            inicio = hoje - timedelta(days=hoje.weekday())
            fim = hoje
        elif any(word in pergunta_lower for word in ['este mês', 'neste mês', 'mês']):
            periodo_tipo = 'este_mes'
            inicio = hoje.replace(day=1)
            fim = hoje
        else:
            periodo_tipo = 'este_mes'
            inicio = hoje.replace(day=1)
            fim = hoje
        
        return {
            'tipo': tipo,
            'navegar': navegar,
            'periodo': {
                'tipo': periodo_tipo,
                'inicio': inicio.strftime('%Y-%m-%d'),
                'fim': fim.strftime('%Y-%m-%d')
            },
            'filtros': {},
            'agregacao': 'total',
            'entidades': []
        }
    
    def _calcular_periodo(self, tipo_periodo: str) -> Dict[str, str]:
        """Calcula datas de início e fim baseado no tipo de período"""
        hoje = date.today()
        
        periodos = {
            'hoje': (hoje, hoje),
            'ontem': (hoje - timedelta(days=1), hoje - timedelta(days=1)),
            'esta_semana': (hoje - timedelta(days=hoje.weekday()), hoje),
            'ultima_semana': (hoje - timedelta(days=hoje.weekday() + 7), hoje - timedelta(days=hoje.weekday() + 1)),
            'este_mes': (hoje.replace(day=1), hoje),
            'ultimo_mes': ((hoje.replace(day=1) - timedelta(days=1)).replace(day=1), hoje.replace(day=1) - timedelta(days=1)),
            'este_ano': (hoje.replace(month=1, day=1), hoje),
            'ultimo_ano': (hoje.replace(year=hoje.year-1, month=1, day=1), hoje.replace(year=hoje.year-1, month=12, day=31)),
        }
        
        inicio, fim = periodos.get(tipo_periodo, (hoje.replace(day=1), hoje))
        
        return {
            'tipo': tipo_periodo,
            'inicio': inicio.strftime('%Y-%m-%d'),
            'fim': fim.strftime('%Y-%m-%d')
        }
    
    def _buscar_dados(self, intencao: Dict[str, Any], usuario, pergunta: str = '') -> Dict[str, Any]:
        """Busca dados relevantes do banco baseado na intenção"""
        tipo = intencao.get('tipo', 'geral')
        periodo = intencao.get('periodo', {})
        
        inicio = periodo.get('inicio')
        fim = periodo.get('fim')
        
        try:
            if tipo == 'vendas':
                return self._buscar_dados_vendas(inicio, fim, intencao.get('filtros', {}))
            elif tipo == 'estoque':
                return self._buscar_dados_estoque(intencao.get('filtros', {}))
            elif tipo == 'financeiro':
                return self._buscar_dados_financeiro(inicio, fim, intencao.get('filtros', {}))
            elif tipo == 'clientes':
                return self._buscar_dados_clientes(intencao.get('filtros', {}))
            elif tipo == 'comandas':
                return self._buscar_dados_comandas(inicio, fim, intencao.get('filtros', {}))
            elif tipo == 'fiscal_cte':
                return self._buscar_dados_cte(inicio, fim)
            elif tipo in ('fiscal_nfe', 'fiscal_nfce'):
                return self._buscar_dados_nfe(inicio, fim)
            elif tipo == 'relatorios':
                return self._buscar_dados_relatorios(inicio, fim)
            elif tipo == 'ncm_produto':
                return self._buscar_ncm_produto(pergunta, intencao.get('filtros', {}))
            elif tipo == 'analise_erro':
                return self._analisar_erro(pergunta)
            elif tipo == 'gerar_pdf':
                return self._preparar_dados_pdf(intencao, pergunta)
            else:
                return self._buscar_dados_gerais(inicio, fim)
        except Exception as e:
            logger.error(f"Erro ao buscar dados: {e}")
            return {'erro': str(e)}
    
    def _buscar_dados_vendas(self, inicio: str, fim: str, filtros: Dict) -> Dict[str, Any]:
        """Busca dados de vendas"""
        from api.models import Venda, VendaItem
        
        query = Venda.objects.all()
        
        if inicio and fim:
            query = query.filter(data_documento__range=[inicio, fim])
        
        # Totais
        totais = query.aggregate(
            total_vendas=Sum('valor_total'),
            quantidade_vendas=Count('id_venda'),
            ticket_medio=Avg('valor_total')
        )
        
        # Top produtos vendidos
        top_produtos = VendaItem.objects.filter(
            id_venda__in=query
        ).values(
            'id_produto__nome_produto'
        ).annotate(
            quantidade_total=Sum('quantidade'),
            valor_total=Sum('valor_total')
        ).order_by('-valor_total')[:5]
        
        return {
            'total_vendas': float(totais['total_vendas'] or 0),
            'quantidade_vendas': totais['quantidade_vendas'] or 0,
            'ticket_medio': float(totais['ticket_medio'] or 0),
            'top_produtos': list(top_produtos),
            'periodo': {'inicio': inicio, 'fim': fim}
        }
    
    def _buscar_dados_estoque(self, filtros: Dict) -> Dict[str, Any]:
        """Busca dados de estoque"""
        from api.models import Estoque, Produto
        
        query = Estoque.objects.select_related('id_produto').all()
        
        # Produtos com estoque baixo
        baixo_estoque = query.filter(
            quantidade__lte=F('quantidade_minima')
        ).count()
        
        # Valor total em estoque
        valor_estoque = query.aggregate(
            valor_total=Sum(F('quantidade') * F('valor_venda'))
        )
        
        # Total de produtos
        total_produtos = Produto.objects.count()
        
        return {
            'total_produtos': total_produtos,
            'produtos_baixo_estoque': baixo_estoque,
            'valor_estoque': float(valor_estoque['valor_total'] or 0)
        }
    
    def _buscar_dados_financeiro(self, inicio: str, fim: str, filtros: Dict) -> Dict[str, Any]:
        """Busca dados financeiros"""
        from api.models import FinanceiroConta
        
        query = FinanceiroConta.objects.all()
        
        if inicio and fim:
            query = query.filter(data_vencimento__range=[inicio, fim])
        
        # Contas a receber
        receber = query.filter(tipo_conta='Receber').aggregate(
            total=Sum('valor_parcela'),
            pendente=Sum('valor_parcela', filter=Q(status_conta='Pend')),
            recebido=Sum('valor_liquidado', filter=Q(status_conta='Paga'))
        )
        
        # Contas a pagar
        pagar = query.filter(tipo_conta='Pagar').aggregate(
            total=Sum('valor_parcela'),
            pendente=Sum('valor_parcela', filter=Q(status_conta='Pend')),
            pago=Sum('valor_liquidado', filter=Q(status_conta='Paga'))
        )
        
        return {
            'contas_receber': {
                'total': float(receber['total'] or 0),
                'pendente': float(receber['pendente'] or 0),
                'recebido': float(receber['recebido'] or 0)
            },
            'contas_pagar': {
                'total': float(pagar['total'] or 0),
                'pendente': float(pagar['pendente'] or 0),
                'pago': float(pagar['pago'] or 0)
            },
            'saldo': float((receber['recebido'] or 0) - (pagar['pago'] or 0)),
            'periodo': {'inicio': inicio, 'fim': fim}
        }
    
    def _buscar_dados_clientes(self, filtros: Dict) -> Dict[str, Any]:
        """Busca dados de clientes"""
        from api.models import Cliente, Venda
        
        total_clientes = Cliente.objects.count()
        
        # Cliente com mais compras
        top_clientes = Venda.objects.values(
            'id_cliente__nome_razao_social'
        ).annotate(
            total_compras=Sum('valor_total'),
            quantidade_compras=Count('id_venda')
        ).order_by('-total_compras')[:5]
        
        return {
            'total_clientes': total_clientes,
            'top_clientes': list(top_clientes)
        }
    
    def _buscar_dados_comandas(self, inicio: str, fim: str, filtros: Dict) -> Dict[str, Any]:
        """Busca dados de comandas"""
        from comandas.models import Comanda
        
        query = Comanda.objects.all()
        
        if inicio and fim:
            query = query.filter(data_abertura__date__range=[inicio, fim])
        
        # Totais
        totais = query.aggregate(
            total_comandas=Count('id'),
            total_valor=Sum('total'),
            comandas_abertas=Count('id', filter=Q(status='Aberta'))
        )
        
        return {
            'total_comandas': totais['total_comandas'] or 0,
            'total_valor': float(totais['total_valor'] or 0),
            'comandas_abertas': totais['comandas_abertas'] or 0,
            'periodo': {'inicio': inicio, 'fim': fim}
        }
    
    def _buscar_dados_cte(self, inicio: str, fim: str) -> Dict[str, Any]:
        """Busca dados de CT-e (Conhecimento de Transporte)"""
        try:
            from cte.models import ConhecimentoTransporte
            query = ConhecimentoTransporte.objects.all()
            if inicio and fim:
                query = query.filter(data_emissao__date__range=[inicio, fim])
            totais = query.aggregate(
                total=Count('id_cte'),
                valor_total=Sum('valor_total_servico'),
                autorizados=Count('id_cte', filter=Q(status_cte='AUTORIZADO')),
                cancelados=Count('id_cte', filter=Q(status_cte='CANCELADO')),
                pendentes=Count('id_cte', filter=Q(status_cte='PENDENTE')),
            )
            recentes = list(query.order_by('-data_emissao').values(
                'numero_cte', 'status_cte', 'valor_total_servico'
            )[:10])
            return {
                'total': totais['total'] or 0,
                'valor_total_servico': float(totais['valor_total'] or 0),
                'autorizados': totais['autorizados'] or 0,
                'cancelados': totais['cancelados'] or 0,
                'pendentes': totais['pendentes'] or 0,
                'recentes': recentes,
                'periodo': {'inicio': inicio, 'fim': fim}
            }
        except Exception as e:
            logger.error(f'Erro ao buscar dados CT-e: {e}')
            return {'erro': str(e), 'total': 0}

    def _buscar_dados_nfe(self, inicio: str, fim: str) -> Dict[str, Any]:
        """Busca dados de NF-e a partir das vendas"""
        try:
            from api.models import Venda
            query = Venda.objects.exclude(status_nfe__isnull=True)
            if inicio and fim:
                query = query.filter(data_documento__range=[inicio, fim])
            totais = query.aggregate(
                total=Count('id_venda'),
                valor_total=Sum('valor_total'),
                emitidas=Count('id_venda', filter=Q(status_nfe='EMITIDA')),
                canceladas=Count('id_venda', filter=Q(status_nfe='CANCELADA')),
                pendentes=Count('id_venda', filter=Q(status_nfe='PENDENTE')),
            )
            return {
                'total': totais['total'] or 0,
                'valor_total': float(totais['valor_total'] or 0),
                'emitidas': totais['emitidas'] or 0,
                'canceladas': totais['canceladas'] or 0,
                'pendentes': totais['pendentes'] or 0,
                'periodo': {'inicio': inicio, 'fim': fim}
            }
        except Exception as e:
            logger.error(f'Erro ao buscar dados NF-e: {e}')
            return {'erro': str(e), 'total': 0}

    def _buscar_dados_relatorios(self, inicio: str, fim: str) -> Dict[str, Any]:
        """Resumo de dados para sugestões de relatórios"""
        vendas = self._buscar_dados_vendas(inicio, fim, {})
        financeiro = self._buscar_dados_financeiro(inicio, fim, {})
        return {
            'vendas': vendas,
            'financeiro': financeiro,
            'relatorios_disponiveis': [
                {'nome': 'DRE Gerencial', 'rota': '/relatorios/dre'},
                {'nome': 'Comissões de Vendedores', 'rota': '/relatorios/comissoes'},
                {'nome': 'Cashback', 'rota': '/relatorios/cashback'},
                {'nome': 'Lucratividade', 'rota': '/relatorios/lucratividade'},
                {'nome': 'Projeção de Compras', 'rota': '/relatorios/projecao-compra'},
            ],
            'periodo': {'inicio': inicio, 'fim': fim}
        }

    def _buscar_ncm_produto(self, pergunta: str, filtros: Dict) -> Dict[str, Any]:
        """Busca NCM de produtos - primeiro no sistema, depois na web"""
        try:
            from api.models import Produto
            import re
            
            # Extrai possível nome de produto da pergunta
            # Remove stopwords comuns (artigos, preposições, etc)
            palavras_busca = re.sub(r'\b(ncm|qual|codigo|é|do|da|de|dos|das|o|a|os|as|um|uma|para|produto)\b', '', pergunta.lower())
            # Remove múltiplos espaços e faz strip
            palavras_busca = re.sub(r'\s+', ' ', palavras_busca).strip()
            
            if filtros.get('produto'):
                palavras_busca = filtros['produto']
            
            if not palavras_busca:
                # Lista produtos com NCM cadastrado
                produtos = Produto.objects.exclude(ncm__isnull=True).exclude(ncm='').values(
                    'codigo_produto', 'nome_produto', 'ncm'
                ).order_by('nome_produto')[:20]
                return {
                    'tipo': 'lista_ncm',
                    'produtos_com_ncm': list(produtos),
                    'total': Produto.objects.exclude(ncm__isnull=True).exclude(ncm='').count()
                }
            
            # Busca produtos que contenham as palavras
            # Usando extra() com COLLATE para evitar erro de colação MySQL utf8mb3 vs utf8mb4
            from django.db import connection
            
            # Prepara o padrão de busca
            busca_pattern = f'%{palavras_busca}%'
            
            # Query com COLLATE explícito para compatibilidade
            produtos = Produto.objects.extra(
                where=[
                    "(nome_produto COLLATE utf8mb4_general_ci LIKE %s OR "
                    "codigo_produto COLLATE utf8mb4_general_ci LIKE %s OR "
                    "descricao COLLATE utf8mb4_general_ci LIKE %s)"
                ],
                params=[busca_pattern, busca_pattern, busca_pattern]
            ).values('codigo_produto', 'nome_produto', 'ncm', 'descricao')[:10]
            
            produtos = list(produtos)
            
            # Se não encontrou produtos no sistema, busca na web
            if len(produtos) == 0:
                logger.info(f"Produto '{palavras_busca}' não encontrado no sistema. Buscando na web...")
                resultado_web = self._buscar_ncm_web(palavras_busca)
                
                return {
                    'tipo': 'busca_ncm_web',
                    'busca': palavras_busca,
                    'produtos_encontrados': [],
                    'total_encontrados': 0,
                    'resultado_web': resultado_web,
                    'origem': 'internet'
                }
            
            return {
                'tipo': 'busca_ncm',
                'busca': palavras_busca,
                'produtos_encontrados': produtos,
                'total_encontrados': len(produtos),
                'origem': 'sistema'
            }
        except Exception as e:
            logger.error(f'Erro ao buscar NCM: {e}')
            return {'erro': str(e)}

    def _analisar_erro(self, pergunta: str) -> Dict[str, Any]:
        """Analisa erros/exceções enviados pelo usuário - inclui busca web para erros fiscais"""
        import re
        
        # Extrai informações do erro
        erro_info = {
            'tipo': 'analise_erro',
            'mensagem_original': pergunta,
            'traceback_detectado': False,
            'exception_type': None,
            'linha_erro': None,
            'arquivo': None
        }
        
        # Detecta códigos de erro fiscal (NF-e, CT-e, etc) - formato comum: "539", "204", etc
        # Padrões: "código 539", "erro 204", "rejeição 999"
        codigo_fiscal_match = re.search(
            r'(?:código|erro|rejeição|reject|code)[:\s]+(\d{3,4})',
            pergunta,
            re.IGNORECASE
        )
        
        # Também detecta se a mensagem menciona NF-e, CT-e, NFC-e, MDF-e
        is_erro_fiscal = any(termo in pergunta.lower() for termo in 
                            ['nf-e', 'nfe', 'nfc-e', 'nfce', 'ct-e', 'cte', 'mdf-e', 'mdfe', 'sefaz', 'danfe'])
        
        # Se detectou código de erro fiscal, busca na web
        if codigo_fiscal_match and is_erro_fiscal:
            codigo_erro = codigo_fiscal_match.group(1)
            logger.info(f"Detectado código de erro fiscal: {codigo_erro}. Buscando na web...")
            
            resultado_web = self._buscar_erro_fiscal_web(codigo_erro, pergunta)
            
            return {
                'tipo': 'analise_erro_fiscal',
                'codigo_erro': codigo_erro,
                'contexto': pergunta,
                'resultado_web': resultado_web,
                'origem': 'internet'
            }
        
        # Análise de erro Python normal (código original)
        # Detecta tipo de exceção
        exception_match = re.search(r'(\w+Error|\w+Exception):\s*(.+)', pergunta)
        if exception_match:
            erro_info['exception_type'] = exception_match.group(1)
            erro_info['mensagem_erro'] = exception_match.group(2)
        
        # Detecta linha do erro
        linha_match = re.search(r'line\s+(\d+)', pergunta, re.IGNORECASE)
        if linha_match:
            erro_info['linha_erro'] = linha_match.group(1)
        
        # Detecta arquivo
        arquivo_match = re.search(r'File\s+"([^"]+)"', pergunta)
        if arquivo_match:
            erro_info['arquivo'] = arquivo_match.group(1)
            erro_info['traceback_detectado'] = True
        
        # Análise contextual comum
        sugestoes = []
        if 'cannot resolve keyword' in pergunta.lower():
            sugestoes.append('Campo não existe no modelo Django. Verifique o nome correto do campo.')
        if 'list' in pergunta.lower() and 'not a function' in pergunta.lower():
            sugestoes.append('Tentando chamar .filter() ou .map() em variável que não é array. Adicione validação Array.isArray().')
        if 'undefined' in pergunta.lower() or 'null' in pergunta.lower():
            sugestoes.append('Acesso a propriedade de objeto null/undefined. Use optional chaining (?.) ou validações.')
        if 'cors' in pergunta.lower():
            sugestoes.append('Erro de CORS. Verifique configuração CORS_ALLOWED_ORIGINS no Django.')
        if 'token' in pergunta.lower() and ('invalid' in pergunta.lower() or 'expired' in pergunta.lower()):
            sugestoes.append('Token JWT inválido/expirado. Usuário precisa fazer login novamente.')
        
        erro_info['sugestoes_automaticas'] = sugestoes
        erro_info['origem'] = 'sistema'
        return erro_info

    def _preparar_dados_pdf(self, intencao: Dict, pergunta: str = '') -> Dict[str, Any]:
        """Prepara dados para geração de PDF"""
        # Detectar tipo de relatório pela pergunta
        pergunta_lower = pergunta.lower()
        tipo_relatorio = 'customizado'  # default
        
        # Prioridade: detectar pelo conteúdo da pergunta
        if any(word in pergunta_lower for word in ['venda', 'vendas', 'faturamento', 'receita']):
            tipo_relatorio = 'vendas'
        elif any(word in pergunta_lower for word in ['financeiro', 'financeira', 'contas', 'pagar', 'receber']):
            tipo_relatorio = 'financeiro'
        elif any(word in pergunta_lower for word in ['estoque', 'produto', 'produtos']):
            tipo_relatorio = 'estoque'
        elif any(word in pergunta_lower for word in ['dre', 'resultado', 'exercício']):
            tipo_relatorio = 'financeiro'
        elif any(word in pergunta_lower for word in ['comiss', 'vendedor', 'vendedores']):
            tipo_relatorio = 'financeiro'
        
        # Fallback: tentar pegar dos filtros
        if tipo_relatorio == 'customizado':
            tipo_relatorio = intencao.get('filtros', {}).get('tipo', 'customizado')
        
        periodo = intencao.get('periodo', {})
        
        # Busca dados relevantes
        dados_relatorio = {
            'tipo_relatorio': tipo_relatorio,
            'periodo': periodo,
            'disponivel_pdf': True,
            'formatos': ['PDF', 'Excel'],
            'endpoint_pdf': '/api/ai/gerar-pdf/',  # Endpoint para gerar PDF
            'endpoint_preview': '/api/ai/preview-pdf/',  # Endpoint para preview
            'instrucoes': 'Chame o endpoint /api/ai/gerar-pdf/ com POST {"tipo": "vendas|vendas_operacao|financeiro|estoque", "periodo": {...}}. Use "vendas_operacao" para relatório agrupado por operação fiscal.',
            'sugestoes': [
                'Relatório de Vendas',
                'Relatório de Vendas por Operação',
                'Relatório DRE',
                'Relatório de Comissões',
                'Relatório de Estoque',
                'Relatório Financeiro'
            ]
        }
        
        return dados_relatorio

    def _buscar_ncm_web(self, produto_nome: str) -> Dict[str, Any]:
        """
        Busca NCM de um produto na internet usando Gemini com grounding
        
        Args:
            produto_nome: Nome do produto para buscar NCM
            
        Returns:
            Dict com informações do NCM encontrado
        """
        try:
            if not self.is_available():
                return {
                    'sucesso': False,
                    'origem': 'web',
                    'mensagem': 'Gemini não disponível para busca web'
                }
            
            # Usa Gemini com Google Search grounding
            prompt = f"""Qual é o código NCM (Nomenclatura Comum do Mercosul) para o produto: {produto_nome}?

Forneça APENAS:
1. O código NCM (8 dígitos)
2. A descrição oficial do NCM
3. Se houver múltiplas possibilidades, liste as mais comuns

Formato de resposta:
NCM: [código]
Descrição: [descrição]
Observações: [se houver alternativas]"""

            resposta_texto = self._chamar_gemini_com_retry(
                prompt,
                max_tentativas=2,
                delay_inicial=1.5,
                config={
                    'temperature': 0.3,  # Mais determinístico para dados factuais
                    'top_p': 0.8,
                }
            )
            
            # Extrai NCM da resposta
            ncm_match = re.search(r'NCM[:\s]+(\d{4}\.?\d{2}\.?\d{2}|\d{8})', resposta_texto, re.IGNORECASE)
            ncm_codigo = None
            if ncm_match:
                ncm_codigo = ncm_match.group(1).replace('.', '')
            
            return {
                'sucesso': True,
                'origem': 'web',
                'produto': produto_nome,
                'ncm': ncm_codigo,
                'resposta_completa': resposta_texto,
                'confianca': 'alta' if ncm_codigo else 'baixa'
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar NCM na web: {e}", exc_info=True)
            
            # Tratamento específico para erro de quota
            erro_str = str(e)
            if '429' in erro_str or 'RESOURCE_EXHAUSTED' in erro_str or 'quota' in erro_str.lower():
                return {
                    'sucesso': False,
                    'origem': 'web',
                    'erro_tipo': 'quota_excedida',
                    'mensagem': 'Limite de consultas à API Gemini atingido. Tente novamente mais tarde ou consulte a tabela NCM oficial.',
                    'erro': 'Quota da API Gemini excedida (limite: 20 requisições/dia no tier gratuito)'
                }
            
            return {
                'sucesso': False,
                'origem': 'web',
                'erro': str(e)
            }

    def _buscar_erro_fiscal_web(self, codigo_erro: str, contexto: str = '') -> Dict[str, Any]:
        """
        Busca significado de código de erro fiscal (NF-e, CT-e, NFC-e) na internet
        
        Args:
            codigo_erro: Código do erro (ex: "539", "204", etc)
            contexto: Contexto adicional do erro
            
        Returns:
            Dict com explicação e solução do erro
        """
        try:
            if not self.is_available():
                return {
                    'sucesso': False,
                    'origem': 'web',
                    'mensagem': 'Gemini não disponível para busca web'
                }
            
            # Determina tipo de documento fiscal
            tipo_doc = 'NF-e/NFC-e'
            if 'cte' in contexto.lower() or 'ct-e' in contexto.lower():
                tipo_doc = 'CT-e'
            elif 'mdfe' in contexto.lower() or 'mdf-e' in contexto.lower():
                tipo_doc = 'MDF-e'
            
            prompt = f"""Código de erro {tipo_doc}: {codigo_erro}

Contexto adicional: {contexto if contexto else 'Não fornecido'}

Por favor, forneça:
1. **Significado do erro**: O que esse código significa?
2. **Causa comum**: Por que esse erro acontece?
3. **Solução**: Como resolver esse erro? (passos práticos)
4. **Prevenção**: Como evitar esse erro no futuro?

Seja específico e técnico. Se for erro de SEFAZ, cite a documentação oficial."""

            resposta_texto = self._chamar_gemini_com_retry(
                prompt,
                max_tentativas=2,
                delay_inicial=1.5,
                config={
                    'temperature': 0.3,
                    'top_p': 0.8,
                }
            )
            
            return {
                'sucesso': True,
                'origem': 'web',
                'codigo_erro': codigo_erro,
                'tipo_documento': tipo_doc,
                'explicacao': resposta_texto,
                'fonte': 'Pesquisa web via Gemini'
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar código fiscal na web: {e}", exc_info=True)
            
            # Tratamento específico para erro de quota
            erro_str = str(e)
            if '429' in erro_str or 'RESOURCE_EXHAUSTED' in erro_str or 'quota' in erro_str.lower():
                return {
                    'sucesso': False,
                    'origem': 'web',
                    'erro_tipo': 'quota_excedida',
                    'mensagem': 'Limite de consultas à API Gemini atingido. Consulte o manual do SEFAZ ou aguarde para nova tentativa.',
                    'erro': 'Quota da API Gemini excedida (limite: 20 requisições/dia no tier gratuito)'
                }
            
            return {
                'sucesso': False,
                'origem': 'web',
                'erro': str(e)
            }

    def _buscar_dados_gerais(self, inicio: str, fim: str) -> Dict[str, Any]:
        """Busca resumo geral dos dados"""
        vendas = self._buscar_dados_vendas(inicio, fim, {})
        financeiro = self._buscar_dados_financeiro(inicio, fim, {})
        estoque = self._buscar_dados_estoque({})
        
        return {
            'vendas': vendas,
            'financeiro': financeiro,
            'estoque': estoque,
            'periodo': {'inicio': inicio, 'fim': fim}
        }
    
    def _gerar_resposta(self, pergunta: str, intencao: Dict, dados: Dict) -> str:
        """Gera resposta em linguagem natural usando IA"""
        
        if not self.is_available():
            return self._gerar_resposta_simples(intencao, dados)
        
        prompt = f"""Com base nos dados abaixo, responda a seguinte pergunta de forma clara e objetiva.
Use formatação markdown para melhor legibilidade.

Pergunta: "{pergunta}"

Dados disponíveis:
{json.dumps(dados, indent=2, default=str, ensure_ascii=False)}

Instruções:
- Seja conciso mas informativo
- Use números formatados (R$ para valores, separador de milhar)
- Destaque informações importantes com **negrito**
- Use listas quando apropriado
- Responda em português do Brasil
- Se houver dados relevantes, cite-os especificamente"""

        try:
            resposta = self._chamar_gemini_com_retry(prompt)
            return resposta
            
        except Exception as e:
            logger.error(f"Erro ao gerar resposta: {e}")
            return self._gerar_resposta_simples(intencao, dados)
    
    def _gerar_resposta_simples(self, intencao: Dict, dados: Dict) -> str:
        """Gera resposta simples sem IA (fallback)"""
        tipo = intencao.get('tipo', 'geral')
        
        if tipo == 'vendas' and 'total_vendas' in dados:
            return f"""**Resumo de Vendas**

- **Total de Vendas**: R$ {dados['total_vendas']:,.2f}
- **Quantidade**: {dados['quantidade_vendas']} vendas
- **Ticket Médio**: R$ {dados['ticket_medio']:,.2f}
- **Período**: {dados['periodo']['inicio']} a {dados['periodo']['fim']}"""
        
        elif tipo == 'financeiro' and 'contas_receber' in dados:
            saldo = dados.get('saldo', 0)
            status = "positivo" if saldo >= 0 else "negativo"
            return f"""**Resumo Financeiro**

**Contas a Receber:**
- Total: R$ {dados['contas_receber']['total']:,.2f}
- Pendente: R$ {dados['contas_receber']['pendente']:,.2f}

**Contas a Pagar:**
- Total: R$ {dados['contas_pagar']['total']:,.2f}
- Pendente: R$ {dados['contas_pagar']['pendente']:,.2f}

**Saldo**: R$ {abs(saldo):,.2f} ({status})"""
        
        elif tipo == 'estoque' and 'total_produtos' in dados:
            return f"""**Resumo de Estoque**

- **Total de Produtos**: {dados['total_produtos']}
- **Produtos com Estoque Baixo**: {dados['produtos_baixo_estoque']}
- **Valor Total em Estoque**: R$ {dados['valor_estoque']:,.2f}"""

        elif tipo == 'fiscal_cte':
            total = dados.get('total', 0)
            valor = dados.get('valor_total_servico', 0)
            aut = dados.get('autorizados', 0)
            can = dados.get('cancelados', 0)
            pen = dados.get('pendentes', 0)
            return f"""**CT-e — Conhecimento de Transporte Eletrônico**

- **Total de CT-e no período**: {total}
- **Valor Total dos Fretes**: R$ {valor:,.2f}
- **Autorizados**: {aut} | **Cancelados**: {can} | **Pendentes**: {pen}

Use o botão abaixo para acessar o módulo CT-e e emitir ou consultar documentos."""

        elif tipo in ('fiscal_nfe', 'fiscal_nfce'):
            label = 'NF-e' if tipo == 'fiscal_nfe' else 'NFC-e'
            total = dados.get('total', 0)
            valor = dados.get('valor_total', 0)
            emi = dados.get('emitidas', 0)
            can = dados.get('canceladas', 0)
            pen = dados.get('pendentes', 0)
            return f"""**{label} — Nota Fiscal Eletrônica**

- **Total no período**: {total}
- **Valor Total**: R$ {valor:,.2f}
- **Emitidas**: {emi} | **Canceladas**: {can} | **Pendentes**: {pen}

Use o botão abaixo para acessar o módulo {label}."""

        elif tipo == 'relatorios':
            relatorios = dados.get('relatorios_disponiveis', [])
            lista = '\n'.join([f"- **{r['nome']}**" for r in relatorios])
            return f"""**Relatórios Disponíveis**

{lista}

Use o botão abaixo para acessar o painel de relatórios."""

        elif tipo == 'ncm_produto':
            # Busca NCM via web (produto não encontrado no sistema)
            if dados.get('tipo') == 'busca_ncm_web':
                resultado_web = dados.get('resultado_web', {})
                produto = dados.get('busca', '')
                
                if resultado_web.get('sucesso'):
                    ncm = resultado_web.get('ncm', 'Não encontrado')
                    resposta_completa = resultado_web.get('resposta_completa', '')
                    
                    return f"""**🌐 NCM Consultado na Internet**

**Produto buscado**: *{produto}*
**NCM encontrado**: `{ncm}` ✅

{resposta_completa}

---

⚠️ **Nota**: Este produto não está cadastrado no seu sistema. A informação foi obtida através de pesquisa online.

💡 **Dica**: Cadastre este produto no sistema com o NCM informado para facilitar futuras consultas e garantir a correta tributação."""
                else:
                    # Verifica se é erro de quota
                    erro_tipo = resultado_web.get('erro_tipo', '')
                    
                    if erro_tipo == 'quota_excedida':
                        return f"""**🌐 Busca de NCM na Internet**

**Produto buscado**: *{produto}*

⚠️ **Limite de Consultas Atingido**

O limite diário de consultas à API do Google Gemini foi excedido (20 requisições/dia no tier gratuito).

**O que fazer agora:**

1. **Aguarde**: As consultas serão restabelecidas nas próximas ~1 hora
2. **Consulte fontes oficiais**:
   - 🔗 [Tabela NCM - Receita Federal](https://www.gov.br/receitafederal/pt-br/assuntos/comercio-exterior/classificacao-fiscal-de-mercadorias)
   - 🔗 [Consultor NCM](https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/classifica-de-mercadorias/consultar-ncm)
3. **Entre em contato**: Consulte seu contador para obter o NCM correto
4. **Upgrade (opcional)**: Considere upgrade para Gemini API pago se precisar de mais consultas

💡 **Dica**: Cadastre os NCMs dos produtos mais usados no sistema para evitar necessidade de consultas web."""
                    else:
                        return f"""**🌐 Busca de NCM na Internet**

**Produto buscado**: *{produto}*

Não foi possível encontrar informações precisas sobre o NCM deste produto na internet.

**Recomendações**:
1. Consulte a tabela NCM oficial da Receita Federal
2. Entre em contato com seu contador
3. Verifique produtos similares já cadastrados no sistema

🔗 **Link útil**: https://www.gov.br/receitafederal/pt-br/assuntos/comercio-exterior/classificacao-fiscal-de-mercadorias"""
            
            # Busca NCM no sistema (código original)
            elif dados.get('tipo') == 'busca_ncm':
                produtos = dados.get('produtos_encontrados', [])
                if not produtos:
                    return f"**Nenhum produto encontrado** para a busca: *{dados.get('busca', '')}*"
                
                lista_produtos = []
                for p in produtos:
                    ncm_info = f"**NCM:** `{p['ncm']}`" if p.get('ncm') else "**NCM:** ❌ *Não cadastrado*"
                    lista_produtos.append(f"• **{p['nome_produto']}** (Código: {p['codigo_produto']})\n  {ncm_info}")
                
                return f"""**NCM — Nomenclatura Comum do Mercosul**

Busca: *{dados.get('busca', '')}*
Origem: 🏢 Sistema

{chr(10).join(lista_produtos)}

💡 **Dica**: O NCM é essencial para cálculo correto de impostos e emissão de documentos fiscais."""
            
            elif dados.get('tipo') == 'lista_ncm':
                total = dados.get('total', 0)
                return f"""**NCM Cadastrados**

Total de produtos com NCM: **{total}**

Use a busca acima para consultar o NCM de um produto específico.
Exemplo: *"qual o NCM do produto X"*"""

        elif tipo == 'analise_erro':
            # Análise de erro fiscal via web
            if dados.get('tipo') == 'analise_erro_fiscal':
                resultado_web = dados.get('resultado_web', {})
                codigo_erro = dados.get('codigo_erro', '')
                
                if resultado_web.get('sucesso'):
                    tipo_doc = resultado_web.get('tipo_documento', 'NF-e/NFC-e')
                    explicacao = resultado_web.get('explicacao', '')
                    
                    return f"""**🌐 Análise de Erro Fiscal ({tipo_doc})**

**Código do Erro**: `{codigo_erro}`

{explicacao}

---

**Fonte**: Pesquisa online via Gemini AI
**Origem**: Internet

💡 **Dica**: Se o problema persistir após seguir as orientações acima, consulte o manual de integração oficial do SEFAZ ou entre em contato com o suporte técnico."""
                else:
                    # Verifica se é erro de quota
                    erro_tipo = resultado_web.get('erro_tipo', '')
                    
                    if erro_tipo == 'quota_excedida':
                        return f"""**🌐 Análise de Erro Fiscal**

**Código do Erro**: `{codigo_erro}`

⚠️ **Limite de Consultas Atingido**

O limite diário de consultas à API do Google Gemini foi excedido (20 requisições/dia no tier gratuito).

**O que fazer agora:**

1. **Consulte fontes oficiais**:
   - 🔗 [Portal NF-e](http://www.nfe.fazenda.gov.br) - Manual de integração
   - 🔗 [Portal CT-e](https://www.cte.fazenda.gov.br) - Documentação oficial
   - 🔗 [SEFAZ do seu estado](https://www.gov.br/receitafederal/pt-br) - Suporte regional
2. **Entre em contato**: Consulte seu contador ou suporte técnico
3. **Aguarde**: As consultas serão restabelecidas nas próximas ~1 hora

💡 **Dica comum**: A maioria dos erros fiscais está relacionada a:
- **539**: Duplicidade de nota (já foi autorizada)
- **204**: Rejeição por duplicidade
- **252**: Falha na comunicação com SEFAZ"""
                    else:
                        return f"""**🌐 Análise de Erro Fiscal**

**Código do Erro**: `{codigo_erro}`

Não foi possível obter informações detalhadas sobre este erro através da pesquisa online.

**Recomendações**:
1. Consulte o manual de integração do SEFAZ do seu estado
2. Verifique a documentação oficial da NF-e/CT-e
3. Entre em contato com o suporte técnico

🔗 **Links úteis**:
- Portal NF-e: http://www.nfe.fazenda.gov.br
- Portal CT-e: https://www.cte.fazenda.gov.br"""
            
            # Análise de erro Python (código original)
            exc_type = dados.get('exception_type', 'Erro')
            msg_erro = dados.get('mensagem_erro', '')
            arquivo = dados.get('arquivo', '')
            linha = dados.get('linha_erro', '')
            sugestoes = dados.get('sugestoes_automaticas', [])
            
            resposta = f"""**🔍 Análise de Erro**

"""
            if exc_type:
                resposta += f"**Tipo**: `{exc_type}`\n"
            if msg_erro:
                resposta += f"**Mensagem**: {msg_erro}\n"
            if arquivo:
                resposta += f"**Arquivo**: `{arquivo}`"
            if linha:
                resposta += f" (linha {linha})"
            resposta += "\n\n"
            
            if sugestoes:
                resposta += "**💡 Possíveis Soluções**:\n"
                for sug in sugestoes:
                    resposta += f"- {sug}\n"
            else:
                resposta += "**💡 Dica**: Envie o traceback completo ou mais detalhes do erro para análise mais precisa."
            
            return resposta

        elif tipo == 'gerar_pdf':
            sugestoes = dados.get('sugestoes', [])
            return f"""**📄 Geração de Relatórios em PDF**

Relatórios disponíveis para exportação em PDF:

{chr(10).join(['• ' + s for s in sugestoes])}

**Para gerar um relatório**:
1. Acesse o módulo de relatórios
2. Escolha o relatório desejado
3. Clique em "Exportar PDF"

💡 Os relatórios podem ser exportados em **PDF** ou **Excel** conforme sua necessidade."""

        else:
            return "Dados recuperados com sucesso. Consulte a seção de dados para mais detalhes."

    # ──────────────────────────────────────────────────────────────────────────
    # CONSULTOR DE NEGÓCIOS — Análise estratégica completa
    # ──────────────────────────────────────────────────────────────────────────

    SYSTEM_PROMPT_CONSULTOR = (
        "Você é o Analista Inteligente do APERUS, desenvolvido para ajudar "
        "empresários brasileiros a tomar decisões mais lucrativas.\n\n"
        "Suas capacidades:\n"
        "• Analisar vendas, estoque, fluxo de caixa e tributação (incluindo IBS/CBS 2026).\n"
        "• Identificar produtos encalhados ou com giro acima da média.\n"
        "• Cruzar dados de clientes para sugerir vendas adicionais (Cross-sell e Up-sell).\n"
        "• Alertar sobre margens de lucro perigosas antes que virem prejuízo.\n"
        "• Monitorar inadimplência e sugerir ações de recuperação de crédito.\n\n"
        "Seu tom de voz: Profissional, direto ao ponto, encorajador. Use termos do mercado "
        "brasileiro (Margem de Contribuição, Markup, CMV, Giro de Estoque, Inadimplência, "
        "Curva ABC, Ticket Médio, Ponto de Equilíbrio).\n\n"
        "Regra de Ouro: Sempre que detectar um problema, sugira UMA ação imediata e concreta. "
        "Por exemplo: se estoque crítico → 'Deseja que eu gere uma cotação?'; se margem baixa "
        "→ 'Revise o preço ou negocie melhor com o fornecedor X'.\n\n"
        "Formato de resposta: Use Markdown. Organize em seções com emoji. Máximo 400 palavras. "
        "Priorize os 2-3 insights mais impactantes para o negócio hoje."
    )

    def gerar_analise_negocio(self, usuario) -> Dict[str, Any]:
        """
        Gera análise estratégica completa do negócio com insights acionáveis.
        Coleta dados reais do banco, formata como JSON de contexto e envia ao Gemini
        com o system prompt de Consultor de Negócios.
        """
        if not self.is_available():
            return {
                'sucesso': False,
                'mensagem': 'Serviço de IA não disponível. Configure GEMINI_API_KEY no .env',
            }

        try:
            contexto = self._coletar_contexto_negocio()
            resumo = self._chamar_gemini_consultor(contexto)
            insights = self._extrair_insights_estruturados(contexto)
            return {
                'sucesso': True,
                'resumo_markdown': resumo,
                'insights': insights,
                'dados_contexto': contexto,
            }
        except Exception as e:
            logger.error(f"Erro em gerar_analise_negocio: {e}", exc_info=True)
            return {
                'sucesso': False,
                'mensagem': f'Erro ao gerar análise: {str(e)}',
            }

    def _coletar_contexto_negocio(self) -> Dict[str, Any]:
        """Coleta métricas resumidas dos últimos 30 dias para enviar ao Gemini."""
        from api.models import Venda, VendaItem, Estoque, FinanceiroConta, Cliente
        from django.db.models import Sum, Count, Avg, Q, F
        from datetime import date, timedelta

        hoje = date.today()
        inicio_30 = hoje - timedelta(days=30)
        inicio_30_str = inicio_30.strftime('%Y-%m-%d')
        hoje_str = hoje.strftime('%Y-%m-%d')

        # ── Vendas ────────────────────────────────────────────────────────────
        vendas_qs = Venda.objects.filter(data_documento__range=[inicio_30_str, hoje_str])
        totais_venda = vendas_qs.aggregate(
            faturamento=Sum('valor_total'),
            qtd=Count('id_venda'),
            ticket=Avg('valor_total'),
        )

        top_produtos_raw = (
            VendaItem.objects
            .filter(id_venda__in=vendas_qs)
            .values('id_produto__nome_produto')
            .annotate(qtd_vendida=Sum('quantidade'), receita=Sum('valor_total'))
            .order_by('-receita')[:5]
        )
        top_produtos = [
            {
                'nome': p['id_produto__nome_produto'] or '—',
                'qtd': float(p['qtd_vendida'] or 0),
                'receita': float(p['receita'] or 0),
            }
            for p in top_produtos_raw
        ]

        # ── Estoque crítico (abaixo do mínimo) ────────────────────────────────
        estoque_critico = list(
            Estoque.objects
            .filter(quantidade__lte=F('quantidade_minima'))
            .select_related('id_produto')
            .values_list('id_produto__nome_produto', flat=True)[:8]
        )

        # ── Financeiro ────────────────────────────────────────────────────────
        fin_qs = FinanceiroConta.objects.filter(
            data_vencimento__range=[inicio_30_str, hoje_str]
        )
        receber = fin_qs.filter(tipo_conta='Receber').aggregate(
            total=Sum('valor_parcela'),
            pendente=Sum('valor_parcela', filter=Q(status_conta='Pend')),
        )
        pagar = fin_qs.filter(tipo_conta='Pagar').aggregate(
            total=Sum('valor_parcela'),
            pendente=Sum('valor_parcela', filter=Q(status_conta='Pend')),
        )

        # ── Inadimplência (faturas vencidas não pagas) ────────────────────────
        vencidas = FinanceiroConta.objects.filter(
            tipo_conta='Receber',
            status_conta='Pend',
            data_vencimento__lt=hoje_str,
        ).aggregate(total=Sum('valor_parcela'))
        total_receber_val = float(receber.get('total') or 0)
        inadimplencia_perc = round(
            float(vencidas.get('total') or 0) / max(total_receber_val, 1) * 100, 1
        )

        return {
            'periodo': f'Últimos 30 dias ({inicio_30_str} a {hoje_str})',
            'faturamento_total': float(totais_venda.get('faturamento') or 0),
            'quantidade_vendas': totais_venda.get('qtd') or 0,
            'ticket_medio': float(totais_venda.get('ticket') or 0),
            'top_produtos_vendidos': top_produtos,
            'estoque_critico': estoque_critico,
            'contas_receber_total': float(receber.get('total') or 0),
            'contas_receber_pendente': float(receber.get('pendente') or 0),
            'contas_pagar_total': float(pagar.get('total') or 0),
            'contas_pagar_pendente': float(pagar.get('pendente') or 0),
            'inadimplencia_perc': inadimplencia_perc,
            'clientes_ativos_periodo': vendas_qs.values('id_cliente').distinct().count(),
            'total_clientes_cadastrados': Cliente.objects.count(),
        }

    def _chamar_gemini_consultor(self, contexto: Dict[str, Any]) -> str:
        """Envia o contexto ao Gemini com o System Prompt de Consultor de Negócios."""
        contexto_json = json.dumps(contexto, ensure_ascii=False, indent=2)
        prompt_completo = (
            f"{self.SYSTEM_PROMPT_CONSULTOR}\n\n"
            f"Aqui estão os dados atuais do negócio (JSON):\n```json\n{contexto_json}\n```\n\n"
            f"Com base nesses dados, gere uma análise estratégica com os principais insights "
            f"e ações recomendadas para o dono da empresa. "
            f"Organize em até 4 seções temáticas (ex: 📦 Estoque, 💰 Financeiro, 🏆 Vendas, ⚠️ Alertas)."
        )
        # Usa retry automático com até 3 tentativas
        resposta = self._chamar_gemini_com_retry(prompt_completo, max_tentativas=3, delay_inicial=2.0)
        return resposta.strip()

    def _extrair_insights_estruturados(self, contexto: Dict[str, Any]) -> list:
        """
        Extrai até 4 cards de insight rápido baseados em regras de negócio (sem IA extra),
        para exibição imediata no Drawer enquanto a análise completa carrega.
        """
        insights = []

        # Card: inadimplência
        inad = contexto.get('inadimplencia_perc', 0)
        if inad > 10:
            insights.append({
                'tipo': 'error', 'icone': '🔴',
                'titulo': f'Inadimplência: {inad}%',
                'texto': 'Acima de 10%! Acione a régua de cobrança urgente.',
                'acao': 'Ir para Financeiro', 'rota': '/financeiro',
            })
        elif inad > 5:
            insights.append({
                'tipo': 'warning', 'icone': '🟡',
                'titulo': f'Inadimplência: {inad}%',
                'texto': 'Monitore os maiores devedores e envie lembrete.',
                'acao': 'Ir para Financeiro', 'rota': '/financeiro',
            })

        # Card: estoque crítico
        criticos = contexto.get('estoque_critico', [])
        if criticos:
            s = 'produto' if len(criticos) == 1 else 'produtos'
            nomes = ', '.join(criticos[:3]) + (f' +{len(criticos)-3}' if len(criticos) > 3 else '')
            insights.append({
                'tipo': 'warning', 'icone': '📦',
                'titulo': f'{len(criticos)} {s} no limite mínimo',
                'texto': nomes,
                'acao': 'Gerar Cotação', 'rota': '/compras',
            })

        # Card: faturamento
        fat = contexto.get('faturamento_total', 0)
        ticket = contexto.get('ticket_medio', 0)
        qtd = contexto.get('quantidade_vendas', 0)
        if fat > 0:
            insights.append({
                'tipo': 'success', 'icone': '🏆',
                'titulo': f'Fat.: R$ {fat:,.2f}',
                'texto': f'{qtd} vendas · Ticket médio R$ {ticket:,.2f}',
                'acao': 'Ver Vendas', 'rota': '/vendas',
            })

        # Card: campeão de vendas
        top = contexto.get('top_produtos_vendidos', [])
        if top:
            m = top[0]
            insights.append({
                'tipo': 'info', 'icone': '⭐',
                'titulo': 'Campeão de vendas',
                'texto': f'{m["nome"]} — R$ {m["receita"]:,.2f} ({m["qtd"]:.0f} un.)',
                'acao': 'Ver Produtos', 'rota': '/produtos',
            })

        return insights[:4]

    def classificar_produto_mercado(self, nome_produto: str) -> Dict[str, Any]:
        """
        Classifica um produto utilizando a IA do Gemini para sugerir Grupo, Categoria e Subcategoria.
        Utiliza os grupos existentes no banco como contexto para consistência.
        """
        if not self.is_available():
            return {
                'sucesso': False, 
                'mensagem': 'IA Indisponível',
                'sugestoes': {
                    'grupo': 'Geral', 
                    'categoria': 'Geral',
                    'ncm': '00000000'
                }
            }

        try:
            # Busca grupos existentes para dar contexto
            # Importação local para evitar dependência circular
            from api.models import GrupoProduto
            from api.models_mercadologico import CategoriaMercadologica
            
            # Pega os 50 grupos mais utilizados ou recentes
            grupos_existentes = list(GrupoProduto.objects.all().order_by('nome_grupo').values_list('nome_grupo', flat=True).distinct()[:50])
            contexto_grupos = ", ".join(grupos_existentes) if grupos_existentes else "Nenhum grupo cadastrado ainda."

            # Pega categorias mercadológicas (nível 3 = subcategorias) para a IA escolher
            # Usa select_related para evitar N+1 queries no get_caminho_completo
            categorias_db = CategoriaMercadologica.objects.filter(
                ativo=True, nivel=3
            ).select_related('pai', 'pai__pai').order_by('nome')
            lista_categorias = []
            for c in categorias_db:
                linha = f"ID={c.id_categoria}|{c.get_caminho_completo()}"
                if c.keywords:
                    linha += f" [keywords: {c.keywords}]"
                lista_categorias.append(linha)
            contexto_categorias = "\n".join(lista_categorias) if lista_categorias else "Nenhuma categoria cadastrada."

            prompt = f"""
            Analise o produto abaixo e sugira a melhor classificação mercadológica para um sistema ERP de varejo.
            
            Produto: "{nome_produto}"
            
            Grupos já existentes no sistema (use um desses se fizer sentido, senão sugira um novo):
            [{contexto_grupos}]

            Categorias mercadológicas cadastradas (OBRIGATÓRIO escolher uma pelo ID):
            {contexto_categorias}

            Retorne APENAS um JSON válido:
            {{
                "grupo_sugerido": "Nome do Grupo",
                "novo_grupo": true/false,
                "categoria_id": 42,
                "categoria_sugerida": "Nome exato da categoria escolhida",
                "classificacao_tipo_item": "00",
                "descricao_comercial": "Descrição técnica/comercial curta",
                "ncm_provavel": "00000000"
            }}
            
            REGRAS IMPORTANTES:
            - Analise o nome do produto com cuidado. Use as keywords das categorias para identificar a melhor correspondência.
            - Exemplos: Gelol/Cataflan/Salonpas = Farmácia e Saúde. Fita empacotadora/Durex = Papelaria. Vassoura/Balde = Utilidades e Bazar.
            - categoria_id: DEVE ser o ID de uma das categorias listadas. Escolha a MAIS ESPECÍFICA.
            - grupo_sugerido: Nome do departamento (nível 1) da categoria escolhida. Se nenhum grupo existente faz sentido, sugira um novo com novo_grupo=true.
            - classificacao_tipo_item: Para varejo, use "00" (Mercadoria para Revenda).
            """

            # Temperatura baixa para respostas mais determinísticas
            resposta_texto = self._chamar_gemini_com_retry(prompt, config={'temperature': 0.1})
            
            # Limpeza do JSON (remove markdowns se houver)
            resposta_limpa = resposta_texto.strip()
            if resposta_limpa.startswith('```json'): resposta_limpa = resposta_limpa[7:]
            if resposta_limpa.startswith('```'): resposta_limpa = resposta_limpa[3:]
            if resposta_limpa.endswith('```'): resposta_limpa = resposta_limpa[:-3]
            
            dados = json.loads(resposta_limpa.strip())
            
            return {
                'sucesso': True,
                'sugestoes': dados
            }

        except Exception as e:
            logger.error(f"Erro na classificação de produto via IA: {e}")
            return {
                'sucesso': False,
                'mensagem': str(e),
                'sugestoes': {
                    'grupo': 'Outros', 
                    'categoria': 'Outros',
                    'ncm': ''
                }
            }


# Instância global do serviço
ai_service = AIService()
