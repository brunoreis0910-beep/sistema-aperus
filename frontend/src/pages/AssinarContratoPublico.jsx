import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
const axiosLib = axios;
import { 
  Box, Container, Paper, Typography, TextField, Button, 
  CircularProgress, Alert, Divider, Stack, Grid, Stepper, Step, StepLabel
} from '@mui/material';
import SignatureIcon from '@mui/icons-material/Gesture';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import EmailIcon from '@mui/icons-material/Email';

const getApiBaseUrl = () => {
  const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(window.location.hostname);
  const port = window.location.port ? `:${window.location.port}` : '';
  
  if (window.location.port === '5173' || window.location.port === '3000') {
    if (window.location.pathname.includes('saas') || window.location.port === '5173') {
      return 'http://localhost:8006/api';
    }
    return 'http://localhost:8005/api';
  }
  return `${window.location.protocol}//${window.location.hostname}${port}/api`;
};

const API_BASE = getApiBaseUrl();

export default function AssinarContratoPublico() {
  const { uuid } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contrato, setContrato] = useState(null);
  
  // Passo do Wizard: 1 = Validar Documento, 2 = Validar Token do E-mail, 3 = Leitura e Assinatura
  const [passo, setPasso] = useState(1);
  const [documentoValidar, setDocumentoValidar] = useState('');
  const [emailMascarado, setEmailMascarado] = useState('');
  const [tokenDigitado, setTokenDigitado] = useState('');
  const [tokenValido, setTokenValido] = useState('');
  
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [status, setStatus] = useState('PENDENTE'); // 'PENDENTE', 'ASSINANDO', 'SUCESSO'
  const [validatingDoc, setValidatingDoc] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const fetchContrato = async () => {
      try {
        const response = await axiosLib.get(`${API_BASE}/contratos-responsabilidade/${uuid}/`);
        setContrato(response.data);
        if (response.data.status === 'ASSINADO') {
          setStatus('SUCESSO');
        }
        // Pre-fill fields
        setNome(response.data.cliente_nome || '');
        setCpf(response.data.cliente_documento || '');
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Não foi possível carregar o contrato.');
        setLoading(false);
      }
    };
    fetchContrato();
  }, [uuid]);

  useEffect(() => {
    if (passo !== 3 || status !== 'PENDENTE' || loading || error) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 200;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [passo, status, loading, error]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleValidarDocumento = async () => {
    if (!documentoValidar || !documentoValidar.trim()) {
      alert('Por favor, informe seu CPF ou CNPJ.');
      return;
    }
    try {
      setValidatingDoc(true);
      const res = await axiosLib.post(`${API_BASE}/contratos-responsabilidade/${uuid}/validar_documento_enviar_token/`, {
        documento: documentoValidar
      });
      setEmailMascarado(res.data.email_mascarado);
      setCpf(documentoValidar);
      setPasso(2);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao validar documento.');
    } finally {
      setValidatingDoc(false);
    }
  };

  const handleValidarToken = async () => {
    if (!tokenDigitado) {
      alert('Por favor, informe o token de 6 dígitos.');
      return;
    }
    try {
      setValidatingToken(true);
      await axiosLib.post(`${API_BASE}/contratos-responsabilidade/${uuid}/confirmar_token/`, {
        token: tokenDigitado
      });
      setTokenValido(tokenDigitado);
      setPasso(3);
    } catch (err) {
      alert(err.response?.data?.error || 'Código incorreto ou expirado.');
    } finally {
      setValidatingToken(false);
    }
  };

  const handleSubmit = async () => {
    if (!nome || !cpf || !hasSignature) {
      alert('Por favor, preencha o Nome, CPF e desenhe sua assinatura.');
      return;
    }

    try {
      setStatus('ASSINANDO');
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas.toDataURL('image/png');

      await axiosLib.post(`${API_BASE}/contratos-responsabilidade/${uuid}/assinar/`, {
        nome,
        cpf,
        assinatura: signatureDataUrl,
        token: tokenValido
      });

      setStatus('SUCESSO');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao processar assinatura.');
      setStatus('PENDENTE');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ bgcolor: '#F8FAFC' }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  const steps = ['Identificação', 'Verificação de E-mail', 'Assinatura'];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9', py: 4, display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="md">
        
        {status !== 'SUCESSO' && (
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={passo - 1} alternativeLabel sx={{ '& .MuiStepLabel-label': { fontWeight: 'bold' } }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {status === 'SUCESSO' ? (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 5, 
              textAlign: 'center', 
              borderRadius: 4, 
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
              bgcolor: 'background.paper' 
            }}
          >
            <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
              Contrato Assinado!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              O termo de responsabilidade foi assinado digitalmente com sucesso. Obrigado!
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Typography variant="caption" color="text.secondary">
              IP registrado: {contrato?.ip_assinatura} | Data/Hora: {new Date().toLocaleString('pt-BR')}
            </Typography>
          </Paper>
        ) : (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 4, 
              borderRadius: 4, 
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
              bgcolor: 'background.paper'
            }}
          >
            {/* PASSO 1: VALIDAR CNPJ/CPF */}
            {passo === 1 && (
              <Box>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <SecurityIcon color="primary" sx={{ fontSize: 32 }} />
                  <Typography variant="h5" fontWeight={800}>
                    Validação de Documento
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Olá! Para acessar o termo de responsabilidade e realizar a sua assinatura digital, por favor insira o CPF ou CNPJ associado a este contrato.
                </Typography>
                
                <TextField
                  label="CPF ou CNPJ do Cliente"
                  fullWidth
                  value={documentoValidar}
                  onChange={(e) => setDocumentoValidar(e.target.value)}
                  placeholder="Apenas números ou com pontuação"
                  sx={{ mb: 3 }}
                />

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleValidarDocumento}
                  disabled={validatingDoc || !documentoValidar}
                  sx={{ py: 1.5, borderRadius: 2.5, fontWeight: 'bold' }}
                >
                  {validatingDoc ? 'Validando e enviando token...' : 'Continuar'}
                </Button>
              </Box>
            )}

            {/* PASSO 2: VALIDAR TOKEN DO E-MAIL */}
            {passo === 2 && (
              <Box>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <EmailIcon color="primary" sx={{ fontSize: 32 }} />
                  <Typography variant="h5" fontWeight={800}>
                    Código de Segurança
                  </Typography>
                </Box>
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  Documento validado com sucesso! Enviamos um código de assinatura de 6 dígitos para o e-mail cadastrado: <strong>{emailMascarado}</strong>.
                </Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Por favor, insira o código recebido abaixo. Se não encontrar o e-mail na sua caixa de entrada, verifique também a pasta de Lixo Eletrônico ou Spam.
                </Typography>

                <TextField
                  label="Código de 6 dígitos"
                  fullWidth
                  value={tokenDigitado}
                  onChange={(e) => setTokenDigitado(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Digite o código enviado"
                  inputProps={{ style: { textAlign: 'center', fontSize: '1.25rem', letterSpacing: '4px', fontWeight: 'bold' } }}
                  sx={{ mb: 3 }}
                />

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    onClick={() => setPasso(1)}
                    sx={{ py: 1.5, borderRadius: 2.5, fontWeight: 'bold' }}
                  >
                    Voltar
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleValidarToken}
                    disabled={validatingToken || tokenDigitado.length < 6}
                    sx={{ py: 1.5, borderRadius: 2.5, fontWeight: 'bold' }}
                  >
                    {validatingToken ? 'Verificando...' : 'Confirmar Código'}
                  </Button>
                </Stack>
              </Box>
            )}

            {/* PASSO 3: ASSINAR CONTRATO */}
            {passo === 3 && (
              <Box>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <SignatureIcon color="primary" sx={{ fontSize: 32 }} />
                  <Typography variant="h5" fontWeight={800}>
                    Leitura e Assinatura Digital
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Por favor, leia atentamente os termos de responsabilidade abaixo antes de assinar.
                </Typography>

                <Box 
                  sx={{ 
                    my: 3, 
                    p: 3, 
                    maxHeight: '250px', 
                    overflowY: 'auto', 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2, 
                    bgcolor: '#F8FAFC',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.6
                  }}
                >
                  {contrato?.texto_contrato}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Confirmar Identidade do Declarante
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Nome Completo *"
                      fullWidth
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="CPF/CNPJ *"
                      fullWidth
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      size="small"
                      disabled
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Desenhe sua Assinatura no Painel Abaixo:
                  </Typography>
                  <Box 
                    sx={{ 
                      border: '2px dashed', 
                      borderColor: 'divider', 
                      borderRadius: 2, 
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{ display: 'block', cursor: 'crosshair', width: '100%' }}
                    />
                  </Box>
                  <Stack direction="row" spacing={2} justifyContent="space-between" mt={1.5}>
                    <Button size="small" variant="text" color="error" onClick={clearCanvas}>
                      Limpar Assinatura
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      Use o mouse ou a tela touch para desenhar
                    </Typography>
                  </Stack>
                </Box>

                <Button 
                  variant="contained" 
                  fullWidth 
                  size="large" 
                  disabled={status === 'ASSINANDO' || !nome || !cpf || !hasSignature}
                  onClick={handleSubmit}
                  sx={{ 
                    mt: 4, 
                    py: 1.5, 
                    borderRadius: 2.5, 
                    fontWeight: 'bold',
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none'
                    }
                  }}
                >
                  {status === 'ASSINANDO' ? 'Processando Assinatura...' : 'Confirmar e Assinar Contrato'}
                </Button>
              </Box>
            )}
          </Paper>
        )}
      </Container>
    </Box>
  );
}
