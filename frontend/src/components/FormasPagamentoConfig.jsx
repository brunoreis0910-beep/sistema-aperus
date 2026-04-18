import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  IconButton,
  Avatar,
  CircularProgress,
  Backdrop,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const FormasPagamentoConfig = () => {
  const { axiosInstance } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Listas auxiliares para os Selects
  const [departamentos, setDepartamentos] = useState([]);
  const [centrosCusto, setCentrosCusto] = useState([]);
  const [contasBancarias, setContasBancarias] = useState([]);

  const [currentForma, setCurrentForma] = useState({
    id_forma_pagamento: null,
    nome_forma: '',
    dias_vencimento: 0,
    id_conta_padrao: null,
    id_centro_custo: null,
    id_departamento: null,
    taxa_operadora: 0.00,
    dias_repasse: 1
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // Carregar formas de pagamento e listas auxiliares em paralelo
      const [formasResp, depResp, ccResp, cbResp] = await Promise.all([
        axiosInstance.get('/formas-pagamento/').catch(err => ({ data: [] })),
        axiosInstance.get('/departamentos/').catch(err => ({ data: [] })),
        axiosInstance.get('/centro-custo/').catch(err => ({ data: [] })),
        axiosInstance.get('/contas-bancarias/').catch(err => ({ data: [] }))
      ]);

      console.log('Resposta da API formas-pagamento:', formasResp.data);

      // Garantir que sempre seja array, tratando resposta paginada
      let formasData = Array.isArray(formasResp.data) 
        ? formasResp.data 
        : (formasResp.data?.results || []);
      let depData = Array.isArray(depResp.data) 
        ? depResp.data 
        : (depResp.data?.results || []);
      let ccData = Array.isArray(ccResp.data) 
        ? ccResp.data 
        : (ccResp.data?.results || []);
      let cbData = Array.isArray(cbResp.data) 
        ? cbResp.data 
        : (cbResp.data?.results || []);

      setFormasPagamento(formasData);
      setDepartamentos(depData);
      setCentrosCusto(ccData);
      setContasBancarias(cbData);

      console.log('Dados carregados:', {
        formas: formasData.length,
        departamentos: depData.length,
        centros: ccData.length,
        contas: cbData.length
      });

      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados de configuração');
    } finally {
      setLoading(false);
    }
  };

  // Funçéµes auxiliares para buscar nomes
  const getNomeDepartamento = (id) => {
    if (!id) return 'N/A';
    const dep = departamentos.find(d => d.id_departamento === id);
    return dep ? dep.nome_departamento : `ID: ${id}`;
  };

  const getNomeCentroCusto = (id) => {
    if (!id) return 'N/A';
    const cc = centrosCusto.find(c => c.id_centro_custo === id);
    return cc ? cc.nome_centro_custo : `ID: ${id}`;
  };

  const getNomeContaBancaria = (id) => {
    if (!id) return 'N/A';
    const cb = contasBancarias.find(c => c.id_conta_bancaria === id);
    return cb ? cb.nome_conta : `ID: ${id}`;
  };

  const handleInputChange = (field, value) => {
    setCurrentForma(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const dadosParaEnvio = {
        nome_forma: currentForma.nome_forma,
        dias_vencimento: parseInt(currentForma.dias_vencimento) || 0,
        id_conta_padrao: currentForma.id_conta_padrao || null,
        id_centro_custo: currentForma.id_centro_custo || null,
        id_departamento: currentForma.id_departamento || null,
        taxa_operadora: parseFloat(currentForma.taxa_operadora) || 0.00,
        dias_repasse: parseInt(currentForma.dias_repasse) || 1
      };

      console.log('Dados da forma de pagamento que serão enviados:', dadosParaEnvio);

      if (isEditing && currentForma.id_forma_pagamento) {
        await axiosInstance.patch(`/formas-pagamento/${currentForma.id_forma_pagamento}/`, dadosParaEnvio);
        console.log(' Forma de pagamento atualizada via API');
      } else {
        await axiosInstance.post('/formas-pagamento/', dadosParaEnvio);
        console.log(' Nova forma de pagamento criada via API');
      }

      setOpenDialog(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setError(null);

      await carregarDados();

    } catch (err) {
      console.error('Erro ao salvar forma de pagamento:', err);
      console.error('Detalhes do erro:', err.response?.data);
      setError('Erro ao salvar forma de pagamento: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (forma) => {
    setCurrentForma(forma);
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleNew = () => {
    setCurrentForma({
      id_forma_pagamento: null,
      nome_forma: '',
      dias_vencimento: 0,
      id_conta_padrao: null,
      id_centro_custo: null,
      id_departamento: null,
      taxa_operadora: 0.00,
      dias_repasse: 1
    });
    setIsEditing(false);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta forma de pagamento?')) {
      try {
        setLoading(true);
        await axiosInstance.delete(`/formas-pagamento/${id}/`);
        console.log('Forma de pagamento excluída');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        await carregarDados();
      } catch (err) {
        console.error('Erro ao excluir forma de pagamento:', err);
        setError('Erro ao excluir forma de pagamento: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Forma de pagamento salva com sucesso!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <PaymentIcon />
            </Avatar>
          }
          title="configuração de Formas de Pagamento"
          subheader="Gerencie as formas de pagamento do sistema"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNew}
            >
              Nova Forma de Pagamento
            </Button>
          }
        />

        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Nome</strong></TableCell>
                  <TableCell><strong>Dias Venc.</strong></TableCell>
                  <TableCell><strong>Taxa (%)</strong></TableCell>
                  <TableCell><strong>D+</strong></TableCell>
                  <TableCell><strong>Conta</strong></TableCell>
                  <TableCell><strong>Departamento</strong></TableCell>
                  <TableCell><strong>Centro de Custo</strong></TableCell>
                  <TableCell><strong>Açéµes</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : formasPagamento.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma forma de pagamento cadastrada
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  Array.isArray(formasPagamento) && formasPagamento.map((forma) => (
                    <TableRow key={forma.id_forma_pagamento} hover>
                    <TableCell>{forma.id_forma_pagamento}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {forma.nome_forma}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${forma.dias_vencimento} dias`}
                        color={forma.dias_vencimento > 0 ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {forma.taxa_operadora > 0 ? (
                        <Chip
                          label={`${parseFloat(forma.taxa_operadora).toFixed(2)}%`}
                          color="info"
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {forma.taxa_operadora > 0 ? (
                        <Chip
                          label={`D+${forma.dias_repasse || 1}`}
                          color="secondary"
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    {/* <TableCell>{forma.quantidade_dias} dias</TableCell> */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getNomeContaBancaria(forma.id_conta_padrao)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getNomeDepartamento(forma.id_departamento)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {getNomeCentroCusto(forma.id_centro_custo)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(forma)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(forma.id_forma_pagamento)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog para Editar/Criar Forma de Pagamento */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome da Forma de Pagamento"
                value={currentForma.nome_forma}
                onChange={(e) => handleInputChange('nome_forma', e.target.value)}
                variant="outlined"
                required
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Dias para Vencimento"
                type="number"
                value={currentForma.dias_vencimento}
                onChange={(e) => handleInputChange('dias_vencimento', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Taxa Operadora (%)"
                type="number"
                value={currentForma.taxa_operadora}
                onChange={(e) => handleInputChange('taxa_operadora', e.target.value)}
                variant="outlined"
                inputProps={{ min: 0, max: 99.99, step: 0.01 }}
                helperText="Taxa do cartão (ex: 1.5, 3.5)"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Dias Repasse (D+X)"
                type="number"
                value={currentForma.dias_repasse}
                onChange={(e) => handleInputChange('dias_repasse', e.target.value)}
                variant="outlined"
                inputProps={{ min: 0, max: 365 }}
                helperText="Prazo de recebimento (ex: 1, 30)"
              />
            </Grid>

            {/* <Grid item xs={12} md={3}> */}
            {/* <TextField */}
            {/* fullWidth */}
            {/* label="Quantidade de Dias" */}
            {/* type="number" */}
            {/* value={currentForma.quantidade_dias} */}
            {/* onChange={(e) => handleInputChange('quantidade_dias', e.target.value)} */}
            {/* variant="outlined" */}
            {/* /> */}
            {/* </Grid> */}
            {/*  */}
            {/* Select para Conta Bancéria */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Conta Bancéria Padréo</InputLabel>
                <Select
                  value={currentForma.id_conta_padrao || ''}
                  onChange={(e) => handleInputChange('id_conta_padrao', e.target.value || null)}
                  label="Conta Bancéria Padréo"
                >
                  <MenuItem value="">
                    <em>Nenhuma</em>
                  </MenuItem>
                  {Array.isArray(contasBancarias) && contasBancarias.map((cb) => (
                    <MenuItem key={cb.id_conta_bancaria} value={cb.id_conta_bancaria}>
                      {cb.nome_conta}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Select para Centro de Custo */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Centro de Custo Padréo</InputLabel>
                <Select
                  value={currentForma.id_centro_custo || ''}
                  onChange={(e) => handleInputChange('id_centro_custo', e.target.value || null)}
                  label="Centro de Custo Padréo"
                >
                  <MenuItem value="">
                    <em>Nenhum</em>
                  </MenuItem>
                  {Array.isArray(centrosCusto) && centrosCusto.map((cc) => (
                    <MenuItem key={cc.id_centro_custo} value={cc.id_centro_custo}>
                      {cc.nome_centro_custo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Select para Departamento */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Departamento Padréo</InputLabel>
                <Select
                  value={currentForma.id_departamento || ''}
                  onChange={(e) => handleInputChange('id_departamento', e.target.value || null)}
                  label="Departamento Padréo"
                >
                  <MenuItem value="">
                    <em>Nenhum</em>
                  </MenuItem>
                  {Array.isArray(departamentos) && departamentos.map((dep) => (
                    <MenuItem key={dep.id_departamento} value={dep.id_departamento}>
                      {dep.nome_departamento}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FormasPagamentoConfig;












