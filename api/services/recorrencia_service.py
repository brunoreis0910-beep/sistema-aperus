"""
recorrencia_service.py — Faturamento automático de contratos recorrentes
"""
import logging
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from decimal import Decimal

logger = logging.getLogger(__name__)


class RecorrenciaService:
    """Gera parcelas e dispara faturamento para contratos de recorrência."""

    def gerar_parcelas_contrato(self, contrato) -> list:
        """Gera parcela do mês corrente para um contrato específico."""
        from api.models_recorrencia import ParcelaRecorrencia

        hoje = date.today()
        competencia = hoje.strftime('%m/%Y')

        if ParcelaRecorrencia.objects.filter(contrato=contrato, competencia=competencia).exists():
            return []

        try:
            vencimento = date(hoje.year, hoje.month, min(contrato.dia_vencimento, 28))
        except ValueError:
            vencimento = date(hoje.year, hoje.month, 28)

        parcela = ParcelaRecorrencia.objects.create(
            contrato=contrato,
            competencia=competencia,
            valor=contrato.valor_mensal,
            data_vencimento=vencimento,
            status='PENDENTE',
        )

        contrato.ultimo_faturamento = hoje
        contrato.proximo_faturamento = vencimento + relativedelta(months=1)
        contrato.save(update_fields=['ultimo_faturamento', 'proximo_faturamento'])

        logger.info(f'Parcela criada: contrato {contrato.numero} competência {competencia}')
        return [parcela]

    def processar_vencimentos_hoje(self) -> dict:
        """
        Varre todos os contratos ativos e gera parcelas para o mês corrente
        se ainda não foram geradas.
        """
        from api.models_recorrencia import ContratoRecorrencia, ParcelaRecorrencia

        hoje = date.today()
        competencia = hoje.strftime('%m/%Y')
        processados = 0
        erros = []

        contratos = ContratoRecorrencia.objects.filter(
            status='ATIVO',
            data_inicio__lte=hoje,
        ).filter(
            models_q_data_fim_ok(hoje)
        ).select_related('cliente', 'operacao')

        for contrato in contratos:
            try:
                # Calcula data de vencimento deste mês
                try:
                    vencimento = date(hoje.year, hoje.month, min(contrato.dia_vencimento, 28))
                except ValueError:
                    vencimento = date(hoje.year, hoje.month, 28)

                # Verifica se já existe parcela para essa competência
                if ParcelaRecorrencia.objects.filter(contrato=contrato, competencia=competencia).exists():
                    continue

                # Cria parcela
                parcela = ParcelaRecorrencia.objects.create(
                    contrato=contrato,
                    competencia=competencia,
                    valor=contrato.valor_mensal,
                    data_vencimento=vencimento,
                    status='PENDENTE',
                )

                # Atualiza proximo_faturamento
                proximo = vencimento + relativedelta(months=1)
                contrato.ultimo_faturamento = hoje
                contrato.proximo_faturamento = proximo
                contrato.save(update_fields=['ultimo_faturamento', 'proximo_faturamento'])

                processados += 1
                logger.info(f'Parcela criada: contrato {contrato.numero} competência {competencia}')

            except Exception as exc:
                logger.exception(f'Erro ao processar contrato {contrato.numero}')
                erros.append({'contrato': contrato.numero, 'erro': str(exc)})

        return {'processados': processados, 'erros': erros}

    def aplicar_reajuste(self, contrato_id: int) -> dict:
        """Aplica reajuste anual a um contrato."""
        from api.models_recorrencia import ContratoRecorrencia

        contrato = ContratoRecorrencia.objects.get(pk=contrato_id)
        if contrato.indice_reajuste == 'NENHUM':
            return {'sucesso': False, 'mensagem': 'Contrato sem reajuste configurado.'}

        percentual = self._buscar_indice(contrato.indice_reajuste)
        if contrato.indice_reajuste == 'FIXO':
            percentual = float(contrato.percentual_reajuste_fixo)

        valor_anterior = contrato.valor_mensal
        contrato.valor_mensal = round(contrato.valor_mensal * Decimal(1 + percentual / 100), 2)
        contrato.ultimo_reajuste = date.today()
        contrato.save(update_fields=['valor_mensal', 'ultimo_reajuste'])

        logger.info(
            f'Reajuste aplicado — contrato {contrato.numero}: '
            f'R$ {valor_anterior} → R$ {contrato.valor_mensal} ({percentual:.2f}%)'
        )
        return {
            'sucesso': True,
            'contrato': contrato.numero,
            'valor_anterior': float(valor_anterior),
            'valor_novo': float(contrato.valor_mensal),
            'percentual': percentual,
            'indice': contrato.indice_reajuste,
        }

    @staticmethod
    def _buscar_indice(indice: str) -> float:
        """Busca índice econômico em API pública (simplificado)."""
        import requests
        # API pública do Banco Central do Brasil
        indicadores = {
            'IGPM': '189',   # IGP-M série BCB
            'IPCA': '433',   # IPCA série BCB
            'INPC': '188',   # INPC série BCB
        }
        serie = indicadores.get(indice)
        if not serie:
            return 5.0  # fallback

        try:
            url = (
                f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados/ultimos/12'
                '?formato=json'
            )
            resp = requests.get(url, timeout=10)
            dados = resp.json()
            # Acumulado 12 meses
            acumulado = 1.0
            for item in dados:
                acumulado *= (1 + float(item['valor'].replace(',', '.')) / 100)
            return round((acumulado - 1) * 100, 2)
        except Exception:
            logger.warning(f'Não foi possível buscar índice {indice} — usando 5%')
            return 5.0


def models_q_data_fim_ok(hoje):
    """Retorna Q para contratos sem data_fim ou com data_fim >= hoje."""
    from django.db.models import Q
    return Q(data_fim__isnull=True) | Q(data_fim__gte=hoje)
