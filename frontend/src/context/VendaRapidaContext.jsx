import React, { useEffect, useState } from 'react';
import { useVendaRapida } from '../context/VendaRapidaContext';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CloudDoneIcon from '@mui/icons-material/CloudDone';

const VendaRapidaPage = () => {
  const [loading, setLoading] = useState(true); // true até carregarDadosUsuario concluir
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialogs e estados de UI que permanecem locais
  const [openSelecionarTabela, setOpenSelecionarTabela] = useState(false);
  const [produtoPendenteTabela, setProdutoPendenteTabela] = useState(null);
  const [openPerguntarTabelaFinanceiro, setOpenPerguntarTabelaFinanceiro] = useState(false);
  const [openDesconto, setOpenDesconto] = useState(false);
  const [openDescontoItem, setOpenDescontoItem] = useState(false);
  const [openFinalizar, setOpenFinalizar] = useState(false);
  const [openPesquisaProduto, setOpenPesquisaProduto] = useState(false);
  const [produtosPesquisa, setProdutosPesquisa] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [descontoItemEdit, setDescontoItemEdit] = useState(0);
  const [openCondicoesPagamento, setOpenCondicoesPagamento] = useState(false);
  const [openImpressao, setOpenImpressao] = useState(false);
  const [dadosVendaCompleta, setDadosVendaCompleta] = useState(null);
  const [openSelecionarLote, setOpenSelecionarLote] = useState(false);
  const [openReimprimir, setOpenReimprimir] = useState(false);
  const [vendas, setVendas] = useState([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [openSelecionarCliente, setOpenSelecionarCliente] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [openConfigFundo, setOpenConfigFundo] = useState(false);
  const [openMPPoint, setOpenMPPoint] = useState(false);
  const [openLimiteModal, setOpenLimiteModal] = useState(false);
  const [openAtrasoModal, setOpenAtrasoModal] = useState(false);
  const [openEstoqueModal, setOpenEstoqueModal] = useState(false);
  const [openAbrirCaixa, setOpenAbrirCaixa] = useState(false);
  const [openFecharCaixa, setOpenFecharCaixa] = useState(false);
  const [valorAbertura, setValorAbertura] = useState('');
  const [valorFechamento, setValorFechamento] = useState('');
  const [observacoesCaixa, setObservacoesCaixa] = useState('');
  const [justificativaFechamento, setJustificativaFechamento] = useState('');

  const { user, permissions, isLoading: authLoading, axiosInstance } = useAuth();
  const codigoProdutoRef = useRef(null);
  const mpPointPollingRef = useRef(null);
  const mpPointLoadingRef = useRef(false); // guard anti-duplo-tap
  const mpPointAcaoRef = useRef('adicionar_condicao'); // ref para usar dentro do intervalo

  // DEBUG UI: mostrar contador visível de fila de validações (pequeno badge)
  const BadgeFila = () => {
    const { filaValidacoes } = useVendaRapida();
    return (
      <span style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'red',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontWeight: 'bold',
      }}>
        {filaValidacoes}
      </span>
    );
  };

  useEffect(() => {
    const carregarDadosUsuario = async () => {
      try {
        const response = await axiosInstance.get('/api/venda-rapida/dados-usuario');
        setParametros(response.data);
        setUsuario(response.data.usuario);
        setVendedor(response.data.vendedor);
        setOperacao(response.data.operacao);
        setEmpresa(response.data.empresa);
        setCliente(response.data.cliente);
        setNumeroDocumento(response.data.numeroDocumento);
        setTabelasComerciais(response.data.tabelasComerciais);
        setTabelaSelecionada(response.data.tabelaSelecionada);
        setFormasPagamento(response.data.formasPagamento);
        setConfigImpressao(response.data.configImpressao);
        setCaixaStatus(response.data.caixaStatus);
        setCaixaInfo(response.data.caixaInfo);
        setItens(response.data.itens);
        setValorTotal(response.data.valorTotal);
        setDescontoGeral(response.data.descontoGeral);
        setCodigoProduto(response.data.codigoProduto);
        setIdProdutoSelecionado(response.data.idProdutoSelecionado);
        setNomeProduto(response.data.nomeProduto);
        setQuantidade(response.data.quantidade);
        setValorUnitario(response.data.valorUnitario);
        setPrecoBaseProduto(response.data.precoBaseProduto);
        setDescontoItem(response.data.descontoItem);
        setProdutoBalanca(response.data.produtoBalanca);
        setControlaProdutoLote(response.data.controlaProdutoLote);
        setLotesDisponiveis(response.data.lotesDisponiveis);
        setLotePendente(response.data.lotePendente);
        setLotePreSelecionado(response.data.lotePreSelecionado);
        setPromocoes(response.data.promocoesAtivas);
        setProdutoEmPromocao(response.data.produtoEmPromocao);
        setMensagemPromocao(response.data.mensagemPromocao);
        setFilaValidacoes(response.data.filaValidacoes);
        setLimiteInfo(response.data.limiteInfo);
        setAcaoLimiteAtual(response.data.acaoLimiteAtual);
        setSenhaSupervisorLimite(response.data.senhaSupervisorLimite);
        setLimiteAutorizado(response.data.limiteAutorizado);
        setAtrasoInfo(response.data.atrasoInfo);
        setAcaoAtrasoAtual(response.data.acaoAtrasoAtual);
        setSenhaSupervisorAtraso(response.data.senhaSupervisorAtraso);
        setAtrasoAutorizado(response.data.atrasoAutorizado);
        setEstoqueInfo(response.data.estoqueInfo);
        setAcaoEstoqueAtual(response.data.acaoEstoqueAtual);
        setSenhaSupervisorEstoque(response.data.senhaSupervisorEstoque);
        setItemPendenteEstoque(response.data.itemPendenteEstoque);
        setEstoqueAutorizado(response.data.estoqueAutorizado);
        setCondicoesSelecionadas(response.data.condicoesSelecionadas);
        setFormaPagamentoAtual(response.data.formaPagamentoAtual);
        setValorCondicaoAtual(response.data.valorCondicaoAtual);
        setValorRestante(response.data.valorRestante);
        setImagemFundo(response.data.imagemFundo);
        setUsarMercadoPago(response.data.usarMercadoPago);
        setMpPointTransacaoUuid(response.data.mpPointTransacaoUuid);
        setMpPointStatus(response.data.mpPointStatus);
        setMpPointDetalhe(response.data.mpPointDetalhe);
        setMpPointAcaoAposAprovacao(response.data.mpPointAcaoAposAprovacao);
      } catch (e) {
        console.error('Erro ao carregar dados do usuário:', e);
        setError('Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    };

    carregarDadosUsuario();
  }, []);

  const { parametros, setParametros,
    usuario, setUsuario,
    vendedor, setVendedor,
    operacao, setOperacao,
    empresa, setEmpresa,
    cliente, setCliente,
    numeroDocumento, setNumeroDocumento,
    tabelasComerciais, setTabelasComerciais,
    tabelaSelecionada, setTabelaSelecionada,
    formasPagamento, setFormasPagamento,
    configImpressao, setConfigImpressao,
    caixaStatus, setCaixaStatus,
    caixaInfo, setCaixaInfo,
    // Estados da Venda
    itens, setItens,
    valorTotal, setValorTotal,
    descontoGeral, setDescontoGeral,
    // Estados do Produto
    codigoProduto, setCodigoProduto,
    idProdutoSelecionado, setIdProdutoSelecionado,
    nomeProduto, setNomeProduto,
    quantidade, setQuantidade,
    valorUnitario, setValorUnitario,
    precoBaseProduto, setPrecoBaseProduto,
    descontoItem, setDescontoItem,
    produtoBalanca, setProdutoBalanca,
    // Lotes
    controlaProdutoLote, setControlaProdutoLote,
    lotesDisponiveis, setLotesDisponiveis,
    lotePendente, setLotePendente,
    lotePreSelecionado, setLotePreSelecionado,
    // Promoções
    promocoesAtivas, setPromocoes,
    produtoEmPromocao, setProdutoEmPromocao,
    mensagemPromocao, setMensagemPromocao,
    // Validações
    filaValidacoes, setFilaValidacoes,
    limiteInfo, setLimiteInfo,
    acaoLimiteAtual, setAcaoLimiteAtual,
    senhaSupervisorLimite, setSenhaSupervisorLimite,
    limiteAutorizado, setLimiteAutorizado,
    atrasoInfo, setAtrasoInfo,
    acaoAtrasoAtual, setAcaoAtrasoAtual,
    senhaSupervisorAtraso, setSenhaSupervisorAtraso,
    atrasoAutorizado, setAtrasoAutorizado,
    estoqueInfo, setEstoqueInfo,
    acaoEstoqueAtual, setAcaoEstoqueAtual,
    senhaSupervisorEstoque, setSenhaSupervisorEstoque,
    itemPendenteEstoque, setItemPendenteEstoque,
    estoqueAutorizado, setEstoqueAutorizado,
    // Condições de Pagamento
    condicoesSelecionadas, setCondicoesSelecionadas,
    formaPagamentoAtual, setFormaPagamentoAtual,
    valorCondicaoAtual, setValorCondicaoAtual,
    valorRestante, setValorRestante,
    // Imagem de Fundo
    imagemFundo, setImagemFundo,
    // Mercado Pago
    usarMercadoPago, setUsarMercadoPago,
    mpPointTransacaoUuid, setMpPointTransacaoUuid,
    mpPointStatus, setMpPointStatus,
    mpPointDetalhe, setMpPointDetalhe,
    mpPointAcaoAposAprovacao, setMpPointAcaoAposAprovacao
  } = useVendaRapida();

  const [openSelecionarTabela, setOpenSelecionarTabela] = useState(false);
  const [produtoPendenteTabela, setProdutoPendenteTabela] = useState(null);
  const [openPerguntarTabelaFinanceiro, setOpenPerguntarTabelaFinanceiro] = useState(false);
  const [openDesconto, setOpenDesconto] = useState(false);
  const [openDescontoItem, setOpenDescontoItem] = useState(false);
  const [openFinalizar, setOpenFinalizar] = useState(false);
  const [openPesquisaProduto, setOpenPesquisaProduto] = useState(false);
  const [produtosPesquisa, setProdutosPesquisa] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [descontoItemEdit, setDescontoItemEdit] = useState(0);
  const [openCondicoesPagamento, setOpenCondicoesPagamento] = useState(false);
  const [openImpressao, setOpenImpressao] = useState(false);
  const [dadosVendaCompleta, setDadosVendaCompleta] = useState(null);
  const [openSelecionarLote, setOpenSelecionarLote] = useState(false);
  const [openReimprimir, setOpenReimprimir] = useState(false);
  const [vendas, setVendas] = useState([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [openSelecionarCliente, setOpenSelecionarCliente] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [openConfigFundo, setOpenConfigFundo] = useState(false);
  const [openMPPoint, setOpenMPPoint] = useState(false);
  const [openLimiteModal, setOpenLimiteModal] = useState(false);
  const [openAtrasoModal, setOpenAtrasoModal] = useState(false);
  const [openEstoqueModal, setOpenEstoqueModal] = useState(false);
  const [openAbrirCaixa, setOpenAbrirCaixa] = useState(false);
  const [openFecharCaixa, setOpenFecharCaixa] = useState(false);
  const [valorAbertura, setValorAbertura] = useState('');
  const [valorFechamento, setValorFechamento] = useState('');
  const [observacoesCaixa, setObservacoesCaixa] = useState('');
  const [justificativaFechamento, setJustificativaFechamento] = useState('');

  const mpPointPollingRef = useRef(null);
  const mpPointLoadingRef = useRef(false); // guard anti-duplo-tap
  const mpPointAcaoRef = useRef('adicionar_condicao'); // ref para usar dentro do intervalo

  // DEBUG UI: mostrar contador visível de fila de validações (pequeno badge)
  const BadgeFila = () => {
    const { filaValidacoes } = useVendaRapida();
    return (
      <span style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'red',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontWeight: 'bold',
      }}>
        {filaValidacoes}
      </span>
    );
  };

  useEffect(() => {
    const carregarDadosUsuario = async () => {
      try {
        const response = await axiosInstance.get('/api/venda-rapida/dados-usuario');
        setParametros(response.data);
        setUsuario(response.data.usuario);
        setVendedor(response.data.vendedor);
        setOperacao(response.data.operacao);
        setEmpresa(response.data.empresa);
        setCliente(response.data.cliente);
        setNumeroDocumento(response.data.numeroDocumento);
        setTabelasComerciais(response.data.tabelasComerciais);
        setTabelaSelecionada(response.data.tabelaSelecionada);
        setFormasPagamento(response.data.formasPagamento);
        setConfigImpressao(response.data.configImpressao);
        setCaixaStatus(response.data.caixaStatus);
        setCaixaInfo(response.data.caixaInfo);
        setItens(response.data.itens);
        setValorTotal(response.data.valorTotal);
        setDescontoGeral(response.data.descontoGeral);
        setCodigoProduto(response.data.codigoProduto);
        setIdProdutoSelecionado(response.data.idProdutoSelecionado);
        setNomeProduto(response.data.nomeProduto);
        setQuantidade(response.data.quantidade);
        setValorUnitario(response.data.valorUnitario);
        setPrecoBaseProduto(response.data.precoBaseProduto);
        setDescontoItem(response.data.descontoItem);
        setProdutoBalanca(response.data.produtoBalanca);
        setControlaProdutoLote(response.data.controlaProdutoLote);
        setLotesDisponiveis(response.data.lotesDisponiveis);
        setLotePendente(response.data.lotePendente);
        setLotePreSelecionado(response.data.lotePreSelecionado);
        setPromocoes(response.data.promocoesAtivas);
        setProdutoEmPromocao(response.data.produtoEmPromocao);
        setMensagemPromocao(response.data.mensagemPromocao);
        setFilaValidacoes(response.data.filaValidacoes);
        setLimiteInfo(response.data.limiteInfo);
        setAcaoLimiteAtual(response.data.acaoLimiteAtual);
        setSenhaSupervisorLimite(response.data.senhaSupervisorLimite);
        setLimiteAutorizado(response.data.limiteAutorizado);
        setAtrasoInfo(response.data.atrasoInfo);
        setAcaoAtrasoAtual(response.data.acaoAtrasoAtual);
        setSenhaSupervisorAtraso(response.data.senhaSupervisorAtraso);
        setAtrasoAutorizado(response.data.atrasoAutorizado);
        setEstoqueInfo(response.data.estoqueInfo);
        setAcaoEstoqueAtual(response.data.acaoEstoqueAtual);
        setSenhaSupervisorEstoque(response.data.senhaSupervisorEstoque);
        setItemPendenteEstoque(response.data.itemPendenteEstoque);
        setEstoqueAutorizado(response.data.estoqueAutorizado);
        setCondicoesSelecionadas(response.data.condicoesSelecionadas);
        setFormaPagamentoAtual(response.data.formaPagamentoAtual);
        setValorCondicaoAtual(response.data.valorCondicaoAtual);
        setValorRestante(response.data.valorRestante);
        setImagemFundo(response.data.imagemFundo);
        setUsarMercadoPago(response.data.usarMercadoPago);
        setMpPointTransacaoUuid(response.data.mpPointTransacaoUuid);
        setMpPointStatus(response.data.mpPointStatus);
        setMpPointDetalhe(response.data.mpPointDetalhe);
        setMpPointAcaoAposAprovacao(response.data.mpPointAcaoAposAprovacao);
      } catch (e) {
        console.error('Erro ao carregar dados do usuário:', e);
        setError('Erro ao carregar dados do usuário');
      } finally {
        setLoading(false);
      }
    };

    carregarDadosUsuario();
  }, []);

  return (
    <>
      <div style={{
        position: 'relative',
        height: '100vh',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'red',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {filaValidacoes}
        </div>
        <h1 style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '24px',
          fontWeight: 'bold',
        }}>
          Venda Rápida
        </h1>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.name}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.email}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.name}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.description}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.code}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.value}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.type}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          {user?.permissions?.[0]?.level}
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',