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
import ReceiptIcon from '@mui/icons-material/Receipt';
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
  const [empresaInfo, setEmpresaInfo] = useState(null);
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
      try {
        const empresaResponse = await axiosInstance.get('/empresa/');
        const empInfo = empresaResponse.data.results?.[0] || empresaResponse.data?.[0] || null;
        setEmpresaInfo(empInfo);
      } catch (err) {
        console.error('Erro ao buscar dados da empresa:', err);
      }
      const contasReceberResponse = await axiosInstance.get('/contas/?tipo_conta=Receber&page_size=1000');
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
      const contasPagarResponse = await axiosInstance.get('/contas/?tipo_conta=Pagar&page_size=1000');
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

  const valorPorExtenso = (valor) => {
    if (!valor || valor <= 0) return 'Zero reais';
    
    const parts = parseFloat(valor).toFixed(2).split('.');
    const reais = parseInt(parts[0], 10);
    const centavos = parseInt(parts[1], 10);
    
    const converterDezena = (n) => {
      const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
      const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
      const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
      
      if (n < 10) return unidades[n];
      if (n >= 10 && n < 20) return especiais[n - 10];
      const u = n % 10;
      const d = Math.floor(n / 10);
      return dezenas[d] + (u > 0 ? ' e ' + unidades[u] : '');
    };
    
    const converterCentena = (n) => {
      const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
      if (n === 100) return 'cem';
      const c = Math.floor(n / 100);
      const resto = n % 100;
      return centenas[c] + (resto > 0 ? ' e ' + converterDezena(resto) : '');
    };
    
    const converterGrupo = (n) => {
      if (n < 100) return converterDezena(n);
      return converterCentena(n);
    };
    
    const formatReais = (v) => {
      if (v === 0) return 'zero reais';
      if (v === 1) return 'um real';
      
      let extenso = '';
      const milhoes = Math.floor(v / 1000000);
      let resto = v % 1000000;
      const milhares = Math.floor(resto / 1000);
      resto = resto % 1000;
      
      if (milhoes > 0) {
        extenso += converterGrupo(milhoes) + (milhoes === 1 ? ' milhão' : ' milhões');
        if (resto > 0 || milhares > 0) extenso += ' e ';
      }
      
      if (milhares > 0) {
        extenso += converterGrupo(milhares) + ' mil';
        if (resto > 0) extenso += ' e ';
      }
      
      if (resto > 0) {
        extenso += converterGrupo(resto);
      }
      
      extenso += ' reais';
      return extenso;
    };
    
    let textoReais = formatReais(reais);
    let textoCentavos = '';
    
    if (centavos > 0) {
      if (centavos === 1) {
        textoCentavos = 'um centavo';
      } else {
        textoCentavos = converterDezena(centavos) + ' centavos';
      }
    }
    
    let resultado = textoReais;
    if (textoCentavos) {
      resultado += ' e ' + textoCentavos;
    }
    
    resultado = resultado.replace(/^Um mil /, 'Mil ').replace(/^Um mil$/, 'Mil');
    return resultado.charAt(0).toUpperCase() + resultado.slice(1);
  };

  const corrigirCaracteresEspeciais = (texto) => {
    if (!texto) return '';
    return texto
      .replace(/├ú/g, 'ã')
      .replace(/├│/g, 'ó')
      .replace(/├¡/g, 'í')
      .replace(/├║/g, 'ú')
      .replace(/├¬/g, 'ê')
      .replace(/├┤/g, 'ô')
      .replace(/├®/g, 'é')
      .replace(/├б/g, 'á')
      .replace(/├Б/g, 'Á')
      .replace(/├в/g, 'â')
      .replace(/├З/g, 'Ç')
      .replace(/├з/g, 'ç')
      .replace(/├╡/g, 'õ')
      .replace(/├А/g, 'À')
      .replace(/├а/g, 'à')
      .replace(/├К/g, 'Ê')
      .replace(/├к/g, 'ê')
      .replace(/├Ц/g, 'Ó')
      .replace(/├д/g, 'ä')
      .replace(/├®/g, 'é')
      .replace(/├И/g, 'É')
      .replace(/├Й/g, 'É')
      .replace(/├В/g, 'Â')
      .replace(/├Г/g, 'Ã')
      .replace(/├Х/g, 'Õ')
      .replace(/├Ф/g, 'Ô')
      .replace(/├Ъ/g, 'Ú')
      .replace(/├Н/g, 'Í')
      .replace(/├┴/g, 'Á');
  };

  const imprimirRecibo = (conta) => {
    let docIdentificacao = '-';
    let nomeClienteFornecedor = corrigirCaracteresEspeciais(conta.cliente || '-');
    
    if (conta.tipo_conta === 'Receber') {
      const cliObj = clientes.find(c => c.id_cliente === conta.id_cliente_fornecedor);
      if (cliObj && cliObj.cpf_cnpj) {
        docIdentificacao = cliObj.cpf_cnpj;
      }
    } else {
      const fornObj = fornecedores.find(f => f.id_fornecedor === conta.id_cliente_fornecedor);
      if (fornObj && fornObj.cpf_cnpj) {
        docIdentificacao = fornObj.cpf_cnpj;
      }
    }
    
    const nomeEmpresa = corrigirCaracteresEspeciais(empresaInfo?.nome_fantasia || empresaInfo?.nome_razao_social || 'APERUS SISTEMAS');
    const cnpjEmpresa = empresaInfo?.cpf_cnpj || '';
    const foneEmpresa = empresaInfo?.telefone || '';
    const enderecoBruto = `${empresaInfo?.endereco || ''}, ${empresaInfo?.numero || ''} ${empresaInfo?.bairro || ''} - ${empresaInfo?.cidade || ''}/${empresaInfo?.estado || ''}`;
    const enderecoEmpresa = corrigirCaracteresEspeciais(enderecoBruto);
    
    const valorPago = parseFloat(conta.valor_liquidado || conta.valor_parcela || 0);
    const valorExtenso = valorPorExtenso(valorPago);
    const dataPagtoFormatada = formatarData(conta.data_pagamento || new Date().toISOString().split('T')[0]);
    const cidadeFormatada = corrigirCaracteresEspeciais(empresaInfo?.cidade || 'Patrocínio');
    const estadoFormatado = corrigirCaracteresEspeciais(empresaInfo?.estado || 'MG');
    const localData = `${cidadeFormatada}-${estadoFormatado}, ${dataPagtoFormatada}`;
    const descricaoConta = corrigirCaracteresEspeciais(conta.descricao || 'Quitação de título');
    
    const conteudoHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo - #${conta.id_conta}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .recibo-container {
            border: 2px solid #ccc;
            padding: 30px;
            max-width: 800px;
            margin: 0 auto;
            border-radius: 8px;
            background-color: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header-left h2 {
            margin: 0 0 5px 0;
            color: #2e7d32;
          }
          .header-left p {
            margin: 2px 0;
            font-size: 12px;
            color: #666;
          }
          .header-right {
            text-align: right;
          }
          .header-right .valor-box {
            border: 2px solid #2e7d32;
            padding: 10px 20px;
            font-size: 22px;
            font-weight: bold;
            color: #2e7d32;
            border-radius: 4px;
            background-color: #e8f5e9;
            display: inline-block;
          }
          .recibo-titulo {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .conteudo {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 45px;
            text-align: justify;
          }
          .destaque {
            font-weight: bold;
            color: #000;
          }
          .rodape {
            margin-top: 50px;
          }
          .local-data {
            text-align: right;
            margin-bottom: 40px;
            font-style: italic;
          }
          .assinatura-secao {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
          }
          .assinatura-box {
            text-align: center;
            width: 45%;
          }
          .linha-assinatura {
            border-top: 1px solid #000;
            margin-bottom: 5px;
          }
          .assinatura-box p {
            margin: 0;
            font-size: 14px;
            color: #333;
          }
          .no-print-btn {
            display: block;
            width: 150px;
            margin: 20px auto 0 auto;
            padding: 10px;
            background-color: #2e7d32;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            text-align: center;
          }
          @media print {
            .no-print-btn {
              display: none;
            }
            body {
              margin: 0;
              background-color: white;
            }
            .recibo-container {
              border: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="recibo-container">
          <div class="header">
            <div class="header-left">
              <h2>${nomeEmpresa}</h2>
              <p>CNPJ: ${cnpjEmpresa}</p>
              <p>${enderecoEmpresa}</p>
              <p>Fone: ${foneEmpresa}</p>
            </div>
            <div class="header-right">
              <div class="valor-box">R$ ${valorPago.toFixed(2)}</div>
            </div>
          </div>
          
          <div class="recibo-titulo">Recibo de Pagamento</div>
          
          <div class="conteudo">
            Recebemos de <span class="destaque">${nomeClienteFornecedor}</span>, 
            CPF/CNPJ nº <span class="destaque">${docIdentificacao}</span>, 
            a importância de <span class="destaque">R$ ${valorPago.toFixed(2)} (${valorExtenso})</span>, 
            referente a <span class="destaque">${descricaoConta}</span> 
            (Título ID #${conta.id_conta} / Documento nº ${conta.documento_numero || '-'}).
            ${conta.saldo_restante && parseFloat(conta.saldo_restante) > 0 ? `
              <div style="margin-top: 15px; padding: 12px; background-color: #fff8e1; border-left: 5px solid #ffb300; font-size: 0.9em; border-radius: 4px; line-height: 1.4em;">
                <strong>Aviso de Quitação Parcial:</strong> Este pagamento refere-se a uma baixa parcial. 
                O saldo restante de <strong>R$ ${parseFloat(conta.saldo_restante).toFixed(2)}</strong> foi desmembrado em um novo título pendente.
              </div>
            ` : ''}
          </div>
          
          <div class="rodape">
            <div class="local-data">${localData}</div>
            
            <div class="assinatura-secao">
              <div class="assinatura-box">
                <div class="linha-assinatura"></div>
                <p>Recebedor (Emitente)</p>
              </div>
              <div class="assinatura-box">
                <div class="linha-assinatura"></div>
                <p>Pagador</p>
              </div>
            </div>
          </div>
        </div>
        
        <button class="no-print-btn" onclick="window.print()">Imprimir Recibo</button>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank', 'width=850,height=600');
    if (printWindow) {
      printWindow.document.write(conteudoHtml);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const recalcularValoresBaixa = (novosCampos, contaCustom) => {
    setFormBaixa(prev => {
      const formAtualizado = { ...prev, ...novosCampos };
      const conta = contaCustom || contaBaixa;
      if (!conta) return formAtualizado;

      const valorPrincipalOriginal = parseFloat(conta.valor_parcela || conta.valor_original || 0);
      if (formAtualizado.valorPrincipalPago === undefined || formAtualizado.valorPrincipalPago === null) {
        formAtualizado.valorPrincipalPago = valorPrincipalOriginal.toFixed(2);
      }
      
      const valorPrincipal = parseFloat(formAtualizado.valorPrincipalPago || 0);
      let juros = parseFloat(formAtualizado.juros || 0);
      let multa = parseFloat(formAtualizado.multa || 0);
      let desconto = parseFloat(formAtualizado.desconto || 0);

      if (formAtualizado.autoCalcular) {
        const venc = new Date(conta.data_vencimento + 'T00:00:00');
        const pag = new Date(formAtualizado.data_pagamento + 'T00:00:00');
        const diffTime = pag - venc;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        juros = 0;
        multa = 0;
        desconto = 0;

        if (diffDays > 0) {
          multa = valorPrincipal * (parseFloat(formAtualizado.taxaMulta || 0) / 100);
          juros = valorPrincipal * (parseFloat(formAtualizado.taxaJuros || 0) / 30 / 100) * diffDays;
        } else if (diffDays < 0) {
          desconto = valorPrincipal * (parseFloat(formAtualizado.taxaDesconto || 0) / 30 / 100) * Math.abs(diffDays);
        }
        
        formAtualizado.juros = juros.toFixed(2);
        formAtualizado.multa = multa.toFixed(2);
        formAtualizado.desconto = desconto.toFixed(2);
      }

      const valorFinal = valorPrincipal + juros + multa - desconto;
      formAtualizado.valor_pago = valorFinal.toFixed(2);

      return formAtualizado;
    });
  };

  const abrirModalBaixa = (conta) => {
    setContaBaixa(conta);
    const autoCalc = localStorage.getItem('aperus_financeiro_auto_calcular') === 'true';
    const txJuros = parseFloat(localStorage.getItem('aperus_financeiro_taxa_juros') || '1.0');
    const txMulta = parseFloat(localStorage.getItem('aperus_financeiro_multa') || '2.0');
    const txDesconto = parseFloat(localStorage.getItem('aperus_financeiro_taxa_desconto') || '1.0');

    // Perform initial auto calculation if enabled
    let juros = 0;
    let multa = 0;
    let desconto = 0;
    const dataPagamento = new Date().toISOString().split('T')[0];
    const valorPrincipal = parseFloat(conta.valor_parcela || conta.valor_original || 0);

    if (autoCalc && conta) {
      const venc = new Date(conta.data_vencimento + 'T00:00:00');
      const pag = new Date(dataPagamento + 'T00:00:00');
      const diffTime = pag - venc;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        multa = valorPrincipal * (txMulta / 100);
        juros = valorPrincipal * (txJuros / 30 / 100) * diffDays;
      } else if (diffDays < 0) {
        desconto = valorPrincipal * (txDesconto / 30 / 100) * Math.abs(diffDays);
      }
    }

    const valorPago = valorPrincipal + juros + multa - desconto;

    setFormBaixa({
      data_pagamento: dataPagamento,
      valorPrincipalPago: valorPrincipal.toFixed(2),
      valor_pago: valorPago.toFixed(2),
      forma_pagamento: '',
      id_conta_bancaria: contasBancarias.length > 0 ? contasBancarias[0].id_conta_bancaria : '',
      juros: juros.toFixed(2),
      multa: multa.toFixed(2),
      desconto: desconto.toFixed(2),
      autoCalcular: autoCalc,
      taxaJuros: txJuros,
      taxaMulta: txMulta,
      taxaDesconto: txDesconto
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

      // Salva preferências no localStorage
      localStorage.setItem('aperus_financeiro_auto_calcular', formBaixa.autoCalcular);
      localStorage.setItem('aperus_financeiro_taxa_juros', formBaixa.taxaJuros);
      localStorage.setItem('aperus_financeiro_multa', formBaixa.taxaMulta);
      localStorage.setItem('aperus_financeiro_taxa_desconto', formBaixa.taxaDesconto);

      const response = await axiosInstance.patch(`/contas/${contaBaixa.id_conta}/`, {
        status_conta: 'Paga',
        data_pagamento: formBaixa.data_pagamento,
        valor_liquidado: parseFloat(formBaixa.valor_pago),
        saldo_devedor: 0,
        forma_pagamento: formBaixa.forma_pagamento,
        [campoContaBancaria]: formBaixa.id_conta_bancaria,
        valor_juros: parseFloat(formBaixa.juros || 0),
        valor_multa: parseFloat(formBaixa.multa || 0),
        valor_desconto: parseFloat(formBaixa.desconto || 0)
      });

      setSuccess('✅ Baixa realizada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setOpenBaixa(false);
      await fetchFinancialData();

      if (contaBaixa.tipo_conta === 'Receber') {
        setTimeout(() => {
          if (window.confirm("Baixa realizada com sucesso!\n\nDeseja gerar e imprimir o recibo deste recebimento?")) {
            const principalPago = parseFloat(formBaixa.valorPrincipalPago || 0);
            const originalParcela = parseFloat(contaBaixa.valor_parcela || 0);
            const saldoRestante = originalParcela - principalPago;

            const contaParaRecibo = {
              ...contaBaixa,
              ...response.data,
              valor_liquidado: parseFloat(formBaixa.valor_pago),
              data_pagamento: formBaixa.data_pagamento,
              saldo_restante: saldoRestante > 0.01 ? saldoRestante : 0
            };
            imprimirRecibo(contaParaRecibo);
          }
        }, 100);
      }

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
    
    const contasParaBaixar = contasReceber.filter(c => contasSelecionadas.includes(c.id_conta))
      .concat(contasPagar.filter(c => contasSelecionadas.includes(c.id_conta)));
      
    const totalValorSelecionado = contasParaBaixar.reduce((sum, c) => sum + parseFloat(c.valor_parcela || c.valor_original || 0), 0);

    setFormBaixa({
      data_pagamento: new Date().toISOString().split('T')[0],
      valor_pago: totalValorSelecionado,
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

      const contasParaBaixar = contasReceber.filter(c => contasSelecionadas.includes(c.id_conta))
        .concat(contasPagar.filter(c => contasSelecionadas.includes(c.id_conta)));

      const totalValorSelecionado = contasParaBaixar.reduce((sum, c) => sum + parseFloat(c.valor_parcela || c.valor_original || 0), 0);
      const valorPagoInformado = parseFloat(formBaixa.valor_pago);

      if (isNaN(valorPagoInformado) || valorPagoInformado <= 0) {
        setError('O valor pago deve ser maior que zero');
        setLoading(false);
        return;
      }

      const primeiroClienteId = contasParaBaixar[0]?.id_cliente_fornecedor;
      const todosMesmoCliente = contasParaBaixar.every(c => c.id_cliente_fornecedor === primeiroClienteId);

      if (valorPagoInformado < totalValorSelecionado && !todosMesmoCliente) {
        setError('A baixa parcial em bloco só é permitida se todas as contas pertencerem ao mesmo cliente.');
        setLoading(false);
        return;
      }

      if (valorPagoInformado > totalValorSelecionado) {
        setError(`O valor pago (R$ ${valorPagoInformado.toFixed(2)}) não pode ser maior que o valor total selecionado (R$ ${totalValorSelecionado.toFixed(2)}).`);
        setLoading(false);
        return;
      }

      let sucessos = 0;
      let erros = 0;

      // Se for baixa parcial (valor pago < total selecionado e mesmo cliente), faz a distribuição FIFO
      if (valorPagoInformado < totalValorSelecionado) {
        const contasOrdenadas = [...contasParaBaixar].sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));
        let saldoParaDistribuir = valorPagoInformado;

        for (const conta of contasOrdenadas) {
          const valorConta = parseFloat(conta.valor_parcela || conta.valor_original || 0);
          const campoContaBancaria = conta.tipo_conta === 'Receber' ? 'id_conta_cobranca' : 'id_conta_baixa';

          if (saldoParaDistribuir <= 0) {
            continue;
          }

          let valorPagamentoConta = 0;
          if (saldoParaDistribuir >= valorConta) {
            valorPagamentoConta = valorConta;
            saldoParaDistribuir -= valorConta;
          } else {
            valorPagamentoConta = saldoParaDistribuir;
            saldoParaDistribuir = 0;
          }

          try {
            await axiosInstance.patch(`/contas/${conta.id_conta}/`, {
              status_conta: 'Paga',
              data_pagamento: formBaixa.data_pagamento,
              valor_liquidado: valorPagamentoConta,
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
      } else {
        // Baixa integral
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
      }

      setSuccess(`✅ Baixa em bloco concluída! ${sucessos} conta(s) baixada(s)${erros > 0 ? `, ${erros} erro(s)` : ''}`);
      setTimeout(() => setSuccess(''), 5000);
      setOpenBaixaBloco(false);
      setContasSelecionadas([]);
      await fetchFinancialData();

      if (sucessos > 0 && window.confirm("Baixa em bloco concluída!\n\nDeseja gerar e imprimir o recibo deste pagamento?")) {
        const contaParaRecibo = {
          tipo_conta: contasParaBaixar[0]?.tipo_conta,
          cliente: contasParaBaixar[0]?.cliente,
          id_cliente_fornecedor: contasParaBaixar[0]?.id_cliente_fornecedor,
          descricao: `Recebimento em bloco de ${sucessos} parcela(s)`,
          valor_liquidado: valorPagoInformado,
          data_pagamento: formBaixa.data_pagamento,
          id_conta: 'Bloco',
          documento_numero: 'Bloco-' + Date.now().toString().slice(-4),
          saldo_restante: valorPagoInformado < totalValorSelecionado ? (totalValorSelecionado - valorPagoInformado) : 0
        };
        imprimirRecibo(contaParaRecibo);
      }

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
                          sx={{ color: '#FF9800', mr: 1 }}
                        >
                          <UndoIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => imprimirRecibo(conta)}
                          title="Imprimir Recibo"
                          sx={{ color: '#2196F3' }}
                        >
                          <ReceiptIcon />
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
                          sx={{ color: '#FF9800', mr: 1 }}
                        >
                          <UndoIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => imprimirRecibo(conta)}
                          title="Imprimir Recibo"
                          sx={{ color: '#2196F3' }}
                        >
                          <ReceiptIcon />
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
            onChange={(e) => recalcularValoresBaixa({ data_pagamento: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Checkbox
              checked={!!formBaixa.autoCalcular}
              onChange={(e) => recalcularValoresBaixa({ autoCalcular: e.target.checked })}
            />
            <Typography variant="body2">Calcular juros/desconto automaticamente por atraso/antecipação</Typography>
          </Box>

          {formBaixa.autoCalcular && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Juros (%/mês)"
                  type="number"
                  inputProps={{ step: '0.01' }}
                  value={formBaixa.taxaJuros}
                  onChange={(e) => recalcularValoresBaixa({ taxaJuros: e.target.value })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Multa (%)"
                  type="number"
                  inputProps={{ step: '0.1' }}
                  value={formBaixa.taxaMulta}
                  onChange={(e) => recalcularValoresBaixa({ taxaMulta: e.target.value })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Desconto (%/mês)"
                  type="number"
                  inputProps={{ step: '0.01' }}
                  value={formBaixa.taxaDesconto}
                  onChange={(e) => recalcularValoresBaixa({ taxaDesconto: e.target.value })}
                />
              </Grid>
            </Grid>
          )}

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Juros (R$)"
                type="number"
                inputProps={{ step: '0.01' }}
                disabled={formBaixa.autoCalcular}
                value={formBaixa.juros}
                onChange={(e) => recalcularValoresBaixa({ juros: e.target.value })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Multa (R$)"
                type="number"
                inputProps={{ step: '0.01' }}
                disabled={formBaixa.autoCalcular}
                value={formBaixa.multa}
                onChange={(e) => recalcularValoresBaixa({ multa: e.target.value })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Desconto (R$)"
                type="number"
                inputProps={{ step: '0.01' }}
                disabled={formBaixa.autoCalcular}
                value={formBaixa.desconto}
                onChange={(e) => recalcularValoresBaixa({ desconto: e.target.value })}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Valor Principal Pago"
            type="number"
            inputProps={{ step: '0.01' }}
            value={formBaixa.valorPrincipalPago}
            onChange={(e) => recalcularValoresBaixa({ valorPrincipalPago: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Valor Pago Total (Lançamento)"
            type="number"
            disabled
            value={formBaixa.valor_pago}
            sx={{ mb: 2, '& .MuiInputBase-input.Mui-disabled': { color: 'green', fontWeight: 'bold' } }}
          />

          {contaBaixa && parseFloat(formBaixa.valorPrincipalPago) < parseFloat(contaBaixa.valor_parcela || contaBaixa.valor_original || 0) && parseFloat(formBaixa.valorPrincipalPago) > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>Baixa Parcial Detectada:</strong> Será liquidado R$ {parseFloat(formBaixa.valorPrincipalPago).toFixed(2)} do valor principal e gerada uma nova conta pendente com a diferença de <strong>R$ {(parseFloat(contaBaixa.valor_parcela || contaBaixa.valor_original || 0) - parseFloat(formBaixa.valorPrincipalPago)).toFixed(2)}</strong>.
            </Alert>
          )}

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
          {(() => {
            const contasParaBaixar = contasReceber.filter(c => contasSelecionadas.includes(c.id_conta))
              .concat(contasPagar.filter(c => contasSelecionadas.includes(c.id_conta)));
            const totalValorSelecionado = contasParaBaixar.reduce((sum, c) => sum + parseFloat(c.valor_parcela || c.valor_original || 0), 0);
            const primeiroClienteId = contasParaBaixar[0]?.id_cliente_fornecedor;
            const todosMesmoCliente = contasParaBaixar.every(c => c.id_cliente_fornecedor === primeiroClienteId);
            const nomeCliente = todosMesmoCliente ? (contasParaBaixar[0]?.cliente || '-') : 'Clientes Diversos';

            return (
              <>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                  <Typography><strong>Cliente/Fornecedor:</strong> {nomeCliente}</Typography>
                  <Typography><strong>Total Selecionado:</strong> R$ {totalValorSelecionado.toFixed(2)}</Typography>
                </Box>

                {!todosMesmoCliente && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    As contas selecionadas pertencem a clientes diferentes. A baixa parcial em bloco está desabilitada. As contas serão baixadas integralmente.
                  </Alert>
                )}

                {todosMesmoCliente && parseFloat(formBaixa.valor_pago) < totalValorSelecionado && parseFloat(formBaixa.valor_pago) > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>Baixa Parcial em Bloco Detectada:</strong> O valor de R$ {parseFloat(formBaixa.valor_pago).toFixed(2)} será distribuído entre as contas (as mais antigas primeiro). O saldo restante de R$ {(totalValorSelecionado - parseFloat(formBaixa.valor_pago)).toFixed(2)} gerará diferenças automáticas nas parcelas parcialmente pagas.
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Valor Pago"
                  type="number"
                  inputProps={{ step: '0.01' }}
                  value={formBaixa.valor_pago}
                  disabled={!todosMesmoCliente}
                  onChange={(e) => setFormBaixa({ ...formBaixa, valor_pago: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </>
            );
          })()}

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
