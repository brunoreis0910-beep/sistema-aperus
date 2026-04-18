"""
views_pcp.py — PCP (Planejamento e Controle de Produção)

ViewSets:
  • OrdemProducaoViewSet   — CRUD de Ordens de Produção + ações: iniciar / finalizar / cancelar
  • ComposicaoProdutoViewSet — CRUD da Ficha Técnica (BOM) por produto acabado
"""

from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models_pcp import ComposicaoProduto, OrdemProducao
from .models import Produto, Deposito, Estoque, EstoqueMovimentacao


# ---------------------------------------------------------------------------
# Serializers
# ---------------------------------------------------------------------------

class ComposicaoProdutoSerializer(serializers.ModelSerializer):
    insumo_nome = serializers.CharField(source='insumo.nome_produto', read_only=True)
    insumo_unidade = serializers.CharField(source='insumo.unidade_medida', read_only=True)
    produto_acabado_nome = serializers.CharField(source='produto_acabado.nome_produto', read_only=True)

    class Meta:
        model = ComposicaoProduto
        fields = '__all__'
        read_only_fields = ['id_composicao', 'criado_em']


class OrdemProducaoSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome_produto', read_only=True)
    produto_unidade = serializers.CharField(source='produto.unidade_medida', read_only=True)
    deposito_nome = serializers.CharField(source='deposito.nome_deposito', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    custo_unitario = serializers.DecimalField(
        max_digits=15, decimal_places=4, read_only=True
    )

    class Meta:
        model = OrdemProducao
        fields = '__all__'
        read_only_fields = [
            'id_op', 'quantidade_produzida', 'custo_total',
            'data_abertura', 'data_inicio_producao', 'data_finalizacao', 'criado_por',
        ]


# ---------------------------------------------------------------------------
# ViewSets
# ---------------------------------------------------------------------------

class ComposicaoProdutoViewSet(viewsets.ModelViewSet):
    """CRUD da Ficha Técnica (BOM)."""
    serializer_class = ComposicaoProdutoSerializer
    queryset = ComposicaoProduto.objects.select_related('produto_acabado', 'insumo').all()

    def get_queryset(self):
        qs = super().get_queryset()
        produto_acabado = self.request.query_params.get('produto_acabado')
        insumo = self.request.query_params.get('insumo')
        ativo = self.request.query_params.get('ativo')
        if produto_acabado:
            qs = qs.filter(produto_acabado_id=produto_acabado)
        if insumo:
            qs = qs.filter(insumo_id=insumo)
        if ativo is not None:
            qs = qs.filter(ativo=(ativo.lower() == 'true'))
        return qs


class OrdemProducaoViewSet(viewsets.ModelViewSet):
    """CRUD de Ordens de Produção com ações de ciclo de vida."""
    serializer_class = OrdemProducaoSerializer
    queryset = OrdemProducao.objects.select_related('produto', 'deposito', 'criado_por').all()

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        status_p = params.get('status')
        produto = params.get('produto')
        data_inicio = params.get('data_inicio')
        data_fim = params.get('data_fim')

        if status_p:
            qs = qs.filter(status=status_p)
        if produto:
            qs = qs.filter(produto_id=produto)
        if data_inicio:
            qs = qs.filter(data_abertura__date__gte=data_inicio)
        if data_fim:
            qs = qs.filter(data_abertura__date__lte=data_fim)
        return qs

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)

    # ------------------------------------------------------------------
    # Ação: Iniciar Produção
    # ------------------------------------------------------------------
    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        op = self.get_object()
        if op.status != 'ABERTA':
            return Response(
                {'erro': f'Somente OPs com status ABERTA podem ser iniciadas. Status atual: {op.get_status_display()}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        op.status = 'EM_PRODUCAO'
        op.data_inicio_producao = timezone.now()
        op.save(update_fields=['status', 'data_inicio_producao'])
        return Response({'mensagem': 'Produção iniciada.', 'status': op.status})

    # ------------------------------------------------------------------
    # Ação: Finalizar Produção  (lógica principal do PCP)
    # ------------------------------------------------------------------
    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        op = self.get_object()

        if op.status == 'FINALIZADA':
            return Response({'erro': 'Esta OP já foi finalizada.'}, status=status.HTTP_400_BAD_REQUEST)
        if op.status == 'CANCELADA':
            return Response({'erro': 'OP cancelada não pode ser finalizada.'}, status=status.HTTP_400_BAD_REQUEST)

        composicao = ComposicaoProduto.objects.filter(
            produto_acabado=op.produto, ativo=True
        ).select_related('insumo')

        if not composicao.exists():
            return Response(
                {'erro': f'O produto "{op.produto.nome_produto}" não possui Ficha Técnica (BOM) cadastrada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                custo_total = Decimal('0.00')

                # ── 1. Baixa de insumos ──────────────────────────────────────
                for item in composicao:
                    qtd_com_perda = (
                        item.quantidade_necessaria
                        * op.quantidade_planejada
                        * (1 + item.percentual_perda / Decimal('100'))
                    ).quantize(Decimal('0.001'), rounding=ROUND_HALF_UP)

                    # Bloqueia o registro de estoque para evitar race condition
                    try:
                        estoque_insumo = Estoque.objects.select_for_update().get(
                            id_produto=item.insumo,
                            id_deposito=op.deposito,
                        )
                    except Estoque.DoesNotExist:
                        raise ValueError(
                            f'Sem registro de estoque para "{item.insumo.nome_produto}" '
                            f'no depósito "{op.deposito.nome_deposito}". '
                            f'Cadastre o produto no depósito antes de produzir.'
                        )

                    if estoque_insumo.quantidade < qtd_com_perda:
                        raise ValueError(
                            f'Estoque insuficiente de "{item.insumo.nome_produto}": '
                            f'disponível {estoque_insumo.quantidade:.3f}, '
                            f'necessário {qtd_com_perda:.3f}.'
                        )

                    qtd_anterior = estoque_insumo.quantidade
                    estoque_insumo.quantidade -= qtd_com_perda
                    estoque_insumo.save(update_fields=['quantidade', 'data_modificacao'])

                    EstoqueMovimentacao.objects.create(
                        id_estoque=estoque_insumo,
                        id_produto=item.insumo,
                        id_deposito=op.deposito,
                        tipo_movimentacao='SAIDA',
                        quantidade_anterior=qtd_anterior,
                        quantidade_movimentada=qtd_com_perda,
                        quantidade_atual=estoque_insumo.quantidade,
                        custo_unitario=estoque_insumo.custo_medio,
                        documento_tipo='AJUSTE',
                        documento_numero=f'OP-{op.id_op:06d}',
                        id_documento_origem=op.id_op,
                        observacoes=f'Consumo de insumo — OP #{op.id_op}',
                    )

                    custo_total += (qtd_com_perda * estoque_insumo.custo_medio).quantize(
                        Decimal('0.01'), rounding=ROUND_HALF_UP
                    )

                # ── 2. Entrada do produto acabado ────────────────────────────
                estoque_acabado, _ = Estoque.objects.get_or_create(
                    id_produto=op.produto,
                    id_deposito=op.deposito,
                    defaults={
                        'quantidade': Decimal('0.000'),
                        'custo_medio': Decimal('0.0000'),
                        'quantidade_minima': Decimal('0.000'),
                    },
                )
                estoque_acabado = Estoque.objects.select_for_update().get(pk=estoque_acabado.pk)

                custo_unit_novo = (
                    custo_total / op.quantidade_planejada
                    if op.quantidade_planejada > 0 else Decimal('0')
                ).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)

                # Custo médio ponderado
                qtd_ant_acabado = estoque_acabado.quantidade
                total_valor_ant = qtd_ant_acabado * estoque_acabado.custo_medio
                total_valor_novo = op.quantidade_planejada * custo_unit_novo
                nova_qtd = qtd_ant_acabado + op.quantidade_planejada
                if nova_qtd > 0:
                    estoque_acabado.custo_medio = (
                        (total_valor_ant + total_valor_novo) / nova_qtd
                    ).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)

                estoque_acabado.quantidade = nova_qtd
                estoque_acabado.save(update_fields=['quantidade', 'custo_medio', 'data_modificacao'])

                EstoqueMovimentacao.objects.create(
                    id_estoque=estoque_acabado,
                    id_produto=op.produto,
                    id_deposito=op.deposito,
                    tipo_movimentacao='ENTRADA',
                    quantidade_anterior=qtd_ant_acabado,
                    quantidade_movimentada=op.quantidade_planejada,
                    quantidade_atual=estoque_acabado.quantidade,
                    custo_unitario=estoque_acabado.custo_medio,
                    documento_tipo='AJUSTE',
                    documento_numero=f'OP-{op.id_op:06d}',
                    id_documento_origem=op.id_op,
                    observacoes=f'Produção finalizada — OP #{op.id_op}',
                )

                # ── 3. Atualiza OP ───────────────────────────────────────────
                op.status = 'FINALIZADA'
                op.quantidade_produzida = op.quantidade_planejada
                op.custo_total = custo_total
                op.data_finalizacao = timezone.now()
                op.save(update_fields=[
                    'status', 'quantidade_produzida', 'custo_total', 'data_finalizacao'
                ])

        except ValueError as exc:
            return Response({'erro': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response(
                {'erro': f'Erro interno ao finalizar produção: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({
            'mensagem': 'Produção finalizada e estoques atualizados com sucesso!',
            'id_op': op.id_op,
            'custo_total': str(op.custo_total),
            'custo_unitario': str(op.custo_unitario),
        })

    # ------------------------------------------------------------------
    # Ação: Cancelar OP
    # ------------------------------------------------------------------
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        op = self.get_object()
        if op.status == 'FINALIZADA':
            return Response(
                {'erro': 'OP finalizada não pode ser cancelada. Faça um ajuste de estoque manual.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if op.status == 'CANCELADA':
            return Response({'erro': 'OP já está cancelada.'}, status=status.HTTP_400_BAD_REQUEST)

        motivo = request.data.get('motivo', '')
        op.status = 'CANCELADA'
        if motivo:
            op.observacoes = f'{op.observacoes or ""}\n[CANCELAMENTO] {motivo}'.strip()
        op.save(update_fields=['status', 'observacoes'])
        return Response({'mensagem': 'OP cancelada.', 'status': op.status})

    # ------------------------------------------------------------------
    # Ação: Prévia de custo / verificação de estoque (sem commit)
    # ------------------------------------------------------------------
    @action(detail=True, methods=['get'])
    def verificar_insumos(self, request, pk=None):
        op = self.get_object()
        composicao = ComposicaoProduto.objects.filter(
            produto_acabado=op.produto, ativo=True
        ).select_related('insumo')

        if not composicao.exists():
            return Response({'erro': 'Sem Ficha Técnica para este produto.'}, status=400)

        itens = []
        custo_estimado = Decimal('0.00')
        tudo_ok = True

        for item in composicao:
            qtd_necessaria = (
                item.quantidade_necessaria
                * op.quantidade_planejada
                * (1 + item.percentual_perda / Decimal('100'))
            ).quantize(Decimal('0.001'), rounding=ROUND_HALF_UP)

            estoque = Estoque.objects.filter(
                id_produto=item.insumo, id_deposito=op.deposito
            ).first()

            disponivel = estoque.quantidade if estoque else Decimal('0')
            custo_med = estoque.custo_medio if estoque else Decimal('0')
            ok = disponivel >= qtd_necessaria
            if not ok:
                tudo_ok = False

            custo_item = (qtd_necessaria * custo_med).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            custo_estimado += custo_item

            itens.append({
                'insumo_id': item.insumo.id_produto,
                'insumo_nome': item.insumo.nome_produto,
                'unidade': item.insumo.unidade_medida,
                'qtd_por_unidade': str(item.quantidade_necessaria),
                'percentual_perda': str(item.percentual_perda),
                'qtd_necessaria': str(qtd_necessaria),
                'qtd_disponivel': str(disponivel),
                'custo_medio': str(custo_med),
                'custo_item': str(custo_item),
                'ok': ok,
            })

        return Response({
            'tudo_ok': tudo_ok,
            'custo_estimado': str(custo_estimado),
            'custo_unitario_estimado': str(
                (custo_estimado / op.quantidade_planejada).quantize(Decimal('0.01'))
                if op.quantidade_planejada else '0.00'
            ),
            'itens': itens,
        })
