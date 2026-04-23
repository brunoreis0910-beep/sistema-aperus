from decimal import Decimal, InvalidOperation
from datetime import datetime, date, timedelta
import logging

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404, render
from django.views.generic import TemplateView

from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import Venda, VendaItem, Operacao, Produto, Estoque, Deposito, FinanceiroConta, Cashback, EmpresaConfig, VendaEntregaLog
from . import finance_policies
from .services.venda_financeiro import ensure_financeiro_for_venda
from .services.nfce_service import NFCeService
from .services.nfe_service import NFeService
from .services.danfe_service import DanfeGenerator

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------------------
# Helper � Tributa��o autom�tica de item de venda
# ------------------------------------------------------------------------------

def _tributar_item(
    produto_id: int,
    empresa_id,
    uf_destino: str | None,
    tipo_operacao: str = 'INTERNA',
    tipo_cliente: str = 'TODOS',
    uf_origem: str | None = None,
    valor_unitario=0,
    quantidade=1,
):
    """
    Chama o Tributador e devolve um ResultadoTributacao ou None em caso de erro.

    Par�metros
    ----------
    produto_id   : PK do Produto
    empresa_id   : PK da EmpresaConfig (None = regime gen�rico)
    uf_destino   : UF do cliente / destinat�rio
    tipo_operacao: INTERNA | INTERESTADUAL | EXPORTACAO | ...
    tipo_cliente : TODOS | CONSUMIDOR_FINAL | REVENDEDOR
    uf_origem    : UF do emitente (extra�da de EmpresaConfig se None)
    valor_unitario, quantidade: para bases de c�lculo
    """
    try:
        from .services.tributador import Tributador
        t = Tributador(
            produto_id    = int(produto_id),
            empresa_id    = int(empresa_id) if empresa_id else None,
            uf_destino    = uf_destino,
            tipo_operacao = tipo_operacao,
            tipo_cliente  = tipo_cliente,
            uf_origem     = uf_origem,
        )
        return t.tributar(valor_unitario=valor_unitario, quantidade=quantidade)
    except Exception as exc:
        logger.warning('Tributador falhou para produto %s: %s', produto_id, exc)
        return None


def _aplicar_fiscal_em_item(venda_item: VendaItem, resultado) -> None:
    """
    Copia os campos calculados de um ResultadoTributacao para um VendaItem (sem salvar).
    Chame venda_item.save() depois.
    """
    if resultado is None:
        return
    venda_item.ncm_codigo            = resultado.ncm or ''
    venda_item.cest_codigo           = resultado.cest
    venda_item.cfop                  = resultado.cfop
    venda_item.c_benef               = resultado.c_benef
    venda_item.c_class_trib          = resultado.c_class_trib
    venda_item.nivel_tributacao      = resultado.nivel_fallback

    # ICMS
    venda_item.icms_cst_csosn        = resultado.icms_cst_csosn
    venda_item.icms_modalidade_bc    = resultado.icms_modalidade_bc
    venda_item.icms_reducao_bc_perc  = resultado.icms_reducao_bc_perc
    venda_item.icms_bc               = resultado.icms_bc
    venda_item.icms_aliq             = resultado.icms_aliq
    venda_item.valor_icms            = resultado.icms_valor

    # ICMS-ST
    venda_item.icmsst_bc             = resultado.icmsst_bc
    venda_item.icmsst_aliq           = resultado.icmsst_aliq
    venda_item.valor_icms_st         = resultado.icmsst_valor

    # PIS
    venda_item.pis_cst               = resultado.pis_cst
    venda_item.pis_aliq              = resultado.pis_aliq
    venda_item.pis_bc                = resultado.pis_bc
    venda_item.valor_pis             = resultado.pis_valor

    # COFINS
    venda_item.cofins_cst            = resultado.cofins_cst
    venda_item.cofins_aliq           = resultado.cofins_aliq
    venda_item.cofins_bc             = resultado.cofins_bc
    venda_item.valor_cofins          = resultado.cofins_valor

    # IPI
    venda_item.ipi_cst               = resultado.ipi_cst
    venda_item.ipi_aliq              = resultado.ipi_aliq
    venda_item.ipi_bc                = resultado.ipi_bc
    venda_item.valor_ipi             = resultado.ipi_valor

    # IBS / CBS / IS � Reforma 2026
    venda_item.ibs_cst               = resultado.ibs_cst
    venda_item.ibs_aliq              = resultado.ibs_aliq
    venda_item.ibs_bc                = resultado.ibs_bc
    venda_item.valor_ibs             = resultado.ibs_valor

    venda_item.cbs_cst               = resultado.cbs_cst
    venda_item.cbs_aliq              = resultado.cbs_aliq
    venda_item.cbs_bc                = resultado.cbs_bc
    venda_item.valor_cbs             = resultado.cbs_valor

    venda_item.is_aliq               = resultado.is_aliq
    venda_item.valor_is              = resultado.is_valor

    # Tipo produto e split payment
    venda_item.tipo_produto_reform   = resultado.tipo_produto_reform
    venda_item.split_payment         = resultado.split_payment

    # Totais
    venda_item.valor_total_tributos  = resultado.valor_total_tributos
    venda_item.carga_tributaria_perc = resultado.carga_tributaria_perc


def _get_contexto_fiscal(operacao, cliente, empresa_id) -> dict:
    """
    Extrai contexto fiscal (uf_destino, uf_origem, tipo_operacao, tipo_cliente)
    a partir da Opera��o, EmpresaConfig e Cliente.
    """
    # UF de origem � estado da empresa emissora
    uf_origem = None
    if empresa_id:
        try:
            empresa = EmpresaConfig.objects.get(pk=empresa_id)
            uf_origem = getattr(empresa, 'estado', None)
        except EmpresaConfig.DoesNotExist:
            pass

    # UF de destino � estado do cliente
    uf_destino = None
    if cliente:
        uf_destino = getattr(cliente, 'estado', None)

    # Tipo de opera��o � deriva do modelo de documento
    modelo_doc = getattr(operacao, 'modelo_documento', '') or ''
    if uf_origem and uf_destino and uf_origem != uf_destino:
        tipo_operacao = 'INTERESTADUAL'
    else:
        tipo_operacao = 'INTERNA'

    # Tipo de cliente � consumidor final vs. revenda
    # Empresa com CNPJ = presumidamente revendedor; CPF = consumidor final
    tipo_cliente = 'TODOS'
    if cliente:
        cpf_cnpj = getattr(cliente, 'cpf_cnpj', '') or ''
        cpf_cnpj_digits = ''.join(c for c in cpf_cnpj if c.isdigit())
        if len(cpf_cnpj_digits) == 14:  # CNPJ
            tipo_cliente = 'REVENDEDOR'
        elif len(cpf_cnpj_digits) == 11:  # CPF
            tipo_cliente = 'CONSUMIDOR_FINAL'

    return {
        'uf_origem': uf_origem,
        'uf_destino': uf_destino,
        'tipo_operacao': tipo_operacao,
        'tipo_cliente': tipo_cliente,
    }



class NFCeView(APIView):
    """
    Endpoint para emiss�o de NFC-e via ACBrMonitor.
    URL: /api/vendas/<id>/emitir_nfce/
    """
    def post(self, request, id_venda):
        venda = get_object_or_404(Venda, pk=id_venda)
        
        service = NFCeService()
        
        # OTIMIZA��O: N�o configurar ACBr antes de tentar nativo. O m�todo emitir_nfce gerencia isso.
        # service.configurar_da_empresa()
        
        # Emitir
        # O Service j� busca a configura��o da empresa se n�o passada
        result = service.emitir_nfce(venda)

        # Compatibilidade com Frontend (message vs mensagem)
        if 'mensagem' in result:
             result['message'] = result['mensagem']
        
        if result.get('sucesso'):
            return Response(result)
        else:
            return Response(result, status=400)

class CancelarNFCeView(APIView):
    """
    Endpoint para cancelar NFC-e.
    URL: /api/vendas/<id>/cancelar_nfce/
    Payload: { "justificativa": "..." }
    """
    def post(self, request, id_venda):
        venda = get_object_or_404(Venda, pk=id_venda)
        justificativa = request.data.get('justificativa', '').strip()
        
        # Validar Prazo de 30 Minutos
        if venda.data_documento:
            limite = timedelta(minutes=30)
            tempo_decorrido = timezone.now() - venda.data_documento
            
            if tempo_decorrido > limite:
                 msg = f"Prazo de cancelamento excedido (30 minutos). Tempo decorrido: {int(tempo_decorrido.total_seconds()/60)} min."
                 return Response({
                     "sucesso": False, 
                     "mensagem": msg,
                     "message": msg
                 }, status=400)
        
        if len(justificativa) < 15:
            return Response({"sucesso": False, "mensagem": "Justificativa deve ter no minimo 15 caracteres.", "message": "Justificativa deve ter no minimo 15 caracteres."}, status=400)
            
        service = NFCeService()
        result = service.cancelar_nfce(venda, justificativa)
        
        if 'mensagem' in result: result['message'] = result['mensagem']

        status_code = 200 if result.get('sucesso') else 400
        return Response(result, status=status_code)

class InutilizarNFCeView(APIView):
    """
    Endpoint para inutilizar numera��o de NFC-e.
    URL: /api/vendas/<id>/inutilizar_nfce/
    Payload: { "justificativa": "..." }
    """
    def post(self, request, id_venda):
        venda = get_object_or_404(Venda, pk=id_venda)
        justificativa = request.data.get('justificativa', '').strip()
        
        if len(justificativa) < 15:
            return Response({"sucesso": False, "mensagem": "Justificativa deve ter no minimo 15 caracteres.", "message": "Justificativa deve ter no minimo 15 caracteres."}, status=400)
            
        service = NFCeService()
        result = service.inutilizar_numeracao(venda, justificativa)
        
        if 'mensagem' in result: result['message'] = result['mensagem']

        status_code = 200 if result.get('sucesso') else 400
        return Response(result, status=status_code)

class LimparNFCeErroView(APIView):
    """
    Endpoint para limpar XML/Status de NFC-e com erro, permitindo nova tentativa ou exclus�o.
    URL: /api/vendas/<id>/limpar_nfce_erro/
    """
    def post(self, request, id_venda):
        venda = get_object_or_404(Venda, pk=id_venda)
        
        status_atual = str(venda.status_nfe or 'PENDENTE').upper()
        
        if status_atual != 'ERRO':
             return Response({
                 "sucesso": False, 
                 "mensagem": "Apenas vendas com status ERRO podem ter o XML limpo.",
                 "message": "Apenas vendas com status ERRO podem ter o XML limpo."
             }, status=400)
             
        # Limpar campos
        venda.status_nfe = 'PENDENTE'
        venda.xml_nfe = None
        venda.chave_nfe = None
        venda.protocolo_nfe = None
        venda.qrcode_nfe = None
        venda.mensagem_nfe = None
        # venda.numero_nfe = None # Opcional: manter numero se quiser tentar com mesmo numero, ou limpar se quiser novo. 
        # Geralmente se deu erro, nao consumiu numero na SEFAZ (exceto se duplicidade).
        # Manter numero � mais seguro para evitar buracos se a contagem dependesse disso, mas aqui usamos proximo_numero da operacao.
        # Melhor limpar para pegar o proximo disponivel caso o erro tenha sido duplicidade.
        venda.numero_nfe = None 
        
        venda.save()
        
        return Response({"sucesso": True, "mensagem": "XML limpo com sucesso! Status resetado para PENDENTE. Voc� pode tentar emitir novamente ou excluir a venda."})

class LimparNFeErroView(APIView):
    """
    Endpoint para limpar XML/Status de NF-e (Modelo 55) com erro.
    URL: /api/vendas/<id>/limpar_nfe_erro/
    """
    def post(self, request, id_venda):
        venda = get_object_or_404(Venda, pk=id_venda)
        
        # Validar se realmente est� com erro
        if venda.status_nfe not in ['ERRO', 'REJEITADA']:
             return Response({"sucesso": False, "mensagem": f"Venda n�o est� com erro (Status atual: {venda.status_nfe})."}, status=400)
             
        # Limpar campos
        venda.status_nfe = 'PENDENTE'
        venda.xml_nfe = None
        # Manter chave se possivel, mas limpar protocolo
        venda.protocolo_nfe = None
        venda.mensagem_nfe = None
        venda.qrcode_nfe = None
        venda.numero_nfe = None 
        
        venda.save()
        
        return Response({"sucesso": True, "mensagem": "Status de erro da NF-e limpo com sucesso. Venda agora � PENDENTE."})

class NFeView(APIView):
    """
    Endpoint para emiss�o de NFe (Modelo 55) via ACBrMonitor.
    URL: /api/vendas/<id>/emitir_nfe/
    """
    def post(self, request, id_venda):
        venda = get_object_or_404(Venda, pk=id_venda)
        
        service = NFeService()
        
        result = service.emitir_nfe(venda)
        
        if not result:
            return Response({"sucesso": False, "mensagem": "Certificado Digital não configurado.", "message": "Certificado Digital não configurado."}, status=400)

        # Compatibilidade com Frontend (message vs mensagem)
        if 'mensagem' in result:
             result['message'] = result['mensagem']

        if result.get('sucesso'):
            return Response(result)
        else:
            return Response(result, status=400)

class CancelarNFeView(APIView):
    """
    Endpoint para cancelar NFe (Modelo 55).
    URL: /api/vendas/<id>/cancelar_nfe/
    """
    def post(self, request, id_venda):
        venda = get_object_or_404(Venda, pk=id_venda)
        justificativa = request.data.get('justificativa', '').strip()
        
        if len(justificativa) < 15:
            return Response({"sucesso": False, "mensagem": "Justificativa deve ter no minimo 15 caracteres.", "message": "Justificativa deve ter no minimo 15 caracteres."}, status=400)
            
        service = NFeService()
        result = service.cancelar_nfe(venda, justificativa)
        
        if 'mensagem' in result: result['message'] = result['mensagem']

        status_code = 200 if result.get('sucesso') else 400
        return Response(result, status=status_code)

class InutilizarNFeView(APIView):
    """
    Endpoint para inutilizar numera��o de NFe (Modelo 55).
    URL: /api/vendas/<id>/inutilizar_nfe/
    """
    def post(self, request, id_venda):
        venda = get_object_or_404(Venda, pk=id_venda)
        justificativa = request.data.get('justificativa', '').strip()
        
        if len(justificativa) < 15:
            return Response({"sucesso": False, "mensagem": "Justificativa deve ter no minimo 15 caracteres.", "message": "Justificativa deve ter no minimo 15 caracteres."}, status=400)
            
        service = NFeService()
        result = service.inutilizar_numeracao(venda, justificativa)
        
        if 'mensagem' in result: result['message'] = result['mensagem']

        status_code = 200 if result.get('sucesso') else 400
        return Response(result, status=status_code)

class ImprimirDanfeNFeView(APIView):
    """
    Endpoint para gerar PDF do DANFE (NFe Modelo 55).
    URL: /api/vendas/<id>/imprimir_danfe/
    """
    permission_classes = [AllowAny] # Pode ajustar conforme necessidade
    
    def get(self, request, id_venda):
        venda = get_object_or_404(Venda, pk=id_venda)
        
        # Validar se tem NFe emitida
        if not venda.chave_nfe:
            return Response({"erro": "Venda n�o possui Chave NFe (n�o emitida ou erro)."}, status=400)
            
        try:
            generator = DanfeGenerator(venda)
            pdf_buffer = generator.gerar_pdf()
            
            from django.http import HttpResponse
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            filename = f"DANFE_{venda.numero_nfe or venda.pk}.pdf"
            response['Content-Disposition'] = f'inline; filename="{filename}"'
            return response
            
        except Exception as e:
            logger.error(f"Erro ao gerar DANFE PDF: {e}")
            return Response({"erro": f"Erro ao gerar PDF: {str(e)}"}, status=500)


