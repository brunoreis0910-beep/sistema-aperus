from django.shortcuts import redirect
from django.http import HttpResponse
from django.views import View

class ConfiguracoesRedirectView(View):
    """Redireciona /configuracoes para /#/configuracoes (Hash Router)"""
    def get(self, request):
        # Retorna HTML com redirect via JavaScript para garantir que funciona com hash
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Redirecionando...</title>
        </head>
        <body>
            <script>
                window.location.href = '/#/configuracoes';
            </script>
            <p>Redirecionando para configurações...</p>
        </body>
        </html>
        """
        return HttpResponse(html)

class GenericHashRedirectView(View):
    """Redireciona qualquer rota para versão com hash"""
    def get(self, request, path):
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Redirecionando...</title>
        </head>
        <body>
            <script>
                window.location.href = '/#/{path}';
            </script>
            <p>Redirecionando...</p>
        </body>
        </html>
        """
        return HttpResponse(html)
