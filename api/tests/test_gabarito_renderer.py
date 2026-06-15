from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from api.models import SaaSCliente, GabaritoCustomizado
from api.logic.renderizador import montar_html_gabarito_customizado


class TestGabaritoRenderer(TestCase):
    """
    Testes unitários para o motor de renderização de gabaritos customizados.
    """
    def test_rendering_html_injection(self):
        layout = [
            {"campo_origem": "cliente.nome", "x": 10, "y": 20, "font_size": 14, "largura": 200},
            {"campo_origem": "venda.total", "x": 15, "y": 80, "font_size": 16, "largura": 120}
        ]
        data = {
            "cliente.nome": "Bruno Reis",
            "venda.total": "R$ 1.500,00"
        }
        
        # Test A4 Portrait rendering
        html = montar_html_gabarito_customizado(layout, data, tipo_gabarito='A4_RETRATO')
        
        self.assertIn("Bruno Reis", html)
        self.assertIn("R$ 1.500,00", html)
        self.assertIn("left: 10px", html)
        self.assertIn("top: 20px", html)
        self.assertIn("font-size: 14px", html)
        self.assertIn("width: 200px", html)
        self.assertIn("size: A4 portrait", html)
        self.assertIn("width: 210mm", html)
        self.assertIn("height: 297mm", html)

    def test_rendering_recibo_size(self):
        layout = [{"campo_origem": "produto.descricao", "x": 5, "y": 10, "font_size": 12, "largura": 180}]
        data = {"produto.descricao": "Arroz 5kg"}
        
        html = montar_html_gabarito_customizado(layout, data, tipo_gabarito='RECIBO')
        self.assertIn("size: 80mm auto", html)
        self.assertIn("width: 80mm", html)
        self.assertIn("height: auto", html)


class TestGabaritoAPI(TestCase):
    """
    Testes de integração para a API do Gabarito Customizado.
    """
    def setUp(self):
        self.client = APIClient()
        # Cria cliente SaaS de teste
        self.saas_cliente = SaaSCliente.objects.create(
            cnpj="12.345.678/0001-95",
            razao_social="Cliente Teste Ltda",
            nome_fantasia="Cliente Teste",
            valor_mensalidade=199.90,
            schema_name="teste_cliente"
        )
        # Cria gabarito de teste
        self.gabarito = GabaritoCustomizado.objects.create(
            cliente=self.saas_cliente,
            nome_relatorio="etiqueta_teste",
            tipo_gabarito="ETIQUETA",
            largura_gabarito_mm=100,
            altura_gabarito_mm=50,
            layout_json=[{"campo_origem": "produto.codigo_barras", "x": 10, "y": 10, "font_size": 12, "largura": 150}],
            ativo=True
        )

    def test_saas_obter_gabarito_success(self):
        url = reverse('saas-obter-gabarito')
        # Test with formatted CNPJ
        res = self.client.get(url, {'cnpj': '12.345.678/0001-95', 'nome_relatorio': 'etiqueta_teste'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['nome_relatorio'], 'etiqueta_teste')
        self.assertEqual(res.data['tipo_gabarito'], 'ETIQUETA')
        self.assertEqual(len(res.data['layout_json']), 1)

        # Test with clean CNPJ
        res_clean = self.client.get(url, {'cnpj': '12345678000195', 'nome_relatorio': 'etiqueta_teste'})
        self.assertEqual(res_clean.status_code, status.HTTP_200_OK)

    def test_saas_obter_gabarito_not_found(self):
        url = reverse('saas-obter-gabarito')
        # Test with non-existent CNPJ
        res = self.client.get(url, {'cnpj': '99999999999999', 'nome_relatorio': 'etiqueta_teste'})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # Test with non-existent report
        res_report = self.client.get(url, {'cnpj': '12345678000195', 'nome_relatorio': 'outro_relatorio'})
        self.assertEqual(res_report.status_code, status.HTTP_200_OK)
        self.assertIsNone(res_report.data['layout_json'])
