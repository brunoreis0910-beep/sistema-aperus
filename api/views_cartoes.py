from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from django.utils import timezone
from decimal import Decimal
from .models import RecebimentoCartao, FinanceiroConta, FinanceiroBancario, ContaBancaria
from .serializers_cartoes import RecebimentoCartaoSerializer

class RecebimentoCartaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Gerenciamento de Recebíveis de Cartão (Crédito/Débito)
    """
    queryset = RecebimentoCartao.objects.all().order_by('data_previsao')
    serializer_class = RecebimentoCartaoSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        status_param = self.request.query_params.get('status')
        data_ini = self.request.query_params.get('data_inicial')
        data_fim = self.request.query_params.get('data_final')
        bandeira = self.request.query_params.get('bandeira')
        
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        if data_ini and data_fim:
            # Filtra pela data de previsao (vencimento)
            queryset = queryset.filter(data_previsao__range=[data_ini, data_fim])
            
        if bandeira:
            queryset = queryset.filter(bandeira__icontains=bandeira)
            
        return queryset

    @action(detail=False, methods=['post'])
    def baixar_lote(self, request):
        """
        Baixa em lote dos recebimentos selecionados.
        Payload: { 
            ids: [1, 2, 3], 
            id_conta_bancaria: 1,
            data_pagamento: 'YYYY-MM-DD' 
        }
        """
        ids = request.data.get('ids', [])
        id_conta_bancaria = request.data.get('id_conta_bancaria')
        data_pagamento_str = request.data.get('data_pagamento')
        
        if not ids:
            return Response({'error': 'Nenhum item selecionado'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not id_conta_bancaria:
            return Response({'error': 'Conta Bancária de destino não informada'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            conta_bancaria = ContaBancaria.objects.get(pk=id_conta_bancaria)
        except ContaBancaria.DoesNotExist:
             return Response({'error': 'Conta Bancária não encontrada'}, status=status.HTTP_404_NOT_FOUND)

        if data_pagamento_str:
            try:
                data_pagamento = timezone.datetime.fromisoformat(data_pagamento_str).date()
            except ValueError:
                data_pagamento = timezone.now().date()
        else:
            data_pagamento = timezone.now().date()
            
        recebimentos = RecebimentoCartao.objects.filter(id_recebimento__in=ids).exclude(status='LIQUIDADO')
        
        total_baixado = Decimal('0.00')
        count = 0
        
        for rec in recebimentos:
            # 1. Atualizar Status do RecebimentoCartao
            rec.status = 'LIQUIDADO'
            rec.data_pagamento = data_pagamento
            rec.save()
            
            valor_liq = rec.valor_liquido
            total_baixado += valor_liq
            
            # 2. Atualizar FinanceiroConta Vinculado (se houver) -> Marcar como 'Pago'
            if rec.id_financeiro:
                fc = rec.id_financeiro
                if fc.status_conta != 'Paga':
                    fc.status_conta = 'Paga' # ou Liquidado? Verificando models... 'Paga' parece ser usado
                    fc.data_pagamento = data_pagamento
                    fc.valor_liquidado = valor_liq  # Usa valor líquido do recebível (após taxas)
                    fc.id_conta_baixa = conta_bancaria
                    fc.save()
            
            count += 1
            
        # 3. Gerar Movimentação Bancária Única (Consolidada) ou Individual?
        # Geralmente consolidada por lote (extrato mostra o lote), mas individual é mais rastreável.
        # Vamos fazer consolidada se for muitos, mas aqui faremos um lançamento único somando tudo para simplificar o extrato.
        
        if count > 0:
            FinanceiroBancario.objects.create(
                id_conta_bancaria=conta_bancaria,
                tipo_movimento='C', # Crédito
                data_pagamento=data_pagamento,
                valor_movimento=total_baixado,
                descricao=f"Recebimento Cartões (Lote {count} itens)",
                forma_pagamento='Cartão', # Genérico
            )
            
        return Response({
            'message': f'{count} recebimentos baixados com sucesso.',
            'total_recebido': float(total_baixado)
        })

    @action(detail=True, methods=['post'])
    def antecipar(self, request, pk=None):
        """
        Recalcula valores para antecipação de um título específico.
        Payload: { nova_taxa: 5.0, data_antecipacao: 'YYYY-MM-DD' }
        """
        rec = self.get_object()
        nova_taxa = request.data.get('nova_taxa')
        nova_data = request.data.get('data_antecipacao')
        
        if nova_taxa is not None:
             try:
                 taxa_val = Decimal(str(nova_taxa))
                 rec.taxa_percentual = taxa_val
                 rec.valor_taxa = (rec.valor_bruto * taxa_val) / Decimal('100.00')
                 rec.valor_liquido = rec.valor_bruto - rec.valor_taxa
             except:
                 pass
        
        if nova_data:
            rec.data_previsao = nova_data
            
        rec.save()
        return Response(self.get_serializer(rec).data)
