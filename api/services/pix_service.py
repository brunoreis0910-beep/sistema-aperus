"""
pix_service.py — Serviço de geração e consulta de cobranças Pix  
Suporte: PSP Manual (QR estático), Efí Bank (API Pix dinâmico)
"""
import base64
import hashlib
import hmac
import json
import logging
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

import requests

logger = logging.getLogger(__name__)


class PixService:
    """Gera QR Code Pix dinâmico (cobrança imediata — cob)."""

    def __init__(self, config_pix):
        self.config = config_pix
        self._access_token = None

    # ── Geração de QR Code Manual (payload estático) ──────────────────────────
    def gerar_qr_manual(self, valor: Decimal, descricao: str = '', txid: str = None) -> dict:
        """Gera payload Pix estático (EMV) sem precisar de API bancária."""
        chave = self.config.chave_pix
        nome_beneficiario = (self.config.empresa.nome_razao_social or 'Empresa')[:25]
        cidade = (self.config.empresa.cidade or 'BRASIL')[:15]
        txid_clean = (txid or uuid.uuid4().hex[:25]).replace('-', '')[:25]
        valor_str = f'{valor:.2f}'

        def _tlv(tag: str, val: str) -> str:
            return f'{tag}{len(val):02d}{val}'

        # GUI
        gui = _tlv('00', 'br.gov.bcb.pix') + _tlv('01', chave)
        if descricao:
            gui += _tlv('02', descricao[:72])

        payload = (
            _tlv('00', '01')                              # Payload Format
            + _tlv('26', gui)                             # Merchant Account
            + _tlv('52', '0000')                          # MCC
            + _tlv('53', '986')                           # BRL
            + _tlv('54', valor_str)                       # Amount
            + _tlv('58', 'BR')                            # Country
            + _tlv('59', nome_beneficiario)               # Merchant Name
            + _tlv('60', cidade.upper())                  # Merchant City
            + _tlv('62', _tlv('05', txid_clean))          # Additional data
        )
        # CRC16/CCITT
        payload_crc = payload + '6304'
        crc = self._crc16(payload_crc)
        payload_final = payload_crc + f'{crc:04X}'

        # QR Code como PNG via API pública (qrserver.com)
        qr_url = f'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={requests.utils.quote(payload_final)}'

        return {
            'sucesso': True,
            'txid': txid_clean,
            'qr_code_payload': payload_final,
            'qr_code_imagem_url': qr_url,
            'qr_code_imagem_base64': None,
            'psp': 'MANUAL',
        }

    @staticmethod
    def _crc16(data: str) -> int:
        """CRC16/CCITT-FALSE para payload Pix EMV."""
        poly = 0x1021
        crc = 0xFFFF
        for b in data.encode('utf-8'):
            crc ^= b << 8
            for _ in range(8):
                if crc & 0x8000:
                    crc = (crc << 1) ^ poly
                else:
                    crc <<= 1
            crc &= 0xFFFF
        return crc

    # ── Efí Bank (OAuth2 + API Pix cob) ──────────────────────────────────────
    def _get_token_efi(self) -> str:
        if self._access_token:
            return self._access_token
        base = 'https://pix.api.efipay.com.br' if self.config.ambiente == 'PRODUCAO' else 'https://pix-h.api.efipay.com.br'
        credentials = base64.b64encode(
            f'{self.config.client_id}:{self.config.client_secret}'.encode()
        ).decode()
        resp = requests.post(
            f'{base}/oauth/token',
            headers={'Authorization': f'Basic {credentials}', 'Content-Type': 'application/json'},
            json={'grant_type': 'client_credentials'},
            timeout=15,
        )
        resp.raise_for_status()
        self._access_token = resp.json()['access_token']
        return self._access_token

    def gerar_cobranca_efi(self, valor: Decimal, descricao: str = '',
                           pagador_nome: str = None, pagador_cpf: str = None,
                           validade_segundos: int = 3600) -> dict:
        base = 'https://pix.api.efipay.com.br' if self.config.ambiente == 'PRODUCAO' else 'https://pix-h.api.efipay.com.br'
        token = self._get_token_efi()
        txid = uuid.uuid4().hex[:35]
        payload = {
            'calendario': {'expiracao': validade_segundos},
            'valor': {'original': str(valor)},
            'chave': self.config.chave_pix,
            'solicitacaoPagador': descricao or 'Pagamento',
        }
        if pagador_nome and pagador_cpf:
            payload['devedor'] = {'nome': pagador_nome, 'cpf': pagador_cpf.replace('.', '').replace('-', '')}

        resp = requests.put(
            f'{base}/v2/cob/{txid}',
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
            json=payload,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        # Buscar QR Code
        loc_id = data.get('loc', {}).get('id')
        qr_data = {}
        if loc_id:
            qr_resp = requests.get(
                f'{base}/v2/loc/{loc_id}/qrcode',
                headers={'Authorization': f'Bearer {token}'},
                timeout=15,
            )
            if qr_resp.ok:
                qr_data = qr_resp.json()

        return {
            'sucesso': True,
            'txid': txid,
            'qr_code_payload': qr_data.get('qrcode', data.get('pixCopiaECola', '')),
            'qr_code_imagem_base64': qr_data.get('imagemQrcode', ''),
            'link_visualizacao': data.get('linkVisualizacao', ''),
            'psp': 'EFI',
            'status': data.get('status', 'ATIVA'),
        }

    def gerar(self, valor: Decimal, descricao: str = '',
              pagador_nome: str = None, pagador_cpf: str = None,
              validade_segundos: int = 3600, txid: str = None) -> dict:
        """Dispatcher: usa API do PSP se configurado, senão gera manual."""
        try:
            if self.config.psp == 'EFI' and self.config.client_id:
                return self.gerar_cobranca_efi(valor, descricao, pagador_nome, pagador_cpf, validade_segundos)
            else:
                return self.gerar_qr_manual(valor, descricao, txid)
        except Exception as exc:
            logger.exception('Erro ao gerar cobrança Pix')
            return {'sucesso': False, 'erro': str(exc)}

    def verificar_webhook(self, payload: str, signature: str) -> bool:
        """Verifica assinatura HMAC do webhook (quando configurado)."""
        if not self.config.webhook_secret:
            return True
        expected = hmac.new(
            self.config.webhook_secret.encode(),
            payload.encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature or '')
