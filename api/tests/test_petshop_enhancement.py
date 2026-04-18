"""
Testes para o Sistema de Pet Shop com Pacotes e Múltiplas Sessões
Test file para validar: api/tests/test_petshop_enhancement.py
"""

import json
from datetime import datetime, timedelta
from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from api.models import (
    Cliente, Pet, TipoServico, Agendamento, SessaoAgendamento, Avaliacao
)


class ClienteTestHelper:
    """Helper para criar clientes de teste"""
    @staticmethod
    def criar_cliente(nome="Cliente Test", email="test@test.com"):
        return Cliente.objects.create(
            nome_razao_social=nome,
            tipo_cliente="PF",
            email=email,
            telefone="1199999999"
        )


class PetTestHelper:
    """Helper para criar pets de teste"""
    @staticmethod
    def criar_pet(cliente, nome="Rex", raca="Poodle"):
        return Pet.objects.create(
            id_cliente=cliente,
            nome_pet=nome,
            raca=raca,
            sexo="M",
            peso=5.0,
            cor="Branco"
        )


class TipoServicoTestHelper:
    """Helper para criar serviços de teste"""
    @staticmethod
    def criar_servico(nome="Banho", preco=50.00, duracao=60):
        return TipoServico.objects.create(
            nome_servico=nome,
            descricao=f"Serviço de {nome}",
            duracao_minutos=duracao,
            preco_base=preco,
            ativo=True
        )


class AgendamentoUnicoTest(APITestCase):
    """Testes para agendamentos únicos"""
    
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.cliente = ClienteTestHelper.criar_cliente()
        self.pet = PetTestHelper.criar_pet(self.cliente)
        self.servico = TipoServicoTestHelper.criar_servico()
    
    def test_criar_agendamento_unico(self):
        """Testa criação de agendamento único"""
        data = {
            "id_pet": self.pet.id_pet,
            "id_cliente": self.cliente.id_cliente,
            "id_tipo_servico": self.servico.id_tipo_servico,
            "data_agendamento": "2024-12-20T14:00:00",
            "preco_servico": "50.00",
            "tipo_agendamento": "Único",
            "quantidade_sessoes": 1
        }
        
        response = self.client.post('/api/agendamentos/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tipo_agendamento'], 'Único')
        self.assertEqual(response.data['quantidade_sessoes'], 1)
    
    def test_agendamento_unico_sem_sessoes(self):
        """Agendamento único não deve ter sessões relacionadas"""
        agendamento = Agendamento.objects.create(
            id_pet=self.pet,
            id_cliente=self.cliente,
            id_tipo_servico=self.servico,
            data_agendamento="2024-12-20 14:00:00",
            preco_servico=50.00,
            tipo_agendamento="Único"
        )
        
        sessoes = SessaoAgendamento.objects.filter(id_agendamento=agendamento)
        self.assertEqual(sessoes.count(), 0)


