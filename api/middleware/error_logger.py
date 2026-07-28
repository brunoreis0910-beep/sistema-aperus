import traceback
import requests
import os
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

class CentralErroLoggerMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        """
        Este método é disparado pelo Django AUTOMATICAMENTE toda vez que o sistema dá um erro 500
        """
        # Só captura se não for ambiente de desenvolvimento local (Evita poluir seus testes)
        if os.getenv('DEBUG', 'False') == 'True':
            return None 

        try:
            # Monta o pacote de dados do erro
            payload = {
                'tenant_schema': os.getenv('TENANT_SCHEMA_NAME', 'cliente_desconhecido'),
                'url_afetada': request.build_absolute_uri(),
                'tipo_excecao': exception.__class__.__name__,
                'mensagem_erro': str(exception),
                'traceback_completo': traceback.format_exc(),
                'nivel': 'ERROR'
            }
            
            # Envia em background para a API da sua Central Mãe
            mother_url = getattr(settings, 'SAAS_MOTHER_URL', 'http://localhost:8006')
            url_central = f"{mother_url.rstrip('/')}/api/central-logs/adicionar/"
            
            requests.post(url_central, json=payload, timeout=3) # Timeout de 3s para nunca travar o cliente
            
        except Exception:
            # Se a própria central estiver fora do ar, ignora de forma silenciosa para não quebrar o caixa do cliente
            pass
            
        return None # Retorna None para o Django seguir o fluxo padrão (mostrar uma tela amigável de "Ops, algo deu errado")
