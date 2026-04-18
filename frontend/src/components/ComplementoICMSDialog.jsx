import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  History as HistoryIcon,
  Description as DescriptionIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

/**
 * Dialog para criar Complemento de ICMS em NFe
 * 
 * Props:
 *   - open: boolean - se o diálogo está aberto
 *   - onClose: function - callback ao fechar
 *   - venda: object - objeto da venda com NFe autorizada
 *   - onSuccess: function - callback após sucesso (opcional)
 */
export default function ComplementoICMSDialog({ open, onClose, venda, onSuccess }) {
  const { axiosInstance } = useAuth();
  const [tab, setTab] = useState('novo'); // 'novo' ou 'historico'
  const [formData, setFormData] = useState({
    tipo_complemento: 'DIFAL',
    valor_complemento: '',
    base_calculo: '',
    aliquota: '',
    motivo: '',
    observacoes: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [historico, setHistorico] = useState([]);

  const tiposComplemento = [
    { value: 'ICMS', label: 'ICMS' },
    { value: 'ICMS_ST', label: 'ICMS-ST' },
    { value: 'DIFAL', label: 'Diferencial de Alíquota (DIFAL)' },
    { value: 'IPI', label: 'IPI' },
    { value: 'OUTROS', label: 'Outros' },
  ];

  // Buscar histórico ao abrir
  useEffect(() => {
    if (open && venda?.id_venda) {
      buscarHistorico();
    } else {
      // Limpar ao fechar
      resetForm();
      setErro('');
      setSucesso('');
      setTab('novo');
    }
  }, [open, venda]);

  const resetForm = () => {
    setFormData({
      tipo_complemento: 'DIFAL',
      valor_complemento: '',
      base_calculo: '',
      aliquota: '',
      motivo: '',
      observacoes: '',
    });
  };

  const buscarHistorico = async () => {
    setLoadingHistorico(true);
    try {
      const response = await axiosInstance.get(
        `/api/vendas/${venda.id_venda}/complemento_icms/`
      );
      if (response.data.sucesso) {
        setHistorico(response.data.complementos || []);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de complementos:', error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCriar = async () => {
    setErro('');
    setSucesso('');

    // Validações
    if (!formData.valor_complemento || parseFloat(formData.valor_complemento) <= 0) {
      setErro('Informe um valor válido para o complemento.');
      return;
    }

    if (!formData.motivo.trim()) {
      setErro('Informe o motivo do complemento.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        tipo_complemento: formData.tipo_complemento,
        valor_complemento: parseFloat(formData.valor_complemento),
        motivo: formData.motivo.trim(),
      };

      if (formData.base_calculo) {
        payload.base_calculo = parseFloat(formData.base_calculo);
      }

      if (formData.aliquota) {
        payload.aliquota = parseFloat(formData.aliquota);
      }

      if (formData.observacoes) {
        payload.observacoes = formData.observacoes.trim();
      }

      const response = await axiosInstance.post(
        `/api/vendas/${venda.id_venda}/complemento_icms/`,
        payload
      );

      if (response.data.sucesso) {
        setSucesso(response.data.mensagem || 'Complemento criado com sucesso!');
        resetForm();
        await buscarHistorico();
        setTab('historico');
        
        if (onSuccess) {
          onSuccess(response.data.complemento);
        }
      } else {
        setErro(response.data.mensagem || 'Erro ao criar complemento.');
      }
    } catch (error) {
      console.error('Erro ao criar complemento:', error);
      setErro(
        error.response?.data?.mensagem ||
        error.response?.data?.error ||
        'Erro ao criar complemento. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmitir = async (complemento) => {
    if (!window.confirm('Deseja emitir a NFe de complemento? Isso criará uma nova venda.')) {
      return;
    }

    try {
      const response = await axiosInstance.post(
        `/api/vendas/${venda.id_venda}/complemento_icms/${complemento.id_complemento}/emitir/`
      );

      if (response.data.sucesso) {
        alert(response.data.mensagem);
        await buscarHistorico();
        
        // Perguntar se deseja ir para a página da nova venda
        if (response.data.id_venda_complemento) {
          const irParaVenda = window.confirm(
            'Complemento criado com sucesso! Deseja ir para a página da nova venda?'
          );
          if (irParaVenda) {
            window.location.href = `/nfe?venda=${response.data.id_venda_complemento}`;
          }
        }
      } else {
        alert(response.data.mensagem || 'Erro ao emitir complemento.');
      }
    } catch (error) {
      console.error('Erro ao emitir complemento:', error);
      alert(
        error.response?.data?.mensagem ||
        error.response?.data?.error ||
        'Erro ao emitir complemento.'
      );
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      PENDENTE: { label: 'Pendente', color: 'warning' },
      EMITIDA: { label: 'Emitida', color: 'success' },
      CANCELADA: { label: 'Cancelada', color: 'error' },
      ERRO: { label: 'Erro', color: 'error' },
    };

    const config = statusMap[status] || { label: status, color: 'default' };

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.color === 'success' ? <CheckIcon /> : config.color === 'error' ? <ErrorIcon /> : undefined}
      />
    );
  };

  const formatMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor || 0);
  };

  if (!venda) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <DescriptionIcon />
          Complemento de ICMS
        </Box>
        <Typography variant="caption" color="textSecondary">
          NFe: {venda.numero_nfe || venda.id_venda} | Chave: {venda.chave_nfe?.substring(0, 10)}...
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Box display="flex" gap={2}>
            <Button
              onClick={() => setTab('novo')}
              variant={tab === 'novo' ? 'contained' : 'text'}
              size="small"
            >
              Novo Complemento
            </Button>
            <Button
              onClick={() => setTab('historico')}
              variant={tab === 'historico' ? 'contained' : 'text'}
              size="small"
            >
              Histórico ({historico.length})
            </Button>
          </Box>
        </Box>

        {/* Alertas */}
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        {sucesso && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSucesso('')}>
            {sucesso}
          </Alert>
        )}

        {/* Aba: Novo Complemento */}
        {tab === 'novo' && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Use este recurso para complementar ICMS, ICMS-ST, IPI ou emitir nota de DIFAL (Diferencial de Alíquota).
                Uma nova NFe será criada referenciando a nota original.
              </Typography>
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Complemento"
                  value={formData.tipo_complemento}
                  onChange={(e) => handleChange('tipo_complemento', e.target.value)}
                  disabled={loading}
                >
                  {tiposComplemento.map((tipo) => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Valor do Complemento *"
                  value={formData.valor_complemento}
                  onChange={(e) => handleChange('valor_complemento', e.target.value)}
                  disabled={loading}
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Base de Cálculo"
                  value={formData.base_calculo}
                  onChange={(e) => handleChange('base_calculo', e.target.value)}
                  disabled={loading}
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Alíquota (%)"
                  value={formData.aliquota}
                  onChange={(e) => handleChange('aliquota', e.target.value)}
                  disabled={loading}
                  inputProps={{ step: '0.01', min: '0', max: '100' }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Motivo do Complemento *"
                  placeholder="Ex: Diferencial de alíquota interestadual conforme cálculo..."
                  value={formData.motivo}
                  onChange={(e) => handleChange('motivo', e.target.value)}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Observações"
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Aba: Histórico */}
        {tab === 'historico' && (
          <Box>
            {loadingHistorico ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : historico.length === 0 ? (
              <Alert severity="info">
                Nenhum complemento criado para esta NFe.
              </Alert>
            ) : (
              <List>
                {historico.map((comp, index) => (
                  <ListItem
                    key={comp.id_complemento}
                    divider={index < historico.length - 1}
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      bgcolor: comp.status === 'PENDENTE' ? 'action.hover' : 'transparent',
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
                      <Typography variant="body2" fontWeight="bold">
                        {comp.tipo_complemento} - {formatMoeda(comp.valor_complemento)}
                      </Typography>
                      {getStatusChip(comp.status)}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Motivo:</strong> {comp.motivo}
                    </Typography>

                    {comp.observacoes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Observações:</strong> {comp.observacoes}
                      </Typography>
                    )}

                    <Box display="flex" gap={2} flexWrap="wrap" mb={1}>
                      {comp.base_calculo && (
                        <Typography variant="caption" color="text.secondary">
                          Base: {formatMoeda(comp.base_calculo)}
                        </Typography>
                      )}
                      {comp.aliquota && (
                        <Typography variant="caption" color="text.secondary">
                          Alíq: {comp.aliquota}%
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Criado: {new Date(comp.data_criacao).toLocaleString('pt-BR')}
                      </Typography>
                      {comp.usuario_nome && (
                        <Typography variant="caption" color="text.secondary">
                          Por: {comp.usuario_nome}
                        </Typography>
                      )}
                    </Box>

                    {comp.status === 'PENDENTE' && (
                      <Box mt={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<SendIcon />}
                          onClick={() => handleEmitir(comp)}
                        >
                          Emitir NFe de Complemento
                        </Button>
                      </Box>
                    )}

                    {comp.status === 'EMITIDA' && comp.numero_nfe_complemento && (
                      <Alert severity="success" sx={{ mt: 1, width: '100%' }}>
                        NFe de complemento emitida: {comp.numero_nfe_complemento}
                      </Alert>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Fechar
        </Button>
        {tab === 'novo' && (
          <Button
            onClick={handleCriar}
            variant="contained"
            color="primary"
            disabled={loading || !formData.valor_complemento || !formData.motivo.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {loading ? 'Criando...' : 'Criar Complemento'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
