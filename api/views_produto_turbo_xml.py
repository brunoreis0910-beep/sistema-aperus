"""
View para importação de XML de NFe durante o cadastro turbo de produtos
Permite extrair automaticamente dados de produtos de notas fiscais de compra
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import xml.etree.ElementTree as ET
from datetime import datetime
from decimal import Decimal
import base64
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cadastro_turbo_importar_xml(request):
    """
    Importa XML de NFe e extrai dados de produtos para cadastro turbo
    
    POST /api/produtos/cadastro-turbo/importar-xml/
    Body (form-data):
        xml_file: arquivo XML da NFe
    
    OU Body (JSON):
        xml_base64: string base64 do XML
        
    Returns:
        {
            "sucesso": true,
            "produtos": [
                {
                    "codigo_produto": "1234",
                    "nome_produto": "DIPIRONA 500MG",
                    "gtin": "7896658012345",
                    "quantidade": "10.00",
                    "valor_unitario": "5.50",
                    "ncm": "30049099",
                    "unidade_medida": "UN",
                    
                    # Dados de medicamento (se houver)
                    "codigo_anvisa": "123456789012",
                    "lote": "L123456",
                    "data_fabricacao": "2024-01-15",
                    "data_validade": "2026-01-15",
                    
                    # Dados fiscais
                    "cfop": "5102",
                    "cst_icms": "00",
                    "aliquota_icms": "18.00"
                }
            ],
            "fornecedor": {
                "cnpj": "12345678000199",
                "razao_social": "FORNECEDOR TESTE LTDA",
                "nome_fantasia": "FORNECEDOR TESTE"
            },
            "nfe": {
                "numero": "000123",
                "serie": "1",
                "chave": "12345678901234567890123456789012345678901234",
                "data_emissao": "2024-03-15"
            }
        }
    """
    
    try:
        # Lê o XML do arquivo enviado ou base64
        xml_content = None
        
        if 'xml_file' in request.FILES:
            xml_file = request.FILES['xml_file']
            xml_content = xml_file.read()
        elif 'xml_base64' in request.data:
            xml_base64 = request.data['xml_base64']
            xml_content = base64.b64decode(xml_base64)
        else:
            return Response({
                'sucesso': False,
                'mensagem': 'Nenhum arquivo XML enviado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse do XML
        try:
            root = ET.fromstring(xml_content)
        except ET.ParseError as e:
            return Response({
                'sucesso': False,
                'mensagem': f'Erro ao processar XML: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Namespace NFe
        ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
        
        # Extrai dados do fornecedor
        fornecedor_elem = root.find('.//nfe:emit', ns)
        fornecedor = {}
        if fornecedor_elem:
            cnpj_elem = fornecedor_elem.find('nfe:CNPJ', ns)
            razao_elem = fornecedor_elem.find('nfe:xNome', ns)
            fantasia_elem = fornecedor_elem.find('nfe:xFant', ns)
            
            fornecedor = {
                'cnpj': cnpj_elem.text if cnpj_elem is not None else '',
                'razao_social': razao_elem.text if razao_elem is not None else '',
                'nome_fantasia': fantasia_elem.text if fantasia_elem is not None else ''
            }
        
        # Extrai dados da NFe
        ide_elem = root.find('.//nfe:ide', ns)
        nfe_data = {}
        if ide_elem:
            numero_elem = ide_elem.find('nfe:nNF', ns)
            serie_elem = ide_elem.find('nfe:serie', ns)
            data_elem = ide_elem.find('nfe:dhEmi', ns)
            
            nfe_data = {
                'numero': numero_elem.text if numero_elem is not None else '',
                'serie': serie_elem.text if serie_elem is not None else '',
                'data_emissao': data_elem.text[:10] if data_elem is not None else ''
            }
        
        # Extrai chave de acesso
        chave_elem = root.find('.//nfe:infNFe', ns)
        if chave_elem is not None:
            chave_id = chave_elem.get('Id', '')
            nfe_data['chave'] = chave_id.replace('NFe', '') if chave_id else ''
        
        # Extrai produtos
        produtos = []
        det_elements = root.findall('.//nfe:det', ns)
        
        for det in det_elements:
            prod = det.find('nfe:prod', ns)
            if prod is None:
                continue
            
            # Dados básicos do produto
            codigo = prod.find('nfe:cProd', ns)
            nome = prod.find('nfe:xProd', ns)
            gtin = prod.find('nfe:cEAN', ns)
            ncm = prod.find('nfe:NCM', ns)
            unidade = prod.find('nfe:uCom', ns)
            quantidade = prod.find('nfe:qCom', ns)
            valor_unitario = prod.find('nfe:vUnCom', ns)
            
            produto_data = {
                'codigo_produto': codigo.text if codigo is not None else '',
                'nome_produto': nome.text if nome is not None else '',
                'gtin': gtin.text if gtin is not None and gtin.text != 'SEM GTIN' else '',
                'ncm': ncm.text if ncm is not None else '',
                'unidade_medida': unidade.text if unidade is not None else 'UN',
                'quantidade': quantidade.text if quantidade is not None else '0',
                'valor_unitario': valor_unitario.text if valor_unitario is not None else '0',
            }
            
            # Extrai dados de medicamento (tag <med>)
            med = prod.find('nfe:med', ns)
            if med is not None:
                codigo_anvisa = med.find('nfe:cProdANVISA', ns)
                if codigo_anvisa is not None:
                    produto_data['codigo_anvisa'] = codigo_anvisa.text
            
            # Extrai dados de rastreabilidade (tag <rastro>)
            rastro = prod.find('nfe:rastro', ns)
            if rastro is not None:
                numero_lote = rastro.find('nfe:nLote', ns)
                data_fab = rastro.find('nfe:dFab', ns)
                data_val = rastro.find('nfe:dVal', ns)
                
                if numero_lote is not None:
                    produto_data['lote'] = numero_lote.text
                if data_fab is not None:
                    try:
                        # Formato: YYYY-MM-DD
                        produto_data['data_fabricacao'] = data_fab.text
                    except:
                        pass
                if data_val is not None:
                    try:
                        produto_data['data_validade'] = data_val.text
                    except:
                        pass
            
            # Extrai dados fiscais
            imposto = det.find('nfe:imposto', ns)
            if imposto is not None:
                # ICMS
                icms = imposto.find('.//nfe:ICMS', ns)
                if icms is not None:
                    # Pode ser ICMS00, ICMS10, ICMS20, etc
                    for icms_child in icms:
                        orig = icms_child.find('nfe:orig', ns)
                        cst = icms_child.find('nfe:CST', ns)
                        csosn = icms_child.find('nfe:CSOSN', ns)
                        aliq = icms_child.find('nfe:pICMS', ns)
                        
                        if cst is not None:
                            produto_data['cst_icms'] = cst.text
                        if csosn is not None:
                            produto_data['csosn'] = csosn.text
                        if aliq is not None:
                            produto_data['aliquota_icms'] = aliq.text
                        break
                
                # PIS
                pis = imposto.find('.//nfe:PIS', ns)
                if pis is not None:
                    for pis_child in pis:
                        cst_pis = pis_child.find('nfe:CST', ns)
                        aliq_pis = pis_child.find('nfe:pPIS', ns)
                        
                        if cst_pis is not None:
                            produto_data['cst_pis'] = cst_pis.text
                        if aliq_pis is not None:
                            produto_data['aliquota_pis'] = aliq_pis.text
                        break
                
                # COFINS
                cofins = imposto.find('.//nfe:COFINS', ns)
                if cofins is not None:
                    for cofins_child in cofins:
                        cst_cofins = cofins_child.find('nfe:CST', ns)
                        aliq_cofins = cofins_child.find('nfe:pCOFINS', ns)
                        
                        if cst_cofins is not None:
                            produto_data['cst_cofins'] = cst_cofins.text
                        if aliq_cofins is not None:
                            produto_data['aliquota_cofins'] = aliq_cofins.text
                        break
            
            # Extrai CFOP
            cfop_elem = prod.find('nfe:CFOP', ns)
            if cfop_elem is not None:
                produto_data['cfop'] = cfop_elem.text
            
            produtos.append(produto_data)
        
        return Response({
            'sucesso': True,
            'produtos': produtos,
            'fornecedor': fornecedor,
            'nfe': nfe_data,
            'total_produtos': len(produtos),
            'mensagem': f'{len(produtos)} produto(s) extraído(s) com sucesso'
        })
        
    except Exception as e:
        logger.exception("Erro ao importar XML no cadastro turbo")
        return Response({
            'sucesso': False,
            'mensagem': f'Erro ao processar XML: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cadastro_turbo_importar_xml_e_salvar(request):
    """
    Importa XML e salva produtos automaticamente
    
    POST /api/produtos/cadastro-turbo/importar-xml-salvar/
    Body (form-data):
        xml_file: arquivo XML da NFe
        criar_fornecedor: true/false (opcional, default: false)
        atualizar_existentes: true/false (opcional, default: false)
        
    Returns:
        {
            "sucesso": true,
            "produtos_criados": 5,
            "produtos_atualizados": 2,
            "produtos_pulados": 1,
            "lotes_criados": 7,
            "detalhes": [...]
        }
    """
    from .models import Produto, Cliente, LoteProduto, ConfiguracaoProduto
    from django.db import transaction
    
    try:
        # Primeiro extrai os dados do XML
        response_extracao = cadastro_turbo_importar_xml(request)
        if response_extracao.status_code != 200:
            return response_extracao
        
        dados = response_extracao.data
        if not dados.get('sucesso'):
            return response_extracao
        
        produtos_xml = dados.get('produtos', [])
        nfe_info = dados.get('nfe', {})
        fornecedor_info = dados.get('fornecedor', {})
        
        # Opções
        criar_fornecedor = request.data.get('criar_fornecedor', 'false').lower() == 'true'
        atualizar_existentes = request.data.get('atualizar_existentes', 'false').lower() == 'true'

        # Grupo e categoria padrão (opcionais) — aplicados a todos os produtos do XML
        grupo_padrao_id = request.data.get('grupo_padrao_id') or None
        categoria_padrao = (request.data.get('categoria_padrao') or '').strip()

        # Resolve instância do grupo padrão uma única vez
        grupo_padrao_obj = None
        if grupo_padrao_id:
            try:
                from .models import GrupoProduto
                grupo_padrao_obj = GrupoProduto.objects.get(pk=int(grupo_padrao_id))
            except Exception:
                logger.warning(f"[XML Turbo] grupo_padrao_id={grupo_padrao_id} não encontrado, ignorando.")

        def _classificar_grupo_por_ia(nome_produto):
            """Tenta classificar o grupo via IA; retorna (GrupoProduto | None, str categoria)."""
            try:
                from .models import GrupoProduto as GP
                from .services.ai_service import ai_service
                resultado = ai_service.classificar_produto_mercado(nome_produto)
                if not resultado.get('sucesso'):
                    return None, ''
                sugestoes = resultado.get('sugestoes', {})
                grupo_sugerido = sugestoes.get('grupo_sugerido', '')
                categoria_ia = sugestoes.get('categoria_sugerida') or ''
                if grupo_sugerido:
                    grupo_obj = GP.objects.filter(
                        nome_grupo__iexact=grupo_sugerido
                    ).first()
                    if not grupo_obj:
                        grupo_obj = GP.objects.filter(
                            nome_grupo__icontains=grupo_sugerido
                        ).first()
                    if grupo_obj:
                        return grupo_obj, categoria_ia
                return None, categoria_ia
            except Exception as ex:
                logger.warning(f"[XML Turbo] IA classificação falhou para '{nome_produto}': {ex}")
                return None, ''

        # Contadores
        criados = 0
        atualizados = 0
        pulados = 0
        lotes_criados = 0
        detalhes = []
        
        # Obtém configuração de produtos
        config, _ = ConfiguracaoProduto.objects.get_or_create(
            id_config=1,
            defaults={'tipo_geracao_codigo': 'manual', 'proximo_codigo': 1}
        )
        
        # Processa cada produto
        with transaction.atomic():
            for prod_data in produtos_xml:
                try:
                    gtin = prod_data.get('gtin', '').strip()
                    codigo_fornecedor = prod_data.get('codigo_produto', '').strip()
                    nome = prod_data.get('nome_produto', '').strip()
                    
                    if not nome:
                        detalhes.append(f"❌ Produto sem nome pulado")
                        pulados += 1
                        continue
                    
                    # Procura produto existente por GTIN ou código
                    produto = None
                    if gtin:
                        produto = Produto.objects.filter(gtin=gtin).first()
                    
                    if not produto and codigo_fornecedor:
                        produto = Produto.objects.filter(codigo_produto=codigo_fornecedor).first()
                    
                    # Se existe e não deve atualizar, pula
                    if produto and not atualizar_existentes:
                        detalhes.append(f"⏭️ {nome} - já existe, pulado")
                        pulados += 1
                        continue
                    
                    # Cria ou atualiza produto
                    if not produto:
                        # Gera código do produto
                        if config.tipo_geracao_codigo == 'automatica':
                            codigo_produto = config.gerar_proximo_codigo()
                            config.incrementar_codigo()
                        else:
                            codigo_produto = gtin or codigo_fornecedor or f"XML{Produto.objects.count() + 1:06d}"
                        
                        produto = Produto(codigo_produto=codigo_produto)
                        criados += 1
                        acao = "criado"
                    else:
                        atualizados += 1
                        acao = "atualizado"
                    
                    # Atualiza dados
                    produto.nome_produto = nome
                    if gtin:
                        produto.gtin = gtin
                    if prod_data.get('ncm'):
                        produto.ncm = prod_data['ncm']
                    if prod_data.get('unidade_medida'):
                        produto.unidade_medida = prod_data['unidade_medida']

                    # --- Grupo (id_grupo) ---
                    # Prioridade: 1) já tem grupo  2) grupo padrão do request  3) IA
                    if not produto.id_grupo_id:
                        if grupo_padrao_obj:
                            produto.id_grupo = grupo_padrao_obj
                        else:
                            grupo_ia, categoria_ia = _classificar_grupo_por_ia(nome)
                            if grupo_ia:
                                produto.id_grupo = grupo_ia
                                if not produto.categoria and categoria_ia:
                                    produto.categoria = categoria_ia[:100]

                    # --- Categoria (texto) ---
                    if not produto.categoria:
                        if categoria_padrao:
                            produto.categoria = categoria_padrao[:100]

                    # Se tem rastreabilidade, marca controla_lote
                    if prod_data.get('lote'):
                        produto.controla_lote = True
                    
                    produto.save()
                    
                    # Cria lote se houver dados de rastreabilidade
                    if prod_data.get('lote'):
                        lote_data = {
                            'id_produto': produto,
                            'numero_lote': prod_data['lote'],
                            'quantidade': Decimal(prod_data.get('quantidade', '0'))
                        }
                        
                        if prod_data.get('data_fabricacao'):
                            try:
                                lote_data['data_fabricacao'] = datetime.strptime(
                                    prod_data['data_fabricacao'], '%Y-%m-%d'
                                ).date()
                            except:
                                pass
                        
                        if prod_data.get('data_validade'):
                            try:
                                lote_data['data_validade'] = datetime.strptime(
                                    prod_data['data_validade'], '%Y-%m-%d'
                                ).date()
                            except:
                                pass
                        
                        lote, lote_criado = LoteProduto.objects.get_or_create(
                            id_produto=produto,
                            numero_lote=prod_data['lote'],
                            defaults=lote_data
                        )
                        
                        if not lote_criado:
                            # Atualiza quantidade
                            lote.quantidade += Decimal(prod_data.get('quantidade', '0'))
                            lote.save()
                        
                        lotes_criados += 1 if lote_criado else 0
                    
                    detalhes.append(f"✅ {nome} - {acao}")
                    
                except Exception as e:
                    logger.exception(f"Erro ao processar produto: {prod_data.get('nome_produto')}")
                    detalhes.append(f"❌ {prod_data.get('nome_produto', 'desconhecido')} - erro: {str(e)}")
                    pulados += 1
        
        return Response({
            'sucesso': True,
            'produtos_criados': criados,
            'produtos_atualizados': atualizados,
            'produtos_pulados': pulados,
            'lotes_criados': lotes_criados,
            'detalhes': detalhes,
            'nfe': nfe_info,
            'fornecedor': fornecedor_info,
            'mensagem': f'Processamento concluído: {criados} criados, {atualizados} atualizados, {pulados} pulados'
        })
        
    except Exception as e:
        logger.exception("Erro ao importar e salvar produtos do XML")
        return Response({
            'sucesso': False,
            'mensagem': f'Erro ao processar: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
