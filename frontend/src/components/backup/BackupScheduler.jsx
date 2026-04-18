import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const BackupScheduler = () => {
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Configurações de agendamento
  const [scheduleHour, setScheduleHour] = useState(2);
  const [scheduleMinute, setScheduleMinute] = useState(0);
  const [scheduleType, setScheduleType] = useState('daily'); // daily, custom

  useEffect(() => {
    loadSchedulerStatus();
  }, []);

  const loadSchedulerStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/comandas/backups/scheduler/control/');
      if (response.data.success) {
        setSchedulerStatus(response.data.scheduler);
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      showSnackbar('Erro ao carregar status do agendador', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startScheduler = async () => {
    try {
      setLoading(true);
      const scheduleConfig = {
        hour: scheduleHour,
        minute: scheduleMinute,
      };

      const response = await api.post('/api/comandas/backups/scheduler/control/', {
        schedule: scheduleConfig,
      });

      if (response.data.success) {
        showSnackbar('Agendador iniciado com sucesso!', 'success');
        await loadSchedulerStatus();
      }
    } catch (error) {
      console.error('Erro ao iniciar agendador:', error);
      showSnackbar('Erro ao iniciar agendador', 'error');
    } finally {
      setLoading(false);
    }
  };

  const stopScheduler = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/comandas/backups/scheduler/control/', { action: 'stop' });

      if (response.data.success) {
        showSnackbar('Agendador parado com sucesso!', 'success');
        await loadSchedulerStatus();
      }
    } catch (error) {
      console.error('Erro ao parar agendador:', error);
      showSnackbar('Erro ao parar agendador', 'error');
    } finally {
      setLoading(false);
    }
  };

  const executeBackupNow = async () => {
    try {
      setLoading(true);
      showSnackbar('Criando backup...', 'info');

      const response = await api.post('/api/comandas/backups/scheduler/now/');

      if (response.data.success) {
        showSnackbar('Backup criado com sucesso!', 'success');
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      showSnackbar('Erro ao criar backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const formatNextRun = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR');
  };

  const isRunning = schedulerStatus?.running || false;

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <ScheduleIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" component="div">
            Agendamento Automático de Backup
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Status do Agendador */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Status Atual
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={isRunning ? <PlayIcon /> : <StopIcon />}
              label={isRunning ? 'ATIVO' : 'INATIVO'}
              color={isRunning ? 'success' : 'default'}
              variant={isRunning ? 'filled' : 'outlined'}
            />
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadSchedulerStatus}
              disabled={loading}
              size="small"
            >
              Atualizar
            </Button>
          </Box>

          {isRunning && schedulerStatus?.jobs && schedulerStatus.jobs.length > 0 && (
            <Box mt={2}>
              <Alert severity="info" icon={<TimeIcon />}>
                <Typography variant="body2">
                  <strong>Próximo backup:</strong>{' '}
                  {formatNextRun(schedulerStatus.jobs[0].next_run)}
                </Typography>
              </Alert>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Configurações de Agendamento */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Configurações
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Agendamento</InputLabel>
                <Select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  disabled={isRunning}
                >
                  <MenuItem value="daily">Diário</MenuItem>
                  <MenuItem value="custom">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Hora (0-23)"
                value={scheduleHour}
                onChange={(e) => setScheduleHour(parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 0, max: 23 } }}
                disabled={isRunning}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Minuto (0-59)"
                value={scheduleMinute}
                onChange={(e) => setScheduleMinute(parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 0, max: 59 } }}
                disabled={isRunning}
              />
            </Grid>
          </Grid>

          <Box mt={2}>
            <Alert severity="info">
              <Typography variant="body2">
                Backup será executado automaticamente todos os dias às{' '}
                <strong>
                  {String(scheduleHour).padStart(2, '0')}:
                  {String(scheduleMinute).padStart(2, '0')}
                </strong>
              </Typography>
            </Alert>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Ações */}
        <Box display="flex" gap={2} flexWrap="wrap">
          {!isRunning ? (
            <Button
              variant="contained"
              color="success"
              startIcon={loading ? <CircularProgress size={20} /> : <PlayIcon />}
              onClick={startScheduler}
              disabled={loading}
            >
              Iniciar Agendador
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              startIcon={loading ? <CircularProgress size={20} /> : <StopIcon />}
              onClick={stopScheduler}
              disabled={loading}
            >
              Parar Agendador
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={executeBackupNow}
            disabled={loading}
          >
            Executar Backup Agora
          </Button>
        </Box>

        <Box mt={3}>
          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Importante:</strong> O agendador precisa estar ativo para executar
              backups automaticamente. Certifique-se de que o servidor Django está rodando.
            </Typography>
          </Alert>
        </Box>
      </CardContent>
    </Card>
  );
};

export default BackupScheduler;

