/*
 * EXEMPLO DE INTEGRAÇÃO - Página de Vendas com Sistema de Aprovação
 * 
 * Este é um exemplo de como integrar o sistema de aprovação em uma página existente.
 * Use como referência para implementar em suas páginas.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Alert,
  Grid,
  MenuItem,
  Autocomplete
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import SolicitarAprovacaoModal from '../components/SolicitarAprovacaoModal';

const VendaComAprovacaoExample = () => {
  const { user, axiosInstance } = useAuth();
  
  // Estados do formulário
  const [venda, setVenda] = useState({
    id_cliente: null,
    id_operacao: null,
    valor_total: 0,
    desconto_percentual: 0,
    desconto_valor: 0,
    itens: []
  });
  
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [operacoes, setOperacoes] = useState([]);
  
  // Estados do sistema de aprovação
  const [modalAprovacao, setModalAprovacao] = useState(false);
  const [dadosAprovacao, setDadosAprovacao] = useState(null);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Carregar dados iniciais
  useEffect(() => {
    carregarClientes();
    carregarOperacoes();
  }, []);

  const carregarClientes = async () => {
    try {
      const response = await axiosInstance.get('/clientes/');
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const carregarOperacoes = async () => {
    try {
      const response = await axiosInstance.get('/operacoes/');
      setOperacoes(response.data.filter(op => op.tipo_operacao === 'Venda'));
    } catch (error) {
      console.error('Erro ao carregar operações:', error);
    }
  };

  // ========================================
  // FUNÇÃO DE VERIFICAÇÃO DE APROVAÇÃO
  // ========================================
  const verificarNecessidadeAprovacao = (dadosVenda, cliente) => {
    const motivos = [];
    const regras = [];

    // REGRA 1: Valor alto (acima de R$ 5.000)
    if (dadosVenda.valor_total > 5000) {
      motivos.push(`Valor da venda (R$ ${dadosVenda.valor_total.toFixed(2)}) acima do limite de R$ 5.000,00`);
      regras.push('valor_alto');
    }

    // REGRA 2: Desconto acima de 10%
    if (dadosVenda.desconto_percentual > 10) {
      motivos.push(`Desconto de ${dadosVenda.desconto_percentual}% acima do permitido (máx 10%)`);
      regras.push('desconto_alto');
    }

    // REGRA 3: Cliente inadimplente
    if (cliente?.inadimplente) {
      motivos.push('Cliente possui inadimplência no sistema');
      regras.push('cliente_inadimplente');
    }

    // REGRA 4: Limite de crédito excedido
    if (cliente?.limite_credito && dadosVenda.valor_total > cliente.limite_credito) {
      motivos.push(
        `Valor (R$ ${dadosVenda.valor_total.toFixed(2)}) excede limite de crédito ` +
        `do cliente (R$ ${cliente.limite_credito.toFixed(2)})`
      );
      regras.push('limite_credito_excedido');
    }

    // REGRA 5: Primeira venda do cliente (cliente novo)
    if (cliente?.total_vendas === 0) {
      motivos.push('Primeira venda deste cliente');
      regras.push('cliente_novo');
    }

    // REGRA 6: Desconto em valor alto (acima de R$ 500)
    if (dadosVenda.desconto_valor > 500) {
      motivos.push(`Desconto em valor (R$ ${dadosVenda.desconto_valor.toFixed(2)}) acima de R$ 500,00`);
      regras.push('desconto_valor_alto');
    }

    return {
      requerAprovacao: motivos.length > 0,
      motivos: motivos.join(' | '),
      regrasVioladas: regras,
      totalRegras: motivos.length
    };
  };

  // ========================================
  // FUNÇÃO DE SALVAR VENDA (MODIFICADA)
  // ========================================
  const handleSalvarVenda = async () => {
    try {
      // Validações básicas
      if (!venda.id_cliente) {
        setMensagem({ tipo: 'error', texto: 'Selecione um cliente' });
        return;
      }

      if (!venda.id_operacao) {
        setMensagem({ tipo: 'error', texto: 'Selecione uma operação' });
        return;
      }

      if (venda.itens.length === 0) {
        setMensagem({ tipo: 'error', texto: 'Adicione pelo menos um item' });
        return;
      }

      // ===== PONTO DE VERIFICAÇÃO DE APROVAÇÃO =====
      const { requerAprovacao, motivos, regrasVioladas, totalRegras } = 
        verificarNecessidadeAprovacao(venda, clienteSelecionado);

      if (requerAprovacao) {
        // Preparar dados para aprovação
        setDadosAprovacao({
          ...venda,
          cliente: {
            id: clienteSelecionado.id_cliente,
            nome: clienteSelecionado.nome_razao,
            limite_credito: clienteSelecionado.limite_credito,
            inadimplente: clienteSelecionado.inadimplente
          },
          motivos_aprovacao: motivos,
          regras_violadas: regrasVioladas,
          total_regras: totalRegras,
          usuario_solicitante: user.username,
          data_solicitacao: new Date().toISOString()
        });

        // Abrir modal de aprovação
        setModalAprovacao(true);
        return; // IMPORTANTE: Não continua a criação da venda
      }

      // ===== SE NÃO REQUER APROVAÇÃO, CRIAR NORMALMENTE =====
      const response = await axiosInstance.post('/vendas/', venda);
      
      setMensagem({
        tipo: 'success',
        texto: `Venda #${response.data.id_venda} criada com sucesso!`
      });

      // Limpar formulário
      limparFormulario();

    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      setMensagem({
        tipo: 'error',
        texto: error.response?.data?.detail || 'Erro ao criar venda'
      });
    }
  };

  // ========================================
  // CALLBACK DE SUCESSO DA APROVAÇÃO
  // ========================================
  const handleAprovacaoSucesso = (solicitacao) => {
    setMensagem({
      tipo: 'info',
      texto: (
        <Box>
          <Typography variant="body1" gutterBottom>
            ✅ Solicitação de aprovação enviada com sucesso!
          </Typography>
          <Typography variant="body2">
            <strong>Protocolo:</strong> #{solicitacao.id_solicitacao}
          </Typography>
          <Typography variant="body2">
            <strong>Supervisor:</strong> {solicitacao.supervisor?.first_name} {solicitacao.supervisor?.last_name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Acompanhe o status em "Minhas Solicitações" no menu lateral.
          </Typography>
        </Box>
      )
    });

    // Limpar formulário
    limparFormulario();
  };

  const limparFormulario = () => {
    setVenda({
      id_cliente: null,
      id_operacao: null,
      valor_total: 0,
      desconto_percentual: 0,
      desconto_valor: 0,
      itens: []
    });
    setClienteSelecionado(null);
  };

  // Calcular valor total com desconto
  useEffect(() => {
    let total = venda.itens.reduce((sum, item) => sum + (item.valor_total || 0), 0);
    
    if (venda.desconto_percentual > 0) {
      const desconto = (total * venda.desconto_percentual) / 100;
      setVenda(prev => ({ ...prev, desconto_valor: desconto, valor_total: total - desconto }));
    } else if (venda.desconto_valor > 0) {
      setVenda(prev => ({ ...prev, valor_total: total - venda.desconto_valor }));
    } else {
      setVenda(prev => ({ ...prev, valor_total: total }));
    }
  }, [venda.itens, venda.desconto_percentual, venda.desconto_valor]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Typography variant="h4" gutterBottom>
        Nova Venda (com Sistema de Aprovação)
      </Typography>

      {/* Mensagens */}
      {mensagem.texto && (
        <Alert 
          severity={mensagem.tipo} 
          onClose={() => setMensagem({ tipo: '', texto: '' })}
          sx={{ mb: 2 }}
        >
          {mensagem.texto}
        </Alert>
      )}

      {/* Formulário */}
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            {/* Cliente */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={clientes}
                getOptionLabel={(option) => option.nome_razao || ''}
                value={clienteSelecionado}
                onChange={(e, newValue) => {
                  setClienteSelecionado(newValue);
                  setVenda(prev => ({ ...prev, id_cliente: newValue?.id_cliente }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Cliente *" />
                )}
              />
            </Grid>

            {/* Operação */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Operação *"
                value={venda.id_operacao || ''}
                onChange={(e) => setVenda(prev => ({ ...prev, id_operacao: e.target.value }))}
              >
                {operacoes.map((op) => (
                  <MenuItem key={op.id_operacao} value={op.id_operacao}>
                    {op.nome_operacao}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Desconto Percentual */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Desconto (%)"
                value={venda.desconto_percentual}
                onChange={(e) => setVenda(prev => ({ 
                  ...prev, 
                  desconto_percentual: parseFloat(e.target.value) || 0 
                }))}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>

            {/* Desconto Valor */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Desconto (R$)"
                value={venda.desconto_valor}
                onChange={(e) => setVenda(prev => ({ 
                  ...prev, 
                  desconto_valor: parseFloat(e.target.value) || 0 
                }))}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Valor Total */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Valor Total"
                value={`R$ ${venda.valor_total.toFixed(2)}`}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Botões */}
            <Grid item xs={12}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Button variant="outlined" onClick={limparFormulario}>
                  Cancelar
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSalvarVenda}
                >
                  Salvar Venda
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ========================================
          MODAL DE SOLICITAÇÃO DE APROVAÇÃO
          ======================================== */}
      <SolicitarAprovacaoModal
        open={modalAprovacao}
        onClose={() => setModalAprovacao(false)}
        tipoSolicitacao="venda"
        dados={dadosAprovacao}
        onSuccess={handleAprovacaoSucesso}
        titulo="Aprovação Necessária - Nova Venda"
        mensagemMotivo={dadosAprovacao?.motivos_aprovacao || 'Esta venda requer aprovação do supervisor'}
      />
    </Box>
  );
};

export default VendaComAprovacaoExample;
