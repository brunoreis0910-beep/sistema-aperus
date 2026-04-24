import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, CardHeader, Typography,
  Select, MenuItem, FormControl, InputLabel,
  Switch, FormControlLabel, TextField, Button,
  CircularProgress, Alert, Grid, Divider
} from '@mui/material';
import {
  Print as PrintIcon,
  Save as SaveIcon,
  ReceiptLong as ReceiptIcon,
  AssignmentTurnedIn as OSIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const MODULOS = [
  {
    key: 'venda_rapida',
    label: 'Venda Rápida (PDV)',
    desc: 'Configuração de impressão do cupom no balcão/PDV',
    icon: <CartIcon color="primary" />
  },
  {
    key: 'venda',
    label: 'Venda',
    desc: 'Configuração de impressão da venda regular',
    icon: <ReceiptIcon color="primary" />
  },
  {
    key: 'ordem_servico',
    label: 'Ordem de Serviço',
    desc: 'Configuração de impressão da ordem de serviço',
    icon: <OSIcon color="primary" />
  }
];

const CONFIG_PADRAO = {
  tipo_impressora: 'termica',
  largura_termica: '80mm',
  imprimir_automatico: false,
  mostrar_logo: true,
  copias: 1,
  observacao_rodape: ''
};

const ModuloCard = ({ modulo, axiosInstance }) => {
  const [config, setConfig] = useState(CONFIG_PADRAO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axiosInstance.get(`/configuracao-impressao/modulo/${modulo.key}/`);
        setConfig({ ...CONFIG_PADRAO, ...res.data });
      } catch (err) {
        setError('Erro ao carregar configuração.');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [modulo.key, axiosInstance]);

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      await axiosInstance.patch(`/configuracao-impressao/modulo/${modulo.key}/salvar/`, config);
      setSuccess('Configuração salva com sucesso!');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        avatar={modulo.icon}
        title={<Typography variant="h6">{modulo.label}</Typography>}
        subheader={modulo.desc}
      />
      <Divider />
      <CardContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Grid container spacing={3}>
              {/* Tipo de Impressora */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Impressora</InputLabel>
                  <Select
                    value={config.tipo_impressora}
                    label="Tipo de Impressora"
                    onChange={e => handleChange('tipo_impressora', e.target.value)}
                  >
                    <MenuItem value="termica">🖨️ Térmica (Cupom)</MenuItem>
                    <MenuItem value="a4">📄 A4 (Folha)</MenuItem>
                    {modulo.key === 'ordem_servico' && (
                      <MenuItem value="a4_fotos">📸 A4 com Fotos e Assinatura</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* Largura térmica — visível apenas no modo térmico */}
              {config.tipo_impressora === 'termica' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Largura do Papel Térmico</InputLabel>
                    <Select
                      value={config.largura_termica}
                      label="Largura do Papel Térmico"
                      onChange={e => handleChange('largura_termica', e.target.value)}
                    >
                      <MenuItem value="58mm">58mm</MenuItem>
                      <MenuItem value="72mm">72mm</MenuItem>
                      <MenuItem value="80mm">80mm</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Número de Cópias */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Número de Cópias"
                  value={config.copias}
                  onChange={e => handleChange('copias', Math.max(1, parseInt(e.target.value) || 1))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>

              {/* Observação no rodapé */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observação no Rodapé (impressão)"
                  value={config.observacao_rodape}
                  onChange={e => handleChange('observacao_rodape', e.target.value)}
                  placeholder="Ex: Obrigado pela preferência! Volte sempre."
                  inputProps={{ maxLength: 200 }}
                />
              </Grid>

              {/* Switches */}
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.imprimir_automatico}
                      onChange={e => handleChange('imprimir_automatico', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">Imprimir Automaticamente</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Imprime sem exibir caixa de diálogo
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.mostrar_logo}
                      onChange={e => handleChange('mostrar_logo', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">Mostrar Logo da Empresa</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Exibe logomarca no cabeçalho
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                size="large"
              >
                Salvar Configuração
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const ImpressaoConfig = () => {
  const { axiosInstance } = useAuth();

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <PrintIcon color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight="bold">Configurações de Impressão</Typography>
          <Typography variant="body2" color="text.secondary">
            Defina o padrão de impressão para cada módulo do sistema (térmica ou A4)
          </Typography>
        </Box>
      </Box>

      {MODULOS.map(modulo => (
        <ModuloCard key={modulo.key} modulo={modulo} axiosInstance={axiosInstance} />
      ))}
    </Box>
  );
};

export default ImpressaoConfig;