class ImprimirDanfceNFCeView(APIView):
    """
    Endpoint para gerar PDF do DANFCE (NFC-e Modelo 65 - cupom fiscal 80mm).
    URL: /api/vendas/<id>/imprimir_danfce/
    """
    permission_classes = [AllowAny]

    def get(self, request, id_venda):
        try:
            venda = get_object_or_404(Venda, pk=id_venda)
            logger.info(f"Gerando DANFCE para venda ID: {id_venda}, N�mero NF-e: {venda.numero_nfe}")

            if not venda.chave_nfe:
                logger.warning(f"Venda {id_venda} n�o possui chave NFC-e")
                return Response({"erro": "Venda n�o possui Chave NFC-e (n�o emitida ou erro)."}, status=400)

            from api.services.danfe_service import DanfceGenerator
            generator = DanfceGenerator(venda)
            pdf_buffer = generator.gerar_pdf()
            logger.info(f"DANFCE gerado com sucesso para venda {id_venda}")

            from django.http import HttpResponse
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            filename = f"DANFCE_{venda.numero_nfe or venda.pk}.pdf"
            response['Content-Disposition'] = f'inline; filename="{filename}"'
            return response

        except Exception as e:
            logger.error(f"Erro ao gerar DANFCE PDF para venda {id_venda}: {e}", exc_info=True)
            return Response({"erro": f"Erro ao gerar cupom: {str(e)}"}, status=500)


class BaixarXMLVendaView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, id_venda):
        venda = get_object_or_404(Venda, pk=id_venda)
        if not venda.xml_nfe:
             return Response({"erro": "Venda sem XML gerado"}, status=404)
        
        # Limpar espa�os e poss�veis prefixos
        xml_content = venda.xml_nfe.strip()
        
        from django.http import HttpResponse
        response = HttpResponse(xml_content, content_type='application/xml')
        fname = f"{venda.chave_nfe or venda.pk}-nfce.xml"
        response['Content-Disposition'] = f'attachment; filename="{fname}"'
        return response

