import logging
import requests
import random
from decimal import Decimal

logger = logging.getLogger(__name__)

class ProductIntelligenceService:
    """
    Service to handle external product intelligence:
    1. GTIN/EAN Lookup (Name, Description, Image, NCM, etc.)
    2. Regional Price Research (Market Intelligence)
    """

    def __init__(self):
        # Em producao, isso viria de settings.py ou variáveis de ambiente
        self.GS1_API_URL = "https://api.gs1br.org/v1/product/" 
        self.COSMOS_API_URL = "https://api.cosmos.bluesoft.com.br/gtins/"
        self.INFOPRICE_API_URL = "https://api.infoprice.com/v1/"
        
        # MOCK MODE: Se True, retorna dados simulados para demonstração
        # Se False, tentaria chamar as APIs reais (que precisariam de tokens)
        self.MOCK_MODE = True

    def consultar_ean_gtin(self, ean):
        """
        Consulta dados de um produto pelo código de barras (EAN/GTIN).
        Retorna dicionário com dados e status 'encontrado'.
        """
        if not ean or len(ean) < 8:
            return {'encontrado': False, 'mensagem': 'EAN Inválido'}

        clean_ean = "".join(filter(str.isdigit, ean))

        data = None
        if self.MOCK_MODE:
            data = self._mock_ean_lookup(clean_ean)
        
        # Implementação Real (Exemplo com BlueSoft Cosmos - requer Token)
        # headers = {"X-Cosmos-Token": "SEU_TOKEN_AQUI"}
        # try:
        #     resp = requests.get(f"{self.COSMOS_API_URL}{clean_ean}.json", headers=headers, timeout=5)
        #     if resp.status_code == 200:
        #         data_resp = resp.json()
        #         data = {
        #             'nome': data_resp.get('description'),
        #             'ncm': data_resp.get('ncm', {}).get('code'),
        #             'imagem_url': data_resp.get('thumbnail'),
        #              # ... mapear outros campos
        #         }
        # except Exception as e:
        #     logger.error(f"Erro lookup EAN {clean_ean}: {e}")
            
        if data:
            return {'encontrado': True, 'produto': data}
        
        return {'encontrado': False, 'mensagem': 'Produto não encontrado na base nacional'}

    def pesquisar_precos_regionais(self, ean, latitude=None, longitude=None, raio_km=5):
        """
        Pesquisa preços praticados por concorrentes na região para um determinado EAN.
        Retorna estatísticas (Min, Max, Média, Moda).
        """
        if not ean:
            return None
            
        clean_ean = "".join(filter(str.isdigit, ean))

        if self.MOCK_MODE:
            return self._mock_price_research(clean_ean)

        # Implementação Real (Exemplo Genérico)
        # params = {'ean': clean_ean, 'lat': latitude, 'lon': longitude, 'radius': raio_km}
        # resp = requests.get(f"{self.INFOPRICE_API_URL}prices", params=params)
        # ... processar resposta
        
        return None

    def _mock_ean_lookup(self, ean):
        """
        Gera dados simulados realistas para demonstração.
        """
        # Simulando delay de rede
        import time
        time.sleep(1.5)

        # Banco de dados fake de demonstração
        mock_db = {
            "7891000100103": {
                "nome": "Leite Condensado Moça 395g",
                "descricao": "Leite condensado integral Nestlé lata 395g",
                "ncm": "04029900",
                "imagem_url": "https://cdn-cosmos.bluesoft.com.br/products/7891000100103",
                "marca": "Nestlé",
                "unidade": "UN",
                "peso": 0.395
            },
            "7894321711263": {
                "nome": "Refrigerante Coca-Cola 2L",
                "descricao": "Refrigerante de Cola Garrafa PET 2 Litros",
                "ncm": "22021000",
                "imagem_url": "https://cdn-cosmos.bluesoft.com.br/products/7894900011517",
                "marca": "Coca-Cola",
                "unidade": "UN",
                "peso": 2.0
            },
               "7896434921478": { 
                "nome": "Creme de Avelã Triângulo 170g",
                "descricao": "Creme de avelã com cacau. Ideal para recheios e coberturas.",
                "ncm": "18069000",
                "imagem_url": "https://m.media-amazon.com/images/I/61Nl-Xo5+YL.jpg", # Exemplo
                "marca": "Triângulo",
                "unidade": "UN",
                "peso": 0.170
            }
        }
        
        # Se encontrou no mock fixo
        if ean in mock_db:
             return mock_db[ean]
             
        # Se não, gera um genérico baseado no EAN para não falhar na demo
        return {
            "nome": f"Produto Demonstração EAN {ean}",
            "descricao": "Descrição automática gerada pelo serviço de inteligência de produtos.",
            "ncm": "00000000",
            "imagem_url": "https://via.placeholder.com/300",
            "marca": "Genérica",
            "unidade": "UN"
        }

    def _mock_price_research(self, ean):
        """
        Gera dados de preço de mercado simulados
        """
        import time
        time.sleep(1.0)
        
        # Gera um preço base aleatório entre 5.00 e 50.00
        # Mas consistente para o mesmo EAN (hash simples)
        seed = int(ean[-4:]) if len(ean) >=4 else 1234
        random.seed(seed)
        base_price = Decimal(random.uniform(5.0, 50.0)).quantize(Decimal('0.01'))
        
        # Variação de mercado
        min_price = (base_price * Decimal('0.85')).quantize(Decimal('0.01'))
        max_price = (base_price * Decimal('1.25')).quantize(Decimal('0.01'))
        avg_price = (base_price * Decimal('1.05')).quantize(Decimal('0.01'))
        
        # Moda (preço mais comum)
        mode_price = base_price
        
        return {
            "minimo": min_price,
            "maximo": max_price,
            "media": avg_price,
            "moda": mode_price,
            "concorrentes_analisados": random.randint(3, 12),
            "ultima_atualizacao": "Hoje, 10:30"
        }
