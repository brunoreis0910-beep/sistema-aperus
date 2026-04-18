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
  Stack
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
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ClientePageResponsive = () => {
  const { axiosInstance } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: ''
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      // Simular dados
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockClientes = [
        {
          id: 1,
          nome: 'Joéo Silva',
          email: 'joao@email.com',
          telefone: '(11) 99999-9999',
          endereco: 'Rua A, 123',
          cidade: 'são Paulo',
          estado: 'SP',
          status: 'Ativo'
        },
        {
          id: 2,
          nome: 'Maria Santos',
          email: 'maria@email.com',
          telefone: '(11) 88888-8888',
          endereco: 'Rua B, 456',
          cidade: 'Rio de Janeiro',
          estado: 'RJ',
          status: 'Ativo'
        },
        {
          id: 3,
          nome: 'Pedro Oliveira',
          email: 'pedro@email.com',
          telefone: '(11) 77777-7777',
          endereco: 'Rua C, 789',
          cidade: 'Belo Horizonte',
          estado: 'MG',
          status: 'Inativo'
        }
      ];

      setClientes(mockClientes);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cliente = null) => {
    setSelectedCliente(cliente);
    setFormData(cliente || {
      nome: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCliente(null);
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: ''
    });
  };

  const handleSave = async () => {
    try {
      // Simular salvamento
      if (selectedCliente) {
        // Editar
        setClientes(prev => prev.map(c =>
          c.id === selectedCliente.id ? { ...c, ...formData } : c
        ));
      } else {
        // Adicionar
        const newCliente = {
          id: Date.now(),
          ...formData,
          status: 'Ativo'
        };
        setClientes(prev => [...prev, newCliente]);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      setClientes(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
    }
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm)
  );

  const ClienteCard = ({ cliente }) => (
    <Card
      sx={{
        mb: 2,
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          boxShadow: theme.shadows[4],
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: cliente.status === 'Ativo' ? theme.palette.success.main : theme.palette.grey[400],
              mr: 2,
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 }
            }}
          >
            <PersonIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant={isSmallScreen ? "subtitle1" : "h6"}
              sx={{ fontWeight: 'bold', mb: 1 }}
            >
              {cliente.nome}
            </Typography>
            <Chip
              label={cliente.status}
              color={cliente.status === 'Ativo' ? 'success' : 'default'}
              size={isSmallScreen ? "small" : "medium"}
              sx={{ mb: 1 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size={isSmallScreen ? "small" : "medium"}
              onClick={() => handleOpenDialog(cliente)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size={isSmallScreen ? "small" : "medium"}
              onClick={() => handleDelete(cliente.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EmailIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
              <Typography
                variant={isSmallScreen ? "body2" : "body1"}
                color="text.secondary"
              >
                {cliente.email}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PhoneIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
              <Typography
                variant={isSmallScreen ? "body2" : "body1"}
                color="text.secondary"
              >
                {cliente.telefone}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography
              variant={isSmallScreen ? "body2" : "body1"}
              color="text.secondary"
            >
              {cliente.endereco}
            </Typography>
            <Typography
              variant={isSmallScreen ? "body2" : "body1"}
              color="text.secondary"
            >
              {cliente.cidade}, {cliente.estado}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{
      width: '100%',
      p: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
      '@media (min-width: 3440px)': {
        p: 6
      },
      '@media (min-width: 5120px)': {
        p: 8
      }
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
        mb: { xs: 2, sm: 3 }
      }}>
        <Typography
          variant={isSmallScreen ? "h5" : "h4"}
          sx={{ fontWeight: 'bold' }}
        >
          Clientes
        </Typography>

        {/* Search Box - Mobile */}
        {isMobile && (
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
            size="small"
          />
        )}

        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              variant="outlined"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              size="small"
              sx={{ minWidth: 300 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              size={isSmallScreen ? "small" : "medium"}
            >
              Novo Cliente
            </Button>
          </Box>
        )}
      </Box>

      {/* Estatísticas - Cards responsivos */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={6} sm={3} lg={2} xl={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography
                variant={isSmallScreen ? "h5" : "h4"}
                color="primary"
                sx={{ fontWeight: 'bold' }}
              >
                {clientes.length}
              </Typography>
              <Typography
                variant={isSmallScreen ? "body2" : "body1"}
                color="text.secondary"
              >
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} lg={2} xl={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography
                variant={isSmallScreen ? "h5" : "h4"}
                color="success.main"
                sx={{ fontWeight: 'bold' }}
              >
                {clientes.filter(c => c.status === 'Ativo').length}
              </Typography>
              <Typography
                variant={isSmallScreen ? "body2" : "body1"}
                color="text.secondary"
              >
                Ativos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography
                variant={isSmallScreen ? "h5" : "h4"}
                color="warning.main"
                sx={{ fontWeight: 'bold' }}
              >
                {clientes.filter(c => c.status === 'Inativo').length}
              </Typography>
              <Typography
                variant={isSmallScreen ? "body2" : "body1"}
                color="text.secondary"
              >
                Inativos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography
                variant={isSmallScreen ? "h5" : "h4"}
                color="info.main"
                sx={{ fontWeight: 'bold' }}
              >
                {filteredClientes.length}
              </Typography>
              <Typography
                variant={isSmallScreen ? "body2" : "body1"}
                color="text.secondary"
              >
                Filtrados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Clientes */}
      {isMobile ? (
        // Mobile: Cards
        <Box>
          {loading ? (
            <Typography>Carregando...</Typography>
          ) : filteredClientes.length > 0 ? (
            filteredClientes.map((cliente) => (
              <ClienteCard key={cliente.id} cliente={cliente} />
            ))
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  Nenhum cliente encontrado
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      ) : (
        // Desktop: Tabela
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell>Cidade</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredClientes.length > 0 ? (
                filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                          <PersonIcon />
                        </Avatar>
                        {cliente.nome}
                      </Box>
                    </TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>{cliente.telefone}</TableCell>
                    <TableCell>{cliente.cidade}, {cliente.estado}</TableCell>
                    <TableCell>
                      <Chip
                        label={cliente.status}
                        color={cliente.status === 'Ativo' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleOpenDialog(cliente)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(cliente.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="h6" color="text.secondary">
                      Nenhum cliente encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* FAB para Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => handleOpenDialog()}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialog de Adicionar/Editar Cliente */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullScreen={isMobile}
        TransitionComponent={isMobile ? Transition : undefined}
        maxWidth="md"
        fullWidth
      >
        {isMobile && (
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleCloseDialog}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                {selectedCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </Typography>
              <Button autoFocus color="inherit" onClick={handleSave}>
                Salvar
              </Button>
            </Toolbar>
          </AppBar>
        )}

        {!isMobile && (
          <DialogTitle>
            {selectedCliente ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        )}

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Endereço"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              variant="outlined"
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>

        {!isMobile && (
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSave} variant="contained">
              Salvar
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default ClientePageResponsive;