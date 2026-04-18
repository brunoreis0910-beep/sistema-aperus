from rest_framework import viewsets, serializers, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q
from django.utils import timezone
from decimal import Decimal
import datetime

from .models import ContaServico


class ContaServicoSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ContaServico
        fields = '__all__'


class ContaServicoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Contas de Serviço (telefone, energia, água, gás, serviço de terceiro).
    Inclui endpoint de resumo mensal e exportação para SPED F100.
    """
    queryset = ContaServico.objects.all()
    serializer_class = ContaServicoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['fornecedor_nome', 'numero_documento', 'cnpj_fornecedor', 'descricao']
    ordering_fields = ['data_emissao', 'data_vencimento', 'valor_total', 'criado_em']
    ordering = ['-data_emissao']

    def get_queryset(self):
        qs = ContaServico.objects.all()
        tipo = self.request.query_params.get('tipo')
        status_param = self.request.query_params.get('status')
        mes = self.request.query_params.get('mes')
        ano = self.request.query_params.get('ano')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')

        if tipo:
            qs = qs.filter(tipo=tipo)
        if status_param:
            qs = qs.filter(status=status_param)
        if mes:
            qs = qs.filter(mes_competencia=mes)
        if ano:
            qs = qs.filter(ano_competencia=ano)
        if data_inicio:
            qs = qs.filter(data_emissao__gte=data_inicio)
        if data_fim:
            qs = qs.filter(data_emissao__lte=data_fim)

        return qs

    @action(detail=False, methods=['get'], url_path='resumo-mensal')
    def resumo_mensal(self, request):
        """Retorna totais agrupados por tipo para o mês/ano informado."""
        mes = request.query_params.get('mes', timezone.now().month)
        ano = request.query_params.get('ano', timezone.now().year)

        qs = ContaServico.objects.filter(mes_competencia=mes, ano_competencia=ano)

        totais = {
            'mes': int(mes),
            'ano': int(ano),
            'total_geral': qs.aggregate(t=Sum('valor_total'))['t'] or Decimal('0'),
            'total_pendente': qs.filter(status='pendente').aggregate(t=Sum('valor_total'))['t'] or Decimal('0'),
            'total_pago': qs.filter(status='pago').aggregate(t=Sum('valor_total'))['t'] or Decimal('0'),
            'total_vencido': qs.filter(status='vencido').aggregate(t=Sum('valor_total'))['t'] or Decimal('0'),
            'total_pis': qs.aggregate(t=Sum('valor_pis'))['t'] or Decimal('0'),
            'total_cofins': qs.aggregate(t=Sum('valor_cofins'))['t'] or Decimal('0'),
            'total_icms': qs.aggregate(t=Sum('valor_icms'))['t'] or Decimal('0'),
            'por_tipo': [],
        }

        for tipo_key, tipo_label in ContaServico.TIPO_CHOICES:
            sub = qs.filter(tipo=tipo_key)
            total = sub.aggregate(t=Sum('valor_total'))['t'] or Decimal('0')
            totais['por_tipo'].append({
                'tipo': tipo_key,
                'label': tipo_label,
                'quantidade': sub.count(),
                'total': total,
            })

        # Converter Decimal para string para serialização
        def dec(v):
            return str(v)

        totais['total_geral'] = dec(totais['total_geral'])
        totais['total_pendente'] = dec(totais['total_pendente'])
        totais['total_pago'] = dec(totais['total_pago'])
        totais['total_vencido'] = dec(totais['total_vencido'])
        totais['total_pis'] = dec(totais['total_pis'])
        totais['total_cofins'] = dec(totais['total_cofins'])
        totais['total_icms'] = dec(totais['total_icms'])
        for item in totais['por_tipo']:
            item['total'] = dec(item['total'])

        return Response(totais)

    @action(detail=False, methods=['get'], url_path='exportar-sped-f100')
    def exportar_sped_f100(self, request):
        """
        Gera os registros F100 para exportação ao SPED EFD Contribuições.
        Retorna as linhas formatadas conforme layout do Bloco F.
        """
        mes = request.query_params.get('mes', timezone.now().month)
        ano = request.query_params.get('ano', timezone.now().year)

        qs = ContaServico.objects.filter(
            mes_competencia=mes,
            ano_competencia=ano,
        ).exclude(status='cancelado')

        linhas = []
        for conta in qs:
            # Indicador da operação:
            # I = Operação Geradoras de Crédito
            # T = Operação Não Geradora de Crédito
            ind_oper = 'T'  # Contas de serviço geralmente são despesas - não geram crédito PIS/COFINS para não-cumulativos sem autorização

            # F100|IND_OPER|IND_EMIT|COD_PART|COD_MOD|COD_SIT|SER|SUB|NUM_DOC|DT_DOC|VL_DOC|IND_PGTO|VL_DESC|VL_ABAT_NT|VL_MERC|IND_FRT|VL_FRT|VL_SEG|VL_OUT_DA|VL_BC_PIS|ALIQ_PIS|VL_PIS|VL_BC_COFINS|ALIQ_COFINS|VL_COFINS|COD_CTA|COD_CCUS|
            dt = conta.data_emissao.strftime('%d%m%Y') if conta.data_emissao else ''
            cnpj = (conta.cnpj_fornecedor or '').replace('.', '').replace('/', '').replace('-', '')

            vl_bc_pis = str(conta.valor_total).replace('.', ',') if conta.valor_pis > 0 else '0,00'
            aliq_pis = str(conta.aliq_pis).replace('.', ',') if conta.aliq_pis else '0,00'
            vl_pis = str(conta.valor_pis).replace('.', ',')
            vl_bc_cofins = str(conta.valor_total).replace('.', ',') if conta.valor_cofins > 0 else '0,00'
            aliq_cofins = str(conta.aliq_cofins).replace('.', ',') if conta.aliq_cofins else '0,00'
            vl_cofins = str(conta.valor_cofins).replace('.', ',')

            linha = (
                f"|F100"
                f"|{ind_oper}"
                f"|2"                        # IND_EMIT: 2 = Terceiro
                f"|{cnpj}"                   # COD_PART (CNPJ do fornecedor)
                f"|SE"                        # COD_MOD: SE = Serviços / Energia / etc.
                f"|00"                        # COD_SIT
                f"|{conta.serie or ''}"
                f"|"                          # SUB
                f"|{conta.numero_documento or ''}"
                f"|{dt}"
                f"|{str(conta.valor_total).replace('.', ',')}"
                f"|1"                         # IND_PGTO: 1 = À Vista
                f"|0,00"                      # VL_DESC
                f"|0,00"                      # VL_ABAT_NT
                f"|{str(conta.valor_total).replace('.', ',')}"  # VL_MERC
                f"|9"                         # IND_FRT: 9 = Sem Frete
                f"|0,00|0,00|0,00"           # VL_FRT|VL_SEG|VL_OUT_DA
                f"|{vl_bc_pis}"
                f"|{aliq_pis}"
                f"|{conta.cst_pis}"
                f"|{vl_pis}"
                f"|{vl_bc_cofins}"
                f"|{aliq_cofins}"
                f"|{conta.cst_cofins}"
                f"|{vl_cofins}"
                f"|"                          # COD_CTA
                f"|"                          # COD_CCUS
                f"|"
            )
            linhas.append(linha)

        return Response({
            'mes': int(mes),
            'ano': int(ano),
            'total_registros': len(linhas),
            'linhas': linhas,
        })

    @action(detail=False, methods=['post'], url_path='atualizar-status-vencidos')
    def atualizar_status_vencidos(self, request):
        """Atualiza automaticamente contas pendentes vencidas."""
        hoje = datetime.date.today()
        atualizados = ContaServico.objects.filter(
            status='pendente',
            data_vencimento__lt=hoje,
        ).update(status='vencido')
        return Response({'atualizados': atualizados})
