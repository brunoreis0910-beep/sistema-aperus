from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Q
from .models import SolicitacaoAprovacao, User
import json
import re
import logging

logger = logging.getLogger(__name__)


class WhatsAppWebhookView(APIView):
    """
    Endpoint para receber mensagens do WhatsApp via Evolution API
    Este webhook processa as respostas de aprovação do supervisor
    """
    
    # Não requer autenticação (o WhatsApp vai bater aqui diretamente)
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        """
        Processa mensagens recebidas do WhatsApp
        Formato esperado da Evolution API:
        {
            "event": "messages.upsert",
            "data": {
                "key": {
                    "remoteJid": "5534999999999@s.whatsapp.net",
                    "fromMe": false
                },
                "message": {
                    "conversation": "SIM"
                },
                "messageTimestamp": "1234567890"
            }
        }
        """
        try:
            data = request.data
            logger.info(f"Webhook recebido: {json.dumps(data, indent=2)}")

            # Extrair dados da mensagem (formato Evolution API)
            event = data.get('event')
            
            # Ignorar mensagens enviadas por nós mesmos
            if data.get('data', {}).get('key', {}).get('fromMe', False):
                logger.info("Mensagem enviada por nós, ignorando...")
                return Response({"status": "ignored"}, status=200)

            # Processar apenas mensagens recebidas
            if event == 'messages.upsert':
                message_data = data.get('data', {})
                
                # Extrair número do remetente
                remote_jid = message_data.get('key', {}).get('remoteJid', '')
                sender_number = re.sub(r'@.*', '', remote_jid)  # Remove @s.whatsapp.net
                sender_number = re.sub(r'\D', '', sender_number)  # Apenas números
                
                # Extrair mensagem
                message_obj = message_data.get('message', {})
                msg_body = (
                    message_obj.get('conversation') or 
                    message_obj.get('extendedTextMessage', {}).get('text') or
                    ''
                ).upper().strip()

                logger.info(f"Número: {sender_number}, Mensagem: {msg_body}")

                # Verificar se é uma resposta de aprovação
                if not msg_body:
                    return Response({"status": "empty_message"}, status=200)

                # Buscar supervisor pelo número de telefone
                # Assume que o campo User.telefone ou User.celular existe
                supervisor = User.objects.filter(
                    Q(telefone__icontains=sender_number[-8:]) |  # Últimos 8 dígitos
                    Q(celular__icontains=sender_number[-8:])
                ).first()

                if not supervisor:
                    logger.warning(f"Supervisor não encontrado para o número: {sender_number}")
                    return Response({"status": "supervisor_not_found"}, status=200)

                logger.info(f"Supervisor identificado: {supervisor.username}")

                # Buscar última solicitação pendente deste supervisor
                solicitacao = SolicitacaoAprovacao.objects.filter(
                    id_usuario_supervisor=supervisor,
                    status='Pendente'
                ).order_by('-data_solicitacao').first()

                if not solicitacao:
                    logger.warning(f"Nenhuma solicitação pendente para {supervisor.username}")
                    return Response({"status": "no_pending_request"}, status=200)

                # Processar resposta
                aprovado = False
                rejeitado = False

                # Palavras-chave de aprovação
                palavras_aprovacao = ['SIM', 'APROVADO', 'APROVAR', 'OK', 'ACEITO', 'AUTORIZADO', '1']
                # Palavras-chave de rejeição
                palavras_rejeicao = ['NAO', 'NÃO', 'NEGADO', 'NEGAR', 'RECUSAR', 'REJEITADO', '2']

                for palavra in palavras_aprovacao:
                    if palavra in msg_body:
                        aprovado = True
                        break

                for palavra in palavras_rejeicao:
                    if palavra in msg_body:
                        rejeitado = True
                        break

                if aprovado:
                    solicitacao.status = 'Aprovada'
                    solicitacao.data_aprovacao = timezone.now()
                    solicitacao.observacao_supervisor = f"Aprovado via WhatsApp: {msg_body}"
                    solicitacao.save()
                    
                    logger.info(f"Solicitação {solicitacao.id_solicitacao} APROVADA")
                    
                    return Response({
                        "status": "approved",
                        "solicitacao_id": solicitacao.id_solicitacao,
                        "tipo": solicitacao.tipo_solicitacao
                    }, status=200)

                elif rejeitado:
                    solicitacao.status = 'Rejeitada'
                    solicitacao.data_aprovacao = timezone.now()
                    solicitacao.observacao_supervisor = f"Rejeitado via WhatsApp: {msg_body}"
                    solicitacao.save()
                    
                    logger.info(f"Solicitação {solicitacao.id_solicitacao} REJEITADA")
                    
                    return Response({
                        "status": "rejected",
                        "solicitacao_id": solicitacao.id_solicitacao,
                        "tipo": solicitacao.tipo_solicitacao
                    }, status=200)

                else:
                    logger.info(f"Mensagem não reconhecida como aprovação/rejeição: {msg_body}")
                    return Response({"status": "unrecognized_response"}, status=200)

            return Response({"status": "event_ignored"}, status=200)

        except Exception as e:
            logger.error(f"Erro no webhook: {str(e)}", exc_info=True)
            return Response({
                "status": "error",
                "message": str(e)
            }, status=200)  # Retorna 200 mesmo em erro para não reenviar

    def get(self, request):
        """
        Endpoint de verificação (usado pela Meta Cloud API)
        Evolution API não usa, mas mantemos para compatibilidade
        """
        verify_token = "SUPREMA_WEBHOOK_2026"
        mode = request.query_params.get('hub.mode')
        token = request.query_params.get('hub.verify_token')
        challenge = request.query_params.get('hub.challenge')

        if mode == 'subscribe' and token == verify_token:
            logger.info("Webhook verificado com sucesso!")
            return Response(int(challenge) if challenge else "OK", status=200)
        
        return Response("Token inválido", status=403)


