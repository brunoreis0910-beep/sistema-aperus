from django.db import transaction
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import connection

from .models import Operacao, Produto


class ApplyOperacaoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Apply an operation to a list of products.

        Expected payload:
        {
            "id_operacao": 1,
            "items": [ {"id_produto": 10, "quantidade": 2}, ... ]
        }

        Behavior:
        - If operacao.tipo_estoque_baixa != 'Nenhum' -> subtract quantidade from produto.estoque_atual
        - If operacao.tipo_estoque_incremento != 'Nenhum' -> add quantidade to produto.estoque_atual
        """
        data = request.data
        id_operacao = data.get('id_operacao')
        items = data.get('items', [])

        if not id_operacao or not isinstance(items, list):
            return JsonResponse({'detail': 'id_operacao and items[] required'}, status=400)

        operacao = get_object_or_404(Operacao, pk=id_operacao)

        baixa = (operacao.tipo_estoque_baixa or '').strip() and operacao.tipo_estoque_baixa != 'Nenhum'
        incremento = (operacao.tipo_estoque_incremento or '').strip() and operacao.tipo_estoque_incremento != 'Nenhum'

        results = []
        with transaction.atomic():
            for it in items:
                pid = it.get('id_produto')
                qty = it.get('quantidade', 0)
                if pid is None:
                    continue
                produto = get_object_or_404(Produto, pk=pid)
                original = produto.estoque_atual
                try:
                    # ensure Decimal arithmetic works; qty may be int/float/str
                    from decimal import Decimal
                    q = Decimal(str(qty))
                except Exception:
                    q = None

                if q is None:
                    results.append({'id_produto': pid, 'error': 'invalid quantidade'})
                    continue

                # Se a operação configura baixa no estoque local do produto
                    if baixa:
                        # baixa behavior: if operacao defines a deposito de baixa, decrement that deposito's saldo_deposito
                        produto_pk = pid
                        quantidade = q
                        # se operacao possui um depósito configurado para baixa, atualize saldo_deposito
                        id_deposito_baixa = getattr(operacao, 'id_deposito_baixa', None)
                        if id_deposito_baixa:
                            try:
                                with connection.cursor() as cursor:
                                    # subtrai a quantidade do saldo_deposito; se não existir, insere com saldo negativo
                                    cursor.execute(
                                        """
                                        INSERT INTO saldo_deposito (id_produto, id_deposito, saldo) VALUES (%s, %s, %s)
                                        ON DUPLICATE KEY UPDATE saldo = saldo - VALUES(saldo)
                                        """,
                                        [produto_pk, id_deposito_baixa, float(quantidade)]
                                    )
                                    # registra movimento de estoque (melhor esforço)
                                    try:
                                        cursor.execute(
                                            """
                                            INSERT INTO movimentos_estoque (id_produto, id_deposito, quantidade, tipo, referencia)
                                            VALUES (%s, %s, %s, %s, %s)
                                            """,
                                            [produto_pk, id_deposito_baixa, -float(quantidade), 'BAIXA', f'Operacao:{operacao.id_operacao}']
                                        )
                                    except Exception:
                                        # não interromper a operação se o log de movimentos não existir
                                        pass
                            except Exception:
                                # Em caso de erro SQL, fallback para decrementar o estoque no cadastro do produto
                                Produto.objects.filter(id_produto=produto_pk).update(
                                    estoque_atual=models.F('estoque_atual') - quantidade
                                )
                        else:
                            # sem depósito configurado, decrementa o cadastro do produto (comportamento legado)
                            Produto.objects.filter(id_produto=produto_pk).update(
                                estoque_atual=models.F('estoque_atual') - quantidade
                            )

                # Se a operação configura incremento, veja se há um depósito alvo configurado
                if incremento:
                    # Se operacao.id_deposito_incremento estiver setado, atualizamos o saldo_deposito
                    if getattr(operacao, 'id_deposito_incremento', None):
                        id_dep = int(operacao.id_deposito_incremento)
                        # Ler saldo atual do depósito para este produto
                        with connection.cursor() as cur:
                            cur.execute("SELECT quantidade FROM saldo_deposito WHERE id_deposito=%s AND id_produto=%s", [id_dep, pid])
                            row = cur.fetchone()
                            antes = row[0] if row and row[0] is not None else 0
                            # Inserir/atualizar saldo_deposito
                            cur.execute(
                                """
                                INSERT INTO saldo_deposito (id_deposito, id_produto, quantidade)
                                VALUES (%s, %s, %s)
                                ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade)
                                """,
                                [id_dep, pid, q]
                            )
                            # inserir registro em movimentos_estoque (se tabela existir)
                            try:
                                depois = float(antes) + float(q)
                                cur.execute(
                                    "INSERT INTO movimentos_estoque (id_produto, id_deposito, tipo, quantidade, antes, depois, referencia) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                                    [pid, id_dep, 'Incremento via operacao', q, antes, depois, f'Operacao:{operacao.id_operacao}']
                                )
                            except Exception:
                                # movimento opcional — não falhar se não existir
                                pass
                    else:
                        # sem depósito configurado, incrementa o estoque_atual do produto (comportamento antigo)
                        produto.estoque_atual = produto.estoque_atual + q

                produto.save()
                results.append({
                    'id_produto': pid,
                    'before': float(original),
                    'after': float(produto.estoque_atual)
                })

        return JsonResponse({'applied': True, 'results': results})
