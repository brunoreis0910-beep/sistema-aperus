"""
Sistema de E-mail Marketing e Transacional Multi-Provedor
==========================================================

Suporta:
- SMTP (padrão)
- SendGrid
- Amazon SES
- Mailgun
- Gmail API
- Microsoft Outlook

Recursos:
- Rate limiting por provedor
- Retry com backoff exponencial
- Rastreamento de aberturas/cliques
- Templates HTML
- Anexos
- Fila assíncrona (Celery)
"""

import smtplib
import requests
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from email.utils import formataddr
from django.conf import settings
from django.utils import timezone
from api.models import EmailConfig, EmailTemplate, EmailLog, EmailCampaign

logger = logging.getLogger(__name__)


class EmailServiceError(Exception):
    """Exceção customizada para erros de envio"""
    pass


class EmailService:
    """
    Serviço centralizado de envio de e-mails
    """
    
    def __init__(self, empresa_id, config_id=None):
        """
        Inicializa o serviço para uma empresa específica
        
        Args:
            empresa_id: ID da empresa
            config_id: ID da configuração específica (opcional, usa default)
        """
        self.empresa_id = empresa_id
        
        if config_id:
            self.config = EmailConfig.objects.get(id_config=config_id, ativo=True)
        else:
            # Busca configuração padrão da empresa
            self.config = EmailConfig.objects.filter(
                empresa_id=empresa_id,
                is_default=True,
                ativo=True
            ).first()
            
            if not self.config:
                raise EmailServiceError("Nenhuma configuração de e-mail ativa encontrada para esta empresa")
    
    def send(self, 
             destinatario_email,
             assunto,
             html_body,
             template_id=None,
             campanha_id=None,
             destinatario_nome=None,
             cliente_id=None,
             text_body=None,
             anexos=None,
             reply_to=None):
        """
        Envia e-mail através do provedor configurado
        
        Args:
            destinatario_email: E-mail do destinatário
            assunto: Assunto do e-mail
            html_body: Corpo HTML
            template_id: ID do template usado (opcional)
            campanha_id: ID da campanha (opcional)
            destinatario_nome: Nome do destinatário
            cliente_id: ID do cliente (opcional)
            text_body: Versão texto puro
            anexos: Lista de anexos [{nome, conteudo, mime_type}]
            reply_to: E-mail de resposta customizado
        
        Returns:
            EmailLog: Registro do log criado
        """
        
        # Verifica limite diário
        if not self.config.can_send():
            raise EmailServiceError(f"Limite diário excedido: {self.config.daily_limit}")
        
        # Cria registro de log
        log = EmailLog.objects.create(
            empresa_id=self.empresa_id,
            config=self.config,
            template_id=template_id,
            campanha_id=campanha_id,
            destinatario_email=destinatario_email,
            destinatario_nome=destinatario_nome or '',
            cliente_id=cliente_id,
            assunto=assunto,
            html_body=html_body,
            text_body=text_body or '',
            anexos=[{k: v for k, v in a.items() if k != 'conteudo'} for a in (anexos or [])],
            status='ENVIANDO'
        )
        
        try:
            # Escolhe método de envio baseado no provedor
            if self.config.provider in ('SMTP', 'GMAIL', 'OUTLOOK'):
                message_id = self._send_via_smtp(
                    destinatario_email, destinatario_nome, assunto, 
                    html_body, text_body, anexos, reply_to
                )
            elif self.config.provider == 'SENDGRID':
                message_id = self._send_via_sendgrid(
                    destinatario_email, destinatario_nome, assunto, 
                    html_body, text_body, anexos, reply_to
                )
            elif self.config.provider == 'SES':
                message_id = self._send_via_ses(
                    destinatario_email, destinatario_nome, assunto, 
                    html_body, text_body, anexos, reply_to
                )
            elif self.config.provider == 'MAILGUN':
                message_id = self._send_via_mailgun(
                    destinatario_email, destinatario_nome, assunto, 
                    html_body, text_body, anexos, reply_to
                )
            else:
                raise EmailServiceError(f"Provedor não suportado: {self.config.provider}")
            
            # Marca como enviado
            log.marcar_como_enviado(message_id)
            
            # Incrementa contador
            self.config.increment_sent_count()
            
            # Atualiza campanha se houver
            if campanha_id:
                campanha = EmailCampaign.objects.get(id_campanha=campanha_id)
                campanha.total_enviados += 1
                campanha.save()
            
            logger.info(f"E-mail enviado com sucesso para {destinatario_email} via {self.config.provider}")
            return log
            
        except Exception as e:
            log.status = 'ERRO'
            log.erro_mensagem = str(e)
            log.tentativas_envio += 1
            log.save()
            logger.error(f"Erro ao enviar e-mail para {destinatario_email}: {str(e)}")
            raise EmailServiceError(f"Falha no envio: {str(e)}")
    
    def send_from_template(self, 
                          template_slug,
                          destinatario_email,
                          context,
                          destinatario_nome=None,
                          cliente_id=None,
                          campanha_id=None,
                          anexos=None):
        """
        Envia e-mail usando um template
        
        Args:
            template_slug: Slug do template
            destinatario_email: E-mail destinatário
            context: Dict com variáveis para renderizar o template
            destinatario_nome: Nome do destinatário
            cliente_id: ID do cliente
            campanha_id: ID da campanha
            anexos: Lista de anexos
        
        Returns:
            EmailLog: Registro do log criado
        """
        try:
            template = EmailTemplate.objects.get(
                empresa_id=self.empresa_id,
                slug=template_slug,
                ativo=True
            )
        except EmailTemplate.DoesNotExist:
            raise EmailServiceError(f"Template '{template_slug}' não encontrado")
        
        # Renderiza template
        rendered = template.render(context)
        
        return self.send(
            destinatario_email=destinatario_email,
            assunto=rendered['subject'],
            html_body=rendered['html_body'],
            text_body=rendered['text_body'],
            template_id=template.id_template,
            campanha_id=campanha_id,
            destinatario_nome=destinatario_nome,
            cliente_id=cliente_id,
            anexos=anexos
        )
    
    def _send_via_smtp(self, to_email, to_name, subject, html_body, text_body, anexos, reply_to):
        """Envia via SMTP padrão"""
        msg = MIMEMultipart('alternative')
        msg['From'] = formataddr((self.config.from_name, self.config.from_email))
        msg['To'] = formataddr((to_name or '', to_email))
        msg['Subject'] = subject
        msg['Reply-To'] = reply_to or self.config.reply_to_email or self.config.from_email
        
        # Adiciona corpo texto
        if text_body:
            msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
        
        # Adiciona corpo HTML
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        # Adiciona anexos
        if anexos:
            for anexo in anexos:
                part = MIMEApplication(anexo['conteudo'], Name=anexo['nome'])
                part['Content-Disposition'] = f'attachment; filename="{anexo["nome"]}"'
                msg.attach(part)
        
        # Conecta e envia
        if self.config.smtp_use_ssl:
            server = smtplib.SMTP_SSL(self.config.smtp_host, self.config.smtp_port)
        else:
            server = smtplib.SMTP(self.config.smtp_host, self.config.smtp_port)
            if self.config.smtp_use_tls:
                server.starttls()
        
        if self.config.smtp_username and self.config.smtp_password:
            server.login(self.config.smtp_username, self.config.smtp_password)
        
        server.sendmail(self.config.from_email, to_email, msg.as_string())
        server.quit()
        
        # SMTP não retorna message_id único, gera um
        import uuid
        return f"smtp-{uuid.uuid4()}"
    
    def _send_via_sendgrid(self, to_email, to_name, subject, html_body, text_body, anexos, reply_to):
        """Envia via SendGrid API"""
        url = "https://api.sendgrid.com/v3/mail/send"
        
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json"
        }
        
        personalizations = [{
            "to": [{"email": to_email, "name": to_name or ""}],
            "subject": subject
        }]
        
        content = [{"type": "text/html", "value": html_body}]
        if text_body:
            content.insert(0, {"type": "text/plain", "value": text_body})
        
        payload = {
            "personalizations": personalizations,
            "from": {
                "email": self.config.from_email,
                "name": self.config.from_name
            },
            "reply_to": {
                "email": reply_to or self.config.reply_to_email or self.config.from_email
            },
            "content": content,
            "tracking_settings": {
                "click_tracking": {"enable": True},
                "open_tracking": {"enable": True}
            }
        }
        
        # Adiciona anexos
        if anexos:
            attachments = []
            for anexo in anexos:
                import base64
                attachments.append({
                    "content": base64.b64encode(anexo['conteudo']).decode(),
                    "filename": anexo['nome'],
                    "type": anexo.get('mime_type', 'application/octet-stream'),
                    "disposition": "attachment"
                })
            payload['attachments'] = attachments
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code not in [200, 202]:
            raise EmailServiceError(f"SendGrid retornou erro: {response.text}")
        
        # SendGrid retorna X-Message-Id no header
        return response.headers.get('X-Message-Id', f"sendgrid-{timezone.now().timestamp()}")
    
    def _send_via_ses(self, to_email, to_name, subject, html_body, text_body, anexos, reply_to):
        """Envia via Amazon SES"""
        try:
            import boto3
        except ImportError:
            raise EmailServiceError("boto3 não instalado. Execute: pip install boto3")
        
        ses_client = boto3.client(
            'ses',
            region_name=self.config.api_region or 'us-east-1',
            aws_access_key_id=self.config.api_key,
            aws_secret_access_key=self.config.api_secret
        )
        
        # Prepara destinatários
        destination = {'ToAddresses': [to_email]}
        
        # Prepara mensagem
        message = {
            'Subject': {'Data': subject, 'Charset': 'UTF-8'},
            'Body': {
                'Html': {'Data': html_body, 'Charset': 'UTF-8'}
            }
        }
        
        if text_body:
            message['Body']['Text'] = {'Data': text_body, 'Charset': 'UTF-8'}
        
        # Se tem anexos, precisa usar send_raw_email
        if anexos:
            msg = MIMEMultipart('mixed')
            msg['From'] = formataddr((self.config.from_name, self.config.from_email))
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg_body = MIMEMultipart('alternative')
            if text_body:
                msg_body.attach(MIMEText(text_body, 'plain', 'utf-8'))
            msg_body.attach(MIMEText(html_body, 'html', 'utf-8'))
            msg.attach(msg_body)
            
            for anexo in anexos:
                part = MIMEApplication(anexo['conteudo'], Name=anexo['nome'])
                part['Content-Disposition'] = f'attachment; filename="{anexo["nome"]}"'
                msg.attach(part)
            
            response = ses_client.send_raw_email(
                Source=self.config.from_email,
                Destinations=[to_email],
                RawMessage={'Data': msg.as_string()}
            )
        else:
            response = ses_client.send_email(
                Source=f"{self.config.from_name} <{self.config.from_email}>",
                Destination=destination,
                Message=message,
                ReplyToAddresses=[reply_to or self.config.reply_to_email or self.config.from_email]
            )
        
        return response['MessageId']
    
    def _send_via_mailgun(self, to_email, to_name, subject, html_body, text_body, anexos, reply_to):
        """Envia via Mailgun API"""
        url = f"https://api.mailgun.net/v3/{self.config.api_domain}/messages"
        
        auth = ("api", self.config.api_key)
        
        data = {
            "from": f"{self.config.from_name} <{self.config.from_email}>",
            "to": f"{to_name} <{to_email}>" if to_name else to_email,
            "subject": subject,
            "html": html_body,
            "h:Reply-To": reply_to or self.config.reply_to_email or self.config.from_email,
            "o:tracking": "yes",
            "o:tracking-clicks": "yes",
            "o:tracking-opens": "yes"
        }
        
        if text_body:
            data["text"] = text_body
        
        files = []
        if anexos:
            for anexo in anexos:
                files.append(("attachment", (anexo['nome'], anexo['conteudo'])))
        
        response = requests.post(url, auth=auth, data=data, files=files or None)
        
        if response.status_code != 200:
            raise EmailServiceError(f"Mailgun retornou erro: {response.text}")
        
        return response.json().get('id', f"mailgun-{timezone.now().timestamp()}")


