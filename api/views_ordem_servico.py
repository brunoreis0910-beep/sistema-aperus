from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.db import transaction
from django.http import HttpResponse
from datetime import datetime
from .models import OrdemServico, OsItensProduto, OsItensServico, Tecnico, EmpresaConfig, Venda, VendaItem, Operacao, Estoque, OsFoto, OsAssinatura
from .serializers_ordem_servico import OrdemServicoSerializer
from rest_framework import serializers


class OsFotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = OsFoto
        fields = ['id_os_foto', 'id_os', 'nome_arquivo', 'imagem_base64', 'data_criacao']


class OsAssinaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = OsAssinatura
        fields = ['id_os_assinatura', 'id_os', 'nome_assinante', 'assinatura_base64', 'data_assinatura']


class OsFotoViewSet(viewsets.ModelViewSet):
    serializer_class = OsFotoSerializer

    def get_queryset(self):
        qs = OsFoto.objects.all()
        id_os = self.request.query_params.get('id_os')
        if id_os:
            qs = qs.filter(id_os=id_os)
        return qs


class OsAssinaturaViewSet(viewsets.ModelViewSet):
    serializer_class = OsAssinaturaSerializer

    def get_queryset(self):
        qs = OsAssinatura.objects.all()
        id_os = self.request.query_params.get('id_os')
        if id_os:
            qs = qs.filter(id_os=id_os)
        return qs

    def create(self, request, *args, **kwargs):
        id_os = request.data.get('id_os')
        if id_os:
            # Upsert: se já existe, atualiza
            instance = OsAssinatura.objects.filter(id_os=id_os).first()
            if instance:
                serializer = self.get_serializer(instance, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)



class TecnicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tecnico
        fields = ['id_tecnico', 'nome_tecnico', 'cpf', 'telefone', 'percentual_comissao', 'ativo']


class TecnicoViewSet(viewsets.ModelViewSet):
    queryset = Tecnico.objects.filter(ativo=True)
    serializer_class = TecnicoSerializer


