"""
Views para Sistema de E-mail Marketing e Transacional
======================================================

Endpoints:
- /api/email/config/ - Configurações de e-mail
- /api/email/templates/ - CRUD de templates
- /api/email/send/ - Enviar e-mail transacional
- /api/email/campaigns/ - CRUD de campanhas
- /api/email/campaigns/{id}/send/ - Enviar campanha
- /api/email/logs/ - Histórico de envios
- /api/email/webhooks/{provider}/ - Webhooks de provedores
"""

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
import logging

from api.models import (
    EmailConfig, EmailTemplate, EmailCampaign, EmailLog,
    Cliente, Venda, FinanceiroConta, EmpresaConfig
)
from api.services_email import EmailService, EmailServiceError
from api.serializers_email import (
    EmailConfigSerializer, EmailTemplateSerializer,
    EmailCampaignSerializer, EmailCampaignListSerializer,
    EmailLogSerializer, EmailLogListSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser

logger = logging.getLogger(__name__)


# ===================================
# VIEWSETS CRUD
# ===================================

class EmailConfigViewSet(viewsets.ModelViewSet):
    """
    CRUD para configurações de e-mail
    """
    permission_classes = [IsAuthenticated]
    serializer_class = EmailConfigSerializer
    
    def get_queryset(self):
        empresa = EmpresaConfig.get_ativa()
        if empresa:
            return EmailConfig.objects.filter(empresa=empresa)
        return EmailConfig.objects.none()

    def create(self, request, *args, **kwargs):
        empresa = EmpresaConfig.get_ativa()
        data = request.data.copy()
        if empresa:
            data['empresa'] = empresa.id_empresa
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        # Se marcado como default, remove default das outras configs
        empresa = EmpresaConfig.get_ativa()
        if serializer.validated_data.get('is_default') and empresa:
            EmailConfig.objects.filter(empresa=empresa).update(is_default=False)
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """
        Testa conexão com o provedor de e-mail
        POST /api/email/config/{id}/test_connection/
        """
        config = self.get_object()
        
        try:
            service = EmailService(
                empresa_id=config.empresa_id,
                config_id=config.id_config
            )
            
            # Envia e-mail de teste
            log = service.send(
                destinatario_email=request.user.email,
                assunto="Teste de Conexão - APERUS",
                html_body=f"""
                <h2>Teste de Conexão Bem-Sucedido!</h2>
                <p>Esta é uma mensagem de teste do sistema de e-mail.</p>
                <p><strong>Provedor:</strong> {config.provider}</p>
                <p><strong>Remetente:</strong> {config.from_email}</p>
                <p><strong>Data/Hora:</strong> {timezone.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
                """
            )
            
            return Response({
                'success': True,
                'message': f'E-mail de teste enviado com sucesso para {request.user.email}',
                'log_id': log.id_log
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Erro ao testar conexão: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class EmailTemplateViewSet(viewsets.ModelViewSet):
    """
    CRUD para templates de e-mail
    """
    permission_classes = [IsAuthenticated]
    serializer_class = EmailTemplateSerializer
    
    def get_queryset(self):
        user = self.request.user
        empresa_id = user.empresa_id or self.request.query_params.get('empresa_id')
        
        qs = EmailTemplate.objects.filter(empresa_id=empresa_id)
        
        # Filtros
        categoria = self.request.query_params.get('categoria')
        if categoria:
            qs = qs.filter(categoria=categoria)
        
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(nome__icontains=search) |
                Q(slug__icontains=search) |
                Q(assunto__icontains=search)
            )
        
        return qs
    
    def perform_create(self, serializer):
        serializer.save(usuario_criador=self.request.user)
    
    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        """
        Gera preview do template com variáveis de exemplo
        POST /api/email/templates/{id}/preview/
        Body: {"context": {"cliente_nome": "João", "valor": "100.00"}}
        """
        template = self.get_object()
        context = request.data.get('context', {})
        
        try:
            rendered = template.render(context)
            return Response({
                'success': True,
                'preview': rendered
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Erro ao renderizar: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """
        Duplica um template existente
        POST /api/email/templates/{id}/duplicate/
        """
        template = self.get_object()
        
        # Cria cópia
        new_template = EmailTemplate.objects.create(
            empresa=template.empresa,
            nome=f"{template.nome} (Cópia)",
            slug=f"{template.slug}-copia-{timezone.now().timestamp()}",
            categoria=template.categoria,
            descricao=template.descricao,
            assunto=template.assunto,
            html_body=template.html_body,
            text_body=template.text_body,
            variaveis_disponiveis=template.variaveis_disponiveis,
            preview_text=template.preview_text,
            design_json=template.design_json,
            ativo=False,  # Inicia desativado
            usuario_criador=request.user
        )
        
        return Response({
            'success': True,
            'message': 'Template duplicado com sucesso',
            'id_template': new_template.id_template
        })


class EmailCampaignViewSet(viewsets.ModelViewSet):
    """
    CRUD para campanhas de e-mail
    """
    permission_classes = [IsAuthenticated]
    serializer_class = EmailCampaignSerializer
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmailCampaignListSerializer
        return EmailCampaignSerializer
    
    def get_queryset(self):
        user = self.request.user
        empresa_id = user.empresa_id or self.request.query_params.get('empresa_id')
        
        qs = EmailCampaign.objects.filter(empresa_id=empresa_id)
        
        # Filtros
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        return qs
    
    def perform_create(self, serializer):
        serializer.save(usuario_criador=self.request.user)
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """
        Inicia envio de campanha
        POST /api/email/campaigns/{id}/send/
        """
        campanha = self.get_object()
        
        if campanha.status not in ['RASCUNHO', 'AGENDADA']:
            return Response({
                'success': False,
                'message': 'Campanha já foi enviada ou está em andamento'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Valida template
        if not campanha.template:
            return Response({
                'success': False,
                'message': 'Campanha não possui template associado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Busca destinatários
        destinatarios = self._get_destinatarios(campanha)
        
        if not destinatarios:
            return Response({
                'success': False,
                'message': 'Nenhum destinatário encontrado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Atualiza campanha
        campanha.status = 'ENVIANDO'
        campanha.data_inicio_envio = timezone.now()
        campanha.total_destinatarios = len(destinatarios)
        campanha.save()
        
        # Dispara envio em background (Celery task)
        # from api.tasks import enviar_campanha_async
        # enviar_campanha_async.delay(campanha.id_campanha, destinatarios)
        
        # Por enquanto, envia síncrono (para teste)
        self._enviar_campanha_sync(campanha, destinatarios)
        
        return Response({
            'success': True,
            'message': f'Campanha iniciada para {len(destinatarios)} destinatários',
            'total_destinatarios': campanha.total_destinatarios
        })
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pausa campanha em andamento"""
        campanha = self.get_object()
        
        if campanha.status != 'ENVIANDO':
            return Response({
                'success': False,
                'message': 'Campanha não está em andamento'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        campanha.status = 'PAUSADA'
        campanha.save()
        
        return Response({'success': True, 'message': 'Campanha pausada'})
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Retoma campanha pausada"""
        campanha = self.get_object()
        
        if campanha.status != 'PAUSADA':
            return Response({
                'success': False,
                'message': 'Campanha não está pausada'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        campanha.status = 'ENVIANDO'
        campanha.save()
        
        return Response({'success': True, 'message': 'Campanha retomada'})
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Retorna estatísticas da campanha"""
        campanha = self.get_object()
        
        return Response({
            'total_destinatarios': campanha.total_destinatarios,
            'total_enviados': campanha.total_enviados,
            'total_abertos': campanha.total_abertos,
            'total_cliques': campanha.total_cliques,
            'total_bounces': campanha.total_bounces,
            'taxa_abertura': campanha.taxa_abertura,
            'taxa_cliques': campanha.taxa_cliques,
            'status': campanha.status,
            'data_inicio': campanha.data_inicio_envio,
            'data_fim': campanha.data_fim_envio
        })
    
    def _get_destinatarios(self, campanha):
        """Busca lista de destinatários baseado nos critérios"""
        destinatarios = []
        
        # Se tem lista manual
        if campanha.lista_emails:
            for linha in campanha.lista_emails.split('\n'):
                email = linha.strip()
                if email and '@' in email:
                    destinatarios.append({
                        'email': email,
                        'nome': '',
                        'cliente_id': None
                    })
        
        # Se tem query de clientes
        elif campanha.destinatarios_query or campanha.segmento:
            clientes = Cliente.objects.filter(empresa=campanha.empresa, ativo=True)
            
            # Aplica segmento
            if campanha.segmento:
                if campanha.segmento == 'clientes-vip':
                    # Clientes com compras > R$ 10k nos últimos 6 meses
                    from django.db.models import Sum
                    seis_meses_atras = timezone.now() - timedelta(days=180)
                    clientes_vip_ids = Venda.objects.filter(
                        empresa=campanha.empresa,
                        data_emissao__gte=seis_meses_atras
                    ).values('cliente_id').annotate(
                        total=Sum('valor_total')
                    ).filter(total__gte=10000).values_list('cliente_id', flat=True)
                    
                    clientes = clientes.filter(id_cliente__in=clientes_vip_ids)
                
                elif campanha.segmento == 'inativos-30dias':
                    # Clientes sem compra nos últimos 30 dias
                    trinta_dias_atras = timezone.now() - timedelta(days=30)
                    clientes_ativos_ids = Venda.objects.filter(
                        empresa=campanha.empresa,
                        data_emissao__gte=trinta_dias_atras
                    ).values_list('cliente_id', flat=True).distinct()
                    
                    clientes = clientes.exclude(id_cliente__in=clientes_ativos_ids)
            
            for cliente in clientes:
                if cliente.email:
                    destinatarios.append({
                        'email': cliente.email,
                        'nome': cliente.nome,
                        'cliente_id': cliente.id_cliente
                    })
        
        return destinatarios
    
    def _enviar_campanha_sync(self, campanha, destinatarios):
        """Envia campanha de forma síncrona (usar apenas para teste)"""
        service = EmailService(empresa_id=campanha.empresa_id)
        
        for destinatario in destinatarios:
            try:
                # Context padrão (pode ser customizado)
                context = {
                    'cliente_nome': destinatario['nome'] or 'Cliente',
                    'empresa_nome': campanha.empresa.razao_social
                }
                
                service.send_from_template(
                    template_slug=campanha.template.slug,
                    destinatario_email=destinatario['email'],
                    context=context,
                    destinatario_nome=destinatario['nome'],
                    cliente_id=destinatario['cliente_id'],
                    campanha_id=campanha.id_campanha
                )
                
            except Exception as e:
                logger.error(f"Erro ao enviar e-mail para {destinatario['email']}: {str(e)}")
                continue
        
        # Finaliza campanha
        campanha.status = 'ENVIADA'
        campanha.data_fim_envio = timezone.now()
        campanha.save()


class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Visualização de logs de e-mail (read-only)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = EmailLogSerializer
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmailLogListSerializer
        return EmailLogSerializer
    
    def get_queryset(self):
        user = self.request.user
        empresa_id = user.empresa_id or self.request.query_params.get('empresa_id')
        
        qs = EmailLog.objects.filter(empresa_id=empresa_id)
        
        # Filtros
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        campanha_id = self.request.query_params.get('campanha_id')
        if campanha_id:
            qs = qs.filter(campanha_id=campanha_id)
        
        destinatario = self.request.query_params.get('destinatario')
        if destinatario:
            qs = qs.filter(destinatario_email__icontains=destinatario)
        
        # Período
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        if data_inicio:
            qs = qs.filter(criado_em__gte=data_inicio)
        if data_fim:
            qs = qs.filter(criado_em__lte=data_fim)
        
        return qs.select_related('template', 'campanha', 'cliente')
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Estatísticas gerais de e-mails"""
        user = request.user
        empresa_id = user.empresa_id or request.query_params.get('empresa_id')
        
        # Últimos 30 dias
        trinta_dias_atras = timezone.now() - timedelta(days=30)
        
        logs = EmailLog.objects.filter(
            empresa_id=empresa_id,
            criado_em__gte=trinta_dias_atras
        )
        
        stats = logs.aggregate(
            total_enviados=Count('id_log', filter=Q(status='ENVIADO') | Q(status='ABERTO') | Q(status='CLICADO')),
            total_abertos=Count('id_log', filter=Q(status='ABERTO') | Q(status='CLICADO')),
            total_cliques=Count('id_log', filter=Q(status='CLICADO')),
            total_bounces=Count('id_log', filter=Q(status='BOUNCE')),
            total_erros=Count('id_log', filter=Q(status='ERRO'))
        )
        
        # Calcula taxas
        total = stats['total_enviados'] or 1
        stats['taxa_abertura'] = (stats['total_abertos'] / total) * 100
        stats['taxa_cliques'] = (stats['total_cliques'] / total) * 100
        stats['taxa_bounce'] = (stats['total_bounces'] / total) * 100
        
        return Response(stats)


# ===================================
# ENDPOINTS DE ENVIO TRANSACIONAL
# ===================================

@api_view(['POST'])
def enviar_email_transacional(request):
    """
    Envia e-mail transacional direto (sem template)
    POST /api/email/send/
    
    Body:
    {
        "empresa_id": 1,
        "destinatario_email": "cliente@email.com",
        "destinatario_nome": "João Silva",
        "assunto": "Seu pedido foi aprovado",
        "html_body": "<h1>Pedido #123</h1><p>Status: Aprovado</p>",
        "text_body": "Pedido #123 - Status: Aprovado",
        "cliente_id": 10,
        "reply_to": "suporte@empresa.com"
    }
    """
    empresa_id = request.data.get('empresa_id')
    destinatario_email = request.data.get('destinatario_email')
    assunto = request.data.get('assunto')
    html_body = request.data.get('html_body')
    
    if not all([empresa_id, destinatario_email, assunto, html_body]):
        return Response({
            'success': False,
            'message': 'Campos obrigatórios: empresa_id, destinatario_email, assunto, html_body'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        service = EmailService(empresa_id=empresa_id)
        
        log = service.send(
            destinatario_email=destinatario_email,
            assunto=assunto,
            html_body=html_body,
            destinatario_nome=request.data.get('destinatario_nome'),
            cliente_id=request.data.get('cliente_id'),
            text_body=request.data.get('text_body'),
            reply_to=request.data.get('reply_to')
        )
        
        return Response({
            'success': True,
            'message': 'E-mail enviado com sucesso',
            'log_id': log.id_log
        })
        
    except EmailServiceError as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def enviar_email_com_template(request):
    """
    Envia e-mail usando template
    POST /api/email/send-template/
    
    Body:
    {
        "empresa_id": 1,
        "template_slug": "nfe-enviada",
        "destinatario_email": "cliente@email.com",
        "destinatario_nome": "João Silva",
        "context": {
            "cliente_nome": "João",
            "nfe_numero": "12345",
            "valor_total": "R$ 1.500,00"
        },
        "cliente_id": 10
    }
    """
    empresa_id = request.data.get('empresa_id')
    template_slug = request.data.get('template_slug')
    destinatario_email = request.data.get('destinatario_email')
    context = request.data.get('context', {})
    
    if not all([empresa_id, template_slug, destinatario_email]):
        return Response({
            'success': False,
            'message': 'Campos obrigatórios: empresa_id, template_slug, destinatario_email'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        service = EmailService(empresa_id=empresa_id)
        
        log = service.send_from_template(
            template_slug=template_slug,
            destinatario_email=destinatario_email,
            context=context,
            destinatario_nome=request.data.get('destinatario_nome'),
            cliente_id=request.data.get('cliente_id')
        )
        
        return Response({
            'success': True,
            'message': 'E-mail enviado com sucesso',
            'log_id': log.id_log
        })
        
    except EmailServiceError as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


# ===================================
# WEBHOOKS PARA RASTREAMENTO
# ===================================

@api_view(['POST'])
def webhook_sendgrid(request):
    """
    Webhook do SendGrid para rastreamento
    POST /api/email/webhooks/sendgrid/
    """
    events = request.data
    
    for event in events:
        message_id = event.get('sg_message_id')
        event_type = event.get('event')
        
        try:
            log = EmailLog.objects.get(provider_message_id=message_id)
            
            if event_type == 'delivered':
                log.status = 'ENVIADO'
                log.data_envio = timezone.now()
            
            elif event_type == 'open':
                log.marcar_como_aberto()
            
            elif event_type == 'click':
                log.marcar_como_clicado()
            
            elif event_type in ['bounce', 'dropped']:
                log.status = 'BOUNCE'
                log.erro_mensagem = event.get('reason', 'Bounce')
            
            elif event_type == 'spamreport':
                log.status = 'SPAM'
            
            log.save()
            
        except EmailLog.DoesNotExist:
            logger.warning(f"Log não encontrado para message_id: {message_id}")
            continue
    
    return Response({'success': True})


@api_view(['POST'])
def webhook_mailgun(request):
    """
    Webhook do Mailgun para rastreamento
    POST /api/email/webhooks/mailgun/
    """
    event_data = request.data.get('event-data', {})
    message_id = event_data.get('message', {}).get('headers', {}).get('message-id')
    event_type = event_data.get('event')
    
    try:
        log = EmailLog.objects.get(provider_message_id=message_id)
        
        if event_type == 'delivered':
            log.status = 'ENVIADO'
            log.data_envio = timezone.now()
        
        elif event_type == 'opened':
            log.marcar_como_aberto()
        
        elif event_type == 'clicked':
            log.marcar_como_clicado()
        
        elif event_type in ['failed', 'bounced']:
            log.status = 'BOUNCE'
            log.erro_mensagem = event_data.get('delivery-status', {}).get('message', 'Bounce')
        
        log.save()
        
    except EmailLog.DoesNotExist:
        logger.warning(f"Log não encontrado para message_id: {message_id}")
    
    return Response({'success': True})


# ===================================
# ENVIO DE E-MAIL DE DOCUMENTOS FISCAIS (NF-e, CT-e, MDF-e)
# ===================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_email_documento(request):
    """
    Envia e-mail com documentos fiscais (XML + DANFE/DACTE/DAMDFE) anexados.
    Aceita multipart/form-data para permitir upload de arquivos extras.
    
    POST /api/email/enviar-documento/
    
    Form fields:
        tipo: 'nfe' | 'cte' | 'mdfe'
        documento_id: ID do documento (id_venda, id_cte, id_mdfe)
        destinatario_email: email do destinatário
        destinatario_nome: nome do destinatário (opcional)
        assunto: assunto do email (opcional - gera automático)
        mensagem: corpo da mensagem (opcional - gera automático)
        anexar_xml: 'true' | 'false' (default 'true')
        anexar_pdf: 'true' | 'false' (default 'true') 
        arquivos_extras: arquivos extras via upload (multipart)
    """
    tipo = request.data.get('tipo', '').lower()
    documento_id = request.data.get('documento_id')
    destinatario_email = request.data.get('destinatario_email', '').strip()
    destinatario_nome = request.data.get('destinatario_nome', '').strip()
    assunto_custom = request.data.get('assunto', '').strip()
    mensagem_custom = request.data.get('mensagem', '').strip()
    anexar_xml = request.data.get('anexar_xml', 'true').lower() == 'true'
    anexar_pdf = request.data.get('anexar_pdf', 'true').lower() == 'true'
    
    if not tipo or tipo not in ('nfe', 'cte', 'mdfe'):
        return Response({'success': False, 'message': 'Tipo inválido. Use: nfe, cte ou mdfe'}, status=400)
    
    if not documento_id:
        return Response({'success': False, 'message': 'documento_id é obrigatório'}, status=400)
    
    if not destinatario_email or '@' not in destinatario_email:
        return Response({'success': False, 'message': 'E-mail do destinatário é obrigatório e deve ser válido'}, status=400)
    
    # Busca empresa
    empresa = EmpresaConfig.get_ativa()
    if not empresa:
        return Response({'success': False, 'message': 'Nenhuma empresa configurada no sistema'}, status=400)
    
    empresa_nome = empresa.nome_fantasia or empresa.nome_razao_social
    
    try:
        # Monta dados conforme o tipo
        anexos = []
        
        if tipo == 'nfe':
            doc = Venda.objects.select_related('id_cliente').get(pk=documento_id)
            numero = doc.numero_nfe or doc.pk
            chave = doc.chave_nfe or ''
            cliente_nome = doc.id_cliente.nome_razao_social if doc.id_cliente else ''
            cliente_id = doc.id_cliente.pk if doc.id_cliente else None
            valor_total = doc.valor_total
            
            assunto = assunto_custom or f'NF-e {numero} - {empresa_nome}'
            
            # XML
            if anexar_xml and doc.xml_nfe:
                anexos.append({
                    'nome': f'NFe_{numero}.xml',
                    'conteudo': doc.xml_nfe.encode('utf-8'),
                    'mime_type': 'application/xml'
                })
            
            # DANFE PDF
            if anexar_pdf and doc.chave_nfe:
                try:
                    from api.services.danfe_service import DanfeGenerator
                    generator = DanfeGenerator(doc)
                    pdf_buffer = generator.gerar_pdf()
                    anexos.append({
                        'nome': f'DANFE_{numero}.pdf',
                        'conteudo': pdf_buffer.getvalue(),
                        'mime_type': 'application/pdf'
                    })
                except Exception as e:
                    logger.warning(f"Não foi possível gerar DANFE para NF-e {numero}: {e}")
        
        elif tipo == 'cte':
            from cte.models import ConhecimentoTransporte
            doc = ConhecimentoTransporte.objects.select_related('remetente', 'destinatario').get(pk=documento_id)
            numero = doc.numero_cte or doc.pk
            chave = doc.chave_cte or ''
            # Destinatário do CT-e
            dest = doc.destinatario or doc.remetente
            cliente_nome = dest.nome_razao_social if dest else ''
            cliente_id = dest.pk if dest else None
            valor_total = doc.valor_total_servico if hasattr(doc, 'valor_total_servico') else 0
            
            assunto = assunto_custom or f'CT-e {numero} - {empresa_nome}'
            
            # XML
            if anexar_xml and doc.xml_cte:
                anexos.append({
                    'nome': f'CTe_{numero}.xml',
                    'conteudo': doc.xml_cte.encode('utf-8'),
                    'mime_type': 'application/xml'
                })
            
            # DACTE PDF
            if anexar_pdf and doc.chave_cte:
                try:
                    from api.services.dacte_service import DacteGenerator
                    gerador = DacteGenerator(doc)
                    pdf_buffer = gerador.gerar_pdf()
                    pdf_bytes = pdf_buffer.getvalue() if hasattr(pdf_buffer, 'getvalue') else pdf_buffer
                    anexos.append({
                        'nome': f'DACTE_{numero}.pdf',
                        'conteudo': pdf_bytes,
                        'mime_type': 'application/pdf'
                    })
                except Exception as e:
                    logger.warning(f"Não foi possível gerar DACTE para CT-e {numero}: {e}")
        
        elif tipo == 'mdfe':
            from mdfe.models import ManifestoEletronico
            doc = ManifestoEletronico.objects.select_related('tomador_cliente').get(pk=documento_id)
            numero = doc.numero_mdfe or doc.pk
            chave = doc.chave_mdfe or ''
            cliente_nome = ''
            cliente_id = None
            if doc.tomador_cliente:
                cliente_nome = doc.tomador_cliente.nome_razao_social
                cliente_id = doc.tomador_cliente.pk
            valor_total = doc.valor_total_carga or 0
            
            assunto = assunto_custom or f'MDF-e {numero} - {empresa_nome}'
            
            # XML
            if anexar_xml and doc.xml_mdfe:
                anexos.append({
                    'nome': f'MDFe_{numero}.xml',
                    'conteudo': doc.xml_mdfe.encode('utf-8'),
                    'mime_type': 'application/xml'
                })
            
            # DAMDFE PDF
            if anexar_pdf and doc.chave_mdfe:
                try:
                    from mdfe.services import MDFeService
                    service = MDFeService()
                    pdf_buffer = service.gerar_damdfe(doc)
                    anexos.append({
                        'nome': f'DAMDFE_{numero}.pdf',
                        'conteudo': pdf_buffer.getvalue(),
                        'mime_type': 'application/pdf'
                    })
                except Exception as e:
                    logger.warning(f"Não foi possível gerar DAMDFE para MDF-e {numero}: {e}")
        
        # Arquivos extras do upload
        arquivos_extras = request.FILES.getlist('arquivos_extras')
        for arq in arquivos_extras:
            anexos.append({
                'nome': arq.name,
                'conteudo': arq.read(),
                'mime_type': arq.content_type or 'application/octet-stream'
            })
        
        # Monta corpo HTML
        tipo_label = {'nfe': 'NF-e', 'cte': 'CT-e', 'mdfe': 'MDF-e'}[tipo]
        
        if mensagem_custom:
            html_body = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1a237e; color: #fff; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0;">{tipo_label} Nº {numero}</h2>
                    <p style="margin: 5px 0 0; opacity: 0.8;">{empresa_nome}</p>
                </div>
                <div style="padding: 20px; background: #f8f9fa; border: 1px solid #e0e0e0;">
                    <p style="white-space: pre-wrap;">{mensagem_custom}</p>
                </div>
                {f'<div style="padding: 10px 20px; background: #fff; border: 1px solid #e0e0e0; border-top: none; font-size: 12px; color: #666;"><strong>Chave de Acesso:</strong> {chave}</div>' if chave else ''}
                <div style="padding: 15px 20px; background: #fff; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; font-size: 11px; color: #999;">
                    E-mail enviado automaticamente por {empresa_nome}
                </div>
            </div>
            """
        else:
            valor_fmt = f"R$ {float(valor_total):,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            html_body = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1a237e; color: #fff; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0;">{tipo_label} Nº {numero}</h2>
                    <p style="margin: 5px 0 0; opacity: 0.8;">{empresa_nome}</p>
                </div>
                <div style="padding: 20px; background: #f8f9fa; border: 1px solid #e0e0e0;">
                    <p>Prezado(a) <strong>{destinatario_nome or cliente_nome or 'Cliente'}</strong>,</p>
                    <p>Segue em anexo o documento fiscal <strong>{tipo_label} Nº {numero}</strong>.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Número:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">{numero}</td></tr>
                        {f'<tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Valor Total:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">{valor_fmt}</td></tr>' if valor_total else ''}
                        {f'<tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Chave de Acesso:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-size: 11px;">{chave}</td></tr>' if chave else ''}
                    </table>
                </div>
                <div style="padding: 15px 20px; background: #fff; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; font-size: 11px; color: #999;">
                    E-mail enviado automaticamente por {empresa_nome}
                </div>
            </div>
            """
        
        # Envia via EmailService
        email_service = EmailService(empresa_id=empresa.id_empresa)
        
        log = email_service.send(
            destinatario_email=destinatario_email,
            assunto=assunto,
            html_body=html_body,
            destinatario_nome=destinatario_nome or cliente_nome,
            cliente_id=cliente_id,
            anexos=anexos if anexos else None
        )
        
        qtd_anexos = len(anexos)
        return Response({
            'success': True,
            'message': f'{tipo_label} Nº {numero} enviada por e-mail para {destinatario_email} ({qtd_anexos} anexo{"s" if qtd_anexos != 1 else ""})',
            'log_id': log.id_log
        })
    
    except Venda.DoesNotExist:
        return Response({'success': False, 'message': f'NF-e com ID {documento_id} não encontrada'}, status=404)
    except Exception as e:
        if 'ConhecimentoTransporte' in str(type(e)) or 'DoesNotExist' in str(e):
            return Response({'success': False, 'message': f'Documento com ID {documento_id} não encontrado'}, status=404)
        logger.exception(f"Erro ao enviar e-mail de documento ({tipo} #{documento_id}): {e}")
        return Response({'success': False, 'message': f'Erro ao enviar e-mail: {str(e)}'}, status=400)
