"""
Serializers para Sistema de E-mail Marketing
"""

from rest_framework import serializers
from api.models import EmailConfig, EmailTemplate, EmailCampaign, EmailLog


class EmailConfigSerializer(serializers.ModelSerializer):
    """Serializer para configurações de e-mail"""
    
    empresa_nome = serializers.CharField(source='empresa.razao_social', read_only=True)
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    
    class Meta:
        model = EmailConfig
        fields = [
            'id_config', 'empresa', 'empresa_nome', 'provider', 'provider_display',
            'is_default', 'ativo', 'smtp_host', 'smtp_port', 'smtp_username',
            'smtp_password', 'smtp_use_tls', 'smtp_use_ssl', 'api_key',
            'api_secret', 'api_region', 'api_domain', 'from_email', 'from_name',
            'reply_to_email', 'daily_limit', 'daily_sent_count', 'last_reset_date',
            'criado_em', 'atualizado_em'
        ]
        read_only_fields = ['id_config', 'daily_sent_count', 'last_reset_date', 'criado_em', 'atualizado_em']
        extra_kwargs = {
            'smtp_password': {'write_only': True},
            'api_key': {'write_only': True},
            'api_secret': {'write_only': True}
        }
    
    def validate(self, data):
        """Valida e corrige configurações SMTP incorretas"""
        smtp_port = data.get('smtp_port')
        smtp_use_tls = data.get('smtp_use_tls')
        smtp_use_ssl = data.get('smtp_use_ssl')
        
        # Auto-corrige configuração baseada na porta
        if smtp_port == 465:
            # Porta 465 = SSL (não TLS)
            data['smtp_use_ssl'] = True
            data['smtp_use_tls'] = False
        elif smtp_port in (587, 25):
            # Porta 587/25 = TLS (não SSL)
            data['smtp_use_tls'] = True
            data['smtp_use_ssl'] = False
        
        # Valida que não tenham ambos True simultaneamente
        if data.get('smtp_use_tls') and data.get('smtp_use_ssl'):
            # Prioriza TLS (mais comum)
            data['smtp_use_ssl'] = False
        
        return data


class EmailTemplateSerializer(serializers.ModelSerializer):
    """Serializer para templates de e-mail"""
    
    empresa_nome = serializers.CharField(source='empresa.razao_social', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    usuario_criador_nome = serializers.CharField(source='usuario_criador.username', read_only=True)
    
    class Meta:
        model = EmailTemplate
        fields = [
            'id_template', 'empresa', 'empresa_nome', 'nome', 'slug', 'categoria',
            'categoria_display', 'descricao', 'assunto', 'html_body', 'text_body',
            'variaveis_disponiveis', 'preview_text', 'design_json', 'ativo',
            'criado_em', 'atualizado_em', 'usuario_criador', 'usuario_criador_nome'
        ]
        read_only_fields = ['id_template', 'criado_em', 'atualizado_em', 'usuario_criador']


class EmailCampaignSerializer(serializers.ModelSerializer):
    """Serializer para campanhas de e-mail"""
    
    empresa_nome = serializers.CharField(source='empresa.razao_social', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    template_nome = serializers.CharField(source='template.nome', read_only=True)
    usuario_criador_nome = serializers.CharField(source='usuario_criador.username', read_only=True)
    taxa_abertura = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    taxa_cliques = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = EmailCampaign
        fields = [
            'id_campanha', 'empresa', 'empresa_nome', 'template', 'template_nome',
            'nome', 'descricao', 'destinatarios_query', 'lista_emails', 'segmento',
            'status', 'status_display', 'data_agendamento', 'data_inicio_envio',
            'data_fim_envio', 'total_destinatarios', 'total_enviados', 'total_abertos',
            'total_cliques', 'total_bounces', 'total_cancelados', 'taxa_abertura',
            'taxa_cliques', 'is_ab_test', 'ab_test_percentage', 'criado_em',
            'atualizado_em', 'usuario_criador', 'usuario_criador_nome'
        ]
        read_only_fields = [
            'id_campanha', 'total_destinatarios', 'total_enviados', 'total_abertos',
            'total_cliques', 'total_bounces', 'total_cancelados', 'data_inicio_envio',
            'data_fim_envio', 'criado_em', 'atualizado_em', 'usuario_criador'
        ]


class EmailLogSerializer(serializers.ModelSerializer):
    """Serializer para logs de e-mail"""
    
    empresa_nome = serializers.CharField(source='empresa.razao_social', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    template_nome = serializers.CharField(source='template.nome', read_only=True, allow_null=True)
    campanha_nome = serializers.CharField(source='campanha.nome', read_only=True, allow_null=True)
    config_provider = serializers.CharField(source='config.provider', read_only=True, allow_null=True)
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True, allow_null=True)
    
    class Meta:
        model = EmailLog
        fields = [
            'id_log', 'empresa', 'empresa_nome', 'config', 'config_provider',
            'template', 'template_nome', 'campanha', 'campanha_nome',
            'destinatario_email', 'destinatario_nome', 'cliente', 'cliente_nome',
            'assunto', 'html_body', 'text_body', 'anexos', 'status', 'status_display',
            'provider_message_id', 'erro_mensagem', 'tentativas_envio', 'data_envio',
            'data_abertura', 'total_aberturas', 'data_primeiro_clique', 'total_cliques',
            'user_agent', 'ip_address', 'criado_em', 'atualizado_em'
        ]
        read_only_fields = [
            'id_log', 'status', 'provider_message_id', 'erro_mensagem', 'tentativas_envio',
            'data_envio', 'data_abertura', 'total_aberturas', 'data_primeiro_clique',
            'total_cliques', 'user_agent', 'ip_address', 'criado_em', 'atualizado_em'
        ]


class EmailCampaignListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listagem de campanhas"""
    
    template_nome = serializers.CharField(source='template.nome', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    taxa_abertura = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = EmailCampaign
        fields = [
            'id_campanha', 'nome', 'template_nome', 'status', 'status_display',
            'total_destinatarios', 'total_enviados', 'total_abertos', 'taxa_abertura',
            'data_agendamento', 'data_inicio_envio', 'criado_em'
        ]


class EmailLogListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listagem de logs"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    campanha_nome = serializers.CharField(source='campanha.nome', read_only=True, allow_null=True)
    
    class Meta:
        model = EmailLog
        fields = [
            'id_log', 'destinatario_email', 'destinatario_nome', 'assunto',
            'status', 'status_display', 'campanha_nome', 'data_envio',
            'data_abertura', 'total_aberturas', 'total_cliques', 'criado_em'
        ]
