# api/views_split_payment.py
"""
Views para Split Payment - Reforma Tributária 2026
Cálculo automático de IBS/CBS e integração com aprovação via WhatsApp
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Case, When
from decimal import Decimal

from .models import (
    Venda, 
    VendaItem,
    RegraFiscalReforma, 
    SplitPaymentConfig, 
    VendaSplitPayment,
    SolicitacaoAprovacao,
    EmpresaConfig
)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calcular_split_payment(request, venda_id):
    """
    Calcula Split Payment (IBS/CBS) para uma venda
    
    Fluxo:
    1. Busca regras fiscais de cada item
    2. Calcula IBS-UF, IBS-Mun, CBS
    3. Verifica se excede limite de alerta
    4. Se exceder, cria solicitação de aprovação via WhatsApp
    5. Retorna valores calculados e status de aprovação
    
    POST /api/vendas/{id}/calcular-split/
    
    Response:
    {
        "requer_aprovacao": false,
        "split_id": 123,
        "percentual_retencao": 27.5,
        "valores": {
            "liquido_empresa": 725.00,
            "ibs_uf": 180.00,
            "ibs_mun": 10.00,
            "cbs": 85.00,
            "total_retido": 275.00
        },
        "detalhamento_itens": [...]
    }
    """
    try:
        venda = Venda.objects.select_related('id_cliente', 'id_operacao').get(id_venda=venda_id)
    except Venda.DoesNotExist:
        return Response(
            {"erro": "Venda não encontrada"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Buscar configuração de split da empresa
    try:
        config = SplitPaymentConfig.objects.get(empresa=venda.id_operacao.id_empresa, ativo=True)
    except SplitPaymentConfig.DoesNotExist:
        return Response(
            {
                "erro": "Split Payment não configurado para esta empresa",
                "sugestao": "Configure em Configurações > Split Payment > Adquirente"
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Se split não está ativo, retorna valores zerados
    if not config.split_automatico:
        return Response({
            "split_automatico": False,
            "mensagem": "Split Payment desativado para esta empresa"
        })
    
    # Calcular split por item
    valor_ibs_uf_total = Decimal('0.00')
    valor_ibs_mun_total = Decimal('0.00')
    valor_cbs_total = Decimal('0.00')
    detalhamento_itens = []
    itens_sem_regra = []
    
    itens = VendaItem.objects.filter(id_venda=venda).select_related('id_produto')
    
    for item in itens:
        # Buscar regra fiscal vigente para o produto
        uf_destino = venda.id_cliente.estado if venda.id_cliente else None
        
        regra = RegraFiscalReforma.objects.filter(
            produto=item.id_produto,
            vigencia_inicio__lte=venda.data_emissao or timezone.now().date(),
            is_split_active=True
        ).filter(
            # Busca regra específica da UF ou geral (uf_aplicacao=null)
            Q(uf_aplicacao=uf_destino) | Q(uf_aplicacao__isnull=True)
        ).order_by(
            # Prioriza regra específica da UF, depois por data mais recente
            Case(
                When(uf_aplicacao=uf_destino, then=0),
                default=1
            ),
            '-vigencia_inicio'
        ).first()
        
        if not regra:
            # Item sem regra fiscal cadastrada
            itens_sem_regra.append({
                "produto_id": item.id_produto.id_produto,
                "produto_nome": item.id_produto.descricao,
                "ncm": item.id_produto.ncm or "SEM NCM"
            })
            continue
        
        # Calcular impostos do item
        valores_item = regra.calcular_impostos(item.valor_total)
        
        valor_ibs_uf_total += Decimal(str(valores_item['valor_ibs_uf']))
        valor_ibs_mun_total += Decimal(str(valores_item['valor_ibs_mun']))
        valor_cbs_total += Decimal(str(valores_item['valor_cbs']))
        
        detalhamento_itens.append({
            "item_id": item.id_item,
            "produto": item.id_produto.descricao,
            "ncm": regra.ncm,
            "valor_item": float(item.valor_total),
            "aliquota_ibs_uf": float(regra.aliquota_ibs_uf),
            "aliquota_ibs_mun": float(regra.aliquota_ibs_mun),
            "aliquota_cbs": float(regra.aliquota_cbs),
            "valor_ibs_uf": valores_item['valor_ibs_uf'],
            "valor_ibs_mun": valores_item['valor_ibs_mun'],
            "valor_cbs": valores_item['valor_cbs'],
            "total_retido_item": valores_item['total_retido'],
            "aliquota_reduzida": regra.aliquota_reduzida,
            "descricao_beneficio": regra.descricao_beneficio
        })
    
    # Alertar se houver itens sem regra
    if itens_sem_regra:
        return Response(
            {
                "erro": "Produtos sem regra fiscal da Reforma 2026 cadastrada",
                "itens_sem_regra": itens_sem_regra,
                "sugestao": "Configure as alíquotas IBS/CBS em Cadastros > Regras Fiscais Reforma 2026"
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Calcular totais
    valor_total_retido = valor_ibs_uf_total + valor_ibs_mun_total + valor_cbs_total
    valor_liquido_empresa = venda.valor_total - valor_total_retido
    percentual_retencao = (valor_total_retido / venda.valor_total * 100) if venda.valor_total > 0 else Decimal('0')
    
    # Verificar se excede limite de alerta
    requer_aprovacao = percentual_retencao > config.percentual_alerta
    
    # Criar ou atualizar registro de Split Payment
    with transaction.atomic():
        split, criado = VendaSplitPayment.objects.update_or_create(
            venda=venda,
            defaults={
                'valor_liquido_empresa': valor_liquido_empresa,
                'valor_ibs_uf': valor_ibs_uf_total,
                'valor_ibs_mun': valor_ibs_mun_total,
                'valor_cbs': valor_cbs_total,
                'valor_total_retido': valor_total_retido,
                'percentual_retencao': percentual_retencao,
                'requer_aprovacao_supervisor': requer_aprovacao,
                'detalhamento_itens': detalhamento_itens
            }
        )
        
        # Se requer aprovação, criar solicitação via WhatsApp
        if requer_aprovacao and not split.aprovacao:
            # Criar solicitação de aprovação
            solicitacao = SolicitacaoAprovacao.objects.create(
                tipo='split_payment_alto',
                usuario_solicitante=request.user,
                status='PENDENTE',
                dados_solicitacao={
                    "venda_id": venda.id_venda,
                    "cliente": venda.id_cliente.nome_razao_social if venda.id_cliente else "CONSUMIDOR",
                    "valor_total": float(venda.valor_total),
                    "percentual_retencao": float(percentual_retencao),
                    "limite_configurado": float(config.percentual_alerta),
                    "valor_ibs": float(valor_ibs_uf_total + valor_ibs_mun_total),
                    "valor_cbs": float(valor_cbs_total),
                    "itens_destaque": [
                        item for item in detalhamento_itens 
                        if item['total_retido_item'] > 0
                    ][:3]  # Primeiros 3 itens com maior retenção
                }
            )
            
            split.aprovacao = solicitacao
            
            # Identificar motivo da exceção
            motivos = []
            for item_det in detalhamento_itens:
                if item_det['aliquota_ibs_uf'] + item_det['aliquota_ibs_mun'] + item_det['aliquota_cbs'] > 30:
                    motivos.append(f"NCM {item_det['ncm']} com carga tributária de {item_det['aliquota_ibs_uf'] + item_det['aliquota_ibs_mun'] + item_det['aliquota_cbs']}%")
            
            split.motivo_excecao = "; ".join(motivos) if motivos else "Retenção total excede limite configurado"
            split.save()
            
            # Enviar WhatsApp ao supervisor
            enviar_aprovacao_split_whatsapp(solicitacao.id)
    
    # Resposta
    response_data = {
        "requer_aprovacao": requer_aprovacao,
        "split_id": split.id_split,
        "percentual_retencao": float(percentual_retencao),
        "percentual_alerta": float(config.percentual_alerta),
        "valores": {
            "liquido_empresa": float(valor_liquido_empresa),
            "ibs_uf": float(valor_ibs_uf_total),
            "ibs_mun": float(valor_ibs_mun_total),
            "cbs": float(valor_cbs_total),
            "total_retido": float(valor_total_retido)
        },
        "detalhamento_itens": detalhamento_itens
    }
    
    if requer_aprovacao and split.aprovacao:
        response_data["solicitacao_id"] = split.aprovacao.id
        response_data["mensagem"] = f"Retenção de {percentual_retencao:.1f}% excede o limite de {config.percentual_alerta}%. Aguardando aprovação do supervisor via WhatsApp."
        response_data["motivo"] = split.motivo_excecao
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def processar_split_payment(request, split_id):
    """
    Processa o Split Payment com o adquirente (Stone, Cielo, etc.)
    
    POST /api/split-payment/{id}/processar/
    
    Payload esperado:
    {
        "payment_method_id": "pm_123",  // ID do método de pagamento no adquirente
        "force": false  // Forçar processamento mesmo com aprovação pendente
    }
    
    Response:
    {
        "sucesso": true,
        "transaction_id": "txn_abc123",
        "split_realizado": true,
        "mensagem": "Split processado com sucesso"
    }
    """
    try:
        split = VendaSplitPayment.objects.select_related(
            'venda', 
            'venda__id_operacao__id_empresa__split_payment_config',
            'aprovacao'
        ).get(id_split=split_id)
    except VendaSplitPayment.DoesNotExist:
        return Response(
            {"erro": "Split Payment não encontrado"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar se já foi processado
    if split.split_realizado:
        return Response(
            {
                "erro": "Split já foi processado anteriormente",
                "transaction_id": split.split_transaction_id,
                "data_processamento": split.split_data_hora
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar se requer aprovação pendente
    force = request.data.get('force', False)
    if split.requer_aprovacao_supervisor and not force:
        if not split.aprovacao or split.aprovacao.status != 'APROVADO':
            return Response(
                {
                    "erro": "Split requer aprovação do supervisor",
                    "solicitacao_id": split.aprovacao.id if split.aprovacao else None,
                    "status_aprovacao": split.aprovacao.status if split.aprovacao else "NÃO CRIADA"
                },
                status=status.HTTP_403_FORBIDDEN
            )
    
    # Buscar configuração do adquirente
    config = split.venda.id_operacao.id_empresa.split_payment_config
    
    # TODO: Implementar integração real com API do adquirente
    # Por enquanto, simula sucesso em sandbox
    if config.ambiente == 'SANDBOX':
        import uuid
        mock_transaction_id = f"mock_txn_{uuid.uuid4().hex[:12]}"
        
        split.marcar_como_realizado(
            transaction_id=mock_transaction_id,
            response_data={
                "ambiente": "SANDBOX",
                "adquirente": config.adquirente,
                "status": "approved",
                "mock": True
            }
        )
        
        return Response({
            "sucesso": True,
            "transaction_id": mock_transaction_id,
            "split_realizado": True,
            "mensagem": "Split processado com sucesso (SANDBOX)",
            "ambiente": "SANDBOX"
        }, status=status.HTTP_200_OK)
    
    # Ambiente de produção - integração real pendente
    return Response(
        {
            "erro": "Integração com adquirente em produção não implementada",
            "adquirente": config.adquirente,
            "sugestao": "Use ambiente SANDBOX ou aguarde implementação da API do adquirente"
        },
        status=status.HTTP_501_NOT_IMPLEMENTED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verificar_split_status(request, venda_id):
    """
    Verifica status do Split Payment de uma venda
    
    GET /api/vendas/{id}/split-status/
    
    Response:
    {
        "split_calculado": true,
        "split_realizado": false,
        "requer_aprovacao": true,
        "aprovacao_status": "PENDENTE",
        "valores": {...}
    }
    """
    try:
        venda = Venda.objects.get(id_venda=venda_id)
    except Venda.DoesNotExist:
        return Response(
            {"erro": "Venda não encontrada"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        split = VendaSplitPayment.objects.select_related('aprovacao').get(venda=venda)
        
        return Response({
            "split_calculado": True,
            "split_realizado": split.split_realizado,
            "requer_aprovacao": split.requer_aprovacao_supervisor,
            "aprovacao_status": split.aprovacao.status if split.aprovacao else None,
            "aprovacao_id": split.aprovacao.id if split.aprovacao else None,
            "percentual_retencao": float(split.percentual_retencao),
            "valores": {
                "liquido_empresa": float(split.valor_liquido_empresa),
                "total_retido": float(split.valor_total_retido),
                "ibs_uf": float(split.valor_ibs_uf),
                "ibs_mun": float(split.valor_ibs_mun),
                "cbs": float(split.valor_cbs)
            },
            "transaction_id": split.split_transaction_id,
            "data_processamento": split.split_data_hora
        })
        
    except VendaSplitPayment.DoesNotExist:
        return Response({
            "split_calculado": False,
            "mensagem": "Split ainda não foi calculado para esta venda"
        })


# ===================================
# INTEGRAÇÃO COM APROVAÇÃO VIA WHATSAPP
# ===================================

def enviar_aprovacao_split_whatsapp(solicitacao_id):
    """
    Envia solicitação de aprovação de Split excepcional via WhatsApp
    Chamado automaticamente quando percentual de retenção > limite
    
    Fluxo:
    1. Monta mensagem explicativa sobre a retenção alta
    2. Envia via WhatsApp Cloud API (ou fallback para Evolution/Desktop)
    3. Gemini AI interpreta resposta do supervisor
    4. Frontend polling atualiza status
    """
    try:
        from .models import SolicitacaoAprovacao
        solicitacao = SolicitacaoAprovacao.objects.get(id=solicitacao_id)
        
        dados = solicitacao.dados_solicitacao
        venda_id = dados.get('venda_id')
        cliente = dados.get('cliente', 'CONSUMIDOR')
        percentual_retencao = dados.get('percentual_retencao', 0)
        limite  = dados.get('limite_configurado', 30)
        valor_ibs = dados.get('valor_ibs', 0)
        valor_cbs = dados.get('valor_cbs', 0)
        itens_destaque = dados.get('itens_destaque', [])
        
        # Buscar telefone do supervisor
        from .models import UserParametros, Operacao, Venda
        
        try:
            venda = Venda.objects.select_related('id_operacao').get(id_venda=venda_id)
            
            # Prioriza whatsapp_supervisor da operação
            telefone_supervisor = venda.id_operacao.whatsapp_supervisor
            
            # Fallback para usuário solicitante
            if not telefone_supervisor:
                params = UserParametros.objects.filter(user=solicitacao.usuario_solicitante).first()
                telefone_supervisor = params.whatsapp_supervisor if params else None
            
            if not telefone_supervisor:
                print("[SPLIT PAYMENT] Supervisor sem WhatsApp configurado")
                return False
                
        except Exception as e:
            print(f"[SPLIT PAYMENT] Erro ao buscar supervisor: {e}")
            return False
        
        # Construir mensagem
        mensagem_itens = ""
        if itens_destaque:
            mensagem_itens = "\n\n📦 *Principais itens:*\n"
            for item in itens_destaque[:3]:
                mensagem_itens += f"• {item.get('produto', 'Item')}: NCM {item.get('ncm', '---')} ({item.get('aliquota_ibs_uf', 0) + item.get('aliquota_ibs_mun', 0) + item.get('aliquota_cbs', 0):.1f}%)\n"
        
        mensagem = f"""⚠️ *SPLIT PAYMENT EXCEPCIONAL*

