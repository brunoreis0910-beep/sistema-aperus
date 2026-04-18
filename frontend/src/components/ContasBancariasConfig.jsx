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
  Switch,
  FormControlLabel,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
  Api as ApiIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const ContasBancariasConfig = () => {
  const { axiosInstance } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [contasBancarias, setContasBancarias] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentConta, setCurrentConta] = useState({
    id_conta_bancaria: null,
    nome_conta: '',
    codigo_banco: '',
    nome_banco: '',
    agencia: '',
    conta: '',
    digito: '',
    tipo_conta: 'C', // C = Conta Corrente, P = Poupança
    saldo_inicial: 0.00,
    obs: ''
  });

  // ===== Estado para Configurações de API Bancária =====
  const configBancariaVazio = {
    id_config: null,
    nome_configuracao: '',
    banco: 'BB',
    id_conta_bancaria: '',
    client_id: '',
    client_secret: '',
    url_autenticacao: '',
    url_api_boletos: '',
    codigo_banco: '',
    agencia: '',
    conta: '',
    convenio: '',
    dias_protesto: 0,
    dias_baixa: 30,
    percentual_multa: '2.00',
    percentual_juros_dia: '0.0333',
    ambiente: 'PRODUCAO',
    ativo: true,
    baixa_automatica_api: true,
    gerar_boleto_automatico: true,
  };
  const [configuracoesBancarias, setConfiguracoesBancarias] = useState([]);
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(configBancariaVazio);
  const [testando, setTestando] = useState(null); // id_config que está testando
  const [resultadoTeste, setResultadoTeste] = useState({});

  useEffect(() => {
    carregarContasBancarias();
    carregarConfiguracoesBancarias();
  }, []);

  const carregarContasBancarias = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/contas-bancarias/');
      console.log('📡 Resposta da API contas bancárias:', response.data);

      let contasData = [];
      if (Array.isArray(response.data)) {
        contasData = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        contasData = response.data.results;
      } else if (response.data?.value && Array.isArray(response.data.value)) {
        contasData = response.data.value;
      }

      setContasBancarias(contasData);
      setError(null);
    } catch (err) {
      console.error('❌ Erro ao carregar contas bancárias:', err);
      setError('Erro ao carregar contas bancárias');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentConta(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const dadosParaEnvio = {
        nome_conta: currentConta.nome_conta,
        codigo_banco: currentConta.codigo_banco,
        nome_banco: currentConta.nome_banco,
        agencia: currentConta.agencia,
        conta: currentConta.conta,
        digito: currentConta.digito,
        tipo_conta: currentConta.tipo_conta,
        saldo_inicial: parseFloat(currentConta.saldo_inicial) || 0.00,
        obs: currentConta.obs || ''
      };

      console.log('📤 Dados da conta bancária que seréo enviados:', dadosParaEnvio);

      if (isEditing && currentConta.id_conta_bancaria) {
        await axiosInstance.patch(`/contas-bancarias/${currentConta.id_conta_bancaria}/`, dadosParaEnvio);
        console.log('💾 Conta bancária atualizada via API');
      } else {
        await axiosInstance.post('/contas-bancarias/', dadosParaEnvio);
        console.log('💾 Nova conta bancária criada via API');
      }

      setOpenDialog(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setError(null);

      await carregarContasBancarias();

    } catch (err) {
      console.error('❌ Erro ao salvar conta bancária:', err);
      console.error('❌ Detalhes do erro:', err.response?.data);
      setError('Erro ao salvar conta bancária: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (conta) => {
    setCurrentConta(conta);
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleNew = () => {
    setCurrentConta({
      id_conta_bancaria: null,
      nome_conta: '',
      codigo_banco: '',
      nome_banco: '',
      agencia: '',
      conta: '',
      digito: '',
      tipo_conta: 'C',
      saldo_inicial: 0.00,
      obs: ''
    });
    setIsEditing(false);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta bancária?')) {
      try {
        setLoading(true);
        await axiosInstance.delete(`/contas-bancarias/${id}/`);
        console.log('🗑️ Conta bancária excluída');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        await carregarContasBancarias();
      } catch (err) {
        console.error('❌ Erro ao excluir conta bancária:', err);
        setError('Erro ao excluir conta bancária: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  // ===== Templates de APIs dos Bancos =====
  const TEMPLATES_BANCOS = {
    '001': { // Banco do Brasil
      nome: 'Banco do Brasil',
      banco: 'BB',
      url_autenticacao: 'https://oauth.bb.com.br/oauth/token',
      url_api_boletos: 'https://api.bb.com.br/cobrancas/v2',
      url_homologacao: 'https://api.hm.bb.com.br/cobrancas/v2',
      instrucoes: 'Obtenha as credenciais no Portal do Desenvolvedor do BB'
    },
    '104': { // Caixa Econômica Federal
      nome: 'Caixa Econômica Federal',
      banco: 'CAIXA',
      url_autenticacao: 'https://barramento.caixa.gov.br/auth',
      url_api_boletos: 'https://barramento.caixa.gov.br/api-boleto',
      url_homologacao: 'https://barramento.caixa.gov.br/homologacao',
      instrucoes: 'Configure no Conectividade Social ICP - Internet Banking Caixa'
    },
    '033': { // Santander
      nome: 'Banco Santander',
      banco: 'SANTANDER',
      url_autenticacao: 'https://trust-open.santander.com.br/auth/oauth/v2/token',
      url_api_boletos: 'https://trust-open.santander.com.br/collection/v2',
      url_homologacao: 'https://sandbox.santander.com.br',
      instrucoes: 'Cadastre-se no Santander Open Platform'
    },
    '237': { // Bradesco
      nome: 'Banco Bradesco',
      banco: 'BRADESCO',
      url_autenticacao: 'https://proxy.api.prebanco.com.br/auth/server/v1.1/token',
      url_api_boletos: 'https://proxy.api.prebanco.com.br/v1/boleto',
      url_homologacao: 'https://proxy-homologacao.api.prebanco.com.br',
      instrucoes: 'Acesse o Portal Developer Bradesco e solicite credenciais'
    },
    '756': { // Sicoob
      nome: 'Bancoob (Sicoob)',
      banco: 'SICOOB',
      url_autenticacao: 'https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token',
      url_api_boletos: 'https://api.sicoob.com.br/boleto/v1',
      url_homologacao: 'https://sandbox.sicoob.com.br',
      instrucoes: 'Entre em contato com sua cooperativa para liberar API'
    },
    '748': { // Sicredi
      nome: 'Sicredi',
      banco: 'SICREDI',
      url_autenticacao: 'https://api.sicredi.com.br/auth/openid-connect/token',
      url_api_boletos: 'https://api.sicredi.com.br/cobranca/v2',
      url_homologacao: 'https://sandbox-api.sicredi.com.br',
      instrucoes: 'Solicite credenciais através da sua cooperativa'
    },
    '341': { // Itaú
      nome: 'Banco Itaú',
      banco: 'ITAU',
      url_autenticacao: 'https://oauth.itau.com.br/identity/connect/token',
      url_api_boletos: 'https://secure.api.c6bank.com.br:8443/pix-itau/api',
      url_homologacao: 'https://sandbox.itau.com.br',
      instrucoes: 'Cadastre-se no Portal do Desenvolvedor Itaú'
    }
  };

  const handleConfigurarAPI = async (conta) => {
    // Buscar configuração existente para esta conta
    const configExistente = configuracoesBancarias.find(
      cfg => cfg.id_conta_bancaria === conta.id_conta_bancaria
    );

    if (configExistente) {
      // Editar configuração existente
      handleEditConfig(configExistente);
    } else {
      // Criar nova configuração com template do banco
      const template = TEMPLATES_BANCOS[conta.codigo_banco] || {};
      
      setCurrentConfig({
        ...configBancariaVazio,
        nome_configuracao: `API ${conta.nome_conta}`,
        banco: template.banco || 'BB',
        id_conta_bancaria: conta.id_conta_bancaria,
        codigo_banco: conta.codigo_banco,
        agencia: conta.agencia,
        conta: conta.conta,
        url_autenticacao: template.url_autenticacao || '',
        url_api_boletos: template.url_api_boletos || '',
      });
      setIsEditingConfig(false);
      setOpenConfigDialog(true);
    }
  };

  // ===== Funções de API Bancária =====
  const carregarConfiguracoesBancarias = async () => {
    try {
      const response = await axiosInstance.get('/configuracoes-bancarias/');
      const data = Array.isArray(response.data) ? response.data
        : response.data?.results || [];
      setConfiguracoesBancarias(data);
    } catch (err) {
      console.error('❌ Erro ao carregar configurações bancárias:', err);
    }
  };

  const handleEditConfig = (config) => {
    setCurrentConfig({ ...config, client_secret: '' }); // nunca retorna o secret
    setIsEditingConfig(true);
    setOpenConfigDialog(true);
  };

  const handleConfigChange = (field, value) => {
    setCurrentConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      const dados = {
        nome_configuracao: currentConfig.nome_configuracao,
        banco: currentConfig.banco,
        id_conta_bancaria: currentConfig.id_conta_bancaria || null,
        client_id: currentConfig.client_id,
        client_secret: currentConfig.client_secret,
        url_autenticacao: currentConfig.url_autenticacao,
        url_api_boletos: currentConfig.url_api_boletos,
        codigo_banco: currentConfig.codigo_banco,
        agencia: currentConfig.agencia,
        conta: currentConfig.conta,
        convenio: currentConfig.convenio || '',
        dias_protesto: parseInt(currentConfig.dias_protesto) || 0,
        dias_baixa: parseInt(currentConfig.dias_baixa) || 30,
        percentual_multa: parseFloat(currentConfig.percentual_multa) || 2.00,
        percentual_juros_dia: parseFloat(currentConfig.percentual_juros_dia) || 0.0333,
        ambiente: currentConfig.ambiente,
        ativo: currentConfig.ativo,
        baixa_automatica_api: currentConfig.baixa_automatica_api,
        gerar_boleto_automatico: currentConfig.gerar_boleto_automatico,
      };

      if (isEditingConfig && currentConfig.id_config) {
        await axiosInstance.patch(`/configuracoes-bancarias/${currentConfig.id_config}/`, dados);
      } else {
        await axiosInstance.post('/configuracoes-bancarias/', dados);
      }

      setOpenConfigDialog(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await carregarConfiguracoesBancarias();
    } catch (err) {
      console.error('❌ Erro ao salvar configuração bancária:', err);
      setError('Erro ao salvar: ' + (err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (id) => {
    if (window.confirm('Excluir esta configuração de API bancária?')) {
      try {
        setLoading(true);
        await axiosInstance.delete(`/configuracoes-bancarias/${id}/`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        await carregarConfiguracoesBancarias();
      } catch (err) {
        setError('Erro ao excluir: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTestarConexao = async (id) => {
    setTestando(id);
    setResultadoTeste(prev => ({ ...prev, [id]: null }));
    try {
      const res = await axiosInstance.post(`/configuracoes-bancarias/${id}/testar_conexao/`);
      setResultadoTeste(prev => ({ ...prev, [id]: { ok: true, msg: res.data.success } }));
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setResultadoTeste(prev => ({ ...prev, [id]: { ok: false, msg } }));
    } finally {
      setTestando(null);
    }
  };

  const handleRenovarToken = async (id) => {
    setTestando(id);
    try {
      await axiosInstance.post(`/configuracoes-bancarias/${id}/renovar_token/`);
      setResultadoTeste(prev => ({ ...prev, [id]: { ok: true, msg: 'Token renovado com sucesso' } }));
      await carregarConfiguracoesBancarias();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setResultadoTeste(prev => ({ ...prev, [id]: { ok: false, msg } }));
    } finally {
      setTestando(null);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const getTipoContaLabel = (tipo) => {
    return tipo === 'C' ? 'Conta Corrente' : 'Poupança';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Conta bancária salva com sucesso!
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
              <BankIcon />
            </Avatar>
          }
          title="Configuração de Contas Bancárias"
          subheader="Gerencie as contas bancárias do sistema"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNew}
            >
              Nova Conta Bancária
            </Button>
          }
        />

        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Nome da Conta</strong></TableCell>
                  <TableCell><strong>Banco</strong></TableCell>
                  <TableCell><strong>Agência/Conta</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Saldo Inicial</strong></TableCell>
                  <TableCell><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(contasBancarias) && contasBancarias.map((conta) => (
                  <TableRow key={conta.id_conta_bancaria} hover>
                    <TableCell>{conta.id_conta_bancaria}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {conta.nome_conta}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {conta.codigo_banco} - {conta.nome_banco}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {conta.agencia}-{conta.conta}{conta.digito ? `-${conta.digito}` : ''}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTipoContaLabel(conta.tipo_conta)}
                        color={conta.tipo_conta === 'C' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={conta.saldo_inicial >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="medium"
                      >
                        {formatarMoeda(conta.saldo_inicial)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Editar Conta">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(conta)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Configurar API do Banco">
                        <IconButton
                          color="success"
                          onClick={() => handleConfigurarAPI(conta)}
                          size="small"
                        >
                          <ApiIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir Conta">
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(conta.id_conta_bancaria)}
                          size="small"
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
        </CardContent>
      </Card>

      {/* Dialog para Editar/Criar Conta Bancária */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome da Conta"
                value={currentConta.nome_conta}
                onChange={(e) => handleInputChange('nome_conta', e.target.value)}
                variant="outlined"
                required
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Código do Banco"
                value={currentConta.codigo_banco}
                onChange={(e) => handleInputChange('codigo_banco', e.target.value)}
                variant="outlined"
                required
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Tipo de Conta</InputLabel>
                <Select
                  value={currentConta.tipo_conta}
                  onChange={(e) => handleInputChange('tipo_conta', e.target.value)}
                  label="Tipo de Conta"
                >
                  <MenuItem value="C">Conta Corrente</MenuItem>
                  <MenuItem value="P">Poupança</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Banco"
                value={currentConta.nome_banco}
                onChange={(e) => handleInputChange('nome_banco', e.target.value)}
                variant="outlined"
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Agência"
                value={currentConta.agencia}
                onChange={(e) => handleInputChange('agencia', e.target.value)}
                variant="outlined"
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Conta"
                value={currentConta.conta}
                onChange={(e) => handleInputChange('conta', e.target.value)}
                variant="outlined"
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Dígito"
                value={currentConta.digito}
                onChange={(e) => handleInputChange('digito', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Saldo Inicial"
                type="number"
                inputProps={{ step: "0.01", min: "-999999.99", max: "999999.99" }}
                value={currentConta.saldo_inicial}
                onChange={(e) => handleInputChange('saldo_inicial', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={currentConta.obs}
                onChange={(e) => handleInputChange('obs', e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>
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

      {/* ===== DIALOG: Configuração de API Bancária ===== */}
      <Dialog open={openConfigDialog} onClose={() => setOpenConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditingConfig ? 'Editar Configuração de API Bancária' : 'Nova Configuração de API Bancária'}
        </DialogTitle>
        <DialogContent>
          {/* Alerta com informações do banco */}
          {currentConfig.codigo_banco && TEMPLATES_BANCOS[currentConfig.codigo_banco] && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {TEMPLATES_BANCOS[currentConfig.codigo_banco].nome}
              </Typography>
              <Typography variant="body2">
                {TEMPLATES_BANCOS[currentConfig.codigo_banco].instrucoes}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                <strong>Ambiente de Produção:</strong> {TEMPLATES_BANCOS[currentConfig.codigo_banco].url_api_boletos}
              </Typography>
              {TEMPLATES_BANCOS[currentConfig.codigo_banco].url_homologacao && (
                <Typography variant="caption" display="block">
                  <strong>Ambiente de Homologação:</strong> {TEMPLATES_BANCOS[currentConfig.codigo_banco].url_homologacao}
                </Typography>
              )}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nome da Configuração" required
                value={currentConfig.nome_configuracao}
                onChange={(e) => handleConfigChange('nome_configuracao', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Banco</InputLabel>
                <Select value={currentConfig.banco} label="Banco"
                  onChange={(e) => handleConfigChange('banco', e.target.value)}>
                  <MenuItem value="BB">Banco do Brasil</MenuItem>
                  <MenuItem value="ITAU">Itaú</MenuItem>
                  <MenuItem value="BRADESCO">Bradesco</MenuItem>
                  <MenuItem value="SICOOB">Sicoob</MenuItem>
                  <MenuItem value="SANTANDER">Santander</MenuItem>
                  <MenuItem value="CAIXA">Caixa Econômica</MenuItem>
                  <MenuItem value="OUTROS">Outros</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Ambiente</InputLabel>
                <Select value={currentConfig.ambiente} label="Ambiente"
                  onChange={(e) => handleConfigChange('ambiente', e.target.value)}>
                  <MenuItem value="PRODUCAO">Produção</MenuItem>
                  <MenuItem value="HOMOLOGACAO">Homologação</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Conta Bancária do Sistema</InputLabel>
                <Select value={currentConfig.id_conta_bancaria || ''}
                  label="Conta Bancária do Sistema"
                  onChange={(e) => handleConfigChange('id_conta_bancaria', e.target.value)}>
                  <MenuItem value=""><em>Nenhuma</em></MenuItem>
                  {contasBancarias.map(cb => (
                    <MenuItem key={cb.id_conta_bancaria} value={cb.id_conta_bancaria}>
                      {cb.nome_conta} ({cb.codigo_banco})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider><Typography variant="caption" color="text.secondary">Credenciais OAuth2</Typography></Divider>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Client ID" required
                value={currentConfig.client_id}
                onChange={(e) => handleConfigChange('client_id', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Client Secret" type="password"
                placeholder={isEditingConfig ? '(deixe em branco para não alterar)' : ''}
                value={currentConfig.client_secret}
                onChange={(e) => handleConfigChange('client_secret', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="URL de Autenticação" required
                placeholder="https://oauth.banco.com.br/token"
                value={currentConfig.url_autenticacao}
                onChange={(e) => handleConfigChange('url_autenticacao', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="URL da API de Boletos" required
                placeholder="https://api.banco.com.br/boletos"
                value={currentConfig.url_api_boletos}
                onChange={(e) => handleConfigChange('url_api_boletos', e.target.value)} />
            </Grid>

            <Grid item xs={12}>
              <Divider><Typography variant="caption" color="text.secondary">Dados Bancários</Typography></Divider>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Código COMPE" required placeholder="001"
                value={currentConfig.codigo_banco}
                onChange={(e) => handleConfigChange('codigo_banco', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Agência" required
                value={currentConfig.agencia}
                onChange={(e) => handleConfigChange('agencia', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Conta" required
                value={currentConfig.conta}
                onChange={(e) => handleConfigChange('conta', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Convênio/Carteira"
                value={currentConfig.convenio}
                onChange={(e) => handleConfigChange('convenio', e.target.value)} />
            </Grid>

            <Grid item xs={12}>
              <Divider><Typography variant="caption" color="text.secondary">Regras de Cobrança</Typography></Divider>
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField fullWidth label="Dias para Protesto" type="number"
                inputProps={{ min: 0 }}
                value={currentConfig.dias_protesto}
                onChange={(e) => handleConfigChange('dias_protesto', e.target.value)} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label="Dias para Baixa" type="number"
                inputProps={{ min: 1 }}
                value={currentConfig.dias_baixa}
                onChange={(e) => handleConfigChange('dias_baixa', e.target.value)} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label="% Multa" type="number"
                inputProps={{ step: '0.01', min: 0 }}
                value={currentConfig.percentual_multa}
                onChange={(e) => handleConfigChange('percentual_multa', e.target.value)} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth label="% Juros ao Dia" type="number"
                inputProps={{ step: '0.0001', min: 0 }}
                value={currentConfig.percentual_juros_dia}
                onChange={(e) => handleConfigChange('percentual_juros_dia', e.target.value)} />
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={<Switch checked={!!currentConfig.ativo}
                  onChange={(e) => handleConfigChange('ativo', e.target.checked)} color="success" />}
                label="Configuração Ativa"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={<Switch checked={!!currentConfig.baixa_automatica_api}
                  onChange={(e) => handleConfigChange('baixa_automatica_api', e.target.checked)} />}
                label="Baixa Automática via API"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={<Switch checked={!!currentConfig.gerar_boleto_automatico}
                  onChange={(e) => handleConfigChange('gerar_boleto_automatico', e.target.checked)} />}
                label="Gerar Boleto Automaticamente"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfigDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveConfig} variant="contained" startIcon={<SaveIcon />}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContasBancariasConfig;