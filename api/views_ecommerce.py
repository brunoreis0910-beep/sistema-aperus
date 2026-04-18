from rest_framework import viewsets, status, permissions, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from .models import Venda, VendaItem, Produto

class VendaItemEcommerceSerializer(serializers.ModelSerializer):
    """Serializer simplificado para os itens do pedido"""
    class Meta:
        model = VendaItem
        fields = ['id_produto', 'quantidade', 'valor_unitario', 'valor_total']

class VendaEcommerceSerializer(serializers.ModelSerializer):
    """
    Serializer principal para Vendas vindas do E-commerce/Headless.
    Recebe os dados do carrinho e cria a estrutura de Venda + Itens.
    """
    itens = VendaItemEcommerceSerializer(many=True, write_only=True)
    
    class Meta:
        model = Venda
        fields = [
            'id_venda', 'id_cliente', 'valor_total', 'taxa_entrega', 
            'origem', 'status_pagamento', 'status_logistica', 
            'payment_id', 'data_documento', 'itens'
        ]
        read_only_fields = ['id_venda', 'data_documento', 'status_logistica']

    def create(self, validated_data):
        itens_data = validated_data.pop('itens')
        
        # Cria a venda primeiro
        venda = Venda.objects.create(**validated_data)
        
        # Cria os itens relacionados
        for item_data in itens_data:
            VendaItem.objects.create(id_venda=venda, **item_data)
            
        return venda

class VendaEcommerceViewSet(viewsets.ModelViewSet):
    """
    API exclusiva para gerenciar pedidos vindos do Site/App.
    Isola a lógica do PDV físico para evitar bugs cruzados.
    """
    queryset = Venda.objects.filter(origem__in=['ECOM', 'WHATSAPP']).order_by('-data_documento')
    serializer_class = VendaEcommerceSerializer
    # Ajuste as permissões conforme sua auth (JWT, Token, etc)
    permission_classes = [permissions.IsAuthenticated] 

    def create(self, request, *args, **kwargs):
        # 1. Preparação dos dados
        data = request.data.copy()
        
        # Define origem padrão se não enviada
        if 'origem' not in data:
            data['origem'] = 'ECOM'
            
        # 2. Validação e Serialização
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                # 3. Criação do Pedido
                venda = self.perform_create(serializer)
                
                # 4. Integração com Gateway (Mock)
                # Aqui você chamaria: preference_id = pagamento_service.criar_preferencia(venda)
                # venda.payment_id = preference_id
                # venda.save()
                
                headers = self.get_success_headers(serializer.data)
                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
                
        except Exception as e:
            return Response(
                {"error": "Erro ao processar pedido", "detail": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_create(self, serializer):
        return serializer.save()

    @action(detail=False, methods=['post'], url_path='webhook-pagamento')
    def webhook_pagamento(self, request):
        """
        Endpoint que recebe notificação do Mercado Pago / Stripe.
        Muda status para APROVADO e dispara emissão de NFe.
        """
        payment_id = request.data.get('data', {}).get('id')
        status_pagamento = request.data.get('action') # Exemplo genérico
        
        if not payment_id:
            return Response({"error": "Payment ID not found"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Busca a venda pelo ID do pagamento
            venda = Venda.objects.filter(payment_id=payment_id).first()
            
            if venda and status_pagamento == 'payment.created':
                # Lógica de aprovação
                venda.status_pagamento = 'APROVADO'
                venda.save()
                
                # TODO: Chamar serviço de emissão de NFe
                # emitir_nota_fiscal_automatica(venda.id_venda)
                
                return Response({"status": "Pedido aprovado com sucesso"})
                
        except Exception as e:
             return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"status": "Webhook recebido"}, status=status.HTTP_200_OK)
