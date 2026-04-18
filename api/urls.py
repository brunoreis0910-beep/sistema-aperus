from django.urls import path, include
from api.cashback_views import relatorio_cashback
from rest_framework.routers import DefaultRouter
from .views_health import HealthCheckView, HealthCheckDetailView

from .views_operacao import ApplyOperacaoView
from .views_vendas import (
    VendaView, ProximoNumeroVendaView, BaixarXMLVendaView, ImprimirDanfeNFeView, ClienteProdutosView,
    NFeView, CancelarNFeView, InutilizarNFeView, LimparNFeErroView,
    NFCeView, CancelarNFCeView, InutilizarNFCeView, LimparNFCeErroView,
    ImprimirDanfceNFCeView, BaixarLoteXMLView,
    CartaCorrecaoNFeView, CartaCorrecaoDownloadXMLView, CartaCorrecaoDeleteView, CartaCorrecaoImprimirView,
    ComplementoICMSNFeView, EmitirComplementoICMSView,
    EntregasView, AtualizarEntregaView,
)
from .views_faturamento import (
    FaturamentoView, OperacoesFiscaisView,
    ValidarEstoqueFiscalView, AjustarItensFaturamentoView, ConverterCupomParaNFeView,
    ListarVendasComFiltrosView
)
from .views_ui import PDVNFCeView
from cte.api_views import CTeViewSet
from .views_catalogo import CatalogoViewSet, WhatsAppViewSet
from .views_relatorios import RelatoriosViewSet
from .views_devolucao import DevolucaoViewSet, CreditoClienteViewSet
from .views_devolucao_custom import buscar_venda_view, buscar_compra_view
from .views_graficos import GraficosComparativosView
from .views_aniversario import AniversariantesView, EnviarMensagemAniversarioView
from .views_produto import ProdutoViewSetCustom
from .views_produto_turbo import (
    cadastro_turbo_produto,
    salvar_produto_turbo,
    imagem_job_status,
    classificar_produto_ia,
    pesquisar_precos_regiao,
    listar_categorias_mercadologicas,
    invalidar_cache_ean
)
from .views_produto_turbo_xml import (
    cadastro_turbo_importar_xml,
    cadastro_turbo_importar_xml_e_salvar
)
from .views_importar_xml import (
    importar_xml_view,
    preparar_produto_xml_para_cadastro_turbo
)
from .views_cotacao import CotacaoViewSet
from .views_promocao import PromocaoViewSet
from .views_proxy import proxy_image
from .views_cashback import (
    CashbackSaldoView,
    CashbackGerarView,
    CashbackUtilizarView,
    CashbackHistoricoView,
    CashbackExpirarView,
    CashbackListView
)
from .views_notificacoes import NotificacoesIniciaisView, CashbacksVencendoView, InadimplenciaDetalhadaView, EstoqueCriticoDetalhadoView, FornecedoresEstoqueCriticoView
from .views_relatorios_cliente import (
    RelatorioTotalPagamentosView, RelatorioExtratoClienteView,
    RelatorioTotalGastosView, RelatorioVendas12MesesView,
    RelatorioDesempenhoClienteView, RelatorioTipoClienteView,
    RelatorioCaracteristicasView, RelatorioDebitoContaView,
    RelatorioCreditoClienteView, RelatorioContratosClienteView,
    RelatorioIndicacoesView, RelatorioDadosCompletosView,
)
from .views_relatorios_produto import (
    RelNivelEstoqueView, RelCustoEstoqueView, RelEstoqueMinMaxView,
    RelListaPrecoEstoqueView, RelDevolucoesView, RelValorProdutosVendasView,
    RelPisCofinsView, RelEntradasSaidasView, RelGrupoProdutosView,
    RelVencimentoEstoqueView, RelLucroEstoqueView, RelValorEstoqueView,
    RelBaixaRotatividadeView, RelMaisVendidosView, RelProdutosAlteradosView,
)
from .views_relatorios_venda import (
    RelHistoricoVendasView, RelLucroVendasView, RelAgrupadoDiaView,
    RelAgrupadoDiaDescView, RelRecibosGeradosView, RelPedidoVendaPorDataView,
    RelTotalVendasQuantidadeView, RelPedidoVendaAbertaView,
    RelCobrancasPendentesView, RelVendasPorClienteView,
    RelVendasCidadeVendedorView, RelLucroVendedorView,
    RelVendasCaracteristicaView, RelUltimaCompraClienteView,
    RelCustoVendaCartaoView, RelFreteView,
)
from .viewsets_cashback import CashbackViewSet
from .views_ordem_servico import OrdemServicoViewSet, TecnicoViewSet, OsFotoViewSet, OsAssinaturaViewSet
from .views_bi_os import DashboardBIOSView
from .views_status_os import StatusOrdemServicoViewSet
from .views_movimentacao_bancaria import FinanceiroBancarioViewSet
from .views_cheques import ChequeViewSet
from .views_marketplace import MarketplaceConfigViewSet, MarketplaceProdutoViewSet
from .views_tributacao import CalculadoraTributariaView # NOVO
from .views_fiscal import RegraFiscalViewSet, TipoTributacaoViewSet, TributacaoUFViewSet  # CRUD Fiscal
from .views_calculadoras import (
    calcular_revestimento,
    calcular_argamassa,
    calcular_tinta,
    calcular_peso_venda,
    listar_variacoes_produto,
    buscar_produtos_pai,
    get_parametros_calculadora
)
from .views_split_payment import (
    calcular_split_payment,
    processar_split_payment,
    verificar_split_status
)
from .views_email import (
    EmailConfigViewSet,
    EmailTemplateViewSet,
    EmailCampaignViewSet,
    EmailLogViewSet,
    enviar_email_transacional,
    enviar_email_com_template,
    webhook_sendgrid,
    webhook_mailgun,
    enviar_email_documento
)
from .views_caixa import (
    # Controle de Caixa - PDV (NFC-e)
    status_caixa,
    abrir_caixa,
    registrar_movimentacao,
    fechar_caixa,
    listar_fechamentos,
    reimprimir_fechamento,
    # Controle de Caixa - Venda Rápida
    status_caixa_venda,
    abrir_caixa_venda,
    registrar_movimentacao_venda,
    fechar_caixa_venda,
    listar_fechamentos_venda,
    reimprimir_fechamento_venda
)
from .views_ai_chat import (
    AITranscribeView,
    AIChatView,
    AIStatusView,
    AIAnaliseView,
    AIAnaliseNegocioView,
    AITtsView
)
from .views_pdf import (
    GerarRelatorioPDFView,
    PreviewRelatorioPDFView
)
from .views_pdf_relatorios import (
    relatorio_cte_pdf,
    relatorio_cte_excel,
    relatorio_cte_json,
    relatorio_vendas_operacao_pdf,
    relatorio_vendas_pdf,
    relatorio_estoque_pdf,
    relatorio_financeiro_pdf,
    relatorio_conferencia_pdf,
)
from .views_dre import DREGerarView
from .views_mp_point import (
    mp_point_config,
    mp_point_cobrar,
    mp_point_status,
    mp_point_cancelar,
    mp_point_webhook,
    mp_point_diagnostico,
)
from .views_manifestacao import (
    ManifestacaoListView,
    ManifestacaoDetalheView,
    ManifestacaoManifstarView,
    ManifestacaoConsultarNFesView,
    ManifestacaoUltNSUView,
)
from .views_cartoes import RecebimentoCartaoViewSet
from .views_conciliacao import ConciliacaoBancariaView
from .views_comissoes import RelatorioComissoesView
from .views_agro import (
    SafraViewSet, ConversaoUnidadeViewSet, ContratoAgricolaViewSet, VeiculoViewSet,
)
try:
    from .views_agro_operacional import (
        TalhaoViewSet, DespesaAgroViewSet, MaquinarioAgroViewSet,
        LancamentoMaquinarioViewSet, MaoDeObraAgroViewSet, LancamentoMdoViewSet,
    )
    AGRO_OPERACIONAL_AVAILABLE = True
