"""
View para servir como proxy de imagens externas
Evita problemas de CORS ao carregar imagens no PDF
"""
import requests
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import base64
from urllib.parse import unquote

@csrf_exempt
@require_http_methods(["GET"])
def proxy_image(request):
    """
    Proxy para carregar imagens externas
    Uso: /api/proxy-image/?url=https://exemplo.com/imagem.jpg
    """
    url = request.GET.get('url')
    
    if not url:
        return HttpResponse('URL não fornecida', status=400)
    
    # Decodificar URL
    url = unquote(url)
    
    try:
        # Fazer request para a URL externa
        response = requests.get(url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        if response.status_code != 200:
            return HttpResponse(f'Erro ao baixar imagem: {response.status_code}', status=response.status_code)
        
        # Retornar a imagem com o content-type correto
        content_type = response.headers.get('Content-Type', 'image/jpeg')
        return HttpResponse(response.content, content_type=content_type)
        
    except requests.exceptions.Timeout:
        return HttpResponse('Timeout ao carregar imagem', status=504)
    except requests.exceptions.RequestException as e:
        return HttpResponse(f'Erro ao carregar imagem: {str(e)}', status=500)
