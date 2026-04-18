from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import LayoutEtiqueta, ImpressaoEtiqueta
from .serializers import LayoutEtiquetaSerializer, ImpressaoEtiquetaSerializer
from api.models import Produto
from .printer_service import PrinterManager


class LayoutEtiquetaViewSet(viewsets.ModelViewSet):
    queryset = LayoutEtiqueta.objects.all()
    serializer_class = LayoutEtiquetaSerializer
    
    def perform_create(self, serializer):
        serializer.save(usuario_criacao=self.request.user)
    
    @action(detail=False, methods=['get'])
    def campos_disponiveis(self, request):
        """Retorna todos os campos disponíveis do modelo Produto e Cliente"""
        campos = [
            # Campos de Produto
            {'id': 'codigo_produto', 'label': 'Código do Produto', 'tipo': 'text', 'categoria': 'produto'},
            {'id': 'codigo_barras', 'label': 'Código de Barras', 'tipo': 'barcode', 'categoria': 'produto'},
            {'id': 'nome_produto', 'label': 'Nome do Produto', 'tipo': 'text', 'categoria': 'produto'},
            {'id': 'descricao', 'label': 'Descrição', 'tipo': 'text', 'categoria': 'produto'},
            {'id': 'marca', 'label': 'Marca', 'tipo': 'text', 'categoria': 'produto'},
            {'id': 'modelo', 'label': 'Modelo', 'tipo': 'text', 'categoria': 'produto'},
            {'id': 'cor', 'label': 'Cor', 'tipo': 'text', 'categoria': 'produto'},
            {'id': 'tamanho', 'label': 'Tamanho', 'tipo': 'text', 'categoria': 'produto'},
            {'id': 'unidade', 'label': 'Unidade', 'tipo': 'text', 'categoria': 'produto'},
            {'id': 'estoque_minimo', 'label': 'Estoque Mínimo', 'tipo': 'number', 'categoria': 'produto'},
            {'id': 'estoque_maximo', 'label': 'Estoque Máximo', 'tipo': 'number', 'categoria': 'produto'},
            {'id': 'localizacao', 'label': 'Localização', 'tipo': 'text', 'categoria': 'produto'},
            {'id': 'ncm', 'label': 'NCM', 'tipo': 'text', 'categoria': 'produto'},
            {'id': 'valor_venda', 'label': 'Valor de Venda', 'tipo': 'currency', 'categoria': 'produto'},
            {'id': 'custo_medio', 'label': 'Custo Médio', 'tipo': 'currency', 'categoria': 'produto'},
            {'id': 'margem_lucro', 'label': 'Margem de Lucro (%)', 'tipo': 'number', 'categoria': 'produto'},
            # Campos de Cliente
            {'id': 'cliente_nome', 'label': 'Nome do Cliente', 'tipo': 'text', 'categoria': 'cliente'},
            {'id': 'cliente_cpf_cnpj', 'label': 'CPF/CNPJ', 'tipo': 'text', 'categoria': 'cliente'},
            {'id': 'cliente_telefone', 'label': 'Telefone', 'tipo': 'text', 'categoria': 'cliente'},
            {'id': 'cliente_whatsapp', 'label': 'WhatsApp', 'tipo': 'text', 'categoria': 'cliente'},
            {'id': 'cliente_email', 'label': 'E-mail', 'tipo': 'text', 'categoria': 'cliente'},
            {'id': 'cliente_endereco', 'label': 'Endereço Completo', 'tipo': 'text', 'categoria': 'cliente'},
            {'id': 'cliente_cidade', 'label': 'Cidade', 'tipo': 'text', 'categoria': 'cliente'},
            {'id': 'cliente_estado', 'label': 'Estado', 'tipo': 'text', 'categoria': 'cliente'},
            {'id': 'cliente_cep', 'label': 'CEP', 'tipo': 'text', 'categoria': 'cliente'},
        ]
        return Response(campos)


