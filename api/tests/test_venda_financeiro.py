from unittest.mock import MagicMock, patch
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory, force_authenticate
from api.views_vendas import VendaView


class VendaFinanceiroTest(TestCase):
    def setUp(self):
        # Usuário para autenticação
        self.user = User.objects.create_user(username='testuser', password='pass')

    def test_criar_venda_gera_financeiro(self):
        # Preparar mocks para evitar interação com esquema legacy do DB
        operacao_mock = MagicMock()
        operacao_mock.tipo_estoque_baixa = 'Nenhum'
        operacao_mock.tipo_estoque_incremento = 'Nenhum'

        produto_mock = MagicMock()
        produto_mock.estoque_atual = Decimal('10')

        def get_obj_side_effect(model, pk=None):
            if getattr(model, '__name__', '') == 'Operacao':
                return operacao_mock
            if getattr(model, '__name__', '') == 'Produto':
                return produto_mock
            return MagicMock()

        with patch('api.views_vendas.get_object_or_404') as mock_get_obj, \
             patch('api.views_vendas.Venda.objects.create') as mock_venda_create, \
             patch('api.views_vendas.VendaItem.objects.create') as mock_vendaitem_create, \
             patch('api.models.FinanceiroConta.objects.create') as mock_fc_create:

            mock_get_obj.side_effect = get_obj_side_effect

            venda_instance = MagicMock()
            venda_instance.pk = 123
            venda_instance.id_operacao = operacao_mock
            venda_instance.id_cliente = None
            mock_venda_create.return_value = venda_instance

            mock_vendaitem_create.return_value = None

            fc_instance = MagicMock()
            fc_instance.id_conta = 999
            mock_fc_create.return_value = fc_instance

            factory = APIRequestFactory()
            payload = {
                'id_operacao': 1,
                'id_cliente': 2,
                'id_vendedor': 3,
                'data': '29/10/2025',
                'itens': [
                    {'id_produto': 1, 'quantidade': '1', 'valor_unitario': '100,00'}
                ],
                'criar_financeiro': '1',
                'vencimento_parcela': None,
                'parcela_valor_num': '100.00',
                'id_forma_pagamento': 1,
            }

            request = factory.post('/api/vendas/', payload, format='json')
            force_authenticate(request, user=self.user)
            view = VendaView.as_view()
            response = view(request)

            # verificar resposta
            self.assertEqual(response.status_code, 201, msg=f"Resposta: {response.data}")
            self.assertIn('gerou_financeiro', response.data)
            self.assertTrue(response.data.get('gerou_financeiro'))
            self.assertEqual(response.data.get('id_financeiro'), 999)
