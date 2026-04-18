
import requests
from ..models_marketplace import MarketplaceConfig

class MercadoLivreService:
    BASE_URL = "https://api.mercadolibre.com"

    def __init__(self, config: MarketplaceConfig):
        self.config = config
        self.access_token = config.access_token

    def get_headers(self):
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    def check_token(self):
        """Verifica se o token é válido"""
        if not self.access_token:
            return False, "Token não configurado"
        
        url = f"{self.BASE_URL}/users/me"
        response = requests.get(url, headers=self.get_headers())
        
        if response.status_code == 200:
            return True, "Token válido"
        elif response.status_code == 401:
            return False, "Token expirado ou inválido"
        
        return False, f"Erro: {response.text}"

    def post_product(self, product_data):
        """Cadastra um produto no ML"""
        url = f"{self.BASE_URL}/items"
        response = requests.post(url, headers=self.get_headers(), json=product_data)
        return response.json()

class ShopeeService:
    BASE_URL = "https://partner.shopeemobile.com/api/v2"

    def __init__(self, config: MarketplaceConfig):
        self.config = config
        # Shopee requer assinatura complexa (HMAC SHA256)
        # Implementar lógica de assinatura aqui

    def get_shop_info(self):
        # Implementar chamada
        pass
