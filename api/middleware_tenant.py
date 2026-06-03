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
    dia_vencimento = 10
    bloquear_central = False
    is_test_env = False
    
    try:
        with db_conn.cursor() as cursor:
            # Verifica se a base central está acessível e possui a tabela
            cursor.execute("SHOW TABLES FROM aperus_central LIKE 'saas_cliente'")
            if cursor.fetchone():
                cursor.execute("SELECT status_licenca, dia_vencimento, is_test_environment FROM aperus_central.saas_cliente WHERE cnpj = %s", [cnpj_limpo])
                row = cursor.fetchone()
                if row:
                    status_central = row[0]
                    dia_vencimento = row[1]
                    is_test_env = bool(row[2])
                    
                    # 1. Se for ambiente de testes, não bloqueia
                    if is_test_env:
                        bloquear_central = False
                    # 2. Se a licença já estiver bloqueada administrativamente ou cancelada, bloqueia na hora
                    elif status_central in ['BLOQUEADO', 'CANCELADO', 'SUSPENSO', 'INATIVO']:
                        bloquear_central = True
                    else:
                        # 3. Busca a fatura vencida há mais tempo
                        cursor.execute("""
                            SELECT data_vencimento FROM aperus_central.saas_cliente_mensalidade m
                            JOIN aperus_central.saas_cliente c ON m.saas_cliente_id = c.id_saas_cliente
                            WHERE c.cnpj = %s AND m.status_pagamento = 'PENDENTE'
                            ORDER BY m.data_vencimento ASC LIMIT 1
                        """, [cnpj_limpo])
                        row_fatura = cursor.fetchone()
                        if row_fatura:
                            data_vencimento_fatura = row_fatura[0]
                            agora_date = datetime.now().date()
                            dias_atraso = (agora_date - data_vencimento_fatura).days
                            
                            # Bloqueia se o atraso for maior que 10 dias (10 dias de carência)
                            if dias_atraso > 10:
                                # Trava de fim de semana (não bloqueia aos sábados e domingos)
                                dia_semana = agora_date.weekday() # 5 = Sábado, 6 = Domingo
                                if dia_semana in [5, 6]:
                                    bloquear_central = False
                                else:
                                    bloquear_central = True
                            else:
                                bloquear_central = False
                        else:
                            bloquear_central = False
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
                    if bloquear_central:
                        novo_status = 'Bloqueada'
                        nova_validade = agora.date() - timedelta(days=1)
                    else:
                        # Estende o prazo offline por 3 dias em caso de contingência
                        nova_validade = agora.date() + timedelta(days=3)
                        
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
                    elif data_validade and agora.date() > data_validade:
                        bloquear = True
                        motivo = 'Licença Expirada. Conecte o servidor à internet para atualizar a licença.'
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
        
        # Só bloqueia rotas de API (começando com /api/)
        path = request.path
        is_api_route = path.startswith('/api/')
        
        # Ignora verificação para rotas públicas e de suporte
        is_public_route = path.startswith('/api/health/') or path.startswith('/api/saas/') or path.startswith('/static/') or path.startswith('/media/')
        
        if is_api_route and not is_central_db and not is_public_route:
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
