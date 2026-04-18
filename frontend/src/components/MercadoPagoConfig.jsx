import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  Divider,
  CircularProgress,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  MenuItem,
} from '@mui/material';
import {
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  PhoneAndroid as PhoneIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import axios from 'axios';

const INICIAL = {
  access_token: '',
  mp_user_id: '',
  device_id: '',
  ambiente: 'PRODUCAO',
};

const MercadoPagoConfig = () => {
  const [form, setForm] = useState(INICIAL);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [configurado, setConfigurado] = useState(false);
  const [tokenMask, setTokenMask] = useState('');
  const [mostrarToken, setMostrarToken] = useState(false);

  useEffect(() => {
    carregarConfig();
  }, []);

  const carregarConfig = async () => {
    setCarregando(true);
    try {
      const resp = await axios.get('/api/mp-point/config/');
      const data = resp.data;
      setConfigurado(data.configurado);
      if (data.configurado) {
        setTokenMask(data.access_token_mask || '');
        setForm(prev => ({
          ...prev,
          mp_user_id: data.mp_user_id || '',
          device_id: data.device_id || '',
          ambiente: data.ambiente || 'PRODUCAO',
          access_token: '', // não retornamos o token completo — campo em branco indica "manter atual"
        }));
      }
    } catch (err) {
      console.error('[MP Config] Erro ao carregar:', err);
    } finally {
      setCarregando(false);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSucesso('');
    setErro('');
  };

  const handleSalvar = async () => {
    setErro('');
    setSucesso('');

    if (!form.access_token && !configurado) {
      setErro('Informe o Access Token do Mercado Pago.');
      return;
    }
    if (!form.mp_user_id) {
      setErro('Informe o ID do Usuário (mp_user_id).');
      return;
    }
    if (!form.device_id) {
      setErro('Informe o Device ID do terminal Point Tap.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        access_token: form.access_token || 'MANTER',
      };

      await axios.post('/api/mp-point/config/', payload);

      setSucesso('Configuração salva com sucesso!');
      setConfigurado(true);
      setForm(prev => ({ ...prev, access_token: '' }));
      carregarConfig();
    } catch (err) {
      console.error('[MP Config] Erro ao salvar:', err.response?.data);
      const data = err.response?.data;
      let msg = 'Erro ao salvar configuração.';
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.erro) msg = data.erro;
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
      }
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  if (carregando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <PhoneIcon sx={{ fontSize: 36, color: '#009EE3' }} />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Mercado Pago Point Tap
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Receba pagamentos por aproximação (cartão/celular) diretamente no terminal físico.
          </Typography>
        </Box>
        {configurado && (
          <Chip
            icon={<CheckCircleIcon />}
            label="Configurado"
            color="success"
            size="small"
            sx={{ ml: 'auto' }}
          />
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {sucesso && <Alert severity="success" sx={{ mb: 2 }}>{sucesso}</Alert>}
      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      {/* Instruções */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#E3F2FD', borderColor: '#90CAF9' }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Como obter as credenciais:
        </Typography>
        <Typography variant="body2" component="ol" sx={{ pl: 2, m: 0 }}>
          <li>Acesse <strong>mercadopago.com.br/developers/panel</strong></li>
          <li><strong>Access Token</strong>: Aplicativos → selecione seu app → <em>Credenciais de produção</em> → copie o campo <strong>Access Token</strong> (começa com APP_USR-...)</li>
          <li><strong>User ID</strong>: na mesma tela de credenciais, copie o campo <strong>Client ID</strong> (número grande)</li>
          <li><strong>Device ID</strong>: <em>Seu negócio → Dispositivos Point</em> → clique no terminal → campo <strong>ID</strong> (ex: PAX_A910__123456)</li>
        </Typography>
      </Paper>

      <Grid container spacing={2}>
        {/* Access Token */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Access Token"
            name="access_token"
            value={form.access_token}
            onChange={handleChange}
            placeholder={configurado ? 'Deixe em branco para manter o Access Token atual' : 'APP_USR-...'}
            type={mostrarToken ? 'text' : 'password'}
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setMostrarToken(v => !v)} size="small">
                    {mostrarToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText={
              configurado && tokenMask
                ? `Token salvo: ${tokenMask} — deixe o campo em branco para manter`
                : 'Credencial de produção obtida no painel do Mercado Pago (começa com APP_USR-)'
            }
          />
        </Grid>

        {/* User ID */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="User ID"
            name="mp_user_id"
            value={form.mp_user_id}
            onChange={handleChange}
            placeholder="Ex: 123456789"
            helperText="Campo Client ID no painel MP → Aplicativos → Credenciais de produção"
          />
        </Grid>

        {/* Device ID */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Device ID"
            name="device_id"
            value={form.device_id}
            onChange={handleChange}
            placeholder="Ex: PAX_A910__LABAC001"
            helperText="Painel MP → Seu negócio → Dispositivos Point → clique no terminal"
          />
        </Grid>

        {/* Ambiente */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="Ambiente"
            name="ambiente"
            value={form.ambiente}
            onChange={handleChange}
          >
            <MenuItem value="PRODUCAO">Produção</MenuItem>
            <MenuItem value="HOMOLOGACAO">Homologação / Sandbox</MenuItem>
          </TextField>
        </Grid>

        {/* Botão Salvar */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} /> : <SaveIcon />}
            onClick={handleSalvar}
            disabled={loading}
            sx={{ backgroundColor: '#009EE3', '&:hover': { backgroundColor: '#0077B5' }, minWidth: 160 }}
          >
            {loading ? 'Salvando...' : 'Salvar configuração'}
          </Button>
        </Grid>
      </Grid>

      {/* Info de uso */}
      {configurado && (
        <>
          <Divider sx={{ my: 3 }} />
          <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#F3F3F3' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Como usar no PDV:
            </Typography>
            <Typography variant="body2">
              Na tela <strong>Venda Rápida</strong>, ao escolher a forma de pagamento <strong>"Mercado Pago"</strong> nas condições de pagamento,
              aparecerá o botão azul <strong>"📱 Cobrar no Point Tap"</strong>. Clique, o valor será enviado ao terminal, e o sistema aguardará
              a aprovação automaticamente.
            </Typography>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default MercadoPagoConfig;
