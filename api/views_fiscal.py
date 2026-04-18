"""
views_fiscal.py — API Fiscal Hierárquica
==========================================
Endpoints:
  GET/POST/PATCH/DELETE  /api/regras-fiscais/         — CRUD de RegraFiscal
  POST                   /api/regras-fiscais/tributar/ — Calcula tributação de um item
  POST                   /api/produtos/{id}/tributar/  — Ações no ProdutoViewSet
"""

from rest_framework import viewsets, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import RegraFiscal, TipoTributacao, TributacaoUF


# UFs do Brasil para popular grid automaticamente
_UFS_BRASIL = [
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'EX',
    'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI',
    'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]


# ──────────────────────────────────────────────────────────────────────────────
# Serializer
# ──────────────────────────────────────────────────────────────────────────────

class RegraFiscalSerializer(serializers.ModelSerializer):
    empresa_nome = serializers.CharField(
        source='empresa.nome_fantasia', read_only=True, allow_null=True
    )

    class Meta:
        model  = RegraFiscal
        fields = '__all__'
        read_only_fields = ['id', 'atualizado_em', 'criado_em']
        extra_kwargs = {
            'ncm_codigo': {'required': True},
        }

    def validate_ncm_codigo(self, value):
        v = str(value).replace('.', '').strip()
        if len(v) != 8 or not v.isdigit():
            raise serializers.ValidationError("NCM deve ter exatamente 8 dígitos numéricos.")
        return v


# ──────────────────────────────────────────────────────────────────────────────
# ViewSet Principal
# ──────────────────────────────────────────────────────────────────────────────

class RegraFiscalViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de Regras Fiscais (tributacao_matriz).

    Filtros aceitos via query string:
      ?empresa_id=1
      ?ncm=12345678
      ?tipo_operacao=INTERNA
      ?uf_destino=MG
      ?regime_tributario=SIMPLES
      ?ativo=true
    """
    serializer_class   = RegraFiscalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = RegraFiscal.objects.select_related('empresa').order_by('ncm_codigo', 'tipo_operacao')

        params = self.request.query_params
        if params.get('empresa_id'):
            qs = qs.filter(empresa_id=params['empresa_id'])
        if params.get('ncm'):
            qs = qs.filter(ncm_codigo=params['ncm'].replace('.', '').strip())
        if params.get('tipo_operacao'):
            qs = qs.filter(tipo_operacao=params['tipo_operacao'].upper())
        if params.get('uf_destino'):
            qs = qs.filter(uf_destino=params['uf_destino'].upper())
        if params.get('regime_tributario'):
            qs = qs.filter(regime_tributario=params['regime_tributario'].upper())
        if params.get('tipo_cliente'):
            qs = qs.filter(tipo_cliente=params['tipo_cliente'].upper())
        if params.get('ativo') is not None:
            qs = qs.filter(ativo=params['ativo'].lower() in ('true', '1', 'yes'))

        return qs

    # ── Ação: calcular tributação ─────────────────────────────────────────────

    @action(detail=False, methods=['post'])
    def tributar(self, request):
        """
        Calcula a tributação de um item usando o Tributador (Strategy Pattern).

        Body JSON:
        {
            "produto_id":    42,
            "empresa_id":    1,
            "valor_unitario": 150.00,
            "quantidade":    5,
            "uf_destino":    "MG",           // opcional
            "uf_origem":     "SP",           // opcional
            "tipo_operacao": "INTERNA",      // opcional, padrão INTERNA
            "tipo_cliente":  "CONSUMIDOR_FINAL" // opcional: TODOS|CONSUMIDOR_FINAL|REVENDEDOR
        }

        Retorna: ResultadoTributacao serializado como JSON.
        """
        data = request.data

        produto_id = data.get('produto_id')
        empresa_id = data.get('empresa_id')

        if not produto_id:
            return Response(
                {"error": "'produto_id' é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from .services.tributador import Tributador

            t = Tributador(
                produto_id    = int(produto_id),
                empresa_id    = int(empresa_id) if empresa_id else None,
                uf_destino    = data.get('uf_destino'),
                tipo_operacao = data.get('tipo_operacao', 'INTERNA'),
                tipo_cliente  = data.get('tipo_cliente', 'TODOS'),
                uf_origem     = data.get('uf_origem'),
            )
            resultado = t.tributar(
                valor_unitario = data.get('valor_unitario', 0),
                quantidade     = data.get('quantidade', 1),
            )
            return Response(resultado.to_dict())

        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response(
                {"error": f"Erro interno: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def tributar_lote(self, request):
        """
        Calcula a tributação de múltiplos itens de uma venda em uma única chamada.

        Body JSON:
        {
            "empresa_id":   1,
            "uf_destino":   "MG",
            "uf_origem":    "SP",                // opcional: padrão por item ou global
            "tipo_cliente": "CONSUMIDOR_FINAL",  // opcional: padrão por item ou global
            "itens": [
                {"produto_id": 42, "valor_unitario": 150.00, "quantidade": 5},
                {"produto_id": 10, "valor_unitario": 30.00,  "quantidade": 2,
                 "tipo_operacao": "INTERNA", "tipo_cliente": "REVENDEDOR"}
            ]
        }
        """
        data         = request.data
        empresa_id   = data.get('empresa_id')
        uf_destino   = data.get('uf_destino')
        uf_origem    = data.get('uf_origem')
        tipo_cliente = data.get('tipo_cliente', 'TODOS')
        itens        = data.get('itens', [])

        if not itens:
            return Response({"error": "'itens' é obrigatório e não pode ser vazio."}, status=400)

        from .services.tributador import Tributador

        resultados = []
        errors     = []

        for item in itens:
            pid = item.get('produto_id')
            if not pid:
                errors.append({"item": item, "error": "produto_id ausente"})
                continue
            try:
                t = Tributador(
                    produto_id    = int(pid),
                    empresa_id    = int(empresa_id) if empresa_id else None,
                    uf_destino    = item.get('uf_destino', uf_destino),
                    tipo_operacao = item.get('tipo_operacao', 'INTERNA'),
                    tipo_cliente  = item.get('tipo_cliente', tipo_cliente),
                    uf_origem     = item.get('uf_origem', uf_origem),
                )
                res = t.tributar(
                    valor_unitario = item.get('valor_unitario', 0),
                    quantidade     = item.get('quantidade', 1),
                )
                resultados.append(res.to_dict())
            except Exception as exc:
                errors.append({"produto_id": pid, "error": str(exc)})

        return Response({
            "resultados": resultados,
            "errors":     errors,
            "total_itens": len(itens),
            "processados": len(resultados),
        })


# ──────────────────────────────────────────────────────────────────────────────
# TipoTributacao — Perfis de Tributação ICMS com alíquotas por UF
# ──────────────────────────────────────────────────────────────────────────────

class TributacaoUFSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TributacaoUF
        fields = '__all__'
        read_only_fields = ['id']


class TipoTributacaoSerializer(serializers.ModelSerializer):
    empresa_nome  = serializers.CharField(source='empresa.nome_fantasia', read_only=True, allow_null=True)
    aliquotas_uf  = TributacaoUFSerializer(many=True, required=False)
    total_ufs     = serializers.SerializerMethodField()

    class Meta:
        model  = TipoTributacao
        fields = '__all__'
        read_only_fields = ['id', 'criado_em', 'atualizado_em']

    def get_total_ufs(self, obj):
        return obj.aliquotas_uf.count()

    def create(self, validated_data):
        aliquotas_data = validated_data.pop('aliquotas_uf', [])
        tipo = TipoTributacao.objects.create(**validated_data)
        for aliq in aliquotas_data:
            aliq.pop('tipo_tributacao', None)
            TributacaoUF.objects.create(tipo_tributacao=tipo, **aliq)
        return tipo

    def update(self, instance, validated_data):
        aliquotas_data = validated_data.pop('aliquotas_uf', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if aliquotas_data is not None:
            for aliq in aliquotas_data:
                uf = aliq.get('uf_destino')
                if not uf:
                    continue
                defaults = {k: v for k, v in aliq.items() if k not in ('uf_destino', 'tipo_tributacao', 'id')}
                TributacaoUF.objects.update_or_create(
                    tipo_tributacao=instance, uf_destino=uf,
                    defaults=defaults,
                )
        return instance


class TipoTributacaoViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de perfis de tributação ICMS.

    Filtros: ?empresa_id=1  ?nome=CONSUMIDOR  ?ativo=true

    Ações especiais:
      POST /api/tipos-tributacao/{id}/popular_ufs/
        — Cria linhas para todos os estados ainda não cadastrados (com zeros)
      POST /api/tipos-tributacao/{id}/atualizar_cfop/
        — Aplica o mesmo CFOP a todas as linhas de UF
        Body: { "cfop": "6102" }
    """
    serializer_class   = TipoTributacaoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = TipoTributacao.objects.select_related('empresa').prefetch_related('aliquotas_uf').order_by('nome')
        p  = self.request.query_params
        if p.get('empresa_id'):
            qs = qs.filter(empresa_id=p['empresa_id'])
        if p.get('nome'):
            qs = qs.filter(nome__icontains=p['nome'])
        if p.get('ativo') is not None:
            qs = qs.filter(ativo=p['ativo'].lower() in ('true', '1', 'yes'))
        return qs

    @action(detail=True, methods=['post'])
    def popular_ufs(self, request, pk=None):
        """
        Cria uma linha de alíquota (zerada) para cada UF ainda não cadastrada.
        Simula o comportamento da tela legada que mostra todas as UFs no grid.
        """
        tipo = self.get_object()
        ja_existem = set(tipo.aliquotas_uf.values_list('uf_destino', flat=True))
        criadas = []
        for uf in _UFS_BRASIL:
            if uf not in ja_existem:
                TributacaoUF.objects.create(tipo_tributacao=tipo, uf_destino=uf)
                criadas.append(uf)
        return Response({
            'message': f'{len(criadas)} UF(s) populada(s).',
            'criadas':  criadas,
            'total':    tipo.aliquotas_uf.count(),
        })

    @action(detail=True, methods=['post'])
    def atualizar_cfop(self, request, pk=None):
        """
        Aplica o mesmo CFOP de saída a todas as linhas de UF deste perfil.
        Equivale ao botão "Atualiza CFOP Grid" da tela legada.
        Body: { "cfop": "6102" }
        """
        tipo = self.get_object()
        cfop = (request.data.get('cfop') or '').strip()
        if not cfop:
            return Response({'error': "'cfop' é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)
        atualizadas = tipo.aliquotas_uf.update(cfop_saida=cfop)
        # Também grava no cabeçalho como padrão
        tipo.cfop_padrao = cfop
        tipo.save(update_fields=['cfop_padrao', 'atualizado_em'])
        return Response({
            'message':    f'CFOP {cfop} aplicado a {atualizadas} UF(s).',
            'linhas':     atualizadas,
            'cfop_padrao': cfop,
        })


class TributacaoUFViewSet(viewsets.ModelViewSet):
    """
    CRUD direto para linhas individuais de alíquota por UF.
    Filtros: ?tipo_tributacao_id=1  ?uf_destino=MG
    """
    serializer_class   = TributacaoUFSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = TributacaoUF.objects.select_related('tipo_tributacao').order_by('tipo_tributacao__nome', 'uf_destino')
        p  = self.request.query_params
        if p.get('tipo_tributacao_id'):
            qs = qs.filter(tipo_tributacao_id=p['tipo_tributacao_id'])
        if p.get('uf_destino'):
            qs = qs.filter(uf_destino=p['uf_destino'].upper())
        return qs

    def create(self, request, *args, **kwargs):
        """
        Se a combinação (tipo_tributacao, uf_destino) já existir no banco,
        atualiza em vez de criar — evita erro de unique_together quando o
        frontend envia POST para linhas que foram criadas pelo popular_ufs.
        """
        tipo_id = request.data.get('tipo_tributacao')
        uf      = request.data.get('uf_destino')
        if tipo_id and uf:
            existing = TributacaoUF.objects.filter(
                tipo_tributacao_id=tipo_id, uf_destino=uf
            ).first()
            if existing:
                serializer = self.get_serializer(existing, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

