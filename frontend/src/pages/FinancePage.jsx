import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Button, Alert,
  CircularProgress, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import UndoIcon from '@mui/icons-material/Undo';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../context/AuthContext';

// Função auxiliar para formatar data sem conversão de timezone
const formatarData = (dataString) => {
  if (!dataString) return '-';
  // Adiciona 'T00:00:00' para forçar interpretação como local, não UTC
  const data = new Date(dataString + 'T00:00:00');
  return data.toLocaleDateString('pt-BR');
};

// v2.0 - Bancário Tab Implemented
const FinancePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [contasReceber, setContasReceber] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);
  const { axiosInstance, user, permissions, isLoading: authLoading } = useAuth();

  const [filtros, setFiltros] = useState({
    operacao: 'todas',
    dataVencimentoInicio: '',
    dataVencimentoFim: '',
    dataDocumentoInicio: '',
    dataDocumentoFim: '',
    idOperacao: '',
    idClienteFornecedor: ''
  });

  const [operacoes, setOperacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [contasBancarias, setContasBancarias] = useState([]);
  const [centrosCusto, setCentrosCusto] = useState([]);
  const [contaBancariaSelecionada, setContaBancariaSelecionada] = useState('');

  // Estados para modais
  const [openAcerto, setOpenAcerto] = useState(false);
  const [openTransferencia, setOpenTransferencia] = useState(false);
  const [openRetirada, setOpenRetirada] = useState(false);
  const [openExcluir, setOpenExcluir] = useState(false);
  const [openBaixa, setOpenBaixa] = useState(false);
  const [openBaixaBloco, setOpenBaixaBloco] = useState(false);
  const [contasSelecionadas, setContasSelecionadas] = useState([]);

  const [formAcerto, setFormAcerto] = useState({ valor: '', descricao: '' });
  const [formTransferencia, setFormTransferencia] = useState({ contaDestino: '', valor: '', descricao: '' });
  const [formRetirada, setFormRetirada] = useState({ valor: '', descricao: '' });
  const [movimentacaoExcluir, setMovimentacaoExcluir] = useState(null);
  const [contaBaixa, setContaBaixa] = useState(null);
  const [openNovaConta, setOpenNovaConta] = useState(false);
  const [tipoNovaConta, setTipoNovaConta] = useState('Receber');
  const [formNovaConta, setFormNovaConta] = useState({
    descricao: '',
    valor_parcela: '',
    data_vencimento: new Date().toISOString().split('T')[0],
    id_cliente_fornecedor: '',
    documento_numero: '',
    parcela_numero: 1,
    parcela_total: 1,
    id_operacao: '',
    id_centro_custo: '',
    id_conta_bancaria: '',
  });
  const [formBaixa, setFormBaixa] = useState({
    data_pagamento: new Date().toISOString().split('T')[0],
    valor_pago: 0,
    forma_pagamento: '',
    id_conta_bancaria: ''
  });

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const contasReceberResponse = await axiosInstance.get('/contas/?tipo_conta=Receber');
      const contas_receber = contasReceberResponse.data.results || contasReceberResponse.data || [];
      console.log('📊 Contas Receber:', contas_receber);
      if (contas_receber.length > 0) {
        console.log('📋 Exemplo de conta receber:', contas_receber[0]);
        console.log('📋 Campos importantes:', {
          tipo_conta: contas_receber[0].tipo_conta,
          data_pagamento: contas_receber[0].data_pagamento,
          status_conta: contas_receber[0].status_conta
        });
      }
      const contasPagarResponse = await axiosInstance.get('/contas/?tipo_conta=Pagar');
      const contas_pagar = contasPagarResponse.data.results || contasPagarResponse.data || [];
      console.log('📊 Contas Pagar:', contas_pagar);
      const operacoesResponse = await axiosInstance.get('/operacoes/');
      const ops = operacoesResponse.data.results || operacoesResponse.data || [];
      const clientesResponse = await axiosInstance.get('/clientes/?page_size=1000');
      const cl = clientesResponse.data.results || clientesResponse.data || [];
      const fornecedoresResponse = await axiosInstance.get('/fornecedores/?page_size=1000');
      const fn = fornecedoresResponse.data.results || fornecedoresResponse.data || [];
      const contasBancariasResponse = await axiosInstance.get('/contas-bancarias/');
      const cb = contasBancariasResponse.data.results || contasBancariasResponse.data || [];
      const centrosCustoResponse = await axiosInstance.get('/centro-custo/');
      const cc = centrosCustoResponse.data.results || centrosCustoResponse.data || [];
      setOperacoes(ops);
      setClientes(cl);
      setFornecedores(fn);
      setContasBancarias(cb);
      setCentrosCusto(cc);
      setContasReceber(contas_receber);
      setContasPagar(contas_pagar);
    } catch (err) {
      setError('Erro ao carregar dados financeiros');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalBaixa = (conta) => {
    setContaBaixa(conta);
    setFormBaixa({
      data_pagamento: new Date().toISOString().split('T')[0],
      valor_pago: conta.valor_parcela || conta.valor_original || conta.valor || 0,
      forma_pagamento: '',
      id_conta_bancaria: contasBancarias.length > 0 ? contasBancarias[0].id_conta_bancaria : ''
    });
    setOpenBaixa(true);
  };

  const darBaixaConta = async () => {
    if (!formBaixa.forma_pagamento) {
      setError('Selecione a forma de pagamento');
      return;
    }

    if (!formBaixa.id_conta_bancaria) {
      setError('Selecione a conta bancária');
      return;
    }

    try {
      setLoading(true);

      // Determinar qual campo usar baseado no tipo de conta
      const campoContaBancaria = contaBaixa.tipo_conta === 'Receber' ? 'id_conta_cobranca' : 'id_conta_baixa';

      await axiosInstance.patch(`/contas/${contaBaixa.id_conta}/`, {
        status_conta: 'Paga',
        data_pagamento: formBaixa.data_pagamento,
        valor_liquidado: parseFloat(formBaixa.valor_pago),
        saldo_devedor: 0,
        forma_pagamento: formBaixa.forma_pagamento,
        [campoContaBancaria]: formBaixa.id_conta_bancaria
      });

      setSuccess('✅ Baixa realizada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setOpenBaixa(false);
      await fetchFinancialData();

    } catch (err) {
      console.error('❌ Erro ao dar baixa:', err);
      setError(err.response?.data?.detail || 'Erro ao dar baixa');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelecaoConta = (idConta) => {
    setContasSelecionadas(prev => {
      if (prev.includes(idConta)) {
        return prev.filter(id => id !== idConta);
      } else {
        return [...prev, idConta];
      }
    });
  };

  const selecionarTodasContas = () => {
    const contasPendentes = filtrarContas(contasReceber.filter(c => c.status_conta !== 'Paga'), 'receber');
    const todosIds = contasPendentes.map(c => c.id_conta);
    setContasSelecionadas(todosIds);
  };

  const deselecionarTodasContas = () => {
    setContasSelecionadas([]);
  };

  const abrirModalBaixaBloco = () => {
    if (contasSelecionadas.length === 0) {
      setError('Selecione ao menos uma conta para dar baixa');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setFormBaixa({
      data_pagamento: new Date().toISOString().split('T')[0],
      valor_pago: 0,
      forma_pagamento: '',
      id_conta_bancaria: contasBancarias.length > 0 ? contasBancarias[0].id_conta_bancaria : ''
    });
    setOpenBaixaBloco(true);
  };

  const darBaixaEmBloco = async () => {
    if (!formBaixa.forma_pagamento) {
      setError('Selecione a forma de pagamento');
      return;
    }

    if (!formBaixa.id_conta_bancaria) {
      setError('Selecione a conta bancária');
      return;
    }

    try {
      setLoading(true);

      // Buscar detalhes das contas selecionadas para determinar o tipo
      const contasParaBaixar = contasReceber.filter(c => contasSelecionadas.includes(c.id_conta));

      let sucessos = 0;
      let erros = 0;

      for (const conta of contasParaBaixar) {
        try {
          const campoContaBancaria = conta.tipo_conta === 'Receber' ? 'id_conta_cobranca' : 'id_conta_baixa';

          await axiosInstance.patch(`/contas/${conta.id_conta}/`, {
            status_conta: 'Paga',
            data_pagamento: formBaixa.data_pagamento,
            valor_liquidado: parseFloat(conta.valor_parcela || conta.valor_original || 0),
            saldo_devedor: 0,
            forma_pagamento: formBaixa.forma_pagamento,
            [campoContaBancaria]: formBaixa.id_conta_bancaria
          });

          sucessos++;
        } catch (err) {
          console.error(`❌ Erro ao dar baixa na conta ${conta.id_conta}:`, err);
          erros++;
        }
      }

      setSuccess(`✅ Baixa em bloco concluída! ${sucessos} conta(s) baixada(s)${erros > 0 ? `, ${erros} erro(s)` : ''}`);
      setTimeout(() => setSuccess(''), 5000);
      setOpenBaixaBloco(false);
      setContasSelecionadas([]);
      await fetchFinancialData();

    } catch (err) {
      console.error('❌ Erro ao dar baixa em bloco:', err);
      setError(err.response?.data?.detail || 'Erro ao dar baixa em bloco');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const estornarConta = async (conta) => {
    if (!window.confirm(`Deseja realmente estornar a conta "${conta.descricao || conta.documento_numero}"?\n\nIsso criará um lançamento de ESTORNO no extrato bancário.`)) {
      return;
    }

    try {
      setLoading(true);

      const valorEstorno = parseFloat(conta.valor_liquidado || conta.valor_original || 0);
      const tipoOriginal = conta.tipo_conta; // 'Receber' ou 'Pagar'

      console.log('💰 Dados da conta a estornar:', conta);
      console.log('💵 Valor do estorno:', valorEstorno);
      console.log('📋 Tipo original:', tipoOriginal);

      // 1. Criar movimentação bancária de ESTORNO (débito/saída)
      // Se era Receber que foi pago, o estorno é um débito (saída de dinheiro)
      // Se era Pagar que foi pago, o estorno é um crédito (volta dinheiro)

      // Buscar conta bancária padrão se não tiver associada
      let contaBancariaId = conta.id_conta_bancaria;

      if (!contaBancariaId && contasBancarias.length > 0) {
        // Usa a primeira conta bancária disponível
        contaBancariaId = contasBancarias[0].id_conta_bancaria;
        console.log('🏦 Usando conta bancária padrão:', contaBancariaId);
      }

      if (contaBancariaId) {
        const movimentacaoEstorno = {
          descricao: `ESTORNO - ${conta.descricao || conta.documento_numero || 'Conta'}`,
          tipo: 'ESTORNO',
          tipo_movimentacao: tipoOriginal === 'Receber' ? 'Débito' : 'Crédito',
          valor: valorEstorno,
          data_movimentacao: new Date().toISOString().split('T')[0],
          id_conta_bancaria: contaBancariaId,
          observacao: `Estorno de ${tipoOriginal === 'Receber' ? 'recebimento' : 'pagamento'} - Conta #${conta.id_conta}`
        };

        console.log('🏦 Criando movimentação bancária:', movimentacaoEstorno);

        try {
          const response = await axiosInstance.post('/movimentacoes-bancarias/', movimentacaoEstorno);
          console.log('✅ Movimentação de estorno criada:', response.data);
        } catch (movErr) {
          console.error('❌ Erro ao criar movimentação bancária de estorno:', movErr.response?.data || movErr);
          // Continua mesmo se falhar
        }
      } else {
        console.warn('⚠️ Nenhuma conta bancária disponível para criar movimentação');
      }

      // 2. Atualizar conta para status Pendente e remover data de pagamento
      await axiosInstance.patch(`/contas/${conta.id_conta}/`, {
        status_conta: 'Pendente',
        data_pagamento: null,
        valor_liquidado: 0
      });

      setSuccess(`✅ Conta estornada com sucesso! Movimentação bancária de estorno registrada.`);
      setTimeout(() => setSuccess(''), 3000);

      // Recarregar dados
      await fetchFinancialData();

    } catch (err) {
      console.error('❌ Erro ao estornar conta:', err);
      setError(err.response?.data?.detail || 'Erro ao estornar conta');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const abrirNovaConta = (tipo) => {
    setTipoNovaConta(tipo);
    setFormNovaConta({
      descricao: '',
      valor_parcela: '',
      data_vencimento: new Date().toISOString().split('T')[0],
      id_cliente_fornecedor: '',
      documento_numero: '',
      parcela_numero: 1,
      parcela_total: 1,
      id_operacao: '',
      id_centro_custo: '',
      id_conta_bancaria: contasBancarias.length > 0 ? contasBancarias[0].id_conta_bancaria : '',
    });
    setOpenNovaConta(true);
  };

  const criarConta = async () => {
    if (!formNovaConta.descricao.trim()) { setError('Informe a descrição.'); return; }
    if (!formNovaConta.valor_parcela || parseFloat(formNovaConta.valor_parcela) <= 0) { setError('Informe um valor válido.'); return; }
    if (!formNovaConta.data_vencimento) { setError('Informe a data de vencimento.'); return; }
    try {
      setLoading(true);
      const payload = {
        tipo_conta: tipoNovaConta,
        descricao: formNovaConta.descricao.trim(),
        valor_parcela: parseFloat(formNovaConta.valor_parcela),
        data_vencimento: formNovaConta.data_vencimento,
        status_conta: 'Pendente',
        parcela_numero: formNovaConta.parcela_numero || 1,
        parcela_total: formNovaConta.parcela_total || 1,
        gerencial: 1,
      };
      if (formNovaConta.id_cliente_fornecedor) payload.id_cliente_fornecedor = formNovaConta.id_cliente_fornecedor;
      if (formNovaConta.documento_numero) payload.documento_numero = formNovaConta.documento_numero;
      if (formNovaConta.id_operacao) payload.id_operacao = formNovaConta.id_operacao;
      if (formNovaConta.id_centro_custo) payload.id_centro_custo = formNovaConta.id_centro_custo;
      if (formNovaConta.id_conta_bancaria) {
        if (tipoNovaConta === 'Receber') payload.id_conta_cobranca = formNovaConta.id_conta_bancaria;
        else payload.id_conta_baixa = formNovaConta.id_conta_bancaria;
      }
      await axiosInstance.post('/contas/', payload);
      setSuccess(`✅ Conta a ${tipoNovaConta} criada com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
      setOpenNovaConta(false);
      await fetchFinancialData();
    } catch (err) {
      console.error('Erro ao criar conta:', err);
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Erro ao criar conta.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [axiosInstance]);

  const filtrarContas = (contas, tipo) => {
    let resultado = [...contas];

    if (filtros.operacao !== 'todas') {
      if (filtros.operacao === 'receber') {
        resultado = resultado.filter(c => tipo === 'receber');
      } else if (filtros.operacao === 'pagar') {
        resultado = resultado.filter(c => tipo === 'pagar');
      }
    }

    if (filtros.idOperacao) {
      resultado = resultado.filter(c => c.id_operacao == filtros.idOperacao);
    }

    if (filtros.idClienteFornecedor) {
      resultado = resultado.filter(c => c.id_cliente_fornecedor == filtros.idClienteFornecedor);
    }

    if (filtros.dataVencimentoInicio) {
      resultado = resultado.filter(c => {
        if (!c.data_vencimento) return false;
        return new Date(c.data_vencimento) >= new Date(filtros.dataVencimentoInicio);
      });
    }

    if (filtros.dataVencimentoFim) {
      resultado = resultado.filter(c => {
        if (!c.data_vencimento) return false;
        return new Date(c.data_vencimento) <= new Date(filtros.dataVencimentoFim);
      });
    }

    if (filtros.dataDocumentoInicio) {
      const dataField = tipo === 'receber' ? 'data_documento' : 'data_emissao';
      resultado = resultado.filter(c => {
        const dataRef = c[dataField] || c.data_vencimento;
        if (!dataRef) return false;
        return new Date(dataRef) >= new Date(filtros.dataDocumentoInicio);
      });
    }

    if (filtros.dataDocumentoFim) {
      const dataField = tipo === 'receber' ? 'data_documento' : 'data_emissao';
      resultado = resultado.filter(c => {
        const dataRef = c[dataField] || c.data_vencimento;
        if (!dataRef) return false;
        return new Date(dataRef) <= new Date(filtros.dataDocumentoFim);
      });
    }

    return resultado;
  };

  const handleFiltroChange = (field, value) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  const limparFiltros = () => {
    setFiltros({
      operacao: 'todas',
      dataVencimentoInicio: '',
      dataVencimentoFim: '',
      dataDocumentoInicio: '',
      dataDocumentoFim: '',
      idOperacao: '',
      idClienteFornecedor: ''
    });
  };

  // Determinar qual aba de contas a receber/pagar está ativa
  const isAbaReceber = tabValue === 1 || tabValue === 2; // A Receber ou Recebidas
  const isAbaPagar = tabValue === 3 || tabValue === 4; // A Pagar ou Pagas

  // Filtrar operações baseado na aba ativa
  const operacoesDisponiveis = operacoes.filter(op => {
    // Se está em Receber/Recebidas, mostrar apenas Venda/Saída
    if (isAbaReceber) {
      return op.nome_operacao?.toLowerCase().includes('venda') ||
        op.nome_operacao?.toLowerCase().includes('saída') ||
        op.nome_operacao?.toLowerCase().includes('saida');
    }
    // Se está em Pagar/Pagas, mostrar apenas Compra
    if (isAbaPagar) {
      return op.nome_operacao?.toLowerCase().includes('compra');
    }
    return true;
  });

  // Filtrar clientes/fornecedores baseado na aba ativa
  const clientesFornecedoresDisponiveis = isAbaReceber ? clientes : fornecedores;
  const labelClienteFornecedor = isAbaReceber ? 'Cliente' : 'Fornecedor';

  const getTotalizados = () => {
    const aReceber = filtrarContas(contasReceber.filter(c => c.status_conta !== 'Paga'), 'receber');
    const recebido = filtrarContas(contasReceber.filter(c => c.status_conta === 'Paga'), 'receber');
    const aPagar = filtrarContas(contasPagar.filter(c => c.status_conta !== 'Paga'), 'pagar');
    const pago = filtrarContas(contasPagar.filter(c => c.status_conta === 'Paga'), 'pagar');

    return {
      aReceber: { valor: aReceber.reduce((sum, c) => sum + parseFloat(c.valor_parcela || 0), 0), count: aReceber.length },
      recebido: { valor: recebido.reduce((sum, c) => sum + parseFloat(c.valor_liquidado || 0), 0), count: recebido.length },
      aPagar: { valor: aPagar.reduce((sum, c) => sum + parseFloat(c.valor_parcela || 0), 0), count: aPagar.length },
      pago: { valor: pago.reduce((sum, c) => sum + parseFloat(c.valor_liquidado || 0), 0), count: pago.length }
    };
  };

  if (loading || authLoading) {
    return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  }

  if (!user?.is_staff && !permissions?.financeiro_acessar) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Você não tem permissão para acessar esta página.</Alert>
      </Box>
    );
  }

  const totalizados = getTotalizados();

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Financeiro</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* TOTALIZADOS */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1565c0' }}>
          📊 Totalizados (Dados Exibidos)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#fff3e0' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>💰 A Receber</Typography>
                <Typography variant="h5" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                  R$ {totalizados.aReceber.valor.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">{totalizados.aReceber.count} conta(s)</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#e8f5e9' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>✅ Recebido</Typography>
                <Typography variant="h5" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                  R$ {totalizados.recebido.valor.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">{totalizados.recebido.count} conta(s)</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#ffebee' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>💸 A Pagar</Typography>
                <Typography variant="h5" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                  R$ {totalizados.aPagar.valor.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">{totalizados.aPagar.count} conta(s)</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: '#e0f2f1' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>✔️ Pago</Typography>
                <Typography variant="h5" sx={{ color: '#00796b', fontWeight: 'bold' }}>
                  R$ {totalizados.pago.valor.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">{totalizados.pago.count} conta(s)</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #90caf9' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ backgroundColor: '#f3e5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>Total Geral a Receber</Typography>
                <Typography variant="h6" sx={{ color: '#6a1b9a', fontWeight: 'bold' }}>
                  R$ {(totalizados.aReceber.valor + totalizados.aPagar.valor).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ backgroundColor: '#e0f7fa', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>Total Geral Recebido/Pago</Typography>
                <Typography variant="h6" sx={{ color: '#00838f', fontWeight: 'bold' }}>
                  R$ {(totalizados.recebido.valor + totalizados.pago.valor).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ backgroundColor: '#fce4ec', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>Saldo Líquido</Typography>
                <Typography variant="h6" sx={{ color: '#880e4f', fontWeight: 'bold' }}>
                  R$ {(
                    (totalizados.recebido.valor + totalizados.aReceber.valor) -
                    (totalizados.pago.valor + totalizados.aPagar.valor)
                  ).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* FILTROS */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>🔍 Filtros</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Operação</InputLabel>
              <Select value={filtros.operacao} label="Operação" onChange={(e) => handleFiltroChange('operacao', e.target.value)}>
                <MenuItem value="todas">Todas</MenuItem>
                <MenuItem value="receber">A Receber</MenuItem>
                <MenuItem value="pagar">A Pagar</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" label="Vencimento Início" type="date" InputLabelProps={{ shrink: true }}
              value={filtros.dataVencimentoInicio} onChange={(e) => handleFiltroChange('dataVencimentoInicio', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" label="Vencimento Fim" type="date" InputLabelProps={{ shrink: true }}
              value={filtros.dataVencimentoFim} onChange={(e) => handleFiltroChange('dataVencimentoFim', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button fullWidth variant="outlined" size="small" onClick={limparFiltros} sx={{ height: '40px' }}>
              Limpar Filtros
            </Button>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" label="Doc. Início" type="date" InputLabelProps={{ shrink: true }}
              value={filtros.dataDocumentoInicio} onChange={(e) => handleFiltroChange('dataDocumentoInicio', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" label="Doc. Fim" type="date" InputLabelProps={{ shrink: true }}
              value={filtros.dataDocumentoFim} onChange={(e) => handleFiltroChange('dataDocumentoFim', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Operação (Venda/Compra)</InputLabel>
              <Select value={filtros.idOperacao} label="Operação (Venda/Compra)" onChange={(e) => handleFiltroChange('idOperacao', e.target.value)}>
                <MenuItem value="">Todas as Operações</MenuItem>
                {operacoesDisponiveis.map((op) => (
                  <MenuItem key={op.id_operacao} value={op.id_operacao}>{op.nome_operacao}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{labelClienteFornecedor}</InputLabel>
              <Select value={filtros.idClienteFornecedor} label={labelClienteFornecedor} onChange={(e) => handleFiltroChange('idClienteFornecedor', e.target.value)}>
                <MenuItem value="">Todos os {labelClienteFornecedor}s</MenuItem>
                {clientesFornecedoresDisponiveis.map((item) => {
                  const id = isAbaReceber ? item.id_cliente : item.id_fornecedor;
                  return (
                    <MenuItem key={id} value={id}>{item.nome_razao_social}</MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* ABAS */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => {
          setTabValue(newValue);
          // Limpar filtros de cliente/fornecedor ao mudar de aba
          setFiltros(prev => ({ ...prev, idClienteFornecedor: '', idOperacao: '' }));
        }}>
          <Tab label="Fluxo de Caixa" />
          <Tab label={`A Receber (${contasReceber.filter(c => c.status_conta !== 'Paga').length})`} />
          <Tab label={`Recebidas (${contasReceber.filter(c => c.status_conta === 'Paga').length})`} />
          <Tab label={`A Pagar (${contasPagar.filter(c => c.status_conta !== 'Paga').length})`} />
          <Tab label={`Pagas (${contasPagar.filter(c => c.status_conta === 'Paga').length})`} />
          <Tab label={`Bancário (${contasBancarias.length})`} />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 3 }}>
        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Fluxo de Caixa</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Visualização do fluxo de caixa com entradas, saídas e saldo líquido
            </Alert>

            <Grid container spacing={3}>
              {/* RESUMO GERAL */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, backgroundColor: '#f0f4c3', borderLeft: '4px solid #827717' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Resumo Geral do Fluxo</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3} key="entradas">
                      <Box sx={{ backgroundColor: '#e8f5e9', p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>Total de Entradas</Typography>
                        <Typography variant="h5" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                          R$ {(getTotalizados().recebido.valor + getTotalizados().aReceber.valor).toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} key="saidas">
                      <Box sx={{ backgroundColor: '#ffebee', p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>Total de Saídas</Typography>
                        <Typography variant="h5" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                          R$ {(getTotalizados().pago.valor + getTotalizados().aPagar.valor).toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} key="saldo">
                      <Box sx={{ backgroundColor: '#e3f2fd', p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>Saldo Líquido</Typography>
                        <Typography variant="h5" sx={{
                          color: (getTotalizados().recebido.valor + getTotalizados().aReceber.valor) - (getTotalizados().pago.valor + getTotalizados().aPagar.valor) >= 0 ? '#1565c0' : '#d32f2f',
                          fontWeight: 'bold'
                        }}>
                          R$ {((getTotalizados().recebido.valor + getTotalizados().aReceber.valor) - (getTotalizados().pago.valor + getTotalizados().aPagar.valor)).toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} key="recebido">
                      <Box sx={{ backgroundColor: '#f3e5f5', p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>Total Recebido</Typography>
                        <Typography variant="h5" sx={{ color: '#6a1b9a', fontWeight: 'bold' }}>
                          R$ {getTotalizados().recebido.valor.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* CONTAS A RECEBER PENDENTES */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, backgroundColor: '#fff3e0', borderLeft: '4px solid #f57c00' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                    💰 Contas a Receber (Pendentes)
                  </Typography>
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#ffe0b2' }}>
                          <TableCell><strong>Descrição</strong></TableCell>
                          <TableCell><strong>Vencimento</strong></TableCell>
                          <TableCell align="right"><strong>Valor</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filtrarContas(contasReceber.filter(c => c.status_conta !== 'Paga'), 'receber').length > 0 ? (
                          filtrarContas(contasReceber.filter(c => c.status_conta !== 'Paga'), 'receber').map((conta) => (
                            <TableRow key={conta.id_conta}>
                              <TableCell>{conta.descricao || `Venda #${conta.id_venda_origem}`}</TableCell>
                              <TableCell>{formatarData(conta.data_vencimento)}</TableCell>
                              <TableCell align="right">R$ {parseFloat(conta.valor_parcela || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ color: '#999', py: 2 }}>Nenhuma conta a receber</TableCell>
                          </TableRow>
                        )}
                        <TableRow sx={{ backgroundColor: '#ffe0b2', fontWeight: 'bold' }}>
                          <TableCell colSpan={2}><strong>TOTAL A RECEBER</strong></TableCell>
                          <TableCell align="right"><strong>R$ {filtrarContas(contasReceber.filter(c => c.status_conta !== 'Paga'), 'receber').reduce((sum, c) => sum + parseFloat(c.valor_parcela || 0), 0).toFixed(2)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* CONTAS A PAGAR PENDENTES */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, backgroundColor: '#ffebee', borderLeft: '4px solid #d32f2f' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                    💸 Contas a Pagar (Pendentes)
                  </Typography>
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#ffcdd2' }}>
                          <TableCell><strong>Descrição</strong></TableCell>
                          <TableCell><strong>Vencimento</strong></TableCell>
                          <TableCell align="right"><strong>Valor</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filtrarContas(contasPagar.filter(c => c.status_conta !== 'Paga'), 'pagar').length > 0 ? (
                          filtrarContas(contasPagar.filter(c => c.status_conta !== 'Paga'), 'pagar').map((conta) => (
                            <TableRow key={conta.id_conta}>
                              <TableCell>{conta.descricao || `Compra #${conta.id_compra_origem}`}</TableCell>
                              <TableCell>{formatarData(conta.data_vencimento)}</TableCell>
                              <TableCell align="right">R$ {parseFloat(conta.valor_parcela || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ color: '#999', py: 2 }}>Nenhuma conta a pagar</TableCell>
                          </TableRow>
                        )}
                        <TableRow sx={{ backgroundColor: '#ffcdd2', fontWeight: 'bold' }}>
                          <TableCell colSpan={2}><strong>TOTAL A PAGAR</strong></TableCell>
                          <TableCell align="right"><strong>R$ {filtrarContas(contasPagar.filter(c => c.status_conta !== 'Paga'), 'pagar').reduce((sum, c) => sum + parseFloat(c.valor_parcela || 0), 0).toFixed(2)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* MOVIMENTAÇÕES REALIZADAS */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, backgroundColor: '#e8f5e9', borderLeft: '4px solid #388e3c' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#388e3c' }}>
                    ✅ Movimentações Realizadas
                  </Typography>
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#c8e6c9' }}>
                          <TableCell><strong>Tipo</strong></TableCell>
                          <TableCell><strong>Descrição</strong></TableCell>
                          <TableCell><strong>Data</strong></TableCell>
                          <TableCell align="right"><strong>Valor</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(filtrarContas(contasReceber.filter(c => c.status_conta === 'Paga'), 'receber').length > 0 || filtrarContas(contasPagar.filter(c => c.status_conta === 'Paga'), 'pagar').length > 0) ? (
                          <>
                            {filtrarContas(contasReceber.filter(c => c.status_conta === 'Paga'), 'receber').map((conta) => (
                              <TableRow key={`rec-${conta.id_conta}`} sx={{ backgroundColor: '#f1f8f6' }}>
                                <TableCell><Chip label="Entrada" color="success" size="small" /></TableCell>
                                <TableCell>{conta.descricao || `Venda #${conta.id_venda_origem}`}</TableCell>
                                <TableCell>{formatarData(conta.data_pagamento)}</TableCell>
                                <TableCell align="right">+ R$ {parseFloat(conta.valor_liquidado || 0).toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                            {filtrarContas(contasPagar.filter(c => c.status_conta === 'Paga'), 'pagar').map((conta) => (
                              <TableRow key={`pag-${conta.id_conta}`} sx={{ backgroundColor: '#fff5f5' }}>
                                <TableCell><Chip label="Saída" color="error" size="small" /></TableCell>
                                <TableCell>{conta.descricao || `Compra #${conta.id_compra_origem}`}</TableCell>
                                <TableCell>{formatarData(conta.data_pagamento)}</TableCell>
                                <TableCell align="right">- R$ {parseFloat(conta.valor_liquidado || 0).toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ color: '#999', py: 2 }}>Nenhuma movimentação realizada</TableCell>
                          </TableRow>
                        )}
                        <TableRow sx={{ backgroundColor: '#c8e6c9', fontWeight: 'bold' }}>
                          <TableCell colSpan={3}><strong>TOTAL MOVIMENTADO</strong></TableCell>
                          <TableCell align="right"><strong>R$ {(getTotalizados().recebido.valor - getTotalizados().pago.valor).toFixed(2)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Contas a Receber</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => abrirNovaConta('Receber')}
                >
                  Nova Conta a Receber
                </Button>
                {contasSelecionadas.length > 0 && (
                  <>
                    <Chip
                      label={`${contasSelecionadas.length} selecionada(s)`}
                      color="primary"
                      onDelete={deselecionarTodasContas}
                    />
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={abrirModalBaixaBloco}
                    >
                      Dar Baixa em Bloco
                    </Button>
                  </>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={contasSelecionadas.length === 0 ? selecionarTodasContas : deselecionarTodasContas}
                >
                  {contasSelecionadas.length === 0 ? 'Selecionar Todas' : 'Desmarcar Todas'}
                </Button>
              </Box>
            </Box>

            <Alert severity="warning" sx={{ mb: 2 }}>
              Total a Receber: R$ {filtrarContas(contasReceber.filter(c => c.status_conta !== 'Paga'), 'receber').reduce((sum, c) => sum + parseFloat(c.valor_parcela || 0), 0).toFixed(2)}
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={contasSelecionadas.length > 0 && contasSelecionadas.length === filtrarContas(contasReceber.filter(c => c.status_conta !== 'Paga'), 'receber').length}
                        indeterminate={contasSelecionadas.length > 0 && contasSelecionadas.length < filtrarContas(contasReceber.filter(c => c.status_conta !== 'Paga'), 'receber').length}
                        onChange={(e) => e.target.checked ? selecionarTodasContas() : deselecionarTodasContas()}
                      />
                    </TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtrarContas(contasReceber.filter(c => c.status_conta !== 'Paga'), 'receber').map((conta) => (
                    <TableRow
                      key={conta.id_conta}
                      selected={contasSelecionadas.includes(conta.id_conta)}
                      hover
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={contasSelecionadas.includes(conta.id_conta)}
                          onChange={() => toggleSelecaoConta(conta.id_conta)}
                        />
                      </TableCell>
                      <TableCell>{conta.descricao || `Venda #${conta.id_venda_origem}`}</TableCell>
                      <TableCell>{conta.cliente || '-'}</TableCell>
                      <TableCell>{conta.data_vencimento ? new Date(conta.data_vencimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell align="right">R$ {parseFloat(conta.valor_parcela || 0).toFixed(2)}</TableCell>
                      <TableCell><Chip label="Pendente" color="warning" size="small" /></TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => abrirModalBaixa(conta)}
                          title="Dar Baixa"
                          sx={{ color: '#4CAF50' }}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Contas Recebidas</Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              Total Recebido: R$ {filtrarContas(contasReceber.filter(c => c.status_conta === 'Paga'), 'receber').reduce((sum, c) => sum + parseFloat(c.valor_liquidado || 0), 0).toFixed(2)}
            </Alert>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell>Data Pagamento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtrarContas(contasReceber.filter(c => c.status_conta === 'Paga'), 'receber').map((conta) => (
                    <TableRow key={conta.id_conta}>
                      <TableCell>{conta.descricao || conta.documento_numero || `Conta #${conta.id_conta}`}</TableCell>
                      <TableCell>{conta.cliente || '-'}</TableCell>
                      <TableCell>{formatarData(conta.data_vencimento)}</TableCell>
                      <TableCell>{formatarData(conta.data_pagamento)}</TableCell>
                      <TableCell align="right">R$ {parseFloat(conta.valor_liquidado || conta.valor_original || 0).toFixed(2)}</TableCell>
                      <TableCell><Chip label="Recebida" color="success" size="small" /></TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => estornarConta(conta)}
                          title="Estornar"
                          sx={{ color: '#FF9800' }}
                        >
                          <UndoIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 3 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Contas a Pagar</Typography>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => abrirNovaConta('Pagar')}
              >
                Nova Conta a Pagar
              </Button>
            </Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              Total a Pagar: R$ {filtrarContas(contasPagar.filter(c => c.status_conta !== 'Paga'), 'pagar').reduce((sum, c) => sum + parseFloat(c.valor_parcela || 0), 0).toFixed(2)}
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Fornecedor</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtrarContas(contasPagar.filter(c => c.status_conta !== 'Paga'), 'pagar').map((conta) => (
                    <TableRow key={conta.id_conta}>
                      <TableCell>{conta.descricao || `Compra #${conta.id_compra_origem}`}</TableCell>
                      <TableCell>{conta.cliente || '-'}</TableCell>
                      <TableCell>{formatarData(conta.data_vencimento)}</TableCell>
                      <TableCell align="right">R$ {parseFloat(conta.valor_parcela || 0).toFixed(2)}</TableCell>
                      <TableCell><Chip label="Pendente" color="error" size="small" /></TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => abrirModalBaixa(conta)}
                          title="Dar Baixa"
                          sx={{ color: '#4CAF50' }}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>Contas Pagas</Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              Total Pago: R$ {filtrarContas(contasPagar.filter(c => c.status_conta === 'Paga'), 'pagar').reduce((sum, c) => sum + parseFloat(c.valor_liquidado || 0), 0).toFixed(2)}
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Fornecedor</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell>Data Pagamento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtrarContas(contasPagar.filter(c => c.status_conta === 'Paga'), 'pagar').map((conta) => (
                    <TableRow key={conta.id_conta}>
                      <TableCell>{conta.descricao || conta.documento_numero || `Conta #${conta.id_conta}`}</TableCell>
                      <TableCell>{conta.cliente || '-'}</TableCell>
                      <TableCell>{formatarData(conta.data_vencimento)}</TableCell>
                      <TableCell>{formatarData(conta.data_pagamento)}</TableCell>
                      <TableCell align="right">R$ {parseFloat(conta.valor_liquidado || conta.valor_original || 0).toFixed(2)}</TableCell>
                      <TableCell><Chip label="Paga" color="success" size="small" /></TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => estornarConta(conta)}
                          title="Estornar"
                          sx={{ color: '#FF9800' }}
                        >
                          <UndoIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 5: BANCÁRIO */}
        {tabValue === 5 && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Movimentações Bancárias
              </Typography>
            </Box>

            {contasBancarias.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography color="textSecondary">Nenhuma conta bancária cadastrada</Typography>
              </Box>
            ) : (
              <Box>
                {/* SELETOR DE CONTA */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Selecione a Conta Bancária</InputLabel>
                  <Select
                    value={contaBancariaSelecionada}
                    label="Selecione a Conta Bancária"
                    onChange={(e) => setContaBancariaSelecionada(e.target.value)}
                  >
                    <MenuItem value="">Todas as Contas</MenuItem>
                    {contasBancarias.map((conta) => (
                      <MenuItem key={conta.id_conta_bancaria} value={conta.id_conta_bancaria}>
                        {conta.nome_banco || conta.nome_conta} - {conta.agencia}/{conta.conta} (Saldo: R$ {parseFloat(conta.saldo_inicial || 0).toFixed(2)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* BOTÕES DE AÇÃO */}
                {contaBancariaSelecionada && (
                  <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => setOpenAcerto(true)}
                    >
                      Acerto de Caixa
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setOpenTransferencia(true)}
                    >
                      Transferência
                    </Button>
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() => setOpenRetirada(true)}
                    >
                      Retirada
                    </Button>
                  </Box>
                )}

                {/* TABELA DE MOVIMENTAÇÕES */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell><strong>Data</strong></TableCell>
                        <TableCell><strong>Descrição</strong></TableCell>
                        <TableCell><strong>Cliente/Fornecedor</strong></TableCell>
                        <TableCell><strong>Tipo</strong></TableCell>
                        <TableCell align="right"><strong>Valor</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="center"><strong>Ações</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        // Filtrar transações pela conta selecionada
                        let movimentacoes = [];

                        // Adicionar recebimentos (contas receber com id_conta_cobranca)
                        contasReceber.forEach(conta => {
                          if (!contaBancariaSelecionada || conta.id_conta_cobranca === parseInt(contaBancariaSelecionada)) {
                            if (conta.data_pagamento) {
                              movimentacoes.push({
                                data: conta.data_pagamento,
                                descricao: conta.descricao || `Venda #${conta.id_venda_origem}`,
                                cliente: conta.cliente || '-',
                                tipo: 'Recebimento',
                                valor: parseFloat(conta.valor_liquidado || 0),
                                status: 'Pago',
                                id_conta_cobranca: conta.id_conta_cobranca
                              });
                            }
                          }
                        });

                        // Adicionar pagamentos (contas pagar com id_conta_baixa)
                        contasPagar.forEach(conta => {
                          if (!contaBancariaSelecionada || conta.id_conta_baixa === parseInt(contaBancariaSelecionada)) {
                            if (conta.data_pagamento) {
                              movimentacoes.push({
                                data: conta.data_pagamento,
                                descricao: conta.descricao || `Compra #${conta.id_compra_origem}`,
                                cliente: conta.cliente || '-',
                                tipo: 'Pagamento',
                                valor: parseFloat(conta.valor_liquidado || 0),
                                status: 'Pago',
                                id_conta_baixa: conta.id_conta_baixa
                              });
                            }
                          }
                        });

                        // Ordenar por data (descendente)
                        movimentacoes.sort((a, b) => new Date(b.data) - new Date(a.data));

                        if (movimentacoes.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 3, color: '#999' }}>
                                Nenhuma movimentação encontrada para esta conta
                              </TableCell>
                            </TableRow>
                          );
                        }

                        // Calcular totais
                        const totalRecebido = movimentacoes
                          .filter(m => m.tipo === 'Recebimento')
                          .reduce((sum, m) => sum + m.valor, 0);
                        const totalPago = movimentacoes
                          .filter(m => m.tipo === 'Pagamento')
                          .reduce((sum, m) => sum + m.valor, 0);

                        return (
                          <>
                            {movimentacoes.map((mov, idx) => (
                              <TableRow key={idx} sx={{ backgroundColor: mov.tipo === 'Recebimento' ? '#f1f8e9' : '#ffebee' }}>
                                <TableCell>{formatarData(mov.data)}</TableCell>
                                <TableCell>{mov.descricao}</TableCell>
                                <TableCell>{mov.cliente}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={mov.tipo}
                                    color={mov.tipo === 'Recebimento' ? 'success' : 'error'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 500, color: mov.tipo === 'Recebimento' ? '#2e7d32' : '#d32f2f' }}>
                                  {mov.tipo === 'Recebimento' ? '+' : '-'} R$ {mov.valor.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Chip label={mov.status} color="primary" size="small" variant="outlined" />
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setMovimentacaoExcluir(mov);
                                      setOpenExcluir(true);
                                    }}
                                    title="Excluir movimentação"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow sx={{ backgroundColor: '#f0f4c3', fontWeight: 'bold' }}>
                              <TableCell colSpan={3}><strong>TOTAIS</strong></TableCell>
                              <TableCell align="right"><strong>Recebido:</strong> R$ {totalRecebido.toFixed(2)}</TableCell>
                              <TableCell align="right"><strong>Pago:</strong> R$ {totalPago.toFixed(2)}</TableCell>
                              <TableCell align="right"><strong>Saldo:</strong> R$ {(totalRecebido - totalPago).toFixed(2)}</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* DIALOG: ACERTO DE CAIXA */}
      <Dialog open={openAcerto} onClose={() => setOpenAcerto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Acerto de Caixa</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Valor"
            type="number"
            inputProps={{ step: '0.01' }}
            value={formAcerto.valor}
            onChange={(e) => setFormAcerto({ ...formAcerto, valor: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Descrição (ex: Ajuste de caixa, reconciliação)"
            multiline
            rows={3}
            value={formAcerto.descricao}
            onChange={(e) => setFormAcerto({ ...formAcerto, descricao: e.target.value })}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            O acerto será registrado como uma movimentação adicional na conta selecionada.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAcerto(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              // Implementar POST de acerto de caixa
              console.log('Acerto de caixa:', formAcerto);
              setOpenAcerto(false);
              setFormAcerto({ valor: '', descricao: '' });
            }}
          >
            Registrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: TRANSFERÊNCIA ENTRE CONTAS */}
      <Dialog open={openTransferencia} onClose={() => setOpenTransferencia(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transferência entre Contas</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Conta Destino</InputLabel>
            <Select
              value={formTransferencia.contaDestino}
              label="Conta Destino"
              onChange={(e) => setFormTransferencia({ ...formTransferencia, contaDestino: e.target.value })}
            >
              {contasBancarias
                .filter(c => c.id_conta_bancaria !== parseInt(contaBancariaSelecionada))
                .map(conta => (
                  <MenuItem key={conta.id_conta_bancaria} value={conta.id_conta_bancaria}>
                    {conta.nome_banco || conta.nome_conta} - {conta.agencia}/{conta.conta}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Valor"
            type="number"
            inputProps={{ step: '0.01' }}
            value={formTransferencia.valor}
            onChange={(e) => setFormTransferencia({ ...formTransferencia, valor: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Descrição"
            multiline
            rows={2}
            value={formTransferencia.descricao}
            onChange={(e) => setFormTransferencia({ ...formTransferencia, descricao: e.target.value })}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            A transferência será debitada da conta de origem e creditada na conta destino.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTransferencia(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // Implementar POST de transferência
              console.log('Transferência:', formTransferencia);
              setOpenTransferencia(false);
              setFormTransferencia({ contaDestino: '', valor: '', descricao: '' });
            }}
          >
            Transferir
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: RETIRADA */}
      <Dialog open={openRetirada} onClose={() => setOpenRetirada(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Retirada de Caixa</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Valor"
            type="number"
            inputProps={{ step: '0.01' }}
            value={formRetirada.valor}
            onChange={(e) => setFormRetirada({ ...formRetirada, valor: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Descrição (ex: Saque do caixa, retirada para uso)"
            multiline
            rows={3}
            value={formRetirada.descricao}
            onChange={(e) => setFormRetirada({ ...formRetirada, descricao: e.target.value })}
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            A retirada será debitada da conta selecionada.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRetirada(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              // Implementar POST de retirada
              console.log('Retirada:', formRetirada);
              setOpenRetirada(false);
              setFormRetirada({ valor: '', descricao: '' });
            }}
          >
            Registrar Retirada
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: EXCLUIR MOVIMENTAÇÃO */}
      <Dialog open={openExcluir} onClose={() => setOpenExcluir(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Você tem certeza que deseja excluir esta movimentação?
          </Alert>
          {movimentacaoExcluir && (
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
              <Typography><strong>Descrição:</strong> {movimentacaoExcluir.descricao}</Typography>
              <Typography><strong>Tipo:</strong> {movimentacaoExcluir.tipo}</Typography>
              <Typography><strong>Valor:</strong> R$ {movimentacaoExcluir.valor.toFixed(2)}</Typography>
              <Typography><strong>Data:</strong> {formatarData(movimentacaoExcluir.data)}</Typography>
            </Box>
          )}
          <Typography color="textSecondary" variant="body2">
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExcluir(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              // Implementar DELETE de movimentação
              console.log('Excluir movimentação:', movimentacaoExcluir);
              setOpenExcluir(false);
              setMovimentacaoExcluir(null);
            }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: DAR BAIXA EM CONTA */}
      <Dialog open={openBaixa} onClose={() => setOpenBaixa(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dar Baixa em Conta</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {contaBaixa && (
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
              <Typography><strong>Cliente/Fornecedor:</strong> {contaBaixa.cliente || '-'}</Typography>
              <Typography><strong>Descrição:</strong> {contaBaixa.descricao || '-'}</Typography>
              <Typography><strong>Valor:</strong> R$ {parseFloat(contaBaixa.valor_parcela || contaBaixa.valor_original || 0).toFixed(2)}</Typography>
              <Typography><strong>Vencimento:</strong> {formatarData(contaBaixa.data_vencimento)}</Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="Data do Pagamento"
            type="date"
            value={formBaixa.data_pagamento}
            onChange={(e) => setFormBaixa({ ...formBaixa, data_pagamento: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Valor Pago"
            type="number"
            inputProps={{ step: '0.01' }}
            value={formBaixa.valor_pago}
            onChange={(e) => setFormBaixa({ ...formBaixa, valor_pago: e.target.value })}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Forma de Pagamento</InputLabel>
            <Select
              value={formBaixa.forma_pagamento}
              label="Forma de Pagamento"
              onChange={(e) => setFormBaixa({ ...formBaixa, forma_pagamento: e.target.value })}
            >
              <MenuItem value="Dinheiro">Dinheiro</MenuItem>
              <MenuItem value="PIX">PIX</MenuItem>
              <MenuItem value="Cartão de Débito">Cartão de Débito</MenuItem>
              <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
              <MenuItem value="Transferência">Transferência</MenuItem>
              <MenuItem value="Boleto">Boleto</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Conta Bancária</InputLabel>
            <Select
              value={formBaixa.id_conta_bancaria}
              label="Conta Bancária"
              onChange={(e) => setFormBaixa({ ...formBaixa, id_conta_bancaria: e.target.value })}
            >
              {contasBancarias.map((conta) => (
                <MenuItem key={conta.id_conta_bancaria} value={conta.id_conta_bancaria}>
                  {conta.nome_banco || conta.nome_conta} - {conta.agencia}/{conta.conta}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            A conta será marcada como paga e o valor será registrado na conta bancária selecionada.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBaixa(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            onClick={darBaixaConta}
            disabled={loading}
          >
            Confirmar Baixa
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: NOVA CONTA A RECEBER / PAGAR */}
      <Dialog open={openNovaConta} onClose={() => setOpenNovaConta(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: tipoNovaConta === 'Receber' ? '#e8f5e9' : '#ffebee' }}>
          {tipoNovaConta === 'Receber' ? '💰 Nova Conta a Receber' : '💸 Nova Conta a Pagar'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Descrição *"
            value={formNovaConta.descricao}
            onChange={(e) => setFormNovaConta({ ...formNovaConta, descricao: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Valor *"
                type="number"
                inputProps={{ step: '0.01', min: '0.01' }}
                value={formNovaConta.valor_parcela}
                onChange={(e) => setFormNovaConta({ ...formNovaConta, valor_parcela: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Vencimento *"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formNovaConta.data_vencimento}
                onChange={(e) => setFormNovaConta({ ...formNovaConta, data_vencimento: e.target.value })}
              />
            </Grid>
          </Grid>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{tipoNovaConta === 'Receber' ? 'Cliente' : 'Cliente / Fornecedor'}</InputLabel>
            <Select
              value={formNovaConta.id_cliente_fornecedor}
              label={tipoNovaConta === 'Receber' ? 'Cliente' : 'Cliente / Fornecedor'}
              onChange={(e) => setFormNovaConta({ ...formNovaConta, id_cliente_fornecedor: e.target.value })}
            >
              <MenuItem value="">Nenhum</MenuItem>
              {(tipoNovaConta === 'Receber' ? clientes : [...clientes, ...fornecedores]).map((item) => {
                const id = item.id_cliente || item.id_fornecedor;
                return <MenuItem key={id} value={id}>{item.nome_razao_social}</MenuItem>;
              })}
            </Select>
          </FormControl>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Operação</InputLabel>
                <Select
                  value={formNovaConta.id_operacao}
                  label="Operação"
                  onChange={(e) => setFormNovaConta({ ...formNovaConta, id_operacao: e.target.value })}
                >
                  <MenuItem value="">Nenhuma</MenuItem>
                  {operacoes.map((op) => (
                    <MenuItem key={op.id_operacao} value={op.id_operacao}>{op.nome_operacao}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Centro de Custo</InputLabel>
                <Select
                  value={formNovaConta.id_centro_custo}
                  label="Centro de Custo"
                  onChange={(e) => setFormNovaConta({ ...formNovaConta, id_centro_custo: e.target.value })}
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  {centrosCusto.map((cc) => (
                    <MenuItem key={cc.id_centro_custo} value={cc.id_centro_custo}>{cc.nome_centro_custo}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Conta Bancária</InputLabel>
            <Select
              value={formNovaConta.id_conta_bancaria}
              label="Conta Bancária"
              onChange={(e) => setFormNovaConta({ ...formNovaConta, id_conta_bancaria: e.target.value })}
            >
              <MenuItem value="">Nenhuma</MenuItem>
              {contasBancarias.map((cb) => (
                <MenuItem key={cb.id_conta_bancaria} value={cb.id_conta_bancaria}>
                  {cb.nome_conta}{cb.nome_banco ? ` — ${cb.nome_banco}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Nº Documento"
                value={formNovaConta.documento_numero}
                onChange={(e) => setFormNovaConta({ ...formNovaConta, documento_numero: e.target.value })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Parcela"
                type="number"
                inputProps={{ min: 1 }}
                value={formNovaConta.parcela_numero}
                onChange={(e) => setFormNovaConta({ ...formNovaConta, parcela_numero: parseInt(e.target.value) || 1 })}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Total"
                type="number"
                inputProps={{ min: 1 }}
                value={formNovaConta.parcela_total}
                onChange={(e) => setFormNovaConta({ ...formNovaConta, parcela_total: parseInt(e.target.value) || 1 })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNovaConta(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color={tipoNovaConta === 'Receber' ? 'success' : 'error'}
            onClick={criarConta}
            disabled={loading}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: DAR BAIXA EM BLOCO */}
      <Dialog open={openBaixaBloco} onClose={() => setOpenBaixaBloco(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dar Baixa em Bloco ({contasSelecionadas.length} conta(s))</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Você está dando baixa em {contasSelecionadas.length} conta(s) simultaneamente.
            Total: R$ {contasReceber
              .filter(c => contasSelecionadas.includes(c.id_conta))
              .reduce((sum, c) => sum + parseFloat(c.valor_parcela || 0), 0)
              .toFixed(2)}
          </Alert>

          <TextField
            fullWidth
            label="Data do Pagamento"
            type="date"
            value={formBaixa.data_pagamento}
            onChange={(e) => setFormBaixa({ ...formBaixa, data_pagamento: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Forma de Pagamento</InputLabel>
            <Select
              value={formBaixa.forma_pagamento}
              label="Forma de Pagamento"
              onChange={(e) => setFormBaixa({ ...formBaixa, forma_pagamento: e.target.value })}
            >
              <MenuItem value="Dinheiro">Dinheiro</MenuItem>
              <MenuItem value="PIX">PIX</MenuItem>
              <MenuItem value="Cartão de Débito">Cartão de Débito</MenuItem>
              <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
              <MenuItem value="Transferência">Transferência</MenuItem>
              <MenuItem value="Boleto">Boleto</MenuItem>
              <MenuItem value="Cheque">Cheque</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Conta Bancária</InputLabel>
            <Select
              value={formBaixa.id_conta_bancaria}
              label="Conta Bancária"
              onChange={(e) => setFormBaixa({ ...formBaixa, id_conta_bancaria: e.target.value })}
            >
              {contasBancarias.map((conta) => (
                <MenuItem key={conta.id_conta_bancaria} value={conta.id_conta_bancaria}>
                  {conta.nome_banco || conta.nome_conta} - {conta.agencia}/{conta.conta}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="warning" sx={{ mt: 2 }}>
            Todas as contas selecionadas serão marcadas como pagas com os mesmos dados informados.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBaixaBloco(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            onClick={darBaixaEmBloco}
            disabled={loading}
          >
            Confirmar Baixa em Bloco
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinancePage;
