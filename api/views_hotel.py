"""
views_hotel.py — ViewSets para o módulo hoteleiro (PMS)
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from django.http import HttpResponse

from .models import Cliente, Produto, Venda, VendaItem, Operacao, Estoque
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

    @action(detail=True, methods=['get'])
    def imprimir_comprovante(self, request, pk=None):
        """Retorna uma página HTML formatada para impressão do comprovante de hospedagem."""
        from django.utils import timezone
        
        reserva = self.get_object()
        
        # Calcular diárias
        entrada_dt = reserva.data_checkin_real or reserva.data_entrada_prevista
        saida_dt = reserva.data_checkout_real or reserva.data_saida_prevista
        
        entrada_local = timezone.localtime(entrada_dt)
        saida_local = timezone.localtime(saida_dt)
        
        # Garantir pelo menos 1 diária se as datas forem no mesmo dia
        dias = max((saida_dt.date() - entrada_dt.date()).days, 1)
        
        hospede = reserva.hospede
        quarto = reserva.quarto
        
        # Montar a lista de consumos
        consumos_html = ""
        total_consumo = Decimal('0.00')
        for item in reserva.consumos.all():
            total_consumo += item.valor_total
            consumos_html += f"""
            <tr>
                <td>{item.produto.nome_produto}</td>
                <td style="text-align: center;">{item.quantidade}</td>
                <td style="text-align: right;">R$ {item.valor_unitario:.2f}</td>
                <td style="text-align: right;">R$ {item.valor_total:.2f}</td>
            </tr>
            """
            
        if not consumos_html:
            consumos_html = """
            <tr>
                <td colspan="4" style="text-align: center; color: #777; font-style: italic;">Nenhum consumo registrado</td>
            </tr>
            """
            
        total_diarias = reserva.valor_diaria_aplicada * dias
        total_consumo_dec = Decimal(str(total_consumo))
        total_diarias_dec = Decimal(str(total_diarias))
        total_geral = total_diarias_dec + total_consumo_dec
        
        status_colors = {
            'confirmada': '#f57c00',
            'checkin': '#0288d1',
            'finalizada': '#388e3c',
            'cancelada': '#d32f2f'
        }
        status_color = status_colors.get(reserva.status_reserva, '#757575')
        
        status_labels = {
            'confirmada': 'Confirmada',
            'checkin': 'Hospedagem Ativa (Check-in)',
            'finalizada': 'Finalizada (Check-out)',
            'cancelada': 'Cancelada'
        }
        status_label = status_labels.get(reserva.status_reserva, reserva.status_reserva.upper())
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Comprovante de Hospedagem - Reserva #{reserva.id_reserva}</title>
            <style>
                body {{
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                    background-color: #fafafa;
                }}
                .container {{
                    max-width: 800px;
                    margin: 0 auto;
                    background: #fff;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                    border: 1px solid #e0e0e0;
                }}
                .header {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #1976d2;
                    padding-bottom: 20px;
                    margin-bottom: 25px;
                }}
                .header-title h1 {{
                    margin: 0;
                    font-size: 24px;
                    color: #1976d2;
                }}
                .header-title p {{
                    margin: 5px 0 0 0;
                    color: #666;
                    font-size: 14px;
                }}
                .voucher-info {{
                    text-align: right;
                }}
                .voucher-info h2 {{
                    margin: 0;
                    font-size: 20px;
                    color: #333;
                }}
                .voucher-info p {{
                    margin: 5px 0 0 0;
                    font-size: 13px;
                    color: #888;
                }}
                .section {{
                    margin-bottom: 25px;
                }}
                .section-title {{
                    font-size: 16px;
                    font-weight: bold;
                    color: #1976d2;
                    margin-bottom: 12px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 5px;
                }}
                .grid-2 {{
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }}
                .info-item {{
                    font-size: 14px;
                    line-height: 1.5;
                }}
                .info-item strong {{
                    color: #555;
                }}
                .badge {{
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 4px;
                    color: #fff;
                    font-weight: bold;
                    font-size: 12px;
                    text-transform: uppercase;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }}
                th {{
                    background-color: #f5f5f5;
                    color: #555;
                    font-weight: bold;
                    text-align: left;
                    padding: 10px;
                    font-size: 13px;
                    border-bottom: 1px solid #ddd;
                }}
                td {{
                    padding: 10px;
                    font-size: 13px;
                    border-bottom: 1px solid #eee;
                }}
                .totals-box {{
                    margin-top: 20px;
                    background: #f9f9f9;
                    padding: 15px;
                    border-radius: 6px;
                    border: 1px solid #eee;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 5px;
                }}
                .totals-line {{
                    font-size: 14px;
                    color: #555;
                }}
                .totals-line.grand-total {{
                    font-size: 18px;
                    font-weight: bold;
                    color: #2e7d32;
                    margin-top: 5px;
                    border-top: 1px solid #ddd;
                    padding-top: 5px;
                    width: 250px;
                    text-align: right;
                }}
                .no-print-btn-container {{
                    text-align: center;
                    margin-bottom: 20px;
                }}
                .btn {{
                    background-color: #1976d2;
                    color: #fff;
                    border: none;
                    padding: 10px 20px;
                    font-size: 14px;
                    font-weight: bold;
                    border-radius: 4px;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: background-color 0.2s;
                }}
                .btn:hover {{
                    background-color: #115293;
                }}
                @media print {{
                    body {{
                        background-color: #fff;
                        padding: 0;
                    }}
                    .container {{
                        box-shadow: none;
                        border: none;
                        padding: 0;
                        max-width: 100%;
                    }}
                    .no-print-btn-container {{
                        display: none;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="no-print-btn-container">
                <button class="btn" onclick="window.print()">Imprimir Comprovante</button>
            </div>
            <div class="container">
                <div class="header">
                    <div class="header-title">
                        <h1>MÓDULO HOTELEIRO (PMS)</h1>
                        <p>Hotel Aperus ERP Integrado</p>
                    </div>
                    <div class="voucher-info">
                        <h2>Comprovante de Hospedagem</h2>
                        <p>Reserva: <strong>#{reserva.id_reserva}</strong></p>
                        <p>Data de Emissão: {timezone.localtime(timezone.now()).strftime('%d/%m/%Y %H:%M')}</p>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Dados do Hóspede</div>
                    <div class="grid-2">
                        <div class="info-item">
                            <strong>Nome/Razão Social:</strong> {hospede.nome_razao_social}<br>
                            <strong>CPF/CNPJ:</strong> {hospede.cpf_cnpj or 'Não informado'}<br>
                            <strong>Telefone:</strong> {hospede.telefone or 'Não informado'}
                        </div>
                        <div class="info-item">
                            <strong>E-mail:</strong> {hospede.email or 'Não informado'}<br>
                            <strong>Endereço:</strong> {f"{hospede.endereco or ''}, {hospede.numero or ''} - {hospede.bairro or ''}" if hospede.endereco else 'Não informado'}<br>
                            <strong>Cidade/UF:</strong> {f"{hospede.cidade or ''}/{hospede.estado or ''}" if hospede.cidade else 'Não informado'}
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Detalhes da Estada</div>
                    <div class="grid-2">
                        <div class="info-item">
                            <strong>Acomodação:</strong> Quarto {quarto.numero_quarto} ({quarto.tipo.nome})<br>
                            <strong>Status da Reserva:</strong> <span class="badge" style="background-color: {status_color};">{status_label}</span><br>
                            <strong>Valor da Diária:</strong> R$ {reserva.valor_diaria_aplicada:.2f}
                        </div>
                        <div class="info-item">
                            <strong>Check-in (Entrada):</strong> {entrada_local.strftime('%d/%m/%Y %H:%M')}<br>
                            <strong>Check-out (Saída):</strong> {saida_local.strftime('%d/%m/%Y %H:%M')}<br>
                            <strong>Total de Diárias:</strong> {dias} noite(s)
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Consumo de Produtos / Serviços</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item / Descrição</th>
                                <th style="text-align: center; width: 100px;">Qtd</th>
                                <th style="text-align: right; width: 120px;">Unitário</th>
                                <th style="text-align: right; width: 120px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consumos_html}
                        </tbody>
                    </table>
                </div>

                <div class="totals-box">
                    <div class="totals-line">Total Diárias ({dias}x R$ {reserva.valor_diaria_aplicada:.2f}): <strong>R$ {total_diarias:.2f}</strong></div>
                    <div class="totals-line">Total Consumo: <strong>R$ {total_consumo:.2f}</strong></div>
                    <div class="totals-line grand-total">Total Geral: R$ {total_geral:.2f}</div>
                </div>
            </div>
            <script>
                window.onload = function() {{
                    setTimeout(function() {{
                        window.print();
                    }}, 300);
                }};
            </script>
        </body>
        </html>
        """
        return HttpResponse(html_content, content_type='text/html')

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
            
        # Parâmetros opcionais para faturamento financeiro e descontos
        id_operacao = request.data.get('id_operacao')
        id_forma_pagamento = request.data.get('id_forma_pagamento')
        id_conta_cobranca = request.data.get('id_conta_cobranca')
        data_vencimento_str = request.data.get('data_vencimento')
        gerar_financeiro = request.data.get('gerar_financeiro', True)
        if isinstance(gerar_financeiro, str):
            gerar_financeiro = gerar_financeiro.lower() in ('true', '1', 'yes')

        tipo_desconto = request.data.get('tipo_desconto', 'VALOR')
        valor_desconto_input = request.data.get('valor_desconto', 0)
        try:
            valor_desconto_input = Decimal(str(valor_desconto_input or 0))
        except Exception:
            valor_desconto_input = Decimal('0.00')

        # Buscar Operacao de faturamento
        if id_operacao:
            try:
                operacao = Operacao.objects.get(pk=id_operacao)
            except Operacao.DoesNotExist:
                return Response({"error": "Operação de faturamento não encontrada."}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Pega a operação padrão de faturamento do usuário ou do sistema
            from api.models import UserParametros
            user_params = UserParametros.objects.filter(id_user=request.user).first()
            if user_params and user_params.id_operacao_hotel_checkout:
                operacao = user_params.id_operacao_hotel_checkout
            else:
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
            
            # Calcula o desconto aplicado
            discount_amount = Decimal('0.00')
            if valor_desconto_input > 0:
                if tipo_desconto == 'PERCENTUAL':
                    discount_amount = (total_geral * valor_desconto_input) / Decimal('100.00')
                else:  # VALOR
                    discount_amount = valor_desconto_input
                
                # Garante que o desconto não exceda o valor total geral
                if discount_amount > total_geral:
                    discount_amount = total_geral

            # Arredonda para 2 casas decimais
            discount_amount = discount_amount.quantize(Decimal('0.01'))
            total_faturado = (total_geral - discount_amount).quantize(Decimal('0.01'))
            
            # 2. Cria a Venda no Aperus
            venda = Venda.objects.create(
                id_operacao=operacao,
                id_cliente=reserva.hospede,
                valor_total=total_faturado,
                valor_desconto=discount_amount,
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
            "faturamento_total": total_faturado,
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
            # Tenta pegar o valor de venda da tabela estoque (Estoque)
            estoque_rec = Estoque.objects.filter(id_produto=produto, valor_venda__gt=0).order_by('-valor_venda').first()
            if estoque_rec:
                valor_unitario = estoque_rec.valor_venda
            else:
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

    @action(detail=True, methods=['post'])
    def gerar_nfce(self, request, pk=None):
        """
        Gera e emite a NFC-e (Cupom Fiscal) para os produtos da reserva.
        Verifica os parâmetros do usuário logado (Configurações > Usuário > NFCe).
        Exclui o valor da diária (DIARIA_HOTEL) e ajusta o financeiro proporcionalmente.
        """
        reserva = self.get_object()
        original_venda = reserva.venda
        
        if not original_venda:
            return Response(
                {"error": "Não há venda de faturamento gerada para esta reserva. Por favor, realize o check-out primeiro."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 1. Verificar se já existe uma NFC-e gerada a partir desta venda
        venda_nfce_existente = Venda.objects.filter(venda_futura_origem=original_venda).first()
        if venda_nfce_existente:
            # Tentar emitir novamente
            from api.services.nfce_service import NFCeService
            service = NFCeService()
            result = service.emitir_nfce(venda_nfce_existente)
            if 'mensagem' in result:
                result['message'] = result['mensagem']
            result['id_venda'] = venda_nfce_existente.id_venda
            status_code = status.HTTP_200_OK if result.get('sucesso') else status.HTTP_400_BAD_REQUEST
            return Response(result, status=status_code)
            
        # 2. Obter parâmetros do usuário
        from api.models import UserParametros
        user_params = UserParametros.objects.filter(id_user=request.user).first()
        operacao_nfce = None
        if user_params:
            operacao_nfce = user_params.id_operacao_hotel_nfce or user_params.id_operacao_nfce

        if not operacao_nfce:
            return Response(
                {"error": "Nenhuma operação de NFC-e de Hotelaria ou Geral configurada para o seu usuário. Acesse Configurações > Usuário > aba Hotelaria ou NFCe."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        vendedor_nfce = user_params.id_vendedor_nfce or original_venda.id_vendedor1
        cliente_nfce = user_params.id_cliente_nfce or original_venda.id_cliente
        
        # 3. Filtrar produtos (excluir diárias)
        items_original = VendaItem.objects.filter(id_venda=original_venda)
        items_produtos = [item for item in items_original if item.id_produto.codigo_produto != 'DIARIA_HOTEL']
        
        if not items_produtos:
            return Response(
                {"error": "Não há produtos de consumo nesta hospedagem para gerar NFC-e (diárias são consideradas serviço e foram desconsideradas)."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        total_produtos = sum(Decimal(str(item.valor_total)) for item in items_produtos)
        total_geral = Decimal(str(original_venda.valor_total))
        
        if total_geral > 0:
            ratio = (total_produtos / total_geral).quantize(Decimal('0.000001'))
        else:
            ratio = Decimal('1.000000')
            
        # 4. Criar NFC-e e ajustar financeiro
        from api.models import FinanceiroConta
        
        try:
            with transaction.atomic():
                venda_nfce = Venda.objects.create(
                    id_operacao=operacao_nfce,
                    id_cliente=cliente_nfce,
                    id_vendedor1=vendedor_nfce,
                    valor_total=total_produtos,
                    data_documento=timezone.now().date(),
                    origem='HOTEL_PMS',
                    status_pagamento=original_venda.status_pagamento,
                    venda_futura_origem=original_venda
                )
                
                # Duplicar itens de produto para a nova venda
                for item in items_produtos:
                    VendaItem.objects.create(
                        id_venda=venda_nfce,
                        id_produto=item.id_produto,
                        quantidade=item.quantidade,
                        valor_unitario=item.valor_unitario,
                        valor_total=item.valor_total
                    )
                    
                # Ajustar financeiro proporcionalmente
                financeiro_records = FinanceiroConta.objects.filter(id_venda_origem=original_venda.id_venda)
                
                for record in financeiro_records:
                    valor_parcela_original = Decimal(str(record.valor_parcela))
                    valor_liquidado_original = Decimal(str(record.valor_liquidado or 0.00))
                    
                    valor_nfce_val = (valor_parcela_original * ratio).quantize(Decimal('0.01'))
                    valor_diaria = valor_parcela_original - valor_nfce_val
                    
                    valor_liquidado_nfce = (valor_liquidado_original * ratio).quantize(Decimal('0.01'))
                    valor_liquidado_diaria = valor_liquidado_original - valor_liquidado_nfce
                    
                    if valor_nfce_val > 0:
                        FinanceiroConta.objects.create(
                            tipo_conta=record.tipo_conta,
                            id_cliente_fornecedor=cliente_nfce,
                            descricao=f"NFCe {venda_nfce.id_venda} - " + record.descricao,
                            valor_parcela=valor_nfce_val,
                            valor_liquidado=valor_liquidado_nfce,
                            valor_juros=record.valor_juros,
                            valor_multa=record.valor_multa,
                            valor_desconto=record.valor_desconto,
                            data_emissao=record.data_emissao,
                            data_vencimento=record.data_vencimento,
                            data_pagamento=record.data_pagamento,
                            status_conta=record.status_conta,
                            forma_pagamento=record.forma_pagamento,
                            id_venda_origem=venda_nfce.id_venda,
                            id_operacao=operacao_nfce,
                            id_departamento=record.id_departamento,
                            id_centro_custo=record.id_centro_custo,
                            id_conta_cobranca=record.id_conta_cobranca,
                            id_conta_baixa=record.id_conta_baixa,
                            documento_numero=record.documento_numero,
                            parcela_numero=record.parcela_numero,
                            parcela_total=record.parcela_total,
                            id_aluguel_origem=record.id_aluguel_origem,
                            gerencial=record.gerencial
                        )
                        
                    if valor_diaria > 0:
                        record.valor_parcela = valor_diaria
                        record.valor_liquidado = valor_liquidado_diaria
                        record.save()
                    else:
                        record.delete()
        except Exception as e:
            return Response(
                {"error": f"Erro interno ao processar a divisão financeira: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        # 5. Transmitir / Emitir NFC-e
        from api.services.nfce_service import NFCeService
        service = NFCeService()
        result = service.emitir_nfce(venda_nfce)
        if 'mensagem' in result:
            result['message'] = result['mensagem']
        result['id_venda'] = venda_nfce.id_venda
            
        status_code = status.HTTP_200_OK if result.get('sucesso') else status.HTTP_400_BAD_REQUEST
        return Response(result, status=status_code)

    @action(detail=False, methods=['get'])
    def relatorio(self, request):
        """
        Retorna os dados consolidados do relatório de hotelaria/hospedagem:
        KPIs: Receita de diárias, receita de consumos, total de noites vendidas, ADR, Taxa de Ocupação, Hóspedes Ativos.
        Lista de reservas filtradas com detalhes completos.
        """
        from django.db import models
        from django.db.models import Q
        import calendar
        from datetime import datetime, date

        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        quarto_id = request.query_params.get('quarto_id')
        status_reserva = request.query_params.get('status')

        hoje = timezone.localtime(timezone.now()).date()

        # Parse ou definição de datas padrões (mês atual)
        if data_inicio_str:
            try:
                data_inicio = datetime.strptime(data_inicio_str[:10], '%Y-%m-%d').date()
            except ValueError:
                data_inicio = hoje.replace(day=1)
        else:
            data_inicio = hoje.replace(day=1)

        if data_fim_str:
            try:
                data_fim = datetime.strptime(data_fim_str[:10], '%Y-%m-%d').date()
            except ValueError:
                data_fim = hoje
        else:
            data_fim = hoje

        # 1. Filtrar as reservas no período
        reservas_filtradas = Reserva.objects.all()

        # Aplicamos filtros de data (entrada ou checkin no período)
        reservas_filtradas = reservas_filtradas.filter(
            Q(data_checkin_real__date__range=(data_inicio, data_fim)) |
            Q(data_checkin_real__isnull=True, data_entrada_prevista__date__range=(data_inicio, data_fim))
        )

        if quarto_id:
            reservas_filtradas = reservas_filtradas.filter(quarto_id=quarto_id)

        if status_reserva and status_reserva != 'todos':
            reservas_filtradas = reservas_filtradas.filter(status_reserva=status_reserva)

        # 2. Calcular KPIs
        total_diarias_rev = Decimal('0.00')
        total_consumos_rev = Decimal('0.00')
        total_reservas_count = 0
        total_noites_sold = 0

        for r in reservas_filtradas:
            total_diarias_rev += r.total_diarias
            total_consumos_rev += r.total_consumo
            total_reservas_count += 1
            
            # Calcular noites totais dessa reserva
            entrada = r.data_checkin_real or r.data_entrada_prevista
            saida = r.data_checkout_real or r.data_saida_prevista
            if entrada and saida:
                dias = max((saida.date() - entrada.date()).days, 1)
                total_noites_sold += dias

        total_geral_rev = total_diarias_rev + total_consumos_rev
        adr = (total_diarias_rev / Decimal(total_noites_sold)) if total_noites_sold > 0 else Decimal('0.00')
        adr = adr.quantize(Decimal('0.01'))

        # 3. Taxa de Ocupação
        total_rooms = Quarto.objects.count()
        num_dias = max((data_fim - data_inicio).days + 1, 1)
        total_room_nights_available = total_rooms * num_dias

        # Calcular noites ocupadas dentro do período selecionado
        reservas_ocupacao = Reserva.objects.filter(
            status_reserva__in=['checkin', 'finalizada']
        ).filter(
            Q(data_checkin_real__date__lte=data_fim) &
            (Q(data_checkout_real__date__gte=data_inicio) | Q(data_checkout_real__isnull=True))
        )

        total_occupied_nights_in_period = 0
        for r in reservas_ocupacao:
            stay_start = (r.data_checkin_real or r.data_entrada_prevista).date()
            stay_end = (r.data_checkout_real or r.data_saida_prevista).date()
            
            overlap_start = max(data_inicio, stay_start)
            overlap_end = min(data_fim, stay_end)
            
            if overlap_end > overlap_start:
                total_occupied_nights_in_period += (overlap_end - overlap_start).days
            elif overlap_end == overlap_start:
                total_occupied_nights_in_period += 1

        if total_room_nights_available > 0:
            ocupacao_rate = (total_occupied_nights_in_period / total_room_nights_available) * 100
            ocupacao_rate = min(ocupacao_rate, 100.0)
        else:
            ocupacao_rate = 0.0

        # Hóspedes Ativos
        hospedes_ativos = Reserva.objects.filter(status_reserva='checkin').count()

        # 4. Serializar reservas filtradas
        reservas_serializadas = ReservaSerializer(reservas_filtradas, many=True).data

        return Response({
            "kpis": {
                "total_diarias": total_diarias_rev,
                "total_consumo": total_consumos_rev,
                "total_geral": total_geral_rev,
                "total_reservas": total_reservas_count,
                "total_noites_sold": total_noites_sold,
                "adr": adr,
                "taxa_ocupacao": round(ocupacao_rate, 2),
                "hospedes_ativos": hospedes_ativos
            },
            "reservas": reservas_serializadas,
            "periodo": {
                "data_inicio": data_inicio.isoformat(),
                "data_fim": data_fim.isoformat()
            }
        })

