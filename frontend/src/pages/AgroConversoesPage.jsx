import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Grid, Card, CardContent, TextField, MenuItem, Chip
} from '@mui/material';
import { Delete, Calculate } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const AgroConversoesPage = () => {
  const { axiosInstance } = useAuth();
  const [regras, setRegras] = useState([]);
  const [produtos, setProdutos] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    id_produto: '',
    unidade_origem: '',
    unidade_destino: '',
    operacao: 'M',
    fator_conversao: ''
  });

  // Calculator State
  const [calc, setCalc] = useState({ qtd: 1, de: '', para: '', res: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resRegras, resProds] = await Promise.all([
        axiosInstance.get('/conversoes-unidades/'),
        axiosInstance.get('/produtos/')
      ]);
      // Conversões Agro retorna array direto (sem paginação)
      setRegras(Array.isArray(resRegras.data) ? resRegras.data : []);
      // Produtos usa paginação (retorna {results: []})
      setProdutos(Array.isArray(resProds.data) ? resProds.data : (resProds.data?.results || []));
    } catch (error) {
      console.error(error);
    }
  };

  const calculate = () => {
    const { qtd, de, para } = calc;
    if(!de || !para) return;

    // Find rule
    const rule = regras.find(r => 
      r.unidade_origem.toLowerCase() === de.toLowerCase() && 
      r.unidade_destino.toLowerCase() === para.toLowerCase()
    );

    if(rule) {
      const val = rule.operacao === 'M' 
        ? parseFloat(qtd) * parseFloat(rule.fator_conversao)
        : parseFloat(qtd) / parseFloat(rule.fator_conversao);
      setCalc({...calc, res: val.toFixed(3)});
    } else {
        // Try inverse
        const inv = regras.find(r => 
            r.unidade_origem.toLowerCase() === para.toLowerCase() && 
            r.unidade_destino.toLowerCase() === de.toLowerCase()
        );
        if(inv) {
            const val = inv.operacao === 'M'
                ? parseFloat(qtd) / parseFloat(inv.fator_conversao)
                : parseFloat(qtd) * parseFloat(inv.fator_conversao);
            setCalc({...calc, res: val.toFixed(3)});
        } else {
            setCalc({...calc, res: 'Sem regra'});
        }
    }
  };

  const handleSave = async () => {
    try {
        await axiosInstance.post('/conversoes-unidades/', {
            ...formData,
            id_produto: formData.id_produto || null
        });
        toast.success('Regra Salva');
        loadData();
        setFormData({ ...formData, unidade_origem: '', unidade_destino: '' });
    } catch (error) {
        toast.error('Erro ao salvar');
    }
  };

  const handleDelete = async (id) => {
      try {
          await axiosInstance.delete(`/conversoes-unidades/${id}/`);
          loadData();
      } catch (error) {
          toast.error('Erro ao deletar');
      }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Conversão de Unidades</Typography>
      
      <Grid container spacing={3}>
        {/* Calculadora */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom><Calculate /> Simulador</Typography>
              <Box display="flex" gap={2} mb={2}>
                <TextField label="Qtd" type="number" value={calc.qtd} onChange={e => setCalc({...calc, qtd: e.target.value})} fullWidth />
              </Box>
              <Box display="flex" gap={2} mb={2}>
                <TextField label="De (ex: sc)" value={calc.de} onChange={e => setCalc({...calc, de: e.target.value})} fullWidth />
                <TextField label="Para (ex: kg)" value={calc.para} onChange={e => setCalc({...calc, para: e.target.value})} fullWidth />
              </Box>
              <Button variant="contained" fullWidth onClick={calculate}>Calcular</Button>
              {calc.res && (
                <Box mt={2} p={2} bgcolor="white" borderRadius={1} textAlign="center">
                    <Typography variant="h5" color="primary">{calc.res} {calc.para}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Formulario */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Nova Regra</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField select label="Produto (Opcional - Global)" fullWidth value={formData.id_produto} onChange={e => setFormData({...formData, id_produto: e.target.value})}>
                        <MenuItem value="">Global (Todos)</MenuItem>
                        {produtos.slice(0, 50).map(p => (
                            <MenuItem key={p.id_produto} value={p.id_produto}>{p.nome_produto}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={3}>
                    <TextField label="Origem" fullWidth value={formData.unidade_origem} onChange={e => setFormData({...formData, unidade_origem: e.target.value})} />
                </Grid>
                <Grid item xs={3}>
                    <TextField label="Destino" fullWidth value={formData.unidade_destino} onChange={e => setFormData({...formData, unidade_destino: e.target.value})} />
                </Grid>
                <Grid item xs={3}>
                    <TextField select label="Operação" fullWidth value={formData.operacao} onChange={e => setFormData({...formData, operacao: e.target.value})}>
                        <MenuItem value="M">Multiplicar</MenuItem>
                        <MenuItem value="D">Dividir</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={3}>
                    <TextField label="Fator" type="number" fullWidth value={formData.fator_conversao} onChange={e => setFormData({...formData, fator_conversao: e.target.value})} />
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="flex-end">
                    <Button variant="contained" onClick={handleSave}>Salvar Regra</Button>
                </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper}>
              <Table size="small">
                  <TableHead>
                      <TableRow>
                          <TableCell>Escopo</TableCell>
                            <TableCell>De -&gt; Para</TableCell>
                          <TableCell>Fator</TableCell>
                          <TableCell>Ação</TableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                      {regras.map(r => (
                          <TableRow key={r.id_conversao}>
                              <TableCell>{r.produto_nome ? <Chip label={r.produto_nome} color="primary" size="small"/> : <Chip label="Global" size="small"/>}</TableCell>
                              <TableCell><b>{r.unidade_origem}</b> para <b>{r.unidade_destino}</b></TableCell>
                              <TableCell>{r.fator_conversao}</TableCell>
                              <TableCell>
                                  <IconButton size="small" color="error" onClick={() => handleDelete(r.id_conversao)}><Delete /></IconButton>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AgroConversoesPage;
