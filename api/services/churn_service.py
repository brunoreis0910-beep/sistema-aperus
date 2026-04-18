"""
churn_service.py — Análise de Churn e alertas de clientes inativos
"""
import logging
from datetime import date, timedelta
from django.db.models import Max, Count, Sum, Q
from django.utils import timezone

logger = logging.getLogger(__name__)


class ChurnService:
    """Analisa o comportamento de compra dos clientes e identifica risco de churn."""

    def __init__(self, dias_inatividade: int = 90, top_n: int = 50):
        self.dias_inatividade = dias_inatividade
        self.top_n = top_n

    def calcular_rfm(self):
        """
        Calcula RFM (Recência, Frequência, Monetário) para todos os clientes.
        Inclui clientes com vendas (qualquer status exceto CANCELADA)
        e clientes cadastrados sem nenhuma venda.
        Retorna lista de dicts com pontuação e classificação de risco.
        """
        from api.models import Venda, Cliente  # lazy import para evitar circular

        hoje = date.today()
        corte = hoje - timedelta(days=self.dias_inatividade)

        # Aggregate por cliente — inclui PENDENTE, EMITIDA, AUTORIZADA, etc.
        # Exclui apenas vendas canceladas
        rfm_qs = (
            Venda.objects
            .exclude(status_nfe='CANCELADA')
            .exclude(id_cliente__isnull=True)
            .values('id_cliente', 'id_cliente__nome_razao_social',
                    'id_cliente__telefone', 'id_cliente__whatsapp',
                    'id_cliente__email')
            .annotate(
                ultima_compra=Max('data_documento'),
                total_compras=Count('id_venda'),
                valor_total=Sum('valor_total'),
            )
        )

        clientes_com_venda = set()
        resultado = []

        for row in rfm_qs:
            clientes_com_venda.add(row['id_cliente'])
            ultima = row['ultima_compra']
            if hasattr(ultima, 'date'):
                ultima = ultima.date()

            dias_sem_compra = (hoje - ultima).days if ultima else 9999
            freq = row['total_compras'] or 0
            valor = float(row['valor_total'] or 0)

            r_score = self._score_recencia(dias_sem_compra)
            f_score = self._score_frequencia(freq)
            m_score = self._score_monetario(valor)
            rfm_total = r_score + f_score + m_score
            risco = self._classificar_risco(r_score, rfm_total)

            resultado.append({
                'id_cliente': row['id_cliente'],
                'nome': row['id_cliente__nome_razao_social'],
                'telefone': row['id_cliente__telefone'],
                'whatsapp': row['id_cliente__whatsapp'],
                'email': row.get('id_cliente__email'),
                'ultima_compra': str(ultima) if ultima else None,
                'dias_sem_compra': dias_sem_compra,
                'total_compras': freq,
                'valor_total': valor,
                'r_score': r_score,
                'f_score': f_score,
                'm_score': m_score,
                'rfm_total': rfm_total,
                'risco': risco,
                'inativo': ultima < corte if ultima else True,
            })

        # Incluir clientes cadastrados que nunca compraram (risco máximo)
        sem_compra = (
            Cliente.objects
            .filter(ativo=True)
            .exclude(id_cliente__in=clientes_com_venda)
            .exclude(nome_razao_social__iexact='CONSUMIDOR')
        )
        for cli in sem_compra:
            resultado.append({
                'id_cliente': cli.id_cliente,
                'nome': cli.nome_razao_social,
                'telefone': cli.telefone or '',
                'whatsapp': cli.whatsapp or '',
                'email': cli.email or '',
                'ultima_compra': None,
                'dias_sem_compra': 9999,
                'total_compras': 0,
                'valor_total': 0,
                'r_score': 1,
                'f_score': 1,
                'm_score': 1,
                'rfm_total': 3,
                'risco': 'CRITICO',
                'inativo': True,
            })

        resultado.sort(key=lambda x: x['dias_sem_compra'], reverse=True)
        return resultado

    def clientes_em_risco(self):
        """Retorna apenas os clientes ativos em risco de churn."""
        rfm = self.calcular_rfm()
        return [r for r in rfm if r['risco'] in ('ALTO', 'CRITICO') and r['dias_sem_compra'] < 365]

    def clientes_perdidos(self):
        """Clientes que não compram há mais de 1 ano."""
        rfm = self.calcular_rfm()
        return [r for r in rfm if r['dias_sem_compra'] >= 365]

    def resumo(self):
        """Dashboard resumido de churn."""
        rfm = self.calcular_rfm()
        total = len(rfm)
        baixo = sum(1 for r in rfm if r['risco'] == 'BAIXO')
        medio = sum(1 for r in rfm if r['risco'] == 'MEDIO')
        alto = sum(1 for r in rfm if r['risco'] == 'ALTO')
        critico = sum(1 for r in rfm if r['risco'] == 'CRITICO')
        risco_alto = alto + critico
        inativos = sum(1 for r in rfm if r['inativo'])
        perdidos = sum(1 for r in rfm if r['dias_sem_compra'] >= 365)
        valor_em_risco = sum(r['valor_total'] for r in rfm if r['risco'] in ('ALTO', 'CRITICO'))

        return {
            'total_clientes': total,
            'total_clientes_ativos': total,
            'baixo_risco': baixo,
            'medio_risco': medio,
            'alto_risco': risco_alto,
            'critico': critico,
            'em_risco': risco_alto,
            'inativos_90_dias': inativos,
            'perdidos_365_dias': perdidos,
            'percentual_risco': round(risco_alto / total * 100, 1) if total else 0,
            'valor_em_risco': valor_em_risco,
            'top_risco': rfm[:self.top_n],
        }

    # ── Helpers de score ─────────────────────────────────────────────────────
    @staticmethod
    def _score_recencia(dias: int) -> int:
        if dias <= 30:   return 5
        if dias <= 60:   return 4
        if dias <= 90:   return 3
        if dias <= 180:  return 2
        return 1

    @staticmethod
    def _score_frequencia(n: int) -> int:
        if n >= 20: return 5
        if n >= 10: return 4
        if n >= 5:  return 3
        if n >= 2:  return 2
        return 1

    @staticmethod
    def _score_monetario(valor: float) -> int:
        if valor >= 10000: return 5
        if valor >= 3000:  return 4
        if valor >= 1000:  return 3
        if valor >= 300:   return 2
        return 1

    @staticmethod
    def _classificar_risco(r_score: int, rfm_total: int) -> str:
        if r_score <= 1 and rfm_total <= 6:  return 'CRITICO'
        if r_score <= 2 and rfm_total <= 9:  return 'ALTO'
        if r_score <= 3 and rfm_total <= 11: return 'MEDIO'
        return 'BAIXO'
