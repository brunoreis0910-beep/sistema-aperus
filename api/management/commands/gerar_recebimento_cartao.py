"""
Management command para gerar retroativamente os RecebimentoCartao
para vendas que usaram formas de pagamento com taxa_operadora > 0.

Uso:
    python manage.py gerar_recebimento_cartao
    python manage.py gerar_recebimento_cartao --dry-run         # apenas exibe, não salva
    python manage.py gerar_recebimento_cartao --venda 463       # apenas uma venda específica
    python manage.py gerar_recebimento_cartao --desde 2025-01-01
"""
from decimal import Decimal
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Gera RecebimentoCartao retroativamente para vendas com taxa de operadora'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Apenas exibe o que seria criado, sem salvar no banco.',
        )
        parser.add_argument(
            '--venda',
            type=int,
            help='Processar apenas a venda com este ID.',
        )
        parser.add_argument(
            '--desde',
            type=str,
            help='Processar vendas a partir desta data (formato: YYYY-MM-DD).',
        )

    def handle(self, *args, **options):
        from api.models import FinanceiroConta, FormaPagamento, RecebimentoCartao, Venda

        dry_run = options['dry_run']
        venda_id = options.get('venda')
        desde = options.get('desde')

        # Montar queryset de financeiros do tipo Receber, vinculados a vendas
        qs = FinanceiroConta.objects.filter(
            tipo_conta='Receber',
            id_venda_origem__isnull=False,
        ).order_by('id_venda_origem', 'id_conta')

        if venda_id:
            qs = qs.filter(id_venda_origem=venda_id)

        if desde:
            qs = qs.filter(data_emissao__gte=desde)

        criados = 0
        ignorados = 0
        erros = 0

        for fin in qs.iterator():
            # Ignorar se já existe RecebimentoCartao para este financeiro
            if RecebimentoCartao.objects.filter(id_financeiro_id=fin.id_conta).exists():
                ignorados += 1
                continue

            # Buscar FormaPagamento pelo nome gravado no financeiro
            nome_forma = (fin.forma_pagamento or '').strip()
            if not nome_forma:
                ignorados += 1
                continue

            forma_pagamento = FormaPagamento.objects.filter(
                nome_forma__iexact=nome_forma
            ).first()

            if not forma_pagamento:
                ignorados += 1
                continue

            if not forma_pagamento.taxa_operadora or forma_pagamento.taxa_operadora <= 0:
                ignorados += 1
                continue

            # Buscar objeto Venda
            try:
                venda = Venda.objects.get(pk=fin.id_venda_origem)
            except Venda.DoesNotExist:
                self.stderr.write(
                    f'  Venda {fin.id_venda_origem} não encontrada (FinID {fin.id_conta}) — ignorado'
                )
                erros += 1
                continue

            taxa = Decimal(str(forma_pagamento.taxa_operadora))
            dias_repasse = int(forma_pagamento.dias_repasse or 1)
            valor_bruto = fin.valor_parcela
            valor_taxa = (valor_bruto * taxa / Decimal('100')).quantize(Decimal('0.01'))
            valor_liquido = valor_bruto - valor_taxa
            data_previsao = fin.data_emissao + timedelta(days=dias_repasse)
            codigo_tpag = forma_pagamento.codigo_t_pag or '99'
            tipo_cartao = 'DEBITO' if codigo_tpag == '04' else 'CREDITO'

            self.stdout.write(
                f'  Venda {fin.id_venda_origem} | FinID {fin.id_conta} | '
                f'{forma_pagamento.nome_forma} | R$ {valor_bruto} | taxa {taxa}% | '
                f'líquido R$ {valor_liquido} | previsão {data_previsao}'
            )

            if not dry_run:
                try:
                    with transaction.atomic():
                        RecebimentoCartao.objects.create(
                            id_venda=venda,
                            id_financeiro=fin,
                            data_venda=fin.data_emissao,
                            valor_bruto=valor_bruto,
                            taxa_percentual=taxa,
                            valor_taxa=valor_taxa,
                            valor_liquido=valor_liquido,
                            data_previsao=data_previsao,
                            bandeira=forma_pagamento.nome_forma,
                            tipo_cartao=tipo_cartao,
                            status='PENDENTE',
                        )
                    criados += 1
                except Exception as exc:
                    self.stderr.write(f'  ERRO ao criar RecebimentoCartao FinID {fin.id_conta}: {exc}')
                    erros += 1
            else:
                criados += 1

        prefixo = '[DRY-RUN] ' if dry_run else ''
        self.stdout.write(self.style.SUCCESS(
            f'\n{prefixo}Concluído: {criados} criados, {ignorados} ignorados, {erros} erros'
        ))
