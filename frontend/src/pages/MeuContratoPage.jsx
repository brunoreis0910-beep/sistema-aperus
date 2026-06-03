import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, CircularProgress, Alert, Divider, Stack
} from '@mui/material';
import {
  Print as PrintIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function MeuContratoPage() {
  const { axiosInstance } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contrato, setContrato] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    buscarMeuContrato();
  }, []);

  const buscarMeuContrato = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/saas/meu-contrato/');
      if (res.data && res.data.status === 'sucesso') {
        setContrato(res.data.contrato);
      } else {
        setError('Nenhum contrato assinado encontrado.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Não foi possível carregar seu contrato assinado. Verifique se o contrato já foi assinado.');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = () => {
    if (!contrato || !contrato.texto_contrato) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Contrato Assinado - Central SaaS</title>
          <style>
            body { font-family: 'Times New Roman', Georgia, serif; margin: 40px; line-height: 1.6; text-align: justify; font-size: 12pt; }
            h1, h2 { text-align: center; font-size: 14pt; text-transform: uppercase; margin-bottom: 20px; }
            p { margin-bottom: 15px; }
            .assinatura-box { margin-top: 50px; border-top: 1px solid #000; padding-top: 10px; width: 250px; }
          </style>
        </head>
        <body onload="window.print();">
          ${contrato.texto_contrato}
          <div style="margin-top: 80px; display: flex; flex-direction: column; align-items: center;">
            <div class="assinatura-box">
              <strong>Assinado digitalmente por:</strong><br/>
              ${contrato.usuario_assinou || 'Responsável Legal'}<br/>
              Data: ${contrato.data_assinatura ? new Date(contrato.data_assinatura).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}<br/>
              IP: ${contrato.ip_assinatura || 'Assinatura Eletrônica Validada via OTP'}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 3, maxWidth: '900px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DescriptionIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" fontWeight="bold">Meu Contrato de Licenciamento</Typography>
          </Box>
          {contrato && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handleImprimir}
            >
              Imprimir ou Salvar PDF
            </Button>
          )}
        </Box>
        <Divider sx={{ mb: 4 }} />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>
        )}

        {contrato && !loading && (
          <Box>
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 4 }}>
              <Typography variant="subtitle2" fontWeight="bold">Contrato Assinado Eletronicamente</Typography>
              <Typography variant="body2">
                O licenciamento do sistema Aperus está ativo e regularizado. A assinatura foi confirmada pelo responsável legal em <strong>{new Date(contrato.data_assinatura).toLocaleString('pt-BR')}</strong> via código OTP.
              </Typography>
            </Alert>

            <Paper
              variant="outlined"
              sx={{
                p: 4,
                maxHeight: '550px',
                overflowY: 'auto',
                fontFamily: 'Georgia, serif',
                lineHeight: 1.6,
                textAlign: 'justify',
                fontSize: '11pt',
                bgcolor: '#fafafa',
                '& h1, & h2': {
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  textTransform: 'uppercase',
                  mb: 2
                },
                '& p': {
                  mb: 2
                }
              }}
              dangerouslySetInnerHTML={{ __html: contrato.texto_contrato }}
            />

            <Box sx={{ mt: 4, p: 3, bgcolor: '#f0f7f4', borderRadius: 2, border: '1px solid #d8ebd6' }}>
              <Typography variant="subtitle2" fontWeight="bold" color="success.main" gutterBottom>
                Trilha de Auditoria e Validade Jurídica
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Typography variant="body2"><strong>Assinado por:</strong> {contrato.usuario_assinou}</Typography>
                <Typography variant="body2"><strong>Endereço de IP:</strong> {contrato.ip_assinatura || '—'}</Typography>
                <Typography variant="body2"><strong>Data e Hora:</strong> {new Date(contrato.data_assinatura).toLocaleString('pt-BR')}</Typography>
                <Typography variant="body2" style={{ wordBreak: 'break-all' }}><strong>User Agent:</strong> {contrato.user_agent || '—'}</Typography>
              </Stack>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
