import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  MenuItem,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material'
import {
  Save as SaveIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

const PROVIDERS = [
  { value: 'SMTP', label: 'SMTP Padrão (Genérico)' },
  { value: 'GMAIL', label: 'Gmail (smtp.gmail.com)' },
  { value: 'OUTLOOK', label: 'Outlook / Hotmail' },
  { value: 'SENDGRID', label: 'SendGrid' },
  { value: 'SES', label: 'Amazon SES' },
  { value: 'MAILGUN', label: 'Mailgun' },
]

const SMTP_PRESETS = {
  GMAIL: { host: 'smtp.gmail.com', port: 587, use_tls: true, use_ssl: false },
  OUTLOOK: { host: 'smtp-mail.outlook.com', port: 587, use_tls: true, use_ssl: false },
  SMTP: { host: '', port: 587, use_tls: true, use_ssl: false },
  SENDGRID: { host: 'smtp.sendgrid.net', port: 587, use_tls: true, use_ssl: false },
  SES: { host: '', port: 587, use_tls: true, use_ssl: false },
  MAILGUN: { host: 'smtp.mailgun.org', port: 587, use_tls: true, use_ssl: false },
}

const INICIAL = {
  provider: 'SMTP',
  is_default: true,
  ativo: true,
  smtp_host: '',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  smtp_use_tls: true,
  smtp_use_ssl: false,
  api_key: '',
  api_secret: '',
  api_region: 'us-east-1',
  api_domain: '',
  from_email: '',
  from_name: '',
  reply_to_email: '',
  daily_limit: 1000,
}

export default function ConfiguracaoEmail() {
  const { user, axiosInstance } = useAuth()
  const [config, setConfig] = useState(INICIAL)
  const [configId, setConfigId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [alert, setAlert] = useState(null) // { type, message }

  useEffect(() => {
    carregarConfig()
  }, [])

  const carregarConfig = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get('/email/config/')
      
      // A API retorna objeto paginado: { count, results: [...] }
      const configs = res.data.results || res.data
      
      if (configs && configs.length > 0) {
        // Pega a primeira config (ou a marcada como default)
        const c = configs.find(cfg => cfg.is_default) || configs[0]
        setConfigId(c.id_config)
        setConfig({
          provider: c.provider || 'SMTP',
          is_default: c.is_default ?? true,
          ativo: c.ativo ?? true,
          smtp_host: c.smtp_host || '',
          smtp_port: c.smtp_port || 587,
          smtp_username: c.smtp_username || '',
          smtp_password: '', // write_only no backend, nunca retorna
          smtp_use_tls: c.smtp_use_tls ?? true,
          smtp_use_ssl: c.smtp_use_ssl ?? false,
          api_key: '',
          api_secret: '',
          api_region: c.api_region || 'us-east-1',
          api_domain: c.api_domain || '',
          from_email: c.from_email || '',
          from_name: c.from_name || '',
          reply_to_email: c.reply_to_email || '',
          daily_limit: c.daily_limit || 1000,
        })
      }
    } catch (err) {
      // Nenhuma config cadastrada ainda, estado inicial é usado
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setConfig(prev => {
      const newConfig = { ...prev, [field]: value }
      
      // Auto-ajusta TLS/SSL quando muda a porta
      if (field === 'smtp_port') {
        const port = parseInt(value)
        if (port === 465) {
          // Porta 465 = SSL (não TLS)
          newConfig.smtp_use_ssl = true
          newConfig.smtp_use_tls = false
        } else if (port === 587 || port === 25) {
          // Porta 587/25 = TLS (não SSL)
          newConfig.smtp_use_tls = true
          newConfig.smtp_use_ssl = false
        }
      }
      
      return newConfig
    })
  }

  const handleProviderChange = (novoProvider) => {
    const preset = SMTP_PRESETS[novoProvider] || {}
    setConfig(prev => ({
      ...prev,
      provider: novoProvider,
      smtp_host: preset.host ?? prev.smtp_host,
      smtp_port: preset.port ?? prev.smtp_port,
      smtp_use_tls: preset.use_tls ?? prev.smtp_use_tls,
      smtp_use_ssl: preset.use_ssl ?? prev.smtp_use_ssl,
    }))
  }

  const salvar = async () => {
    if (!config.from_email) {
      setAlert({ type: 'error', message: 'E-mail remetente é obrigatório.' })
      return
    }
    if (!config.from_name) {
      setAlert({ type: 'error', message: 'Nome do remetente é obrigatório.' })
      return
    }

    // Validação SSL/TLS vs Porta
    const port = parseInt(config.smtp_port)
    if (port === 465 && config.smtp_use_tls && !config.smtp_use_ssl) {
      setAlert({ 
        type: 'error', 
        message: '⚠️ Configuração incorreta: Porta 465 requer SSL (não TLS). Desmarque TLS e marque SSL.' 
      })
      return
    }
    if (port === 587 && config.smtp_use_ssl && !config.smtp_use_tls) {
      setAlert({ 
        type: 'error', 
        message: '⚠️ Configuração incorreta: Porta 587 requer TLS (não SSL). Desmarque SSL e marque TLS.' 
      })
      return
    }

    setSaving(true)
    setAlert(null)
    try {
      const payload = { ...config }
      // Remove campos vazios de senha somente se não preenchidos (não sobrescrever)
      if (!payload.smtp_password) delete payload.smtp_password
      if (!payload.api_key) delete payload.api_key
      if (!payload.api_secret) delete payload.api_secret

      if (configId) {
        await axiosInstance.patch(`/email/config/${configId}/`, payload)
      } else {
        const res = await axiosInstance.post('/email/config/', payload)
        setConfigId(res.data.id_config)
      }
      setAlert({ type: 'success', message: 'Configuração salva com sucesso!' })
    } catch (err) {
      const msg = err.response?.data
        ? JSON.stringify(err.response.data)
        : 'Erro ao salvar configuração.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setSaving(false)
    }
  }

  const testarConexao = async () => {
    if (!configId) {
      setAlert({ type: 'warning', message: 'Salve a configuração antes de testar.' })
      return
    }
    setTesting(true)
    setAlert(null)
    try {
      const res = await axiosInstance.post(`/email/config/${configId}/test_connection/`)
      if (res.data.success) {
        setAlert({ type: 'success', message: res.data.message })
      } else {
        setAlert({ type: 'error', message: res.data.message })
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao testar conexão.'
      setAlert({ type: 'error', message: msg })
    } finally {
      setTesting(false)
    }
  }

  const isSmtp = ['SMTP', 'GMAIL', 'OUTLOOK', 'SENDGRID', 'MAILGUN'].includes(config.provider)
  const isApiKey = ['SENDGRID', 'SES', 'MAILGUN'].includes(config.provider)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <EmailIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h6" fontWeight={600}>
          Configuração de E-mail
        </Typography>
        {configId && (
          <Chip
            size="small"
            icon={<CheckCircleIcon />}
            label="Configurado"
            color="success"
            variant="outlined"
            sx={{ ml: 1 }}
          />
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure o servidor de e-mail para envio de notificações, boletos, NF-e e mensagens do sistema.
        Para Gmail, use uma <strong>Senha de App</strong> (não a senha normal da conta).
      </Typography>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 3 }} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon fontSize="small" /> Provedor
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Provedor de E-mail"
              value={config.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              {PROVIDERS.map(p => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.ativo}
                  onChange={(e) => handleChange('ativo', e.target.checked)}
                  color="success"
                />
              }
              label="Ativo"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Alert de configuração SSL/TLS incorreta */}
      {(() => {
        const port = parseInt(config.smtp_port)
        if (port === 465 && config.smtp_use_tls && !config.smtp_use_ssl) {
          return (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>⚠️ Configuração incorreta:</strong> Porta 465 usa <strong>SSL</strong> (não TLS). 
              Desmarque "TLS" e marque "SSL" abaixo, ou mude para porta 587.
            </Alert>
          )
        }
        if (port === 587 && config.smtp_use_ssl && !config.smtp_use_tls) {
          return (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>⚠️ Configuração incorreta:</strong> Porta 587 usa <strong>TLS</strong> (não SSL). 
              Desmarque "SSL" e marque "TLS" abaixo, ou mude para porta 465.
            </Alert>
          )
        }
        return null
      })()}

      {/* SMTP */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Servidor SMTP
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Servidor SMTP (Host)"
              placeholder="ex: smtp.gmail.com"
              value={config.smtp_host}
              onChange={(e) => handleChange('smtp_host', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Porta"
              type="number"
              value={config.smtp_port}
              onChange={(e) => handleChange('smtp_port', parseInt(e.target.value) || 587)}
            />
          </Grid>

          <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.smtp_use_tls}
                  onChange={(e) => handleChange('smtp_use_tls', e.target.checked)}
                  color="primary"
                />
              }
              label="TLS"
            />
          </Grid>

          <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.smtp_use_ssl}
                  onChange={(e) => handleChange('smtp_use_ssl', e.target.checked)}
                  color="primary"
                />
              }
              label="SSL"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">
              💡 <strong>Dica:</strong> Porta 587 (Gmail/Outlook) = TLS ativado, SSL desativado | Porta 465 (SSL legado) = SSL ativado, TLS desativado
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Usuário / E-mail de Login"
              placeholder="seu@email.com"
              value={config.smtp_username}
              onChange={(e) => handleChange('smtp_username', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={configId ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha / Senha de App'}
              type={senhaVisivel ? 'text' : 'password'}
              value={config.smtp_password}
              onChange={(e) => handleChange('smtp_password', e.target.value)}
              inputProps={{
                autoCapitalize: 'none',
                autoCorrect: 'off',
                spellCheck: false,
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSenhaVisivel(v => !v)} edge="end">
                      {senhaVisivel ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              helperText={
                config.provider === 'GMAIL'
                  ? 'Use uma Senha de App do Google (não a senha da conta). Ative autenticação em 2 fatores primeiro.'
                  : ''
              }
            />
          </Grid>
        </Grid>
      </Paper>

      {/* API Keys - para provedores que usam API */}
      {isApiKey && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Chaves de API ({config.provider})
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={config.api_key}
                onChange={(e) => handleChange('api_key', e.target.value)}
                placeholder={configId ? '(não alterada)' : ''}
              />
            </Grid>
            {config.provider === 'SES' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API Secret (AWS)"
                    type="password"
                    value={config.api_secret}
                    onChange={(e) => handleChange('api_secret', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Região AWS"
                    value={config.api_region}
                    onChange={(e) => handleChange('api_region', e.target.value)}
                    placeholder="us-east-1"
                  />
                </Grid>
              </>
            )}
            {config.provider === 'MAILGUN' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Domínio Mailgun"
                  value={config.api_domain}
                  onChange={(e) => handleChange('api_domain', e.target.value)}
                  placeholder="mg.seudominio.com.br"
                />
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Remetente */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Remetente Padrão
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="E-mail Remetente"
              type="email"
              value={config.from_email}
              onChange={(e) => handleChange('from_email', e.target.value)}
              placeholder="noreply@minhaempresa.com.br"
              helperText="E-mail que aparece como remetente nas mensagens enviadas"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Nome do Remetente"
              value={config.from_name}
              onChange={(e) => handleChange('from_name', e.target.value)}
              placeholder="Minha Empresa Ltda"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="E-mail de Resposta (Reply-To)"
              type="email"
              value={config.reply_to_email}
              onChange={(e) => handleChange('reply_to_email', e.target.value)}
              placeholder="contato@minhaempresa.com.br"
              helperText="Opcional. Quando o cliente responder, irá para este e-mail"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Limite Diário de Envios"
              type="number"
              value={config.daily_limit}
              onChange={(e) => handleChange('daily_limit', parseInt(e.target.value) || 1000)}
              helperText="Máximo de e-mails por dia"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Botões */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={salvar}
          disabled={saving}
          size="large"
        >
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </Button>

        <Tooltip title={!configId ? 'Salve a configuração antes de testar' : `Envia um e-mail de teste para ${user?.email}`}>
          <span>
            <Button
              variant="outlined"
              startIcon={testing ? <CircularProgress size={16} /> : <SendIcon />}
              onClick={testarConexao}
              disabled={testing || !configId}
              size="large"
            >
              {testing ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Dica Gmail */}
      {config.provider === 'GMAIL' && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <strong>Como configurar o Gmail:</strong>
          <ol style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
            <li>Acesse <strong>myaccount.google.com</strong> → Segurança → Verificação em duas etapas (ative)</li>
            <li>Depois vá em <strong>Senhas de app</strong> → Selecione "E-mail" → "Windows" → Gerar</li>
            <li>Copie a senha de 16 caracteres gerada e cole no campo <strong>Senha</strong> acima</li>
            <li>No campo <strong>Usuário</strong>, coloque seu e-mail do Gmail completo</li>
          </ol>
        </Alert>
      )}
    </Box>
  )
}