except ImportError:
    AGRO_OPERACIONAL_AVAILABLE = False
from .views_crm import OrigemLeadViewSet, EtapaPipelineViewSet, LeadViewSet, AtividadeLeadViewSet
from .views_rh import (
    FuncionarioViewSet, RegistroPontoViewSet, HoleriteViewSet,
    CategoriaEPIViewSet, EPIViewSet, EntregaEPIViewSet,
    OcorrenciaFuncionarioViewSet,
)
from .views_pix import PixConfigViewSet, CobrancaPixViewSet, WebhookPixView
from .views_recorrencia import ContratoRecorrenciaViewSet, ParcelaRecorrenciaViewSet
from .views_churn import ChurnDashboardView, ChurnClientesRiscoView, ChurnRFMView
from .views_tts import (
    gerar_audio_tts,
    listar_vozes_tts,
    testar_tts,
    tts_aprovacao_desconto,
    download_audio_tts,
    tts_alerta_estoque
)
from .whatsapp_e_aprovacao import (
    # Aprovação de desconto
    SolicitarDescontoWhatsAppView,
    WebhookAprovacaoView,
    StatusAprovacaoView,
    WebhookCloudAprovacaoView,
    WhatsAppStatusView,
    DesktopListenerView,
    ResponderAprovacaoView,
    LinkCurtoAprovacaoView,
    # Fila e configuração
    fila_whatsapp_view,
    fila_whatsapp_detail,
    config_whatsapp_view,
    # QR Code, status e conexão
    gerar_qrcode_whatsapp,
    buscar_qrcode_whatsapp,
    limpar_sessao_playwright,
    verificar_status_whatsapp,
    # Ações adicionais
    enviar_agora_whatsapp,
    gerar_qr_teste_whatsapp,
    abrir_whatsapp_direto,
    # Evolution API — gerenciamento de instância
    evolution_criar_instancia,
    evolution_qrcode,
    evolution_status,
)

from .views import (
    ClienteViewSet,
    GrupoProdutoViewSet,
    ProdutoViewSet,
    FinanceiroContaViewSet,
    OperacaoViewSet,
    DepartamentoViewSet,
    CentroCustoViewSet,
    ContaBancariaViewSet,
    EmpresaConfigViewSet,
    FuncaoViewSet,
    VendedorViewSet,
    UserViewSet,
    UserMeView,
    SolicitacaoAprovacaoViewSet,
    DepositoViewSet,
    EstoqueViewSet,
    EstoqueMovimentacaoViewSet,
    PetViewSet,
    TipoServicoViewSet,
    AgendamentoViewSet,
    AvaliacaoViewSet,
    SessaoAgendamentoViewSet,
    LogAuditoriaViewSet,
    TabelaComercialViewSet,
    consultar_placa,
    consultar_cnpj,
    verificar_senha_supervisor,
    verificar_limite_cliente,
    validar_cliente_atraso,
    EquipamentoViewSet,  # Sistema de Aluguel
    AluguelViewSet,  # Sistema de Aluguel
    ConfiguracaoContratoViewSet,  # Templates de contratos
    MapaCargaViewSet,  # Sistema de Logística
    MapaCargaItemViewSet,  # Sistema de Logística
    ConfiguracaoBancariaViewSet,  # Integração Bancária
    BoletoViewSet,  # Integração Bancária
    ConfiguracaoImpressaoViewSet,  # Impressão por módulo
    LoteProdutoViewSet,  # Controle de Lotes
)

