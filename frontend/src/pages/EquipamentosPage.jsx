import React from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, MenuItem, IconButton, Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import api from '../services/api';

const STATUS_OPTIONS = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'alugado', label: 'Alugado' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'inativo', label: 'Inativo' },
];

export default function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editando, setEditando] = React.useState(null);
  const [form, setForm] = React.useState({
    codigo: '', nome: '', descricao: '', categoria: '', marca: '', modelo: '',
    numero_serie: '', status: 'disponivel', valor_diaria: '', valor_semanal: '', valor_mensal: '', observacoes: ''
  });
  const [salvando, setSalvando] = React.useState(false);

  const carregarEquipamentos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/equipamentos/');
      const data = res.data;
      if (Array.isArray(data)) {
        setEquipamentos(data);
      } else if (Array.isArray(data.results)) {
        setEquipamentos(data.results);
      } else {
        setEquipamentos([]);
      }
    } catch (err) {
      console.error('Erro ao carregar equipamentos', err);
      setEquipamentos([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    carregarEquipamentos();
  }, []);

  const handleNovo = () => {
    setEditando(null);
    setForm({
      codigo: '', nome: '', descricao: '', categoria: '', marca: '', modelo: '',
      numero_serie: '', status: 'disponivel', valor_diaria: '', valor_semanal: '', valor_mensal: '', observacoes: ''
    });
    setDialogOpen(true);
  };

  const handleEditar = (eq) => {
    setEditando(eq);
    setForm({
      codigo: eq.codigo || '',
      nome: eq.nome || '',
      descricao: eq.descricao || '',
      categoria: eq.categoria || '',
      marca: eq.marca || '',
      modelo: eq.modelo || '',
      numero_serie: eq.numero_serie || '',
      status: eq.status || 'disponivel',
      valor_diaria: eq.valor_diaria || '',
      valor_semanal: eq.valor_semanal || '',
      valor_mensal: eq.valor_mensal || '',
      observacoes: eq.observacoes || ''
    });
    setDialogOpen(true);
  };

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSalvar = async () => {
    if (!form.codigo || !form.nome || !form.valor_diaria) {
      alert('Preencha código, nome e valor da diária');
      return;
    }

    setSalvando(true);
    try {
      const payload = { ...form };
      
      if (editando) {
        await api.put(`/api/equipamentos/${editando.id_equipamento}/`, payload);
      } else {
        await api.post('/api/equipamentos/', payload);
      }

      setDialogOpen(false);
      carregarEquipamentos();
    } catch (err) {
      console.error('Erro ao salvar equipamento', err);
      alert(err?.response?.data?.detail || err?.response?.data?.codigo?.[0] || 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'disponivel': return 'success';
      case 'alugado': return 'warning';
      case 'manutencao': return 'error';
      case 'inativo': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Equipamentos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNovo}>
          Novo Equipamento
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Valor diária</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {equipamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Nenhum equipamento cadastrado</TableCell>
                  </TableRow>
                ) : (
                  equipamentos.map((eq) => (
                    <TableRow key={eq.id_equipamento || eq.codigo} hover>
                      <TableCell>{eq.codigo}</TableCell>
                      <TableCell>{eq.nome}</TableCell>
                      <TableCell>{eq.categoria || '-'}</TableCell>
                      <TableCell>
                        <Chip label={eq.status} color={getStatusColor(eq.status)} size="small" />
                      </TableCell>
                      <TableCell align="right">R$ {parseFloat(eq.valor_diaria || 0).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => handleEditar(eq)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editando ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Código *" value={form.codigo} onChange={handleChange('codigo')} disabled={!!editando} />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField fullWidth label="Nome *" value={form.nome} onChange={handleChange('nome')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Descrição" value={form.descricao} onChange={handleChange('descricao')} multiline rows={2} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Categoria" value={form.categoria} onChange={handleChange('categoria')} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Marca" value={form.marca} onChange={handleChange('marca')} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Modelo" value={form.modelo} onChange={handleChange('modelo')} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Número de Série" value={form.numero_serie} onChange={handleChange('numero_serie')} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="Status" value={form.status} onChange={handleChange('status')}>
                {STATUS_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth type="number" label="Valor Diária *" value={form.valor_diaria} onChange={handleChange('valor_diaria')} inputProps={{ step: '0.01' }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth type="number" label="Valor Semanal" value={form.valor_semanal} onChange={handleChange('valor_semanal')} inputProps={{ step: '0.01' }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth type="number" label="Valor Mensal" value={form.valor_mensal} onChange={handleChange('valor_mensal')} inputProps={{ step: '0.01' }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Observações" value={form.observacoes} onChange={handleChange('observacoes')} multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
