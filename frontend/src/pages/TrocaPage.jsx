import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
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
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  InputAdornment,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  SwapHoriz as SwapIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  MonetizationOn as MoneyIcon,
  Receipt as ReceiptIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatDate } from "../utils/formatters";

const TrocaPage = () => {
  const { axiosInstance, user, permissions, isLoading: authLoading } = useAuth();

  // Estados principais
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDays, setSearchDays] = useState(7);
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Estados do diálogo de troca
  const [trocaDialog, setTrocaDialog] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [vendaItens, setVendaItens] = useState([]);
  const [itensRetorno, setItensRetorno] = useState([]);
  const [itensSubstituicao, setItensSubstituicao] = useState([]);
  const [produtosSugestao, setProdutosSugestao] = useState([]);
  const [observacao, setObservacao] = useState('');

  // Estados de condição de pagamento
  const [paymentOptions, setPaymentOptions] = useState({
    contas: [],
    tipos_pagamento: [],
    centros_custo: [],
    condicoes_pagamento: []
  });
  const [selectedConta, setSelectedConta] = useState(null);
  const [selectedTipoPagamento, setSelectedTipoPagamento] = useState(null);
  const [selectedCentroCusto, setSelectedCentroCusto] = useState(null);
  const [selectedCondicaoPagamento, setSelectedCondicaoPagamento] = useState(null);
  const [dataVencimento, setDataVencimento] = useState('');
  const [numeroParcelas, setNumeroParcelas] = useState(1);

  // Estados de cálculo
  const [totalRetorno, setTotalRetorno] = useState(0);
  const [totalSubstituicao, setTotalSubstituicao] = useState(0);
  const [diferenca, setDiferenca] = useState(0);

  // Estados de UI
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Carregar opções de pagamento ao montar o componente
  useEffect(() => {
    const loadPaymentOptions = async () => {
      try {
        const response = await axiosInstance.get('/trocas/payment-options/');
        setPaymentOptions(response.data);
      } catch (error) {
        console.error('Erro ao carregar opções de pagamento:', error);
      }
    };

    loadPaymentOptions();
  }, [axiosInstance]);

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user?.is_staff && !permissions?.trocas_acessar) {
    return (
      <Box p={3}>
        <Alert severity="warning">Você não tem permissão para acessar Trocas.</Alert>
      </Box>
    );
  }

  // Buscar vendas por produto
  const handleSearchSales = useCallback(async () => {
    if (!searchTerm.trim()) {
      showSnackbar('Digite um produto para buscar', 'warning');
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axiosInstance.get('/trocas/search-sales/', {
        params: {
          produto: searchTerm,
          days: searchDays
        }
      });

      setVendas(response.data.vendas || []);

      if (response.data.vendas.length === 0) {
        showSnackbar('Nenhuma venda encontrada com este produto', 'info');
      } else {
        showSnackbar(`${response.data.vendas.length} vendas encontradas`, 'success');
      }
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      showSnackbar('Erro ao buscar vendas', 'error');
    } finally {
      setSearchLoading(false);
    }
  }, [searchTerm, searchDays, axiosInstance]);

  // Abrir diálogo de troca
  const handleOpenTroca = async (venda) => {
    setSelectedVenda(venda);
    setLoading(true);

    try {
      // Buscar itens da venda
      const response = await axiosInstance.get(`/trocas/sales/${venda.id_venda}/items/`);
      setVendaItens(response.data.itens || []);

      // Resetar estados
      setItensRetorno([]);
      setItensSubstituicao([]);
      setObservacao('');
      // Resetar campos de pagamento
      setSelectedConta(null);
      setSelectedTipoPagamento(null);
      setSelectedCentroCusto(null);
      setSelectedCondicaoPagamento(null);
      setDataVencimento('');
      setNumeroParcelas(1);

      setTrocaDialog(true);
    } catch (error) {
      console.error('Erro ao buscar itens da venda:', error);
      showSnackbar('Erro ao carregar itens da venda', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fechar diálogo de troca
  const handleCloseTroca = () => {
    setTrocaDialog(false);
    setSelectedVenda(null);
    setVendaItens([]);
    setItensRetorno([]);
    setItensSubstituicao([]);
    setObservacao('');
    // Limpar campos de pagamento
    setSelectedConta(null);
    setSelectedTipoPagamento(null);
    setSelectedCentroCusto(null);
    setSelectedCondicaoPagamento(null);
    setDataVencimento('');
    setNumeroParcelas(1);
  };

  // Adicionar item para retorno
  const handleAddItemRetorno = (vendaItem) => {
    const existingIndex = itensRetorno.findIndex(
      item => item.id_venda_item_original === vendaItem.id_venda_item
    );

    if (existingIndex >= 0) {
      showSnackbar('Item já adicionado ao retorno', 'warning');
      return;
    }

    const novoItem = {
      id_venda_item_original: vendaItem.id_venda_item,
      id_produto_retorno: vendaItem.id_produto,
      nome_produto: vendaItem.nome_produto,
      quantidade_retorno: vendaItem.quantidade,
      quantidade_maxima: vendaItem.quantidade,
      valor_unit_retorno: vendaItem.valor_unitario,
      valor_total_retorno: vendaItem.valor_total
    };

    setItensRetorno([...itensRetorno, novoItem]);
  };

  // Remover item do retorno
  const handleRemoveItemRetorno = (index) => {
    const novosItens = itensRetorno.filter((_, i) => i !== index);
    setItensRetorno(novosItens);
  };

  // Atualizar quantidade de retorno
  const handleUpdateQuantidadeRetorno = (index, novaQuantidade) => {
    const novosItens = [...itensRetorno];
    const item = novosItens[index];

    if (novaQuantidade > item.quantidade_maxima) {
      showSnackbar('Quantidade não pode ser maior que a vendida', 'warning');
      return;
    }

    if (novaQuantidade <= 0) {
      showSnackbar('Quantidade deve ser maior que zero', 'warning');
      return;
    }

    item.quantidade_retorno = novaQuantidade;
    item.valor_total_retorno = novaQuantidade * item.valor_unit_retorno;

    setItensRetorno(novosItens);
  };

  // Buscar produtos para substituição
  const handleSearchProdutos = async (termo) => {
    console.log('🔍 Buscando produtos com termo:', termo);
    if (!termo || termo.length < 2) {
      setProdutosSugestao([]);
      return;
    }

    try {
      console.log('📡 Fazendo requisição para:', '/trocas/search-products/');
      const response = await axiosInstance.get('/trocas/search-products/', {
        params: { termo, limit: 10 }
      });
      console.log('✅ Resposta da API:', response.data);
      setProdutosSugestao(response.data.produtos || []);
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
    }
  };

  // Adicionar produto de substituição
  const handleAddProdutoSubstituicao = (produto) => {
    const novoItem = {
      id_produto_substituicao: produto.id_produto,
      nome_produto: produto.nome_produto,
      codigo_produto: produto.codigo_produto,
      quantidade_substituicao: 1,
      valor_unit_substituicao: produto.valor_venda,
      valor_total_substituicao: produto.valor_venda,
      estoque_disponivel: produto.estoque_disponivel
    };

    setItensSubstituicao([...itensSubstituicao, novoItem]);
  };

  // Remover produto de substituição
  const handleRemoveProdutoSubstituicao = (index) => {
    const novosItens = itensSubstituicao.filter((_, i) => i !== index);
    setItensSubstituicao(novosItens);
  };

  // Atualizar quantidade de substituição
  const handleUpdateQuantidadeSubstituicao = (index, novaQuantidade) => {
    const novosItens = [...itensSubstituicao];
    const item = novosItens[index];

    if (novaQuantidade > item.estoque_disponivel) {
      showSnackbar('Quantidade não pode ser maior que o estoque', 'warning');
      return;
    }

    if (novaQuantidade <= 0) {
      showSnackbar('Quantidade deve ser maior que zero', 'warning');
      return;
    }

    item.quantidade_substituicao = novaQuantidade;
    item.valor_total_substituicao = novaQuantidade * item.valor_unit_substituicao;

    setItensSubstituicao(novosItens);
  };

  // Atualizar valor unitário de substituição
  const handleUpdateValorSubstituicao = (index, novoValor) => {
    if (novoValor < 0) {
      showSnackbar('Valor deve ser positivo', 'warning');
      return;
    }

    const novosItens = [...itensSubstituicao];
    const item = novosItens[index];

    item.valor_unit_substituicao = novoValor;
    item.valor_total_substituicao = item.quantidade_substituicao * novoValor;

    setItensSubstituicao(novosItens);
  };

  // Calcular totais
  useEffect(() => {
    const novoTotalRetorno = itensRetorno.reduce(
      (sum, item) => sum + parseFloat(item.valor_total_retorno || 0), 0
    );
    const novoTotalSubstituicao = itensSubstituicao.reduce(
      (sum, item) => sum + parseFloat(item.valor_total_substituicao || 0), 0
    );

    setTotalRetorno(novoTotalRetorno);
    setTotalSubstituicao(novoTotalSubstituicao);
    setDiferenca(novoTotalSubstituicao - novoTotalRetorno);
  }, [itensRetorno, itensSubstituicao]);

  // Criar troca
  const handleCreateTroca = async () => {
    if (itensRetorno.length === 0 && itensSubstituicao.length === 0) {
      showSnackbar('Adicione pelo menos um item de retorno ou substituição', 'warning');
      return;
    }

    // Validar campos de pagamento se houver diferença
    if (diferenca !== 0) {
      if (!selectedConta) {
        showSnackbar('Selecione uma conta para o financeiro', 'warning');
        return;
      }
      if (!selectedTipoPagamento) {
        showSnackbar('Selecione um tipo de pagamento', 'warning');
        return;
      }
      if (!selectedCondicaoPagamento) {
        showSnackbar('Selecione uma condição de pagamento', 'warning');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        id_venda_original: selectedVenda.id_venda,
        id_cliente: selectedVenda.id_cliente,
        observacao,
        itens_retorno: itensRetorno.map(item => ({
          id_venda_item_original: item.id_venda_item_original,
          id_produto_retorno: item.id_produto_retorno,
          quantidade_retorno: item.quantidade_retorno,
          valor_unit_retorno: item.valor_unit_retorno
        })),
        itens_substituicao: itensSubstituicao.map(item => ({
          id_produto_substituicao: item.id_produto_substituicao,
          quantidade_substituicao: item.quantidade_substituicao,
          valor_unit_substituicao: item.valor_unit_substituicao
        })),
        // Campos de pagamento (apenas se houver diferença)
        id_conta: selectedConta?.id || null,
        id_tipo_pagamento: selectedTipoPagamento?.id || null,
        id_centro_custo: selectedCentroCusto?.id || null,
        id_condicao_pagamento: selectedCondicaoPagamento?.id || null,
        data_vencimento: dataVencimento || null,
        numero_parcelas: numeroParcelas || 1
      };

      const response = await axiosInstance.post('/trocas/create/', payload);

      showSnackbar('Troca criada com sucesso!', 'success');
      handleCloseTroca();

      // Opcional: mostrar informações do financeiro criado
      if (response.data.financeiro) {
        const { tipo_ajuste, valor_diferenca } = response.data.financeiro;
        if (tipo_ajuste === 'cobranca') {
          showSnackbar(`Cobrança adicional gerada: ${formatCurrency(valor_diferenca)}`, 'info');
        } else if (tipo_ajuste === 'credito') {
          showSnackbar(`Crédito gerado: ${formatCurrency(Math.abs(valor_diferenca))}`, 'info');
        }
      }

    } catch (error) {
      console.error('Erro ao criar troca:', error);
      const errorMsg = error.response?.data?.error || 'Erro ao criar troca';
      showSnackbar(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para snackbar
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Buscar automaticamente ao pressionar Enter
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearchSales();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SwapIcon color="primary" />
        Trocas de Produtos
      </Typography>

      {/* Card de Busca */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Buscar Vendas para Troca
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Produto (código ou nome)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                placeholder="Ex: PROD001 ou Nome do Produto"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Últimos dias</InputLabel>
                <Select
                  value={searchDays}
                  onChange={(e) => setSearchDays(e.target.value)}
                  label="Últimos dias"
                >
                  <MenuItem value={7}>7 dias</MenuItem>
                  <MenuItem value={15}>15 dias</MenuItem>
                  <MenuItem value={30}>30 dias</MenuItem>
                  <MenuItem value={60}>60 dias</MenuItem>
                  <MenuItem value={90}>90 dias</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleSearchSales}
                disabled={searchLoading}
                sx={{ height: 56 }}
              >
                {searchLoading ? <CircularProgress size={24} /> : 'Buscar Vendas'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de Vendas */}
      {vendas.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vendas Encontradas ({vendas.length})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Documento</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>CPF/CNPJ</TableCell>
                    <TableCell align="right">Valor Total</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vendas.map((venda) => (
                    <TableRow key={venda.id_venda} hover>
                      <TableCell>{venda.numero_documento || `#${venda.id_venda}`}</TableCell>
                      <TableCell>{formatDate(venda.data_documento)}</TableCell>
                      <TableCell>{venda.cliente_nome}</TableCell>
                      <TableCell>{venda.cliente_documento}</TableCell>
                      <TableCell align="right">{formatCurrency(venda.valor_total)}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleOpenTroca(venda)}
                          startIcon={<SwapIcon />}
                        >
                          Fazer Troca
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de Troca */}
      <Dialog
        open={trocaDialog}
        onClose={handleCloseTroca}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { minHeight: '80vh' } }}
      >
        <DialogTitle>
          Criar Troca - Venda #{selectedVenda?.numero_documento || selectedVenda?.id_venda}
          <Typography variant="body2" color="text.secondary">
            Cliente: {selectedVenda?.cliente_nome}
          </Typography>
        </DialogTitle>

        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Itens da Venda Original */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Itens da Venda
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Produto</TableCell>
                        <TableCell align="right">Qtd</TableCell>
                        <TableCell align="right">Valor</TableCell>
                        <TableCell align="center">Ação</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vendaItens.map((item) => (
                        <TableRow key={item.id_venda_item}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {item.nome_produto}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Cód: {item.codigo_produto}
                            </Typography>
                            {item.quantidade_trocada > 0 && (
                              <Typography variant="caption" color="warning.main" display="block">
                                ⚠️ Já trocado: {item.quantidade_trocada}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {item.quantidade}
                            </Typography>
                            {item.quantidade_original > item.quantidade && (
                              <Typography variant="caption" color="text.secondary">
                                (de {item.quantidade_original})
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{formatCurrency(item.valor_total)}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="Adicionar ao retorno">
                              <IconButton
                                size="small"
                                onClick={() => handleAddItemRetorno(item)}
                                color="primary"
                              >
                                <AddIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Itens de Retorno */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Itens de Retorno
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Produto</TableCell>
                        <TableCell align="right">Qtd</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Ação</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {itensRetorno.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography color="text.secondary">
                              Nenhum item selecionado para retorno
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        itensRetorno.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {item.nome_produto}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                value={item.quantidade_retorno}
                                onChange={(e) => handleUpdateQuantidadeRetorno(index, parseFloat(e.target.value))}
                                inputProps={{ min: 0.1, max: item.quantidade_maxima, step: 0.1 }}
                                size="small"
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.valor_total_retorno)}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveItemRetorno(index)}
                                color="error"
                              >
                                <RemoveIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Produtos de Substituição */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Produtos de Substituição
                </Typography>

                {/* Busca de Produtos */}
                <Autocomplete
                  options={produtosSugestao}
                  getOptionLabel={(option) => `${option.nome_produto} (${option.codigo_produto})`}
                  onInputChange={(event, newInputValue) => {
                    handleSearchProdutos(newInputValue);
                  }}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      handleAddProdutoSubstituicao(newValue);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Buscar produto para substituição"
                      placeholder="Digite código ou nome do produto"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {params.InputProps.endAdornment}
                            <SearchIcon />
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {option.nome_produto}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cód: {option.codigo_produto} | Estoque: {option.estoque_disponivel} | {formatCurrency(option.valor_venda)}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  sx={{ mb: 2 }}
                />

                {/* Tabela de Substituição */}
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Produto</TableCell>
                        <TableCell align="right">Qtd</TableCell>
                        <TableCell align="right">Valor Unit.</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Ação</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {itensSubstituicao.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography color="text.secondary">
                              Nenhum produto selecionado para substituição
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        itensSubstituicao.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {item.nome_produto}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Cód: {item.codigo_produto} | Estoque: {item.estoque_disponivel}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                value={item.quantidade_substituicao}
                                onChange={(e) => handleUpdateQuantidadeSubstituicao(index, parseFloat(e.target.value))}
                                inputProps={{ min: 0.1, max: item.estoque_disponivel, step: 0.1 }}
                                size="small"
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                value={item.valor_unit_substituicao}
                                onChange={(e) => handleUpdateValorSubstituicao(index, parseFloat(e.target.value))}
                                inputProps={{ min: 0, step: 0.01 }}
                                size="small"
                                sx={{ width: 100 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.valor_total_substituicao)}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveProdutoSubstituicao(index)}
                                color="error"
                              >
                                <RemoveIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Resumo Financeiro */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Resumo Financeiro
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography>Total Retorno:</Typography>
                        <Typography fontWeight="bold" color="error.main">
                          {formatCurrency(totalRetorno)}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography>Total Substituição:</Typography>
                        <Typography fontWeight="bold" color="success.main">
                          {formatCurrency(totalSubstituicao)}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography>Diferença:</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            fontWeight="bold"
                            color={diferenca > 0 ? 'warning.main' : diferenca < 0 ? 'info.main' : 'text.primary'}
                          >
                            {formatCurrency(Math.abs(diferenca))}
                          </Typography>
                          <Chip
                            label={
                              diferenca > 0 ? 'Cobrar Cliente' :
                                diferenca < 0 ? 'Gerar Crédito' :
                                  'Neutro'
                            }
                            color={
                              diferenca > 0 ? 'warning' :
                                diferenca < 0 ? 'info' :
                                  'success'
                            }
                            size="small"
                          />
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Condições de Pagamento - mostrar apenas se houver diferença */}
              {diferenca !== 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Condições de Pagamento
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          options={paymentOptions.contas || []}
                          getOptionLabel={(option) => `${option.nome} (${option.tipo})`}
                          value={selectedConta}
                          onChange={(e, newValue) => setSelectedConta(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Conta *"
                              required
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          options={paymentOptions.tipos_pagamento || []}
                          getOptionLabel={(option) => option.nome}
                          value={selectedTipoPagamento}
                          onChange={(e, newValue) => setSelectedTipoPagamento(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Tipo de Pagamento *"
                              required
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          options={paymentOptions.centros_custo || []}
                          getOptionLabel={(option) => option.nome}
                          value={selectedCentroCusto}
                          onChange={(e, newValue) => setSelectedCentroCusto(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Centro de Custo"
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          options={paymentOptions.condicoes_pagamento || []}
                          getOptionLabel={(option) => `${option.nome} (${option.numero_parcelas}x)`}
                          value={selectedCondicaoPagamento}
                          onChange={(e, newValue) => {
                            setSelectedCondicaoPagamento(newValue);
                            if (newValue) {
                              setNumeroParcelas(newValue.numero_parcelas || 1);
                              // Calcular vencimento baseado nos dias de prazo
                              if (newValue.dias_prazo) {
                                const hoje = new Date();
                                hoje.setDate(hoje.getDate() + newValue.dias_prazo);
                                setDataVencimento(hoje.toISOString().split('T')[0]);
                              }
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Condição de Pagamento *"
                              required
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Data de Vencimento"
                          value={dataVencimento}
                          onChange={(e) => setDataVencimento(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Número de Parcelas"
                          value={numeroParcelas}
                          onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 1)}
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* Observações */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  multiline
                  rows={3}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Observações sobre a troca..."
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseTroca} startIcon={<CancelIcon />}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateTroca}
            variant="contained"
            disabled={loading || (itensRetorno.length === 0 && itensSubstituicao.length === 0)}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {loading ? 'Criando...' : 'Criar Troca'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrocaPage;