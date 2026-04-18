import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Compare as CompareIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  'Rascunho': 'default',
  'Enviada': 'info',
  'Em Análise': 'warning',
  'Finalizada': 'success',
  'Cancelada': 'error'
};

export default function CotacaoPage() {
  const { axiosInstance, user, permissions, isLoading: authLoading } = useAuth();
  const [cotacoes, setCotacoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalComparacao, setModalComparacao] = useState(false);
  const [cotacaoSelecionada, setCotacaoSelecionada] = useState(null);
  const [dadosComparacao, setDadosComparacao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Formulário
  const [prazoResposta, setPrazoResposta] = useState(null);
  const [observacoes, setObservacoes] = useState('');
  const [itensCotacao, setItensCotacao] = useState([]);
  const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState([]);

  useEffect(() => {
    carregarCotacoes();
    carregarProdutos();
    carregarFornecedores();
  }, []);

  const carregarCotacoes = async () => {
    try {
      const response = await axiosInstance.get('/cotacoes/');
      const _d = response.data;
      setCotacoes(Array.isArray(_d) ? _d : Array.isArray(_d?.results) ? _d.results : []);
    } catch (error) {
      console.error('Erro ao carregar cotações:', error);
      setErro('Erro ao carregar cotações');
    }
  };

  const carregarProdutos = async () => {
    try {
      const response = await axiosInstance.get('/produtos/');
      const _d = response.data;
      setProdutos(Array.isArray(_d) ? _d : Array.isArray(_d?.results) ? _d.results : []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const carregarFornecedores = async () => {
    try {
      const response = await axiosInstance.get('/fornecedores/');
      const _d = response.data;
      setFornecedores(Array.isArray(_d) ? _d : Array.isArray(_d?.results) ? _d.results : []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const abrirModalNovaCotacao = () => {
    setPrazoResposta(null);
    setObservacoes('');
    setItensCotacao([]);
    setFornecedoresSelecionados([]);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setCotacaoSelecionada(null);
    setErro('');
  };

  const adicionarItem = () => {
    setItensCotacao([...itensCotacao, {
      id_produto: '',
      quantidade_solicitada: 0,
      observacoes: ''
    }]);
  };

  const removerItem = (index) => {
    const novosItens = itensCotacao.filter((_, i) => i !== index);
    setItensCotacao(novosItens);
  };

  const atualizarItem = (index, campo, valor) => {
    const novosItens = [...itensCotacao];
    novosItens[index][campo] = valor;
    setItensCotacao(novosItens);
  };

  const salvarCotacao = async () => {
    if (!prazoResposta) {
      setErro('Informe o prazo de resposta');
      return;
    }

    if (itensCotacao.length === 0) {
      setErro('Adicione pelo menos um item à cotação');
      return;
    }

    if (fornecedoresSelecionados.length === 0) {
      setErro('Selecione pelo menos um fornecedor');
      return;
    }

    // Validar que todos os itens têm produto e quantidade válida
    for (let item of itensCotacao) {
      if (!item.id_produto) {
        setErro('Todos os itens devem ter um produto selecionado');
        return;
      }
      if (item.quantidade_solicitada <= 0) {
        setErro('Todos os itens devem ter quantidade maior que zero');
        return;
      }
    }

    try {
      setLoading(true);
      setErro('');

      // Garantir que prazoResposta é uma data válida
      let dataResposta = prazoResposta;
      if (typeof prazoResposta === 'string') {
        dataResposta = new Date(prazoResposta);
      }

      const dados = {
        prazo_resposta: dataResposta.toISOString(),
        observacoes,
        fornecedores: fornecedoresSelecionados.map(id => parseInt(id)),
        itens: itensCotacao.map(item => ({
          id_produto: parseInt(item.id_produto),
          quantidade_solicitada: parseFloat(item.quantidade_solicitada),
          observacoes: item.observacoes || ''
        }))
      };

      console.log('Enviando cotação com dados validados:', dados);

      // Aumentar timeout para 90 segundos para POST
      const config = { timeout: 90000 };
      const response = await axiosInstance.post('/cotacoes/', dados, config);

      console.log('Cotação criada com sucesso:', response.data);

      await carregarCotacoes();
      fecharModal();
      alert('Cotação criada com sucesso! Agora clique em "Enviar" para enviar aos fornecedores.');
    } catch (error) {
      console.error('Erro ao salvar cotação:', error);
      console.error('Resposta do servidor:', error.response?.data);

      if (error.code === 'ECONNABORTED') {
        setErro('Timeout: O servidor demorou muito para responder. Verifique a configuração de email no backend.');
      } else {
        setErro(error.response?.data?.detail || error.response?.data?.error || error.message || 'Erro ao salvar cotação');
      }
    } finally {
      setLoading(false);
    }
  };

  const enviarCotacao = async (cotacao) => {
    try {
      setLoading(true);
      console.log('Enviando cotação via WhatsApp:', cotacao.id_cotacao);
      await axiosInstance.post(`/cotacoes/${cotacao.id_cotacao}/enviar_cotacao/`, {
        metodo_envio: 'whatsapp'
      });
      await carregarCotacoes();
      alert('Cotação enviada com sucesso via WhatsApp!');
    } catch (error) {
      console.error('Erro ao enviar cotação:', error);
      alert(error.response?.data?.error || 'Erro ao enviar cotação');
    } finally {
      setLoading(false);
    }
  };

  const abrirComparacao = async (cotacao) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/cotacoes/${cotacao.id_cotacao}/comparar_cotacoes/`);
      setDadosComparacao(response.data);
      setCotacaoSelecionada(cotacao);
      setModalComparacao(true);
    } catch (error) {
      console.error('Erro ao carregar comparação:', error);
      alert(error.response?.data?.error || 'Erro ao carregar comparação');
    } finally {
      setLoading(false);
    }
  };

  const confirmarVencedores = async () => {
    // Coletar vencedores selecionados
    const vencedores = dadosComparacao.itens
      .filter(item => item.vencedor_selecionado)
      .map(item => ({
        id_cotacao_item: item.id_cotacao_item.toString(),
        id_fornecedor: item.vencedor_selecionado.id_fornecedor.toString(),
        valor_vencedor: item.vencedor_selecionado.valor_unitario.toString()
      }));

    if (vencedores.length === 0) {
      alert('Selecione pelo menos um vencedor');
      return;
    }

    const gerarCompra = window.confirm('Deseja gerar o pedido de compra automaticamente?');

    try {
      setLoading(true);
      await axiosInstance.post(`/cotacoes/${cotacaoSelecionada.id_cotacao}/confirmar_vencedores/`, {
        vencedores,
        gerar_compra: gerarCompra
      });
      await carregarCotacoes();
      setModalComparacao(false);
      alert('Vencedores confirmados com sucesso!');
    } catch (error) {
      console.error('Erro ao confirmar vencedores:', error);
      alert(error.response?.data?.error || 'Erro ao confirmar vencedores');
    } finally {
      setLoading(false);
    }
  };

  const selecionarVencedor = (indexItem, fornecedor) => {
    const novosDados = { ...dadosComparacao };
    novosDados.itens[indexItem].vencedor_selecionado = fornecedor;
    setDadosComparacao(novosDados);
  };

  const cancelarCotacao = async (cotacao) => {
    if (!window.confirm('Deseja realmente cancelar esta cotação?')) return;

    try {
      setLoading(true);
      await axiosInstance.post(`/cotacoes/${cotacao.id_cotacao}/cancelar/`);
      await carregarCotacoes();
      alert('Cotação cancelada com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar cotação:', error);
      alert(error.response?.data?.error || 'Erro ao cancelar cotação');
    } finally {
      setLoading(false);
    }
  };

  // Verificar permissões
  if (authLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  if (!user?.is_staff && !permissions?.cotacoes_acessar) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Você não tem permissão para acessar esta página.</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Cotações de Compras</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={abrirModalNovaCotacao}
          >
            Nova Cotação
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Prazo Resposta</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Itens</TableCell>
                <TableCell>Fornecedores</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cotacoes.map((cotacao) => (
                <TableRow key={cotacao.id_cotacao}>
                  <TableCell>{cotacao.numero_cotacao}</TableCell>
                  <TableCell>{new Date(cotacao.data_cotacao).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(cotacao.prazo_resposta).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={cotacao.status}
                      color={STATUS_COLORS[cotacao.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{cotacao.itens?.length || 0}</TableCell>
                  <TableCell>{cotacao.fornecedores?.length || 0}</TableCell>
                  <TableCell>
                    {cotacao.status === 'Rascunho' && (
                      <IconButton
                        color="primary"
                        onClick={() => enviarCotacao(cotacao)}
                        title="Enviar Cotação"
                      >
                        <SendIcon />
                      </IconButton>
                    )}
                    {(cotacao.status === 'Em Análise' || cotacao.status === 'Finalizada') && (
                      <IconButton
                        color="info"
                        onClick={() => abrirComparacao(cotacao)}
                        title="Comparar Respostas"
                      >
                        <CompareIcon />
                      </IconButton>
                    )}
                    {cotacao.status !== 'Finalizada' && cotacao.status !== 'Cancelada' && (
                      <IconButton
                        color="error"
                        onClick={() => cancelarCotacao(cotacao)}
                        title="Cancelar"
                      >
                        <CloseIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Modal de Nova Cotação */}
        <Dialog open={modalAberto} onClose={fecharModal} maxWidth="md" fullWidth>
          <DialogTitle>Nova Cotação</DialogTitle>
          <DialogContent>
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <DateTimePicker
                  label="Prazo de Resposta"
                  value={prazoResposta}
                  onChange={setPrazoResposta}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  minDate={new Date()}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Observações"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Itens da Cotação</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={adicionarItem}
                  >
                    Adicionar Item
                  </Button>
                </Box>

                {itensCotacao.map((item, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                    <Grid item xs={5}>
                      <Autocomplete
                        options={produtos}
                        getOptionLabel={(option) => option.nome_produto || ''}
                        value={produtos.find(p => p.id_produto === item.id_produto) || null}
                        onChange={(_, newValue) => atualizarItem(index, 'id_produto', newValue?.id_produto || '')}
                        renderInput={(params) => <TextField {...params} label="Produto" />}
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        label="Quantidade"
                        type="number"
                        value={item.quantidade_solicitada}
                        onChange={(e) => atualizarItem(index, 'quantidade_solicitada', parseFloat(e.target.value) || 0)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        label="Observações"
                        value={item.observacoes}
                        onChange={(e) => atualizarItem(index, 'observacoes', e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={1}>
                      <IconButton color="error" onClick={() => removerItem(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={fornecedores}
                  getOptionLabel={(option) => option.nome_razao_social}
                  value={fornecedoresSelecionados}
                  onChange={(_, newValue) => setFornecedoresSelecionados(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Fornecedores" placeholder="Selecione os fornecedores" />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={fecharModal}>Cancelar</Button>
            <Button onClick={salvarCotacao} variant="contained" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Comparação */}
        <Dialog open={modalComparacao} onClose={() => setModalComparacao(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            Comparação de Cotações - {dadosComparacao?.cotacao?.numero_cotacao}
          </DialogTitle>
          <DialogContent>
            {dadosComparacao?.itens?.map((item, indexItem) => (
              <Box key={item.id_cotacao_item} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {item.produto} - Qtd: {item.quantidade_solicitada} {item.unidade_medida}
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Selecionar</TableCell>
                        <TableCell>Fornecedor</TableCell>
                        <TableCell>Valor Unitário</TableCell>
                        <TableCell>Valor Total</TableCell>
                        <TableCell>Prazo Entrega (dias)</TableCell>
                        <TableCell>Observações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {item.respostas?.map((resposta, indexResposta) => (
                        <TableRow
                          key={indexResposta}
                          sx={{
                            bgcolor: resposta.melhor_preco ? 'success.light' : 'inherit',
                            cursor: 'pointer'
                          }}
                          onClick={() => selecionarVencedor(indexItem, resposta)}
                          selected={item.vencedor_selecionado?.id_fornecedor === resposta.id_fornecedor}
                        >
                          <TableCell>
                            <Checkbox
                              checked={item.vencedor_selecionado?.id_fornecedor === resposta.id_fornecedor}
                            />
                          </TableCell>
                          <TableCell>{resposta.fornecedor}</TableCell>
                          <TableCell>
                            R$ {parseFloat(resposta.valor_unitario).toFixed(2)}
                            {resposta.melhor_preco && <Chip label="Melhor" color="success" size="small" sx={{ ml: 1 }} />}
                          </TableCell>
                          <TableCell>R$ {parseFloat(resposta.valor_total).toFixed(2)}</TableCell>
                          <TableCell>{resposta.prazo_entrega_dias || '-'}</TableCell>
                          <TableCell>{resposta.observacoes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalComparacao(false)}>Fechar</Button>
            {dadosComparacao?.cotacao?.status === 'Em Análise' && (
              <Button
                onClick={confirmarVencedores}
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                disabled={loading}
              >
                {loading ? 'Confirmando...' : 'Confirmar Vencedores'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}




