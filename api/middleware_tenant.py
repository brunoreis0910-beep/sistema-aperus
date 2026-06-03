import re
from django.conf import settings
from api.db_router import set_current_tenant_db

def verificar_licenca_ativa():
    from api.db_router import get_current_tenant_db
    from django.db import connections
    from datetime import datetime, date, timedelta
    import re
    
    # Obtém o alias de conexão para a thread/tenant ativa
    db_alias = get_current_tenant_db()
    db_conn = connections[db_alias]
    
    # 1. Busca CNPJ da empresa local configurada no banco do tenant
    cnpj_limpo = None
    try:
        with db_conn.cursor() as cursor:
            cursor.execute("SHOW TABLES LIKE 'empresa_config'")
            if cursor.fetchone():
                cursor.execute("SELECT cpf_cnpj FROM empresa_config LIMIT 1")
                row = cursor.fetchone()
                if row and row[0]:
                    cnpj_limpo = re.sub(r'\D', '', str(row[0]))
    except Exception:
        pass
        
    if not cnpj_limpo:
        # Se não há CNPJ, não bloqueia (para permitir instalação/setup inicial)
        return False, None
        
    # 2. Tenta buscar o status atualizado na central
    status_central = None
    tem_atraso = False
    dia_vencimento = 10
    
    try:
        with db_conn.cursor() as cursor:
            # Verifica se a base central está acessível e possui a tabela
            cursor.execute("SHOW TABLES FROM aperus_central LIKE 'saas_cliente'")
            if cursor.fetchone():
                cursor.execute("SELECT status_licenca, dia_vencimento FROM aperus_central.saas_cliente WHERE cnpj = %s", [cnpj_limpo])
                row = cursor.fetchone()
                if row:
                    status_central = row[0]
                    dia_vencimento = row[1]
                    
                    # Verifica mensalidades vencidas há mais de 5 dias
                    agora_date = datetime.now().date()
                    cinco_dias_atras = agora_date - timedelta(days=5)
                    cursor.execute("""
                        SELECT EXISTS(
                            SELECT 1 FROM aperus_central.saas_cliente_mensalidade m
                            JOIN aperus_central.saas_cliente c ON m.saas_cliente_id = c.id_saas_cliente
                            WHERE c.cnpj = %s AND m.status_pagamento = 'PENDENTE' AND m.data_vencimento < %s
                        )
                    """, [cnpj_limpo, cinco_dias_atras])
                    tem_atraso = cursor.fetchone()[0]
    except Exception:
        # Silencia erros se a base central estiver inacessível (ambiente offline)
        pass
        
    # 3. Sincroniza os dados com a tabela local 'licenca' para resiliência offline
    agora = datetime.now()
    if status_central is not None:
        try:
            with db_conn.cursor() as cursor:
                cursor.execute("SHOW TABLES LIKE 'licenca'")
                if cursor.fetchone():
                    # Determina novo status local e validade
                    novo_status = 'Ativa'
                    if status_central == 'BLOQUEADO':
                        novo_status = 'Bloqueada'
                    elif tem_atraso:
                        novo_status = 'Vencida'
                        
                    # Calcula o vencimento
                    import calendar
                    ano, mes = agora.year, agora.month
                    ultimo_dia = calendar.monthrange(ano, mes)[1]
                    dia_venc = min(dia_vencimento, ultimo_dia)
                    novo_vencimento = date(ano, mes, dia_venc)
                    
                    if agora.date() > novo_vencimento:
                        mes += 1
                        if mes > 12:
                            mes = 1
                            ano += 1
                        ultimo_dia = calendar.monthrange(ano, mes)[1]
                        dia_venc = min(dia_vencimento, ultimo_dia)
                        novo_vencimento = date(ano, mes, dia_venc)
                        
                    nova_validade = novo_vencimento + timedelta(days=5)
                    
                    # Atualiza ou insere na tabela licenca
                    cursor.execute("""
                        INSERT INTO licenca (id_licenca, chave_licenca, data_validade, ultimo_check, status)
                        VALUES (1, 'APERUS_LOCAL_LICENSE_KEY', %s, %s, %s)
                        ON DUPLICATE KEY UPDATE 
                        status = VALUES(status), data_validade = VALUES(data_validade), ultimo_check = VALUES(ultimo_check)
                    """, [nova_validade, agora, novo_status])
        except Exception:
            pass
            
    # 4. Avaliação final com base na tabela licenca local (agindo como cache local resiliente)
    bloquear = False
    motivo = 'Licença Suspensa ou Vencida.'
    
    try:
        with db_conn.cursor() as cursor:
            cursor.execute("SHOW TABLES LIKE 'licenca'")
            if cursor.fetchone():
                cursor.execute("SELECT status, data_validade FROM licenca WHERE id_licenca = 1")
                row = cursor.fetchone()
                if row:
                    local_status, data_validade = row
                    if local_status == 'Bloqueada':
                        bloquear = True
                        motivo = 'Licença Suspensa administrativamente pelo painel central Aperus.'
                    elif local_status == 'Vencida' or (data_validade and agora.date() > data_validade):
                        bloquear = True
                        motivo = 'Licença Expirada por falta de pagamento da mensalidade.'
                        if local_status != 'Vencida':
                            cursor.execute("UPDATE licenca SET status = 'Vencida' WHERE id_licenca = 1")
    except Exception:
        # Em caso de falha completa de acesso à tabela local, não bloqueamos para não quebrar a aplicação
        pass
        
    return bloquear, motivo

