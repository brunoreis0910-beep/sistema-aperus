import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Typography,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Backdrop,
  Divider,
  Paper,
  FormControl,
  FormLabel,
  InputAdornment,
  Checkbox,
  FormGroup,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Code as CodeIcon,
  AutoMode as AutoModeIcon,
  Edit as EditIcon,
  EventNote as EventNoteIcon,
  Inventory as InventoryIcon,
  AccountBalance as TaxIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ProdutoConfig = () => {
  const { axiosInstance } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [tiposTributacao, setTiposTributacao] = useState([]);
  const [perfilSelecionado, setPerfilSelecionado] = useState('');
  const [config, setConfig] = useState({
    id_config: null,
    tipo_geracao_codigo: 'manual',
    proximo_codigo: 1,
    prefixo_codigo: '',
    tamanho_codigo: 6,
    controlar_lote_validade: false,
    produto_em_grade: false,
    material_construcao: false,
    // Sugestão de Tributação Padrão
    trib_cfop: '5102',
    trib_cst_icms: '',
    trib_csosn: '400',
    trib_icms_aliquota: '0',
    trib_cst_ipi: '99',
    trib_ipi_aliquota: '0',
    trib_cst_pis_cofins: '07',
    trib_pis_aliquota: '0',
    trib_cofins_aliquota: '0',
    trib_classificacao_fiscal: ''
  });
  const [previewCodigo, setPreviewCodigo] = useState('000001');

  useEffect(() => {
    carregarConfig();
    carregarTiposTributacao();
  }, []);

  const carregarTiposTributacao = async () => {
    try {
      const resp = await axiosInstance.get('/tipos-tributacao/?ativo=true');
      const data = Array.isArray(resp.data) ? resp.data : (resp.data.results ?? []);
      setTiposTributacao(data);
    } catch {
      // silencioso — listagem opcional
    }
  };

  const aplicarPerfilTributacao = (id) => {
    setPerfilSelecionado(id);
    if (!id) return;
    const perfil = tiposTributacao.find((t) => t.id === id);
    if (!perfil) return;
    setConfig((prev) => ({
      ...prev,
      trib_cfop:       perfil.cfop_padrao  || prev.trib_cfop,
      trib_cst_icms:   perfil.icms_cst_csosn || prev.trib_cst_icms,
      trib_csosn:      perfil.icms_cst_csosn || prev.trib_csosn,
    }));
  };

  useEffect(() => {
    atualizarPreview();
  }, [config.prefixo_codigo, config.proximo_codigo, config.tamanho_codigo]);

  const carregarConfig = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/config-produto/');
      
      // A API retorna um objeto único (não array)
      const configData = response.data;
      
      setConfig({
        id_config: configData.id_config || 1,
        tipo_geracao_codigo: configData.tipo_geracao_codigo || 'manual',
        proximo_codigo: configData.proximo_codigo || 1,
        prefixo_codigo: configData.prefixo_codigo || '',
        tamanho_codigo: configData.tamanho_codigo !== undefined && configData.tamanho_codigo !== null ? configData.tamanho_codigo : 6,
        controlar_lote_validade: configData.controlar_lote_validade || false,
        produto_em_grade: configData.produto_em_grade || false,
        material_construcao: configData.material_construcao || false,
        // Sugestão de Tributação Padrão
        trib_cfop: configData.trib_cfop || '5102',
        trib_cst_icms: configData.trib_cst_icms || '',
        trib_csosn: configData.trib_csosn || '400',
        trib_icms_aliquota: configData.trib_icms_aliquota ?? '0',
        trib_cst_ipi: configData.trib_cst_ipi || '99',
        trib_ipi_aliquota: configData.trib_ipi_aliquota ?? '0',
        trib_cst_pis_cofins: configData.trib_cst_pis_cofins || '07',
        trib_pis_aliquota: configData.trib_pis_aliquota ?? '0',
        trib_cofins_aliquota: configData.trib_cofins_aliquota ?? '0',
        trib_classificacao_fiscal: configData.trib_classificacao_fiscal || ''
      });
      
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar configuração:', err);
      setError('Erro ao carregar configuração');
      toast.error('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const atualizarPreview = () => {
    const prefixo = config.prefixo_codigo || '';
    const numero = String(config.proximo_codigo || 1).padStart(config.tamanho_codigo || 6, '0');
    setPreviewCodigo(`${prefixo}${numero}`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dadosParaEnvio = {
        tipo_geracao_codigo: config.tipo_geracao_codigo,
        proximo_codigo: parseInt(config.proximo_codigo) || 1,
        prefixo_codigo: config.prefixo_codigo || '',
        tamanho_codigo: config.tamanho_codigo === '' ? 6 : parseInt(config.tamanho_codigo),
        controlar_lote_validade: !!config.controlar_lote_validade,
        produto_em_grade: !!config.produto_em_grade,
        material_construcao: !!config.material_construcao,
        // Sugestão de Tributação Padrão
        trib_cfop: config.trib_cfop || '',
        trib_cst_icms: config.trib_cst_icms || '',
        trib_csosn: config.trib_csosn || '',
        trib_icms_aliquota: parseFloat(config.trib_icms_aliquota) || 0,
        trib_cst_ipi: config.trib_cst_ipi || '',
        trib_ipi_aliquota: parseFloat(config.trib_ipi_aliquota) || 0,
        trib_cst_pis_cofins: config.trib_cst_pis_cofins || '',
        trib_pis_aliquota: parseFloat(config.trib_pis_aliquota) || 0,
        trib_cofins_aliquota: parseFloat(config.trib_cofins_aliquota) || 0,
        trib_classificacao_fiscal: config.trib_classificacao_fiscal || ''
      };
      
      console.log('📤 Salvando configuração:', dadosParaEnvio);

      if (config.id_config) {
        // Atualizar configuração existente
        await axiosInstance.put(
          `/config-produto/${config.id_config}/`,
          dadosParaEnvio
        );
      } else {
        // Criar nova configuração
        const response = await axiosInstance.post('/config-produto/', dadosParaEnvio);
        setConfig({ ...config, id_config: response.data.id_config });
      }

      toast.success('Configuração salva com sucesso!');
      setError(null);
    } catch (err) {
      console.error('Erro ao salvar configuração:', err);
      const mensagem = err.response?.data?.message || 'Erro ao salvar configuração';
      setError(mensagem);
      toast.error(mensagem);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTipoDescricao = () => {
    switch(config.tipo_geracao_codigo) {
      case 'automatica':
        return '🤖 O sistema gerará automaticamente o código ao cadastrar um produto. Você não poderá editar o código.';
      case 'semi-automatica':
        return '✏️ O sistema sugere um código, mas você pode alterá-lo antes de salvar. Se não alterar, usa o código sugerido.';
      case 'manual':
        return '📝 Você deve digitar manualmente o código do produto. O sistema não gera código automaticamente.';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={saving}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <SettingsIcon />
            </Avatar>
          }
          title="Configuração de Código de Produto"
          subheader="Defina como os códigos de produtos serão gerados"
        />

        <CardContent>
          <Grid container spacing={3}>
            {/* Tipo de Geração */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, bgcolor: 'background.default' }}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold', fontSize: '1.1rem' }}>
                    <CodeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Tipo de Geração de Código
                  </FormLabel>
                  
                  <RadioGroup
                    value={config.tipo_geracao_codigo}
                    onChange={(e) => handleInputChange('tipo_geracao_codigo', e.target.value)}
                  >
                    <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'white' }}>
                      <FormControlLabel
                        value="automatica"
                        control={<Radio color="primary" />}
                        label={
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              🤖 Automática
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              O sistema gera automaticamente o código. Usuário não pode editar.
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>

                    <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'white' }}>
                      <FormControlLabel
                        value="semi-automatica"
                        control={<Radio color="warning" />}
                        label={
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              ✏️ Semi-Automática
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Sistema sugere um código, mas usuário pode alterar se quiser.
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>

                    <Paper elevation={1} sx={{ p: 2, bgcolor: 'white' }}>
                      <FormControlLabel
                        value="manual"
                        control={<Radio color="secondary" />}
                        label={
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              📝 Manual
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Usuário digita manualmente o código do produto.
                            </Typography>
                          </Box>
                        }
                      />
                    </Paper>
                  </RadioGroup>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    {getTipoDescricao()}
                  </Alert>
                </FormControl>
              </Paper>
            </Grid>

            {/* Configurações de Código (apenas se não for manual) */}
            {config.tipo_geracao_codigo !== 'manual' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="h6" color="text.secondary">
                      Configurações do Código
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Prefixo (Opcional)"
                    value={config.prefixo_codigo}
                    onChange={(e) => handleInputChange('prefixo_codigo', e.target.value.toUpperCase())}
                    placeholder="Ex: PROD, P"
                    helperText="Texto que aparecerá antes do número"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CodeIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Próximo Código"
                    value={config.proximo_codigo}
                    onChange={(e) => handleInputChange('proximo_codigo', e.target.value)}
                    helperText="Próximo número a ser gerado"
                    InputProps={{
                      inputProps: { min: 1 }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tamanho do Código"
                    value={config.tamanho_codigo}
                    onChange={(e) => handleInputChange('tamanho_codigo', e.target.value)}
                    helperText="Quantidade de dígitos (com zeros à esquerda)"
                    InputProps={{
                      inputProps: { min: 1, max: 10 }
                    }}
                  />
                </Grid>

                {/* Preview do Código */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 3, 
                      bgcolor: 'primary.lighter',
                      border: '2px solid',
                      borderColor: 'primary.main'
                    }}
                  >
                    <Typography variant="subtitle2" color="primary.dark" gutterBottom>
                      📋 Preview do Próximo Código:
                    </Typography>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontFamily: 'monospace',
                        color: 'primary.main',
                        fontWeight: 'bold',
                        letterSpacing: 2
                      }}
                    >
                      {previewCodigo}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Este será o código gerado para o próximo produto
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="warning">
                    <strong>Atenção:</strong> Após salvar e criar produtos com código automático, 
                    alterar essas configurações pode causar conflitos. Configure com cuidado!
                  </Alert>
                </Grid>
              </>
            )}

            {/* Configuração de Lote e Validade */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Paper elevation={1} sx={{ p: 2 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                    <EventNoteIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Controle de Lote e Validade
                  </FormLabel>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={config.controlar_lote_validade} 
                          onChange={(e) => handleInputChange('controlar_lote_validade', e.target.checked)} 
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Habilitar Controle de Lotes
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Permite informar lote e data de validade no cadastro de produtos.
                          </Typography>
                        </Box>
                      }
                    />
                  </FormGroup>
                </FormControl>
              </Paper>
            </Grid>

            {/* Configuração de Produto em Grade */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                    <InventoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Grade de Produtos
                  </FormLabel>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={config.produto_em_grade || false} 
                          onChange={(e) => handleInputChange('produto_em_grade', e.target.checked)} 
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Habilitar Produto em Grade
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Permite cadastrar variações (Tamanho e Cor) em lote no cadastro de produtos.
                          </Typography>
                        </Box>
                      }
                    />
                  </FormGroup>
                </FormControl>
              </Paper>
            </Grid>

            {/* Configuração de Materiais de Construção */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                    <InventoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Materiais de Construção
                  </FormLabel>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={config.material_construcao || false} 
                          onChange={(e) => handleInputChange('material_construcao', e.target.checked)} 
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Habilitar Campos de Materiais de Construção
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Adiciona aba com campos específicos: metragem por caixa, rendimento m², peso unitário, variações, etc.
                          </Typography>
                        </Box>
                      }
                    />
                  </FormGroup>
                </FormControl>
              </Paper>
            </Grid>

            {/* Sugestão de Tributação Padrão */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Paper elevation={2} sx={{ p: 3, bgcolor: '#eef2ff', border: '1px solid #c5cae9' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#283593' }}>
                  <TaxIcon sx={{ color: '#283593' }} />
                  Sugestão de Tributação Padrão
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  💡 Ao cadastrar um <strong>novo produto</strong>, estes valores serão pré-preenchidos automaticamente na aba de Tributação. Deixe em branco para não sugerir.
                </Typography>

                {/* Importar a partir de um perfil da aba Tributação */}
                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#e8eaf6', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="body2" fontWeight="bold" color="#283593" sx={{ whiteSpace: 'nowrap' }}>
                    Importar perfil ICMS:
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Perfil de Tributação</InputLabel>
                    <Select
                      value={perfilSelecionado}
                      onChange={(e) => aplicarPerfilTributacao(e.target.value)}
                      label="Perfil de Tributação"
                    >
                      <MenuItem value=""><em>{tiposTributacao.length === 0 ? 'Nenhum perfil cadastrado na aba Tributação' : 'Selecione para importar…'}</em></MenuItem>
                      {tiposTributacao.map((t) => (
                        <MenuItem key={t.id} value={t.id}>{t.nome}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary">
                    Preenche automaticamente CFOP, CST/CSOSN abaixo
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {/* Linha 1: CFOP e Classificação */}
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth size="small"
                      label="CFOP Padrão"
                      value={config.trib_cfop}
                      onChange={(e) => handleInputChange('trib_cfop', e.target.value)}
                      placeholder="Ex: 5102"
                      helperText="CFOP de saída do produto"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth size="small"
                      label="Classificação Fiscal"
                      value={config.trib_classificacao_fiscal}
                      onChange={(e) => handleInputChange('trib_classificacao_fiscal', e.target.value)}
                      placeholder="Ex: Revenda, Consumo"
                      helperText="Classificação padrão"
                    />
                  </Grid>

                  {/* Linha 2: ICMS */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" color="#283593" sx={{ mt: 1 }}>ICMS</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth size="small"
                      label="CST ICMS"
                      value={config.trib_cst_icms}
                      onChange={(e) => handleInputChange('trib_cst_icms', e.target.value)}
                      placeholder="Ex: 00"
                      helperText="Lucro Presumido/Real"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth size="small"
                      label="CSOSN"
                      value={config.trib_csosn}
                      onChange={(e) => handleInputChange('trib_csosn', e.target.value)}
                      placeholder="Ex: 400"
                      helperText="Simples Nacional"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth size="small" type="number"
                      label="Alíquota ICMS (%)"
                      value={config.trib_icms_aliquota}
                      onChange={(e) => handleInputChange('trib_icms_aliquota', e.target.value)}
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                    />
                  </Grid>

                  {/* Linha 3: IPI */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" color="#283593" sx={{ mt: 1 }}>IPI</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth size="small"
                      label="CST IPI"
                      value={config.trib_cst_ipi}
                      onChange={(e) => handleInputChange('trib_cst_ipi', e.target.value)}
                      placeholder="Ex: 99"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth size="small" type="number"
                      label="Alíquota IPI (%)"
                      value={config.trib_ipi_aliquota}
                      onChange={(e) => handleInputChange('trib_ipi_aliquota', e.target.value)}
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                    />
                  </Grid>

                  {/* Linha 4: PIS / COFINS */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" color="#283593" sx={{ mt: 1 }}>PIS / COFINS</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth size="small"
                      label="CST PIS/COFINS"
                      value={config.trib_cst_pis_cofins}
                      onChange={(e) => handleInputChange('trib_cst_pis_cofins', e.target.value)}
                      placeholder="Ex: 07"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth size="small" type="number"
                      label="Alíquota PIS (%)"
                      value={config.trib_pis_aliquota}
                      onChange={(e) => handleInputChange('trib_pis_aliquota', e.target.value)}
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth size="small" type="number"
                      label="Alíquota COFINS (%)"
                      value={config.trib_cofins_aliquota}
                      onChange={(e) => handleInputChange('trib_cofins_aliquota', e.target.value)}
                      inputProps={{ min: 0, max: 100, step: 0.01 }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Botão Salvar */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  size="large"
                >
                  Salvar Configuração
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProdutoConfig;
