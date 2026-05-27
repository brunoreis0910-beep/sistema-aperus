import re
from django.conf import settings
from api.db_router import set_current_tenant_db

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
            
        response = self.get_response(request)
        
        # 4. Limpa o alias ao término da requisição para evitar vazamento de estado
        set_current_tenant_db('default')
        
        return response
