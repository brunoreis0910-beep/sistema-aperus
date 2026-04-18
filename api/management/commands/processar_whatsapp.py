"""
Comando Django para processar fila de mensagens WhatsApp

Uso:
    python manage.py processar_whatsapp
    python manage.py processar_whatsapp --limite 100
    python manage.py processar_whatsapp --limite 50 --delay 20
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
import sys
import os

# Adiciona o diretório raiz ao PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from whatsapp_sender import processar_fila_whatsapp


class Command(BaseCommand):
    help = 'Processa a fila de mensagens WhatsApp pendentes e envia via Playwright'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limite',
            type=int,
            default=50,
            help='Máximo de mensagens a processar nesta execução (padrão: 50)'
        )
        parser.add_argument(
            '--delay',
            type=int,
            default=15,
            help='Delay em segundos entre cada mensagem (padrão: 15s)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Força execução mesmo sem conexão prévia (vai tentar reconectar)'
        )

    def handle(self, *args, **options):
        limite = options['limite']
        delay = options['delay']
        force = options['force']

        self.stdout.write("\n" + "="*70)
        self.stdout.write(self.style.SUCCESS("🤖 PROCESSADOR DE MENSAGENS WHATSAPP"))
        self.stdout.write("="*70)
        self.stdout.write(f"📊 Limite: {limite} mensagens")
        self.stdout.write(f"⏱️  Delay: {delay}s entre mensagens")
        self.stdout.write(f"🕐 Início: {timezone.now().strftime('%d/%m/%Y %H:%M:%S')}")
        self.stdout.write("="*70 + "\n")

        try:
            # Executa processamento
            stats = processar_fila_whatsapp(limite=limite, delay_segundos=delay)

            # Exibe resultado
            self.stdout.write("\n" + "="*70)
            self.stdout.write(self.style.SUCCESS("✅ PROCESSAMENTO CONCLUÍDO"))
            self.stdout.write("="*70)
            self.stdout.write(f"📨 Enviadas: {stats['enviadas']}")
            self.stdout.write(f"❌ Falhas: {stats['falhas']}")
            self.stdout.write(f"📊 Total: {stats['processadas']}")
            self.stdout.write(f"⏱️  Duração: {stats.get('duracao', 0):.1f}s")
            self.stdout.write("="*70 + "\n")

            # Retorna código de saída
            if stats['falhas'] == 0:
                return 0  # Sucesso total
            elif stats['enviadas'] > 0:
                return 0  # Sucesso parcial
            else:
                return 1  # Falha total

        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("\n⚠️  Processamento interrompido pelo usuário"))
            return 130

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n❌ ERRO CRÍTICO: {str(e)}"))
            import traceback
            self.stdout.write(traceback.format_exc())
            return 1
