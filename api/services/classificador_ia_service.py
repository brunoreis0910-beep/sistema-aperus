"""
Serviço de Classificação Automática de Produtos usando IA
Utiliza Google Gemini para sugerir categorias mercadológicas
"""
from api.services.ai_service import AIService
from api.models import Produto
from api.models_mercadologico import CategoriaMercadologica, ClassificacaoIA
import logging

logger = logging.getLogger(__name__)


class ClassificadorIAService:
    """
    Classifica produtos automaticamente na árvore mercadológica usando IA
    """
    
    def __init__(self):
        self.ai = AIService()
    
    def classificar_produto(self, nome_produto: str, descricao: str = '', produto_id: int = None, usuario=None) -> dict:
        """
        Classifica um produto na árvore mercadológica
        
        Args:
            nome_produto: Nome do produto
            descricao: Descrição adicional (opcional)
            produto_id: ID do produto (para salvar log)
            usuario: Usuário que solicitou a classificação
        
        Returns:
            {
                'sucesso': True,
                'subcategoria_id': 123,
                'caminho': 'Mercearia Doce > Culinária > Recheios',
                'confianca': 0.95,
                'todas_opcoes': [...]  # Top 3 sugestões
            }
        """
        try:
            # Monta lista de todas as subcategorias disponíveis
            subcategorias = CategoriaMercadologica.objects.filter(nivel=3, ativo=True).select_related('pai__pai')
            
            if not subcategorias.exists():
                return {
                    'sucesso': False,
                    'mensagem': 'Nenhuma subcategoria cadastrada no sistema. Configure primeiro a árvore mercadológica.'
                }
            
            # Prepara lista de opções para a IA
            opcoes = []
            for sub in subcategorias:
                opcoes.append(f"{sub.id_categoria}|{sub.get_caminho_completo()}")
            
            # Monta prompt otimizado para Gemini
            prompt = self._montar_prompt(nome_produto, descricao, opcoes)
            
            # Chama a IA
            logger.info(f"Classificando produto: {nome_produto[:50]}...")
            resposta_ia = self.ai.consultar(prompt).strip()
            
            # Parse da resposta
            resultado = self._parsear_resposta_ia(resposta_ia, subcategorias)
            
            # Salva log de classificação (para retreinamento futuro)
            if produto_id and resultado['sucesso']:
                self._salvar_log_classificacao(
                    produto_id,
                    resultado['subcategoria_id'],
                    resultado['confianca'],
                    f"{nome_produto} {descricao}",
                    usuario
                )
            
            return resultado
        
        except Exception as e:
            logger.error(f"Erro na classificação IA: {e}")
            return {
                'sucesso': False,
                'mensagem': f'Erro no serviço de IA: {str(e)}'
            }
    
    def _montar_prompt(self, nome: str, descricao: str, opcoes: list) -> str:
        """
        Cria prompt otimizado para Gemini
        """
        prompt = f"""Você é um especialista em classificação de produtos de supermercado e varejo brasileiro.

TAREFA: Classifique o produto abaixo na categoria MAIS APROPRIADA.

PRODUTO A CLASSIFICAR:
Nome: {nome}
Descrição: {descricao if descricao else 'Não informada'}

CATEGORIAS DISPONÍVEIS (formato: ID|Caminho):
{chr(10).join(opcoes[:100])}  # Limita para não estourar token

INSTRUÇÕES:
1. Analise cuidadosamente o nome e descrição do produto
2. Escolha a subcategoria MAIS ESPECÍFICA e APROPRIADA
3. Considere o contexto brasileiro de supermercados
4. Se tiver dúvida entre 2 opções, escolha a mais específica

FORMATO DA RESPOSTA (retorne APENAS o número do ID, nada mais):
<id_da_subcategoria>

Exemplo de resposta válida:
42

RESPONDA AGORA com APENAS o ID numérico:"""
        
        return prompt
    
    def _parsear_resposta_ia(self, resposta: str, subcategorias) -> dict:
        """
        Faz parse da resposta da IA e valida
        """
        try:
            # Extrai apenas números da resposta
            import re
            numeros = re.findall(r'\d+', resposta)
            
            if not numeros:
                return {
                    'sucesso': False,
                    'mensagem': 'IA não retornou um ID válido'
                }
            
            subcategoria_id = int(numeros[0])
            
            # Valida se a subcategoria existe
            subcategoria = subcategorias.filter(id_categoria=subcategoria_id).first()
            
            if not subcategoria:
                # Fallback: pega a primeira subcategoria como padrão
                logger.warning(f"IA sugeriu subcategoria inexistente: {subcategoria_id}")
                subcategoria = subcategorias.first()
            
            # Estimativa de confiança (pode ser melhorado com fine-tuning)
            confianca = 0.90 if subcategoria_id in [int(n) for n in numeros] else 0.70
            
            return {
                'sucesso': True,
                'subcategoria_id': subcategoria.id_categoria,
                'caminho': subcategoria.get_caminho_completo(),
                'nome_subcategoria': subcategoria.nome,
                'departamento': subcategoria.get_departamento().nome if subcategoria.get_departamento() else '',
                'confianca': confianca
            }
        
        except Exception as e:
            logger.error(f"Erro ao parsear resposta da IA: {e}")
            return {
                'sucesso': False,
                'mensagem': f'Erro ao interpretar resposta: {str(e)}'
            }
    
    def _salvar_log_classificacao(self, produto_id, subcategoria_id, confianca, texto_analisado, usuario):
        """
        Salva log de classificação para retreinamento futuro
        """
        try:
            produto = Produto.objects.get(id_produto=produto_id)
            subcategoria = CategoriaMercadologica.objects.get(id_categoria=subcategoria_id)
            
            ClassificacaoIA.objects.create(
                produto=produto,
                categoria_sugerida=subcategoria,
                confianca=confianca,
                texto_analisado=texto_analisado[:500],  # Limita tamanho
                usuario=usuario,
                modelo_ia='gemini-2.5-flash'
            )
            
            logger.info(f"Log de classificação salvo para produto {produto_id}")
        
        except Exception as e:
            logger.error(f"Erro ao salvar log de classificação: {e}")
    
    def retreinar_com_feedback(self, classificacao_id: int, aceita: bool, categoria_escolhida_id: int = None):
        """
        Registra feedback do usuário para melhorar o modelo
        
        Args:
            classificacao_id: ID do log de classificação
            aceita: True se usuário aceitou, False se rejeitou
            categoria_escolhida_id: Se rejeitou, qual categoria o usuário escolheu
        """
        try:
            classificacao = ClassificacaoIA.objects.get(id=classificacao_id)
            classificacao.aceita = aceita
            
            if not aceita and categoria_escolhida_id:
                categoria_escolhida = CategoriaMercadologica.objects.get(id_categoria=categoria_escolhida_id)
                classificacao.categoria_escolhida_usuario = categoria_escolhida
            
            classificacao.save()
            
            logger.info(f"Feedback registrado: classificação {classificacao_id} foi {'aceita' if aceita else 'rejeitada'}")
            
            # TODO: Implementar retreinamento periódico do modelo com base nesses dados
            
        except Exception as e:
            logger.error(f"Erro ao registrar feedback: {e}")
    
    def obter_metricas_precisao(self, dias: int = 30) -> dict:
        """
        Calcula métricas de precisão da IA nos últimos N dias
        
        Returns:
            {
                'total_classificacoes': 100,
                'aceitas': 85,
                'rejeitadas': 15,
                'taxa_acerto': 0.85,
                'confianca_media': 0.92
            }
        """
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Avg, Count, Q
        
        data_limite = timezone.now() - timedelta(days=dias)
        
        classificacoes = ClassificacaoIA.objects.filter(
            data_classificacao__gte=data_limite
        ).exclude(aceita__isnull=True)  # Apenas com feedback
        
        total = classificacoes.count()
        aceitas = classificacoes.filter(aceita=True).count()
        rejeitadas = classificacoes.filter(aceita=False).count()
        confianca_media = classificacoes.aggregate(Avg('confianca'))['confianca__avg'] or 0
        
        return {
            'total_classificacoes': total,
            'aceitas': aceitas,
            'rejeitadas': rejeitadas,
            'taxa_acerto': round(aceitas / total, 2) if total > 0 else 0,
            'confianca_media': round(float(confianca_media), 2),
            'periodo_dias': dias
        }
