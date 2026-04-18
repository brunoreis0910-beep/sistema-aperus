from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
import logging

from api.models import Venda, VendaItem, FinanceiroConta, FormaPagamento
from api.services.venda_financeiro import ensure_financeiro_for_venda

class Command(BaseCommand):
    help = 'Repara ou recria FinanceiroConta para uma Venda existente. Uso: python manage.py repair_venda_financeiro <venda_id> [--force-financeiro] [--recreate-venda]'

    def add_arguments(self, parser):
        parser.add_argument('venda_id', type=int)
        parser.add_argument('--force-financeiro', action='store_true', dest='force_fin', help='Refaz o financeiro mesmo que exista')
        parser.add_argument('--recreate-venda', action='store_true', dest='recreate_venda', help='Deleta e recria a venda (itens) com os mesmos valores')

    def handle(self, *args, **options):
        venda_id = options['venda_id']
        force_fin = options['force_fin']
        recreate_venda = options['recreate_venda']

        logging.getLogger().setLevel(logging.INFO)

        try:
            venda = Venda.objects.get(pk=venda_id)
        except Venda.DoesNotExist:
            self.stderr.write(f'Venda {venda_id} não encontrada')
            return

        # se pedido para recriar a venda, coletamos dados e recriamos
        if recreate_venda:
            self.stdout.write(f'Recriando venda {venda_id} — coletando dados')
            itens_qs = list(VendaItem.objects.filter(id_venda=venda))
            venda_data = {
                'id_operacao': getattr(venda, 'id_operacao', None),
                'id_cliente': getattr(venda, 'id_cliente', None),
                'id_vendedor1': getattr(venda, 'id_vendedor1', None),
                'data_documento': getattr(venda, 'data_documento', timezone.now()),
                'valor_total': getattr(venda, 'valor_total', Decimal('0.00')),
                'numero_documento': getattr(venda, 'numero_documento', None),
            }
            itens_data = []
            for it in itens_qs:
                itens_data.append({
                    'id_produto': getattr(it, 'id_produto', None),
                    'quantidade': getattr(it, 'quantidade', None),
                    'valor_unitario': getattr(it, 'valor_unitario', None),
                    'valor_total': getattr(it, 'valor_total', None),
                    'desconto_valor': getattr(it, 'desconto_valor', None),
                })
            # deleta a venda antiga
            venda.delete()
            # cria nova venda
            self.stdout.write('Criando nova venda')
            venda = Venda.objects.create(
                id_operacao=venda_data['id_operacao'],
                id_cliente=venda_data['id_cliente'],
                id_vendedor1=venda_data['id_vendedor1'],
                data_documento=venda_data['data_documento'],
                valor_total=venda_data['valor_total'],
                numero_documento=venda_data.get('numero_documento', None),
            )
            # recria itens
            for it in itens_data:
                VendaItem.objects.create(
                    id_venda=venda,
                    id_produto=it['id_produto'],
                    quantidade=it['quantidade'],
                    valor_unitario=it['valor_unitario'],
                    valor_total=it['valor_total'],
                    desconto_valor=it['desconto_valor'],
                )
            self.stdout.write(f'Venda recriada com id {venda.pk}')

        # checar se já existe financeiro
        existing = FinanceiroConta.objects.filter(id_venda_origem=getattr(venda, 'id_venda', getattr(venda, 'pk', None)))
        if existing.exists() and not force_fin:
            self.stdout.write(f'Já existe Financeiro(s) associado(s): {[getattr(e, "pk", None) for e in existing]} (use --force-financeiro para refazer)')
            return
        if existing.exists() and force_fin:
            self.stdout.write(f'Deletando {existing.count()} financeiro(s) existentes')
            existing.delete()

        # criar ou garantir financeiro baseado na venda usando o serviço central
        try:
            created, financeiro_pk, err = ensure_financeiro_for_venda(venda, payload=None, force=force_fin)
            if created:
                self.stdout.write(f'Financeiro criado id={financeiro_pk} para venda {getattr(venda, "pk", None)}')
            else:
                if financeiro_pk:
                    self.stdout.write(f'Financeiro já existente id={financeiro_pk} para venda {getattr(venda, "pk", None)}')
                else:
                    self.stdout.write(f'Nenhum financeiro criado para venda {getattr(venda, "pk", None)} (err={err})')
        except Exception as ex:
            logging.exception('Erro ao criar/garantir financeiro para venda %s: %s', venda.pk, str(ex))
            self.stderr.write(str(ex))