class TestarWebhookView(APIView):
    """
    Endpoint para testar o webhook localmente
    Acesse: http://localhost:8000/api/whatsapp/webhook/testar/
    """
    def post(self, request):
        """
        Envia uma mensagem de teste simulando resposta do supervisor
        
        Body esperado:
        {
            "numero_supervisor": "5534999123456",
            "mensagem": "SIM"
        }
        """
        try:
            numero = request.data.get('numero_supervisor', '')
            mensagem = request.data.get('mensagem', 'SIM')

            # Simular payload da Evolution API
            payload_teste = {
                "event": "messages.upsert",
                "data": {
                    "key": {
                        "remoteJid": f"{numero}@s.whatsapp.net",
                        "fromMe": False
                    },
                    "message": {
                        "conversation": mensagem
                    },
                    "messageTimestamp": str(int(timezone.now().timestamp()))
                }
            }

            # Chamar o próprio webhook
            webhook = WhatsAppWebhookView()
            response = webhook.post(type('Request', (), {'data': payload_teste})())

            return Response({
                "mensagem": "Teste executado",
                "payload_enviado": payload_teste,
                "resposta_webhook": response.data
            }, status=200)

        except Exception as e:
            return Response({
                "erro": str(e)
            }, status=500)

    def get(self, request):
        """
        Retorna informações sobre solicitações pendentes
        """
        pendentes = SolicitacaoAprovacao.objects.filter(status='Pendente').count()
        ultimas = SolicitacaoAprovacao.objects.filter(
            status='Pendente'
        ).order_by('-data_solicitacao')[:5].values(
            'id_solicitacao',
            'tipo_solicitacao',
            'id_usuario_supervisor__username',
            'data_solicitacao'
        )

        return Response({
            "total_pendentes": pendentes,
            "ultimas_solicitacoes": list(ultimas)
        }, status=200)
