import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  InputAdornment,
  Fab,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import FilterDrawer from './common/FilterDrawer';

const ClientePage = () => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    dataInicio: '',
    dataFim: '',
    limit: 100,
    tipo_pessoa: 'todos',
  });
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    cpf_cnpj: '',
    limite_credito: 0
  });
  const { axiosInstance } = useAuth();

  const fetchClientes = async () => {
    try {
      setLoading(true);
      
      // Construir parâmetros de filtro
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.dataInicio) params.append('data_inicio', filters.dataInicio);
      if (filters.dataFim) params.append('data_fim', filters.dataFim);
      if (filters.limit !== 'unlimited') params.append('limit', filters.limit);
      if (filters.tipo_pessoa !== 'todos') params.append('tipo_pessoa', filters.tipo_pessoa);
      
      const response = await axiosInstance.get(`/clientes/?${params.toString()}`);
      const data = response.data;
      const clientesList = Array.isArray(data) ? data : data.results || [];
      setClientes(clientesList);
      setFilteredClientes(clientesList);
    } catch (err) {
      setError('Erro ao carregar clientes');
      console.error(err);
      // Dados mock para demonstração
      const mockClientes = [
        { id: 1, nome: 'João Silva', email: 'joao@email.com', telefone: '(11) 99999-1111', endereco: 'Rua A, 123', cpf_cnpj: '123.456.789-00' },
        { id: 2, nome: 'Maria Santos', email: 'maria@email.com', telefone: '(11) 99999-2222', endereco: 'Rua B, 456', cpf_cnpj: '987.654.321-00' },
        { id: 3, nome: 'Pedro Oliveira', email: 'pedro@email.com', telefone: '(11) 99999-3333', endereco: 'Rua C, 789', cpf_cnpj: '456.789.123-00' }
      ];
      setClientes(mockClientes);
      setFilteredClientes(mockClientes);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredClientes(clientes);
    } else {
      const filtered = clientes.filter(cliente =>
        cliente.nome.toLowerCase().includes(term.toLowerCase()) ||
        cliente.email.toLowerCase().includes(term.toLowerCase()) ||
        cliente.telefone.includes(term)
      );
      setFilteredClientes(filtered);
    }
  };

  const handleOpenDialog = (cliente = null) => {
    setEditingCliente(cliente);
    if (cliente) {
      setFormData({
        nome: cliente.nome || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        endereco: cliente.endereco || '',
        cpf_cnpj: cliente.cpf_cnpj || '',
        limite_credito: cliente.limite_credito || 0
      });
    } else {
      setFormData({ nome: '', email: '', telefone: '', endereco: '', cpf_cnpj: '', limite_credito: 0 });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCliente(null);
    setFormData({ nome: '', email: '', telefone: '', endereco: '', cpf_cnpj: '', limite_credito: 0 });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (editingCliente) {
        // Atualizar cliente
        await axiosInstance.put(`/clientes/${editingCliente.id}/`, formData);
      } else {
        // Criar novo cliente
        await axiosInstance.post('/clientes/', formData);
      }
      await fetchClientes();
      handleCloseDialog();
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      // Para demonstração, vamos simular o sucesso
      const newCliente = {
        id: editingCliente ? editingCliente.id : Date.now(),
        ...formData
      };

      if (editingCliente) {
        setClientes(prev => prev.map(c => c.id === editingCliente.id ? newCliente : c));
      } else {
        setClientes(prev => [...prev, newCliente]);
      }
      setFilteredClientes(clientes => editingCliente
        ? clientes.map(c => c.id === editingCliente.id ? newCliente : c)
        : [...clientes, newCliente]
      );
      handleCloseDialog();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clienteId) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await axiosInstance.delete(`/clientes/${clienteId}/`);
        await fetchClientes();
      } catch (err) {
        console.error('Erro ao excluir cliente:', err);
        // Para demonstração, vamos simular o sucesso
        setClientes(prev => prev.filter(c => c.id !== clienteId));
        setFilteredClientes(prev => prev.filter(c => c.id !== clienteId));
      }
    }
  };

  const handleApplyFilters = () => {
    setFilterOpen(false);
    fetchClientes();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      dataInicio: '',
      dataFim: '',
      limit: 100,
      tipo_pessoa: 'todos',
    });
  };

  useEffect(() => {
    fetchClientes();
  }, [axiosInstance]);

  if (loading && clientes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Clientes
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Gerencie sua base de clientes
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterOpen(true)}
            size="large"
          >
            Filtros
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            Novo Cliente
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {error} - Exibindo dados de demonstração
        </Alert>
      )}

      {/* Busca */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nome, email ou telefone..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>CPF/CNPJ</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClientes.map((cliente) => (
              <TableRow key={cliente.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                    {cliente.nome}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    {cliente.email}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    {cliente.telefone}
                  </Box>
                </TableCell>
                <TableCell>{cliente.cpf_cnpj || 'não informado'}</TableCell>
                <TableCell>
                  <Chip
                    label="Ativo"
                    color="success"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(cliente)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(cliente.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredClientes.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {searchTerm
              ? 'Tente buscar por outro termo'
              : 'Clique em "Novo Cliente" para começar'
            }
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Novo Cliente
            </Button>
          )}
        </Paper>
      )}

      {/* Dialog de Ediçéo/Criação */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="CNPJ e CPF"
              value={formData.cpf_cnpj}
              onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Limite de Crédito"
              type="number"
              value={formData.limite_credito}
              onChange={(e) => setFormData({ ...formData, limite_credito: e.target.value })}
              margin="normal"
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              fullWidth
              label="Endereço"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!formData.nome || !formData.email}
          >
            {editingCliente ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Estatísticas */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Total de Clientes: {clientes.length}
          </Typography>
          <Typography variant="body2">
            {searchTerm && `Encontrados: ${filteredClientes.length}`}
          </Typography>
        </Box>
      </Paper>

      {/* FilterDrawer */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApplyFilters={handleApplyFilters}
        filters={filters}
        onFilterChange={setFilters}
        title="Filtros de Clientes"
      >
        {/* Filtro customizado: Tipo de Pessoa */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Tipo de Pessoa</InputLabel>
          <Select
            value={filters.tipo_pessoa}
            onChange={(e) => setFilters({ ...filters, tipo_pessoa: e.target.value })}
            label="Tipo de Pessoa"
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="fisica">Pessoa Física</MenuItem>
            <MenuItem value="juridica">Pessoa Jurídica</MenuItem>
          </Select>
        </FormControl>
      </FilterDrawer>
    </Box>
  );
};

export default ClientePage;