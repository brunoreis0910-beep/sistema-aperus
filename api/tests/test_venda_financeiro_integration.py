from decimal import Decimal
from django.test import TransactionTestCase
from django.db import connection
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User

from api import models as m
from api.views_vendas import VendaView


class VendaFinanceiroIntegrationTest(TransactionTestCase):
    def setUp(self):
        # criar tabelas necessárias no banco de teste na ordem de dependência
        self.models_to_create = [
            m.Cliente,
            m.Operacao,
            m.GrupoProduto,
            m.Departamento,
            m.ContaBancaria,
            m.CentroCusto,
            m.FormaPagamento,
            m.Vendedor,
            m.Produto,
            m.Venda,
            m.VendaItem,
            m.FinanceiroConta,
        ]
        # garantir que tabelas antigas do teste anterior sejam removidas (drop em ordem reversa)
        existing = connection.introspection.table_names()
        with connection.cursor() as cur:
            for model in reversed(self.models_to_create):
                db_table = model._meta.db_table
                if db_table in existing:
                    try:
                        cur.execute(f"DROP TABLE IF EXISTS `{db_table}`")
                    except Exception:
                        pass

        # criar tabelas novas na ordem correta
        with connection.schema_editor() as schema:
            existing = connection.introspection.table_names()
            for model in self.models_to_create:
                db_table = model._meta.db_table
                if db_table in existing:
                    continue
                try:
                    schema.create_model(model)
                except Exception:
                    # se falhar por qualquer razão, tenta ignorar para não quebrar o setup
                    pass

        # criar usuário
        self.user = User.objects.create_user(username='intuser', password='pass')

    def test_criar_venda_gera_financeiro_end2end(self):
        # criar dados mínimos
        oper = m.Operacao.objects.create(nome_operacao='Operacao Teste')
        cliente = m.Cliente.objects.create(nome_razao_social='Cliente Teste', cpf_cnpj='00000000000')
        vendedor = m.Vendedor.objects.create(cpf='11111111111', nome='Vendedor Teste')
        produto = m.Produto.objects.create(codigo_produto='P001', nome_produto='Produto Teste', estoque_atual=10, valor_venda=100.00)
        forma = m.FormaPagamento.objects.create(nome_forma='À prazo', dias_vencimento=7)

        payload = {
            'id_operacao': oper.id_operacao,
            'id_cliente': cliente.id_cliente,
            'id_vendedor': vendedor.id_vendedor,
            'data': '29/10/2025',
            'itens': [
                {'id_produto': produto.id_produto, 'quantidade': '1', 'valor_unitario': '100,00'}
            ],
            'criar_financeiro': '1',
            'vencimento_parcela': None,
            'parcela_valor_num': '100.00',
            'id_forma_pagamento': forma.id_forma_pagamento,
        }

        factory = APIRequestFactory()
        request = factory.post('/api/vendas/', payload, format='json')
        force_authenticate(request, user=self.user)
        view = VendaView.as_view()
        response = view(request)

        self.assertEqual(response.status_code, 201, msg=f"Resposta: {response.data}")
        self.assertTrue(response.data.get('gerou_financeiro'), msg=str(response.data))
        fin_id = response.data.get('id_financeiro')
        self.assertIsNotNone(fin_id)

        # verificar persistência
        fc = m.FinanceiroConta.objects.filter(id_conta=fin_id).first()
        self.assertIsNotNone(fc, 'Registro financeiro não encontrado na DB')
        self.assertEqual(fc.id_venda_origem, response.data.get('id'))
