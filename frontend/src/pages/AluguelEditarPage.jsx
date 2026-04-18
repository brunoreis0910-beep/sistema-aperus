import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';

export default function AluguelEditarPage() {
  const { id } = useParams();
  const [aluguel, setAluguel] = React.useState(null);
  const [clientes, setClientes] = React.useState([]);
  const [equipamentos, setEquipamentos] = React.useState([]);
  const [form, setForm] = React.useState({
    id_cliente: '',
    data_inicio: '',
    data_fim_prevista: '',
    observacoes: '',
    valor_desconto: 0
  });
  const [itens, setItens] = React.useState([]);
  const [novoItem, setNovoItem] = React.useState({
    id_equipamento: '',
    data_devolucao_prevista: '',
    quantidade_dias: 1,
    valor_diaria: ''
  });
  const [loading, setLoading] = React.useState(true);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      const [aluguelRes, cRes, eRes] = await Promise.all([
        api.get(`/api/alugueis/${id}/`),
        api.get('/api/clientes/'),
        api.get('/api/equipamentos/disponiveis/')
      ]);

      const normalize = (res) => {
        if (!res || !res.data) return [];
        const d = res.data;
        if (Array.isArray(d)) return d;
        if (d.results && Array.isArray(d.results)) return d.results;
        return [];
      };

      const aluguelData = aluguelRes.data;
      setAluguel(aluguelData);
      
      setForm({
        id_cliente: aluguelData.id_cliente,
        data_inicio: aluguelData.data_inicio,
        data_fim_prevista: aluguelData.data_fim_prevista,
        observacoes: aluguelData.observacoes || '',
        valor_desconto: parseFloat(aluguelData.valor_desconto) || 0
      });

      // Carrega itens existentes
      const itensExistentes = aluguelData.itens.map(item => ({
        id_item: item.id_item,
        id_equipamento: item.id_equipamento,
        equipamento_nome: item.equipamento_nome,
        equipamento_codigo: item.equipamento_codigo,
        data_devolucao_prevista: item.data_devolucao_prevista,
        quantidade_dias: parseInt(item.quantidade_dias) || 0,
        valor_diaria: parseFloat(item.valor_diaria) || 0,
        valor_total: parseFloat(item.valor_total) || 0,
        status: item.status,
        existente: true // marca como item já salvo
      }));
      setItens(itensExistentes);

      setClientes(normalize(cRes));
      setEquipamentos(normalize(eRes));
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setErro('Erro ao carregar dados do aluguel');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleItemChange = (field) => (e) => {
    const value = e.target.value;
    setNovoItem(prev => {
      const updated = { ...prev, [field]: value };

      if (field === 'id_equipamento') {
        const equip = equipamentos.find(eq => eq.id_equipamento === value);
        if (equip) {
          updated.valor_diaria = equip.valor_diaria || '';
        }
      }

      if (field === 'data_devolucao_prevista' && form.data_inicio && value) {
        const dataInicio = new Date(form.data_inicio);
        const dataFim = new Date(value);
        const diffTime = dataFim - dataInicio;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        updated.quantidade_dias = diffDays > 0 ? diffDays : 1;
      }

      return updated;
    });
  };

  const adicionarItem = () => {
    if (!novoItem.id_equipamento || !novoItem.data_devolucao_prevista || !novoItem.valor_diaria) {
      setErro('Preencha todos os campos do equipamento');
      return;
    }

    const equip = equipamentos.find(e => e.id_equipamento === novoItem.id_equipamento);
    if (!equip) return;

    if (itens.some(i => i.id_equipamento === novoItem.id_equipamento)) {
      setErro('Este equipamento já foi adicionado');
      return;
    }

    const valor_total = parseFloat(novoItem.valor_diaria) * parseInt(novoItem.quantidade_dias);

    const item = {
      ...novoItem,
      equipamento_nome: equip.nome,
      equipamento_codigo: equip.codigo,
      valor_total,
      status: 'ativo',
      existente: false // novo item
    };

    setItens(prev => [...prev, item]);
    setNovoItem({
      id_equipamento: '',
      data_devolucao_prevista: '',
      quantidade_dias: 1,
      valor_diaria: ''
    });
    setErro('');
  };

  const removerItem = (index) => {
    const item = itens[index];
    
    // Se for item já salvo e está devolvido/cancelado, não permite remover
    if (item.existente && item.status !== 'ativo') {
      setErro('Não é possível remover itens já devolvidos ou cancelados');
      return;
    }

    setItens(prev => prev.filter((_, i) => i !== index));
  };

  const handleSalvar = async () => {
    setErro('');

    if (!form.id_cliente || !form.data_inicio || !form.data_fim_prevista) {
      setErro('Preencha todos os campos obrigatórios');
      return;
    }

    if (itens.length === 0) {
      setErro('Adicione pelo menos um equipamento');
      return;
    }

    setSalvando(true);

    try {
      const payload = {
        id_cliente: form.id_cliente,
        data_inicio: form.data_inicio,
        data_fim_prevista: form.data_fim_prevista,
        observacoes: form.observacoes,
        valor_desconto: parseFloat(form.valor_desconto) || 0,
        itens: itens.map(item => ({
          id_equipamento: item.id_equipamento,
          data_devolucao_prevista: item.data_devolucao_prevista,
          quantidade_dias: item.quantidade_dias,
          valor_diaria: parseFloat(item.valor_diaria),
          valor_multa: 0,
          observacoes: ''
        }))
      };

      await api.put(`/api/alugueis/${id}/`, payload);
      
      alert('Aluguel atualizado com sucesso!');
      navigate('/alugueis');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      const msg = err.response?.data?.error || 
                  err.response?.data?.detail ||
                  JSON.stringify(err.response?.data) ||
                  'Erro ao salvar aluguel';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  const valorTotal = Array.isArray(itens) ? itens.reduce((sum, item) => parseFloat(sum) + (parseFloat(item.valor_total) || 0), 0) : 0;
  const valorFinal = parseFloat(valorTotal) - (parseFloat(form.valor_desconto) || 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!aluguel) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Aluguel não encontrado</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/alugueis')} sx={{ mt: 2 }}>
          Voltar
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate('/alugueis')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ ml: 2 }}>
          Editar Aluguel {aluguel.numero_aluguel}
        </Typography>
        <Chip 
          label={aluguel.status} 
          color={aluguel.status === 'ativo' ? 'success' : 'default'} 
          sx={{ ml: 2 }}
        />
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Dados do Aluguel</Typography>
        
        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Cliente *"
              value={form.id_cliente}
              onChange={handleChange('id_cliente')}
              disabled={aluguel.status !== 'ativo'}
            >
              <MenuItem value="">Selecione...</MenuItem>
              {clientes.map(c => (
                <MenuItem key={c.id_cliente} value={c.id_cliente}>
                  {c.nome_razao_social}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Data Início *"
              value={form.data_inicio}
              onChange={handleChange('data_inicio')}
              InputLabelProps={{ shrink: true }}
              disabled={aluguel.status !== 'ativo'}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Data Fim Prevista *"
              value={form.data_fim_prevista}
              onChange={handleChange('data_fim_prevista')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={10}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Observações"
              value={form.observacoes}
              onChange={handleChange('observacoes')}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="number"
              label="Desconto"
              value={form.valor_desconto}
              onChange={handleChange('valor_desconto')}
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Grid>
        </Grid>
      </Paper>

      {aluguel.status === 'ativo' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Adicionar Equipamentos</Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Equipamento *"
                value={novoItem.id_equipamento}
                onChange={handleItemChange('id_equipamento')}
              >
                <MenuItem value="">Selecione...</MenuItem>
                {equipamentos
                  .filter(e => !itens.some(i => i.id_equipamento === e.id_equipamento))
                  .map(e => (
                    <MenuItem key={e.id_equipamento} value={e.id_equipamento}>
                      {e.codigo} - {e.nome}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Devolução Prevista *"
                value={novoItem.data_devolucao_prevista}
                onChange={handleItemChange('data_devolucao_prevista')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Dias *"
                value={novoItem.quantidade_dias}
                onChange={handleItemChange('quantidade_dias')}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Valor Diária *"
                value={novoItem.valor_diaria}
                onChange={handleItemChange('valor_diaria')}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Valor Total"
                value={((parseFloat(novoItem.valor_diaria) || 0) * novoItem.quantidade_dias).toFixed(2)}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={adicionarItem}
              >
                Add
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Equipamentos do Aluguel</Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Equipamento</TableCell>
                <TableCell>Devolução Prevista</TableCell>
                <TableCell align="right">Dias</TableCell>
                <TableCell align="right">Valor Diária</TableCell>
                <TableCell align="right">Valor Total</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Nenhum equipamento adicionado
                  </TableCell>
                </TableRow>
              ) : (
                itens.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.equipamento_codigo}</TableCell>
                    <TableCell>{item.equipamento_nome}</TableCell>
                    <TableCell>{new Date(item.data_devolucao_prevista).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell align="right">{item.quantidade_dias}</TableCell>
                    <TableCell align="right">R$ {parseFloat(item.valor_diaria).toFixed(2)}</TableCell>
                    <TableCell align="right">R$ {(parseFloat(item.valor_total) || 0).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={item.status || 'ativo'} 
                        size="small" 
                        color={item.status === 'ativo' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {(!item.existente || item.status === 'ativo') && aluguel.status === 'ativo' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removerItem(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {itens.length > 0 && (
                <>
                  <TableRow>
                    <TableCell colSpan={5} align="right">
                      <Typography variant="subtitle2">Subtotal:</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">
                        R$ {valorTotal.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                  {form.valor_desconto > 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="right">
                        <Typography variant="subtitle2">Desconto:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" color="error">
                          - R$ {parseFloat(form.valor_desconto).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={5} align="right">
                      <Typography variant="h6">Total:</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary">
                        R$ {valorFinal.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => navigate('/alugueis')}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSalvar}
          disabled={salvando || itens.length === 0}
        >
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </Box>
    </Box>
  );
}
