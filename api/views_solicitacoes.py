# -*- coding: utf-8 -*-
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .models import SolicitacaoAprovacao
from .serializers import SolicitacaoAprovacaoSerializer
import json
from datetime import datetime


class SolicitacaoAprovacaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar solicitações de aprovação de supervisores
    """
    queryset = SolicitacaoAprovacao.objects.all()
    serializer_class = SolicitacaoAprovacaoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Retorna solicitações baseado no tipo de usuário:
        - Supervisor: vê solicitações pendentes direcionadas a ele
        - Usuário comum: vê suas próprias solicitações
        """
        user = self.request.user
        
        # Se for staff, vê tudo
        if user.is_staff:
            return SolicitacaoAprovacao.objects.all()
        
        # Se for supervisor, vê solicitações para ele
        solicitacoes_supervisor = SolicitacaoAprovacao.objects.filter(
            id_usuario_supervisor=user
        )
        
        # Vê também suas próprias solicitações
        solicitacoes_proprias = SolicitacaoAprovacao.objects.filter(
            id_usuario_solicitante=user
        )
        
        return (solicitacoes_supervisor | solicitacoes_proprias).distinct()

    @action(detail=False, methods=['post'])
    def solicitar_aprovacao(self, request):
        """
        Cria uma nova solicitação de aprovação
        
        Payload esperado:
        {
            "tipo_solicitacao": "venda" | "compra" | "cliente" | "produto" | etc,
            "id_registro": null (para novo) ou ID do registro,
            "dados_solicitacao": {...dados do registro...},
            "observacao_solicitante": "texto opcional",
            "id_supervisor": ID do supervisor (opcional, busca automaticamente se não fornecido)
        }
        """
        try:
            user = request.user
            tipo = request.data.get('tipo_solicitacao')
            dados = request.data.get('dados_solicitacao', {})
            observacao = request.data.get('observacao_solicitante', '')
            id_registro = request.data.get('id_registro')
            id_supervisor = request.data.get('id_supervisor')
            
            # Buscar supervisor do usuário
            if not id_supervisor:
                # Buscar nos parâmetros do usuário
                from .models import UserParametros
                params = UserParametros.objects.filter(user=user).first()
                if params and params.id_supervisor:
                    id_supervisor = params.id_supervisor.id
                else:
                    # Se não tem supervisor definido, buscar primeiro usuário staff
                    supervisor = User.objects.filter(is_staff=True).first()
                    if supervisor:
                        id_supervisor = supervisor.id
                    else:
                        return Response(
                            {'error': 'Nenhum supervisor disponível para aprovar a solicitação'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            # Criar solicitação
            solicitacao = SolicitacaoAprovacao.objects.create(
                id_usuario_solicitante=user,
                id_usuario_supervisor_id=id_supervisor,
                tipo_solicitacao=tipo,
                id_registro=id_registro,
                dados_solicitacao=json.dumps(dados) if isinstance(dados, dict) else dados,
                observacao_solicitante=observacao,
                status='Pendente'
            )
            
            serializer = self.get_serializer(solicitacao)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao criar solicitação: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def aprovar(self, request, pk=None):
        """
        Aprova uma solicitação pendente
        
        Payload esperado:
        {
            "observacao": "texto opcional"
        }
        """
        try:
            solicitacao = self.get_object()
            
            # Verificar se o usuário é o supervisor
            if solicitacao.id_usuario_supervisor != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'Você não tem permissão para aprovar esta solicitação'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if solicitacao.status != 'Pendente':
                return Response(
                    {'error': f'Solicitação já está com status: {solicitacao.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Aprovar
            solicitacao.status = 'Aprovada'
            solicitacao.data_aprovacao = datetime.now()
            solicitacao.observacao_supervisor = request.data.get('observacao', '')
            solicitacao.save()
            
            # Aqui você pode adicionar lógica para processar o registro aprovado
            # Por exemplo, criar o registro definitivo no banco
            
            serializer = self.get_serializer(solicitacao)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao aprovar solicitação: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def rejeitar(self, request, pk=None):
        """
        Rejeita uma solicitação pendente
        
        Payload esperado:
        {
            "observacao": "motivo da rejeição"
        }
        """
        try:
            solicitacao = self.get_object()
            
            # Verificar se o usuário é o supervisor
            if solicitacao.id_usuario_supervisor != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'Você não tem permissão para rejeitar esta solicitação'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if solicitacao.status != 'Pendente':
                return Response(
                    {'error': f'Solicitação já está com status: {solicitacao.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Rejeitar
            solicitacao.status = 'Rejeitada'
            solicitacao.data_aprovacao = datetime.now()
            solicitacao.observacao_supervisor = request.data.get('observacao', '')
            solicitacao.save()
            
            serializer = self.get_serializer(solicitacao)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao rejeitar solicitação: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def pendentes(self, request):
        """
        Lista apenas solicitações pendentes para o supervisor
        """
        user = request.user
        queryset = SolicitacaoAprovacao.objects.filter(
            id_usuario_supervisor=user,
            status='Pendente'
        ).order_by('-data_solicitacao')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def minhas_solicitacoes(self, request):
        """
        Lista solicitações criadas pelo usuário logado
        """
        user = request.user
        queryset = SolicitacaoAprovacao.objects.filter(
            id_usuario_solicitante=user
        ).order_by('-data_solicitacao')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
