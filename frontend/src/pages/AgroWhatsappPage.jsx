import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress,
  Card, CardContent, Tabs, Tab, Snackbar, Tooltip, Divider
} from '@mui/material';
import {
  Send as SendIcon, Refresh as RefreshIcon, Delete as DeleteIcon,
  QrCode2 as QrCodeIcon, CheckCircle as CheckIcon, Error as ErrorIcon,
  Pending as PendingIcon, Settings as SettingsIcon, WhatsApp as WhatsAppIcon,
  AddCircle as AddIcon, OpenInNew as OpenInNewIcon, VerifiedUser as VerifiedIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function AgroWhatsappPage() {
  const { axiosInstance } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [fila, setFila] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');
  const [intervalId, setIntervalId] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [novaMsg, setNovaMsg] = useState({
    telefone: '', mensagem: '', nome_destinatario: '', tipo_envio: 'manual', prioridade: 5
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [provedor, setProvedor] = useState('nativo');
  const [testeDialog, setTesteDialog] = useState(false);
  const [qrTesteData, setQrTesteData] = useState(null);
  const validacaoPollingRef = useRef(null);

  // ✅ SOLUÇÃO: Efeito para fechar o modal automaticamente ao conectar
  useEffect(() => {
    console.log(`🔔 [DEBUG] connectionStatus mudou para: "${connectionStatus}"`);
    
    if (connectionStatus === 'CONECTADO') {
      console.log('⏱️  [DEBUG] Agendando fechamento do modal em 2 segundos...');
      const timer = setTimeout(() => {
        console.log('🚪 [DEBUG] Fechando modal agora!');
        setQrDialogOpen(false);
        setQrCode('');
        carregarDados();
      }, 2000); // 2 segundos para o usuário ver o check de sucesso
      return () => {
        console.log('🧹 [DEBUG] Limpando timer do modal');
        clearTimeout(timer);
      };
    }
  }, [connectionStatus]);

  useEffect(() => {
    carregarDados();
    const timer = setInterval(carregarDados, 15000);
    return () => {
      clearInterval(timer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  const showSnackbar = (message, severity = 'info') => setSnackbar({ open: true, message, severity });

  const carregarDados = async () => {
    try {
      const [filaRes, configRes, statusRes] = await Promise.all([
        axiosInstance.get('/whatsapp/fila/'),
        axiosInstance.get('/whatsapp/config/'),
        axiosInstance.get('/whatsapp/status/').catch(() => ({ data: { modo: 'nativo' } }))
      ]);
      setFila(Array.isArray(filaRes.data) ? filaRes.data : (filaRes.data?.results || []));
      setConfig(configRes.data);
      setProvedor(statusRes.data.modo || 'nativo');
    } catch (err) {
      console.error("Erro ao carregar dados do SistemaGerencial:", err);
    }
  };

  const iniciarPollingPlaywright = () => {
    if (intervalId) clearInterval(intervalId);
    let tentativas = 0;
    
    console.log('🔄 [DEBUG] Iniciando polling...');
    
    const interval = setInterval(async () => {
      tentativas++;
      console.log(`🔍 [DEBUG] Polling tentativa #${tentativas}...`);
      
      try {
        const { data } = await axiosInstance.get('/whatsapp/buscar-qrcode/');
        console.log('📥 [DEBUG] Resposta do backend:', JSON.stringify(data, null, 2));
        
        // Verificar se está CONECTADO (conectado === true é o critério principal)
        if (data?.connected === true || data?.status === 'conectado' || data?.conectado === true) {
          console.log('✅ [DEBUG] CONEXÃO DETECTADA! Fechando modal...');
          clearInterval(interval);
          setIntervalId(null);
          setConnectionStatus('CONECTADO');
          showSnackbar('✅ WhatsApp Conectado!', 'success');
          setQrDialogOpen(false);
          carregarDados();
        } else if (data?.qr_code || data?.qrCode) {
          console.log('📱 [DEBUG] QR Code recebido, aguardando leitura...');
          setQrCode(data.qr_code || data.qrCode);
          setConnectionStatus('AGUARDANDO LEITURA...');
        } else if (data?.erro === true || data?.success === false) {
          console.log('❌ [DEBUG] Erro retornado pelo backend:', data?.message);
          clearInterval(interval);
          setIntervalId(null);
          setQrDialogOpen(false);
          setError(data?.message || 'Falha ao iniciar WhatsApp Web. Clique em "Gerar QR Code" para tentar novamente.');
          setConnectionStatus('Desconectado');
        } else if (tentativas > 60) {
          console.log('⏰ [DEBUG] Timeout atingido');
          clearInterval(interval);
          setIntervalId(null);
          setQrDialogOpen(false);
          setError('Tempo esgotado. Clique em "Gerar QR Code" para tentar novamente.');
          setConnectionStatus('Desconectado');
        }
      } catch (e) {
        console.error("❌ [DEBUG] Erro no polling:", e);
        console.error("❌ [DEBUG] Detalhes:", e.response?.data);
      }
    }, 3000);
    setIntervalId(interval);
  };

  const gerarQRCode = async () => {
    try {
      setLoading(true);
      setError('');
      setConnectionStatus('INICIANDO...');
      const { data } = await axiosInstance.get('/whatsapp/gerar-qrcode/');
      
      if (data?.qr_code || data?.base64) {
        setQrCode(data.qr_code || data.base64);
        setQrDialogOpen(true);
        iniciarPollingPlaywright();
      } else if (data?.connected) {
        setConnectionStatus('CONECTADO');
      } else {
        setQrDialogOpen(true);
        iniciarPollingPlaywright();
      }
    } catch (err) {
      setError('Falha ao gerar QR Code.');
    } finally { setLoading(false); }
  };

  const adicionarMensagem = async () => {
    if (!novaMsg.telefone || !novaMsg.mensagem) return;
    try {
      setLoading(true);
      await axiosInstance.post('/whatsapp/fila/', novaMsg);
      setNovaMsg({ telefone: '', mensagem: '', nome_destinatario: '', tipo_envio: 'manual', prioridade: 5 });
      showSnackbar('Mensagem na fila!', 'success');
      carregarDados();
    } catch (e) { showSnackbar('Erro ao salvar', 'error'); }
    finally { setLoading(false); }
  };

  const cancelarMensagem = async (id) => {
    if (!window.confirm('Cancelar esta mensagem?')) return;
    try {
      await axiosInstance.patch(`/whatsapp/fila/${id}/`, { status: 'cancelado' });
      carregarDados();
    } catch (e) { showSnackbar('Erro ao cancelar', 'error'); }
  };

  const desconectar = async () => {
    if (!window.confirm('Isso apagará a sessão salva do WhatsApp Web e você precisará escanear o QR Code novamente. Continuar?')) return;
    try {
      setLoading(true);
      await axiosInstance.post('/whatsapp/playwright/limpar/');
      showSnackbar('✅ Sessão desconectada! Clique em "Gerar QR Code" para reconectar.', 'success');
      carregarDados();
    } catch (err) {
      showSnackbar('Erro ao desconectar: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const atualizarConfig = async () => {
    try {
      setLoading(true);
      await axiosInstance.patch('/whatsapp/config/1/', config);
      showSnackbar('✅ Configurações salvas!', 'success');
      setShowAdvanced(false);
      await carregarDados();
    } catch (err) {
      showSnackbar('Erro ao salvar: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
        <WhatsAppIcon sx={{ mr: 2, color: '#25D366' }} /> WhatsApp - {config?.status_conexao === 'conectado' ? 'Ativo' : 'Desconectado'}
      </Typography>

      <Card sx={{ mb: 3, borderLeft: '6px solid #25D366' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          {connectionStatus === 'CONECTADO' || config?.status_conexao === 'conectado' ? (
            <Box>
              <CheckIcon sx={{ fontSize: 50, color: 'success.main' }} />
              <Typography variant="h5">WhatsApp Conectado!</Typography>
              <Button onClick={() => setShowAdvanced(!showAdvanced)} sx={{ mt: 2 }} startIcon={<SettingsIcon />}>
                {showAdvanced ? 'Ocultar' : 'Configurações'}
              </Button>
              <Button color="error" onClick={desconectar} disabled={loading} sx={{ mt: 2, ml: 1 }}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}>
                Desconectar
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>Conecte para iniciar os envios</Typography>
              <Button variant="contained" size="large" onClick={gerarQRCode} disabled={loading} startIcon={<QrCodeIcon />} sx={{ bgcolor: '#25D366' }}>
                {loading ? 'Processando...' : '📱 Gerar QR Code'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {showAdvanced && config && (
        <Card sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <SettingsIcon sx={{ mr: 1 }} /> Configurações Avançadas
            </Typography>

            <Alert severity="success" sx={{ mb: 2 }}>
              <strong>WhatsApp Cloud API (Meta Oficial) — Recomendado</strong><br />
              Preencha para usar a API Oficial. Deixe em branco para usar o Modo Nativo (QR Code).
            </Alert>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Token de Acesso (Cloud API)" type="password"
                  value={config.cloud_token || ''}
                  onChange={(e) => setConfig({ ...config, cloud_token: e.target.value })}
                  helperText="Token Permanente de Sistema — Meta for Developers" placeholder="EAAxxxxx" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Phone Number ID"
                  value={config.cloud_phone_id || ''}
                  onChange={(e) => setConfig({ ...config, cloud_phone_id: e.target.value })}
                  helperText="Meta for Developers → WhatsApp → Configuração da API" placeholder="1234567890" />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Verify Token (Webhook)"
                  value={config.cloud_verify_token || ''}
                  onChange={(e) => setConfig({ ...config, cloud_verify_token: e.target.value })}
                  helperText="Cadastre também no painel da Meta" placeholder="meu-token-secreto" />
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Parâmetros de Envio</strong>
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="number" label="Delay entre mensagens (seg)"
                  value={config.delay_entre_mensagens || 15}
                  onChange={(e) => setConfig({ ...config, delay_entre_mensagens: parseInt(e.target.value) })}
                  inputProps={{ min: 10, max: 60 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth type="number" label="Limite por hora"
                  value={config.limite_envios_por_hora || 20}
                  onChange={(e) => setConfig({ ...config, limite_envios_por_hora: parseInt(e.target.value) })}
                  inputProps={{ min: 1, max: 50 }} />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Delay Randômico</InputLabel>
                  <Select value={config.ativar_delay_randomico ? 1 : 0}
                    onChange={(e) => setConfig({ ...config, ativar_delay_randomico: e.target.value === 1 })}
                    label="Delay Randômico">
                    <MenuItem value={1}>Ativo (Recomendado)</MenuItem>
                    <MenuItem value={0}>Desativado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="success" onClick={atualizarConfig} disabled={loading}>
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Salvar Configurações'}
                </Button>
                <Button sx={{ ml: 1 }} onClick={() => setShowAdvanced(false)}>Cancelar</Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Paper>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Fila" />
          <Tab label="Nova Mensagem" />
        </Tabs>
        
        {tabValue === 0 && (
          <TableContainer sx={{ p: 2 }}>
            <Table>
              <TableHead><TableRow><TableCell>Status</TableCell><TableCell>Telefone</TableCell><TableCell>Mensagem</TableCell><TableCell>Ações</TableCell></TableRow></TableHead>
              <TableBody>
                {fila.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center">Nenhuma mensagem na fila</TableCell></TableRow>
                ) : (
                  fila.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><Chip label={item.status} color={item.status === 'enviado' ? 'success' : 'warning'} size="small" /></TableCell>
                      <TableCell>{item.telefone}</TableCell>
                      <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.mensagem}</TableCell>
                      <TableCell>
                        {item.status === 'pendente' && (
                          <IconButton size="small" color="error" onClick={() => cancelarMensagem(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth label="Telefone" value={novaMsg.telefone} onChange={(e) => setNovaMsg({...novaMsg, telefone: e.target.value})} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline rows={4} label="Mensagem" value={novaMsg.mensagem} onChange={(e) => setNovaMsg({...novaMsg, mensagem: e.target.value})} /></Grid>
              <Grid item xs={12}><Button variant="contained" fullWidth onClick={adicionarMensagem}>Enviar para Fila</Button></Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Escanear WhatsApp</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          {connectionStatus === 'CONECTADO' ? (
            <Box sx={{ py: 3 }}>
              <CheckIcon sx={{ fontSize: 80, color: 'success.main' }} />
              <Typography variant="h6">Conectado com Sucesso!</Typography>
            </Box>
          ) : qrCode ? (
            <Box>
              <img src={qrCode} alt="QR" style={{ width: '100%', maxWidth: '250px' }} />
              <Typography variant="body2" sx={{ mt: 2 }}>{connectionStatus}</Typography>
            </Box>
          ) : <CircularProgress />}
        </DialogContent>
        <DialogActions><Button onClick={() => setQrDialogOpen(false)}>Cancelar</Button></DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
