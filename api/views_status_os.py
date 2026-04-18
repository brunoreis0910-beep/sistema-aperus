"""
Views para gerenciamento de Status de Ordem de Serviço
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import StatusOrdemServico
from .serializers import StatusOrdemServicoSerializer


class StatusOrdemServicoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Status de Ordem de Serviço
    
    list: Retorna todos os status
    retrieve: Retorna um status específico
    create: Cria um novo status
    update: Atualiza um status existente
    partial_update: Atualiza parcialmente um status
    destroy: Remove um status (se permitido)
    """
    queryset = StatusOrdemServico.objects.all()
    serializer_class = StatusOrdemServicoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Permite filtrar por:
        - ativo: apenas status ativos
        - apenas_ativos=true
        """
        queryset = StatusOrdemServico.objects.all()
        
        # Filtrar apenas ativos
        apenas_ativos = self.request.query_params.get('apenas_ativos', None)
        if apenas_ativos and apenas_ativos.lower() == 'true':
            queryset = queryset.filter(ativo=True)
        
        return queryset.order_by('ordem', 'nome_status')
    
    def destroy(self, request, *args, **kwargs):
        """Impede exclusão de status que não permitem ou que estão em uso"""
        instance = self.get_object()
        
        # Verificar se permite excluir
        if not instance.permite_excluir:
            return Response(
                {'detail': 'Este status não pode ser excluído.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar se está em uso (você pode adicionar essa verificação)
        # from .models import OrdemServico
        # if OrdemServico.objects.filter(status_os=instance.nome_status).exists():
        #     return Response(
        #         {'detail': 'Este status está em uso e não pode ser excluído.'},
        #         status=status.HTTP_400_BAD_REQUEST
        #     )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def ativos(self, request):
        """Retorna apenas status ativos"""
        queryset = self.queryset.filter(ativo=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def padrao(self, request):
        """Retorna o status padrão"""
        try:
            status_padrao = StatusOrdemServico.objects.get(padrao=True, ativo=True)
            serializer = self.get_serializer(status_padrao)
            return Response(serializer.data)
        except StatusOrdemServico.DoesNotExist:
            return Response(
                {'detail': 'Nenhum status padrão configurado.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def definir_como_padrao(self, request, pk=None):
        """Define este status como padrão"""
        instance = self.get_object()
        
        # Desmarcar todos os outros
        StatusOrdemServico.objects.filter(padrao=True).update(padrao=False)
        
        # Marcar este como padrão
        instance.padrao = True
        instance.save()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def reordenar(self, request):
        """
        Reordena os status
        Espera um array de objetos: [{'id_status': 1, 'ordem': 1}, ...]
        """
        items = request.data.get('items', [])
        
        if not items:
            return Response(
                {'detail': 'Nenhum item para reordenar.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            for item in items:
                StatusOrdemServico.objects.filter(
                    id_status=item['id_status']
                ).update(ordem=item['ordem'])
            
            return Response({'detail': 'Status reordenados com sucesso.'})
        except Exception as e:
            return Response(
                {'detail': f'Erro ao reordenar: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
