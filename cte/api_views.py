from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models import Q
from django.http import HttpResponse
from api.models import Venda
from rest_framework.decorators import action
from .models import ConhecimentoTransporte
from .serializers import ConhecimentoTransporteSerializer
from api.services.dacte_service import DacteGenerator
import logging

logger = logging.getLogger('django')

class CTeViewSet(viewsets.ModelViewSet):
    queryset = ConhecimentoTransporte.objects.all().order_by('-id_cte')
    serializer_class = ConhecimentoTransporteSerializer

    def create(self, request, *args, **kwargs):
        import json
        logger.info("======================================================================")
        logger.info("[CTE_DEBUG] API CREATE Chamada")
        try:
            user_info = str(request.user)
        except:
            user_info = "Unknown"
        logger.info(f"[CTE_DEBUG] User: {user_info}")
        
        # Log safe payload
        try:
            payload_str = json.dumps(request.data, default=str)
            logger.info(f"[CTE_DEBUG] Dados recebidos (len={len(payload_str)}): {payload_str[:2000]}...") # truncate if too huge
        except:
            logger.info(f"[CTE_DEBUG] Dados recebidos (raw): {request.data}")

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"[CTE_DEBUG] ❌ Erro de validação no Serializer: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            logger.info("[CTE_DEBUG] Dados validados com sucesso. Executando perform_create...")
            self.perform_create(serializer)
            instance_id = serializer.data.get('id_cte')
            logger.info(f"[CTE_DEBUG] ✅ CTe criado com sucesso no banco! ID: {instance_id}")
            
            # Verifica se realmente gravou no banco
            exists = ConhecimentoTransporte.objects.filter(id_cte=instance_id).exists()
            logger.info(f"[CTE_DEBUG] Verificação pós-gravacao: ID {instance_id} existe no banco? {exists}")
            
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.exception(f"[CTE_DEBUG] ❌ Exception CRÍTICA ao salvar CTe: {str(e)}")
            return Response({"error": f"Erro interno ao salvar CTe: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        logger.info("======================================================================")
        logger.info(f"[CTE_DEBUG] API UPDATE Chamada para ID: {kwargs.get('pk')}")
        # logger.info(f"[CTE_DEBUG] Dados recebidos: {request.data}")
        try:
            response = super().update(request, *args, **kwargs)
            logger.info(f"[CTE_DEBUG] ✅ Update realizado com sucesso. Status: {response.status_code}")
            return response
        except Exception as e:
            logger.exception(f"[CTE_DEBUG] ❌ EXCEPTION no UPDATE: {e}")
            raise e

    def get_queryset(self):
        queryset = ConhecimentoTransporte.objects.all().order_by('-id_cte')
        
        # Filtros
        modelo = self.request.query_params.get('modelo')
        if modelo:
             queryset = queryset.filter(modelo=modelo)
             
        data_inicial = self.request.query_params.get('data_inicial')
        if data_inicial:
            queryset = queryset.filter(data_emissao__gte=data_inicial)
            
        data_final = self.request.query_params.get('data_final')
        if data_final:
            # Ajusta para final do dia se necessário, mas aqui assumindo date comparison
            queryset = queryset.filter(data_emissao__lte=data_final)
            
        id_cliente = self.request.query_params.get('id_cliente')
        if id_cliente:
            queryset = queryset.filter(
                Q(remetente_id=id_cliente) |
                Q(destinatario_id=id_cliente) |
                Q(tomador_outros_id=id_cliente)
            )

        search = self.request.query_params.get('search')
        if search:
            q_filter = Q(chave_cte__icontains=search) | \
                       Q(remetente__nome_razao_social__icontains=search) | \
                       Q(destinatario__nome_razao_social__icontains=search) | \
                       Q(condutor_nome__icontains=search)
            
            if search.isdigit():
                q_filter |= Q(numero_cte=search)
                
            queryset = queryset.filter(q_filter)
            
        return queryset

    def destroy(self, request, *args, **kwargs):
        cte = self.get_object()
        
        # Bloquear exclusão se não for PENDENTE (Rigoroso)
        status_safe = (cte.status_cte or 'PENDENTE').upper()
        if status_safe != 'PENDENTE':
             msg = f"Não é possível excluir um CT-e com status {cte.status_cte}. Apenas CT-e PENDENTE pode ser excluído."
             if status_safe in ['ERRO', 'REJEITADO']:
                 msg += " Use a opção 'Limpar Erro' antes de excluir."
             elif status_safe in ['AUTORIZADO', 'EMITIDO']:
                 msg += " Utilize o Cancelamento."
                 
             return Response({"error": msg, "details": msg}, status=status.HTTP_400_BAD_REQUEST)
             
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def limpar_erro(self, request, pk=None):
        """
        Limpa status de erro do CT-e permitindo nova edição/emissão ou exclusão.
        """
        cte = self.get_object()
        
        if cte.status_cte not in ['ERRO', 'REJEITADO']:
            return Response({"error": "Apenas CT-e com status ERRO ou REJEITADO podem ser limpos."}, status=400)
            
        cte.status_cte = 'PENDENTE'
        cte.xml_cte = None
        cte.xmotivo = None 
        cte.cstat = None
        cte.protocolo_cte = None
        cte.qrcode_url = None
        # Não limpamos numero_cte para tentar preservar sequencia, a menos que usuario altere manualmente depois
        
        cte.save()
        return Response({"message": "Status de erro limpo com sucesso! CT-e agora é PENDENTE."})

    @action(detail=False, methods=['get'])
    def listar_notas_disponiveis(self, request):
        """
        Lista NFe (Vendas) disponíveis para serem vinculadas ao CTe.
        """
        termo = request.query_params.get('q', '').strip()
        data_ini = request.query_params.get('data_ini')
        data_fim = request.query_params.get('data_fim')
        
        # Filtra vendas que tem chave NFe e são Modelo 55
        qs = Venda.objects.filter(
            chave_nfe__isnull=False,
            id_operacao__modelo_documento='55'
        ).exclude(chave_nfe='')
        
        if termo:
            qs = qs.filter(
                Q(numero_nfe__icontains=termo) |
                Q(chave_nfe__icontains=termo) |
                Q(id_cliente__nome_razao_social__icontains=termo)
            )
            
        if data_ini:
            qs = qs.filter(data_documento__date__gte=data_ini)
        if data_fim:
            qs = qs.filter(data_documento__date__lte=data_fim)
            
        # Limit to 50 recent
        qs = qs.order_by('-id_venda')[:50]
        
        data = []
        for v in qs:
            data.append({
                'id_venda': v.id_venda,
                'numero': f"{v.numero_nfe or v.numero_documento or ''}",
                'serie': v.serie_nfe,
                'chave': v.chave_nfe,
                'data': v.data_documento,
                'destinatario': v.id_cliente.nome_razao_social if v.id_cliente else 'Consumidor',
                'id_destinatario': v.id_cliente.id_cliente if v.id_cliente else None,
                'valor': v.valor_total,
                # Dados para Auto-Preenchimento
                'peso_bruto': v.peso_bruto,
                'peso_liquido': v.peso_liquido,
                'volumes': v.quantidade_volumes,
                'valor_carga': v.valor_total, # Valor da Nota = Valor Carga
                'placa_veiculo': v.placa_veiculo,
                'uf_veiculo': v.uf_veiculo,
                'rntrc': v.rntrc
            })
            
        return Response(data)

    @action(detail=True, methods=['get'])
    def status_sefaz(self, request, pk=None):
        """
        Verifica status na SEFAZ (Mock por enquanto)
        """
        cte = self.get_object()
        # Aqui entraria a logica de consultar a SEFAZ
        return Response({'status': cte.status_cte, 'cstat': cte.cstat, 'xmotivo': cte.xmotivo})

    @action(detail=True, methods=['post'])
    def emitir_cte(self, request, pk=None):
        logger.info("======================================================================")
        logger.info(f"[CTE_DEBUG] API EMITIR_CTE Chamada para ID: {pk}")
        
        cte = self.get_object()
        
        try:
            from api.services.cte_service import CTeService
            service = CTeService()
            resultado = service.emitir_cte(cte)
            
            logger.info(f"[CTE_DEBUG] Resultado Emissão: {resultado}")
            
            if resultado.get('sucesso'):
                 return Response(resultado, status=status.HTTP_200_OK)
            else:
                 return Response(resultado, status=status.HTTP_400_BAD_REQUEST)
                 
        except ImportError:
             logger.error("[CTE_DEBUG] CTeService nao encontrado ou erro de importacao")
             return Response({"sucesso": False, "mensagem": "Serviço de emissão não implementado ou erro de importação."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
             logger.exception(f"[CTE_DEBUG] Erro ao emitir CTe: {e}")
             return Response({"sucesso": False, "mensagem": f"Erro interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def baixar_xml(self, request, pk=None):
        cte = self.get_object()
        if not cte.xml_cte:
             return Response({"erro": "XML não disponível para este CTe"}, status=status.HTTP_404_NOT_FOUND)
             
        response = HttpResponse(cte.xml_cte, content_type='application/xml')
        response['Content-Disposition'] = f'attachment; filename="cte_{cte.chave_cte or cte.id_cte}.xml"'
        return response

    @action(detail=True, methods=['get'])
    def imprimir_dacte(self, request, pk=None):
        cte = self.get_object()
        try:
            gerador = DacteGenerator(cte)
            buffer = gerador.gerar_pdf()
            
            response = HttpResponse(buffer, content_type='application/pdf')
            # Inline para abrir no navegador, attachment para baixar direto
            response['Content-Disposition'] = f'inline; filename="dacte_{cte.chave_cte or cte.id_cte}.pdf"'
            return response
        except Exception as e:
            logger.error(f"Erro ao gerar DACTE: {e}")
            return Response({"erro": f"Erro ao gerar DACTE: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
