"""
Signals para geração automática de boletos
Vincula criação de vendas/NF-e/CT-e com geração de boletos via API
"""
import threading
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction, close_old_connections
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

    IMPORTANTE: as chamadas HTTP externas são executadas em background (threading.Thread)
    para não bloquear o ciclo request/response do Django e evitar timeout no Cloudflare.
    """
    # Só processa em criação de novos registros
    if not created:
        return

    # Verifica se tem forma de pagamento vinculada (campo dinâmico setado pelo PDV)
    if not hasattr(instance, 'id_forma_pagamento') or not instance.id_forma_pagamento:
        return

    # Verifica se forma de pagamento é Boleto
    try:
        forma_pagamento = instance.id_forma_pagamento.descricao.upper()
    except Exception:
        return
    if 'BOLETO' not in forma_pagamento:
        return

    # Verifica se já tem boleto gerado (evita duplicação)
    if Boleto.objects.filter(id_conta=instance).exists():
        logger.info(f'Conta {instance.id_conta} ja possui boleto registrado')
        return

    # Busca configuração bancária ativa para geração automática
    config = None

    if hasattr(instance, 'conta_bancaria') and instance.conta_bancaria:
        config = ConfiguracaoBancaria.objects.filter(
            id_conta_bancaria=instance.conta_bancaria,
            gerar_boleto_automatico=True,
            ativo=True
        ).first()

    if not config:
        config = ConfiguracaoBancaria.objects.filter(
            gerar_boleto_automatico=True,
            ativo=True
        ).first()

    if not config:
        logger.info(f'Nenhuma configuracao bancaria ativa para gerar boleto da conta {instance.id_conta}')
        return

    # Valida se cliente tem dados necessários
    if not instance.id_cliente:
        logger.warning(f'Conta {instance.id_conta} nao possui cliente vinculado')
        return

    if not instance.id_cliente.codigo_ibge:
        logger.warning(
            f'Cliente {instance.id_cliente.nome_razao_social} nao possui codigo IBGE. '
            f'Boleto NAO sera gerado automaticamente.'
        )
        return

    # Captura IDs para passar ao thread (evitar usar objeto Django fora do contexto do request)
    conta_id = instance.id_conta
    config_id = config.pk

    def _gerar_boleto_background():
        """Executa a geração do boleto em background sem bloquear o request."""
        try:
            # Fecha conexões antigas (importante para threads em Django)
            close_old_connections()

            from .models import FinanceiroConta as FC, ConfiguracaoBancaria as CB
            conta = FC.objects.get(pk=conta_id)
            cfg = CB.objects.get(pk=config_id)

            logger.info(
                f'[BOLETO BG] Iniciando geracao automatica - '
                f'Conta: {conta_id}, '
                f'Cliente: {conta.id_cliente.nome_razao_social if conta.id_cliente else "N/A"}, '
                f'Valor: R$ {conta.valor_parcela}'
            )

            integracao = criar_integracao_bancaria(cfg)
            boleto = integracao.registrar_boleto(conta)

            logger.info(
                f'[BOLETO BG] Boleto gerado com sucesso - '
                f'Nosso Numero: {boleto.nosso_numero}, '
                f'Linha Digitavel: {boleto.linha_digitavel}'
            )
        except Exception as e:
            logger.error(
                f'[BOLETO BG] Erro ao gerar boleto para conta {conta_id}: {str(e)}',
                exc_info=True
            )
        finally:
            close_old_connections()

    # Executa em thread daemon para não bloquear o response ao Cloudflare
    t = threading.Thread(target=_gerar_boleto_background, daemon=True)
    t.start()


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
