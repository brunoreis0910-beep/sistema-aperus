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
  Avatar,
  IconButton,
  Fab,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Slide,
  Alert,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
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
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  WhatsApp as WhatsAppIcon,
  Cake as CakeIcon,
  LocationOn as LocationIcon,
  CloudDownload as DownloadIcon,
  Block as BlockIcon,
  Send as SendIcon,
  CreditCard as CreditCardIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import PermissionGuard from '../components/PermissionGuard';
import {
  buscarCNPJ,
  buscarCEP,
  formatCNPJ,
  formatCPF,
  formatTelefone,
  formatCEP,
  isValidEmail,
  isValidCNPJ,
  isValidCPF,
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
  const { can, module } = usePermissions();
  const clientePerms = module('clientes');

  // Estados
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warning, setWarning] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Estados do formulário
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);

  // Estados da inativação
  const [inativarDialogOpen, setInativarDialogOpen] = useState(false);
  const [inativarCliente, setInativarCliente] = useState(null);
  const [inativarObservacao, setInativarObservacao] = useState('');
  const [inativarEnviarEmail, setInativarEnviarEmail] = useState(false);
  const [inativarLoading, setInativarLoading] = useState(false);

  const [formData, setFormData] = useState({
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
    observacoes: '',
    limite_credito: 0
  });

  // Fun��o para formatar CPF ou CNPJ automaticamente
  const formatCpfCnpj = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return formatCPF(value);
    } else {
      // CNPJ: 00.000.000/0000-00
      return formatCNPJ(value);
    }
  };

  // Fun��o para obter o label din�mico
  const getCpfCnpjLabel = () => {
    const numbers = formData.cnpj.replace(/\D/g, '');
    if (numbers.length === 0) return 'CPF/CNPJ';
    if (numbers.length <= 11) return 'CPF';
    return 'CNPJ';
  };

  // Fun��o para obter o placeholder din�mico
  const getCpfCnpjPlaceholder = () => {
    const numbers = formData.cnpj.replace(/\D/g, '');
    if (numbers.length === 0) return 'Digite CPF ou CNPJ';
    if (numbers.length <= 11) return '000.000.000-00';
    return '00.000.000/0000-00';
  };

  // Fun��o para obter maxLength din�mico
  const getCpfCnpjMaxLength = () => {
    const numbers = formData.cnpj.replace(/\D/g, '');
    if (numbers.length <= 11) return 14; // CPF: 000.000.000-00
    return 18; // CNPJ: 00.000.000/0000-00
  };

  // Fun��o para formatar CPF ou CNPJ na exibi��o
  const formatCpfCnpjDisplay = (value) => {
    if (!value) return '-';
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 11) {
      return formatCPF(value);
    } else if (numbers.length === 14) {
      return formatCNPJ(value);
    }
    return value;
  };

  // Carregar clientes
  const carregarClientes = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Iniciando carregamento de clientes...');

      // Adicionar timestamp para evitar cache
      const response = await axiosInstance.get('/clientes/', {
        params: {
          page_size: 100,
          ordering: '-id',
          _t: Date.now() // Para evitar cache
        }
      });

      console.log('Resposta da API de clientes:', response.data);
      console.log('Status da resposta:', response.status);
      console.log('Headers da resposta:', response.headers);

      const clientesData = Array.isArray(response.data) ? response.data : response.data?.results || [];

      console.log('Dados de clientes processados:', clientesData);
      console.log('Quantidade de clientes retornados:', clientesData.length);

      // Debug: mostrar estrutura do primeiro cliente RAW
      if (clientesData.length > 0) {
        console.log('🔍 ESTRUTURA DO PRIMEIRO CLIENTE RAW:', clientesData[0]);
        console.log('🔍 CHAVES DISPONÍVEIS:', Object.keys(clientesData[0]));
        console.log('🔍 CAMPO ID DIRETO:', clientesData[0].id);
        console.log('🔍 CAMPO PK:', clientesData[0].pk);
        console.log('🔍 OUTROS CAMPOS POSSÍVEIS:', {
          'cliente_id': clientesData[0].cliente_id,
          'id_cliente': clientesData[0].id_cliente,
          'codigo': clientesData[0].codigo
        });
      }

      // Normalizar dados dos clientes e garantir IDs únicos
      const clientesNormalizados = clientesData
        .map((cliente, index) => {
          console.log(`🔧 Processando cliente ${index}:`, cliente);
          const clienteNormalizado = normalizeClienteData(cliente);
          console.log(`🔧 Cliente ${index} normalizado:`, clienteNormalizado);

          // Só criar ID temporário se realmente não tiver ID válido
          if (!clienteNormalizado.id || clienteNormalizado.id === null || clienteNormalizado.id === undefined) {
            console.warn(`❌ Cliente ${index} sem ID encontrado:`, clienteNormalizado);
            clienteNormalizado.id = `temp-id-${index}-${Date.now()}`;
            console.log(`🆔 ID temporário criado: ${clienteNormalizado.id}`);
          } else {
            console.log(`✅ Cliente ${index} com ID válido: ${clienteNormalizado.id}`);
          }

          return clienteNormalizado;
        })
        .filter(cliente => cliente && cliente.id);

      console.log('Clientes normalizados:', clientesNormalizados);
      console.log('Quantidade final de clientes:', clientesNormalizados.length);

      setClientes(clientesNormalizados);

    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError('Erro ao carregar lista de clientes');
    } finally {
      setLoading(false);
    }
  };

  // Validar CPF/CNPJ em tempo real
  const handleCnpjChange = (value) => {
    const formatted = formatCNPJ(value);
    setFormData({ ...formData, cnpj: formatted });

    // Limpar warning anterior
    setWarning('');

    const numbers = formatted.replace(/\D/g, '');

    if (numbers.length === 11) {
      // CPF completo - validar
      if (!isValidCPF(formatted)) {
        setWarning('⚠️ CPF inválido');
      }
    } else if (numbers.length === 14) {
      // CNPJ completo - validar
      if (!isValidCNPJ(formatted)) {
        setWarning('⚠️ CNPJ inválido');
      }
    } else if (numbers.length > 0 && numbers.length !== 11 && numbers.length !== 14) {
      // Quantidade incorreta de dígitos
      setWarning('⚠️ CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos');
    }
  };

  // Buscar CNPJ (Receita)
  const handleBuscarCNPJ = async () => {
    if (!formData.cnpj) {
      setError('Digite um CNPJ para buscar (CPF n�o possui busca autom�tica)');
      return;
    }

    if (!isValidCNPJ(formData.cnpj)) {
      setWarning('⚠️ CNPJ inválido. A busca pode não funcionar corretamente.');
      // Não retorna - permite tentar buscar mesmo assim
    }

    try {
      setLoadingCNPJ(true);
      setError('');
      setWarning('');

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
      setError(`Erro ao Buscar CNPJ (Receita): ${err.message}`);
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
      console.log('🔵 handleSave chamado!', { formData });
      setError('');
      setWarning('');

      // Validações
      if (!formData.nome.trim()) {
        setError('Nome é obrigatório');
        return;
      }

      // Validar CPF/CNPJ mas apenas avisar se inválido (não bloquear)
      if (formData.cnpj) {
        const numbers = formData.cnpj.replace(/\D/g, '');
        if (numbers.length === 11) {
          // Validar CPF
          if (!isValidCPF(formData.cnpj)) {
            setWarning('⚠️ CPF inválido - Os dados serão salvos mesmo assim');
          }
        } else if (numbers.length === 14) {
          // Validar CNPJ
          if (!isValidCNPJ(formData.cnpj)) {
            setWarning('⚠️ CNPJ inválido - Os dados serão salvos mesmo assim');
          }
        } else if (numbers.length > 0) {
          setWarning('⚠️ CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos - Os dados serão salvos mesmo assim');
        }
      }

      if (formData.email && !isValidEmail(formData.email)) {
        setError('Email inválido');
        return;
      }

      console.log('✅ Validações passaram! Preparando dados...');

      // Mapear campos do frontend para o backend
      const dadosParaSalvar = {
        nome_razao_social: formData.nome || formData.razao_social || '',
        nome_fantasia: formData.nome_fantasia || '',
        cpf_cnpj: formData.cnpj ? formData.cnpj.replace(/\D/g, '') : '',
        inscricao_estadual: formData.inscricao_estadual || '',
        telefone: formData.telefone ? formData.telefone.replace(/\D/g, '') : '',
        whatsapp: formData.whatsapp ? formData.whatsapp.replace(/\D/g, '') : '',
        email: formData.email || '',
        cep: formData.cep ? formData.cep.replace(/\D/g, '') : '',
        endereco: formData.endereco || '',
        numero: formData.numero || '',
        complemento: formData.complemento || '',
        bairro: formData.bairro || '',
        cidade: formData.cidade || '',
        estado: formData.estado || '',
        data_nascimento: formData.data_aniversario || null,
        observacoes: formData.observacoes || '',
        limite_credito: parseFloat(formData.limite_credito) || 0,
        sexo: formData.sexo || null
      };

      console.log('📤 Enviando dados para o backend:', dadosParaSalvar);
      console.log('🆔 editingId:', editingId);

      if (editingId) {
        console.log(`➡️ Fazendo PUT para /clientes/${editingId}/`);
        await axiosInstance.put(`/clientes/${editingId}/`, dadosParaSalvar);
        setSuccess('Cliente atualizado com sucesso!');
      } else {
        console.log('➡️ Fazendo POST para /clientes/ (novo cliente)');
        await axiosInstance.post('/clientes/', dadosParaSalvar);
        setSuccess('Cliente cadastrado com sucesso!');
      }

      setOpen(false);
      resetForm();
      carregarClientes();

    } catch (err) {
      console.error('❌ Erro ao salvar cliente:', err);
      console.error('❌ Detalhes do erro:', err.response?.data);

      // Tratar erros específicos
      let errorMessage = 'Erro ao salvar';
      if (err.response?.data?.cpf_cnpj) {
        errorMessage = `CPF/CNPJ: ${err.response.data.cpf_cnpj[0]}`;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data) {
        // Pegar primeiro erro do objeto
        const firstError = Object.values(err.response.data)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else {
        errorMessage = err.message;
      }

      setError(`Erro ao salvar: ${errorMessage}`);
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
      observacoes: '',
      limite_credito: 0,
      sexo: ''
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
      observacoes: clienteNormalizado.observacoes,
      limite_credito: clienteNormalizado.limite_credito || 0,
      sexo: cliente.sexo || ''
    });
    setEditingId(cliente.id);
    setOpen(true);
  };

  // Excluir cliente
  const handleDelete = async (id) => {
    console.log('Tentando excluir cliente com ID:', id);

    if (!id) {
      setError('ID do cliente não encontrado');
      return;
    }

    // Verificar se é um ID temporário (não deve ser excluído via API)
    if (String(id).startsWith('temp-id-')) {
      console.log('ID temporário detectado, removendo apenas da lista local');
      setClientes(prev => prev.filter(cliente => cliente.id !== id));
      setSuccess('Cliente temporário removido da lista');
      setError('');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) {
      console.log('Exclusão cancelada pelo usuário');
      return;
    }

    try {
      console.log('Enviando requisiçéo DELETE para:', `/clientes/${id}/`);

      // Fazer a requisiçéo de exclusão
      const response = await axiosInstance.delete(`/clientes/${id}/`);
      console.log('Resposta da exclusão:', response);

      // Verificar se a exclusão foi bem-sucedida
      if (response.status === 200 || response.status === 204) {
        console.log('Cliente excluído com sucesso no backend');

        // Aguardar um pouco e verificar se realmente foi excluído
        setTimeout(async () => {
          const existe = await verificarClienteExiste(id);
          if (existe === false) {
            console.log('✅ Confirmado: Cliente foi excluído do backend');
          } else if (existe === true) {
            console.error('❌ PROBLEMA: Cliente ainda existe no backend após exclusão!');
            setError('Atençéo: Cliente pode não ter sido excluído corretamente. Verifique no backend.');
          }
        }, 1000);

        // Remover imediatamente da lista local para feedback rápido
        setClientes(prev => prev.filter(cliente => cliente.id !== id));

        setSuccess('Cliente excluído com sucesso!');
        setError('');

        // Recarregar a lista para garantir sincronização com o backend
        console.log('Recarregando lista de clientes...');
        await carregarClientes();

      } else {
        throw new Error(`Status inesperado: ${response.status}`);
      }

    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      console.error('Detalhes do erro:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers
      });

      const errorMessage = err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Erro desconhecido ao excluir cliente';

      setError(`Erro ao excluir cliente: ${errorMessage}`);
      setSuccess('');

      // Se houver erro, recarregar a lista para garantir que está atualizada
      try {
        await carregarClientes();
      } catch (reloadError) {
        console.error('Erro ao recarregar clientes após falha na exclusão:', reloadError);
      }
    }
  };

  // Reativar cliente
  const handleReativar = async (cliente) => {
    if (!window.confirm(`Reativar o cliente ${cliente.razao_social || cliente.nome}?`)) return;
    try {
      await axiosInstance.post(`/clientes/${cliente.id}/reativar/`);
      setSuccess(`Cliente ${cliente.razao_social || cliente.nome} reativado com sucesso!`);
      carregarClientes();
    } catch (error) {
      console.error('Erro ao reativar cliente:', error);
      setError(error.response?.data?.erro || 'Erro ao reativar cliente.');
    }
  };

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(cliente => {
    const matchBusca = 
      cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cnpj?.includes(searchTerm) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || 
      (filtroStatus === 'ativos' && cliente.ativo !== false) ||
      (filtroStatus === 'inativos' && cliente.ativo === false);
    return matchBusca && matchStatus;
  });

  useEffect(() => {
    carregarClientes();

    // Teste de conectividade com o backend
    testBackendConnection();
  }, []);

  // função para verificar se um cliente existe no backend
  const verificarClienteExiste = async (id) => {
    try {
      console.log(`🔍 Verificando se cliente ${id} existe no backend...`);
      const response = await axiosInstance.get(`/clientes/${id}/`);
      console.log(`✅ Cliente ${id} existe no backend:`, response.data);
      return true;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`❌ Cliente ${id} não existe no backend (404)`);
        return false;
      }
      console.error(`⚠️ Erro ao verificar cliente ${id}:`, error);
      return null; // Erro indeterminado
    }
  };

  // função para testar conectividade com o backend
  const testBackendConnection = async () => {
    try {
      console.log('🔍 Testando conectividade com o backend...');
      const response = await axiosInstance.get('/clientes/', {
        params: { page_size: 1 }
      });
      console.log('✅ Backend conectado com sucesso:', {
        status: response.status,
        url: response.config.url,
        baseURL: response.config.baseURL
      });
    } catch (error) {
      console.error('❌ Erro de conectividade com backend:', {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
    }
  };

  // Limpar mensagens após 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Renderizar Cards Mobile
  const handleOpenInativar = (cliente) => {
    setInativarCliente(cliente);
    setInativarObservacao('');
    setInativarEnviarEmail(false);
    setInativarDialogOpen(true);
  };

  const handleConfirmInativar = async () => {
    if (!inativarCliente) return;

    try {
      setInativarLoading(true);
      await axiosInstance.post(`/clientes/${inativarCliente.id}/inativar/`, {
        observacoes: inativarObservacao,
        enviar_email: inativarEnviarEmail
      });

      setSuccess(`Cliente ${inativarCliente.razao_social} inativado com sucesso!`);
      setInativarDialogOpen(false);
      carregarClientes(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao inativar cliente:', error);
      setError('Erro ao inativar cliente. Tente novamente.');
    } finally {
      setInativarLoading(false);
    }
  };

  const renderMobileCards = () => (
    <Grid container spacing={2}>
      {clientesFiltrados.map((cliente, index) => (
        <Grid item xs={12} sm={6} key={cliente.id || `card-${index}`}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: cliente.ativo === false ? '#ef5350' : '#1976d2', mr: 2 }}>
                  <PersonIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">
                      {cliente.nome || cliente.razao_social}
                    </Typography>
                    <Chip
                      label={cliente.ativo === false ? 'Inativo' : 'Ativo'}
                      color={cliente.ativo === false ? 'error' : 'success'}
                      size="small"
                    />
                  </Box>
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
                  {formatCpfCnpjDisplay(cliente.cnpj)}
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
                <PermissionGuard permission="clientes_editar">
                  <IconButton
                    onClick={() => {
                      console.log('botão editar clicado para cliente:', cliente);
                      handleEdit(cliente);
                    }}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </PermissionGuard>
                
                <PermissionGuard permission="clientes_editar">
                  {cliente.ativo === false ? (
                    <Tooltip title="Reativar Cliente">
                      <IconButton onClick={() => handleReativar(cliente)} color="success">
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Inativar Cliente">
                      <IconButton onClick={() => handleOpenInativar(cliente)} color="warning">
                        <BlockIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </PermissionGuard>

                <PermissionGuard permission="clientes_excluir">
                  <IconButton
                    onClick={() => {
                      console.log('botão excluir clicado para cliente:', cliente);
                      handleDelete(cliente.id);
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </PermissionGuard>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Renderizar Tabela Desktop
  const renderDesktopTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nome/Razão Social</TableCell>
            <TableCell>CPF/CNPJ</TableCell>
            <TableCell>Telefone</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Cidade</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clientesFiltrados.map((cliente, index) => (
            <TableRow key={cliente.id || `row-${index}`}>
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
              <TableCell>{formatCpfCnpjDisplay(cliente.cnpj)}</TableCell>
              <TableCell>{cliente.telefone ? formatTelefone(cliente.telefone) : '-'}</TableCell>
              <TableCell>{cliente.email || '-'}</TableCell>
              <TableCell>{cliente.cidade || '-'}</TableCell>
              <TableCell>
                <Chip
                  label={cliente.ativo === false ? 'Inativo' : 'Ativo'}
                  color={cliente.ativo === false ? 'error' : 'success'}
                  size="small"
                  icon={cliente.ativo === false ? <CancelIcon /> : <CheckCircleIcon />}
                />
              </TableCell>
              <TableCell>
                <PermissionGuard permission="clientes_editar">
                  <IconButton
                    onClick={() => {
                      console.log('botão editar clicado para cliente (tabela):', cliente);
                      handleEdit(cliente);
                    }}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </PermissionGuard>

                <PermissionGuard permission="clientes_editar">
                  {cliente.ativo === false ? (
                    <Tooltip title="Reativar Cliente">
                      <IconButton onClick={() => handleReativar(cliente)} color="success">
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Inativar Cliente">
                      <IconButton onClick={() => handleOpenInativar(cliente)} color="warning">
                        <BlockIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </PermissionGuard>

                <PermissionGuard permission="clientes_excluir">
                  <IconButton
                    onClick={() => {
                      console.log('botão excluir clicado para cliente (tabela):', cliente);
                      handleDelete(cliente.id);
                    }}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </PermissionGuard>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* cabeçalho */}
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

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} label="Status">
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="ativos">Ativos</MenuItem>
              <MenuItem value="inativos">Inativos</MenuItem>
            </Select>
          </FormControl>

          <PermissionGuard permission="clientes_criar">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setOpen(true);
              }}
              sx={{ mr: 1 }}
            >
              Novo Cliente
            </Button>
          </PermissionGuard>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              console.log('🔄 Recarregamento manual solicitado');
              carregarClientes();
            }}
            disabled={loading}
          >
            {loading ? 'Carregando...' : 'Atualizar'}
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

      {warning && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setWarning('')}>
          {warning}
        </Alert>
      )}

      {/* Lista de clientes */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        renderMobileCards()
      ) : (
        renderDesktopTable()
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
          {warning && (
            <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setWarning('')}>
              {warning}
            </Alert>
          )}

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
                label="CNPJ e CPF"
                value={formData.cnpj}
                onChange={(e) => handleCnpjChange(e.target.value)}
                placeholder="00.000.000/0000-00 ou 000.000.000-00"
                inputProps={{ maxLength: 18 }}
                error={Boolean(warning && warning.includes('inválido'))}
                helperText={warning && warning.includes('inválido') ? warning : ''}
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
                Buscar CNPJ (Receita)
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

            {/* Seção: Limite de Crédito */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, color: '#1976d2' }}>
                <CreditCardIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Limite de Crédito
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Limite de Crédito"
                type="number"
                value={formData.limite_credito}
                onChange={(e) => setFormData({ ...formData, limite_credito: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Valor máximo que este cliente pode ter em aberto"
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

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Sexo</InputLabel>
                <Select
                  value={formData.sexo}
                  onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                  label="Sexo"
                >
                  <MenuItem value="">Não informado</MenuItem>
                  <MenuItem value="M">Masculino</MenuItem>
                  <MenuItem value="F">Feminino</MenuItem>
                </Select>
              </FormControl>
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

      {/* Modal de Inativação */}
      <Dialog
        open={inativarDialogOpen}
        onClose={() => setInativarDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Inativar Cliente</DialogTitle>
        <DialogContent>
          {inativarCliente && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Tem certeza que deseja inativar este cliente?
                  </Alert>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Código</Typography>
                  <Typography variant="body1">{inativarCliente.id}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                   <Typography variant="subtitle2" color="text.secondary">CPF/CNPJ</Typography>
                   <Typography variant="body1">{formatCpfCnpjDisplay(inativarCliente.cnpj)}</Typography>
                </Grid>

                <Grid item xs={12}>
                   <Typography variant="subtitle2" color="text.secondary">Razão Social</Typography>
                   <Typography variant="body1">{inativarCliente.razao_social}</Typography>
                </Grid>

                {inativarCliente.nome_fantasia && (
                    <Grid item xs={12}>
                       <Typography variant="subtitle2" color="text.secondary">Nome Fantasia</Typography>
                       <Typography variant="body1">{inativarCliente.nome_fantasia}</Typography>
                    </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observação"
                    multiline
                    rows={3}
                    value={inativarObservacao}
                    onChange={(e) => setInativarObservacao(e.target.value)}
                    placeholder="Motivo da inativação..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={inativarEnviarEmail}
                        onChange={(e) => setInativarEnviarEmail(e.target.checked)}
                      />
                    }
                    label="Enviar notificação por e-mail"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInativarDialogOpen(false)} disabled={inativarLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmInativar} 
            color="error" 
            variant="contained"
            disabled={inativarLoading}
            startIcon={inativarLoading ? <CircularProgress size={20} color="inherit" /> : <BlockIcon />}
          >
            {inativarLoading ? 'Inativando...' : 'Confirmar Inativação'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para mobile */}
      {isMobile && (
        <PermissionGuard permission="clientes_criar">
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
        </PermissionGuard>
      )}
    </Box>
  );
};

export default ClientePageComplete;










