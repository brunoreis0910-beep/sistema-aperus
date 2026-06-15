import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, CardHeader, Typography,
  Select, MenuItem, FormControl, InputLabel,
  Switch, FormControlLabel, TextField, Button,
  CircularProgress, Alert, Grid, Divider,
  IconButton, Stack, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Print as PrintIcon,
  Save as SaveIcon,
  ReceiptLong as ReceiptIcon,
  AssignmentTurnedIn as OSIcon,
  ShoppingCart as CartIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import ReportBuilderDialog from './ReportBuilderDialog';

const DEFAULT_LAYOUTS = {
    venda_recibo: [
        { id: '_1', campo_origem: 'venda.numero', x: 10, y: 10, font_size: 12, largura: 150, label: 'Número da Venda' },
        { id: '_2', campo_origem: 'venda.data', x: 180, y: 10, font_size: 12, largura: 100, label: 'Data da Venda' },
        { id: '_3', campo_origem: 'cliente.nome', x: 10, y: 30, font_size: 12, largura: 220, label: 'Nome do Cliente' },
        { id: '_4', campo_origem: 'produto.codigo', x: 10, y: 65, font_size: 11, largura: 50, label: 'Código do Produto' },
        { id: '_5', campo_origem: 'produto.descricao', x: 65, y: 65, font_size: 11, largura: 150, label: 'Descrição do Produto' },
        { id: '_6', campo_origem: 'produto.quantidade', x: 220, y: 65, font_size: 11, largura: 40, label: 'Quantidade' },
        { id: '_7', campo_origem: 'produto.valor_unit', x: 265, y: 65, font_size: 11, largura: 60, label: 'Valor Unitário' },
        { id: '_8', campo_origem: 'venda.total', x: 180, y: 105, font_size: 14, largura: 100, label: 'Total da Venda' }
    ],
    etiqueta_gondola: [
        { id: '_1', campo_origem: 'produto.descricao', x: 10, y: 10, font_size: 14, largura: 260, label: 'Descrição do Produto' },
        { id: '_2', campo_origem: 'produto.codigo', x: 10, y: 40, font_size: 11, largura: 100, label: 'Código do Produto' },
        { id: '_3', campo_origem: 'produto.valor_unit', x: 10, y: 65, font_size: 20, largura: 150, label: 'Valor Unitário' },
        { id: '_4', campo_origem: 'produto.codigo_barras', x: 10, y: 105, font_size: 12, largura: 200, label: 'Código de Barras' }
    ],
    relatorio_vendas: [
        { id: '_1', campo_origem: 'cliente.nome', x: 30, y: 30, font_size: 12, largura: 200, label: 'Nome do Cliente' },
        { id: '_2', campo_origem: 'venda.numero', x: 250, y: 30, font_size: 12, largura: 100, label: 'Número da Venda' },
        { id: '_3', campo_origem: 'venda.total', x: 370, y: 30, font_size: 12, largura: 120, label: 'Total da Venda' }
    ],
    relatorio_inventario: [
        { id: '_1', campo_origem: 'produto.codigo', x: 30, y: 30, font_size: 12, largura: 100, label: 'Código do Produto' },
        { id: '_2', campo_origem: 'produto.descricao', x: 150, y: 30, font_size: 12, largura: 300, label: 'Descrição do Produto' },
        { id: '_3', campo_origem: 'produto.quantidade', x: 470, y: 30, font_size: 12, largura: 100, label: 'Quantidade' }
    ]
};

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
  observacao_rodape: '',
  gabarito_customizado_nome: ''
};

