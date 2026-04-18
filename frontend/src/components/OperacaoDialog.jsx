import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Grid,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Tabs, Tab, Divider,
  FormControlLabel, Checkbox, Autocomplete
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import TabPanel from './TabPanel';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005') + '/api';

function OperacaoDialog({
  open,
  onClose,
  onSaveSuccess,
  operacaoToEdit,
  empresas
}) {
  console.log('🔥 OPERACAO DIALOG v3 - COM SCROLL HABILITADO! 🔥');
  const { axiosInstance } = useAuth();

  const [depositos, setDepositos] = useState([]);
  const [loadingDepositos, setLoadingDepositos] = useState(false);
  const [numeracoes, setNumeracoes] = useState([]);

  const [operacaoFormData, setOperacaoFormData] = useState({
    nome_operacao: '',
    empresa: '',
    transacao: 'Saida',
    modelo_documento: '55',
    emitente: 'Proprio',
    usa_auto_numeracao: false,
    serie_nf: 1,
    proximo_numero_nf: 1,
    tipo_estoque_baixa: 'Nenhum',
    id_deposito_baixa: '',
    tipo_estoque_incremento: 'Nenhum',
    id_deposito_incremento: '',
    gera_financeiro: false,
    validacao_limite_credito: 'nao_validar',
    validar_atraso: false,
    dias_atraso_tolerancia: 0,
    acao_atraso: 'alertar',
    entrega_futura: false,
    limite_desconto_percentual: 0,
    id_numeracao: '',
    ind_faturamento: false,
    validar_estoque_fiscal: false
  });

  const [savingOperacao, setSavingOperacao] = useState(false);
  const [operacaoTabValue, setOperacaoTabValue] = useState(0);

  // Carregar depósitos
  useEffect(() => {
    if (!open) return;

    const fetchDepositos = async () => {
      setLoadingDepositos(true);
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/depositos/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDepositos(response.data || []);
      } catch (err) {
        console.error('Erro ao carregar depósitos:', err);
        setDepositos([]);
      } finally {
        setLoadingDepositos(false);
      }
    };

    fetchDepositos();
  }, [open]);

  // Carregar numerações
  useEffect(() => {
    if (!open) return;
    const token = sessionStorage.getItem('token');
    axios.get(`${API_BASE_URL}/numeracoes/`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setNumeracoes(res.data || [])).catch(() => setNumeracoes([]));
  }, [open]);

  // Carregar dados quando o popup abre
  useEffect(() => {
    setOperacaoTabValue(0);
    if (operacaoToEdit) {
      let empresaValue = '';
      if (operacaoToEdit.empresa !== undefined && operacaoToEdit.empresa !== null) {
        if (typeof operacaoToEdit.empresa === 'number') {
          empresaValue = operacaoToEdit.empresa;
        } else if (typeof operacaoToEdit.empresa === 'string') {
          const found = (empresas || []).find(
            e => e.nome_razao_social === operacaoToEdit.empresa || String(e.id_empresa) === operacaoToEdit.empresa
          );
          empresaValue = found ? found.id_empresa : '';
        }
      }

      // Determinar tipo_estoque_baixa baseado no id_deposito_baixa
      let tipoBaixa = 'Nenhum';
      if (operacaoToEdit.id_deposito_baixa) {
        tipoBaixa = 'Deposito';
      } else if (operacaoToEdit.tipo_estoque_baixa && operacaoToEdit.tipo_estoque_baixa !== 'Nenhum') {
        tipoBaixa = 'Deposito';
      }

      // Determinar tipo_estoque_incremento baseado no id_deposito_incremento
      let tipoIncremento = 'Nenhum';
      if (operacaoToEdit.id_deposito_incremento || operacaoToEdit.incrementar_estoque) {
        tipoIncremento = 'Deposito';
      }

      setOperacaoFormData({
        nome_operacao: operacaoToEdit.nome_operacao || '',
        empresa: empresaValue,
        transacao: operacaoToEdit.transacao || 'Saida',
        modelo_documento: operacaoToEdit.modelo_documento || '55',
        emitente: operacaoToEdit.emitente === 'Terceiro' ? 'Terceiros' : (operacaoToEdit.emitente || 'Proprio'),
        usa_auto_numeracao: Boolean(operacaoToEdit.usa_auto_numeracao),
        serie_nf: operacaoToEdit.serie_nf || 1,
        proximo_numero_nf: operacaoToEdit.proximo_numero_nf || 1,
        tipo_estoque_baixa: tipoBaixa,
        id_deposito_baixa: operacaoToEdit.id_deposito_baixa ? String(operacaoToEdit.id_deposito_baixa) : '',
        tipo_estoque_incremento: tipoIncremento,
        id_deposito_incremento: operacaoToEdit.id_deposito_incremento ? String(operacaoToEdit.id_deposito_incremento) : '',
        gera_financeiro: Boolean(operacaoToEdit.gera_financeiro),
        validacao_limite_credito: operacaoToEdit.validacao_limite_credito || 'nao_validar',
        validar_atraso: Boolean(operacaoToEdit.validar_atraso),
        dias_atraso_tolerancia: operacaoToEdit.dias_atraso_tolerancia || 0,
        acao_atraso: operacaoToEdit.acao_atraso || 'alertar',
        entrega_futura: Boolean(operacaoToEdit.entrega_futura),
        limite_desconto_percentual: operacaoToEdit.limite_desconto_percentual || 0,
        id_numeracao: operacaoToEdit.id_numeracao || ''
      });
    } else {
      setOperacaoFormData({
        nome_operacao: '',
        empresa: '',
        transacao: 'Saida',
        modelo_documento: '55',
        emitente: 'Proprio',
        usa_auto_numeracao: false,
        serie_nf: 1,
        proximo_numero_nf: 1,
        tipo_estoque_baixa: 'Nenhum',
        id_deposito_baixa: '',
        tipo_estoque_incremento: 'Nenhum',
        id_deposito_incremento: '',
        gera_financeiro: false,
        validacao_limite_credito: 'nao_validar',
        validar_atraso: false,
        dias_atraso_tolerancia: 0,
        acao_atraso: 'alertar',
        entrega_futura: false,
        limite_desconto_percentual: 0,
        id_numeracao: ''
      });
    }
  }, [operacaoToEdit, open, empresas]);

  const handleOperacaoFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setOperacaoFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOperacaoTabChange = (event, newValue) => {
    setOperacaoTabValue(newValue);
  };

  const handleSaveOperacao = async (event) => {
    event.preventDefault();

    if (!operacaoFormData.nome_operacao || operacaoFormData.nome_operacao.trim() === '') {
      alert('Nome da Operação é obrigatório.');
      return;
    }

    setSavingOperacao(true);

    const data = {
      nome_operacao: operacaoFormData.nome_operacao,
      empresa: operacaoFormData.empresa || null,
      transacao: operacaoFormData.transacao,
      modelo_documento: operacaoFormData.modelo_documento || '55',
      emitente: operacaoFormData.emitente || 'Proprio',
      usa_auto_numeracao: operacaoFormData.usa_auto_numeracao ? 1 : 0,
      serie_nf: operacaoFormData.serie_nf || 1,
      proximo_numero_nf: operacaoFormData.proximo_numero_nf || 1,
      gera_financeiro: operacaoFormData.gera_financeiro ? 1 : 0,
      validacao_limite_credito: operacaoFormData.validacao_limite_credito || 'nao_validar',
      validar_atraso: operacaoFormData.validar_atraso ? true : false,
      dias_atraso_tolerancia: Number(operacaoFormData.dias_atraso_tolerancia) || 0,
      acao_atraso: operacaoFormData.acao_atraso || 'alertar',
      limite_desconto_percentual: parseFloat(operacaoFormData.limite_desconto_percentual) || 0,
      id_numeracao: operacaoFormData.id_numeracao || null
    };

    // Campo tipo_estoque_baixa
    if (operacaoFormData.tipo_estoque_baixa === 'Deposito' && operacaoFormData.id_deposito_baixa) {
      data.tipo_estoque_baixa = 'Gerencial';
      data.id_deposito_baixa = Number(operacaoFormData.id_deposito_baixa);
    } else {
      data.tipo_estoque_baixa = 'Nenhum';
      data.id_deposito_baixa = null;
    }

    // Campo tipo_estoque_incremento
    if (operacaoFormData.tipo_estoque_incremento === 'Deposito' && operacaoFormData.id_deposito_incremento) {
      data.tipo_estoque_incremento = 'Gerencial';
      data.id_deposito_incremento = Number(operacaoFormData.id_deposito_incremento);
      data.incrementar_estoque = 1;
    } else {
      data.tipo_estoque_incremento = 'Nenhum';
      data.id_deposito_incremento = null;
      data.incrementar_estoque = 0;
    }

    console.log('Enviando dados:', data);

    try {
      if (operacaoToEdit) {
        await axiosInstance.put(`/operacoes/${operacaoToEdit.id_operacao}/`, data);
        alert('Operação atualizada com sucesso!');
      } else {
        await axiosInstance.post('/operacoes/', data);
        alert('Operação criada com sucesso!');
      }
      onSaveSuccess && onSaveSuccess();
      onClose && onClose();
    } catch (error) {
      console.error('Erro ao salvar operação:', error);
      if (error.response) {
        const errorMsg = typeof error.response.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response.data, null, 2);
        alert(`Erro ao salvar operação (status ${error.response.status}):\n\n${errorMsg}`);
      } else {
        alert(`Erro ao salvar operação: ${error.message}`);
      }
    } finally {
      setSavingOperacao(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {operacaoToEdit ? `Editar Operação: ${operacaoToEdit.nome_operacao}` : 'Adicionar Nova Operação'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSaveOperacao}>
        <DialogContent sx={{ p: 0, maxHeight: '70vh', overflow: 'auto' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
            <Tabs value={operacaoTabValue} onChange={handleOperacaoTabChange}>
              <Tab label="Configurações" />
              <Tab label="Numeração e Estoque" />
              <Tab label="Entrega Futura" />
            </Tabs>
          </Box>

          {/* Tab 1: Configurações */}
          <TabPanel value={operacaoTabValue} index={0}>
            <Grid container spacing={2}>
              {/* ALERTA DE VERSÃO ATUALIZADA */}
              <Grid item xs={12}>
                <Box sx={{
                  p: 2,
                  bgcolor: 'success.main',
                  color: 'white',
                  borderRadius: 2,
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}>
                  ✅ VERSÃO ATUALIZADA v2.0 - Campo Limite de Crédito disponível!
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  autoFocus
                  name="nome_operacao"
                  label="Nome da Operação"
                  value={operacaoFormData.nome_operacao}
                  onChange={handleOperacaoFormChange}
                  disabled={savingOperacao}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="op-empresa-label">Empresa (Opcional)</InputLabel>
                  <Select
                    labelId="op-empresa-label"
                    name="empresa"
                    value={operacaoFormData.empresa}
                    label="Empresa (Opcional)"
                    onChange={handleOperacaoFormChange}
                    disabled={savingOperacao}
                  >
                    <MenuItem value=""><em>Nenhuma (Padréo)</em></MenuItem>
                    {(empresas || []).map((emp) => (
                      <MenuItem key={emp.id_empresa} value={emp.id_empresa}>
                        {emp.nome_razao_social || emp.nome_fantasia || `Empresa ${emp.id_empresa}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="op-transacao-label">Transação</InputLabel>
                  <Select
                    labelId="op-transacao-label"
                    name="transacao"
                    value={operacaoFormData.transacao}
                    label="Transação"
                    onChange={handleOperacaoFormChange}
                    disabled={savingOperacao}
                  >
                    <MenuItem value="Entrada">Entrada</MenuItem>
                    <MenuItem value="Saida">Saída</MenuItem>
                    <MenuItem value="DevEntrada">Devolução Entrada</MenuItem>
                    <MenuItem value="DevSaida">Devolução Saída</MenuItem>
                    <MenuItem value="TransfEntrada">Transferência de Estoque Entrada</MenuItem>
                    <MenuItem value="TransfSaida">Transferência de Estoque Saída</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="modelo_documento"
                  label="Modelo Doc (55, 65, OS, etc)"
                  value={operacaoFormData.modelo_documento}
                  onChange={handleOperacaoFormChange}
                  disabled={savingOperacao}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="op-emitente-label">Emitente</InputLabel>
                  <Select
                    labelId="op-emitente-label"
                    name="emitente"
                    value={operacaoFormData.emitente}
                    label="Emitente"
                    onChange={handleOperacaoFormChange}
                    disabled={savingOperacao}
                  >
                    <MenuItem value="">Selecione...</MenuItem>
                    <MenuItem value="Proprio">Próprio</MenuItem>
                    <MenuItem value="Terceiros">Terceiros</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Validação de Limite de Crédito - PRIMEIRA ABA */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Controle de Limite de Crédito
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Validação de Limite</InputLabel>
                  <Select
                    name="validacao_limite_credito"
                    value={operacaoFormData.validacao_limite_credito || 'nao_validar'}
                    label="Validação de Limite"
                    onChange={handleOperacaoFormChange}
                    disabled={savingOperacao}
                  >
                    <MenuItem value="nao_validar">🔓 Não Validar Limite</MenuItem>
                    <MenuItem value="alertar">⚠️ Alertar Operador</MenuItem>
                    <MenuItem value="bloquear">❌ Bloquear Venda</MenuItem>
                    <MenuItem value="solicitar_senha">🔐 Solicitar Senha Supervisor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {operacaoFormData.validacao_limite_credito === 'nao_validar' && '• Não verifica o limite de crédito'}
                  {operacaoFormData.validacao_limite_credito === 'alertar' && '• Mostra alerta mas permite venda'}
                  {operacaoFormData.validacao_limite_credito === 'bloquear' && '• Bloqueia se ultrapassar limite'}
                  {operacaoFormData.validacao_limite_credito === 'solicitar_senha' && '• Requer autorização de supervisor'}
                  {!operacaoFormData.validacao_limite_credito && '• Não verifica o limite de crédito'}
                </Typography>
              </Grid>

              {/* ENTREGA FUTURA - MOVIDO PARA CIMA */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                  📦 Entrega Futura
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="entrega_futura"
                      checked={Boolean(operacaoFormData.entrega_futura)}
                      onChange={(e) => {
                        console.log('🚀 Checkbox Entrega Futura clicado:', e.target.checked);
                        handleOperacaoFormChange(e);
                      }}
                      disabled={savingOperacao}
                    />
                  }
                  label="Esta operação é para vendas com entrega futura"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" display="block">
                  💡 Quando marcado, a venda NÃO movimenta estoque imediatamente. O estoque só será baixado quando criar uma segunda venda para entrega.
                </Typography>
              </Grid>

              {/* Seção de Validação de Atraso */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Controle de Cliente em Atraso
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="validar_atraso"
                      checked={Boolean(operacaoFormData.validar_atraso)}
                      onChange={handleOperacaoFormChange}
                      disabled={savingOperacao}
                    />
                  }
                  label="Validar Atraso do Cliente?"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  name="dias_atraso_tolerancia"
                  label="Dias de Tolerância"
                  type="number"
                  value={operacaoFormData.dias_atraso_tolerancia || 0}
                  onChange={handleOperacaoFormChange}
                  disabled={savingOperacao || !operacaoFormData.validar_atraso}
                  fullWidth
                  helperText="Quantos dias de atraso tolerar (0 = não tolera)"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth disabled={!operacaoFormData.validar_atraso}>
                  <InputLabel>Ação se em Atraso</InputLabel>
                  <Select
                    name="acao_atraso"
                    value={operacaoFormData.acao_atraso || 'alertar'}
                    label="Ação se em Atraso"
                    onChange={handleOperacaoFormChange}
                    disabled={savingOperacao || !operacaoFormData.validar_atraso}
                  >
                    <MenuItem value="alertar">⚠️ Alertar Operador</MenuItem>
                    <MenuItem value="bloquear">❌ Bloquear Venda</MenuItem>
                    <MenuItem value="solicitar_senha">🔐 Solicitar Senha Supervisor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  {!operacaoFormData.validar_atraso && '• Não verifica títulos em atraso do cliente'}
                  {operacaoFormData.validar_atraso && operacaoFormData.acao_atraso === 'alertar' && '• Mostra alerta mas permite venda'}
                  {operacaoFormData.validar_atraso && operacaoFormData.acao_atraso === 'bloquear' && '• Bloqueia venda se houver títulos em atraso'}
                  {operacaoFormData.validar_atraso && operacaoFormData.acao_atraso === 'solicitar_senha' && '• Solicita senha de supervisor se houver atraso'}
                </Typography>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 2: Numeração e Estoque */}
          <TabPanel value={operacaoTabValue} index={1}>
            <Grid container spacing={2}>
              {/* Seçéo de Numeração */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Numeração de Documentos
                </Typography>
              </Grid>

              {/* NOVO: Seleção de Numeração da tabela numeracao */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="op-numeracao-label">Numeração</InputLabel>
                  <Select
                    labelId="op-numeracao-label"
                    name="id_numeracao"
                    value={operacaoFormData.id_numeracao || ''}
                    label="Numeração"
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const numSelecionada = numeracoes.find(n => n.id_numeracao === selectedId);
                      const proximoNum = numSelecionada ? (parseInt(numSelecionada.numeracao) || 1) : operacaoFormData.proximo_numero_nf;
                      setOperacaoFormData(prev => ({
                        ...prev,
                        id_numeracao: selectedId,
                        proximo_numero_nf: proximoNum
                      }));
                    }}
                    disabled={savingOperacao}
                  >
                    <MenuItem value=""><em>Nenhuma</em></MenuItem>
                    {numeracoes.map((num) => (
                      <MenuItem key={num.id_numeracao} value={num.id_numeracao}>
                        {num.descricao} ({num.numeracao})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="usa_auto_numeracao"
                      checked={Boolean(operacaoFormData.usa_auto_numeracao)}
                      onChange={handleOperacaoFormChange}
                      disabled={savingOperacao}
                    />
                  }
                  label="Usar Auto-Numeração?"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="serie_nf"
                  label="Série Padréo"
                  type="number"
                  value={operacaoFormData.serie_nf}
                  onChange={handleOperacaoFormChange}
                  disabled={savingOperacao}
                  required={operacaoFormData.usa_auto_numeracao}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="proximo_numero_nf"
                  label="Próximo Número"
                  type="number"
                  value={operacaoFormData.proximo_numero_nf}
                  onChange={handleOperacaoFormChange}
                  disabled={savingOperacao || Boolean(operacaoFormData.id_numeracao)}
                  required={operacaoFormData.usa_auto_numeracao}
                  fullWidth
                  helperText={operacaoFormData.id_numeracao ? 'Preenchido pela Numeração selecionada' : ''}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>

              {/* Seçéo de Estoque - BAIXA */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Movimentação de Estoque
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="tipo-baixa-label">Tipo de Baixa de Estoque</InputLabel>
                  <Select
                    labelId="tipo-baixa-label"
                    name="tipo_estoque_baixa"
                    value={operacaoFormData.tipo_estoque_baixa}
                    label="Tipo de Baixa de Estoque"
                    onChange={handleOperacaoFormChange}
                    disabled={savingOperacao}
                  >
                    <MenuItem value="Nenhum">Nenhum (não baixar estoque)</MenuItem>
                    <MenuItem value="Deposito">Baixar de Depósito Específico</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {operacaoFormData.tipo_estoque_baixa === 'Deposito' && (
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={depositos}
                    getOptionLabel={(opt) => opt.nome_deposito || `Depósito ${opt.id_deposito}`}
                    value={depositos.find(d => String(d.id_deposito) === String(operacaoFormData.id_deposito_baixa)) || null}
                    onChange={(e, newValue) => {
                      const newId = newValue ? String(newValue.id_deposito) : '';
                      setOperacaoFormData(prev => ({ ...prev, id_deposito_baixa: newId }));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Depósito para Baixa"
                        placeholder="Selecione o depósito"
                        fullWidth
                        disabled={savingOperacao || loadingDepositos}
                        required
                      />
                    )}
                    loading={loadingDepositos}
                    noOptionsText="Nenhum depósito cadastrado"
                  />
                </Grid>
              )}

              {/* Seçéo de Estoque - INCREMENTO */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="tipo-incremento-label">Tipo de Incremento de Estoque</InputLabel>
                  <Select
                    labelId="tipo-incremento-label"
                    name="tipo_estoque_incremento"
                    value={operacaoFormData.tipo_estoque_incremento}
                    label="Tipo de Incremento de Estoque"
                    onChange={handleOperacaoFormChange}
                    disabled={savingOperacao}
                  >
                    <MenuItem value="Nenhum">Nenhum (não incrementar estoque)</MenuItem>
                    <MenuItem value="Deposito">Incrementar em Depósito Específico</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {operacaoFormData.tipo_estoque_incremento === 'Deposito' && (
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={depositos}
                    getOptionLabel={(opt) => opt.nome_deposito || `Depósito ${opt.id_deposito}`}
                    value={depositos.find(d => String(d.id_deposito) === String(operacaoFormData.id_deposito_incremento)) || null}
                    onChange={(e, newValue) => {
                      const newId = newValue ? String(newValue.id_deposito) : '';
                      setOperacaoFormData(prev => ({ ...prev, id_deposito_incremento: newId }));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Depósito para Incremento"
                        placeholder="Selecione o depósito"
                        fullWidth
                        disabled={savingOperacao || loadingDepositos}
                        required
                      />
                    )}
                    loading={loadingDepositos}
                    noOptionsText="Nenhum depósito cadastrado"
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>

              {/* Financeiro e Controles */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 1, mt: 2 }}>
                  Financeiro e Controles
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="gera_financeiro"
                      checked={Boolean(operacaoFormData.gera_financeiro)}
                      onChange={handleOperacaoFormChange}
                      disabled={savingOperacao}
                    />
                  }
                  label="Gera Financeiro Automático?"
                />
              </Grid>

              {/* NOVO CAMPO: Validação de Limite de Crédito */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                  🔐 Controle de Limite de Crédito
                </Typography>
              </Grid>

              <Grid item xs={12} sm={8}>
                <FormControl fullWidth>
                  <InputLabel id="validacao-limite-label-2">Validação de Limite de Crédito</InputLabel>
                  <Select
                    labelId="validacao-limite-label-2"
                    name="validacao_limite_credito"
                    value={operacaoFormData.validacao_limite_credito || 'nao_validar'}
                    label="Validação de Limite de Crédito"
                    onChange={handleOperacaoFormChange}
                    disabled={savingOperacao}
                  >
                    <MenuItem value="nao_validar">🔓 Não Validar Limite</MenuItem>
                    <MenuItem value="alertar">⚠️ Alertar Operador</MenuItem>
                    <MenuItem value="bloquear">❌ Bloquear Venda</MenuItem>
                    <MenuItem value="solicitar_senha">🔐 Solicitar Senha Supervisor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography
                  variant="body2"
                  sx={{
                    p: 2,
                    bgcolor: 'info.light',
                    color: 'info.contrastText',
                    borderRadius: 1,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {operacaoFormData.validacao_limite_credito === 'nao_validar' && '✓ Não verifica limite'}
                  {operacaoFormData.validacao_limite_credito === 'alertar' && '⚠ Mostra alerta'}
                  {operacaoFormData.validacao_limite_credito === 'bloquear' && '🚫 Bloqueia venda'}
                  {operacaoFormData.validacao_limite_credito === 'solicitar_senha' && '🔑 Pede senha'}
                  {!operacaoFormData.validacao_limite_credito && '✓ Não verifica limite'}
                </Typography>
              </Grid>

              {/* LIMITE DE DESCONTO */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, color: 'warning.dark', fontWeight: 'bold' }}>
                  💸 Aprovação de Desconto via WhatsApp
                </Typography>
              </Grid>

              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  type="number"
                  label="Limite máximo de desconto (%)"
                  name="limite_desconto_percentual"
                  value={operacaoFormData.limite_desconto_percentual || 0}
                  onChange={handleOperacaoFormChange}
                  disabled={savingOperacao}
                  inputProps={{ min: 0, max: 100, step: 0.5 }}
                  InputProps={{ endAdornment: <span style={{ paddingRight: 8 }}>%</span> }}
                  helperText="Desconto acima deste valor exige aprovação do supervisor. 0 = sem restrição."
                />
              </Grid>

              <Grid item xs={12} sm={7}>
                <Typography
                  variant="body2"
                  sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, color: 'warning.contrastText' }}
                >
                  {parseFloat(operacaoFormData.limite_desconto_percentual) > 0
                    ? `⚠️ Descontos acima de ${operacaoFormData.limite_desconto_percentual}% abrirão o modal de aprovação do supervisor (WhatsApp ou senha manual).`
                    : '✓ Sem restrição de desconto — qualquer desconto é permitido sem aprovação.'}
                </Typography>
              </Grid>

              {/* ENTREGA FUTURA */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                  📦 Entrega Futura
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="entrega_futura"
                      checked={Boolean(operacaoFormData.entrega_futura)}
                      onChange={handleOperacaoFormChange}
                      disabled={savingOperacao}
                    />
                  }
                  label="Esta operação é para vendas com entrega futura"
                />
                <Typography variant="caption" display="block" sx={{ ml: 4, mt: 1, color: 'text.secondary' }}>
                  Quando marcado, a venda NÃO movimenta estoque imediatamente. O estoque só será baixado quando uma segunda venda for criada para efetuar a entrega real.
                </Typography>
              </Grid>

              {/* FATURAMENTO AVANÇADO */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2, color: 'success.main', fontWeight: 'bold' }}>
                  📄 Faturamento Avançado
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="ind_faturamento"
                      checked={Boolean(operacaoFormData.ind_faturamento)}
                      onChange={(e) => {
                        console.log('🚀 Checkbox Faturamento clicado:', e.target.checked);
                        handleOperacaoFormChange(e);
                      }}
                      disabled={savingOperacao}
                    />
                  }
                  label="Esta operação é de faturamento (transforma pedidos/cupons em NF-e/NFC-e)"
                />
                <Typography variant="caption" display="block" sx={{ ml: 4, mt: 1, color: 'text.secondary' }}>
                  📋 Marque esta opção para operações que convertem pedidos ou cupons fiscais em notas fiscais (NF-e/NFC-e). Usada no fluxo de faturamento.
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="validar_estoque_fiscal"
                      checked={Boolean(operacaoFormData.validar_estoque_fiscal)}
                      onChange={(e) => {
                        console.log('🚀 Checkbox Validar Estoque Fiscal clicado:', e.target.checked);
                        handleOperacaoFormChange(e);
                      }}
                      disabled={savingOperacao}
                    />
                  }
                  label="Validar estoque fiscal antes de autorizar a emissão"
                />
                <Typography variant="caption" display="block" sx={{ ml: 4, mt: 1, color: 'text.secondary' }}>
                  🔍 Quando marcado, o sistema verifica se há estoque fiscal suficiente antes de emitir a nota. Evita problemas com SEFAZ.
                </Typography>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 3: Entrega Futura */}
          <TabPanel value={operacaoTabValue} index={2}>
            <Grid container spacing={3} sx={{ p: 3 }}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                  📦 Configuração de Entrega Futura
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Configure se esta operação permite vendas com entrega futura, onde o estoque só será movimentado posteriormente.
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="entrega_futura"
                      checked={Boolean(operacaoFormData.entrega_futura)}
                      onChange={(e) => {
                        console.log('🚀 Entrega Futura alterado:', e.target.checked);
                        handleOperacaoFormChange(e);
                      }}
                      disabled={savingOperacao}
                      sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                    />
                  }
                  label={
                    <Typography variant="body1" fontWeight="medium">
                      Esta operação é para vendas com entrega futura
                    </Typography>
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ 
                  p: 3, 
                  bgcolor: operacaoFormData.entrega_futura ? 'success.light' : 'grey.100',
                  borderRadius: 2,
                  border: 1,
                  borderColor: operacaoFormData.entrega_futura ? 'success.main' : 'grey.300'
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                    {operacaoFormData.entrega_futura ? '✅ Entrega Futura ATIVADA' : 'ℹ️ Como Funciona'}
                  </Typography>
                  
                  {operacaoFormData.entrega_futura ? (
                    <>
                      <Typography variant="body2" paragraph>
                        Quando usar esta operação para criar uma venda:
                      </Typography>
                      <Typography variant="body2" component="div">
                        • ✅ A venda será registrada normalmente<br/>
                        • ✅ O financeiro pode ser gerado (se configurado)<br/>
                        • ⚠️ O estoque NÃO será movimentado<br/>
                        • 📦 Posteriormente, crie outra venda para efetuar a entrega real
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" paragraph>
                        <strong>Entrega Futura</strong> permite registrar vendas onde o produto ainda não está disponível para entrega:
                      </Typography>
                      <Typography variant="body2" component="div">
                        1️⃣ <strong>Venda Inicial (Pedido):</strong> Registra a venda e gera financeiro, mas não movimenta estoque<br/>
                        2️⃣ <strong>Venda de Entrega:</strong> Quando o produto chegar, cria-se nova venda que efetivamente baixa o estoque<br/>
                        3️⃣ <strong>Vinculação:</strong> As duas vendas ficam vinculadas para rastreamento
                      </Typography>
                    </>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="caption" color="info.contrastText">
                    💡 <strong>Dica:</strong> Use para vendas de produtos sob encomenda, pré-vendas ou quando o estoque está temporariamente indisponível.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={savingOperacao} startIcon={<CloseIcon />}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={savingOperacao}
            startIcon={savingOperacao ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {savingOperacao ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default OperacaoDialog;
