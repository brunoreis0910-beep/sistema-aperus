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