# ===================================
# FUNÇÕES DE ATALHO TRANSACIONAIS
# ===================================

def enviar_nfe_por_email(venda_id, cliente_email):
    """Envia NF-e PDF e XML por e-mail"""
    from api.models import Venda
    
    venda = Venda.objects.get(id_venda=venda_id)
    
    # Busca arquivos da NF-e
    anexos = []
    if hasattr(venda, 'nfe_pdf_path') and venda.nfe_pdf_path:
        with open(venda.nfe_pdf_path, 'rb') as f:
            anexos.append({
                'nome': f'NFe_{venda.nfe_numero}.pdf',
                'conteudo': f.read(),
                'mime_type': 'application/pdf'
            })
    
    if hasattr(venda, 'nfe_xml_path') and venda.nfe_xml_path:
        with open(venda.nfe_xml_path, 'rb') as f:
            anexos.append({
                'nome': f'NFe_{venda.nfe_numero}.xml',
                'conteudo': f.read(),
                'mime_type': 'application/xml'
            })
    
    # Envia com template
    service = EmailService(empresa_id=venda.empresa_id)
    
    context = {
        'cliente_nome': venda.cliente.nome,
        'nfe_numero': venda.nfe_numero,
        'nfe_serie': venda.nfe_serie,
        'data_emissao': venda.data_emissao.strftime('%d/%m/%Y'),
        'valor_total': f"R$ {venda.valor_total:.2f}",
        'empresa_nome': venda.empresa.razao_social
    }
    
    return service.send_from_template(
        template_slug='nfe-enviada',
        destinatario_email=cliente_email,
        context=context,
        destinatario_nome=venda.cliente.nome,
        cliente_id=venda.cliente_id,
        anexos=anexos
    )


