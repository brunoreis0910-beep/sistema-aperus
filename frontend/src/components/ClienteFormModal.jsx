import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Chip,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Slide,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Download as DownloadIcon,
  CreditCard as CreditCardIcon,
  Send as SendIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Cake as CakeIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import {
  buscarCNPJ,
  buscarCEP,
  formatCNPJ,
  formatCPF,
  formatTelefone,
  formatCEP,
  ESTADOS_BRASIL,
  normalizeClienteData
} from '../utils/cnpjCepUtils';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ClienteFormModal = ({ open, onClose, onSaved, clienteToEdit = null }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { axiosInstance } = useAuth();

  const [loading, setLoading] = useState(false);
  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [gruposProduto, setGruposProduto] = useState([]);

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
    limite_credito: 0,
    sexo: '',
    tipo_desconto: 'PERCENTUAL',
    valor_desconto: 0,
    percentual_arredondamento: 0,
    priorizar_desconto_cliente: false,
    grupos_excecao: []
  });

  useEffect(() => {
    if (open) {
      carregarGruposProduto();
      if (clienteToEdit) {
        const clienteNormalizado = normalizeClienteData(clienteToEdit);
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
          sexo: clienteNormalizado.sexo || '',
          tipo_desconto: clienteNormalizado.tipo_desconto || 'PERCENTUAL',
          valor_desconto: clienteNormalizado.valor_desconto || 0,
          percentual_arredondamento: clienteNormalizado.percentual_arredondamento || 0,
          priorizar_desconto_cliente: Boolean(clienteNormalizado.priorizar_desconto_cliente),
          grupos_excecao: clienteNormalizado.grupos_excecao || []
        });
      } else {
        resetForm();
      }
    }
  }, [open, clienteToEdit]);

  const carregarGruposProduto = async () => {
    try {
      const response = await axiosInstance.get('/grupos-produto/');
      const dados = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setGruposProduto(dados);
    } catch (err) {
      console.error('Erro ao carregar grupos de produto:', err);
    }
  };

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
      sexo: '',
      tipo_desconto: 'PERCENTUAL',
      valor_desconto: 0,
      percentual_arredondamento: 0,
      priorizar_desconto_cliente: false,
      grupos_excecao: []
    });
    setError('');
    setWarning('');
  };

  const handleCnpjChange = (value) => {
    const numbers = value.replace(/\D/g, '');
    let formatted = value;
    if (numbers.length <= 11) {
      formatted = formatCPF(value);
    } else {
      formatted = formatCNPJ(value);
    }
    setFormData(prev => ({ ...prev, cnpj: formatted }));
  };

  const handleBuscarCNPJ = async () => {
    if (!formData.cnpj) {
      setWarning('Digite um CNPJ para buscar');
      return;
    }
    const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) {
      setWarning('CNPJ deve ter 14 dígitos para buscar na Receita');
      return;
    }
    setLoadingCNPJ(true);
    setError('');
    setWarning('');
    try {
      const data = await buscarCNPJ(cleanCNPJ);
      setFormData(prev => ({
        ...prev,
        nome: data.razao_social || data.nome || prev.nome,
        razao_social: data.razao_social || data.nome || prev.razao_social,
        nome_fantasia: data.nome_fantasia || prev.nome_fantasia,
        inscricao_estadual: data.inscricao_estadual || prev.inscricao_estadual,
        telefone: data.telefone ? formatTelefone(data.telefone) : prev.telefone,
        whatsapp: data.telefone ? formatTelefone(data.telefone) : prev.whatsapp,
        email: data.email || prev.email,
        cep: data.cep ? formatCEP(data.cep) : prev.cep,
        endereco: data.endereco || prev.endereco,
        numero: data.numero || prev.numero,
        complemento: data.complemento || prev.complemento,
        bairro: data.bairro || prev.bairro,
        cidade: data.cidade || prev.cidade,
        estado: data.estado || prev.estado,
      }));
    } catch (err) {
      setError(err.message || 'Erro ao buscar CNPJ');
    } finally {
      setLoadingCNPJ(false);
    }
  };

  const handleBuscarCEP = async () => {
    if (!formData.cep) {
      setWarning('Digite um CEP');
      return;
    }
    const cleanCEP = formData.cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) {
      setWarning('CEP deve ter 8 dígitos');
      return;
    }
    setLoadingCEP(true);
    setError('');
    setWarning('');
    try {
      const data = await buscarCEP(cleanCEP);
      setFormData(prev => ({
        ...prev,
        endereco: data.endereco || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.cidade || prev.cidade,
        estado: data.estado || prev.estado,
      }));
    } catch (err) {
      setError(err.message || 'Erro ao buscar CEP');
    } finally {
      setLoadingCEP(false);
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      setWarning('');
      const nomeSalvar = (formData.nome || formData.razao_social || '').trim();
      if (!nomeSalvar) {
        setError('Nome do Cliente é obrigatório');
        return;
      }

      setLoading(true);
      const dadosParaSalvar = {
        nome_razao_social: nomeSalvar,
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
        sexo: formData.sexo || null,
        tipo_desconto: formData.tipo_desconto || 'PERCENTUAL',
        valor_desconto: parseFloat(formData.valor_desconto) || 0,
        percentual_arredondamento: parseFloat(formData.percentual_arredondamento) || 0,
        priorizar_desconto_cliente: Boolean(formData.priorizar_desconto_cliente),
        grupos_excecao: Array.isArray(formData.grupos_excecao) ? formData.grupos_excecao : []
      };

      let response;
      const editingId = clienteToEdit?.id || clienteToEdit?.id_cliente;
      if (editingId) {
        response = await axiosInstance.put(`/clientes/${editingId}/`, dadosParaSalvar);
      } else {
        response = await axiosInstance.post('/clientes/', dadosParaSalvar);
      }

      onClose();
      if (onSaved) {
        onSaved(response.data);
      }
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      let errorMessage = 'Erro ao salvar';
      if (err.response?.data?.cpf_cnpj) {
        errorMessage = `CPF/CNPJ: ${err.response.data.cpf_cnpj[0]}`;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data) {
        const firstError = Object.values(err.response.data)[0];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else {
        errorMessage = err.message;
      }
      setError(`Erro ao salvar: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Transition}
    >
      {isMobile && (
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {clienteToEdit ? 'Editar Cliente' : 'Novo Cliente'}
            </Typography>
            <Button autoFocus color="inherit" onClick={handleSave} disabled={loading}>
              Salvar
            </Button>
          </Toolbar>
        </AppBar>
      )}

      <DialogTitle sx={{ display: isMobile ? 'none' : 'block' }}>
        {clienteToEdit ? 'Editar Cliente' : 'Novo Cliente'}
      </DialogTitle>

      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {warning && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setWarning('')}>
            {warning}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Seção: Dados da Empresa */}
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
              placeholder="00.000.000/0000-00 OU 000.000.000-00"
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
              {loadingCNPJ ? 'Buscando...' : 'Buscar CNPJ (Receita)'}
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Razão Social"
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
              label="Inscrição Estadual"
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

          {/* Seção: Descontos Inteligentes */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, mt: 2, color: '#1976d2' }}>
              <SendIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
              Descontos Inteligentes
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Desconto</InputLabel>
              <Select
                value={formData.tipo_desconto || 'PERCENTUAL'}
                label="Tipo de Desconto"
                onChange={(e) => setFormData({ ...formData, tipo_desconto: e.target.value })}
              >
                <MenuItem value="PERCENTUAL">Percentual (%)</MenuItem>
                <MenuItem value="FIXO">Fixo (R$)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Valor do Desconto"
              type="number"
              value={formData.valor_desconto}
              onChange={(e) => setFormData({ ...formData, valor_desconto: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
              helperText={formData.tipo_desconto === 'PERCENTUAL' ? 'Valor em %' : 'Valor em R$'}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Arredondamento (%)"
              type="number"
              value={formData.percentual_arredondamento}
              onChange={(e) => setFormData({ ...formData, percentual_arredondamento: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Margem de ajuste permitida"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(formData.priorizar_desconto_cliente)}
                  onChange={(e) => setFormData({ ...formData, priorizar_desconto_cliente: e.target.checked })}
                />
              }
              label="Priorizar desconto do cliente"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Grupos de Exceção</InputLabel>
              <Select
                multiple
                value={formData.grupos_excecao || []}
                onChange={(e) => {
                  const val = Array.isArray(e.target.value) ? e.target.value : [];
                  setFormData({ ...formData, grupos_excecao: val.map(Number) });
                }}
                label="Grupos de Exceção"
                renderValue={(selected) => {
                  const selectedArray = Array.isArray(selected) ? selected : [];
                  if (selectedArray.length === 0) return <em style={{ color: '#aaa' }}>Nenhum grupo selecionado</em>;
                  const nomes = gruposProduto
                    .filter((grupo) => {
                      const gid = grupo.id_grupo || grupo.id;
                      return selectedArray.map(Number).includes(Number(gid));
                    })
                    .map((grupo) => grupo.nome_grupo || grupo.nome);
                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {nomes.map((nome) => (
                        <Chip key={nome} label={nome} size="small" sx={{ backgroundColor: '#1565C0', color: 'white', fontSize: '0.75rem' }} />
                      ))}
                    </Box>
                  );
                }}
              >
                {gruposProduto.map((grupo) => {
                  const gid = grupo.id_grupo || grupo.id;
                  const isChecked = Array.isArray(formData.grupos_excecao) &&
                    formData.grupos_excecao.map(Number).includes(Number(gid));
                  return (
                    <MenuItem key={gid} value={Number(gid)}>
                      <Checkbox checked={isChecked} readOnly />
                      <Typography>{grupo.nome_grupo || grupo.nome}</Typography>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {Array.isArray(formData.grupos_excecao) && formData.grupos_excecao.length > 0 ? (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {formData.grupos_excecao.map((gid) => {
                  const grupo = gruposProduto.find(g => Number(g.id_grupo || g.id) === Number(gid));
                  const nome = grupo ? (grupo.nome_grupo || grupo.nome) : `Grupo #${gid}`;
                  return (
                    <Chip
                      key={gid}
                      label={nome}
                      size="small"
                      onDelete={() => {
                        setFormData(prev => ({
                          ...prev,
                          grupos_excecao: prev.grupos_excecao.filter(id => Number(id) !== Number(gid))
                        }));
                      }}
                      sx={{ backgroundColor: '#E3F2FD', color: '#1565C0', fontWeight: 'bold', border: '1px solid #90CAF9' }}
                    />
                  );
                })}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Nenhum grupo de exceção selecionado — o desconto será aplicado a todos os grupos
              </Typography>
            )}
          </Grid>

          {/* Seção: Contato */}
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

          {/* Seção: Endereço */}
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
              {loadingCEP ? 'Buscando...' : 'Buscar CEP'}
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
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ClienteFormModal;
