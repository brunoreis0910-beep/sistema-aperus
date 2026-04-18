"""
Consultor de Margem — Motor de Análise de Rentabilidade em Tempo Real
----------------------------------------------------------------------
Calcula a margem líquida de um item de venda considerando:
  - Custo médio do produto (estoque)
  - Desconto concedido pelo vendedor
  - Impostos do regime atual: ICMS, PIS, COFINS, IPI
  - Novos tributos 2026: IBS (estadual + municipal) e CBS
  - Forma de pagamento (taxa do cartão, custo do Pix, etc.)

Endpoint: POST /api/vendas/calcular-margem/
Uso: chamado pelo frontend a cada alteração de quantidade/desconto no item.
"""

from decimal import Decimal, ROUND_HALF_UP
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Produto


# ──────────────────────────────────────────────────────────────────────────────
# Thresholds de alerta (podem vir de EmpresaConfig no futuro)
# ──────────────────────────────────────────────────────────────────────────────
MARGEM_CRITICA   = Decimal('5.00')   # Vermelho  — abaixo disso está pagando para vender
MARGEM_ATENCAO   = Decimal('15.00')  # Amarelo   — margem baixa, cuidado
MARGEM_SAUDAVEL  = Decimal('30.00')  # Verde escuro — margem confortável


def _d(value, default=Decimal('0')):
    """Converte qualquer valor para Decimal de forma segura."""
    try:
        return Decimal(str(value or 0))
    except Exception:
        return default


