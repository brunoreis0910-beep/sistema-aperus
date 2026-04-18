// Em: src/pages/BancarioPage.jsx

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Fade, CircularProgress,
  List, ListItem, ListItemText, Divider, Grid,
  Paper, Button, Tooltip,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
// Ícones
import LockIcon from '@mui/icons-material/Lock';
import SearchIcon from '@mui/icons-material/Search';
import CalculateIcon from '@mui/icons-material/Calculate';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
// Helpers
import { useAuth } from '../context/AuthContext';
import useRelatorioBancario from '../hooks/useRelatorioBancario';

// função para formatar data para o input (YYYY-MM-DD)
const formatarDataInput = (data) => {
  if (!data) return '';
  try { return new Date(data).toISOString().split('T')[0]; }
  catch (e) { return ''; }
};

// Pega o primeiro e último dia do mês atual
const getPrimeiroDiaMes = () => {
  const data = new Date();
  return formatarDataInput(new Date(data.getFullYear(), data.getMonth(), 1));
};
const getUltimoDiaMes = () => {
  const data = new Date();
  return formatarDataInput(new Date(data.getFullYear(), data.getMonth() + 1, 0));
};

function BancarioPage() {
  const { user, permissions, axiosInstance, isLoading: authLoading } = useAuth();
  const { imprimirRelatorio, baixarPDFRelatorio, compartilharWhatsApp } = useRelatorioBancario();

  // --- Estados da Página ---
  const [movimentos, setMovimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState(null);

  // --- Estados dos Filtros ---
  const [dataInicial, setDataInicial] = useState(getPrimeiroDiaMes());
  const [dataFinal, setDataFinal] = useState(getUltimoDiaMes());
  const [tipoMovimento, setTipoMovimento] = useState('Todos'); // Todos, Receita, Despesa
  const [contaBaixa, setContaBaixa] = useState(''); // id da conta de baixa selecionada

  // contas bancárias disponíveis para filtro
  const [contasBancarias, setContasBancarias] = useState([]);

  // --- Estados do Totalizador ---
  const [showTotalizador, setShowTotalizador] = useState(false);
  const [totais, setTotais] = useState({ receitas: 0, despesas: 0, saldo: 0 });
  const [loadingTotais, setLoadingTotais] = useState(false);


  // --- Funções de Busca ---

  const fetchMovimentos = async () => {
    setLoading(true);
    try {
      // Monta a query string
      let queryParams = `?status_conta=Paga`; // <-- SEMPRE SÓ O QUE FOI PAGO

      if (tipoMovimento === 'Receita') {
        queryParams += `&tipo_conta=Receber`;
      } else if (tipoMovimento === 'Despesa') {
        queryParams += `&tipo_conta=Pagar`;
      }
      // (Se for 'Todos', não adiciona o filtro &tipo_conta)

      if (dataInicial) {
        queryParams += `&data_pagamento__gte=${dataInicial}`; // gte = Greater Than or Equal
      }
      if (dataFinal) {
        queryParams += `&data_pagamento__lte=${dataFinal}`; // lte = Less Than or Equal
      }

      if (contaBaixa) {
        queryParams += `&id_conta_baixa=${contaBaixa}`;
      }

      // Adiciona ordenação: data crescente, depois descriçéo, depois cliente
      queryParams += `&ordering=data_pagamento,descricao`;

      console.log('DEBUG - URL da requisi��o:', `/contas/${queryParams}`);
      const res = await axiosInstance.get(`/contas/${queryParams}`);
      setMovimentos(res.data);

    } catch (error) {
      console.error("Erro ao buscar movimentos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Busca os dados quando a página carrega ou os filtros mudam
  useEffect(() => {
    if (!authLoading) {
      if (permissions.financeiro_acessar || user.is_staff) {
        fetchMovimentos(); // Roda a busca inicial

        // busca contas bancárias para o filtro de conta de baixa
        (async () => {
          try {
            const res = await axiosInstance.get('/contas-bancarias/');
            setContasBancarias(res.data.results || res.data || []);
          } catch (err) {
            console.error('Erro ao buscar contas bancárias para filtro:', err);
            setContasBancarias([]);
          }
        })();

        // busca dados da empresa para o cabeçalho do PDF
        (async () => {
          try {
            const res = await axiosInstance.get('/empresa/');
            if (res.data && res.data.length > 0) {
              setEmpresa(res.data[0]);
            }
          } catch (err) {
            console.error('Erro ao buscar dados da empresa:', err);
          }
        })();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, user, permissions]); // Roda só na carga inicial

  const handleFiltrar = () => {
    fetchMovimentos();
  };

  // função para calcular os totais (baseado nos filtros atuais)
  const handleCalcularTotalizador = () => {
    setLoadingTotais(true);
    setShowTotalizador(true);

    try {
      // Calcula totais a partir dos movimentos j� filtrados
      const totalReceitas = movimentos
        .filter(conta => conta.tipo_conta === 'Receber')
        .reduce((acc, conta) => acc + parseFloat(conta.valor_liquidado || 0), 0);

      const totalDespesas = movimentos
        .filter(conta => conta.tipo_conta === 'Pagar')
        .reduce((acc, conta) => acc + parseFloat(conta.valor_liquidado || 0), 0);

      const saldo = totalReceitas - totalDespesas;

      setTotais({
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldo: saldo
      });

    } catch (error) {
      console.error("Erro ao calcular totais:", error);
      alert("Erro ao calcular totais.");
    } finally {
      setLoadingTotais(false);
    }
  };

  // Funções de Relatório
  const handleImprimirRelatorio = async () => {
    if (movimentos.length === 0) {
      alert('não há movimentos para imprimir. Use os filtros para buscar dados.');
      return;
    }

    try {
      const contaBancariaNome = contaBaixa ?
        contasBancarias.find(cb => (cb.id_conta_bancaria || cb.id) === contaBaixa)?.nome_conta || '' : '';

      const filtros = {
        dataInicial,
        dataFinal,
        tipoMovimento,
        contaBancaria: contaBancariaNome
      };

      await imprimirRelatorio(movimentos, filtros, totais, empresa);
    } catch (error) {
      console.error('Erro ao imprimir relatório:', error);
      alert('Erro ao imprimir relatório.');
    }
  };

  const handleBaixarPDF = async () => {
    if (movimentos.length === 0) {
      alert('não há movimentos para exportar. Use os filtros para buscar dados.');
      return;
    }

    try {
      const contaBancariaNome = contaBaixa ?
        contasBancarias.find(cb => (cb.id_conta_bancaria || cb.id) === contaBaixa)?.nome_conta || '' : '';

      const filtros = {
        dataInicial,
        dataFinal,
        tipoMovimento,
        contaBancaria: contaBancariaNome
      };

      await baixarPDFRelatorio(movimentos, filtros, totais, empresa);
      alert('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      alert('Erro ao baixar PDF.');
    }
  };

  const handleCompartilharWhatsApp = async () => {
    if (movimentos.length === 0) {
      alert('não há movimentos para compartilhar. Use os filtros para buscar dados.');
      return;
    }

    try {
      const contaBancariaNome = contaBaixa ?
        contasBancarias.find(cb => (cb.id_conta_bancaria || cb.id) === contaBaixa)?.nome_conta || '' : '';

      const filtros = {
        dataInicial,
        dataFinal,
        tipoMovimento,
        contaBancaria: contaBancariaNome
      };

      await compartilharWhatsApp(movimentos, filtros, totais, empresa);
    } catch (error) {
      console.error('Erro ao compartilhar via WhatsApp:', error);
      alert('Erro ao compartilhar via WhatsApp.');
    }
  };


  // --- Renderização ---

  if (authLoading) {
    return <CircularProgress />;
  }

  if (!user.is_staff && !permissions.financeiro_acessar) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>
          <LockIcon sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
          Acesso Negado
        </Typography>
        <Typography variant="body1">
          Você não tem permissão para acessar o módulo Bancário/Financeiro.
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Typography variant="h5" sx={{ mb: 3, alignSelf: 'flex-start' }}>
          Extrato Bancário (Movimentações)
        </Typography>

        {/* --- BARRA DE FILTROS --- */}
        <Paper elevation={2} sx={{ p: 2, mb: 3, width: '100%', bgcolor: 'grey.50' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                label="Data Mov. Inicial"
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Data Mov. Final"
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel id="tipo-mov-label">Tipo</InputLabel>
                <Select
                  labelId="tipo-mov-label"
                  value={tipoMovimento}
                  label="Tipo"
                  onChange={(e) => setTipoMovimento(e.target.value)}
                >
                  <MenuItem value="Todos">Todos</MenuItem>
                  <MenuItem value="Receita">Receitas (Recebimentos)</MenuItem>
                  <MenuItem value="Despesa">Despesas (Pagamentos)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel id="conta-baixa-label">Conta de Baixa</InputLabel>
                <Select
                  labelId="conta-baixa-label"
                  value={contaBaixa}
                  label="Conta de Baixa"
                  onChange={(e) => setContaBaixa(e.target.value)}
                >
                  <MenuItem value=""><em>Todas</em></MenuItem>
                  {contasBancarias.map((cb) => (
                    <MenuItem key={cb.id_conta_bancaria || cb.id} value={cb.id_conta_bancaria || cb.id}>
                      {cb.nome_conta || cb.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1.5}>
              <Button
                variant="contained"
                onClick={handleFiltrar}
                startIcon={<SearchIcon />}
                fullWidth
                sx={{ height: '56px' }}
              >
                Filtrar
              </Button>
            </Grid>
            <Grid item xs={12} sm={1.5}>
              <Button
                variant="outlined"
                onClick={handleCalcularTotalizador}
                startIcon={<CalculateIcon />}
                fullWidth
                sx={{ height: '56px' }}
              >
                Totais
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* --- BOTÕES DE RELATÓRIO --- */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, width: '100%', justifyContent: 'flex-start' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleImprimirRelatorio}
            startIcon={<PrintIcon />}
            disabled={movimentos.length === 0}
          >
            Imprimir Relatório
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleBaixarPDF}
            startIcon={<PictureAsPdfIcon />}
            disabled={movimentos.length === 0}
          >
            Baixar PDF
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleCompartilharWhatsApp}
            startIcon={<WhatsAppIcon />}
            disabled={movimentos.length === 0}
          >
            Compartilhar WhatsApp
          </Button>
        </Box>

        {/* --- LISTA DE MOVIMENTOS --- */}
        {loading ? (<CircularProgress sx={{ mt: 2 }} />)
          : movimentos.length === 0 ? (<Typography sx={{ mt: 2 }}>(Nenhuma movimentação encontrada para este período)</Typography>)
            : (
              <List sx={{ width: '100%', bgcolor: 'background.paper', mt: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                {movimentos.map((conta, index) => {
                  const isReceita = conta.tipo_conta === 'Receber';
                  const valor = parseFloat(conta.valor_liquidado);
                  const corValor = isReceita ? 'success.main' : 'error.main';

                  return (
                    <React.Fragment key={conta.id_conta}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body1">
                                {conta.descricao}
                              </Typography>
                              <Typography variant="h6" sx={{ color: corValor }}>
                                {isReceita ? '+' : '-'} R$ {valor.toFixed(2)}
                              </Typography>
                            </Box>
                          }
                          secondary={`Movimento: ${new Date(conta.data_pagamento + 'T00:00:00-03:00').toLocaleDateString('pt-BR')} | Tipo: ${isReceita ? 'Receita' : 'Despesa'} | Forma Pgto: ${conta.forma_pagamento || 'N/A'}`}
                        />
                      </ListItem>
                      {index < movimentos.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
      </Box>

      {/* --- DIALOG DO TOTALIZADOR --- */}
      <Dialog open={showTotalizador} onClose={() => setShowTotalizador(false)} fullWidth maxWidth="xs">
        <DialogTitle>Totalizador do Período</DialogTitle>
        <DialogContent dividers>
          {loadingTotais ? <CircularProgress /> : (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'success.main', bgcolor: 'success.lightest' }}>
                <Typography variant="body1">Total de Receitas:</Typography>
                <Typography variant="h5" sx={{ color: 'success.dark', fontWeight: 'bold' }}>
                  R$ {totais.receitas.toFixed(2)}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'error.main', bgcolor: 'error.lightest' }}>
                <Typography variant="body1">Total de Despesas:</Typography>
                <Typography variant="h5" sx={{ color: 'error.dark', fontWeight: 'bold' }}>
                  - R$ {totais.despesas.toFixed(2)}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderColor: totais.saldo >= 0 ? 'primary.main' : 'error.main' }}>
                <Typography variant="body1">Saldo do Período:</Typography>
                <Typography variant="h5" sx={{ color: totais.saldo >= 0 ? 'primary.dark' : 'error.dark', fontWeight: 'bold' }}>
                  R$ {totais.saldo.toFixed(2)}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTotalizador(false)} startIcon={<CloseIcon />}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default BancarioPage;
