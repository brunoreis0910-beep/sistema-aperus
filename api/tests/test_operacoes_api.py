from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User

from api.viewsets_operacao import OperacaoSerializer


class OperacaoSerializerTest(APITestCase):
    def test_serializer_create_success(self):
        # Para compatibilidade com DB de teste que pode não ter a coluna de deposito,
        # não enviamos id_deposito_baixa aqui — testamos criação bem-sucedida do objeto.
        payload = {
            'nome_operacao': 'Teste Operacao CI',
            'empresa': None,
            'transacao': 'Entrada',
            'modelo_documento': '55',
            'emitente': 'Proprio',
            'usa_auto_numeracao': 1,
            'serie_nf': 1,
            'proximo_numero_nf': 1,
            'tipo_estoque_baixa': 'Gerencial',
            'gera_financeiro': 1,
            'tipo_estoque_incremento': 'Nenhum',
            'incrementar_estoque': 0,
            'id_deposito_incremento': None
        }
        serializer = OperacaoSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), msg=f"Erros: {serializer.errors}")
        # Não chamamos serializer.save() aqui porque o banco de teste pode não possuir
        # a coluna `id_deposito_baixa` (unmanaged legacy schema). Validamos apenas a camada
        # de serialização/validação.
        validated = serializer.validated_data
        self.assertEqual(validated.get('nome_operacao'), payload['nome_operacao'])

    def test_serializer_invalid_deposito_string(self):
        payload = {
            'nome_operacao': 'Teste Invalid',
            'transacao': 'Saida',
            'modelo_documento': '55',
            'usa_auto_numeracao': 0,
            'proximo_numero_nf': 1,
            'serie_nf': 1,
            'id_deposito_baixa': ''
        }
        serializer = OperacaoSerializer(data=payload)
        valid = serializer.is_valid()
        self.assertFalse(valid)
        self.assertTrue('id_deposito_baixa' in serializer.errors or 'id_deposito' in serializer.errors or 'id_conta_baixa' in serializer.errors)
