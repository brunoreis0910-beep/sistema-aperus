def get_operador_pdv(user):
    """
    Retorna o usuário que deve ser considerado como operador do caixa PDV/NFC-e.
    Se o usuário tiver um vendedor configurado em UserParametros (id_vendedor_nfce) 
    e esse vendedor estiver vinculado a um usuário, retorna esse usuário vinculado.
    Caso contrário, retorna o usuário original.
    Isso permite que um login (ex: Admin) opere o caixa de outro usuário (ex: Vendedor).
    """
    from api.models import UserParametros

    if not user or not user.is_authenticated:
        return user
        
    try:
        parametros = UserParametros.objects.filter(id_user=user).first()
        if parametros:
            # Tenta encontrar vendedor na ordem de prioridade: NFCe > Venda > Padrão
            vendedor_target = parametros.id_vendedor_nfce or parametros.id_vendedor_venda or parametros.id_vendedor_padrao
            
            # Se encontrou um vendedor e ele tem um usuario vinculado, usa esse usuario como operador
            if vendedor_target and hasattr(vendedor_target, 'id_user') and vendedor_target.id_user:
                return vendedor_target.id_user

    except Exception as e:
        # Se não tiver parâmetros ou erro, usa o próprio usuário
        pass
        
    return user

def get_operador_venda(user):
    """
    Retorna o usuário que deve ser considerado como operador do caixa de Venda Rápida.
    Prioriza: Venda > Padrão (não usa NFC-e)
    """
    from api.models import UserParametros

    if not user or not user.is_authenticated:
        return user
        
    try:
        parametros = UserParametros.objects.filter(id_user=user).first()
        if parametros:
            # Prioridade: Venda > Padrão (SEM NFCe)
            vendedor_target = parametros.id_vendedor_venda or parametros.id_vendedor_padrao
            
            if vendedor_target and hasattr(vendedor_target, 'id_user') and vendedor_target.id_user:
                return vendedor_target.id_user

    except Exception as e:
        pass
        
    return user
