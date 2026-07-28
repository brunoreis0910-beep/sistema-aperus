import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Chip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, IconButton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert,
  FormControl, FormControlLabel, InputLabel, Select, MenuItem, Tooltip, Tabs, Tab, Card, CardContent, Divider,
  InputAdornment, Switch
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Refresh as RefreshIcon,
  CheckCircle as PaidIcon, CheckCircleOutline as CheckCircleOutlineIcon, Cancel as CancelIcon, ReceiptLong as InvoiceIcon,
  Description as ContractIcon, Fingerprint as SignIcon, QrCode as QrIcon,
  ContentCopy as CopyIcon, MonetizationOn as MoneyIcon, Business as ClientIcon,
  Warning as WarningIcon, Launch as LaunchIcon, Search as SearchIcon,
  SystemUpdate as UpdateIcon, Terminal as LogIcon, Delete as DeleteIcon,
  Storage as StorageIcon, Bolt as BoltIcon, Campaign as CampaignIcon,
  Save as SaveIcon, Send as SendIcon, Link as LinkIcon, WhatsApp as WhatsAppIcon,
  Settings as SettingsIcon, BugReport as BugReportIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { buscarCNPJ, buscarCEP, formatTelefone } from '../utils/cnpjCepUtils';
import ReportBuilderDialog from '../components/ReportBuilderDialog';

const MAPPING_LABELS = {
  // Clientes
  nome_razao: { label: "Nome / Razão Social", required: true },
  cpf_cnpj: { label: "CPF / CNPJ", required: true },
  nome_fantasia: { label: "Nome Fantasia" },
  ie: { label: "Inscrição Estadual (IE)" },
  telefone: { label: "Telefone / Contato" },
  whatsapp: { label: "WhatsApp" },
  email: { label: "E-mail" },
  data_nascimento: { label: "Data de Nascimento" },
  cep: { label: "CEP" },
  endereco: { label: "Endereço / Logradouro" },
  numero: { label: "Número" },
  complemento: { label: "Complemento" },
  bairro: { label: "Bairro" },
  cidade: { label: "Cidade" },
  estado: { label: "Estado (UF)" },
  observacao: { label: "Observações Gerais" },
  
  // Produtos
  descricao: { label: "Descrição / Nome do Produto", required: true },
  preco_venda: { label: "Preço de Venda", required: true },
  gtin: { label: "Código de Barras / GTIN" },
  ncm: { label: "NCM" },
  referencia: { label: "Referência" },
  unidade: { label: "Unidade de Medida (ex: UN, KG)" },
  marca: { label: "Marca / Fabricante" },
  categoria: { label: "Categoria" },
  grupo: { label: "Grupo" },
  classificacao: { label: "Seção" },
  preco_custo: { label: "Preço de Custo" },
  estoque_loja: { label: "Estoque da Loja (Qtd)" },
  estoque_deposito: { label: "Estoque do Depósito (Qtd)" },
  estoque_geral: { label: "Estoque Geral / Saldo (Qtd)" },
  localizacao: { label: "Localização / Prateleira" }
};

const DEFAULT_LAYOUTS = {
    venda_recibo: [
        { id: '_1', campo_origem: 'venda.numero', x: 10, y: 10, font_size: 12, largura: 150, label: 'Número da Venda' },
        { id: '_2', campo_origem: 'venda.data', x: 180, y: 10, font_size: 12, largura: 100, label: 'Data da Venda' },
        { id: '_3', campo_origem: 'cliente.nome', x: 10, y: 30, font_size: 12, largura: 220, label: 'Nome do Cliente' },
        { id: '_4', campo_origem: 'produto.codigo', x: 10, y: 65, font_size: 11, largura: 50, label: 'Código do Produto' },
        { id: '_5', campo_origem: 'produto.descricao', x: 65, y: 65, font_size: 11, largura: 150, label: 'Descrição do Produto' },
        { id: '_6', campo_origem: 'produto.quantidade', x: 220, y: 65, font_size: 11, largura: 40, label: 'Quantidade' },
        { id: '_7', campo_origem: 'produto.valor_unit', x: 265, y: 65, font_size: 11, largura: 60, label: 'Valor Unitário' },
        { id: '_8', campo_origem: 'venda.total', x: 180, y: 105, font_size: 14, largura: 100, label: 'Total da Venda' }
    ],
    etiqueta_gondola: [
        { id: '_1', campo_origem: 'produto.descricao', x: 10, y: 10, font_size: 14, largura: 260, label: 'Descrição do Produto' },
        { id: '_2', campo_origem: 'produto.codigo', x: 10, y: 40, font_size: 11, largura: 100, label: 'Código do Produto' },
        { id: '_3', campo_origem: 'produto.valor_unit', x: 10, y: 65, font_size: 20, largura: 150, label: 'Valor Unitário' },
        { id: '_4', campo_origem: 'produto.codigo_barras', x: 10, y: 105, font_size: 12, largura: 200, label: 'Código de Barras' }
    ],
    relatorio_vendas: [
        { id: '_1', campo_origem: 'cliente.nome', x: 30, y: 30, font_size: 12, largura: 200, label: 'Nome do Cliente' },
        { id: '_2', campo_origem: 'venda.numero', x: 250, y: 30, font_size: 12, largura: 100, label: 'Número da Venda' },
        { id: '_3', campo_origem: 'venda.total', x: 370, y: 30, font_size: 12, largura: 120, label: 'Total da Venda' }
    ],
    relatorio_inventario: [
        { id: '_1', campo_origem: 'produto.codigo', x: 30, y: 30, font_size: 12, largura: 100, label: 'Código do Produto' },
        { id: '_2', campo_origem: 'produto.descricao', x: 150, y: 30, font_size: 12, largura: 300, label: 'Descrição do Produto' },
        { id: '_3', campo_origem: 'produto.quantidade', x: 470, y: 30, font_size: 12, largura: 100, label: 'Quantidade' }
    ]
};

