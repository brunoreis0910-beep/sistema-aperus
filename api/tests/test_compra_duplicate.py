from django.test import TestCase
from rest_framework.exceptions import ValidationError
from api.views_compra import CompraSerializer
from unittest.mock import patch, Mock


class TestCompraDuplicate(TestCase):
    def test_serializer_validate_rejects_duplicate_dados_entrada(self):
        serializer = CompraSerializer()
        mock_qs = Mock()
        mock_qs.exists.return_value = True
        # Patch the ORM filter used inside CompraSerializer.validate to simulate an existing compra
        with patch('api.views_compra.Compra.objects.filter', return_value=mock_qs):
            with self.assertRaises(ValidationError) as cm:
                serializer.validate({'dados_entrada': 'DUPLICATA'})
        self.assertIn('dados_entrada', cm.exception.detail)
