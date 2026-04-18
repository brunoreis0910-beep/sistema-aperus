import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Card, CardContent, CardActions,
  CircularProgress, Alert, Divider, LinearProgress, Avatar, Chip
} from '@mui/material';
import {
  Insights as InsightIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { API_ENDPOINT } from '../config/api';

const API_BASE_URL = API_ENDPOINT;

const tipoCorMap = {
  error: 'error',
  warning: 'warning',
  success: 'success',
  info: 'info'
};

const tipoIconeMap = {
  error: <WarningIcon fontSize="small" color="error" />,
  warning: <WarningIcon fontSize="small" color="warning" />,
  success: <CheckIcon fontSize="small" color="success" />,
  info: <InfoIcon fontSize="small" color="info" />
};

export default function ConsultorNegociosPage() {
  const navigate = useNavigate();
  const [analise, setAnalise] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const buscarAnalise = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/ai/analise-negocio/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalise(response.data);
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro ao conectar com a IA.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'success.main', width: 50, height: 50 }}>
            <InsightIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">Consultor de Negócios IA</Typography>
            <Typography variant="body2" color="text.secondary">
              Análise estratégica automática com Gemini AI
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          color="success"
          startIcon={carregando ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
          onClick={buscarAnalise}
          disabled={carregando}
          size="large"
        >
          {carregando ? 'Analisando...' : analise ? 'Atualizar Análise' : 'Gerar Análise'}
        </Button>
      </Box>

      {carregando && <LinearProgress color="success" sx={{ mb: 2, borderRadius: 1 }} />}

      {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro(null)}>{erro}</Alert>}

      {!analise && !carregando && !erro && (
        <Paper elevation={2} sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
          <InsightIcon sx={{ fontSize: 80, color: 'success.light', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Pronto para analisar seu negócio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            Clique em "Gerar Análise" para receber insights estratégicos sobre vendas,
            estoque, financeiro, clientes e oportunidades de crescimento.
          </Typography>
          <Button variant="contained" color="success" startIcon={<InsightIcon />} size="large"
            onClick={buscarAnalise}>
            Gerar Análise Agora
          </Button>
        </Paper>
      )}

      {analise && !analise.sucesso && (
        <Alert severity="error">{analise.mensagem}</Alert>
      )}

      {analise && analise.sucesso && (
        <Box>
          {/* Chips de resumo */}
          {analise.insights && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {['success', 'warning', 'error', 'info'].map(tipo => {
                const count = analise.insights.filter(i => i.tipo === tipo).length;
                if (!count) return null;
                return (
                  <Chip
                    key={tipo}
                    icon={tipoIconeMap[tipo]}
                    label={`${count} ${tipo === 'success' ? 'Positivos' : tipo === 'warning' ? 'Alertas' : tipo === 'error' ? 'Críticos' : 'Informações'}`}
                    color={tipoCorMap[tipo]}
                    variant="outlined"
                    size="small"
                  />
                );
              })}
            </Box>
          )}

          {/* Cards de Insights */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            📊 Insights do Negócio
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
            {(analise.insights || []).map((ins, idx) => (
              <Card key={idx} variant="outlined" sx={{
                borderLeft: 4,
                borderColor:
                  ins.tipo === 'error' ? 'error.main' :
                  ins.tipo === 'warning' ? 'warning.main' :
                  ins.tipo === 'success' ? 'success.main' : 'info.main',
              }}>
                <CardContent sx={{ pb: '8px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    {tipoIconeMap[ins.tipo]}
                    <Typography variant="subtitle2" fontWeight="bold">
                      {ins.icone} {ins.titulo}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">{ins.texto}</Typography>
                </CardContent>
                {ins.acao && ins.rota && (
                  <CardActions sx={{ pt: 0 }}>
                    <Button size="small" startIcon={<TrendingIcon />}
                      onClick={() => navigate(ins.rota)}>
                      {ins.acao}
                    </Button>
                  </CardActions>
                )}
              </Card>
            ))}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Análise completa em Markdown */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            📝 Análise Estratégica Completa
          </Typography>
          <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Box sx={{
              fontSize: 15,
              lineHeight: 1.8,
              '& h2': { mt: 2, mb: 1, fontSize: '1.2rem', fontWeight: 700 },
              '& h3': { mt: 1.5, mb: 0.5, fontSize: '1.05rem', fontWeight: 600 },
              '& p': { mb: 1.5 },
              '& ul, & ol': { pl: 2.5 },
              '& li': { mb: 0.5 },
              '& strong': { fontWeight: 700 }
            }}>
              <ReactMarkdown>{analise.resumo_markdown || ''}</ReactMarkdown>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
