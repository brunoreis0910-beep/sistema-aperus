import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  Divider, IconButton, CircularProgress, Alert, Button,
  TextField, Stack, Step, StepLabel, Stepper, Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as DescriptionIcon,
  Fingerprint as FingerprintIcon,
  CheckCircle as CheckCircleIcon,
  Print as PrintIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export default function ContratoPendenteDialog({ open, onClose, onAssinadoSucesso }) {
  const { axiosInstance, user } = useAuth();
  const { showToast } = useToast();
  
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [step, setStep] = useState(0); // 0 = Intro, 1 = Visualizar, 2 = Validar Data, 3 = Validar Token, 4 = Assinado/Imprimir
  
  // Form fields
  const [dataNascimento, setDataNascimento] = useState('');
  const [tokenOtp, setTokenOtp] = useState('');
  const [nomeAssinante, setNomeAssinante] = useState('');
  const [emailMascarado, setEmailMascarado] = useState('');

  useEffect(() => {
    if (open) {
      buscarContratoPendente();
      setStep(0);
      setDataNascimento('');
      setTokenOtp('');
      setError('');
      if (user) {
        setNomeAssinante(user.nome || user.username || '');
      }
    }
  }, [open, user]);

  const buscarContratoPendente = async () => {
    setLoading(true);
    setError('');
    try {
      // Busca a config da empresa para extrair o CNPJ ativo
      const resEmpresa = await axiosInstance.get('/empresa/');
      const configs = Array.isArray(resEmpresa.data) ? resEmpresa.data : (resEmpresa.data?.results || []);
      const activeConfig = configs.find(c => c.cpf_cnpj) || configs[0];
      
      if (!activeConfig || !activeConfig.cpf_cnpj) {
        throw new Error('CNPJ da empresa não configurado.');
      }
      
      const cnpjClean = activeConfig.cpf_cnpj.replace(/\D/g, '');
      const resContrato = await axiosInstance.get(`/saas/contrato-pendente/?cnpj=${cnpjClean}`);
      if (resContrato.data && resContrato.data.id_contrato) {
        setContrato(resContrato.data);
      } else {
        setContrato(null);
        setError('Nenhum contrato pendente encontrado para esta empresa.');
      }
    } catch (err) {
      console.error('Erro ao buscar contrato pendente:', err);
      setError(err.response?.data?.error || err.message || 'Erro ao carregar dados do contrato.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidarData = async () => {
    if (!dataNascimento) {
      showToast('Por favor, informe a data de nascimento.', 'warning');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await axiosInstance.post('/saas/assinar-contrato-etapas/', {
        id_contrato: contrato.id_contrato,
        etapa: 'validar_data',
        data_nascimento: dataNascimento
      });
      
      if (res.data.status === 'sucesso') {
        showToast('Código de validação enviado por e-mail!', 'success');
        // Extrai e-mail mascarado da mensagem se houver
        const msg = res.data.mensagem || '';
        const match = msg.match(/e-mail:\s*(\S+)/i);
        if (match) {
          setEmailMascarado(match[1]);
        }
        setStep(3);
      } else {
        setError(res.data.error || 'Erro ao validar data de nascimento.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Data de nascimento incorreta ou erro no servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidarToken = async () => {
    if (!tokenOtp) {
      showToast('Por favor, digite o código de 6 dígitos.', 'warning');
      return;
    }
    if (!nomeAssinante.trim()) {
      showToast('Por favor, informe o nome do assinante.', 'warning');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await axiosInstance.post('/saas/assinar-contrato-etapas/', {
        id_contrato: contrato.id_contrato,
        etapa: 'validar_token',
        token: tokenOtp,
        usuario_assinou: nomeAssinante
      });
      
      if (res.data.status === 'sucesso') {
        showToast('Contrato assinado com sucesso!', 'success');
        if (onAssinadoSucesso) onAssinadoSucesso();
        setStep(4);
      } else {
        setError(res.data.error || 'Erro ao validar o código.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Código inválido ou expirado.');
    } finally {
      setSubmitting(false);
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
              ${nomeAssinante}<br/>
              Data: ${new Date().toLocaleString('pt-BR')}<br/>
              IP: Assinatura Eletrônica Validada via OTP
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DescriptionIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">Assinatura de Contrato SaaS</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 4 }}>
        <Box sx={{ mb: 4, mt: 1 }}>
          <Stepper activeStep={step > 1 ? step - 1 : 0} alternativeLabel>
            <Step>
              <StepLabel>Visualizar Contrato</StepLabel>
            </Step>
            <Step>
              <StepLabel>Validar Responsável</StepLabel>
            </Step>
            <Step>
              <StepLabel>Validar Token</StepLabel>
            </Step>
          </Stepper>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        {!loading && contrato && (
          <Box>
            {/* ETAPA 0: Introdução */}
            {step === 0 && (
              <Stack spacing={3} alignItems="center" sx={{ py: 3, textAlign: 'center' }}>
                <DescriptionIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight="bold">
                  Contrato de Licenciamento de Software Pendente
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxW: 500 }}>
                  Sua empresa possui um contrato de prestação de serviços e licenciamento do sistema Aperus pendente de assinatura digital na Central SaaS.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setStep(1)}
                  startIcon={<DescriptionIcon />}
                >
                  Visualizar Contrato
                </Button>
              </Stack>
            )}

            {/* ETAPA 1: Visualizar Contrato */}
            {step === 1 && (
              <Box>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    fontFamily: 'Georgia, serif',
                    lineHeight: 1.6,
                    textAlign: 'justify',
                    fontSize: '11pt',
                    bgcolor: '#ffffff',
                    mb: 3,
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
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" onClick={onClose}>
                    Decidir Depois
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<FingerprintIcon />}
                    onClick={() => setStep(2)}
                  >
                    Assinar Contrato
                  </Button>
                </Box>
              </Box>
            )}

            {/* ETAPA 2: Validar Data de Nascimento */}
            {step === 2 && (
              <Box sx={{ py: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Etapa 1 de 2: Confirmação de Identidade
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Para validar sua assinatura eletrônica, por favor insira a data de nascimento do responsável legal conforme cadastrado na Central SaaS.
                </Typography>
                
                <Stack spacing={3} sx={{ maxW: 400, mx: 'auto', my: 2 }}>
                  <TextField
                    label="Data de Nascimento do Responsável"
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    required
                  />
                  <Button
                    variant="contained"
                    onClick={handleValidarData}
                    disabled={submitting}
                    fullWidth
                    size="large"
                  >
                    {submitting ? <CircularProgress size={24} /> : 'Validar e Enviar Token'}
                  </Button>
                  <Button variant="text" size="small" onClick={() => setStep(1)}>
                    Voltar para o Contrato
                  </Button>
                </Stack>
              </Box>
            )}

            {/* ETAPA 3: Inserir Código OTP */}
            {step === 3 && (
              <Box sx={{ py: 2 }}>
                <Alert severity="info" icon={<EmailIcon />} sx={{ mb: 3 }}>
                  <strong>Token enviado por e-mail!</strong>
                  {emailMascarado ? ` Enviamos um código de verificação para o e-mail cadastrado ${emailMascarado}.` : ' Enviamos um código de verificação para o e-mail cadastrado do responsável.'}
                </Alert>

                <Stack spacing={3} sx={{ maxW: 400, mx: 'auto', my: 2 }}>
                  <TextField
                    label="Nome Completo do Assinante"
                    value={nomeAssinante}
                    onChange={(e) => setNomeAssinante(e.target.value)}
                    placeholder="Nome completo de quem está assinando"
                    fullWidth
                    required
                  />
                  <TextField
                    label="Código de Validação (6 dígitos)"
                    value={tokenOtp}
                    onChange={(e) => setTokenOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    placeholder="000000"
                    fullWidth
                    required
                    inputProps={{ style: { textAlign: 'center', letterSpacing: '8px', fontSize: '1.25rem', fontWeight: 'bold' } }}
                  />
                  
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleValidarToken}
                    disabled={submitting}
                    fullWidth
                    size="large"
                    startIcon={<FingerprintIcon />}
                  >
                    {submitting ? <CircularProgress size={24} /> : 'Confirmar e Assinar'}
                  </Button>
                  
                  <Button variant="text" size="small" onClick={() => setStep(2)}>
                    Reenviar Código / Corrigir Data
                  </Button>
                </Stack>
              </Box>
            )}

            {/* ETAPA 4: Assinado com Sucesso / Imprimir */}
            {step === 4 && (
              <Stack spacing={3} alignItems="center" sx={{ py: 3, textAlign: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  Contrato Assinado com Sucesso!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
                  O documento foi validado juridicamente.
                </Typography>
                
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PrintIcon />}
                    onClick={handleImprimir}
                  >
                    Imprimir Contrato
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={onClose}
                  >
                    Fechar e Ir para o Sistema
                  </Button>
                </Stack>
              </Stack>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
