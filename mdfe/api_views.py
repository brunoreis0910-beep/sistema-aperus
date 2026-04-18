from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
import logging

from .models import ManifestoEletronico, MDFeDocumentoVinculado
from .serializers import ManifestoEletronicoSerializer
from api.services.mdfe_service import MDFeService

logger = logging.getLogger('django')


class MDFeViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de MDF-e"""
    
    queryset = ManifestoEletronico.objects.all().order_by('-id_mdfe')
    serializer_class = ManifestoEletronicoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        status_mdfe = self.request.query_params.get('status', None)
        data_inicio = self.request.query_params.get('data_inicio', None)
        data_fim = self.request.query_params.get('data_fim', None)
        
        if status_mdfe:
            queryset = queryset.filter(status_mdfe=status_mdfe)
        
        if data_inicio:
            queryset = queryset.filter(data_emissao__gte=data_inicio)
        
        if data_fim:
            queryset = queryset.filter(data_emissao__lte=data_fim)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Criar novo MDF-e"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Adicionar usuário criador
        mdfe = serializer.save(criado_por=request.user)
        
        return Response(
            self.get_serializer(mdfe).data,
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """Atualizar MDF-e (apenas se não emitido)"""
        instance = self.get_object()
        
        if instance.status_mdfe in ['EMITIDO', 'ENCERRADO', 'CANCELADO']:
            return Response(
                {'error': f'MDF-e com status {instance.status_mdfe} não pode ser editado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Excluir MDF-e (apenas se não emitido)"""
        instance = self.get_object()
        
        if instance.status_mdfe in ['EMITIDO', 'ENCERRADO']:
            return Response(
                {'error': 'MDF-e emitido não pode ser excluído. Solicite cancelamento.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def emitir(self, request, pk=None):
        """
        Emitir MDF-e para SEFAZ (homologação ou produção)
        """
        mdfe = self.get_object()
        
        # Validar status
        if mdfe.status_mdfe not in ['PENDENTE', 'ERRO']:
            return Response(
                {'error': f'MDF-e com status {mdfe.status_mdfe} não pode ser emitido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar dados obrigatórios
        if not mdfe.placa_veiculo:
            return Response(
                {'error': 'Placa do veículo é obrigatória'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not mdfe.condutor_nome or not mdfe.condutor_cpf:
            return Response(
                {'error': 'Condutor (nome e CPF) é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if mdfe.documentos_vinculados.count() == 0:
            return Response(
                {'error': 'É necessário vincular ao menos um documento (CT-e ou NF-e)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Emitir via service
            service = MDFeService()
            resultado = service.emitir_mdfe(mdfe)
            
            # Recarregar objeto atualizado
            mdfe.refresh_from_db()
            
            return Response({
                'success': True,
                'message': resultado.get('message', 'MDF-e emitido com sucesso'),
                'mdfe': self.get_serializer(mdfe).data,
                'chave': mdfe.chave_mdfe,
                'protocolo': mdfe.protocolo_mdfe,
                'status': mdfe.status_mdfe
            })
        
        except Exception as e:
            logger.error(f"Erro ao emitir MDF-e {pk}: {str(e)}")
            
            # Atualizar status para erro
            mdfe.status_mdfe = 'ERRO'
            mdfe.xmotivo = str(e)[:255]
            mdfe.save()
            
            return Response(
                {'error': f'Erro ao emitir MDF-e: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def encerrar(self, request, pk=None):
        """
        Encerrar MDF-e (avisar SEFAZ que viagem foi concluída)
        """
        mdfe = self.get_object()
        
        status_validos = ['EMITIDO', 'Emitido', 'AUTORIZADO', 'Autorizado']
        if mdfe.status_mdfe not in status_validos:
            return Response(
                {'error': 'Apenas MDF-e EMITIDO/AUTORIZADO pode ser encerrado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            service = MDFeService()
            resultado = service.encerrar_mdfe(mdfe, request.data)
            
            mdfe.refresh_from_db()
            
            return Response({
                'success': True,
                'message': 'MDF-e encerrado com sucesso',
                'mdfe': self.get_serializer(mdfe).data
            })
        
        except Exception as e:
            logger.error(f"Erro ao encerrar MDF-e {pk}: {str(e)}")
            return Response(
                {'error': f'Erro ao encerrar MDF-e: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """
        Cancelar MDF-e emitido
        """
        mdfe = self.get_object()
        
        status_validos = ['EMITIDO', 'Emitido', 'AUTORIZADO', 'Autorizado']
        if mdfe.status_mdfe not in status_validos:
            return Response(
                {'error': 'Apenas MDF-e EMITIDO/AUTORIZADO pode ser cancelado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        justificativa = request.data.get('justificativa', '')
        if len(justificativa) < 15:
            return Response(
                {'error': 'Justificativa deve ter no mínimo 15 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            service = MDFeService()
            resultado = service.cancelar_mdfe(mdfe, justificativa)
            
            mdfe.refresh_from_db()
            
            return Response({
                'success': True,
                'message': 'MDF-e cancelado com sucesso',
                'mdfe': self.get_serializer(mdfe).data
            })
        
        except Exception as e:
            logger.error(f"Erro ao cancelar MDF-e {pk}: {str(e)}")
            return Response(
                {'error': f'Erro ao cancelar MDF-e: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def download_xml(self, request, pk=None):
        """Download do XML do MDF-e"""
        mdfe = self.get_object()
        
        if not mdfe.xml_mdfe:
            return Response(
                {'error': 'XML não disponível'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        response = HttpResponse(mdfe.xml_mdfe, content_type='application/xml')
        response['Content-Disposition'] = f'attachment; filename="mdfe_{mdfe.numero_mdfe}.xml"'
        return response
    
    @action(detail=True, methods=['get'])
    def imprimir_damdfe(self, request, pk=None):
        """Gerar e retornar DAMDFE em PDF"""
        mdfe = self.get_object()
        
        if not mdfe.chave_mdfe:
            return Response(
                {'error': 'MDF-e ainda não foi emitido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            service = MDFeService()
            pdf_buffer = service.gerar_damdfe(mdfe)
            
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="damdfe_{mdfe.numero_mdfe}.pdf"'
            return response
        
        except Exception as e:
            logger.error(f"Erro ao gerar DAMDFE {pk}: {str(e)}")
            return Response(
                {'error': f'Erro ao gerar DAMDFE: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def consultar_status(self, request, pk=None):
        """Consultar status do MDF-e na SEFAZ"""
        mdfe = self.get_object()
        
        if not mdfe.chave_mdfe:
            return Response(
                {'error': 'MDF-e não possui chave de acesso'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            service = MDFeService()
            resultado = service.consultar_status_mdfe(mdfe)
            
            return Response(resultado)
        
        except Exception as e:
            logger.error(f"Erro ao consultar status MDF-e {pk}: {str(e)}")
            return Response(
                {'error': f'Erro ao consultar status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def listar_documentos_disponiveis(self, request):
        """
        Lista CT-e e NF-e disponíveis para vincular ao MDF-e
        """
        # Importar aqui para evitar importação circular
        from cte.models import ConhecimentoTransporte
        from api.models import Venda
        
        # CT-es autorizados e não vinculados
        ctes = ConhecimentoTransporte.objects.filter(
            status_cte='AUTORIZADO'
        ).exclude(
            chave_cte__in=MDFeDocumentoVinculado.objects.filter(
                tipo_documento='CTE'
            ).values('chave_acesso')
        ).select_related('destinatario').values(
            'id_cte', 'numero_cte', 'serie_cte', 'chave_cte', 
            'valor_total_servico', 'destinatario__nome_razao_social'
        )[:50]
        
        # NF-es autorizadas e não vinculadas (apenas modelo 55, não NFC-e modelo 65)
        # Na chave de acesso, posições 20-21 indicam o modelo (55=NF-e, 65=NFC-e)
        nfes = Venda.objects.filter(
            status_nfe='EMITIDA',
            chave_nfe__regex=r'^.{20}55'  # Filtra apenas NF-e modelo 55
        ).exclude(
            chave_nfe__in=MDFeDocumentoVinculado.objects.filter(
                tipo_documento='NFE'
            ).values('chave_acesso')
        ).select_related('id_cliente').values(
            'id_venda', 'numero_nfe', 'serie_nfe', 
            'chave_nfe', 'valor_total', 'id_cliente__nome_razao_social'
        )[:50]
        
        return Response({
            'ctes': list(ctes),
            'nfes': list(nfes)
        })
    
    @action(detail=False, methods=['get'])
    def listar_veiculos(self, request):
        """
        Lista todos os veículos cadastrados para seleção no MDF-e
        """
        from api.models import Veiculo
        
        veiculos = Veiculo.objects.filter(ativo=True).order_by('placa')
        
        dados = [{
            'id': v.id_veiculo,
            'placa': v.placa,
            'uf': v.uf,
            'marca': v.marca or '',
            'modelo': v.modelo or '',
            'ano': v.ano or '',
            'rntrc': v.rntrc or '',
            'tipo_rodado': v.tipo_rodado or '03',
            'tipo_carroceria': v.tipo_carroceria or '02',
            'tara_kg': v.tara_kg or 0,
            'capacidade_kg': v.capacidade_kg or 0,
            'descricao': f"{v.placa} - {v.marca or ''} {v.modelo or ''} ({v.uf})".strip()
        } for v in veiculos]
        
        return Response(dados)
    
    @action(detail=False, methods=['get'])
    def buscar_veiculo(self, request):
        """
        Busca dados do veículo pela placa
        """
        from api.models import Veiculo
        
        placa = request.query_params.get('placa', '').upper().strip()
        if not placa:
            return Response({'error': 'Placa não informada'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            veiculo = Veiculo.objects.get(placa=placa)
            return Response({
                'placa': veiculo.placa,
                'uf': veiculo.uf,
                'marca': veiculo.marca,
                'modelo': veiculo.modelo,
                'ano': veiculo.ano,
                'rntrc': veiculo.rntrc,
                'tipo_rodado': veiculo.tipo_rodado,
                'tipo_carroceria': veiculo.tipo_carroceria,
                'tara_kg': veiculo.tara_kg,
                'capacidade_kg': veiculo.capacidade_kg,
            })
        except Veiculo.DoesNotExist:
            return Response({
                'error': 'Veículo não encontrado',
                'placa': placa
            }, status=status.HTTP_404_NOT_FOUND)
