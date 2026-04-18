from django.core.management.base import BaseCommand
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
from django.utils import timezone
import json
import logging

from api.views_vendas import VendaView

class Command(BaseCommand):
    help = 'Roda um teste rápido de criação de venda via chamada interna ao VendaView'

    def handle(self, *args, **options):
        logging.getLogger().setLevel(logging.INFO)
        factory = APIRequestFactory()
        payload = {
            "id_operacao": 4,
            "id_cliente": 4,
            "id_vendedor": 1,
            "data": timezone.now().date().isoformat(),
            "itens": [
                {"id_produto": 2, "quantidade": "1", "valor_unitario": "15,00"}
            ],
            "criar_financeiro": True,
            "id_forma_pagamento": 3,
            "vencimento_parcela": (timezone.now().date() + timezone.timedelta(days=30)).isoformat(),
            "parcela_valor_num": "15.00"
        }

        # Criamos um request mínimo com .data para chamar view.post diretamente
        class _MinimalReq:
            pass

        drf_req = _MinimalReq()
        drf_req.data = payload

        view = VendaView()
        try:
            resp = view.post(drf_req)
            # DRF Response: .status_code and .data
            self.stdout.write(f'Status: {getattr(resp, "status_code", "n/a")}')
            try:
                self.stdout.write(json.dumps(resp.data, indent=2, default=str, ensure_ascii=False))
            except Exception:
                self.stdout.write(str(resp))
        except Exception as e:
            import traceback
            traceback.print_exc()
            self.stderr.write(str(e))
