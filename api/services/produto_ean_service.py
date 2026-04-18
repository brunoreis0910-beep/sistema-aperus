"""
Serviço de integração com APIs de produtos via código EAN/GTIN
Provedores suportados: Cosmos (Bluesoft), GS1 Brasil, Mercado Livre
"""
import requests
import logging
import json
import os
from typing import Dict, Optional
from decouple import config
from django.core.cache import cache

logger = logging.getLogger(__name__)


class ProdutoEANService:
    """
    Busca dados enriquecidos de produtos em APIs externas via EAN
    """
    
    def __init__(self):
        self.cosmos_api_key = config('COSMOS_API_KEY', default=None)
        self.cloudmersive_api_key = config('CLOUDMERSIVE_API_KEY', default=None)
        self.cosmos_base_url = 'https://api.cosmos.bluesoft.com.br/gtins'
        self.timeout = 10  # segundos
        self._produtos_demo_cache = None  # Cache em memória dos produtos demo
    
    def buscar_produto_por_ean(self, ean: str, usar_cache: bool = True) -> Dict:
        """
        Busca dados completos de um produto pelo código EAN
        
        Args:
            ean: Código de barras EAN/GTIN (8, 13 ou 14 dígitos)
            usar_cache: Se True, verifica cache antes de chamar API
        
        Returns:
            {
                'sucesso': True/False,
                'dados': {
                    'ean': '7891234567890',
                    'nome': 'Creme de Avelã Triângulo 170g',
                    'descricao': 'Creme de avelã com cacau',
                    'imagem_url': 'https://...',
                    'marca': 'Nutrella',
                    'categoria_sugerida': 'Mercearia Doce',
                    'ncm': '18063200',
                    'peso': 0.170,
                    'unidade': 'UN'
                },
                'fonte': 'COSMOS',
                'mensagem': 'Produto encontrado'
            }
        """
        # Validação básica do EAN
        ean = ean.strip()
        if not ean or not ean.isdigit():
            return {
                'sucesso': False,
                'dados': None,
                'mensagem': 'EAN inválido (deve conter apenas dígitos)'
            }
        
        if len(ean) not in [8, 12, 13, 14]:
            return {
                'sucesso': False,
                'dados': None,
                'mensagem': f'EAN com tamanho inválido: {len(ean)} dígitos'
            }
        
        # Verifica cache (válido por 7 dias apenas para dados reais de API)
        cache_key = f'produto_ean_{ean}'
        if usar_cache:
            cached_data = cache.get(cache_key)
            if cached_data:
                # Ignora cache de resultados DEMO/genéricos — sempre recarrega do JSON
                fonte_cached = cached_data.get('fonte', '')
                is_generic = cached_data.get('is_generic', False)
                if fonte_cached not in ('DEMO',) and not is_generic:
                    logger.info(f"Produto EAN {ean} encontrado no cache (fonte: {fonte_cached})")
                    cached_data['cache_hit'] = True
                    return cached_data
                else:
                    logger.info(f"Cache ignorado para EAN {ean} (dado DEMO/genérico — recarregando)")
                    cache.delete(cache_key)
        
        try:
            # Tenta Cosmos API primeiro (melhor cobertura Brasil)
            resultado = self._buscar_cosmos(ean)
            
            if resultado['sucesso']:
                # Só cacheia por 7 dias se for dado REAL de API (não DEMO)
                if resultado.get('fonte') not in ('DEMO',) and not resultado.get('is_generic'):
                    cache.set(cache_key, resultado, 60 * 60 * 24 * 7)
                else:
                    # Dado DEMO: cacheia por apenas 5 minutos para permitir atualização do JSON
                    cache.set(cache_key, resultado, 60 * 5)
                return resultado
            
            # Fallback: outras APIs
            logger.warning(f"Cosmos falhou para EAN {ean}, tentando fallback...")
            resultado = self._buscar_fallback(ean)
            
            if resultado['sucesso']:
                if resultado.get('fonte') not in ('DEMO',) and not resultado.get('is_generic'):
                    cache.set(cache_key, resultado, 60 * 60 * 24 * 7)
                else:
                    cache.set(cache_key, resultado, 60 * 5)
            
            return resultado
            
        except Exception as e:
            logger.error(f"Erro ao buscar produto EAN {ean}: {e}")
            return {
                'sucesso': False,
                'dados': None,
                'fonte': 'ERRO',
                'mensagem': f'Erro no serviço: {str(e)}'
            }
    
    def _buscar_cosmos(self, ean: str) -> Dict:
        """
        Busca na API Cosmos (Bluesoft)
        Docs: https://cosmos.bluesoft.com.br/api
        """
        if not self.cosmos_api_key:
            logger.info(f"COSMOS_API_KEY não configurada - tentando Open Food Facts para EAN {ean}")
            # Sem chave Cosmos: tenta Open Food Facts (grátis, sem chave)
            resultado_off = self._buscar_open_food_facts(ean)
            if resultado_off['sucesso']:
                return resultado_off
            # Tenta Cloudmersive (800/mês grátis; opcional)
            resultado_cm = self._buscar_cloudmersive(ean)
            if resultado_cm['sucesso']:
                return resultado_cm
            # Última opção: dados DEMO/locais
            return self._gerar_dados_demo(ean)
        
        try:
            headers = {
                'X-Cosmos-Token': self.cosmos_api_key,
                'User-Agent': 'Cosmos-API-Request',
                'Content-Type': 'application/json',
            }
            url = f"{self.cosmos_base_url}/{ean}.json"
            
            logger.info(f"Consultando Cosmos API: {url}")
            response = requests.get(url, headers=headers, timeout=self.timeout)
            
            if response.status_code == 200:
                data = response.json()
                
                # net_weight vem em gramas na API Cosmos → converter para kg
                peso_gramas = data.get('net_weight') or data.get('gross_weight') or 0
                try:
                    peso_kg = float(peso_gramas) / 1000
                except (TypeError, ValueError):
                    peso_kg = 0

                # Extrai dados padronizados
                produto_data = {
                    'ean': str(data.get('gtin', ean)),
                    'nome': data.get('description', '').strip(),
                    'descricao': data.get('description', '').strip(),
                    'imagem_url': data.get('thumbnail', ''),
                    'marca': data.get('brand', {}).get('name', '') if isinstance(data.get('brand'), dict) else '',
                    'categoria_sugerida': data.get('gpc', {}).get('description', '') if isinstance(data.get('gpc'), dict) else '',
                    'ncm': data.get('ncm', {}).get('code', '') if isinstance(data.get('ncm'), dict) else '',
                    'peso': peso_kg,
                    'unidade': 'UN',
                    'altura': data.get('height', 0),
                    'largura': data.get('width', 0),
                    'profundidade': data.get('length', 0),
                    'preco_sugerido': data.get('avg_price') or data.get('price') or 0,
                }
                
                return {
                    'sucesso': True,
                    'dados': produto_data,
                    'fonte': 'COSMOS',
                    'dados_completos': data,  # Backup do JSON original
                    'mensagem': 'Produto encontrado na base Cosmos'
                }
            
            elif response.status_code == 404:
                return {
                    'sucesso': False,
                    'mensagem': 'Produto não encontrado na base Cosmos',
                    'fonte': 'COSMOS'
                }
            
            else:
                logger.warning(f"Cosmos retornou HTTP {response.status_code}")
                return {
                    'sucesso': False,
                    'mensagem': f'Erro na API Cosmos: HTTP {response.status_code}',
                    'fonte': 'COSMOS'
                }
        
        except requests.Timeout:
            logger.error("Timeout ao consultar Cosmos API")
            return {
                'sucesso': False,
                'mensagem': 'Timeout na consulta (servidor demorou demais)',
                'fonte': 'COSMOS'
            }
        
        except Exception as e:
            logger.error(f"Erro ao consultar Cosmos: {e}")
            return {
                'sucesso': False,
                'mensagem': f'Erro: {str(e)}',
                'fonte': 'COSMOS'
            }
    
    def _buscar_fallback(self, ean: str) -> Dict:
        """
        Fallback: Open Food Facts → Cloudmersive (opcional, 800/mês) → Gemini IA → DEMO local
        """
        resultado_off = self._buscar_open_food_facts(ean)
        if resultado_off['sucesso']:
            return resultado_off
        resultado_cm = self._buscar_cloudmersive(ean)
        if resultado_cm['sucesso']:
            return resultado_cm
        resultado_ia = self._buscar_via_gemini_ia(ean)
        if resultado_ia['sucesso']:
            return resultado_ia
        return self._gerar_dados_demo(ean)

    def _buscar_via_gemini_ia(self, ean: str) -> Dict:
        """
        Fallback via Gemini AI + Google Search.
        Quando todas as APIs falham, pesquisa o EAN na internet e extrai nome, marca e NCM.
        """
        try:
            from google import genai
            from google.genai import types
            from decouple import config as dconfig

            api_key = dconfig('GEMINI_API_KEY', default='')
            if not api_key:
                return {'sucesso': False, 'mensagem': 'GEMINI_API_KEY não configurada', 'fonte': 'GEMINI_IA'}

            client = genai.Client(api_key=api_key)

            prompt = (
                f"Pesquise o produto brasileiro com código de barras EAN/GTIN: {ean}\n"
                "Encontre o nome completo do produto, marca e categoria.\n"
                "Responda APENAS em JSON com os campos:\n"
                '{"nome": "...", "marca": "...", "ncm": "...", "categoria": "...", "unidade": "UN"}\n'
                "Se não encontrar, responda: {\"nome\": \"\", \"marca\": \"\", \"ncm\": \"\", \"categoria\": \"Mercearia > Outros\", \"unidade\": \"UN\"}"
            )

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                    temperature=0.1,
                )
            )

            texto = (response.text or '').strip()
            logger.info(f"[GEMINI EAN] Resposta para EAN {ean}: {texto[:200]}")

            # Extrai JSON da resposta
            import re as _re
            match_json = _re.search(r'\{[^{}]+\}', texto, _re.DOTALL)
            if not match_json:
                return {'sucesso': False, 'mensagem': 'Gemini não retornou JSON válido', 'fonte': 'GEMINI_IA'}

            dados_ia = json.loads(match_json.group())
            nome = (dados_ia.get('nome') or '').strip()

            if not nome:
                return {'sucesso': False, 'mensagem': 'Gemini não identificou o produto', 'fonte': 'GEMINI_IA'}

            # Tenta extrair imagem usando os grounding chunks
            imagem_url = ''
            if response.candidates and response.candidates[0].grounding_metadata:
                gm = response.candidates[0].grounding_metadata
                if gm.grounding_chunks:
                    import requests as _req
                    headers = {'User-Agent': 'Mozilla/5.0'}
                    for chunk in gm.grounding_chunks[:3]:
                        if hasattr(chunk, 'web') and chunk.web and chunk.web.uri:
                            try:
                                resp = _req.get(chunk.web.uri, timeout=5, headers=headers, allow_redirects=True)
                                match_img = _re.search(r'og:image["\s]+content="([^"]+)"', resp.text)
                                if not match_img:
                                    match_img = _re.search(r'content="([^"]+)"[^>]*property="og:image"', resp.text)
                                if match_img:
                                    url_img = match_img.group(1)
                                    if url_img.startswith('http') and 'logo' not in url_img.lower():
                                        imagem_url = url_img
                                        break
                            except Exception:
                                continue

            ncm_raw = dados_ia.get('ncm') or ''
            ncm_digits = ''.join(filter(str.isdigit, str(ncm_raw)))
            ncm = ncm_digits if len(ncm_digits) == 8 else ''

            produto_data = {
                'ean': ean,
                'nome': nome,
                'descricao': nome,
                'imagem_url': imagem_url,
                'marca': (dados_ia.get('marca') or '').strip(),
                'categoria_sugerida': (dados_ia.get('categoria') or 'Mercearia > Outros').strip(),
                'ncm': ncm,
                'peso': 0,
                'unidade': (dados_ia.get('unidade') or 'UN').strip(),
            }

            logger.info(f"[GEMINI EAN] Produto identificado: {nome[:60]}")
            return {
                'sucesso': True,
                'dados': produto_data,
                'fonte': 'GEMINI_IA',
                'is_generic': False,
                'mensagem': f'Produto identificado via IA (confira os dados antes de salvar)'
            }

        except json.JSONDecodeError as e:
            logger.warning(f"[GEMINI EAN] JSON inválido na resposta: {e}")
            return {'sucesso': False, 'mensagem': 'Resposta IA inválida', 'fonte': 'GEMINI_IA'}
        except Exception as e:
            logger.warning(f"[GEMINI EAN] Erro ao consultar Gemini para EAN {ean}: {e}")
            return {'sucesso': False, 'mensagem': str(e), 'fonte': 'GEMINI_IA'}

    def _buscar_cloudmersive(self, ean: str) -> Dict:
        """
        Busca na API Cloudmersive Barcode Lookup (plano grátis: 800 consultas/mês).
        Requer CLOUDMERSIVE_API_KEY no .env — configuração totalmente opcional.
        Docs: https://cloudmersive.com/barcode-reader-and-generator-api
        """
        if not self.cloudmersive_api_key:
            return {'sucesso': False, 'mensagem': 'CLOUDMERSIVE_API_KEY não configurada', 'fonte': 'CLOUDMERSIVE'}

        try:
            # Endpoint oficial: POST /barcode/lookup/ean
            # Body: string JSON simples (o próprio EAN)
            # Resposta: {"Successful": bool, "Matches": [{"EAN": str, "Title": str}]}
            url = 'https://api.cloudmersive.com/barcode/lookup/ean'
            headers = {
                'Apikey': self.cloudmersive_api_key,
                'Content-Type': 'application/json',
            }
            import json as _json
            logger.info(f'Consultando Cloudmersive para EAN {ean} ...')
            response = requests.post(url, data=_json.dumps(ean), headers=headers, timeout=8)

            if response.status_code == 401:
                logger.warning('Cloudmersive: API key inválida ou expirada')
                return {'sucesso': False, 'mensagem': 'Cloudmersive: chave inválida', 'fonte': 'CLOUDMERSIVE'}

            if response.status_code != 200:
                return {'sucesso': False, 'mensagem': f'Cloudmersive HTTP {response.status_code}', 'fonte': 'CLOUDMERSIVE'}

            data = response.json()

            if not data.get('Successful'):
                logger.info(f'EAN {ean} não encontrado no Cloudmersive')
                return {'sucesso': False, 'mensagem': 'Produto não encontrado no Cloudmersive', 'fonte': 'CLOUDMERSIVE'}

            matches = data.get('Matches') or []
            if not matches:
                return {'sucesso': False, 'mensagem': 'Cloudmersive retornou lista vazia', 'fonte': 'CLOUDMERSIVE'}

            match = matches[0]
            # A API retorna apenas "Title" — não há Manufacturer, imagem ou NCM
            nome = (match.get('Title') or '').strip()
            if not nome:
                return {'sucesso': False, 'mensagem': 'Cloudmersive: produto sem nome', 'fonte': 'CLOUDMERSIVE'}

            produto_data = {
                'ean': ean,
                'nome': nome,
                'descricao': nome,
                'imagem_url': '',
                'marca': '',
                'categoria_sugerida': 'Mercearia > Outros',
                'ncm': '',
                'peso': 0,
                'unidade': 'UN',
            }

            logger.info(f'Cloudmersive encontrou: {nome[:60]}')
            return {
                'sucesso': True,
                'dados': produto_data,
                'fonte': 'CLOUDMERSIVE',
                'is_generic': False,
                'mensagem': 'Produto encontrado via Cloudmersive'
            }

        except requests.Timeout:
            logger.warning(f'Timeout ao consultar Cloudmersive para EAN {ean}')
            return {'sucesso': False, 'mensagem': 'Timeout Cloudmersive', 'fonte': 'CLOUDMERSIVE'}
        except Exception as e:
            logger.warning(f'Erro ao consultar Cloudmersive: {e}')
            return {'sucesso': False, 'mensagem': str(e), 'fonte': 'CLOUDMERSIVE'}

    def _buscar_open_food_facts(self, ean: str) -> Dict:
        """
        Busca na Open Food Facts — API pública gratuita, sem chave.
        Boa cobertura de produtos brasileiros + mundiais.
        Docs: https://world.openfoodfacts.org/data
        """
        try:
            url = f'https://world.openfoodfacts.org/api/v0/product/{ean}.json'
            headers = {
                'User-Agent': 'SistemaGerencial/1.0 (contato@seudominio.com.br)'
            }
            logger.info(f'Consultando Open Food Facts para EAN {ean} ...')
            response = requests.get(url, headers=headers, timeout=8)

            if response.status_code != 200:
                return {'sucesso': False, 'mensagem': f'Open Food Facts HTTP {response.status_code}', 'fonte': 'OPEN_FOOD_FACTS'}

            data = response.json()

            if data.get('status') != 1:
                logger.info(f'EAN {ean} não encontrado no Open Food Facts')
                return {'sucesso': False, 'mensagem': 'Produto não encontrado no Open Food Facts', 'fonte': 'OPEN_FOOD_FACTS'}

            p = data.get('product', {})

            # Nome: preferir versão em pt_BR / pt, com fallback para inglês
            nome = (
                p.get('product_name_pt_BR')
                or p.get('product_name_pt')
                or p.get('product_name')
                or p.get('abbreviated_product_name')
                or ''
            ).strip()

            if not nome:
                return {'sucesso': False, 'mensagem': 'Produto sem nome no Open Food Facts', 'fonte': 'OPEN_FOOD_FACTS'}

            marca = (p.get('brands') or '').split(',')[0].strip()
            imagem = p.get('image_front_url') or p.get('image_url') or ''

            # Peso: tenta campo numérico primeiro, depois texto
            try:
                peso = float(p.get('product_quantity') or 0) / 1000
            except (TypeError, ValueError):
                peso = 0

            # Categoria: primeira categoria da lista (formato pt_BR se disponível)
            categorias_raw = p.get('categories_hierarchy', []) or p.get('categories', '').split(',')
            categoria_sugerida = ''
            for c in reversed(categorias_raw):  # mais específica primeiro
                c_clean = c.strip().replace('pt:', '').replace('en:', '').replace('-', ' ').title()
                if c_clean and len(c_clean) > 3:
                    categoria_sugerida = c_clean
                    break

            produto_data = {
                'ean': ean,
                'nome': nome,
                'descricao': p.get('generic_name') or nome,
                'imagem_url': imagem,
                'marca': marca,
                'categoria_sugerida': categoria_sugerida or 'Mercearia > Outros',
                'ncm': '',  # OFF não tem NCM brasileiro
                'peso': peso,
                'unidade': 'UN',
            }

            logger.info(f'Open Food Facts encontrou: {nome[:60]}')
            return {
                'sucesso': True,
                'dados': produto_data,
                'fonte': 'OPEN_FOOD_FACTS',
                'is_generic': False,
                'mensagem': f'Produto encontrado via Open Food Facts'
            }

        except requests.Timeout:
            logger.warning(f'Timeout ao consultar Open Food Facts para EAN {ean}')
            return {'sucesso': False, 'mensagem': 'Timeout Open Food Facts', 'fonte': 'OPEN_FOOD_FACTS'}
        except Exception as e:
            logger.warning(f'Erro ao consultar Open Food Facts: {e}')
            return {'sucesso': False, 'mensagem': str(e), 'fonte': 'OPEN_FOOD_FACTS'}
    
    def _carregar_produtos_demo_json(self) -> dict:
        """
        Carrega produtos demo do arquivo produtos_demo.json
        Mantém em cache na memória para performance
        """
        if self._produtos_demo_cache is not None:
            return self._produtos_demo_cache
        
        # Caminho do arquivo JSON (na raiz do projeto)
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        json_path = os.path.join(base_dir, 'produtos_demo.json')
        
        produtos_dict = {}
        
        if os.path.exists(json_path):
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    produtos_lista = data.get('produtos', [])
                    
                    # Converte lista para dict indexado por EAN
                    for p in produtos_lista:
                        produtos_dict[p['ean']] = p
                    
                    logger.info(f"✅ Carregados {len(produtos_dict)} produtos demo de {json_path}")
            except Exception as e:
                logger.warning(f"Erro ao carregar {json_path}: {e}")
        else:
            logger.warning(f"Arquivo {json_path} não encontrado - usando produtos hardcoded")
        
        # Produtos hardcoded como fallback (mantém compatibilidade)
        """
        Gera dados fictícios COMPLETOS para demonstração e testes
        Útil quando COSMOS_API_KEY não está configurada
        """
        # Base de produtos demo comuns em supermercado
        fallback_produtos = {
            '891150104808': { # Typo comum (EAN com dígito a menos)
                'nome': 'ENX.BUCAL SPRAY CLOSEUP GO ICE ZERO ALCOOL 35ML',
                'marca': 'Closeup',
                'categoria': 'Higiene Pessoal > Higiene Bucal',
                'ncm': '33069000',  # Preparações para higiene bucal
                'peso': 0.035,
                'unidade': 'UN',
                'preco_sugerido': 15.90,
                'imagem': 'https://via.placeholder.com/300x300.png/00CED1/FFFFFF?text=Closeup+Go+Ice',
                'departamento': 'Higiene Pessoal',
                'grupo_id': None,  # Será buscado dinamicamente se existir
                'grupo_nome': 'Higiene Bucal'
            },
            '7891150104808': {
                'nome': 'ENX.BUCAL SPRAY CLOSEUP GO ICE ZERO ALCOOL 35ML',
                'marca': 'Closeup',
                'categoria': 'Higiene Pessoal > Higiene Bucal',
                'ncm': '33069000',  # NCM 3306.90.00 - Preparações para higiene bucal
                'peso': 0.035,
                'unidade': 'UN',
                'preco_sugerido': 15.90,
                'imagem': 'https://via.placeholder.com/300x300.png/00CED1/FFFFFF?text=Closeup+Go+Ice',
                'departamento': 'Higiene Pessoal',
                'grupo_id': None,
                'grupo_nome': 'Higiene Bucal'
            },
            '7896434921478': {
                'nome': 'Creme de Avelã NUTRELLA 350g',
                'marca': 'Nutrella',
                'categoria': 'Mercearia Doce > Cremes',
                'ncm': '18063200',
                'peso': 0.35,
                'preco_sugerido': 18.50,
                'imagem': 'https://via.placeholder.com/300x300.png/8B4513/FFFFFF?text=Nutrella+350g',
                'departamento': 'Mercearia',
                'grupo_id': None,
                'grupo_nome': 'Doces e Sobremesas'
            },
            '7891000100103': {
                'nome': 'Leite Condensado MOÇA Lata 395g',
                'marca': 'Nestlé',
                'categoria': 'Mercearia Doce > Leites',
                'ncm': '04029110',
                'peso': 0.395,
                'preco_sugerido': 9.90,
                'imagem': 'https://via.placeholder.com/300x300.png/FF6347/FFFFFF?text=Leite+Moca',
                'departamento': 'Mercearia',
                'grupo_id': None,
                'grupo_nome': 'Laticínios'
            },
            '7896045508037': {
                'nome': 'Refrigerante COCA-COLA 2L',
                'marca': 'Coca-Cola',
                'categoria': 'Bebidas > Refrigerantes',
                'ncm': '22021000',
                'peso': 2.0,
                'preco_sugerido': 8.99,
                'imagem': 'https://via.placeholder.com/300x300.png/DC143C/FFFFFF?text=Coca-Cola+2L',
                'departamento': 'Bebidas',
                'grupo_id': None,
                'grupo_nome': 'Refrigerantes'
            },
            '7898543417224': {
                'nome': 'Produto EAN 7898543417224',  # ⚠️ NOME GENÉRICO - Configure COSMOS_API_KEY para nome real
                'marca': 'A Definir',
                'categoria': 'Mercearia > Diversos',
                'ncm': '',  # Será preenchido pela API real
                'peso': 0,
                'unidade': 'UN',
                'preco_sugerido': 9.99,
                'imagem': 'https://via.placeholder.com/300x300.png/4169E1/FFFFFF?text=EAN+7898543417224',
                'departamento': 'Mercearia',
                'grupo_id': None,
                'grupo_nome': 'Diversos'
            },
            '7896098902103': {
                'nome': 'Produto EAN 7896098902103',  # ⚠️ NOME GENÉRICO - Configure COSMOS_API_KEY para nome real
                'marca': 'A Definir',
                'categoria': 'Mercearia > Diversos',
                'ncm': '',
                'peso': 0,
                'unidade': 'UN',
                'preco_sugerido': 9.99,
                'imagem': 'https://via.placeholder.com/300x300.png/9370DB/FFFFFF?text=EAN+7896098902103',
                'departamento': 'Mercearia',
                'grupo_id': None,
                'grupo_nome': 'Diversos'
            },
        }
        
        # Merge: JSON tem prioridade sobre hardcoded
        for ean_key, produto_data in fallback_produtos.items():
            if ean_key not in produtos_dict:
                produtos_dict[ean_key] = produto_data
        
        # Armazena no cache de memória
        self._produtos_demo_cache = produtos_dict
        
        return produtos_dict
    
    def _gerar_dados_demo(self, ean: str) -> Dict:
        """
        Gera dados fictícios COMPLETOS para demonstração e testes
        Carrega do arquivo produtos_demo.json (editável) com fallback hardcoded
        """
        # Carrega produtos (com cache em memória)
        produtos_demo = self._carregar_produtos_demo_json()
        
        # Verifica se é um EAN conhecido
        if ean in produtos_demo:
            produto = produtos_demo[ean]
            
            # Tenta buscar GrupoProduto real no banco (se existir)
            from api.models import GrupoProduto
            grupo_db = None
            try:
                grupo_db = GrupoProduto.objects.filter(
                    nome__icontains=produto['grupo_nome']
                ).first()
            except Exception:
                pass
            
            nome = produto.get('nome', f'Produto {ean}')
            ncm = produto.get('ncm', '')
            preco = produto.get('preco_sugerido', 9.99)
            # Imagem: usa do JSON se disponível, senão gera placeholder
            imagem_url = produto.get('imagem') or f'https://via.placeholder.com/300x300.png/4169E1/FFFFFF?text=EAN+{ean}'
            # Nome genérico = produto não identificado, IA pode tentar classificar pelo código
            nome_eh_generico = nome.startswith('Produto EAN ') or nome.startswith('Produto ') and nome.strip() == f'Produto {ean}'
            
            return {
                'sucesso': True,
                'dados': {
                    'ean': ean,
                    'nome': nome,
                    'descricao': produto.get('descricao', nome),
                    'imagem_url': imagem_url,
                    'marca': produto.get('marca', 'A Definir'),
                    'categoria_sugerida': produto.get('categoria', 'Mercearia > Outros'),
                    'ncm': ncm,
                    'peso': produto.get('peso', 0),
                    'unidade': produto.get('unidade', 'UN'),
                    'preco_sugerido': preco,
                    'grupo_produto': {
                        'id': grupo_db.id if grupo_db else None,
                        'nome': grupo_db.nome if grupo_db else produto.get('grupo_nome', 'Diversos')
                    },
                    'classificacao': {
                        'departamento': produto.get('departamento', 'Mercearia'),
                        'categoria': produto.get('categoria', 'Outros'),
                        'confianca': 0.50 if nome_eh_generico else 0.95,
                        'fonte': 'demo'
                    },
                    'precos_concorrentes': {
                        'minimo': round(preco * 0.85, 2),
                        'maximo': round(preco * 1.20, 2),
                        'media': preco,
                        'moda': preco,
                        'quantidade_lojas': 3,
                        'raio_km': 5
                    }
                },
                'fonte': 'DEMO',
                # Sinaliza se é genérico para o frontend exibir alerta apropriado
                'is_generic': nome_eh_generico,
                'mensagem': (
                    f'⚠️ Produto EAN {ean} não identificado. Preencha o nome manualmente ou configure COSMOS_API_KEY.'
                    if nome_eh_generico else
                    '⚠️ Dados DEMO locais (configure COSMOS_API_KEY no .env para usar API real)'
                )
            }
        
        # Produto genérico: EAN não está cadastrado no JSON e não há API configurada
        logger.warning(f"EAN {ean} não encontrado no demo. Adicione em produtos_demo.json ou configure COSMOS_API_KEY.")
        return {
            'sucesso': True,
            'dados': {
                'ean': ean,
                'nome': '',  # Vazio para forçar preenchimento manual no frontend
                'descricao': '',
                'imagem_url': f'https://via.placeholder.com/300x300.png/FF6B6B/FFFFFF?text=EAN+%3F',
                'marca': '',
                'categoria_sugerida': 'Mercearia > Outros',
                'ncm': '',
                'peso': 0,
                'unidade': 'UN',
                'preco_sugerido': 0,
                'grupo_produto': {
                    'id': None,
                    'nome': 'Diversos'
                },
                'classificacao': {
                    'departamento': 'Mercearia',
                    'categoria': 'Outros',
                    'confianca': 0.0,
                    'fonte': 'demo'
                },
                'precos_concorrentes': None
            },
            'fonte': 'DEMO',
            'is_generic': True,
            'mensagem': f'⚠️ EAN {ean} não encontrado. Preencha o nome manualmente ou adicione ao arquivo produtos_demo.json.'
        }
    
    def buscar_mercado_livre(self, ean: str) -> Dict:
        """
        Busca no Mercado Livre (implementação futura)
        """
        # API do Mercado Livre: https://developers.mercadolivre.com.br
        pass
    
    def invalidar_cache(self, ean: str):
        """Remove produto do cache"""
        cache_key = f'produto_ean_{ean}'
        cache.delete(cache_key)
        logger.info(f"Cache invalidado para EAN {ean}")
    
    def validar_ean_checksum(self, ean: str) -> bool:
        """
        Valida o dígito verificador do EAN (algoritmo EAN-13)
        Returns True se válido
        """
        try:
            if len(ean) not in [8, 13]:
                return False
            
            # Algoritmo de validação EAN
            digits = [int(d) for d in ean]
            check_digit = digits[-1]
            
            soma = 0
            for i, digit in enumerate(digits[:-1]):
                if i % 2 == 0:
                    soma += digit
                else:
                    soma += digit * 3
            
            calculated_check = (10 - (soma % 10)) % 10
            
            return check_digit == calculated_check
        
        except:
            return False
