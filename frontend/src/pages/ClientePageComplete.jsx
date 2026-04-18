import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Fab,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  AppBar,
  Toolbar,
  Slide,
  Stack,
  Alert,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Business as BusinessIcon,
  WhatsApp as WhatsAppIcon,
  Cake as CakeIcon,
  LocationOn as LocationIcon,
  CloudDownload as DownloadIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import {
  buscarCNPJ,
  buscarCEP,
  formatCNPJ,
  formatTelefone,
  formatCEP,
  isValidEmail,
  isValidCNPJ,
  ESTADOS_BRASIL,
  normalizeClienteData
} from '../utils/cnpjCepUtils';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ClientePageComplete = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { axiosInstance } = useAuth();

  // Estados
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados do formulário
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);

  const [formData, setFormData] = useState({
    // Dados principais
    nome: '',
    razao_social: '',
    nome_fantasia: '',

    // Documentos
    cnpj: '',
    inscricao_estadual: '',

    // Contato
    telefone: '',
    whatsapp: '',
    email: '',

    // Endereço
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',

    // Outros
    data_aniversario: '',
    observacoes: ''
  });

  // Carregar clientes
  const carregarClientes = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axiosInstance.get('/clientes/', {
        params: { page_size: 100, ordering: '-id' }
      });

      const clientesData = Array.isArray(response.data) ? response.data : response.data?.results || [];

      // Normalizar dados dos clientes e garantir IDs únicos
      const clientesNormalizados = clientesData
        .map((cliente, index) => {
          const clienteNormalizado = normalizeClienteData(cliente);
          // Garantir que sempre temos um ID único
          if (!clienteNormalizado.id) {
            clienteNormalizado.id = `temp-id-${index}-${Date.now()}`;
          }
          return clienteNormalizado;
        })
        .filter(cliente => cliente && cliente.id); // Remove clientes inválidos

      setClientes(clientesNormalizados);

    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError('Erro ao carregar lista de clientes');
    } finally {
      setLoading(false);
    }
  };

  // Buscar CNPJ
  const handleBuscarCNPJ = async () => {
    if (!formData.cnpj) {
      setError('Digite um CNPJ para buscar');
      return;
    }

    // Validar CNPJ antes de buscar
    if (!isValidCNPJ(formData.cnpj)) {
      setError('CNPJ inválido. Verifique os dígitos.');
      return;
    }

    try {
      setLoadingCNPJ(true);
      setError('');

      const dados = await buscarCNPJ(formData.cnpj);

      setFormData(prev => ({
        ...prev,
        cnpj: formatCNPJ(dados.cnpj),
        razao_social: dados.razao_social,
        nome_fantasia: dados.nome_fantasia,
        nome: dados.nome_fantasia || dados.razao_social,
        inscricao_estadual: dados.inscricao_estadual,
        email: dados.email,
        telefone: formatTelefone(dados.telefone),
        cep: formatCEP(dados.cep),
        endereco: dados.endereco,
        numero: dados.numero,
        complemento: dados.complemento,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado
      }));

      setSuccess('Dados do CNPJ carregados com sucesso!');

    } catch (err) {
      setError(`Erro ao buscar CNPJ: ${err.message}`);
    } finally {
      setLoadingCNPJ(false);
    }
  };

  // Buscar CEP
  const handleBuscarCEP = async () => {
    if (!formData.cep) {
      setError('Digite um CEP para buscar');
      return;
    }

    try {
      setLoadingCEP(true);
      setError('');

      const dados = await buscarCEP(formData.cep);

      setFormData(prev => ({
        ...prev,
        cep: formatCEP(dados.cep),
        endereco: dados.endereco,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
        complemento: dados.complemento
      }));

      setSuccess('Endereço carregado com sucesso!');

    } catch (err) {
      setError(`Erro ao buscar CEP: ${err.message}`);
    } finally {
      setLoadingCEP(false);
    }
  };

  // Salvar cliente
  const handleSave = async () => {
    try {
      setError('');

      // Validações
      if (!formData.nome.trim()) {
        setError('Nome é obrigatório');
        return;
      }

      if (formData.cnpj && !isValidCNPJ(formData.cnpj)) {
        setError('CNPJ inválido');
        return;
      }

      if (formData.email && !isValidEmail(formData.email)) {
        setError('Email inválido');
        return;
      }

      const dadosParaSalvar = {
        ...formData,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
        whatsapp: formData.whatsapp.replace(/\D/g, ''),
        cep: formData.cep.replace(/\D/g, '')
      };

      if (editingId) {
        await axiosInstance.put(`/clientes/${editingId}/`, dadosParaSalvar);
        setSuccess('Cliente atualizado com sucesso!');
      } else {
        await axiosInstance.post('/clientes/', dadosParaSalvar);
        setSuccess('Cliente cadastrado com sucesso!');
      }

      setOpen(false);
      resetForm();
      carregarClientes();

    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      setError(`Erro ao salvar: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Reset do formulário
  const resetForm = () => {
    setFormData({
      nome: '',
      razao_social: '',
      nome_fantasia: '',
      cnpj: '',
      inscricao_estadual: '',
      telefone: '',
      whatsapp: '',
      email: '',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      data_aniversario: '',
      observacoes: ''
    });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  // Abrir formulário para ediçéo
  const handleEdit = (cliente) => {
    const clienteNormalizado = normalizeClienteData(cliente);
    setFormData({
      nome: clienteNormalizado.nome,
      razao_social: clienteNormalizado.razao_social,
      nome_fantasia: clienteNormalizado.nome_fantasia,
      cnpj: clienteNormalizado.cnpj,
      inscricao_estadual: clienteNormalizado.inscricao_estadual,
      telefone: clienteNormalizado.telefone,
      whatsapp: clienteNormalizado.whatsapp,
      email: clienteNormalizado.email,
      cep: clienteNormalizado.cep,
      endereco: clienteNormalizado.endereco,
      numero: clienteNormalizado.numero,
      complemento: clienteNormalizado.complemento,
      bairro: clienteNormalizado.bairro,
      cidade: clienteNormalizado.cidade,
      estado: clienteNormalizado.estado,
      data_aniversario: clienteNormalizado.data_aniversario,
      observacoes: clienteNormalizado.observacoes
    });
    setEditingId(cliente.id);
    setOpen(true);
  };

  // Excluir cliente
  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/clientes/${id}/`);
      setSuccess('Cliente excluído com sucesso!');
      carregarClientes();
    } catch (err) {
      setError('Erro ao excluir cliente');
    }
  };

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cnpj?.includes(searchTerm) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    carregarClientes();
  }, []);

  // Limpar mensagens após 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Cabeçalho */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          <PersonIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Clientes
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            Novo Cliente
          </Button>
        </Box>
      </Box>

      {/* Mensagens */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Lista de clientes */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        // Vista mobile - Cards
        <Grid container spacing={2}>
          {clientesFiltrados.map((cliente, index) => {
            const uniqueKey = cliente.id ? `cliente-card-${cliente.id}` : `cliente-temp-${index}-${searchTerm}`;
            return (
              <Grid item xs={12} sm={6} key={uniqueKey}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">
                          {cliente.nome || cliente.razao_social}
                        </Typography>
                        {cliente.nome_fantasia && (
                          <Typography variant="body2" color="text.secondary">
                            {cliente.nome_fantasia}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {cliente.cnpj && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <BusinessIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'bottom' }} />
                        {formatCNPJ(cliente.cnpj)}
                      </Typography>
                    )}

                    {cliente.telefone && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'bottom' }} />
                        {formatTelefone(cliente.telefone)}
                      </Typography>
                    )}

                    {cliente.email && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <EmailIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'bottom' }} />
                        {cliente.email}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <IconButton onClick={() => handleEdit(cliente)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(cliente.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        // Vista desktop - Tabela
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome/Razéo Social</TableCell>
                <TableCell>CNPJ</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Cidade</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientesFiltrados.map((cliente, index) => {
                const uniqueKey = cliente.id ? `table-cliente-${cliente.id}` : `table-temp-${index}-${searchTerm}`;
                return (
                  <TableRow key={uniqueKey}>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {cliente.nome || cliente.razao_social}
                        </Typography>
                        {cliente.nome_fantasia && (
                          <Typography variant="body2" color="text.secondary">
                            {cliente.nome_fantasia}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{cliente.cnpj ? formatCNPJ(cliente.cnpj) : '-'}</TableCell>
                    <TableCell>{cliente.telefone ? formatTelefone(cliente.telefone) : '-'}</TableCell>
                    <TableCell>{cliente.email || '-'}</TableCell>
                    <TableCell>{cliente.cidade || '-'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(cliente)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(cliente.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal do formulário */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={Transition}
      >
        {isMobile && (
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setOpen(false)}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                {editingId ? 'Editar Cliente' : 'Novo Cliente'}
              </Typography>
              <Button autoFocus color="inherit" onClick={handleSave}>
                Salvar
              </Button>
            </Toolbar>
          </AppBar>
        )}

        <DialogTitle sx={{ display: isMobile ? 'none' : 'block' }}>
          {editingId ? 'Editar Cliente' : 'Novo Cliente'}
        </DialogTitle>

        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Grid container spacing={3}>
            {/* Seçéo: Dados da Empresa */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
                <BusinessIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Dados da Empresa
              </Typography>
            </Grid>

            {/* CNPJ com busca */}
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="CNPJ"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                placeholder="00.000.000/0000-00"
                inputProps={{ maxLength: 18 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleBuscarCNPJ}
                disabled={loadingCNPJ}
                startIcon={loadingCNPJ ? <CircularProgress size={20} /> : <DownloadIcon />}
                sx={{ height: '56px' }}
              >
                Buscar CNPJ
              </Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Razéo Social"
                value={formData.razao_social}
                onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome Fantasia"
                value={formData.nome_fantasia}
                onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome do Cliente *"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Inscriçéo Estadual"
                value={formData.inscricao_estadual}
                onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
              />
            </Grid>

            {/* Seçéo: Contato */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, color: '#1976d2' }}>
                <PhoneIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Contato
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: formatTelefone(e.target.value) })}
                placeholder="(00) 0000-0000"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="WhatsApp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: formatTelefone(e.target.value) })}
                placeholder="(00) 00000-0000"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WhatsAppIcon color="success" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Data de Aniversário"
                type="date"
                value={formData.data_aniversario}
                onChange={(e) => setFormData({ ...formData, data_aniversario: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CakeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Seçéo: Endereço */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, color: '#1976d2' }}>
                <LocationIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Endereço
              </Typography>
            </Grid>

            {/* CEP com busca */}
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="CEP"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                placeholder="00000-000"
                inputProps={{ maxLength: 9 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleBuscarCEP}
                disabled={loadingCEP}
                startIcon={loadingCEP ? <CircularProgress size={20} /> : <DownloadIcon />}
                sx={{ height: '56px' }}
              >
                Buscar CEP
              </Button>
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Endereço"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Número"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Complemento"
                value={formData.complemento}
                onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bairro"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado}
                  label="Estado"
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                >
                  {ESTADOS_BRASIL.map((estado) => (
                    <MenuItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>

        {!isMobile && (
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="contained">
              {editingId ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* FAB para mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default ClientePageComplete;