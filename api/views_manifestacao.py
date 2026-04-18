"""
views_manifestacao.py — API views para Manifestação do Destinatário NF-e
========================================================================
Endpoints:
  GET  /api/manifestacao/                  → lista registros salvos
  POST /api/manifestacao/manifestar/       → envia evento ao SEFAZ
  POST /api/manifestacao/consultar-nfes/   → consulta DistribuicaoDFe
  GET  /api/manifestacao/<int:id>/         → detalhe de um registro
"""

import logging
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated

from .models import EmpresaConfig, ManifestacaoNFe
from .services.manifestacao_service import ManifestacaoService

logger = logging.getLogger(__name__)

# ─── Serializer simples ──────────────────────────────────────────────────────

TIPO_EVENTO_DESCRICAO = {
    '210210': 'Ciência da Operação',
    '210200': 'Confirmação da Operação',
    '210240': 'Desconhecimento da Operação',
    '210220': 'Operação não Realizada',
}


class ManifestacaoNFeSerializer(serializers.ModelSerializer):
    tipo_evento_descricao = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = ManifestacaoNFe
        fields = [
            'id_manifestacao', 'chave_nfe', 'numero_nfe', 'serie',
            'emitente_nome', 'emitente_cnpj', 'valor_nfe', 'data_emissao',
            'tipo_evento', 'tipo_evento_descricao', 'n_seq_evento',
            'justificativa', 'status', 'status_display',
            'c_stat', 'x_motivo', 'protocolo', 'dh_reg_evento',
            'criado_em', 'atualizado_em',
        ]

    def get_tipo_evento_descricao(self, obj):
        return TIPO_EVENTO_DESCRICAO.get(obj.tipo_evento, obj.tipo_evento)

    def get_status_display(self, obj):
        return dict(ManifestacaoNFe.STATUS_CHOICES).get(obj.status, obj.status)


# ─── Helpers ────────────────────────────────────────────────────────────────

def _get_empresa_config(request):
    """Retorna a EmpresaConfig do usuário autenticado ou a primeira da base."""
    qs = EmpresaConfig.objects.all()
    if hasattr(request, 'user') and request.user.is_authenticated:
        # Tenta filtrar pela empresa do usuário (campo empresa_fk se existir)
        try:
            ec = qs.filter(usuario=request.user).first()
            if ec:
                return ec
        except Exception:
            pass
    return qs.first()


# ─── View: Listar / Detalhar ─────────────────────────────────────────────────

