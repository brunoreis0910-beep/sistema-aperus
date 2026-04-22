"""
Views para Cadastro Turbo de Produtos via EAN
Funcionalidades avançadas para supermercados
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from api.models import Produto, GrupoProduto
from api.models_mercadologico import InformacaoProdutoAPI, CategoriaMercadologica
from api.services.produto_ean_service import ProdutoEANService
from api.serializers import ProdutoSerializer
import logging
import os
import re
import requests as http_requests

logger = logging.getLogger(__name__)


def _buscar_imagem_produto_ia(nome_produto, ean=''):
    """Busca imagem do produto via Gemini + Google Search + og:image scraping."""
    try:
        from google import genai
        from google.genai import types
        from decouple import config

        api_key = config('GEMINI_API_KEY', default='')
        if not api_key:
            return None

        client = genai.Client(api_key=api_key)

        prompt = (
            f"Pesquise na internet o produto brasileiro: {nome_produto}\n"
            "Encontre uma página de loja online (farmácia, supermercado, e-commerce) "
            "que venda este produto e tenha foto dele."
        )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                temperature=0.1,
            )
        )

        # Extrai URLs reais dos grounding chunks
        urls_produto = []
        if response.candidates and response.candidates[0].grounding_metadata:
            gm = response.candidates[0].grounding_metadata
            if gm.grounding_chunks:
                for chunk in gm.grounding_chunks[:5]:
                    if hasattr(chunk, 'web') and chunk.web and chunk.web.uri:
                        urls_produto.append(chunk.web.uri)

        # Para cada URL encontrada, tenta extrair og:image
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        for url in urls_produto:
            try:
                # Segue redirects (grounding URLs são redirects do Google)
                resp = http_requests.get(url, timeout=8, headers=headers, allow_redirects=True)
                if resp.status_code != 200:
                    continue

                # Tenta extrair og:image
                match = re.search(r'og:image["\s]+content="([^"]+)"', resp.text)
                if not match:
                    match = re.search(r'content="([^"]+)"[^>]*property="og:image"', resp.text)
                if match:
                    img_url = match.group(1)
                    if img_url.startswith('http') and not 'logo' in img_url.lower():
                        print(f"[TURBO] Imagem encontrada via og:image de {resp.url[:60]}: {img_url[:80]}")
                        return img_url
            except Exception:
                continue

        # Fallback: tenta a URL direta que o Gemini retornou no texto
        texto = response.text.strip()
        if texto.startswith('http'):
            url_direta = texto.split('\n')[0].strip().split(' ')[0]
            if url_direta.startswith('http'):
                try:
                    r = http_requests.head(url_direta, timeout=5, headers=headers, allow_redirects=True)
                    ct = r.headers.get('content-type', '')
                    if r.status_code == 200 and 'image' in ct:
                        return url_direta
                except Exception:
                    pass

        return None
    except Exception as e:
        print(f"[TURBO] Erro _buscar_imagem_produto_ia: {e}")
        return None


@api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])  # TEMPORARIAMENTE DESATIVADO PARA DEBUG
def cadastro_turbo_produto(request):
    """
    Busca dados do produto via código EAN em APIs externas
    
    GET /api/produtos/cadastro-turbo/?ean=7896434921478
    POST /api/produtos/cadastro-turbo/
    Body: {"ean": "7896434921478"}
    
    Returns:
        {
            "sucesso": true,
            "produto_existente": false,
            "dados": {
                "gtin": "7896434921478",
                "nome_produto": "Creme de Avelã...",
                "descricao": "...",
                "imagem_url_externa": "...",
                "marca": "Nutrella",
                "ncm": "18063200",
                "categoria_sugerida": "Mercearia Doce"
            },
            "fonte": "COSMOS",
            "mensagem": "Produto encontrado"
        }
    """
    print("=" * 80)
    print(f"[CADASTRO TURBO] View chamada! Método: {request.method}")
    print(f"[CADASTRO TURBO] GET params: {request.GET}")
    print(f"[CADASTRO TURBO] POST data: {request.data if hasattr(request, 'data') else 'N/A'}")
    print("=" * 80)
    logger.info(f"[CADASTRO TURBO] Requisição recebida - Método: {request.method}")
    
    # Suporta tanto GET (?ean=...) quanto POST (body)
    ean = request.GET.get('ean') or request.data.get('ean', '')
    ean = str(ean).strip()

    # Dados do XML passados pelo frontend (evita chamadas às APIs externas)
    xml_nome = request.GET.get('xml_nome', '').strip()
    xml_ncm  = request.GET.get('xml_ncm', '').strip()
    xml_unidade = request.GET.get('xml_unidade', 'UN').strip() or 'UN'

    print(f"[CADASTRO TURBO] EAN extraído: '{ean}' | xml_nome: '{xml_nome}'")

    if not ean:
        return Response({
            'sucesso': False,
            'mensagem': 'EAN não informado'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Verifica se já existe no banco local
    produto_existente = Produto.objects.filter(gtin=ean).first()
    if produto_existente:
        # Retorna dados diretamente do banco sem chamar APIs externas
        serializer = ProdutoSerializer(produto_existente)
        dados_produto = serializer.data
        dados_produto['imagem_url_externa'] = dados_produto.get('imagem_url', '')

        return Response({
            'sucesso': True,
            'produto_existente': True,
            'dados': dados_produto,
            'mensagem': f'Produto já cadastrado: {produto_existente.nome_produto}',
            'fonte': 'BANCO'
        })
    
    # ─── ATALHO: dados completos do XML já disponíveis → pula APIs externas ────
    if xml_nome:
        logger.info(f"[CADASTRO TURBO] XML mode: retornando dados do XML sem chamar APIs externas")
        response_data = {
            'sucesso': True,
            'produto_existente': False,
            'dados': {
                'gtin': ean,
                'nome_produto': xml_nome,
                'descricao': xml_nome,
                'marca': '',
                'ncm': xml_ncm,
                'unidade_medida': xml_unidade,
                'peso_unitario': 0,
                'imagem_url_externa': '',
                'categoria_sugerida': '',
                'categoria_mercadologica_id': None,
                'preco_venda': 0.0,
                'preco_custo': 0.0,
                'classificacao': '',
                'categoria': '',
                'id_grupo': None,
            },
            'fonte': 'XML',
            'is_generic': False,
            'mensagem': 'Dados carregados do XML da nota fiscal.',
            'cache_hit': False,
        }
        # Busca imagem em background (não bloqueia)
        try:
            import threading, uuid
            job_id = str(uuid.uuid4())
            response_data['imagem_job_id'] = job_id
            def _bg():
                try:
                    img = _buscar_imagem_produto_ia(xml_nome, ean)
                    if img:
                        from django.core.cache import cache
                        cache.set(f'imagem_job_{job_id}', img, timeout=120)
                except Exception as e:
                    print(f"[TURBO BG XML] Erro thread imagem: {e}")
            threading.Thread(target=_bg, daemon=True).start()
        except Exception:
            pass
        return Response(response_data)
    # ────────────────────────────────────────────────────────────────────────────

    # Busca na API externa
    service = ProdutoEANService()
    resultado = service.buscar_produto_por_ean(ean)
    
    if not resultado['sucesso']:
        return Response({
            'sucesso': False,
            'mensagem': resultado['mensagem'],
            'fonte': resultado.get('fonte', 'DESCONHECIDO')
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Prepara dados para o frontend
    dados_produto = resultado['dados']
    
    # Tenta encontrar categoria similar
    categoria_id = None
    if dados_produto.get('categoria_sugerida'):
        categoria = CategoriaMercadologica.objects.filter(
            nome__icontains=dados_produto['categoria_sugerida'].split('>')[0],
            nivel=3
        ).first()
        if categoria:
            categoria_id = categoria.id_categoria
    
    is_generic = resultado.get('is_generic', False)
    
    response_data = {
        'sucesso': True,
        'produto_existente': False,
        'dados': {
            'gtin': dados_produto['ean'],
            'nome_produto': dados_produto['nome'],
            'descricao': dados_produto.get('descricao', ''),
            'marca': dados_produto.get('marca', ''),
            'ncm': dados_produto.get('ncm', ''),
            'unidade_medida': dados_produto.get('unidade', 'UN'),
            'peso_unitario': dados_produto.get('peso', 0),
            'imagem_url_externa': dados_produto.get('imagem_url', ''),
            'categoria_sugerida': dados_produto.get('categoria_sugerida', ''),
            'categoria_mercadologica_id': categoria_id,
            'preco_venda': dados_produto.get('preco_sugerido', 0.0), # Sugere o preço se vier da API
            'preco_custo': 0.0,
            'classificacao': dados_produto.get('classificacao', ''),
            'categoria': dados_produto.get('categoria', ''),
            'id_grupo': None,
        },
        'fonte': resultado['fonte'],
        # is_generic: frontend deve exibir aviso e focar o campo nome para preenchimento manual
        'is_generic': is_generic,
        'mensagem': resultado.get('mensagem', 'Dados obtidos com sucesso! Confira e salve.'),
        'cache_hit': resultado.get('cache_hit', False)
    }
    
    # Se não veio imagem do Cosmos, lança busca IA em background (não bloqueia)
    img_valor = response_data['dados'].get('imagem_url_externa')
    # Usa nome do produto ou nome sugerido pelo frontend (para produtos genéricos com nome do XML)
    nome_para_imagem = dados_produto.get('nome') or request.GET.get('nome_sugerido', '').strip()
    if not img_valor and nome_para_imagem:
        try:
            import threading
            import uuid

            job_id = str(uuid.uuid4())
            response_data['imagem_job_id'] = job_id  # Frontend pode usar para polling futuro

            def buscar_imagem_bg():
                try:
                    img = _buscar_imagem_produto_ia(nome_para_imagem, ean)
                    if img:
                        # Armazena no cache de sessão Django para o polling
                        from django.core.cache import cache
                        cache.set(f'imagem_job_{job_id}', img, timeout=120)
                        print(f"[TURBO BG] Imagem encontrada: {img[:80]}...")
                except Exception as e:
                    print(f"[TURBO BG] Erro thread imagem IA: {e}")

            thread = threading.Thread(target=buscar_imagem_bg, daemon=True)
            thread.start()
            print(f"[TURBO] Busca de imagem lançada em background (job {job_id[:8]})")
        except Exception as e:
            print(f"[TURBO] Erro ao lançar thread imagem: {e}")

    return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def imagem_job_status(request):
    """Retorna a imagem quando a busca IA em background terminar.
    GET /api/produtos/imagem-job/?job_id=<uuid>
    """
    job_id = request.GET.get('job_id', '')
    if not job_id:
        return Response({'ready': False})
    from django.core.cache import cache
    img = cache.get(f'imagem_job_{job_id}')
    if img:
        cache.delete(f'imagem_job_{job_id}')
        return Response({'ready': True, 'imagem_url': img})
    return Response({'ready': False})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salvar_produto_turbo(request):
    """
    Salva produto após conferência do usuário
    
    POST /api/produtos/salvar-turbo/
    Body: {
        "gtin": "...",
        "nome_produto": "...",
        "codigo_produto": "AUTO" (opcional),
        ...
    }
    """
    from .models import ConfiguracaoProduto, TributacaoProduto

    dados = request.data.copy()

    # ------------------------------------------------------------------
    # Código do produto: respeita a configuração da aba "configurações produto"
    # ------------------------------------------------------------------
    config, _ = ConfiguracaoProduto.objects.get_or_create(
        id_config=1,
        defaults={'tipo_geracao_codigo': 'manual', 'proximo_codigo': 1, 'tamanho_codigo': 6}
    )
    tipo_codigo = str(config.tipo_geracao_codigo).strip().lower()

    codigo_enviado = (dados.get('codigo_produto') or '').strip()
    gtin_enviado = (dados.get('gtin') or '').strip()

    # Apenas define o código se for criação (id_produto ausente) ou se o código foi explicitamente marcado como AUTO
    eh_novo_produto = not dados.get('id_produto') and not Produto.objects.filter(gtin=gtin_enviado).exists() if gtin_enviado else not dados.get('id_produto')

    if eh_novo_produto:
        if tipo_codigo == 'manual':
            # Manual: usa GTIN como código (se disponível), senão mantém o que veio
            if not codigo_enviado or codigo_enviado == 'AUTO':
                dados['codigo_produto'] = gtin_enviado if gtin_enviado else f"TRB{Produto.objects.count() + 1:06d}"
        else:
            # Automática ou semi-automática: gera pelo padrão do sistema
            dados['codigo_produto'] = config.gerar_proximo_codigo()
            config.incrementar_codigo()

    # Extrai dados da API para salvar separadamente
    fonte_api = dados.pop('fonte_api', 'COSMOS')
    imagem_url_externa = dados.pop('imagem_url_externa', None)
    imagem_job_id = dados.pop('imagem_job_id', None)

    # IMPORTANTE: Copia imagem_url_externa para o campo imagem_url do produto, se não houver
    if imagem_url_externa and not dados.get('imagem_url'):
        dados['imagem_url'] = imagem_url_externa
        print(f"[TURBO] Copiando imagem_url_externa para imagem_url: {imagem_url_externa[:50]}...")

    # Se ainda sem imagem, verifica se o polling em background já encontrou uma
    if not dados.get('imagem_url') and imagem_job_id:
        from django.core.cache import cache
        cached_img = cache.get(f'imagem_job_{imagem_job_id}')
        if cached_img:
            dados['imagem_url'] = cached_img
            if not imagem_url_externa:
                imagem_url_externa = cached_img
            print(f"[TURBO] Imagem recuperada do cache do job: {cached_img[:50]}...")

    if dados.get('imagem_url'):
        print(f"[TURBO] Salvando produto com imagem: {dados['imagem_url'][:50]}...")
    else:
        print("[TURBO] ATENÇÃO: Salvando produto SEM IMAGEM!")

    dados_completos_json = dados.pop('dados_completos_json', None)
    categoria_sugerida = dados.pop('categoria_sugerida', None)
    
    # Remove campos que não existem no modelo Produto (usados apenas no frontend)
    dados.pop('categoria_mercadologica_id', None)
    dados.pop('confianca_ia', None)

    # Extrai novos campos de preço para salvar no estoque
    preco_venda = dados.pop('preco_venda', 0)
    preco_custo = dados.pop('preco_custo', 0)

    # ------------------------------------------------------------------
    # NCM: extrai antes do serializer e salva diretamente no modelo.
    # Isso evita que a validação IBPT (banco local de NCMs) bloqueie o
    # salvamento quando o NCM da API do EAN não está na tabela local.
    # ------------------------------------------------------------------
    ncm_para_salvar = None
    ncm_raw = dados.pop('ncm', None)
    if ncm_raw:
        ncm_digits = ''.join(filter(str.isdigit, str(ncm_raw)))
        if len(ncm_digits) == 8:
            ncm_para_salvar = ncm_digits
        else:
            logger.warning(f"[TURBO] NCM '{ncm_raw}' com formato inválido ignorado.")

    # Garante classificacao padrão se não informada ou se for dict (objeto da IA, não fiscal)
    classificacao_val = dados.get('classificacao')
    if not classificacao_val or isinstance(classificacao_val, dict):
        dados['classificacao'] = '00'  # Padrão: Mercadoria para Revenda
    
    # IMPORTANTE: Verifica se é UPDATE ou CREATE
    id_produto = dados.get('id_produto')
    gtin = dados.get('gtin')
    instance = None

    if id_produto:
        instance = Produto.objects.filter(id_produto=id_produto).first()
        if instance:
            print(f"[TURBO] Modo UPDATE: Produto ID {id_produto} encontrado.")
    elif gtin:
        instance = Produto.objects.filter(gtin=gtin).first()
        if instance:
            print(f"[TURBO] Modo UPDATE: Produto GTIN {gtin} encontrado.")

    try:
        with transaction.atomic():
            # Salva produto principal
            if instance:
                # Para update, remover codigo_produto se não mudou para evitar erro de unique
                if dados.get('codigo_produto') == instance.codigo_produto:
                    dados.pop('codigo_produto', None)
                # Remover id_produto pois não deve ser alterado
                dados.pop('id_produto', None)
                
                serializer = ProdutoSerializer(instance, data=dados, partial=True)
                msg_action = "atualizado"
            else:
                serializer = ProdutoSerializer(data=dados)
                msg_action = "cadastrado"
            
            if not serializer.is_valid():
                return Response({
                    'sucesso': False,
                    'erros': serializer.errors,
                    'mensagem': 'Dados inválidos'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            produto = serializer.save()

            # Salva NCM diretamente no modelo (bypass da validação IBPT do serializer)
            if ncm_para_salvar:
                Produto.objects.filter(pk=produto.pk).update(ncm=ncm_para_salvar)
                produto.ncm = ncm_para_salvar
                print(f"[TURBO] NCM '{ncm_para_salvar}' salvo no produto {produto.id_produto}")

            # ------------------------------------------------------------------
            # Cria/atualiza TributacaoProduto com defaults da ConfiguracaoProduto
            # ------------------------------------------------------------------
            try:
                TributacaoProduto.objects.update_or_create(
                    produto=produto,
                    defaults={
                        'cfop': config.trib_cfop or '5102',
                        'cst_icms': config.trib_cst_icms or '',
                        'csosn': config.trib_csosn or '400',
                        'icms_aliquota': config.trib_icms_aliquota or 0,
                        'cst_ipi': config.trib_cst_ipi or '99',
                        'ipi_aliquota': config.trib_ipi_aliquota or 0,
                        'cst_pis_cofins': config.trib_cst_pis_cofins or '07',
                        'pis_aliquota': config.trib_pis_aliquota or 0,
                        'cofins_aliquota': config.trib_cofins_aliquota or 0,
                        'classificacao_fiscal': config.trib_classificacao_fiscal or '',
                        # IBS/CBS: zero por padrão (Reforma Tributária 2026)
                        'ibs_aliquota': 0,
                        'cbs_aliquota': 0,
                        'cst_ibs_cbs': '01',
                    }
                )
                print(f"[TURBO] Tributação criada/atualizada para produto {produto.id_produto} (CFOP {config.trib_cfop})")
            except Exception as e:
                logger.warning(f"[TURBO] Erro ao criar tributação para produto {produto.id_produto}: {e}")

            # Atualiza preços no estoque (criado automaticamente pelo signal/serializer)
            from api.models import Estoque
            try:
                # Atualiza todos os estoques deste produto com os preços informados
                Estoque.objects.filter(id_produto=produto).update(
                    valor_venda=preco_venda,
                    custo_medio=preco_custo,
                    valor_ultima_compra=preco_custo
                )
            except Exception as e:
                logger.warning(f"Erro ao atualizar preços no estoque para produto {produto.id_produto}: {e}")
            
            # Salva ou Atualiza informações da API separadamente
            InformacaoProdutoAPI.objects.update_or_create(
                produto=produto,
                defaults={
                    'fonte_api': fonte_api,
                    'imagem_url_externa': imagem_url_externa,
                    'dados_completos_json': dados_completos_json,
                    'categoria_sugerida': categoria_sugerida,
                    'usuario_sincronizacao': request.user,
                    'confianca_dados': 0.95
                }
            )
            
            # Log de auditoria
            logger.info(
                f"Produto {produto.codigo_produto} ({produto.gtin}) "
                f"{msg_action} via Turbo EAN por {request.user.username} "
                f"usando fonte {fonte_api}"
            )
            
            return Response({
                'sucesso': True,
                'produto': ProdutoSerializer(produto).data,
                'mensagem': f'Produto {msg_action} com sucesso! Código: {produto.codigo_produto}'
            }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Erro ao salvar produto turbo: {e}")
        return Response({
            'sucesso': False,
            'mensagem': f'Erro ao salvar: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def classificar_produto_ia(request):
    """
    Classifica produto na árvore mercadológica usando IA
    
    POST /api/produtos/classificar-ia/
    Body: {
        "nome": "Creme de Avelã Triângulo 170g",
        "descricao": "Creme de avelã com cacau..."
    }
    
    Returns:
        {
            "sucesso": true,
            "subcategoria_id": 123,
            "caminho": "Mercearia Doce > Culinária > Recheios",
            "confianca": 0.95
        }
    """
    from api.services.classificador_ia_service import ClassificadorIAService
    
    nome = request.data.get('nome', '').strip()
    descricao = request.data.get('descricao', '').strip()
    produto_id = request.data.get('produto_id')
    
    if not nome:
        return Response({
            'sucesso': False,
            'mensagem': 'Nome do produto não informado'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        service = ClassificadorIAService()

        # Verifica se Gemini está disponível antes de tentar
        if not service.ai.is_available():
            return Response({
                'sucesso': False,
                'mensagem': 'Classificação IA indisponível: configure GEMINI_API_KEY no .env'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Executa com timeout para não travar o servidor
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(service.classificar_produto, nome, descricao, produto_id, request.user)
            try:
                resultado = future.result(timeout=15)
            except concurrent.futures.TimeoutError:
                logger.warning(f"Timeout na classificação IA para: {nome[:50]}")
                return Response({
                    'sucesso': False,
                    'mensagem': 'Classificação IA demorou demais (timeout 15s). Selecione a categoria manualmente.'
                }, status=status.HTTP_504_GATEWAY_TIMEOUT)

        return Response(resultado)

    except Exception as e:
        logger.error(f"Erro na classificação IA: {e}")
        return Response({
            'sucesso': False,
            'mensagem': f'Erro no serviço de classificação: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pesquisar_precos_regiao(request):
    """
    Pesquisa preços de concorrentes em um raio geográfico
    
    GET /api/produtos/precos-regiao/?ean=7896434921478&raio=5
    
    Returns:
        {
            "sucesso": true,
            "precos": [...],
            "estatisticas": {
                "minimo": 12.90,
                "maximo": 15.00,
                "media": 13.47,
                "moda": 12.90,
                "total_amostras": 15
            }
        }
    """
    from api.services.precos_regionais_service import PrecosRegionaisService
    
    ean = request.query_params.get('ean')
    raio = int(request.query_params.get('raio', 5))
    nome_sugerido = request.query_params.get('nome', '').strip()
    unidade_medida = request.query_params.get('unidade', 'UN').strip().upper()
    
    if not ean:
        return Response({
            'sucesso': False,
            'mensagem': 'EAN não informado'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Pega empresa do usuário logado
    # TODO: Ajustar conforme modelo de empresa/filial do sistema
    empresa_id = 1  # request.user.empresa_id if hasattr(request.user, 'empresa_id') else 1
    
    try:
        service = PrecosRegionaisService()
        resultado = service.pesquisar_precos(ean, empresa_id, raio, nome_sugerido=nome_sugerido, unidade_medida=unidade_medida)
        
        return Response(resultado)
    
    except Exception as e:
        logger.error(f"Erro ao pesquisar preços regionais: {e}")
        return Response({
            'sucesso': False,
            'mensagem': f'Erro no serviço: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_categorias_mercadologicas(request):
    """
    Lista hierarquia completa de categorias mercadológicas
    
    GET /api/categorias-mercadologicas/?nivel=3
    """
    nivel = request.GET.get('nivel')
    
    query = CategoriaMercadologica.objects.filter(ativo=True)
    
    if nivel:
        query = query.filter(nivel=int(nivel))
    
    categorias = []
    for cat in query:
        categorias.append({
            'id': cat.id_categoria,
            'nome': cat.nome,
            'caminho_completo': cat.get_caminho_completo(),
            'nivel': cat.nivel,
            'pai_id': cat.pai_id if cat.pai else None
        })
    
    return Response({
        'sucesso': True,
        'categorias': categorias,
        'total': len(categorias)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invalidar_cache_ean(request):
    """
    Invalida cache de um produto EAN específico
    Útil quando dados da API foram atualizados
    
    POST /api/produtos/invalidar-cache-ean/
    Body: {"ean": "7896434921478"}
    """
    ean = request.data.get('ean', '').strip()
    
    if not ean:
        return Response({
            'sucesso': False,
            'mensagem': 'EAN não informado'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    service = ProdutoEANService()
    service.invalidar_cache(ean)
    
    return Response({
        'sucesso': True,
        'mensagem': f'Cache invalidado para EAN {ean}'
    })
