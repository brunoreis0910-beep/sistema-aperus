"""
Views para importação de XML de NF-e.
Arquivo recriado após deleção acidental.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import xml.etree.ElementTree as ET
import re


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def importar_xml_view(request):
    """
    Importa dados de um arquivo XML de NF-e.
    Extrai informações de produtos, fornecedor, etc.
    """
    try:
        xml_file = request.FILES.get('xml_file')
        if not xml_file:
            return Response(
                {'error': 'Nenhum arquivo XML enviado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ler conteúdo do XML
        xml_content = xml_file.read().decode('utf-8')
        
        # Parse do XML
        root = ET.fromstring(xml_content)
        
        # Namespace da NF-e
        ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
        
        # Extrair dados do emitente (fornecedor)
        emit = root.find('.//nfe:emit', ns)
        fornecedor = {}
        if emit is not None:
            fornecedor = {
                'cnpj': emit.findtext('nfe:CNPJ', '', ns),
                'nome': emit.findtext('nfe:xNome', '', ns),
                'nome_fantasia': emit.findtext('nfe:xFant', '', ns),
                'inscricao_estadual': emit.findtext('nfe:IE', '', ns),
            }
            
            # Endereço
            endereco = emit.find('nfe:enderEmit', ns)
            if endereco is not None:
                fornecedor.update({
                    'logradouro': endereco.findtext('nfe:xLgr', '', ns),
                    'numero': endereco.findtext('nfe:nro', '', ns),
                    'bairro': endereco.findtext('nfe:xBairro', '', ns),
                    'cidade': endereco.findtext('nfe:xMun', '', ns),
                    'uf': endereco.findtext('nfe:UF', '', ns),
                    'cep': endereco.findtext('nfe:CEP', '', ns),
                })
        
        # Extrair produtos
        produtos = []
        for det in root.findall('.//nfe:det', ns):
            prod = det.find('nfe:prod', ns)
            if prod is not None:
                produto = {
                    'codigo': prod.findtext('nfe:cProd', '', ns),
                    'ean': prod.findtext('nfe:cEAN', '', ns),
                    'nome': prod.findtext('nfe:xProd', '', ns),
                    'ncm': prod.findtext('nfe:NCM', '', ns),
                    'cfop': prod.findtext('nfe:CFOP', '', ns),
                    'unidade': prod.findtext('nfe:uCom', '', ns),
                    'quantidade': float(prod.findtext('nfe:qCom', '0', ns) or 0),
                    'valor_unitario': float(prod.findtext('nfe:vUnCom', '0', ns) or 0),
                    'valor_total': float(prod.findtext('nfe:vProd', '0', ns) or 0),
                }
                produtos.append(produto)
        
        # Extrair dados da nota
        ide = root.find('.//nfe:ide', ns)
        nota = {}
        if ide is not None:
            nota = {
                'numero': ide.findtext('nfe:nNF', '', ns),
                'serie': ide.findtext('nfe:serie', '', ns),
                'data_emissao': ide.findtext('nfe:dhEmi', '', ns),
                'natureza_operacao': ide.findtext('nfe:natOp', '', ns),
            }
        
        # Extrair totais
        total = root.find('.//nfe:total/nfe:ICMSTot', ns)
        totais = {}
        if total is not None:
            totais = {
                'valor_produtos': float(total.findtext('nfe:vProd', '0', ns) or 0),
                'valor_frete': float(total.findtext('nfe:vFrete', '0', ns) or 0),
                'valor_desconto': float(total.findtext('nfe:vDesc', '0', ns) or 0),
                'valor_total': float(total.findtext('nfe:vNF', '0', ns) or 0),
            }
        
        return Response({
            'success': True,
            'fornecedor': fornecedor,
            'produtos': produtos,
            'nota': nota,
            'totais': totais,
        })
        
    except ET.ParseError as e:
        return Response(
            {'error': f'Erro ao parsear XML: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Erro ao processar XML: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def preparar_produto_xml_para_cadastro_turbo(request):
    """
    Prepara dados de produto extraído de XML para o cadastro turbo.
    Recebe dados do produto e retorna formatado para o cadastro turbo.
    """
    try:
        dados = request.data
        
        # Extrair EAN/GTIN
        ean = dados.get('ean', '') or dados.get('gtin', '')
        
        # Limpar EAN (remover zeros à esquerda se necessário)
        if ean:
            ean = re.sub(r'^0+', '', ean) if ean.startswith('0000') else ean
        
        produto_preparado = {
            'gtin': ean,
            'nome_produto': dados.get('nome', ''),
            'ncm': dados.get('ncm', ''),
            'unidade_medida': dados.get('unidade', 'UN'),
            'preco_custo': dados.get('valor_unitario', 0),
            'origem_xml': True,
        }
        
        return Response({
            'success': True,
            'produto': produto_preparado,
        })
        
    except Exception as e:
        return Response(
            {'error': f'Erro ao preparar produto: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