class ConsultorMargemView(APIView):
    """
    POST /api/vendas/calcular-margem/

    Body esperado:
    {
        "id_produto": 123,
        "quantidade": 5,
        "valor_unitario": 89.90,       // preço cobrado (já com desconto ou sem)
        "desconto_valor": 10.00,        // desconto em R$ por unidade (opcional)
        "desconto_perc": 11.12,         // desconto em % (opcional, calculado se não enviado)
        "uf_destino": "MG",             // para buscar alíquota IBS estadual correta
        "forma_pagamento": "CARTAO",    // DINHEIRO | PIX | CARTAO | BOLETO (para taxa)
        "taxa_forma_pagamento": 2.5     // % da taxa (ex: 2.5 para cartão) — opcional
    }

    Retorna:
    {
        "margem_perc": 18.50,
        "margem_valor": 9.25,           // em R$ por unidade
        "custo_total_unitario": 45.00,  // custo + impostos por unidade
        "breakdown": {
            "preco_venda_liquido": 79.90,
            "custo_produto": 45.00,
            "icms_valor": 10.79,
            "pis_cofins_valor": 3.67,
            "ibs_valor": 2.40,
            "cbs_valor": 4.80,
            "taxa_pagamento_valor": 2.00,
        },
        "alerta": {
            "nivel": "AMARELO",          // VERDE | AMARELO | VERMELHO | CRITICO
            "mensagem": "Com esse desconto e alíquota CBS de 8.8%, sua margem líquida caiu para 18.5%. Atenção!",
            "sugestao": "Desconto máximo sugerido para manter 30% de margem: 5.2%"
        }
    }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data

        id_produto          = data.get('id_produto')
        quantidade          = _d(data.get('quantidade', 1))
        valor_unitario      = _d(data.get('valor_unitario', 0))
        desconto_valor      = _d(data.get('desconto_valor', 0))
        uf_destino          = data.get('uf_destino', 'MG')
        forma_pagamento     = data.get('forma_pagamento', 'DINHEIRO').upper()
        taxa_forma_perc     = _d(data.get('taxa_forma_pagamento', 0))

        if not id_produto:
            return Response({'erro': 'id_produto obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            produto = Produto.objects.select_related('tributacao_detalhada').get(pk=id_produto)
        except Produto.DoesNotExist:
            return Response({'erro': 'Produto não encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # ── 1. Custo ──────────────────────────────────────────────────────────
        # Busca custo médio atual do estoque (modelo Estoque tem custo_medio)
        custo_produto = _d(0)
        try:
            from .models import Estoque
            estoque_item = Estoque.objects.filter(id_produto=produto).order_by('-id_estoque').first()
            if estoque_item and estoque_item.custo_medio:
                custo_produto = _d(estoque_item.custo_medio)
        except Exception:
            pass

        # ── 2. Preço de venda líquido (após desconto por unidade) ─────────────
        preco_liquido = valor_unitario - desconto_valor
        if preco_liquido <= 0:
            return Response({'erro': 'Preço de venda após desconto deve ser positivo'}, status=status.HTTP_400_BAD_REQUEST)

        desconto_perc = (desconto_valor / valor_unitario * 100) if valor_unitario > 0 else _d(0)

        # ── 3. Impostos sobre o preço de venda ───────────────────────────────
        trib = getattr(produto, 'tributacao_detalhada', None)

        icms_aliq      = _d(trib.icms_aliquota    if trib else 0)
        pis_aliq       = _d(trib.pis_aliquota     if trib else 0)
        cofins_aliq    = _d(trib.cofins_aliquota  if trib else 0)
        ipi_aliq       = _d(trib.ipi_aliquota     if trib else 0)
        ibs_aliq       = _d(trib.ibs_aliquota     if trib else 0)
        cbs_aliq       = _d(trib.cbs_aliquota     if trib else 0)
        is_aliq        = _d(trib.imposto_seletivo_aliquota if trib else 0)

        # ── 4. Cálculo dos valores de imposto por unidade ─────────────────────
        # ICMS — calculado sobre o preço de saída (por dentro)
        icms_valor       = (preco_liquido * icms_aliq   / 100).quantize(Decimal('0.01'))
        pis_cofins_valor = (preco_liquido * (pis_aliq + cofins_aliq) / 100).quantize(Decimal('0.01'))
        ipi_valor        = (preco_liquido * ipi_aliq    / 100).quantize(Decimal('0.01'))

        # IBS/CBS — Reforma 2026 (calculados sobre base reduzida se houver)
        # Busca regra de reforma ativa pela vigência
        reducao_bc = Decimal('0')
        try:
            from .models import RegraFiscalReforma
            import datetime
            hoje = datetime.date.today()
            regra = RegraFiscalReforma.objects.filter(
                ativo=True,
                uf_destino=uf_destino,
                ncm_prefixo__in=(
                    [produto.ncm[:i] for i in range(2, 9) if produto.ncm]
                    + ([produto.ncm] if produto.ncm else [])
                ),
                vigencia_inicio__lte=hoje,
            ).filter(
                Q(vigencia_fim__isnull=True) | Q(vigencia_fim__gte=hoje)
            ).order_by('-ncm_prefixo').first()
        except Exception:
            regra = None

        # Fallback seguro: apenas usa as alíquotas da TributacaoProduto
        if regra:
            reducao_bc   = _d(regra.reducao_bc_perc)
            ibs_aliq     = _d(regra.aliquota_ibs_estadual) + _d(regra.aliquota_ibs_municipal)
            cbs_aliq     = _d(regra.aliquota_cbs)
            is_aliq      = _d(regra.aliquota_is)

        bc_reforma   = preco_liquido * (1 - reducao_bc / 100)
        ibs_valor    = (bc_reforma * ibs_aliq / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        cbs_valor    = (bc_reforma * cbs_aliq / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        is_valor     = (bc_reforma * is_aliq  / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        # ── 5. Taxa da forma de pagamento ────────────────────────────────────
        if taxa_forma_perc == 0:
            TAXAS_PADRAO = {
                'CARTAO': Decimal('2.5'),
                'PIX':    Decimal('0.99'),
                'BOLETO': Decimal('1.5'),
                'DINHEIRO': Decimal('0'),
            }
            taxa_forma_perc = TAXAS_PADRAO.get(forma_pagamento, Decimal('0'))

        taxa_pagamento_valor = (preco_liquido * taxa_forma_perc / 100).quantize(Decimal('0.01'))

        # ── 6. Custo total do item (custo + todos os impostos + taxa pgto) ────
        total_impostos   = icms_valor + pis_cofins_valor + ipi_valor + ibs_valor + cbs_valor + is_valor
        custo_total      = custo_produto + total_impostos + taxa_pagamento_valor

        # ── 7. Margem ─────────────────────────────────────────────────────────
        margem_valor = preco_liquido - custo_total
        margem_perc  = (margem_valor / preco_liquido * 100).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        ) if preco_liquido > 0 else Decimal('0')

        # ── 8. Desconto máximo para manter margem saudável ───────────────────
        # preco_liquido_ideal = custo_total / (1 - margem_saudavel/100)
        # desconto_max = ((valor_unitario - preco_liquido_ideal) / valor_unitario) * 100
        try:
            preco_minimo_saudavel = custo_total / (1 - MARGEM_SAUDAVEL / 100)
            desconto_max_saudavel = max(
                Decimal('0'),
                ((valor_unitario - preco_minimo_saudavel) / valor_unitario * 100).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
            )
        except Exception:
            desconto_max_saudavel = Decimal('0')

        # ── 9. Nível de alerta e mensagem ─────────────────────────────────────
        nivel, mensagem, sugestao = _gerar_alerta(
            margem_perc, desconto_perc, cbs_aliq, ibs_aliq,
            desconto_max_saudavel, custo_produto, preco_liquido
        )

        return Response({
            'margem_perc':          float(margem_perc),
            'margem_valor':         float(margem_valor),
            'custo_total_unitario': float(custo_total),
            'breakdown': {
                'preco_venda_bruto':    float(valor_unitario),
                'desconto_valor':       float(desconto_valor),
                'desconto_perc':        float(desconto_perc.quantize(Decimal('0.01'))),
                'preco_venda_liquido':  float(preco_liquido),
                'custo_produto':        float(custo_produto),
                'icms_valor':           float(icms_valor),
                'pis_cofins_valor':     float(pis_cofins_valor),
                'ipi_valor':            float(ipi_valor),
                'ibs_valor':            float(ibs_valor),
                'cbs_valor':            float(cbs_valor),
                'is_valor':             float(is_valor),
                'taxa_pagamento_valor': float(taxa_pagamento_valor),
                'total_impostos':       float(total_impostos),
            },
            'alerta': {
                'nivel':    nivel,
                'mensagem': mensagem,
                'sugestao': sugestao,
            }
        })


def _gerar_alerta(margem_perc, desconto_perc, cbs_aliq, ibs_aliq,
                  desconto_max_saudavel, custo_produto, preco_liquido):
    """Determina o nível e texto do alerta de margem."""

    if margem_perc <= 0:
        nivel = 'CRITICO'
        mensagem = (
            f'⛔ Atenção: você está PAGANDO para vender este item! '
            f'Margem atual: {margem_perc}%. O preço não cobre o custo + impostos.'
        )
        sugestao = 'Remova o desconto ou revise o preço de venda.'

    elif margem_perc < MARGEM_CRITICA:
        nivel = 'VERMELHO'
        cbs_txt = f'CBS {cbs_aliq}%' if cbs_aliq > 0 else ''
        ibs_txt = f'IBS {ibs_aliq}%' if ibs_aliq > 0 else ''
        trib_txt = ' e '.join(filter(None, [cbs_txt, ibs_txt]))
        mensagem = (
            f'🔴 Com esse desconto{f" e {trib_txt}" if trib_txt else ""}, '
            f'sua margem líquida caiu para {margem_perc}%. '
            f'Você está quase pagando para vender.'
        )
        sugestao = (
            f'Desconto máximo para manter margem saudável ({MARGEM_SAUDAVEL}%): '
            f'{desconto_max_saudavel}%.'
        )

    elif margem_perc < MARGEM_ATENCAO:
        nivel = 'AMARELO'
        mensagem = (
            f'🟡 Margem baixa: {margem_perc}%. '
            f'Verifique se o desconto concedido é necessário para este cliente.'
        )
        sugestao = (
            f'Desconto máximo sugerido para manter {MARGEM_SAUDAVEL}% de margem: '
            f'{desconto_max_saudavel}%.'
        )

    elif margem_perc < MARGEM_SAUDAVEL:
        nivel = 'ATENCAO'
        mensagem = f'🟠 Margem de {margem_perc}% — dentro do aceitável, mas abaixo da meta de {MARGEM_SAUDAVEL}%.'
        sugestao = f'Desconto máximo para {MARGEM_SAUDAVEL}%: {desconto_max_saudavel}%.'

    else:
        nivel = 'VERDE'
        mensagem = f'✅ Margem saudável: {margem_perc}%.'
        sugestao = ''

    return nivel, mensagem, sugestao