🧾 Venda #{venda_id} - {cliente}
💰 Retenção: *{percentual_retencao:.1f}%* (limite: {limite}%)

🏛️ *Valores da Reforma 2026:*
• IBS (Estadual + Municipal): R$ {valor_ibs:.2f}
• CBS (Federal): R$ {valor_cbs:.2f}
• *Total Retido:* R$ {valor_ibs + valor_cbs:.2f}

{mensagem_itens}

📋 *Motivo:* A carga tributária IBS/CBS está acima do limite configurado. Isso pode ocorrer por:
- NCM com alíquota majorada
- Produto sem redução fiscal aplicável
- Destinatário em UF com alíquota diferenciada

✅ Responda *SIM* para LIBERAR a venda
❌ Responda *NAO* para BLOQUEAR

_(Ou copie o link no navegador)_"""
        
        # Enviar via WhatsApp Cloud API (prioridade)
        try:
            from .whatsapp_cloud_service import WhatsAppCloudService
            cloud_service = WhatsAppCloudService()
            
            resultado = cloud_service.enviar_mensagem(telefone_supervisor, mensagem)
            
            if resultado.get('sucesso'):
                print(f"[SPLIT PAYMENT] ✅ WhatsApp enviado via Cloud API para {telefone_supervisor}")
                return True
            else:
                print(f"[SPLIT PAYMENT] ⚠️ Cloud API falhou: {resultado.get('erro')}")
                
        except Exception as e:
            print(f"[SPLIT PAYMENT] ⚠️ Erro ao enviar via Cloud API: {e}")
        
        # Fallback: Evolution API
        try:
            from .whatsapp_views_nativo import enviar_mensagem_evolution
            resultado = enviar_mensagem_evolution(telefone_supervisor, mensagem)
            
            if resultado:
                print(f"[SPLIT PAYMENT] ✅ WhatsApp enviado via Evolution API")
                return True
                
        except Exception as e:
            print(f"[SPLIT PAYMENT] ⚠️ Erro ao enviar via Evolution: {e}")
        
        # Último fallback: Playwright (Desktop)
        try:
            from .whatsapp_playwright_service import  WhatsAppPlaywrightService
            playwright_service = WhatsAppPlaywrightService()
            
            resultado = playwright_service.enviar_mensagem(telefone_supervisor, mensagem)
            
            if resultado:
                print(f"[SPLIT PAYMENT] ✅ WhatsApp enviado via Playwright")
                return True
                
        except Exception as e:
            print(f"[SPLIT PAYMENT] ⚠️ Erro ao enviar via Playwright: {e}")
        
        print("[SPLIT PAYMENT] ❌ Falha em todos os métodos de envio WhatsApp")
        return False
        
    except Exception as e:
        print(f"[SPLIT PAYMENT] ❌ Erro geral: {e}")
        import traceback
        traceback.print_exc()
        return False
