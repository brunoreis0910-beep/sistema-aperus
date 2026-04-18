import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  SwapHoriz as SwapIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import dayjs from 'dayjs';

const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005') + '/api';

const ChequesPage = () => {
  const [cheques, setCheques] = useState([]);
  const [filteredCheques, setFilteredCheques] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [currentCheque, setCurrentCheque] = useState(null);
  const [actionType, setActionType] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Filtros
  const [filters, setFilters] = useState({
    tipo: '',
    status: '',
    banco: '',
    busca: '',
  });
  
  // Clientes e fornecedores
  const [clientes, setClientes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [contasBancarias, setContasBancarias] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    tipo: 'receber',
    numero_cheque: '',
    banco: '',
    agencia: '',
    conta: '',
    emitente: '',
    cpf_cnpj_emitente: '',
    valor: '',
    data_emissao: dayjs().format('YYYY-MM-DD'),
    data_vencimento: dayjs().add(30, 'days').format('YYYY-MM-DD'),
    id_cliente: '',
    id_fornecedor: '',
    id_conta_bancaria: '',
    observacoes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cheques, filters, tabValue]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chequesRes, dashRes, clientesRes, fornecedoresRes, contasRes] = await Promise.all([
        axios.get(`${API_URL}/cheques/`),
        axios.get(`${API_URL}/cheques/dashboard/`),
        axios.get(`${API_URL}/clientes/`),
        axios.get(`${API_URL}/fornecedores/`),
        axios.get(`${API_URL}/contas-bancarias/`),
      ]);
      
      // Garantir que sempre sejam arrays, tratando resposta paginada
      const chequesData = Array.isArray(chequesRes.data) 
        ? chequesRes.data 
        : (chequesRes.data?.results || chequesRes.data?.value || []);
      const clientesData = Array.isArray(clientesRes.data) 
        ? clientesRes.data 
        : (clientesRes.data?.results || clientesRes.data?.value || []);
      const fornecedoresData = Array.isArray(fornecedoresRes.data) 
        ? fornecedoresRes.data 
        : (fornecedoresRes.data?.results || fornecedoresRes.data?.value || []);
      const contasData = Array.isArray(contasRes.data) 
        ? contasRes.data 
        : (contasRes.data?.results || contasRes.data?.value || []);
      
      setCheques(chequesData);
      setDashboard(dashRes.data);
      setClientes(clientesData);
      setFornecedores(fornecedoresData);
      setContasBancarias(contasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cheques];
    
    // Filtro por aba
    const statusByTab = {
      0: null, // Todos
      1: 'custodia',
      2: 'depositado',
      3: 'compensado',
      4: 'devolvido',
    };
    
    const statusFilter = statusByTab[tabValue];
    if (statusFilter) {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    // Filtros adicionais
    if (filters.tipo) {
      filtered = filtered.filter(c => c.tipo === filters.tipo);
    }
    
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    
    if (filters.banco) {
      filtered = filtered.filter(c => 
        c.banco.toLowerCase().includes(filters.banco.toLowerCase())
      );
    }
    
    if (filters.busca) {
      const busca = filters.busca.toLowerCase();
      filtered = filtered.filter(c => 
        c.numero_cheque.toLowerCase().includes(busca) ||
        c.emitente.toLowerCase().includes(busca) ||
        (c.cliente_nome && c.cliente_nome.toLowerCase().includes(busca)) ||
        (c.fornecedor_nome && c.fornecedor_nome.toLowerCase().includes(busca))
      );
    }
    
    setFilteredCheques(filtered);
  };

  const handleOpenDialog = (cheque = null) => {
    if (cheque) {
      setFormData({
        ...cheque,
        data_emissao: dayjs(cheque.data_emissao).format('YYYY-MM-DD'),
        data_vencimento: dayjs(cheque.data_vencimento).format('YYYY-MM-DD'),
      });
      setCurrentCheque(cheque);
    } else {
      setFormData({
        tipo: 'receber',
        numero_cheque: '',
        banco: '',
        agencia: '',
        conta: '',
        emitente: '',
        cpf_cnpj_emitente: '',
        valor: '',
        data_emissao: dayjs().format('YYYY-MM-DD'),
        data_vencimento: dayjs().add(30, 'days').format('YYYY-MM-DD'),
        id_cliente: '',
        id_fornecedor: '',
        id_conta_bancaria: '',
        observacoes: '',
      });
      setCurrentCheque(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCheque(null);
  };

  const handleSave = async () => {
    try {
      if (currentCheque) {
        await axios.put(`${API_URL}/cheques/${currentCheque.id_cheque}/`, formData);
        toast.success('Cheque atualizado com sucesso!');
      } else {
        await axios.post(`${API_URL}/cheques/`, formData);
        toast.success('Cheque cadastrado com sucesso!');
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar cheque:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar cheque');
    }
  };

  const handleAction = async (cheque, action) => {
    setCurrentCheque(cheque);
    setActionType(action);
    setOpenActionDialog(true);
  };

  const confirmAction = async () => {
    try {
      let data = {};
      
      if (actionType === 'depositar') {
        data = {
          data_deposito: dayjs().format('YYYY-MM-DD'),
          id_conta_bancaria: formData.id_conta_bancaria,
        };
      } else if (actionType === 'compensar') {
        data = {
          data_compensacao: dayjs().format('YYYY-MM-DD'),
        };
      } else if (['devolver', 'repassar', 'cancelar'].includes(actionType)) {
        data = {
          observacao: formData.observacoes,
        };
      }
      
      await axios.post(`${API_URL}/cheques/${currentCheque.id_cheque}/${actionType}/`, data);
      toast.success(`Cheque ${actionType} com sucesso!`);
      setOpenActionDialog(false);
      loadData();
    } catch (error) {
      console.error(`Erro ao ${actionType} cheque:`, error);
      toast.error(error.response?.data?.error || `Erro ao ${actionType} cheque`);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      custodia: 'info',
      depositado: 'warning',
      compensado: 'success',
      devolvido: 'error',
      repassado: 'secondary',
      cancelado: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      custodia: 'Em Custódia',
      depositado: 'Depositado',
      compensado: 'Compensado',
      devolvido: 'Devolvido',
      repassado: 'Repassado',
      cancelado: 'Cancelado',
    };
    return labels[status] || status;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date) => {
    return dayjs(date).format('DD/MM/YYYY');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          <BankIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Controle de Cheques
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Cheque
        </Button>
      </Box>

      {/* Dashboard Cards */}
      {dashboard && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Em Custódia
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(dashboard.em_custodia.total)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {dashboard.em_custodia.quantidade} cheques
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Depositados
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(dashboard.depositados.total)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {dashboard.depositados.quantidade} cheques
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'error.light' }}>
              <CardContent>
                <Typography color="white" gutterBottom>
                  Vencidos
                </Typography>
                <Typography variant="h5" color="white">
                  {formatCurrency(dashboard.vencidos.total)}
                </Typography>
                <Typography variant="body2" color="white">
                  {dashboard.vencidos.quantidade} cheques
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'warning.light' }}>
              <CardContent>
                <Typography color="white" gutterBottom>
                  A Vencer (7 dias)
                </Typography>
                <Typography variant="h5" color="white">
                  {formatCurrency(dashboard.a_vencer.total)}
                </Typography>
                <Typography variant="body2" color="white">
                  {dashboard.a_vencer.quantidade} cheques
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Buscar"
              value={filters.busca}
              onChange={(e) => setFilters({ ...filters, busca: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filters.tipo}
                label="Tipo"
                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="receber">A Receber</MenuItem>
                <MenuItem value="pagar">A Pagar</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Banco"
              value={filters.banco}
              onChange={(e) => setFilters({ ...filters, banco: e.target.value })}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setFilters({ tipo: '', status: '', banco: '', busca: '' })}
            >
              Limpar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Todos" />
          <Tab label="Em Custódia" />
          <Tab label="Depositados" />
          <Tab label="Compensados" />
          <Tab label="Devolvidos" />
        </Tabs>
      </Paper>

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Banco/Agência</TableCell>
              <TableCell>Emitente</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(filteredCheques) && filteredCheques.map((cheque) => (
              <TableRow 
                key={cheque.id_cheque}
                sx={{
                  bgcolor: cheque.esta_vencido && cheque.status !== 'compensado' 
                    ? 'error.light' 
                    : 'inherit'
                }}
              >
                <TableCell>{cheque.numero_cheque}</TableCell>
                <TableCell>
                  {cheque.banco}<br />
                  <Typography variant="caption" color="textSecondary">
                    Ag: {cheque.agencia} | Conta: {cheque.conta}
                  </Typography>
                </TableCell>
                <TableCell>
                  {cheque.nome_pessoa}
                  {cheque.esta_vencido && cheque.status !== 'compensado' && (
                    <Tooltip title="Cheque vencido!">
                      <WarningIcon color="error" sx={{ ml: 1, fontSize: 16 }} />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(cheque.valor)}</TableCell>
                <TableCell>
                  {formatDate(cheque.data_vencimento)}
                  <Typography variant="caption" display="block" color="textSecondary">
                    {cheque.dias_vencimento >= 0 
                      ? `${cheque.dias_vencimento} dias`
                      : `Vencido há ${Math.abs(cheque.dias_vencimento)} dias`
                    }
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusLabel(cheque.status)}
                    color={getStatusColor(cheque.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={cheque.tipo === 'receber' ? 'A Receber' : 'A Pagar'}
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleOpenDialog(cheque)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  
                  {cheque.status === 'custodia' && (
                    <>
                      <Tooltip title="Depositar">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleAction(cheque, 'depositar')}
                        >
                          <BankIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Repassar">
                        <IconButton 
                          size="small" 
                          color="secondary"
                          onClick={() => handleAction(cheque, 'repassar')}
                        >
                          <SwapIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  
                  {cheque.status === 'depositado' && (
                    <Tooltip title="Compensar">
                      <IconButton 
                        size="small" 
                        color="success"
                        onClick={() => handleAction(cheque, 'compensar')}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {['custodia', 'depositado'].includes(cheque.status) && (
                    <Tooltip title="Devolver">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleAction(cheque, 'devolver')}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentCheque ? 'Editar Cheque' : 'Novo Cheque'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.tipo}
                  label="Tipo"
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  <MenuItem value="receber">A Receber</MenuItem>
                  <MenuItem value="pagar">A Pagar</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número do Cheque"
                value={formData.numero_cheque}
                onChange={(e) => setFormData({ ...formData, numero_cheque: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Banco"
                value={formData.banco}
                onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Agência"
                value={formData.agencia}
                onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Conta"
                value={formData.conta}
                onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emitente"
                value={formData.emitente}
                onChange={(e) => setFormData({ ...formData, emitente: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CPF/CNPJ Emitente"
                value={formData.cpf_cnpj_emitente}
                onChange={(e) => setFormData({ ...formData, cpf_cnpj_emitente: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Valor"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Data Emissão"
                value={formData.data_emissao}
                onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Data Vencimento"
                value={formData.data_vencimento}
                onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            {formData.tipo === 'receber' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Cliente</InputLabel>
                  <Select
                    value={formData.id_cliente}
                    label="Cliente"
                    onChange={(e) => setFormData({ ...formData, id_cliente: e.target.value })}
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {Array.isArray(clientes) && clientes.map((cliente) => (
                      <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                        {cliente.nome_razao_social}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {formData.tipo === 'pagar' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Fornecedor</InputLabel>
                  <Select
                    value={formData.id_fornecedor}
                    label="Fornecedor"
                    onChange={(e) => setFormData({ ...formData, id_fornecedor: e.target.value })}
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {Array.isArray(fornecedores) && fornecedores.map((fornecedor) => (
                      <MenuItem key={fornecedor.id_fornecedor} value={fornecedor.id_fornecedor}>
                        {fornecedor.nome_razao_social}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observações"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Ações */}
      <Dialog open={openActionDialog} onClose={() => setOpenActionDialog(false)}>
        <DialogTitle>
          {actionType === 'depositar' && 'Depositar Cheque'}
          {actionType === 'compensar' && 'Compensar Cheque'}
          {actionType === 'devolver' && 'Devolver Cheque'}
          {actionType === 'repassar' && 'Repassar Cheque'}
          {actionType === 'cancelar' && 'Cancelar Cheque'}
        </DialogTitle>
        <DialogContent>
          {actionType === 'depositar' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Conta Bancária</InputLabel>
              <Select
                value={formData.id_conta_bancaria}
                label="Conta Bancária"
                onChange={(e) => setFormData({ ...formData, id_conta_bancaria: e.target.value })}
              >
                {Array.isArray(contasBancarias) && contasBancarias.map((conta) => (
                  <MenuItem key={conta.id_conta_bancaria} value={conta.id_conta_bancaria}>
                    {conta.nome_conta}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {['devolver', 'repassar', 'cancelar'].includes(actionType) && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observação"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActionDialog(false)}>Cancelar</Button>
          <Button onClick={confirmAction} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChequesPage;
