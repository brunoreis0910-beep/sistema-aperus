import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Chip, CircularProgress,
  IconButton, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Card, CardContent, Tooltip, LinearProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon, Warning as WarningIcon,
  TrendingDown as ChurnIcon, WhatsApp as WhatsAppIcon,
  Email as EmailIcon, PersonOff as InativoIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const fmtMoeda = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

const ClassificacaoCor = {
  BAIXO: 'success',
  MEDIO: 'info',
  ALTO: 'warning',
  CRITICO: 'error',
};

const ClassificacaoLabel = {
  BAIXO: '🟢 Fiel',
  MEDIO: '🟡 Médio',
  ALTO: '🟠 Em Risco',
  CRITICO: '🔴 Crítico',
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, subvalue, color, icon }) => (
  <Card>
    <CardContent sx={{ py: 1.5 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h5" fontWeight={800} color={color || 'text.primary'}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          {subvalue && (
            <Typography variant="caption" color={color} display="block">
              {subvalue}
            </Typography>
          )}
        </Box>
        <Box color={color || 'text.secondary'} sx={{ fontSize: 36, opacity: 0.3 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ── Score Bar ─────────────────────────────────────────────────────────────────
const ScoreBar = ({ label, score, max = 5, color }) => (
  <Box sx={{ mb: 0.5 }}>
    <Box display="flex" justifyContent="space-between">
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="caption" fontWeight={600}>{score}/{max}</Typography>
    </Box>
    <LinearProgress
      variant="determinate"
      value={(score / max) * 100}
      color={color || 'primary'}
      sx={{ height: 6, borderRadius: 3 }}
    />
  </Box>
);

// ── Linha de Cliente em Risco ─────────────────────────────────────────────────
const LinhaCliente = ({ cliente }) => {
  const whatsapp = cliente.whatsapp?.replace(/\D/g, '');
  const msg = encodeURIComponent(
    `Olá ${cliente.nome}! Sentimos sua falta. Que tal conferir nossas novidades? 😊`
  );

  return (
    <TableRow hover>
      <TableCell>{cliente.nome}</TableCell>
      <TableCell>
        <Chip
          label={ClassificacaoLabel[cliente.risco] || cliente.risco}
          color={ClassificacaoCor[cliente.risco] || 'default'}
          size="small"
        />
      </TableCell>
      <TableCell align="center">
        <Tooltip title={`R: ${cliente.r_score} | F: ${cliente.f_score} | M: ${cliente.m_score}`}>
          <Typography variant="body2" fontWeight={600}>
            {cliente.rfm_total || '—'}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell>{cliente.dias_sem_compra ?? '—'} dias</TableCell>
      <TableCell align="right">{Number(cliente.total_compras || 0)}</TableCell>
      <TableCell align="right">{fmtMoeda(cliente.valor_total)}</TableCell>
      <TableCell>{fmtData(cliente.ultima_compra)}</TableCell>
      <TableCell>
        <Stack direction="row" spacing={0.5}>
          {whatsapp && (
            <Tooltip title="WhatsApp">
              <IconButton
                size="small"
                color="success"
                component="a"
                href={`https://wa.me/55${whatsapp}?text=${msg}`}
                target="_blank"
              >
                <WhatsAppIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {cliente.email && (
            <Tooltip title="E-mail">
              <IconButton
                size="small"
                color="primary"
                component="a"
                href={`mailto:${cliente.email}?subject=Sentimos sua falta!`}
              >
                <EmailIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// ── Página Principal ──────────────────────────────────────────────────────────
const ChurnPage = () => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, risco] = await Promise.all([
        axiosInstance.get('/churn/dashboard/'),
        axiosInstance.get('/churn/clientes-risco/?limite=100'),
      ]);
      setDashboard(dash.data);
      setClientes(risco.data.clientes || []);
    } catch { showToast('Erro ao carregar análise de churn', 'error'); }
    finally { setLoading(false); }
  }, [axiosInstance, showToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const totalRisco = clientes.filter((c) =>
    ['ALTO', 'CRITICO'].includes(c.risco)
  ).length;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Análise de Churn — Clientes em Risco
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Score RFM: Recência · Frequência · Valor Monetário
          </Typography>
        </Box>
        <IconButton onClick={carregar} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
        </IconButton>
      </Box>

      {/* KPIs */}
      {dashboard && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={4} md={2.4}>
            <KPICard
              label="Total de Clientes"
              value={dashboard.total_clientes_ativos}
              color="primary.main"
              icon={<StarIcon sx={{ fontSize: 36 }} />}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <KPICard
              label="Em Risco (Alto + Crítico)"
              value={dashboard.em_risco}
              color="warning.main"
              icon={<WarningIcon sx={{ fontSize: 36 }} />}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <KPICard
              label="Inativos (90 dias)"
              value={dashboard.inativos_90_dias}
              color="error.main"
              icon={<InativoIcon sx={{ fontSize: 36 }} />}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <KPICard
              label="Perdidos (365 dias)"
              value={dashboard.perdidos_365_dias}
              color="error.dark"
              icon={<ChurnIcon sx={{ fontSize: 36 }} />}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <KPICard
              label="Valor em Risco"
              value={fmtMoeda(dashboard.valor_em_risco)}
              color="error.main"
              icon={<ChurnIcon sx={{ fontSize: 36 }} />}
            />
          </Grid>
        </Grid>
      )}

      {/* Tabela de clientes em risco */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600}>
            Clientes em Risco de Churn
            {totalRisco > 0 && (
              <Chip
                label={`${totalRisco} clientes`}
                color="error"
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Clientes classificados como Alto Risco ou Crítico pelo algoritmo RFM.
            Use WhatsApp ou e-mail para reativação.
          </Typography>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Classificação</TableCell>
                  <TableCell align="center">Score Total</TableCell>
                  <TableCell>Inativo há</TableCell>
                  <TableCell align="right">Compras</TableCell>
                  <TableCell align="right">Total Gasto</TableCell>
                  <TableCell>Última Compra</TableCell>
                  <TableCell>Contato</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Nenhum cliente em risco identificado 🎉
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((c) => <LinhaCliente key={c.id_cliente} cliente={c} />)
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default ChurnPage;
