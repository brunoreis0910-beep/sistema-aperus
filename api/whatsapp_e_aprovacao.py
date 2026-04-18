"""
Módulo unificado: WhatsApp + Aprovação de Desconto
Consolida imports de views_aprovacao_whatsapp.py e whatsapp_views_nativo.py
"""

# ═══════════════════════════════════════════════════════════════════════════
# APROVAÇÃO DE DESCONTO VIA WHATSAPP
# ═══════════════════════════════════════════════════════════════════════════
from .views_aprovacao_whatsapp import (
    SolicitarDescontoWhatsAppView,
    WebhookAprovacaoView,
    StatusAprovacaoView,
    WebhookCloudAprovacaoView,
    WhatsAppStatusView,
    DesktopListenerView,
    ResponderAprovacaoView,
    LinkCurtoAprovacaoView,
)

# ═══════════════════════════════════════════════════════════════════════════
# VIEWS WHATSAPP - FILA, CONFIG, QR CODE, ETC
# ═══════════════════════════════════════════════════════════════════════════  
from .whatsapp_views_nativo import (
    fila_whatsapp_view,
    fila_whatsapp_detail,
    config_whatsapp_view,
    gerar_qrcode_whatsapp,
    buscar_qrcode_whatsapp,
    limpar_sessao_playwright,
    verificar_status_whatsapp,
    enviar_agora_whatsapp,
    gerar_qr_teste_whatsapp,
    abrir_whatsapp_direto,
)

# ═══════════════════════════════════════════════════════════════════════════
# EVOLUTION API - GERENCIAMENTO DE INSTÂNCIA
# ═══════════════════════════════════════════════════════════════════════════
from .evolution_views import (
    evolution_criar_instancia,
    evolution_qrcode,
    evolution_status,
)

# Exporta tudo para facilitar import em urls.py
__all__ = [
    # Aprovação
    'SolicitarDescontoWhatsAppView',
    'WebhookAprovacaoView',
    'StatusAprovacaoView',
    'WebhookCloudAprovacaoView',
    'WhatsAppStatusView',
    'DesktopListenerView',
    'ResponderAprovacaoView',
    'LinkCurtoAprovacaoView',
    # Fila e config
    'fila_whatsapp_view',
    'fila_whatsapp_detail',
    'config_whatsapp_view',
    # QR Code, status, conexão
    'gerar_qrcode_whatsapp',
    'buscar_qrcode_whatsapp',
    'limpar_sessao_playwright',
    'verificar_status_whatsapp',
    # Ações
    'enviar_agora_whatsapp',
    'gerar_qr_teste_whatsapp',
    'abrir_whatsapp_direto',
    # Evolution API
    'evolution_criar_instancia',
    'evolution_qrcode',
    'evolution_status',
]
