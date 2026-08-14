import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  IconButton,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Chip,
  Stack,
  Tooltip,
  Fade,
  Collapse,
  Badge,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Autocomplete,
  Switch,
  FormControlLabel,
  Avatar,
  Checkbox,
  CircularProgress,
  Menu,
  ListItemIcon
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import EditIcon from '@mui/icons-material/Edit'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ReceiptIcon from '@mui/icons-material/Receipt'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import ClearIcon from '@mui/icons-material/Clear'
import BusinessIcon from '@mui/icons-material/Business'
import InventoryIcon from '@mui/icons-material/Inventory'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import CloudSyncIcon from '@mui/icons-material/CloudSync'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import DescriptionIcon from '@mui/icons-material/Description'
import ImageIcon from '@mui/icons-material/Image'
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import NoteIcon from '@mui/icons-material/Note'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'
import CancelIcon from '@mui/icons-material/Cancel'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useAuth } from '../context/AuthContext'
import PrecificacaoDialog from '../components/PrecificacaoDialog'
import SolicitarAprovacaoModal from '../components/SolicitarAprovacaoModal'
import CartaCorrecaoDialog from '../components/CartaCorrecaoDialog'
import { toast } from 'react-toastify'

function CompraPage() {
  const { axiosInstance, user, permissions, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Estados principais
  const [cartaCorrecaoDialog, setCartaCorrecaoDialog] = useState({ open: false, venda: null });
  const [anchorElDevolucao, setAnchorElDevolucao] = useState(null);
  const [compraMenuDevolucao, setCompraMenuDevolucao] = useState(null);

  const handleMenuOpenDevolucao = (e, compra) => {
    e.stopPropagation();
    setAnchorElDevolucao(e.currentTarget);
    setCompraMenuDevolucao(compra);
  };

  const handleMenuCloseDevolucao = () => {
    setAnchorElDevolucao(null);
    setCompraMenuDevolucao(null);
  };
  const [fornecedores, setFornecedores] = useState([])
  const [produtos, setProdutos] = useState([])
  const [operacoes, setOperacoes] = useState([])
  const [compras, setCompras] = useState([])
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  // Estados do sistema de aprovação
  const [modalAprovacao, setModalAprovacao] = useState(false)
  const [dadosAprovacao, setDadosAprovacao] = useState(null)

  // Estado do formulário
  const [form, setForm] = useState({
    id_fornecedor: '',
    id_operacao: '',
    numero_documento: '',
    data_documento: '',
    data_entrada: new Date().toLocaleDateString('en-CA'),
    dados_entrada: '',
    xml_conteudo: '',
    finalidade: '1',
    tipo_debito: '',
    chave_referenciada: '',
    movimenta_estoque_fisico: true,
    ajuste_custo: false,
    itens: [{ id_produto: '', quantidade: 1, valor_unitario: 0, cfop: '', cst: '', csosn: '', vbc_icms: '', picms: '', vicms: '', vipi: '', vpis: '', vcofins: '' }],
    // Dados de Frete
    frete_modalidade: '',
    transportadora_nome: '',
    transportadora_cnpj: '',
    placa_veiculo: '',
    uf_veiculo: '',
    rntc: '',
    qtd_volumes: '',
    especie: '',
    marca: '',
    peso_liquido: '',
    peso_bruto: '',
    numeracao: '',
    valor_frete: '',
    valor_seguro: '',
    valor_outras: '',
    chave_cte: '',
    cfop_frete: '',
    cst_icms_frete: '',
    base_icms_frete: '',
    perc_icms_frete: '',
    valor_icms_frete: '',
    cst_pis_frete: '',
    base_pis_frete: '',
    perc_pis_frete: '',
    valor_pis_frete: '',
    cst_cofins_frete: '',
    base_cofins_frete: '',
    perc_cofins_frete: '',
    valor_cofins_frete: ''
  })
  
  // Controle de abas
  const [abaAtiva, setAbaAtiva] = useState(0)
  const [operacaoGeraFinanceiro, setOperacaoGeraFinanceiro] = useState(false)

  // Estados da Manifestação do Destinatário inline
  const [dialogManifestacao, setDialogManifestacao] = useState(false)
  const [compraParaManif, setCompraParaManif] = useState(null)
  const [tipoEventoManif, setTipoEventoManif] = useState('')
  const [justificativaManif, setJustificativaManif] = useState('')
  const [enviandoManif, setEnviandoManif] = useState(false)
  const [resultadoManif, setResultadoManif] = useState(null)

  // Estados para Modal de Alerta de Nota de Débito (finNFe = 6)
  const [dialogNotaDebitoOpen, setDialogNotaDebitoOpen] = useState(false);
  const [dadosNotaDebitoModal, setDadosNotaDebitoModal] = useState(null);
  const [idCompraOrigemSelecionada, setIdCompraOrigemSelecionada] = useState('');

  // Estados para Modal de Devolução de Compra ao Fornecedor
  const [openModalDevolucao, setOpenModalDevolucao] = useState(false);
  const [compraParaDevolucao, setCompraParaDevolucao] = useState(null);
  const [itensDevolucaoCompra, setItensDevolucaoCompra] = useState([]);
  const [loadingDevolucao, setLoadingDevolucao] = useState(false);
  const [operacaoDevolucaoId, setOperacaoDevolucaoId] = useState('');
  const [motivoDevolucao, setMotivoDevolucao] = useState('');
  const [observacoesDevolucao, setObservacoesDevolucao] = useState('');
  const [freteDevolucao, setFreteDevolucao] = useState({
    transportadora_nome: '',
    qtd_volumes: '',
    especie: 'CAIXA',
    peso_bruto: '',
    peso_liquido: ''
  });
  const [despesasDevolucao, setDespesasDevolucao] = useState({
    valor_frete: 0,
    valor_outras: 0,
    valor_seguro: 0
  });
  const [modoPreviewDevolucao, setModoPreviewDevolucao] = useState(false);
  const [vendaIdGeradoDevolucao, setVendaIdGeradoDevolucao] = useState(null);

  const abrirModalDevolucaoCompra = async (compraRow) => {
    let idTarget = compraRow.id_compra || compraRow.id_devolucao || compraRow.id;
    if (typeof idTarget === 'string' && idTarget.startsWith('DEV-')) {
      idTarget = compraRow.id_compra || idTarget.replace('DEV-', '');
    }

    setLoadingDevolucao(true);
    setCompraParaDevolucao(compraRow);
    setOpenModalDevolucao(true);
    setModoPreviewDevolucao(false);
    setVendaIdGeradoDevolucao(compraRow.id_venda || null);
    setMotivoDevolucao(compraRow.motivo || '');
    setObservacoesDevolucao(compraRow.observacoes || '');
    setOperacaoDevolucaoId(compraRow.id_operacao || '');
    setFreteDevolucao({
      transportadora_nome: compraRow.transportadora_nome || '',
      qtd_volumes: compraRow.qtd_volumes || '',
      especie: compraRow.especie || 'CAIXA',
      peso_bruto: compraRow.peso_bruto || '',
      peso_liquido: compraRow.peso_liquido || ''
    });
    setDespesasDevolucao({
      valor_frete: parseFloat(compraRow.valor_frete || 0),
      valor_outras: parseFloat(compraRow.valor_outras || 0),
      valor_seguro: parseFloat(compraRow.valor_seguro || 0)
    });
    
    try {
      const res = await axiosInstance.get(`/devolucoes/buscar_compra/${idTarget}/`);
      const data = res.data;
      setCompraParaDevolucao(prev => ({ ...prev, ...data }));
      
      const rawItens = (data.itens && data.itens.length > 0) ? data.itens : (compraRow.itens || compraRow.devolucao_itens || []);

      const itensMapeados = rawItens.map(item => ({
        id_compra_item: item.id_compra_item || item.id_devolucao_item || item.id,
        id_produto: item.id_produto,
        nome_produto: item.nome_produto || item.produto_nome || item.descricao || 'Produto',
        codigo_produto: item.codigo_produto || item.codigo || '',
        quantidade_original: parseFloat(item.quantidade_original || item.quantidade || item.quantidade_devolvida || 0),
        quantidade_disponivel: parseFloat(item.quantidade_disponivel || item.quantidade || item.quantidade_devolvida || 0),
        quantidade_devolver: parseFloat(item.quantidade_devolver || item.quantidade_devolvida || item.quantidade_disponivel || item.quantidade || 0),
        valor_unitario: parseFloat(item.valor_unitario || 0),
        valor_total: parseFloat(item.valor_total || (parseFloat(item.quantidade_devolver || item.quantidade || 0) * parseFloat(item.valor_unitario || 0))),
        cfop: item.cfop || '5202',
        vpis: parseFloat(item.vpis || 0),
        vcofins: parseFloat(item.vcofins || 0),
        vibs: parseFloat(item.vibs || 0),
        vcbs: parseFloat(item.vcbs || 0),
        selecionado: true
      }));
      setItensDevolucaoCompra(itensMapeados);
    } catch (err) {
      console.error('Erro ao buscar detalhes da compra para devolução:', err);
      if (compraRow.itens && compraRow.itens.length > 0) {
        const fallbackItens = compraRow.itens.map(item => ({
          id_compra_item: item.id_compra_item || item.id,
          id_produto: item.id_produto,
          nome_produto: item.nome_produto || item.produto_nome || 'Produto',
          codigo_produto: item.codigo_produto || '',
          quantidade_original: parseFloat(item.quantidade || 0),
          quantidade_disponivel: parseFloat(item.quantidade || 0),
          quantidade_devolver: parseFloat(item.quantidade_devolvida || item.quantidade || 0),
          valor_unitario: parseFloat(item.valor_unitario || 0),
          valor_total: parseFloat(item.valor_total || 0),
          cfop: item.cfop || '5202',
          vpis: parseFloat(item.vpis || 0),
          vcofins: parseFloat(item.vcofins || 0),
          vibs: parseFloat(item.vibs || 0),
          vcbs: parseFloat(item.vcbs || 0),
          selecionado: true
        }));
        setItensDevolucaoCompra(fallbackItens);
      } else {
        toast.error('Erro ao carregar itens da compra para devolução.');
      }
    } finally {
      setLoadingDevolucao(false);
    }
  };

  // Auto-atualiza a Observação Fiscal conforme seleção total ou parcial de produtos
  useEffect(() => {
    if (!compraParaDevolucao || itensDevolucaoCompra.length === 0) return;

    const numNota = compraParaDevolucao.numero_documento || compraParaDevolucao.numero_nota || compraParaDevolucao.id_compra || '';
    const todosSelecionados = itensDevolucaoCompra.length > 0 && itensDevolucaoCompra.every(i => i.selecionado);
    const todasQuantidadesIntegrais = itensDevolucaoCompra.every(i => Math.abs(i.quantidade_devolver - i.quantidade_disponivel) < 0.001);
    const ehTotal = todosSelecionados && todasQuantidadesIntegrais;

    if (ehTotal) {
      setObservacoesDevolucao(`Devolução referente à NF-e nº ${numNota}`);
    } else {
      setObservacoesDevolucao(`Devolução parcial referente à NF-e nº ${numNota}`);
    }
  }, [itensDevolucaoCompra, compraParaDevolucao]);

  const salvarEVisualizarDevolucaoCompra = async () => {
    const itensSelecionados = itensDevolucaoCompra
      .filter(i => i.selecionado && i.quantidade_devolver > 0)
      .map(i => ({
        id_compra_item: i.id_compra_item,
        id_produto: i.id_produto,
        nome_produto: i.nome_produto,
        codigo_produto: i.codigo_produto,
        quantidade_devolvida: i.quantidade_devolver,
        quantidade_original: i.quantidade_original,
        valor_unitario: i.valor_unitario,
        cfop: i.cfop || '5202',
        vpis: i.vpis,
        vcofins: i.vcofins,
        vibs: i.vibs,
        vcbs: i.vcbs,
        motivo_item: i.motivo_item || ''
      }));

    if (itensSelecionados.length === 0) {
      toast.error('Selecione pelo menos um produto com quantidade maior que zero.');
      return;
    }

    if (!motivoDevolucao.trim()) {
      toast.error('Informe o motivo da devolução.');
      return;
    }

    setLoadingDevolucao(true);
    try {
      const payload = {
        tipo: 'compra',
        id_compra: compraParaDevolucao.id_compra || compraParaDevolucao.id,
        id_fornecedor: compraParaDevolucao.id_fornecedor,
        id_operacao: operacaoDevolucaoId || null,
        motivo: motivoDevolucao,
        observacoes: observacoesDevolucao,
        transportadora_nome: freteDevolucao.transportadora_nome,
        qtd_volumes: freteDevolucao.qtd_volumes,
        especie: freteDevolucao.especie,
        peso_bruto: freteDevolucao.peso_bruto,
        peso_liquido: freteDevolucao.peso_liquido,
        valor_frete: despesasDevolucao.valor_frete,
        valor_outras: despesasDevolucao.valor_outras,
        valor_seguro: despesasDevolucao.valor_seguro,
        chave_nfe_referenciada: compraParaDevolucao.chave_nfe_origem || compraParaDevolucao.chave_nfe || '',
        itens: itensSelecionados
      };

      const res = await axiosInstance.post('/devolucoes/', payload);
      toast.success('💾 Devolução salva! Confira todos os valores e despesas na prévia abaixo antes de transmitir.');

      const idVendaGerada = res.data?.id_venda || res.data?.venda_id || res.data?.id_venda_gerada || res.data?.id_devolucao;
      setVendaIdGeradoDevolucao(idVendaGerada);
      setModoPreviewDevolucao(true);
      carregarDados();
    } catch (err) {
      console.error('Erro ao salvar devolução de compra:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Erro ao salvar devolução.';
      toast.error(`❌ ${msg}`);
    } finally {
      setLoadingDevolucao(false);
    }
  };

  // Estado para Modal de Transmissão SEFAZ na Tela de Compras
  const [dialogNFeDevolucao, setDialogNFeDevolucao] = useState({
    open: false,
    vendaId: null,
    numeroDoc: '',
    fornecedorNome: '',
    chaveNFe: '',
    statusEmissao: 'pendente',
    mensagemSefaz: '',
    protocolo: ''
  });

  const handleTransmitirNFeSefaz = async (vendaIdTarget, compraRow = null) => {
    toast.info('📡 Transmitindo lote de NF-e para a SEFAZ...');
    setDialogNFeDevolucao(prev => ({
      ...prev,
      open: true,
      vendaId: vendaIdTarget,
      fornecedorNome: compraRow?.nome_fornecedor || prev.fornecedorNome || '',
      numeroDoc: compraRow?.numero_documento || compraRow?.numero_nota || prev.numeroDoc || `#${vendaIdTarget}`,
      chaveNFe: compraRow?.chave_nfe || prev.chaveNFe || '',
      statusEmissao: 'enviando',
      mensagemSefaz: '📡 Assinando XML e transmitindo lote para a SEFAZ...'
    }));
    try {
      const res = await axiosInstance.post(`/vendas/${vendaIdTarget}/emitir_nfe/`);
      const data = res.data;
      if (data.sucesso || data.status === 'autorizada' || data.cStat === 100) {
        setDialogNFeDevolucao(prev => ({
          ...prev,
          open: true,
          statusEmissao: 'autorizada',
          mensagemSefaz: `🟢 NF-e Autorizada com Sucesso! ${data.xMotivo || 'Autorizado o uso da NF-e'}`,
          chaveNFe: data.chave_nfe || data.chave || prev.chaveNFe,
          protocolo: data.nProt || data.protocolo || ''
        }));
        toast.success('🟢 NF-e de Devolução Autorizada pela SEFAZ!');
        carregarDados();
      } else {
        const erroSefaz = data.error || data.xMotivo || data.mensagem || 'Rejeição da SEFAZ';
        setDialogNFeDevolucao(prev => ({
          ...prev,
          open: true,
          statusEmissao: 'rejeitada',
          mensagemSefaz: `❌ Rejeição SEFAZ: ${erroSefaz}`
        }));
        toast.error(`❌ ${erroSefaz}`);
      }
    } catch (err) {
      const erroMsg = err.response?.data?.mensagem || err.response?.data?.xMotivo || err.response?.data?.error || err.response?.data?.details || err.message || 'Erro de conexão com SEFAZ';
      setDialogNFeDevolucao(prev => ({
        ...prev,
        open: true,
        statusEmissao: 'rejeitada',
        mensagemSefaz: `❌ Erro de Transmissão: ${erroMsg}`
      }));
      toast.error(`❌ ${erroMsg}`);
    }
  };

  const handleImprimirDanfeDevolucao = (vendaIdTarget, previa = false) => {
    const queryParam = previa ? '?previa=true' : '';
    const windowUrl = `${axiosInstance.defaults.baseURL || '/api'}/vendas/${vendaIdTarget}/imprimir_danfe/${queryParam}`;
    window.open(windowUrl, '_blank');
  };

  // Estados do Consultor de NF-es da SEFAZ
  const [dialogNFesSeafaz, setDialogNFesSeafaz] = useState(false)
  const [nfesSeafaz, setNfesSeafaz] = useState([])
  const [consultandoNFes, setConsultandoNFes] = useState(false)
  const [maxNsuSeafaz, setMaxNsuSeafaz] = useState('')
  const [importandoNsuSeafaz, setImportandoNsuSeafaz] = useState(null)

  // Estado do modal financeiro
  const [modalFinanceiro, setModalFinanceiro] = useState(false)
  const [dadosFinanceiro, setDadosFinanceiro] = useState({
    id_compra: null,
    valor_total: 0,
    numero_parcelas: 1,
    forma_pagamento: 'Dinheiro',
    id_conta_bancaria: '', // Conta padrão geral
    obrigatorio: false,
    id_fornecedor: null,
    parcelas: [] // Array de { numero_parcela, valor, vencimento, id_conta_bancaria }
  })

  // Modal de cadastro de fornecedor
  const [modalFornecedor, setModalFornecedor] = useState(false)
  const [novoFornecedor, setNovoFornecedor] = useState({
    nome_razao_social: '',
    nome_fantasia: '',
    cpf_cnpj: '',
    inscricao_estadual: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    email: '',
    limite_credito: '',
    whatsapp: '',
    data_nascimento: ''
  })

  // Modal de cadastro de produto
  const [modalProduto, setModalProduto] = useState(false)
  const [itemIndexCadastro, setItemIndexCadastro] = useState(null)

  // Estados para Dialog de Cadastro de Produto
  const [openDialogNovoProduto, setOpenDialogNovoProduto] = useState(false)
  const [abaAtivaDialogProduto, setAbaAtivaDialogProduto] = useState(0)
  const [dadosProdutoNovo, setDadosProdutoNovo] = useState({
    codigo: '',
    nome: '',
    gtin: '',
    ncm: '',
    unidade_medida: 'UN',
    preco_custo: '',
    descricao: '',
    id_grupo: '',
    categoria: '',
    marca: '',
    classificacao: 'Revenda',
    genero: '',
    referencia: '',
    localizacao: '',
    controla_lote: false,
    cest: '',
    imagem_url: '',
    tributacao: {
      cfop: '',
      cst_icms: '',
      csosn: '',
      icms_aliquota: '',
      cst_ipi: '',
      ipi_aliquota: '',
      cst_pis_cofins: '',
      pis_aliquota: '',
      cofins_aliquota: '',
      cst_ibs_cbs: '',
      ibs_aliquota: '',
      cbs_aliquota: '',
      classificacao_fiscal: ''
    },
    depositos: []
  })
  const [categorias, setCategorias] = useState([])
  const [marcas, setMarcas] = useState([])
  const [novoProduto, setNovoProduto] = useState({
    codigo_produto: '',
    nome_produto: '',
    descricao: '',
    unidade_medida: 'UN',
    id_grupo: '',
    marca: '',
    categoria: '',
    referencia: '',
    localizacao: '',
    codigo_barras: '',
    classificacao: '',
    ncm: '',
    tributacao_info: '',
    observacoes: '',
    imagem_url: ''
  })
  
  // Listas de categorias e marcas
  const [openCategoriaDialog, setOpenCategoriaDialog] = useState(false)
  const [openMarcaDialog, setOpenMarcaDialog] = useState(false)
  const [novaCategoriaInput, setNovaCategoriaInput] = useState('')
  const [novaMarcaInput, setNovaMarcaInput] = useState('')

  // Novo estado de depósitos e contas bancárias
  const [depositos, setDepositos] = useState([])
  const [contasBancarias, setContasBancarias] = useState([])

  // Estados do Dialog de Customização Financeira (inline antes de salvar compra)
  const [openDialogFinanceiroCustomizado, setOpenDialogFinanceiroCustomizado] = useState(false)
  const [parcelasFinanceiroCustomizado, setParcelasFinanceiroCustomizado] = useState([])
  const [dadosCompraTemporaria, setDadosCompraTemporaria] = useState(null)
  const [dadosFinanceiroConfig, setDadosFinanceiroConfig] = useState({
    numero_parcelas: 1,
    forma_pagamento: 'Boleto',
    id_conta_bancaria_padrao: '',
    data_vencimento_inicial: ''
  })

  // Submodal de grupo de produto
  const [openGrupoDialog, setOpenGrupoDialog] = useState(false)
  const [novoGrupo, setNovoGrupo] = useState({ nome: '', descricao: '' })

  // Modal de precificação
  const [modalPrecificacao, setModalPrecificacao] = useState(false)
  const [compraSelecionadaPrecificacao, setCompraSelecionadaPrecificacao] = useState(null)

  // Estados de filtro e pesquisa
  const [filtros, setFiltros] = useState({
    pesquisa: '',
    fornecedor: '',
    operacao: '',
    dataInicio: '',
    dataFim: ''
  })

  // Carrega dados iniciais
  useEffect(() => {
    if (authLoading) return
    carregarDados()
  }, [authLoading])

  // Observa a operação selecionada para mostrar/esconder o botão "Gerar Financeiro"
  useEffect(() => {
    if (form.id_operacao) {
      const operacaoSelecionada = operacoes.find(op => op.id_operacao === parseInt(form.id_operacao))
      if (operacaoSelecionada && operacaoSelecionada.gera_financeiro === 1) {
        setOperacaoGeraFinanceiro(true);
      } else {
        setOperacaoGeraFinanceiro(false);
      }
    } else {
      setOperacaoGeraFinanceiro(false);
    }
  }, [form.id_operacao, operacoes]);

  // Detectar retorno do Cadastro Normal de Produto e restaurar estado do formulário
  useEffect(() => {
    const voltandoDeCadastro = sessionStorage.getItem('cadastro_turbo_voltando');
    const voltandoDeProduto = sessionStorage.getItem('cadastro_produto_origem');
    
    if (voltandoDeCadastro === 'true' || voltandoDeProduto === 'compra_form') {
      // Restaurar estado do formulário
      setMostrarFormulario(true);
      
      // Restaurar editandoId se estava editando
      const editandoIdSalvo = sessionStorage.getItem('cadastro_turbo_editando_id') || 
                              sessionStorage.getItem('cadastro_produto_editando_id');
      if (editandoIdSalvo && editandoIdSalvo !== 'null') {
        setEditandoId(parseInt(editandoIdSalvo));
      }
      
      // Restaurar formulário com itens do XML (salvo antes de navegar para turbo)
      if (voltandoDeCadastro === 'true') {
        const formBackup = sessionStorage.getItem('compra_form_backup');
        if (formBackup) {
          try {
            const formRestaurado = JSON.parse(formBackup);
            setForm(formRestaurado);
          } catch (e) {
            console.warn('Erro ao restaurar form backup:', e);
          }
        }
        sessionStorage.removeItem('compra_form_backup');
        sessionStorage.removeItem('compra_mostrar_formulario_backup');
        // Recarregar produtos para incluir o produto recém-cadastrado no turbo
        carregarDados();
        // Ir para aba Produtos após retorno do Turbo
        setAbaAtiva(1);
      }
      
      // Forçar recarregamento dos produtos se veio do cadastro de produto normal
      if (voltandoDeProduto === 'compra_form') {
        carregarDados();
      }
      
      // Limpar flags de retorno
      sessionStorage.removeItem('cadastro_turbo_voltando');
      sessionStorage.removeItem('cadastro_turbo_editando_id');
    }
  }, [])

  // Detectar retorno do Cadastro Turbo e selecionar produto automaticamente
  useEffect(() => {
    const produtoCadastrado = sessionStorage.getItem('cadastro_turbo_produto_cadastrado');
    const itemIndexRetorno = sessionStorage.getItem('cadastro_turbo_item_index_retorno');
    const voltandoTurbo = sessionStorage.getItem('cadastro_turbo_voltando');
    
    // Se está voltando do Cadastro Turbo, mudar para aba Produtos (índice 1)
    if (voltandoTurbo === 'true') {
      setAbaAtiva(1); // Aba "Produtos"
      sessionStorage.removeItem('cadastro_turbo_voltando');
    }
    
    if (produtoCadastrado && itemIndexRetorno !== null && produtos.length > 0 && form.itens.length > 0) {
      // Buscar produto pelo EAN na lista de produtos
      const produtoEncontrado = produtos.find(p => 
        p.ean === produtoCadastrado || 
        p.gtin === produtoCadastrado
      );
      
      if (produtoEncontrado) {
        const index = parseInt(itemIndexRetorno);
        if (index >= 0 && index < form.itens.length) {
          // Selecionar automaticamente o produto
          selecionarProduto(index, produtoEncontrado.id_produto);
          toast.success(`✅ Produto "${produtoEncontrado.nome_produto}" selecionado automaticamente!`);
          
          // Rolar até o item recém-cadastrado
          setTimeout(() => {
            const el = document.querySelector(`[data-item-index="${index}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 400);

          // Salvar vínculo no cache (localStorage) usando chave NF-e
          if (form.dados_entrada) {
            salvarVinculoCache(form.dados_entrada, form.itens[index]._codigo || form.itens[index]._ean, produtoEncontrado.id_produto);
          }
        }
      }
      
      // Limpar sessionStorage
      sessionStorage.removeItem('cadastro_turbo_produto_cadastrado');
      sessionStorage.removeItem('cadastro_turbo_item_index_retorno');
    }
  }, [produtos, form.itens])

  // Função para salvar vínculo no cache (localStorage)
  const salvarVinculoCache = (chaveNfe, codigoItem, idProduto) => {
    try {
      const cacheKey = `vinculos_nfe_${chaveNfe}`;
      const vinculosExistentes = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      vinculosExistentes[codigoItem] = idProduto;
      localStorage.setItem(cacheKey, JSON.stringify(vinculosExistentes));
      console.log('💾 Vínculo salvo:', { chaveNfe, codigoItem, idProduto });
    } catch (error) {
      console.error('Erro ao salvar vínculo no cache:', error);
    }
  };

  // Função para carregar vínculos do cache
  const carregarVinculosCache = (chaveNfe) => {
    try {
      const cacheKey = `vinculos_nfe_${chaveNfe}`;
      const vinculos = JSON.parse(localStorage.getItem(cacheKey) || '{}');
      console.log('📂 Vínculos carregados:', vinculos);
      return vinculos;
    } catch (error) {
      console.error('Erro ao carregar vínculos do cache:', error);
      return {};
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [fornRes, prodRes, operRes, comprasRes, gruposRes, catRes, marcaRes, contasBancariasRes, depositosRes] = await Promise.all([
        axiosInstance.get('/fornecedores/'),
        axiosInstance.get('/produtos/'),
        axiosInstance.get('/operacoes/'),
        axiosInstance.get('/compras/'),
        axiosInstance.get('/grupos-produto/'),
        axiosInstance.get('/produtos/categorias/'),
        axiosInstance.get('/produtos/marcas/'),
        axiosInstance.get('/contas-bancarias/'),
        axiosInstance.get('/depositos/')
      ])

      // Garantir que sempre seja um array
      const fornecedoresData = Array.isArray(fornRes.data) 
        ? fornRes.data 
        : (fornRes.data?.results || [])
      setFornecedores(fornecedoresData)
      
      const produtosData = Array.isArray(prodRes.data)
        ? prodRes.data
        : (prodRes.data?.results || [])
      setProdutos(produtosData)
      
      // Incluir operações de Entrada e Devolução na aba de Compras
      const operacoesData = Array.isArray(operRes.data)
        ? operRes.data
        : (operRes.data?.results || [])
      const operacoesPermitidas = operacoesData.filter(op => {
        const trans = (op.transacao || op.tipo_transacao || op.tipo || '').toLowerCase();
        const nome = (op.nome_operacao || op.nome || '').toLowerCase();
        return trans === 'entrada' || trans.includes('devoluc') || nome.includes('devolu');
      });
      setOperacoes(operacoesPermitidas);
      
      const comprasData = comprasRes.data?.results || comprasRes.data || []
      
      // Buscar devoluções de compra registradas para exibir na tabela de Gestão de Compras
      let devolucoesCompraData = [];
      try {
        const devRes = await axiosInstance.get('/devolucoes/?tipo=compra');
        devolucoesCompraData = Array.isArray(devRes.data) ? devRes.data : (devRes.data?.results || []);
      } catch (eDev) {}

      let devolucoesVendasData = [];
      try {
        const devVendasRes = await axiosInstance.get('/vendas/');
        const allVendas = Array.isArray(devVendasRes.data) ? devVendasRes.data : (devVendasRes.data?.results || []);
        devolucoesVendasData = allVendas.filter(v => {
          const op = operacoesData.find(o => String(o.id_operacao || o.id) === String(v.id_operacao));
          const opNome = (op?.nome_operacao || op?.nome || '').toUpperCase();
          return opNome.includes('DEVOLU') && opNome.includes('COMPRA');
        });
      } catch (eVend) {}

      // Mapear devoluções como compras para exibição unificada na tabela de Compras
      const devolucoesMapeadas = devolucoesCompraData.map(dev => {
        const forn = fornecedoresData.find(f => String(f.id_fornecedor || f.id) === String(dev.id_fornecedor));
        let op = operacoesData.find(o => String(o.id_operacao || o.id) === String(dev.id_operacao));

        // Buscar venda emitida vinculada a esta devolução
        const vendaVinculada = devolucoesVendasData.find(v => String(v.id_venda) === String(dev.id_venda));
        if (vendaVinculada && vendaVinculada.id_operacao) {
          const opVenda = operacoesData.find(o => String(o.id_operacao || o.id) === String(vendaVinculada.id_operacao));
          if (opVenda) op = opVenda;
        }

        const numNota = dev.venda_numero_nfe || vendaVinculada?.numero_documento || vendaVinculada?.numero_nfe || dev.numero_nfe || dev.numero_documento || dev.numero_devolucao;
        const statusNota = dev.venda_status_nfe || vendaVinculada?.status_nfe || dev.status_nfe || dev.status || 'AUTORIZADA';
        const chaveNota = dev.venda_chave_nfe || vendaVinculada?.chave_nfe || dev.chave_nfe || '';
        const opNome = dev.operacao_nome || op?.nome_operacao || op?.nome || 'DEVOLUÇÃO DE COMPRA (NFE)';

        return {
          id_compra: `DEV-${dev.id_devolucao}`,
          id_devolucao: dev.id_devolucao,
          id_venda: dev.id_venda,
          id_fornecedor: dev.id_fornecedor,
          fornecedor_nome: forn?.nome_razao_social || forn?.nome_fantasia || dev.nome_fornecedor || 'Fornecedor',
          nome_fornecedor: forn?.nome_razao_social || forn?.nome_fantasia || dev.nome_fornecedor || 'Fornecedor',
          doc_fornecedor: forn?.cpf_cnpj || dev.doc_fornecedor || '',
          data_documento: dev.data_devolucao || dev.criado_em,
          data_entrada: dev.data_devolucao || dev.criado_em,
          operacao_nome: opNome,
          id_operacao: op?.id_operacao || dev.id_operacao || 22,
          numero_nfe: numNota,
          numero_documento: numNota,
          chave_nfe: chaveNota,
          valor_total_nota: dev.valor_total_devolucao || dev.valor_total || 0,
          valor_total: dev.valor_total_devolucao || dev.valor_total || 0,
          is_devolucao: true,
          status_nfe: statusNota
        };
      });

      const devVendasMapeadas = devolucoesVendasData.map(v => {
        const forn = fornecedoresData.find(f => String(f.id_fornecedor || f.id) === String(v.id_cliente || v.id_fornecedor));
        const op = operacoesData.find(o => String(o.id_operacao || o.id) === String(v.id_operacao));

        return {
          id_compra: `NFE-${v.id_venda}`,
          id_venda: v.id_venda,
          id_fornecedor: v.id_cliente || v.id_fornecedor,
          fornecedor_nome: forn?.nome_razao_social || forn?.nome_fantasia || v.nome_cliente || 'Fornecedor',
          nome_fornecedor: forn?.nome_razao_social || forn?.nome_fantasia || v.nome_cliente || 'Fornecedor',
          data_documento: v.data_venda || v.data_documento,
          data_entrada: v.data_venda || v.data_documento,
          operacao_nome: op?.nome_operacao || op?.nome || 'DEVOLUÇÃO DE COMPRA (NFE)',
          id_operacao: v.id_operacao,
          numero_documento: v.numero_documento || v.numero_nfe || `#${v.id_venda}`,
          chave_nfe: v.chave_nfe || v.chave_nfe_referenciada || '',
          valor_total_nota: v.valor_total || 0,
          valor_total: v.valor_total || 0,
          is_devolucao: true,
          status_nfe: v.status_nfe || v.status_venda
        };
      });

      // Unificar lista mantendo compras e devoluções
      const idsVendasExistentes = new Set((Array.isArray(comprasData) ? comprasData : []).map(c => String(c.id_venda || c.id_compra)));
      const devNovas = [...devolucoesMapeadas, ...devVendasMapeadas].filter(d => !idsVendasExistentes.has(String(d.id_venda || d.id_compra)));

      const listaUnificadaCompras = [...devNovas, ...(Array.isArray(comprasData) ? comprasData : [])];
      setCompras(listaUnificadaCompras);
      
      const gruposData = Array.isArray(gruposRes.data)
        ? gruposRes.data
        : (gruposRes.data?.results || [])
      setGrupos(gruposData)
      
      // Carregar categorias e marcas
      setCategorias(catRes.data || [])
      setMarcas(marcaRes.data || [])

      // Carregar contas bancárias e depósitos
      setContasBancarias(contasBancariasRes.data?.results || contasBancariasRes.data || [])
      setDepositos(depositosRes.data?.results || depositosRes.data || [])

      console.log('📦 Grupos carregados:', gruposRes.data)
      console.log('📦 Total de grupos:', gruposRes.data?.length || 0)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setErro('Erro ao carregar dados. Tente recarregar a página.')
    } finally {
      setLoading(false)
    }
  }

  // Função para filtrar compras
  const comprasFiltradas = compras.filter(compra => {
    // Filtro de pesquisa geral
    if (filtros.pesquisa) {
      const termoPesquisa = filtros.pesquisa.toLowerCase()
      const corresponde = 
        (compra.id_compra?.toString() || '').includes(termoPesquisa) ||
        (compra.numero_documento || '').toLowerCase().includes(termoPesquisa) ||
        (compra.fornecedor_nome || '').toLowerCase().includes(termoPesquisa) ||
        (compra.operacao_nome || '').toLowerCase().includes(termoPesquisa)
      
      if (!corresponde) return false
    }

    // Filtro por fornecedor
    if (filtros.fornecedor && compra.id_fornecedor !== parseInt(filtros.fornecedor)) {
      return false
    }

    // Filtro por operação
    if (filtros.operacao && compra.id_operacao !== parseInt(filtros.operacao)) {
      return false
    }

    // Filtro por data de entrada (início)
    if (filtros.dataInicio && compra.data_entrada) {
      const dataCompra = new Date(compra.data_entrada.split('T')[0] + 'T00:00:00')
      const dataInicio = new Date(filtros.dataInicio + 'T00:00:00')
      if (dataCompra < dataInicio) return false
    }

    // Filtro por data de entrada (fim)
    if (filtros.dataFim && compra.data_entrada) {
      const dataCompra = new Date(compra.data_entrada.split('T')[0] + 'T00:00:00')
      const dataFim = new Date(filtros.dataFim + 'T00:00:00')
      if (dataCompra > dataFim) return false
    }

    return true
  })

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      pesquisa: '',
      fornecedor: '',
      operacao: '',
      dataInicio: '',
      dataFim: ''
    })
  }

  // Importa XML da NF-e
  const importarXML = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('xml_file', file)

      const response = await axiosInstance.post('/compras/importar_xml/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const dados = response.data

      // Mensagens de sucesso
      let mensagem = '✅ XML importado com sucesso!'
      if (dados.fornecedor_criado) {
        mensagem += `\n✨ Fornecedor "${dados.fornecedor_nome}" cadastrado automaticamente!`
      } else if (dados.id_fornecedor) {
        mensagem += `\n✅ Fornecedor "${dados.fornecedor_nome}" encontrado!`
      }

      // Valores totais da NF-e
      if (dados.valor_produtos > 0) {
        mensagem += `\n💰 Valor Produtos: R$ ${parseFloat(dados.valor_produtos).toFixed(2)}`
      }
      if (dados.valor_frete > 0) {
        mensagem += `\n🚚 Frete: R$ ${parseFloat(dados.valor_frete).toFixed(2)}`
        if (dados.transportadora_nome) {
          mensagem += ` (${dados.transportadora_nome})`
        }
        mensagem += `\n⚠️ ATENÇÃO: Vinculou frete. Se houver MDF-e, informe a chave em observações.`
      }
      if (dados.valor_seguro > 0) {
        mensagem += `\n🛡️ Seguro: R$ ${parseFloat(dados.valor_seguro).toFixed(2)}`
      }
      if (dados.valor_desconto > 0) {
        mensagem += `\n🏷️ Desconto: R$ ${parseFloat(dados.valor_desconto).toFixed(2)}`
      }
      if (dados.valor_ipi_total > 0) {
        mensagem += `\n📊 IPI Total: R$ ${parseFloat(dados.valor_ipi_total).toFixed(2)}`
      }
      if (dados.valor_pis_total > 0 || dados.valor_cofins_total > 0) {
        const pisCofinsSoma = parseFloat(dados.valor_pis_total || 0) + parseFloat(dados.valor_cofins_total || 0)
        mensagem += `\n📈 PIS+COFINS: R$ ${pisCofinsSoma.toFixed(2)}`
      }
      mensagem += `\n💵 TOTAL NF-e: R$ ${parseFloat(dados.valor_total).toFixed(2)}`

      // Contar produtos encontrados e não encontrados
      const produtosEncontrados = dados.itens.filter(item => item.id_produto).length
      const produtosNaoEncontrados = dados.itens.filter(item => !item.id_produto).length

      if (produtosEncontrados > 0) {
        mensagem += `\n✅ ${produtosEncontrados} produto(s) encontrado(s) (VERDE)`
      }
      if (produtosNaoEncontrados > 0) {
        mensagem += `\n⚠️ ${produtosNaoEncontrados} produto(s) NÃO cadastrado(s) (VERMELHO)`
      }

      setSucesso(mensagem)

      // Formatar data_documento corretamente (pode vir como datetime ISO do XML)
      let dataDocumentoFormatada = ''
      if (dados.data_documento || dados.data_emissao) {
        try {
          const dataStr = dados.data_documento || dados.data_emissao
          // Se vier com hora (ISO datetime), extrai só a data
          if (dataStr.includes('T')) {
            dataDocumentoFormatada = dataStr.split('T')[0]
          } else {
            dataDocumentoFormatada = dataStr
          }
        } catch (e) {
          console.error('Erro ao formatar data do documento:', e)
        }
      }

      // Carregar vínculos salvos anteriormente (se houver)
      const chaveNfe = dados.chave_nfe || dados.dados_entrada || '';
      const vinculosSalvos = chaveNfe ? carregarVinculosCache(chaveNfe) : {};
      
      let vinculosRestaurados = 0;

      // Preparar os itens antes de carregar dados (não depende da lista de fornecedores)
      const itensMapeados = dados.itens.map(item => {
          const codigoItem = item.codigo || item.ean || '';
          const idProdutoVinculado = vinculosSalvos[codigoItem];
          
          let idProdutoFinal = item.id_produto || '';
          let produtoEncontrado = item.produto_encontrado || !!item.id_produto;
          
          if (idProdutoVinculado && !item.id_produto) {
            idProdutoFinal = idProdutoVinculado;
            produtoEncontrado = true;
            vinculosRestaurados++;
            console.log(`🔗 Vínculo restaurado: ${codigoItem} → Produto #${idProdutoVinculado}`);
          }
          
          return ({
          id_produto: idProdutoFinal,
          quantidade: item.quantidade || 1,
          valor_unitario: Math.trunc((item.valor_unitario || 0) * 1000000) / 1000000,
          fracao_memorizada: item.fracao_memorizada || 1,
          quantidade_com_fracao: item.quantidade_com_fracao != null ? item.quantidade_com_fracao : null,
          cfop: item.cfop || '',
          cst: item.cst || '',
          csosn: item.csosn || '',
          vbc_icms: item.vbc_icms || '',
          picms: item.picms || '',
          vicms: item.vicms || '',
          vipi: item.vipi || '',
          vpis: item.vpis || '',
          vcofins: item.vcofins || '',
          _codigo: item.codigo,
          _ean: item.ean || '',
          _descricao: item.descricao,
          _nome_produto: item.nome_produto,
          _ncm: item.ncm,
          _unidade: item.unidade,
          _cfop: item.cfop,
          _cfop_original: item.cfop_original,
          _cst: item.cst,
          _csosn: item.csosn,
          _vbc_icms: item.vbc_icms,
          _picms: item.picms,
          _vicms: item.vicms,
          _vipi: item.vipi,
          _vpis: item.vpis,
          _vcofins: item.vcofins,
          _encontrado: produtoEncontrado
        });
      });

      // Recarrega listas (fornecedores, produtos etc.) ANTES de definir o form
      // para que o Select de fornecedor já encontre a opção ao renderizar
      await carregarDados()

      // Preencher formulário APÓS carregar listas — garante que o Select exiba o fornecedor
      const eNotaAjusteOuDebito = ['2', '3', '6'].includes(String(dados.finalidade)) || !!dados.chave_referenciada || !!dados.compra_origem_sugerida;
      const chaveRefFinal = dados.compra_origem_sugerida?.chave_nfe || dados.chave_referenciada || '';

      setForm({
        id_fornecedor: dados.id_fornecedor || '',
        numero_documento: dados.numero_documento || '',
        data_documento: dataDocumentoFormatada,
        data_entrada: dados.data_entrada || new Date().toLocaleDateString('en-CA'),
        dados_entrada: chaveNfe,
        xml_conteudo: dados.xml_conteudo || '',
        finalidade: dados.finalidade || '1',
        tipo_debito: dados.tipo_debito || '',
        chave_referenciada: chaveRefFinal,
        movimenta_estoque_fisico: eNotaAjusteOuDebito ? false : (dados.movimenta_estoque_fisico !== undefined ? dados.movimenta_estoque_fisico : true),
        ajuste_custo: eNotaAjusteOuDebito ? true : (dados.ajuste_custo || false),
        id_operacao: form.id_operacao,
        itens: itensMapeados,
      })

      // Se a nota possui chave referenciada OU é Nota de Débito/Complementar/Ajuste (finNFe 2, 3 ou 6)
      if (eNotaAjusteOuDebito) {
        setDadosNotaDebitoModal(dados);
        const idSugerido = dados.compra_origem_sugerida?.id_compra || '';
        setIdCompraOrigemSelecionada(idSugerido ? String(idSugerido) : '');
        setDialogNotaDebitoOpen(true);
        if (dados.compra_origem_sugerida) {
          toast.success(`✨ Nota Fiscal de Origem Nº ${dados.compra_origem_sugerida.numero_documento} vinculada automaticamente!`, { autoClose: 5000 });
        } else {
          toast.warning('⚠️ Nota de Débito/Ajuste (finNFe ' + dados.finalidade + ') identificada. Selecione a Nota de Origem.', { autoClose: 6000 });
        }
      }

      // Mostrar mensagem se vínculos foram restaurados
      if (vinculosRestaurados > 0) {
        toast.success(`🔗 ${vinculosRestaurados} vínculo(s) restaurado(s) automaticamente!`, {
          autoClose: 3000
        });
      }
    } catch (error) {
      console.error('Erro ao importar XML:', error)
      setErro(error.response?.data?.error || 'Erro ao importar XML. Verifique o arquivo.')
    } finally {
      setLoading(false)
      event.target.value = '' // Limpa o input
    }
  }

  // Atualiza campo do item
  const atualizarItem = (index, campo, valor) => {
    const novosItens = [...form.itens]
    novosItens[index] = { ...novosItens[index], [campo]: valor }
    setForm({ ...form, itens: novosItens })
  }

  // Seleciona produto e sugere tributação do cadastro do produto
  const selecionarProduto = (index, idProduto) => {
    const novosItens = [...form.itens]
    const item = { ...novosItens[index], id_produto: idProduto, _sugerido: false }

    if (idProduto) {
      const prod = produtos.find(p => p.id_produto === parseInt(idProduto))
      const trib = prod?.tributacao_detalhada

      if (trib) {
        // Converte CFOP de saída para entrada se necessário (5→1, 6→2, 7→3)
        let cfop = trib.cfop || ''
        if (cfop && ['5','6','7'].includes(cfop[0])) {
          const mapa = {'5':'1','6':'2','7':'3'}
          cfop = mapa[cfop[0]] + cfop.slice(1)
        }

        item.cfop    = cfop
        item.cst     = trib.cst_icms || ''
        item.csosn   = trib.csosn || ''
        item.picms   = trib.icms_aliquota || ''
        item.vicms   = ''
        item.vbc_icms = ''
        item.vipi    = trib.ipi_aliquota || ''
        item.vpis    = trib.pis_aliquota || ''
        item.vcofins = trib.cofins_aliquota || ''
        item._sugerido = true
        item._cfop_original_cadastro = trib.cfop || ''
      }
      // Produto selecionado = encontrado (verde)
      item._encontrado = true
      
      // Salvar vínculo no cache (localStorage) usando chave NF-e
      if (form.dados_entrada) {
        const codigoItem = item._codigo || item._ean || '';
        if (codigoItem) {
          salvarVinculoCache(form.dados_entrada, codigoItem, idProduto);
        }
      }
    } else {
      // Produto desmarcado = não encontrado (vermelho)
      item._encontrado = false
    }

    novosItens[index] = item
    setForm({ ...form, itens: novosItens })
  }

  // Adiciona novo item
  const adicionarItem = () => {
    setForm({
      ...form,
      itens: [...form.itens, {
        id_produto: '', quantidade: 1, valor_unitario: 0,
        cfop: '', cst: '', csosn: '',
        vbc_icms: '', picms: '', vicms: '',
        vipi: '', vpis: '', vcofins: ''
      }]
    })
  }

  // Remove item
  const removerItem = (index) => {
    if (form.itens.length > 1) {
      const novosItens = form.itens.filter((_, i) => i !== index)
      setForm({ ...form, itens: novosItens })
    }
  }

  // Calcula totais
  const calcularTotais = () => {
    let total = 0
    const itensCalculados = form.itens.map(item => {
      const qtd = parseFloat(item.quantidade) || 0
      const valorUnit = parseFloat(item.valor_unitario) || 0
      const subtotal = qtd * valorUnit
      total += subtotal
      return { ...item, subtotal }
    })
    return { itens: itensCalculados, total }
  }

  // Limpa formulário
  const limparFormulario = () => {
    setForm({
      id_fornecedor: '',
      id_operacao: '',
      numero_documento: '',
      data_documento: '',
      data_entrada: new Date().toLocaleDateString('en-CA'),
      dados_entrada: '',
      xml_conteudo: '',
      itens: [{
        id_produto: '', quantidade: 1, valor_unitario: 0,
        cfop: '', cst: '', csosn: '',
        vbc_icms: '', picms: '', vicms: '',
        vipi: '', vpis: '', vcofins: ''
      }]
    })
    setEditandoId(null)
    setMostrarFormulario(false)
  }

  // Callback de sucesso da aprovação
  const handleAprovacaoSucesso = (solicitacao) => {
    setSucesso(
      `✅ Solicitação de aprovação enviada com sucesso!\n` +
      `📋 Protocolo: #${solicitacao.id_solicitacao}\n` +
      `👤 Supervisor: ${solicitacao.supervisor?.first_name} ${solicitacao.supervisor?.last_name}\n\n` +
      `Acompanhe o status em "Minhas Solicitações" no menu lateral.`
    )
    limparFormulario()
    setTimeout(() => setSucesso(null), 8000)
  }

  // Buscar CEP
  const buscarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) {
      alert('CEP inválido. Digite 8 dígitos.')
      return
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (data.erro) {
        alert('CEP não encontrado.')
        return
      }

      setNovoFornecedor(prev => ({
        ...prev,
        endereco: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
        cep: cep
      }))
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      alert('Erro ao buscar CEP. Tente novamente.')
    }
  }

  // Buscar CNPJ
  const buscarCNPJ = async (cnpj) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '')
    if (cnpjLimpo.length !== 14) {
      alert('CNPJ inválido. Digite 14 dígitos.')
      return
    }

    try {
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`)
      const data = await response.json()

      if (data.status === 'ERROR') {
        alert(data.message || 'CNPJ não encontrado.')
        return
      }

      setNovoFornecedor(prev => ({
        ...prev,
        nome_razao_social: data.nome || '',
        nome_fantasia: data.fantasia || '',
        endereco: data.logradouro || '',
        numero: data.numero || '',
        bairro: data.bairro || '',
        cidade: data.municipio || '',
        estado: data.uf || '',
        cep: data.cep?.replace(/\D/g, '') || '',
        telefone: data.telefone || '',
        email: data.email || ''
      }))
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error)
      alert('Erro ao buscar CNPJ. Tente novamente.')
    }
  }

  // Salvar novo fornecedor
  const salvarNovoFornecedor = async () => {
    if (!novoFornecedor.nome_razao_social || !novoFornecedor.cpf_cnpj) {
      alert('Nome/Razão Social e CPF/CNPJ são obrigatórios!')
      return
    }

    try {
      const response = await axiosInstance.post('/fornecedores/', novoFornecedor)
      await carregarDados()
      setForm(prev => ({ ...prev, id_fornecedor: response.data.id_fornecedor }))
      setModalFornecedor(false)
      setNovoFornecedor({
        nome_razao_social: '',
        nome_fantasia: '',
        cpf_cnpj: '',
        inscricao_estadual: '',
        endereco: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        telefone: '',
        email: '',
        limite_credito: '',
        whatsapp: '',
        data_nascimento: ''
      })
      setSucesso('Fornecedor cadastrado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error)
      setErro(error.response?.data?.message || 'Erro ao cadastrar fornecedor')
    }
  }

  // Salvar novo produto (Dialog do botão +)
  const salvarProdutoDialog = async () => {
    // Validação básica
    if (!dadosProdutoNovo.nome) {
      toast.error('❌ Nome do produto é obrigatório!');
      return;
    }
    if (!dadosProdutoNovo.id_grupo) {
      toast.error('❌ Grupo do produto é obrigatório!');
      return;
    }

    try {
      const produtoParaEnviar = {
        codigo_produto: dadosProdutoNovo.codigo || '',
        nome_produto: dadosProdutoNovo.nome,
        descricao: dadosProdutoNovo.descricao || '',
        unidade_medida: dadosProdutoNovo.unidade_medida || 'UN',
        valor_custo: parseFloat(dadosProdutoNovo.preco_custo) || 0,
        id_grupo: Number(dadosProdutoNovo.id_grupo),
        marca: dadosProdutoNovo.marca || null,
        categoria: dadosProdutoNovo.categoria || null,
        classificacao: dadosProdutoNovo.classificacao || null,
        genero: dadosProdutoNovo.genero || null,
        referencia: dadosProdutoNovo.referencia || '',
        localizacao: dadosProdutoNovo.localizacao || '',
        controla_lote: dadosProdutoNovo.controla_lote || false,
        cest: dadosProdutoNovo.cest || null,
        ncm: dadosProdutoNovo.ncm || null,
        gtin: dadosProdutoNovo.gtin || null,
        imagem_url: dadosProdutoNovo.imagem_url || ''
      }

      console.log('📦 Enviando produto básico:', produtoParaEnviar);
      const response = await axiosInstance.post('/produtos/', produtoParaEnviar)
      const produtoCadastrado = response.data
      const idProduto = produtoCadastrado.id_produto

      console.log('✅ Produto cadastrado com ID:', idProduto);

      // 1. Salvar informações fiscais (tributação) via PATCH /produtos/{id}/tributacao/
      const tributacaoParaEnviar = {
        cfop: dadosProdutoNovo.tributacao?.cfop || '',
        cst_icms: dadosProdutoNovo.tributacao?.cst_icms || '',
        csosn: dadosProdutoNovo.tributacao?.csosn || '',
        icms_aliquota: dadosProdutoNovo.tributacao?.icms_aliquota ? parseFloat(dadosProdutoNovo.tributacao.icms_aliquota) : 0,
        cst_ipi: dadosProdutoNovo.tributacao?.cst_ipi || '',
        ipi_aliquota: dadosProdutoNovo.tributacao?.ipi_aliquota ? parseFloat(dadosProdutoNovo.tributacao.ipi_aliquota) : 0,
        cst_pis_cofins: dadosProdutoNovo.tributacao?.cst_pis_cofins || '',
        pis_aliquota: dadosProdutoNovo.tributacao?.pis_aliquota ? parseFloat(dadosProdutoNovo.tributacao.pis_aliquota) : 0,
        cofins_aliquota: dadosProdutoNovo.tributacao?.cofins_aliquota ? parseFloat(dadosProdutoNovo.tributacao.cofins_aliquota) : 0,
        cst_ibs_cbs: dadosProdutoNovo.tributacao?.cst_ibs_cbs || '',
        ibs_aliquota: dadosProdutoNovo.tributacao?.ibs_aliquota ? parseFloat(dadosProdutoNovo.tributacao.ibs_aliquota) : 0,
        cbs_aliquota: dadosProdutoNovo.tributacao?.cbs_aliquota ? parseFloat(dadosProdutoNovo.tributacao.cbs_aliquota) : 0,
        classificacao_fiscal: dadosProdutoNovo.tributacao?.classificacao_fiscal || dadosProdutoNovo.ncm || ''
      }

      console.log('📡 Salvando tributação:', tributacaoParaEnviar);
      await axiosInstance.patch(`/produtos/${idProduto}/tributacao/`, tributacaoParaEnviar);

      // 2. Inicializar depósitos via POST /estoque/
      if (dadosProdutoNovo.depositos && dadosProdutoNovo.depositos.length > 0) {
        console.log('📦 Inicializando depósitos:', dadosProdutoNovo.depositos);
        const estoquePromises = dadosProdutoNovo.depositos.map(dep => {
          const payloadEstoque = {
            id_produto: idProduto,
            id_deposito: dep.id_deposito,
            quantidade_minima: parseFloat(dep.quantidade_minima) || 0,
            valor_venda: parseFloat(dep.valor_venda) || 0,
            valor_ultima_compra: parseFloat(dep.valor_custo) || 0
          }
          return axiosInstance.post('/estoque/', payloadEstoque);
        });
        await Promise.all(estoquePromises);
      }

      await carregarDados()
      
      // Vincular automaticamente ao item da compra
      if (itemIndexCadastro !== null) {
        const novosItens = [...form.itens]
        novosItens[itemIndexCadastro] = {
          ...novosItens[itemIndexCadastro],
          id_produto: produtoCadastrado.id_produto,
          _encontrado: true, // Marca como encontrado para mudar a cor para verde
          _nome_produto: produtoCadastrado.nome_produto,
          _descricao: produtoCadastrado.nome_produto
        }
        setForm({ ...form, itens: novosItens })
        
        // Salvar vínculo no cache
        if (form.dados_entrada) {
          const codigoItem = novosItens[itemIndexCadastro]._codigo || novosItens[itemIndexCadastro]._ean || '';
          if (codigoItem) {
            salvarVinculoCache(form.dados_entrada, codigoItem, produtoCadastrado.id_produto);
          }
        }
        
        toast.success(`✅ Produto "${produtoCadastrado.nome_produto}" cadastrado, tributação salva e estoques configurados!`, {
          autoClose: 3000
        });
      } else {
        toast.success('✅ Produto cadastrado com sucesso!');
      }
      
      // Fechar dialog e limpar formulário
      setOpenDialogNovoProduto(false)
      setItemIndexCadastro(null)
      setDadosProdutoNovo({
        codigo: '',
        nome: '',
        gtin: '',
        ncm: '',
        unidade_medida: 'UN',
        preco_custo: '',
        descricao: '',
        id_grupo: '',
        categoria: '',
        marca: '',
        classificacao: 'Revenda',
        genero: '',
        referencia: '',
        localizacao: '',
        controla_lote: false,
        cest: '',
        imagem_url: '',
        tributacao: {
          cfop: '',
          cst_icms: '',
          csosn: '',
          icms_aliquota: '',
          cst_ipi: '',
          ipi_aliquota: '',
          cst_pis_cofins: '',
          pis_aliquota: '',
          cofins_aliquota: '',
          cst_ibs_cbs: '',
          ibs_aliquota: '',
          cbs_aliquota: '',
          classificacao_fiscal: ''
        },
        depositos: []
      })
    } catch (error) {
      console.error('Erro ao salvar produto completo:', error)
      toast.error('❌ ' + (error.response?.data?.message || error.response?.data?.detail || 'Erro ao cadastrar produto'))
    }
  }

  // Salvar novo produto
  const salvarNovoProduto = async () => {
    if (!novoProduto.codigo_produto || !novoProduto.nome_produto) {
      alert('Código e Nome do produto são obrigatórios!')
      return
    }

    try {
      // Mapear campos do frontend para backend
      const produtoParaEnviar = {
        codigo_produto: novoProduto.codigo_produto,
        nome_produto: novoProduto.nome_produto,
        descricao: novoProduto.descricao,
        unidade_medida: novoProduto.unidade_medida,
        id_grupo: novoProduto.id_grupo,
        marca: novoProduto.marca,
        categoria: novoProduto.categoria,
        classificacao: novoProduto.classificacao,
        ncm: novoProduto.ncm,
        referencia: novoProduto.referencia || '',
        localizacao: novoProduto.localizacao || '',
        gtin: novoProduto.codigo_barras, // Backend usa 'gtin' em vez de 'codigo_barras'
        observacoes: novoProduto.observacoes,
        imagem_url: novoProduto.imagem_url
      }

      const response = await axiosInstance.post('/produtos/', produtoParaEnviar)
      const produtoCadastrado = response.data
      
      await carregarDados()
      
      // Se foi cadastrado a partir de um item da compra, vincular automaticamente
      if (itemIndexCadastro !== null) {
        const novosItens = [...form.itens]
        novosItens[itemIndexCadastro] = {
          ...novosItens[itemIndexCadastro],
          id_produto: produtoCadastrado.id_produto,
          _encontrado: true, // Marca como encontrado para mudar a cor para verde
          _nome_produto: produtoCadastrado.nome_produto, // Nome do produto cadastrado
          _descricao: produtoCadastrado.nome_produto // Atualiza a descrição
        }
        setForm({ ...form, itens: novosItens })
        setSucesso(`✅ Produto "${produtoCadastrado.nome_produto}" cadastrado e vinculado ao item ${itemIndexCadastro + 1}!`)
      } else {
        setSucesso('✅ Produto cadastrado com sucesso!')
      }
      
      setModalProduto(false)
      setItemIndexCadastro(null)
      setNovoProduto({
        codigo_produto: '',
        nome_produto: '',
        descricao: '',
        unidade_medida: 'UN',
        id_grupo: '',
        marca: '',
        categoria: '',
        referencia: '',
        localizacao: '',
        codigo_barras: '',
        classificacao: '',
        ncm: '',
        tributacao_info: '',
        observacoes: '',
        imagem_url: ''
      })
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      setErro(error.response?.data?.message || 'Erro ao cadastrar produto')
    }
  }

  // Recalcular as parcelas financeiras customizadas localmente
  const recalcularParcelasCustomizadas = (numParcelas, dataIni, contaPadrao, valorTotal) => {
    const total = parseFloat(valorTotal) || 0;
    const n = parseInt(numParcelas) || 1;
    const valorParcelaBase = Math.round((total / n) * 100) / 100;
    const somaBase = valorParcelaBase * n;
    const diferenca = parseFloat((total - somaBase).toFixed(2));

    const novasParcelas = [];
    const baseDate = dataIni ? new Date(dataIni + 'T00:00:00') : new Date();

    for (let i = 0; i < n; i++) {
      let valor = valorParcelaBase;
      if (i === n - 1) {
        valor = parseFloat((valorParcelaBase + diferenca).toFixed(2));
      }

      // Calcula data de vencimento subsequente de forma consistente (mês a mês)
      const vencimento = new Date(baseDate);
      vencimento.setMonth(baseDate.getMonth() + i);
      const dataStr = vencimento.toISOString().split('T')[0];

      novasParcelas.push({
        numero_parcela: i + 1,
        valor_parcela: valor,
        data_vencimento: dataStr,
        id_conta_bancaria: contaPadrao || ''
      });
    }

    setParcelasFinanceiroCustomizado(novasParcelas);
  };

  // Ajustar dízimas ou diferenças de arredondamento jogando a diferença na última parcela
  const ajustarDiferencaUltimaParcela = () => {
    if (!dadosCompraTemporaria || parcelasFinanceiroCustomizado.length === 0) return;
    const totalCompra = parseFloat(dadosCompraTemporaria.valor_total) || 0;
    const somaOutras = parcelasFinanceiroCustomizado
      .slice(0, -1)
      .reduce((sum, p) => sum + (parseFloat(p.valor_parcela) || 0), 0);
    const novoValorUltima = parseFloat((totalCompra - somaOutras).toFixed(2));

    setParcelasFinanceiroCustomizado(prev => {
      const copy = [...prev];
      if (copy.length > 0) {
        copy[copy.length - 1].valor_parcela = novoValorUltima;
      }
      return copy;
    });
  };

  // Salvar compra
  const salvarCompra = async (e) => {
    if (e) e.preventDefault()
    setErro(null)
    setSucesso(null)

    // Validações
    if (!form.id_operacao) {
      setErro('Selecione uma operação')
      return
    }

    // Filtrar apenas itens com produto cadastrado (id_produto válido)
    const itensValidos = form.itens.filter(item => item.id_produto)
    const itensInvalidos = form.itens.filter(item => !item.id_produto)

    if (itensValidos.length === 0) {
      setErro('⚠️ Cadastre pelo menos um produto para salvar a compra')
      return
    }

    // Aviso se houver produtos não cadastrados
    if (itensInvalidos.length > 0) {
      const confirmar = window.confirm(
        `⚠️ Atenção!\n\n` +
        `${itensInvalidos.length} produto(s) em VERMELHO não serão salvos pois não estão cadastrados.\n\n` +
        `Apenas ${itensValidos.length} produto(s) em VERDE serão salvos na compra.\n\n` +
        `Deseja continuar?`
      )
      if (!confirmar) return
    }

    try {
      // Calcular total apenas dos itens válidos
      let total = 0
      const itensCalculados = itensValidos.map(item => {
        const qtdNF = parseFloat(item.quantidade) || 0
        const fracao = parseFloat(item.fracao_memorizada) || 1
        const qtdComFracao = (item.quantidade_com_fracao != null)
          ? parseFloat(item.quantidade_com_fracao)
          : (fracao !== 1 ? qtdNF * fracao : qtdNF)
        const valorUnitNF = parseFloat(item.valor_unitario) || 0
        // Custo por unidade de estoque
        const valorUnitEstoque = parseFloat(
          ((qtdComFracao > qtdNF && fracao > 1)
            ? valorUnitNF / fracao
            : valorUnitNF
          ).toFixed(6)
        )
        const subtotal = qtdNF * valorUnitNF
        total += subtotal
        return { ...item, qtdComFracao, valorUnitEstoque, subtotal }
      })

      const payload = {
        id_fornecedor: form.id_fornecedor || null,
        id_operacao: parseInt(form.id_operacao),
        numero_documento: form.numero_documento || '',
        data_documento: form.data_documento || form.data_entrada,
        data_entrada: form.data_entrada,
        dados_entrada: form.dados_entrada || '',     // Chave NF-e 44 dígitos
        xml_conteudo: form.xml_conteudo || '',        // XML completo
        valor_total: total.toFixed(6),
        itens: itensCalculados.map(item => ({
          id_produto: parseInt(item.id_produto),
          quantidade: parseFloat(item.quantidade) || 0,
          valor_unitario: Math.trunc((parseFloat(item.valor_unitario) || 0) * 1000000) / 1000000,
          valor_total: parseFloat(item.subtotal.toFixed(6)),
          fracao_memorizada: parseFloat(item.fracao_memorizada) || 1,
        }))
      }

      console.log('🔵 PREPARANDO COMPRA:', payload)

      // Se a operação gera financeiro, interceptamos aqui antes de salvar no banco
      const operacaoSelecionada = operacoes.find(o => o.id_operacao === parseInt(form.id_operacao))
      const operacaoExigeFinanceiro = !editandoId && operacaoSelecionada?.gera_financeiro === 1

      if (operacaoExigeFinanceiro) {
        // Armazenar os dados temporariamente
        setDadosCompraTemporaria({
          payload,
          itensCalculados,
          valor_total: total,
          itensValidos,
          itensInvalidos
        });

        // Configurar as opções financeiras padrão
        const contaPadraoId = contasBancarias.length > 0 ? contasBancarias[0].id_conta_bancaria : '';
        const vencimentoInicial = form.data_entrada || new Date().toISOString().split('T')[0];
        
        setDadosFinanceiroConfig({
          numero_parcelas: 1,
          forma_pagamento: 'Boleto',
          id_conta_bancaria_padrao: contaPadraoId,
          data_vencimento_inicial: vencimentoInicial
        });

        // Recalcular as parcelas para a primeira exibição
        recalcularParcelasCustomizadas(1, vencimentoInicial, contaPadraoId, total);

        // Abrir o diálogo de customização financeira
        setOpenDialogFinanceiroCustomizado(true);
        return; // Não executa o POST/PUT ainda!
      }

      // Se não gera financeiro (ou é edição), prosseguimos direto
      await executarSalvarCompraSemFinanceiro(payload, total, itensCalculados, itensValidos, itensInvalidos);

    } catch (error) {
      console.error('❌ Erro na validação/preparação da compra:', error)
      setErro(`❌ Erro ao preparar compra: ${error.message || error}`)
    }
  }

  // Executa o salvamento simples (caso não exija financeiro ou seja edição)
  const executarSalvarCompraSemFinanceiro = async (payload, total, itensCalculados, itensValidos, itensInvalidos) => {
    try {
      let response
      if (editandoId) {
        response = await axiosInstance.put(`/compras/${editandoId}/`, payload)
      } else {
        response = await axiosInstance.post('/compras/', payload)
      }

      // Salvar frações por fornecedor+produto
      const idFornecedor = parseInt(form.id_fornecedor)
      if (idFornecedor) {
        for (const item of itensCalculados) {
          const fracao = parseFloat(item.fracao_memorizada) || 1
          const ean = item._ean || ''
          const idProduto = parseInt(item.id_produto)
          if (ean && idProduto && !isNaN(fracao) && fracao > 0) {
            try {
              await axiosInstance.post('/compras/salvar-fracao/', {
                id_fornecedor: idFornecedor,
                id_produto: idProduto,
                gtin: ean,
                fracao: fracao
              })
            } catch (_) {}
          }
        }
      }

      let mensagemSucesso = editandoId 
        ? `✅ Compra atualizada com sucesso!\n💰 Valor total: R$ ${total.toFixed(2)}\n📦 ${itensValidos.length} produto(s)`
        : `✅ Compra cadastrada com sucesso!\n💰 Valor total: R$ ${total.toFixed(2)}\n📦 ${itensValidos.length} produto(s) salvos`
      
      if (itensInvalidos.length > 0) {
        mensagemSucesso += `\n⚠️ ${itensInvalidos.length} produto(s) não cadastrados foram ignorados`
      }

      setSucesso(mensagemSucesso)
      limparFormulario()
      carregarDados()
      setTimeout(() => setSucesso(null), 5000)
    } catch (error) {
      console.error('❌ Erro ao salvar compra:', error)
      const dataErr = error.response?.data
      const errorDetail = dataErr?.erro || dataErr?.error || dataErr?.detail || dataErr?.message || (typeof dataErr === 'string' ? dataErr : JSON.stringify(dataErr)) || error.message;
      setErro(`❌ ${errorDetail}`)
      toast.error(`❌ ${errorDetail}`)
    }
  }

  // Executa o salvamento da compra E das contas a pagar customizadas em lote
  const confirmarESalvarCompraComFinanceiro = async () => {
    if (!dadosCompraTemporaria) return;

    try {
      setErro(null);
      setSucesso(null);

      // 1. Salvar a Compra no backend para gerar o id_compra
      const responseCompra = await axiosInstance.post('/compras/', dadosCompraTemporaria.payload);
      const compraCriada = responseCompra.data;
      const idCompra = compraCriada.id_compra;

      console.log('✅ Compra criada com ID:', idCompra);

      // 2. Salvar frações de produtos
      const idFornecedor = parseInt(form.id_fornecedor)
      if (idFornecedor) {
        for (const item of dadosCompraTemporaria.itensCalculados) {
          const fracao = parseFloat(item.fracao_memorizada) || 1
          const ean = item._ean || ''
          const idProduto = parseInt(item.id_produto)
          if (ean && idProduto && !isNaN(fracao) && fracao > 0) {
            try {
              await axiosInstance.post('/compras/salvar-fracao/', {
                id_fornecedor: idFornecedor,
                id_produto: idProduto,
                gtin: ean,
                fracao: fracao
              })
            } catch (_) {}
          }
        }
      }

      // 3. Salvar cada parcela financeira customizada na API /contas/
      console.log('📡 Salvando contas a pagar customizadas para compra:', idCompra);
      const contasPromises = parcelasFinanceiroCustomizado.map((parcela, idx) => {
        const payloadConta = {
          tipo_conta: 'Pagar',
          id_cliente_fornecedor: idFornecedor || null,
          descricao: `Compra #${idCompra} - Parcela ${parcela.numero_parcela}/${parcelasFinanceiroCustomizado.length}`,
          valor_parcela: parseFloat(parcela.valor_parcela),
          data_vencimento: parcela.data_vencimento,
          status_conta: 'Pendente',
          forma_pagamento: dadosFinanceiroConfig.forma_pagamento,
          id_compra_origem: idCompra,
          id_conta_cobranca: parcela.id_conta_bancaria ? parseInt(parcela.id_conta_bancaria) : null,
          gerencial: 1 // Garantindo gerencial=1 para o serializer do Django
        };
        console.log(`📤 Enviando parcela ${idx + 1}:`, payloadConta);
        return axiosInstance.post('/contas/', payloadConta);
      });

      await Promise.all(contasPromises);
      console.log('✅ Todas as parcelas financeiras salvas com sucesso!');

      // Fechar diálogo e resetar estados
      setOpenDialogFinanceiroCustomizado(false);
      setDadosCompraTemporaria(null);

      // Sucesso
      let mensagemSucesso = `✅ Compra #${idCompra} cadastrada com sucesso!\n💰 Valor total: R$ ${dadosCompraTemporaria.valor_total.toFixed(2)}\n📊 ${parcelasFinanceiroCustomizado.length} parcela(s) financeira(s) gerada(s).`;
      if (dadosCompraTemporaria.itensInvalidos.length > 0) {
        mensagemSucesso += `\n⚠️ ${dadosCompraTemporaria.itensInvalidos.length} produto(s) ignorados.`;
      }

      setSucesso(mensagemSucesso);
      limparFormulario();
      carregarDados();
      setTimeout(() => setSucesso(null), 6000);

    } catch (error) {
      console.error('❌ Erro no fluxo completo de Compra + Financeiro:', error);
      const dataErr = error.response?.data
      const errorDetail = dataErr?.erro || dataErr?.error || dataErr?.detail || dataErr?.message || (typeof dataErr === 'string' ? dataErr : JSON.stringify(dataErr)) || error.message;
      setErro(`❌ ${errorDetail}`);
      toast.error(`❌ ${errorDetail}`);
    }
  }

  // Gera contas a pagar
  const gerarFinanceiro = async () => {
    try {
      setErro(null);
      setSucesso(null);

      const valorParcela = (dadosFinanceiro.valor_total / dadosFinanceiro.numero_parcelas).toFixed(2);
      const parcelas = [];
      const idFornecedor = dadosFinanceiro.id_fornecedor || null;

      for (let i = 0; i < dadosFinanceiro.numero_parcelas; i++) {
        const dataVencimento = new Date(dadosFinanceiro.data_vencimento + 'T00:00:00');
        dataVencimento.setMonth(dataVencimento.getMonth() + i);

        parcelas.push({
          id_compra_origem: dadosFinanceiro.id_compra,
          id_cliente_fornecedor: idFornecedor,
          tipo_conta: 'Pagar',
          descricao: `Compra #${dadosFinanceiro.id_compra} - Parcela ${i + 1}/${dadosFinanceiro.numero_parcelas}`,
          valor_parcela: parseFloat(valorParcela),
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          data_emissao: new Date().toISOString().split('T')[0],
          status_conta: 'Pendente',
          forma_pagamento: dadosFinanceiro.forma_pagamento,
          gerencial: 1
        });
      }

      for (const parcela of parcelas) {
        await axiosInstance.post('/contas/', parcela);
      }

      setModalFinanceiro(false);
      setSucesso(`✅ ${parcelas.length} conta(s) a pagar gerada(s) com sucesso!`);
      limparFormulario();
      carregarDados();
      setTimeout(() => setSucesso(null), 5000);
    } catch (error) {
      console.error('Erro ao gerar financeiro:', error);
      const errorDetail = error.response?.data?.detail || error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
      setErro(`❌ Erro ao gerar financeiro: ${errorDetail}`);
    }
  };

  // Edita compra ou devolução
  const editarCompra = async (compraOuId) => {
    try {
      const isDevolucao = typeof compraOuId === 'object'
        ? (compraOuId.is_devolucao || (compraOuId.operacao_nome || '').toUpperCase().includes('DEVOLU'))
        : String(compraOuId).startsWith('DEV');

      if (isDevolucao) {
        const rowObj = typeof compraOuId === 'object' ? compraOuId : { id_compra: String(compraOuId).replace('DEV-', '') };
        abrirModalDevolucaoCompra(rowObj);
        return;
      }

      const id = typeof compraOuId === 'object' ? (compraOuId.id_compra || compraOuId.id) : compraOuId;
      const response = await axiosInstance.get(`/compras/${id}/`)
      const compraCompleta = response.data

      // Mapeia os itens da compra e lê a fração salva no cache/API se existir
      const itensRestaurados = (compraCompleta.itens || []).map(item => {
        const qtdNoEstoque = parseFloat(item.quantidade) || 0;
        const valorCustoEstoque = parseFloat(item.valor_unitario) || 0;
        const fracao = parseFloat(item.fracao_memorizada || 1);

        // Se o produto foi cadastrado com uma fração de embalagem (ex: fracao > 1),
        // a quantidade no banco foi salva expandida em unidades (Ex: 12 unidades).
        // Precisamos reverter para os valores da Nota Fiscal.
        if (fracao > 1) {
          const qtdNF = parseFloat((qtdNoEstoque / fracao).toFixed(6));
          const valorUnitNFCalculado = valorCustoEstoque * fracao;
          const valorUnitNF = Math.trunc(valorUnitNFCalculado * 1000000) / 1000000;

          return {
            ...item,
            quantidade: qtdNF,
            valor_unitario: valorUnitNF,
            fracao_memorizada: fracao,
          };
        }

        return {
          ...item,
          quantidade: qtdNoEstoque,
          valor_unitario: valorCustoEstoque,
          fracao_memorizada: fracao,
        };
      });

      setForm({
        id_fornecedor: String(compraCompleta.id_fornecedor || ''),
        id_operacao: compraCompleta.id_operacao || '',
        numero_documento: compraCompleta.numero_documento || '',
        data_documento: compraCompleta.data_documento ? compraCompleta.data_documento.split('T')[0] : '',
        data_entrada: compraCompleta.data_entrada ? compraCompleta.data_entrada.split('T')[0] : new Date().toLocaleDateString('en-CA'),
        dados_entrada: compraCompleta.dados_entrada || '',
        itens: itensRestaurados
      })
      
      setEditandoId(compraCompleta.id_compra || compraCompleta.id)
      setMostrarFormulario(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setSucesso('📝 Compra carregada para edição')
      setTimeout(() => setSucesso(null), 3000)
    } catch (error) {
      console.error('Erro ao carregar compra para edição:', error)
      setErro('❌ Erro ao carregar compra: ' + (error.response?.data?.detail || error.message))
    }
  }

  // Exclui compra ou devolução
  const excluirCompra = async (compraOuId) => {
    try {
      const isDevolucao = typeof compraOuId === 'object'
        ? (compraOuId.is_devolucao || (compraOuId.operacao_nome || '').toUpperCase().includes('DEVOLU'))
        : String(compraOuId).startsWith('DEV') || String(compraOuId).startsWith('NFE');

      if (isDevolucao) {
        if (!window.confirm('Deseja realmente excluir esta Devolução?')) return;
        const idDev = typeof compraOuId === 'object' ? (compraOuId.id_devolucao || compraOuId.id_compra || compraOuId.id) : compraOuId;
        const cleanDevId = String(idDev).replace('DEV-', '').replace('NFE-', '');
        
        try {
          await axiosInstance.delete(`/devolucoes/${cleanDevId}/`);
        } catch (e) {
          if (typeof compraOuId === 'object' && compraOuId.id_venda) {
            await axiosInstance.delete(`/vendas/${compraOuId.id_venda}/`);
          }
        }
        setSucesso('✅ Devolução excluída com sucesso!');
        carregarDados();
        setTimeout(() => setSucesso(null), 3000);
        return;
      }

      const id = typeof compraOuId === 'object' ? (compraOuId.id_compra || compraOuId.id) : compraOuId;
      // Primeiro verifica se há financeiro pago
      const responseFinanceiro = await axiosInstance.get(`/financeiro/?id_compra_origem=${id}`)
      const contas = Array.isArray(responseFinanceiro.data) 
        ? responseFinanceiro.data 
        : (responseFinanceiro.data.results || [])
      
      const contasPagas = contas.filter(c => 
        c.status_conta === 'Paga' || c.status_conta === 'Liquidado'
      )
      
      if (contasPagas.length > 0) {
        const totalPago = contasPagas.reduce((sum, c) => sum + parseFloat(c.valor_conta || 0), 0)
        const mensagem = `⚠️ Esta compra possui ${contasPagas.length} conta(s) já paga(s) no valor total de R$ ${totalPago.toFixed(2)}.\n\nPara excluir esta compra, você precisa primeiro:\n1. Ir ao módulo Financeiro\n2. Estornar os ${contasPagas.length} pagamento(s)\n3. Depois voltar e excluir a compra\n\nDeseja ir para o Financeiro agora?`
        
        if (window.confirm(mensagem)) {
          window.location.href = '/#/financeiro'
        }
        return
      }
      
      if (!window.confirm('Deseja realmente excluir esta compra?')) return

      await axiosInstance.delete(`/compras/${id}/`)
      setSucesso('✅ Compra excluída com sucesso!')
      carregarDados()
      setTimeout(() => setSucesso(null), 3000)
    } catch (error) {
      console.error('Erro ao excluir:', error)
      if (error.response?.status === 403) {
        const mensagem = error.response?.data?.detail || error.response?.data?.error || 'Não é permitido excluir esta compra'
        setErro(`❌ ${mensagem}`)
      } else {
        const mensagem = error.response?.data?.detail || error.response?.data?.error || error.message
        setErro(`❌ Erro ao excluir compra: ${mensagem}`)
      }
    }
  }

  // === Manifestação do Destinatário ===

  const abrirManifestacao = (compra) => {
    setCompraParaManif(compra)
    setTipoEventoManif('')
    setJustificativaManif('')
    setResultadoManif(null)
    setDialogManifestacao(true)
  }

  const fecharManifestacao = () => {
    setDialogManifestacao(false)
    setCompraParaManif(null)
    setResultadoManif(null)
  }

  // === Consultar e Importar NF-es da SEFAZ ===

  const consultarNFesSeafaz = async (ult_nsu = '000000000000000') => {
    setConsultandoNFes(true)
    try {
      const resp = await axiosInstance.post('/manifestacao/consultar-nfes/', { ult_nsu })
      if (resp.data.sucesso) {
        setNfesSeafaz(prev =>
          ult_nsu === '000000000000000' ? (resp.data.nfes || []) : [...prev, ...(resp.data.nfes || [])]
        )
        setMaxNsuSeafaz(resp.data.max_nsu || '')
      } else {
        setErro(`Erro ao consultar SEFAZ: ${resp.data.x_motivo || 'Sem documentos retornados'}`)
      }
    } catch (err) {
      setErro(err?.response?.data?.erro || err?.message || 'Erro ao consultar NF-es da SEFAZ')
    } finally {
      setConsultandoNFes(false)
    }
  }

  const abrirConsultarNFesSeafaz = () => {
    setNfesSeafaz([])
    setMaxNsuSeafaz('')
    setDialogNFesSeafaz(true)
    consultarNFesSeafaz()
  }

  const importarNFeFromSeafaz = async (nfe) => {
    try {
      setImportandoNsuSeafaz(nfe.nsu)
      const xmlBlob = new Blob([nfe.xml], { type: 'text/xml' })
      const file = new File([xmlBlob], `nfe_${nfe.chave_nfe || nfe.nsu}.xml`, { type: 'text/xml' })
      setLoading(true)
      const formData = new FormData()
      formData.append('xml_file', file)
      const response = await axiosInstance.post('/compras/importar_xml/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const dados = response.data
      let mensagem = '✅ NF-e importada da SEFAZ com sucesso!'
      if (dados.fornecedor_criado) {
        mensagem += ` Fornecedor "${dados.fornecedor_nome}" cadastrado automaticamente.`
      }
      const encontrados = (dados.itens || []).filter(i => i.id_produto).length
      const naoEncontrados = (dados.itens || []).filter(i => !i.id_produto).length
      if (encontrados > 0) mensagem += ` ${encontrados} produto(s) encontrado(s).`
      if (naoEncontrados > 0) mensagem += ` ⚠️ ${naoEncontrados} produto(s) NÃO cadastrado(s).`
      setSucesso(mensagem)
      setForm({
        id_fornecedor: dados.id_fornecedor || '',
        numero_documento: dados.numero_documento || '',
        data_documento: dados.data_documento || '',
        data_entrada: dados.data_entrada || new Date().toLocaleDateString('en-CA'),
        dados_entrada: dados.chave_nfe || dados.dados_entrada || '',   // chave NF-e 44 dígitos
        xml_conteudo: dados.xml_conteudo || '',      // XML completo
        id_operacao: form.id_operacao,
        itens: (dados.itens || []).map(item => ({
          id_produto: item.id_produto || '',
          quantidade: item.quantidade || 1,
          valor_unitario: item.valor_unitario || 0,
          fracao_memorizada: item.fracao_memorizada || 1,
          quantidade_com_fracao: item.quantidade_com_fracao != null ? item.quantidade_com_fracao : null,
          cfop: item.cfop || '',
          cst: item.cst || '',
          csosn: item.csosn || '',
          vbc_icms: item.vbc_icms || '',
          picms: item.picms || '',
          vicms: item.vicms || '',
          vipi: item.vipi || '',
          vpis: item.vpis || '',
          vcofins: item.vcofins || '',
          _codigo: item.codigo,
          _ean: item.ean || '',
          _descricao: item.descricao,
          _nome_produto: item.nome_produto,
          _ncm: item.ncm,
          _unidade: item.unidade,
          _cfop: item.cfop,
          _cfop_original: item.cfop_original,
          _cst: item.cst,
          _csosn: item.csosn,
          _vbc_icms: item.vbc_icms,
          _picms: item.picms,
          _vicms: item.vicms,
          _vipi: item.vipi,
          _vpis: item.vpis,
          _vcofins: item.vcofins,
          _encontrado: item.produto_encontrado || !!item.id_produto,
        }))
      })
      await carregarDados()
      setDialogNFesSeafaz(false)
      setMostrarFormulario(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setErro(error?.response?.data?.error || error?.message || 'Erro ao importar NF-e da SEFAZ')
    } finally {
      setLoading(false)
      setImportandoNsuSeafaz(null)
    }
  }

  const enviarManifestacao = async () => {
    if (!tipoEventoManif) {
      setErro('Selecione o tipo de evento para manifestar.')
      return
    }
    if (tipoEventoManif === '210220' && justificativaManif.trim().length < 15) {
      setErro('Justificativa deve ter pelo menos 15 caracteres para "Operação não Realizada".')
      return
    }
    setEnviandoManif(true)
    try {
      const payload = {
        chave_nfe: compraParaManif.dados_entrada,
        tipo_evento: tipoEventoManif,
      }
      if (tipoEventoManif === '210220') payload.justificativa = justificativaManif
      const resp = await axiosInstance.post('/manifestacao/manifestar/', payload)
      setResultadoManif(resp.data)
    } catch (err) {
      setResultadoManif({
        sucesso: false,
        x_motivo: err?.response?.data?.erro || err?.response?.data?.error || err.message || 'Erro desconhecido',
      })
    } finally {
      setEnviandoManif(false)
    }
  }

  // Abre modal de precificação para uma compra específica
  const abrirPrecificacaoCompra = async (compraId) => {
    try {
      setLoading(true)
      // Busca os detalhes da compra com itens
      const response = await axiosInstance.get(`/compras/${compraId}/`)
      const compra = response.data

      if (!compra.itens || compra.itens.length === 0) {
        setErro('Esta compra não possui itens para precificar')
        return
      }

      // Mapeia os itens com informações completas do produto
      const itensComProdutos = compra.itens.map(item => {
        const produto = produtos.find(p => p.id_produto === item.id_produto)
        return {
          id_produto: item.id_produto,
          quantidade: item.quantidade,
          valor_unitario: item.valor_compra || item.valor_unitario,
          nome_produto: produto?.nome_produto || `Produto ${item.id_produto}`
        }
      })

      setCompraSelecionadaPrecificacao(itensComProdutos)
      setModalPrecificacao(true)
    } catch (error) {
      console.error('Erro ao carregar itens da compra:', error)
      setErro('Erro ao carregar itens da compra para precificação')
    } finally {
      setLoading(false)
    }
  }

  // Verifica permissões
  if (authLoading || loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  if (!user?.is_staff && !permissions?.compras_acessar) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Você não tem permissão para acessar esta página.</Alert>
      </Box>
    )
  }

  const { total: totalCompra } = calcularTotais()

  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#f0f2f5',
      p: { xs: 1, sm: 2, md: 3 }
    }}>
      <Box sx={{ width: '100%', maxWidth: '100%', mx: 'auto' }}>
        {/* Header com título e estatísticas */}
        <Paper
          elevation={8}
          sx={{
            p: 2,
            mb: 2,
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            color: 'white',
            borderRadius: 2
          }}
        >
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={6}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ShoppingCartIcon sx={{ fontSize: 48 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Gestão de Compras
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Registre e gerencie suas compras e fornecedores
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
                <Chip
                  icon={<BusinessIcon />}
                  label={`${fornecedores.length} Fornecedores`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
                />
                <Chip
                  icon={<ReceiptIcon />}
                  label={`${compras.length} Compras`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
                />
                <Button
                  variant="contained"
                  startIcon={<CloudSyncIcon />}
                  onClick={abrirConsultarNFesSeafaz}
                  sx={{
                    bgcolor: '#0288d1',
                    color: 'white',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: '#0277bd' }
                  }}
                >
                  NF-es da SEFAZ
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => { limparFormulario(); setMostrarFormulario(true); }}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: '#f0f0f0' }
                  }}
                >
                  Nova Compra
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Mensagens de feedback */}
        <Collapse in={!!erro}>
          <Alert
            severity="error"
            onClose={() => setErro(null)}
            sx={{ mb: 2, borderRadius: 2 }}
            icon={<WarningIcon />}
          >
            {erro}
          </Alert>
        </Collapse>

        <Collapse in={!!sucesso}>
          <Alert
            severity="success"
            onClose={() => setSucesso(null)}
            sx={{ mb: 2, borderRadius: 2 }}
            icon={<CheckCircleIcon />}
          >
            {sucesso}
          </Alert>
        </Collapse>

        {/* Formulário de Nova Compra — Dialog Modal */}
        <Dialog
          open={mostrarFormulario}
          onClose={limparFormulario}
          maxWidth="xl"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, m: 1 } }}
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            color: 'white',
            py: 2,
            px: 3,
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={2}>
                <LocalShippingIcon sx={{ fontSize: 36 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {editandoId ? `Editar Compra #${editandoId}` : 'Nova Compra'}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    Preencha os dados ou importe NF-e
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<CloudSyncIcon />}
                  onClick={abrirConsultarNFesSeafaz}
                  disabled={loading}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.7)',
                    color: 'white',
                    fontWeight: 'bold',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.15)' },
                  }}
                >
                  NF-es da SEFAZ
                </Button>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  disabled={loading}
                  sx={{
                    bgcolor: '#0277bd',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: '#01579b' },
                  }}
                >
                  Importar XML (NF-e)
                  <input type="file" accept=".xml" hidden onChange={importarXML} />
                </Button>
                <Tooltip title="Fechar">
                  <IconButton onClick={limparFormulario} sx={{ color: 'white' }}>
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            {loading && <LinearProgress />}

            {/* Sistema de Abas */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
              <Tabs 
                value={abaAtiva} 
                onChange={(e, newValue) => setAbaAtiva(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    minHeight: 56,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem'
                  }
                }}
              >
                <Tab icon={<DescriptionIcon />} iconPosition="start" label="Principal" />
                <Tab icon={<InventoryIcon />} iconPosition="start" label="Produtos" />
                <Tab icon={<LocalShippingIcon />} iconPosition="start" label="Frete" />
                <Tab icon={<NoteIcon />} iconPosition="start" label="Observações" />
              </Tabs>
            </Box>

          <form onSubmit={salvarCompra}>
            {/* Aba Principal */}
            {abaAtiva === 0 && (
            <Box sx={{ p: 3 }}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                border: '1px solid #e0e0e0'
              }}
            >
              {form.finalidade === '6' && (
                <Alert severity="info" sx={{ mb: 3, fontWeight: 'bold' }}>
                  ℹ️ Esta é uma <strong>Nota Fiscal de Débito (Ajuste/Complementar - RTC)</strong>. 
                  A movimentação de estoque físico foi desativada automaticamente para evitar duplicidade de saldo.
                  O valor complementar será ajustado diretamente no Custo Médio dos produtos.
                </Alert>
              )}
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <BusinessIcon /> Informações da Nota
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      select
                      fullWidth
                      label="Fornecedor"
                      value={form.id_fornecedor}
                      onChange={(e) => setForm({ ...form, id_fornecedor: e.target.value })}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    >
                      <MenuItem value="">Nenhum</MenuItem>
                      {Array.isArray(fornecedores) && fornecedores.map((f) => (
                        <MenuItem key={f.id_fornecedor} value={f.id_fornecedor}>
                          {f.nome_razao_social}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Tooltip title="Cadastrar novo fornecedor">
                      <IconButton
                        onClick={() => setModalFornecedor(true)}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Operação *"
                    value={form.id_operacao}
                    onChange={(e) => setForm({ ...form, id_operacao: e.target.value })}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  >
                    <MenuItem value="">Selecione...</MenuItem>
                    {Array.isArray(operacoes) && operacoes.map((o) => (
                      <MenuItem key={o.id_operacao} value={o.id_operacao}>
                        {o.nome_operacao || o.id_operacao}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Número do Documento"
                    value={form.numero_documento}
                    onChange={(e) => setForm({ ...form, numero_documento: e.target.value })}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ReceiptIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Data do Documento"
                    value={form.data_documento}
                    onChange={(e) => setForm({ ...form, data_documento: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    helperText="Data da nota fiscal (manual ou do XML)"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Chave NF-e (44 dígitos)"
                    value={form.dados_entrada}
                    onChange={(e) => setForm({ ...form, dados_entrada: e.target.value.replace(/\D/g, '').slice(0, 44) })}
                    variant="outlined"
                    inputProps={{ maxLength: 44 }}
                    helperText={`${(form.dados_entrada || '').length}/44 dígitos — preenchida automaticamente ao importar XML`}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ReceiptIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.movimenta_estoque_fisico !== false}
                        onChange={(e) => setForm({ ...form, movimenta_estoque_fisico: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Movimentar saldo físico no estoque"
                  />
                  {form.chave_referenciada && (
                    <Chip
                      icon={<ReceiptIcon />}
                      label={`Origem Ref: ${form.chave_referenciada.slice(0, 6)}...${form.chave_referenciada.slice(-6)}`}
                      color="secondary"
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  )}
                </Grid>
              </Grid>
            </Paper>
            </Box>
            )}
            {/* Fim Aba Principal */}

            {/* Aba Produtos */}
            {abaAtiva === 1 && (
              <Box sx={{ p: 3 }}>
                {/* Itens da compra com visual moderno */}
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 'bold',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <InventoryIcon /> Produtos da Compra
                      <Chip
                        label={`${form.itens.length} ${form.itens.length === 1 ? 'item' : 'itens'}`}
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    </Typography>

                    <Button
                      startIcon={<AddIcon />}
                      onClick={adicionarItem}
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        borderWidth: 2,
                        fontWeight: 'bold',
                        '&:hover': {
                          borderWidth: 2,
                        },
                      }}
                    >
                      Adicionar Produto
                    </Button>
                  </Stack>

                  <Stack spacing={2}>
                    {form.itens.map((item, index) => {
                      const subtotal = (parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0)

                      // Determinar cor do card (verde = encontrado, vermelho = não encontrado)
                      let cardBg = 'linear-gradient(to right, #ffffff 0%, #f8f9fa 100%)'
                      let borderColor = '#e0e0e0'
                      let statusIcon = null
                      let statusColor = 'default'

                      if (item._encontrado === true) {
                        cardBg = 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                        borderColor = '#4caf50'
                        statusIcon = <CheckCircleIcon sx={{ color: '#4caf50' }} />
                        statusColor = 'success'
                      } else if (item._encontrado === false) {
                        cardBg = 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)'
                        borderColor = '#f44336'
                        statusIcon = <WarningIcon sx={{ color: '#f44336' }} />
                        statusColor = 'error'
                      }

                      return (
                        <Fade in key={index}>
                          <Card
                            elevation={3}
                            data-item-index={index}
                            sx={{
                              background: cardBg,
                              border: `2px solid ${borderColor}`,
                              borderRadius: 2,
                              transition: 'all 0.3s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 6,
                              }
                            }}
                          >
                            <CardContent sx={{ pb: 2 }}>
                              {/* Header do item com número e ação de remover */}
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Chip
                                  icon={statusIcon || <InventoryIcon />}
                                  label={`Item ${index + 1}`}
                                  color={statusColor}
                                  sx={{ fontWeight: 'bold' }}
                                />
                                {item._sugerido && (
                                  <Chip
                                    label="💡 Tributação sugerida do produto"
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    onDelete={() => atualizarItem(index, '_sugerido', false)}
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                )}
                                <Tooltip title={form.itens.length === 1 ? "Não é possível remover o único item" : "Remover item"}>
                                  <span>
                                    <IconButton
                                      onClick={() => removerItem(index)}
                                      disabled={form.itens.length === 1}
                                      sx={{
                                        color: 'error.main',
                                        '&:hover': {
                                          bgcolor: 'error.light',
                                          color: 'white',
                                        },
                                      }}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>

                              {/* Mostrar info do produto não cadastrado */}
                              <Collapse in={item._encontrado === false}>
                                <Alert
                                  severity="warning"
                                  sx={{
                                    mb: 2,
                                    borderRadius: 2,
                                    '& .MuiAlert-icon': {
                                      fontSize: 28
                                    }
                                  }}
                                  icon={<WarningIcon />}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    ⚠️ Produto NÃO cadastrado no sistema
                                  </Typography>
                                  <Stack spacing={0.5}>
                                    <Typography variant="caption">
                                      <strong>Código:</strong> {item._codigo || 'N/A'}
                                    </Typography>
                                    {item._ean && (
                                      <Typography variant="caption">
                                        <strong>EAN/Código de Barras:</strong> {item._ean}
                                      </Typography>
                                    )}
                                    <Typography variant="caption">
                                      <strong>Descrição:</strong> {item._descricao || 'N/A'}
                                    </Typography>
                                    {item._ncm && (
                                      <Typography variant="caption">
                                        <strong>NCM:</strong> {item._ncm}
                                      </Typography>
                                    )}
                                  </Stack>
                                </Alert>
                              </Collapse>

                              {/* Mostrar confirmação de produto encontrado */}
                              <Collapse in={item._encontrado === true}>
                                <Alert
                                  severity="success"
                                  sx={{
                                    mb: 2,
                                    borderRadius: 2,
                                    '& .MuiAlert-icon': {
                                      fontSize: 28
                                    }
                                  }}
                                  icon={<CheckCircleIcon />}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    ✅ Produto: <strong>{item._nome_produto || item._descricao}</strong>
                                  </Typography>
                                  {item._ean && (
                                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                      EAN: {item._ean}
                                    </Typography>
                                  )}
                                </Alert>
                              </Collapse>

                              <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={5}>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Autocomplete
                                      fullWidth
                                      size="small"
                                      options={Array.isArray(produtos) ? produtos : []}
                                      getOptionLabel={(p) => p ? `${p.codigo_produto} - ${p.nome_produto || p.id_produto}` : ''}
                                      isOptionEqualToValue={(opt, val) => opt.id_produto === val.id_produto}
                                      value={produtos.find(p => String(p.id_produto) === String(item.id_produto)) || null}
                                      onChange={(_, newVal) => selecionarProduto(index, newVal ? newVal.id_produto : '')}
                                      filterOptions={(opts, { inputValue }) => {
                                        const term = inputValue.toLowerCase();
                                        return opts.filter(p =>
                                          (p.nome_produto || '').toLowerCase().includes(term) ||
                                          (p.codigo_produto || '').toLowerCase().includes(term) ||
                                          (p.gtin || '').includes(inputValue)
                                        );
                                      }}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          required
                                          label="Produto *"
                                          variant="outlined"
                                          placeholder="Digite código, nome ou EAN..."
                                          InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                              <>
                                                <InputAdornment position="start">
                                                  <InventoryIcon color="action" fontSize="small" />
                                                </InputAdornment>
                                                {params.InputProps.startAdornment}
                                              </>
                                            ),
                                          }}
                                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                      )}
                                    />
                                    
                                    {/* Dois botões: Cadastro Normal (+) e Cadastro Turbo (⚡) */}
                                    <Box display="flex" gap={0.5}>
                                      {/* Botão 1: Cadastro Normal (Manual) */}
                                      <Tooltip title="Cadastro Normal (Manual)">
                                        <IconButton
                                          onClick={() => {
                                                                                        // Pegar TODOS os dados do item do XML para preencher automaticamente
                                            const dadosXML = {
                                              gtin: item._ean || '',
                                              nome: item._descricao || '',
                                              descricao: item._descricao || '',
                                              ncm: item._ncm || '',
                                              unidade_medida: item._unidade || 'UN',
                                              preco_custo: item.valor_unitario || '',
                                              codigo: item._codigo || '',
                                              id_grupo: '',
                                              categoria: '',
                                              marca: '',
                                              classificacao: 'Revenda',
                                              genero: '',
                                              controla_lote: false,
                                              cest: '',
                                              imagem_url: '',
                                              tributacao: {
                                                cfop: item._cfop || '',
                                                cst_icms: item._cst || '',
                                                csosn: item._csosn || '',
                                                icms_aliquota: item._picms || '',
                                                cst_ipi: '',
                                                ipi_aliquota: item._vipi ? parseFloat(item._vipi) : '',
                                                cst_pis_cofins: '',
                                                pis_aliquota: item._vpis ? parseFloat(item._vpis) : '',
                                                cofins_aliquota: item._vcofins ? parseFloat(item._vcofins) : '',
                                                cst_ibs_cbs: '',
                                                ibs_aliquota: '',
                                                cbs_aliquota: '',
                                                classificacao_fiscal: item._ncm || ''
                                              },
                                              depositos: depositos.map(dep => ({
                                                id_deposito: dep.id_deposito,
                                                nome_deposito: dep.nome_deposito,
                                                quantidade_minima: 0,
                                                valor_venda: 0,
                                                valor_custo: item.valor_unitario || 0
                                              }))
                                            };
                                            
                                            // Preencher formulário e abrir dialog
                                            setDadosProdutoNovo(dadosXML);
                                            setAbaAtivaDialogProduto(0);
                                            setItemIndexCadastro(index);
                                            setOpenDialogNovoProduto(true);
                                            
                                            toast.info('📝 Dados do XML carregados. Complete as informações!', {
                                              autoClose: 2500
                                            });
                                          }}
                                          sx={{ 
                                            bgcolor: 'primary.main', 
                                            color: 'white', 
                                            '&:hover': { bgcolor: 'primary.dark' },
                                            width: 40,
                                            height: 40
                                          }}
                                        >
                                          <AddIcon />
                                        </IconButton>
                                      </Tooltip>

                                      {/* Botão 2: Cadastro Turbo (Automático) */}
                                      <Tooltip title="Cadastro Turbo ⚡ (Busca Automática + Dados do XML)">
                                        <IconButton
                                          onClick={() => {
                                            const eanDoItem = item._ean || '';
                                            
                                            if (eanDoItem) {
                                              // 🔥 NOVO: Preparar TODOS os dados do XML para o Cadastro Turbo
                                              const dadosXML = {
                                                ean: eanDoItem,
                                                nome: item._descricao || '',
                                                ncm: item._ncm || '',
                                                unidade: item._unidade || 'UN',
                                                valor_unitario: item.valor_unitario || 0,
                                                cfop: item._cfop || '',
                                                cst: item._cst || '',
                                                csosn: item._csosn || '',
                                                vbc_icms: item._vbc_icms || '',
                                                picms: item._picms || '',
                                                vicms: item._vicms || '',
                                                vipi: item._vipi || '',
                                                vpis: item._vpis || '',
                                                vcofins: item._vcofins || ''
                                              };
                                              
                                              // Salvar dados completos do XML no sessionStorage
                                              sessionStorage.setItem('cadastro_turbo_ean_auto', eanDoItem);
                                              sessionStorage.setItem('cadastro_turbo_dados_xml', JSON.stringify(dadosXML));
                                              sessionStorage.setItem('cadastro_turbo_origem', 'compra_form');
                                              sessionStorage.setItem('cadastro_turbo_item_index', index.toString());
                                              sessionStorage.setItem('cadastro_turbo_voltando', 'true');
                                              sessionStorage.setItem('cadastro_turbo_editando_id', editandoId || 'null');
                                              
                                              // Preserva o formulário completo (itens do XML) para restaurar ao voltar
                                              sessionStorage.setItem('compra_form_backup', JSON.stringify(form));
                                              sessionStorage.setItem('compra_mostrar_formulario_backup', mostrarFormulario ? 'true' : 'false');
                                              
                                              toast.info('⚡ Carregando dados do XML no Cadastro Turbo...', {
                                                autoClose: 2500
                                              });
                                              
                                              // Navegar para Cadastro Turbo
                                              navigate('/cadastro-turbo');
                                            } else {
                                              // Sem EAN: avisar que precisa de GTIN
                                              toast.warning('⚠️ Cadastro Turbo precisa de EAN/GTIN! Use o botão "+" para cadastro manual.', {
                                                autoClose: 3500
                                              });
                                            }
                                            setItemIndexCadastro(index);
                                          }}
                                          sx={{ 
                                            bgcolor: 'warning.main', 
                                            color: 'white', 
                                            '&:hover': { bgcolor: 'warning.dark' },
                                            width: 40,
                                            height: 40
                                          }}
                                        >
                                          <FlashOnIcon />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                </Grid>

                                <Grid item xs={4} md={1.5}>
                                  <TextField
                                    fullWidth
                                    required
                                    type="number"
                                    label="Qtd *"
                                    value={item.quantidade}
                                    onChange={(e) => atualizarItem(index, 'quantidade', e.target.value)}
                                    inputProps={{ min: 0.000001, step: 0.000001 }}
                                    variant="outlined"
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                  />
                                </Grid>

                                <Grid item xs={4} md={1.5}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    label="Fração"
                                    value={item.fracao_memorizada || ''}
                                    onChange={(e) => {
                                      const valor = e.target.value;
                                      const fracao = parseFloat(valor);
                                      
                                      const novosItens = [...form.itens];
                                      novosItens[index] = { ...novosItens[index], fracao_memorizada: valor };
                                      
                                      if (!isNaN(fracao) && fracao > 0) {
                                        const qtd = parseFloat(item.quantidade) || 0;
                                        // Fração !== 1 é o fator de conversão (caixa, fardo, etc.)
                                        // Ex: 30 caixas × fração 6 = 180 unidades
                                        // Fração = 1 significa sem conversão (compra unitária)
                                        novosItens[index].quantidade_com_fracao = fracao !== 1 ? qtd * fracao : null;
                                      } else {
                                        novosItens[index].quantidade_com_fracao = null;
                                      }

                                      setForm({ ...form, itens: novosItens });
                                    }}
                                    inputProps={{ min: 0, step: 0.1 }}
                                    variant="outlined"
                                    size="small"
                                    placeholder="Ex: 12"
                                    helperText={
                                      item.fracao_memorizada && !isNaN(parseFloat(item.fracao_memorizada)) && parseFloat(item.fracao_memorizada) > 0
                                        ? parseFloat(item.fracao_memorizada) !== 1
                                          ? `= ${((parseFloat(item.quantidade) || 0) * parseFloat(item.fracao_memorizada)).toFixed(2)} un`
                                          : `${(parseFloat(item.quantidade) || 0).toFixed(2)} un`
                                        : 'Caixa/Fardo'
                                    }
                                    sx={{ 
                                      '& .MuiOutlinedInput-root': { borderRadius: 2 },
                                      '& .MuiFormHelperText-root': { fontSize: '0.65rem', color: 'success.main', fontWeight: 'bold' }
                                    }}
                                  />
                                </Grid>

                                <Grid item xs={4} md={2}>
                                  <TextField
                                    fullWidth
                                    required
                                    type="number"
                                    label="Valor Unit. *"
                                    value={item.valor_unitario != null ? parseFloat(parseFloat(item.valor_unitario).toFixed(6)) : ''}
                                    onChange={(e) => atualizarItem(index, 'valor_unitario', e.target.value)}
                                    inputProps={{ min: 0, step: 0.000001 }}
                                    variant="outlined"
                                    size="small"
                                    InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                  />
                                </Grid>

                                <Grid item xs={12} md={3}>
                                  <Paper elevation={1} sx={{ p: 1.5, bgcolor: 'success.light', borderRadius: 2, border: '2px solid', borderColor: 'success.main' }}>
                                    <Stack spacing={0.2}>
                                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'success.dark' }}>Subtotal</Typography>
                                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                                        R$ {subtotal.toFixed(2)}
                                      </Typography>
                                    </Stack>
                                  </Paper>
                                </Grid>

                                {/* Tributação — sempre visível e editável */}
                                <Grid item xs={12}>
                                  <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#eef2ff', border: '1px solid #c5cae9' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#283593', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      🧾 Tributação
                                      {item._cfop_original && item._cfop_original !== item.cfop && (
                                        <Chip label={`XML orig: ${item._cfop_original}`} size="small" sx={{ ml: 1, fontSize: '0.65rem', height: 18, bgcolor: '#e8eaf6', color: '#5c6bc0' }} />
                                      )}
                                    </Typography>
                                    <Grid container spacing={1.5}>
                                      {/* CFOP */}
                                      <Grid item xs={6} sm={3} md={2}>
                                        <TextField
                                          fullWidth size="small" label="CFOP"
                                          value={item.cfop || ''}
                                          onChange={(e) => atualizarItem(index, 'cfop', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                          inputProps={{ maxLength: 4 }}
                                          variant="outlined"
                                          helperText={item._cfop_original && item._cfop_original !== item.cfop ? `orig: ${item._cfop_original}` : 'entrada'}
                                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' }, '& input': { fontWeight: 'bold', color: '#1565c0' } }}
                                        />
                                      </Grid>
                                      {/* CST */}
                                      <Grid item xs={6} sm={3} md={2}>
                                        <TextField
                                          fullWidth size="small" label="CST ICMS"
                                          value={item.cst || ''}
                                          onChange={(e) => atualizarItem(index, 'cst', e.target.value.slice(0, 3))}
                                          variant="outlined"
                                          helperText="regime normal"
                                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' }, '& input': { fontWeight: 'bold', color: '#4a148c' } }}
                                        />
                                      </Grid>
                                      {/* CSOSN */}
                                      <Grid item xs={6} sm={3} md={2}>
                                        <TextField
                                          fullWidth size="small" label="CSOSN"
                                          value={item.csosn || ''}
                                          onChange={(e) => atualizarItem(index, 'csosn', e.target.value.slice(0, 4))}
                                          variant="outlined"
                                          helperText="Simples Nacional"
                                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' }, '& input': { fontWeight: 'bold', color: '#bf360c' } }}
                                        />
                                      </Grid>
                                      {/* BC ICMS */}
                                      <Grid item xs={6} sm={3} md={2}>
                                        <TextField
                                          fullWidth size="small" label="BC ICMS (R$)"
                                          type="number" value={item.vbc_icms || ''}
                                          onChange={(e) => atualizarItem(index, 'vbc_icms', e.target.value)}
                                          inputProps={{ min: 0, step: 0.01 }}
                                          variant="outlined"
                                          helperText="base de cálculo"
                                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }}
                                        />
                                      </Grid>
                                      {/* % ICMS */}
                                      <Grid item xs={6} sm={3} md={1}>
                                        <TextField
                                          fullWidth size="small" label="% ICMS"
                                          type="number" value={item.picms || ''}
                                          onChange={(e) => atualizarItem(index, 'picms', e.target.value)}
                                          inputProps={{ min: 0, step: 0.01 }}
                                          variant="outlined"
                                          helperText="alíquota"
                                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }}
                                        />
                                      </Grid>
                                      {/* vICMS */}
                                      <Grid item xs={6} sm={3} md={1}>
                                        <TextField
                                          fullWidth size="small" label="vICMS (R$)"
                                          type="number" value={item.vicms || ''}
                                          onChange={(e) => atualizarItem(index, 'vicms', e.target.value)}
                                          inputProps={{ min: 0, step: 0.01 }}
                                          variant="outlined"
                                          helperText="valor"
                                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }}
                                        />
                                      </Grid>
                                      {/* IPI */}
                                      <Grid item xs={6} sm={3} md={2}>
                                        <TextField
                                          fullWidth size="small" label="IPI (R$)"
                                          type="number" value={item.vipi || ''}
                                          onChange={(e) => atualizarItem(index, 'vipi', e.target.value)}
                                          inputProps={{ min: 0, step: 0.01 }}
                                          variant="outlined"
                                          helperText="valor IPI"
                                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }}
                                        />
                                      </Grid>
                                      {/* PIS */}
                                      <Grid item xs={6} sm={3} md={2}>
                                        <TextField
                                          fullWidth size="small" label="PIS (R$)"
                                          type="number" value={item.vpis || ''}
                                          onChange={(e) => atualizarItem(index, 'vpis', e.target.value)}
                                          inputProps={{ min: 0, step: 0.01 }}
                                          variant="outlined"
                                          helperText="valor PIS"
                                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }}
                                        />
                                      </Grid>
                                      {/* COFINS */}
                                      <Grid item xs={6} sm={3} md={2}>
                                        <TextField
                                          fullWidth size="small" label="COFINS (R$)"
                                          type="number" value={item.vcofins || ''}
                                          onChange={(e) => atualizarItem(index, 'vcofins', e.target.value)}
                                          inputProps={{ min: 0, step: 0.01 }}
                                          variant="outlined"
                                          helperText="valor COFINS"
                                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: 'white' } }}
                                        />
                                      </Grid>
                                      {/* NCM e Unidade (somente leitura, info) */}
                                      {item._ncm && (
                                        <Grid item xs={6} sm={3} md={2}>
                                          <TextField
                                            fullWidth size="small" label="NCM"
                                            value={item._ncm}
                                            variant="outlined"
                                            InputProps={{ readOnly: true }}
                                            helperText="do XML"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#f5f5f5' } }}
                                          />
                                        </Grid>
                                      )}
                                      {item._unidade && (
                                        <Grid item xs={6} sm={3} md={1}>
                                          <TextField
                                            fullWidth size="small" label="UN"
                                            value={item._unidade}
                                            variant="outlined"
                                            InputProps={{ readOnly: true }}
                                            helperText="unidade"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#f5f5f5' } }}
                                          />
                                        </Grid>
                                      )}
                                    </Grid>
                                  </Paper>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Fade>
                      )
                    })}
                  </Stack>
                </Paper>

                {/* Resumo e ações */}
                <Paper
                  elevation={4}
                  sx={{
                    p: 3,
                    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                    color: 'white',
                    borderRadius: 3,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack spacing={0.5}>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Valor Total da Compra
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        R$ {totalCompra.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        {form.itens.length} {form.itens.length === 1 ? 'produto' : 'produtos'}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              </Box>
            )}

            {/* Aba Frete */}
            {abaAtiva === 2 && (
              <Box sx={{ p: 3 }}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShippingIcon /> Dados de Frete e Transporte
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Seção Dados Gerais */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.secondary' }}>
                        Dados Gerais
                      </Typography>
                    </Grid>
                    
                    <Grid item sm={6} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Modalidade Frete</InputLabel>
                        <Select
                          value={form.frete_modalidade || ''}
                          onChange={(e) => setForm({ ...form, frete_modalidade: e.target.value })}
                          label="Modalidade Frete"
                        >
                          <MenuItem value="">Nenhum</MenuItem>
                          <MenuItem value="0">0 - Emitente</MenuItem>
                          <MenuItem value="1">1 - Destinatário</MenuItem>
                          <MenuItem value="2">2 - Terceiros</MenuItem>
                          <MenuItem value="9">9 - Sem Frete</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Chave CT-e / MDF-e"
                        value={form.chave_cte || ''}
                        onChange={(e) => setForm({ ...form, chave_cte: e.target.value })}
                        placeholder="Chave de 44 dígitos"
                        inputProps={{ maxLength: 44 }}
                        helperText="Chave do documento de transporte"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="Transportadora"
                        value={form.transportadora_nome || ''}
                        onChange={(e) => setForm({ ...form, transportadora_nome: e.target.value })}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        label="CNPJ Transportadora"
                        value={form.transportadora_cnpj || ''}
                        onChange={(e) => setForm({ ...form, transportadora_cnpj: e.target.value })}
                        inputProps={{ maxLength: 18 }}
                      />
                    </Grid>

                    {/* Seção Veículo */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.secondary' }}>
                        Veículo
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={4} md={2}>
                      <TextField
                        fullWidth
                        label="Placa"
                        value={form.placa_veiculo || ''}
                        onChange={(e) => setForm({ ...form, placa_veiculo: e.target.value })}
                        inputProps={{ maxLength: 8 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4} md={1}>
                      <TextField
                        fullWidth
                        label="UF"
                        value={form.uf_veiculo || ''}
                        onChange={(e) => setForm({ ...form, uf_veiculo: e.target.value.toUpperCase() })}
                        inputProps={{ maxLength: 2 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4} md={2}>
                      <TextField
                        fullWidth
                        label="RNTC"
                        value={form.rntc || ''}
                        onChange={(e) => setForm({ ...form, rntc: e.target.value })}
                        helperText="Registro Nacional"
                      />
                    </Grid>

                    {/* Seção Volumes */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.secondary' }}>
                        Volumes e Pesos
                      </Typography>
                    </Grid>

                    <Grid item xs={6} sm={3} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Qtd. Volumes"
                        value={form.qtd_volumes || ''}
                        onChange={(e) => setForm({ ...form, qtd_volumes: e.target.value })}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>

                    <Grid item xs={6} sm={3} md={2}>
                      <TextField
                        fullWidth
                        label="Espécie"
                        value={form.especie || ''}
                        onChange={(e) => setForm({ ...form, especie: e.target.value })}
                        placeholder="Ex: Caixa, Fardo"
                      />
                    </Grid>

                    <Grid item xs={6} sm={3} md={2}>
                      <TextField
                        fullWidth
                        label="Marca"
                        value={form.marca || ''}
                        onChange={(e) => setForm({ ...form, marca: e.target.value })}
                      />
                    </Grid>

                    <Grid item xs={6} sm={3} md={2}>
                      <TextField
                        fullWidth
                        label="Numeração"
                        value={form.numeracao || ''}
                        onChange={(e) => setForm({ ...form, numeracao: e.target.value })}
                      />
                    </Grid>

                    <Grid item xs={6} sm={3} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Peso Líquido (kg)"
                        value={form.peso_liquido || ''}
                        onChange={(e) => setForm({ ...form, peso_liquido: e.target.value })}
                        inputProps={{ min: 0, step: 0.001 }}
                      />
                    </Grid>

                    <Grid item xs={6} sm={3} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Peso Bruto (kg)"
                        value={form.peso_bruto || ''}
                        onChange={(e) => setForm({ ...form, peso_bruto: e.target.value })}
                        inputProps={{ min: 0, step: 0.001 }}
                      />
                    </Grid>

                    {/* Seção Valores */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.secondary' }}>
                        Valores
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Valor do Frete"
                        value={form.valor_frete || ''}
                        onChange={(e) => setForm({ ...form, valor_frete: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Valor do Seguro"
                        value={form.valor_seguro || ''}
                        onChange={(e) => setForm({ ...form, valor_seguro: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Outras Despesas"
                        value={form.valor_outras || ''}
                        onChange={(e) => setForm({ ...form, valor_outras: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    {/* Seção Tributação do Frete */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'text.secondary' }}>
                        Tributação do Frete
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        fullWidth
                        label="CFOP"
                        value={form.cfop_frete || ''}
                        onChange={(e) => setForm({ ...form, cfop_frete: e.target.value })}
                        inputProps={{ maxLength: 4 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        fullWidth
                        label="CST ICMS"
                        value={form.cst_icms_frete || ''}
                        onChange={(e) => setForm({ ...form, cst_icms_frete: e.target.value })}
                        inputProps={{ maxLength: 3 }}
                      />
                    </Grid>

                    <Grid item xs={6} sm={4} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Base ICMS"
                        value={form.base_icms_frete || ''}
                        onChange={(e) => setForm({ ...form, base_icms_frete: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={6} sm={4} md={1}>
                      <TextField
                        fullWidth
                        type="number"
                        label="% ICMS"
                        value={form.perc_icms_frete || ''}
                        onChange={(e) => setForm({ ...form, perc_icms_frete: e.target.value })}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={6} sm={4} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Valor ICMS"
                        value={form.valor_icms_frete || ''}
                        onChange={(e) => setForm({ ...form, valor_icms_frete: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        fullWidth
                        label="CST PIS"
                        value={form.cst_pis_frete || ''}
                        onChange={(e) => setForm({ ...form, cst_pis_frete: e.target.value })}
                        inputProps={{ maxLength: 2 }}
                      />
                    </Grid>

                    <Grid item xs={6} sm={4} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Base PIS"
                        value={form.base_pis_frete || ''}
                        onChange={(e) => setForm({ ...form, base_pis_frete: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={6} sm={4} md={1}>
                      <TextField
                        fullWidth
                        type="number"
                        label="% PIS"
                        value={form.perc_pis_frete || ''}
                        onChange={(e) => setForm({ ...form, perc_pis_frete: e.target.value })}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={6} sm={4} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Valor PIS"
                        value={form.valor_pis_frete || ''}
                        onChange={(e) => setForm({ ...form, valor_pis_frete: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        fullWidth
                        label="CST COFINS"
                        value={form.cst_cofins_frete || ''}
                        onChange={(e) => setForm({ ...form, cst_cofins_frete: e.target.value })}
                        inputProps={{ maxLength: 2 }}
                      />
                    </Grid>

                    <Grid item xs={6} sm={4} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Base COFINS"
                        value={form.base_cofins_frete || ''}
                        onChange={(e) => setForm({ ...form, base_cofins_frete: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={6} sm={4} md={1}>
                      <TextField
                        fullWidth
                        type="number"
                        label="% COFINS"
                        value={form.perc_cofins_frete || ''}
                        onChange={(e) => setForm({ ...form, perc_cofins_frete: e.target.value })}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item xs={6} sm={4} md={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Valor COFINS"
                        value={form.valor_cofins_frete || ''}
                        onChange={(e) => setForm({ ...form, valor_cofins_frete: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            )}

            {/* Aba Observações */}
            {abaAtiva === 3 && (
              <Box sx={{ p: 3 }}>
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NoteIcon /> Observações e Informações Adicionais
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    label="Observações"
                    placeholder="Digite observações sobre esta compra..."
                    variant="outlined"
                  />
                </Paper>
              </Box>
            )}

            {/* Botões de Ação - Fixos no final */}
            <Paper
              elevation={3}
              sx={{
                p: 2,
                mt: 0,
                borderRadius: 0,
                borderTop: '2px solid #e0e0e0',
                background: 'linear-gradient(to right, #1e3c72 0%, #2a5298 100%)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2}>
                  <Tooltip title="Configurar precificação dos produtos">
                    <span>
                      <Button
                        variant="outlined"
                        onClick={() => setModalPrecificacao(true)}
                        startIcon={<TrendingUpIcon />}
                        disabled={form.itens.filter(item => item.id_produto).length === 0}
                        sx={{
                          color: 'white',
                          borderColor: 'white',
                          fontWeight: 'bold',
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          '&:hover': {
                            borderColor: 'white',
                            bgcolor: 'rgba(255,255,255,0.1)',
                          },
                        }}
                      >
                        Precificar
                      </Button>
                    </span>
                  </Tooltip>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={limparFormulario}
                    startIcon={<ClearIcon />}
                    sx={{
                      color: 'white',
                      borderColor: 'white',
                      fontWeight: 'bold',
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    Limpar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      fontWeight: 'bold',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      '&:hover': {
                        bgcolor: '#f0f0f0',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 25px rgba(0,0,0,0.4)',
                      },
                      transition: 'all 0.3s'
                    }}
                  >
                    Salvar Compra
                  </Button>
                  {editandoId && operacaoGeraFinanceiro && (
                    <Tooltip title="Gerar contas a pagar para esta compra">
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<AttachMoneyIcon />}
                        onClick={() => {
                          const compraAtual = compras.find(c => c.id_compra === editandoId);
                          if (compraAtual) {
                            setDadosFinanceiro({
                              id_compra: editandoId,
                              valor_total: parseFloat(compraAtual.valor_total) || 0,
                              numero_parcelas: 1,
                              data_vencimento: compraAtual.data_entrada || new Date().toISOString().split('T')[0],
                              forma_pagamento: 'Boleto',
                              id_fornecedor: compraAtual.id_fornecedor || null,
                              obrigatorio: true
                            });
                            setModalFinanceiro(true);
                          } else {
                            toast.error("Não foi possível encontrar os dados da compra para gerar o financeiro.");
                          }
                        }}
                        sx={{
                          fontWeight: 'bold',
                          px: 4,
                          py: 1.5,
                          borderRadius: 2,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 25px rgba(0,0,0,0.4)',
                          },
                        }}
                      >
                        Gerar Financeiro
                      </Button>
                    </Tooltip>
                  )}
                </Stack>
              </Stack>
            </Paper>
          </form>
          </DialogContent>
        </Dialog>

        {/* Lista de Compras com visual moderno - mantém mesma funcionalidade */}
        <Paper
          elevation={6}
          sx={{
            p: 2,
            borderRadius: 2,
            background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <ReceiptIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Compras Cadastradas
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Histórico de todas as compras realizadas
              </Typography>
            </Box>
          </Stack>

          {/* Seção de Filtros e Pesquisa */}
          <Paper
            elevation={3}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <FilterListIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Pesquisar e Filtrar Compras
                </Typography>
              </Stack>

              <Grid container spacing={2}>
                {/* Campo de pesquisa geral */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Pesquisa Geral"
                    placeholder="ID, Número, Fornecedor, Operação..."
                    value={filtros.pesquisa}
                    onChange={(e) => setFiltros({ ...filtros, pesquisa: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                    size="small"
                  />
                </Grid>

                {/* Filtro por fornecedor */}
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Fornecedor"
                    value={filtros.fornecedor}
                    onChange={(e) => setFiltros({ ...filtros, fornecedor: e.target.value })}
                    size="small"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {Array.isArray(fornecedores) && fornecedores.map((forn) => (
                      <MenuItem key={forn.id_fornecedor} value={forn.id_fornecedor}>
                        {forn.nome_fantasia || forn.nome_razao_social}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Filtro por operação */}
                <Grid item xs={12} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Operação"
                    value={filtros.operacao}
                    onChange={(e) => setFiltros({ ...filtros, operacao: e.target.value })}
                    size="small"
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {Array.isArray(operacoes) && operacoes.map((op) => (
                      <MenuItem key={op.id_operacao} value={op.id_operacao}>
                        {op.abreviacao || op.nome_operacao}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Data início */}
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Data Entrada - De"
                    value={filtros.dataInicio}
                    onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>

                {/* Data fim */}
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Data Entrada - Até"
                    value={filtros.dataFim}
                    onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>

                {/* Botão limpar filtros */}
                <Grid item xs={12} md={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={limparFiltros}
                    sx={{ height: '40px' }}
                  >
                    Limpar Filtros
                  </Button>
                </Grid>
              </Grid>

              {/* Contador de resultados */}
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={`${comprasFiltradas.length} ${comprasFiltradas.length === 1 ? 'compra encontrada' : 'compras encontradas'}`}
                  color="primary"
                  size="small"
                />
              </Box>
            </Stack>
          </Paper>

          {compras.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: '#f5f5f5',
                borderRadius: 2,
              }}
            >
              <ReceiptIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma compra cadastrada
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registre sua primeira compra usando o formulário acima
              </Typography>
            </Paper>
          ) : (
            <TableContainer
              component={Paper}
              elevation={2}
              sx={{
                borderRadius: 2,
                width: '100%',
                overflowX: 'auto'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{
                    backgroundColor: '#5e35b1 !important'
                  }}>
                    <TableCell sx={{ color: '#ffffff !important', fontWeight: 'bold !important', fontSize: '1rem !important', backgroundColor: '#5e35b1 !important' }}>ID</TableCell>
                    <TableCell sx={{ color: '#ffffff !important', fontWeight: 'bold !important', fontSize: '1rem !important', backgroundColor: '#5e35b1 !important' }}>Data Documento</TableCell>
                    <TableCell sx={{ color: '#ffffff !important', fontWeight: 'bold !important', fontSize: '1rem !important', backgroundColor: '#5e35b1 !important' }}>Data Entrada</TableCell>
                    <TableCell sx={{ color: '#ffffff !important', fontWeight: 'bold !important', fontSize: '1rem !important', backgroundColor: '#5e35b1 !important' }}>Fornecedor</TableCell>
                    <TableCell sx={{ color: '#ffffff !important', fontWeight: 'bold !important', fontSize: '1rem !important', backgroundColor: '#5e35b1 !important' }}>Operação</TableCell>
                    <TableCell sx={{ color: '#ffffff !important', fontWeight: 'bold !important', fontSize: '1rem !important', backgroundColor: '#5e35b1 !important' }}>Número</TableCell>
                    <TableCell sx={{ color: '#ffffff !important', fontWeight: 'bold !important', fontSize: '1rem !important', backgroundColor: '#5e35b1 !important' }}>Chave NF-e</TableCell>
                    <TableCell align="right" sx={{ color: '#ffffff !important', fontWeight: 'bold !important', fontSize: '1rem !important', backgroundColor: '#5e35b1 !important' }}>Valor Total</TableCell>
                    <TableCell align="center" sx={{ color: '#ffffff !important', fontWeight: 'bold !important', fontSize: '1rem !important', backgroundColor: '#5e35b1 !important' }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comprasFiltradas && comprasFiltradas.length > 0 ? comprasFiltradas.map((compra, idx) => (
                    <TableRow
                      key={compra.id_compra || compra.id}
                      sx={{
                        '&:hover': {
                          bgcolor: '#f5f5f5',
                          transition: 'all 0.3s'
                        },
                        bgcolor: idx % 2 === 0 ? 'white' : '#fafafa'
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={`#${compra.id_compra || compra.id}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#000' }}>
                        {compra.data_documento && typeof compra.data_documento === 'string'
                          ? new Date(compra.data_documento.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : '-'}
                      </TableCell>
                      <TableCell sx={{ color: '#000' }}>
                        {compra.data_entrada && typeof compra.data_entrada === 'string'
                          ? new Date(compra.data_entrada.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500, color: '#000' }}>
                        {compra.fornecedor_nome || compra.id_fornecedor || '-'}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Chip
                            label={compra.operacao_abreviacao || compra.operacao_nome || compra.id_operacao || '-'}
                            size="small"
                            sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold', color: '#000' }}
                          />
                          {(compra.status_nfe === 'AUTORIZADA' || compra.status_nfe === 'EMITIDA' || compra.status === 'AUTORIZADA' || compra.status === 'EMITIDA') && (
                            <Chip
                              label="🟢 AUTORIZADA"
                              size="small"
                              color="success"
                              sx={{ fontWeight: 'bold', fontSize: '0.68rem', height: '20px' }}
                            />
                          )}
                          {(compra.status_nfe === 'ERRO' || compra.status_nfe === 'REJEITADA') && (
                            <Chip
                              label="❌ REJEITADA"
                              size="small"
                              color="error"
                              sx={{ fontWeight: 'bold', fontSize: '0.68rem', height: '20px' }}
                            />
                          )}
                          {!compra.is_devolucao && (compra.origem === 'xml' || compra.xml_conteudo) && (
                            <Chip
                              label="📥 IMPORTADA"
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ fontWeight: 'bold', fontSize: '0.65rem', height: '18px' }}
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>
                        {compra.numero_nfe || compra.numero_documento || compra.numero_nota || '-'}
                      </TableCell>
                      <TableCell sx={{ color: '#000', minWidth: 240 }}>
                        {(() => {
                          const chaveExibir = compra.chave_nfe || compra.chave_nfe_referenciada || compra.dados_entrada;
                          return chaveExibir ? (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#1565c0', fontWeight: 'bold', wordBreak: 'break-all' }}>
                                {chaveExibir}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  navigator.clipboard.writeText(chaveExibir);
                                  toast.success('Chave NF-e copiada!');
                                }}
                                title="Copiar Chave NF-e"
                                sx={{ p: 0.2 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 14, color: '#1565c0' }} />
                              </IconButton>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          );
                        })()}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          R$ {parseFloat(compra.valor_total_nota || compra.valor_total || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {(() => {
                            const isDevolucao = compra.is_devolucao ||
                              (compra.operacao_nome || '').toUpperCase().includes('DEVOLU') ||
                              (compra.operacao_abreviacao || '').toUpperCase().includes('DEVOLU');

                            if (isDevolucao) {
                              const targetId = compra.id_venda || compra.id_devolucao || compra.id_compra;
                              return (
                                <>
                                  <Tooltip title="Visualizar Prévia DANFE (Conferência do Fornecedor)">
                                    <IconButton
                                      color="info"
                                      size="small"
                                      onClick={() => handleImprimirDanfeDevolucao(targetId, true)}
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Editar Nota/Devolução">
                                    <IconButton
                                      color="warning"
                                      size="small"
                                      onClick={() => editarCompra(compra)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Transmitir NF-e para SEFAZ">
                                    <IconButton
                                      color="primary"
                                      size="small"
                                      onClick={() => handleTransmitirNFeSefaz(targetId)}
                                    >
                                      <DescriptionIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Imprimir DANFE Oficial PDF">
                                    <IconButton
                                      color="success"
                                      size="small"
                                      onClick={() => handleImprimirDanfeDevolucao(targetId, false)}
                                    >
                                      <PrintIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Mais opções (Carta de Correção, XML, Excluir)">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handleMenuOpenDevolucao(e, compra)}
                                    >
                                      <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              );
                            }

                            // Linha de Compra Normal / Entrada
                            return (
                              <>
                                <Tooltip title={compra.dados_entrada || compra.chave_nfe ? 'Manifestar NF-e do Destinatário' : 'Sem chave NF-e para manifestar'}>
                                  <span>
                                    <IconButton
                                      color="info"
                                      size="small"
                                      onClick={() => abrirManifestacao(compra)}
                                      disabled={!compra.dados_entrada && !compra.chave_nfe}
                                      sx={{
                                        '&:hover': {
                                          bgcolor: 'info.light',
                                          color: 'white',
                                        },
                                      }}
                                    >
                                      <CloudSyncIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Editar compra">
                                  <IconButton
                                    color="warning"
                                    size="small"
                                    onClick={() => editarCompra(compra)}
                                    sx={{
                                      '&:hover': {
                                        bgcolor: 'warning.light',
                                        color: 'white',
                                      },
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Precificar produtos desta compra">
                                  <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => abrirPrecificacaoCompra(compra.id_compra || compra.id)}
                                    sx={{
                                      '&:hover': {
                                        bgcolor: 'primary.light',
                                        color: 'white',
                                      },
                                    }}
                                  >
                                    <TrendingUpIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Gerar Devolução desta Compra ao Fornecedor">
                                  <IconButton
                                    color="secondary"
                                    size="small"
                                    onClick={() => abrirModalDevolucaoCompra(compra)}
                                    sx={{
                                      '&:hover': {
                                        bgcolor: 'secondary.light',
                                        color: 'white',
                                      },
                                    }}
                                  >
                                    <AutorenewIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Excluir compra">
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() => excluirCompra(compra.id_compra || compra.id)}
                                    sx={{
                                      '&:hover': {
                                        bgcolor: 'error.light',
                                        color: 'white',
                                      },
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            );
                          })()}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Stack spacing={1} alignItems="center">
                          <SearchIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                          <Typography variant="body1" color="text.secondary">
                            Nenhuma compra encontrada com os filtros aplicados
                          </Typography>
                          <Button
                            size="small"
                            onClick={limparFiltros}
                            startIcon={<ClearIcon />}
                          >
                            Limpar Filtros
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Modal para Gerar Financeiro */}
        <Dialog
          open={modalFinanceiro}
          onClose={() => {
            if (dadosFinanceiro.obrigatorio) {
              alert('⚠️ ATENÇÃO: Esta operação exige geração de financeiro!\n\nVocê precisa gerar as contas a pagar antes de continuar.')
              return
            }
            setModalFinanceiro(false)
          }}
          disableEscapeKeyDown={dadosFinanceiro.obrigatorio}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'linear-gradient(to bottom, #ffffff 0%, #f9f9f9 100%)'
            }
          }}
        >
          <DialogTitle sx={{
            background: dadosFinanceiro.obrigatorio 
              ? 'linear-gradient(135deg, #FF5722 0%, #D32F2F 100%)'
              : 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <AttachMoneyIcon />
            {dadosFinanceiro.obrigatorio ? '⚠️ Gerar Contas a Pagar (OBRIGATÓRIO)' : 'Gerar Contas a Pagar'}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert 
                  severity={dadosFinanceiro.obrigatorio ? "error" : "info"} 
                  sx={{ mb: 2 }}
                >
                  {dadosFinanceiro.obrigatorio 
                    ? `⚠️ OBRIGATÓRIO: Configure as parcelas para a compra #${dadosFinanceiro.id_compra}`
                    : `Configure as parcelas para a compra #${dadosFinanceiro.id_compra}`
                  }
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Valor Total"
                  value={`R$ ${dadosFinanceiro.valor_total.toFixed(2)}`}
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: 'grey.100' }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Número de Parcelas"
                  value={dadosFinanceiro.numero_parcelas}
                  onChange={(e) => setDadosFinanceiro({ ...dadosFinanceiro, numero_parcelas: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1, max: 48 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor por Parcela"
                  value={`R$ ${(dadosFinanceiro.valor_total / dadosFinanceiro.numero_parcelas).toFixed(2)}`}
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: 'grey.100' }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Primeiro Vencimento"
                  value={dadosFinanceiro.data_vencimento}
                  onChange={(e) => setDadosFinanceiro({ ...dadosFinanceiro, data_vencimento: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Forma de Pagamento"
                  value={dadosFinanceiro.forma_pagamento}
                  onChange={(e) => setDadosFinanceiro({ ...dadosFinanceiro, forma_pagamento: e.target.value })}
                >
                  <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                  <MenuItem value="PIX">PIX</MenuItem>
                  <MenuItem value="Cartéo de Crédito">Cartéo de Crédito</MenuItem>
                  <MenuItem value="Cartéo de Débito">Cartéo de Débito</MenuItem>
                  <MenuItem value="Boleto">Boleto</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                  <MenuItem value="Transferência">Transferência</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Alert severity={dadosFinanceiro.obrigatorio ? "error" : "warning"}>
                  {dadosFinanceiro.obrigatorio 
                    ? `⚠️ Serão geradas ${dadosFinanceiro.numero_parcelas} conta(s) a pagar com vencimento mensal. OBRIGATÓRIO para esta operação!`
                    : `Serão geradas ${dadosFinanceiro.numero_parcelas} conta(s) a pagar com vencimento mensal.`
                  }
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            {!dadosFinanceiro.obrigatorio && (
              <Button
                onClick={() => setModalFinanceiro(false)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                Cancelar
              </Button>
            )}
            {dadosFinanceiro.obrigatorio && (
              <Typography variant="caption" color="error" sx={{ flex: 1, px: 2 }}>
                ⚠️ Não é possível cancelar - geração obrigatória
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={gerarFinanceiro}
              startIcon={<AttachMoneyIcon />}
              sx={{
                background: dadosFinanceiro.obrigatorio
                  ? 'linear-gradient(135deg, #FF5722 0%, #D32F2F 100%)'
                  : 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  background: dadosFinanceiro.obrigatorio
                    ? 'linear-gradient(135deg, #E64A19 0%, #B71C1C 100%)'
                    : 'linear-gradient(135deg, #388E3C 0%, #1B5E20 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                },
                transition: 'all 0.3s'
              }}
            >
              Gerar Contas a Pagar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Cadastro de Fornecedor */}
        <Dialog
          open={modalFornecedor}
          onClose={() => setModalFornecedor(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'linear-gradient(to bottom, #ffffff 0%, #f9f9f9 100%)'
            }
          }}
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <BusinessIcon />
            Cadastrar Novo Fornecedor
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Nome / Razão Social"
                  value={novoFornecedor.nome_razao_social}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, nome_razao_social: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome Fantasia"
                  value={novoFornecedor.nome_fantasia}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, nome_fantasia: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    required
                    label="CPF / CNPJ"
                    value={novoFornecedor.cpf_cnpj}
                    onChange={(e) => setNovoFornecedor({ ...novoFornecedor, cpf_cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                  <Button
                    variant="outlined"
                    onClick={() => buscarCNPJ(novoFornecedor.cpf_cnpj)}
                    disabled={!novoFornecedor.cpf_cnpj || novoFornecedor.cpf_cnpj.replace(/\D/g, '').length !== 14}
                    sx={{ minWidth: '40px' }}
                    title="Buscar CNPJ"
                  >
                    <SearchIcon />
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Inscrição Estadual"
                  value={novoFornecedor.inscricao_estadual}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, inscricao_estadual: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="CEP"
                    value={novoFornecedor.cep}
                    onChange={(e) => setNovoFornecedor({ ...novoFornecedor, cep: e.target.value })}
                    placeholder="00000-000"
                  />
                  <Button
                    variant="outlined"
                    onClick={() => buscarCEP(novoFornecedor.cep)}
                    disabled={!novoFornecedor.cep || novoFornecedor.cep.replace(/\D/g, '').length !== 8}
                    sx={{ minWidth: '40px' }}
                    title="Buscar CEP"
                  >
                    <SearchIcon />
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Endereço"
                  value={novoFornecedor.endereco}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, endereco: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Número"
                  value={novoFornecedor.numero}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, numero: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Bairro"
                  value={novoFornecedor.bairro}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, bairro: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={novoFornecedor.cidade}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, cidade: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Estado"
                  value={novoFornecedor.estado}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, estado: e.target.value })}
                  inputProps={{ maxLength: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={novoFornecedor.telefone}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, telefone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="WhatsApp"
                  value={novoFornecedor.whatsapp}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, whatsapp: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={novoFornecedor.email}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Limite de Crédito"
                  type="number"
                  value={novoFornecedor.limite_credito}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, limite_credito: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Data de Nascimento"
                  type="date"
                  value={novoFornecedor.data_nascimento}
                  onChange={(e) => setNovoFornecedor({ ...novoFornecedor, data_nascimento: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setModalFornecedor(false)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={salvarNovoFornecedor}
              startIcon={<SaveIcon />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #653a8f 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                },
                transition: 'all 0.3s'
              }}
            >
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Cadastro de Produto */}
        <Dialog
          open={modalProduto}
          onClose={() => {
            setModalProduto(false);
            setItemIndexCadastro(null);
            // Limpar formulário ao fechar
            setNovoProduto({
              codigo_produto: '',
              nome_produto: '',
              descricao: '',
              unidade_medida: 'UN',
              id_grupo: '',
              marca: '',
              categoria: '',
              referencia: '',
              codigo_barras: '',
              classificacao: '',
              ncm: '',
              tributacao_info: '',
              observacoes: '',
              imagem_url: ''
            });
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'linear-gradient(to bottom, #ffffff 0%, #f9f9f9 100%)'
            }
          }}
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <InventoryIcon />
            Cadastrar Novo Produto
          </DialogTitle>
          <DialogContent>
            {novoProduto.codigo_produto && (
              <Alert
                severity="info"
                sx={{
                  mb: 2,
                  mt: 1,
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
                icon={<CheckCircleIcon />}
              >
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  📋 Dados preenchidos automaticamente do XML
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Código: {novoProduto.codigo_produto} | NCM: {novoProduto.ncm || 'N/A'}
                </Typography>
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    required
                    label="Código do Produto"
                    value={novoProduto.codigo_produto}
                    onChange={(e) => setNovoProduto({ ...novoProduto, codigo_produto: e.target.value })}
                    placeholder="Ex: PROD001"
                    helperText="Use código do fornecedor ou gere automático"
                  />
                  <Tooltip title="Gerar código automático sequencial">
                    <IconButton
                      onClick={() => {
                        // Gera código baseado no último produto cadastrado
                        if (produtos.length > 0) {
                          // Pega os códigos numéricos existentes
                          const codigosNumericos = produtos
                            .map(p => {
                              const match = p.codigo_produto.match(/(\d+)$/)
                              return match ? parseInt(match[1]) : 0
                            })
                            .filter(n => n > 0)
                          
                          const proximoNumero = codigosNumericos.length > 0 
                            ? Math.max(...codigosNumericos) + 1 
                            : 1
                          
                          const novoCodigo = `PROD${String(proximoNumero).padStart(4, '0')}`
                          setNovoProduto({ ...novoProduto, codigo_produto: novoCodigo })
                        } else {
                          setNovoProduto({ ...novoProduto, codigo_produto: 'PROD0001' })
                        }
                      }}
                      sx={{ 
                        bgcolor: 'secondary.main', 
                        color: 'white',
                        '&:hover': { bgcolor: 'secondary.dark' },
                        height: '56px'
                      }}
                    >
                      <AutorenewIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Nome do Produto"
                  value={novoProduto.nome_produto}
                  onChange={(e) => setNovoProduto({ ...novoProduto, nome_produto: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Código de Barras / EAN"
                  value={novoProduto.codigo_barras || ''}
                  onChange={(e) => setNovoProduto({ ...novoProduto, codigo_barras: e.target.value })}
                  placeholder="Ex: 7898357417224"
                  helperText="Código EAN/GTIN do produto"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Referência"
                  value={novoProduto.referencia || ''}
                  onChange={(e) => setNovoProduto({ ...novoProduto, referencia: e.target.value })}
                  placeholder="Ex: REF001"
                  helperText="Código de referência alternativo"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Localização"
                  value={novoProduto.localizacao || ''}
                  onChange={(e) => setNovoProduto({ ...novoProduto, localizacao: e.target.value })}
                  placeholder="Ex: Prateleira A1"
                  helperText="Localização física no estoque"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  multiline
                  rows={2}
                  value={novoProduto.descricao}
                  onChange={(e) => setNovoProduto({ ...novoProduto, descricao: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      value={novoProduto.categoria || ''}
                      onChange={(e) => setNovoProduto({ ...novoProduto, categoria: e.target.value })}
                      label="Categoria"
                    >
                      <MenuItem value="">Nenhuma</MenuItem>
                      {categorias.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Tooltip title="Criar nova categoria">
                    <IconButton
                      onClick={() => {
                        setNovaCategoriaInput('')
                        setOpenCategoriaDialog(true)
                      }}
                      color="primary"
                      sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Marca</InputLabel>
                    <Select
                      value={novoProduto.marca || ''}
                      onChange={(e) => setNovoProduto({ ...novoProduto, marca: e.target.value })}
                      label="Marca"
                    >
                      <MenuItem value="">Nenhuma</MenuItem>
                      {marcas.map((marca) => (
                        <MenuItem key={marca} value={marca}>{marca}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Tooltip title="Criar nova marca">
                    <IconButton
                      onClick={() => {
                        setNovaMarcaInput('')
                        setOpenMarcaDialog(true)
                      }}
                      color="primary"
                      sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Unidade de Medida"
                  value={novoProduto.unidade_medida}
                  onChange={(e) => setNovoProduto({ ...novoProduto, unidade_medida: e.target.value })}
                >
                  <MenuItem value="UN">Unidade (UN)</MenuItem>
                  <MenuItem value="KG">Quilograma (KG)</MenuItem>
                  <MenuItem value="G">Grama (G)</MenuItem>
                  <MenuItem value="L">Litro (L)</MenuItem>
                  <MenuItem value="ML">Mililitro (ML)</MenuItem>
                  <MenuItem value="M">Metro (M)</MenuItem>
                  <MenuItem value="CM">Centímetro (CM)</MenuItem>
                  <MenuItem value="M2">Metro Quadrado (M²)</MenuItem>
                  <MenuItem value="M3">Metro Cúbico (M³)</MenuItem>
                  <MenuItem value="CX">Caixa (CX)</MenuItem>
                  <MenuItem value="PCT">Pacote (PCT)</MenuItem>
                  <MenuItem value="FD">Fardo (FD)</MenuItem>
                  <MenuItem value="PC">Peça (PC)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Grupo do Produto *"
                  value={novoProduto.id_grupo}
                  onChange={(e) => setNovoProduto({ ...novoProduto, id_grupo: e.target.value })}
                >
                  <MenuItem value="">Selecione...</MenuItem>
                  {grupos && grupos.length > 0 ? (
                    grupos.map((grupo) => (
                      <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                        {grupo.nome_grupo}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>Nenhum grupo cadastrado</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="NCM (Código Fiscal)"
                  value={novoProduto.ncm}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setNovoProduto({ ...novoProduto, ncm: value });
                  }}
                  placeholder="Ex: 84713000"
                  inputProps={{ maxLength: 8 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Classificação"
                  value={novoProduto.classificacao}
                  onChange={(e) => setNovoProduto({ ...novoProduto, classificacao: e.target.value })}
                  helperText="Tipo/classificação do produto"
                >
                  <MenuItem value="">Nenhuma</MenuItem>
                  <MenuItem value="REVENDA">Revenda</MenuItem>
                  <MenuItem value="SERVICO">Serviço</MenuItem>
                  <MenuItem value="CONSUMO">Consumo</MenuItem>
                  <MenuItem value="INSUMO">Insumo</MenuItem>
                  <MenuItem value="IMOBILIZADO">Imobilizado</MenuItem>
                  <MenuItem value="MATERIA-PRIMA">Matéria-Prima</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="NCM (Código Fiscal)"
                  value={novoProduto.ncm}
                  helperText="Nomenclatura Comum do Mercosul (8 dígitos)"
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" icon={<CheckCircleIcon />} sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                    📋 Preenchimento Automático
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Os campos foram preenchidos com dados do XML. Revise e ajuste se necessário antes de salvar.
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL da Imagem"
                  value={novoProduto.imagem_url}
                  onChange={(e) => setNovoProduto({ ...novoProduto, imagem_url: e.target.value })}
                  placeholder="https://exemplo.com/imagem.jpg"
                  helperText="URL da foto do produto (opcional)"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => {
                setModalProduto(false);
                setItemIndexCadastro(null);
              }}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={salvarNovoProduto}
              startIcon={<SaveIcon />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #653a8f 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                },
                transition: 'all 0.3s'
              }}
            >
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para Criar Nova Categoria */}
        <Dialog
          open={openCategoriaDialog}
          onClose={() => setOpenCategoriaDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Criar Nova Categoria</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              autoFocus
              margin="dense"
              label="Nome da Categoria"
              value={novaCategoriaInput}
              onChange={(e) => setNovaCategoriaInput(e.target.value)}
              placeholder="Ex: Eletrônicos, Alimentos, Construção"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && novaCategoriaInput.trim()) {
                  if (!categorias.includes(novaCategoriaInput.trim())) {
                    setCategorias([...categorias, novaCategoriaInput.trim()].sort())
                    setNovoProduto({ ...novoProduto, categoria: novaCategoriaInput.trim() })
                  }
                  setOpenCategoriaDialog(false)
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCategoriaDialog(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (novaCategoriaInput.trim()) {
                  if (!categorias.includes(novaCategoriaInput.trim())) {
                    setCategorias([...categorias, novaCategoriaInput.trim()].sort())
                    setNovoProduto({ ...novoProduto, categoria: novaCategoriaInput.trim() })
                  }
                  setOpenCategoriaDialog(false)
                }
              }}
              disabled={!novaCategoriaInput.trim()}
            >
              Criar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para Criar Nova Marca */}
        <Dialog
          open={openMarcaDialog}
          onClose={() => setOpenMarcaDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Criar Nova Marca</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              autoFocus
              margin="dense"
              label="Nome da Marca"
              value={novaMarcaInput}
              onChange={(e) => setNovaMarcaInput(e.target.value)}
              placeholder="Ex: Samsung, Nestlé, Lorenzetti"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && novaMarcaInput.trim()) {
                  if (!marcas.includes(novaMarcaInput.trim())) {
                    setMarcas([...marcas, novaMarcaInput.trim()].sort())
                    setNovoProduto({ ...novoProduto, marca: novaMarcaInput.trim() })
                  }
                  setOpenMarcaDialog(false)
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenMarcaDialog(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (novaMarcaInput.trim()) {
                  if (!marcas.includes(novaMarcaInput.trim())) {
                    setMarcas([...marcas, novaMarcaInput.trim()].sort())
                    setNovoProduto({ ...novoProduto, marca: novaMarcaInput.trim() })
                  }
                  setOpenMarcaDialog(false)
                }
              }}
              disabled={!novaMarcaInput.trim()}
            >
              Criar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Precificação */}
        <PrecificacaoDialog
          open={modalPrecificacao}
          onClose={() => {
            setModalPrecificacao(false)
            setCompraSelecionadaPrecificacao(null)
          }}
          itens={compraSelecionadaPrecificacao || form.itens.filter(item => item.id_produto).map(item => {
            const produto = produtos.find(p => p.id_produto === parseInt(item.id_produto))
            return {
              ...item,
              nome_produto: produto?.nome_produto || 'Produto não encontrado'
            }
          })}
          onAplicar={(itensAtualizados) => {
            console.log('Precificação aplicada:', itensAtualizados)
            setSucesso('✅ Precificação aplicada com sucesso!')
            setTimeout(() => setSucesso(null), 3000)
            setCompraSelecionadaPrecificacao(null)
          }}
          axiosInstance={axiosInstance}
        />

        {/* Modal de Solicitação de Aprovação */}
        <SolicitarAprovacaoModal
          open={modalAprovacao}
          onClose={() => setModalAprovacao(false)}
          tipoSolicitacao="compra"
          dados={dadosAprovacao}
          onSuccess={handleAprovacaoSucesso}
          titulo="Aprovação Necessária - Nova Compra"
          mensagemMotivo={dadosAprovacao?.motivos_aprovacao || 'Esta compra requer aprovação do supervisor'}
        />

        {/* Dialog: Consultar NF-es da SEFAZ */}
        <Dialog
          open={dialogNFesSeafaz}
          onClose={() => setDialogNFesSeafaz(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: '#0288d1', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudSyncIcon />
            NF-es Recebidas da SEFAZ
          </DialogTitle>
          <DialogContent sx={{ mt: 1, p: 2 }}>
            {consultandoNFes && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

            {!consultandoNFes && nfesSeafaz.length === 0 && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Nenhuma NF-e encontrada na consulta. Verifique o certificado digital e tente novamente.
              </Alert>
            )}

            {nfesSeafaz.length > 0 && (
              <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>NSU</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>NF / Série</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Emitente</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Chave NF-e</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Emissão</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Valor</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Situação</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ação</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {nfesSeafaz.map((nfe, idx) => {
                      const jaImportada = compras.some(c => c.dados_entrada === nfe.chave_nfe)
                      return (
                      <TableRow key={nfe.nsu || idx} hover sx={{
                        bgcolor: jaImportada ? '#e8f5e9' : '#ffebee',
                        borderLeft: `4px solid ${jaImportada ? '#4caf50' : '#f44336'}`,
                      }}>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{nfe.nsu}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {nfe.numero_nfe || '-'}{nfe.serie ? `/${nfe.serie}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{nfe.emitente_nome || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {nfe.emitente_cnpj || ''}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 140 }}>
                          <Tooltip title={nfe.chave_nfe || ''}>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
                              {nfe.chave_nfe ? nfe.chave_nfe.slice(0, 16) + '…' : '-'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {nfe.data_emissao
                              ? new Date(nfe.data_emissao).toLocaleDateString('pt-BR')
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            R$ {(parseFloat(nfe.valor_nfe) || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Chip
                              label={nfe.situacao || '?'}
                              size="small"
                              color={nfe.situacao === 'Autorizada' ? 'success' : nfe.situacao === 'Cancelada' ? 'error' : 'default'}
                            />
                            <Chip
                              label={jaImportada ? '✓ Importada' : 'Pendente'}
                              size="small"
                              color={jaImportada ? 'success' : 'error'}
                              variant="outlined"
                            />
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={
                            jaImportada ? 'Esta NF-e já foi importada no sistema' :
                            nfe.situacao !== 'Autorizada' ? 'Somente NF-es Autorizadas podem ser importadas' :
                            nfe.xml ? 'Importar no cadastro de compra' : 'XML não disponível (resumo)'
                          }>
                            <span>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={importandoNsuSeafaz === nfe.nsu ? null : jaImportada ? null : <UploadFileIcon />}
                                onClick={() => importarNFeFromSeafaz(nfe)}
                                disabled={!!importandoNsuSeafaz || jaImportada || nfe.situacao !== 'Autorizada' || !nfe.xml}
                                sx={{
                                  bgcolor: jaImportada ? '#757575' : '#2e7d32',
                                  '&:hover': { bgcolor: jaImportada ? '#616161' : '#1b5e20' },
                                  '&.Mui-disabled': { bgcolor: jaImportada ? '#bdbdbd' : undefined, color: '#fff' },
                                  textTransform: 'none',
                                  fontWeight: 'bold',
                                  minWidth: 110,
                                }}
                              >
                                {importandoNsuSeafaz === nfe.nsu ? 'Importando…' : jaImportada ? 'Já importada' : 'Importar NF-e'}
                              </Button>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {maxNsuSeafaz && !consultandoNFes && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<CloudSyncIcon />}
                  onClick={() => { setNfesSeafaz([]); consultarNFesSeafaz(); }}
                  disabled={consultandoNFes}
                >
                  Carregar mais (a partir do NSU {maxNsuSeafaz})
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CloudSyncIcon />}
              onClick={() => { setNfesSeafaz([]); consultarNFesSeafaz(); }}
              disabled={consultandoNFes}
            >
              {consultandoNFes ? 'Consultando…' : 'Atualizar'}
            </Button>
            <Button onClick={() => setDialogNFesSeafaz(false)}>
              Fechar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de Manifestação do Destinatário */}
        <Dialog
          open={dialogManifestacao}
          onClose={fecharManifestacao}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ bgcolor: '#1565c0', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudSyncIcon />
            Manifestação do Destinatário
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {compraParaManif && (
              <Stack spacing={2}>
                <Alert severity="info" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Fornecedor:</strong> {compraParaManif.fornecedor_nome || '-'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', mt: 0.5, wordBreak: 'break-all' }}>
                    <strong>Chave NF-e:</strong> {compraParaManif.dados_entrada}
                  </Typography>
                </Alert>

                <TextField
                  select
                  fullWidth
                  required
                  label="Tipo de Evento *"
                  value={tipoEventoManif}
                  onChange={(e) => { setTipoEventoManif(e.target.value); setJustificativaManif('') }}
                >
                  <MenuItem value="">Selecione...</MenuItem>
                  <MenuItem value="210210">210210 – Ciência da Operação</MenuItem>
                  <MenuItem value="210200">210200 – Confirmação da Operação</MenuItem>
                  <MenuItem value="210240">210240 – Desconhecimento da Operação</MenuItem>
                  <MenuItem value="210220">210220 – Operação não Realizada</MenuItem>
                </TextField>

                {tipoEventoManif === '210220' && (
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    required
                    label="Justificativa (mín. 15 caracteres) *"
                    value={justificativaManif}
                    onChange={(e) => setJustificativaManif(e.target.value)}
                    helperText={`${justificativaManif.length}/15 mínimo`}
                  />
                )}

                {resultadoManif && (
                  <Alert severity={resultadoManif.sucesso ? 'success' : 'error'}>
                    {resultadoManif.sucesso ? (
                      <>
                        <Typography variant="body2"><strong>✅ Manifestação enviada com sucesso!</strong></Typography>
                        {resultadoManif.numero_protocolo && (
                          <Typography variant="body2">Protocolo: {resultadoManif.numero_protocolo}</Typography>
                        )}
                        {resultadoManif.x_motivo && (
                          <Typography variant="body2">Motivo: {resultadoManif.x_motivo}</Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2">❌ {resultadoManif.x_motivo}</Typography>
                    )}
                  </Alert>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={fecharManifestacao} disabled={enviandoManif}>
              Fechar
            </Button>
            {!resultadoManif && (
              <Button
                variant="contained"
                onClick={enviarManifestacao}
                disabled={enviandoManif || !tipoEventoManif}
                startIcon={enviandoManif ? null : <CloudSyncIcon />}
                sx={{ bgcolor: '#1565c0' }}
              >
                {enviandoManif ? 'Enviando...' : 'Enviar Manifestação'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

      {/* Dialog de Customização Financeira (inline antes de salvar compra) */}
      <Dialog
        open={openDialogFinanceiroCustomizado}
        onClose={() => setOpenDialogFinanceiroCustomizado(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachMoneyIcon />
          Gerar Financeiro - Compra
        </DialogTitle>
        <DialogContent dividers sx={{ mt: 1 }}>
          {dadosCompraTemporaria && (
            <Stack spacing={3}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Fornecedor:</strong> {fornecedores.find(f => f.id_fornecedor === parseInt(form.id_fornecedor))?.nome_razao_social || 'Não especificado'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <strong>Valor Total da Compra:</strong> R$ {dadosCompraTemporaria.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Número de Parcelas"
                    type="number"
                    value={dadosFinanceiroConfig.numero_parcelas}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      setDadosFinanceiroConfig(prev => ({ ...prev, numero_parcelas: val }));
                      recalcularParcelasCustomizadas(
                        val,
                        dadosFinanceiroConfig.data_vencimento_inicial,
                        dadosFinanceiroConfig.id_conta_bancaria_padrao,
                        dadosCompraTemporaria.valor_total
                      );
                    }}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    select
                    label="Forma de Pagamento"
                    value={dadosFinanceiroConfig.forma_pagamento}
                    onChange={(e) => setDadosFinanceiroConfig(prev => ({ ...prev, forma_pagamento: e.target.value }))}
                  >
                    <MenuItem value="Boleto">Boleto</MenuItem>
                    <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                    <MenuItem value="Cartao_Credito">Cartão de Crédito</MenuItem>
                    <MenuItem value="Cartao_Debito">Cartão de Débito</MenuItem>
                    <MenuItem value="Pix">Pix</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                    <MenuItem value="Transferencia">Transferência Bancária</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Vencimento 1ª Parcela"
                    InputLabelProps={{ shrink: true }}
                    value={dadosFinanceiroConfig.data_vencimento_inicial}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDadosFinanceiroConfig(prev => ({ ...prev, data_vencimento_inicial: val }));
                      recalcularParcelasCustomizadas(
                        dadosFinanceiroConfig.numero_parcelas,
                        val,
                        dadosFinanceiroConfig.id_conta_bancaria_padrao,
                        dadosCompraTemporaria.valor_total
                      );
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Conta Bancária Geral</InputLabel>
                    <Select
                      value={dadosFinanceiroConfig.id_conta_bancaria_padrao}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDadosFinanceiroConfig(prev => ({ ...prev, id_conta_bancaria_padrao: val }));
                        // Atualiza a conta de todas as parcelas de uma só vez
                        setParcelasFinanceiroCustomizado(prev =>
                          prev.map(p => ({ ...p, id_conta_bancaria: val }))
                        );
                      }}
                      label="Conta Bancária Geral"
                    >
                      <MenuItem value=""><em>Selecione...</em></MenuItem>
                      {contasBancarias.map((c) => (
                        <MenuItem key={c.id_conta_bancaria} value={c.id_conta_bancaria}>
                          {c.nome_conta} ({c.nome_banco})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider />

              <Typography variant="subtitle1" fontWeight="bold">Detalhamento das Parcelas</Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>Parcela</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Valor da Parcela (R$)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Data de Vencimento</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Conta Bancária</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parcelasFinanceiroCustomizado.map((parcela, idx) => (
                      <TableRow key={parcela.numero_parcela}>
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" fontWeight="bold">{parcela.numero_parcela}</Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={parcela.valor_parcela}
                            onChange={(e) => {
                              const novosValores = [...parcelasFinanceiroCustomizado];
                              novosValores[idx].valor_parcela = e.target.value;
                              setParcelasFinanceiroCustomizado(novosValores);
                            }}
                            sx={{ width: 140 }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="date"
                            value={parcela.data_vencimento}
                            onChange={(e) => {
                              const novosValores = [...parcelasFinanceiroCustomizado];
                              novosValores[idx].data_vencimento = e.target.value;
                              setParcelasFinanceiroCustomizado(novosValores);
                            }}
                            sx={{ width: 160 }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={parcela.id_conta_bancaria || ''}
                              onChange={(e) => {
                                const novosValores = [...parcelasFinanceiroCustomizado];
                                novosValores[idx].id_conta_bancaria = e.target.value;
                                setParcelasFinanceiroCustomizado(novosValores);
                              }}
                            >
                              <MenuItem value=""><em>Selecione...</em></MenuItem>
                              {contasBancarias.map((c) => (
                                <MenuItem key={c.id_conta_bancaria} value={c.id_conta_bancaria}>
                                  {c.nome_conta}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Comparador de soma */}
              {(() => {
                const totalCompra = parseFloat(dadosCompraTemporaria.valor_total) || 0;
                const somaParcelas = parcelasFinanceiroCustomizado.reduce(
                  (sum, p) => sum + (parseFloat(p.valor_parcela) || 0),
                  0
                );
                const diferenca = parseFloat((totalCompra - somaParcelas).toFixed(2));
                const bateu = Math.abs(diferenca) < 0.01;

                return (
                  <Box sx={{ p: 2, bgcolor: bateu ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)', borderRadius: 1 }}>
                    <Grid container justifyContent="space-between" alignItems="center">
                      <Grid item>
                        <Typography variant="body2" sx={{ color: bateu ? '#2e7d32' : '#c62828', fontWeight: 'bold' }}>
                          Soma das Parcelas: R$ {somaParcelas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                        {!bateu && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#c62828' }}>
                            Divergência: R$ {diferenca > 0 ? `Falta R$ ${diferenca.toFixed(2)}` : `Sobra R$ ${Math.abs(diferenca).toFixed(2)}`}
                          </Typography>
                        )}
                      </Grid>
                      {!bateu && (
                        <Grid item>
                          <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            onClick={ajustarDiferencaUltimaParcela}
                            sx={{ fontWeight: 'bold' }}
                          >
                            Ajustar na Última Parcela
                          </Button>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                );
              })()}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpenDialogFinanceiroCustomizado(false)} variant="outlined">
            Voltar e Editar Compra
          </Button>
          {(() => {
            const totalCompra = parseFloat(dadosCompraTemporaria?.valor_total) || 0;
            const somaParcelas = parcelasFinanceiroCustomizado.reduce(
              (sum, p) => sum + (parseFloat(p.valor_parcela) || 0),
              0
            );
            const bateu = Math.abs(totalCompra - somaParcelas) < 0.01;

            return (
              <Button
                variant="contained"
                color="success"
                onClick={confirmarESalvarCompraComFinanceiro}
                disabled={!bateu}
                startIcon={<SaveIcon />}
                sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
              >
                Confirmar e Salvar Compra
              </Button>
            );
          })()}
        </DialogActions>
      </Dialog>

      {/* Dialog de Cadastro de Novo Produto (Botão +) */}
      <Dialog 
        open={openDialogNovoProduto} 
        onClose={() => setOpenDialogNovoProduto(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">Novo Produto</Typography>
          <IconButton onClick={() => setOpenDialogNovoProduto(false)}>
            <ClearIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Sistema de Abas */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={abaAtivaDialogProduto} 
              onChange={(e, newValue) => setAbaAtivaDialogProduto(newValue)} 
              variant="scrollable" 
              scrollButtons="auto"
            >
              <Tab label="Dados Básicos" />
              <Tab label="Classificação" />
              <Tab label="Tributação" />
              <Tab label="Preços e Depósitos" icon={<WarehouseIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* ABA 0: Dados Básicos */}
          {abaAtivaDialogProduto === 0 && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Código (Automático)"
                value={dadosProdutoNovo.codigo}
                onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, codigo: e.target.value })}
                placeholder="Será gerado ao salvar"
                helperText="O código será gerado automaticamente pelo sistema"
              />

              <TextField
                fullWidth
                required
                label="Nome do Produto *"
                value={dadosProdutoNovo.nome}
                onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, nome: e.target.value })}
              />

              <TextField
                fullWidth
                label="GTIN / Código de Barras (EAN)"
                value={dadosProdutoNovo.gtin}
                onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, gtin: e.target.value })}
                placeholder="Ex: 7891234567890"
                helperText="Código de barras EAN-8, EAN-13 ou deixe vazio para SEM GTIN"
                inputProps={{ maxLength: 14 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl fullWidth>
                      <InputLabel>Categoria</InputLabel>
                      <Select
                        value={dadosProdutoNovo.categoria || ''}
                        onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, categoria: e.target.value })}
                        label="Categoria"
                      >
                        <MenuItem value=""><em>Nenhuma</em></MenuItem>
                        {[...new Set([...categorias, ...(dadosProdutoNovo.categoria ? [dadosProdutoNovo.categoria] : [])])].sort().map((cat) => (
                          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      onClick={() => { setNovaCategoriaInput(''); setOpenCategoriaDialog(true); }}
                      sx={{ minWidth: 'auto', p: 1.5 }}
                      title="Criar nova categoria"
                    >
                      <AddIcon />
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Unidade de Medida</InputLabel>
                    <Select
                      value={dadosProdutoNovo.unidade_medida}
                      onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, unidade_medida: e.target.value })}
                      label="Unidade de Medida"
                    >
                      <MenuItem value="UN">Unidade (UN)</MenuItem>
                      <MenuItem value="KG">Quilograma (KG)</MenuItem>
                      <MenuItem value="G">Grama (G)</MenuItem>
                      <MenuItem value="L">Litro (L)</MenuItem>
                      <MenuItem value="ML">Mililitro (ML)</MenuItem>
                      <MenuItem value="M">Metro (M)</MenuItem>
                      <MenuItem value="CM">Centímetro (CM)</MenuItem>
                      <MenuItem value="M2">Metro² (M2)</MenuItem>
                      <MenuItem value="M3">Metro³ (M3)</MenuItem>
                      <MenuItem value="CX">Caixa (CX)</MenuItem>
                      <MenuItem value="PCT">Pacote (PCT)</MenuItem>
                      <MenuItem value="FD">Fardo (FD)</MenuItem>
                      <MenuItem value="PC">Peça (PC)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Gênero</InputLabel>
                    <Select
                      value={dadosProdutoNovo.genero || ''}
                      onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, genero: e.target.value })}
                      label="Gênero"
                    >
                      <MenuItem value="">Não especificado</MenuItem>
                      <MenuItem value="feminino">Feminino</MenuItem>
                      <MenuItem value="masculino">Masculino</MenuItem>
                      <MenuItem value="unissex">Unissex</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Referência"
                    value={dadosProdutoNovo.referencia || ''}
                    onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, referencia: e.target.value })}
                    placeholder="Ex: REF001"
                    helperText="Código de referência alternativo"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Localização"
                    value={dadosProdutoNovo.localizacao || ''}
                    onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, localizacao: e.target.value })}
                    placeholder="Ex: Prateleira A1"
                    helperText="Localização física no estoque"
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="URL da Imagem"
                value={dadosProdutoNovo.imagem_url || ''}
                onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, imagem_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
                InputProps={{
                  startAdornment: <ImageIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              {dadosProdutoNovo.imagem_url && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Avatar
                    src={dadosProdutoNovo.imagem_url}
                    sx={{ width: 80, height: 80, bgcolor: 'grey.200' }}
                    variant="rounded"
                  >
                    <ImageIcon />
                  </Avatar>
                </Box>
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descrição"
                value={dadosProdutoNovo.descricao}
                onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, descricao: e.target.value })}
              />
            </Stack>
          )}

          {/* ABA 1: Classificação */}
          {abaAtivaDialogProduto === 1 && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl fullWidth required>
                      <InputLabel>Grupo de Produto</InputLabel>
                      <Select
                        value={dadosProdutoNovo.id_grupo || ''}
                        onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, id_grupo: e.target.value })}
                        label="Grupo de Produto"
                      >
                        <MenuItem value=""><em>Selecione...</em></MenuItem>
                        {grupos.map((grupo) => (
                          <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                            {grupo.nome_grupo}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      onClick={() => { setNovoGrupo({ nome: '', descricao: '' }); setOpenGrupoDialog(true); }}
                      sx={{ minWidth: 'auto', p: 1.5 }}
                      title="Criar novo grupo"
                    >
                      <AddIcon />
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControl fullWidth>
                      <InputLabel>Marca</InputLabel>
                      <Select
                        value={dadosProdutoNovo.marca || ''}
                        onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, marca: e.target.value })}
                        label="Marca"
                      >
                        <MenuItem value=""><em>Nenhuma</em></MenuItem>
                        {[...new Set([...marcas, ...(dadosProdutoNovo.marca ? [dadosProdutoNovo.marca] : [])])].sort().map((marca) => (
                          <MenuItem key={marca} value={marca}>{marca}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      onClick={() => { setNovaMarcaInput(''); setOpenMarcaDialog(true); }}
                      sx={{ minWidth: 'auto', p: 1.5 }}
                      title="Criar nova marca"
                    >
                      <AddIcon />
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Classificação</InputLabel>
                    <Select
                      value={dadosProdutoNovo.classificacao || ''}
                      onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, classificacao: e.target.value })}
                      label="Classificação"
                    >
                      <MenuItem value="Revenda">Revenda</MenuItem>
                      <MenuItem value="Venda">Venda (Fabricação Própria)</MenuItem>
                      <MenuItem value="Consumo">Consumo Próprio</MenuItem>
                      <MenuItem value="Ativo">Ativo Imobilizado</MenuItem>
                      <MenuItem value="Servico">Serviço</MenuItem>
                      <MenuItem value="Materia-Prima">Matéria-Prima</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="NCM (Código Fiscal)"
                    value={dadosProdutoNovo.ncm || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setDadosProdutoNovo({ ...dadosProdutoNovo, ncm: val });
                    }}
                    placeholder="Ex: 84713000"
                    helperText="Nomenclatura Comum do Mercosul — 8 dígitos"
                    inputProps={{ maxLength: 8 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="CEST"
                    value={dadosProdutoNovo.cest || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 7);
                      setDadosProdutoNovo({ ...dadosProdutoNovo, cest: val });
                    }}
                    placeholder="Ex: 1000100"
                    helperText="Código Especificador da Substituição Tributária — 7 dígitos"
                    inputProps={{ maxLength: 7 }}
                  />
                </Grid>
              </Grid>

              <Divider />
              <FormControlLabel
                control={
                  <Switch
                    checked={!!dadosProdutoNovo.controla_lote}
                    onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, controla_lote: e.target.checked })}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold">Controlar Lotes e Validade</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Exige seleção de lote e data de validade ao movimentar este produto
                    </Typography>
                  </Box>
                }
              />
            </Stack>
          )}

          {/* ABA 2: Tributação */}
          {abaAtivaDialogProduto === 2 && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="warning">
                Certifique-se de que os dados fiscais estão corretos para evitar erros na emissão de documentos.
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="CFOP Padrão"
                    value={dadosProdutoNovo.tributacao?.cfop || ''}
                    onChange={(e) => setDadosProdutoNovo({
                      ...dadosProdutoNovo,
                      tributacao: { ...dadosProdutoNovo.tributacao, cfop: e.target.value }
                    })}
                    placeholder="Ex: 5102"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="CST ICMS"
                    value={dadosProdutoNovo.tributacao?.cst_icms || ''}
                    onChange={(e) => setDadosProdutoNovo({
                      ...dadosProdutoNovo,
                      tributacao: { ...dadosProdutoNovo.tributacao, cst_icms: e.target.value }
                    })}
                    placeholder="Regime Normal. Ex: 00"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="CSOSN"
                    value={dadosProdutoNovo.tributacao?.csosn || ''}
                    onChange={(e) => setDadosProdutoNovo({
                      ...dadosProdutoNovo,
                      tributacao: { ...dadosProdutoNovo.tributacao, csosn: e.target.value }
                    })}
                    placeholder="Simples Nacional. Ex: 102"
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Alíquota ICMS (%)"
                    type="number"
                    value={dadosProdutoNovo.tributacao?.icms_aliquota || ''}
                    onChange={(e) => setDadosProdutoNovo({
                      ...dadosProdutoNovo,
                      tributacao: { ...dadosProdutoNovo.tributacao, icms_aliquota: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="CST IPI"
                    value={dadosProdutoNovo.tributacao?.cst_ipi || ''}
                    onChange={(e) => setDadosProdutoNovo({
                      ...dadosProdutoNovo,
                      tributacao: { ...dadosProdutoNovo.tributacao, cst_ipi: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Alíquota IPI (%)"
                    type="number"
                    value={dadosProdutoNovo.tributacao?.ipi_aliquota || ''}
                    onChange={(e) => setDadosProdutoNovo({
                      ...dadosProdutoNovo,
                      tributacao: { ...dadosProdutoNovo.tributacao, ipi_aliquota: e.target.value }
                    })}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="CST PIS/COFINS"
                    value={dadosProdutoNovo.tributacao?.cst_pis_cofins || ''}
                    onChange={(e) => setDadosProdutoNovo({
                      ...dadosProdutoNovo,
                      tributacao: { ...dadosProdutoNovo.tributacao, cst_pis_cofins: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Alíquota PIS (%)"
                    type="number"
                    value={dadosProdutoNovo.tributacao?.pis_aliquota || ''}
                    onChange={(e) => setDadosProdutoNovo({
                      ...dadosProdutoNovo,
                      tributacao: { ...dadosProdutoNovo.tributacao, pis_aliquota: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Alíquota COFINS (%)"
                    type="number"
                    value={dadosProdutoNovo.tributacao?.cofins_aliquota || ''}
                    onChange={(e) => setDadosProdutoNovo({
                      ...dadosProdutoNovo,
                      tributacao: { ...dadosProdutoNovo.tributacao, cofins_aliquota: e.target.value }
                    })}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="CST IBS/CBS"
                    value={dadosProdutoNovo.tributacao?.cst_ibs_cbs || ''}
                    onChange={(e) => setDadosProdutoNovo({
                      ...dadosProdutoNovo,
                      tributacao: { ...dadosProdutoNovo.tributacao, cst_ibs_cbs: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Alíquota IBS (%)"
                    type="number"
                    value={dadosProdutoNovo.tributacao?.ibs_aliquota || ''}
                    onChange={(e) => setDadosProdutoNovo({
                      ...dadosProdutoNovo,
                      tributacao: { ...dadosProdutoNovo.tributacao, ibs_aliquota: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Alíquota CBS (%)"
                    type="number"
                    value={dadosProdutoNovo.tributacao?.cbs_aliquota || ''}
                    onChange={(e) => setDadosProdutoNovo({
                      ...dadosProdutoNovo,
                      tributacao: { ...dadosProdutoNovo.tributacao, cbs_aliquota: e.target.value }
                    })}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Classificação Fiscal (cClassTrib)"
                value={dadosProdutoNovo.tributacao?.classificacao_fiscal || ''}
                onChange={(e) => setDadosProdutoNovo({
                  ...dadosProdutoNovo,
                  tributacao: { ...dadosProdutoNovo.tributacao, classificacao_fiscal: e.target.value }
                })}
              />
            </Stack>
          )}

          {/* ABA 3: Preços e Depósitos */}
          {abaAtivaDialogProduto === 3 && (
            <Box sx={{ mt: 1 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Defina os preços de venda e custo padrão para cada depósito ativo do sistema.
              </Alert>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Depósito</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Preço de Custo (R$)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Preço de Venda (R$) *</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Estoque Mínimo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dadosProdutoNovo.depositos.map((dep, idx) => (
                      <TableRow key={dep.id_deposito}>
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" fontWeight="bold">{dep.nome_deposito}</Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={dep.valor_custo}
                            onChange={(e) => {
                              const novosDeps = [...dadosProdutoNovo.depositos];
                              novosDeps[idx].valor_custo = e.target.value;
                              setDadosProdutoNovo({ ...dadosProdutoNovo, depositos: novosDeps });
                            }}
                            sx={{ width: 110 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            required
                            value={dep.valor_venda}
                            onChange={(e) => {
                              const novosDeps = [...dadosProdutoNovo.depositos];
                              novosDeps[idx].valor_venda = e.target.value;
                              setDadosProdutoNovo({ ...dadosProdutoNovo, depositos: novosDeps });
                            }}
                            sx={{ width: 110 }}
                            placeholder="Definir"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={dep.quantidade_minima}
                            onChange={(e) => {
                              const novosDeps = [...dadosProdutoNovo.depositos];
                              novosDeps[idx].quantidade_minima = e.target.value;
                              setDadosProdutoNovo({ ...dadosProdutoNovo, depositos: novosDeps });
                            }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {dadosProdutoNovo.depositos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">Nenhum depósito cadastrado ou ativo.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpenDialogNovoProduto(false)} variant="outlined">
            Cancelar
          </Button>
          <Button 
            onClick={salvarProdutoDialog} 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
          >
            Salvar Produto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subdialog para Criar Nova Categoria */}
      <Dialog
        open={openCategoriaDialog}
        onClose={() => setOpenCategoriaDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Nova Categoria</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Nome da Categoria"
            value={novaCategoriaInput}
            onChange={(e) => setNovaCategoriaInput(e.target.value)}
            placeholder="Ex: Construção, Ferramentas, etc."
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoriaDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              const nome = novaCategoriaInput.trim();
              if (!nome) { alert('Nome da categoria é obrigatório'); return; }
              if (!categorias.includes(nome)) {
                setCategorias(prev => [...prev, nome].sort());
              }
              setDadosProdutoNovo(prev => ({ ...prev, categoria: nome }));
              setOpenCategoriaDialog(false);
            }}
          >
            Criar Categoria
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subdialog para Criar Nova Marca */}
      <Dialog
        open={openMarcaDialog}
        onClose={() => setOpenMarcaDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Nova Marca</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Nome da Marca"
            value={novaMarcaInput}
            onChange={(e) => setNovaMarcaInput(e.target.value)}
            placeholder="Ex: Quartzolit, Portobello, etc."
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMarcaDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              const nome = novaMarcaInput.trim();
              if (!nome) { alert('Nome da marca é obrigatório'); return; }
              if (!marcas.includes(nome)) {
                setMarcas(prev => [...prev, nome].sort());
              }
              setDadosProdutoNovo(prev => ({ ...prev, marca: nome }));
              setOpenMarcaDialog(false);
            }}
          >
            Criar Marca
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subdialog para Criar Novo Grupo */}
      <Dialog
        open={openGrupoDialog}
        onClose={() => setOpenGrupoDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Novo Grupo de Produto</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              required
              label="Nome do Grupo"
              value={novoGrupo.nome}
              onChange={(e) => setNovoGrupo({ ...novoGrupo, nome: e.target.value })}
              placeholder="Ex: Cerâmicas, Ferramentas Manuais"
              autoFocus
            />
            <TextField
              fullWidth
              label="Descrição do Grupo"
              value={novoGrupo.descricao}
              onChange={(e) => setNovoGrupo({ ...novoGrupo, descricao: e.target.value })}
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGrupoDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const nome = novoGrupo.nome.trim();
              if (!nome) { toast.error('Nome do grupo é obrigatório'); return; }
              try {
                const response = await axiosInstance.post('/grupos-produto/', {
                  nome_grupo: nome,
                  descricao: novoGrupo.descricao || ''
                });
                const responseGrupos = await axiosInstance.get('/grupos-produto/');
                const gruposData = Array.isArray(responseGrupos.data) ? responseGrupos.data : (responseGrupos.data?.results || []);
                setGrupos(gruposData);
                setDadosProdutoNovo(prev => ({ ...prev, id_grupo: response.data.id_grupo }));
                setOpenGrupoDialog(false);
                setNovoGrupo({ nome: '', descricao: '' });
                toast.success('Grupo adicionado com sucesso!');
              } catch (e) {
                console.error('Erro ao adicionar grupo:', e);
                toast.error('Erro ao cadastrar grupo');
              }
            }}
          >
            Criar Grupo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Dedicado de Devolução de Compra ao Fornecedor */}
      <Dialog
        open={openModalDevolucao}
        onClose={() => setOpenModalDevolucao(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1976d2', color: '#ffffff', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📦 Devolução de Compra ao Fornecedor</span>
          <IconButton onClick={() => setOpenModalDevolucao(false)} sx={{ color: '#ffffff' }}>
            <ClearIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {loadingDevolucao ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {compraParaDevolucao && (
                <Card sx={{ mb: 2, mt: 1, bgcolor: '#f4f6f9', borderLeft: '4px solid #1976d2' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2">
                          <strong>Fornecedor:</strong> {compraParaDevolucao.nome_fornecedor || compraParaDevolucao.fornecedor_nome || 'N/A'}
                        </Typography>
                        {compraParaDevolucao.doc_fornecedor && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>CNPJ / CPF:</strong> {compraParaDevolucao.doc_fornecedor}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          <strong>Nº Nota de Entrada:</strong> {compraParaDevolucao.numero_documento || compraParaDevolucao.numero_nota || `#${compraParaDevolucao.id_compra}`}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="primary" fontWeight="bold">
                          🔑 Chave de Acesso da Nota de Origem (SEFAZ):
                        </Typography>
                        <Typography variant="caption" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', bgcolor: '#fff', p: 0.5, borderRadius: 1, border: '1px solid #e0e0e0', display: 'block', mt: 0.5 }}>
                          {compraParaDevolucao.chave_nfe_origem || compraParaDevolucao.chave_nfe || compraParaDevolucao.dados_entrada || 'Chave não informada'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.secondary">
                1. Selecione os produtos e as quantidades que deseja devolver:
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300, mb: 3 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                      <TableCell padding="checkbox" sx={{ bgcolor: '#e3f2fd' }}>
                        <Checkbox
                          checked={itensDevolucaoCompra.length > 0 && itensDevolucaoCompra.every(i => i.selecionado)}
                          indeterminate={itensDevolucaoCompra.some(i => i.selecionado) && !itensDevolucaoCompra.every(i => i.selecionado)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setItensDevolucaoCompra(prev => prev.map(i => ({ ...i, selecionado: checked })));
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold' }}>Código / Produto</TableCell>
                      <TableCell align="center" sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold', minWidth: 90 }}>CFOP</TableCell>
                      <TableCell align="center" sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold' }}>Qtd Disp.</TableCell>
                      <TableCell align="center" sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold', minWidth: 100 }}>Qtd Devolver</TableCell>
                      <TableCell align="right" sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold' }}>Preço Custo</TableCell>
                      <TableCell align="center" sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold', minWidth: 180 }}>PIS / COFINS / IBS / CBS</TableCell>
                      <TableCell align="right" sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold' }}>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itensDevolucaoCompra.map((item, index) => (
                      <TableRow key={index} hover selected={item.selecionado}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={item.selecionado}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setItensDevolucaoCompra(prev => {
                                const copy = [...prev];
                                copy[index].selecionado = checked;
                                return copy;
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {item.codigo_produto ? `[${item.codigo_produto}] ` : ''}{item.nome_produto}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            size="small"
                            disabled={!item.selecionado}
                            value={item.cfop}
                            onChange={(e) => {
                              const val = e.target.value;
                              setItensDevolucaoCompra(prev => {
                                const copy = [...prev];
                                copy[index].cfop = val;
                                return copy;
                              });
                            }}
                            inputProps={{ maxLength: 4 }}
                            sx={{ width: 85 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={item.quantidade_disponivel} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            disabled={!item.selecionado}
                            value={item.quantidade_devolver}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(item.quantidade_disponivel, parseFloat(e.target.value) || 0));
                              setItensDevolucaoCompra(prev => {
                                const copy = [...prev];
                                copy[index].quantidade_devolver = val;
                                if (val > 0 && !copy[index].selecionado) {
                                  copy[index].selecionado = true;
                                }
                                return copy;
                              });
                            }}
                            inputProps={{ min: 0.01, max: item.quantidade_disponivel, step: 'any' }}
                            sx={{ width: 90 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          R$ {item.valor_unitario.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <TextField
                              size="small"
                              label="PIS"
                              type="number"
                              disabled={!item.selecionado}
                              value={item.vpis}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setItensDevolucaoCompra(prev => {
                                  const copy = [...prev];
                                  copy[index].vpis = val;
                                  return copy;
                                });
                              }}
                              sx={{ width: 60 }}
                            />
                            <TextField
                              size="small"
                              label="COFINS"
                              type="number"
                              disabled={!item.selecionado}
                              value={item.vcofins}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setItensDevolucaoCompra(prev => {
                                  const copy = [...prev];
                                  copy[index].vcofins = val;
                                  return copy;
                                });
                              }}
                              sx={{ width: 65 }}
                            />
                            <TextField
                              size="small"
                              label="IBS"
                              type="number"
                              disabled={!item.selecionado}
                              value={item.vibs}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setItensDevolucaoCompra(prev => {
                                  const copy = [...prev];
                                  copy[index].vibs = val;
                                  return copy;
                                });
                              }}
                              sx={{ width: 60 }}
                            />
                            <TextField
                              size="small"
                              label="CBS"
                              type="number"
                              disabled={!item.selecionado}
                              value={item.vcbs}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setItensDevolucaoCompra(prev => {
                                  const copy = [...prev];
                                  copy[index].vcbs = val;
                                  return copy;
                                });
                              }}
                              sx={{ width: 60 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          R$ {(item.quantidade_devolver * item.valor_unitario).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.secondary">
                2. Informações Fiscais e Motivo da Devolução:
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Operação Fiscal (NF-e Modelo 55)</InputLabel>
                    <Select
                      value={operacaoDevolucaoId}
                      label="Operação Fiscal (NF-e Modelo 55)"
                      onChange={(e) => setOperacaoDevolucaoId(e.target.value)}
                    >
                      <MenuItem value="">Nenhuma (Devolução Apenas Gerencial Interna)</MenuItem>
                      {operacoes
                        .filter(op => {
                          const trans = (op.transacao || op.tipo_transacao || op.tipo || '').toLowerCase();
                          const mod = String(op.modelo_documento || op.modelo_nf || '');
                          return mod === '55' || trans.includes('devolu');
                        })
                        .map((op) => (
                          <MenuItem key={op.id_operacao} value={op.id_operacao}>
                            {op.nome_operacao || op.nome} (NF-e Mod. {op.modelo_documento || '55'})
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    label="Motivo da Devolução"
                    placeholder="Ex: Produto com defeito, divergência no pedido..."
                    value={motivoDevolucao}
                    onChange={(e) => setMotivoDevolucao(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.secondary">
                3. Transportadora, Volumes / Caixas e Pesos:
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Transportadora"
                    placeholder="Nome da transportadora..."
                    value={freteDevolucao.transportadora_nome}
                    onChange={(e) => setFreteDevolucao(prev => ({ ...prev, transportadora_nome: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Volumes / Caixas"
                    type="number"
                    value={freteDevolucao.qtd_volumes}
                    onChange={(e) => setFreteDevolucao(prev => ({ ...prev, qtd_volumes: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Espécie"
                    value={freteDevolucao.especie}
                    onChange={(e) => setFreteDevolucao(prev => ({ ...prev, especie: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Peso Bruto (kg)"
                    type="number"
                    value={freteDevolucao.peso_bruto}
                    onChange={(e) => setFreteDevolucao(prev => ({ ...prev, peso_bruto: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Peso Líquido (kg)"
                    type="number"
                    value={freteDevolucao.peso_liquido}
                    onChange={(e) => setFreteDevolucao(prev => ({ ...prev, peso_liquido: e.target.value }))}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.secondary">
                4. Frete, Outras Despesas Acessórias e Totais da Nota:
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Valor do Frete (R$)"
                    type="number"
                    value={despesasDevolucao.valor_frete}
                    onChange={(e) => setDespesasDevolucao(prev => ({ ...prev, valor_frete: parseFloat(e.target.value) || 0 }))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Outras Despesas Acessórias (R$)"
                    type="number"
                    value={despesasDevolucao.valor_outras}
                    onChange={(e) => setDespesasDevolucao(prev => ({ ...prev, valor_outras: parseFloat(e.target.value) || 0 }))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Valor do Seguro (R$)"
                    type="number"
                    value={despesasDevolucao.valor_seguro}
                    onChange={(e) => setDespesasDevolucao(prev => ({ ...prev, valor_seguro: parseFloat(e.target.value) || 0 }))}
                  />
                </Grid>
              </Grid>

              {/* Card de Resumo Financeiro da Devolução */}
              {(() => {
                const subtotalItens = itensDevolucaoCompra
                  .filter(i => i.selecionado)
                  .reduce((acc, i) => acc + (i.quantidade_devolver * i.valor_unitario), 0);
                const totalDespesas = (despesasDevolucao.valor_frete || 0) + (despesasDevolucao.valor_outras || 0) + (despesasDevolucao.valor_seguro || 0);
                const valorTotalFinal = subtotalItens + totalDespesas;

                return (
                  <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#e8f5e9', borderColor: '#a5d6a7' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2">
                          <strong>Subtotal dos Produtos:</strong> R$ {subtotalItens.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2">
                          <strong>Frete + Outras Despesas:</strong> R$ {totalDespesas.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                          <strong>VALOR TOTAL DA NOTA: R$ {valorTotalFinal.toFixed(2)}</strong>
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })()}

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Observações Fiscais / Dados Adicionais da NF-e"
                    value={observacoesDevolucao}
                    onChange={(e) => setObservacoesDevolucao(e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenModalDevolucao(false)} color="inherit">
            Cancelar
          </Button>
          {!modoPreviewDevolucao ? (
            <Button
              variant="contained"
              color="primary"
              disabled={loadingDevolucao || !itensDevolucaoCompra.some(i => i.selecionado && i.quantidade_devolver > 0)}
              onClick={salvarEVisualizarDevolucaoCompra}
            >
              💾 Salvar Devolução e Visualizar Prévia
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setModoPreviewDevolucao(false)}
              >
                ✏️ Voltar e Editar
              </Button>
              <Button
                variant="outlined"
                color="info"
                startIcon={<VisibilityIcon />}
                onClick={() => handleImprimirDanfeDevolucao(vendaIdGeradoDevolucao, true)}
              >
                👁️ Gerar DANFE Prévia (PDF para Fornecedor)
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  setOpenModalDevolucao(false);
                  if (vendaIdGeradoDevolucao && operacaoDevolucaoId) {
                    setDialogNFeDevolucao({
                      open: true,
                      vendaId: vendaIdGeradoDevolucao,
                      numeroDoc: compraParaDevolucao.numero_documento || compraParaDevolucao.numero_nota || `#${compraParaDevolucao.id_compra}`,
                      fornecedorNome: compraParaDevolucao.nome_fornecedor || compraParaDevolucao.fornecedor_nome || '',
                      chaveNFe: compraParaDevolucao.chave_nfe_origem || compraParaDevolucao.chave_nfe || '',
                      statusEmissao: 'pendente',
                      mensagemSefaz: 'Clique abaixo para Transmitir a NF-e de Devolução para a SEFAZ.',
                      protocolo: ''
                    });
                  }
                }}
              >
                🚀 Confirmar e Transmitir para SEFAZ
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog para Transmissão SEFAZ e Impressão de DANFE na Tela de Compras */}
      <Dialog
        open={dialogNFeDevolucao.open}
        onClose={() => setDialogNFeDevolucao(prev => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1565c0', color: '#ffffff', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📡 Transmissão NF-e SEFAZ (Modelo 55)</span>
          <IconButton onClick={() => setDialogNFeDevolucao(prev => ({ ...prev, open: false }))} sx={{ color: '#ffffff' }}>
            <ClearIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Card sx={{ mb: 2, bgcolor: '#f4f6f9', borderLeft: '4px solid #1565c0' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2">
                <strong>Destinatário / Fornecedor:</strong> {dialogNFeDevolucao.fornecedorNome || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Nº Documento:</strong> {dialogNFeDevolucao.numeroDoc}
              </Typography>
              {dialogNFeDevolucao.chaveNFe && (
                <Typography variant="caption" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', color: '#1565c0', display: 'block', mt: 0.5 }}>
                  Chave SEFAZ: {dialogNFeDevolucao.chaveNFe}
                </Typography>
              )}
            </CardContent>
          </Card>

          <Alert
            severity={
              dialogNFeDevolucao.statusEmissao === 'autorizada' ? 'success' :
              dialogNFeDevolucao.statusEmissao === 'rejeitada' ? 'error' :
              dialogNFeDevolucao.statusEmissao === 'enviando' ? 'info' : 'warning'
            }
            sx={{ mb: 2 }}
          >
            {dialogNFeDevolucao.statusEmissao === 'enviando' && <CircularProgress size={20} sx={{ mr: 1, verticalAlign: 'middle' }} />}
            {dialogNFeDevolucao.mensagemSefaz}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setDialogNFeDevolucao(prev => ({ ...prev, open: false }))} color="inherit">
            Fechar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {dialogNFeDevolucao.statusEmissao === 'autorizada' && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleImprimirDanfeDevolucao(dialogNFeDevolucao.vendaId)}
              >
                📄 Imprimir DANFE PDF
              </Button>
            )}
            {dialogNFeDevolucao.statusEmissao !== 'autorizada' && (
              <Button
                variant="contained"
                color="success"
                disabled={dialogNFeDevolucao.statusEmissao === 'enviando'}
                onClick={() => handleTransmitirNFeSefaz(dialogNFeDevolucao.vendaId)}
              >
                🚀 Transmitir para SEFAZ
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Dialog de Carta de Correção Eletrônica (CC-e) */}
      <CartaCorrecaoDialog
        open={cartaCorrecaoDialog.open}
        onClose={() => setCartaCorrecaoDialog({ open: false, venda: null })}
        venda={cartaCorrecaoDialog.venda}
      />

      {/* Menu de Mais Opções para Devoluções (Estilo idêntico à aba NF-e) */}
      <Menu
        anchorEl={anchorElDevolucao}
        open={Boolean(anchorElDevolucao)}
        onClose={handleMenuCloseDevolucao}
      >
        <MenuItem
          onClick={() => {
            const targetId = compraMenuDevolucao?.id_venda || compraMenuDevolucao?.id_devolucao || compraMenuDevolucao?.id_compra;
            handleImprimirDanfeDevolucao(targetId, true);
            handleMenuCloseDevolucao();
          }}
          sx={{ color: 'info.main' }}
        >
          <ListItemIcon><VisibilityIcon fontSize="small" color="info" /></ListItemIcon>
          Visualizar Prévia DANFE (Conferência)
        </MenuItem>

        <MenuItem
          onClick={() => {
            const targetId = compraMenuDevolucao?.id_venda || compraMenuDevolucao?.id_devolucao || compraMenuDevolucao?.id_compra;
            handleImprimirDanfeDevolucao(targetId, false);
            handleMenuCloseDevolucao();
          }}
        >
          <ListItemIcon><PrintIcon fontSize="small" color="success" /></ListItemIcon>
          Imprimir DANFE Oficial (PDF)
        </MenuItem>

        <MenuItem
          onClick={() => {
            const targetId = compraMenuDevolucao?.id_venda || compraMenuDevolucao?.id_devolucao || compraMenuDevolucao?.id_compra;
            handleTransmitirNFeSefaz(targetId);
            handleMenuCloseDevolucao();
          }}
          sx={{ color: 'primary.main' }}
        >
          <ListItemIcon><DescriptionIcon fontSize="small" color="primary" /></ListItemIcon>
          Transmitir NF-e para SEFAZ
        </MenuItem>

        <MenuItem
          onClick={() => {
            const targetId = compraMenuDevolucao?.id_venda || compraMenuDevolucao?.id_devolucao || compraMenuDevolucao?.id_compra;
            setCartaCorrecaoDialog({
              open: true,
              venda: {
                id_venda: targetId,
                id: targetId,
                numero_nfe: compraMenuDevolucao?.numero_documento,
                chave_nfe: compraMenuDevolucao?.chave_nfe
              }
            });
            handleMenuCloseDevolucao();
          }}
          sx={{ color: 'secondary.main' }}
        >
          <ListItemIcon><DescriptionIcon fontSize="small" color="secondary" /></ListItemIcon>
          Carta de Correção (CC-e)
        </MenuItem>

        {compraMenuDevolucao?.chave_nfe && (
          <MenuItem
            onClick={() => {
              const targetId = compraMenuDevolucao?.id_venda || compraMenuDevolucao?.id_devolucao;
              window.open(`${axiosInstance.defaults.baseURL}/vendas/${targetId}/download_xml/`, '_blank');
              handleMenuCloseDevolucao();
            }}
          >
            <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
            Baixar XML da NF-e
          </MenuItem>
        )}

        <Divider />

        <MenuItem
          onClick={() => {
            if (compraMenuDevolucao) {
              excluirCompra(compraMenuDevolucao.id_compra || compraMenuDevolucao.id);
            }
            handleMenuCloseDevolucao();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          Excluir Devolução
        </MenuItem>
      </Menu>

      {/* Diálogo de Alerta e Vínculo para Nota Fiscal de Débito (finNFe = 6) */}
      <Dialog
        open={dialogNotaDebitoOpen}
        onClose={() => setDialogNotaDebitoOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Nota Fiscal de Débito Detectada (finNFe = 6) - Ajuste Complementar RTC
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2, fontWeight: 'bold' }}>
            Esta nota fiscal refere-se a um <strong>Acréscimo Complementar de Valor / Débito (Reforma Tributária - RTC)</strong>.
            A quantidade em estoque físico não será multiplicada para evitar duplicidade.
          </Alert>

          <Typography variant="body1" sx={{ mb: 2 }}>
            Para atualizar corretamente o <strong>Custo Médio dos produtos</strong>, vincule este ajuste à <strong>Nota Fiscal de Entrada de Origem</strong> do fornecedor <strong>{dadosNotaDebitoModal?.fornecedor_nome}</strong>:
          </Typography>

          {dadosNotaDebitoModal?.compra_origem_sugerida ? (
            <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: '#e8f5e9', border: '2px solid #66bb6a', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1b5e20', display: 'flex', alignItems: 'center', gap: 1 }}>
                ✅ Nota de Origem Localizada Automaticamente no Banco (via Chave Referenciada XML):
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                • <strong>Documento:</strong> Nota Nº {dadosNotaDebitoModal.compra_origem_sugerida.numero_documento} {dadosNotaDebitoModal.compra_origem_sugerida.fornecedor_nome ? `(${dadosNotaDebitoModal.compra_origem_sugerida.fornecedor_nome})` : ''} | Data Entrada: {dadosNotaDebitoModal.compra_origem_sugerida.data_entrada}
              </Typography>
              <Typography variant="body2">
                • <strong>Valor Total Origem:</strong> R$ {parseFloat(dadosNotaDebitoModal.compra_origem_sugerida.valor_total || 0).toFixed(2)}
              </Typography>
              {dadosNotaDebitoModal.compra_origem_sugerida.chave_nfe && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, wordBreak: 'break-all' }}>
                  🔑 Chave: {dadosNotaDebitoModal.compra_origem_sugerida.chave_nfe}
                </Typography>
              )}
            </Paper>
          ) : dadosNotaDebitoModal?.chave_referenciada ? (
            <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#fffde7', border: '1px solid #ffe082', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f57f17' }}>
                ℹ️ Chave Referenciada encontrada no XML: {dadosNotaDebitoModal.chave_referenciada}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                A nota original com esta chave de acesso ainda não foi cadastrada no sistema ou foi digitada em formato diferente. Selecione a nota de origem manualmente abaixo:
              </Typography>
            </Paper>
          ) : null}

          {(() => {
            const listOpcoes = [];
            const idsVistos = new Set();

            if (dadosNotaDebitoModal?.compra_origem_sugerida) {
              const s = dadosNotaDebitoModal.compra_origem_sugerida;
              idsVistos.add(String(s.id_compra));
              listOpcoes.push(s);
            }

            if (Array.isArray(dadosNotaDebitoModal?.compras_fornecedor_opcoes)) {
              dadosNotaDebitoModal.compras_fornecedor_opcoes.forEach(cf => {
                const idC = String(cf.id_compra);
                if (!idsVistos.has(idC)) {
                  idsVistos.add(idC);
                  listOpcoes.push(cf);
                }
              });
            }

            if (Array.isArray(compras)) {
              compras.forEach(c => {
                const idC = String(c.id_compra || c.id);
                if (!idsVistos.has(idC)) {
                  idsVistos.add(idC);
                  const fornNome = c.fornecedor_nome || c.fornecedor?.nome_razao_social || '';
                  listOpcoes.push({
                    id_compra: c.id_compra || c.id,
                    numero_documento: `${c.numero_documento || '#' + idC}${fornNome ? ' (' + fornNome + ')' : ''}`,
                    data_entrada: c.data_entrada || '',
                    valor_total: c.valor_total || 0,
                    chave_nfe: c.dados_entrada || c.chave_nfe || ''
                  });
                }
              });
            }

            return (
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel id="label-compra-origem">Selecione a Nota Fiscal de Origem *</InputLabel>
                <Select
                  labelId="label-compra-origem"
                  value={idCompraOrigemSelecionada}
                  onChange={(e) => setIdCompraOrigemSelecionada(e.target.value)}
                  label="Selecione a Nota Fiscal de Origem *"
                >
                  <MenuItem value="">
                    <em>Nenhuma (Apenas registrar Nota de Débito sem vínculo direto)</em>
                  </MenuItem>
                  {listOpcoes.map((cf) => (
                    <MenuItem key={cf.id_compra} value={String(cf.id_compra)}>
                      Nota Nº {cf.numero_documento} — {cf.data_entrada} (R$ {parseFloat(cf.valor_total || 0).toFixed(2)})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#fafafa' }}>
          <Button onClick={() => setDialogNotaDebitoOpen(false)} color="inherit">
            Cancelar
          </Button>

          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              if (idCompraOrigemSelecionada) {
                const opt = dadosNotaDebitoModal?.compras_fornecedor_opcoes?.find(c => String(c.id_compra) === String(idCompraOrigemSelecionada));
                setForm(f => ({
                  ...f,
                  chave_referenciada: opt?.chave_nfe || dadosNotaDebitoModal?.chave_referenciada || f.chave_referenciada,
                  movimenta_estoque_fisico: false,
                  ajuste_custo: true
                }));
                toast.success(`🔗 Nota de Débito vinculada à Nota Nº ${opt?.numero_documento || idCompraOrigemSelecionada}!`, { autoClose: 4000 });
              } else {
                toast.info('Nota de Débito mantida sem vínculo de origem direto.', { autoClose: 3000 });
              }
              setDialogNotaDebitoOpen(false);
            }}
            sx={{ fontWeight: 'bold' }}
          >
            Confirmar e Vincular Custo
          </Button>
        </DialogActions>
      </Dialog>

      </Box>
    </Box>
  )
}

export default CompraPage
