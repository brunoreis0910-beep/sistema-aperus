import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  Divider, IconButton, CircularProgress, Alert, Button,
  Stack, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Card, CardContent
} from '@mui/material';
import {
  Close as CloseIcon,
  Payment as PaymentIcon,
  ContentCopy as CopyIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  FileDownload as DownloadIcon,
  HourglassEmpty as HourglassIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export default function MensalidadesPendenteDialog({ open, onClose, onRefreshNotificacoes }) {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  
  const [mensalidades, setMensalidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cnpj, setCnpj] = useState('');

  useEffect(() => {
    if (open) {
      carregarMensalidades();
    }
  }, [open]);

  const carregarMensalidades = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Carrega CNPJ da empresa
      const resEmpresa = await axiosInstance.get('/empresa/');
      const configs = Array.isArray(resEmpresa.data) ? resEmpresa.data : (resEmpresa.data?.results || []);
      const activeConfig = configs.find(c => c.cpf_cnpj) || configs[0];
      
      if (!activeConfig || !activeConfig.cpf_cnpj) {
        throw new Error('CNPJ da empresa não configurado localmente.');
      }
      
      const cnpjClean = activeConfig.cpf_cnpj.replace(/\D/g, '');
      setCnpj(cnpjClean);

      // 2. Busca mensalidades na Central
      const res = await axiosInstance.get(`/saas/financeiro/?cnpj=${cnpjClean}`);
      if (Array.isArray(res.data)) {
        setMensalidades(res.data);
      } else {
        setMensalidades([]);
      }
    } catch (err) {
      console.error('Erro ao buscar mensalidades:', err);
      setError(err.response?.data?.error || err.message || 'Erro ao carregar dados do financeiro central.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copiado para a área de transferência!`, 'success');
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    // Evita problema de timezone jogando a data 1 dia para trás
    const date = new Date(dataStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const formatarValor = (valorStr) => {
    const val = parseFloat(valorStr || 0);
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const pendentes = mensalidades.filter(m => m.status_pagamento === 'PENDENTE' || m.status_pagamento === 'VENCIDO');
  const pagas = mensalidades.filter(m => m.status_pagamento === 'PAGO');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">Financeiro - Central SaaS</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />

      <DialogContent sx={{ pb: 4, pt: 2, bgcolor: '#f8f9fa' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        {!loading && !error && (
          <Stack spacing={3}>
            {/* Mensalidades Pendentes */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
                <HourglassIcon fontSize="small" /> Faturas em Aberto ({pendentes.length})
              </Typography>
              
              {pendentes.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: '#ffffff' }}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    Tudo pago! Nenhuma mensalidade em aberto na Central SaaS.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Obrigado por manter sua assinatura em dia.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {pendentes.map((m) => (
                    <Card key={m.id_mensalidade} variant="outlined" sx={{ bgcolor: '#ffffff', borderLeft: '5px solid #d32f2f' }}>
                      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Nosso Número: <strong>{m.nosso_numero || 'Pendente'}</strong></Typography>
                            <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mt: 0.5 }}>
                              {formatarValor(m.valor)}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={`Vencimento: ${formatarData(m.data_vencimento)}`} color="error" variant="outlined" size="small" fontWeight="bold" />
                            <Chip label={m.status_pagamento} color="error" size="small" />
                          </Stack>
                        </Box>
                        
                        <Divider sx={{ my: 1.5 }} />

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'flex-end' }}>
                          {m.pix_copia_cola && (
                            <Button 
                              variant="outlined" 
                              color="primary"
                              size="small" 
                              startIcon={<CopyIcon />}
                              onClick={() => handleCopyText(m.pix_copia_cola, 'PIX Copia e Cola')}
                            >
                              Copiar PIX
                            </Button>
                          )}
                          {m.linha_digitavel && (
                            <Button 
                              variant="outlined" 
                              color="secondary"
                              size="small" 
                              startIcon={<CopyIcon />}
                              onClick={() => handleCopyText(m.linha_digitavel, 'Código de Barras')}
                            >
                              Código de Barras
                            </Button>
                          )}
                          {m.url_boleto && (
                            <Button 
                              variant="contained" 
                              color="primary" 
                              size="small" 
                              startIcon={<PrintIcon />}
                              href={m.url_boleto}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Visualizar Boleto
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Histórico de Mensalidades Pagas */}
            {pagas.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#388e3c', mt: 1 }}>
                  <HistoryIcon fontSize="small" /> Histórico de Pagamentos ({pagas.length})
                </Typography>
                
                <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: '#ffffff' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f1f3f5' }}>
                      <TableRow>
                        <TableCell><strong>Nosso Número</strong></TableCell>
                        <TableCell align="center"><strong>Vencimento</strong></TableCell>
                        <TableCell align="center"><strong>Data Pagto</strong></TableCell>
                        <TableCell align="right"><strong>Valor</strong></TableCell>
                        <TableCell align="center"><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagas.map((m) => (
                        <TableRow key={m.id_mensalidade}>
                          <TableCell>{m.nosso_numero || '-'}</TableCell>
                          <TableCell align="center">{formatarData(m.data_vencimento)}</TableCell>
                          <TableCell align="center">{formatarData(m.data_pagamento)}</TableCell>
                          <TableCell align="right">{formatarValor(m.valor)}</TableCell>
                          <TableCell align="center">
                            <Chip label="Pago" color="success" size="small" variant="outlined" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
