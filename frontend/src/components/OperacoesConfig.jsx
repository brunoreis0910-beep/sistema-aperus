import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  IconButton,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Backdrop,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Chip,
  Autocomplete,
  Tabs,
  Tab,
  Radio,
  RadioGroup,
  FormLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import ConjuntoOperacoesDialog from './ConjuntoOperacoesDialog';

const OperacoesConfig = () => {
  const { axiosInstance } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [operacoes, setOperacoes] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openConjuntosDialog, setOpenConjuntosDialog] = useState(false);
  const [openNumeracaoDialog, setOpenNumeracaoDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTransacao, setFilterTransacao] = useState('');
  const [filterModelo, setFilterModelo] = useState('');
  const [tabAtual, setTabAtual] = useState(0); // 0 = Principal, 1 = Validações
  const [numeracoesSimples, setNumeracoesSimples] = useState([]);
  const [loadingNumeracao, setLoadingNumeracao] = useState(false);
  const [numeracaoForm, setNumeracaoForm] = useState({ descricao: '', numeracao: '' });
  const [editingNumeracaoId, setEditingNumeracaoId] = useState(null);
  const [openPickNumeracao, setOpenPickNumeracao] = useState(false);
  const [currentOperacao, setCurrentOperacao] = useState({
    id_operacao: null,
    nome_operacao: '',
    abreviacao: '',
    id_empresa: null,
    transacao: '',
    modelo_documento: '',
    emitente: '',
    usa_auto_numeracao: 0,
    serie_nf: 1,
    proximo_numero_nf: 1,
    tipo_estoque_baixa: 'Nenhum',
    gera_financeiro: 0,
    tipo_estoque_incremento: 'Nenhum',
    incrementar_estoque: 0,
    venda_veiculo_novo: false,
    id_deposito_incremento: null,
    id_deposito_baixa: null,
    validacao_limite_credito: 'nao_validar',
    validar_atraso: false,
    dias_atraso_tolerancia: 0,
    acao_atraso: 'alertar',
    validar_estoque: false,
    acao_estoque: 'nao_validar',
    limite_desconto_percentual: 0,
    cashback_percentual: 0,
    cashback_validade_dias: 30,
    baixa_automatica: false,
    entrega_futura: false,
    tipo_entrega_futura: 'origem',
    id_numeracao: null,
    ind_faturamento: false,
    tipo_faturamento: '',
    validar_estoque_fiscal: false
  });

  useEffect(() => {
    carregarOperacoes();
    carregarDepositos();
    carregarEmpresas();
  }, []);

  const carregarNumeracoesSimples = async () => {
    try {
      setLoadingNumeracao(true);
      const response = await axiosInstance.get('/numeracoes/');
      setNumeracoesSimples(Array.isArray(response.data) ? response.data : (response.data?.results || []));
    } catch (err) {
      console.error('Erro ao carregar numerações:', err);
    } finally {
      setLoadingNumeracao(false);
    }
  };

  const handleSaveNumeracao = async () => {
    if (!numeracaoForm.descricao.trim() || !numeracaoForm.numeracao.trim()) {
      alert('Preencha a Descrição e a Numeração.');
      return;
    }
    try {
      setLoadingNumeracao(true);
      if (editingNumeracaoId) {
        await axiosInstance.put(`/numeracoes/${editingNumeracaoId}/`, numeracaoForm);
      } else {
        await axiosInstance.post('/numeracoes/', numeracaoForm);
      }
      setNumeracaoForm({ descricao: '', numeracao: '' });
      setEditingNumeracaoId(null);
      await carregarNumeracoesSimples();
    } catch (err) {
      console.error('Erro ao salvar numeração:', err);
    } finally {
      setLoadingNumeracao(false);
    }
  };

  const handleDeleteNumeracao = async (id) => {
    if (!window.confirm('Excluir esta numeração?')) return;
    try {
      setLoadingNumeracao(true);
      await axiosInstance.delete(`/numeracoes/${id}/`);
      await carregarNumeracoesSimples();
    } catch (err) {
      console.error('Erro ao excluir numeração:', err);
    } finally {
      setLoadingNumeracao(false);
    }
  };

  const carregarOperacoes = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/operacoes/');

      // Verificar se a resposta é um array direto ou objeto paginado
      let operacoesData = [];
      if (Array.isArray(response.data)) {
        operacoesData = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        operacoesData = response.data.results;
      } else if (response.data?.value && Array.isArray(response.data.value)) {
        operacoesData = response.data.value;
      }

      // Normalizar campos booleanos que podem vir como número do backend
      const operacoesNormalizadas = operacoesData.map(op => ({
        ...op,
        baixa_automatica: op.baixa_automatica === 1 || op.baixa_automatica === true
      }));

      setOperacoes(operacoesNormalizadas);
      setError(null);
    } catch (err) {
      console.error('❌ Erro ao carregar operações:', err);
      setError('Erro ao carregar operações');
    } finally {
      setLoading(false);
    }
  };

  const carregarDepositos = async () => {
    try {
      const response = await axiosInstance.get('/depositos/');
      const depositosData = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);
      setDepositos(depositosData);
    } catch (err) {
      console.error('❌ Erro ao carregar depósitos:', err);
      setDepositos([]);
    }
  };

  const carregarEmpresas = async () => {
    try {
      const response = await axiosInstance.get('/empresa/');
      const empresasData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setEmpresas(empresasData);
    } catch (err) {
      console.error('❌ Erro ao carregar empresas:', err);
      setEmpresas([]);
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentOperacao(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validações
      if (!currentOperacao.nome_operacao || currentOperacao.nome_operacao.trim() === '') {
        setError('Nome da operação é obrigatório');
        setLoading(false);
        return;
      }



      const dadosParaEnvio = {
        nome_operacao: currentOperacao.nome_operacao.substring(0, 100), // Limita a 100 caracteres
        abreviacao: (currentOperacao.abreviacao || '').toUpperCase().substring(0, 4),
        empresa: currentOperacao.id_empresa ? String(currentOperacao.id_empresa).substring(0, 100) : null,
        transacao: currentOperacao.transacao ? String(currentOperacao.transacao).substring(0, 15) : null,
        modelo_documento: currentOperacao.modelo_documento ? String(currentOperacao.modelo_documento).substring(0, 10) : null,
        emitente: currentOperacao.emitente ? String(currentOperacao.emitente).substring(0, 8) : null,
        usa_auto_numeracao: currentOperacao.usa_auto_numeracao ? 1 : 0,
        serie_nf: parseInt(currentOperacao.serie_nf) || 1,
        proximo_numero_nf: parseInt(currentOperacao.proximo_numero_nf) || 1,
        tipo_estoque_baixa: String(currentOperacao.tipo_estoque_baixa || 'Nenhum').substring(0, 9),
        gera_financeiro: currentOperacao.gera_financeiro ? 1 : 0,
        tipo_estoque_incremento: String(currentOperacao.tipo_estoque_incremento || 'Nenhum').substring(0, 9),
        incrementar_estoque: currentOperacao.incrementar_estoque ? 1 : 0,
        venda_veiculo_novo: currentOperacao.venda_veiculo_novo ? true : false,
        id_deposito_incremento: currentOperacao.id_deposito_incremento ? parseInt(currentOperacao.id_deposito_incremento) : null,
        id_deposito_baixa: currentOperacao.id_deposito_baixa ? parseInt(currentOperacao.id_deposito_baixa) : null,
        validacao_limite_credito: currentOperacao.validacao_limite_credito || 'nao_validar',
        validar_atraso: currentOperacao.validar_atraso ? true : false,
        dias_atraso_tolerancia: parseInt(currentOperacao.dias_atraso_tolerancia) || 0,
        acao_atraso: currentOperacao.acao_atraso || 'alertar',
        validar_estoque: currentOperacao.validar_estoque ? true : false,
        acao_estoque: currentOperacao.acao_estoque || 'nao_validar',
        cashback_percentual: parseFloat(currentOperacao.cashback_percentual) || 0.00,
        cashback_validade_dias: parseInt(currentOperacao.cashback_validade_dias) || 30,
        baixa_automatica: currentOperacao.baixa_automatica ? 1 : 0,
        entrega_futura: currentOperacao.entrega_futura ? true : false,
        tipo_entrega_futura: currentOperacao.tipo_entrega_futura || 'origem',
        ind_faturamento: currentOperacao.ind_faturamento ? true : false,
        tipo_faturamento: currentOperacao.tipo_faturamento || '',
        validar_estoque_fiscal: currentOperacao.validar_estoque_fiscal ? true : false
      };

      let response;
      if (isEditing && currentOperacao.id_operacao) {
        response = await axiosInstance.patch(`/operacoes/${currentOperacao.id_operacao}/`, dadosParaEnvio);
      } else {
        response = await axiosInstance.post('/operacoes/', dadosParaEnvio);
      }

      setOpenDialog(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setError(null);

      // Recarregar dados atualizados
      await carregarOperacoes();

    } catch (err) {
      console.error('❌ Erro ao salvar operação:', err);
      console.error('❌ Detalhes do erro:', err.response?.data);
      console.error('❌ Status do erro:', err.response?.status);

      let errorMessage = 'Erro ao salvar operação';

      if (err.response?.data) {
        // Tentar extrair mensagem de erro específica
        if (typeof err.response.data === 'string') {
          // Tentar encontrar a mensagem de erro no HTML
          const match = err.response.data.match(/<h1>(.*?)<\/h1>/);
          if (match) {
            errorMessage += ': ' + match[1];
          }
        } else if (err.response.data.detail) {
          errorMessage += ': ' + err.response.data.detail;
        } else if (err.response.data.error) {
          errorMessage += ': ' + err.response.data.error;
        }
      } else if (err.message) {
        errorMessage += ': ' + err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (operacao) => {
    // A API pode retornar 'empresa' ou 'id_empresa', normaliza para id_empresa
    const empresaId = operacao.id_empresa || operacao.empresa;

    setCurrentOperacao({
      ...operacao,
      abreviacao: operacao.abreviacao || '',
      id_empresa: empresaId, // Normaliza para id_empresa
      usa_auto_numeracao: operacao.usa_auto_numeracao === 1,
      gera_financeiro: operacao.gera_financeiro === 1,
      incrementar_estoque: operacao.incrementar_estoque === 1,
      venda_veiculo_novo: operacao.venda_veiculo_novo === 1 || operacao.venda_veiculo_novo === true,
      baixa_automatica: operacao.baixa_automatica === 1 || operacao.baixa_automatica === true,
      limite_desconto_percentual: parseFloat(operacao.limite_desconto_percentual) || 0,
      cashback_percentual: parseFloat(operacao.cashback_percentual) || 0,
      cashback_validade_dias: parseInt(operacao.cashback_validade_dias) || 30,
      entrega_futura: operacao.entrega_futura === 1 || operacao.entrega_futura === true,
      tipo_entrega_futura: operacao.tipo_entrega_futura || 'origem',
      // Garantir que os depósitos sejam mantidos
      id_deposito_baixa: operacao.id_deposito_baixa || null,
      id_deposito_incremento: operacao.id_deposito_incremento || null,
      // Garantir que os tipos de estoque sejam mantidos
      tipo_estoque_baixa: operacao.tipo_estoque_baixa || 'Nenhum',
      tipo_estoque_incremento: operacao.tipo_estoque_incremento || 'Nenhum',
      id_numeracao: operacao.id_numeracao || null
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleNew = () => {
    setCurrentOperacao({
      id_operacao: null,
      nome_operacao: '',
      abreviacao: '',
      id_empresa: null,
      transacao: '',
      modelo_documento: '',
      emitente: '',
      usa_auto_numeracao: false,
      serie_nf: 1,
      proximo_numero_nf: 1,
      tipo_estoque_baixa: 'Nenhum',
      gera_financeiro: false,
      tipo_estoque_incremento: 'Nenhum',
      incrementar_estoque: false,
      venda_veiculo_novo: false,
      id_deposito_incremento: null,
      id_deposito_baixa: null,
      validacao_limite_credito: 'nao_validar',
      validar_atraso: false,
      dias_atraso_tolerancia: 0,
      acao_atraso: 'alertar',
      validar_estoque: false,
      acao_estoque: 'nao_validar',
      limite_desconto_percentual: 0,
      cashback_percentual: 0,
      cashback_validade_dias: 30,
      baixa_automatica: false,
      entrega_futura: false,
      tipo_entrega_futura: 'origem',
      id_numeracao: null
    });
    setIsEditing(false);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta operação?')) {
      try {
        setLoading(true);
        await axiosInstance.delete(`/operacoes/${id}/`);
        console.log('🗑️ Operação excluída');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        await carregarOperacoes();
      } catch (err) {
        console.error('❌ Erro ao excluir operação:', err);
        setError('Erro ao excluir operação: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const getTransacaoColor = (transacao) => {
    switch (transacao) {
      case 'Entrada': return 'success';
      case 'Saida': return 'error';
      case 'Devolucao': return 'warning';
      case 'DevEntrada': return 'warning';
      case 'DevSaida': return 'warning';
      case 'TransfEntrada': return 'info';
      case 'TransfSaida': return 'info';
      default: return 'default';
    }
  };

  const getTransacaoLabel = (transacao) => {
    switch (transacao) {
      case 'Entrada': return 'Entrada';
      case 'Saida': return 'Saída';
      case 'Devolucao': return 'Devolução';
      case 'DevEntrada': return 'Dev. Entrada';
      case 'DevSaida': return 'Dev. Saída';
      case 'TransfEntrada': return 'Transf. Entrada';
      case 'TransfSaida': return 'Transf. Saída';
      default: return transacao || 'N/A';
    }
  };

  const tiposEstoque = ['Nenhum', 'Deposito'];
  const tiposTransacao = ['Entrada', 'Saida', 'Devolucao', 'DevEntrada', 'DevSaida', 'TransfEntrada', 'TransfSaida'];

  const operacoesFiltradas = Array.isArray(operacoes) ? operacoes.filter(op => {
    const nomeOk = !searchTerm || (op.nome_operacao || '').toLowerCase().includes(searchTerm.toLowerCase());
    const transacaoOk = !filterTransacao || op.transacao === filterTransacao;
    const modeloOk = !filterModelo || (op.modelo_documento || '') === filterModelo;
    return nomeOk && transacaoOk && modeloOk;
  }) : [];
  const tiposEmitente = ['Proprio', 'Terceiros'];
  
  const modelosDocumentoOptions = [
    { code: '01', label: '01 - NOTA FISCAL' },
    { code: '02', label: '02 - NOTA FISCAL DE VENDA A CONSUMIDOR' },
    { code: '03', label: '03 - NOTA FISCAL DE ENTRADA' },
    { code: '04', label: '04 - NOTA FISCAL DE PRODUTOR' },
    { code: '06', label: '06 - NOTA FISCAL CONTA DE ENERGIA ELÉTRICA' },
    { code: '07', label: '07 - NOTA FISCAL DE SERVIÇO DE TRANSPORTE' },
    { code: '08', label: '08 - CONHECIMENTO DE TRANSPORTE RODOVIÁRIO DE CARGAS' },
    { code: '09', label: '09 - CONHECIMENTO DE TRANSPORTE AQUAVIÁRIO DE CARGAS' },
    { code: '10', label: '10 - CONHECIMENTO AÉREO' },
    { code: '11', label: '11 - CONHECIMENTO DE TRANSPORTE FERROVIÁRIO DE CARGAS' },
    { code: '13', label: '13 - BILHETE DE PASSAGEM RODOVIÁRIO' },
    { code: '14', label: '14 - BILHETE E PASSAGEM AQUAVIÁRIO' },
    { code: '15', label: '15 - BILHETE DE PASSAGEM E NOTA DE BAGAGEM' },
    { code: '16', label: '16 - BILHETE DE PASSAGEM FERROVIÁRIO' },
    { code: '17', label: '17 - DESPACHO DE TRANSPORTE' },
    { code: '18', label: '18 - RESUMO MOVIMENTO DIÁRIO' },
    { code: '20', label: '20 - ORDEM DE COLETA DE CARGA' },
    { code: '21', label: '21 - NOTA FISCAL DE SERVIÇO DE COMUNICAÇÃO' },
    { code: '22', label: '22 - NOTA FISCAL DE SERVIÇO DE TELECOMUNICAÇÕES' },
    { code: '24', label: '24 - AUTORIZAÇÃO DE CARREGAMENTO DE TRANSPORTE' },
    { code: '25', label: '25 - MANIFESTO DE CARGA' },
    { code: 'CF', label: 'CF - CUPOM FISCAL' },
    { code: '90', label: '90 - ORÇAMENTO' },
    { code: '57', label: '57 - CONHECIMENTO DE TRANSPORTE ELETRÔNICO - CT-E' },
    { code: '91', label: '91 - BOLETO BANCARIO' },
    { code: '92', label: '92 - CHEQUE' },
    { code: '93', label: '93 - CARTAO DE CREDITO' },
    { code: '94', label: '94 - CARTEIRA' },
    { code: '55', label: '55 - NOTA FISCAL ELETRONICA' },
    { code: '65', label: '65 - NFCE' },
    { code: 'OD', label: 'OD - OUTRAS DESPESAS' },
    { code: '99', label: '99 - OUTROS' },
    { code: 'OS', label: 'OS - ORDEM DE SERVIÇO' },
    { code: 'Orçamento', label: 'Orçamento (Legado)' },
    { code: 'Condicional', label: 'Condicional' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Loading Backdrop */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Operação salva com sucesso!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <SettingsIcon />
            </Avatar>
          }
          title="Configuração de Operações"
          subheader="Gerencie as operações do sistema"
          action={
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setOpenConjuntosDialog(true)}
              >
                🔗 Conjunto de Operação
              </Button>
              <Button
                variant="outlined"
                color="info"
                onClick={() => {
                  setNumeracaoForm({ descricao: '', numeracao: '' });
                  setEditingNumeracaoId(null);
                  carregarNumeracoesSimples();
                  setOpenNumeracaoDialog(true);
                }}
              >
                🔢 Numeração
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNew}
              >
                Nova Operação
              </Button>
            </Box>
          }
        />

        <CardContent>
          {/* Barra de Pesquisa */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Pesquisar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: searchTerm ? (
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                ) : null
              }}
              sx={{ minWidth: 240 }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filtrar Transação</InputLabel>
              <Select
                value={filterTransacao}
                label="Filtrar Transação"
                onChange={(e) => setFilterTransacao(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {tiposTransacao.map(t => (
                  <MenuItem key={t} value={t}>{getTransacaoLabel(t)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Filtrar Modelo</InputLabel>
              <Select
                value={filterModelo}
                label="Filtrar Modelo"
                onChange={(e) => setFilterModelo(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {[...new Set(operacoes.map(o => o.modelo_documento).filter(Boolean))].sort().map(m => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {(searchTerm || filterTransacao || filterModelo) && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<ClearIcon />}
                onClick={() => { setSearchTerm(''); setFilterTransacao(''); setFilterModelo(''); }}
              >
                Limpar Filtros
              </Button>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {operacoesFiltradas.length} de {operacoes.length} operações
            </Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Nome da Operação</strong></TableCell>
                  <TableCell><strong>Empresa</strong></TableCell>
                  <TableCell><strong>Transação</strong></TableCell>
                  <TableCell><strong>Modelo Doc.</strong></TableCell>
                  <TableCell><strong>Emitente</strong></TableCell>
                  <TableCell><strong>Auto Núm.</strong></TableCell>
                  <TableCell><strong>Numeração</strong></TableCell>
                  <TableCell><strong>Gera Financ.</strong></TableCell>
                  <TableCell><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {operacoesFiltradas.map((operacao) => (
                  <TableRow key={operacao.id_operacao} hover>
                    <TableCell>{operacao.id_operacao}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {operacao.nome_operacao}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        // A API pode retornar 'empresa' ou 'id_empresa'
                        const empresaIdRaw = operacao.id_empresa || operacao.empresa;
                        const empresaId = empresaIdRaw ? Number(empresaIdRaw) : null;

                        // Empresa pode ter id, id_empresa ou ID como chave primária
                        const empresa = empresas.find(e => {
                          const empId = e.id || e.id_empresa || e.ID;
                          return Number(empId) === empresaId;
                        });

                        if (!empresa && empresaId) {
                          console.warn(`⚠️ Empresa não encontrada para operação ${operacao.nome_operacao}:`, {
                            empresaId,
                            tipoEmpresaId: typeof empresaId,
                            totalEmpresas: empresas.length,
                            empresasDisponiveis: empresas.map(e => ({
                              id: e.id,
                              tipoId: typeof e.id,
                              comparacao: `${Number(e.id)} === ${empresaId}`,
                              resultado: Number(e.id) === empresaId,
                              nome: e.nome_razao_social
                            }))
                          });
                        }

                        return empresa ? empresa.nome_razao_social || empresa.nome : (empresaId ? `ID: ${empresaId}` : 'N/A');
                      })()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTransacaoLabel(operacao.transacao)}
                        color={getTransacaoColor(operacao.transacao)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{operacao.modelo_documento || 'N/A'}</TableCell>
                    <TableCell>{operacao.emitente || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={operacao.usa_auto_numeracao ? 'Sim' : 'não'}
                        color={operacao.usa_auto_numeracao ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {operacao.numeracao_descricao || (operacao.id_numeracao ? `ID: ${operacao.id_numeracao}` : '—')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={operacao.gera_financeiro ? 'Sim' : 'não'}
                        color={operacao.gera_financeiro ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(operacao)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(operacao.id_operacao)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog para Editar/Criar Operação */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Operação' : 'Nova Operação'}
        </DialogTitle>
        <DialogContent>
          {/* Tabs para organizar conteúdo */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabAtual} onChange={(e, newValue) => setTabAtual(newValue)} aria-label="Abas de configuração">
              <Tab label="📋 Dados Principais" />
              <Tab label="🔒 Validações" />
              <Tab label="📦 Entrega Futura" />
            </Tabs>
          </Box>

          {/* Aba 0: Dados Principais */}
          {tabAtual === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Nome da Operação"
                  value={currentOperacao.nome_operacao}
                  onChange={(e) => handleInputChange('nome_operacao', e.target.value)}
                  variant="outlined"
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Abreviação"
                  value={currentOperacao.abreviacao || ''}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().slice(0, 4);
                    handleInputChange('abreviacao', value);
                  }}
                  variant="outlined"
                  inputProps={{ maxLength: 4 }}
                  helperText="Máximo 4 letras"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  fullWidth
                  options={empresas.filter((emp, index, self) =>
                    index === self.findIndex((t) => (
                      (emp.cpf_cnpj && t.cpf_cnpj === emp.cpf_cnpj) ||
                      (!emp.cpf_cnpj && (t.id_empresa || t.id) === (emp.id_empresa || emp.id))
                    ))
                  )}
                  getOptionLabel={(option) => option.nome_razao_social || option.nome || ''}
                  value={empresas.find(e => {
                    const empresaId = e.id || e.id_empresa || e.ID;
                    return Number(empresaId) === Number(currentOperacao.id_empresa);
                  }) || null}
                  onChange={(event, newValue) => {
                    const empresaId = newValue ? (newValue.id || newValue.id_empresa || newValue.ID) : null;
                    handleInputChange('id_empresa', empresaId);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Empresa"
                      placeholder="Selecione uma empresa"
                      variant="outlined"
                    />
                  )}
                  noOptionsText="Nenhuma empresa encontrada"
                  isOptionEqualToValue={(option, value) => {
                    const optionId = option.id || option.id_empresa || option.ID;
                    const valueId = value.id || value.id_empresa || value.ID;
                    return optionId == valueId;
                  }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Transação</InputLabel>
                  <Select
                    value={currentOperacao.transacao}
                    onChange={(e) => handleInputChange('transacao', e.target.value)}
                    label="Transação"
                  >
                    <MenuItem value="">Nenhuma</MenuItem>
                    {tiposTransacao.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {getTransacaoLabel(tipo)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Modelo Documento</InputLabel>
                  <Select
                    value={currentOperacao.modelo_documento}
                    onChange={(e) => handleInputChange('modelo_documento', e.target.value)}
                    label="Modelo Documento"
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {modelosDocumentoOptions.map((opt) => (
                      <MenuItem key={opt.code} value={opt.code}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Emitente</InputLabel>
                  <Select
                    value={currentOperacao.emitente}
                    onChange={(e) => handleInputChange('emitente', e.target.value)}
                    label="Emitente"
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {tiposEmitente.map((emitente) => (
                      <MenuItem key={emitente} value={emitente}>
                        {emitente}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Série NF"
                  type="number"
                  value={currentOperacao.serie_nf}
                  onChange={(e) => handleInputChange('serie_nf', e.target.value)}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Próximo Documento"
                  type="number"
                  value={currentOperacao.proximo_numero_nf}
                  onClick={() => {
                    carregarNumeracoesSimples();
                    setOpenPickNumeracao(true);
                  }}
                  onChange={(e) => handleInputChange('proximo_numero_nf', e.target.value)}
                  variant="outlined"
                  helperText={
                    currentOperacao.id_numeracao
                      ? `Numeração: ${numeracoesSimples.find(n => n.id_numeracao === currentOperacao.id_numeracao)?.descricao || ''} — clique para alterar`
                      : 'Clique no campo para selecionar uma numeração'
                  }
                  InputProps={{
                    readOnly: true,
                    style: { cursor: 'pointer' }
                  }}
                  inputProps={{ style: { cursor: 'pointer' } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo Estoque Baixa</InputLabel>
                  <Select
                    value={currentOperacao.tipo_estoque_baixa}
                    onChange={(e) => handleInputChange('tipo_estoque_baixa', e.target.value)}
                    label="Tipo Estoque Baixa"
                  >
                    {tiposEstoque.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo === 'Nenhum' ? 'Nenhum (não baixar estoque)' : 'Baixar de Depósito Específico'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {currentOperacao.tipo_estoque_baixa === 'Deposito' && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={depositos}
                    getOptionLabel={(opt) => opt.nome_deposito || `Depósito ${opt.id_deposito}`}
                    value={depositos.find(d => String(d.id_deposito) === String(currentOperacao.id_deposito_baixa)) || null}
                    onChange={(e, newValue) => {
                      handleInputChange('id_deposito_baixa', newValue ? newValue.id_deposito : null);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Depósito para Baixa"
                        placeholder="Selecione o depósito"
                        fullWidth
                        required
                      />
                    )}
                    noOptionsText="Nenhum depósito cadastrado"
                    isOptionEqualToValue={(option, value) => option.id_deposito === value?.id_deposito}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo Estoque Incremento</InputLabel>
                  <Select
                    value={currentOperacao.tipo_estoque_incremento}
                    onChange={(e) => handleInputChange('tipo_estoque_incremento', e.target.value)}
                    label="Tipo Estoque Incremento"
                  >
                    {tiposEstoque.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo === 'Nenhum' ? 'Nenhum (não incrementar estoque)' : 'Incrementar em Depósito Específico'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {currentOperacao.tipo_estoque_incremento === 'Deposito' && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={depositos}
                    getOptionLabel={(opt) => opt.nome_deposito || `Depósito ${opt.id_deposito}`}
                    value={depositos.find(d => String(d.id_deposito) === String(currentOperacao.id_deposito_incremento)) || null}
                    onChange={(e, newValue) => {
                      handleInputChange('id_deposito_incremento', newValue ? newValue.id_deposito : null);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Depósito para Incremento"
                        placeholder="Selecione o depósito"
                        fullWidth
                        required
                      />
                    )}
                    noOptionsText="Nenhum depósito cadastrado"
                    isOptionEqualToValue={(option, value) => option.id_deposito === value?.id_deposito}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                  Configurações
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(currentOperacao.usa_auto_numeracao)}
                      onChange={(e) => handleInputChange('usa_auto_numeracao', e.target.checked)}
                    />
                  }
                  label="Usa Auto Numeração"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(currentOperacao.gera_financeiro)}
                      onChange={(e) => handleInputChange('gera_financeiro', e.target.checked)}
                    />
                  }
                  label="Gera Financeiro"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(currentOperacao.incrementar_estoque)}
                      onChange={(e) => handleInputChange('incrementar_estoque', e.target.checked)}
                    />
                  }
                  label="Incrementar Estoque"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(currentOperacao.venda_veiculo_novo)}
                      onChange={(e) => handleInputChange('venda_veiculo_novo', e.target.checked)}
                    />
                  }
                  label="🚗 Venda de Veículo Novo"
                />
              </Grid>
            </Grid>
          )}

          {/* Aba 1: Validações */}
          {tabAtual === 1 && (
            <Grid container spacing={3}>

              {/* ========== CONTROLE DE LIMITE DE CRÉDITO ========== */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    mt: 3,
                    p: 2.5,
                    bgcolor: 'warning.lighter',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'warning.main',
                    boxShadow: 2
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      color: 'warning.dark',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    🔐 Controle de Limite de Crédito
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={7}>
                      <FormControl fullWidth>
                        <InputLabel>Validação de Limite de Crédito</InputLabel>
                        <Select
                          value={currentOperacao.validacao_limite_credito || 'nao_validar'}
                          onChange={(e) => handleInputChange('validacao_limite_credito', e.target.value)}
                          label="Validação de Limite de Crédito"
                          sx={{ bgcolor: 'white' }}
                        >
                          <MenuItem value="nao_validar">🔓 Não Validar Limite</MenuItem>
                          <MenuItem value="alertar">⚠️ Alertar Operador</MenuItem>
                          <MenuItem value="bloquear">❌ Bloquear Venda</MenuItem>
                          <MenuItem value="solicitar_senha">🔐 Solicitar Senha Supervisor</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={5}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'warning.light',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {currentOperacao.validacao_limite_credito === 'alertar' &&
                            '⚠️ Mostra alerta mas permite continuar'}
                          {currentOperacao.validacao_limite_credito === 'bloquear' &&
                            '❌ Bloqueia a venda completamente'}
                          {currentOperacao.validacao_limite_credito === 'solicitar_senha' &&
                            '🔐 Requer autorização de supervisor'}
                          {(!currentOperacao.validacao_limite_credito || currentOperacao.validacao_limite_credito === 'nao_validar') &&
                            '🔓 Não verifica limite de crédito'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Box Validação de Atraso */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2.5,
                    bgcolor: 'warning.lighter',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'warning.main'
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      color: 'warning.dark',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    ⏰ Validação de Cliente em Atraso
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(currentOperacao.validar_atraso)}
                            onChange={(e) => handleInputChange('validar_atraso', e.target.checked)}
                            color="warning"
                          />
                        }
                        label="Validar Atraso"
                        sx={{ bgcolor: 'white', px: 2, py: 1, borderRadius: 1 }}
                      />
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Dias de Tolerância"
                        value={currentOperacao.dias_atraso_tolerancia || 0}
                        onChange={(e) => handleInputChange('dias_atraso_tolerancia', parseInt(e.target.value) || 0)}
                        disabled={!currentOperacao.validar_atraso}
                        sx={{ bgcolor: 'white' }}
                        helperText="0 = não tolera atraso"
                        InputProps={{ inputProps: { min: 0 } }}
                      />
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth disabled={!currentOperacao.validar_atraso}>
                        <InputLabel>Ação</InputLabel>
                        <Select
                          value={currentOperacao.acao_atraso || 'alertar'}
                          onChange={(e) => handleInputChange('acao_atraso', e.target.value)}
                          label="Ação"
                          sx={{ bgcolor: 'white' }}
                        >
                          <MenuItem value="alertar">⚠️ Alertar</MenuItem>
                          <MenuItem value="bloquear">❌ Bloquear</MenuItem>
                          <MenuItem value="solicitar_senha">🔐 Solicitar Senha</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'warning.light',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {!currentOperacao.validar_atraso && '❌ Não verifica atraso'}
                          {currentOperacao.validar_atraso && currentOperacao.acao_atraso === 'alertar' && '⚠️ Mostra alerta'}
                          {currentOperacao.validar_atraso && currentOperacao.acao_atraso === 'bloquear' && '🚫 Bloqueia venda'}
                          {currentOperacao.validar_atraso && currentOperacao.acao_atraso === 'solicitar_senha' && '🔑 Requer senha'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Box Validação de Estoque */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2.5,
                    bgcolor: 'info.lighter',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'info.main'
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      color: 'info.dark',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    📦 Validação de Estoque
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(currentOperacao.validar_estoque)}
                            onChange={(e) => handleInputChange('validar_estoque', e.target.checked)}
                            color="info"
                          />
                        }
                        label="Validar Estoque"
                        sx={{ bgcolor: 'white', px: 2, py: 1, borderRadius: 1 }}
                      />
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth disabled={!currentOperacao.validar_estoque}>
                        <InputLabel>Ação</InputLabel>
                        <Select
                          value={currentOperacao.acao_estoque || 'nao_validar'}
                          onChange={(e) => handleInputChange('acao_estoque', e.target.value)}
                          label="Ação"
                          sx={{ bgcolor: 'white' }}
                        >
                          <MenuItem value="nao_validar">➖ Não Validar</MenuItem>
                          <MenuItem value="alertar">⚠️ Alertar</MenuItem>
                          <MenuItem value="bloquear">❌ Bloquear</MenuItem>
                          <MenuItem value="solicitar_senha">🔐 Solicitar Senha</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'info.light',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {!currentOperacao.validar_estoque && '❌ Não verifica estoque disponível'}
                          {currentOperacao.validar_estoque && currentOperacao.acao_estoque === 'nao_validar' && '➖ Não valida'}
                          {currentOperacao.validar_estoque && currentOperacao.acao_estoque === 'alertar' && '⚠️ Mostra alerta se sem estoque'}
                          {currentOperacao.validar_estoque && currentOperacao.acao_estoque === 'bloquear' && '🚫 Bloqueia venda se sem estoque'}
                          {currentOperacao.validar_estoque && currentOperacao.acao_estoque === 'solicitar_senha' && '🔑 Requer senha se sem estoque'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Box Limite de Desconto */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2.5,
                    bgcolor: 'warning.lighter',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'warning.main'
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      color: 'warning.dark',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    💲 Limite de Desconto
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Limite de Desconto Percentual (%)"
                        value={currentOperacao.limite_desconto_percentual || 0}
                        onChange={(e) => handleInputChange('limite_desconto_percentual', parseFloat(e.target.value) || 0)}
                        inputProps={{
                          min: 0,
                          max: 100,
                          step: 0.01
                        }}
                        helperText="Ex: 10.00 para permitir até 10% sem aprovação"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'warning.light',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {(parseFloat(currentOperacao.limite_desconto_percentual) || 0) > 0 ? (
                            <>
                              ✅ Descontos até <strong>{(parseFloat(currentOperacao.limite_desconto_percentual) || 0).toFixed(2)}%</strong> permitidos. Acima disso, requer aprovação do supervisor via WhatsApp
                            </>
                          ) : (
                            '⚠️ Limite 0%: Qualquer desconto requer aprovação do supervisor'
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Box Cashback */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2.5,
                    bgcolor: 'success.lighter',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'success.main'
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      color: 'success.dark',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    💰 Cashback
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Percentual de Cashback (%)"
                        value={currentOperacao.cashback_percentual || 0}
                        onChange={(e) => handleInputChange('cashback_percentual', parseFloat(e.target.value) || 0)}
                        inputProps={{
                          min: 0,
                          max: 100,
                          step: 0.01
                        }}
                        helperText="Exemplo: 5.00 para gerar 5% de cashback nas vendas"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Validade do Cashback (dias)"
                        value={currentOperacao.cashback_validade_dias || 30}
                        onChange={(e) => handleInputChange('cashback_validade_dias', parseInt(e.target.value) || 30)}
                        inputProps={{
                          min: 1,
                          max: 365
                        }}
                        helperText="Dias até o cashback expirar (padrão: 30 dias)"
                        sx={{ bgcolor: 'white' }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'success.light'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {(parseFloat(currentOperacao.cashback_percentual) || 0) > 0 ? (
                            <>
                              💡 <strong>Exemplo:</strong> Venda de R$ 100,00 gerará R$ {(parseFloat(currentOperacao.cashback_percentual) || 0).toFixed(2)} de cashback válido por {currentOperacao.cashback_validade_dias || 30} dias
                            </>
                          ) : (
                            '💡 Configure um percentual maior que 0 para ativar o cashback nas vendas'
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Box Faturamento Avançado */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2.5,
                    bgcolor: 'info.lighter',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'info.main',
                    boxShadow: 2
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      color: 'info.dark',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    📄 Faturamento Avançado
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(currentOperacao.ind_faturamento)}
                            onChange={(e) => handleInputChange('ind_faturamento', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Esta operação é de faturamento"
                      />
                      <Typography variant="caption" display="block" sx={{ ml: 6, mt: 0.5, color: 'text.secondary' }}>
                        📋 Marque para operações que convertem pedidos ou cupons fiscais em notas fiscais (NF-e/NFC-e).
                      </Typography>
                    </Grid>

                    {currentOperacao.ind_faturamento && (
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Tipo de Faturamento *</InputLabel>
                          <Select
                            value={currentOperacao.tipo_faturamento || ''}
                            onChange={(e) => handleInputChange('tipo_faturamento', e.target.value)}
                            label="Tipo de Faturamento *"
                          >
                            <MenuItem value="pedido_para_nota">
                              📝 Pedido → NF-e (Nota Fiscal)
                            </MenuItem>
                            <MenuItem value="pedido_para_cupom">
                              🧾 Pedido → NFC-e (Cupom Fiscal)
                            </MenuItem>
                            <MenuItem value="cupom_para_nota">
                              🔄 Cupom Fiscal → NF-e (Nota Fiscal)
                            </MenuItem>
                          </Select>
                        </FormControl>
                        <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                          {currentOperacao.tipo_faturamento === 'pedido_para_nota' && '📦 Converte pedidos (sem documento fiscal) em NF-e modelo 55. CFOP da operação/produto.'}
                          {currentOperacao.tipo_faturamento === 'pedido_para_cupom' && '📦 Converte pedidos em Cupom Fiscal NFC-e modelo 65. CFOP da operação/produto.'}
                          {currentOperacao.tipo_faturamento === 'cupom_para_nota' && '🧾 Converte cupons fiscais (NFC-e/SAT) já autorizados em NF-e modelo 55. CFOP 5929 + NFref.'}
                          {!currentOperacao.tipo_faturamento && '⚠️ Selecione o tipo de faturamento para definir o fluxo de conversão.'}
                        </Typography>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(currentOperacao.validar_estoque_fiscal)}
                            onChange={(e) => handleInputChange('validar_estoque_fiscal', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Validar estoque fiscal antes de autorizar a emissão"
                      />
                      <Typography variant="caption" display="block" sx={{ ml: 6, mt: 0.5, color: 'text.secondary' }}>
                        🔍 Quando marcado, o sistema verifica se há estoque fiscal suficiente antes de emitir a nota. Evita problemas com SEFAZ.
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'info.light'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {currentOperacao.ind_faturamento ? (
                            <>
                              ✅ <strong>Operação de Faturamento ATIVADA</strong>
                              {currentOperacao.tipo_faturamento === 'pedido_para_nota' && ' — Pedido → NF-e'}
                              {currentOperacao.tipo_faturamento === 'pedido_para_cupom' && ' — Pedido → NFC-e'}
                              {currentOperacao.tipo_faturamento === 'cupom_para_nota' && ' — Cupom → NF-e'}
                              {!currentOperacao.tipo_faturamento && ' — ⚠️ Selecione o tipo de faturamento acima'}
                              {currentOperacao.validar_estoque_fiscal && ". O sistema validará o estoque fiscal antes de emitir."}
                            </>
                          ) : (
                            '💡 Marque "Operação de Faturamento" e selecione o tipo para usar nos fluxos de conversão.'
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Aba 2: Entrega Futura */}
          {tabAtual === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2.5,
                    bgcolor: 'primary.lighter',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    boxShadow: 2
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      color: 'primary.dark',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    📦 Entrega Futura
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(currentOperacao.entrega_futura)}
                            onChange={(e) => handleInputChange('entrega_futura', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Esta operação é Entrega Futura"
                        sx={{ 
                          bgcolor: 'white', 
                          px: 2, 
                          py: 1, 
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'primary.light'
                        }}
                      />
                    </Grid>

                    {currentOperacao.entrega_futura && (
                      <Grid item xs={12} md={8}>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: 'white',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'primary.light'
                          }}
                        >
                          <FormControl component="fieldset">
                            <FormLabel component="legend" sx={{ fontWeight: 'bold', color: 'primary.dark', mb: 1 }}>
                              Tipo de Operação de Entrega Futura
                            </FormLabel>
                            <RadioGroup
                              value={currentOperacao.tipo_entrega_futura || 'origem'}
                              onChange={(e) => handleInputChange('tipo_entrega_futura', e.target.value)}
                              row
                            >
                              <FormControlLabel 
                                value="origem" 
                                control={<Radio color="primary" />} 
                                label="📝 Origem (Pedido)" 
                              />
                              <FormControlLabel 
                                value="destino" 
                                control={<Radio color="success" />} 
                                label="📦 Destino (Entrega)" 
                              />
                            </RadioGroup>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                              {currentOperacao.tipo_entrega_futura === 'origem' ? (
                                '📝 Pedido/Venda Futura: Gera financeiro, mas NÃO dá baixa no estoque'
                              ) : (
                                '📦 Entrega: Dá baixa no estoque, mas NÃO gera financeiro (já foi gerado no pedido)'
                              )}
                            </Typography>
                          </FormControl>
                        </Box>
                      </Grid>
                    )}

                    <Grid item xs={12} md={currentOperacao.entrega_futura ? 12 : 8}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'primary.light',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {currentOperacao.entrega_futura ? (
                            <>
                              ✅ <strong>Ativo:</strong> Vendas nesta operação serão registradas mas NÃO darão baixa no estoque imediatamente. 
                              Você deverá gerar uma venda de entrega posteriormente para movimentar o estoque.
                            </>
                          ) : (
                            <>
                              ❌ <strong>Desativado:</strong> Vendas nesta operação funcionarão normalmente, 
                              dando baixa no estoque imediatamente conforme configurado.
                            </>
                          )}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 3,
                          bgcolor: 'info.lighter',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'info.main'
                        }}
                      >
                        <Typography variant="h6" sx={{ mb: 2, color: 'info.dark', fontWeight: 'bold' }}>
                          ℹ️ Como funciona a Entrega Futura?
                        </Typography>
                        
                        <Typography variant="body2" paragraph sx={{ mb: 2 }}>
                          <strong>1. Venda Futura (Pedido):</strong><br />
                          • Cliente faz um pedido, mas o produto será entregue depois<br />
                          • O sistema registra a venda mas NÃO mexe no estoque<br />
                          • Financeiro é gerado normalmente (contas a receber)<br />
                          • A venda fica marcada como "entrega pendente"
                        </Typography>

                        <Typography variant="body2" paragraph sx={{ mb: 2 }}>
                          <strong>2. Venda de Entrega:</strong><br />
                          • Quando for entregar o produto, você cria uma nova venda de ENTREGA<br />
                          • Esta venda está vinculada ao pedido original (venda futura)<br />
                          • AGORA SIM o estoque é baixado<br />
                          • Não gera financeiro duplicado (já foi gerado no pedido)
                        </Typography>

                        <Typography variant="body2" sx={{ color: 'success.dark' }}>
                          <strong>💡 Exemplo prático:</strong><br />
                          Cliente encomenda 10 caixas de cerveja para festa no próximo mês.<br />
                          • Hoje: Faz a venda futura (gera contas a receber, não baixa estoque)<br />
                          • Daqui 30 dias: Faz a venda de entrega (baixa estoque, não gera financeiro)
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de seleção de Numeração (Próximo Documento) */}
      <Dialog open={openPickNumeracao} onClose={() => setOpenPickNumeracao(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Selecionar Numeração</DialogTitle>
        <DialogContent>
          {loadingNumeracao ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Descrição</strong></TableCell>
                    <TableCell><strong>Numeração</strong></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {numeracoesSimples.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        Nenhuma numeração cadastrada. Use o botão "Numeração" para cadastrar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    numeracoesSimples.map((num) => (
                      <TableRow
                        key={num.id_numeracao}
                        hover
                        selected={currentOperacao.id_numeracao === num.id_numeracao}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          handleInputChange('proximo_numero_nf', parseInt(num.numeracao) || 1);
                          handleInputChange('id_numeracao', num.id_numeracao);
                          setOpenPickNumeracao(false);
                        }}
                      >
                        <TableCell>{num.descricao}</TableCell>
                        <TableCell>{num.numeracao}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant={currentOperacao.id_numeracao === num.id_numeracao ? 'contained' : 'outlined'}>
                            {currentOperacao.id_numeracao === num.id_numeracao ? 'Selecionado' : 'Selecionar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          {currentOperacao.id_numeracao && (
            <Button color="error" onClick={() => { handleInputChange('id_numeracao', null); setOpenPickNumeracao(false); }}>
              Remover Seleção
            </Button>
          )}
          <Button onClick={() => setOpenPickNumeracao(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Numeração */}
      <Dialog open={openNumeracaoDialog} onClose={() => { setOpenNumeracaoDialog(false); setEditingNumeracaoId(null); setNumeracaoForm({ descricao: '', numeracao: '' }); }} maxWidth="sm" fullWidth>
        <DialogTitle>🔢 Numeração</DialogTitle>
        <DialogContent>
          {/* Formulário */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 3, mt: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              {editingNumeracaoId ? '✏️ Editar Numeração' : '➕ Nova Numeração'}
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="Descrição"
                  value={numeracaoForm.descricao}
                  onChange={(e) => setNumeracaoForm(prev => ({ ...prev, descricao: e.target.value }))}
                  inputProps={{ maxLength: 20 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Numeração"
                  value={numeracaoForm.numeracao}
                  onChange={(e) => setNumeracaoForm(prev => ({ ...prev, numeracao: e.target.value }))}
                  inputProps={{ maxLength: 8 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button fullWidth variant="contained" onClick={handleSaveNumeracao} disabled={loadingNumeracao} startIcon={editingNumeracaoId ? <SaveIcon /> : <AddIcon />}>
                  {editingNumeracaoId ? 'Salvar' : 'Adicionar'}
                </Button>
                {editingNumeracaoId && (
                  <Button fullWidth size="small" sx={{ mt: 1 }} onClick={() => { setEditingNumeracaoId(null); setNumeracaoForm({ descricao: '', numeracao: '' }); }}>
                    Cancelar
                  </Button>
                )}
              </Grid>
            </Grid>
          </Box>

          {/* Listagem */}
          {loadingNumeracao ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Descrição</strong></TableCell>
                    <TableCell><strong>Numeração</strong></TableCell>
                    <TableCell><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {numeracoesSimples.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">Nenhuma numeração cadastrada</TableCell>
                    </TableRow>
                  ) : (
                    numeracoesSimples.map((num) => (
                      <TableRow key={num.id_numeracao} hover>
                        <TableCell>{num.id_numeracao}</TableCell>
                        <TableCell>{num.descricao}</TableCell>
                        <TableCell>{num.numeracao}</TableCell>
                        <TableCell>
                          <IconButton color="primary" size="small" onClick={() => { setEditingNumeracaoId(num.id_numeracao); setNumeracaoForm({ descricao: num.descricao, numeracao: num.numeracao }); }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" size="small" onClick={() => handleDeleteNumeracao(num.id_numeracao)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenNumeracaoDialog(false); setEditingNumeracaoId(null); setNumeracaoForm({ descricao: '', numeracao: '' }); }}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Conjuntos de Operações */}
      <ConjuntoOperacoesDialog
        open={openConjuntosDialog}
        onClose={() => setOpenConjuntosDialog(false)}
        onSave={() => {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }}
      />
    </Box>
  );
};

export default OperacoesConfig;