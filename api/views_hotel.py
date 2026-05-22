"""
views_hotel.py — ViewSets para o módulo hoteleiro (PMS)
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from decimal import Decimal

from .models import Cliente, Produto, Venda, VendaItem, Operacao
from .models_hotel import TipoQuarto, Quarto, Reserva, ConsumoQuarto, Comodidade
from .serializers_hotel import TipoQuartoSerializer, QuartoSerializer, ReservaSerializer, ConsumoQuartoSerializer, ComodidadeSerializer

class ComodidadeViewSet(viewsets.ModelViewSet):
    queryset = Comodidade.objects.all()
    serializer_class = ComodidadeSerializer
    permission_classes = []
    pagination_class = None

class TipoQuartoViewSet(viewsets.ModelViewSet):
    queryset = TipoQuarto.objects.all()
    serializer_class = TipoQuartoSerializer
    permission_classes = []
    pagination_class = None

class QuartoViewSet(viewsets.ModelViewSet):
    queryset = Quarto.objects.all()
    serializer_class = QuartoSerializer
    permission_classes = []
    pagination_class = None

    @action(detail=True, methods=['post'])
    def alterar_status(self, request, pk=None):
        """Altera rapidamente o status de limpeza ou ocupação de um quarto."""
        quarto = self.get_object()
        novo_status = request.data.get('status')
        
        if not novo_status or len(novo_status) > 20:
            return Response(
                {"error": "Status inválido. Deve ser uma string não vazia de até 20 caracteres."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        quarto.status_atual = novo_status
        quarto.save()
        return Response(self.get_serializer(quarto).data)

class ConsumoQuartoViewSet(viewsets.ModelViewSet):
    queryset = ConsumoQuarto.objects.all()
    serializer_class = ConsumoQuartoSerializer
    permission_classes = []
    pagination_class = None

class ReservaViewSet(viewsets.ModelViewSet):
    queryset = Reserva.objects.all()
    serializer_class = ReservaSerializer
    permission_classes = []
    pagination_class = None

    @action(detail=True, methods=['post'])
    def checkin(self, request, pk=None):
        """Realiza o check-in da reserva."""
        reserva = self.get_object()
        
        if reserva.status_reserva != 'confirmada':
            return Response(
                {"error": f"Não é possível fazer check-in de uma reserva com status '{reserva.get_status_reserva_display()}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        with transaction.atomic():
            reserva.data_checkin_real = timezone.now()
            reserva.status_reserva = 'checkin'
            reserva.save()
            
            # Atualiza status do quarto para ocupado
            quarto = reserva.quarto
            quarto.status_atual = 'ocupado'
            quarto.save()
            
        return Response(self.get_serializer(reserva).data)

    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        """Realiza o check-out, calcula valores e gera faturamento/venda no Aperus."""
        reserva = self.get_object()
        
        if reserva.status_reserva != 'checkin':
            return Response(
                {"error": "Só é possível realizar checkout de hospedagens ativas (check-in realizado)."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Parâmetros opcionais para faturamento financeiro
        id_operacao = request.data.get('id_operacao')
        id_forma_pagamento = request.data.get('id_forma_pagamento')
        id_conta_cobranca = request.data.get('id_conta_cobranca')
        data_vencimento_str = request.data.get('data_vencimento')
        gerar_financeiro = request.data.get('gerar_financeiro', True)
        if isinstance(gerar_financeiro, str):
            gerar_financeiro = gerar_financeiro.lower() in ('true', '1', 'yes')

        # Buscar Operacao de faturamento
        if id_operacao:
            try:
                operacao = Operacao.objects.get(pk=id_operacao)
            except Operacao.DoesNotExist:
                return Response({"error": "Operação de faturamento não encontrada."}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Pega a operação padrão de faturamento (ou cria/busca uma padrão de Venda)
            operacao = Operacao.objects.filter(transacao='Saida', gera_financeiro=1).first() or \
                       Operacao.objects.filter(transacao='Venda').first()
            if not operacao:
                # Caso não exista nenhuma operação, cria uma simples de teste
                operacao, _ = Operacao.objects.get_or_create(
                    nome_operacao='Venda Balcão Hotel',
                    defaults={
                        'transacao': 'Venda',
                        'empresa': 'Hotel Aperus',
                        'gera_financeiro': 1
                    }
                )

        # Definir data de vencimento e se será baixa automática
        today = timezone.now().date()
        if data_vencimento_str:
            from django.utils.dateparse import parse_date
            data_venc = parse_date(data_vencimento_str[:10])
            if not data_venc:
                try:
                    from datetime import datetime
                    data_venc = datetime.fromisoformat(data_vencimento_str[:10]).date()
                except Exception:
                    data_venc = today
        else:
            data_venc = today

        # Se data de vencimento é hoje, força a baixa automática
        baixa_automatica = (data_venc == today)

        # Garante o produto da Diária
        produto_diaria, _ = Produto.objects.get_or_create(
            codigo_produto='DIARIA_HOTEL',
            defaults={
                'nome_produto': 'Diária de Hospedagem',
                'unidade_medida': 'UN',
                'descricao': 'Faturamento automático de diárias do módulo PMS'
            }
        )

        with transaction.atomic():
            # 1. Calcula datas e diárias reais
            reserva.data_checkout_real = timezone.now()
            reserva.status_reserva = 'finalizada'
            
            total_diarias = reserva.total_diarias
            total_consumo = reserva.total_consumo
            total_geral = reserva.total_geral
            
            # 2. Cria a Venda no Aperus
            venda = Venda.objects.create(
                id_operacao=operacao,
                id_cliente=reserva.hospede,
                valor_total=total_geral,
                data_documento=timezone.now().date(),
                origem='HOTEL_PMS',
                status_pagamento='PENDENTE'
            )
            
            # 3. Lança o Item da Diária na Venda
            # Calcula o número de diárias
            entrada = reserva.data_checkin_real or reserva.data_entrada_prevista
            saida = reserva.data_checkout_real
            dias = max((saida.date() - entrada.date()).days, 1)
            
            VendaItem.objects.create(
                id_venda=venda,
                id_produto=produto_diaria,
                quantidade=Decimal(dias),
                valor_unitario=reserva.valor_diaria_aplicada,
                valor_total=total_diarias
            )
            
            # 4. Transfere os Consumos do Quarto para Itens da Venda
            for consumo in reserva.consumos.all():
                VendaItem.objects.create(
                    id_venda=venda,
                    id_produto=consumo.produto,
                    quantidade=consumo.quantidade,
                    valor_unitario=consumo.valor_unitario,
                    valor_total=consumo.valor_total
                )
                
            # 5. Salva a relação da venda na reserva
            reserva.venda = venda
            reserva.save()
            
            # 6. Gera lançamento financeiro (se habilitado)
            financeiro_criado = False
            financeiro_id = None
            if gerar_financeiro:
                from .services.venda_financeiro import ensure_financeiro_for_venda
                payload_fin = {
                    'id_forma_pagamento': id_forma_pagamento,
                    'vencimento': data_venc.isoformat(),
                    'id_conta_cobranca': id_conta_cobranca,
                    'criar_financeiro': True,
                    'baixa_automatica': baixa_automatica
                }
                created, fin_pk, err = ensure_financeiro_for_venda(venda, payload=payload_fin, force=True)
                if err:
                    raise Exception(f"Erro ao gerar lançamento financeiro: {err}")
                else:
                    financeiro_criado = created
                    financeiro_id = fin_pk
            
            # 7. Atualiza o status do quarto para sujo (governança)
            quarto = reserva.quarto
            quarto.status_atual = 'sujo'
            quarto.save()
            
        return Response({
            "message": "Checkout finalizado com sucesso!",
            "reserva": self.get_serializer(reserva).data,
            "venda_id": venda.id_venda,
            "faturamento_total": total_geral,
            "financeiro_criado": financeiro_criado,
            "financeiro_id": financeiro_id
        })

    @action(detail=True, methods=['post'])
    def lancar_consumo(self, request, pk=None):
        """Lança consumo rápido de produtos para a reserva ativa."""
        reserva = self.get_object()
        
        if reserva.status_reserva != 'checkin':
            return Response(
                {"error": "Só é possível lançar consumo para hospedagens ativas (check-in realizado)."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        produto_id = request.data.get('produto_id')
        quantidade = Decimal(str(request.data.get('quantidade', 1)))
        
        try:
            produto = Produto.objects.get(pk=produto_id)
        except Produto.DoesNotExist:
            return Response({"error": "Produto não encontrado."}, status=status.HTTP_404_NOT_FOUND)
            
        # Pega preço do produto, busca valor padrão de venda ou usa 0.00
        # No Aperus, o preço do produto pode vir de tabelas comerciais ou direto do produto.
        # Caso o produto não possua preco_venda direto, pegamos um default de 0.00 ou do payload
        valor_unitario = request.data.get('valor_unitario')
        if not valor_unitario:
            # Tenta pegar preco_web ou similar
            valor_unitario = produto.preco_web or Decimal('0.00')
        else:
            valor_unitario = Decimal(str(valor_unitario))
            
        with transaction.atomic():
            consumo = ConsumoQuarto.objects.create(
                reserva=reserva,
                produto=produto,
                quantidade=quantidade,
                valor_unitario=valor_unitario,
                observacao=request.data.get('observacao', '')
            )
            
        return Response(ConsumoQuartoSerializer(consumo).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def mapa_ocupacao(self, request):
        """Retorna uma matriz de ocupação filtrada por intervalo de datas."""
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        
        if not data_inicio_str or not data_fim_str:
            # Defaults: mês atual
            hoje = timezone.now().date()
            data_inicio = hoje.replace(day=1)
            # Fim do mês atual
            import calendar
            _, ultimo_dia = calendar.monthrange(hoje.year, hoje.month)
            data_fim = hoje.replace(day=ultimo_dia)
        else:
            try:
                from django.utils.dateparse import parse_date
                data_inicio = parse_date(data_inicio_str)
                data_fim = parse_date(data_fim_str)
            except ValueError:
                return Response({"error": "Datas em formato inválido. Use AAAA-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
                
        from django.db.models import Q
        # Busca todas as reservas ativas ou planejadas no período
        reservas = Reserva.objects.filter(
            ~Q(status_reserva='cancelada') & ~Q(status_reserva='noshow')
        ).filter(
            # Caso 1: Sobreposição do período previsto
            Q(data_entrada_prevista__date__lte=data_fim, data_saida_prevista__date__gte=data_inicio) |
            # Caso 2: Hospedagem ativa (check-in realizado) que começou antes ou durante o período e ainda não foi encerrada
            Q(status_reserva='checkin', data_entrada_prevista__date__lte=data_fim) |
            # Caso 3: Hospedagem finalizada cuja data de check-out real foi durante ou depois do início
            Q(status_reserva='finalizada', data_checkin_real__date__lte=data_fim, data_checkout_real__date__gte=data_inicio)
        )
        
        quartos = Quarto.objects.all()
        quartos_data = QuartoSerializer(quartos, many=True).data
        
        reservas_list = []
        for r in reservas:
            reservas_list.append({
                "id_reserva": r.id_reserva,
                "quarto_id": r.quarto.id_quarto,
                "quarto_numero": r.quarto.numero_quarto,
                "hospede_nome": r.hospede.nome_razao_social,
                "data_entrada": r.data_entrada_prevista.isoformat(),
                "data_saida": r.data_saida_prevista.isoformat(),
                "status_reserva": r.status_reserva,
                "status_display": r.get_status_reserva_display(),
                "total_geral": r.total_geral
            })
            
        return Response({
            "data_inicio": data_inicio.isoformat(),
            "data_fim": data_fim.isoformat(),
            "quartos": quartos_data,
            "reservas": reservas_list
        })