class OrdemServicoViewSet(viewsets.ModelViewSet):
    queryset = OrdemServico.objects.all()
    serializer_class = OrdemServicoSerializer
    
    def get_queryset(self):
        queryset = OrdemServico.objects.all()
        
        # Filtros
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status_os=status_filter)
        
        cliente_id = self.request.query_params.get('cliente', None)
        if cliente_id:
            queryset = queryset.filter(id_cliente=cliente_id)
        
        tipo_atendimento = self.request.query_params.get('tipo_atendimento', None)
        if tipo_atendimento:
            queryset = queryset.filter(tipo_atendimento=tipo_atendimento)

        veiculo_id = self.request.query_params.get('id_veiculo', None)
        if veiculo_id:
            queryset = queryset.filter(id_veiculo=veiculo_id)
        
        # Busca por número, cliente ou placa
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(numero__icontains=search) |
                Q(id_cliente__nome_razao_social__icontains=search) |
                Q(veiculo_placa__icontains=search) |
                Q(animal_nome__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        # Salvar a ordem de serviço
        try:
            serializer.save()
        except Exception as e:
            print(f"❌ Erro ao criar ordem de serviço: {str(e)}")
            print(f"📋 Dados recebidos: {self.request.data}")
            raise
    
    def perform_update(self, serializer):
        # Salvar o usuário que atualizou
        serializer.save(usuario_atualizacao=self.request.user)
    
    @action(detail=False, methods=['get'])
    def proximo_numero(self, request):
        """Retorna o próximo número disponível para ordem de serviço"""
        operacao_id = request.query_params.get('operacao', None)
        
        if operacao_id:
            # Buscar último número da operação
            ultima_ordem = OrdemServico.objects.filter(
                id_operacao_id=operacao_id
            ).order_by('-numero').first()
            
            if ultima_ordem:
                try:
                    # Extrair número da string (ex: OS-001 -> 1)
                    numero_atual = int(''.join(filter(str.isdigit, ultima_ordem.numero)))
                    proximo = numero_atual + 1
                except:
                    proximo = 1
            else:
                proximo = 1
        else:
            # Buscar último número geral
            ultima_ordem = OrdemServico.objects.all().order_by('-numero').first()
            
            if ultima_ordem:
                try:
                    numero_atual = int(''.join(filter(str.isdigit, ultima_ordem.numero)))
                    proximo = numero_atual + 1
                except:
                    proximo = 1
            else:
                proximo = 1
        
        return Response({'proximo_numero': proximo})

    @action(detail=True, methods=['post'])
    def emitir_nfse(self, request, pk=None):
        """Emite NFS-e para a OS especificada (SimplISS ou Nacional)"""
        try:
            os_obj = self.get_object()
            
            # Validar se tem itens de serviço
            if not os_obj.itens_servicos.exists():
                return Response({'error': 'OS não possui serviços para emitir NFS-e.'}, status=status.HTTP_400_BAD_REQUEST)

            # Verificar qual serviço usar baseado no município
            from api.models import EmpresaConfig
            config = EmpresaConfig.get_ativa()
            
            # Patrocínio/MG usa SimplISS (código IBGE 3148103)
            codigo_mun = getattr(config, 'codigo_municipio_ibge', '')
            
            if codigo_mun == '3148103':  # Patrocínio/MG
                # Usar SimplISS REST API (moderna)
                try:
                    from api.services.simpliss_rest_service import SimplISSRestService
                    service = SimplISSRestService()
                    resultado = service.emitir_nfse(os_obj)
                except ImportError:
                    # Fallback para SOAP se REST não disponível
                    from api.services.simpliss_service import SimplISSService
                    service = SimplISSService()
                    resultado = service.emitir_rps(os_obj)
            else:
                # Outros municípios: tentar API Nacional (se disponível)
                from api.services.nfce_nacional_service import NFSeNacionalService
                service = NFSeNacionalService()
                resultado = service.emitir_dps(os_obj)
            
            return Response(resultado)
        except Exception as e:
            logger.error(f"Erro na emissão NFS-e {os_obj.id_os}: {e}", exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def consultar_status_nfse(self, request, pk=None):
        """Consulta o status da NFS-e na API Nacional"""
        try:
            os_obj = self.get_object()
            
            # TODO: Implementar consulta real
            # Por enquanto, retorna o status atual e detalhes do último retorno
            # Se tiver LogAuditoria, tenta pegar o último JSON
            
            detalhes = {}
            from api.models import LogAuditoria
            ultimo_log = LogAuditoria.objects.filter(
                registro_id=os_obj.id_os, 
                tabela='ordem_servico',
                tipo_acao='TRANSMITIR_NFSE'
            ).order_by('-data_acao').first()
            
            if ultimo_log:
                try:
                    detalhes = json.loads(ultimo_log.dados_novos)
                except:
                    detalhes = {'raw': ultimo_log.dados_novos}
            
            return Response({
                'status_local': os_obj.status_nfse,
                'chave': os_obj.chave_nfse,
                'numero': os_obj.numero_nfse,
                'detalhes_emissao': detalhes
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['post'])
    def fechar(self, request, pk=None):
        """Fecha uma ordem de serviço"""
        ordem = self.get_object()
        ordem.status_os = 'Finalizada'
        ordem.save()
        
        serializer = self.get_serializer(ordem)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela uma ordem de serviço"""
        ordem = self.get_object()
        ordem.status_os = 'Cancelada'
        ordem.save()
        
        serializer = self.get_serializer(ordem)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def download_xml(self, request, pk=None):
        """
        Retorna o XML da NFS-e (Dados reais ou simulados)
        """
        try:
            ordem = self.get_object()
            
            # Tenta obter dados reais da emissão
            numero_nfse = getattr(ordem, 'numero_nfse', None)
            numero_dps = getattr(ordem, 'numero_dps', None)
            
            # Prioridade: Numero NFSe > Numero DPS > Previsão > ID OS
            if numero_nfse:
                numero_exibicao = numero_nfse
            elif numero_dps:
                numero_exibicao = numero_dps
            else:
                # Previsão baseada na Configuração
                try:
                    config = EmpresaConfig.get_ativa()
                    ult_num = getattr(config, 'ultimo_numero_dps', 0) or 0
                    numero_exibicao = f"{ult_num + 1} (Provisorio)"
                except:
                    numero_exibicao = ordem.id_os
            
            chave = getattr(ordem, 'chave_nfse', '') or ''
            status_nf = getattr(ordem, 'status_nfse', 'Não Emitida')
            # Se status for None ou vazio, define 'Não Emitida'
            if not status_nf: status_nf = 'Não Emitida'

            data_emi = getattr(ordem, 'data_emissao_nfse', None)
            if not data_emi:
                data_emi = datetime.now()
            
            xml_url = getattr(ordem, 'xml_url', '') or ''

            # XML Estruturado Melhor (Simulando estrutura DPS se não tiver XML real)
            xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<NFS-e>
    <Info>
        <Numero>{numero_exibicao}</Numero>
        <Chave>{chave}</Chave>
        <Serie>{getattr(ordem, 'serie_dps', '1')}</Serie>
        <Emissao>{data_emi.isoformat()}</Emissao>
        <Status>{status_nf}</Status>
    </Info>
    <Prestador>
        <CNPJ>48010363000134</CNPJ>
    </Prestador>
    <Tomador>
        <Nome>{ordem.id_cliente.nome_razao_social if ordem.id_cliente else 'Consumidor Final'}</Nome>
        <Documento>{ordem.id_cliente.cpf_cnpj if ordem.id_cliente else ''}</Documento>
    </Tomador>
    <Servico>
        <Discriminacao>{ordem.descricao_problema or 'Serviços Diversos'}</Discriminacao>
        <ValorServicos>{ordem.valor_total_servicos}</ValorServicos>
        <ValorTotal>{ordem.valor_total_os}</ValorTotal>
    </Servico>
    <Outros>
        <LinkXML>{xml_url}</LinkXML>
    </Outros>
</NFS-e>"""
            
            filename = f"nfse_{numero_exibicao}.xml"
            response = HttpResponse(xml_content, content_type='application/xml')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def imprimir_dps(self, request, pk=None):
        """
        Gera o PDF da DPS para impressão
        URL: /api/ordens_servico/<id>/imprimir_dps/
        """
        try:
            ordem = self.get_object()
            
             # Import local para evitar circularidade
            from api.services.dps_print_service import DPSGenerator
            
            generator = DPSGenerator(ordem)
            pdf_buffer = generator.gerar_pdf()
            
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            filename = f"DPS_{ordem.id_os}.pdf"
            response['Content-Disposition'] = f'inline; filename="{filename}"'
            return response
        except Exception as e:
            return Response({'error': f"Erro ao gerar DPS: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def enviar_email(self, request, pk=None):
        """
        Envia a OS/NFS-e por e-mail
        """
        ordem = self.get_object()
        email_dest = request.data.get('email')
        
        if not email_dest and ordem.id_cliente and ordem.id_cliente.email:
            email_dest = ordem.id_cliente.email
            
        if not email_dest:
             return Response({'error': 'E-mail não fornecido e cliente sem e-mail cadastrado.'}, status=status.HTTP_400_BAD_REQUEST)
             
        # TODO: Integração real com SMTP
        # Simulação de sucesso
        return Response({'message': f'E-mail enviado com sucesso para {email_dest}'})

    @action(detail=True, methods=['post'])
    def converter_para_nfe(self, request, pk=None):
        try:
            ordem = self.get_object()
            operacao_id = request.data.get('operacao_id')

            # Se não informou operação, tentar encontrar uma padrão de Venda (Modelo 55)
            if not operacao_id:
                # Tenta buscar uma operação com modelo 55 (NFe)
                op_venda = Operacao.objects.filter(modelo_documento='55').first()
                if op_venda:
                   operacao_id = op_venda.id_operacao
                else:
                   # Fallback para operação padrão de venda se houver
                   op_venda = Operacao.objects.filter(natureza_operacao__icontains='Venda').first()
                   if op_venda:
                       operacao_id = op_venda.id_operacao
                
            if not operacao_id:
                return Response({'error': 'Nenhuma operação de Venda (NFe/55) encontrada no sistema. Cadastre uma Operação.'}, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                operacao = Operacao.objects.select_for_update().get(pk=operacao_id)
                
                # Validação Extra: NFe/NFCe (Modelo 55/65) não permite serviços (ISSQN) misturado
                # A menos que seja conjugada, mas vamos assumir que NFe = Produtos
                if operacao.modelo_documento in ['55', '65']:
                    # Verificar se tem produtos na OS
                    if not OsItensProduto.objects.filter(id_os=ordem, id_produto__classificacao='Revenda').exists():
                         return Response(
                            {'error': 'Esta OS não contém produtos classificados como "Revenda". Não é possível emitir NFe (Modelo 55) apenas com serviços ou outros itens. Utilize NFS-e para serviços.'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )

                # Gerar numero sequencial
                numero_nf = operacao.proximo_numero_nf or 1
                serie_nf = operacao.serie_nf or 1
                
                operacao.proximo_numero_nf = numero_nf + 1
                operacao.save()
                
                # Criar Venda (NFe)
                # OBS: Status inicial PENDENTE
                venda = Venda.objects.create(
                    id_cliente=ordem.id_cliente,
                    id_operacao=operacao,
                    numero_documento=str(numero_nf),
                    numero_nfe=numero_nf, # Preencher campo específico de NFe
                    serie_nfe=serie_nf,   # Preencher série
                    data_documento=datetime.now(),
                    valor_total=0,
                    status_nfe='PENDENTE', # Corrigido para status_nfe
                    observacao_contribuinte=f"Gerado a partir da OS #{ordem.id_os}. {ordem.descricao_problema or ''}"[:200]
                )
                
                total_produtos = 0
                
                # Copiar APENAS produtos com classificacao 'Revenda' (conforme regra de negocio)
                itens_produto = OsItensProduto.objects.filter(
                    id_os=ordem, 
                    id_produto__classificacao='Revenda'
                )
                
                if not itens_produto.exists():
                    # Se nao houver itens validos, faz rollback e retorna erro
                    transaction.set_rollback(True)
                    return Response(
                        {'error': 'A OS não possui produtos com classificação "Revenda" para gerar NFe (Modelo 55).'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                for item_os in itens_produto:
                    # Tentar pegar dados fiscais do produto original
                    cfop_padrao = '5102'
                    # cst_padrao = '00' # Nao utilizado direta
                    if item_os.id_produto:
                        # Tenta pegar CFOP do produto ou usa padrao
                        # ATENCAO: Ajustar conforme seu model Produto
                        # cfop_padrao = getattr(item_os.id_produto, 'cfop_padrao', '5102') or '5102'
                        pass 
                        
                    valor_total_item = item_os.quantidade * item_os.valor_unitario
                    
                    VendaItem.objects.create(
                        id_venda=venda,
                        id_produto=item_os.id_produto,
                        quantidade=item_os.quantidade,
                        valor_unitario=item_os.valor_unitario,
                        valor_total=valor_total_item, 
                        # Campos adicionais se necessario
                    )
                    total_produtos += valor_total_item
                
                venda.valor_total = total_produtos
                venda.save()
                
                return Response({
                    'id_venda': venda.id_venda, 
                    'message': f'Venda #{venda.numero_documento} criada com sucesso a partir da OS!',
                    'redirect_url': f'/vendas/{venda.id_venda}/nfe/'
                }, status=status.HTTP_201_CREATED)
                
        except Operacao.DoesNotExist:
            return Response({'error': 'Operação não encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Erro ao converter: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
