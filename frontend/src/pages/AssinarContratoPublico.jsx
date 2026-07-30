import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, Container, Paper, Typography, TextField, Button, 
  CircularProgress, Alert, Divider, Stack, Grid 
} from '@mui/material';
import SignatureIcon from '@mui/icons-material/Gesture';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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
  
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [status, setStatus] = useState('PENDENTE'); // 'PENDENTE', 'ASSINANDO', 'SUCESSO'

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const fetchContrato = async () => {
      try {
        const response = await axios.get(`${API_BASE}/contratos-responsabilidade/${uuid}/`);
        setContrato(response.data);
        if (response.data.status === 'ASSINADO') {
          setStatus('SUCESSO');
        }
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Não foi possível carregar o contrato.');
        setLoading(false);
      }
    };
    fetchContrato();
  }, [uuid]);

  useEffect(() => {
    if (status !== 'PENDENTE' || loading || error) return;
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
  }, [status, loading, error]);

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

  const handleSubmit = async () => {
    if (!nome || !cpf || !hasSignature) {
      alert('Por favor, preencha o Nome, CPF e desenhe sua assinatura.');
      return;
    }

    try {
      setStatus('ASSINANDO');
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas.toDataURL('image/png');

      await axios.post(`${API_BASE}/contratos-responsabilidade/${uuid}/assinar/`, {
        nome,
        cpf,
        assinatura: signatureDataUrl
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9', py: 4, display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="md">
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
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
              <SignatureIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h5" fontWeight={800}>
                Assinatura de Contrato Digital
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Por favor, leia atentamente os termos de responsabilidade abaixo antes de assinar.
            </Typography>

            <Box 
              sx={{ 
                my: 3, 
                p: 3, 
                maxHeight: '300px', 
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
              Dados do Assinante
            </Typography>

            <Grid container spacing={2}>
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
                  label="CPF *"
                  fullWidth
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  size="small"
                  placeholder="000.000.000-00"
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
          </Paper>
        )}
      </Container>
    </Box>
  );
}
