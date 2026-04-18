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
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function AluguelNovoPage() {
  const [clientes, setClientes] = React.useState([]);
  const [equipamentos, setEquipamentos] = React.useState([]);
  const [form, setForm] = React.useState({
    id_cliente: '',
    data_inicio: '',
    data_fim_prevista: '',
    observacoes: ''
  });
  const [itens, setItens] = React.useState([]);
  const [novoItem, setNovoItem] = React.useState({
    id_equipamento: '',
    data_devolucao_prevista: '',
    quantidade_dias: 1,
    valor_diaria: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [erro, setErro] = React.useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [cRes, eRes] = await Promise.all([
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

      setClientes(normalize(cRes));
      setEquipamentos(normalize(eRes));
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setErro('Erro ao carregar clientes ou equipamentos');
    }
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleItemChange = (field) => (e) => {
    const value = e.target.value;
    setNovoItem(prev => {
      const updated = { ...prev, [field]: value };

      // Se mudou o equipamento, busca valor da diária
      if (field === 'id_equipamento') {
        const equip = equipamentos.find(eq => eq.id_equipamento === value);
        if (equip) {
          updated.valor_diaria = equip.valor_diaria || '';
        }
      }

      // Se mudou data de devolução e tem data de início, calcula dias
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
    if (!novoItem.id_equipamento) {
      setErro('Selecione um equipamento');
      return;
    }
    if (!novoItem.data_devolucao_prevista) {
      setErro('Informe a data de devolução prevista');
      return;
    }
    if (!novoItem.valor_diaria || novoItem.valor_diaria <= 0) {
      setErro('Informe o valor da diária');
      return;
    }

    const equip = equipamentos.find(e => e.id_equipamento === novoItem.id_equipamento);
    if (!equip) return;

    // Verifica se equipamento já foi adicionado
    if (itens.some(i => i.id_equipamento === novoItem.id_equipamento)) {
      setErro('Este equipamento já foi adicionado');
      return;
    }

    const valor_total = parseFloat(novoItem.valor_diaria) * parseInt(novoItem.quantidade_dias);

    const item = {
      ...novoItem,
      equipamento_nome: equip.nome,
      equipamento_codigo: equip.codigo,
      valor_total
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
    setItens(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setErro('');

    // Validações
    if (!form.id_cliente) {
      setErro('Selecione um cliente');
      return;
    }
    if (!form.data_inicio) {
      setErro('Informe a data de início');
      return;
    }
    if (!form.data_fim_prevista) {
      setErro('Informe a data de fim prevista');
      return;
    }
    if (itens.length === 0) {
      setErro('Adicione pelo menos um equipamento');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        id_cliente: form.id_cliente,
        data_inicio: form.data_inicio,
        data_fim_prevista: form.data_fim_prevista,
        observacoes: form.observacoes,
        valor_desconto: 0,
        itens: itens.map(item => ({
          id_equipamento: item.id_equipamento,
          data_devolucao_prevista: item.data_devolucao_prevista,
          quantidade_dias: item.quantidade_dias,
          valor_diaria: parseFloat(item.valor_diaria),
          valor_multa: 0,
          observacoes: ''
        }))
      };

      console.log('📤 Payload:', payload);

      await api.post('/api/alugueis/', payload);
      
      alert('Aluguel criado com sucesso!');
      navigate('/alugueis');
    } catch (err) {
      console.error('Erro ao criar aluguel:', err);
      const msg = err.response?.data?.error || 
                  err.response?.data?.detail ||
                  JSON.stringify(err.response?.data) ||
                  'Erro ao criar aluguel';
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  const valorTotal = Array.isArray(itens) ? itens.reduce((sum, item) => sum + item.valor_total, 0) : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Novo Aluguel</Typography>

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

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Observações"
              value={form.observacoes}
              onChange={handleChange('observacoes')}
            />
          </Grid>
        </Grid>
      </Paper>

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
              value={(novoItem.valor_diaria * novoItem.quantidade_dias).toFixed(2)}
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
              Adicionar
            </Button>
          </Grid>
        </Grid>
      </Paper>

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
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
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
                    <TableCell align="right">R$ {item.valor_total.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removerItem(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {itens.length > 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="right">
                    <Typography variant="h6">Total:</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" color="primary">
                      R$ {valorTotal.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell />
                </TableRow>
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
          onClick={handleSubmit}
          disabled={loading || itens.length === 0}
        >
          {loading ? 'Salvando...' : 'Salvar Aluguel'}
        </Button>
      </Box>
    </Box>
  );
}
