import threading

_thread_locals = threading.local()

def get_current_tenant_db():
    """Retorna o alias do banco de dados do tenant ativo na thread atual."""
    return getattr(_thread_locals, 'tenant_db_alias', 'default')

def set_current_tenant_db(db_alias):
    """Define o alias do banco de dados do tenant para a thread atual."""
    _thread_locals.tenant_db_alias = db_alias


class TenantRouter:
    """
    Roteador de banco de dados para Multi-tenancy.
    Garante que os modelos centrais do SaaS sempre usem o banco 'default'
    e redireciona as demais requisições para o banco do cliente ativo.
    """
    
    CENTRAL_MODELS = {'saascliente', 'saasclientemensalidade', 'saasclientecontrato', 'versaosistema', 'historicoatualizacao'}

    def db_for_read(self, model, **hints):
        if model._meta.model_name in self.CENTRAL_MODELS:
            return 'default'
        return get_current_tenant_db()

    def db_for_write(self, model, **hints):
        if model._meta.model_name in self.CENTRAL_MODELS:
            return 'default'
        return get_current_tenant_db()

    def allow_relation(self, obj1, obj2, **hints):
        # Permite relações se ambos os objetos estiverem no mesmo banco
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # Modelos centrais do SaaS só migram no banco 'default'
        if model_name in self.CENTRAL_MODELS:
            return db == 'default'
        
        # Bancos de tenants não devem rodar migrações dos modelos centrais
        if db != 'default':
            return model_name not in self.CENTRAL_MODELS
            
        return True
