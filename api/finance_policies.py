"""Políticas de defaults para criação de Financeiro a partir de Operacao.
Mantenha um dicionário simples mapeando id_operacao -> defaults.
Este arquivo é deliberadamente simples e pode ser extendido para
carregar regras de DB ou config externa.
"""

# Exemplo de mapeamento (assumimos ids de operacao já conhecidos no sistema).
# Ajuste conforme sua realidade.
# Campos suportados:
# - forma_id: id da FormaPagamento padrão (se existir)
# - id_conta_padrao: id da conta bancária padrão
# - id_departamento: id do departamento padrão
# - dias_vencimento: número de dias para vencimento (int ou string numérica)

POLICIES = {
    # Pedido de venda (exemplo id=4): crédito a 30 dias usando forma 3
    4: {"forma_id": 3, "dias_vencimento": 30},
    # Operação de venda vista (exemplo id=7): vista, forma 1, 0 dias
    7: {"forma_id": 1, "dias_vencimento": 0},
    # Outro tipo de operação (exemplo id=8): 30 dias, forma 2
    8: {"forma_id": 2, "dias_vencimento": 30},
}


def get_policy_for_operacao(operacao_id):
    """Retorna dicionário com defaults ou None."""
    return POLICIES.get(int(operacao_id)) if operacao_id is not None else None