from .viewsets_formapagamento import FormaPagamentoViewSet
from .views_fornecedor import FornecedorViewSet
from .views_compra import CompraViewSet
from .viewsets_operacao import OperacaoViewSet as OperacaoViewSetCustom, OperacaoNumeracaoViewSet, NumeracaoViewSet, ConjuntoOperacaoViewSet
from .viewsets_config_produto import ConfiguracaoProdutoViewSet
from .views_veiculo_novo import VeiculoNovoViewSet, VendaItemVeiculoNovoView
from .views_intelligence import ProductIntelligenceViewSet
from .views_pcp import OrdemProducaoViewSet, ComposicaoProdutoViewSet
from .views_sped import SpedGerarView, SpedSalvarConfigView, SpedEnviarEmailView
from .views_sped_contribuicoes import SpedContribuicoesGerarView, SpedContribuicoesSalvarConfigView, SpedContribuicoesCarregarConfigView

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'grupos-produto', GrupoProdutoViewSet, basename='grupoproduto')
router.register(r'produtos', ProdutoViewSetCustom, basename='produto')
router.register(r'contas', FinanceiroContaViewSet, basename='conta')
router.register(r'operacoes', OperacaoViewSetCustom, basename='operacao')
router.register(r'conjuntos-operacoes', ConjuntoOperacaoViewSet, basename='conjunto-operacao')
router.register(r'operacao-numeracoes', OperacaoNumeracaoViewSet, basename='operacao-numeracao')
router.register(r'numeracoes', NumeracaoViewSet, basename='numeracao')
router.register(r'departamentos', DepartamentoViewSet, basename='departamento')
router.register(r'centro-custo', CentroCustoViewSet, basename='centrocusto')
router.register(r'contas-bancarias', ContaBancariaViewSet, basename='contabancaria')
router.register(r'empresa', EmpresaConfigViewSet, basename='empresa')
router.register(r'funcoes', FuncaoViewSet, basename='funcao')
router.register(r'vendedores', VendedorViewSet, basename='vendedor')
router.register(r'usuarios', UserViewSet, basename='usuario')
router.register(r'solicitacoes', SolicitacaoAprovacaoViewSet, basename='solicitacao')
router.register(r'formas-pagamento', FormaPagamentoViewSet, basename='formapagamento')
router.register(r'fornecedores', FornecedorViewSet, basename='fornecedor')
router.register(r'compras', CompraViewSet, basename='compra')
router.register(r'depositos', DepositoViewSet, basename='deposito')
router.register(r'estoque', EstoqueViewSet, basename='estoque')
router.register(r'estoque-movimentacoes', EstoqueMovimentacaoViewSet, basename='estoque-movimentacao')
router.register(r'catalogos', CatalogoViewSet, basename='catalogos')
router.register(r'relatorios', RelatoriosViewSet, basename='relatorios')
router.register(r'whatsapp', WhatsAppViewSet, basename='whatsapp')
router.register(r'devolucoes', DevolucaoViewSet, basename='devolucoes')
router.register(r'creditos', CreditoClienteViewSet, basename='creditos')
router.register(r'cotacoes', CotacaoViewSet, basename='cotacoes')
router.register(r'promocoes', PromocaoViewSet, basename='promocao')
router.register(r'pets', PetViewSet, basename='pet')
router.register(r'tipo-servicos', TipoServicoViewSet, basename='tipo-servico')
router.register(r'agendamentos', AgendamentoViewSet, basename='agendamento')
router.register(r'sessoes-agendamento', SessaoAgendamentoViewSet, basename='sessao-agendamento')
router.register(r'avaliacoes', AvaliacaoViewSet, basename='avaliacao')
router.register(r'logs-auditoria', LogAuditoriaViewSet, basename='log-auditoria')
router.register(r'cashbacks', CashbackViewSet, basename='cashback')
router.register(r'ordem-servico', OrdemServicoViewSet, basename='ordem-servico')
router.register(r'os-fotos', OsFotoViewSet, basename='os-foto')
router.register(r'os-assinaturas', OsAssinaturaViewSet, basename='os-assinatura')
router.register(r'tecnicos', TecnicoViewSet, basename='tecnico')
router.register(r'tabelas-comerciais', TabelaComercialViewSet, basename='tabela-comercial')
router.register(r'status-ordem-servico', StatusOrdemServicoViewSet, basename='status-ordem-servico')
router.register(r'movimentacoes-bancarias', FinanceiroBancarioViewSet, basename='movimentacao-bancaria')
router.register(r'cheques', ChequeViewSet, basename='cheque')
router.register(r'marketplace/config', MarketplaceConfigViewSet, basename='marketplace-config')
router.register(r'marketplace/produtos', MarketplaceProdutoViewSet, basename='marketplace-produtos')
router.register(r'equipamentos', EquipamentoViewSet, basename='equipamento')  # Sistema de Aluguel
router.register(r'alugueis', AluguelViewSet, basename='aluguel')  # Sistema de Aluguel
router.register(r'configuracao-contratos', ConfiguracaoContratoViewSet, basename='configuracao-contrato')  # Templates de contratos
router.register(r'mapas-carga', MapaCargaViewSet, basename='mapa-carga')  # Sistema de Logística
router.register(r'mapas-carga-itens', MapaCargaItemViewSet, basename='mapa-carga-item')  # Sistema de Logística
router.register(r'configuracoes-bancarias', ConfiguracaoBancariaViewSet, basename='configuracao-bancaria')  # Integração Bancária
router.register(r'configuracao-impressao', ConfiguracaoImpressaoViewSet, basename='configuracao-impressao')  # Configurações de Impressão
router.register(r'lote-produto', LoteProdutoViewSet, basename='lote-produto')  # Controle de Lotes de Produto
router.register(r'boletos', BoletoViewSet, basename='boleto')  # Integração Bancária
router.register(r'config-produto', ConfiguracaoProdutoViewSet, basename='config-produto')
router.register(r'veiculos-novos', VeiculoNovoViewSet, basename='veiculo-novo')
router.register(r'ctes', CTeViewSet, basename='cte')  # CT-e
router.register(r'regras-fiscais', RegraFiscalViewSet, basename='regras-fiscais')  # ICMS / Regras Fiscais
router.register(r'tipos-tributacao', TipoTributacaoViewSet, basename='tipos-tributacao')  # Perfis de Tributação por Tipo/UF
router.register(r'tributacao-uf', TributacaoUFViewSet, basename='tributacao-uf')  # Linhas de alíquota por UF
# Sistema de E-mail Marketing e Transacional
router.register(r'email/config', EmailConfigViewSet, basename='email-config')
router.register(r'email/templates', EmailTemplateViewSet, basename='email-template')
router.register(r'email/campaigns', EmailCampaignViewSet, basename='email-campaign')
router.register(r'email/logs', EmailLogViewSet, basename='email-log')
router.register(r'intelligence', ProductIntelligenceViewSet, basename='intelligence')
# PCP — Planejamento e Controle de Produção
router.register(r'pcp/ordens', OrdemProducaoViewSet, basename='pcp-ordem')
router.register(r'pcp/composicoes', ComposicaoProdutoViewSet, basename='pcp-composicao')
router.register(r'ordens-producao', OrdemProducaoViewSet, basename='ordens-producao')  # compat ProducaoPage
# CRM — Pipeline de Vendas
router.register(r'crm/origens', OrigemLeadViewSet, basename='crm-origem')
router.register(r'crm/etapas', EtapaPipelineViewSet, basename='crm-etapa')
router.register(r'crm/leads', LeadViewSet, basename='crm-lead')
router.register(r'crm/atividades', AtividadeLeadViewSet, basename='crm-atividade')
# RH — Recursos Humanos
router.register(r'rh/funcionarios', FuncionarioViewSet, basename='rh-funcionario')
router.register(r'rh/pontos', RegistroPontoViewSet, basename='rh-ponto')
router.register(r'rh/holerites', HoleriteViewSet, basename='rh-holerite')
router.register(r'rh/categorias-epi', CategoriaEPIViewSet, basename='rh-categoria-epi')
router.register(r'rh/epis', EPIViewSet, basename='rh-epi')
router.register(r'rh/entregas-epi', EntregaEPIViewSet, basename='rh-entrega-epi')
router.register(r'rh/ocorrencias', OcorrenciaFuncionarioViewSet, basename='rh-ocorrencia')
# Pix Dinâmico
router.register(r'pix/config', PixConfigViewSet, basename='pix-config')
router.register(r'pix/cobrancas', CobrancaPixViewSet, basename='pix-cobranca')
# Contratos de Recorrência
router.register(r'recorrencia/contratos', ContratoRecorrenciaViewSet, basename='recorrencia-contrato')
router.register(r'recorrencia/parcelas', ParcelaRecorrenciaViewSet, basename='recorrencia-parcela')
# Cartões (Recebimentos)
router.register(r'financeiro/cartoes', RecebimentoCartaoViewSet, basename='financeiro-cartao')
# Agro — Módulos de Gestão Agrícola
router.register(r'safras', SafraViewSet, basename='safra')
router.register(r'conversoes-unidades', ConversaoUnidadeViewSet, basename='conversao-unidade')
router.register(r'contratos-agricolas', ContratoAgricolaViewSet, basename='contrato-agricola')
router.register(r'veiculos', VeiculoViewSet, basename='veiculo')
# Agro Operacional
if AGRO_OPERACIONAL_AVAILABLE:
    router.register(r'agro-talhoes', TalhaoViewSet, basename='agro-talhao')
    router.register(r'agro-despesas', DespesaAgroViewSet, basename='agro-despesa')
    router.register(r'agro-maquinarios', MaquinarioAgroViewSet, basename='agro-maquinario')
    router.register(r'agro-lancamentos-maq', LancamentoMaquinarioViewSet, basename='agro-lanc-maq')
    router.register(r'agro-mao-de-obra', MaoDeObraAgroViewSet, basename='agro-mdo')
    router.register(r'agro-lancamentos-mdo', LancamentoMdoViewSet, basename='agro-lanc-mdo')

