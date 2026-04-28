"""
Comando de reparo de encoding: fix_encoding
============================================
Corrige dados com mojibake (caracteres especiais corrompidos) causados por
conexão MySQL sem charset=utf8mb4.

Problema: bytes UTF-8 corretos no banco (ex: C3 80 para 'À') eram lidos pelo
conector mysqlclient usando CP437, resultando em '├Ç' em vez de 'À'.

Algoritmo de reparo: str.encode('cp437').decode('utf-8')

Uso:
    python manage.py fix_encoding           # modo dry-run (só mostra)
    python manage.py fix_encoding --apply   # aplica as correções
    python manage.py fix_encoding --model TabelaComercial --apply
"""

import sys
from django.core.management.base import BaseCommand
from django.apps import apps
from django.db import models as django_models


def tem_mojibake(text: str) -> bool:
    """
    Detecta se o texto contém mojibake (CP437 lido como UTF-8).
    Característica: presença de caracteres de box-drawing (U+2500-U+257F)
    ou outros caracteres de controle não esperados em texto português.
    """
    if not text:
        return False
    # Box drawing characters (U+2500–U+257F)
    for ch in text:
        cp = ord(ch)
        if 0x2500 <= cp <= 0x257F:
            return True
        # Caracteres de forma gráfica de bloco (U+2580–U+259F)
        if 0x2580 <= cp <= 0x259F:
            return True
    return False


def reparar_texto(text: str) -> str:
    """
    Tenta reparar mojibake usando a sequência:
      1. encode como CP437 (inverte a leitura errada do conector)
      2. decode como UTF-8 (obtém o texto original correto)

    Retorna o texto original se o reparo falhar.
    """
    if not text or not tem_mojibake(text):
        return text
    try:
        return text.encode('cp437').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text


class Command(BaseCommand):
    help = 'Repara caracteres especiais corrompidos (mojibake) no banco de dados'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            default=False,
            help='Aplica as correções (padrão: dry-run, só exibe)',
        )
        parser.add_argument(
            '--model',
            type=str,
            default=None,
            help='Limita a um modelo específico (ex: TabelaComercial)',
        )

    def handle(self, *args, **options):
        aplicar = options['apply']
        modelo_alvo = options.get('model')

        modo = 'APLICANDO CORREÇÕES' if aplicar else 'DRY-RUN (use --apply para salvar)'
        self.stdout.write(self.style.WARNING(f'\n=== fix_encoding: {modo} ===\n'))

        total_corrigidos = 0
        total_campos = 0

        for model in apps.get_models():
            # Filtrar por modelo específico se passado
            if modelo_alvo and model.__name__ != modelo_alvo:
                continue

            # Pegar campos de texto
            text_fields = [
                f.name for f in model._meta.get_fields()
                if isinstance(f, (django_models.CharField, django_models.TextField))
                and not f.primary_key
            ]

            if not text_fields:
                continue

            try:
                qs = model.objects.all()
            except Exception:
                continue

            corrigidos_modelo = 0

            for obj in qs.iterator(chunk_size=200):
                alterado = False
                for field in text_fields:
                    valor = getattr(obj, field, None)
                    if not valor or not isinstance(valor, str):
                        continue

                    if not tem_mojibake(valor):
                        continue

                    novo_valor = reparar_texto(valor)
                    if novo_valor != valor:
                        total_campos += 1
                        self.stdout.write(
                            f'  [{model.__name__}.{field} id={getattr(obj, "pk", "?")}]\n'
                            f'    ANTES:  {repr(valor)}\n'
                            f'    DEPOIS: {repr(novo_valor)}'
                        )
                        if aplicar:
                            setattr(obj, field, novo_valor)
                            alterado = True

                if alterado and aplicar:
                    try:
                        obj.save(update_fields=[
                            f for f in text_fields
                            if tem_mojibake(getattr(obj, f, '') or '')
                        ])
                        corrigidos_modelo += 1
                        total_corrigidos += 1
                    except Exception as e:
                        self.stderr.write(
                            self.style.ERROR(f'  ERRO ao salvar {model.__name__} pk={obj.pk}: {e}')
                        )

            if corrigidos_modelo > 0:
                self.stdout.write(
                    self.style.SUCCESS(f'  → {model.__name__}: {corrigidos_modelo} registros corrigidos')
                )

        self.stdout.write('')
        if aplicar:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Concluído: {total_campos} campos corrigidos em {total_corrigidos} registros.'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'ℹ️  Dry-run: {total_campos} campos com mojibake detectados. '
                    f'Execute com --apply para corrigir.'
                )
            )
