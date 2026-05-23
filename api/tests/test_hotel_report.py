from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status
from unittest.mock import MagicMock, patch
from decimal import Decimal
from datetime import datetime, date
from django.utils import timezone
from api.views_hotel import ReservaViewSet

class HotelReportTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass')

    @patch('api.views_hotel.Reserva.objects.all')
    @patch('api.views_hotel.Quarto.objects.count')
    @patch('api.views_hotel.Reserva.objects.filter')
    def test_relatorio_kpis(self, mock_reserva_filter, mock_quarto_count, mock_reserva_all):
        # Configurar mocks
        mock_quarto_count.return_value = 5 # 5 quartos no hotel

        # Mock de reservas filtradas
        res1 = MagicMock()
        res1.id_reserva = 1
        res1.total_diarias = Decimal('300.00')
        res1.total_consumo = Decimal('50.00')
        res1.total_geral = Decimal('350.00')
        res1.data_checkin_real = timezone.make_aware(datetime(2026, 5, 20, 14, 0))
        res1.data_checkout_real = timezone.make_aware(datetime(2026, 5, 22, 12, 0))
        res1.quarto.numero_quarto = "101"
        res1.quarto.tipo.nome = "Luxo"
        res1.hospede.nome_razao_social = "João Silva"
        
        # Mock para as propriedades serializadas no serializer
        res1.hospede_nome = "João Silva"
        res1.quarto_numero = "101"
        res1.tipo_quarto_nome = "Luxo"
        res1.consumos.all.return_value = []
        res1.nfce_emitida = False
        res1.nfe_emitida = False
        res1.nfse_emitida = False
        res1.documento_fiscal_emitido = False

        # mock objects query
        mock_queryset = [res1]
        mock_reserva_all.return_value.filter.return_value = mock_queryset

        # Mock para reservas de ocupação (usadas no cálculo da taxa)
        mock_res_ocupacao = MagicMock()
        mock_res_ocupacao.data_checkin_real = timezone.make_aware(datetime(2026, 5, 20, 14, 0))
        mock_res_ocupacao.data_checkout_real = timezone.make_aware(datetime(2026, 5, 22, 12, 0))
        
        # mock_reserva_filter de Reserva.objects.filter(...)
        # No código, fazemos Reserva.objects.filter(status_reserva__in=['checkin', 'finalizada']).filter(...)
        mock_reserva_filter.return_value.filter.return_value = [mock_res_ocupacao]

        factory = APIRequestFactory()
        request = factory.get('/api/hotel/reservas/relatorio/', {'data_inicio': '2026-05-20', 'data_fim': '2026-05-22'}, format='json')
        force_authenticate(request, user=self.user)

        view = ReservaViewSet.as_view({'get': 'relatorio'})
        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('kpis', response.data)
        self.assertIn('reservas', response.data)
        
        kpis = response.data['kpis']
        self.assertEqual(float(kpis['total_diarias']), 300.00)
        self.assertEqual(float(kpis['total_consumo']), 50.00)
        self.assertEqual(float(kpis['total_geral']), 350.00)
        # ADR should be 300 / 2 nights = 150.00
        self.assertEqual(float(kpis['adr']), 150.00)
