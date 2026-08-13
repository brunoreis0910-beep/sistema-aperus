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
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DevolucaoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { axiosInstance } = useAuth();
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

    // Auto-carregar documento caso fornecido via estado da navegação (ex: vindo da aba NFe)
    if (location.state?.documentoId) {
      const docIdStr = String(location.state.documentoId);
      const tipoStr = location.state.tipoDevolucao || 'venda';
      setDocumentoId(docIdStr);
      setTipoDevolucao(tipoStr);
      executarBuscaDireta(docIdStr, tipoStr);
    }
  }, [location.state]);

  const executarBuscaDireta = async (targetId, targetTipo) => {
    if (!targetId) return;
    setLoading(true);
    setError('');
    
    try {
      const client = axiosInstance || axios;
      const primaryEndpoint = targetTipo === 'venda' 
        ? `/devolucoes/buscar_venda/${targetId}/`
        : `/devolucoes/buscar_compra/${targetId}/`;
      
      const secondaryEndpoint = targetTipo === 'venda'
        ? `/devolucoes/buscar_compra/${targetId}/`
        : `/devolucoes/buscar_venda/${targetId}/`;

      let response;
      try {
        response = await client.get(primaryEndpoint);
      } catch (e1) {
        try {
          response = await client.get(secondaryEndpoint);
          setTipoDevolucao(targetTipo === 'venda' ? 'compra' : 'venda');
        } catch (e2) {
          throw e1;
        }
      }

      setDocumentoData(response.data);
      const itensIniciais = (response.data.itens || []).map(item => ({
        ...item,
        quantidade_devolver: 0,
        selecionado: false,
        motivo_item: ''
      }));
      setItensSelecionados(itensIniciais);
      
      if (itensIniciais.length === 0) {
        setError('Documento encontrado, mas não possui itens disponíveis para devolução.');
      } else {
        setActiveStep(1);
      }
    } catch (err) {
      console.error('Erro na busca direta do documento:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || `Nenhum documento encontrado com o ID "${targetId}".`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };
  
  const carregarOperacoes = async () => {
    try {
      const response = await (axiosInstance || axios).get('/devolucoes/operacoes/', {
        params: { tipo: 'devolucao' }
      }).catch(() => (axiosInstance || axios).get('/operacoes/', { params: { tipo: 'devolucao' } }));
      
      const _d = response?.data;
      setOperacoes(Array.isArray(_d) ? _d : Array.isArray(_d?.results) ? _d.results : []);
    } catch (err) {
      console.error('Erro ao carregar operações:', err);
    }
  };
  
  const buscarDocumento = async () => {
    if (!documentoId) {
      setError('Informe o número ou ID do documento');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const client = axiosInstance || axios;
      const primaryEndpoint = tipoDevolucao === 'venda' 
        ? `/devolucoes/buscar_venda/${documentoId}/`
        : `/devolucoes/buscar_compra/${documentoId}/`;
      
      const secondaryEndpoint = tipoDevolucao === 'venda'
        ? `/devolucoes/buscar_compra/${documentoId}/`
        : `/devolucoes/buscar_venda/${documentoId}/`;

      let response;
      try {
        response = await client.get(primaryEndpoint);
      } catch (e1) {
        try {
          response = await client.get(secondaryEndpoint);
          setTipoDevolucao(tipoDevolucao === 'venda' ? 'compra' : 'venda');
        } catch (e2) {
          throw e1;
        }
      }

      setDocumentoData(response.data);
      
      // Inicializar itens selecionados
      const itensIniciais = (response.data.itens || []).map(item => ({
        ...item,
        quantidade_devolver: 0,
        selecionado: false,
        motivo_item: ''
      }));
      setItensSelecionados(itensIniciais);
      
      if (itensIniciais.length === 0) {
        setError('Documento encontrado, mas não possui itens disponíveis para devolução.');
      } else {
        setActiveStep(1);
      }
    } catch (err) {
      console.error('Erro ao buscar documento:', err);
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Nenhum documento encontrado com o número/ID informado.';
      setError(msg);
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
      
      const client = axiosInstance || axios;
      let response;
      try {
        response = await client.post('/devolucoes/', dados);
      } catch (e1) {
        response = await client.post('/api/devolucoes/', dados);
      }
      
      setSuccess(`Devolução ${response.data.numero_devolucao || response.data.id} criada com sucesso!`);
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/devolucoes');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Erro ao criar devolução');
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
            required
            label={tipoDevolucao === 'venda' ? 'Chave de Acesso (44 dígitos), ID ou Nº da Nota' : 'Chave de Acesso da NF-e (44 dígitos), ID ou Nº da Compra'}
            placeholder="Cole a Chave de Acesso (44 dígitos), ID ou Nº do Documento"
            helperText="Cole a Chave de Acesso da NF-e de Origem (44 dígitos), a ID ou o Nº do Documento"
            value={documentoId}
            onChange={(e) => setDocumentoId(e.target.value)}
            InputProps={{
              endAdornment: (
                <IconButton onClick={buscarDocumento} disabled={loading} color="primary">
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
          <Card sx={{ mb: 3, bgcolor: '#f4f6f9', borderLeft: '4px solid #1976d2' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                {tipoDevolucao === 'venda' ? '📄 Dados da Venda / NF-e de Origem' : '📦 Dados da Compra / Fornecedor'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Nº Documento / Nota:</strong> {documentoData.numero_documento || documentoData.numero_nota || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>ID Interna:</strong> #{documentoData.id_compra || documentoData.id_venda}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Data:</strong> {documentoData.data_compra || documentoData.data_venda ? new Date(documentoData.data_compra || documentoData.data_venda).toLocaleDateString('pt-BR') : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{tipoDevolucao === 'venda' ? 'Cliente' : 'Fornecedor'}:</strong> {documentoData.nome_fornecedor || documentoData.nome_cliente || 'N/A'}
                  </Typography>
                  {(documentoData.doc_fornecedor || documentoData.cpf_cnpj_cliente) && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>CNPJ / CPF:</strong> {documentoData.doc_fornecedor || documentoData.cpf_cnpj_cliente}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    <strong>Valor Total:</strong> R$ {parseFloat(documentoData.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="primary" fontWeight="bold">
                    🔑 Chave de Acesso de Origem (SEFAZ):
                  </Typography>
                  <Typography variant="caption" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', bgcolor: '#fff', p: 0.5, borderRadius: 1, border: '1px solid #e0e0e0', display: 'block', mt: 0.5 }}>
                    {documentoData.chave_nfe_origem || documentoData.chave_nfe || 'Chave não informada / Nota interna'}
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
        
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Operação Fiscal (Emissão de Nota Fiscal Modelo 55)"
            value={operacaoId}
            onChange={(e) => setOperacaoId(e.target.value)}
            helperText="Selecione a Operação Modelo 55 para emitir NF-e Fiscal de Devolução"
          >
            <MenuItem value="">Nenhuma (Devolução Apenas Gerencial Interna)</MenuItem>
            {operacoes
              .filter(op => {
                const trans = (op.transacao || op.tipo_transacao || op.tipo || '').toLowerCase();
                const mod = String(op.modelo_documento || op.modelo_nf || '');
                return mod === '55' || trans.includes('devoluc');
              })
              .map((op) => (
                <MenuItem key={op.id_operacao} value={op.id_operacao}>
                  {op.nome_operacao || op.nome} {op.modelo_documento ? `(NF-e Mod. ${op.modelo_documento})` : ''}
                </MenuItem>
              ))}
          </TextField>
        </Grid>
        
        {tipoDevolucao === 'venda' && (
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
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
            
            {/* Barra de Ações Inferior Fixa e Destacada */}
            <Box sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              mt: 4,
              p: 2,
              bgcolor: '#ffffff',
              borderTop: '2px solid #1976d2',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
              borderRadius: '0 0 8px 8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<ArrowBack />}
                disabled={activeStep === 0 || loading}
                onClick={voltarPasso}
                sx={{ textTransform: 'none', minWidth: 130, fontWeight: 600 }}
              >
                Voltar
              </Button>
              
              <Box>
                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={proximoPasso}
                    disabled={loading}
                    sx={{ textTransform: 'none', minWidth: 140, fontWeight: 700, px: 3 }}
                  >
                    Próximo Passo
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<CheckCircle />}
                    onClick={finalizarDevolucao}
                    disabled={loading}
                    sx={{ textTransform: 'none', minWidth: 180, fontWeight: 700, px: 3 }}
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
