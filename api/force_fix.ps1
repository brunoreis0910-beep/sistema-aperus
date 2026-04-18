Write-Host "=== FORÇANDO CORREÇÃO DO DJANGO ===" -ForegroundColor Red

Set-Location "C:\Projetos\SistemaGerencial"

# 1. Forçar criação do serializers.py correto
Write-Host "Criando serializers.py correto..." -ForegroundColor Yellow
$serializerContent = @"
from rest_framework import serializers
from .models import Produto, CatalogoItem

class ProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produto
        fields = '__all__'

class CatalogoItemSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome_produto', read_only=True)
    produto_detalhes = ProdutoSerializer(source='produto', read_only=True)
    produto_id = serializers.PrimaryKeyRelatedField(
        queryset=Produto.objects.all(),
        source='produto',
        write_only=True
    )
    
    class Meta:
        model = CatalogoItem
        fields = [
            'id',
            'produto_id',
            'produto_nome',
            'produto_detalhes',
            'ativo',
            'ordem',
            'destaque',
            'data_cadastro',
            'data_atualizacao'
        ]
        read_only_fields = ['id', 'data_cadastro', 'data_atualizacao']
"@

[System.IO.File]::WriteAllText("api\serializers.py", $serializerContent, [System.Text.Encoding]::UTF8)

# 2. Limpar cache
Write-Host "Limpando cache..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# 3. Executar Django
Write-Host "Iniciando Django..." -ForegroundColor Green
python manage.py runserver
