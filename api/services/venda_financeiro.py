from decimal import Decimal, InvalidOperation
from datetime import datetime, timedelta
import logging

from django.utils import timezone

from ..models import FinanceiroConta, FormaPagamento
from .. import finance_policies


def _parse_date_flexible(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if hasattr(value, 'date') and not isinstance(value, str):
        try:
            return value
        except Exception:
            return None
    s = str(value).strip()
    if not s:
        return None
    try:
        return datetime.fromisoformat(s[:10]).date()
    except Exception:
        pass
    try:
        return datetime.strptime(s[:10], "%d/%m/%Y").date()
    except Exception:
        pass
    return None


def _parse_bool_flag(value):
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return bool(value)
    s = str(value).strip().lower()
    if s in ('1', 'true', 't', 'yes', 'y'):
        return True
    if s in ('0', 'false', 'f', 'no', 'n', ''):
        return False
    try:
        return bool(int(s))
    except Exception:
        return False


def ensure_financeiro_for_venda(venda, payload=None, force=False):
    """Garante que existe um FinanceiroConta para `venda` ou `compra`.

    - payload: dicionário opcional com chaves usadas para override (forma, vencimento, parcelas)
    - force: se True, recria (deleta) financeiros existentes

    Retorna tuple (created_bool, financeiro_pk or None, error_str or None)
    """
    print("[FINANCEIRO_FIX_v2] Função ensure_financeiro_for_venda executando com correção para compras!")
    payload = payload or {}
    
    # Detectar se é venda ou compra
    is_compra = hasattr(venda, 'id_compra')
    print(f"[FINANCEIRO_FIX_v2] is_compra={is_compra}")
    
    try:
        if is_compra:
            venda_key = getattr(venda, 'id_compra', getattr(venda, 'pk', None))
        else:
            venda_key = getattr(venda, 'id_venda', getattr(venda, 'pk', None))
    except Exception:
        venda_key = getattr(venda, 'pk', None)

    # busca existentes
    if is_compra:
        existing_qs = FinanceiroConta.objects.filter(id_compra_origem=venda_key)
    else:
        existing_qs = FinanceiroConta.objects.filter(id_venda_origem=venda_key)
    if existing_qs.exists():
        if not force:
            return (False, getattr(existing_qs.first(), 'pk', getattr(existing_qs.first(), 'id_conta', None)), None)
        # deletar existentes
        existing_qs.delete()

    # decidir se deve criar financeiro
    explicit_flag_present = False
    criar_financeiro = None
    for key in ('criar_financeiro', 'gera_financeiro', 'gerar_financeiro'):
        if key in payload:
            explicit_flag_present = True
            criar_financeiro = _parse_bool_flag(payload.get(key))
            break
    if not explicit_flag_present:
        criar_financeiro = _parse_bool_flag(getattr(getattr(venda, 'id_operacao', None), 'gera_financeiro', False))

    if not criar_financeiro and not force:
        return (False, None, None)

    # montar dados do financeiro
    forma_id = payload.get('id_forma_pagamento') or payload.get('forma_pagamento')
    vencimento_str = payload.get('vencimento_parcela') or payload.get('vencimento')
    parcela_valor = payload.get('parcela_valor_num') or payload.get('valor_parcela') or None
    try:
        parcela_valor = Decimal(str(parcela_valor)) if parcela_valor is not None else getattr(venda, 'valor_total', Decimal('0.00'))
    except Exception:
        parcela_valor = getattr(venda, 'valor_total', Decimal('0.00'))

    data_venc = _parse_date_flexible(vencimento_str)
    forma_obj = None
    if not data_venc and forma_id:
        try:
            forma_obj = FormaPagamento.objects.filter(pk=forma_id).first()
        except Exception:
            forma_obj = None

    # fallback por policy
    if (not forma_obj) or (data_venc is None):
        policy = finance_policies.get_policy_for_operacao(getattr(getattr(venda, 'id_operacao', None), 'pk', getattr(venda, 'id_operacao', None)))
        if policy:
            if not forma_obj and policy.get('forma_id'):
                try:
                    forma_obj = FormaPagamento.objects.filter(pk=policy.get('forma_id')).first()
                except Exception:
                    forma_obj = None
            if data_venc is None and policy.get('dias_vencimento') is not None:
                try:
                    dias = int(policy.get('dias_vencimento') or 0)
                    data_venc = (timezone.now().date() + timedelta(days=dias))
                except Exception:
                    data_venc = None

    if forma_obj and getattr(forma_obj, 'dias_vencimento', None) is not None and data_venc is None:
        try:
            dias = int(forma_obj.dias_vencimento or 0)
            data_venc = (timezone.now().date() + timedelta(days=dias))
        except Exception:
            data_venc = None
    if not data_venc:
        data_venc = timezone.now().date()

    try:
        # Determinar se é "Receber" (venda) ou "Pagar" (compra)
        # Usar a detecção is_compra que já foi feita no início da função
        if is_compra:
            tipo_conta = 'Pagar'
            id_fornecedor = getattr(venda, 'id_fornecedor', None)
        else:
            tipo_conta = 'Receber'
            id_fornecedor = getattr(venda, 'id_cliente', None)
        
        operacao = getattr(venda, 'id_operacao', None)
        
        # Verificar baixa automática
        data_emissao = timezone.now().date()
        baixa_automatica = getattr(operacao, 'baixa_automatica', False) if operacao else False
        
        # Lógica de baixa automática:
        # - Se baixa_automatica = True E data_emissao = data_vencimento → Status "Paga"
        # - Se baixa_automatica = True E data_vencimento > data_emissao → Status "Pendente" 
        # - Se baixa_automatica = False → Status "Pendente"
        if baixa_automatica and data_emissao == data_venc:
            status_conta = 'Paga'
            valor_liquidado = parcela_valor
            data_pagamento = data_emissao
        else:
            status_conta = 'Pendente'
            valor_liquidado = Decimal('0.00')
            data_pagamento = None
        
        # Criar FinanceiroConta com campos corretos para venda ou compra
        # Buscar departamento, centro de custo e conta da operação se não estiverem na venda/compra
        operacao_obj = getattr(venda, 'id_operacao', None)
        id_departamento = getattr(venda, 'id_departamento', None) or getattr(operacao_obj, 'id_departamento', None)
        id_centro_custo = getattr(venda, 'id_centro_custo', None) or getattr(operacao_obj, 'id_centro_custo', None)
        id_conta_cobranca = getattr(venda, 'id_conta', None) or getattr(operacao_obj, 'id_conta', None)
        
        # Extrair o ID do fornecedor/cliente (se for objeto FK, pegar apenas o ID)
        if id_fornecedor:
            if hasattr(id_fornecedor, 'pk'):
                id_fornecedor_valor = id_fornecedor.pk
            elif hasattr(id_fornecedor, 'id_fornecedor'):
                id_fornecedor_valor = id_fornecedor.id_fornecedor
            elif hasattr(id_fornecedor, 'id_cliente'):
                id_fornecedor_valor = id_fornecedor.id_cliente
            else:
                id_fornecedor_valor = id_fornecedor
        else:
            id_fornecedor_valor = None
        
        fc_data = {
            'tipo_conta': tipo_conta,
            'descricao': f'{tipo_conta} {getattr(venda, "numero_documento", None) or getattr(venda, "pk", None)}',
            'valor_parcela': parcela_valor,
            'valor_liquidado': valor_liquidado,
            'data_emissao': data_emissao,
            'data_vencimento': data_venc,
            'data_pagamento': data_pagamento,
            'status_conta': status_conta,
            'forma_pagamento': getattr(forma_obj, 'nome_forma', None) if forma_obj else (payload.get('forma_pagamento') or None),
            'id_operacao': operacao_obj,
            'id_departamento': id_departamento,
            'id_centro_custo': id_centro_custo,
            'id_conta_cobranca': id_conta_cobranca,
            'documento_numero': getattr(venda, 'numero_documento', None),
            'parcela_numero': 1,
            'parcela_total': 1,
        }
        
        # Usar _id para contornar problema de ForeignKey(Cliente) não aceitar Fornecedor
        if id_fornecedor_valor:
            fc_data['id_cliente_fornecedor_id'] = id_fornecedor_valor
        
        # Definir origem correta (venda ou compra)
        if is_compra:
            fc_data['id_compra_origem'] = venda_key
        else:
            fc_data['id_venda_origem'] = venda_key
        
        fc = FinanceiroConta.objects.create(**fc_data)
        
        # Atualizar flag gerou_financeiro na venda/compra (se existir)
        if hasattr(venda, 'gerou_financeiro'):
            try:
                venda.gerou_financeiro = 1
                venda.save(update_fields=['gerou_financeiro'])
            except Exception as save_ex:
                logging.warning('Não foi possível atualizar gerou_financeiro %s: %s', venda_key, str(save_ex))
        
        financeiro_pk = getattr(fc, 'id_conta', getattr(fc, 'pk', None))
        logging.info('ensure_financeiro_for_venda: criado financeiro id=%s para venda %s', financeiro_pk, venda_key)
        return (True, financeiro_pk, None)
    except Exception as ex:
        logging.exception('Erro ao criar financeiro para venda %s: %s', venda_key, str(ex))
        return (False, None, str(ex))


def create_venda_with_optional_financeiro(create_func, payload, gerar_financeiro=None):
    """Helper para uso em views: create_func é uma callable que cria a Venda (retorna instância).

    Após criar a venda, tenta criar financeiro conforme payload/parametros.
    Retorna (venda, financeiro_tuple)
    """
    venda = create_func()
    # tenta criar financeiro
    created, pk, err = ensure_financeiro_for_venda(venda, payload=payload, force=False)
    return venda, (created, pk, err)
