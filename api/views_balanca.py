"""
Views para gerenciamento de balanças
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Max

from .models_balanca import ConfiguracaoBalanca, ProdutoBalanca, ExportacaoBalanca
from .models import Produto
from .serializers_balanca import (
    ConfiguracaoBalancaSerializer,
    ProdutoBalancaSerializer,
    ExportacaoBalancaSerializer,
    ProdutoParaBalancaSerializer
)
from .services_balanca import BalancaExportService, BalancaIntegradaService


class ConfiguracaoBalancaViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracaoBalanca.objects.all()
    serializer_class = ConfiguracaoBalancaSerializer
    
    def perform_create(self, serializer):
        serializer.save(usuario_criacao=self.request.user)
    
    @action(detail=True, methods=['post'])
    def adicionar_produtos(self, request, pk=None):
        """
        Adiciona produtos à balança
        
        POST /api/balancas/configuracoes/{id}/adicionar_produtos/
        {
            "produtos": [1, 2, 3],
            "codigo_plu_inicial": 1,
            "validade_dias": 3,
            "tara": 0.05,
            "departamento": 1
        }
        """
        configuracao = self.get_object()
        serializer = ProdutoParaBalancaSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        produtos_ids = data['produtos']
        
        # Determina código PLU inicial
        if 'codigo_plu_inicial' in data:
            codigo_plu = data['codigo_plu_inicial']
        else:
            # Busca próximo código disponível
            ultimo_plu = ProdutoBalanca.objects.filter(configuracao=configuracao).aggregate(Max('codigo_plu'))['codigo_plu__max']
            codigo_plu = (ultimo_plu or configuracao.codigo_inicial_plu - 1) + 1
        
        produtos_adicionados = []
        produtos_existentes = []
        erros = []
        
        for produto_id in produtos_ids:
            try:
                produto = Produto.objects.get(id_produto=produto_id)
                
                # Verifica se já existe
                if ProdutoBalanca.objects.filter(configuracao=configuracao, produto=produto).exists():
                    produtos_existentes.append({
                        'id': produto.id_produto,
                        'nome': produto.nome_produto
                    })
                    continue
                
                # Cria produto na balança
                produto_balanca = ProdutoBalanca.objects.create(
                    configuracao=configuracao,
                    produto=produto,
                    codigo_plu=codigo_plu,
                    validade_dias=data.get('validade_dias', 3),
                    tara=data.get('tara', 0),
                    departamento=data.get('departamento', 1),
                    ativo=True
                )
                
                produtos_adicionados.append({
                    'id': produto.id_produto,
                    'nome': produto.nome_produto,
                    'codigo_plu': codigo_plu
                })
                
                codigo_plu += 1
                
            except Produto.DoesNotExist:
                erros.append(f'Produto {produto_id} não encontrado')
            except Exception as e:
                erros.append(f'Erro ao adicionar produto {produto_id}: {str(e)}')
        
        return Response({
            'sucesso': True,
            'produtos_adicionados': len(produtos_adicionados),
            'detalhes_adicionados': produtos_adicionados,
            'produtos_existentes': len(produtos_existentes),
            'detalhes_existentes': produtos_existentes,
            'erros': erros
        })
    
    @action(detail=True, methods=['get'])
    def exportar(self, request, pk=None):
        """
        Exporta produtos para arquivo de balança
        
        GET /api/balancas/configuracoes/{id}/exportar/
        """
        try:
            configuracao = self.get_object()
            
            # Busca produtos ativos
            produtos_balanca = ProdutoBalanca.objects.filter(
                configuracao=configuracao,
                ativo=True
            ).select_related('produto')
            
            if not produtos_balanca.exists():
                return Response({
                    'error': 'Nenhum produto configurado para esta balança. Adicione produtos antes de exportar.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Prepara dados dos produtos
            produtos_export = []
            for pb in produtos_balanca:
                # Valida se produto tem preço
                if not pb.produto.valor_venda or pb.produto.valor_venda <= 0:
                    continue  # Pula produtos sem preço
                
                produtos_export.append({
                    'codigo_plu': pb.codigo_plu,
                    'nome_produto': pb.produto.nome_produto[:configuracao.tamanho_nome_produto],
                    'preco': float(pb.produto.valor_venda),
                    'validade_dias': pb.validade_dias,
                    'tara': float(pb.tara),
                    'departamento': pb.departamento,
                    'codigo_barras': pb.produto.codigo_barras or '',
                    'unidade': pb.produto.unidade or 'KG'
                })
            
            if not produtos_export:
                return Response({
                    'error': 'Nenhum produto válido para exportar. Verifique se os produtos têm preço cadastrado.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Gera exportação
            resultado = BalancaExportService.gerar_exportacao(
                produtos=produtos_export,
                formato=configuracao.formato_exportacao,
                config={
                    'tamanho_nome': configuracao.tamanho_nome_produto
                }
            )
            
            # Salva histórico
            exportacao = ExportacaoBalanca.objects.create(
                configuracao=configuracao,
                arquivo_gerado=resultado['nome_arquivo'],
                quantidade_produtos=resultado['quantidade'],
                formato=resultado['formato'],
                conteudo_arquivo=resultado['conteudo'],
                tamanho_bytes=resultado['tamanho_bytes'],
                usuario=request.user
            )
            
            # Atualiza data de exportação dos produtos
            produtos_balanca.update(exportado_em=timezone.now())
            
            # Retorna arquivo para download
            response = HttpResponse(resultado['conteudo'], content_type='text/plain; charset=utf-8')
            response['Content-Disposition'] = f'attachment; filename="{resultado["nome_arquivo"]}"'
            
            return response
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Erro ao gerar exportação: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def preview_exportacao(self, request, pk=None):
        """
        Preview da exportação (JSON)
        
        GET /api/balancas/configuracoes/{id}/preview_exportacao/
        """
        try:
            configuracao = self.get_object()
            
            # Busca produtos
            produtos_balanca = ProdutoBalanca.objects.filter(
                configuracao=configuracao,
                ativo=True
            ).select_related('produto')[:10]  # Limita a 10 para preview
            
            if not produtos_balanca.exists():
                return Response({
                    'error': 'Nenhum produto configurado para esta balança. Adicione produtos antes de gerar preview.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Prepara dados
            produtos_export = []
            for pb in produtos_balanca:
                # Valida se produto tem preço
                if not pb.produto.valor_venda or pb.produto.valor_venda <= 0:
                    continue
                
                produtos_export.append({
                    'codigo_plu': pb.codigo_plu,
                    'nome_produto': pb.produto.nome_produto[:configuracao.tamanho_nome_produto],
                    'preco': float(pb.produto.valor_venda),
                    'validade_dias': pb.validade_dias,
                    'tara': float(pb.tara),
                    'departamento': pb.departamento,
                    'codigo_barras': pb.produto.codigo_barras or '',
                    'unidade': pb.produto.unidade or 'KG'
                })
            
            if not produtos_export:
                return Response({
                    'error': 'Nenhum produto válido para preview. Verifique se os produtos têm preço cadastrado.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Gera conteúdo
            resultado = BalancaExportService.gerar_exportacao(
                produtos=produtos_export,
                formato=configuracao.formato_exportacao,
                config={
                    'tamanho_nome': configuracao.tamanho_nome_produto
                }
            )
            
            total_produtos = ProdutoBalanca.objects.filter(
                configuracao=configuracao,
                ativo=True
            ).count()
            
            return Response({
                'formato': configuracao.formato_exportacao,
                'quantidade_produtos': len(produtos_export),
                'preview': resultado['conteudo'][:1000],  # Primeiros 1000 caracteres
                'total_produtos_configurados': total_produtos
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Erro ao gerar preview: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def testar_conexao(self, request, pk=None):
        """
        Testa conexão com balança integrada
        
        POST /api/balancas/configuracoes/{id}/testar_conexao/
        """
        configuracao = self.get_object()
        
        if configuracao.tipo_balanca != 'integrada':
            return Response({
                'error': 'Teste de conexão disponível apenas para balanças integradas'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Determina tipo de conexão
        if configuracao.porta_serial:
            resultado = BalancaIntegradaService.testar_conexao(
                tipo_conexao='serial',
                porta=configuracao.porta_serial,
                baud_rate=configuracao.baud_rate
            )
        elif configuracao.ip_balanca:
            resultado = BalancaIntegradaService.testar_conexao(
                tipo_conexao='rede',
                ip=configuracao.ip_balanca,
                porta=configuracao.porta_rede
            )
        else:
            return Response({
                'error': 'Nenhuma conexão configurada (porta serial ou IP)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(resultado)


class ProdutoBalancaViewSet(viewsets.ModelViewSet):
    queryset = ProdutoBalanca.objects.all()
    serializer_class = ProdutoBalancaSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por configuração
        configuracao_id = self.request.query_params.get('configuracao')
        if configuracao_id:
            queryset = queryset.filter(configuracao_id=configuracao_id)
        
        # Filtro por ativo
        ativo = self.request.query_params.get('ativo')
        if ativo is not None:
            queryset = queryset.filter(ativo=ativo.lower() == 'true')
        
        return queryset.select_related('produto', 'configuracao')
    
    @action(detail=False, methods=['post'])
    def atualizar_precos(self, request):
        """
        Atualiza preços dos produtos na balança com base nos preços atuais
        
        POST /api/balancas/produtos/atualizar_precos/
        {
            "configuracao_id": 1
        }
        """
        configuracao_id = request.data.get('configuracao_id')
        
        if not configuracao_id:
            return Response({
                'error': 'configuracao_id é obrigatório'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Busca produtos
        produtos = ProdutoBalanca.objects.filter(
            configuracao_id=configuracao_id,
            ativo=True
        ).select_related('produto')
        
        atualizados = 0
        for produto_balanca in produtos:
            # Atualiza timestamp para forçar nova exportação
            produto_balanca.atualizado_em = timezone.now()
            produto_balanca.exportado_em = None
            produto_balanca.save(update_fields=['atualizado_em', 'exportado_em'])
            atualizados += 1
        
        return Response({
            'sucesso': True,
            'produtos_atualizados': atualizados,
            'mensagem': f'{atualizados} produtos marcados para atualização. Gere nova exportação.'
        })


class ExportacaoBalancaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExportacaoBalanca.objects.all()
    serializer_class = ExportacaoBalancaSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por configuração
        configuracao_id = self.request.query_params.get('configuracao')
        if configuracao_id:
            queryset = queryset.filter(configuracao_id=configuracao_id)
        
        return queryset.select_related('configuracao', 'usuario')
    
    @action(detail=True, methods=['get'])
    def baixar(self, request, pk=None):
        """
        Baixa arquivo de exportação anterior
        
        GET /api/balancas/exportacoes/{id}/baixar/
        """
        exportacao = self.get_object()
        
        response = HttpResponse(exportacao.conteudo_arquivo, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename="{exportacao.arquivo_gerado}"'
        
        return response


class BalancaLeituraViewSet(viewsets.ViewSet):
    """
    ViewSet para leitura de peso de balanças integradas
    """
    
    @action(detail=False, methods=['post'])
    def ler_peso(self, request):
        """
        Lê peso da balança
        
        POST /api/balancas/leitura/ler_peso/
        {
            "configuracao_id": 1
        }
        
        ou
        
        {
            "tipo_conexao": "serial",
            "porta": "COM1",
            "baud_rate": 9600
        }
        
        ou
        
        {
            "tipo_conexao": "rede",
            "ip": "192.168.1.100",
            "porta": 9100
        }
        """
        # Se informou ID da configuração
        configuracao_id = request.data.get('configuracao_id')
        if configuracao_id:
            try:
                config = ConfiguracaoBalanca.objects.get(id=configuracao_id, tipo_balanca='integrada')
                
                if config.porta_serial:
                    resultado = BalancaIntegradaService.ler_peso_serial(
                        porta=config.porta_serial,
                        baud_rate=config.baud_rate
                    )
                elif config.ip_balanca:
                    resultado = BalancaIntegradaService.ler_peso_rede(
                        ip=config.ip_balanca,
                        porta=config.porta_rede
                    )
                else:
                    return Response({
                        'error': 'Configuração sem conexão definida'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                return Response(resultado)
                
            except ConfiguracaoBalanca.DoesNotExist:
                return Response({
                    'error': 'Configuração não encontrada'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Ou usa parâmetros diretos
        tipo_conexao = request.data.get('tipo_conexao')
        
        if tipo_conexao == 'serial':
            resultado = BalancaIntegradaService.ler_peso_serial(
                porta=request.data.get('porta', 'COM1'),
                baud_rate=request.data.get('baud_rate', 9600)
            )
        elif tipo_conexao == 'rede':
            resultado = BalancaIntegradaService.ler_peso_rede(
                ip=request.data.get('ip'),
                porta=request.data.get('porta', 9100)
            )
        else:
            return Response({
                'error': 'Informe configuracao_id ou tipo_conexao (serial/rede)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(resultado)
