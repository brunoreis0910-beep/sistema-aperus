import base64
import hashlib
from django.db import models
from django.conf import settings
from cryptography.fernet import Fernet, InvalidToken

def get_fernet():
    key = getattr(settings, 'FIELD_ENCRYPTION_KEY', None)
    if not key:
        # Fallback derivative from SECRET_KEY
        secret_key = settings.SECRET_KEY.encode('utf-8')
        key = base64.urlsafe_b64encode(hashlib.sha256(secret_key).digest())
    elif isinstance(key, str):
        key = key.encode('utf-8')
    return Fernet(key)

class EncryptedCharField(models.CharField):
    description = "Encrypted CharField"

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value is None or value == "":
            return value
        if not isinstance(value, str):
            value = str(value)
        
        # Encrypt the value
        f = get_fernet()
        encrypted_bytes = f.encrypt(value.encode('utf-8'))
        return encrypted_bytes.decode('utf-8')

    def from_db_value(self, value, expression, connection):
        if value is None or value == "":
            return value
        
        # Decrypt the value. Fall back to plain text if decryption fails
        f = get_fernet()
        try:
            decrypted_bytes = f.decrypt(value.encode('utf-8'))
            return decrypted_bytes.decode('utf-8')
        except (InvalidToken, Exception):
            return value

    def to_python(self, value):
        if value is None or value == "":
            return value
        
        if isinstance(value, str) and value.startswith('gAAAA'):
            f = get_fernet()
            try:
                decrypted_bytes = f.decrypt(value.encode('utf-8'))
                return decrypted_bytes.decode('utf-8')
            except (InvalidToken, Exception):
                pass
        return super().to_python(value)


class EncryptedTextField(models.TextField):
    description = "Encrypted TextField"

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value is None or value == "":
            return value
        if not isinstance(value, str):
            value = str(value)
        
        # Encrypt the value
        f = get_fernet()
        encrypted_bytes = f.encrypt(value.encode('utf-8'))
        return encrypted_bytes.decode('utf-8')

    def from_db_value(self, value, expression, connection):
        if value is None or value == "":
            return value
        
        # Decrypt the value. Fall back to plain text if decryption fails
        f = get_fernet()
        try:
            decrypted_bytes = f.decrypt(value.encode('utf-8'))
            return decrypted_bytes.decode('utf-8')
        except (InvalidToken, Exception):
            return value

    def to_python(self, value):
        if value is None or value == "":
            return value
        
        if isinstance(value, str) and value.startswith('gAAAA'):
            f = get_fernet()
            try:
                decrypted_bytes = f.decrypt(value.encode('utf-8'))
                return decrypted_bytes.decode('utf-8')
            except (InvalidToken, Exception):
                pass
        return super().to_python(value)