class BaixarLoteXMLView(APIView):
    """
    Baixa ZIP com XMLs de NFC-e com base nos filtros passados.
    QueryParams: data_inicial, data_final, status_nfe (opcional)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        import zipfile
        import io
        from django.http import HttpResponse
        
        # Filtros
        data_inicial_str = request.query_params.get('data_inicial')
        data_final_str = request.query_params.get('data_final')
        status_filter = request.query_params.get('status_nfe', 'EMITIDA')
        
        qs = Venda.objects.filter(id_operacao__modelo_documento='65')
        
        if status_filter:
            qs = qs.filter(status_nfe=status_filter)
        else:
             qs = qs.filter(status_nfe__in=['EMITIDA', 'AUTORIZADA', 'CANCELADA'])

        # Somente com XML
        qs = qs.exclude(xml_nfe__isnull=True).exclude(xml_nfe__exact='')

        # Datas
        tz = timezone.get_current_timezone()
        if data_inicial_str:
            d_ini = parse_date_flexible(data_inicial_str)
            if d_ini:
                dt_ini = timezone.make_aware(datetime(d_ini.year, d_ini.month, d_ini.day, 0, 0, 0), tz)
                qs = qs.filter(data_documento__gte=dt_ini)
        
        if data_final_str:
            d_fim = parse_date_flexible(data_final_str)
            if d_fim:
                dt_fim = timezone.make_aware(datetime(d_fim.year, d_fim.month, d_fim.day, 23, 59, 59), tz)
                qs = qs.filter(data_documento__lte=dt_fim)
                
        # Limite de processamento para evitar crash (ex: 500 ultimas)
        vendas = qs.order_by('-pk')[:500]
        
        if not vendas.exists():
            return Response({"erro": "Nenhum XML encontrado para o per�odo/filtro."}, status=404)
            
        # Criar ZIP em mem�ria
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for v in vendas:
                if not v.xml_nfe: continue
                
                # Nome do arquivo
                fname = f"{v.chave_nfe or v.pk}-nfce.xml"
                status_suffix = ""
                if v.status_nfe == 'CANCELADA':
                    status_suffix = "_CANCELADA"
                    
                fname = f"{v.chave_nfe or v.pk}{status_suffix}.xml"
                
                # Conte�do
                xml_content = v.xml_nfe.strip()
                zip_file.writestr(fname, xml_content)
        
        # Retorno
        zip_buffer.seek(0)
        data_hj = timezone.now().strftime('%Y-%m-%d')
        response = HttpResponse(zip_buffer, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="xml_nfce_{data_hj}.zip"'
        return response

class PainelXMLView(TemplateView):
    template_name = "api/lista_xml.html"
    permission_classes = [IsAuthenticated]
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Buscar ultimas 50 vendas por ID decrescente
        vendas = Venda.objects.select_related('id_cliente').order_by('-pk')[:50]
        context['vendas'] = vendas
        return context

class SalvarVendaPDVNFCeView(APIView):
    """
    Endpoint composto para o PDV Simplificado.
    Recebe um JSON com dados da venda + itens, salva tudo e dispara a emiss�o da NFC-e.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        dados_venda = data.get('venda', {})
        lista_itens = data.get('itens', [])

        if not dados_venda:
            return Response({'sucesso': False, 'mensagem': 'Dados da venda n�o fornecidos'}, status=400)
        if not lista_itens:
            return Response({'sucesso': False, 'mensagem': 'Nenhum item na venda'}, status=400)
        
        from .models import Cliente, UserParametros
        
        # 0. Busca Par�metros do Usu�rio
        user_params = None
        usuario_identificado = None
        
        # Tentar obter usu�rio de m�ltiplas fontes (prioridade: autenticado > payload)
        if request.user and request.user.is_authenticated:
            from api.utils.caixa_utils import get_operador_pdv
            # Fix: Usar get_operador_pdv para atribuir a venda ao caixa correto
            usuario_identificado = get_operador_pdv(request.user)
            # Parametros continuam sendo do usu�rio logado (Admin) para pegar configs
            user_params = UserParametros.objects.filter(id_user=request.user).first()
        else:
            # Fallback: Aceitar id_usuario no payload (importante para PDV sem token)
            id_usuario_payload = dados_venda.get('id_usuario')
            if id_usuario_payload:
                from django.contrib.auth.models import User
                usuario_payload = User.objects.filter(pk=id_usuario_payload).first()
                if usuario_payload:
                    from api.utils.caixa_utils import get_operador_pdv
                    usuario_identificado = get_operador_pdv(usuario_payload)
                    # Parametros baseados no usuario original
                    user_params = UserParametros.objects.filter(id_user=usuario_payload).first()

        # 1. Opera��o (Prioridade: Parameter NFCE > Payload > Operacao Padr�o VENDA > Primeira do Banco)
        # IMPORTANTE: Par�metro do usu�rio tem prioridade sobre payload para respeitar configura��o
        operacao = None
        operacao_origem = ""  # Para debug
        
        # Prioridade 1: Par�metro NFC-e configurado do usu�rio
        if user_params and user_params.id_operacao_nfce:
            operacao = user_params.id_operacao_nfce
            operacao_origem = f"Par�metro NFC-e do usu�rio {usuario_identificado.username if usuario_identificado else 'n�o identificado'}"
            
        # Prioridade 2: Opera��o enviada no payload (somente se n�o tiver par�metro configurado)
        if not operacao:
            id_operacao = dados_venda.get('id_operacao')
            if id_operacao:
                operacao = Operacao.objects.filter(pk=id_operacao).first()
                if operacao:
                    operacao_origem = "Payload da requisi��o"
            
        # Fallback 1: Tentar usar opera��o de venda padr�o do usu�rio
        if not operacao and user_params and user_params.id_operacao_venda:
            operacao = user_params.id_operacao_venda
            operacao_origem = "Par�metro Venda padr�o do usu�rio"
            
        # Fallback 2: Buscar primeira opera��o de VENDA no banco
        if not operacao:
            operacao = Operacao.objects.filter(transacao__icontains='VENDA').first()
            if operacao:
                operacao_origem = "Primeira opera��o VENDA do banco"
            
        # Fallback 3: Qualquer opera��o (�ltimo recurso)
        if not operacao:
            operacao = Operacao.objects.first()
            if operacao:
                operacao_origem = "Primeira opera��o do banco (qualquer)"
            
        if not operacao:
            return Response({
                'sucesso': False, 
                'mensagem': 'Nenhuma opera��o encontrada no sistema. Por favor, cadastre uma opera��o primeiro.',
                'detalhes': 'Configure em: Configura��es > Opera��es'
            }, status=400)
        
        # LOG DE DEBUG - Mostra qual opera��o foi selecionada
        print("=" * 80)
        print("?? [NFC-e] SELE��O DE OPERA��O")
        print(f"   Usu�rio: {usuario_identificado.username if usuario_identificado else 'An�nimo (sem autentica��o)'}")
        print(f"   Opera��o selecionada: {operacao.nome_operacao} (ID: {operacao.id_operacao})")
        print(f"   Origem: {operacao_origem}")
        print(f"   Payload id_operacao: {dados_venda.get('id_operacao')}")
        if user_params:
            print(f"   Par�metro id_operacao_nfce: {user_params.id_operacao_nfce.id_operacao if user_params.id_operacao_nfce else 'N�o configurado'}")
        print("=" * 80)
            
        # 2. Cliente (Prioridade: Payload > Parameter NFCE > Primeiro do Banco)
        id_cliente = dados_venda.get('id_cliente')
        cliente = None
        if id_cliente:
           cliente = Cliente.objects.filter(pk=id_cliente).first()
           
        if not cliente and user_params and user_params.id_cliente_nfce:
           cliente = user_params.id_cliente_nfce
           
        if not cliente:
            # Fallback 1: Tentar ID 8 (Consumidor Padr�o)
            cliente = Cliente.objects.filter(pk=8).first()
            
            # Fallback 2: Tentar busca por nome
            if not cliente:
                cliente = Cliente.objects.filter(nome_razao_social__icontains="CONSUMIDOR").first()
            
            # Fallback 3: Primeiro do banco (�ltimo recurso, mas perigoso se for cadastro incompleto)
            if not cliente:
                cliente = Cliente.objects.first()
           
        # 3. Vendedor (Prioridade: Payload > Parameter NFCE > Parameter Venda > None)
        # Tenta pegar do payload
        from .models import Vendedor
        vendedor = None
        id_vend_payload = dados_venda.get('id_vendedor')
        if id_vend_payload:
            vendedor = Vendedor.objects.filter(pk=id_vend_payload).first()

        # Se n�o veio no payload, tenta nos parametros do usuario
        if not vendedor and user_params:
            if user_params.id_vendedor_nfce:
                 vendedor = user_params.id_vendedor_nfce
            elif user_params.id_vendedor_venda:
                 vendedor = user_params.id_vendedor_venda
                 
        # 4. Formas de Pagamento (Suporte a m�ltiplas)
        from .models import FormaPagamento, FinanceiroConta
        list_pagamentos = dados_venda.get('formas_pagamento', [])
        
        # Fallback legacy: se n�o enviou lista, usa o id �nico
        if not list_pagamentos:
            id_forma = dados_venda.get('id_forma_pagamento')
            if id_forma:
                 list_pagamentos.append({
                     'id_forma_pagamento': id_forma,
                     'valor': dados_venda.get('valor_total')
                 })
            else:
                 # �ltimo recurso: pega a primeira do banco
                 first_fp = FormaPagamento.objects.first()
                 if first_fp:
                     list_pagamentos.append({
                         'id_forma_pagamento': first_fp.pk,
                         'valor': dados_venda.get('valor_total')
                     })

        sid = transaction.savepoint()
        try:
            # 1. Criar a Venda
            venda = Venda()
            venda.chave_nfe_referenciada = dados_venda.get('chave_nfe_referenciada')
            venda.data_emissao = timezone.now().date()
            venda.id_operacao = operacao
            venda.id_cliente = cliente
            venda.id_vendedor1 = vendedor  # Define o vendedor configurado
            venda.criado_por = usuario_identificado  # Usa o usu�rio identificado (autenticado ou do payload)
            
            # Dados fiscais basicos
            venda.cpf_cnpj = dados_venda.get('cpf_cnpj') or (cliente.cpf_cnpj if cliente else '')
            venda.nome_cliente = dados_venda.get('nome_cliente') or (cliente.nome_razao_social if cliente else '')
            
            venda.valor_total = parse_decimal_flexible(dados_venda.get('valor_total')) or Decimal('0.00')
            venda.save()

            # 2. Criar Itens
            # -- Contexto fiscal PDV --------------------------------------------
            _empresa_id_pdv = None
            try:
                from .models import EmpresaConfig
                _ecfg_pdv = EmpresaConfig.objects.filter(ativo=True).first()
                if _ecfg_pdv:
                    _empresa_id_pdv = _ecfg_pdv.pk
            except Exception:
                pass
            _ctx_pdv = _get_contexto_fiscal(operacao, cliente, _empresa_id_pdv)
            # ------------------------------------------------------------------
            for item_data in lista_itens:
                prod = Produto.objects.get(pk=item_data.get('id_produto'))
                
                v_item = VendaItem()
                v_item.id_venda = venda
                v_item.id_produto = prod
                v_item.quantidade = parse_decimal_flexible(item_data.get('quantidade'))
                v_item.valor_unitario = parse_decimal_flexible(item_data.get('preco_unitario'))
                
                # Desconto no Item
                v_item.desconto_valor = parse_decimal_flexible(item_data.get('valor_desconto')) or Decimal('0.00')

                # Lote do produto (controla_lote)
                _id_lote = item_data.get('id_lote')
                if prod.controla_lote and not _id_lote:
                    transaction.savepoint_rollback(sid)
                    return Response(
                        {'erro': f'O produto "{prod.nome_produto}" exige seleção de lote.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if _id_lote:
                    try:
                        from api.models import LoteProduto
                        _lote_obj = LoteProduto.objects.get(pk=_id_lote)
                        v_item.id_lote = _lote_obj
                        # Baixar quantidade do lote (FEFO)
                        _lote_obj.quantidade = max(Decimal('0'), _lote_obj.quantidade - v_item.quantidade)
                        _lote_obj.save()
                    except Exception as _el:
                        print(f'[LOTE] Erro associando lote {_id_lote} ao item: {_el}')
                
                # Se n�o veio subtotal, calcula (Item * Qtd - Desc)
                if item_data.get('subtotal'):
                    v_item.valor_total = parse_decimal_flexible(item_data.get('subtotal'))
                else:
                    v_item.valor_total = (v_item.quantidade * v_item.valor_unitario) - v_item.desconto_valor

                # -- Tributa��o autom�tica ---------------------------------------
                try:
                    _res_pdv = _tributar_item(
                        produto_id=prod.pk,
                        empresa_id=_empresa_id_pdv,
                        uf_destino=_ctx_pdv.get('uf_destino'),
                        tipo_operacao=_ctx_pdv.get('tipo_operacao', 'INTERNA'),
                        tipo_cliente=_ctx_pdv.get('tipo_cliente', 'TODOS'),
                        uf_origem=_ctx_pdv.get('uf_origem'),
                        valor_unitario=float(v_item.valor_unitario or 0),
                        quantidade=float(v_item.quantidade or 0),
                    )
                    _aplicar_fiscal_em_item(v_item, _res_pdv)
                except Exception as _ef_pdv:
                    print(f'[FISCAL PDV] Erro tributando item {prod.pk}: {_ef_pdv}')
                # ---------------------------------------------------------------

                v_item.save()
            
            # 2.5 Gerar Financeiro (Suporte M�ltiplos)
            if venda.valor_total > 0:
                for pag in list_pagamentos:
                    valor_pag = parse_decimal_flexible(pag.get('valor')) or Decimal('0.00')
                    if valor_pag <= 0: continue
                    
                    id_forma_pag = pag.get('id_forma_pagamento')
                    forma_pagamento = FormaPagamento.objects.filter(pk=id_forma_pag).first()
                    
                    fin = FinanceiroConta()
                    fin.tipo_conta = 'Receber' 
                    fin.id_venda_origem = venda.pk
                    
                    if forma_pagamento:
                        fin.forma_pagamento = forma_pagamento.nome_forma
                        try:
                            fin.id_forma_pagamento = forma_pagamento
                        except:
                            pass

                    fin.descricao = f"Venda NFC-e {venda.id_venda}"
                    fin.valor_total = valor_pag
                    fin.valor_parcela = valor_pag
                    fin.data_emissao = timezone.now().date()
                    
                    # Calcular Vencimento
                    from datetime import timedelta
                    dias = 0
                    if forma_pagamento and forma_pagamento.dias_vencimento:
                        dias = int(forma_pagamento.dias_vencimento)
                    
                    fin.data_vencimento = fin.data_emissao + timedelta(days=dias)

                    # Verificar baixa autom�tica: se operacao.baixa_automatica=True E data_vencimento == data_emissao
                    deve_baixar_automaticamente = operacao.baixa_automatica and (fin.data_vencimento == fin.data_emissao)
                    
                    print(f"?? [PDV-NFCe] Verificando baixa autom�tica:")
                    print(f"   Opera��o: {operacao.nome_operacao} (ID: {operacao.id_operacao})")
                    print(f"   Baixa Autom�tica: {operacao.baixa_automatica}")
                    print(f"   Data Emiss�o: {fin.data_emissao}")
                    print(f"   Data Vencimento: {fin.data_vencimento}")
                    print(f"   S�o iguais: {fin.data_vencimento == fin.data_emissao}")
                    print(f"   Deve baixar: {deve_baixar_automaticamente}")
                    
                    if deve_baixar_automaticamente:
                        # Baixa autom�tica - � vista
                        fin.status_conta = 'Paga'
                        fin.data_pagamento = fin.data_emissao
                        fin.valor_liquidado = fin.valor_parcela
                        fin.saldo_restante = Decimal('0.00')
                        print(f"? [PDV-NFCe] Aplicando baixa autom�tica")
                    else:
                        # A prazo - fica pendente
                        fin.status_conta = 'Pendente'
                        fin.saldo_restante = fin.valor_parcela
                        fin.valor_liquidado = Decimal('0.00')
                        print(f"? [PDV-NFCe] Conta a prazo - status Pendente")

                    fin.id_cliente_fornecedor = cliente
                    fin.id_operacao = operacao
                    fin.save()
                    print(f"?? [PDV-NFCe] Conta salva: {fin.id_conta} - Status: {fin.status_conta}")

                    # Gerar RecebimentoCartao somente se a forma de pagamento possui taxa de operadora
                    if forma_pagamento and forma_pagamento.taxa_operadora and forma_pagamento.taxa_operadora > 0:
                        from .models import RecebimentoCartao
                        taxa = Decimal(str(forma_pagamento.taxa_operadora or 0))
                        dias_repasse = int(forma_pagamento.dias_repasse or 1)
                        valor_bruto = fin.valor_parcela
                        valor_taxa = (valor_bruto * taxa / Decimal('100')).quantize(Decimal('0.01'))
                        valor_liquido = valor_bruto - valor_taxa
                        data_previsao = fin.data_emissao + timedelta(days=dias_repasse)
                        codigo_tpag = forma_pagamento.codigo_t_pag or '99'
                        tipo_cartao = 'DEBITO' if codigo_tpag == '04' else 'CREDITO'
                        RecebimentoCartao.objects.create(
                            id_venda=venda,
                            id_financeiro=fin,
                            data_venda=fin.data_emissao,
                            valor_bruto=valor_bruto,
                            taxa_percentual=taxa,
                            valor_taxa=valor_taxa,
                            valor_liquido=valor_liquido,
                            data_previsao=data_previsao,
                            bandeira=forma_pagamento.nome_forma,
                            tipo_cartao=tipo_cartao,
                            status='PENDENTE',
                        )
                        print(f"?? [PDV-NFCe] RecebimentoCartao gerado: {forma_pagamento.nome_forma} - R${valor_bruto} (taxa {taxa}%)")

            # 3. Tenta Emitir NFC-e
            service = NFCeService()
            # OTIMIZA��O: N�o configurar ACBr antes de tentar nativo. O m�todo emitir_nfce gerencia isso.
            # service.configurar_da_empresa() 
            result = service.emitir_nfce(venda)
            
            # Adicionar informa��es da opera��o, vendedor e cliente para exibir na tela do PDV
            result['dados_venda'] = {
                'operacao': {
                    'id': operacao.id_operacao,
                    'nome': operacao.nome_operacao,
                    'abreviacao': operacao.abreviacao if operacao.abreviacao else operacao.nome_operacao[:4].upper()
                },
                'cliente': {
                    'id': cliente.id_cliente,
                    'nome': cliente.nome_razao_social,
                    'cpf_cnpj': cliente.cpf_cnpj if cliente.cpf_cnpj else ''
                } if cliente else None,
                'vendedor': {
                    'id': vendedor.id_vendedor,
                    'nome': vendedor.nome  # Campo correto � 'nome', n�o 'nome_vendedor'
                } if vendedor else None,
                'usuario': {
                    'id': usuario_identificado.id,
                    'username': usuario_identificado.username
                } if usuario_identificado else None
            }
            
            if not result.get('sucesso'):
                # Tratativa de Conting�ncia / Erro ACBr
                # Se falhar a emiss�o (ACBr desligado, Internet off), salvamos a venda assim mesmo
                # para n�o bloquear a opera��o da loja.
                
                # Commitamos a venda (j� salva como 'PENDENTE' ou 'ERRO' no status_nfe pelo service)
                transaction.savepoint_commit(sid)
                
                # Ajustamos a mensagem para o Front avisar o usu�rio mas dar sucesso na venda
                result['sucesso'] = True 
                result['mensagem'] = f"Venda REALIZADA (Offline). Erro na emiss�o: {result.get('mensagem')}"
                result['venda_offline'] = True
                
                return Response(result, status=200)
            
            transaction.savepoint_commit(sid)
            return Response(result, status=200)

        except Exception as e:
            transaction.savepoint_rollback(sid)
            logging.exception("Erro ao salvar PDV NFC-e")
            return Response({'sucesso': False, 'mensagem': str(e)}, status=500)

# Helpers flex?veis para parsing
def parse_date_flexible(value):
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if not isinstance(value, str):
        return None
    s = value.strip()
    if not s:
        return None
    # tenta ISO
    try:
        return datetime.fromisoformat(s[:10]).date()
    except Exception:
        pass
    # tenta dd/mm/YYYY
    try:
        return datetime.strptime(s[:10], "%d/%m/%Y").date()
    except Exception:
        pass
    # outros formatos comuns
    fmts = ["%Y/%m/%d", "%d-%m-%Y", "%Y.%m.%d"]
    for fmt in fmts:
        try:
            return datetime.strptime(s[:10], fmt).date()
        except Exception:
            pass
    return None


def parse_decimal_flexible(value):
    if value is None:
        return None
    if isinstance(value, Decimal):
        return value
    if isinstance(value, (int, float)):
        try:
            return Decimal(str(value))
        except Exception:
            return None
    s = str(value).strip()
    if not s:
        return None
    s = s.replace(" ", "")
    # transforma formatos como 1.234,56 -> 1234.56
    if s.count(",") == 1 and s.count(".") >= 1:
        s = s.replace(".", "")
        s = s.replace(",", ".")
    else:
        if s.count(",") == 1 and s.count(".") == 0:
            s = s.replace(",", ".")
        if s.count(".") > 1 and s.count(",") == 0:
            s = s.replace(".", "")
    try:
        return Decimal(s)
    except (InvalidOperation, Exception):
        return None


def _parse_bool_flag(value):
    """Normaliza diferentes representa??es para boolean.

    Aceita: True/False, 'true'/'false', '1'/'0', 1/0, ''/None.
    Sempre retorna um boolean.
    """
    try:
        if value is None:
            return False
        # booleans s?o subclasses de int, tratar primeiro
        if isinstance(value, bool):
            return value
        if isinstance(value, (int,)):
            return bool(value)
        if isinstance(value, str):
            s = value.strip().lower()
            if s == '':
                return False
            if s in ('1', 'true', 't', 'yes', 'y'):
                return True
            if s in ('0', 'false', 'f', 'no', 'n'):
                return False
            # tente converter para int/float como fallback
            try:
                return bool(int(s))
            except Exception:
                try:
                    return bool(float(s))
                except Exception:
                    return False
        # outros tipos (ex: Decimal) -> truthiness
        return bool(value)
    except Exception:
        return False


class ListarVendasPDVNFCeView(APIView):
    """
    Endpoint para listar vendas NFCe no PDV (sem autentica��o)
    Retorna apenas vendas com NFCe emitida
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, venda_id=None):
        try:
            # Se tem ID, retorna uma venda espec�fica
            if venda_id:
                try:
                    venda = Venda.objects.select_related('id_cliente', 'id_operacao').prefetch_related('itens__id_produto').get(pk=venda_id)
                    
                    # Montar resposta com dados completos
                    itens_list = list(venda.itens.all())
                    produto_ids = [item.id_produto.pk for item in itens_list if item.id_produto]
                    estoque_map = {}
                    for est in Estoque.objects.filter(id_produto__in=produto_ids).order_by('id_produto_id', '-data_modificacao'):
                        if est.id_produto_id not in estoque_map:
                            estoque_map[est.id_produto_id] = est
                    itens_data = []
                    for item in itens_list:
                        produto = item.id_produto
                        est = estoque_map.get(produto.pk) if produto else None
                        custo = 0.0
                        if est:
                            custo = float(est.custo_medio or 0)
                            if custo == 0:
                                custo = float(est.valor_ultima_compra or 0)
                        itens_data.append({
                            'id': item.pk,
                            'id_produto': produto.pk if produto else None,
                            'produto_codigo': produto.codigo_produto if produto else '',
                            'codigo_produto': produto.codigo_produto if produto else '',
                            'produto_nome': produto.nome_produto if produto else '',
                            'nome_produto': produto.nome_produto if produto else '',
                            'quantidade': float(item.quantidade),
                            'valor_unitario': float(item.valor_unitario),
                            'preco_unitario': float(item.valor_unitario),
                            'valor_total': float(item.valor_total),
                            'subtotal': float(item.valor_total),
                            'custo_unitario': custo
                        })
                    
                    # Verificar se pode editar
                    status_venda_original = venda.status_nfe or 'PENDENTE'
                    status_venda_upper = status_venda_original.upper()
                    pode_editar = status_venda_upper not in ['AUTORIZADO', 'AUTORIZADA', 'APROVADO', 'EMITIDA']
                    if venda.chave_nfe:
                        pode_editar = False
                    
                    venda_dict = {
                        'id_venda': venda.pk,
                        'numero_venda': venda.numero_nfe or venda.numero_documento or str(venda.pk),
                        'data_emissao': venda.data_documento.isoformat() if venda.data_documento else None,
                        'valor_total': float(venda.valor_total),
                        'id_cliente': venda.id_cliente.pk if venda.id_cliente else None,
                        'nome_cliente': venda.id_cliente.nome_razao_social if venda.id_cliente else '',
                        'cpf_cnpj': venda.id_cliente.cpf_cnpj if venda.id_cliente else '',
                        'status': status_venda_original,
                        'status_nfe': status_venda_original,
                        'numero_nfe': venda.numero_nfe,
                        'serie_nfe': venda.serie_nfe,
                        'chave_nfe': venda.chave_nfe,
                        'protocolo_nfe': venda.protocolo_nfe,
                        'qrcode_nfe': getattr(venda, 'qrcode_nfe', '') or '',
                        'mensagem_nfe': getattr(venda, 'mensagem_nfe', '') or '',
                        'tem_xml': True if venda.xml_nfe else False,
                        'pode_editar': pode_editar,
                        'itens': itens_data
                    }
                    
                    # Se n�o tem QR Code mas tem chave, gerar QR Code
                    if not venda_dict['qrcode_nfe'] and venda_dict['chave_nfe']:
                        try:
                            from api.utils.qrcode_generator import gerar_qrcode_nfce
                            qrcode = gerar_qrcode_nfce(venda_dict['chave_nfe'])
                            if qrcode:
                                venda_dict['qrcode_nfe'] = qrcode
                                # Salvar no banco para pr�xima vez
                                venda.qrcode_nfe = qrcode
                                venda.save(update_fields=['qrcode_nfe'])
                        except Exception as e:
                            logger.warning(f"Erro ao gerar QR Code para venda {venda.pk}: {e}")
                    
                    return Response(venda_dict)
                    
                except Venda.DoesNotExist:
                    return Response({'erro': 'Venda n�o encontrada'}, status=404)
            
            # Listagem OTIMIZADA
            # Adicionar select_related para vendedores e melhorar performance
            vendas_qs = Venda.objects.select_related(
                'id_cliente', 
                'id_operacao',
                'id_vendedor1',
                'id_vendedor2'
            ).order_by('-pk')
            
            # Filtros
            search = request.query_params.get('search', '')
            if search:
                vendas_qs = vendas_qs.filter(
                    Q(numero_documento__icontains=search) |
                    Q(id_cliente__nome_razao_social__icontains=search) |
                    Q(chave_nfe__icontains=search) |
                    Q(numero_nfe__icontains=search)
                )

            # Filtro por modelo de documento (Ex: 65 para NFC-e)
            modelo = request.query_params.get('modelo')
            if modelo:
                vendas_qs = vendas_qs.filter(id_operacao__modelo_documento=modelo)
            
            # Filtro por status NFC-e
            status_filtro = request.query_params.get('status') or request.query_params.get('status_nfe')
            if status_filtro:
                vendas_qs = vendas_qs.filter(status_nfe=status_filtro)
            
            # Filtro por opera��o
            id_op = request.query_params.get('id_operacao')
            if id_op:
                vendas_qs = vendas_qs.filter(id_operacao__pk=id_op)
            
            # Ordena��o
            ordering = request.query_params.get('ordering', '-pk')
            # Mapear id_venda para pk
            if ordering == '-id_venda' or ordering == 'id_venda':
                ordering = ordering.replace('id_venda', 'pk')
            
            if ordering:
                try:
                    vendas_qs = vendas_qs.order_by(ordering)
                except Exception:
                    vendas_qs = vendas_qs.order_by('-pk')
            
            # Pagina��o OTIMIZADA - reduzido para 25 vendas por padr�o
            try:
                page_size = int(request.query_params.get('page_size', 25))
                # Limitar m�ximo para evitar sobrecarga
                page_size = min(page_size, 100)
            except:
                page_size = 25
            
            # Se n�o houver filtros, mostrar apenas �ltimos 30 dias por padr�o
            if not any([search, modelo, status_filtro, id_op]):
                from datetime import datetime, timedelta
                data_limite = datetime.now() - timedelta(days=30)
                vendas_qs = vendas_qs.filter(data_documento__gte=data_limite)
            
            vendas_qs = vendas_qs[:page_size]
            
            # Serializar
            vendas_list = []
            for venda in vendas_qs:
                modelo_documento = None
                id_operacao = None
                if venda.id_operacao:
                    modelo_documento = venda.id_operacao.modelo_documento
                    id_operacao = venda.id_operacao.pk
                
                # Verificar se pode editar
                status_venda_original = venda.status_nfe or 'PENDENTE'
                status_venda_upper = status_venda_original.upper()
                pode_editar = status_venda_upper not in ['AUTORIZADO', 'AUTORIZADA', 'APROVADO', 'EMITIDA']
                if venda.chave_nfe:
                    pode_editar = False

                vendas_list.append({
                    'id_venda': venda.pk,
                    'id': venda.pk,
                    'numero_venda': venda.numero_nfe or venda.numero_documento or str(venda.pk),
                    'data_emissao': venda.data_documento.isoformat() if venda.data_documento else None,
                    'valor_total': float(venda.valor_total),
                    'id_cliente': venda.id_cliente.pk if venda.id_cliente else None,
                    'nome_cliente': venda.id_cliente.nome_razao_social if venda.id_cliente else '',
                    'cpf_cnpj': venda.id_cliente.cpf_cnpj if venda.id_cliente else '',
                    'email_cliente': venda.id_cliente.email if venda.id_cliente and venda.id_cliente.email else '',
                    'status': status_venda_original,
                    'status_nfe': status_venda_original,
                    'numero_nfe': venda.numero_nfe,
                    'serie_nfe': venda.serie_nfe,
                    'chave_nfe': venda.chave_nfe,
                    'protocolo_nfe': venda.protocolo_nfe,
                    'mensagem_nfe': getattr(venda, 'mensagem_nfe', '') or '',
                    'modelo_documento': modelo_documento,
                    'id_operacao': id_operacao,
                    'tem_xml': True if venda.xml_nfe else False,
                    'pode_editar': pode_editar
                })
            
            return Response({'results': vendas_list, 'count': len(vendas_list)})
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'erro': str(e)}, status=500)


class VendaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, venda_id=None):
        """
        Se venda_id for fornecido, retorna detalhes de uma venda espec�fica.
        Caso contr�rio, listagem com filtros e pagina��o simples.

        Query params suportados (para listagem):
        - page, page_size
        - date_from, date_to (aceita dd/mm/YYYY e ISO)
        - id_cliente, id_vendedor
        - numero_documento
        - valor_min, valor_max
        - search (cliente ou produto)
        """

        # Se venda_id foi fornecido, buscar venda espec�fica
        if venda_id is not None:
            try:
                venda = Venda.objects.select_related(
                    'id_cliente', 'id_vendedor1', 'id_vendedor2', 'id_operacao'
                ).prefetch_related('itens').get(pk=venda_id)
                
                # Montar resposta manualmente com dados completos dos produtos
                itens_data = []
                for item in venda.itens.all():
                    produto = item.id_produto
                    item_dict = {
                        'id': item.pk,
                        'id_produto': produto.pk if produto else None,
                        'produto_id': produto.pk if produto else None,
                        'produto': produto.nome_produto if produto else 'Produto n�o identificado',
                        'produto_nome': produto.nome_produto if produto else 'Produto n�o identificado',
                        'nome_produto': produto.nome_produto if produto else 'Produto n�o identificado',
                        'codigo_produto': produto.codigo_produto if produto else '',
                        'codigo': produto.codigo_produto if produto else '',
                        'marca_produto': produto.marca if produto else '',
                        'marca': produto.marca if produto else '',
                        'imagem_url': produto.imagem_url if produto and produto.imagem_url else None,
                        'imagem': produto.imagem_url if produto and produto.imagem_url else None,
                        'metragem_caixa': str(produto.metragem_caixa) if produto and hasattr(produto, 'metragem_caixa') and produto.metragem_caixa else None,
                        'unidade_medida': produto.unidade_medida if produto and hasattr(produto, 'unidade_medida') else '',
                        'rendimento_m2': str(produto.rendimento_m2) if produto and hasattr(produto, 'rendimento_m2') and produto.rendimento_m2 else None,
                        'quantidade': str(item.quantidade),
                        'quantidade_entregue': str(item.quantidade_entregue) if hasattr(item, 'quantidade_entregue') else '0.000',
                        'valor_unitario': str(item.valor_unitario),
                        'valor_total': str(item.valor_total),
                        'subtotal': str(item.valor_total),
                        'desconto_valor': str(item.desconto_valor) if item.desconto_valor else '0.00',
                        'desconto': str(item.desconto_valor) if item.desconto_valor else '0.00',
                        # -- Campos Fiscais ------------------------------------
                        'ncm_codigo': item.ncm_codigo or '',
                        'cest_codigo': item.cest_codigo or '',
                        'cfop': item.cfop or '',
                        'c_benef': item.c_benef or '',
                        'nivel_tributacao': item.nivel_tributacao,
                        # ICMS
                        'icms_cst_csosn': item.icms_cst_csosn or '',
                        'icms_modalidade_bc': item.icms_modalidade_bc or '',
                        'icms_reducao_bc_perc': str(item.icms_reducao_bc_perc or 0),
                        'icms_bc': str(item.icms_bc or 0),
                        'icms_aliq': str(item.icms_aliq or 0),
                        'valor_icms': str(item.valor_icms or 0),
                        # ICMS-ST
                        'icmsst_bc': str(item.icmsst_bc or 0),
                        'icmsst_aliq': str(item.icmsst_aliq or 0),
                        'valor_icms_st': str(item.valor_icms_st or 0),
                        # PIS
                        'pis_cst': item.pis_cst or '',
                        'pis_aliq': str(item.pis_aliq or 0),
                        'pis_bc': str(item.pis_bc or 0),
                        'valor_pis': str(item.valor_pis or 0),
                        # COFINS
                        'cofins_cst': item.cofins_cst or '',
                        'cofins_aliq': str(item.cofins_aliq or 0),
                        'cofins_bc': str(item.cofins_bc or 0),
                        'valor_cofins': str(item.valor_cofins or 0),
                        # IPI
                        'ipi_cst': item.ipi_cst or '',
                        'ipi_aliq': str(item.ipi_aliq or 0),
                        'ipi_bc': str(item.ipi_bc or 0),
                        'valor_ipi': str(item.valor_ipi or 0),
                        # IBS (Reforma)
                        'ibs_cst': item.ibs_cst or '',
                        'ibs_aliq': str(item.ibs_aliq or 0),
                        'ibs_bc': str(item.ibs_bc or 0),
                        'valor_ibs': str(item.valor_ibs or 0),
                        # CBS (Reforma)
                        'cbs_cst': item.cbs_cst or '',
                        'cbs_aliq': str(item.cbs_aliq or 0),
                        'cbs_bc': str(item.cbs_bc or 0),
                        'valor_cbs': str(item.valor_cbs or 0),
                        # IS (Reforma)
                        'is_aliq': str(item.is_aliq or 0),
                        'valor_is': str(item.valor_is or 0),
                        # Reforma metadata
                        'tipo_produto_reform': item.tipo_produto_reform or '',
                        'split_payment': item.split_payment or False,
                        # Totais tribut�rios
                        'valor_total_tributos': str(item.valor_total_tributos or 0),
                        'carga_tributaria_perc': str(item.carga_tributaria_perc or 0),
                        # -----------------------------------------------------
                    }
                    itens_data.append(item_dict)
                
                # Buscar informa��es de pagamento no financeiro
                financeiro_qs = FinanceiroConta.objects.filter(id_venda_origem=venda.pk)
                pagamentos_data = []
                for fin in financeiro_qs:
                    pagamentos_data.append({
                        'id_forma_pagamento': None,  # FinanceiroConta usa CharField, não FK
                        'nome_forma_pagamento': fin.forma_pagamento,
                        'valor': str(fin.valor_parcela)
                    })

                financeiro = financeiro_qs.first()
                forma_pagamento = financeiro.forma_pagamento if financeiro else None
                num_parcelas = financeiro.parcela_total if financeiro else None
                
                # Serializar opera��o completa com empresa aninhada
                operacao_data = None
                if venda.id_operacao:
                    # Buscar dados da empresa da opera��o
                    empresa_data = None
                    if venda.id_operacao.empresa:
                        try:
                            from api.models import EmpresaConfig
                            empresa = EmpresaConfig.objects.get(pk=venda.id_operacao.empresa)
                            empresa_data = {
                                'id_empresa': empresa.pk,
                                'nome_razao_social': empresa.nome_razao_social,
                                'nome_fantasia': empresa.nome_fantasia,
                                'cnpj': empresa.cnpj if hasattr(empresa, 'cnpj') else None,
                                'inscricao_estadual': empresa.inscricao_estadual if hasattr(empresa, 'inscricao_estadual') else None,
                                'endereco': empresa.endereco if hasattr(empresa, 'endereco') else None,
                                'numero': empresa.numero if hasattr(empresa, 'numero') else None,
                                'bairro': empresa.bairro if hasattr(empresa, 'bairro') else None,
                                'cidade': empresa.cidade if hasattr(empresa, 'cidade') else None,
                                'estado': empresa.estado if hasattr(empresa, 'estado') else None,
                                'cep': empresa.cep if hasattr(empresa, 'cep') else None,
                                'telefone': empresa.telefone if hasattr(empresa, 'telefone') else None,
                                'email': empresa.email if hasattr(empresa, 'email') else None,
                                'logo_url': empresa.logo_url if hasattr(empresa, 'logo_url') else None,
                            }
                        except Exception as e:
                            print(f"Erro ao buscar empresa: {e}")
                    
                    operacao_data = {
                        'id_operacao': venda.id_operacao.pk,
                        'nome_operacao': venda.id_operacao.nome_operacao,
                        'modelo_documento': venda.id_operacao.modelo_documento if hasattr(venda.id_operacao, 'modelo_documento') else None,
                        'gera_financeiro': venda.id_operacao.gera_financeiro if hasattr(venda.id_operacao, 'gera_financeiro') else 0,
                        'empresa': empresa_data,  # Dados completos da empresa (pode ser None)
                    }
                
                response_data = {
                    'id': venda.pk,
                    'numero_documento': venda.numero_documento or str(venda.pk),
                    'data': venda.data_documento.isoformat() if venda.data_documento else None,
                    'data_venda': venda.data_documento.isoformat() if venda.data_documento else None,
                    'data_documento': venda.data_documento.isoformat() if venda.data_documento else None,
                    'id_cliente': venda.id_cliente.pk if venda.id_cliente else None,
                    'cliente': venda.id_cliente.nome_razao_social if venda.id_cliente else '',
                    'nome_cliente': venda.id_cliente.nome_razao_social if venda.id_cliente else '',
                    'email_cliente': venda.id_cliente.email if venda.id_cliente and venda.id_cliente.email else '',
                    'whatsapp_cliente': venda.id_cliente.whatsapp if venda.id_cliente else '',
                    'telefone_cliente': venda.id_cliente.telefone if venda.id_cliente else '',
                    'telefone_celular': venda.id_cliente.telefone if venda.id_cliente else '',
                    'telefone': venda.id_cliente.telefone if venda.id_cliente else '',
                    'id_vendedor': venda.id_vendedor1.pk if venda.id_vendedor1 else None,
                    'vendedor': venda.id_vendedor1.nome if venda.id_vendedor1 else '',
                    'nome_vendedor': venda.id_vendedor1.nome if venda.id_vendedor1 else '',
                    'id_operacao': venda.id_operacao.pk if venda.id_operacao else None,
                    'operacao': operacao_data,  # Agora retorna objeto completo com empresa
                    'valor_total': str(venda.valor_total),
                    'forma_pagamento': forma_pagamento,
                    'pagamentos': pagamentos_data, # Lista detalhada
                    'num_parcelas': num_parcelas,
                    'venda_futura_origem': venda.venda_futura_origem.pk if venda.venda_futura_origem else None,
                    'venda_futura_destino': venda.venda_futura_destino.pk if venda.venda_futura_destino else None,
                    'itens': itens_data,
                    'gerou_financeiro': venda.gerou_financeiro if hasattr(venda, 'gerou_financeiro') else False,
                    # Transporte NF-e
                    'tipo_frete': venda.tipo_frete if venda.tipo_frete is not None else 9,
                    'id_transportadora': getattr(venda, 'transportadora_id', None),
                    'placa_veiculo': venda.placa_veiculo or '',
                    'uf_veiculo': venda.uf_veiculo or '',
                    'rntrc': venda.rntrc or '',
                    'quantidade_volumes': venda.quantidade_volumes or 0,
                    'especie_volumes': venda.especie_volumes or '',
                    'marca_volumes': venda.marca_volumes or '',
                    'peso_liquido': str(venda.peso_liquido or 0),
                    'peso_bruto': str(venda.peso_bruto or 0),
                    'observacao_fisco': venda.observacao_fisco or '',
                    'observacao_contribuinte': venda.observacao_contribuinte or '',
                    'chave_nfe_referenciada': venda.chave_nfe_referenciada or '',
                }
                
                # DEBUG: Verificar o que est� sendo enviado
                print(f"\n?? DEBUG - Venda {venda.pk}:")
                print(f"  - operacao_data: {operacao_data}")
                print(f"  - Campo 'operacao' no response: {'operacao' in response_data}")
                print(f"  - Valor do campo 'operacao': {response_data.get('operacao')}")
                
                return Response(response_data, status=status.HTTP_200_OK)
            except Venda.DoesNotExist:
                return Response(
                    {'detail': 'Venda n�o encontrada.'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # LISTAGEM OTIMIZADA: usar select_related completo para evitar queries extras
        qs = Venda.objects.select_related(
            'id_cliente', 
            'id_operacao',
            'id_vendedor1',
            'id_vendedor2'
        ).prefetch_related('itens', 'itens__id_produto')

        # filtros
        date_from_str = (request.GET.get('date_from') or request.GET.get('data_inicial')
                         or request.GET.get('data_venda__gte') or request.GET.get('data_venda'))
        date_to_str = (request.GET.get('date_to') or request.GET.get('data_final')
                       or request.GET.get('data_venda__lte') or request.GET.get('data_venda'))
        cliente = request.GET.get('id_cliente')
        vendedor = request.GET.get('id_vendedor')
        numero = request.GET.get('numero_documento')
        valor_min_str = request.GET.get('valor_min')
        valor_max_str = request.GET.get('valor_max')
        search = request.GET.get('search')

        # aplicar filtros de datas
        tz = timezone.get_current_timezone()
        start_date = parse_date_flexible(date_from_str)
        end_date = parse_date_flexible(date_to_str)
        if start_date:
            start_dt = timezone.make_aware(datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0), tz)
            qs = qs.filter(data_documento__gte=start_dt)
        if end_date:
            end_dt = timezone.make_aware(datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59, 999999), tz)
            qs = qs.filter(data_documento__lte=end_dt)

        if cliente:
            qs = qs.filter(id_cliente_id=cliente)
        if vendedor:
            # aceitar vendedor em qualquer um dos campos legados
            qs = qs.filter(Q(id_vendedor1_id=vendedor) | Q(id_vendedor2_id=vendedor))
        if numero:
            qs = qs.filter(numero_documento__icontains=numero)

        # valores
        vmin = parse_decimal_flexible(valor_min_str)
        if vmin is not None:
            qs = qs.filter(valor_total__gte=vmin)
        vmax = parse_decimal_flexible(valor_max_str)
        if vmax is not None:
            qs = qs.filter(valor_total__lte=vmax)

        # Filtro por modelo de documento (Ex: 55=NF-e, 65=NFC-e)
        modelo = request.GET.get('modelo')
        if modelo:
            qs = qs.filter(id_operacao__modelo_documento=modelo)
        elif not cliente:
            # Sem filtro de cliente específico: excluir NF-e (modelo 55) da listagem padrão
            # Quando filtrando por cliente (ficha do cliente), mostrar todos os modelos
            qs = qs.exclude(id_operacao__modelo_documento='55')
        
        # Filtro por status NFC-e/NF-e
        status_filtro = request.GET.get('status') or request.GET.get('status_nfe')
        if status_filtro:
            qs = qs.filter(status_nfe=status_filtro)

        # busca por cliente/produto
        if search:
            # rela??o reverse para itens no modelo ? 'itens'
            qs = qs.filter(
                Q(id_cliente__nome_razao_social__icontains=search) |
                Q(itens__id_produto__nome_produto__icontains=search)
            ).distinct()

        # Pagina��o OTIMIZADA
        try:
            page = max(1, int(request.GET.get('page', '1')))
        except Exception:
            page = 1
        try:
            page_size = min(5000, max(1, int(request.GET.get('page_size', '25'))))
        except Exception:
            page_size = 25
        
        # Se houver filtro de data explícito, usar; senão aplicar limite de 30 dias
        has_date_filter = any([date_from_str, date_to_str])
        has_other_filter = any([search, cliente, vendedor, numero])
        sem_limite = request.GET.get('sem_limite')
        if not has_date_filter and not has_other_filter and not sem_limite:
            data_limite = datetime.now() - timedelta(days=30)
            qs = qs.filter(data_documento__gte=data_limite)
        offset = (page - 1) * page_size
        limit = offset + page_size

        total = qs.count()
        vendas = qs.order_by('-id_venda')[offset:limit]

        # serializar manualmente para evitar dependencias de serializers inexistentes
        items_out = []
        for v in vendas:
            try:
                venda_pk = getattr(v, 'pk', getattr(v, 'id_venda', getattr(v, 'id', None)))
                
                # Itens (Try catch interno para n�o quebrar a venda toda se falhar os itens)
                itens_list = []
                try:
                    # Usar filtro direto para evitar problemas com select_related
                    # itens_qs = VendaItem.objects.filter(id_venda=v) 
                    itens_qs = v.itens.all()
                    
                    for idx, it in enumerate(itens_qs):
                        item_pk = getattr(it, 'pk', None) or f"{venda_pk}-{idx}"
                        prod = getattr(it, 'id_produto', None)
                        
                        itens_list.append({
                            'id': item_pk,
                            'produto_id': prod.pk if prod else None,
                            'produto_nome': prod.nome_produto if prod else 'Produto Removido',
                            'quantidade': str(getattr(it, 'quantidade', '0')),
                            'valor_unitario': str(getattr(it, 'valor_unitario', '0')),
                            'valor_total': str(getattr(it, 'valor_total', '0')),
                            'quantidade_entregue': str(getattr(it, 'quantidade_entregue', '0.000')),
                        })
                except Exception as e_itens:
                    print(f"Erro ao serializar itens da venda {venda_pk}: {e_itens}")

                # Cliente Seguro
                cliente_nome = "Consumidor Final"
                cliente_id = None
                try:
                    # Tenta acessar. Se id_cliente for invalido, pode dar erro ao carregar
                    if v.id_cliente_id: # Checa ID cru primeiro
                        if v.id_cliente:
                            cliente_nome = v.id_cliente.nome_razao_social
                            cliente_id = v.id_cliente.pk
                except Exception:
                    cliente_nome = "Cliente Indispon�vel"

                # Vendedor Seguro
                vendedor_nome = "-"
                vendedor_id = None
                try:
                    # Tenta carregar vendedores de forma segura
                    v1_id = v.id_vendedor1
                    
                    if v1_id:
                         vendedor_nome = v1_id.nome
                         vendedor_id = v1_id.pk
                    else:
                        v2_id = v.id_vendedor2
                        if v2_id:
                             vendedor_nome = v2_id.nome
                             vendedor_id = v2_id.pk
                except Exception:
                    pass

                # Operacao Seguro
                operacao_nome = "Venda"
                operacao_id = None
                operacao_modelo = None
                try:
                    if v.id_operacao_id:
                         if v.id_operacao:
                            operacao_nome = v.id_operacao.nome_operacao
                            operacao_id = v.id_operacao.pk
                            operacao_modelo = v.id_operacao.modelo_documento
                except Exception:
                    pass

                # Verificar se pode editar (n�o pode editar cupons autorizados)
                status_venda_original = getattr(v, 'status_nfe', '') or 'PENDENTE'
                status_venda_upper = status_venda_original.upper()
                pode_editar = status_venda_upper not in ['AUTORIZADO', 'AUTORIZADA', 'APROVADO', 'EMITIDA']
                # Se tiver chave NFe, tamb�m bloqueia edi��o
                if getattr(v, 'chave_nfe', ''):
                    pode_editar = False
                
                items_out.append({
                    'id': venda_pk,
                    'data': v.data_documento.isoformat() if v.data_documento else None,
                    'data_venda': v.data_documento.isoformat() if v.data_documento else None,
                    'data_documento': v.data_documento.isoformat() if v.data_documento else None,
                    
                    'cliente': cliente_nome,
                    'nome_cliente': cliente_nome,
                    'id_cliente': cliente_id,
                    'email_cliente': v.id_cliente.email if v.id_cliente and v.id_cliente.email else '',
                    'whatsapp_cliente': v.id_cliente.whatsapp if v.id_cliente else '',
                    'telefone_cliente': v.id_cliente.telefone if v.id_cliente else '',
                    'telefone_celular': v.id_cliente.telefone if v.id_cliente else '',
                    'telefone': v.id_cliente.telefone if v.id_cliente else '',
                    
                    'vendedor': vendedor_nome,
                    'nome_vendedor': vendedor_nome,
                    'id_vendedor': vendedor_id,
                    
                    'operacao': operacao_nome,
                    'nome_operacao': operacao_nome,
                    'id_operacao': operacao_id,
                    'modelo_documento': operacao_modelo,

                    'numero_documento': getattr(v, 'numero_nfe', None) or v.numero_documento or str(venda_pk),
                    'status': status_venda_original,  # Status leg�vel
                    'status_nfe': status_venda_original,  # Status NFCe/NFe
                    'numero_nfe': getattr(v, 'numero_nfe', None),
                    'serie_nfe': getattr(v, 'serie_nfe', None),
                    'chave_nfe': getattr(v, 'chave_nfe', '') or '',
                    'xml_nfe': getattr(v, 'xml_nfe', '') or '', # Mantido para compatibilidade
                    'tem_xml': True if getattr(v, 'xml_nfe', '') else False, # Campo helper para frontend
                    'qrcode_nfe': getattr(v, 'qrcode_nfe', '') or '',
                    'mensagem_nfe': getattr(v, 'mensagem_nfe', '') or '', # Mensagem de erro/status
                    'pode_editar': pode_editar, # N�o permite editar cupons autorizados

                    'valor_total': float(v.valor_total or 0),
                    'taxa_entrega': str(v.taxa_entrega or 0),
                    
                    'itens': itens_list,
                    'venda_futura_origem': getattr(v, 'venda_futura_origem_id', None),
                    'venda_futura_destino': getattr(v, 'venda_futura_destino_id', None),
                    # Transporte NF-e
                    'tipo_frete': getattr(v, 'tipo_frete', 9),
                    'id_transportadora': getattr(v, 'transportadora_id', None),
                    'placa_veiculo': getattr(v, 'placa_veiculo', None) or '',
                    'uf_veiculo': getattr(v, 'uf_veiculo', None) or '',
                    'rntrc': getattr(v, 'rntrc', None) or '',
                    'quantidade_volumes': getattr(v, 'quantidade_volumes', 0) or 0,
                    'especie_volumes': getattr(v, 'especie_volumes', None) or '',
                    'marca_volumes': getattr(v, 'marca_volumes', None) or '',
                    'peso_liquido': str(getattr(v, 'peso_liquido', 0) or 0),
                    'peso_bruto': str(getattr(v, 'peso_bruto', 0) or 0),
                    'observacao_fisco': getattr(v, 'observacao_fisco', None) or '',
                    'observacao_contribuinte': getattr(v, 'observacao_contribuinte', None) or '',
                    'chave_nfe_referenciada': getattr(v, 'chave_nfe_referenciada', None) or '',
                })
            except Exception as e_row:
                print(f"ERRO CRITICO serializando venda row: {e_row}")
                continue

        # Debug: Verificar valores retornados
        print(f"\n[DEBUG] - Listagem de vendas:")
        print(f"  - Total de vendas: {total}")
        print(f"  - Vendas retornadas: {len(items_out)}")
        if items_out:
            print(f"  - Primeira venda - ID: {items_out[0].get('id')}, Valor: {items_out[0].get('valor_total')}")
            if len(items_out) > 1:
                print(f"  - Segunda venda - ID: {items_out[1].get('id')}, Valor: {items_out[1].get('valor_total')}")
        
        return Response({'count': total, 'page': page, 'page_size': page_size, 'results': items_out})

    def post(self, request):
        """Cria��o de venda com itens.

        Corpo esperado (exemplo):
        {
          "id_operacao": 1,
          "id_cliente": 2,
          "id_vendedor": 3,
          "data": "29/10/2025",
          "itens": [ {"id_produto": 5, "quantidade": "1", "valor_unitario": "10,00"}, ... ]
        }
        """
        payload = request.data
        
        # LOG para debug de entrega futura
        print("=" * 60)
        print("[POST VENDA] Payload recebido:")
        print(f"  - venda_futura_origem: {payload.get('venda_futura_origem')}")
        print(f"  - id_operacao: {payload.get('id_operacao')}")
        print(f"  - id_cliente: {payload.get('id_cliente')}")
        print(f"  - Quantidade de itens: {len(payload.get('itens', []))}")
        print("=" * 60)
        
        id_operacao = payload.get('id_operacao')
        id_cliente = payload.get('id_cliente')
        id_vendedor = payload.get('id_vendedor')
        data_in = payload.get('data')
        itens = payload.get('itens', [])
        desconto_geral = parse_decimal_flexible(payload.get('desconto', '0')) or Decimal('0')  # ?? Desconto geral
        taxa_entrega = parse_decimal_flexible(payload.get('taxa_entrega', '0')) or Decimal('0')  # ?? Taxa de entrega

        # Valida��es obrigat�rias
        if not id_operacao:
            return Response({'detail': 'Opera��o � obrigat�ria'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Cliente n�o � mais obrigat�rio (pode ser venda sem cliente)
        # if not id_cliente:
        #     return Response({'detail': 'Cliente � obrigat�rio'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not id_vendedor:
            return Response({'detail': 'Vendedor � obrigat�rio'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not itens or len(itens) == 0:
            return Response({'detail': 'Adicione pelo menos um item � venda'}, status=status.HTTP_400_BAD_REQUEST)

        operacao = get_object_or_404(Operacao, pk=id_operacao)

        sale_date = parse_date_flexible(data_in) or timezone.now().date()
        
        # Capturar numero_documento do payload (vem do frontend)
        numero_documento = payload.get('numero_documento')

        # ?? Capturar venda_futura_origem do payload
        venda_futura_origem_id = payload.get('venda_futura_origem')

        # ?? Capturar chave_nfe_referenciada do payload (para Devolu��es/Ajustes)
        chave_nfe_referenciada = payload.get('chave_nfe_referenciada')

        # -- Contexto fiscal para tributa��o autom�tica -------------------------
        _empresa_id = None
        try:
            from .models import EmpresaConfig
            _ecfg = EmpresaConfig.objects.filter(ativo=True).first()
            if _ecfg:
                _empresa_id = _ecfg.pk
        except Exception:
            pass
        _cliente_obj = None
        if id_cliente:
            try:
                from .models import Cliente
                _cliente_obj = Cliente.objects.get(pk=id_cliente)
            except Exception:
                pass
        _ctx = _get_contexto_fiscal(operacao, _cliente_obj, _empresa_id)
        # ----------------------------------------------------------------------

        with transaction.atomic():
            venda = Venda.objects.create(
                id_operacao=operacao,
                id_cliente_id=id_cliente,
                # schema legado usa id_vendedor1/id_vendedor2 � usamos id_vendedor1 por padr�o
                id_vendedor1_id=id_vendedor,
                numero_documento=numero_documento,  # ? SALVAR numero_documento
                data_documento=timezone.make_aware(datetime(sale_date.year, sale_date.month, sale_date.day, 0, 0, 0), timezone.get_current_timezone()),
                valor_total=Decimal('0.00'),
                taxa_entrega=taxa_entrega,  # ?? SALVAR taxa de entrega
                venda_futura_origem_id=venda_futura_origem_id if venda_futura_origem_id else None,  # ?? SALVAR venda_futura_origem
                chave_nfe_referenciada=chave_nfe_referenciada,  # ?? SALVAR chave referenciada
                # Transporte NF-e
                tipo_frete=int(payload.get('tipo_frete', 9) or 9),
                transportadora_id=payload.get('id_transportadora') or None,
                placa_veiculo=payload.get('placa_veiculo') or None,
                uf_veiculo=payload.get('uf_veiculo') or None,
                rntrc=payload.get('rntrc') or None,
                quantidade_volumes=int(payload.get('quantidade_volumes') or 0),
                especie_volumes=payload.get('especie_volumes') or None,
                marca_volumes=payload.get('marca_volumes') or None,
                peso_liquido=Decimal(str(payload.get('peso_liquido') or '0')),
                peso_bruto=Decimal(str(payload.get('peso_bruto') or '0')),
                observacao_fisco=payload.get('observacao_fisco') or None,
                observacao_contribuinte=payload.get('observacao_contribuinte') or None,
            )

            total = Decimal('0.00')
            for it in itens:
                produto = None
                id_produto = it.get('id_produto')
                if id_produto:
                    try:
                        produto = Produto.objects.get(pk=id_produto)
                    except Produto.DoesNotExist:
                        return Response({
                            'detail': f'Produto com ID {id_produto} n�o encontrado',
                            'id_produto': id_produto
                        }, status=status.HTTP_400_BAD_REQUEST)

                q = parse_decimal_flexible(it.get('quantidade', '0')) or Decimal('0')
                vu = parse_decimal_flexible(it.get('valor_unitario', '0')) or Decimal('0')
                desconto_valor = parse_decimal_flexible(it.get('desconto_valor') or '0') or Decimal('0')
                valor_total_item = (q * vu) - desconto_valor

                # estoque - validar considerando acao_estoque da opera��o
                if produto and getattr(operacao, 'tipo_estoque_baixa', None) and operacao.tipo_estoque_baixa != 'Nenhum':
                    # Verificar se deve validar estoque
                    validar_estoque = getattr(operacao, 'validar_estoque', False)
                    acao_estoque = getattr(operacao, 'acao_estoque', 'nao_validar')
                    
                    # Buscar o dep�sito configurado na opera��o (id_deposito_baixa) ou usar LOJA (id=1) como padr�o
                    deposito_id = getattr(operacao, 'id_deposito_baixa', None) or 1
                    
                    # Log para debug (comentado para evitar UnicodeEncodeError no Windows)
                    prod_ident = getattr(produto, 'codigo_produto', None) or getattr(produto, 'nome_produto', None) or str(produto.pk)
                    print(f'[ESTOQUE] Verificando estoque para: Produto {prod_ident}, Qtd Solicitada: {q}, Deposito: {deposito_id}')
                    print(f'[ESTOQUE] Configuracao: validar_estoque={validar_estoque}, acao_estoque={acao_estoque}')
                    
                    try:
                        estoque = Estoque.objects.get(id_produto=produto, id_deposito_id=deposito_id)
                        quantidade_disponivel = estoque.quantidade or Decimal('0')
                        nome_deposito = estoque.id_deposito.nome_deposito if estoque.id_deposito else 'Deposito'
                        print(f'[ESTOQUE] Estoque encontrado: {quantidade_disponivel}')
                    except Estoque.DoesNotExist:
                        quantidade_disponivel = Decimal('0')
                        nome_deposito = 'Deposito nao configurado'
                        print(f'[ESTOQUE] Nao ha estoque registrado para este produto')
                    
                    # S� BLOQUEIA se validar_estoque=True E acao_estoque='bloquear'
                    if validar_estoque and acao_estoque == 'bloquear' and (quantidade_disponivel - q) < 0:
                        print(f'[ESTOQUE] BLOQUEANDO venda por estoque insuficiente (acao=bloquear)')
                        return Response({
                            'detail': f'Produto {prod_ident} sem estoque suficiente no dep�sito {nome_deposito}',
                            'produto': prod_ident,
                            'deposito': nome_deposito,
                            'deposito_id': deposito_id,
                            'estoque_disponivel': str(quantidade_disponivel),
                            'quantidade_solicitada': str(q),
                            'operacao': str(operacao.pk)
                        }, status=status.HTTP_400_BAD_REQUEST)
                    elif validar_estoque and acao_estoque in ['alertar', 'solicitar_senha'] and (quantidade_disponivel - q) < 0:
                        print(f'[ESTOQUE] Estoque insuficiente mas permitindo prosseguir (acao={acao_estoque})')
                        # Frontend j� alertou/solicitou senha, backend permite continuar
                        pass
                    else:
                        pass  # Estoque suficiente ou valida��o desabilitada, prosseguir com a venda

                _vi = VendaItem(
                    id_venda=venda,
                    id_produto=(produto if produto else None),
                    quantidade=q,
                    valor_unitario=vu,
                    valor_total=valor_total_item,
                    desconto_valor=desconto_valor,
                )
                if produto:
                    try:
                        _resultado_fiscal = _tributar_item(
                            produto_id=produto.pk,
                            empresa_id=_empresa_id,
                            uf_destino=_ctx.get('uf_destino'),
                            tipo_operacao=_ctx.get('tipo_operacao', 'INTERNA'),
                            tipo_cliente=_ctx.get('tipo_cliente', 'TODOS'),
                            uf_origem=_ctx.get('uf_origem'),
                            valor_unitario=float(vu),
                            quantidade=float(q),
                        )
                        _aplicar_fiscal_em_item(_vi, _resultado_fiscal)
                    except Exception as _ef:
                        print(f'[FISCAL] Erro tributando item {produto.pk}: {_ef}')
                _vi.save()

                # Atualizar estoque na tabela Estoque (n�o mais no produto)
                if produto:
                    if getattr(operacao, 'tipo_estoque_baixa', None) and operacao.tipo_estoque_baixa != 'Nenhum':
                        # Dar baixa no estoque do dep�sito configurado
                        deposito_baixa_id = getattr(operacao, 'id_deposito_baixa', None) or 1
                        try:
                            estoque_obj = Estoque.objects.get(id_produto=produto, id_deposito_id=deposito_baixa_id)
                            quantidade_antes = estoque_obj.quantidade or Decimal('0')
                            estoque_obj.quantidade = quantidade_antes - q
                            estoque_obj.save()
                            print(f'[ESTOQUE] Baixa no deposito: Produto {prod_ident}, Qtd Antes: {quantidade_antes}, Qtd Apos: {estoque_obj.quantidade}')
                        except Estoque.DoesNotExist:
                            print(f'[ESTOQUE] Estoque nao encontrado para dar baixa: Produto {prod_ident}, Deposito {deposito_baixa_id}')
                            pass
                    
                    if getattr(operacao, 'tipo_estoque_incremento', None) and operacao.tipo_estoque_incremento != 'Nenhum':
                        # Incrementar estoque no dep�sito configurado
                        deposito_incremento_id = getattr(operacao, 'id_deposito_incremento', None) or 1
                        try:
                            estoque_obj = Estoque.objects.get(id_produto=produto, id_deposito_id=deposito_incremento_id)
                            quantidade_antes = estoque_obj.quantidade or Decimal('0')
                            estoque_obj.quantidade = quantidade_antes + q
                            estoque_obj.save()
                            print(f'[ESTOQUE] Incremento no deposito: Produto {prod_ident}, Qtd Antes: {quantidade_antes}, Qtd Apos: {estoque_obj.quantidade}')
                        except Estoque.DoesNotExist:
                            # Se n�o existir, criar registro de estoque
                            estoque_obj = Estoque.objects.create(
                                id_produto=produto,
                                id_deposito_id=deposito_incremento_id,
                                quantidade=q
                            )
                            print(f'[ESTOQUE] Novo estoque criado: Produto {prod_ident}, Qtd: {q}')

                total += valor_total_item

            # Aplicar desconto geral e taxa de entrega da venda
            valor_total_final = total - desconto_geral + taxa_entrega
            
            # Log para debug (comentado para evitar UnicodeEncodeError no Windows)
            
            venda.valor_total = valor_total_final
            venda.save()

            # ? VINCULAR VENDA DE ENTREGA FUTURA E ATUALIZAR QUANTIDADE ENTREGUE
            # Se vier venda_futura_origem, atualizar a venda origem com o ID desta venda (destino)
            if venda_futura_origem_id:
                print(f'?? [ENTREGA FUTURA] ========================================')
                print(f'?? [ENTREGA FUTURA] venda_futura_origem_id recebido: {venda_futura_origem_id}')
                print(f'?? [ENTREGA FUTURA] Tipo: {type(venda_futura_origem_id)}')
                print(f'?? [ENTREGA FUTURA] ========================================')
                try:
                    venda_origem = Venda.objects.get(pk=venda_futura_origem_id)
                    print(f'?? [ENTREGA FUTURA] Venda origem encontrada: #{venda_origem.pk}')
                    # Alguns modelos usam related_name 'itens' � usar de forma defensiva
                    itens_destino_qs = getattr(venda, 'itens', None)
                    if itens_destino_qs is None:
                        # fallback para queryset via VendaItem
                        itens_destino_qs = VendaItem.objects.filter(id_venda=venda)

                    try:
                        dest_count = itens_destino_qs.count()
                    except Exception:
                        dest_count = len(list(itens_destino_qs)) if itens_destino_qs is not None else 0

                    print(f'?? [ENTREGA FUTURA] Itens da venda destino (nova): {dest_count}')

                    # Atualizar quantidade_entregue de cada item da origem
                    for item_destino in itens_destino_qs.all() if hasattr(itens_destino_qs, 'all') else itens_destino_qs:
                        print(f'?? [ENTREGA FUTURA] Processando item destino: Produto ID={item_destino.id_produto.pk if item_destino.id_produto else "None"}, Qtd={item_destino.quantidade}')
                        
                        # Buscar o item correspondente na venda origem
                        try:
                            if item_destino.id_produto:
                                # Buscar item da origem pelo produto
                                # buscar item da origem pelo produto usando related name 'itens'
                                itens_origem_qs = getattr(venda_origem, 'itens', None) or VendaItem.objects.filter(id_venda=venda_origem)
                                item_origem = itens_origem_qs.get(id_produto=item_destino.id_produto)
                                
                                # Atualizar quantidade entregue
                                quantidade_entregue_anterior = item_origem.quantidade_entregue or Decimal('0.000')
                                item_origem.quantidade_entregue = quantidade_entregue_anterior + item_destino.quantidade
                                
                                # Validar que n�o ultrapasse a quantidade total
                                if item_origem.quantidade_entregue > item_origem.quantidade:
                                    return Response({
                                        'detail': f'Quantidade entregue do produto {item_origem.id_produto.nome_produto} ultrapassa a quantidade do pedido',
                                        'produto': item_origem.id_produto.nome_produto if item_origem.id_produto else '',
                                        'quantidade_total': str(item_origem.quantidade),
                                        'quantidade_entregue': str(item_origem.quantidade_entregue)
                                    }, status=status.HTTP_400_BAD_REQUEST)
                                
                                item_origem.save()
                                print(f'? [ENTREGA FUTURA] Item atualizado: Produto {item_origem.id_produto.pk}, Qtd Entregue: {quantidade_entregue_anterior} ? {item_origem.quantidade_entregue}')
                            else:
                                print(f'?? [ENTREGA FUTURA] Item sem produto vinculado')
                        
                        except VendaItem.DoesNotExist:
                            print(f'?? [ENTREGA FUTURA] Item n�o encontrado na venda origem para produto ID={item_destino.id_produto.pk if item_destino.id_produto else "None"}')
                        except Exception as e:
                            print(f'? [ENTREGA FUTURA] Erro ao processar item: {str(e)}')
                            import traceback
                            traceback.print_exc()
                    
                    # Verificar se todos os itens foram entregues completamente
                    todos_entregues = True
                    itens_origem_all = getattr(venda_origem, 'itens', None) or VendaItem.objects.filter(id_venda=venda_origem)
                    for item_origem in itens_origem_all.all() if hasattr(itens_origem_all, 'all') else itens_origem_all:
                        quantidade_pendente = item_origem.quantidade - (item_origem.quantidade_entregue or Decimal('0.000'))
                        if quantidade_pendente > Decimal('0.001'):  # Toler�ncia para erros de arredondamento
                            todos_entregues = False
                            break
                    
                    # Se todos os itens foram entregues, vincular a venda destino
                    if todos_entregues:
                        venda_origem.venda_futura_destino = venda
                        venda_origem.save()
                        print(f'? [ENTREGA FUTURA] Pedido {venda_futura_origem_id} COMPLETAMENTE entregue')
                    else:
                        print(f'?? [ENTREGA FUTURA] Pedido {venda_futura_origem_id} parcialmente entregue (ainda h� saldo pendente)')
                    
                    venda.venda_futura_origem = venda_origem
                    venda.save()
                    print(f'?? [ENTREGA FUTURA] Venda {venda.pk} vinculada como entrega da venda origem {venda_futura_origem_id}')
                except Venda.DoesNotExist:
                    print(f'?? [ENTREGA FUTURA] Venda origem {venda_futura_origem_id} n�o encontrada')
                except Exception as e:
                    print(f'? [ENTREGA FUTURA] Erro geral ao processar entrega futura: {str(e)}')
                    import traceback
                    traceback.print_exc()
                    # N�o retornar erro aqui para n�o bloquear a venda, apenas logar

            # ?? GERAR CASHBACK AUTOMATICAMENTE (se a opera��o tiver cashback configurado)
            cashback_gerado = None
            if operacao.cashback_percentual and operacao.cashback_percentual > 0 and id_cliente:
                try:
                    valor_cashback = (venda.valor_total * operacao.cashback_percentual) / Decimal('100')
                    data_validade = timezone.now() + timedelta(days=operacao.cashback_validade_dias or 30)
                    
                    cashback_gerado = Cashback.objects.create(
                        id_cliente_id=id_cliente,
                        id_venda_origem=venda,
                        valor_gerado=valor_cashback,
                        saldo=valor_cashback,
                        valor_utilizado=Decimal('0.00'),
                        data_validade=data_validade,
                        ativo=True,
                        percentual_origem=operacao.cashback_percentual
                    )
                    print(f'?? [CASHBACK] Gerado: R$ {valor_cashback} para cliente {id_cliente} (venda {venda.pk})')
                except Exception as e:
                    print(f'? [CASHBACK] Erro ao gerar: {str(e)}')

            # ?? N�O gerar financeiro automaticamente no backend
            # O frontend abrir� modal para usu�rio configurar manualmente
            # Desabilitado: ensure_financeiro_for_venda(venda, payload=payload, force=False)
            
            # Use `.pk` instead of `.id` because the model may use a different
            # primary key field name; `pk` always references the primary key.
            resp = {
                'id': venda.pk,
                'numero_documento': venda.numero_documento or str(venda.pk),
                'valor_total': str(venda.valor_total),
                'gerou_financeiro': False,  # ? Sempre False para modal abrir no frontend
                'cashback_gerado': {
                    'id': cashback_gerado.pk,
                    'valor': str(cashback_gerado.valor_gerado),
                    'saldo': str(cashback_gerado.saldo),
                    'validade': str(cashback_gerado.data_validade)
                } if cashback_gerado else None
            }
            return Response(resp, status=status.HTTP_201_CREATED)

    def patch(self, request, venda_id=None):
        """Atualiza uma venda existente."""
        try:
            if venda_id is None:
                return Response({'detail': 'venda_id � obrigat�rio para atualiza��o.'}, status=status.HTTP_400_BAD_REQUEST)
            
            venda = get_object_or_404(Venda, pk=venda_id)
            
            # Bloquear edi��o de cupons autorizados
            status_upper = (venda.status_nfe or '').upper()
            if status_upper in ['AUTORIZADO', 'AUTORIZADA', 'APROVADO', 'EMITIDA'] or venda.chave_nfe:
                return Response({
                    'detail': 'N�o � poss�vel editar uma venda com cupom fiscal autorizado.',
                    'status_nfe': venda.status_nfe,
                    'numero_nfe': venda.numero_nfe,
                    'chave_nfe': venda.chave_nfe
                }, status=status.HTTP_400_BAD_REQUEST)
            
            payload = request.data
            
            logging.info(f'[PATCH VENDA] Atualizando venda ID {venda_id}')
            logging.info(f'[PATCH VENDA] Payload recebido: {payload}')
            
            # Atualizar campos permitidos
            if 'id_operacao' in payload:
                venda.id_operacao_id = payload['id_operacao']
                logging.info(f'[PATCH VENDA] Operacao atualizada para: {payload["id_operacao"]}')
            
            if 'id_cliente' in payload:
                venda.id_cliente_id = payload['id_cliente']
                logging.info(f'[PATCH VENDA] Cliente atualizado para: {payload["id_cliente"]}')
            
            if 'id_vendedor' in payload:
                venda.id_vendedor1_id = payload['id_vendedor']
                logging.info(f'[PATCH VENDA] Vendedor atualizado para: {payload["id_vendedor"]}')
            
            if 'numero_documento' in payload:
                venda.numero_documento = payload['numero_documento']
            if 'chave_nfe_referenciada' in payload:
                venda.chave_nfe_referenciada = payload['chave_nfe_referenciada']

            # Campos de Transporte NF-e
            if 'tipo_frete' in payload:
                venda.tipo_frete = int(payload['tipo_frete'] or 9)
            if 'id_transportadora' in payload:
                venda.transportadora_id = payload['id_transportadora'] or None
            for _campo_transp in ('placa_veiculo', 'uf_veiculo', 'rntrc', 'especie_volumes',
                                  'marca_volumes', 'observacao_fisco', 'observacao_contribuinte'):
                if _campo_transp in payload:
                    setattr(venda, _campo_transp, payload[_campo_transp] or None)
            if 'quantidade_volumes' in payload:
                venda.quantidade_volumes = int(payload['quantidade_volumes'] or 0)
            if 'peso_liquido' in payload:
                venda.peso_liquido = Decimal(str(payload['peso_liquido'] or '0'))
            if 'peso_bruto' in payload:
                venda.peso_bruto = Decimal(str(payload['peso_bruto'] or '0'))

            # Aceitar tanto 'data' quanto 'data_venda'
            data_field = payload.get('data') or payload.get('data_venda')
            if data_field:
                sale_date = parse_date_flexible(data_field)
                if sale_date:
                    venda.data_documento = timezone.make_aware(
                        datetime(sale_date.year, sale_date.month, sale_date.day, 0, 0, 0),
                        timezone.get_current_timezone()
                    )
            
            # Atualizar itens se fornecidos
            if 'itens' in payload:
                with transaction.atomic():
                    # Remover itens existentes
                    venda.itens.all().delete()
                    
                    # Adicionar novos itens
                    total = Decimal('0.00')
                    for it in payload['itens']:
                        produto = None
                        id_produto = it.get('id_produto')
                        if id_produto:
                            try:
                                produto = Produto.objects.get(pk=id_produto)
                            except Produto.DoesNotExist:
                                return Response({
                                    'detail': f'Produto com ID {id_produto} n�o encontrado',
                                    'id_produto': id_produto
                                }, status=status.HTTP_400_BAD_REQUEST)
                        
                        q = parse_decimal_flexible(it.get('quantidade', '0')) or Decimal('0')
                        vu = parse_decimal_flexible(it.get('valor_unitario', '0')) or Decimal('0')
                        desconto_valor = parse_decimal_flexible(it.get('desconto_valor', '0')) or Decimal('0')
                        valor_total_item = (q * vu) - desconto_valor
                        
                        VendaItem.objects.create(
                            id_venda=venda,
                            id_produto=produto,
                            quantidade=q,
                            valor_unitario=vu,
                            valor_total=valor_total_item,
                            desconto_valor=desconto_valor,
                        )
                        total += valor_total_item
                    
                    venda.valor_total = total
            
            # Permitir atualiza��o manual de valor_total (para aplica��o de cr�ditos)
            if 'valor_total' in payload and 'itens' not in payload:
                venda.valor_total = Decimal(str(payload['valor_total']))
            
            venda.save()
            logging.info(f'[PATCH VENDA] Venda {venda_id} atualizada com sucesso')
            
            return Response({
                'id': venda.pk,
                'numero_documento': venda.numero_documento or str(venda.pk),
                'valor_total': str(venda.valor_total)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logging.error(f'[PATCH VENDA] Erro ao atualizar venda {venda_id}: {str(e)}')
            logging.exception(e)
            return Response({
                'detail': f'Erro ao atualizar venda: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, venda_id=None):
        """Exclui uma venda pelo ID (venda_id vem da URL)."""
        if venda_id is None:
            return Response({'detail': 'venda_id � obrigat�rio para exclus�o.'}, status=status.HTTP_400_BAD_REQUEST)
        
        venda = get_object_or_404(Venda, pk=venda_id)
        
        # --- VALIDA��O FISCAL ---
        # "a menu NFC-e coloca a op��o de excluir so pode ser exclu�do se estiver pendente"
        # S� permite excluir se status for PENDENTE (ou vazio). 
        # Se for ERRO, obriga o usu�rio a limpar o XML antes (para garantir que ele viu o erro).
        
        status_atual = str(venda.status_nfe or 'PENDENTE').upper()
        if status_atual not in ('PENDENTE', 'INUTILIZADA'):
             return Response(
                {'error': f'N�o � permitido excluir venda com status �{status_atual}�. Apenas vendas PENDENTES podem ser exclu�das. Se houver erro, use a op��o "Limpar XML" antes de excluir.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Bloqueio extra para status 'ERRO' se tiver Chave ou Protocolo (Seguran�a) - Caso o status fosse null mas tivesse chave (inconsistencia)
        if (venda.protocolo_nfe or venda.chave_nfe) and status_atual == 'PENDENTE':
             # Isso � estranho (Status Pendente mas tem chave). Melhor bloquear.
             return Response(
                {'error': 'Venda possui Chave/Protocolo registrado mas status est� Pendente. Limpe os campos fiscais antes de excluir para evitar inconsist�ncia.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Verificar se existe financeiro relacionado a esta venda
        financeiros = FinanceiroConta.objects.filter(id_venda_origem=venda_id)

        # --- LOGICA INTELIGENTE DE NUMERACAO ---
        # Se a venda tem numero_nfe atribuido e esta PENDENTE, verifica se é o ultimo
        numero_nfe = venda.numero_nfe
        _op_numeracao = venda.id_operacao
        _is_last_number = False

        if numero_nfe and _op_numeracao and status_atual == 'PENDENTE':
            modelo_doc = str(getattr(_op_numeracao, 'modelo_documento', '') or '')
            is_fiscal = modelo_doc in ('55', '65')
            try:
                is_last_number = (int(_op_numeracao.proximo_numero_nf) - 1) == int(numero_nfe)
            except (TypeError, ValueError):
                is_last_number = False

            if not is_last_number and is_fiscal:
                # Numero nao e o ultimo: docs fiscais precisam de inutilizacao na SEFAZ
                return Response({
                    'precisa_inutilizar': True,
                    'numero_nfe': numero_nfe,
                    'id_venda': venda.pk,
                    'mensagem': (
                        f'O numero {numero_nfe} nao e o ultimo emitido. '
                        f'Para documentos fiscais (Modelo {modelo_doc}), e necessario inutilizar '
                        f'este numero na SEFAZ antes de excluir.'
                    )
                }, status=status.HTTP_200_OK)

            _is_last_number = is_last_number

        # Regra 1: Bloqueia exclus�o se houver financeiro PAGO (para todos, incluindo admin)
        financeiros_pagos = financeiros.filter(status_conta='Paga')
        if financeiros_pagos.exists():
            return Response(
                {'error': 'N�o � permitido excluir vendas com parcelas pagas. Use o bot�o ESTORNO nas parcelas primeiro.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Regra 2 e 3: Devolver produtos ao estoque e excluir venda
        with transaction.atomic():
            # Obter a operação da venda para saber qual depósito usar
            operacao = venda.id_operacao
            
            # Devolver produtos ao estoque
            if operacao and getattr(operacao, 'tipo_estoque_baixa', None) and operacao.tipo_estoque_baixa != 'Nenhum':
                itens_venda = venda.itens.all()
                deposito_id = getattr(operacao, 'id_deposito_baixa', None) or 1
                
                for item in itens_venda:
                    if item.id_produto:
                        try:
                            # Buscar registro de estoque
                            estoque_obj = Estoque.objects.get(
                                id_produto=item.id_produto,
                                id_deposito_id=deposito_id
                            )
                            # Devolver quantidade ao estoque
                            estoque_obj.quantidade = (estoque_obj.quantidade or Decimal('0')) + item.quantidade
                            estoque_obj.save()
                        except Estoque.DoesNotExist:
                            # Se não existir registro, criar com a quantidade devolvida
                            estoque_obj = Estoque.objects.create(
                                id_produto=item.id_produto,
                                id_deposito_id=deposito_id,
                                quantidade=item.quantidade
                            )
            
            # Se houver financeiro PENDENTE, excluir junto com a venda
            if financeiros.exists():
                financeiros.delete()

            # Devolver quantidades aos lotes (se houver)
            for item in venda.itens.all():
                if item.id_lote and item.quantidade:
                    item.id_lote.quantidade = (item.id_lote.quantidade or Decimal('0')) + item.quantidade
                    item.id_lote.save()

            # Desassociar MapaCargaItem (PROTECT impede delete direto)
            from .models import MapaCargaItem
            MapaCargaItem.objects.filter(id_venda=venda).delete()

            try:
                venda.delete()
            except Exception as e_del:
                return Response(
                    {'error': f'Erro ao excluir venda: {str(e_del)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Decrementa numeracao se era o ultimo numero atribuido
            if _is_last_number and _op_numeracao:
                try:
                    _op_numeracao.proximo_numero_nf -= 1
                    _op_numeracao.save()
                    if _op_numeracao.id_numeracao_id:
                        num_obj = _op_numeracao.id_numeracao
                        num_obj.numeracao = str(int(num_obj.numeracao) - 1)
                        num_obj.save()
                except Exception as e_num:
                    import logging as _log
                    _log.getLogger(__name__).error(f"Erro ao decrementar numeracao apos excluir venda: {e_num}")
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class ClienteProdutosView(APIView):
    """Retorna o histórico de produtos comprados por um cliente, agregado."""
    permission_classes = [IsAuthenticated]

    def get(self, request, id_cliente):
        try:
            # Dois passos para evitar problemas com FK traversal
            venda_ids = list(
                Venda.objects.filter(id_cliente_id=id_cliente).values_list('pk', flat=True)
            )
            if not venda_ids:
                return Response({'results': [], 'count': 0})

            itens = (
                VendaItem.objects
                .filter(id_venda__in=venda_ids)
                .select_related('id_produto', 'id_venda')
                .order_by('-id_venda__data_documento')
            )[:500]

            data = []
            for item in itens:
                p = item.id_produto
                v = item.id_venda
                data.append({
                    'id_item': item.id_item,
                    'id_venda': v.pk if v else None,
                    'data_venda': v.data_documento.isoformat() if v and v.data_documento else None,
                    'id_produto': p.pk if p else None,
                    'nome_produto': p.nome_produto if p else 'Produto não identificado',
                    'codigo_produto': p.codigo_produto if p else '',
                    'unidade_medida': getattr(p, 'unidade_medida', '') if p else '',
                    'quantidade': float(item.quantidade),
                    'valor_unitario': float(item.valor_unitario),
                    'valor_total': float(item.valor_total),
                })

            return Response({'results': data, 'count': len(data)})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'erro': str(e)}, status=500)


class ProximoNumeroVendaView(APIView):
    """Retorna o pr�ximo n�mero de documento dispon�vel para vendas."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Buscar o �ltimo n�mero de documento
            ultima_venda = Venda.objects.filter(
                numero_documento__isnull=False
            ).exclude(
                numero_documento=''
            ).order_by('-id_venda').first()
            
            if ultima_venda and ultima_venda.numero_documento:
                # Tentar extrair n�mero do formato VND-XXX ou similar
                import re
                match = re.search(r'(\d+)', ultima_venda.numero_documento)
                if match:
                    ultimo_num = int(match.group(1))
                    proximo = ultimo_num + 1
                else:
                    # Se n�o encontrar n�mero, come�ar do 1
                    proximo = 1
            else:
                # Se n�o houver vendas, come�ar do 1
                proximo = 1
            
            # Formatar como VND-001, VND-002, etc
            numero_formatado = f"VND-{str(proximo).zfill(3)}"
            
            return Response({
                'proximo_numero': numero_formatado,
                'numero': proximo
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'detail': f'Erro ao gerar pr�ximo n�mero: {str(e)}',
                'proximo_numero': 'VND-001'
            }, status=status.HTTP_200_OK)

class CartaCorrecaoNFeView(APIView):
    """
    POST /api/vendas/<id_venda>/carta_correcao_nfe/
    Envia uma Carta de Corre��o Eletr�nica (CC-e) para uma NFe autorizada.
    
    Body:
        {
            "texto_correcao": "Descri��o da corre��o (m�nimo 15 caracteres)"
        }
    
    GET /api/vendas/<id_venda>/carta_correcao_nfe/
    Lista todas as CC-e enviadas para esta NFe
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, id_venda):
        """Lista todas as Cartas de Corre��o desta venda"""
        from .models import CartaCorrecaoNFe
        from rest_framework import serializers
        
        venda = get_object_or_404(Venda, pk=id_venda)
        
        cartas = CartaCorrecaoNFe.objects.filter(id_venda=venda).order_by('-numero_sequencial')
        
        class CartaCorrecaoSerializer(serializers.ModelSerializer):
            usuario_nome = serializers.CharField(
                source='usuario.username', 
                read_only=True,
                default='Sistema'
            )
            
            class Meta:
                model = CartaCorrecaoNFe
                fields = [
                    'id_carta_correcao', 'numero_sequencial', 'texto_correcao',
                    'data_envio', 'protocolo', 'status', 'mensagem_retorno',
                    'usuario_nome'
                ]
        
        serializer = CartaCorrecaoSerializer(cartas, many=True)
        
        return Response({
            'sucesso': True,
            'cartas_correcao': serializer.data,
            'total': cartas.count(),
            'pode_enviar_nova': cartas.count() < 20  # Limite da SEFAZ
        })
    
    def post(self, request, id_venda):
        """Envia uma nova Carta de Corre��o"""
        import logging
        logger = logging.getLogger(__name__)
        
        venda = get_object_or_404(Venda, pk=id_venda)
        texto = request.data.get('texto_correcao', '').strip()
        
        logger.info(f"[CC-e] Iniciando para venda {id_venda}, texto: {texto[:30]}...")
        
        if not texto:
            return Response(
                {'sucesso': False, 'mensagem': 'Campo texto_correcao � obrigat�rio.'},
                status=400
            )
        
        # Validar se a NFe est� autorizada
        if venda.status_nfe not in ['EMITIDA', 'AUTORIZADA', 'AUTORIZADO']:
            return Response(
                {
                    'sucesso': False,
                    'mensagem': f'Esta NFe n�o est� autorizada (status atual: {venda.status_nfe}). '
                               'Carta de Corre��o s� pode ser enviada para NFe autorizada.'
                },
                status=400
            )
        
        try:
            service = NFeService()
            result = service.carta_correcao(venda, texto, usuario=request.user)
            logger.info(f"[CC-e] Resultado: sucesso={result.get('sucesso')}, msg={result.get('mensagem')}")
        except Exception as e:
            logger.exception(f"[CC-e] Exce��o ao enviar: {e}")
            return Response(
                {'sucesso': False, 'mensagem': f'Erro interno: {str(e)}'},
                status=500
            )
        
        # Serializar a carta de corre��o criada se houver (independente de sucesso ou erro)
        if result.get('carta_correcao'):
            from rest_framework import serializers
            from .models import CartaCorrecaoNFe
            
            class CartaCorrecaoSerializer(serializers.ModelSerializer):
                usuario_nome = serializers.CharField(
                    source='usuario.username',
                    read_only=True,
                    default='Sistema'
                )
                
                class Meta:
                    model = CartaCorrecaoNFe
                    fields = '__all__'
            
            carta_data = CartaCorrecaoSerializer(result['carta_correcao']).data
            result['carta_correcao'] = carta_data
        
        status_code = 200 if result.get('sucesso') else 400
        return Response(result, status=status_code)


class CartaCorrecaoDownloadXMLView(APIView):
    """
    GET /api/vendas/<id_venda>/carta_correcao_nfe/<id_carta>/xml/
    Faz o download do XML da Carta de Corre��o (CC-e).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, id_venda, id_carta):
        from .models import CartaCorrecaoNFe
        from django.http import HttpResponse

        get_object_or_404(Venda, pk=id_venda)
        carta = get_object_or_404(CartaCorrecaoNFe, pk=id_carta, id_venda_id=id_venda)

        if not carta.xml_evento:
            return Response(
                {'erro': 'XML n�o dispon�vel para esta Carta de Corre��o (status: {}).'.format(carta.status)},
                status=404
            )

        xml_content = carta.xml_evento.strip()
        fname = f"CCe_{id_venda}_seq{carta.numero_sequencial}.xml"
        response = HttpResponse(xml_content, content_type='application/xml; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{fname}"'
        return response


class CartaCorrecaoDeleteView(APIView):
    """
    DELETE /api/vendas/<id_venda>/carta_correcao_nfe/<id_carta>/excluir/
    Exclui uma Carta de Corre��o com status REJEITADO ou ERRO.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, id_venda, id_carta):
        from .models import CartaCorrecaoNFe

        get_object_or_404(Venda, pk=id_venda)
        carta = get_object_or_404(CartaCorrecaoNFe, pk=id_carta, id_venda_id=id_venda)

        if carta.status not in ['REJEITADO', 'ERRO']:
            return Response(
                {'erro': f'Apenas cartas com status REJEITADO ou ERRO podem ser exclu�das. Status atual: {carta.status}.'},
                status=400
            )

        carta.delete()
        return Response({'sucesso': True, 'mensagem': 'Carta de Corre��o exclu�da com sucesso.'}, status=200)


class CartaCorrecaoImprimirView(APIView):
    """
    GET /api/vendas/<id_venda>/carta_correcao_nfe/<id_carta>/imprimir/
    Retorna HTML para impress�o da Carta de Corre��o (CC-e).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, id_venda, id_carta):
        from .models import CartaCorrecaoNFe
        from django.http import HttpResponse

        venda = get_object_or_404(Venda, pk=id_venda)
        carta = get_object_or_404(CartaCorrecaoNFe, pk=id_carta, id_venda_id=id_venda)

        # Dados da empresa
        try:
            empresa = EmpresaConfig.get_ativa()
        except Exception:
            empresa = None

        empresa_nome = getattr(empresa, 'nome_razao_social', '') or getattr(empresa, 'nome_fantasia', '') or 'Empresa'
        empresa_cnpj = getattr(empresa, 'cpf_cnpj', '') or ''
        empresa_endereco = ''
        if empresa:
            partes = [
                getattr(empresa, 'endereco', ''),
                getattr(empresa, 'numero', ''),
                getattr(empresa, 'bairro', ''),
                getattr(empresa, 'cidade', ''),
                getattr(empresa, 'estado', ''),
            ]
            empresa_endereco = ', '.join(p for p in partes if p)

        data_envio_fmt = carta.data_envio.strftime('%d/%m/%Y %H:%M:%S') if carta.data_envio else '-'
        usuario_nome = carta.usuario.username if carta.usuario else 'Sistema'

        # Tentar extrair protocolo do xml_evento se n�o estiver salvo no campo
        protocolo = carta.protocolo
        if not protocolo and carta.xml_evento:
            import re as _re
            m = _re.search(r'<nProt>(\d+)</nProt>', carta.xml_evento)
            if m:
                protocolo = m.group(1)
                # Aproveitar e salvar no campo para futuras consultas
                carta.protocolo = protocolo
                carta.save(update_fields=['protocolo'])

        status_label = {
            'PENDENTE': 'Pendente',
            'REGISTRADO': 'Registrado na SEFAZ',
            'REJEITADO': 'Rejeitado',
            'ERRO': 'Erro',
        }.get(carta.status, carta.status)

        chave_nfe = getattr(venda, 'chave_nfe', '') or ''
        numero_nfe = getattr(venda, 'numero_nfe', '') or str(id_venda)

        html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>CC-e #{carta.numero_sequencial} - NF-e {numero_nfe}</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #000; background: #fff; }}
    .page {{ max-width: 210mm; margin: 10mm auto; padding: 10mm; border: 2px solid #000; }}
    .titulo-bloco {{ text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }}
    .titulo-bloco h1 {{ font-size: 14pt; text-transform: uppercase; }}
    .titulo-bloco h2 {{ font-size: 11pt; }}
    .empresa {{ text-align: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #666; }}
    .empresa strong {{ font-size: 13pt; }}
    .empresa p {{ font-size: 9pt; color: #333; margin-top: 2px; }}
    .secao {{ margin-bottom: 10px; }}
    .secao-titulo {{ font-size: 10pt; font-weight: bold; text-transform: uppercase; background: #eee; padding: 3px 6px; border-left: 3px solid #000; margin-bottom: 6px; }}
    .linha {{ display: flex; gap: 16px; margin-bottom: 4px; }}
    .campo {{ flex: 1; }}
    .campo label {{ font-size: 8pt; color: #555; display: block; }}
    .campo span {{ font-size: 10pt; font-weight: bold; }}
    .texto-correcao {{ border: 1px solid #999; padding: 8px; min-height: 60px; font-size: 11pt; line-height: 1.5; background: #fafafa; margin-top: 4px; white-space: pre-wrap; word-break: break-word; }}
    .status-ok {{ color: #006600; }}
    .status-err {{ color: #cc0000; }}
    .chave {{ font-size: 8pt; font-family: monospace; word-break: break-all; background: #f5f5f5; padding: 4px; border: 1px solid #ddd; margin-top: 4px; }}
    .rodape {{ margin-top: 14px; border-top: 1px solid #999; padding-top: 8px; font-size: 8pt; color: #555; text-align: center; }}
    .aviso {{ font-size: 9pt; font-style: italic; color: #555; text-align: center; margin-top: 8px; }}
    @media print {{
      body {{ background: #fff; }}
      .page {{ border: 1px solid #000; margin: 0; padding: 8mm; max-width: 100%; }}
      .no-print {{ display: none !important; }}
    }}
  </style>
</head>
<body>
<div class="page">
  <div class="titulo-bloco">
    <h1>Carta de Corre��o Eletr�nica</h1>
    <h2>CC-e #{carta.numero_sequencial} � NF-e n� {numero_nfe}</h2>
  </div>

  <div class="empresa">
    <strong>{empresa_nome}</strong>
    <p>CNPJ: {empresa_cnpj}</p>
    {f'<p>{empresa_endereco}</p>' if empresa_endereco else ''}
  </div>

  <div class="secao">
    <div class="secao-titulo">Dados da NF-e</div>
    <div class="linha">
      <div class="campo">
        <label>N�mero NF-e</label>
        <span>{numero_nfe}</span>
      </div>
      <div class="campo">
        <label>N� Sequencial CC-e</label>
        <span>{carta.numero_sequencial}</span>
      </div>
      <div class="campo">
        <label>Status</label>
        <span class="{'status-ok' if carta.status == 'REGISTRADO' else 'status-err'}">{status_label}</span>
      </div>
    </div>
    <div class="campo" style="margin-top:6px">
      <label>Chave de Acesso</label>
      <div class="chave">{chave_nfe}</div>
    </div>
  </div>

  <div class="secao">
    <div class="secao-titulo">Dados do Registro</div>
    <div class="linha">
      <div class="campo">
        <label>Data/Hora Envio</label>
        <span>{data_envio_fmt}</span>
      </div>
      <div class="campo">
        <label>Protocolo SEFAZ</label>
        <span>{protocolo or 'N�o dispon�vel'}</span>
      </div>
      <div class="campo">
        <label>Enviada por</label>
        <span>{usuario_nome}</span>
      </div>
    </div>
    {f'<div class="campo" style="margin-top:6px"><label>Retorno SEFAZ</label><span style="font-size:9pt">{carta.mensagem_retorno}</span></div>' if carta.mensagem_retorno else ''}
  </div>

  <div class="secao">
    <div class="secao-titulo">Texto da Corre��o</div>
    <div class="texto-correcao">{carta.texto_correcao}</div>
  </div>

  <p class="aviso">
    A Carta de Corre��o � disciplinada pelo � 1�-A do art. 7� do Conv�nio S/N,<br>
    de 15 de dezembro de 1970 e n�o pode ser utilizada para sanear as hip�teses<br>
    previstas no art. 20 do SINIEF s/n� de 1970.
  </p>

  <div class="rodape">
    Impresso em {__import__('datetime').datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
  </div>
</div>

<div class="no-print" style="text-align:center;margin:16px">
  <button onclick="window.print()" style="padding:10px 24px;font-size:13pt;cursor:pointer;background:#1565c0;color:#fff;border:none;border-radius:4px">
    ??? Imprimir
  </button>
  <button onclick="window.close()" style="margin-left:12px;padding:10px 24px;font-size:13pt;cursor:pointer;background:#555;color:#fff;border:none;border-radius:4px">
    Fechar
  </button>
</div>

<script>
  // Auto-print se chamado com ?autoprint=1
  if (new URLSearchParams(window.location.search).get('autoprint') === '1') {{
    window.onload = () => window.print();
  }}
</script>
</body>
</html>"""

        return HttpResponse(html, content_type='text/html; charset=utf-8')


class ComplementoICMSNFeView(APIView):
    """
    API para gerenciar Complementos de ICMS em NFe
    
    GET /api/vendas/<id_venda>/complemento_icms/
        Lista todos os complementos criados para esta NFe
    
    POST /api/vendas/<id_venda>/complemento_icms/
        Cria um novo complemento de ICMS para esta NFe
        Body: {
            "tipo_complemento": "ICMS|ICMS_ST|DIFAL|IPI|OUTROS",
            "valor_complemento": 150.00,
            "base_calculo": 1000.00,  # opcional
            "aliquota": 15.0000,      # opcional
            "motivo": "Diferencial de al�quota interestadual",
            "observacoes": ""         # opcional
        }
    
    PUT /api/vendas/<id_venda>/complemento_icms/<id_complemento>/emitir/
        Emite a NFe de complemento (cria uma nova venda/NFe)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, id_venda):
        """Lista todos os complementos desta NFe"""
        from .models import ComplementoICMSNFe
        from rest_framework import serializers
        
        venda = get_object_or_404(Venda, pk=id_venda)
        
        complementos = ComplementoICMSNFe.objects.filter(
            id_venda_referencia=venda
        ).order_by('-data_criacao')
        
        class ComplementoICMSSerializer(serializers.ModelSerializer):
            usuario_nome = serializers.CharField(
                source='usuario.username',
                read_only=True,
                default='Sistema'
            )
            numero_nfe_referencia = serializers.CharField(
                source='id_venda_referencia.numero_nfe',
                read_only=True
            )
            chave_nfe_referencia = serializers.CharField(
                source='id_venda_referencia.chave_nfe',
                read_only=True
            )
            numero_nfe_complemento = serializers.CharField(
                source='id_venda_complemento.numero_nfe',
                read_only=True,
                allow_null=True
            )
            chave_nfe_complemento = serializers.CharField(
                source='id_venda_complemento.chave_nfe',
                read_only=True,
                allow_null=True
            )
            
            class Meta:
                model = ComplementoICMSNFe
                fields = [
                    'id_complemento', 'tipo_complemento', 'valor_complemento',
                    'base_calculo', 'aliquota', 'motivo', 'observacoes',
                    'status', 'data_criacao', 'data_emissao',
                    'usuario_nome', 'numero_nfe_referencia', 'chave_nfe_referencia',
                    'numero_nfe_complemento', 'chave_nfe_complemento',
                    'id_venda_complemento'
                ]
        
        serializer = ComplementoICMSSerializer(complementos, many=True)
        
        return Response({
            'sucesso': True,
            'complementos': serializer.data,
            'total': complementos.count()
        })
    
    def post(self, request, id_venda):
        """Cria um novo complemento de ICMS"""
        from .models import ComplementoICMSNFe
        from decimal import Decimal, InvalidOperation
        
        venda = get_object_or_404(Venda, pk=id_venda)
        
        # Validar se a NFe est� autorizada
        if venda.status_nfe not in ['EMITIDA', 'AUTORIZADA', 'AUTORIZADO']:
            return Response(
                {
                    'sucesso': False,
                    'mensagem': f'Esta NFe n�o est� autorizada (status: {venda.status_nfe}). '
                               'Complemento s� pode ser feito para NFe autorizada.'
                },
                status=400
            )
        
        # Validar campos obrigat�rios
        tipo_complemento = request.data.get('tipo_complemento', 'ICMS')
        valor_complemento = request.data.get('valor_complemento')
        motivo = request.data.get('motivo', '').strip()
        
        if not valor_complemento:
            return Response(
                {'sucesso': False, 'mensagem': 'Campo valor_complemento � obrigat�rio.'},
                status=400
            )
        
        if not motivo:
            return Response(
                {'sucesso': False, 'mensagem': 'Campo motivo � obrigat�rio.'},
                status=400
            )
        
        try:
            valor_complemento = Decimal(str(valor_complemento))
            if valor_complemento <= 0:
                raise ValueError("Valor deve ser positivo")
        except (ValueError, InvalidOperation) as e:
            return Response(
                {'sucesso': False, 'mensagem': f'Valor inv�lido: {str(e)}'},
                status=400
            )
        
        # Campos opcionais
        base_calculo = request.data.get('base_calculo')
        aliquota = request.data.get('aliquota')
        observacoes = request.data.get('observacoes', '')
        
        try:
            if base_calculo:
                base_calculo = Decimal(str(base_calculo))
            if aliquota:
                aliquota = Decimal(str(aliquota))
        except (ValueError, InvalidOperation) as e:
            return Response(
                {'sucesso': False, 'mensagem': f'Valor num�rico inv�lido: {str(e)}'},
                status=400
            )
        
        # Criar complemento
        complemento = ComplementoICMSNFe.objects.create(
            id_venda_referencia=venda,
            tipo_complemento=tipo_complemento,
            valor_complemento=valor_complemento,
            base_calculo=base_calculo,
            aliquota=aliquota,
            motivo=motivo,
            observacoes=observacoes,
            status='PENDENTE',
            usuario=request.user
        )
        
        from rest_framework import serializers
        
        class ComplementoICMSSerializer(serializers.ModelSerializer):
            class Meta:
                model = ComplementoICMSNFe
                fields = '__all__'
        
        return Response({
            'sucesso': True,
            'mensagem': 'Complemento de ICMS criado com sucesso. Use o endpoint /emitir para gerar a NFe.',
            'complemento': ComplementoICMSSerializer(complemento).data
        }, status=201)


class EmitirComplementoICMSView(APIView):
    """
    POST /api/vendas/<id_venda>/complemento_icms/<id_complemento>/emitir/
    Emite uma NFe de complemento de ICMS
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, id_venda, id_complemento):
        from .models import ComplementoICMSNFe
        from decimal import Decimal
        
        venda_ref = get_object_or_404(Venda, pk=id_venda)
        complemento = get_object_or_404(
            ComplementoICMSNFe,
            pk=id_complemento,
            id_venda_referencia=venda_ref
        )
        
        if complemento.status == 'EMITIDA':
            return Response({
                'sucesso': False,
                'mensagem': 'Este complemento j� foi emitido.',
                'id_venda_complemento': complemento.id_venda_complemento.id_venda if complemento.id_venda_complemento else None
            }, status=400)
        
        # Criar uma nova venda (NFe de complemento)
        # A NFe de complemento deve referenciar a NFe original
        try:
            with transaction.atomic():
                venda_complemento = Venda.objects.create(
                    id_operacao=venda_ref.id_operacao,
                    id_cliente=venda_ref.id_cliente,
                    numero_documento=f"COMP-{venda_ref.numero_documento or venda_ref.id_venda}",
                    valor_total=complemento.valor_complemento,
                    taxa_entrega=Decimal('0.00'),
                    criado_por=request.user,
                    gerou_financeiro=0,
                    vista=1,
                    status_nfe='PENDENTE',
                    # Campos de transporte iguais
                    tipo_frete=venda_ref.tipo_frete,
                    transportadora=venda_ref.transportadora,
                    # Observa��es
                    observacao_fisco=f"NFe de Complemento de {complemento.tipo_complemento}. "
                                    f"Ref: NFe {venda_ref.numero_nfe or venda_ref.chave_nfe}. "
                                    f"Motivo: {complemento.motivo}",
                    observacao_contribuinte=complemento.observacoes or ''
                )
                
                # Atualizar o complemento
                complemento.id_venda_complemento = venda_complemento
                complemento.status = 'EMITIDA'
                complemento.data_emissao = timezone.now()
                complemento.save()
                
                return Response({
                    'sucesso': True,
                    'mensagem': 'Venda de complemento criada. Agora transmita a NFe normalmente.',
                    'id_venda_complemento': venda_complemento.id_venda,
                    'numero_documento': venda_complemento.numero_documento,
                    'next_action': f'/api/vendas/{venda_complemento.id_venda}/transmitir_nfe/'
                }, status=201)
                
        except Exception as e:
            logger.exception("Erro ao emitir complemento de ICMS")
            return Response({
                'sucesso': False,
                'mensagem': f'Erro ao criar venda de complemento: {str(e)}'
            }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pdv_nfce_page(request):
    config = EmpresaConfig.get_ativa()
    return render(request, 'api/nfce_pdv.html', {'config': config})


# ---------------------------------------------------------------------------
# CONTROLE DE ENTREGA
# ---------------------------------------------------------------------------

class EntregasView(APIView):
    """
    GET /vendas/entregas/
        Lista vendas para controle de entrega.
        Query params:
          status  - filtra pelo status_logistica (ex: PREPARANDO, DESPACHADO…)
                    Se omitido, retorna tudo exceto ENTREGUE.
          todos   - se '1', retorna inclusive ENTREGUE.
          busca   - texto livre para filtrar por nº documento ou cliente.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        todos = request.query_params.get('todos', '0') == '1'
        status_filter = request.query_params.get('status', None)
        busca = request.query_params.get('busca', '').strip()

        qs = Venda.objects.select_related('id_cliente', 'id_operacao').order_by('-data_documento')

        if status_filter:
            qs = qs.filter(status_logistica=status_filter)
        elif not todos:
            qs = qs.exclude(status_logistica='ENTREGUE')

        if busca:
            qs = qs.filter(
                Q(numero_documento__icontains=busca) |
                Q(id_cliente__nome_razao_social__icontains=busca)
            )

        qs = qs[:300]

        resultado = []
        for v in qs:
            itens_qs = VendaItem.objects.filter(id_venda=v).select_related('id_produto')
            itens_data = []
            for item in itens_qs:
                itens_data.append({
                    'id_item': item.id_item,
                    'produto': item.id_produto.nome_produto if item.id_produto else '',
                    'codigo': item.id_produto.codigo_produto if item.id_produto else '',
                    'quantidade': str(item.quantidade),
                    'quantidade_entregue': str(item.quantidade_entregue or Decimal('0.000')),
                    'valor_unitario': str(item.valor_unitario),
                    'valor_total': str(item.valor_total),
                })

            logs_qs = VendaEntregaLog.objects.filter(id_venda=v).select_related('usuario').order_by('data_log')
            logs_data = []
            for log in logs_qs:
                logs_data.append({
                    'id_entrega_log': log.id_entrega_log,
                    'status_anterior': log.status_anterior,
                    'status_novo': log.status_novo,
                    'observacao': log.observacao or '',
                    'data_log': log.data_log.isoformat(),
                    'usuario': log.usuario.get_full_name() or log.usuario.username if log.usuario else '',
                    'recebedor_nome': log.recebedor_nome or '',
                    'recebedor_documento': log.recebedor_documento or '',
                })

            resultado.append({
                'id_venda': v.id_venda,
                'numero_documento': v.numero_documento or f'#{v.id_venda}',
                'data_documento': v.data_documento.isoformat() if v.data_documento else None,
                'cliente': v.id_cliente.nome_razao_social if v.id_cliente else 'Consumidor Final',
                'cliente_telefone': v.id_cliente.telefone if v.id_cliente else '',
                'valor_total': str(v.valor_total),
                'taxa_entrega': str(v.taxa_entrega or Decimal('0.00')),
                'status_logistica': v.status_logistica,
                'endereco_entrega': v.endereco_entrega or '',
                'data_prevista_entrega': v.data_prevista_entrega.isoformat() if v.data_prevista_entrega else None,
                'responsavel_entrega': v.responsavel_entrega or '',
                'observacao_entrega': v.observacao_entrega or '',
                'itens': itens_data,
                'logs': logs_data,
            })

        return Response(resultado)


class AtualizarEntregaView(APIView):
    """
    PATCH /vendas/<id_venda>/atualizar_entrega/
        Atualiza o status logístico da venda, registra log e permite
        atualizar as quantidades entregues por item.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, id_venda):
        venda = get_object_or_404(Venda, pk=id_venda)

        novo_status = request.data.get('status_logistica')
        observacao = request.data.get('observacao', '')
        recebedor_nome = request.data.get('recebedor_nome', '')
        recebedor_documento = request.data.get('recebedor_documento', '')
        endereco_entrega = request.data.get('endereco_entrega')
        data_prevista_entrega = request.data.get('data_prevista_entrega')
        responsavel_entrega = request.data.get('responsavel_entrega')
        observacao_entrega = request.data.get('observacao_entrega')

        status_anterior = venda.status_logistica

        # Registrar log apenas se o status mudou
        if novo_status and novo_status != status_anterior:
            VendaEntregaLog.objects.create(
                id_venda=venda,
                status_anterior=status_anterior,
                status_novo=novo_status,
                observacao=observacao,
                usuario=request.user,
                recebedor_nome=recebedor_nome,
                recebedor_documento=recebedor_documento,
            )
            venda.status_logistica = novo_status

        # Atualizar campos de entrega
        if endereco_entrega is not None:
            venda.endereco_entrega = endereco_entrega
        if data_prevista_entrega is not None:
            venda.data_prevista_entrega = data_prevista_entrega or None
        if responsavel_entrega is not None:
            venda.responsavel_entrega = responsavel_entrega
        if observacao_entrega is not None:
            venda.observacao_entrega = observacao_entrega

        # Atualizar quantidades entregues por item
        itens_atualizados = request.data.get('itens', [])
        for item_data in itens_atualizados:
            try:
                item = VendaItem.objects.get(id_item=item_data['id_item'], id_venda=venda)
                nova_qtd = Decimal(str(item_data.get('quantidade_entregue', item.quantidade_entregue or '0')))
                if nova_qtd > item.quantidade:
                    nome_prod = item.id_produto.nome_produto if item.id_produto else str(item.id_item)
                    return Response(
                        {'detail': f'Quantidade entregue de "{nome_prod}" ultrapassa a quantidade pedida.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                item.quantidade_entregue = nova_qtd
                item.save(update_fields=['quantidade_entregue'])
            except VendaItem.DoesNotExist:
                pass
            except (InvalidOperation, ValueError):
                pass

        venda.save()

        return Response({
            'ok': True,
            'id_venda': venda.id_venda,
            'status_logistica': venda.status_logistica,
        })

