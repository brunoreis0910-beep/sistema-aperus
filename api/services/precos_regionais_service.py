"""
Serviço de Pesquisa de Preços Regionais
Integração com APIs de pesquisa de mercado e NFe públicas
"""
import requests
from typing import Dict, List
from decimal import Decimal
from decouple import config
from api.models import EmpresaConfig, Produto
from api.models_mercadologico import PrecoConcorrente
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class PrecosRegionaisService:
    """
    Busca preços de concorrentes em um raio geográfico
    Fontes de dados: InfoPrice, NFe Públicas, Web Scraping
    """
    
    def __init__(self):
        self.infoprice_api_key = config('INFOPRICE_API_KEY', default=None)
        self.infoprice_base_url = config('INFOPRICE_API_URL', default='https://api.infoprice.com.br/v1')
        self.timeout = 15  # segundos
    
    def pesquisar_precos(self, ean: str, empresa_id: int, raio_km: int = 5, usar_cache: bool = True) -> Dict:
        """
        Pesquisa preços do produto EAN em um raio de X km
        
        Args:
            ean: Código de barras do produto
            empresa_id: ID da empresa/loja base para cálculo de distância
            raio_km: Raio de busca em quilômetros
            usar_cache: Se True, usa dados recentes do cache (até 24h)
        
        Returns:
            {
                'sucesso': True,
                'precos': [
                    {
                        'valor': 12.90,
                        'loja': 'Concorrente A',
                        'distancia_km': 2.3,
                        'data_coleta': '2026-03-24T10:30:00'
                    },
                ],
                'estatisticas': {
                    'minimo': 12.90,
                    'maximo': 15.00,
                    'media': 13.47,
                    'moda': 12.90,
                    'mediana': 13.50,
                    'total_amostras': 15
                },
                'fonte': 'INFOPRICE'
            }
        """
        try:
            # Busca produto no banco
            produto = Produto.objects.filter(gtin=ean).first()
            
            # Coordenadas padrão (usa como fallback se empresa não tiver lat/lon)
            lat = -23.5505
            lon = -46.6333
            
            # Tenta buscar coordenadas da empresa (pode não ter coluna latitude/longitude)
            try:
                empresa = EmpresaConfig.objects.filter(id_empresa=empresa_id).first()
                if not empresa:
                    empresa = EmpresaConfig.get_ativa()
                if empresa:
                    lat = float(getattr(empresa, 'latitude', None) or lat)
                    lon = float(getattr(empresa, 'longitude', None) or lon)
            except Exception:
                empresa = None
            
            # Verifica cache primeiro (preços coletados nas últimas 24h)
            if usar_cache and empresa:
                precos_cache = self._buscar_precos_cache(ean, lat, lon, raio_km)
                if precos_cache:
                    logger.info(f"Preços de {ean} encontrados no cache (últimas 24h)")
                    return precos_cache
            
            # Busca em API externa (se configurada)
            if self.infoprice_api_key:
                precos_api = self._buscar_infoprice(ean, lat, lon, raio_km)
                if precos_api['sucesso']:
                    # Salva no cache local
                    self._salvar_precos_cache(ean, precos_api['precos'], produto)
                    return precos_api
            
            # Fallback: busca estimativa de preço via Gemini + Google Search
            nome_produto = produto.nome if produto else None
            if not nome_produto:
                # Tenta buscar nome do produto no Cosmos
                try:
                    from api.services.produto_ean_service import ProdutoEANService
                    svc_ean = ProdutoEANService()
                    dados_cosmos = svc_ean.buscar_produto_por_ean(ean, usar_cache=True)
                    nome_produto = dados_cosmos.get('dados', {}).get('nome', '')
                except Exception:
                    nome_produto = ''

            if nome_produto:
                logger.info(f"Buscando estimativa de preço via Gemini para: {nome_produto}")
                return self._buscar_preco_gemini(nome_produto, ean)

            logger.info(f"Sem nome de produto para buscar preço via Gemini. EAN: {ean}")
            return {
                'sucesso': False,
                'mensagem': 'Não foi possível identificar o produto para pesquisa de preços.',
                'fonte': 'INDISPONIVEL'
            }
            
        except Exception as e:
            logger.error(f"Erro ao pesquisar preços regionais para EAN {ean}: {e}")
            return {
                'sucesso': False,
                'mensagem': f'Erro no serviço: {str(e)}'
            }
    
    def _buscar_preco_gemini(self, nome_produto: str, ean: str) -> Dict:
        """
        Busca estimativa de preço real via Gemini + Google Search grounding.
        Usa busca na internet para obter preços atualizados.
        """
        import json
        try:
            from google import genai
            from google.genai import types
            from decouple import config as decouple_config

            api_key = decouple_config('GEMINI_API_KEY', default=None)
            if not api_key:
                return {'sucesso': False, 'mensagem': 'GEMINI_API_KEY não configurada', 'fonte': 'INDISPONIVEL'}

            client = genai.Client(api_key=api_key)

            prompt = (
                f'Pesquise na internet o preço de venda atual do produto "{nome_produto}" '
                f'(código EAN: {ean}) em supermercados e lojas do Brasil. '
                f'Retorne APENAS um JSON válido neste formato exato:\n'
                f'{{"produto": "nome do produto", "preco_medio": 0.00, "faixa_minima": 0.00, '
                f'"faixa_maxima": 0.00, "lojas": ['
                f'{{"nome": "nome da loja/site", "preco": 0.00}}]}}\n'
                f'REGRAS:\n'
                f'- Use preços REAIS encontrados na internet (sites de supermercados, farmácias, e-commerce).\n'
                f'- Inclua de 2 a 5 lojas/sites com preços encontrados.\n'
                f'- Valores em Reais (R$). NÃO invente preços.'
            )

            response = client.models.generate_content(
                model='models/gemini-2.5-flash-lite',
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                    temperature=0.1,
                )
            )

            resposta_texto = response.text.strip()
            # Limpa markdown
            if resposta_texto.startswith('```json'):
                resposta_texto = resposta_texto[7:]
            if resposta_texto.startswith('```'):
                resposta_texto = resposta_texto[3:]
            if resposta_texto.endswith('```'):
                resposta_texto = resposta_texto[:-3]

            dados = json.loads(resposta_texto.strip())
            logger.info(f"Gemini retornou preços para '{nome_produto}': {dados}")

            # Monta lista de preços no formato esperado
            precos = []
            for loja in dados.get('lojas', []):
                preco_val = float(loja.get('preco', 0))
                if preco_val > 0:
                    precos.append({
                        'valor': preco_val,
                        'loja': loja.get('nome', 'Loja Online'),
                        'distancia_km': None,
                        'data_coleta': timezone.now().isoformat()
                    })

            # Se não retornou lojas mas tem faixa, usa a faixa
            if not precos and dados.get('preco_medio', 0) > 0:
                precos.append({
                    'valor': float(dados['preco_medio']),
                    'loja': 'Média Internet',
                    'distancia_km': None,
                    'data_coleta': timezone.now().isoformat()
                })

            if not precos:
                return {'sucesso': False, 'mensagem': 'Nenhum preço encontrado na internet', 'fonte': 'PESQUISA_WEB'}

            valores = [p['valor'] for p in precos]
            estatisticas = {
                'minimo': round(min(valores), 2),
                'maximo': round(max(valores), 2),
                'media': round(sum(valores) / len(valores), 2),
                'total_amostras': len(valores)
            }

            return {
                'sucesso': True,
                'precos': sorted(precos, key=lambda x: x['valor']),
                'estatisticas': estatisticas,
                'fonte': 'PESQUISA_WEB',
                'mensagem': f'Preços pesquisados na internet para "{nome_produto}"'
            }

        except json.JSONDecodeError as e:
            logger.error(f"Erro ao parsear JSON do Gemini: {e}")
            return {'sucesso': False, 'mensagem': 'Erro ao interpretar resposta da pesquisa', 'fonte': 'PESQUISA_WEB'}
        except Exception as e:
            logger.error(f"Erro na busca de preço via Gemini: {e}")
            return {'sucesso': False, 'mensagem': f'Erro na pesquisa: {str(e)}', 'fonte': 'PESQUISA_WEB'}

    def _gerar_mock_precos(self, ean: str, raio_km: int) -> Dict:
        """Gera preços simulados baseados no preço de mercado"""
        import random
        from api.services.produto_ean_service import ProdutoEANService
        
        # Obtém preço base do Cosmos
        try:
            svc = ProdutoEANService()
            dados_cosmos = svc.buscar_produto_por_ean(ean, usar_cache=True)
            preco_base = dados_cosmos.get('dados', {}).get('preco_sugerido', 0)
        except:
            preco_base = 0
            
        if not preco_base:
            preco_base = random.uniform(10.0, 50.0) # Fallback total
            
        preco_base = float(preco_base)
        
        # Gera 3 a 8 concorrentes
        num_concorrentes = random.randint(3, 8)
        precos = []
        
        nomes_concorrentes = [
            "Supermercado Big Bom", "Atacadão do Bairro", "Mercadinho da Esquina",
            "Hyper Mais", "Empório Central", "Sacolão da Economia",
            "Rede Compre Bem", "Max Atacadista"
        ]
        
        for _ in range(num_concorrentes):
            variacao = random.uniform(-0.15, 0.20) # -15% a +20%
            valor = round(preco_base * (1 + variacao), 2)
            distancia = round(random.uniform(0.5, float(raio_km)), 1)
            
            precos.append({
                'valor': valor,
                'loja': random.choice(nomes_concorrentes),
                'distancia_km': distancia,
                'data_coleta': timezone.now().isoformat()
            })
            
        # Calcula estatísticas
        valores = [p['valor'] for p in precos]
        
        if not valores: return {'sucesso': False, 'mensagem': 'Sem dados'}
        
        return {
            'sucesso': True,
            'precos': sorted(precos, key=lambda x: x['valor']),
            'estatisticas': {
                'minimo': min(valores),
                'maximo': max(valores),
                'media': round(sum(valores) / len(valores), 2),
                'moda': max(set(valores), key=valores.count),
                'total_amostras': len(valores)
            },
            'fonte': 'SIMULACAO_IA',
            'mensagem': f'Encontrados {len(precos)} concorrentes no raio de {raio_km}km'
        }

    def _buscar_infoprice(self, ean: str, lat: float, lon: float, raio_km: int) -> Dict:
        """
        Busca preços na API InfoPrice (ou similar)
        """
        if not self.infoprice_api_key:
            logger.warning("INFOPRICE_API_KEY não configurada")
            return {
                'sucesso': False,
                'mensagem': 'API de preços não configurada. Configure INFOPRICE_API_KEY no .env'
            }
        
        try:
            headers = {
                'Authorization': f'Bearer {self.infoprice_api_key}',
                'Content-Type': 'application/json'
            }
            
            params = {
                'ean': ean,
                'lat': lat,
                'lon': lon,
                'raio_km': raio_km,
                'limit': 50
            }
            
            url = f"{self.infoprice_base_url}/precos/regiao"
            logger.info(f"Consultando InfoPrice: {url}")
            
            response = requests.get(url, params=params, headers=headers, timeout=self.timeout)
            
            if response.status_code == 200:
                data = response.json()
                precos_lista = data.get('precos', [])
                
                if not precos_lista:
                    return {
                        'sucesso': True,
                        'precos': [],
                        'estatisticas': {},
                        'mensagem': 'Nenhum preço encontrado na região especificada',
                        'fonte': 'INFOPRICE'
                    }
                
                # Calcula estatísticas
                estatisticas = self._calcular_estatisticas(precos_lista)
                
                return {
                    'sucesso': True,
                    'precos': precos_lista,
                    'estatisticas': estatisticas,
                    'mensagem': f'{len(precos_lista)} preços encontrados',
                    'fonte': 'INFOPRICE'
                }
            
            elif response.status_code == 404:
                return {
                    'sucesso': False,
                    'mensagem': 'Produto não encontrado na base de preços',
                    'fonte': 'INFOPRICE'
                }
            
            else:
                logger.error(f"InfoPrice retornou HTTP {response.status_code}")
                return {
                    'sucesso': False,
                    'mensagem': f'Erro na API: HTTP {response.status_code}',
                    'fonte': 'INFOPRICE'
                }
        
        except requests.Timeout:
            logger.error("Timeout ao consultar API de preços")
            return {
                'sucesso': False,
                'mensagem': 'Timeout na consulta (servidor demorou demais)',
                'fonte': 'INFOPRICE'
            }
        
        except Exception as e:
            logger.error(f"Erro ao consultar InfoPrice: {e}")
            return {
                'sucesso': False,
                'mensagem': f'Erro: {str(e)}',
                'fonte': 'INFOPRICE'
            }
    
    def _buscar_fallback(self, ean: str) -> Dict:
        """
        Fallback: busca em fontes alternativas
        """
        # TODO: Implementar scraping de sites de supermercados
        # TODO: Implementar consulta a NFe públicas estaduais
        
        return {
            'sucesso': False,
            'mensagem': 'Nenhuma fonte de preços disponível no momento',
            'fonte': 'FALLBACK'
        }
    
    def _buscar_precos_cache(self, ean: str, lat: float, lon: float, raio_km: int) -> Dict:
        """
        Busca preços no cache local (últimas 24 horas)
        """
        from django.db.models import Q
        from math import radians, cos, sin, asin, sqrt
        
        data_limite = timezone.now() - timedelta(hours=24)
        
        # Busca preços recentes
        precos_recentes = PrecoConcorrente.objects.filter(
            ean=ean,
            data_coleta__gte=data_limite
        ).order_by('-data_coleta')
        
        if not precos_recentes.exists():
            return None
        
        # Filtra por raio (cálculo aproximado usando Haversine)
        precos_lista = []
        for preco in precos_recentes:
            if preco.latitude and preco.longitude:
                distancia = self._calcular_distancia_haversine(
                    lat, lon,
                    float(preco.latitude), float(preco.longitude)
                )
                
                if distancia <= raio_km:
                    precos_lista.append({
                        'valor': float(preco.preco),
                        'loja': preco.nome_loja or 'Concorrente',
                        'distancia_km': round(distancia, 2),
                        'data_coleta': preco.data_coleta.isoformat()
                    })
        
        if not precos_lista:
            return None
        
        estatisticas = self._calcular_estatisticas(precos_lista)
        
        return {
            'sucesso': True,
            'precos': precos_lista,
            'estatisticas': estatisticas,
            'mensagem': f'{len(precos_lista)} preços encontrados (cache)',
            'fonte': 'CACHE',
            'cache_idade_horas': 24
        }
    
    def _salvar_precos_cache(self, ean: str, precos_lista: List[Dict], produto: Produto = None):
        """
        Salva preços no cache local para consultas futuras
        """
        try:
            for preco_data in precos_lista:
                PrecoConcorrente.objects.create(
                    produto=produto,
                    ean=ean,
                    nome_loja=preco_data.get('loja'),
                    latitude=preco_data.get('latitude'),
                    longitude=preco_data.get('longitude'),
                    distancia_km=preco_data.get('distancia_km'),
                    preco=Decimal(str(preco_data['valor'])),
                    fonte='INFOPRICE',
                    dados_origem_json=preco_data
                )
            
            logger.info(f"Salvos {len(precos_lista)} preços no cache para EAN {ean}")
        
        except Exception as e:
            logger.error(f"Erro ao salvar preços no cache: {e}")
    
    def _calcular_estatisticas(self, precos_lista: List[Dict]) -> Dict:
        """
        Calcula estatísticas dos preços (min, max, média, moda, mediana)
        """
        from statistics import mean, median, mode, StatisticsError
        
        valores = [p['valor'] for p in precos_lista]
        
        if not valores:
            return {}
        
        try:
            moda_valor = mode(valores)
        except StatisticsError:
            # Se não há moda (todos valores únicos), pega a mediana
            moda_valor = median(valores)
        
        return {
            'minimo': round(min(valores), 2),
            'maximo': round(max(valores), 2),
            'media': round(mean(valores), 2),
            'mediana': round(median(valores), 2),
            'moda': round(moda_valor, 2),
            'total_amostras': len(valores),
            'desvio_padrao': round(self._calcular_desvio_padrao(valores), 2)
        }
    
    def _calcular_desvio_padrao(self, valores: List[float]) -> float:
        """Calcula desvio padrão"""
        from statistics import stdev
        try:
            return stdev(valores) if len(valores) > 1 else 0.0
        except:
            return 0.0
    
    def _calcular_distancia_haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calcula distância entre dois pontos GPS (em km) usando fórmula de Haversine
        """
        from math import radians, cos, sin, asin, sqrt
        
        # Converte para radianos
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
        
        # Fórmula de Haversine
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        
        # Raio da Terra em km
        r = 6371
        
        return c * r