const RELATORIOS_PADRAO_SISTEMA = [
    { id: 'vendas', titulo: 'Relatório de Vendas', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'estoque', titulo: 'Relatório de Estoque', baseKey: 'relatorio_inventario', tipo: 'A4_PAISAGEM', w: 297, h: 210 },
    { id: 'compras', titulo: 'Relatório de Compras', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'financeiro', titulo: 'Relatório Financeiro', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'dre', titulo: 'DRE - Demonstração do Resultado', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'clientes', titulo: 'Relatório de Clientes', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'produtos', titulo: 'Relatório de Produtos', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'desempenho', titulo: 'Análise de Desempenho', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'consolidado', titulo: 'Relatório Consolidado', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'comissoes', titulo: 'Comissões por Vendedor', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'devolucoes', titulo: 'Relatório de Devoluções', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'trocas', titulo: 'Relatório de Trocas', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'cashback', titulo: 'Relatório de Cashback', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'lucratividade', titulo: 'Relatório de Lucratividade', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'projecao-compra', titulo: 'Projeção de Compras', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'inventario', titulo: 'Relatório de Inventário', baseKey: 'relatorio_inventario', tipo: 'A4_PAISAGEM', w: 297, h: 210 },
    { id: 'inventario-retroativo', titulo: 'Inventário Retroativo', baseKey: 'relatorio_inventario', tipo: 'A4_PAISAGEM', w: 297, h: 210 },
    { id: 'comandas', titulo: 'Relatório de Comandas', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'cte', titulo: 'Relatório de CT-e', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'mdfe', titulo: 'Relatório de MDF-e', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'contas-receber-pagar', titulo: 'Contas a Receber e Pagar', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'conferencia', titulo: 'Relatório de Conferência', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
    { id: 'hotelaria', titulo: 'Relatório de Hotelaria', baseKey: 'relatorio_vendas', tipo: 'A4_RETRATO', w: 210, h: 297 },
];


const fmtMoeda = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtData = (d) => {
  if (!d) return '—';
  const dateStr = typeof d === 'string' && d.includes('-') && !d.includes('T') ? `${d}T12:00:00` : d;
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

const fmtDataHora = (d) =>
  d ? new Date(d).toLocaleString('pt-BR') : '—';

const StatusLicencaChip = ({ status }) => {
  const map = {
    ATIVO: { label: 'Ativo', color: 'success' },
    BLOQUEADO: { label: 'Bloqueado', color: 'error' },
    DEMO: { label: 'Demonstração', color: 'info' },
  };
  const info = map[status] || { label: status, color: 'default' };
  return <Chip label={info.label} color={info.color} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
};

const StatusPagamentoChip = ({ status }) => {
  const map = {
    PENDENTE: { label: 'Pendente', color: 'warning' },
    PAGO: { label: 'Pago', color: 'success' },
    VENCIDO: { label: 'Vencido', color: 'error' },
    CANCELADO: { label: 'Cancelado', color: 'default' },
  };
  const info = map[status] || { label: status, color: 'default' };
  return <Chip label={info.label} color={info.color} size="small" sx={{ borderRadius: 1 }} />;
};

const SaaSAdminPage = () => {
  const { axiosInstance, user, permissions } = useAuth();
  const { showToast } = useToast();
  
  const temPermissao = useCallback((permName) => {
    if (user?.is_superuser) return true;
    return !!permissions?.[permName];
  }, [user, permissions]);
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Data lists
  const [clientes, setClientes] = useState([]);
  const [configuracoesBancarias, setConfiguracoesBancarias] = useState([]);
  const [contasBancarias, setContasBancarias] = useState([]);
  const [mensalidades, setMensalidades] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [centralLogs, setCentralLogs] = useState([]);

  // Filtros de mensalidades
  const [filtroContaBancaria, setFiltroContaBancaria] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [versoes, setVersoes] = useState([]);
  const [historicoAtualizacoes, setHistoricoAtualizacoes] = useState([]);
  const [configAgendamento, setConfigAgendamento] = useState({
    id_config: null,
    horario_execucao: '02:00:00',
    dias_da_semana: '0,1,2,3,4,5,6',
    agendamento_ativo: true
  });
  
  // KPI stats
  const [stats, setStats] = useState({ activeClients: 0, overduePayments: 0, mrr: 0 });
  
  // Selected customer for details
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Mural de Avisos (Comunicados)
  const [comunicados, setComunicados] = useState([]);
  const [comunicadoModal, setComunicadoModal] = useState({ open: false, mode: 'create', data: null });
  const [comunicadoForm, setComunicadoForm] = useState({
    titulo: '',
    tipo: 'TEXTO',
    conteudo_texto: '',
    url_midia: '',
    imagem_file: null,
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    ativo: true
  });
  
  // Modals status
  const [clientModal, setClientModal] = useState({ open: false, mode: 'create', data: null });
  const [billingModal, setBillingModal] = useState({ open: false, clientId: null, meses: 6 });
  const [contractModal, setContractModal] = useState({ open: false, clientId: null, texto: '', loading: false });
  const [paymentModal, setPaymentModal] = useState({ open: false, payment: null });
  const [versionModal, setVersionModal] = useState({ open: false, versao: '', descricao: '' });
  const [logModal, setLogModal] = useState({ open: false, title: '', log: '' });
  const [loadingUpdate, setLoadingUpdate] = useState({});
  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [modalTab, setModalTab] = useState(0);
  const [subTabValue, setSubTabValue] = useState(0);
  const [loadingLote, setLoadingLote] = useState(false);
  const [loadingCriarBanco, setLoadingCriarBanco] = useState({});

  // Data Importer states
  const [importType, setImportType] = useState('CLIENTES');
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importHeaders, setImportHeaders] = useState([]);
  const [importMapping, setImportMapping] = useState({});
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Custom templates states
  const [gabaritos, setGabaritos] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [elementosLayout, setElementosLayout] = useState([]);
  const [elementoSelecionado, setElementoSelecionado] = useState(null);
  const [baseReportModal, setBaseReportModal] = useState(false);
  const [baseGabaritoModal, setBaseGabaritoModal] = useState(false);
  
  // Remote onboarding states
  const [remoteInviteModal, setRemoteInviteModal] = useState(false);
  const [loadingRemoteInvite, setLoadingRemoteInvite] = useState(false);
  const [remoteInviteForm, setRemoteInviteForm] = useState({
    whatsapp_cliente: '',
    valor_mensalidade: '',
    dia_vencimento: 10,
    emite_nota: false,
    vendedor: '',
    status_licenca: 'ATIVO',
    schema_name: '',
    db_host: 'localhost',
    db_port: '8005',
    is_test_environment: false
  });
  const [generatedLinkData, setGeneratedLinkData] = useState(null);
  
  // Editor parameters
  const [tipoGabarito, setTipoGabarito] = useState('A4_RETRATO');
  const [nomeRelatorio, setNomeRelatorio] = useState('');
  const [larguraMm, setLarguraMm] = useState(210);
  const [alturaMm, setAlturaMm] = useState(297);
  const [gridSnap, setGridSnap] = useState(true);
  const [zoomScale, setZoomScale] = useState(1.0);

  useEffect(() => {
    if (selectedClient) {
      axiosInstance.get(`/saas-gabaritos/?cliente=${selectedClient.id_saas_cliente}`)
        .then(res => {
          const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
          setGabaritos(list);
        })
        .catch(err => console.error(err));
    } else {
      setGabaritos([]);
    }
  }, [selectedClient, axiosInstance]);

  // Client forms
  const [clientForm, setClientForm] = useState({
    cnpj: '', razao_social: '', nome_fantasia: '', inscricao_estadual: '',
    proprietario: '', telefone: '', email: '', vendedor: '',
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    dia_vencimento: 10, valor_mensalidade: '', emite_nota: false, status_licenca: 'ATIVO', data_reajuste: '',
    schema_name: '', db_host: 'localhost', db_port: '8005', is_test_environment: false,
    email_responsavel: '', data_nascimento_responsavel: '', limite_maquinas: 1,
    plano: '', link_acesso: ''
  });

  const [tempLinks, setTempLinks] = useState({});
  const [savingLink, setSavingLink] = useState({});
  const [searchTermLinks, setSearchTermLinks] = useState('');

  // Estados e funções do Backup Local
  const [backupConfig, setBackupConfig] = useState({
    diretorio_destino: "G:\\Meu Drive\\BackupsAperus",
    segunda: true, terca: true, quarta: true, quinta: true, sexta: true, sabado: true, domingo: true,
    horarios_execucao: "02:00",
    retencao_arquivos: 30,
    ativo: true,
    ultimo_backup_em: null,
    status_ultimo_backup: "Pendente"
  });
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [forcingBackup, setForcingBackup] = useState(false);
  const [quantidadeHorarios, setQuantidadeHorarios] = useState(1);
  const [listaHorarios, setListaHorarios] = useState(['02:00']);

  const carregarBackupConfig = useCallback(async () => {
    setLoadingBackup(true);
    try {
      const res = await axiosInstance.get('/saas/backup-config/');
      setBackupConfig(res.data);
      const hrs = res.data.horarios_execucao ? res.data.horarios_execucao.split(',').map(h => h.trim()).filter(Boolean) : ['02:00'];
      setListaHorarios(hrs);
      setQuantidadeHorarios(hrs.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBackup(false);
    }
  }, [axiosInstance]);

  const handleSalvarBackupConfig = async () => {
    setLoadingBackup(true);
    try {
      const payload = {
        ...backupConfig,
        horarios_execucao: listaHorarios.slice(0, quantidadeHorarios).join(',')
      };
      await axiosInstance.post('/saas/backup-config/salvar/', payload);
      showToast('Configurações de backup salvas com sucesso!', 'success');
      carregarBackupConfig();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar configurações de backup.', 'error');
    } finally {
      setLoadingBackup(false);
    }
  };

  const handleForcarBackup = async () => {
    if (!window.confirm("Deseja realmente forçar um backup agora? O processo de dump de todas as bases e compactação será iniciado.")) {
      return;
    }
    setForcingBackup(true);
    try {
      const res = await axiosInstance.post('/saas/backup-config/forcar/');
      showToast(res.data.mensagem || 'Backup realizado com sucesso!', 'success');
      carregarBackupConfig();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || 'Erro ao realizar o backup.';
      showToast(`Falha no backup: ${errorMsg}`, 'error');
    } finally {
      setForcingBackup(false);
    }
  };

  const handleQtdHorariosChange = (val) => {
    const qtd = Math.min(10, Math.max(1, parseInt(val) || 1));
    setQuantidadeHorarios(qtd);
    setListaHorarios(prev => {
      const novaLista = [...prev];
      while (novaLista.length < qtd) {
        novaLista.push("12:00");
      }
      return novaLista;
    });
  };

  const handleHorarioChange = (index, val) => {
    setListaHorarios(prev => {
      const nova = [...prev];
      nova[index] = val;
      return nova;
    });
  };


  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [resCli, resMens, resVers, resHist, resConfig, resCom, resBancarias, resContas, resPlanos, resLogs] = await Promise.all([
        axiosInstance.get('/saas-clientes/'),
        axiosInstance.get('/saas-mensalidades/'),
        axiosInstance.get('/saas-versoes/'),
        axiosInstance.get('/saas-historico-atualizacoes/'),
        axiosInstance.get('/saas-agendamento/'),
        axiosInstance.get('/saas-comunicados/'),
        axiosInstance.get('/configuracoes-bancarias/?ativo=true'),
        axiosInstance.get('/contas-bancarias/'),
        axiosInstance.get('/saas/planos/'),
        axiosInstance.get('/central-logs/listar/').catch(err => {
          console.warn("Não foi possível carregar logs centralizados", err);
          return { data: [] };
        })
      ]);
      
      const clientsData = resCli.data?.results ?? resCli.data ?? [];
      const billingData = resMens.data?.results ?? resMens.data ?? [];
      const versionsData = resVers.data?.results ?? resVers.data ?? [];
      const historyData = resHist.data?.results ?? resHist.data ?? [];
      const configData = resConfig.data ?? { horario_execucao: '02:00:00', dias_da_semana: '0,1,2,3,4,5,6', agendamento_ativo: true };
      const comunicadosData = resCom.data?.results ?? resCom.data ?? [];
      
      setClientes(clientsData);
      setMensalidades(billingData);
      setVersoes(versionsData);
      setHistoricoAtualizacoes(historyData);
      setConfigAgendamento(configData);
      setComunicados(comunicadosData);
      setConfiguracoesBancarias(resBancarias.data?.results ?? resBancarias.data ?? []);
      setContasBancarias(resContas.data?.results ?? resContas.data ?? []);
      setPlanos(resPlanos.data ?? []);
      setCentralLogs(resLogs.data ?? []);
      
      // Calculate Stats
      const active = clientsData.filter(c => c.status_licenca === 'ATIVO').length;
      const overdue = billingData.filter(m => m.status_pagamento === 'PENDENTE' && new Date(m.data_vencimento) < new Date()).length;
      const mrrVal = clientsData.reduce((acc, c) => acc + parseFloat(c.valor_mensalidade || 0), 0);
      
      setStats({ activeClients: active, overduePayments: overdue, mrr: mrrVal });
      
      // Update selected client if open
      setSelectedClient(prev => {
        if (!prev) return null;
        const updated = clientsData.find(c => c.id_saas_cliente === prev.id_saas_cliente);
        if (updated && JSON.stringify(updated) !== JSON.stringify(prev)) {
          return updated;
        }
        return prev;
      });
      
      // Carrega configurações do backup
      carregarBackupConfig();
      
    } catch (e) {
      showToast('Erro ao carregar os dados do SaaS.', 'error');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, showToast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const consultarStatusMensalidade = async (m) => {
    setLoadingUpdate(prev => ({ ...prev, [m.id_mensalidade]: true }));
    try {
      const res = await axiosInstance.get(`/saas/mensalidades/${m.id_mensalidade}/consultar_status/`);
      showToast(res.data.mensagem || `Status da mensalidade: ${res.data.status}`, 'success');
      
      // Atualiza a mensalidade na lista local
      setMensalidades(prev => prev.map(item => {
        if (item.id_mensalidade === m.id_mensalidade) {
          return {
            ...item,
            status_pagamento: res.data.status,
            data_pagamento: res.data.data_pagamento
          };
        }
        return item;
      }));
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erro ao consultar status da mensalidade.';
      showToast(errorMsg, 'error');
    } finally {
      setLoadingUpdate(prev => ({ ...prev, [m.id_mensalidade]: false }));
    }
  };

  const tabs = [
    { label: "Clientes SaaS", icon: <ClientIcon />, show: true },
    { label: "Faturamento e Cobranças", icon: <InvoiceIcon />, show: temPermissao('pode_cadastrar_financeiro_saas') },
    { label: "Atualizações do Sistema", icon: <UpdateIcon />, show: temPermissao('pode_atualizar_cliente') },
    { label: "Mural de Avisos", icon: <CampaignIcon />, show: true },
    { label: "Planos SaaS", icon: <MoneyIcon />, show: true },
    { label: "Terminais Ativos", icon: <LogIcon />, show: true },
    { label: "Links de Acesso", icon: <LinkIcon />, show: true },
    { label: "Backup Agendado", icon: <StorageIcon />, show: true },
    { label: "Central de Logs", icon: <BugReportIcon />, show: true }
  ].filter(t => t.show);

  const activeTabName = tabs[tabValue]?.label || "Clientes SaaS";

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Controlar o foco inicial de abas via URL (ex: ?tab=terminais)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'terminais') {
      const idx = tabs.findIndex(t => t.label === "Terminais Ativos");
      if (idx !== -1) setTabValue(idx);
    } else if (tabParam) {
      const tabIdx = parseInt(tabParam);
      if (!isNaN(tabIdx) && tabIdx >= 0 && tabIdx < tabs.length) {
        setTabValue(tabIdx);
      }
    }
  }, [tabs.length]);

  const handleDeleteTerminal = async (id_terminal) => {
    if (!window.confirm("Deseja realmente remover este dispositivo ativo? Esta ação liberará limite para novas ativações.")) {
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.delete(`/saas-terminais/${id_terminal}/`);
      showToast('Dispositivo removido com sucesso!', 'success');
      carregarDados();
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover dispositivo.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const todosTerminais = React.useMemo(() => {
    const list = [];
    clientes.forEach(c => {
      if (Array.isArray(c.terminais)) {
        c.terminais.forEach(t => {
          list.push({
            ...t,
            cliente_razao_social: c.razao_social,
            cliente_schema: c.schema_name,
            limite_maquinas: c.limite_maquinas
          });
        });
      }
    });
    return list;
  }, [clientes]);

  const CAMPOS_DISPONIVEIS = [
    // Empresa
    { label: "Logomarca da Empresa", chave: "empresa.logomarca" },
    { label: "Razão Social da Empresa", chave: "empresa.razao_social" },
    { label: "Nome Fantasia da Empresa", chave: "empresa.nome_fantasia" },
    { label: "CNPJ da Empresa", chave: "empresa.cnpj" },
    { label: "Inscrição Estadual da Empresa", chave: "empresa.inscricao_estadual" },
    { label: "Telefone da Empresa", chave: "empresa.telefone" },
    { label: "E-mail da Empresa", chave: "empresa.email" },
    { label: "Endereço da Empresa", chave: "empresa.endereco" },
    { label: "CEP da Empresa", chave: "empresa.cep" },

    // Cliente
    { label: "Nome do Cliente", chave: "cliente.nome" },
    { label: "CPF/CNPJ Cliente", chave: "cliente.doc" },
    { label: "Telefone Cliente", chave: "cliente.telefone" },
    { label: "Endereço Cliente", chave: "cliente.endereco" },
    { label: "RG/IE do Cliente", chave: "cliente.rg_ie" },
    { label: "E-mail do Cliente", chave: "cliente.email" },
    { label: "Bairro do Cliente", chave: "cliente.bairro" },
    { label: "Cidade do Cliente", chave: "cliente.cidade" },
    { label: "UF do Cliente", chave: "cliente.uf" },
    { label: "CEP do Cliente", chave: "cliente.cep" },
    { label: "Complemento do Cliente", chave: "cliente.complemento" },

    // Venda
    { label: "Número da Venda", chave: "venda.numero" },
    { label: "Data da Venda", chave: "venda.data" },
    { label: "Total da Venda", chave: "venda.total" },
    { label: "Subtotal Venda", chave: "venda.subtotal" },
    { label: "Desconto Venda", chave: "venda.desconto" },
    { label: "Forma de Pagamento", chave: "venda.forma_pagamento" },

    // Produto
    { label: "Código do Produto", chave: "produto.codigo" },
    { label: "Descrição do Produto", chave: "produto.descricao" },
    { label: "Valor Unitário", chave: "produto.valor_unit" },
    { label: "Quantidade", chave: "produto.quantidade" },
    { label: "Subtotal do Item", chave: "produto.subtotal" },
    { label: "Código de Barras", chave: "produto.codigo_barras" },
    { label: "Unidade do Produto", chave: "produto.unidade" },
    { label: "NCM do Produto", chave: "produto.ncm" },
    { label: "Grupo do Produto", chave: "produto.grupo" },
    { label: "Marca do Produto", chave: "produto.marca" },
    { label: "Preço de Custo", chave: "produto.preco_custo" },
    { label: "Peso Líquido", chave: "produto.peso_liquido" },
    { label: "Peso Bruto", chave: "produto.peso_bruto" },

    // Ordem de Serviço
    { label: "Número da OS", chave: "os.numero" },
    { label: "Data Abertura OS", chave: "os.data_abertura" },
    { label: "Previsão/Fechamento OS", chave: "os.data_fechamento" },
    { label: "Status da OS", chave: "os.status" },
    { label: "Técnico Responsável", chave: "os.tecnico" },
    { label: "Defeitos OS", chave: "os.defeitos" },
    { label: "Laudo Técnico OS", chave: "os.laudo_tecnico" },
    { label: "Observações OS", chave: "os.observacoes" },
    { label: "Solicitante OS", chave: "os.solicitante" },
    { label: "Total Produtos OS", chave: "os.total_produtos" },
    { label: "Total Serviços OS", chave: "os.total_servicos" },
    { label: "Total Geral OS", chave: "os.total_geral" },
    { label: "Desconto OS", chave: "os.desconto" },
    { label: "Subtotal OS", chave: "os.subtotal" },
    { label: "Tabela de Itens (OS/Venda)", chave: "os.itens_tabela" },

    // Veículo
    { label: "Placa do Veículo", chave: "veiculo.placa" },
    { label: "Marca do Veículo", chave: "veiculo.marca" },
    { label: "Modelo do Veículo", chave: "veiculo.modelo" },
    { label: "Ano do Veículo", chave: "veiculo.ano" },
    { label: "Cor do Veículo", chave: "veiculo.cor" },
    { label: "Chassi do Veículo", chave: "veiculo.chassi" },
    { label: "UF do Veículo", chave: "veiculo.uf" },
    { label: "Observações do Veículo", chave: "veiculo.observacoes" },

    // Equipamento
    { label: "Código Equipamento", chave: "equipamento.codigo" },
    { label: "Nome Equipamento", chave: "equipamento.nome" },
    { label: "Descrição Equipamento", chave: "equipamento.descricao" },
    { label: "Categoria Equipamento", chave: "equipamento.categoria" },
    { label: "Marca Equipamento", chave: "equipamento.marca" },
    { label: "Modelo Equipamento", chave: "equipamento.modelo" },
    { label: "Série Equipamento", chave: "equipamento.numero_serie" },
    { label: "Status Equipamento", chave: "equipamento.status" },
    { label: "Observações Equipamento", chave: "equipamento.observacoes" },

    // Animal / Pet
    { label: "Nome do Pet/Animal", chave: "animal.nome" },
    { label: "Raça do Pet/Animal", chave: "animal.raca" },
    { label: "Sexo do Pet/Animal", chave: "animal.sexo" },
    { label: "Peso do Pet/Animal", chave: "animal.peso" },
    { label: "Cor do Pet/Animal", chave: "animal.cor" },
    { label: "Observações do Pet/Animal", chave: "animal.observacoes" },
  ];

  const handleNovoGabarito = () => {
    setBaseGabaritoModal(true);
  };

  const handleNovoRelatorioPersonalizado = () => {
    setBaseReportModal(true);
  };

  const handleIniciarNovoGabaritoComBase = (baseKey) => {
    setBaseGabaritoModal(false);
    setEditingTemplate(null);
    setNomeRelatorio(baseKey);
    let tipo = 'RECIBO';
    let w = 80, h = 0;
    if (baseKey === 'etiqueta_gondola') {
      tipo = 'ETIQUETA';
      w = 100;
      h = 50;
    }
    setTipoGabarito(tipo);
    setLarguraMm(w);
    setAlturaMm(h);
    setElementosLayout(DEFAULT_LAYOUTS[baseKey] || []);
    setElementoSelecionado(null);
    setEditorOpen(true);
  };

  const handleIniciarNovoRelatorioComBase = (rep) => {
    setBaseReportModal(false);
    setEditingTemplate(null);
    setNomeRelatorio(rep.id);
    setTipoGabarito(rep.tipo);
    setLarguraMm(rep.w);
    setAlturaMm(rep.h);
    setElementosLayout(DEFAULT_LAYOUTS[rep.baseKey] || []);
    setElementoSelecionado(null);
    setEditorOpen(true);
  };

  const handleEditarGabarito = (gabarito) => {
    setEditingTemplate(gabarito);
    setNomeRelatorio(gabarito.nome_relatorio);
    setTipoGabarito(gabarito.tipo_gabarito);
    setLarguraMm(gabarito.largura_gabarito_mm);
    setAlturaMm(gabarito.altura_gabarito_mm);
    setElementosLayout(gabarito.layout_json || []);
    setElementoSelecionado(null);
    setZoomScale(1.0);
    setEditorOpen(true);
  };

  const handleSalvarGabarito = async (payload) => {
    const fullPayload = {
      cliente: selectedClient.id_saas_cliente,
      nome_relatorio: payload.nome_relatorio,
      tipo_gabarito: payload.tipo_gabarito,
      largura_gabarito_mm: payload.largura_gabarito_mm,
      altura_gabarito_mm: payload.altura_gabarito_mm,
      layout_json: payload.layout_json,
      ativo: editingTemplate ? editingTemplate.ativo : true
    };

    try {
      setLoading(true);
      if (editingTemplate) {
        await axiosInstance.put(`/saas-gabaritos/${editingTemplate.id}/`, fullPayload);
        showToast('Layout atualizado com sucesso!', 'success');
      } else {
        await axiosInstance.post('/saas-gabaritos/', fullPayload);
        showToast('Layout criado com sucesso!', 'success');
      }
      setEditorOpen(false);
      const res = await axiosInstance.get(`/saas-gabaritos/?cliente=${selectedClient.id_saas_cliente}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setGabaritos(list);
    } catch (e) {
      showToast('Erro ao salvar layout customizado.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirGabarito = async (id) => {
    if (!window.confirm('Deseja realmente excluir este layout customizado?')) return;
    try {
      setLoading(true);
      await axiosInstance.delete(`/saas-gabaritos/${id}/`);
      showToast('Layout excluído com sucesso!', 'success');
      const res = await axiosInstance.get(`/saas-gabaritos/?cliente=${selectedClient.id_saas_cliente}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setGabaritos(list);
    } catch (e) {
      showToast('Erro ao excluir layout.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAtivoGabarito = async (gabarito) => {
    try {
      await axiosInstance.patch(`/saas-gabaritos/${gabarito.id}/`, { ativo: !gabarito.ativo });
      showToast('Status do layout atualizado!', 'success');
      const res = await axiosInstance.get(`/saas-gabaritos/?cliente=${selectedClient.id_saas_cliente}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setGabaritos(list);
    } catch (e) {
      showToast('Erro ao atualizar status do layout.', 'error');
    }
  };

  const handleGerarLinkCadastro = async () => {
    if (!remoteInviteForm.whatsapp_cliente || !remoteInviteForm.valor_mensalidade) {
      showToast('Por favor, preencha o WhatsApp e o Valor da Mensalidade.', 'warning');
      return;
    }

    try {
      setLoadingRemoteInvite(true);
      const res = await axiosInstance.post('/saas/gerar-link-cadastro/', {
        whatsapp_cliente: remoteInviteForm.whatsapp_cliente,
        valor_mensalidade: remoteInviteForm.valor_mensalidade,
        dia_vencimento: remoteInviteForm.dia_vencimento,
        emite_nota: remoteInviteForm.emite_nota,
        vendedor: remoteInviteForm.vendedor,
        status_licenca: remoteInviteForm.status_licenca,
        schema_name: remoteInviteForm.schema_name,
        db_host: remoteInviteForm.db_host,
        db_port: remoteInviteForm.db_port,
        is_test_environment: remoteInviteForm.is_test_environment
      });

      if (res.data && res.data.success) {
        setGeneratedLinkData(res.data);
        showToast(
          res.data.whatsapp_enviado 
            ? 'Link gerado e enviado com sucesso via WhatsApp!' 
            : 'Link gerado! (Porém não foi possível disparar o WhatsApp automático - copie o link abaixo)', 
          res.data.whatsapp_enviado ? 'success' : 'info'
        );
      } else {
        showToast('Erro ao gerar o link cadastral.', 'error');
      }
    } catch (e) {
      const msg = e.response?.data?.error || 'Erro ao processar requisição.';
      showToast(msg, 'error');
    } finally {
      setLoadingRemoteInvite(false);
    }
  };



  const handleOpenClientModal = (mode, data = null) => {
    setModalTab(0);
    setImportType('CLIENTES');
    setImportFile(null);
    setImporting(false);
    setImportResult(null);
    if (mode === 'create') {
      setClientForm({
        cnpj: '', razao_social: '', nome_fantasia: '', inscricao_estadual: '',
        proprietario: '', telefone: '', email: '', vendedor: '',
        cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
        dia_vencimento: 10, valor_mensalidade: '', emite_nota: false, status_licenca: 'ATIVO', data_reajuste: '',
        schema_name: '', db_host: 'localhost', db_port: '8005', is_test_environment: false,
        email_responsavel: '', data_nascimento_responsavel: '', limite_maquinas: 1, plano: ''
      });
    } else {
      setClientForm({
        cnpj: data.cnpj,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || '',
        inscricao_estadual: data.inscricao_estadual || '',
        proprietario: data.proprietario || '',
        telefone: data.telefone || '',
        email: data.email || '',
        vendedor: data.vendedor || '',
        cep: data.cep || '',
        endereco: data.endereco || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.cidade || '',
        estado: data.estado || '',
        dia_vencimento: data.dia_vencimento,
        valor_mensalidade: data.valor_mensalidade,
        emite_nota: data.emite_nota,
        status_licenca: data.status_licenca,
        data_reajuste: data.data_reajuste || '',
        schema_name: data.schema_name || '',
        db_host: data.db_host || 'localhost',
        db_port: data.db_port || '8005',
        is_test_environment: data.is_test_environment || false,
        email_responsavel: data.email_responsavel || '',
        data_nascimento_responsavel: data.data_nascimento_responsavel || '',
        limite_maquinas: data.limite_maquinas || 1,
        plano: data.plano?.id || data.plano || ''
      });
    }
    setClientModal({ open: true, mode, data });
  };

  const handleBuscaCNPJ = async () => {
    const cnpj = clientForm.cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      showToast('Digite um CNPJ com 14 números.', 'warning');
      return;
    }
    setLoadingCNPJ(true);
    try {
      const dados = await buscarCNPJ(cnpj);
      setClientForm(p => {
        const baseName = dados.nome_fantasia || dados.razao_social || '';
        const suggestedSchema = baseName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9_-]/g, '')
          .substring(0, 30);
        
        return {
          ...p,
          razao_social: dados.razao_social || '',
          nome_fantasia: dados.nome_fantasia || '',
          inscricao_estadual: dados.inscricao_estadual || '',
          telefone: dados.telefone || '',
          email: dados.email || '',
          cep: dados.cep || '',
          endereco: dados.endereco || '',
          numero: dados.numero || '',
          complemento: dados.complemento || '',
          bairro: dados.bairro || '',
          cidade: dados.cidade || '',
          estado: dados.estado || '',
          schema_name: p.schema_name || suggestedSchema
        };
      });
      showToast('Dados do CNPJ carregados com sucesso!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao buscar CNPJ.', 'error');
    } finally {
      setLoadingCNPJ(false);
    }
  };

  const handleBuscaCEP = async () => {
    const cep = clientForm.cep.replace(/\D/g, '');
    if (cep.length !== 8) {
      showToast('Digite um CEP com 8 números.', 'warning');
      return;
    }
    setLoadingCEP(true);
    try {
      const dados = await buscarCEP(cep);
      setClientForm(p => ({
        ...p,
        endereco: dados.endereco || '',
        bairro: dados.bairro || '',
        cidade: dados.cidade || '',
        estado: dados.estado || ''
      }));
      showToast('Endereço carregado com sucesso!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao buscar CEP.', 'error');
    } finally {
      setLoadingCEP(false);
    }
  };

  const handleSaveClient = async () => {
    const isTest = clientForm.is_test_environment;
    if (!clientForm.cnpj || !clientForm.razao_social || (!isTest && !clientForm.valor_mensalidade) || !clientForm.schema_name) {
      showToast('Por favor, preencha todos os campos obrigatórios (incluindo o Identificador).', 'warning');
      return;
    }
    
    // Clean CNPJ from masks and format schema_name as slug
    const cleanForm = { 
      ...clientForm, 
      cnpj: clientForm.cnpj.replace(/\D/g, ''),
      schema_name: clientForm.schema_name.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
      valor_mensalidade: isTest ? (clientForm.valor_mensalidade || '0.00') : clientForm.valor_mensalidade,
      plano: clientForm.plano || null
    };

    try {
      if (clientModal.mode === 'create') {
        await axiosInstance.post('/saas-clientes/', cleanForm);
        showToast('Cliente cadastrado com sucesso!', 'success');
      } else {
        await axiosInstance.put(`/saas-clientes/${clientModal.data.id_saas_cliente}/`, cleanForm);
        showToast('Cliente atualizado com sucesso!', 'success');
      }
      setClientModal({ open: false, mode: 'create', data: null });
      carregarDados();
    } catch (e) {
      let errorMsg = 'Erro ao salvar cliente.';
      if (e.response?.data) {
        if (typeof e.response.data === 'string') {
          errorMsg = e.response.data;
        } else if (e.response.data.error) {
          errorMsg = e.response.data.error;
        } else {
          // Extrai o primeiro erro de qualquer campo retornado pelo Django REST Framework
          const fieldErrors = Object.entries(e.response.data)
            .map(([field, errs]) => {
              const msg = Array.isArray(errs) ? errs[0] : errs;
              return `${field}: ${msg}`;
            });
          if (fieldErrors.length > 0) {
            errorMsg = fieldErrors.join(' | ');
          }
        }
      }
      showToast(errorMsg, 'error');
    }
  };

  const handleCarregarPreview = async (file, type) => {
    if (!file) return;
    setPreviewLoading(true);
    setImportHeaders([]);
    setImportMapping({});
    setImportResult(null);

    const formData = new FormData();
    formData.append('tipo', type);
    formData.append('arquivo', file);

    try {
      const response = await axiosInstance.post(
        `/saas/importar-dados/${clientModal.data.id_saas_cliente}/?action=preview`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.sucesso) {
        setImportHeaders(response.data.headers || []);
        setImportMapping(response.data.sugestoes || {});
        showToast('Colunas da planilha carregadas com sucesso!', 'success');
      } else {
        showToast(response.data.mensagem || 'Falha ao processar cabeçalhos da planilha.', 'error');
      }
    } catch (e) {
      const errorMsg = e.response?.data?.mensagem || e.response?.data?.error || 'Erro ao carregar pré-visualização da planilha.';
      showToast(errorMsg, 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecutarImportacao = async () => {
    if (!importFile) {
      showToast('Por favor, selecione um arquivo Excel.', 'warning');
      return;
    }

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('tipo', importType);
    formData.append('arquivo', importFile);
    formData.append('mapeamento', JSON.stringify(importMapping));

    try {
      const response = await axiosInstance.post(
        `/saas/importar-dados/${clientModal.data.id_saas_cliente}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.sucesso) {
        setImportResult({
          sucesso: true,
          mensagem: response.data.mensagem,
          erros: response.data.erros,
        });
        showToast('Importação concluída!', 'success');
      } else {
        setImportResult({
          sucesso: false,
          mensagem: response.data.mensagem || 'Falha na importação.',
        });
        showToast(response.data.mensagem || 'Falha na importação.', 'error');
      }
    } catch (e) {
      const errorMsg = e.response?.data?.mensagem || e.response?.data?.error || 'Erro ao processar importação.';
      setImportResult({
        sucesso: false,
        mensagem: errorMsg,
      });
      showToast(errorMsg, 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveLinkAcesso = async (cliente) => {
    const link = tempLinks[cliente.id_saas_cliente] !== undefined 
      ? tempLinks[cliente.id_saas_cliente] 
      : (cliente.link_acesso || '');
    
    setSavingLink(prev => ({ ...prev, [cliente.id_saas_cliente]: true }));
    try {
      await axiosInstance.patch(`/saas-clientes/${cliente.id_saas_cliente}/`, {
        link_acesso: link.trim() || null
      });
      showToast(`Link de acesso de ${cliente.razao_social} atualizado com sucesso!`, 'success');
      carregarDados();
    } catch (err) {
      let errorMsg = 'Erro ao salvar link de acesso.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.error) {
          errorMsg = err.response.data.error;
        }
      }
      showToast(errorMsg, 'error');
    } finally {
      setSavingLink(prev => ({ ...prev, [cliente.id_saas_cliente]: false }));
    }
  };

  const handleGerarMensalidades = async () => {
    try {
      await axiosInstance.post(`/saas-clientes/${billingModal.clientId}/gerar_mensalidades/`, {
        meses: billingModal.meses
      });
      showToast(`Mensalidades geradas com sucesso!`, 'success');
      setBillingModal({ open: false, clientId: null, meses: 6 });
      carregarDados();
    } catch (e) {
      showToast('Erro ao gerar mensalidades.', 'error');
    }
  };

  const handleAbrirModalContrato = async (clientId) => {
    setContractModal({ open: true, clientId, texto: 'Carregando contrato padrão...', loading: true });
    try {
      const response = await axiosInstance.get(`/saas/contrato-padrao/render/?cliente_id=${clientId}`);
      if (response.data.status === 'sucesso') {
        setContractModal({ open: true, clientId, texto: response.data.rendered_html, loading: false });
      } else {
        setContractModal({ open: true, clientId, texto: '', loading: false });
        showToast('Erro ao renderizar o contrato padrão.', 'warning');
      }
    } catch (e) {
      console.error(e);
      setContractModal({ open: true, clientId, texto: '', loading: false });
      showToast('Erro ao carregar o contrato padrão do servidor.', 'error');
    }
  };

  const handleGerarContrato = async () => {
    if (!contractModal.texto) {
      showToast('Informe os termos do contrato.', 'warning');
      return;
    }
    try {
      await axiosInstance.post(`/saas-contratos/`, {
        saas_cliente: contractModal.clientId,
        texto_contrato: contractModal.texto,
        assinado: false
      });
      showToast('Contrato gerado com sucesso!', 'success');
      setContractModal({ open: false, clientId: null, texto: '', loading: false });
      carregarDados();
    } catch (e) {
      showToast('Erro ao gerar contrato.', 'error');
    }
  };

  const handleDispararAtualizacao = async (clientId) => {
    setLoadingUpdate(prev => ({ ...prev, [clientId]: true }));
    try {
      await axiosInstance.post(`/saas-clientes/${clientId}/disparar_atualizacao/`);
      showToast('Processo de atualização disparado em segundo plano!', 'success');
      carregarDados();
    } catch (e) {
      let msg = 'Erro ao disparar atualização.';
      if (e.response?.data?.error) {
        msg = e.response.data.error;
      } else if (e.response?.data?.detail) {
        msg = e.response.data.detail;
      }
      showToast(msg, 'error');
    } finally {
      setLoadingUpdate(prev => ({ ...prev, [clientId]: false }));
    }
  };

  const handleCriarBanco = async (clientId) => {
    setLoadingCriarBanco(prev => ({ ...prev, [clientId]: true }));
    try {
      await axiosInstance.post(`/saas-clientes/${clientId}/criar_banco_dados/`);
      showToast('Banco de dados e pasta de arquivos provisionados com sucesso!', 'success');
      carregarDados();
    } catch (e) {
      let msg = 'Erro ao criar banco de dados.';
      if (e.response?.data?.error) {
        msg = e.response.data.error;
      } else if (e.response?.data?.detail) {
        msg = e.response.data.detail;
      }
      showToast(msg, 'error');
    } finally {
      setLoadingCriarBanco(prev => ({ ...prev, [clientId]: false }));
    }
  };

  const handleDispararAtualizacaoLote = async () => {
    setLoadingLote(true);
    try {
      await axiosInstance.post('/saas-clientes/atualizar_em_lote/');
      showToast('Processo de atualização em lote disparado em segundo plano para todos os clientes ativos!', 'success');
      carregarDados();
    } catch (e) {
      let msg = 'Erro ao disparar atualização em lote.';
      if (e.response?.data?.error) {
        msg = e.response.data.error;
      } else if (e.response?.data?.detail) {
        msg = e.response.data.detail;
      }
      showToast(msg, 'error');
    } finally {
      setLoadingLote(false);
    }
  };

  const handleSaveConfigAgendamento = async (updatedConfig) => {
    try {
      const configId = configAgendamento.id_config || updatedConfig.id_config;
      if (configId) {
        const res = await axiosInstance.put(`/saas-agendamento/${configId}/`, updatedConfig);
        setConfigAgendamento(res.data);
        showToast('Configuração de agendamento atualizada!', 'success');
      } else {
        const res = await axiosInstance.post('/saas-agendamento/', updatedConfig);
        setConfigAgendamento(res.data);
        showToast('Configuração de agendamento criada!', 'success');
      }
    } catch (e) {
      showToast('Erro ao salvar as configurações de agendamento.', 'error');
    }
  };

  const handleCadastrarVersao = async () => {
    if (!versionModal.versao) {
      showToast('Por favor, informe a tag da versão (ex: v1.0.0).', 'warning');
      return;
    }
    try {
      await axiosInstance.post('/saas-versoes/', {
        versao: versionModal.versao,
        descricao: versionModal.descricao
      });
      showToast('Versão cadastrada com sucesso!', 'success');
      setVersionModal({ open: false, versao: '', descricao: '' });
      carregarDados();
    } catch (e) {
      showToast('Erro ao cadastrar versão.', 'error');
    }
  };

  const handleConfirmarPagamento = async (statusPagamento) => {
    try {
      const payload = {
        status_pagamento: statusPagamento,
      };
      if (statusPagamento === 'PAGO') {
        payload.data_pagamento = new Date().toISOString().split('T')[0];
      } else {
        payload.data_pagamento = null;
      }
      await axiosInstance.patch(`/saas-mensalidades/${paymentModal.payment.id_mensalidade}/`, payload);
      showToast(`Situação da mensalidade atualizada!`, 'success');
      setPaymentModal({ open: false, payment: null });
      carregarDados();
    } catch (e) {
      showToast('Erro ao atualizar mensalidade.', 'error');
    }
  };

  const copiarPix = (payload) => {
    navigator.clipboard.writeText(payload);
    showToast('Pix Copia e Cola copiado!', 'success');
  };

  const handleOpenComunicadoModal = (mode, data = null) => {
    if (mode === 'create') {
      setComunicadoForm({
        titulo: '',
        tipo: 'TEXTO',
        conteudo_texto: '',
        url_midia: '',
        imagem_file: null,
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
        ativo: true
      });
    } else {
      setComunicadoForm({
        titulo: data.titulo,
        tipo: data.tipo,
        conteudo_texto: data.conteudo_texto || '',
        url_midia: data.url_midia || '',
        imagem_file: null,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        ativo: data.ativo
      });
    }
    setComunicadoModal({ open: true, mode, data });
  };

  const handleSaveComunicado = async () => {
    if (!comunicadoForm.titulo || !comunicadoForm.conteudo_texto || !comunicadoForm.data_inicio || !comunicadoForm.data_fim) {
      showToast('Por favor, preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    const data = new FormData();
    data.append('titulo', comunicadoForm.titulo);
    data.append('tipo', comunicadoForm.tipo);
    data.append('conteudo_texto', comunicadoForm.conteudo_texto);
    data.append('data_inicio', comunicadoForm.data_inicio);
    data.append('data_fim', comunicadoForm.data_fim);
    data.append('ativo', comunicadoForm.ativo);

    if (comunicadoForm.tipo === 'IMAGEM' && comunicadoForm.imagem_file) {
      data.append('imagem', comunicadoForm.imagem_file);
      data.append('url_midia', '');
    } else {
      data.append('url_midia', comunicadoForm.url_midia || '');
    }

    try {
      if (comunicadoModal.mode === 'create') {
        await axiosInstance.post('/saas-comunicados/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Comunicado criado com sucesso!', 'success');
      } else {
        await axiosInstance.put(`/saas-comunicados/${comunicadoModal.data.id}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Comunicado atualizado com sucesso!', 'success');
      }
      setComunicadoModal({ open: false, mode: 'create', data: null });
      carregarDados();
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar comunicado.', 'error');
    }
  };

  const handleDeleteComunicado = async (id) => {
    if (window.confirm('Deseja realmente excluir este comunicado?')) {
      try {
        await axiosInstance.delete(`/saas-comunicados/${id}/`);
        showToast('Comunicado excluído com sucesso!', 'success');
        carregarDados();
      } catch (e) {
        showToast('Erro ao excluir comunicado.', 'error');
      }
    }
  };

  const handleSavePlano = async (plano) => {
    try {
      setLoading(true);
      await axiosInstance.post(`/saas/planos/${plano.id}/editar/`, {
        valor_mensalidade: plano.valor_mensalidade,
        modulo_pdv: plano.modulo_pdv,
        modulo_financeiro_avancado: plano.modulo_financeiro_avancado,
        modulo_producao_industria: plano.modulo_producao_industria,
        modulo_transporte_cte: plano.modulo_transporte_cte,
        modulo_ciot_automatico: plano.modulo_ciot_automatico,
        modulo_report_builder: plano.modulo_report_builder,
      });
      showToast(`Plano ${plano.nome} atualizado com sucesso!`, 'success');
      carregarDados();
    } catch (e) {
      showToast('Erro ao atualizar plano.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '85vh' }}>
      
      {/* HEADER & METRICS */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary" sx={{ letterSpacing: -0.5 }}>
            Aperus Central SaaS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administração, Faturamento e Licenciamento das instâncias de clientes
          </Typography>
        </Box>
        <IconButton onClick={carregarDados} disabled={loading} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
        </IconButton>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'success.light', color: 'success.dark', display: 'flex' }}>
                <ClientIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Clientes Ativos</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.activeClients}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'primary.light', color: 'primary.dark', display: 'flex' }}>
                <MoneyIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Recorrência Mensal (MRR)</Typography>
                <Typography variant="h5" fontWeight={700}>{fmtMoeda(stats.mrr)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'error.light', color: 'error.dark', display: 'flex' }}>
                <WarningIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Mensalidades Atrasadas</Typography>
                <Typography variant="h5" fontWeight={700} color="error.main">{stats.overduePayments}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TABS CONTAINER */}
      <Paper sx={{ borderRadius: 4, overflow: 'hidden', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          {tabs.map((t, idx) => (
            <Tab key={idx} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>

        {/* TAB 0 - CLIENTES */}
        {activeTabName === "Clientes SaaS" && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>Lista de Contratantes</Typography>
              <Stack direction="row" spacing={1.5}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<SendIcon />} 
                  onClick={() => {
                    setGeneratedLinkData(null);
                    setRemoteInviteForm({
                      whatsapp_cliente: '',
                      valor_mensalidade: '',
                      dia_vencimento: 10,
                      emite_nota: false,
                      vendedor: '',
                      status_licenca: 'ATIVO',
                      schema_name: '',
                      db_host: 'localhost',
                      db_port: '8005',
                      is_test_environment: false
                    });
                    setRemoteInviteModal(true);
                  }}
                >
                  Cadastro Remoto
                </Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenClientModal('create')}>
                  Novo Cliente
                </Button>
              </Stack>
            </Box>

            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell fontWeight={600}>Razão Social / CNPJ</TableCell>
                    <TableCell align="center">Plano</TableCell>
                    <TableCell align="center">Vencimento (Dia)</TableCell>
                    <TableCell align="right">Valor Mensalidade</TableCell>
                    <TableCell align="center">Emissão NF</TableCell>
                    <TableCell align="center">Situação</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientes.map((c) => (
                    <TableRow key={c.id_saas_cliente} hover onClick={() => setSelectedClient(c)} sx={{ cursor: 'pointer', bgcolor: selectedClient?.id_saas_cliente === c.id_saas_cliente ? 'action.selected' : 'inherit' }}>
                      <TableCell>
                        <Typography fontWeight={600} variant="body2">{c.razao_social}</Typography>
                        <Typography variant="caption" color="text.secondary">CNPJ: {c.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={c.plano?.nome || 'Customizado'} 
                          color={
                            c.plano?.nome?.toLowerCase().includes('ouro') ? 'warning' :
                            c.plano?.nome?.toLowerCase().includes('prata') ? 'secondary' :
                            c.plano?.nome?.toLowerCase().includes('bronze') ? 'primary' : 'default'
                          } 
                          size="small" 
                          variant={c.plano ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell align="center">Dia {c.dia_vencimento}</TableCell>
                      <TableCell align="right"><b>{fmtMoeda(c.valor_mensalidade)}</b></TableCell>
                      <TableCell align="center">
                        <Chip label={c.emite_nota ? 'Sim' : 'Não'} size="small" color={c.emite_nota ? 'primary' : 'default'} />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                          <StatusLicencaChip status={c.status_licenca} />
                          <Chip 
                            label={c.banco_criado ? 'BD Ativo' : 'Sem BD'} 
                            color={c.banco_criado ? 'success' : 'warning'} 
                            size="small" 
                            variant="filled" 
                            sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} 
                          />
                        </Stack>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {!c.banco_criado && temPermissao('pode_criar_banco') && (
                            <Tooltip title="Criar Banco de Dados">
                              <IconButton 
                                size="small" 
                                color="warning" 
                                onClick={async () => {
                                  if (window.confirm(`Deseja realmente provisionar o banco de dados para ${c.razao_social}?`)) {
                                    try {
                                      setLoading(true);
                                      await axiosInstance.post(`/saas-clientes/${c.id_saas_cliente}/criar_banco_dados/`);
                                      showToast('Banco de dados provisionado com sucesso!', 'success');
                                      carregarDados();
                                    } catch (e) {
                                      let msg = 'Erro ao provisionar banco de dados.';
                                      if (e.response?.data?.error) msg = e.response.data.error;
                                      showToast(msg, 'error');
                                    } finally {
                                      setLoading(false);
                                    }
                                  }
                                }}
                              >
                                <BoltIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Editar Dados">
                            <IconButton size="small" onClick={() => handleOpenClientModal('edit', c)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {!c.is_test_environment && temPermissao('pode_cadastrar_financeiro_saas') && (
                            <Tooltip title="Gerar Lote de Cobranças">
                              <IconButton size="small" color="primary" onClick={() => setBillingModal({ open: true, clientId: c.id_saas_cliente, meses: 6 })}>
                                <InvoiceIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Gerar Termo/Contrato">
                            <IconButton size="small" color="secondary" onClick={() => handleAbrirModalContrato(c.id_saas_cliente)}>
                              <ContractIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {clientes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        Nenhum cliente cadastrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* SELECTION DETAIL DRAWER / SUB PANEL */}
            {selectedClient && (
              <Box sx={{ mt: 4, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Detalhes do Cliente: {selectedClient.razao_social}
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>Mensalidades Relacionadas</Typography>
                        <Divider sx={{ mb: 1.5 }} />
                        <TableContainer sx={{ maxHeight: 220 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Vencimento</TableCell>
                                <TableCell align="right">Valor</TableCell>
                                <TableCell align="center">Situação</TableCell>
                                <TableCell align="center">Ação</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedClient.mensalidades?.map(m => (
                                <TableRow key={m.id_mensalidade} hover>
                                  <TableCell>{fmtData(m.data_vencimento)}</TableCell>
                                  <TableCell align="right">{fmtMoeda(m.valor)}</TableCell>
                                  <TableCell align="center"><StatusPagamentoChip status={m.status_pagamento} /></TableCell>
                                  <TableCell align="center">
                                    <IconButton size="small" onClick={() => setPaymentModal({ open: true, payment: m })}>
                                      <MoneyIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {(!selectedClient.mensalidades || selectedClient.mensalidades.length === 0) && (
                                <TableRow>
                                  <TableCell colSpan={4} align="center">Nenhuma mensalidade gerada.</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>Contratos e Termos Aceites</Typography>
                        <Divider sx={{ mb: 1.5 }} />
                        <TableContainer sx={{ maxHeight: 220 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Data Geração</TableCell>
                                <TableCell align="center">Assinado</TableCell>
                                <TableCell>IP / Usuário Assinatura</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedClient.contratos?.map(contr => (
                                <TableRow key={contr.id_contrato}>
                                  <TableCell>{fmtDataHora(contr.data_geracao)}</TableCell>
                                  <TableCell align="center">
                                    <Chip label={contr.assinado ? 'Assinado' : 'Pendente'} color={contr.assinado ? 'success' : 'default'} size="small" />
                                  </TableCell>
                                  <TableCell>
                                    {contr.assinado ? (
                                      <Box>
                                        <Typography variant="caption" display="block">IP: {contr.ip_assinatura || '—'}</Typography>
                                        <Typography variant="caption" display="block">Por: {contr.usuario_assinou || '—'}</Typography>
                                        <Typography variant="caption" display="block">Em: {fmtDataHora(contr.data_assinatura)}</Typography>
                                      </Box>
                                    ) : '—'}
                                  </TableCell>
                                </TableRow>
                              ))}
                              {(!selectedClient.contratos || selectedClient.contratos.length === 0) && (
                                <TableRow>
                                  <TableCell colSpan={3} align="center">Nenhum contrato gerado.</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">Gabaritos de Impressão (Bobina / Etiquetas)</Typography>
                          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleNovoGabarito} sx={{ textTransform: 'none' }}>
                            Novo Gabarito
                          </Button>
                        </Box>
                        <Divider sx={{ mb: 1.5 }} />
                        <TableContainer sx={{ maxHeight: 300 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Identificador / Nome</TableCell>
                                <TableCell align="center">Tipo</TableCell>
                                <TableCell align="center">Dimensões (mm)</TableCell>
                                <TableCell align="center">Ativo</TableCell>
                                <TableCell align="center">Ações</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {gabaritos.filter(g => g.tipo_gabarito === 'RECIBO' || g.tipo_gabarito === 'ETIQUETA').map(g => (
                                <TableRow key={g.id} hover>
                                  <TableCell sx={{ fontWeight: 600 }}>{g.nome_relatorio}</TableCell>
                                  <TableCell align="center">
                                    {g.tipo_gabarito === 'ETIQUETA' ? 'Etiqueta' : 'Recibo (80mm)'}
                                  </TableCell>
                                  <TableCell align="center">{g.largura_gabarito_mm} x {g.altura_gabarito_mm}</TableCell>
                                  <TableCell align="center">
                                    <Switch size="small" checked={g.ativo} onChange={() => handleToggleAtivoGabarito(g)} />
                                  </TableCell>
                                  <TableCell align="center">
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                      <Tooltip title="Visualizar Teste">
                                        <IconButton 
                                          size="small" 
                                          color="info" 
                                          component="a" 
                                          href={`/api/saas/gabarito-preview/?nome_relatorio=${g.nome_relatorio}&cnpj=${selectedClient?.cnpj}`} 
                                          target="_blank"
                                        >
                                          <LaunchIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <IconButton size="small" color="primary" onClick={() => handleEditarGabarito(g)}>
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton size="small" color="error" onClick={() => handleExcluirGabarito(g.id)}>
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {gabaritos.filter(g => g.tipo_gabarito === 'RECIBO' || g.tipo_gabarito === 'ETIQUETA').length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                                    Nenhum gabarito de impressão cadastrado.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">Relatórios Personalizados (A4)</Typography>
                          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleNovoRelatorioPersonalizado} sx={{ textTransform: 'none' }}>
                            Novo Relatório
                          </Button>
                        </Box>
                        <Divider sx={{ mb: 1.5 }} />
                        <TableContainer sx={{ maxHeight: 300 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Relatório Base / Nome</TableCell>
                                <TableCell align="center">Tipo</TableCell>
                                <TableCell align="center">Dimensões (mm)</TableCell>
                                <TableCell align="center">Ativo</TableCell>
                                <TableCell align="center">Ações</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {gabaritos.filter(g => g.tipo_gabarito === 'A4_RETRATO' || g.tipo_gabarito === 'A4_PAISAGEM').map(g => (
                                <TableRow key={g.id} hover>
                                  <TableCell sx={{ fontWeight: 600 }}>
                                    {RELATORIOS_PADRAO_SISTEMA.find(r => r.id === g.nome_relatorio)?.titulo || g.nome_relatorio}
                                  </TableCell>
                                  <TableCell align="center">
                                    {g.tipo_gabarito === 'A4_PAISAGEM' ? 'A4 Paisagem' : 'A4 Retrato'}
                                  </TableCell>
                                  <TableCell align="center">{g.largura_gabarito_mm} x {g.altura_gabarito_mm}</TableCell>
                                  <TableCell align="center">
                                    <Switch size="small" checked={g.ativo} onChange={() => handleToggleAtivoGabarito(g)} />
                                  </TableCell>
                                  <TableCell align="center">
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                      <Tooltip title="Visualizar Teste">
                                        <IconButton 
                                          size="small" 
                                          color="info" 
                                          component="a" 
                                          href={`/api/saas/gabarito-preview/?nome_relatorio=${g.nome_relatorio}&cnpj=${selectedClient?.cnpj}`} 
                                          target="_blank"
                                        >
                                          <LaunchIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <IconButton size="small" color="primary" onClick={() => handleEditarGabarito(g)}>
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton size="small" color="error" onClick={() => handleExcluirGabarito(g.id)}>
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {gabaritos.filter(g => g.tipo_gabarito === 'A4_RETRATO' || g.tipo_gabarito === 'A4_PAISAGEM').length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                                    Nenhum relatório personalizado cadastrado.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        )}

        {/* TAB 1 - GENERAL BILLING */}
        {activeTabName === "Faturamento e Cobranças" && (() => {
          const mensalidadesFiltradas = mensalidades.filter(m => {
            if (filtroContaBancaria) {
              const config = configuracoesBancarias.find(c => c.id_config === m.configuracao_bancaria);
              if (!config || config.id_conta_bancaria !== filtroContaBancaria) {
                return false;
              }
            }
            if (filtroDataInicio && m.data_vencimento < filtroDataInicio) {
              return false;
            }
            if (filtroDataFim && m.data_vencimento > filtroDataFim) {
              return false;
            }
            return true;
          });

          return (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Lançamentos de Cobranças Globais</Typography>
              
              {/* Barra de Filtros */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Conta Bancária"
                      value={filtroContaBancaria}
                      onChange={(e) => setFiltroContaBancaria(e.target.value)}
                    >
                      <MenuItem value="">Todas as Contas</MenuItem>
                      {contasBancarias.map((conta) => (
                        <MenuItem key={conta.id_conta_bancaria} value={conta.id_conta_bancaria}>
                          {conta.nome_banco} - {conta.nome_conta} (Ag: {conta.agencia} / Cc: {conta.conta})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Vencimento Inicial"
                      InputLabelProps={{ shrink: true }}
                      value={filtroDataInicio}
                      onChange={(e) => setFiltroDataInicio(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Vencimento Final"
                      InputLabelProps={{ shrink: true }}
                      value={filtroDataFim}
                      onChange={(e) => setFiltroDataFim(e.target.value)}
                    />
                  </Grid>
                  {(filtroContaBancaria || filtroDataInicio || filtroDataFim) && (
                    <Grid item xs={12} sm={2}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                          setFiltroContaBancaria('');
                          setFiltroDataInicio('');
                          setFiltroDataFim('');
                        }}
                      >
                        Limpar
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell fontWeight={600}>Cliente</TableCell>
                      <TableCell>Nosso Número</TableCell>
                      <TableCell>Vencimento</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell align="center">Situação</TableCell>
                      <TableCell align="center">Data Pagamento</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mensalidadesFiltradas.map((m) => {
                      const cli = clientes.find(c => c.id_saas_cliente === m.saas_cliente);
                      return (
                        <TableRow key={m.id_mensalidade} hover>
                          <TableCell>
                            <Typography fontWeight={600} variant="body2">{cli ? cli.razao_social : 'Carregando...'}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{m.nosso_numero}</TableCell>
                          <TableCell>{fmtData(m.data_vencimento)}</TableCell>
                          <TableCell align="right"><b>{fmtMoeda(m.valor)}</b></TableCell>
                          <TableCell align="center">
                            <StatusPagamentoChip status={m.status_pagamento} />
                          </TableCell>
                          <TableCell align="center">{m.data_pagamento ? fmtData(m.data_pagamento) : '—'}</TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="Detalhes do Pagamento / Baixa Manual">
                                <IconButton size="small" color="primary" onClick={() => setPaymentModal({ open: true, payment: m })}>
                                  <MoneyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {m.status_pagamento !== 'PAGO' && (
                                <Tooltip title="Consultar status no banco">
                                  <IconButton
                                    size="small"
                                    color="info"
                                    disabled={loadingUpdate[m.id_mensalidade]}
                                    onClick={() => consultarStatusMensalidade(m)}
                                  >
                                    {loadingUpdate[m.id_mensalidade] ? (
                                      <CircularProgress size={20} />
                                    ) : (
                                      <RefreshIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {mensalidadesFiltradas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          Nenhuma cobrança registrada no sistema com os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })()}

        {/* TAB 2 - UPDATES */}
        {activeTabName === "Atualizações do Sistema" && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={700}>Controle de Atualizações e Versões</Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => setVersionModal({ open: true, versao: '', descricao: '' })}
              >
                Cadastrar Versão
              </Button>
            </Box>

            <Grid container spacing={3}>
              {/* Left Column: Version Management & History logs */}
              <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  {/* Versions Card */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Versões Disponíveis
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                        {Array.isArray(versoes) && versoes.map((v) => (
                          <Paper 
                            key={v.id_versao} 
                            variant="outlined" 
                            sx={{ p: 1.5, mb: 1.5, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700} color="primary">
                                {v.versao}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {fmtData(v.data_lancamento)}
                              </Typography>
                            </Box>
                            <Tooltip title={v.descricao || 'Sem descrição'}>
                              <Chip label="Ver Notas" size="small" variant="outlined" clickable onClick={() => showToast(v.descricao || 'Sem changelog.', 'info')} />
                            </Tooltip>
                          </Paper>
                        ))}
                        {versoes.length === 0 && (
                          <Typography align="center" color="text.secondary" variant="body2" py={2}>
                            Nenhuma versão cadastrada.
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Logs Card */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Logs de Erros Recentes
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
                        {Array.isArray(historicoAtualizacoes) && historicoAtualizacoes
                          .filter(h => h.status === 'FALHA')
                          .slice(0, 5)
                          .map((h) => (
                            <Paper 
                              key={h.id_historico} 
                              variant="outlined" 
                              sx={{ p: 1.5, mb: 1.5, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'error.light' }}
                            >
                              <Box>
                                <Typography variant="subtitle2" fontWeight={700} color="error">
                                  {h.cliente_razao_social}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Versão: {h.versao_nome} | {fmtDataHora(h.data_atualizacao)}
                                </Typography>
                              </Box>
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => setLogModal({ open: true, title: `Log de Erro - ${h.cliente_razao_social} (${h.versao_nome})`, log: h.log_erro })}
                              >
                                <LogIcon fontSize="small" />
                              </IconButton>
                            </Paper>
                          ))}
                        {historicoAtualizacoes.filter(h => h.status === 'FALHA').length === 0 && (
                          <Typography align="center" color="text.secondary" variant="body2" py={2}>
                            Nenhum log de erro registrado.
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>

              {/* Right Column: Environments list & Actions */}
              <Grid item xs={12} md={8}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs value={subTabValue} onChange={(e, val) => setSubTabValue(val)} indicatorColor="primary" textColor="primary" variant="fullWidth">
                    <Tab label="Atualizar em Lote" icon={<UpdateIcon />} iconPosition="start" />
                    <Tab label="Atualizar por Cliente" icon={<ClientIcon />} iconPosition="start" />
                    <Tab label="Erros de Execução" icon={<LogIcon />} iconPosition="start" />
                  </Tabs>
                </Box>

                {subTabValue === 0 && (
                  <Stack spacing={3}>
                    <Card variant="outlined" sx={{ borderRadius: 3, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, textAlign: 'center' }}>
                      <Box sx={{ p: 2.5, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.contrastText', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UpdateIcon sx={{ fontSize: 52, animation: loadingLote ? 'spin-animation 2s linear infinite' : 'none' }} />
                      </Box>
                      <style>
                        {`
                          @keyframes spin-animation {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                          }
                        `}
                      </style>
                      <Typography variant="h5" fontWeight={700} gutterBottom>
                        Atualização em Lote
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mb: 4 }}>
                        Esta ação executa a rotina de segurança (backup obrigatório) e atualiza todos os clientes ativos de uma só vez para a versão mais recente cadastrada ({versoes[0]?.versao || 'Nenhuma versão cadastrada'}).
                      </Typography>

                      {/* Stats */}
                      <Grid container spacing={2} sx={{ maxWidth: 500, mb: 4 }}>
                        <Grid item xs={6}>
                          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight={700} color="primary">
                              {clientes.filter(c => c.status_licenca === 'ATIVO').length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Clientes Ativos
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight={700} color="secondary">
                              {versoes[0]?.versao || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Última Versão
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={loadingLote || clientes.filter(c => c.status_licenca === 'ATIVO').length === 0}
                        onClick={handleDispararAtualizacaoLote}
                        sx={{ py: 1.5, px: 5, borderRadius: 3, fontWeight: 'bold' }}
                        startIcon={loadingLote ? <CircularProgress size={20} color="inherit" /> : <UpdateIcon />}
                      >
                        {loadingLote ? 'Atualizando Clientes...' : 'Disparar Atualização em Lote'}
                      </Button>
                    </Card>

                    {/* Scheduler Card */}
                    <Card variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            Agendamento Inteligente com Trava de Segurança
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Configure o horário e os dias da semana para atualizações automáticas
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight={600} color={configAgendamento.agendamento_ativo ? "success.main" : "text.secondary"}>
                            {configAgendamento.agendamento_ativo ? "AGENDAMENTO ATIVO" : "TRAVADO / INATIVO"}
                          </Typography>
                          <Switch
                            checked={configAgendamento.agendamento_ativo}
                            onChange={(e) => {
                              const updated = { ...configAgendamento, agendamento_ativo: e.target.checked };
                              setConfigAgendamento(updated);
                              handleSaveConfigAgendamento(updated);
                            }}
                            color="success"
                            disabled={!temPermissao('pode_gerenciar_agendamento')}
                          />
                        </Box>
                      </Box>
                      <Divider sx={{ mb: 3 }} />

                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={3}>
                          <TextField
                            label="Horário de Execução"
                            type="time"
                            value={configAgendamento.horario_execucao ? configAgendamento.horario_execucao.substring(0, 5) : '02:00'}
                            onChange={(e) => {
                              const timeVal = e.target.value + ":00";
                              setConfigAgendamento({ ...configAgendamento, horario_execucao: timeVal });
                            }}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            disabled={!configAgendamento.agendamento_ativo || !temPermissao('pode_gerenciar_agendamento')}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" fontWeight={600} gutterBottom color={configAgendamento.agendamento_ativo && temPermissao('pode_gerenciar_agendamento') ? "text.primary" : "text.disabled"}>
                            Dias da Semana:
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dayName, idx) => {
                              const dayStr = String(idx);
                              const selectedDays = configAgendamento.dias_da_semana ? configAgendamento.dias_da_semana.split(',').map(d => d.trim()) : [];
                              const isSelected = selectedDays.includes(dayStr);

                              const toggleDay = () => {
                                let newDays = [...selectedDays];
                                if (isSelected) {
                                  newDays = newDays.filter(d => d !== dayStr);
                                } else {
                                  newDays.push(dayStr);
                                }
                                newDays.sort();
                                setConfigAgendamento({ ...configAgendamento, dias_da_semana: newDays.join(',') });
                              };

                              return (
                                <Chip
                                  key={dayStr}
                                  label={dayName}
                                  clickable={configAgendamento.agendamento_ativo && temPermissao('pode_gerenciar_agendamento')}
                                  color={isSelected ? "primary" : "default"}
                                  variant={isSelected ? "filled" : "outlined"}
                                  onClick={configAgendamento.agendamento_ativo && temPermissao('pode_gerenciar_agendamento') ? toggleDay : undefined}
                                  disabled={!configAgendamento.agendamento_ativo || !temPermissao('pode_gerenciar_agendamento')}
                                  sx={{ fontWeight: 'bold' }}
                                />
                              );
                            })}
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={3}>
                          <Button
                            variant="outlined"
                            color="primary"
                            fullWidth
                            onClick={() => handleSaveConfigAgendamento(configAgendamento)}
                            disabled={!configAgendamento.agendamento_ativo || !temPermissao('pode_gerenciar_agendamento')}
                            sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                          >
                            Salvar Configurações
                          </Button>
                        </Grid>
                      </Grid>
                    </Card>
                  </Stack>
                )}

                {subTabValue === 1 && (
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Ambientes e Servidores
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Cliente / Identificador</TableCell>
                              <TableCell align="center">Tipo</TableCell>
                              <TableCell align="center">Última Versão</TableCell>
                              <TableCell align="center">Status</TableCell>
                              <TableCell align="center">Ações</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {clientes.map((c) => {
                              // Find the last update history for this customer
                              const updateHistory = historicoAtualizacoes.filter(h => h.cliente === c.id_saas_cliente);
                              const lastUpdate = updateHistory[0]; // Ordered by -data_atualizacao in viewset

                              const getStatusChip = (status) => {
                                if (status === 'SUCESSO') return <Chip label="Sucesso" color="success" size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
                                if (status === 'FALHA') return <Chip label="Falha" color="error" size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
                                if (status === 'PROCESSANDO') return <Chip label="Processando" color="warning" size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
                                return <Chip label="Não Atualizado" color="default" size="small" variant="outlined" />;
                              };

                              return (
                                <TableRow key={c.id_saas_cliente} hover>
                                  <TableCell>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                      {c.razao_social}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                      {c.schema_name} (Porta: {c.db_port})
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    {c.is_test_environment ? (
                                      <Chip label="Teste/Laboratório" color="secondary" size="small" sx={{ fontWeight: 600 }} />
                                    ) : (
                                      <Chip label="Produção" color="primary" size="small" sx={{ fontWeight: 600 }} />
                                    )}
                                  </TableCell>
                                  <TableCell align="center">
                                    {lastUpdate ? (
                                      <Typography variant="body2" fontWeight={600} color="primary.main">
                                        {lastUpdate.versao_nome}
                                      </Typography>
                                    ) : '—'}
                                  </TableCell>
                                  <TableCell align="center">
                                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                      {getStatusChip(lastUpdate?.status)}
                                      {lastUpdate?.status === 'FALHA' && (
                                        <Tooltip title="Ver log de erro">
                                          <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={() => setLogModal({ open: true, title: `Log de Erro - ${c.razao_social}`, log: lastUpdate.log_erro })}
                                          >
                                            <LogIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Button
                                      variant="outlined"
                                      color="primary"
                                      size="small"
                                      disabled={loadingUpdate[c.id_saas_cliente] || lastUpdate?.status === 'PROCESSANDO'}
                                      onClick={() => handleDispararAtualizacao(c.id_saas_cliente)}
                                      startIcon={
                                        loadingUpdate[c.id_saas_cliente] || lastUpdate?.status === 'PROCESSANDO' ? (
                                          <CircularProgress size={14} />
                                        ) : (
                                          <UpdateIcon fontSize="small" />
                                        )
                                      }
                                    >
                                      {lastUpdate?.status === 'PROCESSANDO' ? 'Atualizando...' : 'Atualizar'}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {clientes.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                  Nenhum cliente/ambiente cadastrado no sistema.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                )}

                {subTabValue === 2 && (
                  <Stack spacing={3}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" fontWeight={700}>
                            Logs de Exceções dos Clientes (Tenants)
                          </Typography>
                          <Button variant="outlined" size="small" onClick={carregarDados}>
                            Atualizar Logs
                          </Button>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                          <Table size="small">
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Cliente / Schema</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Tipo de Erro</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Mensagem</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Data / Hora</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Array.isArray(centralLogs) && centralLogs.map((log) => (
                                <TableRow key={log.id} hover>
                                  <TableCell sx={{ fontWeight: 500 }}>{log.tenant_schema}</TableCell>
                                  <TableCell>
                                    <Chip label={log.tipo_excecao} size="small" color="error" variant="outlined" sx={{ fontWeight: 'bold' }} />
                                  </TableCell>
                                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {log.mensagem_erro}
                                  </TableCell>
                                  <TableCell>{fmtDataHora(log.criado_em)}</TableCell>
                                  <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                      <IconButton 
                                        size="small" 
                                        color="primary" 
                                        title="Ver Traceback Completo"
                                        onClick={() => setLogModal({ 
                                          open: true, 
                                          title: `Traceback de Erro - ${log.tenant_schema} (${log.tipo_excecao})`, 
                                          log: `URL Afetada: ${log.url_afetada || 'N/A'}\n\n${log.traceback_completo}` 
                                        })}
                                      >
                                        <LogIcon fontSize="small" />
                                      </IconButton>
                                      <Button 
                                        size="small" 
                                        color="success" 
                                        variant="contained"
                                        onClick={async () => {
                                          const obs = window.prompt("Adicionar observação de suporte (opcional):");
                                          if (obs !== null) {
                                            try {
                                              await axiosInstance.post(`/central-logs/${log.id}/resolver/`, { observacao_suporte: obs });
                                              showToast("Log de erro resolvido com sucesso!", "success");
                                              carregarDados();
                                            } catch (err) {
                                              showToast("Erro ao resolver log de erro.", "error");
                                            }
                                          }
                                        }}
                                      >
                                        Resolver
                                      </Button>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {(!Array.isArray(centralLogs) || centralLogs.length === 0) && (
                                <TableRow>
                                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                    Nenhum log de erro de execução não resolvido.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Stack>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 3 - MURAL DE AVISOS */}
        {activeTabName === "Mural de Avisos" && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={700}>Mural de Avisos (Comunicados SaaS)</Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => handleOpenComunicadoModal('create')}
              >
                Novo Comunicado
              </Button>
            </Box>

            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell fontWeight={600}>Título</TableCell>
                    <TableCell align="center">Tipo</TableCell>
                    <TableCell>Vigência</TableCell>
                    <TableCell align="center">Situação</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comunicados.map((com) => (
                    <TableRow key={com.id} hover>
                      <TableCell>
                        <Typography fontWeight={600} variant="body2">{com.titulo}</Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ 
                            display: 'block', 
                            maxWidth: '400px', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}
                        >
                          {com.conteudo_texto}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={com.tipo} 
                          size="small" 
                          color={com.tipo === 'VIDEO' ? 'error' : com.tipo === 'IMAGEM' ? 'primary' : 'default'} 
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        De {fmtData(com.data_inicio)} até {fmtData(com.data_fim)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={com.ativo ? 'Ativo' : 'Inativo'} 
                          size="small" 
                          color={com.ativo ? 'success' : 'default'} 
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <IconButton size="small" onClick={() => handleOpenComunicadoModal('edit', com)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteComunicado(com.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {comunicados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        Nenhum comunicado cadastrado no sistema.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 4 - PLANOS SAAS */}
        {activeTabName === "Planos SaaS" && (
          <Box sx={{ p: 3 }}>
            <Box mb={3}>
              <Typography variant="h6" fontWeight={700}>Planos SaaS e Recursos</Typography>
              <Typography variant="body2" color="text.secondary">
                Configure os valores de mensalidade e selecione quais módulos/recursos estão liberados para cada plano.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {Array.isArray(planos) && planos.map((p) => (
                <Grid item xs={12} md={4} key={p.id}>
                  <Card sx={{ 
                    borderRadius: 4, 
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    overflow: 'visible',
                    position: 'relative'
                  }}>
                    {/* Badge do Nome do Plano */}
                    <Box sx={{
                      position: 'absolute',
                      top: -12,
                      left: 20,
                      bgcolor: p.nome?.toUpperCase() === 'OURO' ? '#fbbf24' : p.nome?.toUpperCase() === 'PRATA' ? '#94a3b8' : '#b45309',
                      color: '#fff',
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>
                      PLANO {p.nome}
                    </Box>

                    <CardContent sx={{ pt: 4 }}>
                      <TextField
                        label="Mensalidade"
                        type="number"
                        value={p.valor_mensalidade}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          setPlanos(prev => prev.map(item => item.id === p.id ? { ...item, valor_mensalidade: newVal } : item));
                        }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        }}
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{ mb: 3 }}
                      />

                      <Divider sx={{ mb: 2 }}>
                        <Chip label="Recursos Liberados" size="small" variant="outlined" />
                      </Divider>

                      <Stack spacing={1}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={p.modulo_pdv}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setPlanos(prev => prev.map(item => item.id === p.id ? { ...item, modulo_pdv: checked } : item));
                              }}
                              color="primary"
                            />
                          }
                          label="Frente de Caixa / PDV / NFC-e"
                          sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', ml: 0 }}
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={p.modulo_financeiro_avancado}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setPlanos(prev => prev.map(item => item.id === p.id ? { ...item, modulo_financeiro_avancado: checked } : item));
                              }}
                              color="primary"
                            />
                          }
                          label="Financeiro Avançado"
                          sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', ml: 0 }}
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={p.modulo_producao_industria}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setPlanos(prev => prev.map(item => item.id === p.id ? { ...item, modulo_producao_industria: checked } : item));
                              }}
                              color="primary"
                            />
                          }
                          label="Controle de Produção / Indústria"
                          sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', ml: 0 }}
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={p.modulo_transporte_cte}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setPlanos(prev => prev.map(item => item.id === p.id ? { ...item, modulo_transporte_cte: checked } : item));
                              }}
                              color="primary"
                            />
                          }
                          label="Emissão de CT-e / MDF-e"
                          sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', ml: 0 }}
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={p.modulo_ciot_automatico}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setPlanos(prev => prev.map(item => item.id === p.id ? { ...item, modulo_ciot_automatico: checked } : item));
                              }}
                              color="primary"
                            />
                          }
                          label="Gestão de CIOT Automático"
                          sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', ml: 0 }}
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={p.modulo_report_builder}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setPlanos(prev => prev.map(item => item.id === p.id ? { ...item, modulo_report_builder: checked } : item));
                              }}
                              color="primary"
                            />
                          }
                          label="Construtor de Relatórios"
                          sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', ml: 0 }}
                        />
                      </Stack>

                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        fullWidth
                        onClick={() => handleSavePlano(p)}
                        sx={{ mt: 3, borderRadius: 2 }}
                      >
                        Salvar Plano
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* TAB 5 - TERMINAIS ATIVOS */}
        {activeTabName === "Terminais Ativos" && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={700}>Dispositivos e Terminais Ativos</Typography>
              <Typography variant="caption" color="text.secondary">
                Total de dispositivos registrados em todas as licenças: <strong>{todosTerminais.length}</strong>
              </Typography>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell fontWeight={600}>Cliente / Empresa</TableCell>
                    <TableCell>Identificador (Schema)</TableCell>
                    <TableCell>Nome do Computador</TableCell>
                    <TableCell>Hardware ID</TableCell>
                    <TableCell>Ativado Em</TableCell>
                    <TableCell>Último Acesso</TableCell>
                    <TableCell align="center">Limite Contratado</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todosTerminais.map((t) => (
                    <TableRow key={t.id_terminal} hover>
                      <TableCell>
                        <Typography fontWeight={600} variant="body2">{t.cliente_razao_social}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={t.cliente_schema} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{t.nome_computador || '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                        {t.hardware_id}
                      </TableCell>
                      <TableCell>
                        {fmtDataHora(t.ativado_em)}
                      </TableCell>
                      <TableCell>
                        {fmtDataHora(t.ultimo_acesso)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${t.limite_maquinas || 1} máquina(s)`} size="small" color="info" />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Excluir dispositivo para liberar licença">
                          <IconButton size="small" color="error" onClick={() => handleDeleteTerminal(t.id_terminal)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {todosTerminais.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary', fontStyle: 'italic' }}>
                        Nenhum terminal ou dispositivo ativo registrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {activeTabName === "Links de Acesso" && (
          <Box p={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Gerenciamento de Links de Acesso
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure manualmente o endereço de API customizado de cada cliente SaaS.
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <TextField
                  size="small"
                  placeholder="Buscar cliente..."
                  value={searchTermLinks}
                  onChange={(e) => setSearchTermLinks(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<RefreshIcon />}
                  onClick={carregarDados}
                >
                  Atualizar
                </Button>
              </Stack>
            </Stack>

            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              Se um <strong>Link de Acesso Customizado</strong> estiver configurado para o cliente, o aplicativo móvel (APK)
              irá obter este link ao consultar o CNPJ no primeiro acesso, salvá-lo no dispositivo e redirecionar
              todas as comunicações diretamente para ele. Se deixado em branco, a conexão seguirá a URL padrão do subdomínio.
            </Alert>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell fontWeight={600} style={{ width: '40%' }}>Cliente / Empresa</TableCell>
                    <TableCell fontWeight={600} style={{ width: '20%' }}>Identificador (Schema)</TableCell>
                    <TableCell fontWeight={600} style={{ width: '40%' }}>Link de Acesso Customizado (API)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(clientes) && clientes
                    .filter(c => {
                      if (!searchTermLinks) return true;
                      const term = searchTermLinks.toLowerCase();
                      return c.razao_social?.toLowerCase().includes(term) ||
                             c.cnpj?.includes(term) ||
                             c.schema_name?.toLowerCase().includes(term);
                    })
                    .map((c) => {
                      const isSaving = !!savingLink[c.id_saas_cliente];
                      const currentLinkVal = tempLinks[c.id_saas_cliente] !== undefined 
                        ? tempLinks[c.id_saas_cliente] 
                        : (c.link_acesso || '');
                      
                      const hasChanges = currentLinkVal !== (c.link_acesso || '');

                      return (
                        <TableRow key={c.id_saas_cliente} hover>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {c.razao_social}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              CNPJ: {c.cnpj ? c.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={c.schema_name} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="Padrão (https://{schema}.aperus.com.br/api/)"
                                value={currentLinkVal}
                                onChange={(e) => setTempLinks({ ...tempLinks, [c.id_saas_cliente]: e.target.value })}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <LinkIcon fontSize="small" color="action" />
                                    </InputAdornment>
                                  ),
                                }}
                                sx={{
                                  '& .MuiInputBase-input': {
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem'
                                  }
                                }}
                              />
                              <Tooltip title="Salvar Link Customizado">
                                <span>
                                  <IconButton
                                    size="small"
                                    color={hasChanges ? "primary" : "default"}
                                    onClick={() => handleSaveLinkAcesso(c)}
                                    disabled={isSaving}
                                    sx={{
                                      border: '1px solid',
                                      borderColor: hasChanges ? 'primary.main' : 'divider',
                                      bgcolor: hasChanges ? 'primary.lighter' : 'transparent',
                                      '&:hover': {
                                        bgcolor: hasChanges ? 'primary.light' : 'action.hover'
                                      }
                                    }}
                                  >
                                    {isSaving ? (
                                      <CircularProgress size={20} color="inherit" />
                                    ) : (
                                      <SaveIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                              {c.link_acesso && (
                                <Tooltip title="Restaurar Schema Padrão">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => {
                                        setTempLinks({ ...tempLinks, [c.id_saas_cliente]: '' });
                                        // Executa o salvamento com valor vazio para limpar
                                        handleSaveLinkAcesso({ ...c, link_acesso: '' });
                                      }}
                                      disabled={isSaving}
                                      sx={{
                                        border: '1px solid',
                                        borderColor: 'error.light',
                                        '&:hover': {
                                          bgcolor: 'error.lighter'
                                        }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {clientes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary', fontStyle: 'italic' }}>
                        Nenhum cliente registrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {activeTabName === "Backup Agendado" && (
          <Box p={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Backup Agendado (Google Drive para Desktop)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure a rotina automática para salvar cópias completas de todos os bancos de dados direto na sua unidade G:.
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<RefreshIcon />}
                onClick={carregarBackupConfig}
                disabled={loadingBackup}
              >
                Atualizar Status
              </Button>
            </Stack>

            {/* A. Status do Sistema */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', borderColor: backupConfig.status_ultimo_backup === 'Sucesso' ? 'success.light' : backupConfig.status_ultimo_backup?.startsWith('Falha') ? 'error.light' : 'divider' }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Status do Último Backup
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      {backupConfig.status_ultimo_backup === 'Sucesso' ? (
                        <Chip label="Sucesso" color="success" size="small" sx={{ fontWeight: 'bold', mr: 1 }} />
                      ) : backupConfig.status_ultimo_backup?.startsWith('Falha') ? (
                        <Chip label="Falha" color="error" size="small" sx={{ fontWeight: 'bold', mr: 1 }} />
                      ) : (
                        <Chip label={backupConfig.status_ultimo_backup || 'Pendente'} color="warning" size="small" sx={{ fontWeight: 'bold', mr: 1 }} />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {backupConfig.ultimo_backup_em ? fmtDataHora(backupConfig.ultimo_backup_em) : 'Nunca executado'}
                      </Typography>
                    </Box>
                    {backupConfig.status_ultimo_backup?.startsWith('Falha') && (
                      <Typography variant="caption" color="error.main" display="block" mt={1} sx={{ wordBreak: 'break-all' }}>
                        {backupConfig.status_ultimo_backup}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Diretório Ativo de Destino
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                      <StorageIcon color="info" fontSize="small" />
                      <Typography variant="body1" fontWeight={600} sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {backupConfig.diretorio_destino}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      Certifique-se de que o aplicativo Google Drive para Desktop está rodando e que a letra da unidade G: está montada.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* B. Formulário de Configurações */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom mb={3}>
                Configurações da Rotina de Cópia
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    label="Caminho do Drive (diretorio_destino) *"
                    fullWidth
                    size="small"
                    value={backupConfig.diretorio_destino}
                    onChange={(e) => setBackupConfig({ ...backupConfig, diretorio_destino: e.target.value })}
                    placeholder="G:\Meu Drive\BackupsAperus"
                    helperText="Caminho físico local da pasta montada pelo aplicativo do Google Drive"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Retenção (limite de arquivos) *"
                    type="number"
                    fullWidth
                    size="small"
                    value={backupConfig.retencao_arquivos}
                    onChange={(e) => setBackupConfig({ ...backupConfig, retencao_arquivos: parseInt(e.target.value) || 30 })}
                    helperText="Quantidade máxima de arquivos .sql.gz a manter na pasta"
                  />
                </Grid>

                {/* Dias da semana */}
                <Grid item xs={12}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
                    Dias da Semana para Execução
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                    {[
                      { key: 'segunda', label: 'Segunda' },
                      { key: 'terca', label: 'Terça' },
                      { key: 'quarta', label: 'Quarta' },
                      { key: 'quinta', label: 'Quinta' },
                      { key: 'sexta', label: 'Sexta' },
                      { key: 'sabado', label: 'Sábado' },
                      { key: 'domingo', label: 'Domingo' }
                    ].map((d) => (
                      <FormControlLabel
                        key={d.key}
                        control={
                          <Switch
                            checked={!!backupConfig[d.key]}
                            onChange={(e) => setBackupConfig({ ...backupConfig, [d.key]: e.target.checked })}
                            color="primary"
                          />
                        }
                        label={d.label}
                      />
                    ))}
                  </Stack>
                </Grid>

                {/* Seletor de quantidade e inputs dinâmicos de hora */}
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Execuções por Dia"
                    type="number"
                    fullWidth
                    size="small"
                    value={quantidadeHorarios}
                    onChange={(e) => handleQtdHorariosChange(e.target.value)}
                    InputProps={{ inputProps: { min: 1, max: 10 } }}
                    helperText="Número de backups executados diariamente"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary" mb={2}>
                    Definição dos Horários
                  </Typography>
                  <Grid container spacing={2}>
                    {Array.from({ length: quantidadeHorarios }).map((_, idx) => (
                      <Grid item xs={6} sm={2} key={idx}>
                        <TextField
                          label={`Horário ${idx + 1}`}
                          type="time"
                          fullWidth
                          size="small"
                          value={listaHorarios[idx] || "02:00"}
                          onChange={(e) => handleHorarioChange(idx, e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                {/* Ativo/Inativo */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!backupConfig.ativo}
                        onChange={(e) => setBackupConfig({ ...backupConfig, ativo: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Agendamento Ativo (Habilitar rotina automática)"
                  />
                </Grid>

                {/* Botões de Ação */}
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSalvarBackupConfig}
                      disabled={loadingBackup || forcingBackup}
                    >
                      {loadingBackup ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={forcingBackup ? <CircularProgress size={20} color="inherit" /> : <BoltIcon />}
                      onClick={handleForcarBackup}
                      disabled={loadingBackup || forcingBackup}
                    >
                      {forcingBackup ? 'Executando...' : 'Forçar Backup Agora'}
                    </Button>
                  </Stack>
                </Grid>

              </Grid>
            </Paper>
          </Box>
        )}

        {/* TAB 8 - CENTRAL DE LOGS */}
        {activeTabName === "Central de Logs" && (
          <Box sx={{ p: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <BugReportIcon color="error" sx={{ fontSize: 32 }} />
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        Central de Logs de Erros de Execução (Tenants)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Monitoramento em tempo real de exceções e erros de execução reportados pelos sistemas clientes
                      </Typography>
                    </Box>
                  </Box>
                  <Button variant="outlined" size="small" onClick={carregarDados} startIcon={<RefreshIcon />}>
                    Atualizar Logs
                  </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Cliente / Schema</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Tipo de Erro</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Mensagem</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Data / Hora</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(centralLogs) && centralLogs.map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell sx={{ fontWeight: 500 }}>
                            <Chip label={log.tenant_schema} size="small" color="primary" variant="outlined" sx={{ fontWeight: 'bold' }} />
                          </TableCell>
                          <TableCell>
                            <Chip label={log.tipo_excecao} size="small" color="error" variant="filled" sx={{ fontWeight: 'bold' }} />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.mensagem_erro}
                          </TableCell>
                          <TableCell>{fmtDataHora(log.criado_em)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <IconButton 
                                size="small" 
                                color="primary" 
                                title="Ver Traceback Completo"
                                onClick={() => setLogModal({ 
                                  open: true, 
                                  title: `Traceback de Erro - ${log.tenant_schema} (${log.tipo_excecao})`, 
                                  log: `URL Afetada: ${log.url_afetada || 'N/A'}\n\n${log.traceback_completo}` 
                                })}
                              >
                                <LogIcon fontSize="small" />
                              </IconButton>
                              <Button 
                                size="small" 
                                color="success" 
                                variant="contained"
                                onClick={async () => {
                                  const obs = window.prompt("Adicionar observação de suporte (opcional):");
                                  if (obs !== null) {
                                    try {
                                      await axiosInstance.post(`/central-logs/${log.id}/resolver/`, { observacao_suporte: obs });
                                      showToast("Log de erro resolvido com sucesso!", "success");
                                      carregarDados();
                                    } catch (err) {
                                      showToast("Erro ao resolver log de erro.", "error");
                                    }
                                  }
                                }}
                              >
                                Resolver
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!Array.isArray(centralLogs) || centralLogs.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                            <Typography variant="body1" fontWeight={600}>Nenhum log de erro de execução pendente.</Typography>
                            <Typography variant="caption" color="text.secondary">Todos os sistemas clientes estão operando normalmente sem exceções registradas.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}
      </Paper>

      {/* DIALOGS */}

      {/* 1. CLIENT MODAL */}
      <Dialog open={clientModal.open} onClose={() => setClientModal({ ...clientModal, open: false })} maxWidth="md" fullWidth>
        <DialogTitle>{clientModal.mode === 'create' ? 'Cadastrar Novo Cliente' : 'Editar Dados do Cliente'}</DialogTitle>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={modalTab} onChange={(e, v) => setModalTab(v)} variant="fullWidth">
            <Tab label="Dados Básicos" />
            <Tab label="Endereço" />
            <Tab label="Contrato & Conexão" />
            {clientModal.mode === 'edit' && <Tab label="Importador de Dados" />}
          </Tabs>
        </Box>
        <DialogContent dividers sx={{ minHeight: '340px' }}>
          {modalTab === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="CNPJ *" fullWidth size="small"
                  value={clientForm.cnpj} onChange={(e) => setClientForm({ ...clientForm, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  disabled={loadingCNPJ}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <span>
                          <IconButton
                            aria-label="buscar cnpj"
                            onClick={handleBuscaCNPJ}
                            disabled={loadingCNPJ || Boolean(clientForm.cnpj && clientForm.cnpj.replace(/\D/g, '').length !== 14)}
                            edge="end"
                            size="small"
                          >
                            {loadingCNPJ ? <CircularProgress size={20} /> : <SearchIcon />}
                          </IconButton>
                        </span>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Razão Social *" fullWidth size="small"
                  value={clientForm.razao_social} onChange={(e) => setClientForm({ ...clientForm, razao_social: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nome Fantasia" fullWidth size="small"
                  value={clientForm.nome_fantasia} onChange={(e) => setClientForm({ ...clientForm, nome_fantasia: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Inscrição Estadual" fullWidth size="small"
                  value={clientForm.inscricao_estadual} onChange={(e) => setClientForm({ ...clientForm, inscricao_estadual: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Proprietário / Responsável" fullWidth size="small"
                  value={clientForm.proprietario} onChange={(e) => setClientForm({ ...clientForm, proprietario: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Vendedor / Representante" fullWidth size="small"
                  value={clientForm.vendedor} onChange={(e) => setClientForm({ ...clientForm, vendedor: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Telefone" fullWidth size="small"
                  value={clientForm.telefone} onChange={(e) => setClientForm({ ...clientForm, telefone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="E-mail" fullWidth size="small"
                  value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="E-mail do Responsável" fullWidth size="small"
                  value={clientForm.email_responsavel} onChange={(e) => setClientForm({ ...clientForm, email_responsavel: e.target.value })}
                  placeholder="Ex: responsavel@empresa.com"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data Nasc. Responsável" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
                  value={clientForm.data_nascimento_responsavel} onChange={(e) => setClientForm({ ...clientForm, data_nascimento_responsavel: e.target.value })}
                />
              </Grid>
            </Grid>
          )}

          {modalTab === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="CEP" fullWidth size="small"
                  value={clientForm.cep} onChange={(e) => setClientForm({ ...clientForm, cep: e.target.value })}
                  placeholder="00000-000"
                  disabled={loadingCEP}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <span>
                          <IconButton
                            aria-label="buscar cep"
                            onClick={handleBuscaCEP}
                            disabled={loadingCEP || Boolean(clientForm.cep && clientForm.cep.replace(/\D/g, '').length !== 8)}
                            edge="end"
                            size="small"
                          >
                            {loadingCEP ? <CircularProgress size={20} /> : <SearchIcon />}
                          </IconButton>
                        </span>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Logradouro" fullWidth size="small"
                  value={clientForm.endereco} onChange={(e) => setClientForm({ ...clientForm, endereco: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Número" fullWidth size="small"
                  value={clientForm.numero} onChange={(e) => setClientForm({ ...clientForm, numero: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Complemento" fullWidth size="small"
                  value={clientForm.complemento} onChange={(e) => setClientForm({ ...clientForm, complemento: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Bairro" fullWidth size="small"
                  value={clientForm.bairro} onChange={(e) => setClientForm({ ...clientForm, bairro: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Cidade" fullWidth size="small"
                  value={clientForm.cidade} onChange={(e) => setClientForm({ ...clientForm, cidade: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  label="UF" fullWidth size="small"
                  value={clientForm.estado} onChange={(e) => setClientForm({ ...clientForm, estado: e.target.value })}
                  inputProps={{ maxLength: 2 }}
                />
              </Grid>
            </Grid>
          )}

          {modalTab === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Identificador (Schema Name) *" fullWidth size="small"
                  value={clientForm.schema_name} onChange={(e) => setClientForm({ ...clientForm, schema_name: e.target.value })}
                  placeholder="ex: testes"
                  helperText="Deve ser único (letras, números, - ou _)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Host do Banco (db_host) *" fullWidth size="small"
                  value={clientForm.db_host} onChange={(e) => setClientForm({ ...clientForm, db_host: e.target.value })}
                  placeholder="localhost"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Porta do Banco (db_port) *" fullWidth size="small"
                  value={clientForm.db_port} onChange={(e) => setClientForm({ ...clientForm, db_port: e.target.value })}
                  placeholder="8005"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Ambiente de Teste?</InputLabel>
                  <Select
                    value={clientForm.is_test_environment}
                    onChange={(e) => setClientForm({ ...clientForm, is_test_environment: e.target.value === 'true' || e.target.value === true })}
                    label="Ambiente de Teste?"
                  >
                    <MenuItem value={true}>Sim</MenuItem>
                    <MenuItem value={false}>Não</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Dia do Vencimento *" type="number" fullWidth size="small"
                  value={clientForm.dia_vencimento} onChange={(e) => setClientForm({ ...clientForm, dia_vencimento: parseInt(e.target.value) || 10 })}
                  disabled={!temPermissao('pode_cadastrar_financeiro_saas')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Plano Contratado</InputLabel>
                  <Select
                    value={clientForm.plano}
                    onChange={(e) => {
                      const selectedPlanoId = e.target.value;
                      const selectedPlano = planos.find(p => p.id === selectedPlanoId);
                      setClientForm({ 
                        ...clientForm, 
                        plano: selectedPlanoId,
                        valor_mensalidade: selectedPlano ? selectedPlano.valor_mensalidade : clientForm.valor_mensalidade
                      });
                    }}
                    label="Plano Contratado"
                  >
                    <MenuItem value=""><em>Nenhum plano (Customizado)</em></MenuItem>
                    {planos.map((p) => (
                      <MenuItem key={p.id} value={p.id}>{p.nome} (R$ {parseFloat(p.valor_mensalidade).toFixed(2).replace('.', ',')})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Valor da Mensalidade (R$) *" type="number" fullWidth size="small"
                  value={clientForm.valor_mensalidade} onChange={(e) => setClientForm({ ...clientForm, valor_mensalidade: e.target.value })}
                  disabled={!temPermissao('pode_cadastrar_financeiro_saas')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Situação da Licença</InputLabel>
                  <Select
                    value={clientForm.status_licenca}
                    onChange={(e) => setClientForm({ ...clientForm, status_licenca: e.target.value })}
                    label="Situação da Licença"
                  >
                    <MenuItem value="ATIVO">Ativo</MenuItem>
                    <MenuItem value="BLOQUEADO">Bloqueado</MenuItem>
                    <MenuItem value="DEMO">Demonstração</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Próximo Reajuste" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
                  value={clientForm.data_reajuste} onChange={(e) => setClientForm({ ...clientForm, data_reajuste: e.target.value })}
                  disabled={!temPermissao('pode_cadastrar_financeiro_saas')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" disabled={!temPermissao('pode_cadastrar_financeiro_saas')}>
                  <InputLabel>Emite Notas Fiscais?</InputLabel>
                  <Select
                    value={clientForm.emite_nota}
                    onChange={(e) => setClientForm({ ...clientForm, emite_nota: e.target.value === 'true' || e.target.value === true })}
                    label="Emite Notas Fiscais?"
                  >
                    <MenuItem value={true}>Sim</MenuItem>
                    <MenuItem value={false}>Não</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Limite de Máquinas Contratadas *" type="number" fullWidth size="small"
                  value={clientForm.limite_maquinas || 1} onChange={(e) => setClientForm({ ...clientForm, limite_maquinas: parseInt(e.target.value) || 1 })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Link de Acesso Customizado (API URL)" fullWidth size="small"
                  value={clientForm.link_acesso || ''} onChange={(e) => setClientForm({ ...clientForm, link_acesso: e.target.value })}
                  placeholder="ex: http://192.168.1.4:8005/api/"
                  helperText="Se configurado, o APK móvel conectará a esta URL após a validação do CNPJ. Deixe em branco para usar o schema padrão (https://schema.aperus.com.br/api/)."
                />
              </Grid>
            </Grid>
          )}

          {modalTab === 3 && clientModal.mode === 'edit' && (
            <Box sx={{ mt: 1, p: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon color="primary" /> Importador de Dados Centralizado
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Os dados serão injetados diretamente no banco de dados do tenant. Certifique-se de que a planilha Excel (.xlsx) segue a estrutura correta.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Banco de Dados Alvo
                      </Typography>
                      <Chip 
                        label={`aperus_${clientForm.schema_name}`} 
                        color="success" 
                        variant="outlined" 
                        sx={{ fontWeight: 'bold', fontSize: '0.95rem', px: 1, py: 2, mb: 3 }} 
                      />

                      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                        <InputLabel>Tipo de Importação</InputLabel>
                        <Select
                          value={importType}
                          label="Tipo de Importação"
                          onChange={(e) => {
                            const newType = e.target.value;
                            setImportType(newType);
                            setImportResult(null);
                            if (importFile) {
                              handleCarregarPreview(importFile, newType);
                            }
                          }}
                        >
                          <MenuItem value="CLIENTES">Clientes (Razão Social, CNPJ, Telefone, Email)</MenuItem>
                          <MenuItem value="FORNECEDORES">Fornecedores (Razão Social, CNPJ, Telefone, Email)</MenuItem>
                          <MenuItem value="PRODUTOS">Produtos (Descrição, Preço de Venda, Código Barras, NCM)</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={!importFile || importing}
                      onClick={handleExecutarImportacao}
                      startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <BoltIcon />}
                      sx={{ py: 1.2, fontWeight: 'bold' }}
                    >
                      {importing ? 'Processando e Injetando...' : 'Processar e Injetar na Base'}
                    </Button>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box 
                    sx={{
                      border: '2px dashed',
                      borderColor: importFile ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      backgroundColor: importFile ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(25, 118, 210, 0.02)'
                      }
                    }}
                    onClick={() => document.getElementById('excel-file-input').click()}
                  >
                    <input
                      type="file"
                      id="excel-file-input"
                      accept=".xlsx, .xls"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setImportFile(file);
                          setImportResult(null);
                          handleCarregarPreview(file, importType);
                        }
                      }}
                    />
                    <StorageIcon sx={{ fontSize: 48, color: importFile ? 'primary.main' : 'text.disabled', mb: 2 }} />
                    {importFile ? (
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                          {importFile.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(importFile.size / 1024).toFixed(1)} KB
                        </Typography>
                        <Button 
                          size="small" 
                          color="error" 
                          sx={{ mt: 1, fontWeight: 'bold' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setImportFile(null);
                            setImportHeaders([]);
                            setImportMapping({});
                            setImportResult(null);
                            document.getElementById('excel-file-input').value = '';
                          }}
                        >
                          Remover Arquivo
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          Selecione a planilha Excel (.xlsx)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Clique aqui para escolher o arquivo
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {previewLoading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, mb: 2 }}>
                  <CircularProgress size={30} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Analisando planilha e sugerindo colunas...
                  </Typography>
                </Box>
              )}

              {importHeaders.length > 0 && (
                <Card variant="outlined" sx={{ mt: 3, p: 3, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon color="primary" /> Mapeamento de Colunas da Planilha
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Associe as colunas encontradas na sua planilha com os campos do sistema. O sistema tentou mapear as colunas automaticamente por semelhança de nomes.
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {Object.entries(MAPPING_LABELS)
                      .filter(([campo]) => {
                        const isClienteField = ['nome_razao', 'cpf_cnpj', 'nome_fantasia', 'ie', 'telefone', 'whatsapp', 'email', 'data_nascimento', 'cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'observacao'].includes(campo);
                         return (importType === 'CLIENTES' || importType === 'FORNECEDORES') ? isClienteField : !isClienteField;
                      })
                      .map(([campo, meta]) => (
                        <Grid item xs={12} sm={6} md={4} key={campo}>
                          <FormControl fullWidth size="small" sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                            <InputLabel required={meta.required}>{meta.label}</InputLabel>
                            <Select
                              value={importMapping[campo] || ''}
                              label={meta.label}
                              onChange={(e) => {
                                const val = e.target.value;
                                setImportMapping(prev => ({ ...prev, [campo]: val }));
                              }}
                            >
                              <MenuItem value=""><em>(Não importar / Ignorar)</em></MenuItem>
                              {importHeaders.map((header) => (
                                <MenuItem key={header} value={header}>{header}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      ))
                    }
                  </Grid>
                </Card>
              )}

              {/* Tabela Exemplo da Planilha */}
              <Box sx={{ mt: 3, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                  Layout Esperado da Planilha ({importType === 'PRODUTOS' ? 'Produtos' : importType === 'FORNECEDORES' ? 'Fornecedores' : 'Clientes'}):
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small" sx={{ minWidth: importType === 'PRODUTOS' ? 650 : 1600 }}>
                    <TableHead sx={{ backgroundColor: 'action.hover' }}>
                      <TableRow>
                        {importType !== 'PRODUTOS' ? (
                          <>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna A (Razão Social)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna B (CNPJ/CPF)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna C (Nome Fantasia)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna D (Insc. Estadual)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna E (Telefone)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna F (WhatsApp)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna G (Email)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna H (Nascimento)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna I (CEP)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna J (Endereço)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna K (Número)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna L (Complemento)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna M (Bairro)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna N (Cidade)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna O (Estado)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna P (Observação)</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna A (Descrição)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna B (Preço de Venda)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna C (Cód. Barras)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Coluna D (NCM)</TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importType !== 'PRODUTOS' ? (
                        <TableRow>
                          <TableCell sx={{ fontSize: '0.75rem' }}>BRUNO DOS REIS NASCIMENTO</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>123.456.789-00</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>BRUNO SOFTWARE</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>ISENTO</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>(11) 99999-8888</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>(11) 99999-8888</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>bruno@email.com</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>23/06/1995</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>01001-000</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>Praça da Sé</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>100</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>Apto 12</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>Sé</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>São Paulo</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>SP</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>Cliente preferencial</TableCell>
                        </TableRow>
                      ) : (
                        <TableRow>
                          <TableCell sx={{ fontSize: '0.75rem' }}>Martelo de Unha 20mm</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>45.90</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>7891234567890</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>82052000</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {importResult && (
                <Box sx={{ mt: 3 }}>
                  {importResult.sucesso ? (
                    <Alert severity={importResult.erros && importResult.erros.length > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
                      <Typography fontWeight="bold">{importResult.mensagem}</Typography>
                      {importResult.erros && importResult.erros.length > 0 && (
                        <Typography variant="body2" mt={0.5}>
                          A importação foi concluída, mas {importResult.erros.length} linhas apresentaram falhas.
                        </Typography>
                      )}
                    </Alert>
                  ) : (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography fontWeight="bold">Erro na Importação:</Typography>
                      <Typography variant="body2">{importResult.mensagem}</Typography>
                    </Alert>
                  )}

                  {importResult.erros && importResult.erros.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflowY: 'auto', backgroundColor: '#fafafa' }}>
                      <Typography variant="subtitle2" color="error" fontWeight="bold" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <WarningIcon fontSize="small" /> Detalhes dos erros por linha ({importResult.erros.length})
                      </Typography>
                      <Divider sx={{ mb: 1 }} />
                      <Stack spacing={0.5}>
                        {importResult.erros.map((err, i) => (
                          <Typography key={i} variant="caption" color="text.secondary" fontFamily="monospace">
                            • {err}
                          </Typography>
                        ))}
                      </Stack>
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClientModal({ ...clientModal, open: false })}>
            {modalTab === 3 ? 'Fechar' : 'Cancelar'}
          </Button>
          {modalTab !== 3 && (
            <Button variant="contained" onClick={handleSaveClient}>Salvar</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 2. BATCH BILLING MODAL */}
      <Dialog open={billingModal.open} onClose={() => setBillingModal({ open: false, clientId: null, meses: 6 })} maxWidth="xs" fullWidth>
        <DialogTitle>Gerar Lote de Mensalidades</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={2}>
            Gere cobranças recorrentes subsequentes para o cliente selecionado automaticamente.
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Quantidade de meses</InputLabel>
            <Select
              value={billingModal.meses}
              onChange={(e) => setBillingModal({ ...billingModal, meses: parseInt(e.target.value) || 1 })}
              label="Quantidade de meses"
            >
              <MenuItem value={1}>1 Mês</MenuItem>
              <MenuItem value={3}>3 Meses</MenuItem>
              <MenuItem value={6}>6 Meses (Semestral)</MenuItem>
              <MenuItem value={12}>12 Meses (Anual)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBillingModal({ open: false, clientId: null, meses: 6 })}>Cancelar</Button>
          <Button variant="contained" onClick={handleGerarMensalidades}>Gerar Cobranças</Button>
        </DialogActions>
      </Dialog>

      {/* 3. CONTRACT MODAL */}
      <Dialog open={contractModal.open} onClose={() => setContractModal({ open: false, clientId: null, texto: '', loading: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Gerar Contrato de Prestação de Serviços</DialogTitle>
        <DialogContent dividers>
          {contractModal.loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="body2" mb={2}>
                Revise os termos do contrato gerados automaticamente para o cliente antes de publicar.
              </Typography>
              <TextField
                label="Conteúdo do Contrato"
                multiline
                rows={12}
                fullWidth
                value={contractModal.texto}
                onChange={(e) => setContractModal({ ...contractModal, texto: e.target.value })}
                placeholder="Cláusula 1ª: O presente termo de adesão rege a utilização do sistema Aperus..."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContractModal({ open: false, clientId: null, texto: '', loading: false })} disabled={contractModal.loading}>Cancelar</Button>
          <Button variant="contained" onClick={handleGerarContrato} disabled={contractModal.loading}>Publicar Contrato</Button>
        </DialogActions>
      </Dialog>

      {/* 4. PAYMENT DETAIL / ACTION MODAL */}
      <Dialog open={paymentModal.open} onClose={() => setPaymentModal({ open: false, payment: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Faturamento — Nosso Número: {paymentModal.payment?.nosso_numero}</DialogTitle>
        <DialogContent dividers>
          {paymentModal.payment && (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">Valor da Cobrança</Typography>
                <Typography variant="h5" fontWeight={700} color="primary">{fmtMoeda(paymentModal.payment.valor)}</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Vencimento</Typography>
                  <Typography variant="body1" fontWeight={500}>{fmtData(paymentModal.payment.data_vencimento)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Situação</Typography>
                  <Box mt={0.5}>
                    <StatusPagamentoChip status={paymentModal.payment.status_pagamento} />
                  </Box>
                </Grid>
              </Grid>

              {paymentModal.payment.status_pagamento !== 'PAGO' && (
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>Meios de Pagamento Integrados (Simulado)</Typography>
                  <Stack spacing={1.5}>
                    {paymentModal.payment.url_boleto && (
                      <Button
                        variant="outlined"
                        startIcon={<LaunchIcon />}
                        href={paymentModal.payment.url_boleto}
                        target="_blank"
                        size="small"
                        fullWidth
                      >
                        Visualizar Boleto Bancário
                      </Button>
                    )}
                    {paymentModal.payment.pix_copia_cola && (
                      <Stack direction="row" spacing={1}>
                        <TextField
                          label="Pix Copia e Cola"
                          value={paymentModal.payment.pix_copia_cola}
                          fullWidth
                          size="small"
                          InputProps={{ readOnly: true }}
                        />
                        <Button variant="contained" size="small" onClick={() => copiarPix(paymentModal.payment.pix_copia_cola)}>
                          Copiar
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </Box>
              )}

              {paymentModal.payment.data_pagamento && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Liquidado em</Typography>
                  <Typography variant="body1" fontWeight={500}>{fmtData(paymentModal.payment.data_pagamento)}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
          <Box>
            {paymentModal.payment?.status_pagamento !== 'PAGO' && (
              <Button color="success" variant="contained" startIcon={<PaidIcon />} onClick={() => handleConfirmarPagamento('PAGO')}>
                Confirmar Pagamento
              </Button>
            )}
            {paymentModal.payment?.status_pagamento === 'PAGO' && (
              <Button color="warning" variant="outlined" onClick={() => handleConfirmarPagamento('PENDENTE')}>
                Estornar para Pendente
              </Button>
            )}
          </Box>
          <Box>
            {paymentModal.payment?.status_pagamento !== 'CANCELADO' && paymentModal.payment?.status_pagamento !== 'PAGO' && (
              <Button color="error" variant="text" startIcon={<CancelIcon />} onClick={() => handleConfirmarPagamento('CANCELADO')} sx={{ mr: 1 }}>
                Cancelar Cobrança
              </Button>
            )}
            <Button onClick={() => setPaymentModal({ open: false, payment: null })}>Fechar</Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* 5. REGISTER NEW VERSION MODAL */}
      <Dialog open={versionModal.open} onClose={() => setVersionModal({ ...versionModal, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Cadastrar Nova Versão do Sistema</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Versão *"
              placeholder="ex: v1.1.0"
              fullWidth
              size="small"
              value={versionModal.versao}
              onChange={(e) => setVersionModal({ ...versionModal, versao: e.target.value })}
            />
            <TextField
              label="Descrição / Changelog"
              placeholder="Descreva as novidades e correções aplicadas nesta versão..."
              multiline
              rows={4}
              fullWidth
              size="small"
              value={versionModal.descricao}
              onChange={(e) => setVersionModal({ ...versionModal, descricao: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionModal({ open: false, versao: '', descricao: '' })}>Cancelar</Button>
          <Button variant="contained" onClick={handleCadastrarVersao}>Salvar Versão</Button>
        </DialogActions>
      </Dialog>

      {/* 6. LOG DETAIL MODAL */}
      <Dialog open={logModal.open} onClose={() => setLogModal({ open: false, title: '', log: '' })} maxWidth="md" fullWidth>
        <DialogTitle>{logModal.title}</DialogTitle>
        <DialogContent dividers>
          <Typography 
            variant="body2" 
            component="pre" 
            sx={{ 
              fontFamily: 'monospace', 
              whiteSpace: 'pre-wrap', 
              bgcolor: 'grey.900', 
              color: 'grey.100', 
              p: 2, 
              borderRadius: 2, 
              maxHeight: 400, 
              overflowY: 'auto' 
            }}
          >
            {logModal.log || 'Nenhum log registrado.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogModal({ open: false, title: '', log: '' })}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* 7. COMUNICADO MODAL */}
      <Dialog open={comunicadoModal.open} onClose={() => setComunicadoModal({ ...comunicadoModal, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{comunicadoModal.mode === 'create' ? 'Novo Comunicado' : 'Editar Comunicado'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              label="Título *"
              fullWidth
              size="small"
              value={comunicadoForm.titulo}
              onChange={(e) => setComunicadoForm({ ...comunicadoForm, titulo: e.target.value })}
              placeholder="Ex: Atualização programada do sistema"
            />
            
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Mídia *</InputLabel>
              <Select
                value={comunicadoForm.tipo}
                onChange={(e) => setComunicadoForm({ ...comunicadoForm, tipo: e.target.value })}
                label="Tipo de Mídia *"
              >
                <MenuItem value="TEXTO">Somente Texto</MenuItem>
                <MenuItem value="IMAGEM">Imagem (Link/URL)</MenuItem>
                <MenuItem value="VIDEO">Vídeo YouTube (Link/URL)</MenuItem>
              </Select>
            </FormControl>

            {comunicadoForm.tipo === 'IMAGEM' && (
              <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1, textAlign: 'center', mt: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                  {comunicadoForm.imagem_file ? `Selecionado: ${comunicadoForm.imagem_file.name}` : 'Selecione uma Imagem do seu Computador'}
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                >
                  Selecionar Imagem
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setComunicadoForm({ ...comunicadoForm, imagem_file: e.target.files[0] });
                      }
                    }}
                  />
                </Button>
                {comunicadoModal.mode === 'edit' && comunicadoModal.data && comunicadoModal.data.imagem && !comunicadoForm.imagem_file && (
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                    ✓ Já possui uma imagem cadastrada (ou você pode selecionar outra acima).
                  </Typography>
                )}
              </Box>
            )}

            {comunicadoForm.tipo === 'VIDEO' && (
              <TextField
                label="Link/URL do Vídeo YouTube *"
                fullWidth
                size="small"
                value={comunicadoForm.url_midia}
                onChange={(e) => setComunicadoForm({ ...comunicadoForm, url_midia: e.target.value })}
                placeholder="Ex: https://youtube.com/watch?v=..."
              />
            )}

            <TextField
              label="Conteúdo do Comunicado *"
              multiline
              rows={5}
              fullWidth
              size="small"
              value={comunicadoForm.conteudo_texto}
              onChange={(e) => setComunicadoForm({ ...comunicadoForm, conteudo_texto: e.target.value })}
              placeholder="Escreva a mensagem do aviso..."
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Data de Início *"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={comunicadoForm.data_inicio}
                  onChange={(e) => setComunicadoForm({ ...comunicadoForm, data_inicio: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Data de Término *"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={comunicadoForm.data_fim}
                  onChange={(e) => setComunicadoForm({ ...comunicadoForm, data_fim: e.target.value })}
                />
              </Grid>
            </Grid>

            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" fontWeight={600}>Comunicado Ativo?</Typography>
              <Switch
                checked={comunicadoForm.ativo}
                onChange={(e) => setComunicadoForm({ ...comunicadoForm, ativo: e.target.checked })}
                color="success"
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComunicadoModal({ ...comunicadoModal, open: false })}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveComunicado}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal para selecionar o gabarito base (etiqueta/bobina) */}
      <Dialog 
        open={baseGabaritoModal} 
        onClose={() => setBaseGabaritoModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Selecione o Gabarito de Impressão Base</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Selecione uma base de layout de impressão abaixo. Os campos e dimensões padrão serão carregados.
          </Typography>
          <Stack spacing={1.5}>
            <Button 
              variant="outlined" 
              onClick={() => handleIniciarNovoGabaritoComBase('venda_recibo')}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.5 }}
            >
              🎫 Recibo de Venda (Bobina 80mm)
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => handleIniciarNovoGabaritoComBase('etiqueta_gondola')}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.5 }}
            >
              🏷️ Etiqueta de Gôndola (100x50mm)
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBaseGabaritoModal(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal para selecionar o relatório base (A4) */}
      <Dialog 
        open={baseReportModal} 
        onClose={() => setBaseReportModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Selecione o Relatório Base</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 350, overflowY: 'auto' }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Selecione um relatório padrão do sistema para servir como base de layout customizado.
          </Typography>
          <Stack spacing={1.5}>
            {RELATORIOS_PADRAO_SISTEMA.map(rep => (
              <Button 
                key={rep.id}
                variant="outlined" 
                onClick={() => handleIniciarNovoRelatorioComBase(rep)}
                sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.2 }}
              >
                📊 {rep.titulo}
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBaseReportModal(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal para Cadastro Remoto (WhatsApp) */}
      <Dialog
        open={remoteInviteModal}
        onClose={() => setRemoteInviteModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <SendIcon color="primary" /> Convite de Cadastro Remoto
        </DialogTitle>
        <DialogContent dividers>
          {!generatedLinkData ? (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Preencha os dados comerciais da nova conta. Um link seguro será enviado para o WhatsApp do cliente para que ele complete as informações cadastrais e ative a conta.
              </Typography>
              <TextField
                required
                label="WhatsApp do Cliente (com DDD)"
                value={remoteInviteForm.whatsapp_cliente}
                onChange={(e) => setRemoteInviteForm({ ...remoteInviteForm, whatsapp_cliente: formatTelefone(e.target.value) })}
                placeholder="(99) 99999-9999"
                fullWidth
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    required
                    label="Valor Mensalidade"
                    type="number"
                    value={remoteInviteForm.valor_mensalidade}
                    onChange={(e) => setRemoteInviteForm({ ...remoteInviteForm, valor_mensalidade: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Dia Vencimento"
                    type="number"
                    value={remoteInviteForm.dia_vencimento}
                    onChange={(e) => setRemoteInviteForm({ ...remoteInviteForm, dia_vencimento: e.target.value })}
                    fullWidth
                  />
                </Grid>
              </Grid>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status da Licença</InputLabel>
                    <Select
                      value={remoteInviteForm.status_licenca}
                      label="Status da Licença"
                      onChange={(e) => setRemoteInviteForm({ ...remoteInviteForm, status_licenca: e.target.value })}
                    >
                      <MenuItem value="ATIVO">Ativo</MenuItem>
                      <MenuItem value="DEMO">Demonstração</MenuItem>
                      <MenuItem value="BLOQUEADO">Bloqueado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Vendedor / Representante"
                    value={remoteInviteForm.vendedor}
                    onChange={(e) => setRemoteInviteForm({ ...remoteInviteForm, vendedor: e.target.value })}
                    fullWidth
                  />
                </Grid>
              </Grid>

              <TextField
                label="Schema Name (Pasta/DB opcional)"
                value={remoteInviteForm.schema_name}
                onChange={(e) => setRemoteInviteForm({ ...remoteInviteForm, schema_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="ex: cliente_nome"
                helperText="Se deixado em branco, será gerado automaticamente a partir da Razão Social."
                fullWidth
              />

              <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={remoteInviteForm.emite_nota}
                      onChange={(e) => setRemoteInviteForm({ ...remoteInviteForm, emite_nota: e.target.checked })}
                    />
                  }
                  label="Emite Notas Fiscais"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={remoteInviteForm.is_test_environment}
                      onChange={(e) => setRemoteInviteForm({ ...remoteInviteForm, is_test_environment: e.target.checked })}
                    />
                  }
                  label="Ambiente de Testes"
                />
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={3} sx={{ py: 2, alignItems: 'center', textAlign: 'center' }}>
              <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'success.light', color: 'success.dark', display: 'flex' }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 48 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} color="success.main">
                  Link de Cadastro Gerado!
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {generatedLinkData.whatsapp_enviado 
                    ? `O link foi disparado com sucesso via WhatsApp para ${remoteInviteForm.whatsapp_cliente}.` 
                    : `Não foi possível disparar via API automática do WhatsApp. Por favor, copie e envie manualmente.`
                  }
                </Typography>
              </Box>

              <TextField
                label="Link de Cadastro Remoto"
                value={generatedLinkData.url}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLinkData.url);
                          showToast('Link copiado para a área de transferência!', 'success');
                        }}
                      >
                        <CopyIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />

              <Button
                variant="contained"
                startIcon={<WhatsAppIcon />}
                onClick={() => {
                  const phone = remoteInviteForm.whatsapp_cliente.replace(/\D/g, '');
                  const msg = `Olá! Para darmos andamento à ativação do seu sistema Aperus, por favor, preencha seus dados cadastrais pelo link seguro:\n\n${generatedLinkData.url}\n\n_(Este link é válido por 48 horas)_`;
                  const finalPhone = phone.length <= 11 ? `55${phone}` : phone;
                  window.open(`https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(msg)}`, '_blank');
                }}
                sx={{
                  bgcolor: '#25D366',
                  '&:hover': { bgcolor: '#128C7E' },
                  color: '#fff',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  mt: 1
                }}
                fullWidth
              >
                Enviar pelo WhatsApp (Web/App)
              </Button>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoteInviteModal(false)}>
            {generatedLinkData ? 'Fechar' : 'Cancelar'}
          </Button>
          {!generatedLinkData && (
            <Button
              variant="contained"
              onClick={handleGerarLinkCadastro}
              disabled={loadingRemoteInvite || !remoteInviteForm.whatsapp_cliente || !remoteInviteForm.valor_mensalidade}
              startIcon={loadingRemoteInvite ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            >
              {loadingRemoteInvite ? 'Gerando...' : 'Gerar e Enviar Link'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Visual Report Builder Dialog */}
      <ReportBuilderDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSalvarGabarito}
        initialData={{
          nome_relatorio: nomeRelatorio,
          tipo_gabarito: tipoGabarito,
          largura_gabarito_mm: larguraMm,
          altura_gabarito_mm: alturaMm,
          layout_json: elementosLayout
        }}
      />

    </Box>
  );
};

export default SaaSAdminPage;