def enviar_boleto_por_email(financeiro_id, cliente_email):
    """Envia boleto bancário por e-mail"""
    from api.models import FinanceiroConta
    
    conta = FinanceiroConta.objects.get(id_conta=financeiro_id)
    
    anexos = []
    if hasattr(conta, 'boleto_pdf_path') and conta.boleto_pdf_path:
        with open(conta.boleto_pdf_path, 'rb') as f:
            anexos.append({
                'nome': f'Boleto_{conta.nosso_numero}.pdf',
                'conteudo': f.read(),
                'mime_type': 'application/pdf'
            })
    
    service = EmailService(empresa_id=conta.empresa_id)
    
    context = {
        'cliente_nome': conta.cliente.nome,
        'valor': f"R$ {conta.valor:.2f}",
        'vencimento': conta.data_vencimento.strftime('%d/%m/%Y'),
        'linha_digitavel': conta.linha_digitavel,
        'empresa_nome': conta.empresa.razao_social
    }
    
    return service.send_from_template(
        template_slug='boleto-gerado',
        destinatario_email=cliente_email,
        context=context,
        destinatario_nome=conta.cliente.nome,
        cliente_id=conta.cliente_id,
        anexos=anexos
    )


def enviar_lembrete_vencimento(financeiro_id, dias_antecedencia=3):
    """Envia lembrete de boleto a vencer"""
    from api.models import FinanceiroConta
    from datetime import timedelta
    
    conta = FinanceiroConta.objects.get(id_conta=financeiro_id)
    
    service = EmailService(empresa_id=conta.empresa_id)
    
    context = {
        'cliente_nome': conta.cliente.nome,
        'valor': f"R$ {conta.valor:.2f}",
        'vencimento': conta.data_vencimento.strftime('%d/%m/%Y'),
        'dias_restantes': dias_antecedencia,
        'empresa_nome': conta.empresa.razao_social
    }
    
    return service.send_from_template(
        template_slug='lembrete-vencimento',
        destinatario_email=conta.cliente.email,
        context=context,
        destinatario_nome=conta.cliente.nome,
        cliente_id=conta.cliente_id
    )
