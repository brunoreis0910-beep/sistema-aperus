"""Middleware simples para suportar X-HTTP-Method-Override.

Se o header X-HTTP-Method-Override estiver presente, força request.method para
esse valor (por exemplo DELETE). Isso permite que clients que não conseguem
enviar DELETE diretamente (por exemplo via CORS) façam POST com override.

Coloque o middleware no topo (após corsheaders.middleware.CorsMiddleware) em
`settings.py` para que a alteração do método ocorra antes da resolução de views.
"""
from typing import Callable

class XHTTPMethodOverrideMiddleware:
    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request):
        # Cabeçalhos HTTP são expostos em request.META com prefixo HTTP_
        override = request.META.get('HTTP_X_HTTP_METHOD_OVERRIDE')
        if override:
            try:
                request.method = override.upper()
            except Exception:
                # não queremos interromper a request por um override inválido
                pass
        return self.get_response(request)
