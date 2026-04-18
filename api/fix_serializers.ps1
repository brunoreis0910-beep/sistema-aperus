Write-Host "=== FORÇANDO CRIAÇÃO DO SERIALIZERS.PY ===" -ForegroundColor Red

Set-Location "C:\Projetos\SistemaGerencial"

$content = @"
from rest_framework import serializers
from .models import Produto, CatalogoItem

class ProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produto
        fields = '__all__'

class CatalogoItemSerializer(serializers.ModelSerializer):
    produto = ProdutoSerializer(read_only=True)
    produto_id = serializers.PrimaryKeyRelatedField(
        queryset=Produto.objects.all(),
        source='produto',
        write_only=True
    )
    
    class Meta:
        model = CatalogoItem
        fields = [
            'id',
            'produto',
            'produto_id', 
            'ativo',
            'ordem',
            'destaque',
            'data_cadastro',
            'data_atualizacao'
        ]
        read_only_fields = ['id', 'data_cadastro', 'data_atualizacao']
"@

Write-Host "Criando api\serializers.py..." -ForegroundColor Yellow
[System.IO.File]::WriteAllText("api\serializers.py", $content, [System.Text.Encoding]::UTF8)

Write-Host "Arquivo criado! Conteúdo:" -ForegroundColor Green
Get-Content "api\serializers.py"

Write-Host "`nIniciando Django..." -ForegroundColor Cyan
python manage.py runserver
