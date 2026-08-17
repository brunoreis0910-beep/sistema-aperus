# -*- coding: utf-8 -*-
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection


# ─────────────────────────────────────────────────────────────────────────────
# PESQUISA DE VENDAS / COMPRAS PARA DEVOLUÇÃO
# Endpoints com filtro por período, cliente/fornecedor, número de nota e chave
# Suporta paginação (page / page_size) para lazy-loading
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pesquisar_vendas_para_devolucao(request):
    """
    Pesquisa vendas/cupons emitidos disponíveis para devolução.

    Query params:
      - search         : busca ampla — nome do cliente, número da nota, chave NF-e
                         ou CPF/CNPJ do cliente (aceita com ou sem pontuação)
      - chave          : chave de acesso exata (44 dígitos) — busca direta
      - numero         : número do cupom/nota exato
      - id_cliente     : filtrar por cliente cadastrado (opcional)
      - data_inicio    : YYYY-MM-DD  (padrão: últimos 90 dias se nenhum filtro)
      - data_fim       : YYYY-MM-DD
      - status_nfe     : padrão EMITIDA (valor gravado após autorização SEFAZ)
      - modelo         : 55=NF-e, 65=NFC-e, vazio=ambos
      - page           : página (padrão 1)
      - page_size      : registros por página (padrão 25, máx 100)
    """
    import re as _re
    try:
        search     = request.query_params.get('search', '').strip()
        chave      = request.query_params.get('chave', '').strip()
        numero     = request.query_params.get('numero', '').strip()
        id_cliente = request.query_params.get('id_cliente', '').strip()
        data_inicio = request.query_params.get('data_inicio', '')
        data_fim    = request.query_params.get('data_fim', '')
        status_nfe  = request.query_params.get('status_nfe', 'EMITIDA')
        modelo      = request.query_params.get('modelo', '')  # '55', '65' ou ''
        try:
            page      = max(1, int(request.query_params.get('page', 1)))
            page_size = min(100, max(1, int(request.query_params.get('page_size', 25))))
        except (ValueError, TypeError):
            page, page_size = 1, 25

        offset = (page - 1) * page_size

        has_filter = any([search, chave, numero, id_cliente, data_inicio, data_fim])

        where_parts = []
        params = []

        # ── Período ───────────────────────────────────────────────────────────
        if data_inicio:
            where_parts.append("v.data_documento >= %s")
            params.append(data_inicio)
        elif not has_filter:
            # sem filtro algum → últimos 90 dias para performance
            where_parts.append("v.data_documento >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)")

        if data_fim:
            where_parts.append("v.data_documento <= %s")
            params.append(data_fim + ' 23:59:59')

        # ── Status NF-e ───────────────────────────────────────────────────────
        if status_nfe:
            where_parts.append("v.status_nfe = %s")
            params.append(status_nfe)

        # ── Modelo documento (55=NF-e, 65=NFC-e) ─────────────────────────────
        if modelo:
            where_parts.append("o.modelo_documento = %s")
            params.append(modelo)

        # ── Filtro por cliente cadastrado ─────────────────────────────────────
        if id_cliente:
            where_parts.append("v.id_cliente = %s")
            params.append(id_cliente)

        # ── Chave de acesso exata ─────────────────────────────────────────────
        if chave:
            chave_limpa = _re.sub(r'\D', '', chave)
            where_parts.append("v.chave_nfe = %s")
            params.append(chave_limpa)

        # ── Número do cupom/nota exato ────────────────────────────────────────
        if numero:
            where_parts.append("(v.numero_documento = %s OR CAST(v.numero_nfe AS CHAR) = %s)")
            params.extend([numero, numero])

        # ── Busca textual ampla ───────────────────────────────────────────────
        if search:
            cpf_limpo = _re.sub(r'\D', '', search)
            # Busca por: nome do cliente, CPF/CNPJ (com ou sem pontuação),
            # número da nota, chave NF-e
            if cpf_limpo and len(cpf_limpo) >= 8:
                # provável CPF/CNPJ — busca exata no cadastro de clientes
                where_parts.append(
                    "(c.nome_razao_social LIKE %s OR c.cpf_cnpj LIKE %s "
                    "OR v.numero_documento LIKE %s "
                    "OR v.chave_nfe LIKE %s OR CAST(v.numero_nfe AS CHAR) LIKE %s)"
                )
                like = f"%{search}%"
                like_cpf = f"%{cpf_limpo}%"
                params.extend([like, like_cpf, like, like, like])
            else:
                where_parts.append(
                    "(c.nome_razao_social LIKE %s OR v.numero_documento LIKE %s "
                    "OR v.chave_nfe LIKE %s OR CAST(v.numero_nfe AS CHAR) LIKE %s)"
                )
                like = f"%{search}%"
                params.extend([like, like, like, like])

        # ── Filtro: excluir vendas totalmente devolvidas (valor devolvido >= valor total)
        saldo_filter_venda = """
        (
            v.chave_nfe IS NULL
            OR COALESCE((
                SELECT SUM(vi.valor_total) FROM venda_itens vi WHERE vi.id_venda = v.id_venda
            ), 0) = 0
            OR COALESCE((
                SELECT SUM(vi_dev.valor_total)
                FROM vendas dv
                JOIN operacoes dop ON dv.id_operacao = dop.id_operacao
                JOIN venda_itens vi_dev ON vi_dev.id_venda = dv.id_venda
                WHERE dv.chave_nfe_referenciada = v.chave_nfe
                  AND dop.transacao = 'Devolucao'
                  AND UPPER(dop.nome_operacao) NOT LIKE '%%COMPRA%%'
                  AND dv.status_nfe != 'CANCELADA'
            ), 0) < COALESCE((
                SELECT SUM(vi.valor_total) FROM venda_itens vi WHERE vi.id_venda = v.id_venda
            ), 0)
        )
        """
        where_parts.append(saldo_filter_venda)

        where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

        join_operacao = "LEFT JOIN operacoes o ON v.id_operacao = o.id_operacao"

        count_sql = f"""
            SELECT COUNT(*) FROM vendas v
            LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
            {join_operacao}
            {where_sql}
        """
        query_sql = f"""
            SELECT
                v.id_venda,
                v.numero_documento,
                v.numero_nfe,
                v.serie_nfe,
                v.chave_nfe,
                v.data_documento,
                v.status_nfe,
                v.id_cliente,
                COALESCE(c.nome_razao_social, 'Consumidor') AS nome_cliente,
                COALESCE(c.cpf_cnpj, '') AS cpf_cnpj_cliente,
                COALESCE(
                    (SELECT SUM(vi.valor_total) FROM venda_itens vi WHERE vi.id_venda = v.id_venda),
                    0
                ) AS valor_total,
                COALESCE(o.modelo_documento, '') AS modelo_documento,
                COALESCE((
                    SELECT SUM(vi_dev.valor_total)
                    FROM vendas dv
                    JOIN operacoes dop ON dv.id_operacao = dop.id_operacao
                    JOIN venda_itens vi_dev ON vi_dev.id_venda = dv.id_venda
                    WHERE dv.chave_nfe_referenciada = v.chave_nfe
                      AND dop.transacao = 'Devolucao'
                      AND UPPER(dop.nome_operacao) NOT LIKE '%%COMPRA%%'
                      AND dv.status_nfe != 'CANCELADA'
                ), 0) AS valor_devolvido
            FROM vendas v
            LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
            {join_operacao}
            {where_sql}
            ORDER BY v.data_documento DESC, v.id_venda DESC
            LIMIT %s OFFSET %s
        """

        with connection.cursor() as cursor:
            cursor.execute(count_sql, params)
            total = cursor.fetchone()[0]

            cursor.execute(query_sql, params + [page_size, offset])
            rows = cursor.fetchall()

        vendas = []
        for row in rows:
            valor_total = float(row[10])
            valor_devolvido = float(row[12])
            vendas.append({
                'id_venda'                : row[0],
                'numero_documento'        : row[1],
                'numero_nfe'              : row[2],
                'serie_nfe'               : row[3],
                'chave_nfe'               : row[4],
                'data_documento'          : row[5].isoformat() if row[5] else None,
                'status_nfe'              : row[6],
                'id_cliente'              : row[7],
                'nome_cliente'            : row[8] or 'Consumidor',
                'cpf_cnpj_cliente'        : row[9] or '',
                'valor_total'             : valor_total,
                'modelo_documento'        : row[11],
                'valor_devolvido'         : valor_devolvido,
                'ja_devolvida_parcialmente': valor_devolvido > 0,
            })

        return Response({
            'count'    : total,
            'page'     : page,
            'page_size': page_size,
            'num_pages': max(1, (total + page_size - 1) // page_size),
            'results'  : vendas,
        })

    except Exception as e:
        return Response(
            {'error': f'Erro ao pesquisar vendas: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pesquisar_compras_para_devolucao(request):
    """
    Pesquisa compras disponíveis para devolução ao fornecedor.

    Query params:
      - search         : filtra por nome do fornecedor ou número da nota
      - data_inicio    : YYYY-MM-DD  (padrão: últimos 60 dias)
      - data_fim       : YYYY-MM-DD
      - page           : página (padrão 1)
      - page_size      : registros por página (padrão 25, máx 100)
    """
    try:
        search = request.query_params.get('search', '').strip()
        data_inicio = request.query_params.get('data_inicio', '')
        data_fim = request.query_params.get('data_fim', '')
        try:
            page = max(1, int(request.query_params.get('page', 1)))
            page_size = min(100, max(1, int(request.query_params.get('page_size', 25))))
        except (ValueError, TypeError):
            page, page_size = 1, 25

        offset = (page - 1) * page_size

        where_parts = []
        params = []

        # ── Período — usando coluna correta data_movimento_entrada ────────────
        if data_inicio:
            where_parts.append("c.data_movimento_entrada >= %s")
            params.append(data_inicio)
        else:
            where_parts.append("c.data_movimento_entrada >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)")

        if data_fim:
            where_parts.append("c.data_movimento_entrada <= %s")
            params.append(data_fim + ' 23:59:59')

        if search:
            where_parts.append(
                "(f.nome_razao_social LIKE %s OR c.numero_nota LIKE %s)"
            )
            like = f"%{search}%"
            params.extend([like, like])

        # ── Filtro: excluir compras totalmente devolvidas (valor devolvido >= valor total)
        saldo_filter = """
        (
            c.chave_nfe IS NULL
            OR COALESCE(c.valor_total_nota, 0) = 0
            OR COALESCE((
                SELECT SUM(vi_dev.valor_total)
                FROM vendas dv
                JOIN operacoes dop ON dv.id_operacao = dop.id_operacao
                JOIN venda_itens vi_dev ON vi_dev.id_venda = dv.id_venda
                WHERE dv.chave_nfe_referenciada = c.chave_nfe
                  AND dop.transacao = 'Devolucao'
                  AND UPPER(dop.nome_operacao) LIKE '%%COMPRA%%'
                  AND dv.status_nfe != 'CANCELADA'
            ), 0) < COALESCE(c.valor_total_nota, 0)
        )
        """
        where_parts.append(saldo_filter)

        where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

        count_sql = f"""
            SELECT COUNT(*) FROM compras c
            LEFT JOIN fornecedores f ON c.id_fornecedor = f.id_fornecedor
            {where_sql}
        """
        query_sql = f"""
            SELECT
                c.id_compra,
                c.numero_nota,
                c.data_movimento_entrada,
                c.id_fornecedor,
                COALESCE(f.nome_fantasia, f.nome_razao_social) AS nome_fornecedor,
                COALESCE(c.valor_total_nota, 0) AS valor_total,
                COALESCE((
                    SELECT SUM(vi_dev.valor_total)
                    FROM vendas dv
                    JOIN operacoes dop ON dv.id_operacao = dop.id_operacao
                    JOIN venda_itens vi_dev ON vi_dev.id_venda = dv.id_venda
                    WHERE dv.chave_nfe_referenciada = c.chave_nfe
                      AND dop.transacao = 'Devolucao'
                      AND UPPER(dop.nome_operacao) LIKE '%%COMPRA%%'
                      AND dv.status_nfe != 'CANCELADA'
                ), 0) AS valor_devolvido
            FROM compras c
            LEFT JOIN fornecedores f ON c.id_fornecedor = f.id_fornecedor
            {where_sql}
            ORDER BY c.data_movimento_entrada DESC, c.id_compra DESC
            LIMIT %s OFFSET %s
        """

        with connection.cursor() as cursor:
            cursor.execute(count_sql, params)
            total = cursor.fetchone()[0]

            cursor.execute(query_sql, params + [page_size, offset])
            rows = cursor.fetchall()

        compras = []
        for row in rows:
            valor_total = float(row[5])
            valor_devolvido = float(row[6])
            compras.append({
                'id_compra': row[0],
                'numero_documento': row[1],
                'data_compra': row[2].strftime('%Y-%m-%d') if row[2] else None,
                'id_fornecedor': row[3],
                'nome_fornecedor': row[4] or '',
                'valor_total': valor_total,
                'valor_devolvido': valor_devolvido,
                'ja_devolvida_parcialmente': valor_devolvido > 0,
            })

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'num_pages': max(1, (total + page_size - 1) // page_size),
            'results': compras,
        })

    except Exception as e:
        return Response(
            {'error': f'Erro ao pesquisar compras: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def buscar_venda_view(request, id_venda):
    """Buscar dados de uma venda para devolucao com controle de saldo residual por produto"""
    try:
        with connection.cursor() as cursor:
            # Buscar dados da venda (inclui chave_nfe para trackear devoluções)
            cursor.execute("""
                SELECT
                    v.id_venda,
                    v.numero_documento,
                    v.data_venda,
                    v.id_cliente,
                    c.nome_razao_social as nome_cliente,
                    COALESCE((SELECT SUM(vi.valor_total) FROM venda_itens vi WHERE vi.id_venda = v.id_venda), 0) as valor_total,
                    v.status_venda,
                    v.chave_nfe
                FROM vendas v
                LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
                WHERE v.id_venda = %s
            """, [id_venda])

            venda = cursor.fetchone()

            if not venda:
                return Response(
                    {'error': 'Venda nao encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )

            chave_nfe_original = venda[7]

            # Buscar itens da venda com saldo residual calculado via vendas de devolução
            # O saldo usa chave_nfe_referenciada das devoluções (vendas com transacao=Devolucao)
            if chave_nfe_original:
                cursor.execute("""
                    SELECT
                        vi.id_venda_item,
                        vi.id_produto,
                        p.nome_produto,
                        p.codigo_produto,
                        vi.quantidade,
                        vi.valor_unitario,
                        vi.valor_total,
                        COALESCE(vi.cfop, '') as cfop,
                        COALESCE((
                            SELECT SUM(dvi.quantidade)
                            FROM venda_itens dvi
                            JOIN vendas dv ON dvi.id_venda = dv.id_venda
                            JOIN operacoes dop ON dv.id_operacao = dop.id_operacao
                            WHERE dv.chave_nfe_referenciada = %s
                              AND dop.transacao = 'Devolucao'
                              AND UPPER(dop.nome_operacao) NOT LIKE '%%COMPRA%%'
                              AND dv.status_nfe != 'CANCELADA'
                              AND dvi.id_produto = vi.id_produto
                        ), 0) as quantidade_devolvida
                    FROM venda_itens vi
                    JOIN produtos p ON vi.id_produto = p.id_produto
                    WHERE vi.id_venda = %s
                """, [chave_nfe_original, id_venda])
            else:
                # Sem chave NF-e: não há como rastrear devoluções, exibe tudo disponível
                cursor.execute("""
                    SELECT
                        vi.id_venda_item,
                        vi.id_produto,
                        p.nome_produto,
                        p.codigo_produto,
                        vi.quantidade,
                        vi.valor_unitario,
                        vi.valor_total,
                        COALESCE(vi.cfop, '') as cfop,
                        0 as quantidade_devolvida
                    FROM venda_itens vi
                    JOIN produtos p ON vi.id_produto = p.id_produto
                    WHERE vi.id_venda = %s
                """, [id_venda])

            itens_raw = cursor.fetchall()

            # Formatar itens — apenas itens com saldo disponível aparecem
            itens = []
            for item in itens_raw:
                quantidade_disponivel = float(item[4]) - float(item[8])
                if quantidade_disponivel > 0:
                    itens.append({
                        'id_venda_item'       : item[0],
                        'id_produto'          : item[1],
                        'nome_produto'        : item[2],
                        'codigo_produto'      : item[3],
                        'quantidade_original' : float(item[4]),
                        'quantidade_devolvida': float(item[8]),
                        'quantidade_disponivel': quantidade_disponivel,
                        'valor_unitario'      : float(item[5]),
                        'valor_total'         : float(item[6]),
                        'cfop'                : item[7] or '',
                    })

            venda_data = {
                'id_venda'      : venda[0],
                'numero_documento': venda[1],
                'data_venda'    : venda[2],
                'id_cliente'    : venda[3],
                'nome_cliente'  : venda[4],
                'valor_total'   : float(venda[5]),
                'status_venda'  : venda[6],
                'itens'         : itens,
            }

            return Response(venda_data)

    except Exception as e:
        return Response(
            {'error': f'Erro ao buscar venda: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def buscar_compra_view(request, id_compra):
    """Buscar dados de uma compra para devolucao"""
    try:
        with connection.cursor() as cursor:
            # Buscar dados da compra
            cursor.execute("""
                SELECT
                    c.id_compra,
                    c.numero_nota,
                    c.data_movimento_entrada,
                    c.id_fornecedor,
                    f.nome_razao_social as nome_fornecedor,
                    COALESCE(c.valor_total_nota, 0) as valor_total,
                    c.chave_nfe
                FROM compras c
                LEFT JOIN fornecedores f ON c.id_fornecedor = f.id_fornecedor
                WHERE c.id_compra = %s
            """, [id_compra])

            compra = cursor.fetchone()

            if not compra:
                return Response(
                    {'error': 'Compra nao encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )

            chave_nfe_compra = compra[6]  # c.chave_nfe

            # Buscar itens da compra com saldo residual calculado via vendas de devolução
            if chave_nfe_compra:
                cursor.execute("""
                    SELECT
                        ci.id_compra_item,
                        ci.id_produto,
                        p.nome_produto,
                        p.codigo_produto,
                        ci.quantidade,
                        ci.valor_unitario,
                        ci.valor_total,
                        COALESCE((
                            SELECT SUM(dvi.quantidade)
                            FROM venda_itens dvi
                            JOIN vendas dv ON dvi.id_venda = dv.id_venda
                            JOIN operacoes dop ON dv.id_operacao = dop.id_operacao
                            WHERE dv.chave_nfe_referenciada = %s
                              AND dop.transacao = 'Devolucao'
                              AND UPPER(dop.nome_operacao) LIKE '%%COMPRA%%'
                              AND dv.status_nfe != 'CANCELADA'
                              AND dvi.id_produto = ci.id_produto
                        ), 0) as quantidade_devolvida
                    FROM compra_itens ci
                    JOIN produtos p ON ci.id_produto = p.id_produto
                    WHERE ci.id_compra = %s
                """, [chave_nfe_compra, id_compra])
            else:
                # Sem chave NF-e: não há como rastrear devoluções, exibe tudo disponível
                cursor.execute("""
                    SELECT
                        ci.id_compra_item,
                        ci.id_produto,
                        p.nome_produto,
                        p.codigo_produto,
                        ci.quantidade,
                        ci.valor_unitario,
                        ci.valor_total,
                        0 as quantidade_devolvida
                    FROM compra_itens ci
                    JOIN produtos p ON ci.id_produto = p.id_produto
                    WHERE ci.id_compra = %s
                """, [id_compra])

            itens_raw = cursor.fetchall()

            # Formatar itens — apenas itens com saldo disponível aparecem
            itens = []
            for item in itens_raw:
                quantidade_disponivel = float(item[4]) - float(item[7])
                if quantidade_disponivel > 0:
                    itens.append({
                        'id_compra_item'      : item[0],
                        'id_produto'          : item[1],
                        'nome_produto'        : item[2],
                        'codigo_produto'      : item[3],
                        'quantidade_original' : float(item[4]),
                        'quantidade_devolvida': float(item[7]),
                        'quantidade_disponivel': quantidade_disponivel,
                        'valor_unitario'      : float(item[5]),
                        'valor_total'         : float(item[6]),
                    })

            compra_data = {
                'id_compra': compra[0],
                'numero_documento': compra[1],
                'data_compra': compra[2].strftime('%Y-%m-%d') if compra[2] else None,
                'id_fornecedor': compra[3],
                'nome_fornecedor': compra[4],
                'valor_total': float(compra[5]),
                'chave_nfe': compra[6],
                'itens': itens
            }

            return Response(compra_data)

    except Exception as e:
        return Response(
            {'error': f'Erro ao buscar compra: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