class TenantMiddleware:
    """
    Middleware que identifica o inquilino (tenant) a partir da requisição HTTP.
    Associa dinamicamente a conexão do banco de dados correspondente à thread atual.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Identifica o CNPJ ou Schema no cabeçalho ou parâmetro de query
        cnpj = request.headers.get('X-Tenant-CNPJ') or request.GET.get('tenant_cnpj')
        schema_name = request.headers.get('X-Tenant-Schema') or request.GET.get('tenant_schema') or request.GET.get('schema_name')
        
        db_name = None
        
        if schema_name:
            if schema_name == 'central':
                db_name = 'aperus_central'
            elif schema_name == 'testes':
                db_name = 'aperus_testes'
            else:
                db_name = f"aperus_{schema_name}"
        elif cnpj:
            cnpj_limpo = re.sub(r'\D', '', str(cnpj))
            try:
                from api.models import SaaSCliente
                cliente = SaaSCliente.objects.filter(cnpj=cnpj_limpo).first()
                if cliente:
                    if cliente.schema_name == 'central':
                        db_name = 'aperus_central'
                    elif cliente.schema_name == 'testes':
                        db_name = 'aperus_testes'
                    else:
                        db_name = f"aperus_{cliente.schema_name}"
                else:
                    db_name = f"aperus_{cnpj_limpo}"
            except Exception:
                db_name = f"aperus_{cnpj_limpo}"
                
        if db_name:
            
            # 2. Adiciona a conexão ao pool do Django caso não exista (copiando todas as chaves)
            if db_name not in settings.DATABASES:
                import copy
                default_db = settings.DATABASES['default']
                settings.DATABASES[db_name] = copy.deepcopy(default_db)
                settings.DATABASES[db_name]['NAME'] = db_name
            
            # 3. Vincula o banco de dados do tenant à thread atual
            set_current_tenant_db(db_name)
        else:
            # Caso não tenha CNPJ, usa o banco default (central)
            set_current_tenant_db('default')
            
        # --- VERIFICAÇÃO DE LICENÇA ---
        # Só verifica se o banco ativo atual NÃO for o central principal
        current_db = db_name if db_name else 'default'
        real_db_name = settings.DATABASES[current_db]['NAME']
        
        # Ignora verificação se for a base central ou testes
        is_central_db = real_db_name in ['aperus_central', 'sistema_gerencial', 'aperus_testes']
        
        # Ignora verificação para rotas públicas e de suporte
        path = request.path
        is_public_route = path.startswith('/api/health/') or path.startswith('/api/saas/') or path.startswith('/static/') or path.startswith('/media/')
        
        if not is_central_db and not is_public_route:
            bloquear, motivo = verificar_licenca_ativa()
            if bloquear:
                # Limpa a conexão antes de retornar
                set_current_tenant_db('default')
                from django.http import JsonResponse
                return JsonResponse({
                    'error': 'licenca_bloqueada',
                    'detail': motivo
                }, status=403)

        response = self.get_response(request)
        
        # 4. Limpa o alias ao término da requisição para evitar vazamento de estado
        set_current_tenant_db('default')
        
        return response
