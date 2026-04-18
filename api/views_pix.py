"""
views_pix.py — Pix: Configuração, Cobranças dinâmicas, Webhook
"""
import hashlib
import hmac
import json
import logging
from rest_framework import viewsets, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView

from .models_pix import ConfiguracaoPix, CobrancaPix, WebhookPixLog
from .services.pix_service import PixService

logger = logging.getLogger(__name__)


# ── Serializers ──────────────────────────────────────────────────────────────


class ConfiguracaoPixSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracaoPix
        fields = '__all__'
        extra_kwargs = {
            'client_secret': {'write_only': True},
            'webhook_secret': {'write_only': True},
        }


class CobrancaPixSerializer(serializers.ModelSerializer):
    class Meta:
        model = CobrancaPix
        fields = '__all__'
        read_only_fields = [
            'txid', 'qr_code_payload', 'qr_code_imagem_base64', 'end_to_end_id',
            'expira_em', 'gerado_em', 'pago_em',
        ]


class CobrancaPixCriarSerializer(serializers.Serializer):
    valor = serializers.DecimalField(max_digits=10, decimal_places=2)
    descricao = serializers.CharField(max_length=140, required=False, default='')
    nome_pagador = serializers.CharField(max_length=100, required=False, default='')
    cpf_cnpj_pagador = serializers.CharField(max_length=18, required=False, default='')
    id_cliente = serializers.IntegerField(required=False, allow_null=True)
    id_venda = serializers.IntegerField(required=False, allow_null=True)
    expiracao_segundos = serializers.IntegerField(required=False, default=3600)


# ── ViewSets ─────────────────────────────────────────────────────────────────


class PixConfigViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracaoPix.objects.all()
    serializer_class = ConfiguracaoPixSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def testar_conexao(self, request, pk=None):
        config = self.get_object()
        if config.psp != 'EFI':
            return Response({'aviso': 'Teste de conexão disponível apenas para PSP Efí Bank.'})
        try:
            svc = PixService(config)
            token = svc._obter_token_efi()
            return Response({'sucesso': True, 'token_obtido': bool(token)})
        except Exception as exc:
            return Response({'sucesso': False, 'erro': str(exc)}, status=400)


class CobrancaPixViewSet(viewsets.ModelViewSet):
    serializer_class = CobrancaPixSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = CobrancaPix.objects.all()
        status_f = self.request.query_params.get('status')
        id_cliente = self.request.query_params.get('cliente')
        id_venda = self.request.query_params.get('venda')

        if status_f:
            qs = qs.filter(status=status_f)
        if id_cliente:
            qs = qs.filter(id_cliente=id_cliente)
        if id_venda:
            qs = qs.filter(id_venda=id_venda)
        return qs.order_by('-gerado_em')

    @action(detail=False, methods=['post'])
    def gerar(self, request):
        """Gera nova cobrança Pix (QR Code) usando a configuração ativa."""
        ser = CobrancaPixCriarSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        # Busca config ativa
        config = ConfiguracaoPix.objects.filter(ativo=True).first()
        if not config:
            return Response({'erro': 'Nenhuma configuração Pix ativa encontrada.'}, status=400)

        svc = PixService(config)
        try:
            cobranca = svc.gerar(
                valor=d['valor'],
                descricao=d.get('descricao', ''),
                nome_pagador=d.get('nome_pagador', ''),
                cpf_cnpj_pagador=d.get('cpf_cnpj_pagador', ''),
                id_cliente=d.get('id_cliente'),
                id_venda=d.get('id_venda'),
                expiracao_segundos=d.get('expiracao_segundos', 3600),
            )
            return Response(CobrancaPixSerializer(cobranca).data, status=201)
        except Exception as exc:
            logger.exception('Erro ao gerar Pix')
            return Response({'erro': str(exc)}, status=400)

    @action(detail=True, methods=['post'])
    def consultar_status(self, request, pk=None):
        """Consulta o status da cobrança na API do PSP."""
        cobranca = self.get_object()
        if cobranca.status in ('CONCLUIDA', 'REMOVIDA_PELO_USUARIO_RECEBEDOR', 'REMOVIDA_PELO_PSP'):
            return Response(CobrancaPixSerializer(cobranca).data)

        config = ConfiguracaoPix.objects.filter(ativo=True).first()
        if not config:
            return Response({'erro': 'Nenhuma configuração Pix ativa.'}, status=400)

        svc = PixService(config)
        try:
            cobranca_atualizada = svc.consultar_status(cobranca)
            return Response(CobrancaPixSerializer(cobranca_atualizada).data)
        except Exception as exc:
            logger.exception('Erro ao consultar Pix')
            return Response({'erro': str(exc)}, status=400)


# ── Webhook (AllowAny — validado por HMAC) ────────────────────────────────────


class WebhookPixView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_body = request.body
        sig_header = request.META.get('HTTP_X_WEBHOOK_SIGNATURE', '')

        # Valida assinatura HMAC se configurada
        config = ConfiguracaoPix.objects.filter(ativo=True).first()
        if config and config.webhook_secret:
            esperado = hmac.new(
                config.webhook_secret.encode(),
                raw_body,
                hashlib.sha256,
            ).hexdigest()
            if not hmac.compare_digest(esperado, sig_header):
                logger.warning('Webhook Pix: assinatura inválida')
                return Response({'erro': 'Assinatura inválida.'}, status=403)

        try:
            dados = json.loads(raw_body)
        except json.JSONDecodeError:
            return Response({'erro': 'Corpo inválido.'}, status=400)

        # Salva o log bruto
        WebhookPixLog.objects.create(
            headers=dict(request.headers),
            payload=dados,
        )

        # Processa cada pix no array
        for pix_event in dados.get('pix', []):
            txid = pix_event.get('txid')
            end_to_end = pix_event.get('endToEndId', '')
            valor_pago = pix_event.get('valor', '')

            if txid:
                try:
                    cobranca = CobrancaPix.objects.get(txid=txid)
                    cobranca.status = 'CONCLUIDA'
                    cobranca.end_to_end_id = end_to_end
                    import decimal
                    from django.utils import timezone
                    cobranca.pago_em = timezone.now()
                    cobranca.valor_pago = decimal.Decimal(str(valor_pago)) if valor_pago else cobranca.valor
                    cobranca.save(update_fields=['status', 'end_to_end_id', 'pago_em', 'valor_pago'])
                    logger.info(f'Pix confirmado: txid={txid}')
                except CobrancaPix.DoesNotExist:
                    logger.warning(f'Webhook Pix: txid não encontrado: {txid}')

        return Response({'recebido': True})