class ImpressaoEtiquetaViewSet(viewsets.ModelViewSet):
    queryset = ImpressaoEtiqueta.objects.all()
    serializer_class = ImpressaoEtiquetaSerializer
    
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)
    
    @action(detail=False, methods=['get'])
    def buscar_cliente(self, request):
        """Busca dados do cliente pelo ID"""
        cliente_id = request.query_params.get('id')
        if not cliente_id:
            return Response({'error': 'ID do cliente não informado'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from api.models import Cliente
            cliente = Cliente.objects.get(id_cliente=cliente_id)
            dados_cliente = {
                'id_cliente': cliente.id_cliente,
                'nome_razao_social': cliente.nome_razao_social,
                'cpf_cnpj': cliente.cpf_cnpj,
                'telefone': cliente.telefone or '',
                'whatsapp': cliente.whatsapp or '',
                'email': cliente.email or '',
                'endereco': cliente.endereco or '',
                'numero': cliente.numero or '',
                'bairro': cliente.bairro or '',
                'cidade': cliente.cidade or '',
                'estado': cliente.estado or '',
                'cep': cliente.cep or '',
                'endereco_completo': f"{cliente.endereco or ''}, {cliente.numero or ''} - {cliente.bairro or ''}".strip(' -,'),
            }
            return Response(dados_cliente)
        except Cliente.DoesNotExist:
            return Response({'error': 'Cliente não encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def imprimir_produto(self, request):
        """
        Imprime etiqueta de produto em impressora Zebra ou Elgin
        
        Payload:
        {
            "produto_id": 123,
            "layout_id": 1,
            "tipo_impressora": "zebra" ou "elgin",
            "ip_impressora": "192.168.1.100" (opcional),
            "quantidade": 1
        }
        """
        try:
            produto_id = request.data.get('produto_id')
            layout_id = request.data.get('layout_id')
            tipo_impressora = request.data.get('tipo_impressora', 'zebra')
            ip_impressora = request.data.get('ip_impressora')
            quantidade = int(request.data.get('quantidade', 1))
            
            if not produto_id or not layout_id:
                return Response({
                    'error': 'produto_id e layout_id são obrigatórios'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Buscar produto
            produto = Produto.objects.get(id_produto=produto_id)
            produto_dict = {
                'codigo_produto': produto.codigo_produto,
                'codigo_barras': produto.codigo_barras or '',
                'nome_produto': produto.nome_produto,
                'descricao': produto.descricao or '',
                'marca': produto.marca or '',
                'modelo': produto.modelo or '',
                'cor': produto.cor or '',
                'tamanho': produto.tamanho or '',
                'unidade': produto.unidade or 'UN',
                'localizacao': produto.localizacao or '',
                'valor_venda': float(produto.valor_venda) if produto.valor_venda else 0,
                'custo_medio': float(produto.custo_medio) if produto.custo_medio else 0,
            }
            
            # Buscar layout
            layout = LayoutEtiqueta.objects.get(id=layout_id)
            layout_dict = {
                'largura_etiqueta': float(layout.largura_etiqueta),
                'altura_etiqueta': float(layout.altura_etiqueta),
                'campos_visiveis': layout.campos_visiveis,
            }
            
            # Gerar e imprimir etiqueta
            resultado = PrinterManager.imprimir_etiqueta(
                produto=produto_dict,
                layout=layout_dict,
                tipo_impressora=tipo_impressora,
                ip_impressora=ip_impressora,
                quantidade=quantidade
            )
            
            # Registrar impressão
            if resultado['sucesso']:
                ImpressaoEtiqueta.objects.create(
                    layout=layout,
                    produtos={'produtos': [{'id': produto_id, 'quantidade': quantidade}]},
                    quantidade_total=quantidade,
                    usuario=request.user
                )
            
            return Response(resultado)
            
        except Produto.DoesNotExist:
            return Response({'error': 'Produto não encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except LayoutEtiqueta.DoesNotExist:
            return Response({'error': 'Layout não encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def imprimir_cliente(self, request):
        """
        Imprime etiqueta de endereço de cliente
        
        Payload:
        {
            "cliente_id": 123,
            "layout_id": 1,
            "tipo_impressora": "zebra",
            "ip_impressora": "192.168.1.100" (opcional),
            "quantidade": 1
        }
        """
        try:
            cliente_id = request.data.get('cliente_id')
            layout_id = request.data.get('layout_id')
            tipo_impressora = request.data.get('tipo_impressora', 'zebra')
            ip_impressora = request.data.get('ip_impressora')
            quantidade = int(request.data.get('quantidade', 1))
            
            if not cliente_id or not layout_id:
                return Response({
                    'error': 'cliente_id e layout_id são obrigatórios'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Buscar cliente
            from api.models import Cliente
            cliente = Cliente.objects.get(id_cliente=cliente_id)
            cliente_dict = {
                'nome_razao_social': cliente.nome_razao_social,
                'cpf_cnpj': cliente.cpf_cnpj or '',
                'telefone': cliente.telefone or '',
                'endereco': cliente.endereco or '',
                'numero': cliente.numero or '',
                'bairro': cliente.bairro or '',
                'cidade': cliente.cidade or '',
                'estado': cliente.estado or '',
                'cep': cliente.cep or '',
            }
            
            # Buscar layout
            layout = LayoutEtiqueta.objects.get(id=layout_id)
            layout_dict = {
                'largura_etiqueta': float(layout.largura_etiqueta),
                'altura_etiqueta': float(layout.altura_etiqueta),
                'campos_visiveis': layout.campos_visiveis,
            }
            
            # Gerar código ZPL (padrão para clientes)
            zpl = PrinterManager.gerar_etiqueta_cliente(cliente_dict, layout_dict)
            zpl_completo = zpl * quantidade
            
            resultado = {
                'sucesso': True,
                'mensagem': 'Etiqueta de cliente gerada com sucesso',
                'codigo_gerado': zpl_completo
            }
            
            # Se tiver IP, tentar enviar
            if ip_impressora:
                from .printer_service import ZebraPrinterService
                sucesso = ZebraPrinterService.enviar_para_impressora(zpl_completo, ip_impressora)
                resultado['sucesso'] = sucesso
                resultado['mensagem'] = 'Enviado para impressora' if sucesso else 'Erro ao enviar para impressora'
            
            # Registrar impressão
            if resultado['sucesso']:
                ImpressaoEtiqueta.objects.create(
                    layout=layout,
                    produtos={'cliente_id': cliente_id},
                    cliente_id=cliente_id,
                    quantidade_total=quantidade,
                    usuario=request.user
                )
            
            return Response(resultado)
            
        except Cliente.DoesNotExist:
            return Response({'error': 'Cliente não encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except LayoutEtiqueta.DoesNotExist:
            return Response({'error': 'Layout não encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def imprimir_lote(self, request):
        """
        Imprime múltiplas etiquetas de produtos em lote
        
        Payload:
        {
            "produtos": [
                {"produto_id": 1, "quantidade": 2},
                {"produto_id": 5, "quantidade": 1}
            ],
            "layout_id": 1,
            "tipo_impressora": "zebra",
            "ip_impressora": "192.168.1.100" (opcional)
        }
        """
        try:
            produtos_lista = request.data.get('produtos', [])
            layout_id = request.data.get('layout_id')
            tipo_impressora = request.data.get('tipo_impressora', 'zebra')
            ip_impressora = request.data.get('ip_impressora')
            
            if not produtos_lista or not layout_id:
                return Response({
                    'error': 'produtos e layout_id são obrigatórios'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Buscar layout
            layout = LayoutEtiqueta.objects.get(id=layout_id)
            layout_dict = {
                'largura_etiqueta': float(layout.largura_etiqueta),
                'altura_etiqueta': float(layout.altura_etiqueta),
                'campos_visiveis': layout.campos_visiveis,
            }
            
            codigo_completo = ''
            quantidade_total = 0
            erros = []
            
            # Gerar código para cada produto
            for item in produtos_lista:
                try:
                    produto_id = item.get('produto_id')
                    quantidade = int(item.get('quantidade', 1))
                    
                    produto = Produto.objects.get(id_produto=produto_id)
                    produto_dict = {
                        'codigo_produto': produto.codigo_produto,
                        'codigo_barras': produto.codigo_barras or '',
                        'nome_produto': produto.nome_produto,
                        'descricao': produto.descricao or '',
                        'marca': produto.marca or '',
                        'modelo': produto.modelo or '',
                        'cor': produto.cor or '',
                        'tamanho': produto.tamanho or '',
                        'unidade': produto.unidade or 'UN',
                        'localizacao': produto.localizacao or '',
                        'valor_venda': float(produto.valor_venda) if produto.valor_venda else 0,
                    }
                    
                    resultado = PrinterManager.imprimir_etiqueta(
                        produto=produto_dict,
                        layout=layout_dict,
                        tipo_impressora=tipo_impressora,
                        ip_impressora=None,  # Acumular primeiro
                        quantidade=quantidade
                    )
                    
                    if resultado['sucesso']:
                        codigo_completo += resultado['codigo_gerado']
                        quantidade_total += quantidade
                    else:
                        erros.append(f"Produto {produto_id}: {resultado['mensagem']}")
                        
                except Produto.DoesNotExist:
                    erros.append(f"Produto {produto_id} não encontrado")
                except Exception as e:
                    erros.append(f"Produto {produto_id}: {str(e)}")
            
            # Enviar tudo de uma vez se tiver IP
            if ip_impressora and codigo_completo:
                if tipo_impressora == 'zebra':
                    from .printer_service import ZebraPrinterService
                    sucesso = ZebraPrinterService.enviar_para_impressora(codigo_completo, ip_impressora)
                else:
                    import base64
                    comandos = base64.b64decode(codigo_completo)
                    from .printer_service import ElginPrinterService
                    sucesso = ElginPrinterService.enviar_para_impressora(comandos, ip_impressora)
                
                mensagem = 'Lote enviado para impressora' if sucesso else 'Erro ao enviar lote para impressora'
            else:
                sucesso = True
                mensagem = 'Lote de etiquetas gerado com sucesso'
            
            # Registrar impressão
            if sucesso:
                ImpressaoEtiqueta.objects.create(
                    layout=layout,
                    produtos={'produtos': produtos_lista},
                    quantidade_total=quantidade_total,
                    usuario=request.user
                )
            
            return Response({
                'sucesso': sucesso,
                'mensagem': mensagem,
                'codigo_gerado': codigo_completo,
                'quantidade_total': quantidade_total,
                'erros': erros
            })
            
        except LayoutEtiqueta.DoesNotExist:
            return Response({'error': 'Layout não encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
