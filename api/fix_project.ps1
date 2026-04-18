Write-Host "=== Corrigindo projeto Django ===" -ForegroundColor Cyan

# 1. Limpar cache Python
Write-Host "`n[1/5] Limpando cache Python..." -ForegroundColor Yellow
Get-ChildItem -Path "C:\Projetos\SistemaGerencial" -Recurse -Filter "__pycache__" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
Get-ChildItem -Path "C:\Projetos\SistemaGerencial" -Recurse -Filter "*.pyc" -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "Cache limpo!" -ForegroundColor Green

# 2. Criar views_catalogo.py limpo
Write-Host "`n[2/5] Criando views_catalogo.py..." -ForegroundColor Yellow
$viewsContent = @"
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Produto, CatalogoItem
from .serializers import ProdutoSerializer, CatalogoItemSerializer

class CatalogoViewSet(viewsets.ModelViewSet):
    queryset = CatalogoItem.objects.all()
    serializer_class = CatalogoItemSerializer

    @action(detail=False, methods=['get'])
    def produtos_ativos(self, request):
        catalogo = CatalogoItem.objects.filter(ativo=True).select_related('produto')
        serializer = self.get_serializer(catalogo, many=True)
        return Response(serializer.data)


class WhatsAppViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'])
    def enviar_catalogo(self, request):
        numero = request.data.get('numero')
        
        if not numero:
            return Response(
                {'error': 'Número do WhatsApp é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({'message': 'Catálogo enviado com sucesso'})
"@

[System.IO.File]::WriteAllText("C:\Projetos\SistemaGerencial\api\views_catalogo.py", $viewsContent, [System.Text.Encoding]::UTF8)
Write-Host "views_catalogo.py criado!" -ForegroundColor Green

# 3. Criar migrações
Write-Host "`n[3/5] Criando migrações..." -ForegroundColor Yellow
python manage.py makemigrations
if ($LASTEXITCODE -eq 0) {
    Write-Host "Migrações criadas!" -ForegroundColor Green
}
else {
    Write-Host "Erro ao criar migrações!" -ForegroundColor Red
    exit 1
}

# 4. Aplicar migrações
Write-Host "`n[4/5] Aplicando migrações..." -ForegroundColor Yellow
python manage.py migrate
if ($LASTEXITCODE -eq 0) {
    Write-Host "Migrações aplicadas!" -ForegroundColor Green
}
else {
    Write-Host "Erro ao aplicar migrações!" -ForegroundColor Red
    exit 1
}

# 5. Iniciar servidor
Write-Host "`n[5/5] Iniciando servidor Django..." -ForegroundColor Yellow
Write-Host "`nServidor iniciando em http://127.0.0.1:8000/" -ForegroundColor Cyan
Write-Host "Pressione CTRL+C para parar`n" -ForegroundColor Gray
python manage.py runserver
"@