urlpatterns = [
    path('', include('api.urls_troca')),
    path('comandas/', include('comandas.urls')),
    path('operacoes/apply/', ApplyOperacaoView.as_view(), name='operacoes-apply'),
    path('clientes/<int:id_cliente>/produtos/', ClienteProdutosView.as_view(), name='cliente-produtos'),
    path('vendas/', VendaView.as_view(), name='vendas-list-create'),
    path('vendas/proximo-numero/', ProximoNumeroVendaView.as_view(), name='vendas-proximo-numero'),
    path('vendas/<int:venda_id>/', VendaView.as_view(), name='vendas-detail'),
    path('vendas/<int:id_venda>/download_xml/', BaixarXMLVendaView.as_view(), name='vendas-download-xml'),
    path('vendas/<int:id_venda>/imprimir_danfe/', ImprimirDanfeNFeView.as_view(), name='vendas-imprimir-danfe'),
    # NF-e
    path('vendas/<int:id_venda>/emitir_nfe/', NFeView.as_view(), name='vendas-emitir-nfe'),
    path('vendas/<int:id_venda>/cancelar_nfe/', CancelarNFeView.as_view(), name='vendas-cancelar-nfe'),
    path('vendas/<int:id_venda>/inutilizar_nfe/', InutilizarNFeView.as_view(), name='vendas-inutilizar-nfe'),
    path('vendas/<int:id_venda>/limpar_nfe_erro/', LimparNFeErroView.as_view(), name='vendas-limpar-nfe-erro'),
    path('vendas/<int:id_venda>/carta_correcao/', CartaCorrecaoNFeView.as_view(), name='vendas-carta-correcao'),
    path('vendas/<int:id_venda>/carta_correcao/download_xml/', CartaCorrecaoDownloadXMLView.as_view(), name='vendas-carta-correcao-xml'),
    path('vendas/<int:id_venda>/carta_correcao/delete/', CartaCorrecaoDeleteView.as_view(), name='vendas-carta-correcao-delete'),
    path('vendas/<int:id_venda>/carta_correcao/imprimir/', CartaCorrecaoImprimirView.as_view(), name='vendas-carta-correcao-imprimir'),
    path('vendas/<int:id_venda>/complemento_icms/', ComplementoICMSNFeView.as_view(), name='vendas-complemento-icms'),
    path('vendas/<int:id_venda>/emitir_complemento_icms/', EmitirComplementoICMSView.as_view(), name='vendas-emitir-complemento-icms'),
    # NFC-e
    path('vendas/<int:id_venda>/emitir_nfce/', NFCeView.as_view(), name='vendas-emitir-nfce'),
    path('vendas/<int:id_venda>/cancelar_nfce/', CancelarNFCeView.as_view(), name='vendas-cancelar-nfce'),
    path('vendas/<int:id_venda>/inutilizar_nfce/', InutilizarNFCeView.as_view(), name='vendas-inutilizar-nfce'),
    path('vendas/<int:id_venda>/limpar_nfce_erro/', LimparNFCeErroView.as_view(), name='vendas-limpar-nfce-erro'),
    path('vendas/<int:id_venda>/imprimir_danfce/', ImprimirDanfceNFCeView.as_view(), name='vendas-imprimir-danfce'),
    path('vendas/download_lote_xml/', BaixarLoteXMLView.as_view(), name='vendas-download-lote-xml'),
    # Controle de Entrega
    path('vendas/entregas/', EntregasView.as_view(), name='vendas-entregas'),
    path('vendas/<int:id_venda>/atualizar_entrega/', AtualizarEntregaView.as_view(), name='vendas-atualizar-entrega'),
    # Faturamento
    path('faturamento/', FaturamentoView.as_view(), name='faturamento'),
    path('faturamento/operacoes/', OperacoesFiscaisView.as_view(), name='faturamento-operacoes'),
    # Faturamento Avançado (novo sistema)
    path('faturamento/validar-estoque-fiscal/', ValidarEstoqueFiscalView.as_view(), name='faturamento-validar-estoque-fiscal'),
    path('faturamento/ajustar-itens/', AjustarItensFaturamentoView.as_view(), name='faturamento-ajustar-itens'),
    path('faturamento/converter-cupom-nfe/', ConverterCupomParaNFeView.as_view(), name='faturamento-converter-cupom-nfe'),
    path('faturamento/listar-vendas/', ListarVendasComFiltrosView.as_view(), name='faturamento-listar-vendas'),
    path('pdv-nfce/', PDVNFCeView.as_view(), name='api-pdv-nfce'),
    path('usuarios/me/', UserMeView.as_view(), name='user-me'),
    path('devolucoes/buscar_venda/<int:id_venda>/', buscar_venda_view, name='devolucoes-buscar-venda'),
    path('devolucoes/buscar_compra/<int:id_compra>/', buscar_compra_view, name='devolucoes-buscar-compra'),
    path('graficos/comparativos/', GraficosComparativosView.as_view(), name='graficos-comparativos'),
    path('aniversariantes/', AniversariantesView.as_view(), name='aniversariantes'),
    path('aniversariantes/enviar/', EnviarMensagemAniversarioView.as_view(), name='enviar-aniversario'),
    path('veiculos/consultar-placa/<str:placa>/', consultar_placa, name='consultar-placa'),
    path('consultar-cnpj/<str:cnpj>/', consultar_cnpj, name='consultar-cnpj'),
    path('verificar-senha-supervisor/', verificar_senha_supervisor, name='verificar-senha-supervisor'),
    path('verificar-limite-cliente/', verificar_limite_cliente, name='verificar-limite-cliente'),
    path('validar-cliente-atraso/', validar_cliente_atraso, name='validar-cliente-atraso'),
    path('proxy-image/', proxy_image, name='proxy-image'),
    # Cadastro Turbo de Produtos (EAN + IA + Preços Regionais)
    path('produtos/cadastro-turbo/', cadastro_turbo_produto, name='produtos-cadastro-turbo'),
    path('produtos/salvar-turbo/', salvar_produto_turbo, name='produtos-salvar-turbo'),
    path('produtos/imagem-job/', imagem_job_status, name='produtos-imagem-job'),
    path('produtos/cadastro-turbo/importar-xml/', cadastro_turbo_importar_xml, name='produtos-turbo-importar-xml'),
    path('produtos/cadastro-turbo/importar-xml-salvar/', cadastro_turbo_importar_xml_e_salvar, name='produtos-turbo-importar-xml-salvar'),
    path('produtos/classificar-ia/', classificar_produto_ia, name='produtos-classificar-ia'),
    path('produtos/precos-regiao/', pesquisar_precos_regiao, name='produtos-precos-regiao'),
    path('categorias-mercadologicas/', listar_categorias_mercadologicas, name='categorias-mercadologicas-list'),
    path('produtos/invalidar-cache-ean/', invalidar_cache_ean, name='produtos-invalidar-cache-ean'),
    # Importação de XML de Compras
    path('importar-xml/', importar_xml_view, name='importar-xml'),
    path('importar-xml/preparar-cadastro-turbo/', preparar_produto_xml_para_cadastro_turbo, name='importar-xml-preparar-cadastro-turbo'),
    # Cashback endpoints
    path('cashback/', CashbackListView.as_view(), name='cashback-list'),
    path('cashback/saldo/<int:id_cliente>/', CashbackSaldoView.as_view(), name='cashback-saldo'),
    path('cashback/gerar/', CashbackGerarView.as_view(), name='cashback-gerar'),
    path('cashback/utilizar/', CashbackUtilizarView.as_view(), name='cashback-utilizar'),
    path('cashback/historico/', CashbackHistoricoView.as_view(), name='cashback-historico'),
    path('cashback/expirar/', CashbackExpirarView.as_view(), name='cashback-expirar'),
    path('relatorios/cashback/', relatorio_cashback, name='relatorio-cashback'),
    # Relatórios de Cliente
    path('relatorios/clientes/total-pagamentos/', RelatorioTotalPagamentosView.as_view(), name='rel-cli-pagamentos'),
    path('relatorios/clientes/extrato/', RelatorioExtratoClienteView.as_view(), name='rel-cli-extrato'),
    path('relatorios/clientes/total-gastos/', RelatorioTotalGastosView.as_view(), name='rel-cli-gastos'),
    path('relatorios/clientes/vendas-12-meses/', RelatorioVendas12MesesView.as_view(), name='rel-cli-vendas12'),
    path('relatorios/clientes/desempenho/', RelatorioDesempenhoClienteView.as_view(), name='rel-cli-desempenho'),
    path('relatorios/clientes/tipo-cliente/', RelatorioTipoClienteView.as_view(), name='rel-cli-tipo'),
    path('relatorios/clientes/caracteristicas/', RelatorioCaracteristicasView.as_view(), name='rel-cli-caracteristicas'),
    path('relatorios/clientes/debito-conta/', RelatorioDebitoContaView.as_view(), name='rel-cli-debito'),
    path('relatorios/clientes/credito-cliente/', RelatorioCreditoClienteView.as_view(), name='rel-cli-credito'),
    path('relatorios/clientes/contratos/', RelatorioContratosClienteView.as_view(), name='rel-cli-contratos'),
    path('relatorios/clientes/indicacoes/', RelatorioIndicacoesView.as_view(), name='rel-cli-indicacoes'),
    path('relatorios/clientes/dados-completos/', RelatorioDadosCompletosView.as_view(), name='rel-cli-dados-completos'),
    # Relatórios de Produto
    path('relatorios/produtos/nivel-estoque/', RelNivelEstoqueView.as_view(), name='rel-prod-nivel-estoque'),
    path('relatorios/produtos/custo-estoque/', RelCustoEstoqueView.as_view(), name='rel-prod-custo-estoque'),
    path('relatorios/produtos/estoque-min-max/', RelEstoqueMinMaxView.as_view(), name='rel-prod-min-max'),
    path('relatorios/produtos/lista-preco/', RelListaPrecoEstoqueView.as_view(), name='rel-prod-lista-preco'),
    path('relatorios/produtos/devolucoes/', RelDevolucoesView.as_view(), name='rel-prod-devolucoes'),
    path('relatorios/produtos/valor-vendas/', RelValorProdutosVendasView.as_view(), name='rel-prod-valor-vendas'),
    path('relatorios/produtos/pis-cofins/', RelPisCofinsView.as_view(), name='rel-prod-pis-cofins'),
    path('relatorios/produtos/entradas-saidas/', RelEntradasSaidasView.as_view(), name='rel-prod-entradas-saidas'),
    path('relatorios/produtos/grupo-produtos/', RelGrupoProdutosView.as_view(), name='rel-prod-grupo'),
    path('relatorios/produtos/vencimento-estoque/', RelVencimentoEstoqueView.as_view(), name='rel-prod-vencimento'),
    path('relatorios/produtos/lucro-estoque/', RelLucroEstoqueView.as_view(), name='rel-prod-lucro'),
    path('relatorios/produtos/valor-estoque/', RelValorEstoqueView.as_view(), name='rel-prod-valor-estoque'),
    path('relatorios/produtos/baixa-rotatividade/', RelBaixaRotatividadeView.as_view(), name='rel-prod-baixa-rot'),
    path('relatorios/produtos/mais-vendidos/', RelMaisVendidosView.as_view(), name='rel-prod-mais-vendidos'),
    path('relatorios/produtos/alterados/', RelProdutosAlteradosView.as_view(), name='rel-prod-alterados'),
    # Relatórios de Venda
    path('relatorios/vendas/historico/', RelHistoricoVendasView.as_view(), name='rel-venda-historico'),
    path('relatorios/vendas/lucro/', RelLucroVendasView.as_view(), name='rel-venda-lucro'),
    path('relatorios/vendas/agrupado-dia/', RelAgrupadoDiaView.as_view(), name='rel-venda-agrupado-dia'),
    path('relatorios/vendas/agrupado-dia-desc/', RelAgrupadoDiaDescView.as_view(), name='rel-venda-agrupado-dia-desc'),
    path('relatorios/vendas/recibos/', RelRecibosGeradosView.as_view(), name='rel-venda-recibos'),
    path('relatorios/vendas/pedidos-por-data/', RelPedidoVendaPorDataView.as_view(), name='rel-venda-pedidos-data'),
    path('relatorios/vendas/total-quantidade/', RelTotalVendasQuantidadeView.as_view(), name='rel-venda-total-qtd'),
    path('relatorios/vendas/pedidos-abertos/', RelPedidoVendaAbertaView.as_view(), name='rel-venda-abertos'),
    path('relatorios/vendas/cobrancas/', RelCobrancasPendentesView.as_view(), name='rel-venda-cobrancas'),
    path('relatorios/vendas/por-cliente/', RelVendasPorClienteView.as_view(), name='rel-venda-por-cliente'),
    path('relatorios/vendas/cidade-vendedor/', RelVendasCidadeVendedorView.as_view(), name='rel-venda-cidade-vendedor'),
    path('relatorios/vendas/lucro-vendedor/', RelLucroVendedorView.as_view(), name='rel-venda-lucro-vendedor'),
    path('relatorios/vendas/por-caracteristica/', RelVendasCaracteristicaView.as_view(), name='rel-venda-caracteristica'),
    path('relatorios/vendas/ultima-compra-cliente/', RelUltimaCompraClienteView.as_view(), name='rel-venda-ultima-compra'),
    path('relatorios/vendas/custo-cartao/', RelCustoVendaCartaoView.as_view(), name='rel-venda-custo-cartao'),
    path('relatorios/vendas/frete/', RelFreteView.as_view(), name='rel-venda-frete'),
    # BI Ordem de Serviço
    path('bi/ordem-servico/', DashboardBIOSView.as_view(), name='bi-ordem-servico'),
    # Notificações
    path('notificacoes/', NotificacoesIniciaisView.as_view(), name='notificacoes-list'),
    path('notificacoes/cashbacks-vencendo/', CashbacksVencendoView.as_view(), name='notificacoes-cashback-vencendo'),
    path('notificacoes/inadimplencia/', InadimplenciaDetalhadaView.as_view(), name='notificacoes-inadimplencia'),
    path('notificacoes/estoque-critico/', EstoqueCriticoDetalhadoView.as_view(), name='notificacoes-estoque-critico'),
    path('notificacoes/fornecedores-estoque-critico/', FornecedoresEstoqueCriticoView.as_view(), name='notificacoes-fornecedores'),
    # Tributacao
    path('tributacao/calcular/', CalculadoraTributariaView.as_view(), name='tributacao-calcular'),
    # Calculadoras de Construção
    path('calculadoras/revestimento/', calcular_revestimento, name='calc-revestimento'),
    path('calculadoras/argamassa/', calcular_argamassa, name='calc-argamassa'),
    path('calculadoras/tinta/', calcular_tinta, name='calc-tinta'),
    path('calculadoras/peso/', calcular_peso_venda, name='calc-peso'),
    path('calculadoras/variacoes/<int:id_produto_pai>/', listar_variacoes_produto, name='calc-variacoes'),
    path('calculadoras/produtos-pai/', buscar_produtos_pai, name='calc-produtos-pai'),
    path('calculadoras/parametros/', get_parametros_calculadora, name='calc-parametros'),
    # Assistente IA
    path('ai/status/', AIStatusView.as_view(), name='ai-status'),
    path('ai/chat/', AIChatView.as_view(), name='ai-chat'),
    path('ai/transcribe/', AITranscribeView.as_view(), name='ai-transcribe'),
    path('ai/analise/', AIAnaliseView.as_view(), name='ai-analise'),
    path('ai/analise-negocio/', AIAnaliseNegocioView.as_view(), name='ai-analise-negocio'),
    path('ai/tts/', AITtsView.as_view(), name='ai-tts'),
    # Geração de PDFs dinâmicos pela IA
    path('ai/gerar-pdf/', GerarRelatorioPDFView.as_view(), name='ai-gerar-pdf'),
    path('ai/preview-pdf/', PreviewRelatorioPDFView.as_view(), name='ai-preview-pdf'),
    # Text-to-Speech (TTS) - Vozes Naturais
    path('tts/gerar/', gerar_audio_tts, name='tts-gerar'),
    path('tts/vozes/', listar_vozes_tts, name='tts-vozes'),
    path('tts/testar/', testar_tts, name='tts-testar'),
    path('tts/aprovacao-desconto/', tts_aprovacao_desconto, name='tts-aprovacao-desconto'),
    path('tts/alerta-estoque/', tts_alerta_estoque, name='tts-alerta-estoque'),
    path('tts/audio/<str:filename>', download_audio_tts, name='tts-download-audio'),
    # Aprovação de Desconto via WhatsApp
    path('aprovacao/desconto/', SolicitarDescontoWhatsAppView.as_view(), name='aprovacao-desconto'),
    path('aprovacao/webhook-whatsapp/', WebhookAprovacaoView.as_view(), name='aprovacao-webhook-whatsapp'),
    path('aprovacao/webhook-cloud/', WebhookCloudAprovacaoView.as_view(), name='aprovacao-webhook-cloud'),
    path('aprovacao/<int:pk>/status/', StatusAprovacaoView.as_view(), name='aprovacao-status'),
    path('aprovacao/whatsapp-status/', WhatsAppStatusView.as_view(), name='aprovacao-whatsapp-status'),
    path('aprovacao/desktop-listener/', DesktopListenerView.as_view(), name='aprovacao-desktop-listener'),
    path('aprovacao/responder/<int:pk>/<str:token>/<str:resposta>/', ResponderAprovacaoView.as_view(), name='aprovacao-responder'),
    # Links curtos para WhatsApp (melhor detecção como link clicável)
    path('ap/<int:pk>/<str:token>/<str:acao>/', LinkCurtoAprovacaoView.as_view(), name='aprovacao-link-curto'),
    # WhatsApp Nativo (QR Code, Fila, Config, Status)
    path('whatsapp/fila/', fila_whatsapp_view, name='whatsapp-fila'),
    path('whatsapp/fila/<int:pk>/', fila_whatsapp_detail, name='whatsapp-fila-detail'),
    path('whatsapp/config/', config_whatsapp_view, name='whatsapp-config'),
    path('whatsapp/config/<int:pk>/', config_whatsapp_view, name='whatsapp-config-detail'),
    path('whatsapp/status/', verificar_status_whatsapp, name='whatsapp-status'),
    path('whatsapp/gerar-qrcode/', gerar_qrcode_whatsapp, name='whatsapp-gerar-qrcode'),
    path('whatsapp/buscar-qrcode/', buscar_qrcode_whatsapp, name='whatsapp-buscar-qrcode'),
    path('whatsapp/playwright/limpar/', limpar_sessao_playwright, name='whatsapp-playwright-limpar'),
    path('whatsapp/fila/<int:pk>/enviar/', enviar_agora_whatsapp, name='whatsapp-enviar-agora'),
    path('whatsapp/qr-teste/', gerar_qr_teste_whatsapp, name='whatsapp-qr-teste'),
    path('whatsapp/abrir/', abrir_whatsapp_direto, name='whatsapp-abrir'),
    # Evolution API — gerenciamento de instância
    path('whatsapp/evolution/instancia/', evolution_criar_instancia, name='evolution-criar-instancia'),
    path('whatsapp/evolution/qrcode/', evolution_qrcode, name='evolution-qrcode'),
    path('whatsapp/evolution/status/', evolution_status, name='evolution-status'),
    # Split Payment - Reforma Tributária 2026 (IBS/CBS)
    path('vendas/<int:venda_id>/calcular-split/', calcular_split_payment, name='venda-calcular-split'),
    path('vendas/<int:venda_id>/split-status/', verificar_split_status, name='venda-split-status'),
    path('split-payment/<int:split_id>/processar/', processar_split_payment, name='split-payment-processar'),
    # Sistema de E-mail Marketing e Transacional
    path('email/send/', enviar_email_transacional, name='email-send'),
    path('email/send-template/', enviar_email_com_template, name='email-send-template'),
    path('email/enviar-documento/', enviar_email_documento, name='email-enviar-documento'),
    path('email/webhooks/sendgrid/', webhook_sendgrid, name='email-webhook-sendgrid'),
    path('email/webhooks/mailgun/', webhook_mailgun, name='email-webhook-mailgun'),
    # Controle de Caixa - PDV (NFC-e)
    path('caixa/status/', status_caixa, name='caixa-status'),
    path('caixa/abrir/', abrir_caixa, name='caixa-abrir'),
    path('caixa/fechar/', fechar_caixa, name='caixa-fechar'),
    path('caixa/registrar/', registrar_movimentacao, name='caixa-registrar'),
    path('caixa/fechamentos/', listar_fechamentos, name='caixa-fechamentos'),
    path('caixa/imprimir/<int:id_caixa>/', reimprimir_fechamento, name='caixa-imprimir'),
    # Controle de Caixa - Venda Rápida
    path('caixa-venda/status/', status_caixa_venda, name='caixa-venda-status'),
    path('caixa-venda/abrir/', abrir_caixa_venda, name='caixa-venda-abrir'),
    path('caixa-venda/fechar/', fechar_caixa_venda, name='caixa-venda-fechar'),
    path('caixa-venda/registrar/', registrar_movimentacao_venda, name='caixa-venda-registrar'),
    path('caixa-venda/fechamentos/', listar_fechamentos_venda, name='caixa-venda-fechamentos'),
    path('caixa-venda/imprimir/<int:id_caixa>/', reimprimir_fechamento_venda, name='caixa-venda-imprimir'),
    # Relatórios PDF - Agente de Execução IA
    path('relatorios/cte/pdf/', relatorio_cte_pdf, name='relatorio-cte-pdf'),
    path('relatorios/cte/dados/', relatorio_cte_json, name='relatorio-cte-json'),
    path('relatorios/cte/excel/', relatorio_cte_excel, name='relatorio-cte-excel'),
    path('relatorios/vendas-operacao/pdf/', relatorio_vendas_operacao_pdf, name='relatorio-vendas-operacao-pdf'),
    path('relatorios/vendas/pdf/', relatorio_vendas_pdf, name='relatorio-vendas-pdf'),
    path('relatorios/estoque/pdf/', relatorio_estoque_pdf, name='relatorio-estoque-pdf'),
    path('relatorios/financeiro/pdf/', relatorio_financeiro_pdf, name='relatorio-financeiro-pdf'),
    path('relatorios/conferencia/pdf/', relatorio_conferencia_pdf, name='relatorio-conferencia-pdf'),
    # Veículo Novo (NF-e veicProd)
    path('venda-item/<int:id_venda_item>/veiculo-novo/', VendaItemVeiculoNovoView.as_view(), name='venda-item-veiculo-novo'),
    # DRE (Demonstrativo de Resultado do Exercício)
    path('dre/gerar/', DREGerarView.as_view(), name='dre-gerar'),
    # Conciliação Bancária (importação OFX + análise)
    path('financeiro/conciliacao/', ConciliacaoBancariaView.as_view(), name='financeiro-conciliacao'),
    # Relatório de Comissões
    path('relatorios/comissoes/', RelatorioComissoesView.as_view(), name='relatorio-comissoes'),
    # Manifestação do Destinatário NF-e
    path('manifestacao/', ManifestacaoListView.as_view(), name='manifestacao-list'),
    path('manifestacao/consultar-nfes/', ManifestacaoConsultarNFesView.as_view(), name='manifestacao-consultar-nfes'),
    path('manifestacao/manifestar/', ManifestacaoManifstarView.as_view(), name='manifestacao-manifestar'),
    path('manifestacao/ult-nsu/', ManifestacaoUltNSUView.as_view(), name='manifestacao-ult-nsu'),
    path('manifestacao/<int:pk>/', ManifestacaoDetalheView.as_view(), name='manifestacao-detalhe'),
    # Pix Dinâmico — Webhook (sem autenticação JWT, validado por HMAC)
    path('pix/webhook/', WebhookPixView.as_view(), name='pix-webhook'),
    # Mercado Pago Point Tap — terminais físicos / Tap to Pay
    path('mp-point/config/', mp_point_config, name='mp-point-config'),
    path('mp-point/cobrar/', mp_point_cobrar, name='mp-point-cobrar'),
    path('mp-point/status/<uuid:transacao_uuid>/', mp_point_status, name='mp-point-status'),
    path('mp-point/cancelar/<uuid:transacao_uuid>/', mp_point_cancelar, name='mp-point-cancelar'),
    path('mp-point/webhook/', mp_point_webhook, name='mp-point-webhook'),
    path('mp-point/diagnostico/', mp_point_diagnostico, name='mp-point-diagnostico'),
    # Churn IA — Análise de Clientes em Risco
    path('churn/dashboard/', ChurnDashboardView.as_view(), name='churn-dashboard'),
    path('churn/clientes-risco/', ChurnClientesRiscoView.as_view(), name='churn-clientes-risco'),
    path('churn/rfm/', ChurnRFMView.as_view(), name='churn-rfm'),    # SPED Fiscal (EFD ICMS/IPI)
    path('sped/gerar/', SpedGerarView.as_view(), name='sped-gerar'),
    path('sped/salvar-config/', SpedSalvarConfigView.as_view(), name='sped-salvar-config'),
    path('sped/enviar-email/', SpedEnviarEmailView.as_view(), name='sped-enviar-email'),
    # SPED Contribuições (EFD PIS/COFINS)
    path('sped-contribuicoes/gerar/', SpedContribuicoesGerarView.as_view(), name='sped-contribuicoes-gerar'),
    path('sped-contribuicoes/salvar-config/', SpedContribuicoesSalvarConfigView.as_view(), name='sped-contribuicoes-salvar-config'),
    path('sped-contribuicoes/carregar-config/', SpedContribuicoesCarregarConfigView.as_view(), name='sped-contribuicoes-carregar-config'),    path('', include(router.urls)),
    # Health Check — monitoramento de infraestrutura
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('health/detail/', HealthCheckDetailView.as_view(), name='health-check-detail'),
]
