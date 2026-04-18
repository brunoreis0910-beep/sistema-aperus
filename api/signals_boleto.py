"""
Signals para geração automática de boletos
Vincula criação de vendas/NF-e/CT-e com geração de boletos via API
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import FinanceiroConta, ConfiguracaoBancaria, Boleto
from .services_bancarios import criar_integracao_bancaria
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=FinanceiroConta)
def gerar_boleto_automatico(sender, instance, created, **kwargs):
    """
    Signal que gera boleto automaticamente quando:
    1. Criada uma conta a receber (created=True)
    2. Forma de pagamento é "Boleto"
    3. Existe configuração bancária ativa com gerar_boleto_automatico=True
    """
    # Só processa em criação de novos registros
    if not created:
        return
    
    # Verifica se tem forma de pagamento
    if not hasattr(instance, 'id_forma_pagamento') or not instance.id_forma_pagamento:
        return
    
    # Verifica se forma de pagamento é Boleto
    forma_pagamento = instance.id_forma_pagamento.descricao.upper()
    if 'BOLETO' not in forma_pagamento:
        return
    
    # Verifica se já tem boleto gerado (evita duplicação)
    if Boleto.objects.filter(id_conta=instance).exists():
        logger.info(f'Conta {instance.id_conta} já possui boleto registrado')
        return
    
    # Busca configuração bancária ativa para geração automática
    # Prioriza configurações vinculadas à conta bancária da venda
    config = None
    
    # Tenta buscar pela conta bancária (se houver)
    if hasattr(instance, 'conta_bancaria') and instance.conta_bancaria:
        config = ConfiguracaoBancaria.objects.filter(
            id_conta_bancaria=instance.conta_bancaria,
            gerar_boleto_automatico=True,
            ativo=True
        ).first()
    
    # Se não encontrou, usa primeira configuração ativa disponível
    if not config:
        config = ConfiguracaoBancaria.objects.filter(
            gerar_boleto_automatico=True,
            ativo=True
        ).first()
    
    # Se não tem configuração, não gera boleto
    if not config:
        logger.info(f'Nenhuma configuração bancária ativa para gerar boleto da conta {instance.id_conta}')
        return
    
    # Valida se cliente tem dados necessários
    if not instance.id_cliente:
        logger.warning(f'Conta {instance.id_conta} não possui cliente vinculado')
        return
    
    if not instance.id_cliente.codigo_ibge:
        logger.warning(
            f'Cliente {instance.id_cliente.nome_razao_social} não possui código IBGE. '
            f'Boleto NÃO será gerado automaticamente.'
        )
        return
    
    # Gera boleto via API
    try:
        with transaction.atomic():
            logger.info(
                f'Iniciando geração automática de boleto - '
                f'Conta: {instance.id_conta}, '
                f'Cliente: {instance.id_cliente.nome_razao_social}, '
                f'Valor: R$ {instance.valor_total}'
            )
            
            # Cria integração bancária
            integracao = criar_integracao_bancaria(config)
            
            # Registra boleto
            boleto = integracao.registrar_boleto(instance)
            
            logger.info(
                f'Boleto gerado com sucesso - '
                f'Nosso Número: {boleto.nosso_numero}, '
                f'Linha Digitável: {boleto.linha_digitavel}'
            )
            
    except Exception as e:
        logger.error(
            f'Erro ao gerar boleto automaticamente para conta {instance.id_conta}: {str(e)}',
            exc_info=True
        )
        # Não propaga erro para não bloquear criação da venda/NF-e
        # Usuário pode gerar boleto manualmente depois


# Exemplo de uso alternativo: signal em Venda
# Descomente se preferir capturar direto na Venda ao invés de FinanceiroConta
"""
from .models import Venda

@receiver(post_save, sender=Venda)
def gerar_boleto_venda(sender, instance, created, **kwargs):
    '''Gera boleto quando venda é criada com forma de pagamento Boleto'''
    if not created:
        return
    
    # Verifica forma de pagamento
    if not instance.id_forma_pagamento or 'BOLETO' not in instance.id_forma_pagamento.descricao.upper():
        return
    
    # Busca conta a receber gerada pela venda
    # (assumindo que existe FK ou relação que identifica a conta da venda)
    try:
        conta = FinanceiroConta.objects.filter(
            id_venda=instance  # Ajustar conforme modelo real
        ).first()
        
        if conta:
            gerar_boleto_automatico(FinanceiroConta, conta, created=True)
    except Exception as e:
        logger.error(f'Erro ao gerar boleto da venda {instance.id_venda}: {str(e)}')
"""
