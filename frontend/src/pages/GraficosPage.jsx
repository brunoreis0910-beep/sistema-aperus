import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  Button,
  Stack,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const GraficosPage = () => {
  const { axiosInstance, user, permissions, isLoading: authLoading } = useAuth();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const printRef = useRef();

  // Estados para filtros individuais de cada gráfico
  const [filtroVendas, setFiltroVendas] = useState({ inicio: null, fim: null });
  const [filtroCompras, setFiltroCompras] = useState({ inicio: null, fim: null });
  const [filtroDevolucoes, setFiltroDevolucoes] = useState({ inicio: null, fim: null });
  const [filtroContasReceber, setFiltroContasReceber] = useState({ inicio: null, fim: null });
  const [filtroContasPagar, setFiltroContasPagar] = useState({ inicio: null, fim: null });

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  // Verificar se usuário pode exportar relatórios/gráficos
  const podeExportar = user?.is_staff || permissions?.relatorios_exportar || permissions?.graficos_acessar;

  useEffect(() => {
    carregarDados();
  }, []);

  dayjs.locale('pt-br');

  const carregarDados = async (params) => {
    try {
      setLoading(true);
      setError(null);
      let url = '/graficos/comparativos/';
      if (params && params.inicio && params.fim) {
        url += `?inicio=${params.inicio}&fim=${params.fim}`;
      }
      const response = await axiosInstance.get(url);
      setDados(response.data);
      
      console.log('📊 Dados recebidos da API:', response.data);
      console.log('💰 Contas a receber:', response.data.contas_receber);

      // Inicializar datepickers com o período atual retornado pela API (quando não houver params)
      if (response.data && response.data.periodos) {
        if (params && params.inicio && params.fim) {
          setStartDate(dayjs(params.inicio));
          setEndDate(dayjs(params.fim));
        } else {
          const inicio = response.data.periodos.mes_atual.inicio;
          const fim = response.data.periodos.mes_atual.fim;
          setStartDate(dayjs(inicio));
          setEndDate(dayjs(fim));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      if (err.response?.status === 403) {
        setError('Você não tem permissão para acessar os gráficos.');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Erro ao carregar dados dos gráficos. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const aplicarFiltro = () => {
    if (!startDate || !endDate) {
      setError('Selecione data de início e fim antes de aplicar o filtro.');
      return;
    }

    const inicio = startDate.format('YYYY-MM-DD');
    const fim = endDate.format('YYYY-MM-DD');
    carregarDados({ inicio, fim });
  };

  const limparFiltro = () => {
    setError(null);
    carregarDados();
  };

  const salvarPdf = async () => {
    try {
      setLoading(true);
      setError(null);
      const element = printRef.current;
      if (!element) {
        setError('Área para gerar PDF não encontrada.');
        return;
      }

      // Captura em alta resolução
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Se a imagem é maior que uma página, dividir em múltiplas páginas
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save('graficos.pdf');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setError('Erro ao gerar PDF. Veja o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const salvarGraficoIndividual = async (elementId, nomeArquivo) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        setError('Gráfico não encontrado.');
        return;
      }

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const x = 20;
      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`${nomeArquivo}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setError('Erro ao gerar PDF do gráfico.');
    }
  };

  const imprimirGraficoIndividual = (elementId) => {
    const element = document.getElementById(elementId);
    if (!element) {
      setError('Gráfico não encontrado.');
      return;
    }

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Imprimir Gráfico</title>');
    printWindow.document.write('<style>body{margin:20px;font-family:Arial,sans-serif;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(element.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Componente de filtro individual reutilizável
  const FiltroIndividual = ({ filtro, setFiltro, onAplicar, onLimpar, label }) => (
    <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f9ff', border: '1px solid #e0e7ff' }} elevation={0}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm="auto">
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#667eea' }}>
              🎯 Filtrar {label}:
            </Typography>
          </Grid>
          <Grid item xs={12} sm>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Início"
                  value={filtro.inicio}
                  onChange={(newValue) => setFiltro({ ...filtro, inicio: newValue })}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Fim"
                  value={filtro.fim}
                  onChange={(newValue) => setFiltro({ ...filtro, fim: newValue })}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Stack direction="row" spacing={1} sx={{ height: '100%' }}>
                  <Button 
                    variant="contained" 
                    size="small" 
                    onClick={onAplicar}
                    fullWidth
                    sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
                  >
                    Aplicar
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={onLimpar}
                    fullWidth
                    sx={{ borderColor: '#667eea', color: '#667eea' }}
                  >
                    Limpar
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </LocalizationProvider>
    </Paper>
  );

  const renderVariacao = (variacao) => {
    if (variacao > 0) {
      return (
        <Chip
          icon={<TrendingUpIcon />}
          label={`+${variacao.toFixed(2)}%`}
          color="success"
          size="small"
        />
      );
    } else if (variacao < 0) {
      return (
        <Chip
          icon={<TrendingDownIcon />}
          label={`${variacao.toFixed(2)}%`}
          color="error"
          size="small"
        />
      );
    } else {
      return (
        <Chip
          icon={<TrendingFlatIcon />}
          label="0%"
          color="default"
          size="small"
        />
      );
    }
  };

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user?.is_staff && !permissions?.graficos_acessar) {
    return (
      <Box p={3}>
        <Alert severity="warning">Você não tem permissão para acessar Gráficos.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!dados) {
    return null;
  }

  // Preparar dados para gráficos de barras
  const dadosVendas = [
    {
      periodo: dados.periodos.mes_atual.label,
      valor: dados.vendas.mes_atual.total,
      quantidade: dados.vendas.mes_atual.quantidade,
      tipo: 'Atual'
    },
    {
      periodo: dados.periodos.mes_anterior.label,
      valor: dados.vendas.mes_anterior.total,
      quantidade: dados.vendas.mes_anterior.quantidade,
      tipo: 'Mês Anterior'
    },
    {
      periodo: dados.periodos.ano_passado.label,
      valor: dados.vendas.ano_passado.total,
      quantidade: dados.vendas.ano_passado.quantidade,
      tipo: 'Ano Passado'
    }
  ];

  const dadosCompras = [
    {
      periodo: dados.periodos.mes_atual.label,
      valor: dados.compras.mes_atual.total,
      quantidade: dados.compras.mes_atual.quantidade,
      tipo: 'Atual'
    },
    {
      periodo: dados.periodos.mes_anterior.label,
      valor: dados.compras.mes_anterior.total,
      quantidade: dados.compras.mes_anterior.quantidade,
      tipo: 'Mês Anterior'
    },
    {
      periodo: dados.periodos.ano_passado.label,
      valor: dados.compras.ano_passado.total,
      quantidade: dados.compras.ano_passado.quantidade,
      tipo: 'Ano Passado'
    }
  ];

  const dadosDevolucoes = [
    {
      periodo: dados.periodos.mes_atual.label,
      valor: dados.devolucoes.mes_atual.total,
      quantidade: dados.devolucoes.mes_atual.quantidade,
      tipo: 'Atual'
    },
    {
      periodo: dados.periodos.mes_anterior.label,
      valor: dados.devolucoes.mes_anterior.total,
      quantidade: dados.devolucoes.mes_anterior.quantidade,
      tipo: 'Mês Anterior'
    },
    {
      periodo: dados.periodos.ano_passado.label,
      valor: dados.devolucoes.ano_passado.total,
      quantidade: dados.devolucoes.ano_passado.quantidade,
      tipo: 'Ano Passado'
    }
  ];

  // Dados para contas a receber
  const dadosContasReceber = dados.contas_receber ? [
    { 
      name: 'Recebidas', 
      valor: dados.contas_receber.valor_pago,
      quantidade: dados.contas_receber.qtd_pago,
      cor: '#4CAF50'
    },
    { 
      name: 'A Receber', 
      valor: dados.contas_receber.valor_pendente,
      quantidade: dados.contas_receber.qtd_pendente,
      cor: '#FF9800'
    }
  ] : [];

  // Dados para contas a pagar
  const dadosContasPagar = dados.contas_pagar ? [
    { 
      name: 'Pagas', 
      valor: dados.contas_pagar.valor_pago,
      quantidade: dados.contas_pagar.qtd_pago,
      cor: '#4CAF50'
    },
    { 
      name: 'A Pagar', 
      valor: dados.contas_pagar.valor_pendente,
      quantidade: dados.contas_pagar.qtd_pendente,
      cor: '#F44336'
    }
  ] : [];

  // Cores modernas para os gráficos
  const CORES = ['#4CAF50', '#2196F3', '#FF9800'];
  const CORES_PIZZA = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={8} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {payload[0].payload.periodo}
          </Typography>
          <Typography variant="body2" color="primary" fontWeight="bold">
            Valor: {formatarMoeda(payload[0].value)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Quantidade: {payload[0].payload.quantidade}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={8} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {payload[0].name}
          </Typography>
          <Typography variant="body2" color="primary" fontWeight="bold">
            {formatarMoeda(payload[0].value)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}% do total
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Dados para gráfico de pizza (distribuição por tipo)
  const totalGeral = dados.vendas.mes_atual.total + dados.compras.mes_atual.total + dados.devolucoes.mes_atual.total;
  
  const dadosPizza = [
    { name: 'Vendas', value: dados.vendas.mes_atual.total, total: totalGeral },
    { name: 'Compras', value: dados.compras.mes_atual.total, total: totalGeral },
    { name: 'Devoluções', value: dados.devolucoes.mes_atual.total, total: totalGeral }
  ];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontWeight="bold"
        fontSize="14"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Cabeçalho */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
              📊 Dashboard de Gráficos
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Análise comparativa e visual dos dados do sistema
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button 
              variant="contained" 
              onClick={handlePrint}
              disabled={!podeExportar}
              sx={{ bgcolor: 'white', color: '#667eea', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
            >
              🖨️ Imprimir Tudo
            </Button>
            <Button 
              variant="contained" 
              onClick={salvarPdf}
              disabled={!podeExportar}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
            >
              📄 Exportar PDF
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Área imprimível */}
      <Box ref={printRef}>
        {/* Filtro Global */}
        <Paper sx={{ p: 2.5, mb: 4 }} elevation={2}>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#667eea', mb: 2 }}>
            🔍 Filtro Global de Período
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Data Início"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Data Fim"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={1} sx={{ height: '100%', alignItems: 'center' }}>
                  <Button 
                    variant="contained" 
                    onClick={aplicarFiltro}
                    fullWidth
                    sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
                  >
                    Aplicar Filtro Global
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={limparFiltro}
                    fullWidth
                    sx={{ borderColor: '#667eea', color: '#667eea' }}
                  >
                    Limpar
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </Paper>

      {/* Cards de Resumo - Vendas */}
      <Divider sx={{ my: 4 }} />
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#667eea', display: 'flex', alignItems: 'center', gap: 1 }}>
          💰 Vendas
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Análise comparativa de vendas entre períodos
        </Typography>

        <FiltroIndividual 
          filtro={filtroVendas}
          setFiltro={setFiltroVendas}
          onAplicar={() => {
            if (filtroVendas.inicio && filtroVendas.fim) {
              const inicio = filtroVendas.inicio.format('YYYY-MM-DD');
              const fim = filtroVendas.fim.format('YYYY-MM-DD');
              carregarDados({ inicio, fim });
            }
          }}
          onLimpar={() => {
            setFiltroVendas({ inicio: null, fim: null });
            carregarDados();
          }}
          label="Vendas"
        />

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%', borderTop: '4px solid #4CAF50' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2" fontWeight="600">
                  {dados.periodos.mes_atual.label}
                </Typography>
                <Typography variant="h5" component="div" color="primary" fontWeight="bold">
                  {formatarMoeda(dados.vendas.mes_atual.total)}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {dados.vendas.mes_atual.quantidade} vendas
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" display="block" fontWeight="600">vs Mês Anterior</Typography>
                    {renderVariacao(dados.vendas.variacoes.vs_mes_anterior)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" display="block" fontWeight="600">vs Ano Passado</Typography>
                    {renderVariacao(dados.vendas.variacoes.vs_ano_passado)}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%', borderTop: '4px solid #2196F3' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2" fontWeight="600">
                  {dados.periodos.mes_anterior.label}
                </Typography>
              <Typography variant="h5" component="div">
                {formatarMoeda(dados.vendas.mes_anterior.total)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {dados.vendas.mes_anterior.quantidade} vendas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%', borderTop: '4px solid #FF9800' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2" fontWeight="600">
                  {dados.periodos.ano_passado.label}
                </Typography>
                <Typography variant="h5" component="div" fontWeight="bold">
                  {formatarMoeda(dados.vendas.ano_passado.total)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {dados.vendas.ano_passado.quantidade} vendas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Gráficos de Vendas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', borderRadius: 2 }} id="grafico-vendas-comparativo">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#667eea' }}>
                  📊 Comparativo de Vendas
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Comparação entre períodos selecionados
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => imprimirGraficoIndividual('grafico-vendas-comparativo')}
                  disabled={!podeExportar}
                  sx={{ borderColor: '#667eea', color: '#667eea' }}
                >
                  🖨️ Imprimir
                </Button>
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={() => salvarGraficoIndividual('grafico-vendas-comparativo', 'vendas-comparativo')}
                  disabled={!podeExportar}
                  sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
                >
                  📄 PDF
                </Button>
              </Stack>
            </Box>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dadosVendas} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorVenda" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="periodo" 
                  tick={{ fill: '#666', fontSize: 12 }}
                  axisLine={{ stroke: '#999' }}
                />
                <YAxis 
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  tick={{ fill: '#666', fontSize: 12 }}
                  axisLine={{ stroke: '#999' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="valor" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                >
                  {dadosVendas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                  <LabelList 
                    dataKey="quantidade" 
                    position="top" 
                    formatter={(value) => `${value} vendas`}
                    style={{ fontSize: 11, fill: '#666' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', borderRadius: 2 }} id="grafico-distribuicao-pizza">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#667eea' }}>
                  🥧 Distribuição Atual
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Proporção entre operações
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => imprimirGraficoIndividual('grafico-distribuicao-pizza')}
                  disabled={!podeExportar}
                  sx={{ borderColor: '#667eea', color: '#667eea' }}
                >
                  🖨️
                </Button>
                <Button 
                  size="small" 
                  variant="contained"
                  onClick={() => salvarGraficoIndividual('grafico-distribuicao-pizza', 'distribuicao-atual')}
                  disabled={!podeExportar}
                  sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#5568d3' } }}
                >
                  📄
                </Button>
              </Stack>
            </Box>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1000}
                >
                  {dadosPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => `${value}: ${formatarMoeda(entry.payload.value)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Cards de Resumo - Compras */}
      <Divider sx={{ my: 4 }} />
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#667eea', display: 'flex', alignItems: 'center', gap: 1 }}>
          🛒 Compras
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Análise comparativa de compras entre períodos
        </Typography>

        <FiltroIndividual 
          filtro={filtroCompras}
          setFiltro={setFiltroCompras}
          onAplicar={() => {
            if (filtroCompras.inicio && filtroCompras.fim) {
              const inicio = filtroCompras.inicio.format('YYYY-MM-DD');
              const fim = filtroCompras.fim.format('YYYY-MM-DD');
              carregarDados({ inicio, fim });
            }
          }}
          onLimpar={() => {
            setFiltroCompras({ inicio: null, fim: null });
            carregarDados();
          }}
          label="Compras"
        />

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%', borderTop: '4px solid #FF9800' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2" fontWeight="600">
                  {dados.periodos.mes_atual.label}
                </Typography>
                <Typography variant="h5" component="div" color="primary" fontWeight="bold">
                  {formatarMoeda(dados.compras.mes_atual.total)}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {dados.compras.mes_atual.quantidade} compras
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" display="block">vs Mês Anterior</Typography>
                  {renderVariacao(dados.compras.variacoes.vs_mes_anterior)}
                </Box>
                <Box>
                  <Typography variant="caption" display="block">vs Ano Passado</Typography>
                  {renderVariacao(dados.compras.variacoes.vs_ano_passado)}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                {dados.periodos.mes_anterior.label}
              </Typography>
              <Typography variant="h5" component="div">
                {formatarMoeda(dados.compras.mes_anterior.total)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {dados.compras.mes_anterior.quantidade} compras
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                {dados.periodos.ano_passado.label}
              </Typography>
              <Typography variant="h5" component="div">
                {formatarMoeda(dados.compras.ano_passado.total)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {dados.compras.ano_passado.quantidade} compras
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico de Compras com Linha de Tendência */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }} id="grafico-compras-area">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            📈 Comparativo de Compras
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => imprimirGraficoIndividual('grafico-compras-area')}>Imprimir</Button>
            <Button size="small" variant="outlined" onClick={() => salvarGraficoIndividual('grafico-compras-area', 'compras-comparativo')}>PDF</Button>
          </Stack>
        </Box>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={dadosCompras} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCompra" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2196F3" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#2196F3" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="periodo"
              tick={{ fill: '#666', fontSize: 12 }}
              axisLine={{ stroke: '#999' }}
            />
            <YAxis 
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              tick={{ fill: '#666', fontSize: 12 }}
              axisLine={{ stroke: '#999' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="valor" 
              stroke="#2196F3" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCompra)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>
      </Box> {/* Fecha Box da seção Compras */}

      {/* Cards de Resumo - Devoluções */}
      <Divider sx={{ my: 4 }} />
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#667eea', display: 'flex', alignItems: 'center', gap: 1 }}>
          🔄 Devoluções
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Análise comparativa de devoluções entre períodos
        </Typography>

        <FiltroIndividual 
          filtro={filtroDevolucoes}
          setFiltro={setFiltroDevolucoes}
        onAplicar={() => {
          if (filtroDevolucoes.inicio && filtroDevolucoes.fim) {
            const inicio = filtroDevolucoes.inicio.format('YYYY-MM-DD');
            const fim = filtroDevolucoes.fim.format('YYYY-MM-DD');
            carregarDados({ inicio, fim });
          }
        }}
        onLimpar={() => {
          setFiltroDevolucoes({ inicio: null, fim: null });
          carregarDados();
        }}
        label="Devoluções"
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                {dados.periodos.mes_atual.label}
              </Typography>
              <Typography variant="h5" component="div" color="error">
                {formatarMoeda(dados.devolucoes.mes_atual.total)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {dados.devolucoes.mes_atual.quantidade} devoluções
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" display="block">vs Mês Anterior</Typography>
                  {renderVariacao(dados.devolucoes.variacoes.vs_mes_anterior)}
                </Box>
                <Box>
                  <Typography variant="caption" display="block">vs Ano Passado</Typography>
                  {renderVariacao(dados.devolucoes.variacoes.vs_ano_passado)}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                {dados.periodos.mes_anterior.label}
              </Typography>
              <Typography variant="h5" component="div">
                {formatarMoeda(dados.devolucoes.mes_anterior.total)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {dados.devolucoes.mes_anterior.quantidade} devoluções
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                {dados.periodos.ano_passado.label}
              </Typography>
              <Typography variant="h5" component="div">
                {formatarMoeda(dados.devolucoes.ano_passado.total)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {dados.devolucoes.ano_passado.quantidade} devoluções
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico de Devoluções com Linha */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }} id="grafico-devolucoes-linha">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            📉 Comparativo de Devoluções
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => imprimirGraficoIndividual('grafico-devolucoes-linha')}>Imprimir</Button>
            <Button size="small" variant="outlined" onClick={() => salvarGraficoIndividual('grafico-devolucoes-linha', 'devolucoes-comparativo')}>PDF</Button>
          </Stack>
        </Box>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={dadosDevolucoes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorDevolucao" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF9800" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#FF9800" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="periodo"
              tick={{ fill: '#666', fontSize: 12 }}
              axisLine={{ stroke: '#999' }}
            />
            <YAxis 
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              tick={{ fill: '#666', fontSize: 12 }}
              axisLine={{ stroke: '#999' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="valor" 
              stroke="#FF9800" 
              strokeWidth={3}
              dot={{ fill: '#FF9800', r: 6 }}
              activeDot={{ r: 8 }}
              animationDuration={1000}
            >
              <LabelList 
                dataKey="quantidade" 
                position="top" 
                formatter={(value) => `${value}`}
                style={{ fontSize: 11, fill: '#666', fontWeight: 'bold' }}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </Paper>
      </Box> {/* Fecha Box da seção Devoluções */}

      {/* Gráfico de Contas a Receber */}
      {dados.contas_receber && (
        <>
          <Divider sx={{ my: 4 }} />
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#667eea', display: 'flex', alignItems: 'center', gap: 1 }}>
              💰 Contas a Receber
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Análise de contas recebidas e pendentes
            </Typography>

            <FiltroIndividual 
              filtro={filtroContasReceber}
              setFiltro={setFiltroContasReceber}
            onAplicar={() => {
              if (filtroContasReceber.inicio && filtroContasReceber.fim) {
                const inicio = filtroContasReceber.inicio.format('YYYY-MM-DD');
                const fim = filtroContasReceber.fim.format('YYYY-MM-DD');
                carregarDados({ inicio, fim });
              }
            }}
            onLimpar={() => {
              setFiltroContasReceber({ inicio: null, fim: null });
              carregarDados();
            }}
            label="Contas a Receber"
          />

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total de Contas
                  </Typography>
                  <Typography variant="h5" component="div" color="primary">
                    {dados.contas_receber.total_contas || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Valor Total: {formatarMoeda(dados.contas_receber.valor_total || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Chip 
                      label={`${dados.contas_receber.qtd_pago || 0} Recebidas`}
                      color="success"
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Chip 
                      label={`${dados.contas_receber.qtd_pendente || 0} Pendentes`}
                      color="warning"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper elevation={3} sx={{ p: 3, mb: 4 }} id="grafico-contas-receber">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                💳 Status de Contas a Receber no Período
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => imprimirGraficoIndividual('grafico-contas-receber')} disabled={!podeExportar}>Imprimir</Button>
                <Button size="small" variant="outlined" onClick={() => salvarGraficoIndividual('grafico-contas-receber', 'contas-receber')} disabled={!podeExportar}>PDF</Button>
              </Stack>
            </Box>
            {dadosContasReceber.length > 0 && (dados.contas_receber.total_contas > 0) ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dadosContasReceber} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#666', fontSize: 12 }}
                    axisLine={{ stroke: '#999' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    tick={{ fill: '#666', fontSize: 12 }}
                    axisLine={{ stroke: '#999' }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      formatarMoeda(value),
                      `${props.payload.quantidade} contas`
                    ]}
                    labelFormatter={(label) => label}
                  />
                  <Legend />
                  <Bar 
                    dataKey="valor" 
                    radius={[8, 8, 0, 0]}
                    animationDuration={1000}
                  >
                    {dadosContasReceber.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                    <LabelList 
                      dataKey="quantidade" 
                      position="top" 
                      formatter={(value) => `${value} contas`}
                      style={{ fontSize: 11, fill: '#666' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="body1" color="textSecondary">
                  Não há contas a receber no período selecionado
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Gráfico de Pizza - Contas a Receber */}
          <Paper elevation={3} sx={{ p: 3, mb: 4 }} id="grafico-contas-receber-pizza">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                📊 Distribuição de Contas a Receber
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => imprimirGraficoIndividual('grafico-contas-receber-pizza')} disabled={!podeExportar}>Imprimir</Button>
                <Button size="small" variant="outlined" onClick={() => salvarGraficoIndividual('grafico-contas-receber-pizza', 'contas-receber-pizza')} disabled={!podeExportar}>PDF</Button>
              </Stack>
            </Box>
            {dadosContasReceber.length > 0 && (dados.contas_receber.total_contas > 0) ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={dadosContasReceber}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, quantidade }) => `${name}: ${quantidade} (${(percent * 100).toFixed(1)}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="quantidade"
                    animationDuration={1000}
                  >
                    {dadosContasReceber.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} contas - ${formatarMoeda(props.payload.valor)}`,
                      props.payload.name
                    ]}
                  />
                  <Legend 
                    formatter={(value, entry) => `${entry.payload.name}: ${entry.payload.quantidade} contas (${formatarMoeda(entry.payload.valor)})`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="body1" color="textSecondary">
                  Não há contas a receber no período selecionado
                </Typography>
              </Box>
            )}
          </Paper>
          </Box> {/* Fecha Box da seção Contas a Receber */}
        </>
      )}

      {/* Gráfico de Contas a Pagar */}
      {dados.contas_pagar && (
        <>
          <Divider sx={{ my: 4 }} />
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#667eea', display: 'flex', alignItems: 'center', gap: 1 }}>
              💸 Contas a Pagar
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Análise de contas pagas e pendentes
            </Typography>

            <FiltroIndividual 
              filtro={filtroContasPagar}
              setFiltro={setFiltroContasPagar}
            onAplicar={() => {
              if (filtroContasPagar.inicio && filtroContasPagar.fim) {
                const inicio = filtroContasPagar.inicio.format('YYYY-MM-DD');
                const fim = filtroContasPagar.fim.format('YYYY-MM-DD');
                carregarDados({ inicio, fim });
              }
            }}
            onLimpar={() => {
              setFiltroContasPagar({ inicio: null, fim: null });
              carregarDados();
            }}
            label="Contas a Pagar"
          />

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total de Contas
                  </Typography>
                  <Typography variant="h5" component="div" color="error">
                    {dados.contas_pagar.total_contas || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Valor Total: {formatarMoeda(dados.contas_pagar.valor_total || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Chip 
                      label={`${dados.contas_pagar.qtd_pago || 0} Pagas`}
                      color="success"
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Chip 
                      label={`${dados.contas_pagar.qtd_pendente || 0} Pendentes`}
                      color="error"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper elevation={3} sx={{ p: 3, mb: 4 }} id="grafico-contas-pagar">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                💳 Status de Contas a Pagar no Período
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => imprimirGraficoIndividual('grafico-contas-pagar')} disabled={!podeExportar}>Imprimir</Button>
                <Button size="small" variant="outlined" onClick={() => salvarGraficoIndividual('grafico-contas-pagar', 'contas-pagar')} disabled={!podeExportar}>PDF</Button>
              </Stack>
            </Box>
            {dadosContasPagar.length > 0 && (dados.contas_pagar.total_contas > 0) ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dadosContasPagar} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#666', fontSize: 12 }}
                    axisLine={{ stroke: '#999' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    tick={{ fill: '#666', fontSize: 12 }}
                    axisLine={{ stroke: '#999' }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      formatarMoeda(value),
                      `${props.payload.quantidade} contas`
                    ]}
                    labelFormatter={(label) => label}
                  />
                  <Legend />
                  <Bar 
                    dataKey="valor" 
                    radius={[8, 8, 0, 0]}
                    animationDuration={1000}
                  >
                    {dadosContasPagar.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                    <LabelList 
                      dataKey="quantidade" 
                      position="top" 
                      formatter={(value) => `${value} contas`}
                      style={{ fontSize: 11, fill: '#666' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="body1" color="textSecondary">
                  Não há contas a pagar no período selecionado
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Gráfico de Pizza - Contas a Pagar */}
          <Paper elevation={3} sx={{ p: 3, mb: 4 }} id="grafico-contas-pagar-pizza">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                📊 Distribuição de Contas a Pagar
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => imprimirGraficoIndividual('grafico-contas-pagar-pizza')} disabled={!podeExportar}>Imprimir</Button>
                <Button size="small" variant="outlined" onClick={() => salvarGraficoIndividual('grafico-contas-pagar-pizza', 'contas-pagar-pizza')} disabled={!podeExportar}>PDF</Button>
              </Stack>
            </Box>
            {dadosContasPagar.length > 0 && (dados.contas_pagar.total_contas > 0) ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={dadosContasPagar}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, quantidade }) => `${name}: ${quantidade} (${(percent * 100).toFixed(1)}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="quantidade"
                    animationDuration={1000}
                  >
                    {dadosContasPagar.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} contas - ${formatarMoeda(props.payload.valor)}`,
                      props.payload.name
                    ]}
                  />
                  <Legend 
                    formatter={(value, entry) => `${entry.payload.name}: ${entry.payload.quantidade} contas (${formatarMoeda(entry.payload.valor)})`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="body1" color="textSecondary">
                  Não há contas a pagar no período selecionado
                </Typography>
              </Box>
            )}
          </Paper>
          </Box>
        </>
      )}
      </Box>
    </Box>
  );
};

export default GraficosPage;
