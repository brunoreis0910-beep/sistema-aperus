import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
  Stars as StarsIcon,
  LockOpen as UnlockIcon,
  TrendingUp as UpgradeIcon
} from '@mui/icons-material';

export default function UpgradeRequestDialog({ open, onClose, cnpj, currentFeature, axiosInstance, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [planos, setPlanos] = useState([]);
  const [selectedPlano, setSelectedPlano] = useState(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchPlanos();
      setRequestSuccess(false);
      setError('');
      setSelectedPlano(null);
    }
  }, [open]);

  const fetchPlanos = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/saas/planos/');
      setPlanos(response.data || []);
      // Auto-select first plan that has the currentFeature if possible
      if (currentFeature && response.data) {
        const matchingPlano = response.data.find(p => {
          if (currentFeature === 'pdv' && p.modulo_pdv) return true;
          if (currentFeature === 'financeiro_avancado' && p.modulo_financeiro_avancado) return true;
          if (currentFeature === 'producao' && p.modulo_producao_industria) return true;
          if (currentFeature === 'transporte' && p.modulo_transporte_cte) return true;
          if (currentFeature === 'report_builder' && p.modulo_report_builder) return true;
          return false;
        });
        if (matchingPlano) {
          setSelectedPlano(matchingPlano);
        } else if (response.data.length > 0) {
          setSelectedPlano(response.data[0]);
        }
      } else if (response.data && response.data.length > 0) {
        setSelectedPlano(response.data[0]);
      }
    } catch (err) {
      console.error("Erro ao buscar planos:", err);
      setError('Não foi possível carregar os planos da Central. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUpgrade = async () => {
    if (!selectedPlano || !cnpj) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await axiosInstance.post('/saas/solicitar-upgrade/', {
        cnpj: cnpj,
        plano_id: selectedPlano.id
      });
      if (response.data?.success) {
        setRequestSuccess(true);
        if (onSuccess) {
          onSuccess(response.data.message);
        }
      } else {
        setError(response.data?.error || 'Erro ao solicitar upgrade.');
      }
    } catch (err) {
      console.error("Erro ao solicitar upgrade:", err);
      setError(err.response?.data?.error || 'Erro ao conectar no servidor. Verifique sua conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  const getFeatureLabel = (featureKey) => {
    const labels = {
      pdv: 'Frente de Caixa (PDV NFC-e)',
      financeiro_avancado: 'Financeiro Avançado',
      producao: 'Controle de Produção',
      transporte: 'Emissão de CT-e & MDF-e',
      ciot: 'CIOT Automático',
      report_builder: 'Editor de Relatórios Customizados'
    };
    return labels[featureKey] || featureKey;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'radial-gradient(circle at top right, #fcfcfd 0%, #f3f4f6 100%)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <StarsIcon sx={{ color: '#fbbf24', fontSize: '2rem' }} />
          <Typography variant="h5" fontWeight={800} color="#1f2937" fontFamily="'Outfit', sans-serif">
            Upgrade de Plano SaaS
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#9ca3af', '&:hover': { color: '#4b5563' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.4)' }}>
        {currentFeature && !requestSuccess && (
          <Box
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 3,
              bgcolor: '#fef3c7',
              border: '1px solid #fde68a',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} color="#92400e" display="flex" alignItems="center" gap={1}>
              🔒 Módulo Bloqueado no seu Plano Atual
            </Typography>
            <Typography variant="body2" color="#b45309">
              O recurso <strong>{getFeatureLabel(currentFeature)}</strong> está disponível apenas em planos superiores. Escolha um plano abaixo para solicitar a liberação imediata.
            </Typography>
          </Box>
        )}

        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} gap={2}>
            <CircularProgress size={48} sx={{ color: '#2563eb' }} />
            <Typography variant="body2" color="text.secondary">
              Buscando planos disponíveis na Central Aperus...
            </Typography>
          </Box>
        ) : error ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} textAlign="center">
            <Typography variant="h6" color="error" gutterBottom fontWeight={700}>
              Ops! Algo deu errado
            </Typography>
            <Typography variant="body2" color="text.secondary" maxWidth={400} mb={3}>
              {error}
            </Typography>
            <Button variant="outlined" color="primary" onClick={fetchPlanos} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Tentar Novamente
            </Button>
          </Box>
        ) : requestSuccess ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} textAlign="center" gap={2}>
            <CheckIcon sx={{ fontSize: '4.5rem', color: '#10b981' }} />
            <Typography variant="h5" fontWeight={800} color="#065f46" fontFamily="'Outfit', sans-serif">
              Solicitação Enviada com Sucesso!
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={500}>
              Sua solicitação de upgrade para o plano <strong>{selectedPlano?.nome}</strong> foi registrada. O setor financeiro ou o suporte técnico analisará o pedido e liberará o recurso em instantes.
            </Typography>
            <Button
              variant="contained"
              onClick={onClose}
              sx={{
                mt: 2,
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              Entendido
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {planos.map((plano) => {
              const isSelected = selectedPlano?.id === plano.id;
              // Determine card colors based on plan level
              let planColor = '#4b5563';
              let planBg = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
              if (plano.nome.toLowerCase().includes('ouro') || plano.nome.toLowerCase().includes('gold') || plano.nome.toLowerCase().includes('premium')) {
                planColor = '#d97706';
                planBg = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
              } else if (plano.nome.toLowerCase().includes('prata') || plano.nome.toLowerCase().includes('silver')) {
                planColor = '#4b5563';
                planBg = 'linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%)';
              } else if (plano.nome.toLowerCase().includes('bronze')) {
                planColor = '#b45309';
                planBg = 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)';
              }

              return (
                <Grid item xs={12} md={4} key={plano.id}>
                  <Card
                    onClick={() => setSelectedPlano(plano)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 3.5,
                      border: isSelected ? `3px solid #2563eb` : `1px solid rgba(229, 231, 235, 0.5)`,
                      boxShadow: isSelected ? '0 10px 20px -3px rgba(37, 99, 235, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: '#ffffff',
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Box sx={{ p: 2.5, background: planBg, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                      <StarIcon sx={{ color: planColor, fontSize: '2rem', mb: 0.5 }} />
                      <Typography variant="h6" fontWeight={800} sx={{ color: '#111827', fontFamily: "'Outfit', sans-serif" }}>
                        {plano.nome}
                      </Typography>
                      <Typography variant="h4" fontWeight={900} sx={{ color: planColor, mt: 1, fontFamily: "'Outfit', sans-serif" }}>
                        R$ {parseFloat(plano.valor_mensalidade || 0).toFixed(2).replace('.', ',')}
                        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#6b7280' }}>/mês</span>
                      </Typography>
                    </Box>
                    <Divider />
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="#374151" mb={1.5}>
                        Recursos Inclusos:
                      </Typography>
                      <List dense sx={{ p: 0, flexGrow: 1 }}>
                        <ListItem disableGutters sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28, color: plano.modulo_pdv ? '#10b981' : '#9ca3af' }}>
                            {plano.modulo_pdv ? <CheckIcon fontSize="small" /> : <UnlockIcon fontSize="small" sx={{ opacity: 0.3 }} />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={getFeatureLabel('pdv')} 
                            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: plano.modulo_pdv ? 600 : 400, color: plano.modulo_pdv ? '#111827' : '#9ca3af' }} 
                          />
                        </ListItem>
                        <ListItem disableGutters sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28, color: plano.modulo_financeiro_avancado ? '#10b981' : '#9ca3af' }}>
                            {plano.modulo_financeiro_avancado ? <CheckIcon fontSize="small" /> : <UnlockIcon fontSize="small" sx={{ opacity: 0.3 }} />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={getFeatureLabel('financeiro_avancado')} 
                            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: plano.modulo_financeiro_avancado ? 600 : 400, color: plano.modulo_financeiro_avancado ? '#111827' : '#9ca3af' }} 
                          />
                        </ListItem>
                        <ListItem disableGutters sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28, color: plano.modulo_producao_industria ? '#10b981' : '#9ca3af' }}>
                            {plano.modulo_producao_industria ? <CheckIcon fontSize="small" /> : <UnlockIcon fontSize="small" sx={{ opacity: 0.3 }} />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={getFeatureLabel('producao')} 
                            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: plano.modulo_producao_industria ? 600 : 400, color: plano.modulo_producao_industria ? '#111827' : '#9ca3af' }} 
                          />
                        </ListItem>
                        <ListItem disableGutters sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28, color: plano.modulo_transporte_cte ? '#10b981' : '#9ca3af' }}>
                            {plano.modulo_transporte_cte ? <CheckIcon fontSize="small" /> : <UnlockIcon fontSize="small" sx={{ opacity: 0.3 }} />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={getFeatureLabel('transporte')} 
                            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: plano.modulo_transporte_cte ? 600 : 400, color: plano.modulo_transporte_cte ? '#111827' : '#9ca3af' }} 
                          />
                        </ListItem>
                        <ListItem disableGutters sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28, color: plano.modulo_ciot_automatico ? '#10b981' : '#9ca3af' }}>
                            {plano.modulo_ciot_automatico ? <CheckIcon fontSize="small" /> : <UnlockIcon fontSize="small" sx={{ opacity: 0.3 }} />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={getFeatureLabel('ciot')} 
                            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: plano.modulo_ciot_automatico ? 600 : 400, color: plano.modulo_ciot_automatico ? '#111827' : '#9ca3af' }} 
                          />
                        </ListItem>
                        <ListItem disableGutters sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28, color: plano.modulo_report_builder ? '#10b981' : '#9ca3af' }}>
                            {plano.modulo_report_builder ? <CheckIcon fontSize="small" /> : <UnlockIcon fontSize="small" sx={{ opacity: 0.3 }} />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={getFeatureLabel('report_builder')} 
                            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: plano.modulo_report_builder ? 600 : 400, color: plano.modulo_report_builder ? '#111827' : '#9ca3af' }} 
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>

      {!requestSuccess && !loading && !error && (
        <DialogActions sx={{ p: 3, justifyContent: 'space-between', backgroundColor: '#f9fafb' }}>
          <Typography variant="caption" color="text.secondary">
            *Sujeito à alteração no valor da mensalidade do seu contrato.
          </Typography>
          <Box display="flex" gap={2}>
            <Button 
              onClick={onClose} 
              sx={{ borderRadius: '12px', px: 3, textTransform: 'none', fontWeight: 'bold', color: '#4b5563' }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              disabled={!selectedPlano || submitting}
              onClick={handleRequestUpgrade}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <UpgradeIcon />}
              sx={{
                borderRadius: '12px',
                px: 4,
                py: 1,
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' },
                textTransform: 'none',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)'
              }}
            >
              Solicitar Plano {selectedPlano?.nome}
            </Button>
          </Box>
        </DialogActions>
      )}
    </Dialog>
  );
}
