import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Stepper, Step, StepLabel,
  Button, TextField, MenuItem, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress
} from '@mui/material';
import {
  ArrowBack, Add, Remove, Search, CheckCircle, Cancel
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DevolucaoPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dados da devolução
  const [tipoDevolucao, setTipoDevolucao] = useState('venda'); // venda ou compra
  const [documentoId, setDocumentoId] = useState('');
  const [documentoData, setDocumentoData] = useState(null);
  const [itensSelecionados, setItensSelecionados] = useState([]);
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [gerarCredito, setGerarCredito] = useState(false);
  const [operacaoId, setOperacaoId] = useState('');
  const [operacoes, setOperacoes] = useState([]);
  
  const steps = ['Tipo e Documento', 'Selecionar Itens', 'Detalhes', 'Confirmação'];
  
  useEffect(() => {
    carregarOperacoes();
  }, []);
  
  const carregarOperacoes = async () => {
    try {
      const response = await axios.get('/api/operacoes/', {
        params: { tipo: 'devolucao' }
      });
      const _d = response.data;
      setOperacoes(Array.isArray(_d) ? _d : Array.isArray(_d?.results) ? _d.results : []);
    } catch (err) {
      console.error('Erro ao carregar operações:', err);
    }
  };
  
  const buscarDocumento = async () => {
    if (!documentoId) {
      setError('Informe o número do documento');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const endpoint = tipoDevolucao === 'venda' 
        ? `/api/devolucoes/buscar_venda/${documentoId}/`
        : `/api/devolucoes/buscar_compra/${documentoId}/`;
      
      const response = await axios.get(endpoint);
      setDocumentoData(response.data);
      
      // Inicializar itens selecionados
      const itensIniciais = response.data.itens.map(item => ({
        ...item,
        quantidade_devolver: 0,
        selecionado: false,
        motivo_item: ''
      }));
      setItensSelecionados(itensIniciais);
      
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao buscar documento');
    } finally {
      setLoading(false);
    }
  };
  
  const handleQuantidadeChange = (index, valor) => {
    const novosItens = [...itensSelecionados];
    const item = novosItens[index];
    
    const quantidade = parseFloat(valor) || 0;
    if (quantidade > item.quantidade_disponivel) {
      setError(`Quantidade máxima disponível: ${item.quantidade_disponivel}`);
      return;
    }
    
    item.quantidade_devolver = quantidade;
    item.selecionado = quantidade > 0;
    setItensSelecionados(novosItens);
    setError('');
  };
  
  const handleMotivoItemChange = (index, valor) => {
    const novosItens = [...itensSelecionados];
    novosItens[index].motivo_item = valor;
    setItensSelecionados(novosItens);
  };
  
  const calcularTotal = () => {
    return Array.isArray(itensSelecionados)
      ? itensSelecionados.filter(item => item.selecionado).reduce((total, item) => total + (item.quantidade_devolver * item.valor_unitario), 0)
      : 0;
  };
  
  const validarSelecao = () => {
    const itensSelecionadosValidos = Array.isArray(itensSelecionados) ? itensSelecionados.filter(item => item.selecionado && item.quantidade_devolver > 0) : [];
    
    if (itensSelecionadosValidos.length === 0) {
      setError('Selecione pelo menos um item para devolução');
      return false;
    }
    
    setError('');
    return true;
  };
  
  const proximoPasso = () => {
    if (activeStep === 0) {
      buscarDocumento();
    } else if (activeStep === 1) {
      if (validarSelecao()) {
        setActiveStep(activeStep + 1);
      }
    } else if (activeStep === 2) {
      if (!motivo) {
        setError('Informe o motivo da devolução');
        return;
      }
      if (tipoDevolucao === 'venda' && gerarCredito && !operacaoId) {
        setError('Selecione a operação de devolução');
        return;
      }
      setActiveStep(activeStep + 1);
    }
  };
  
  const voltarPasso = () => {
    setActiveStep(activeStep - 1);
    setError('');
  };
  
  const finalizarDevolucao = async () => {
    setLoading(true);
    setError('');
    
    try {
      const itensParaDevolver = itensSelecionados
        .filter(item => item.selecionado && item.quantidade_devolver > 0)
        .map(item => ({
          id_produto: item.id_produto,
          nome_produto: item.nome_produto,
          codigo_produto: item.codigo_produto,
          quantidade_devolvida: item.quantidade_devolver,
          quantidade_original: item.quantidade_original,
          valor_unitario: item.valor_unitario,
          motivo_item: item.motivo_item || '',
          id_venda_item: item.id_venda_item,
          id_compra_item: item.id_compra_item
        }));
      
      const dados = {
        tipo: tipoDevolucao,
        id_venda: tipoDevolucao === 'venda' ? documentoData.id_venda : null,
        id_compra: tipoDevolucao === 'compra' ? documentoData.id_compra : null,
        id_cliente: documentoData.id_cliente,
        id_fornecedor: documentoData.id_fornecedor,
        id_operacao: operacaoId || null,
        motivo: motivo,
        observacoes: observacoes,
        gerar_credito: tipoDevolucao === 'venda' ? gerarCredito : false,
        itens: itensParaDevolver
      };
      
      const response = await axios.post('/api/devolucoes/', dados);
      
      setSuccess(`Devolução ${response.data.numero_devolucao} criada com sucesso!`);
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/devolucoes');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar devolução');
    } finally {
      setLoading(false);
    }
  };
  
  const renderStep0 = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Tipo de Devolução"
            value={tipoDevolucao}
            onChange={(e) => setTipoDevolucao(e.target.value)}
          >
            <MenuItem value="venda">Devolução de Venda</MenuItem>
            <MenuItem value="compra">Devolução de Compra</MenuItem>
          </TextField>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={tipoDevolucao === 'venda' ? 'ID da Venda' : 'ID da Compra'}
            value={documentoId}
            onChange={(e) => setDocumentoId(e.target.value)}
            type="number"
            InputProps={{
              endAdornment: (
                <IconButton onClick={buscarDocumento} disabled={loading}>
                  <Search />
                </IconButton>
              )
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
  
  const renderStep1 = () => (
    <Box>
      {documentoData && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {tipoDevolucao === 'venda' ? 'Dados da Venda' : 'Dados da Compra'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Documento: {documentoData.numero_documento || documentoData.numero_nota}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Data: {new Date(documentoData.data_venda || documentoData.data_movimento_entrada).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    {tipoDevolucao === 'venda' ? 'Cliente' : 'Fornecedor'}: {documentoData.nome_cliente || documentoData.nome_fornecedor}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Valor Total: R$ {(documentoData.valor_total || documentoData.valor_total_nota).toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Typography variant="h6" gutterBottom>
            Selecione os itens para devolução
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Produto</TableCell>
                  <TableCell align="right">Qtd Original</TableCell>
                  <TableCell align="right">Qtd Devolvida</TableCell>
                  <TableCell align="right">Qtd Disponível</TableCell>
                  <TableCell align="right">Qtd a Devolver</TableCell>
                  <TableCell align="right">Valor Unit.</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Motivo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itensSelecionados.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {item.nome_produto}
                      {item.codigo_produto && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Cód: {item.codigo_produto}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{item.quantidade_original}</TableCell>
                    <TableCell align="right">{item.quantidade_devolvida || 0}</TableCell>
                    <TableCell align="right">{item.quantidade_disponivel}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantidade_devolver}
                        onChange={(e) => handleQuantidadeChange(index, e.target.value)}
                        inputProps={{ min: 0, max: item.quantidade_disponivel, step: 0.001 }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      R$ {item.valor_unitario.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      R$ {(item.quantidade_devolver * item.valor_unitario).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        placeholder="Motivo (opcional)"
                        value={item.motivo_item}
                        onChange={(e) => handleMotivoItemChange(index, e.target.value)}
                        fullWidth
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Typography variant="h6">
              Total a Devolver: R$ {calcularTotal().toFixed(2)}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
  
  const renderStep2 = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="Motivo da Devolução"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            multiline
            rows={4}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Observações"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            multiline
            rows={3}
          />
        </Grid>
        
        {tipoDevolucao === 'venda' && (
          <>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontWeight: 'bold' }}>Gerar Crédito para o Cliente?</Typography>
                <Button
                  variant={gerarCredito ? 'contained' : 'outlined'}
                  color="success"
                  onClick={() => setGerarCredito(true)}
                  sx={{ minWidth: 80 }}
                >
                  Sim
                </Button>
                <Button
                  variant={!gerarCredito ? 'contained' : 'outlined'}
                  color="error"
                  onClick={() => setGerarCredito(false)}
                  sx={{ minWidth: 80 }}
                >
                  Não
                </Button>
              </Box>
            </Grid>
            
            {gerarCredito && (
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Operação de Devolução"
                  value={operacaoId}
                  onChange={(e) => setOperacaoId(e.target.value)}
                >
                  {operacoes.map((op) => (
                    <MenuItem key={op.id_operacao} value={op.id_operacao}>
                      {op.nome_operacao}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
          </>
        )}
      </Grid>
    </Box>
  );
  
  const renderStep3 = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Revise os dados da devolução antes de confirmar
      </Alert>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2">Tipo</Typography>
          <Typography variant="body1" gutterBottom>
            {tipoDevolucao === 'venda' ? 'Devolução de Venda' : 'Devolução de Compra'}
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2">Documento</Typography>
          <Typography variant="body1" gutterBottom>
            {documentoData?.numero_documento || documentoData?.numero_nota}
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2">{tipoDevolucao === 'venda' ? 'Cliente' : 'Fornecedor'}</Typography>
          <Typography variant="body1" gutterBottom>
            {documentoData?.nome_cliente || documentoData?.nome_fornecedor}
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2">Valor Total</Typography>
          <Typography variant="body1" gutterBottom>
            R$ {calcularTotal().toFixed(2)}
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2">Itens</Typography>
          <Typography variant="body2">
            {itensSelecionados.filter(i => i.selecionado).length} item(ns) selecionado(s)
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2">Motivo</Typography>
          <Typography variant="body2">{motivo}</Typography>
        </Grid>
        
        {tipoDevolucao === 'venda' && gerarCredito && (
          <Grid item xs={12}>
            <Alert severity="success">
              Um crédito de R$ {calcularTotal().toFixed(2)} será gerado para o cliente
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/devolucoes')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Nova Devolução</Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeStep === 0 && renderStep0()}
            {activeStep === 1 && renderStep1()}
            {activeStep === 2 && renderStep2()}
            {activeStep === 3 && renderStep3()}
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0 || loading}
                onClick={voltarPasso}
              >
                Voltar
              </Button>
              
              <Box>
                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={proximoPasso}
                    disabled={loading}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={finalizarDevolucao}
                    disabled={loading}
                  >
                    Confirmar Devolução
                  </Button>
                )}
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default DevolucaoPage;