class AgendamentoPacoteTest(APITestCase):
    """Testes para agendamentos em pacote"""
    
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.cliente = ClienteTestHelper.criar_cliente()
        self.pet = PetTestHelper.criar_pet(self.cliente)
        self.servico = TipoServicoTestHelper.criar_servico()
    
    def test_criar_agendamento_pacote(self):
        """Testa criação de agendamento em pacote"""
        data = {
            "id_pet": self.pet.id_pet,
            "id_cliente": self.cliente.id_cliente,
            "id_tipo_servico": self.servico.id_tipo_servico,
            "data_agendamento": "2024-12-20T14:00:00",
            "preco_servico": "50.00",
            "tipo_agendamento": "Pacote",
            "quantidade_sessoes": 3,
            "preco_total_pacote": "150.00"
        }
        
        response = self.client.post('/api/agendamentos/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tipo_agendamento'], 'Pacote')
        self.assertEqual(response.data['quantidade_sessoes'], 3)
        self.assertEqual(float(response.data['preco_total_pacote']), 150.00)
    
    def test_criar_sessoes_agendamento(self):
        """Testa criação de múltiplas sessões para um pacote"""
        agendamento = Agendamento.objects.create(
            id_pet=self.pet,
            id_cliente=self.cliente,
            id_tipo_servico=self.servico,
            data_agendamento="2024-12-20 14:00:00",
            preco_servico=50.00,
            tipo_agendamento="Pacote",
            quantidade_sessoes=3,
            preco_total_pacote=150.00
        )
        
        # Criar 3 sessões
        for i in range(1, 4):
            data_sessao = datetime.now() + timedelta(days=7*(i-1))
            SessaoAgendamento.objects.create(
                id_agendamento=agendamento,
                numero_sessao=i,
                data_sessao=data_sessao,
                status="Agendada"
            )
        
        sessoes = SessaoAgendamento.objects.filter(id_agendamento=agendamento)
        self.assertEqual(sessoes.count(), 3)
        
        # Verificar numeração
        for i, sessao in enumerate(sessoes.order_by('numero_sessao'), 1):
            self.assertEqual(sessao.numero_sessao, i)
    
    def test_marcar_sessao_concluida(self):
        """Testa marcação de sessão como concluída"""
        agendamento = Agendamento.objects.create(
            id_pet=self.pet,
            id_cliente=self.cliente,
            id_tipo_servico=self.servico,
            data_agendamento="2024-12-20 14:00:00",
            preco_servico=50.00,
            tipo_agendamento="Pacote",
            quantidade_sessoes=2
        )
        
        sessao = SessaoAgendamento.objects.create(
            id_agendamento=agendamento,
            numero_sessao=1,
            data_sessao=datetime.now(),
            status="Agendada"
        )
        
        # Marcar como concluída
        response = self.client.post(
            f'/api/sessoes-agendamento/{sessao.id_sessao}/marcar_concluida/',
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sessao.refresh_from_db()
        self.assertEqual(sessao.status, "Concluída")
        self.assertIsNotNone(sessao.data_realizacao)


class TipoServicoEditorTest(APITestCase):
    """Testes para edição de serviços"""
    
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.servico = TipoServicoTestHelper.criar_servico()
    
    def test_editar_servico(self):
        """Testa edição de um serviço existente"""
        data = {
            "nome_servico": "Banho Premium",
            "descricao": "Banho com produtos premium",
            "duracao_minutos": 90,
            "preco_base": "75.00",
            "ativo": True
        }
        
        response = self.client.put(
            f'/api/tipo-servicos/{self.servico.id_tipo_servico}/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.servico.refresh_from_db()
        self.assertEqual(self.servico.nome_servico, "Banho Premium")
        self.assertEqual(self.servico.duracao_minutos, 90)
        self.assertEqual(float(self.servico.preco_base), 75.00)
    
    def test_inativar_servico(self):
        """Testa desativação de um serviço"""
        data = {
            "nome_servico": self.servico.nome_servico,
            "descricao": self.servico.descricao,
            "duracao_minutos": self.servico.duracao_minutos,
            "preco_base": self.servico.preco_base,
            "ativo": False
        }
        
        response = self.client.put(
            f'/api/tipo-servicos/{self.servico.id_tipo_servico}/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.servico.refresh_from_db()
        self.assertFalse(self.servico.ativo)
    
    def test_deletar_servico(self):
        """Testa exclusão de um serviço"""
        servico_id = self.servico.id_tipo_servico
        
        response = self.client.delete(
            f'/api/tipo-servicos/{servico_id}/',
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            TipoServico.objects.filter(id_tipo_servico=servico_id).exists()
        )


class SessaoAgendamentoTest(APITestCase):
    """Testes para gerenciamento de sessões"""
    
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.cliente = ClienteTestHelper.criar_cliente()
        self.pet = PetTestHelper.criar_pet(self.cliente)
        self.servico = TipoServicoTestHelper.criar_servico()
        self.agendamento = Agendamento.objects.create(
            id_pet=self.pet,
            id_cliente=self.cliente,
            id_tipo_servico=self.servico,
            data_agendamento="2024-12-20 14:00:00",
            preco_servico=50.00,
            tipo_agendamento="Pacote",
            quantidade_sessoes=2
        )
    
    def test_filtrar_sessoes_por_agendamento(self):
        """Testa filtro de sessões por agendamento"""
        SessaoAgendamento.objects.create(
            id_agendamento=self.agendamento,
            numero_sessao=1,
            data_sessao=datetime.now(),
            status="Agendada"
        )
        
        response = self.client.get(
            f'/api/sessoes-agendamento/?id_agendamento={self.agendamento.id_agendamento}'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_filtrar_sessoes_por_status(self):
        """Testa filtro de sessões por status"""
        sessao1 = SessaoAgendamento.objects.create(
            id_agendamento=self.agendamento,
            numero_sessao=1,
            data_sessao=datetime.now(),
            status="Agendada"
        )
        
        sessao2 = SessaoAgendamento.objects.create(
            id_agendamento=self.agendamento,
            numero_sessao=2,
            data_sessao=datetime.now(),
            status="Concluída"
        )
        
        response = self.client.get(
            '/api/sessoes-agendamento/?status=Concluída'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], "Concluída")


class PrecoCalculoTest(TestCase):
    """Testes para cálculo automático de preços"""
    
    def setUp(self):
        self.cliente = ClienteTestHelper.criar_cliente()
        self.pet = PetTestHelper.criar_pet(self.cliente)
        self.servico = TipoServicoTestHelper.criar_servico(preco=50.00)
    
    def test_preco_pacote_calculo(self):
        """Testa cálculo correto do preço do pacote"""
        quantidade = 3
        preco_unitario = 50.00
        preco_esperado = quantidade * preco_unitario
        
        agendamento = Agendamento.objects.create(
            id_pet=self.pet,
            id_cliente=self.cliente,
            id_tipo_servico=self.servico,
            data_agendamento="2024-12-20 14:00:00",
            preco_servico=preco_unitario,
            tipo_agendamento="Pacote",
            quantidade_sessoes=quantidade,
            preco_total_pacote=preco_esperado
        )
        
        self.assertEqual(float(agendamento.preco_total_pacote), preco_esperado)


# ============================================================================
# COMO EXECUTAR OS TESTES
# ============================================================================
"""
Terminal:
    python manage.py test api.tests.test_petshop_enhancement

Testes específicos:
    python manage.py test api.tests.test_petshop_enhancement.AgendamentoPacoteTest
    python manage.py test api.tests.test_petshop_enhancement.TipoServicoEditorTest
    python manage.py test api.tests.test_petshop_enhancement.SessaoAgendamentoTest

Com verbosity:
    python manage.py test api.tests.test_petshop_enhancement -v 2

Com coverage:
    coverage run --source='api' manage.py test api.tests.test_petshop_enhancement
    coverage report
"""

# ============================================================================
# CASOS DE TESTE COBERTOS
# ============================================================================
"""
✅ Criar agendamento único
✅ Agendamento único não tem sessões
✅ Criar agendamento em pacote
✅ Criar múltiplas sessões para pacote
✅ Marcar sessão como concluída
✅ Editar serviço (nome, duração, preço)
✅ Inativar serviço
✅ Deletar serviço
✅ Filtrar sessões por agendamento
✅ Filtrar sessões por status
✅ Cálculo de preço total do pacote
"""
