import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, MenuItem,
  Dialog, DialogTitle, DialogContent, TextField, DialogActions,
  Grid
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { formatCurrency } from '../hooks/useSafeDashboardData';

const AgroContratosPage = () => {
  const { axiosInstance } = useAuth();
  const [contratos, setContratos] = useState([]);
  const [open, setOpen] = useState(false);
  
  // Lists for Selects
  const [safras, setSafras] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);

  const [formData, setFormData] = useState({
    numero_contrato: '',
    id_cliente: '',
    id_safra: '',
    id_produto_destino: '',
    quantidade_negociada: '',
    unidade_medida: 'sc',
    valor_unitario: '',
    data_entrega: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resContratos, resSafras, resClientes, resProdutos] = await Promise.all([
        axiosInstance.get('/contratos-agricolas/'),
        axiosInstance.get('/safras/'),
        axiosInstance.get('/clientes/?page_size=1000'),
        axiosInstance.get('/produtos/?page_size=1000')
      ]);
      
      // Backend Agro retorna arrays diretos (sem paginação)
      setContratos(Array.isArray(resContratos.data) ? resContratos.data : (resContratos.data?.results || []));
      setSafras(Array.isArray(resSafras.data) ? resSafras.data : (resSafras.data?.results || []));
      // Clientes e Produtos usam paginação (retornam {results: []})
      setClientes(Array.isArray(resClientes.data) ? resClientes.data : (resClientes.data?.results || []));
      setProdutos(Array.isArray(resProdutos.data) ? resProdutos.data : (resProdutos.data?.results || []));

    } catch (error) {
      console.error('Erro ao carregar dados do contrato:', error?.response?.data || error.message);
      toast.error('Erro ao carregar dados');
    }
  };

  const handleSubmit = async () => {
    const total = parseFloat(formData.quantidade_negociada) * parseFloat(formData.valor_unitario);
    
    // We assume data_emissao = today
    const payload = {
      ...formData,
      valor_total_contrato: total,
      data_emissao: new Date().toISOString().split('T')[0],
      status: 'Aberto'
    };

    try {
      await axiosInstance.post('/contratos-agricolas/', payload);
      toast.success('Contrato registrado!');
      setOpen(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar contrato: ' + (error?.response?.data ? JSON.stringify(error.response.data) : error.message));
      console.error(error?.response?.data || error);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="primary">Contratos Agrícolas / Barter</Typography>
        <Button startIcon={<Add />} variant="contained" color="warning" onClick={() => setOpen(true)}>
          Novo Contrato
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Contrato</TableCell>
              <TableCell>Produtor</TableCell>
              <TableCell>Safra</TableCell>
              <TableCell>Negociação</TableCell>
              <TableCell>Vlr. Unitário</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Entrega</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contratos.map((row) => (
              <TableRow key={row.id_contrato}>
                <TableCell><b>{row.numero_contrato}</b></TableCell>
                <TableCell>{row.cliente_nome}</TableCell>
                <TableCell>{row.safra_nome}</TableCell>
                <TableCell>{row.quantidade_negociada} {row.unidade_medida} ({row.produto_nome})</TableCell>
                <TableCell>R$ {row.valor_unitario}</TableCell>
                <TableCell>{formatCurrency(row.valor_total_contrato)}</TableCell>
                <TableCell>{new Date(row.data_entrega).toLocaleDateString()}</TableCell>
                <TableCell>{row.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Novo Contrato</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <TextField 
                label="Nº Contrato" fullWidth required
                value={formData.numero_contrato}
                onChange={e => setFormData({...formData, numero_contrato: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField 
                select label="Produtor Rural" fullWidth required
                value={formData.id_cliente}
                onChange={e => setFormData({...formData, id_cliente: e.target.value})}
              >
                {clientes.map(c => (
                    <MenuItem key={c.id_cliente} value={c.id_cliente}>
                        {c.nome_razao_social || c.nome_fantasia}
                    </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField 
                select label="Safra" fullWidth required
                value={formData.id_safra}
                onChange={e => setFormData({...formData, id_safra: e.target.value})}
              >
                {safras.map(s => (
                    <MenuItem key={s.id_safra} value={s.id_safra}>{s.descricao}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                select label="Produto Destino" fullWidth required
                value={formData.id_produto_destino}
                onChange={e => setFormData({...formData, id_produto_destino: e.target.value})}
              >
                {produtos.slice(0, 50).map(p => (
                    <MenuItem key={p.id_produto} value={p.id_produto}>{p.nome_produto}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={4}>
              <TextField 
                label="Quantidade" type="number" fullWidth required
                value={formData.quantidade_negociada}
                onChange={e => setFormData({...formData, quantidade_negociada: e.target.value})}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField 
                select label="Unidade" fullWidth required
                value={formData.unidade_medida}
                onChange={e => setFormData({...formData, unidade_medida: e.target.value})}
              >
                <MenuItem value="sc">Saca (sc)</MenuItem>
                <MenuItem value="ton">Tonelada (ton)</MenuItem>
                <MenuItem value="kg">Quilo (kg)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField 
                label="Valor Unitário (R$)" type="number" fullWidth required
                value={formData.valor_unitario}
                onChange={e => setFormData({...formData, valor_unitario: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12}>
                <TextField 
                    label="Data de Entrega" type="date" fullWidth InputLabelProps={{shrink: true}}
                    value={formData.data_entrega}
                    onChange={e => setFormData({...formData, data_entrega: e.target.value})}
                />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">Registrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgroContratosPage;
