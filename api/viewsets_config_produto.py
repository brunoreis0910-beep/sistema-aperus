from rest_framework import viewsets, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import ConfiguracaoProduto


class ConfiguracaoProdutoSerializer(serializers.ModelSerializer):
    """Serializer para configuração de produto"""
    tipo_geracao_codigo_display = serializers.CharField(
        source='get_tipo_geracao_codigo_display',
        read_only=True
    )
    
    class Meta:
        model = ConfiguracaoProduto
        fields = [
            'id_config',
            'tipo_geracao_codigo',
            'tipo_geracao_codigo_display',
            'proximo_codigo',
            'prefixo_codigo',
            'tamanho_codigo',
            'controlar_lote_validade',
            'produto_em_grade',
            'material_construcao',
            'trib_cfop',
            'trib_cst_icms',
            'trib_csosn',
            'trib_icms_aliquota',
            'trib_cst_ipi',
            'trib_ipi_aliquota',
            'trib_cst_pis_cofins',
            'trib_pis_aliquota',
            'trib_cofins_aliquota',
            'trib_classificacao_fiscal',
            'data_criacao',
            'data_modificacao'
        ]
        read_only_fields = ['id_config', 'data_criacao', 'data_modificacao']


class ConfiguracaoProdutoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar configurações de produto"""
    queryset = ConfiguracaoProduto.objects.all()
    serializer_class = ConfiguracaoProdutoSerializer
    permission_classes = [AllowAny]
    pagination_class = None  # Desabilitar paginação
    
    def list(self, request, *args, **kwargs):
        """Retorna a configuração (sempre deve ter apenas 1 registro)"""
        # Buscar ou criar configuração padrão
        config, created = ConfiguracaoProduto.objects.get_or_create(
            id_config=1,
            defaults={
                'tipo_geracao_codigo': 'manual',
                'proximo_codigo': 1,
                'tamanho_codigo': 6
            }
        )
        
        serializer = self.get_serializer(config)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Retorna uma configuração específica"""
        return super().retrieve(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Atualiza a configuração"""
        return super().update(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """Cria nova configuração"""
        print("=" * 60)
        print("🆕 CRIAR CONFIGURAÇÃO DE PRODUTO")
        print("=" * 60)
        print("📥 Dados recebidos:", request.data)
        print("=" * 60)
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def gerar_codigo(self, request):
        """
        Gera o próximo código baseado na configuração.
        GET /api/config-produto/gerar_codigo/
        """
        config, created = ConfiguracaoProduto.objects.get_or_create(
            id_config=1,
            defaults={
                'tipo_geracao_codigo': 'manual',
                'proximo_codigo': 1,
                'tamanho_codigo': 6
            }
        )
        
        tipo = config.tipo_geracao_codigo
        
        if tipo == 'manual':
            return Response({
                'codigo': None,
                'mensagem': 'Modo manual - digite o código manualmente',
                'tipo': tipo
            })
        
        # Gera o código
        codigo_gerado = config.gerar_proximo_codigo()
        
        return Response({
            'codigo': codigo_gerado,
            'proximo': config.proximo_codigo,
            'tipo': tipo,
            'mensagem': f'Próximo código: {codigo_gerado}'
        })
    
    @action(detail=False, methods=['post'])
    def confirmar_uso_codigo(self, request):
        """
        Confirma o uso do código e incrementa o contador.
        POST /api/config-produto/confirmar_uso_codigo/
        Body: { "codigo": "PROD000001" }
        """
        config = ConfiguracaoProduto.objects.filter(id_config=1).first()
        
        if not config:
            return Response(
                {'erro': 'Configuração não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Incrementa o próximo código
        config.incrementar_codigo()
        
        return Response({
            'sucesso': True,
            'proximo_codigo': config.proximo_codigo,
            'mensagem': 'Código confirmado e contador incrementado'
        })
