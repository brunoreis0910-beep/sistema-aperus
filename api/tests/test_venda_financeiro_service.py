from unittest.mock import MagicMock, patch
from decimal import Decimal
from django.test import TestCase

from api.services.venda_financeiro import ensure_financeiro_for_venda


class VendaFinanceiroServiceTest(TestCase):
    def test_ensure_creates_financeiro_when_missing(self):
        venda = MagicMock()
        venda.pk = 999
        venda.id_venda = 999
        venda.valor_total = Decimal('50.00')
        venda.id_cliente = None

        # patch FinanceiroConta queryset to report no existing
        with patch('api.services.venda_financeiro.FinanceiroConta') as mock_fc_model:
            mock_qs = MagicMock()
            mock_qs.exists.return_value = False
            mock_fc_model.objects.filter.return_value = mock_qs

            # patch create to return an object with id_conta
            fc_instance = MagicMock()
            fc_instance.id_conta = 555
            mock_fc_model.objects.create.return_value = fc_instance

            created, pk, err = ensure_financeiro_for_venda(venda, payload={}, force=False)
            self.assertTrue(created)
            self.assertEqual(pk, 555)
            self.assertIsNone(err)

    def test_ensure_skips_when_exists_unless_forced(self):
        venda = MagicMock()
        venda.pk = 1000
        venda.id_venda = 1000
        venda.valor_total = Decimal('20.00')

        with patch('api.services.venda_financeiro.FinanceiroConta') as mock_fc_model:
            existing = MagicMock()
            existing.exists.return_value = True
            first = MagicMock()
            first.pk = 777
            mock_fc_model.objects.filter.return_value = existing
            existing.first.return_value = first

            created, pk, err = ensure_financeiro_for_venda(venda, payload={}, force=False)
            self.assertFalse(created)
            self.assertEqual(pk, 777)

            # if forced, should delete and recreate -> patch create
            mock_fc_model.objects.create.return_value = MagicMock(id_conta=888)
            # ensure delete is callable
            existing.delete.return_value = None
            created2, pk2, err2 = ensure_financeiro_for_venda(venda, payload={}, force=True)
            self.assertTrue(created2)
            self.assertEqual(pk2, 888)
