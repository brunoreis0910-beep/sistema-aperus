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
  Autocomplete
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
import NoteIcon from '@mui/icons-material/Note'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import { useAuth } from '../context/AuthContext'
import PrecificacaoDialog from '../components/PrecificacaoDialog'
import SolicitarAprovacaoModal from '../components/SolicitarAprovacaoModal'
import { toast } from 'react-toastify'

function CompraPage() {
  const { axiosInstance, user, permissions, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Estados principais
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

  // Estados da Manifestação do Destinatário inline
  const [dialogManifestacao, setDialogManifestacao] = useState(false)
  const [compraParaManif, setCompraParaManif] = useState(null)
  const [tipoEventoManif, setTipoEventoManif] = useState('')
  const [justificativaManif, setJustificativaManif] = useState('')
  const [enviandoManif, setEnviandoManif] = useState(false)
  const [resultadoManif, setResultadoManif] = useState(null)

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
    data_vencimento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'Dinheiro'
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
    marca: ''
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
      const [fornRes, prodRes, operRes, comprasRes, gruposRes, catRes, marcaRes] = await Promise.all([
        axiosInstance.get('/fornecedores/'),
        axiosInstance.get('/produtos/'),
        axiosInstance.get('/operacoes/'),
        axiosInstance.get('/compras/'),
        axiosInstance.get('/grupos-produto/'),
        axiosInstance.get('/produtos/categorias/'),
        axiosInstance.get('/produtos/marcas/')
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
      
      // Filtrar apenas operações de entrada
      const operacoesData = Array.isArray(operRes.data)
        ? operRes.data
        : (operRes.data?.results || [])
      const operacoesEntrada = operacoesData.filter(op =>
        op.transacao && op.transacao.toLowerCase() === 'entrada'
      )
      setOperacoes(operacoesEntrada)
      
      const comprasData = comprasRes.data?.results || comprasRes.data || []
      console.log('🔍 Compras carregadas:', comprasData)
      console.log('🔍 Primeira compra:', comprasData[0])
      setCompras(Array.isArray(comprasData) ? comprasData : [])
      
      const gruposData = Array.isArray(gruposRes.data)
        ? gruposRes.data
        : (gruposRes.data?.results || [])
      setGrupos(gruposData)
      
      // Carregar categorias e marcas
      setCategorias(catRes.data || [])
      setMarcas(marcaRes.data || [])

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
      const dataCompra = new Date(compra.data_entrada)
      const dataInicio = new Date(filtros.dataInicio)
      if (dataCompra < dataInicio) return false
    }

    // Filtro por data de entrada (fim)
    if (filtros.dataFim && compra.data_entrada) {
      const dataCompra = new Date(compra.data_entrada)
      const dataFim = new Date(filtros.dataFim)
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
          valor_unitario: item.valor_unitario || 0,
          fracao_memorizada: item.fracao_memorizada || item.quantidade || 1,
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
      setForm({
        id_fornecedor: dados.id_fornecedor || '',
        numero_documento: dados.numero_documento || '',
        data_documento: dataDocumentoFormatada,
        data_entrada: dados.data_entrada || new Date().toLocaleDateString('en-CA'),
        dados_entrada: chaveNfe,
        xml_conteudo: dados.xml_conteudo || '',
        id_operacao: form.id_operacao,
        itens: itensMapeados,
      })

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
    if (!dadosProdutoNovo.nome || !dadosProdutoNovo.id_grupo) {
      toast.error('❌ Nome do produto e Grupo são obrigatórios!');
      return;
    }

    try {
      const produtoParaEnviar = {
        codigo_produto: dadosProdutoNovo.codigo || '',
        nome_produto: dadosProdutoNovo.nome,
        descricao: dadosProdutoNovo.descricao || '',
        unidade_medida: dadosProdutoNovo.unidade_medida || 'UN',
        valor_custo: parseFloat(dadosProdutoNovo.preco_custo) || 0,
        id_grupo: dadosProdutoNovo.id_grupo,
        marca: dadosProdutoNovo.marca || null,
        classificacao: dadosProdutoNovo.categoria || null,
        ncm: dadosProdutoNovo.ncm || null,
        gtin: dadosProdutoNovo.gtin || null
      }

      const response = await axiosInstance.post('/produtos/', produtoParaEnviar)
      const produtoCadastrado = response.data
      
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
        
        toast.success(`✅ Produto "${produtoCadastrado.nome_produto}" cadastrado e vinculado!`, {
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
        marca: ''
      })
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      toast.error('❌ ' + (error.response?.data?.message || 'Erro ao cadastrar produto'))
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

  // Salva compra
  const salvarCompra = async (e) => {
    e.preventDefault()
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
        // Custo por unidade de estoque: divide pelo fator de fração quando aplicável
        // Arredonda para 6 casas decimais para respeitar max_digits=15 do backend
        const valorUnitEstoque = parseFloat(
          ((qtdComFracao > qtdNF && fracao > 1)
            ? valorUnitNF / fracao
            : valorUnitNF
          ).toFixed(6)
        )
        // O total financeiro usa a quantidade e preço da NF (não muda o total da nota)
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
          // Quantidade para estoque: usa a quantidade convertida pela fração
          quantidade: item.qtdComFracao,
          // Valor unitário por unidade de estoque (após divisão pela fração)
          valor_unitario: item.valorUnitEstoque,
          valor_total: parseFloat(item.subtotal.toFixed(6)),
          fracao_memorizada: parseFloat(item.fracao_memorizada) || 1,
          quantidade_com_fracao: item.qtdComFracao !== (parseFloat(item.quantidade) || 0) ? item.qtdComFracao : null
        }))
      }

      console.log('🔵 ENVIANDO COMPRA:', payload)
      console.log('🔵 Modo:', editandoId ? 'EDIÇÃO' : 'CRIAÇÃO')

      // ========== VERIFICAÇÃO DE APROVAÇÃO (APENAS PARA USUÁRIOS NÃO SUPERVISORES) ==========
      if (!editandoId && !user?.is_staff) {
        // Regras que exigem aprovação
        const motivos = []
        const fornecedorSelecionado = fornecedores.find(f => f.id_fornecedor === parseInt(form.id_fornecedor))

        // REGRA 1: Valor alto (acima de R$ 10.000)
        if (total > 10000) {
          motivos.push(`Valor da compra (R$ ${total.toFixed(2)}) acima do limite de R$ 10.000,00`)
        }

        // REGRA 2: Fornecedor novo (primeira compra)
        if (fornecedorSelecionado && fornecedorSelecionado.total_compras === 0) {
          motivos.push('Primeira compra deste fornecedor')
        }

        // REGRA 3: Compra sem fornecedor cadastrado
        if (!form.id_fornecedor) {
          motivos.push('Compra sem fornecedor cadastrado')
        }

        // Se houver regras violadas, solicitar aprovação
        if (motivos.length > 0) {
          setDadosAprovacao({
            ...payload,
            fornecedor: fornecedorSelecionado ? {
              id: fornecedorSelecionado.id_fornecedor,
              nome: fornecedorSelecionado.nome_razao_social
            } : null,
            motivos_aprovacao: motivos.join(' | '),
            total_itens: itensValidos.length,
            usuario_solicitante: user.username
          })
          setModalAprovacao(true)
          return // PARA AQUI - não cria a compra ainda
        }
      }
      // ==================================================================================

      // Verifica se operação exige financeiro ANTES de salvar
      const operacaoSelecionada = operacoes.find(o => o.id_operacao === parseInt(form.id_operacao))
      const operacaoExigeFinanceiro = !editandoId && operacaoSelecionada?.gera_financeiro === 1

      if (operacaoExigeFinanceiro) {
        const confirmaFinanceiro = window.confirm(
          '⚠️ ATENÇÃO: Esta operação exige geração de financeiro!\n\n' +
          '📊 Após salvar a compra, você DEVE gerar as contas a pagar.\n' +
          '💰 Valor total: R$ ' + total.toFixed(2) + '\n\n' +
          'Deseja continuar e gerar o financeiro?'
        )
        
        if (!confirmaFinanceiro) {
          setErro('❌ Compra não salva: operação exige geração de financeiro.')
          setTimeout(() => setErro(null), 5000)
          return
        }
      }

      let response
      if (editandoId) {
        // Atualiza compra existente
        console.log('🔄 ATUALIZANDO COMPRA ID:', editandoId)
        console.log('📤 PAYLOAD PARA ATUALIZAÇÃO:', JSON.stringify(payload, null, 2))
        response = await axiosInstance.put(`/compras/${editandoId}/`, payload)
        console.log('✅ COMPRA ATUALIZADA:', response.data)
      } else {
        // Cria nova compra
        response = await axiosInstance.post('/compras/', payload)
        console.log('✅ COMPRA CRIADA:', response.data)
      }

      // Verifica se deve gerar financeiro (apenas para novas compras)
      const geraFinanceiro = !editandoId && (operacaoSelecionada?.gera_financeiro || response.data?.gerou_financeiro)

      // Mensagem de sucesso
      let mensagemSucesso = editandoId 
        ? `✅ Compra atualizada com sucesso!\n💰 Valor total: R$ ${total.toFixed(2)}\n📦 ${itensValidos.length} produto(s)`
        : `✅ Compra cadastrada com sucesso!\n💰 Valor total: R$ ${total.toFixed(2)}\n📦 ${itensValidos.length} produto(s) salvos`
      
      if (itensInvalidos.length > 0) {
        mensagemSucesso += `\n⚠️ ${itensInvalidos.length} produto(s) não cadastrados foram ignorados`
      }

      if (geraFinanceiro) {
        // Abre modal para gerar financeiro
        setDadosFinanceiro({
          id_compra: response.data.id_compra,
          valor_total: total,
          numero_parcelas: 1,
          data_vencimento: form.data_entrada,
          forma_pagamento: 'Dinheiro',
          obrigatorio: operacaoExigeFinanceiro // Marca se é obrigatório
        })
        setModalFinanceiro(true)
        setSucesso(
          mensagemSucesso + '\n' + 
          (operacaoExigeFinanceiro 
            ? '⚠️ OBRIGATÓRIO: Configure o financeiro agora!' 
            : '📊 Configure o financeiro.')
        )
      } else {
        setSucesso(mensagemSucesso)
        limparFormulario()
        carregarDados()
      }

      // Só limpa e recarrega se não for gerar financeiro
      if (!geraFinanceiro) {
        limparFormulario()
        carregarDados()
      }

      setTimeout(() => setSucesso(null), 5000)
    } catch (error) {
      console.error('❌ Erro ao salvar compra:', error)
      console.error('📋 Resposta do servidor:', error.response?.data)
      console.error('📊 Status:', error.response?.status)
      
      let mensagemErro = 'Verifique os dados e tente novamente.'
      
      if (error.response?.data) {
        const errorData = error.response.data
        
        // Trata diferentes formatos de erro
        if (typeof errorData === 'string') {
          mensagemErro = errorData
        } else if (errorData.detail) {
          mensagemErro = errorData.detail
        } else if (errorData.error) {
          mensagemErro = errorData.error
        } else if (errorData.itens) {
          // Erros de validação dos itens
          mensagemErro = 'Erro nos itens: ' + JSON.stringify(errorData.itens)
        } else {
          // Mostra todo o objeto de erro
          mensagemErro = JSON.stringify(errorData)
        }
      } else if (error.message) {
        mensagemErro = error.message
      }
      
      setErro(`❌ Erro ao ${editandoId ? 'atualizar' : 'salvar'} compra: ${mensagemErro}`)
    }
  }

  // Gera contas a pagar
  const gerarFinanceiro = async () => {
    try {
      const valorParcela = (dadosFinanceiro.valor_total / dadosFinanceiro.numero_parcelas).toFixed(2)
      const parcelas = []

      for (let i = 0; i < dadosFinanceiro.numero_parcelas; i++) {
        const dataVencimento = new Date(dadosFinanceiro.data_vencimento)
        dataVencimento.setMonth(dataVencimento.getMonth() + i)

        parcelas.push({
          id_compra_origem: dadosFinanceiro.id_compra,
          tipo_conta: 'Pagar',
          descricao: `Compra #${dadosFinanceiro.id_compra} - Parcela ${i + 1}/${dadosFinanceiro.numero_parcelas}`,
          valor: parseFloat(valorParcela),
          valor_parcela: parseFloat(valorParcela), // Campo adicional
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          data_emissao: new Date().toISOString().split('T')[0],
          status_conta: 'Pendente',
          forma_pagamento: dadosFinanceiro.forma_pagamento,
          gerencial: true // Campo adicional obrigatório
        })
      }

      try {
        for (const parcela of parcelas) {
          await axiosInstance.post('/contas/', parcela)
        }
        setModalFinanceiro(false)
        setSucesso(`✅ ${parcelas.length} conta(s) a pagar gerada(s) com sucesso!`)
        
        // Limpa formulário e recarrega após gerar financeiro
        limparFormulario()
        carregarDados()
        
        setTimeout(() => setSucesso(null), 5000)
      } catch (error) {
        console.error('Erro detalhado:', error.response?.data)
        setErro(`❌ Erro: ${JSON.stringify(error.response?.data || 'Erro desconhecido')}`)
      }
    } catch (error) {
      console.error('Erro ao gerar financeiro:', error)
      setErro('❌ Erro ao gerar contas a pagar.')
    }
  }

  // Edita compra
  const editarCompra = async (compra) => {
    try {
      // Busca os detalhes completos da compra
      const response = await axiosInstance.get(`/compras/${compra.id_compra || compra.id}/`)
      const compraCompleta = response.data
      
      // Preenche o formulário com os dados da compra
      setForm({
        id_fornecedor: compraCompleta.id_fornecedor || '',
        id_operacao: compraCompleta.id_operacao || '',
        numero_documento: compraCompleta.numero_documento || '',
        data_documento: compraCompleta.data_documento ? compraCompleta.data_documento.split('T')[0] : '',
        data_entrada: compraCompleta.data_entrada || new Date().toLocaleDateString('en-CA'),
        dados_entrada: compraCompleta.dados_entrada || '',
        itens: compraCompleta.itens || []
      })
      
      // Define que está editando
      setEditandoId(compraCompleta.id_compra || compraCompleta.id)
      setMostrarFormulario(true)
      
      // Rola a página para o topo onde está o formulário
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      setSucesso('📝 Compra carregada para edição')
      setTimeout(() => setSucesso(null), 3000)
    } catch (error) {
      console.error('Erro ao carregar compra para edição:', error)
      setErro('❌ Erro ao carregar compra: ' + (error.response?.data?.detail || error.message))
    }
  }

  // Exclui compra
  const excluirCompra = async (id) => {
    try {
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
          // Redireciona para o financeiro
          window.location.href = '/#/financeiro'
        }
        return
      }
      
      // Se não há contas pagas, pede confirmação normal
      if (!window.confirm('Deseja realmente excluir esta compra?')) return

      await axiosInstance.delete(`/compras/${id}/`)
      setSucesso('✅ Compra excluída com sucesso!')
      carregarDados()
      setTimeout(() => setSucesso(null), 3000)
    } catch (error) {
      console.error('Erro ao excluir:', error)
      
      // Trata erro 403 (compra com contas pagas)
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
          fracao_memorizada: item.fracao_memorizada || item.quantidade || 1,
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
      p: 1.5
    }}>
      <Box sx={{ maxWidth: '1500px', mx: 'auto' }}>
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

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Data de Entrada *"
                    value={form.data_entrada}
                    onChange={(e) => setForm({ ...form, data_entrada: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    helperText="Data de entrada no estoque (sugestão: hoje)"
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
                                              marca: ''
                                            };
                                            
                                            // Preencher formulário e abrir dialog
                                            setDadosProdutoNovo(dadosXML);
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
                                    value={item.valor_unitario}
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
                overflow: 'hidden'
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
                        {compra.data_documento
                          ? new Date(compra.data_documento).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          : '-'}
                      </TableCell>
                      <TableCell sx={{ color: '#000' }}>
                        {compra.data_entrada
                          ? new Date(compra.data_entrada).toLocaleDateString('pt-BR', {
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
                        <Chip
                          label={compra.operacao_abreviacao || compra.operacao_nome || compra.id_operacao || '-'}
                          size="small"
                          sx={{ bgcolor: '#e3f2fd', fontWeight: 'bold', color: '#000' }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#000' }}>{compra.numero_documento || '-'}</TableCell>
                      <TableCell sx={{ color: '#000', maxWidth: 160 }}>
                        {compra.dados_entrada ? (
                          <Tooltip title={compra.dados_entrada}>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                              {compra.dados_entrada.slice(0, 12)}…
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          R$ {compra.valor_total}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title={compra.dados_entrada ? 'Manifestar NF-e do Destinatário' : 'Sem chave NF-e para manifestar'}>
                            <span>
                              <IconButton
                                color="info"
                                onClick={() => abrirManifestacao(compra)}
                                disabled={!compra.dados_entrada}
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
                          <Tooltip title="Excluir compra">
                            <IconButton
                              color="error"
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
                  onClick={() => consultarNFesSeafaz(maxNsuSeafaz)}
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

        {/* Dialog de Cadastro de Novo Produto (Botão +) */}
        <Dialog 
          open={openDialogNovoProduto} 
          onClose={() => setOpenDialogNovoProduto(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            Novo Produto
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Código (Automático)"
                  value={dadosProdutoNovo.codigo}
                  onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, codigo: e.target.value })}
                  margin="normal"
                  helperText="O código será gerado automaticamente pelo sistema"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Nome do Produto *"
                  value={dadosProdutoNovo.nome}
                  onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, nome: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GTIN / Código de Barras (EAN)"
                  value={dadosProdutoNovo.gtin}
                  onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, gtin: e.target.value })}
                  margin="normal"
                  helperText="Código de barras EAN-8, EAN-13 ou deixe vazio para SEM GTIN"
                  inputProps={{ maxLength: 14 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Unidade de Medida"
                  value={dadosProdutoNovo.unidade_medida}
                  onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, unidade_medida: e.target.value })}
                  margin="normal"
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
                  <MenuItem value="PC">Peça (PC)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Grupo de Produto *"
                  value={dadosProdutoNovo.id_grupo}
                  onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, id_grupo: e.target.value })}
                  margin="normal"
                  helperText="Selecione o grupo/categoria principal"
                >
                  <MenuItem value="">
                    <em>Selecione...</em>
                  </MenuItem>
                  {grupos.map((grupo) => (
                    <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                      {grupo.nome_grupo}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Preço de Custo"
                  type="number"
                  value={dadosProdutoNovo.preco_custo}
                  onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, preco_custo: e.target.value })}
                  margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="NCM"
                  value={dadosProdutoNovo.ncm}
                  onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, ncm: e.target.value })}
                  margin="normal"
                  helperText="Nomenclatura Comum do Mercosul (8 dígitos)"
                  inputProps={{ maxLength: 8 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Categoria"
                  value={dadosProdutoNovo.categoria}
                  onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, categoria: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Marca"
                  value={dadosProdutoNovo.marca}
                  onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, marca: e.target.value })}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descrição"
                  value={dadosProdutoNovo.descricao}
                  onChange={(e) => setDadosProdutoNovo({ ...dadosProdutoNovo, descricao: e.target.value })}
                  margin="normal"
                />
              </Grid>
            </Grid>
            <Alert severity="info" sx={{ mt: 2 }}>
              Após salvar o produto, você poderá configurar o preço de custo, preço de venda e estoque mínimo para cada depósito na próxima tela.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialogNovoProduto(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={salvarProdutoDialog} 
              variant="contained" 
              color="primary"
              startIcon={<SaveIcon />}
            >
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
  )
}

export default CompraPage
