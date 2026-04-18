import logging
import sys
import os
from datetime import datetime
import traceback

# Prefer logs inside the project workspace so the assistant can read them
LOG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
LOG_FILE = os.path.join(LOG_PATH, 'debug_requests.log')

def ensure_log_dir():
    try:
        os.makedirs(LOG_PATH, exist_ok=True)
    except Exception:
        pass

def append_log(text):
    """
    Tenta gravar log em arquivo. Se falhar, ignora silenciosamente.
    O middleware NUNCA deve quebrar a aplicacao por causa de logs.
    """
    try:
        ensure_log_dir()
        # Sanitiza o texto para remover caracteres problematicos no Windows
        safe_text = str(text).encode('utf-8', errors='replace').decode('utf-8')
        with open(LOG_FILE, 'a', encoding='utf-8', errors='replace') as f:
            f.write(safe_text + '\n')
    except Exception:
        # Falha silenciosa - nao queremos quebrar a app por causa de logs
        pass


class DebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        marker = '='*100
        ts = datetime.utcnow().isoformat()
        header = f"[{ts}] REQUISICAO RECEBIDA: Method={request.method} Path={request.path} Content-Type={request.content_type}"

        try:
            body_preview = ''
            if request.method == 'POST':
                try:
                    body_preview = request.body[:2000].decode('utf-8', errors='replace')
                except Exception:
                    body_preview = '[binary data]'

            append_log(marker)
            append_log(header)
            if body_preview:
                append_log('BODY PREVIEW:')
                append_log(body_preview)
            append_log(marker)

            # Also print to stdout for interactive debugging (safe encoding for Windows)
            try:
                sys.stdout.write(header + '\n')
                if body_preview:
                    sys.stdout.write('BODY PREVIEW:\n')
                    sys.stdout.write(body_preview + '\n')
                sys.stdout.flush()
            except UnicodeEncodeError:
                # Fallback: write to log only if stdout fails
                pass

            try:
                response = self.get_response(request)
            except Exception as exc:
                err_ts = datetime.utcnow().isoformat()
                append_log(f'[{err_ts}] EXCECAO durante processamento da requisicao: {type(exc).__name__}: {exc}')
                tb = traceback.format_exc()
                append_log(tb)
                # re-raise after logging so Django can also show traceback in console
                raise

            append_log(f'RESPONSE STATUS: {getattr(response, "status_code", "N/A")}')

            # --- DEBUG: Log error details for 400/500 ---
            if response and hasattr(response, 'status_code') and response.status_code >= 400:
                try:
                    if hasattr(response, 'data'):
                        import json
                        append_log(f"ERROR BODY (Data): {json.dumps(response.data, default=str)}")
                    elif hasattr(response, 'content'):
                        append_log(f"ERROR BODY (Content): {response.content.decode('utf-8', errors='replace')[:2000]}")
                except Exception as e_log:
                    append_log(f"ERROR LOGGING BODY: {e_log}")
            # --------------------------------------------

            try:
                sys.stdout.write(f'RESPONSE STATUS: {getattr(response, "status_code", "N/A")}\n')
                sys.stdout.flush()
            except UnicodeEncodeError:
                pass

            return response
        except Exception:
            # ensure any unexpected error here does not hide original exception
            raise
