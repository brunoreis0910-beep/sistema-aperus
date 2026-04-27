import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { MenuStateProvider } from './context/MenuStateContext'
import { GruposProdutoProvider } from './context/GruposProdutoContext'
import { ToastProvider } from './components/common/Toast'
import { lightTheme } from './theme/unifiedTheme'
import DebugLogger from './components/DebugLogger'

// Importa estilos - APENAS CSS LIMPO
import './styles/clean.css'
import './styles/fullscreen-dashboard.css'
import './styles/vendor-fix.css'

// Importa nossas paginas e componentes
import LoginPage from './components/LoginPage'
import LoginSimple from './components/LoginSimple'
import LoginClean from './components/LoginClean'
import AutoLogin from './components/AutoLogin'
import UltraWideDemo from './components/UltraWideDemo'
import FullScreenTest from './components/FullScreenTest'
import LayoutSelector from './components/LayoutSelector'
import DatabaseTest from './components/DatabaseTest';
import APITester from './components/APITester';
import UltraWideConfig from './components/UltraWideConfig';
import FullScreenDashboardTest from './components/FullScreenDashboardTest';
import DashboardHome from './pages/DashboardHome'
import DashboardHomeClean from './pages/DashboardHomeClean'
import DashboardLayout from './components/DashboardLayout'
import DashboardLayoutClean from './components/DashboardLayoutClean'
import ProtectedRoute from './components/ProtectedRoute'
import ClientePageResponsive from './pages/ClientePageResponsive'
import ClientePageComplete from './pages/ClientePageComplete'
import ClientePageCompleteFixed from './pages/ClientePageCompleteFixed'
import ProdutoPageResponsive from './pages/ProdutoPageResponsive'
import CadastroTurboProduto from './pages/CadastroTurboProduto'
import FornecedorPage from './pages/FornecedorPage'
import FinancePage from './pages/FinancePage'
import BancarioPage from './pages/BancarioPage'
import PetShopPage from './pages/PetShopPage'
import ClinicaVeterinariaPage from './pages/ClinicaVeterinariaPage'
import CompraPage from './pages/CompraPage'
import CatalogoPage from './pages/CatalogoPage'
import DevolucaoPage from './pages/DevolucaoPage'
import DevolucoesListPage from './pages/DevolucoesListPage'
import TrocaPage from './pages/TrocaPage'
import TrocasListPage from './pages/TrocasListPage'
import RelatoriosPage from './pages/RelatoriosPage'
import GraficosPage from './pages/GraficosPage'
import SettingsPage from './pages/SettingsPageNew'
import AprovacoesPage from './pages/AprovacoesPage'
import MinhasSolicitacoesPage from './pages/MinhasSolicitacoesPage'
import Vendas from './components/Vendas'
import VendaRapidaPage from './pages/VendaRapidaPage'
import OrdemServicoPage from './pages/OrdemServicoPage'
import EntregasPage from './pages/EntregasPage'
import ComandasPage from './pages/ComandasPage'
import TabelaComercialPage from './pages/TabelaComercialPage'
import VeiculosPage from './pages/VeiculosPage'
import EtiquetasPage from './pages/EtiquetasPage'
import MapaPromocaoPage from './pages/MapaPromocaoPage'
import EstoqueConfig from './components/EstoqueConfig'
import OperacaoTester from './components/OperacaoTester'
import AutoLoginDev from './components/AutoLoginDev'
import AcessoMobile from './pages/AcessoMobile'
import QRCodeFloating from './components/QRCodeFloating'
import ConfiguracaoIP from './pages/ConfiguracaoIP'
import StatusOrdemServicoConfig from './components/StatusOrdemServicoConfig'
import ExemploToast from './pages/ExemploToast'
import ExemploIcones from './pages/ExemploIcones'
import BackupPage from './pages/BackupPage'
import RelatorioCashback from './pages/RelatorioCashback'
import RelatorioLucratividadePage from './pages/RelatorioLucratividadePage'
import RelatorioProjecaoCompraPage from './pages/RelatorioProjecaoCompraPage'
import FichaProdutoPage from './pages/FichaProdutoPage'
import FichaVeiculoPage from './pages/FichaVeiculoPage'
import FichaClientePage from './pages/FichaClientePage'
import RelatoriosClientePage from './pages/RelatoriosClientePage'
import RelatoriosProdutoPage from './pages/RelatoriosProdutoPage'
import RelatoriosVendaPage from './pages/RelatoriosVendaPage'
import ChequesPage from './pages/ChequesPage'
import DebugConexaoPage from './pages/DebugConexaoPage'
import EquipamentosPage from './pages/EquipamentosPage'
import AlugueisPage from './pages/AlugueisPage'
import AluguelNovoPage from './pages/AluguelNovoPage'
import AluguelEditarPage from './pages/AluguelEditarPage'
import ConfiguracaoContratoPage from './pages/ConfiguracaoContratoPage'
import NFCePage from './pages/NFCePage'
import NFePage from './pages/NFePage'
import FaturamentoPage from './pages/FaturamentoPage'
import CTePage from './pages/CTePage'
import AgroPage from './pages/AgroPage'
import AgroSafrasPage from './pages/AgroSafrasPage'
import AgroContratosPage from './pages/AgroContratosPage'
import AgroConversoesPage from './pages/AgroConversoesPage'
import AgroOperacionalPage from './pages/AgroOperacionalPage'
import AgroWhatsappPage from './pages/AgroWhatsappPage'
import SpedPage from './components/SpedPage'
import SpedContribuicoesPage from './components/SpedContribuicoesPage'
import DocumentosFiscaisPage from './components/DocumentosFiscaisPage'
import ManifestacaoPage from './pages/ManifestacaoPage'
import MDFePage from './pages/MDFePage'
import CartoesPage from './pages/CartoesPage'
import ConciliacaoPage from './pages/ConciliacaoPage'
import AgendaPage from './pages/AgendaPage'
import BalancasPage from './pages/BalancasPage'
import ContasServicosPage from './pages/ContasServicosPage'
import CotacaoPage from './pages/CotacaoPage'
import FormasPagamentoPage from './pages/FormasPagamentoPage'
import RelatorioComissoesPage from './pages/RelatorioComissoesPage'
import RelatorioDREPage from './pages/RelatorioDREPage'
import RelatorioInventarioPage from './pages/RelatorioInventarioPage'
import RelatorioCTePage from './pages/RelatorioCTePage'
import RelatorioMDFePage from './pages/RelatorioMDFePage'
import CotacaoRespostaPublica from './pages/CotacaoRespostaPublica'
import ProducaoPage from './pages/ProducaoPage'
import BoletosPage from './pages/BoletosPage'
import MapaCargaPage from './pages/MapaCargaPage'
import AssistenteIAPage from './pages/AssistenteIAPage'
import ConsultorNegociosPage from './pages/ConsultorNegociosPage'
import CRMPage from './pages/CRMPage'
import RHPage from './pages/RHPage'
import PixPage from './pages/PixPage'
import RecorrenciaPage from './pages/RecorrenciaPage'
import ChurnPage from './pages/ChurnPage'
import PontoPage from './pages/PontoPage'
import DashboardBI from './pages/DashboardBI'
import ConsultaEstoquePage from './pages/ConsultaEstoquePage'
import { useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { useOfflineSync } from './context/OfflineSyncContext'

/**
 * Componente bridge que registra o axiosInstance do AuthContext
 * no OfflineSyncContext assim que disponível.
 * Deve estar dentro de ambos os Providers (AuthProvider e OfflineSyncProvider).
 */
function AxiosBridge() {
  const { axiosInstance } = useAuth();
  const { registerAxios, marcarServidorIndisponivel } = useOfflineSync();
  useEffect(() => {
    if (axiosInstance && registerAxios) {
      registerAxios(axiosInstance);
      // Interceptor: marca servidor offline imediatamente ao receber 5xx ou erro de rede
      const id = axiosInstance.interceptors.response.use(
        null,
        (error) => {
          if (!error.response || error.response.status >= 500) {
            marcarServidorIndisponivel?.();
          }
          return Promise.reject(error);
        }
      );
      return () => axiosInstance.interceptors.response.eject(id);
    }
  }, [axiosInstance, registerAxios, marcarServidorIndisponivel]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <ToastProvider>
        <UltraWideConfig>
          <GruposProdutoProvider>
            <MenuStateProvider>
              <AxiosBridge />
              <Routes>
                <Route path='/login' element={<LoginPage />} />
                <Route path='/login-simple' element={<LoginSimple />} />
                <Route path='/login-clean' element={<LoginClean />} />
                <Route path='/auto-login' element={<AutoLogin />} />
                <Route path='/demo' element={<UltraWideDemo />} />
                <Route path='/fullscreen-test' element={<FullScreenTest />} />
                <Route path='/layout-selector' element={<LayoutSelector />} />
                <Route path='/dashboard-fullscreen-test' element={<FullScreenDashboardTest />} />
                <Route path='/database-test' element={<DatabaseTest />} />
                <Route path='/api-tester' element={<APITester />} />
                <Route path='/operacao-tester' element={<OperacaoTester />} />
                <Route path='/auto-login-dev' element={<AutoLoginDev />} />
                <Route path='/configuracao-ip' element={<ConfiguracaoIP />} />
                <Route path='/debug-conexao' element={<DebugConexaoPage />} />
                <Route path='/cotacao-resposta/:token' element={<CotacaoRespostaPublica />} />
                <Route path='/exemplo-toast' element={<ExemploToast />} />
                <Route path='/exemplo-icones' element={<ExemploIcones />} />

                {/* Rotas protegidas */}
                <Route
                  path='/'
                  element={
                    <ProtectedRoute>
                      <DashboardLayoutClean />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardHomeClean />} />
                  <Route path='home' element={<DashboardHomeClean />} />
                  <Route path='clientes' element={<ClientePageCompleteFixed />} />
                  <Route path='fornecedores' element={<FornecedorPage />} />
                  <Route path='produtos' element={<ProdutoPageResponsive />} />
                  <Route path='cadastro-turbo' element={<CadastroTurboProduto />} />
                  <Route path='vendas' element={<Vendas />} />
                  <Route path='venda-rapida' element={<VendaRapidaPage />} />
                  <Route path='ordem-servico' element={<OrdemServicoPage />} />
                  <Route path='entregas' element={<EntregasPage />} />
                  <Route path='comandas' element={<ComandasPage />} />
                  <Route path='tabela-comercial' element={<TabelaComercialPage />} />
                  <Route path='veiculos' element={<VeiculosPage />} />
                  <Route path='etiquetas' element={<EtiquetasPage />} />
                  <Route path='equipamentos' element={<EquipamentosPage />} />
                  <Route path='alugueis' element={<AlugueisPage />} />
                  <Route path='alugueis/nova' element={<AluguelNovoPage />} />
                  <Route path='cheques' element={<ChequesPage />} />
                  <Route path='estoque-config' element={<EstoqueConfig />} />
                  <Route path='mapa-promocao' element={<MapaPromocaoPage />} />
                  <Route path='compras' element={<CompraPage />} />
                  <Route path='devolucoes' element={<DevolucoesListPage />} />
                  <Route path='devolucoes/nova' element={<DevolucaoPage />} />
                  <Route path='trocas' element={<TrocasListPage />} />
                  <Route path='trocas/nova' element={<TrocaPage />} />
                  <Route path='catalogos' element={<CatalogoPage />} />
                  <Route path='relatorios' element={<RelatoriosPage />} />
                  <Route path='graficos' element={<GraficosPage />} />
                  <Route path='financeiro' element={<FinancePage />} />
                  <Route path='bancario' element={<BancarioPage />} />
                  <Route path='pet-shop' element={<PetShopPage />} />
                  <Route path='clinica-veterinaria' element={<ClinicaVeterinariaPage />} />
                  <Route path='documentos-fiscais' element={<DocumentosFiscaisPage />} />
                  <Route path='sped' element={<SpedPage />} />
                  <Route path='sped-contribuicoes' element={<SpedContribuicoesPage />} />
                  <Route path='aprovacoes' element={<AprovacoesPage />} />
                  <Route path='minhas-solicitacoes' element={<MinhasSolicitacoesPage />} />
                  <Route path='configuracoes' element={<SettingsPage />} />
                  <Route path='acesso-mobile' element={<AcessoMobile />} />
                  <Route path='status-ordem-servico' element={<StatusOrdemServicoConfig />} />
                  <Route path='backup' element={<BackupPage />} />
                  <Route path='relatorios/cashback' element={<RelatorioCashback />} />
                  <Route path='relatorios/lucratividade' element={<RelatorioLucratividadePage />} />
                  <Route path='relatorios/projecao-compra' element={<RelatorioProjecaoCompraPage />} />
                  <Route path='relatorios/ficha-produto' element={<FichaProdutoPage />} />
                  <Route path='relatorios/ficha-veiculo' element={<FichaVeiculoPage />} />
                  <Route path='relatorios/ficha-cliente' element={<FichaClientePage />} />
                  <Route path='relatorios/clientes' element={<RelatoriosClientePage />} />
                  <Route path='relatorios/produtos' element={<RelatoriosProdutoPage />} />
                  <Route path='relatorios/vendas' element={<RelatoriosVendaPage />} />
                  <Route path='alugueis/editar/:id' element={<AluguelEditarPage />} />
                  <Route path='configuracao-contrato' element={<ConfiguracaoContratoPage />} />
                  <Route path='nfce' element={<NFCePage />} />
                  <Route path='nfe' element={<NFePage />} />
                  <Route path='faturamento' element={<FaturamentoPage />} />
                  <Route path='cte' element={<CTePage />} />
                  {/* Manifestação do Destinatário */}
                  <Route path='manifestacao-destinatario' element={<ManifestacaoPage />} />
                  {/* Modulo Agro */}
                  <Route path='agro' element={<AgroPage />} />
                  <Route path='agro/safras' element={<AgroSafrasPage />} />
                  <Route path='agro/contratos' element={<AgroContratosPage />} />
                  <Route path='agro/conversoes' element={<AgroConversoesPage />} />
                  <Route path='agro/operacional' element={<AgroOperacionalPage />} />
                  <Route path='whatsapp' element={<AgroWhatsappPage />} />
                  {/* Páginas restauradas */}
                  <Route path='mdfe' element={<MDFePage />} />
                  <Route path='cartoes' element={<CartoesPage />} />
                  <Route path='conciliacao' element={<ConciliacaoPage />} />
                  <Route path='agenda' element={<AgendaPage />} />
                  <Route path='balancas' element={<BalancasPage />} />
                  <Route path='contas-servicos' element={<ContasServicosPage />} />
                  <Route path='cotacao' element={<CotacaoPage />} />
                  <Route path='formas-pagamento' element={<FormasPagamentoPage />} />
                  <Route path='relatorios/comissoes' element={<RelatorioComissoesPage />} />
                  <Route path='relatorios/dre' element={<RelatorioDREPage />} />
                  <Route path='relatorios/inventario' element={<RelatorioInventarioPage />} />
                  <Route path='relatorios/cte' element={<RelatorioCTePage />} />
                  <Route path='relatorios/mdfe' element={<RelatorioMDFePage />} />
                  <Route path='producao' element={<ProducaoPage />} />
                  <Route path='boletos' element={<BoletosPage />} />
                  <Route path='mapa-carga' element={<MapaCargaPage />} />
                  <Route path='assistente-ia' element={<AssistenteIAPage />} />
                  <Route path='consultor-negocios' element={<ConsultorNegociosPage />} />
                  {/* Novos Módulos */}
                  <Route path='crm' element={<CRMPage />} />
                  <Route path='rh' element={<RHPage />} />
                  <Route path='ponto' element={<PontoPage />} />
                  <Route path='pix' element={<PixPage />} />
                  <Route path='recorrencia' element={<RecorrenciaPage />} />
                  <Route path='churn' element={<ChurnPage />} />
                  <Route path='dashboard-bi' element={<DashboardBI />} />
                  <Route path='consulta-estoque' element={<ConsultaEstoquePage />} />
                </Route>

                <Route path='*' element={<Navigate to='/' replace />} />
              </Routes>
            </MenuStateProvider>
          </GruposProdutoProvider>
        </UltraWideConfig>
        <DebugLogger />
      </ToastProvider>
    </ThemeProvider>
  )
}