class ManifestacaoListView(APIView):
    """
    GET /api/manifestacao/
    Lista todos os registros de manifestação do destinatário.
    Filtros opcionais via query params: tipo_evento, status, chave_nfe.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ManifestacaoNFe.objects.all().order_by('-criado_em')

        tipo_evento = request.query_params.get('tipo_evento')
        status_filtro = request.query_params.get('status')
        chave_nfe = request.query_params.get('chave_nfe')
        texto = request.query_params.get('q')

        if tipo_evento:
            qs = qs.filter(tipo_evento=tipo_evento)
        if status_filtro:
            qs = qs.filter(status=status_filtro)
        if chave_nfe:
            qs = qs.filter(chave_nfe__icontains=chave_nfe)
        if texto:
            qs = qs.filter(
                emitente_nome__icontains=texto
            ) | qs.filter(
                emitente_cnpj__icontains=texto
            ) | qs.filter(
                chave_nfe__icontains=texto
            )

        serializer = ManifestacaoNFeSerializer(qs, many=True)
        return Response(serializer.data)


class ManifestacaoDetalheView(APIView):
    """
    GET /api/manifestacao/<id>/
    Retorna o detalhe de um único registro, incluindo XMLs.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            obj = ManifestacaoNFe.objects.get(pk=pk)
        except ManifestacaoNFe.DoesNotExist:
            return Response({'erro': 'Manifestação não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        data = ManifestacaoNFeSerializer(obj).data
        # Inclui os XMLs apenas no detalhe
        data['xml_evento'] = obj.xml_evento
        return Response(data)


# ─── View: Enviar Manifestação ────────────────────────────────────────────────

class ManifestacaoManifstarView(APIView):
    """
    POST /api/manifestacao/manifestar/
    Body JSON:
      {
        "chave_nfe": "44 dígitos",
        "tipo_evento": "210210|210200|210240|210220",
        "justificativa": "texto (obrigatório apenas para 210220)",
        "n_seq_evento": 1  (opcional, default 1)
      }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        chave_nfe = request.data.get('chave_nfe', '').strip()
        tipo_evento = str(request.data.get('tipo_evento', '')).strip()
        justificativa = request.data.get('justificativa', '').strip()
        n_seq = int(request.data.get('n_seq_evento', 1))

        # ── Validações básicas ────────────────────────────────────────────
        if not chave_nfe or len(chave_nfe) != 44:
            return Response(
                {'erro': 'chave_nfe inválida. Deve ter exatamente 44 dígitos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tipos_validos = ['210210', '210200', '210240', '210220']
        if tipo_evento not in tipos_validos:
            return Response(
                {'erro': f'tipo_evento inválido. Use um de: {", ".join(tipos_validos)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if tipo_evento == '210220' and (not justificativa or len(justificativa) < 15):
            return Response(
                {'erro': 'Para Operação não Realizada (210220) a justificativa é obrigatória e deve ter pelo menos 15 caracteres.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Empresa ───────────────────────────────────────────────────────
        empresa_config = _get_empresa_config(request)
        if not empresa_config:
            return Response(
                {'erro': 'EmpresaConfig não encontrada. Verifique o cadastro da empresa.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if not empresa_config.certificado_digital:
            return Response(
                {'erro': 'Certificado digital não configurado na empresa.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Serviço ───────────────────────────────────────────────────────
        try:
            service = ManifestacaoService(empresa_config)
            resultado = service.manifestar(
                chave_nfe=chave_nfe,
                tipo_evento=tipo_evento,
                justificativa=justificativa or None,
                n_seq=n_seq,
            )
        except Exception as exc:
            logger.exception('Erro ao instanciar/chamar ManifestacaoService')
            return Response(
                {'erro': f'Erro interno ao processar manifestação: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ── Persistência ──────────────────────────────────────────────────
        novo_status = 'REGISTRADO' if resultado.get('sucesso') else 'REJEITADO'
        if not resultado.get('sucesso') and not resultado.get('c_stat'):
            novo_status = 'ERRO'

        # Verifica se já existe um registro para esta combinação (upsert)
        obj, criado = ManifestacaoNFe.objects.get_or_create(
            chave_nfe=chave_nfe,
            tipo_evento=tipo_evento,
            n_seq_evento=n_seq,
            defaults={
                'usuario': request.user,
            }
        )

        obj.status = novo_status
        obj.c_stat = resultado.get('c_stat', '') or ''
        obj.x_motivo = resultado.get('x_motivo', '') or ''
        obj.protocolo = resultado.get('protocolo', '') or ''
        dh_raw = resultado.get('dh_reg_evento')
        if dh_raw:
            try:
                from django.utils.dateparse import parse_datetime
                obj.dh_reg_evento = parse_datetime(str(dh_raw).replace('T', ' ').replace('-03:00', '').replace('-04:00', '').strip())
            except Exception:
                obj.dh_reg_evento = None
        else:
            obj.dh_reg_evento = None
        obj.xml_evento = resultado.get('xml_evento', '') or ''
        obj.justificativa = justificativa
        obj.atualizado_em = timezone.now()
        obj.save()

        return Response({
            'sucesso': resultado.get('sucesso', False),
            'c_stat': resultado.get('c_stat'),
            'x_motivo': resultado.get('x_motivo'),
            'protocolo': resultado.get('protocolo'),
            'dh_reg_evento': resultado.get('dh_reg_evento'),
            'id_manifestacao': obj.id_manifestacao,
            'status': novo_status,
        }, status=status.HTTP_200_OK)


# ─── View: Consultar NF-es Recebidas ────────────────────────────────────────

class ManifestacaoConsultarNFesView(APIView):
    """
    POST /api/manifestacao/consultar-nfes/
    Body JSON (opcional):
      {
        "ult_nsu": "000000000000000"   (NSU a partir do qual consultar)
      }
    Retorna lista de NF-es recebidas pelo DistribuicaoDFe.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ult_nsu = request.data.get('ult_nsu', '000000000000000')

        empresa_config = _get_empresa_config(request)
        if not empresa_config:
            return Response(
                {'erro': 'EmpresaConfig não encontrada.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if not empresa_config.certificado_digital:
            return Response(
                {'erro': 'Certificado digital não configurado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service = ManifestacaoService(empresa_config)
            resultado = service.consultar_nfes_recebidas(ult_nsu=ult_nsu)
        except Exception as exc:
            logger.exception('Erro ao consultar NF-es recebidas')
            return Response(
                {'erro': f'Erro ao consultar SEFAZ: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if not resultado.get('sucesso'):
            return Response({
                'sucesso': False,
                'c_stat': resultado.get('c_stat'),
                'x_motivo': resultado.get('x_motivo'),
                'nfes': [],
                'ult_nsu': ult_nsu,
                'max_nsu': ult_nsu,
            }, status=status.HTTP_200_OK)

        return Response({
            'sucesso': True,
            'c_stat': resultado.get('c_stat'),
            'x_motivo': resultado.get('x_motivo'),
            'nfes': resultado.get('nfes', []),
            'ult_nsu': resultado.get('ult_nsu', ult_nsu),
            'max_nsu': resultado.get('max_nsu', ult_nsu),
        }, status=status.HTTP_200_OK)


# ─── View: Histórico do NSU ────────────────────────────────────────────────

class ManifestacaoUltNSUView(APIView):
    """
    GET /api/manifestacao/ult-nsu/
    Retorna o último NSU registrado para uso na próxima consulta.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # O último NSU fica no campo protocolo das consultas, mas podemos usar
        # um campo separado. Por ora, retornamos '000000000000000' como padrão.
        return Response({'ult_nsu': '000000000000000'})
