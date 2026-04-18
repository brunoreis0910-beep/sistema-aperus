"""
Serviço de Baixa Automática de Boletos
Detecta pagamentos via API bancária e executa baixas automáticas
"""
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.models import User
from .models import Boleto, FinanceiroConta, Auditoria
from .services_bancarios import IntegracaoBancoDoBrasil, IntegracaoItau, IntegracaoSicoob
import logging

logger = logging.getLogger(__name__)


class BaixaAutomaticaBoletos:
    """
    Serviço responsável por consultar status de boletos registrados
    e executar baixas automáticas quando pagamentos são detectados
    """
    
    def __init__(self):
        self.usuario_sistema = self._get_usuario_sistema()
    
    def _get_usuario_sistema(self):
        """Retorna ou cria usuário do sistema para auditorias automáticas"""
        usuario, created = User.objects.get_or_create(
            username='sistema_baixa_automatica',
            defaults={
                'first_name': 'Sistema',
                'last_name': 'Baixa Automática',
                'is_active': True,
                'is_staff': False,
            }
        )
        return usuario
    
    def _get_integracao_bancaria(self, config):
        """Retorna instância da integração bancária apropriada"""
        mapeamento = {
            'BB': IntegracaoBancoDoBrasil,
            'ITAU': IntegracaoItau,
            'SICOOB': IntegracaoSicoob,
        }
        
        classe_integracao = mapeamento.get(config.banco)
        if not classe_integracao:
            raise ValueError(f'Banco {config.banco} não possui integração implementada')
        
        return classe_integracao(config)
    
    def verificar_boletos_pendentes(self):
        """
        Verifica todos os boletos registrados que têm baixa automática ativa
        Retorna quantidade de boletos processados e baixados
        """
        boletos_processados = 0
        boletos_baixados = 0
        erros = []
        
        # Busca boletos registrados com baixa automática ativa
        boletos = Boleto.objects.filter(
            status='REGISTRADO',
            id_config_bancaria__baixa_automatica_api=True,
            id_config_bancaria__ativo=True
        ).select_related('id_config_bancaria', 'id_conta', 'id_conta__id_cliente')
        
        logger.info(f'Iniciando verificação de {boletos.count()} boletos pendentes')
        
        for boleto in boletos:
            try:
                boletos_processados += 1
                
                # Consulta status via API
                sucesso, dados = self.consultar_status_boleto(boleto)
                
                if sucesso and dados.get('status') == 'PAGO':
                    # Executa baixa automática
                    self.executar_baixa_automatica(boleto, dados)
                    boletos_baixados += 1
                    logger.info(f'Boleto {boleto.nosso_numero} baixado automaticamente')
                    
            except Exception as e:
                erro_msg = f'Erro ao processar boleto {boleto.id_boleto}: {str(e)}'
                logger.error(erro_msg)
                erros.append(erro_msg)
        
        resultado = {
            'processados': boletos_processados,
            'baixados': boletos_baixados,
            'erros': erros,
            'timestamp': timezone.now()
        }
        
        logger.info(f'Verificação finalizada: {boletos_baixados}/{boletos_processados} boletos baixados')
        
        return resultado
    
    def consultar_status_boleto(self, boleto):
        """
        Consulta status atual do boleto via API bancária
        Retorna (sucesso, dados)
        """
        try:
            integracao = self._get_integracao_bancaria(boleto.id_config_bancaria)
            sucesso, dados = integracao.consultar_boleto(boleto.nosso_numero)
            
            if sucesso:
                # Atualiza mensagem do banco no boleto
                boleto.mensagem_banco = dados.get('mensagem', '')
                boleto.save(update_fields=['mensagem_banco'])
            
            return sucesso, dados
            
        except Exception as e:
            logger.error(f'Erro ao consultar boleto {boleto.nosso_numero}: {str(e)}')
            return False, {'erro': str(e)}
    
    @transaction.atomic
    def executar_baixa_automatica(self, boleto, dados_pagamento):
        """
        Executa baixa automática do boleto e da conta financeira
        Registra auditoria completa da operação
        
        Args:
            boleto: Instância do Boleto a ser baixado
            dados_pagamento: Dicionário com dados do pagamento retornados pela API
        """
        try:
            # 1. Atualiza boleto
            boleto.status = 'PAGO'
            boleto.valor_pago = dados_pagamento.get('valor_pago', boleto.valor_nominal)
            boleto.data_pagamento = dados_pagamento.get('data_pagamento', timezone.now().date())
            boleto.baixado_via_api = True
            boleto.data_baixa_api = timezone.now()
            boleto.usuario_baixa = self.usuario_sistema
            boleto.mensagem_banco = dados_pagamento.get('mensagem', 'Baixa automática via API')
            boleto.dados_retorno_json = dados_pagamento
            boleto.save()
            
            # 2. Atualiza conta financeira
            conta = boleto.id_conta
            conta.status = 'PAGO'
            conta.data_pagamento = boleto.data_pagamento
            conta.valor_pago = boleto.valor_pago
            conta.save()
            
            # 3. Registra auditoria
            self._registrar_auditoria(boleto, dados_pagamento)
            
            logger.info(
                f'Baixa automática executada com sucesso - '
                f'Boleto: {boleto.nosso_numero}, '
                f'Valor: R$ {boleto.valor_pago}, '
                f'Data: {boleto.data_pagamento}'
            )
            
            return True
            
        except Exception as e:
            logger.error(f'Erro ao executar baixa automática: {str(e)}')
            raise
    
    def _registrar_auditoria(self, boleto, dados_pagamento):
        """Registra operação na auditoria"""
        try:
            Auditoria.objects.create(
                id_usuario=self.usuario_sistema,
                tabela='Boleto',
                id_registro=boleto.id_boleto,
                operacao='UPDATE',
                descricao=f'Baixa automática via API - Boleto: {boleto.nosso_numero}',
                dados_novos={
                    'status': 'PAGO',
                    'valor_pago': str(boleto.valor_pago),
                    'data_pagamento': str(boleto.data_pagamento),
                    'baixado_via_api': True,
                    'data_baixa_api': str(boleto.data_baixa_api),
                    'dados_api': dados_pagamento
                }
            )
        except Exception as e:
            logger.warning(f'Erro ao registrar auditoria: {str(e)}')
    
    def processar_webhook_pagamento(self, dados_webhook):
        """
        Processa webhook de pagamento recebido do banco
        Formato esperado depende do banco específico
        
        Args:
            dados_webhook: Dicionário com dados do webhook
            
        Returns:
            dict: Resultado do processamento
        """
        try:
            # Extrai nosso número do webhook (formato varia por banco)
            nosso_numero = dados_webhook.get('nosso_numero') or dados_webhook.get('numeroDocumento')
            
            if not nosso_numero:
                return {
                    'sucesso': False,
                    'erro': 'Nosso número não encontrado no webhook'
                }
            
            # Busca boleto
            try:
                boleto = Boleto.objects.select_related('id_config_bancaria', 'id_conta').get(
                    nosso_numero=nosso_numero,
                    id_config_bancaria__baixa_automatica_api=True
                )
            except Boleto.DoesNotExist:
                return {
                    'sucesso': False,
                    'erro': f'Boleto {nosso_numero} não encontrado ou baixa automática não ativa'
                }
            
            # Verifica se já foi baixado
            if boleto.status == 'PAGO':
                return {
                    'sucesso': True,
                    'mensagem': 'Boleto já estava baixado',
                    'id_boleto': boleto.id_boleto
                }
            
            # Executa baixa
            self.executar_baixa_automatica(boleto, dados_webhook)
            
            return {
                'sucesso': True,
                'mensagem': 'Baixa automática executada com sucesso',
                'id_boleto': boleto.id_boleto,
                'nosso_numero': nosso_numero,
                'valor': str(boleto.valor_pago)
            }
            
        except Exception as e:
            logger.error(f'Erro ao processar webhook: {str(e)}')
            return {
                'sucesso': False,
                'erro': str(e)
            }
    
    def gerar_relatorio_baixas_automaticas(self, data_inicio=None, data_fim=None, banco=None, conta_bancaria=None):
        """
        Gera relatório de boletos baixados automaticamente via API
        
        Args:
            data_inicio: Data inicial do filtro
            data_fim: Data final do filtro
            banco: Código do banco (BB, ITAU, SICOOB)
            conta_bancaria: ID da conta bancária
            
        Returns:
            QuerySet de boletos baixados via API
        """
        filtros = {'baixado_via_api': True}
        
        if data_inicio:
            filtros['data_baixa_api__gte'] = data_inicio
        
        if data_fim:
            filtros['data_baixa_api__lte'] = data_fim
        
        if banco:
            filtros['id_config_bancaria__banco'] = banco
        
        if conta_bancaria:
            filtros['id_config_bancaria__id_conta_bancaria'] = conta_bancaria
        
        boletos = Boleto.objects.filter(**filtros).select_related(
            'id_conta',
            'id_conta__id_cliente',
            'id_config_bancaria',
            'id_config_bancaria__id_conta_bancaria',
            'usuario_baixa'
        ).order_by('-data_baixa_api')
        
        return boletos


# Instância singleton para uso em todo o sistema
servico_baixa_automatica = BaixaAutomaticaBoletos()