const ModuloCard = ({ modulo, axiosInstance, gabaritos }) => {
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
                    <MenuItem value="personalizado">✨ Gabarito Customizado</MenuItem>
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

              {/* Seleção do Gabarito Customizado */}
              {config.tipo_impressora === 'personalizado' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Gabarito Customizado</InputLabel>
                    <Select
                      value={config.gabarito_customizado_nome || ''}
                      label="Gabarito Customizado"
                      onChange={e => handleChange('gabarito_customizado_nome', e.target.value)}
                    >
                      {gabaritos && gabaritos.filter(g => g.ativo).map(g => (
                        <MenuItem key={g.id} value={g.nome_relatorio}>
                          {g.nome_relatorio} ({g.tipo_gabarito})
                        </MenuItem>
                      ))}
                      {(!gabaritos || gabaritos.filter(g => g.ativo).length === 0) && (
                        <MenuItem value="">
                          <em>Nenhum gabarito ativo cadastrado</em>
                        </MenuItem>
                      )}
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
  const [gabaritos, setGabaritos] = useState([]);
  const [loadingGabaritos, setLoadingGabaritos] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [baseGabaritoModal, setBaseGabaritoModal] = useState(false);

  // Builder state parameters
  const [nomeRelatorio, setNomeRelatorio] = useState('');
  const [tipoGabarito, setTipoGabarito] = useState('RECIBO');
  const [larguraMm, setLarguraMm] = useState(80);
  const [alturaMm, setAlturaMm] = useState(0);
  const [elementosLayout, setElementosLayout] = useState([]);

  useEffect(() => {
    buscarGabaritos();
  }, []);

  const buscarGabaritos = async () => {
    setLoadingGabaritos(true);
    try {
      const res = await axiosInstance.get('/saas-gabaritos/');
      setGabaritos(res.data?.results ?? res.data ?? []);
    } catch (err) {
      console.error('Erro ao buscar gabaritos:', err);
    } finally {
      setLoadingGabaritos(false);
    }
  };

  const handleNovoGabarito = () => {
    setBaseGabaritoModal(true);
  };

  const handleIniciarNovoGabaritoComBase = (baseKey) => {
    setBaseGabaritoModal(false);
    setEditingTemplate(null);
    setNomeRelatorio(baseKey);
    let tipo = 'RECIBO';
    let w = 80, h = 0;
    if (baseKey === 'etiqueta_gondola') {
      tipo = 'ETIQUETA';
      w = 100;
      h = 50;
    } else if (baseKey === 'relatorio_vendas') {
      tipo = 'A4_RETRATO';
      w = 210;
      h = 297;
    } else if (baseKey === 'relatorio_inventario') {
      tipo = 'A4_PAISAGEM';
      w = 297;
      h = 210;
    }
    setTipoGabarito(tipo);
    setLarguraMm(w);
    setAlturaMm(h);
    setElementosLayout(DEFAULT_LAYOUTS[baseKey] || []);
    setEditorOpen(true);
  };

  const handleEditarGabarito = (gabarito) => {
    setEditingTemplate(gabarito);
    setNomeRelatorio(gabarito.nome_relatorio);
    setTipoGabarito(gabarito.tipo_gabarito);
    setLarguraMm(gabarito.largura_gabarito_mm);
    setAlturaMm(gabarito.altura_gabarito_mm);
    setElementosLayout(gabarito.layout_json || []);
    setEditorOpen(true);
  };

  const handleSalvarGabarito = async (payload) => {
    try {
      if (editingTemplate) {
        await axiosInstance.put(`/saas-gabaritos/${editingTemplate.id}/`, payload);
      } else {
        await axiosInstance.post('/saas-gabaritos/', payload);
      }
      setEditorOpen(false);
      buscarGabaritos();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar gabarito de impressão.');
    }
  };

  const handleExcluirGabarito = async (id) => {
    if (!window.confirm('Deseja realmente excluir este gabarito de impressão?')) return;
    try {
      await axiosInstance.delete(`/saas-gabaritos/${id}/`);
      buscarGabaritos();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir gabarito.');
    }
  };

  const handleToggleAtivoGabarito = async (gabarito) => {
    try {
      await axiosInstance.patch(`/saas-gabaritos/${gabarito.id}/`, { ativo: !gabarito.ativo });
      buscarGabaritos();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status do gabarito.');
    }
  };

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
        <ModuloCard key={modulo.key} modulo={modulo} axiosInstance={axiosInstance} gabaritos={gabaritos} />
      ))}

      {/* Seção de Gabaritos Customizados */}
      <Card variant="outlined" sx={{ mt: 4, borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Box>
              <Typography variant="h6" fontWeight="bold">Gabaritos de Impressão Customizados</Typography>
              <Typography variant="caption" color="text.secondary">
                Configure layouts personalizados para recibos (bobina 80mm) ou etiquetas de gôndola.
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              size="small" 
              startIcon={<AddIcon />} 
              onClick={handleNovoGabarito}
              sx={{ textTransform: 'none' }}
            >
              Novo Gabarito
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {loadingGabaritos ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Nome / Identificador do Gabarito</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Tipo de Impressão</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Dimensões (mm)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Ativo</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gabaritos.map(g => (
                    <TableRow key={g.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{g.nome_relatorio}</TableCell>
                      <TableCell align="center">
                        {g.tipo_gabarito === 'RECIBO' ? 'Recibo (Bobina 80mm)' : 
                         g.tipo_gabarito === 'ETIQUETA' ? 'Etiqueta Térmica' :
                         g.tipo_gabarito === 'A4_RETRATO' ? 'A4 Retrato' :
                         g.tipo_gabarito === 'A4_PAISAGEM' ? 'A4 Paisagem' : g.tipo_gabarito}
                      </TableCell>
                      <TableCell align="center">{g.largura_gabarito_mm} x {g.altura_gabarito_mm} mm</TableCell>
                      <TableCell align="center">
                        <Switch 
                          size="small" 
                          checked={g.ativo} 
                          onChange={() => handleToggleAtivoGabarito(g)} 
                          color="success"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<LaunchIcon />}
                            href={`/api/saas/gabarito-preview/?nome_relatorio=${g.nome_relatorio}`}
                            target="_blank"
                            sx={{ textTransform: 'none', py: 0.2 }}
                          >
                            Visualizar Teste
                          </Button>
                          <IconButton size="small" color="primary" onClick={() => handleEditarGabarito(g)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleExcluirGabarito(g.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {gabaritos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Nenhum gabarito de impressão customizado cadastrado. Clique em "Novo Gabarito" para criar.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
 
      {/* Modal para selecionar o gabarito base (etiqueta/bobina/A4) */}
      <Dialog 
        open={baseGabaritoModal} 
        onClose={() => setBaseGabaritoModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Selecione o Gabarito de Impressão Base</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Selecione uma base de layout de impressão abaixo. Os campos e dimensões padrão serão carregados automaticamente.
          </Typography>
          <Stack spacing={1.5}>
            <Button 
              variant="outlined" 
              onClick={() => handleIniciarNovoGabaritoComBase('venda_recibo')}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.5 }}
            >
              🎫 Recibo de Venda (Bobina 80mm)
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => handleIniciarNovoGabaritoComBase('etiqueta_gondola')}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.5 }}
            >
              🏷️ Etiqueta de Gôndola (100x50mm)
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => handleIniciarNovoGabaritoComBase('relatorio_vendas')}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.5 }}
            >
              📄 Relatório de Vendas (A4 Retrato)
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => handleIniciarNovoGabaritoComBase('relatorio_inventario')}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.5 }}
            >
              📄 Relatório de Inventário (A4 Paisagem)
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBaseGabaritoModal(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Visual Report Builder Dialog */}
      <ReportBuilderDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSalvarGabarito}
        initialData={{
          nome_relatorio: nomeRelatorio,
          tipo_gabarito: tipoGabarito,
          largura_gabarito_mm: larguraMm,
          altura_gabarito_mm: alturaMm,
          layout_json: elementosLayout
        }}
      />
    </Box>
  );
};

export default ImpressaoConfig;
