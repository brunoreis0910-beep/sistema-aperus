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
  Alert,
  IconButton,
  Avatar,
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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Badge,
  Autocomplete
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  TrendingUp as EntradaIcon,
  TrendingDown as SaidaIcon,
  SwapHoriz as TransferenciaIcon,
  Tune as AjusteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`estoque-tabpanel-${index}`}
      aria-labelledby={`estoque-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EstoqueConfig = () => {
  const { axiosInstance } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Estados para estoque
  const [estoque, setEstoque] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [resumoGeral, setResumoGeral] = useState({});

  // Estados para dialogs
  const [openEstoqueDialog, setOpenEstoqueDialog] = useState(false);
  const [openMovimentacaoDialog, setOpenMovimentacaoDialog] = useState(false);
  const [openAjusteDialog, setOpenAjusteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estados para formulários
  const [currentEstoque, setCurrentEstoque] = useState({
    id_estoque: null,
    id_produto: '',
    id_deposito: '',
    quantidade: 0,
    quantidade_minima: 0,
    quantidade_maxima: null,
    custo_medio: 0,
    ativo: true
  });

  const [currentMovimentacao, setCurrentMovimentacao] = useState({
    id_produto: '',
    id_deposito: '',
    tipo_movimentacao: 'ENTRADA',
    quantidade_movimentada: 0,
    custo_unitario: 0,
    documento_numero: '',
    documento_tipo: 'COMPRA',
    observacoes: ''
  });

  const [ajusteEstoque, setAjusteEstoque] = useState({
    id_produto: '',
    id_deposito: '',
    quantidade_nova: 0,
    observacoes: ''
  });

  // Estados para filtro e múltiplos ajustes
  const [filtroEstoque, setFiltroEstoque] = useState('');
  const [ajustesMultiplos, setAjustesMultiplos] = useState([
    { id_produto: '', id_deposito: '', quantidade_nova: 0 }
  ]);
  const [defaultDeposit, setDefaultDeposit] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      await Promise.all([
        carregarEstoque(),
        carregarMovimentacoes(),
        carregarProdutos(),
        carregarDepositos(),
        carregarResumoGeral()
      ]);
      setError(null);
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
      console.error('Detalhes do erro:', err.response?.data);
      setError('Erro ao carregar dados do estoque: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const carregarEstoque = async () => {
    const response = await axiosInstance.get('/estoque/');
    // Garantir que sempre seja um array, tratando resposta paginada
    const data = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.results || response.data?.value || []);
    setEstoque(data);
  };

  const carregarMovimentacoes = async () => {
    const response = await axiosInstance.get('/estoque-movimentacoes/');
    // Garantir que sempre seja um array, tratando resposta paginada
    const data = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.results || response.data?.value || []);
    setMovimentacoes(data.slice(0, 50));
  };

  const carregarProdutos = async () => {
    const response = await axiosInstance.get('/produtos/');
    // Garantir que sempre seja um array, tratando resposta paginada
    const data = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.results || response.data?.value || []);
    setProdutos(data);
  };

  const carregarDepositos = async () => {
    const response = await axiosInstance.get('/depositos/');
    // Garantir que sempre seja um array, tratando resposta paginada
    const data = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.results || response.data?.value || []);
    setDepositos(data);
  };

  const carregarResumoGeral = async () => {
    try {
      const response = await axiosInstance.get('/estoque/resumo_geral/');
      setResumoGeral(response.data || {});
    } catch (err) {
      console.error('Erro ao carregar resumo:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEstoqueInputChange = (field, value) => {
    setCurrentEstoque(prev => ({ ...prev, [field]: value }));
  };

  const handleMovimentacaoInputChange = (field, value) => {
    setCurrentMovimentacao(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEstoque = async () => {
    try {
      setLoading(true);

      const dadosParaEnvio = {
        id_produto: parseInt(currentEstoque.id_produto),
        id_deposito: parseInt(currentEstoque.id_deposito),
        quantidade: parseFloat(currentEstoque.quantidade),
        quantidade_minima: parseFloat(currentEstoque.quantidade_minima),
        quantidade_maxima: currentEstoque.quantidade_maxima ? parseFloat(currentEstoque.quantidade_maxima) : null,
        custo_medio: parseFloat(currentEstoque.custo_medio),
        ativo: currentEstoque.ativo
      };

      if (isEditing && currentEstoque.id_estoque) {
        await axiosInstance.patch(`/estoque/${currentEstoque.id_estoque}/`, dadosParaEnvio);
      } else {
        await axiosInstance.post('/estoque/', dadosParaEnvio);
      }

      setOpenEstoqueDialog(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await carregarEstoque();

    } catch (err) {
      console.error('❌ Erro ao salvar estoque:', err);
      setError('Erro ao salvar estoque: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleNewEstoque = () => {
    setCurrentEstoque({
      id_estoque: null,
      id_produto: '',
      id_deposito: '',
      quantidade: 0,
      quantidade_minima: 0,
      quantidade_maxima: null,
      custo_medio: 0,
      ativo: true
    });
    setIsEditing(false);
    setOpenEstoqueDialog(true);
  };

  const handleEditEstoque = (item) => {
    setCurrentEstoque(item);
    setIsEditing(true);
    setOpenEstoqueDialog(true);
  };

  const handleAjustarEstoque = (item) => {
    setAjusteEstoque({
      id_produto: item.id_produto?.id_produto || item.id_produto,
      id_deposito: item.id_deposito?.id_deposito || item.id_deposito,
      quantidade_nova: parseFloat(item.quantidade || 0),
      observacoes: ''
    });
    setOpenAjusteDialog(true);
  };
  
  const handleNovoAjuste = () => {
    setAjusteEstoque({
      id_produto: '',
      id_deposito: '',
      quantidade_nova: 0,
      observacoes: ''
    });
    setAjustesMultiplos([
      { id_produto: '', id_deposito: '', quantidade_nova: 0 }
    ]);
    setOpenAjusteDialog(true);
  };

  const handleAdicionarLinha = () => {
    setAjustesMultiplos([...ajustesMultiplos, { id_produto: '', id_deposito: defaultDeposit || '', quantidade_nova: 0 }]);
  };

  const handleRemoverLinha = (index) => {
    if (ajustesMultiplos.length > 1) {
      const novasLinhas = ajustesMultiplos.filter((_, i) => i !== index);
      setAjustesMultiplos(novasLinhas);
    }
  };

  const handleAjusteChange = (index, field, value) => {
    const novasLinhas = [...ajustesMultiplos];
    novasLinhas[index][field] = value;
    setAjustesMultiplos(novasLinhas);
  };

  const handleSaveAjuste = async () => {
    try {
      // Validar linhas
      const linhasValidas = ajustesMultiplos.filter(
        linha => linha.id_produto && linha.id_deposito
      );

      if (linhasValidas.length === 0) {
        setError('Preencha pelo menos um produto e depósito');
        return;
      }
      
      setLoading(true);
      let ajustesRealizados = 0;
      let errosAjuste = [];

      // Processar cada ajuste
      for (const linha of linhasValidas) {
        try {
          const payload = {
            id_produto: linha.id_produto,
            id_deposito: linha.id_deposito || defaultDeposit,
            quantidade_nova: parseFloat(linha.quantidade_nova || 0),
            observacoes: ajusteEstoque.observacoes || 'Ajuste manual de estoque'
          };
          
          await axiosInstance.post('/estoque/ajustar/', payload);
          ajustesRealizados++;
        } catch (err) {
          const produto = produtos.find(p => p.id_produto === linha.id_produto);
          errosAjuste.push(`${produto?.nome_produto || 'Produto'}: ${err.response?.data?.error || err.message}`);
        }
      }

      setOpenAjusteDialog(false);
      
      if (ajustesRealizados > 0) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        await carregarEstoque();
        await carregarMovimentacoes();
      }

      if (errosAjuste.length > 0) {
        setError(`Ajustes: ${ajustesRealizados} OK, ${errosAjuste.length} erros:\n${errosAjuste.join('\n')}`);
      }

    } catch (err) {
      console.error('❌ Erro ao ajustar estoque:', err);
      setError('Erro ao ajustar estoque: ' + (err.response?.data?.error || err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'BAIXO': return 'error';
      case 'ALTO': return 'warning';
      case 'NORMAL': return 'success';
      default: return 'default';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'ENTRADA': return <EntradaIcon color="success" />;
      case 'SAIDA': return <SaidaIcon color="error" />;
      case 'TRANSFERENCIA': return <TransferenciaIcon color="primary" />;
      case 'AJUSTE': return <AjusteIcon color="warning" />;
      default: return <InventoryIcon />;
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Operação realizada com sucesso!
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
              <InventoryIcon />
            </Avatar>
          }
          title="Controle de Estoque"
          subheader="Gerencie estoque por produto e depósito"
        />

        {/* Resumo Geral */}
        <CardContent>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Produtos
                  </Typography>
                  <Typography variant="h4">
                    {resumoGeral.total_produtos || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Valor Total Estoque
                  </Typography>
                  <Typography variant="h4">
                    {formatarMoeda(resumoGeral.valor_total_estoque)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Produtos com Baixo Estoque
                  </Typography>
                  <Typography variant="h4" color="error">
                    <Badge badgeContent={resumoGeral.produtos_baixo_estoque || 0} color="error">
                      <WarningIcon />
                    </Badge>
                    {resumoGeral.produtos_baixo_estoque || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Produtos Sem Estoque
                  </Typography>
                  <Typography variant="h4" color="error">
                    {resumoGeral.produtos_sem_estoque || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Estoque Atual" />
            <Tab label="Movimentações" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {/* Aba Estoque Atual */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2 }}>
              <Typography variant="h6">Ajuste de Estoque</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<AjusteIcon />}
                  onClick={handleNovoAjuste}
                  size="large"
                >
                  Ajustar Estoque
                </Button>
              </Box>
            </Box>

            {/* Filtro de Pesquisa */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Pesquisar por nome ou código do produto..."
                variant="outlined"
                size="small"
                value={filtroEstoque}
                onChange={(e) => setFiltroEstoque(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>

            {/* Mensagem informativa */}
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <InventoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Clique em "Ajustar Estoque" para iniciar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Você poderá ajustar a quantidade de múltiplos produtos de uma só vez
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Aba Movimentações */}
            <Typography variant="h6" sx={{ mb: 2 }}>Últimas Movimentações</Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Data</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Produto</strong></TableCell>
                    <TableCell><strong>Depósito</strong></TableCell>
                    <TableCell><strong>Quantidade</strong></TableCell>
                    <TableCell><strong>Usuário</strong></TableCell>
                    <TableCell><strong>Documento</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(movimentacoes) && movimentacoes.map((mov) => (
                    <TableRow key={mov.id_movimentacao} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {formatarData(mov.data_movimentacao)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTipoIcon(mov.tipo_movimentacao)}
                          <Typography variant="body2">
                            {mov.tipo_movimentacao}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {mov.produto_nome || mov.nome_produto}
                        </Typography>
                      </TableCell>
                      <TableCell>{mov.deposito_nome || mov.nome_deposito}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={mov.tipo_movimentacao === 'ENTRADA' ? 'success.main' : 'error.main'}
                          fontWeight="medium"
                        >
                          {mov.tipo_movimentacao === 'ENTRADA' ? '+' : '-'}{mov.quantidade_movimentada}
                        </Typography>
                      </TableCell>
                      <TableCell>{mov.usuario_responsavel}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {mov.documento_tipo} {mov.documento_numero}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Dialog para Criar/Editar Estoque */}
      <Dialog open={openEstoqueDialog} onClose={() => setOpenEstoqueDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Estoque' : 'Novo Estoque'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Produto</InputLabel>
                <Select
                  value={currentEstoque.id_produto}
                  onChange={(e) => handleEstoqueInputChange('id_produto', e.target.value)}
                  label="Produto"
                >
                  {Array.isArray(produtos) && produtos.map((produto) => (
                    <MenuItem key={produto.id_produto} value={produto.id_produto}>
                      {produto.nome_produto} ({produto.codigo_produto})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Depósito</InputLabel>
                <Select
                  value={currentEstoque.id_deposito}
                  onChange={(e) => handleEstoqueInputChange('id_deposito', e.target.value)}
                  label="Depósito"
                >
                  {Array.isArray(depositos) && depositos.map((deposito) => (
                    <MenuItem key={deposito.id_deposito} value={deposito.id_deposito}>
                      {deposito.nome_deposito}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Quantidade"
                type="number"
                inputProps={{ step: "0.001", min: "0" }}
                value={currentEstoque.quantidade}
                onChange={(e) => handleEstoqueInputChange('quantidade', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Quantidade Mínima"
                type="number"
                inputProps={{ step: "0.001", min: "0" }}
                value={currentEstoque.quantidade_minima}
                onChange={(e) => handleEstoqueInputChange('quantidade_minima', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Quantidade Máxima"
                type="number"
                inputProps={{ step: "0.001", min: "0" }}
                value={currentEstoque.quantidade_maxima || ''}
                onChange={(e) => handleEstoqueInputChange('quantidade_maxima', e.target.value || null)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Custo Médio"
                type="number"
                inputProps={{ step: "0.0001", min: "0" }}
                value={currentEstoque.custo_medio}
                onChange={(e) => handleEstoqueInputChange('custo_medio', e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEstoqueDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveEstoque} variant="contained" startIcon={<SaveIcon />}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Ajustar Estoque - Múltiplos Produtos */}
      <Dialog open={openAjusteDialog} onClose={() => setOpenAjusteDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Ajustar Estoque
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Observações gerais */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações gerais"
                multiline
                rows={2}
                value={ajusteEstoque.observacoes}
                onChange={(e) => setAjusteEstoque(prev => ({ ...prev, observacoes: e.target.value }))}
                variant="outlined"
                placeholder="Motivo do ajuste de estoque..."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Produtos para ajustar:
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 240 }}>
                <InputLabel>Depósito padrão</InputLabel>
                <Select
                  value={defaultDeposit}
                  onChange={(e) => setDefaultDeposit(e.target.value)}
                  label="Depósito padrão"
                >
                  <MenuItem value="">(nenhum)</MenuItem>
                  {Array.isArray(depositos) && depositos.map((dep) => (
                    <MenuItem key={dep.id_deposito} value={dep.id_deposito}>
                      {dep.nome_deposito}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  // aplicar o depósito padrão atual a todas as linhas vazias
                  const novas = ajustesMultiplos.map(l => ({ ...l, id_deposito: l.id_deposito || defaultDeposit }));
                  setAjustesMultiplos(novas);
                }}
              >
                Aplicar a todas
              </Button>
            </Grid>

            {/* Linhas de ajuste */}
            {ajustesMultiplos.map((linha, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <Autocomplete
                        options={produtos}
                        getOptionLabel={(option) => `${option.codigo_produto} - ${option.nome_produto}`}
                        value={produtos.find(p => p.id_produto === linha.id_produto) || null}
                        onChange={(e, newValue) => handleAjusteChange(index, 'id_produto', newValue?.id_produto || '')}
                        filterOptions={(options, { inputValue }) => {
                          const input = (inputValue || '').toLowerCase().trim();
                          if (!input) return options;
                          return options.filter(o => {
                            const codigo = (o.codigo_produto || '').toLowerCase();
                            const nome = (o.nome_produto || '').toLowerCase();
                            return codigo.includes(input) || nome.includes(input);
                          });
                        }}
                        autoHighlight
                        clearOnEscape
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Produto *"
                            placeholder="Pesquisar por código ou nome..."
                            size="small"
                          />
                        )}
                        isOptionEqualToValue={(option, value) => option?.id_produto === value?.id_produto}
                      />
                    </Grid>

                    <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Depósito *</InputLabel>
                        <Select
                          value={linha.id_deposito || defaultDeposit}
                          onChange={(e) => handleAjusteChange(index, 'id_deposito', e.target.value)}
                          label="Depósito *"
                        >
                          {Array.isArray(depositos) && depositos.map((dep) => (
                            <MenuItem key={dep.id_deposito} value={dep.id_deposito}>
                              {dep.nome_deposito}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <IconButton
                        title="Definir como depósito padrão"
                        size="small"
                        onClick={() => {
                          const sel = linha.id_deposito || defaultDeposit;
                          setDefaultDeposit(sel);
                        }}
                      >
                        <CheckIcon color="primary" />
                      </IconButton>
                    </Grid>

                    <Grid item xs={8} md={3}>
                      <TextField
                        fullWidth
                        label="Quantidade Final *"
                        type="number"
                        size="small"
                        inputProps={{ step: "0.001", min: "0" }}
                        value={linha.quantidade_nova}
                        onChange={(e) => handleAjusteChange(index, 'quantidade_nova', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={4} md={1}>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoverLinha(index)}
                        disabled={ajustesMultiplos.length === 1}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAdicionarLinha}
                variant="outlined"
                fullWidth
              >
                Adicionar Produto
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAjusteDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveAjuste} variant="contained" startIcon={<AjusteIcon />}>
            Ajustar Estoque
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EstoqueConfig;