"""
Utilitários de texto para normalização e correção de encoding.

Uso no serializer:
    from .text_utils import sanitize_field

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for key, value in data.items():
            if isinstance(value, str):
                data[key] = sanitize_field(value)
        return data
"""

import unicodedata


def tem_mojibake(text: str) -> bool:
    """Detecta box-drawing e caracteres gráficos que indicam mojibake."""
    if not text:
        return False
    for ch in text:
        cp = ord(ch)
        if 0x2500 <= cp <= 0x259F:  # Box drawing + block elements
            return True
    return False


def sanitize_field(value: str) -> str:
    """
    Sanitiza um campo de texto:
    1. Tenta reparar mojibake CP437 → UTF-8
    2. Normaliza para NFC (forma canônica Unicode)
    3. Remove caracteres de controle desnecessários
    """
    if not value or not isinstance(value, str):
        return value

    # Reparo de mojibake
    if tem_mojibake(value):
        try:
            value = value.encode('cp437').decode('utf-8')
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass

    # Normalização Unicode NFC (compõe caracteres combinados, ex: a + ́ → á)
    value = unicodedata.normalize('NFC', value)

    # Remove caracteres de controle (exceto newline e tab em TextFields)
    value = ''.join(
        ch for ch in value
        if unicodedata.category(ch) != 'Cc' or ch in ('\n', '\t', '\r')
    )

    return value
