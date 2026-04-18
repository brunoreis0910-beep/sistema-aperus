import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardActions,
  Button, Divider, Chip, CircularProgress, Alert, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, IconButton, Tabs, Tab,
  Autocomplete, Tooltip, LinearProgress, Collapse, MenuItem
} from '@mui/material';
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  Star as StarIcon,
  Description as DescriptionIcon,
  Group as GroupIcon,
  Label as LabelIcon,
  Close as CloseIcon,
  Print as PrintIcon,
  ArrowBack as ArrowBackIcon,
  WhatsApp as WhatsAppIcon,
  PictureAsPdf as PdfIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { visualizarPDF, compartilharPDF } from '../utils/pdfDownload';

const fmtMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtData = (d) => { if (!d) return '—'; return new Date(d).toLocaleDateString('pt-BR'); };

const ESTADOS_BR = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

// ==================== COMPONENTE DE ATALHOS DE PERÍODO ====================
function AtalhosPeriodo({ onSelect }) {
  const hoje = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const atalhos = [
    { label: 'Hoje', fn: () => ({ data_inicio: fmt(hoje), data_fim: fmt(hoje) }) },
    { label: '7 dias', fn: () => { const d = new Date(); d.setDate(d.getDate() - 7); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: '30 dias', fn: () => { const d = new Date(); d.setDate(d.getDate() - 30); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: '90 dias', fn: () => { const d = new Date(); d.setDate(d.getDate() - 90); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: '6 meses', fn: () => { const d = new Date(); d.setMonth(d.getMonth() - 6); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: '12 meses', fn: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: 'Mês atual', fn: () => { const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: 'Ano atual', fn: () => { const d = new Date(hoje.getFullYear(), 0, 1); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
  ];
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      {atalhos.map(a => (
        <Chip key={a.label} label={a.label} size="small" variant="outlined" clickable onClick={() => onSelect(a.fn())} sx={{ fontSize: '0.7rem' }} />
      ))}
    </Box>
  );
}

// ==================== GERADOR DE PDF ====================
function gerarPDF(titulo, colunas, linhas, resumo = null) {
  const doc = new jsPDF({ orientation: linhas[0]?.length > 6 ? 'landscape' : 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('APERUS', 14, 18);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(titulo, 14, 26);
  doc.setFontSize(8);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW - 14, 18, { align: 'right' });

  let startY = 32;

  if (resumo) {
    doc.setFontSize(9);
    doc.text(resumo, 14, startY);
    startY += 8;
  }

  autoTable(doc, {
    head: [colunas],
    body: linhas,
    startY,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 },
  });

  // Usar função que funciona tanto no navegador quanto no Capacitor
  const filename = `${titulo.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0,10)}`;
  visualizarPDF(doc, filename);
}

// ==================== SUB-COMPONENTES DE RELATÓRIO ====================

function RelatorioTotalPagamentos({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', cidade: '', estado: '', valor_min: '', valor_max: '', ordenar_por: 'total_pago', limite: '', busca: '' });

  const limparFiltros = () => setFiltros({ data_inicio: '', data_fim: '', cidade: '', estado: '', valor_min: '', valor_max: '', ordenar_por: 'total_pago', limite: '', busca: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/clientes/total-pagamentos/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const exportarPDF = () => {
    if (!dados) return;
    gerarPDF(
      'Relatório - Total de Pagamentos',
      ['#', 'Cliente', 'CPF/CNPJ', 'Cidade', 'UF', 'Pagamentos', 'Total Pago', 'Último Pgto'],
      dados.clientes.map((c, i) => [i + 1, c.nome_cliente, c.cpf_cnpj, c.cidade, c.estado || '', c.qtd_pagamentos, fmtMoeda(c.total_pago), fmtData(c.ultimo_pagamento)]),
      `${dados.qtd_clientes} clientes | Total: ${fmtMoeda(dados.total_geral)}`
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }} className="no-print">
        <Button size="small" startIcon={mostrarFiltros ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setMostrarFiltros(!mostrarFiltros)}>
          Filtros
        </Button>
        <AtalhosPeriodo onSelect={(p) => setFiltros(f => ({ ...f, ...p }))} />
      </Box>
      <Collapse in={mostrarFiltros}>
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }} className="no-print" variant="outlined">
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Data Início" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filtros.data_inicio} onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Data Fim" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filtros.data_fim} onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Buscar Nome/CPF" size="small" fullWidth value={filtros.busca} onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Cidade" size="small" fullWidth value={filtros.cidade} onChange={e => setFiltros(p => ({ ...p, cidade: e.target.value }))} />
            </Grid>
            <Grid item xs={4} sm={2} md={1}>
              <TextField label="UF" select size="small" fullWidth value={filtros.estado} onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}>
                <MenuItem value="">Todos</MenuItem>
                {ESTADOS_BR.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4} sm={2} md={1}>
              <TextField label="Valor Mín" type="number" size="small" fullWidth value={filtros.valor_min} onChange={e => setFiltros(p => ({ ...p, valor_min: e.target.value }))} />
            </Grid>
            <Grid item xs={4} sm={2} md={1}>
              <TextField label="Valor Máx" type="number" size="small" fullWidth value={filtros.valor_max} onChange={e => setFiltros(p => ({ ...p, valor_max: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField label="Ordenar por" select size="small" fullWidth value={filtros.ordenar_por} onChange={e => setFiltros(p => ({ ...p, ordenar_por: e.target.value }))}>
                <MenuItem value="total_pago">Maior Valor</MenuItem>
                <MenuItem value="nome">Nome A-Z</MenuItem>
                <MenuItem value="qtd">Qtd Pagamentos</MenuItem>
                <MenuItem value="cidade">Cidade</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={3} sm={2} md={1}>
              <TextField label="Limite" type="number" size="small" fullWidth value={filtros.limite} onChange={e => setFiltros(p => ({ ...p, limite: e.target.value }))} placeholder="Todos" />
            </Grid>
            <Grid item xs={3} sm={2} md={0.5}>
              <Tooltip title="Limpar filtros"><IconButton onClick={limparFiltros} size="small"><ClearIcon /></IconButton></Tooltip>
            </Grid>
          </Grid>
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={buscar} disabled={loading} startIcon={<SearchIcon />}>Buscar</Button>
            {dados && <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PdfIcon />}>Salvar PDF</Button>}
          </Box>
        </Paper>
      </Collapse>
      {loading && <LinearProgress />}
      {dados && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`${dados.qtd_clientes} clientes`} color="primary" />
            <Chip label={`Total: ${fmtMoeda(dados.total_geral)}`} color="success" />
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>#</TableCell><TableCell>Cliente</TableCell><TableCell>CPF/CNPJ</TableCell>
                <TableCell>Cidade</TableCell><TableCell>UF</TableCell><TableCell align="center">Pagamentos</TableCell>
                <TableCell align="right">Total Pago</TableCell><TableCell>Último Pgto</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {dados.clientes.map((c, i) => (
                  <TableRow key={c.id_cliente} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><strong>{c.nome_cliente}</strong></TableCell>
                    <TableCell>{c.cpf_cnpj}</TableCell>
                    <TableCell>{c.cidade}</TableCell>
                    <TableCell>{c.estado}</TableCell>
                    <TableCell align="center">{c.qtd_pagamentos}</TableCell>
                    <TableCell align="right">{fmtMoeda(c.total_pago)}</TableCell>
                    <TableCell>{fmtData(c.ultimo_pagamento)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

function RelatorioExtratoCliente({ axiosInstance }) {
  const [clientes, setClientes] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ id_cliente: '', data_inicio: '', data_fim: '' });
  const [clienteSel, setClienteSel] = useState(null);

  const buscarClientes = useCallback(async (busca) => {
    if (!busca || busca.length < 2) return;
    setBuscando(true);
    try {
      const r = await axiosInstance.get('clientes/', { params: { search: busca, page_size: 20 } });
      setClientes(Array.isArray(r.data) ? r.data : (r.data.results || []));
    } catch { setClientes([]); }
    setBuscando(false);
  }, [axiosInstance]);

  const buscar = async () => {
    if (!filtros.id_cliente) return;
    setLoading(true);
    try {
      const params = { id_cliente: filtros.id_cliente };
      if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
      if (filtros.data_fim) params.data_fim = filtros.data_fim;
      const r = await axiosInstance.get('/relatorios/clientes/extrato/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const exportarPDF = () => {
    if (!dados) return;
    gerarPDF(
      `Extrato - ${dados.cliente.nome}`,
      ['Vencimento', 'Pagamento', 'Descrição', 'Doc/Parcela', 'Tipo', 'Valor', 'Pago', 'Status'],
      dados.movimentacoes.map(m => [fmtData(m.data_vencimento), fmtData(m.data_pagamento), m.descricao, `${m.documento} ${m.parcela !== '1/1' ? `(${m.parcela})` : ''}`, m.tipo, fmtMoeda(m.valor), m.valor_pago > 0 ? fmtMoeda(m.valor_pago) : '—', m.status]),
      `${dados.cliente.cpf_cnpj} | Débitos: ${fmtMoeda(dados.resumo.total_debitos)} | Créditos: ${fmtMoeda(dados.resumo.total_creditos)} | Saldo: ${fmtMoeda(dados.resumo.saldo)}`
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }} className="no-print" variant="outlined">
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={5} md={4}>
            <Autocomplete
              options={clientes}
              getOptionLabel={(c) => `${c.nome_razao_social || ''} — ${c.cpf_cnpj || ''}`}
              loading={buscando}
              onInputChange={(_, v) => buscarClientes(v)}
              onChange={(_, v) => { setFiltros(p => ({ ...p, id_cliente: v?.id_cliente || '' })); setClienteSel(v); }}
              filterOptions={x => x}
              renderInput={(params) => <TextField {...params} label="Selecionar Cliente *" size="small" />}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField label="Data Início" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filtros.data_inicio} onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField label="Data Fim" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filtros.data_fim} onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
          </Grid>
        </Grid>
        <Box sx={{ mt: 1 }}>
          <AtalhosPeriodo onSelect={(p) => setFiltros(f => ({ ...f, ...p }))} />
        </Box>
        <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={buscar} disabled={loading || !filtros.id_cliente} startIcon={<SearchIcon />}>Buscar</Button>
          {dados && <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PdfIcon />}>Salvar PDF</Button>}
        </Box>
      </Paper>
      {loading && <LinearProgress />}
      {dados && (
        <>
          <Paper sx={{ p: 2, mb: 2, borderLeft: '4px solid #1976d2' }}>
            <Typography variant="h6">{dados.cliente.nome}</Typography>
            <Typography variant="body2" color="text.secondary">{dados.cliente.cpf_cnpj} | {dados.cliente.cidade}/{dados.cliente.estado}</Typography>
          </Paper>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`Débitos: ${fmtMoeda(dados.resumo.total_debitos)}`} color="error" />
            <Chip label={`Créditos: ${fmtMoeda(dados.resumo.total_creditos)}`} color="success" />
            <Chip label={`Saldo: ${fmtMoeda(dados.resumo.saldo)}`} color={dados.resumo.saldo > 0 ? 'error' : 'success'} variant="outlined" />
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>Vencimento</TableCell><TableCell>Pagamento</TableCell><TableCell>Descrição</TableCell>
                <TableCell>Doc/Parcela</TableCell><TableCell>Tipo</TableCell><TableCell align="right">Valor</TableCell>
                <TableCell align="right">Pago</TableCell><TableCell>Status</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {dados.movimentacoes.map((m, i) => (
                  <TableRow key={i} hover sx={{ bgcolor: m.status === 'Pendente' && m.tipo === 'Receber' ? '#fff3f0' : 'inherit' }}>
                    <TableCell>{fmtData(m.data_vencimento)}</TableCell>
                    <TableCell>{fmtData(m.data_pagamento)}</TableCell>
                    <TableCell>{m.descricao}</TableCell>
                    <TableCell>{m.documento} {m.parcela !== '1/1' && `(${m.parcela})`}</TableCell>
                    <TableCell><Chip label={m.tipo} size="small" color={m.tipo === 'Receber' ? 'error' : 'info'} variant="outlined" /></TableCell>
                    <TableCell align="right">{fmtMoeda(m.valor)}</TableCell>
                    <TableCell align="right">{m.valor_pago > 0 ? fmtMoeda(m.valor_pago) : '—'}</TableCell>
                    <TableCell><Chip label={m.status} size="small" color={m.status === 'Pendente' ? 'warning' : 'success'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

function RelatorioTotalGastos({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', cidade: '', estado: '', valor_min: '', valor_max: '', ordenar_por: 'total_gasto', limite: '', busca: '' });

  const limparFiltros = () => setFiltros({ data_inicio: '', data_fim: '', cidade: '', estado: '', valor_min: '', valor_max: '', ordenar_por: 'total_gasto', limite: '', busca: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/clientes/total-gastos/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const exportarPDF = () => {
    if (!dados) return;
    gerarPDF(
      'Relatório - Total de Gastos por Cliente',
      ['#', 'Cliente', 'CPF/CNPJ', 'Cidade', 'UF', 'Compras', 'Total Gasto', 'Ticket Médio'],
      dados.clientes.map((c, i) => [i + 1, c.nome_cliente, c.cpf_cnpj, c.cidade, c.estado || '', c.qtd_compras, fmtMoeda(c.total_gasto), fmtMoeda(c.ticket_medio)]),
      `${dados.qtd_clientes} clientes | Total: ${fmtMoeda(dados.total_geral)}`
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }} className="no-print">
        <Button size="small" startIcon={mostrarFiltros ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setMostrarFiltros(!mostrarFiltros)}>Filtros</Button>
        <AtalhosPeriodo onSelect={(p) => setFiltros(f => ({ ...f, ...p }))} />
      </Box>
      <Collapse in={mostrarFiltros}>
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }} className="no-print" variant="outlined">
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Data Início" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filtros.data_inicio} onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Data Fim" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filtros.data_fim} onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Buscar Nome/CPF" size="small" fullWidth value={filtros.busca} onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Cidade" size="small" fullWidth value={filtros.cidade} onChange={e => setFiltros(p => ({ ...p, cidade: e.target.value }))} />
            </Grid>
            <Grid item xs={4} sm={2} md={1}>
              <TextField label="UF" select size="small" fullWidth value={filtros.estado} onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}>
                <MenuItem value="">Todos</MenuItem>
                {ESTADOS_BR.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4} sm={2} md={1}>
              <TextField label="Valor Mín" type="number" size="small" fullWidth value={filtros.valor_min} onChange={e => setFiltros(p => ({ ...p, valor_min: e.target.value }))} />
            </Grid>
            <Grid item xs={4} sm={2} md={1}>
              <TextField label="Valor Máx" type="number" size="small" fullWidth value={filtros.valor_max} onChange={e => setFiltros(p => ({ ...p, valor_max: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField label="Ordenar por" select size="small" fullWidth value={filtros.ordenar_por} onChange={e => setFiltros(p => ({ ...p, ordenar_por: e.target.value }))}>
                <MenuItem value="total_gasto">Maior Gasto</MenuItem>
                <MenuItem value="nome">Nome A-Z</MenuItem>
                <MenuItem value="qtd">Qtd Compras</MenuItem>
                <MenuItem value="ticket">Ticket Médio</MenuItem>
                <MenuItem value="cidade">Cidade</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={3} sm={2} md={1}>
              <TextField label="Limite" type="number" size="small" fullWidth value={filtros.limite} onChange={e => setFiltros(p => ({ ...p, limite: e.target.value }))} placeholder="Todos" />
            </Grid>
            <Grid item xs={3} sm={1} md={0.5}>
              <Tooltip title="Limpar filtros"><IconButton onClick={limparFiltros} size="small"><ClearIcon /></IconButton></Tooltip>
            </Grid>
          </Grid>
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={buscar} disabled={loading} startIcon={<SearchIcon />}>Buscar</Button>
            {dados && <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PdfIcon />}>Salvar PDF</Button>}
          </Box>
        </Paper>
      </Collapse>
      {loading && <LinearProgress />}
      {dados && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`${dados.qtd_clientes} clientes`} color="primary" />
            <Chip label={`Total: ${fmtMoeda(dados.total_geral)}`} color="success" />
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>#</TableCell><TableCell>Cliente</TableCell><TableCell>CPF/CNPJ</TableCell>
                <TableCell>Cidade</TableCell><TableCell>UF</TableCell><TableCell align="center">Compras</TableCell>
                <TableCell align="right">Total Gasto</TableCell><TableCell align="right">Ticket Médio</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {dados.clientes.map((c, i) => (
                  <TableRow key={c.id_cliente} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><strong>{c.nome_cliente}</strong></TableCell>
                    <TableCell>{c.cpf_cnpj}</TableCell>
                    <TableCell>{c.cidade}</TableCell>
                    <TableCell>{c.estado}</TableCell>
                    <TableCell align="center">{c.qtd_compras}</TableCell>
                    <TableCell align="right">{fmtMoeda(c.total_gasto)}</TableCell>
                    <TableCell align="right">{fmtMoeda(c.ticket_medio)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

function RelatorioVendas12Meses({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [idCliente, setIdCliente] = useState('');

  const buscarClientes = useCallback(async (busca) => {
    if (!busca || busca.length < 2) return;
    setBuscando(true);
    try {
      const r = await axiosInstance.get('clientes/', { params: { search: busca, page_size: 20 } });
      setClientes(Array.isArray(r.data) ? r.data : (r.data.results || []));
    } catch { setClientes([]); }
    setBuscando(false);
  }, [axiosInstance]);

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      if (idCliente) params.id_cliente = idCliente;
      const r = await axiosInstance.get('/relatorios/clientes/vendas-12-meses/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const exportarPDF = () => {
    if (!dados) return;
    const linhas = dados.meses.map(m => [m.mes_nome, m.qtd, fmtMoeda(m.total)]);
    if (dados.top_clientes?.length) {
      linhas.push(['', '', '']);
      linhas.push(['--- TOP CLIENTES ---', '', '']);
      dados.top_clientes.forEach((c, i) => linhas.push([`${i + 1}. ${c.nome}`, c.qtd, fmtMoeda(c.total)]));
    }
    gerarPDF(
      `Vendas 12 Meses${dados.cliente ? ` - ${dados.cliente.nome}` : ''}`,
      ['Mês', 'Vendas', 'Total'],
      linhas,
      `Total 12 meses: ${fmtMoeda(dados.total_geral)}`
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }} className="no-print" variant="outlined">
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={6} md={5}>
            <Autocomplete
              options={clientes}
              getOptionLabel={(c) => `${c.nome_razao_social || ''} — ${c.cpf_cnpj || ''}`}
              loading={buscando}
              onInputChange={(_, v) => buscarClientes(v)}
              onChange={(_, v) => setIdCliente(v?.id_cliente || '')}
              filterOptions={x => x}
              renderInput={(params) => <TextField {...params} label="Filtrar por Cliente (opcional)" size="small" />}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={buscar} disabled={loading} startIcon={<SearchIcon />}>Buscar</Button>
          {dados && <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PdfIcon />}>Salvar PDF</Button>}
        </Box>
      </Paper>
      {loading && <LinearProgress />}
      {dados && (
        <>
          {dados.cliente && (
            <Paper sx={{ p: 2, mb: 2, borderLeft: '4px solid #1976d2' }}>
              <Typography variant="h6">{dados.cliente.nome}</Typography>
              <Typography variant="body2" color="text.secondary">{dados.cliente.cpf_cnpj}</Typography>
            </Paper>
          )}
          <Chip label={`Total 12 meses: ${fmtMoeda(dados.total_geral)}`} color="success" sx={{ mb: 2 }} />

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>Mês</TableCell><TableCell align="center">Vendas</TableCell><TableCell align="right">Total</TableCell>
                <TableCell sx={{ width: '40%' }}>Gráfico</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {dados.meses.map((m) => {
                  const maxVal = Math.max(...dados.meses.map(x => x.total), 1);
                  const perc = (m.total / maxVal) * 100;
                  return (
                    <TableRow key={m.mes} hover>
                      <TableCell><strong>{m.mes_nome}</strong></TableCell>
                      <TableCell align="center">{m.qtd}</TableCell>
                      <TableCell align="right">{fmtMoeda(m.total)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flex: 1, bgcolor: '#e3f2fd', borderRadius: 1, overflow: 'hidden' }}>
                            <Box sx={{ height: 20, width: `${perc}%`, bgcolor: '#1976d2', borderRadius: 1 }} />
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {dados.top_clientes && dados.top_clientes.length > 0 && (
            <>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Top 20 Clientes</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>#</TableCell><TableCell>Cliente</TableCell>
                    <TableCell align="center">Vendas</TableCell><TableCell align="right">Total</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {dados.top_clientes.map((c, i) => (
                      <TableRow key={c.id_cliente} hover>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell><strong>{c.nome}</strong></TableCell>
                        <TableCell align="center">{c.qtd}</TableCell>
                        <TableCell align="right">{fmtMoeda(c.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      )}
    </Box>
  );
}

function RelatorioDesempenho({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', cidade: '', estado: '', ordenar_por: 'total_vendas', limite: '', busca: '' });

  const limparFiltros = () => setFiltros({ data_inicio: '', data_fim: '', cidade: '', estado: '', ordenar_por: 'total_vendas', limite: '', busca: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/clientes/desempenho/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const exportarPDF = () => {
    if (!dados) return;
    gerarPDF(
      'Relatório - Desempenho de Clientes',
      ['#', 'Cliente', 'Cidade', 'Vendas', 'Total Vendas', 'Ticket Médio', 'Devoluções', '% Dev.', 'Líquido'],
      dados.clientes.map((c, i) => [i + 1, c.nome_cliente, c.cidade, c.qtd_vendas, fmtMoeda(c.total_vendas), fmtMoeda(c.ticket_medio), c.total_devolucoes > 0 ? fmtMoeda(c.total_devolucoes) : '—', c.perc_devolucao > 0 ? `${c.perc_devolucao}%` : '—', fmtMoeda(c.total_liquido)]),
      `Vendas: ${fmtMoeda(dados.total_vendas)} | Devoluções: ${fmtMoeda(dados.total_devolucoes)} | Líquido: ${fmtMoeda(dados.total_liquido)}`
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }} className="no-print">
        <Button size="small" startIcon={mostrarFiltros ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setMostrarFiltros(!mostrarFiltros)}>Filtros</Button>
        <AtalhosPeriodo onSelect={(p) => setFiltros(f => ({ ...f, ...p }))} />
      </Box>
      <Collapse in={mostrarFiltros}>
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }} className="no-print" variant="outlined">
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Data Início" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filtros.data_inicio} onChange={e => setFiltros(p => ({ ...p, data_inicio: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Data Fim" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filtros.data_fim} onChange={e => setFiltros(p => ({ ...p, data_fim: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Buscar Nome/CPF" size="small" fullWidth value={filtros.busca} onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Cidade" size="small" fullWidth value={filtros.cidade} onChange={e => setFiltros(p => ({ ...p, cidade: e.target.value }))} />
            </Grid>
            <Grid item xs={4} sm={2} md={1}>
              <TextField label="UF" select size="small" fullWidth value={filtros.estado} onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}>
                <MenuItem value="">Todos</MenuItem>
                {ESTADOS_BR.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField label="Ordenar por" select size="small" fullWidth value={filtros.ordenar_por} onChange={e => setFiltros(p => ({ ...p, ordenar_por: e.target.value }))}>
                <MenuItem value="total_vendas">Maior Venda</MenuItem>
                <MenuItem value="nome">Nome A-Z</MenuItem>
                <MenuItem value="liquido">Líquido</MenuItem>
                <MenuItem value="devolucoes">Devoluções</MenuItem>
                <MenuItem value="ticket">Ticket Médio</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={3} sm={2} md={1}>
              <TextField label="Limite" type="number" size="small" fullWidth value={filtros.limite} onChange={e => setFiltros(p => ({ ...p, limite: e.target.value }))} placeholder="Todos" />
            </Grid>
            <Grid item xs={3} sm={1} md={0.5}>
              <Tooltip title="Limpar filtros"><IconButton onClick={limparFiltros} size="small"><ClearIcon /></IconButton></Tooltip>
            </Grid>
          </Grid>
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={buscar} disabled={loading} startIcon={<SearchIcon />}>Buscar</Button>
            {dados && <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PdfIcon />}>Salvar PDF</Button>}
          </Box>
        </Paper>
      </Collapse>
      {loading && <LinearProgress />}
      {dados && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`Vendas: ${fmtMoeda(dados.total_vendas)}`} color="success" />
            <Chip label={`Devoluções: ${fmtMoeda(dados.total_devolucoes)}`} color="error" />
            <Chip label={`Líquido: ${fmtMoeda(dados.total_liquido)}`} color="primary" />
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>#</TableCell><TableCell>Cliente</TableCell><TableCell>Cidade</TableCell>
                <TableCell align="center">Vendas</TableCell><TableCell align="right">Total Vendas</TableCell>
                <TableCell align="right">Ticket Médio</TableCell><TableCell align="right">Devoluções</TableCell>
                <TableCell align="right">% Dev.</TableCell><TableCell align="right">Líquido</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {dados.clientes.map((c, i) => (
                  <TableRow key={c.id_cliente} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><strong>{c.nome_cliente}</strong></TableCell>
                    <TableCell>{c.cidade}</TableCell>
                    <TableCell align="center">{c.qtd_vendas}</TableCell>
                    <TableCell align="right">{fmtMoeda(c.total_vendas)}</TableCell>
                    <TableCell align="right">{fmtMoeda(c.ticket_medio)}</TableCell>
                    <TableCell align="right" sx={{ color: c.total_devolucoes > 0 ? 'error.main' : 'inherit' }}>
                      {c.total_devolucoes > 0 ? fmtMoeda(c.total_devolucoes) : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: c.perc_devolucao > 5 ? 'error.main' : 'inherit' }}>
                      {c.perc_devolucao > 0 ? `${c.perc_devolucao}%` : '—'}
                    </TableCell>
                    <TableCell align="right"><strong>{fmtMoeda(c.total_liquido)}</strong></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

function RelatorioTipoCliente({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ meses: 12, classificacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get('/relatorios/clientes/tipo-cliente/', { params: { meses: filtros.meses } });
      let data = r.data;
      if (filtros.classificacao && data.clientes) {
        data = { ...data, clientes: data.clientes.filter(c => c.classificacao === filtros.classificacao) };
      }
      setDados(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const corClassificacao = (c) => c === 'A' ? 'success' : c === 'B' ? 'warning' : 'default';

  const exportarPDF = () => {
    if (!dados) return;
    gerarPDF(
      'Relatório - Classificação ABC de Clientes',
      ['#', 'Tipo', 'Cliente', 'Cidade', 'Compras', 'Total', '% Part.', '% Acum.'],
      dados.clientes.map((c, i) => [i + 1, c.classificacao, c.nome_cliente, c.cidade, c.qtd, fmtMoeda(c.total), `${c.percentual}%`, `${c.perc_acumulado}%`]),
      `Total: ${fmtMoeda(dados.resumo?.total_geral)} | A: ${dados.resumo?.tipo_a?.qtd} | B: ${dados.resumo?.tipo_b?.qtd} | C: ${dados.resumo?.tipo_c?.qtd}`
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }} className="no-print" variant="outlined">
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={4} sm={3} md={2}>
            <TextField label="Período (meses)" type="number" size="small" fullWidth value={filtros.meses} onChange={e => setFiltros(p => ({ ...p, meses: e.target.value }))} />
          </Grid>
          <Grid item xs={4} sm={3} md={2}>
            <TextField label="Classificação" select size="small" fullWidth value={filtros.classificacao} onChange={e => setFiltros(p => ({ ...p, classificacao: e.target.value }))}>
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="A">Tipo A</MenuItem>
              <MenuItem value="B">Tipo B</MenuItem>
              <MenuItem value="C">Tipo C</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={buscar} disabled={loading} startIcon={<SearchIcon />}>Classificar</Button>
          {dados && <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PdfIcon />}>Salvar PDF</Button>}
        </Box>
      </Paper>
      {loading && <LinearProgress />}
      {dados && dados.resumo && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #4caf50' }}>
                <Typography variant="h5" color="success.main" fontWeight="bold">{dados.resumo.tipo_a.qtd}</Typography>
                <Typography variant="body2">Tipo A — {dados.resumo.tipo_a.perc}%</Typography>
                <Typography variant="caption" color="text.secondary">{fmtMoeda(dados.resumo.tipo_a.total)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #ff9800' }}>
                <Typography variant="h5" color="warning.main" fontWeight="bold">{dados.resumo.tipo_b.qtd}</Typography>
                <Typography variant="body2">Tipo B — {dados.resumo.tipo_b.perc}%</Typography>
                <Typography variant="caption" color="text.secondary">{fmtMoeda(dados.resumo.tipo_b.total)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #9e9e9e' }}>
                <Typography variant="h5" fontWeight="bold" color="text.secondary">{dados.resumo.tipo_c.qtd}</Typography>
                <Typography variant="body2">Tipo C — {dados.resumo.tipo_c.perc}%</Typography>
                <Typography variant="caption" color="text.secondary">{fmtMoeda(dados.resumo.tipo_c.total)}</Typography>
              </Paper>
            </Grid>
          </Grid>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>#</TableCell><TableCell>Tipo</TableCell><TableCell>Cliente</TableCell>
                <TableCell>Cidade</TableCell><TableCell align="center">Compras</TableCell>
                <TableCell align="right">Total</TableCell><TableCell align="right">% Part.</TableCell>
                <TableCell align="right">% Acum.</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {dados.clientes.map((c, i) => (
                  <TableRow key={c.id_cliente} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><Chip label={c.classificacao} color={corClassificacao(c.classificacao)} size="small" /></TableCell>
                    <TableCell><strong>{c.nome_cliente}</strong></TableCell>
                    <TableCell>{c.cidade}</TableCell>
                    <TableCell align="center">{c.qtd}</TableCell>
                    <TableCell align="right">{fmtMoeda(c.total)}</TableCell>
                    <TableCell align="right">{c.percentual}%</TableCell>
                    <TableCell align="right">{c.perc_acumulado}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

function RelatorioCaracteristicas({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  const buscar = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get('/relatorios/clientes/caracteristicas/');
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  React.useEffect(() => { buscar(); }, []);

  const exportarPDF = () => {
    if (!dados) return;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setFont(undefined, 'bold');
    doc.text('APERUS', 14, 18);
    doc.setFontSize(11); doc.setFont(undefined, 'normal');
    doc.text('Características dos Clientes', 14, 26);
    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, doc.internal.pageSize.getWidth() - 14, 18, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`Total de clientes ativos: ${dados.total_clientes}`, 14, 36);

    let y = 44;
    const sexoLabel = { M: 'Masculino', F: 'Feminino' };
    autoTable(doc, { head: [['Sexo', 'Qtd']], body: dados.por_sexo.map(s => [sexoLabel[s.sexo] || s.sexo, s.qtd]), startY: y, styles: { fontSize: 8 }, headStyles: { fillColor: [25, 118, 210] } });
    y = doc.lastAutoTable.finalY + 8;
    autoTable(doc, { head: [['UF', 'Qtd']], body: dados.por_estado.map(e => [e.estado, e.qtd]), startY: y, styles: { fontSize: 8 }, headStyles: { fillColor: [25, 118, 210] } });
    y = doc.lastAutoTable.finalY + 8;
    autoTable(doc, { head: [['Cidade', 'UF', 'Qtd']], body: dados.por_cidade.map(c => [c.cidade, c.estado, c.qtd]), startY: y, styles: { fontSize: 8 }, headStyles: { fillColor: [25, 118, 210] } });

    // Usar função que funciona tanto no navegador quanto no Capacitor
    const filename = `caracteristicas_clientes_${new Date().toISOString().slice(0,10)}`;
    visualizarPDF(doc, filename);
  };

  if (loading) return <LinearProgress />;
  if (!dados) return null;

  const sexoLabel = { M: 'Masculino', F: 'Feminino' };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }} className="no-print">
        <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PdfIcon />}>Salvar PDF</Button>
      </Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Total de <strong>{dados.total_clientes}</strong> clientes ativos cadastrados.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>Por Sexo</Typography>
            {dados.por_sexo.map(s => (
              <Box key={s.sexo} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">{sexoLabel[s.sexo] || s.sexo}</Typography>
                <Chip label={s.qtd} size="small" />
              </Box>
            ))}
            {dados.por_sexo.length === 0 && <Typography variant="body2" color="text.secondary">Nenhum dado</Typography>}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>Por Faixa Etária</Typography>
            {dados.por_faixa_etaria.map(f => (
              <Box key={f.faixa} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">{f.faixa}</Typography>
                <Chip label={f.qtd} size="small" />
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>Dados de Contato</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Com E-mail</Typography>
              <Chip label={dados.contato.com_email} size="small" color="success" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Sem E-mail</Typography>
              <Chip label={dados.contato.sem_email} size="small" color="error" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Com WhatsApp</Typography>
              <Chip label={dados.contato.com_whatsapp} size="small" color="success" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Sem WhatsApp</Typography>
              <Chip label={dados.contato.sem_whatsapp} size="small" color="error" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Com Data Nasc.</Typography>
              <Chip label={dados.contato.com_data_nascimento} size="small" color="info" />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>Por Estado</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>UF</TableCell><TableCell align="right">Qtd</TableCell></TableRow></TableHead>
                <TableBody>
                  {dados.por_estado.map(e => (
                    <TableRow key={e.estado} hover>
                      <TableCell>{e.estado}</TableCell>
                      <TableCell align="right">{e.qtd}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>Top 20 Cidades</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Cidade</TableCell><TableCell>UF</TableCell><TableCell align="right">Qtd</TableCell></TableRow></TableHead>
                <TableBody>
                  {dados.por_cidade.map((c, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{c.cidade}</TableCell>
                      <TableCell>{c.estado}</TableCell>
                      <TableCell align="right">{c.qtd}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function RelatorioDebitoConta({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [filtros, setFiltros] = useState({ cidade: '', estado: '', situacao: '', dias_atraso_min: '', ordenar_por: 'total_debito', busca: '' });

  const limparFiltros = () => setFiltros({ cidade: '', estado: '', situacao: '', dias_atraso_min: '', ordenar_por: 'total_debito', busca: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/clientes/debito-conta/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const enviarWhatsApp = (cli) => {
    const tel = cli.whatsapp || cli.telefone || '';
    if (!tel) { alert('Cliente sem WhatsApp/Telefone!'); return; }
    const msg = `Olá, *${cli.nome_cliente}*!\n\nIdentificamos pendência financeira em seu cadastro:\n💰 *Total: ${fmtMoeda(cli.total_debito)}*\n📋 ${cli.qtd_parcelas} parcela(s) pendente(s)\n\nFavor entrar em contato para regularizar.\n\n*APERUS*`;
    let t = tel.replace(/\D/g, '');
    if (t.length === 10 || t.length === 11) t = '55' + t;
    window.open(`https://wa.me/${t}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const exportarPDF = () => {
    if (!dados) return;
    gerarPDF(
      'Relatório - Débitos em Conta',
      ['#', 'Cliente', 'CPF/CNPJ', 'Cidade', 'Parcelas', 'Total Débito', 'Dias Atraso', 'Situação'],
      dados.clientes.map((c, i) => [i + 1, c.nome_cliente, c.cpf_cnpj, c.cidade, c.qtd_parcelas, fmtMoeda(c.total_debito), c.dias_atraso > 0 ? c.dias_atraso : '—', c.situacao]),
      `${dados.resumo.qtd_clientes} clientes | Total: ${fmtMoeda(dados.resumo.total_geral)} | Vencido: ${fmtMoeda(dados.resumo.total_vencido)} | A Vencer: ${fmtMoeda(dados.resumo.total_a_vencer)}`
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }} className="no-print">
        <Button size="small" startIcon={mostrarFiltros ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setMostrarFiltros(!mostrarFiltros)}>Filtros</Button>
      </Box>
      <Collapse in={mostrarFiltros}>
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }} className="no-print" variant="outlined">
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Buscar Nome/CPF" size="small" fullWidth value={filtros.busca} onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Cidade" size="small" fullWidth value={filtros.cidade} onChange={e => setFiltros(p => ({ ...p, cidade: e.target.value }))} />
            </Grid>
            <Grid item xs={4} sm={2} md={1}>
              <TextField label="UF" select size="small" fullWidth value={filtros.estado} onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}>
                <MenuItem value="">Todos</MenuItem>
                {ESTADOS_BR.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4} sm={2} md={1.5}>
              <TextField label="Situação" select size="small" fullWidth value={filtros.situacao} onChange={e => setFiltros(p => ({ ...p, situacao: e.target.value }))}>
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="Vencido">Vencido</MenuItem>
                <MenuItem value="A Vencer">A Vencer</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={4} sm={2} md={1.5}>
              <TextField label="Dias Atraso Mín" type="number" size="small" fullWidth value={filtros.dias_atraso_min} onChange={e => setFiltros(p => ({ ...p, dias_atraso_min: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField label="Ordenar por" select size="small" fullWidth value={filtros.ordenar_por} onChange={e => setFiltros(p => ({ ...p, ordenar_por: e.target.value }))}>
                <MenuItem value="total_debito">Maior Débito</MenuItem>
                <MenuItem value="nome">Nome A-Z</MenuItem>
                <MenuItem value="dias_atraso">Dias Atraso</MenuItem>
                <MenuItem value="parcelas">Qtd Parcelas</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={3} sm={1} md={0.5}>
              <Tooltip title="Limpar filtros"><IconButton onClick={limparFiltros} size="small"><ClearIcon /></IconButton></Tooltip>
            </Grid>
          </Grid>
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={buscar} disabled={loading} startIcon={<SearchIcon />}>Carregar Débitos</Button>
            {dados && <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PdfIcon />}>Salvar PDF</Button>}
          </Box>
        </Paper>
      </Collapse>
      {loading && <LinearProgress />}
      {dados && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`${dados.resumo.qtd_clientes} clientes`} color="primary" />
            <Chip label={`Total: ${fmtMoeda(dados.resumo.total_geral)}`} color="error" />
            <Chip label={`Vencido: ${fmtMoeda(dados.resumo.total_vencido)}`} color="error" variant="outlined" />
            <Chip label={`A Vencer: ${fmtMoeda(dados.resumo.total_a_vencer)}`} color="warning" variant="outlined" />
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>#</TableCell><TableCell>Cliente</TableCell><TableCell>CPF/CNPJ</TableCell>
                <TableCell>Cidade</TableCell><TableCell align="center">Parcelas</TableCell>
                <TableCell align="right">Total Débito</TableCell><TableCell align="center">Dias Atraso</TableCell>
                <TableCell>Situação</TableCell><TableCell className="no-print"></TableCell>
              </TableRow></TableHead>
              <TableBody>
                {dados.clientes.map((c, i) => (
                  <TableRow key={c.id_cliente} hover sx={{ bgcolor: c.situacao === 'Vencido' ? '#fff3f0' : 'inherit' }}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><strong>{c.nome_cliente}</strong></TableCell>
                    <TableCell>{c.cpf_cnpj}</TableCell>
                    <TableCell>{c.cidade}</TableCell>
                    <TableCell align="center">{c.qtd_parcelas}</TableCell>
                    <TableCell align="right">{fmtMoeda(c.total_debito)}</TableCell>
                    <TableCell align="center">{c.dias_atraso > 0 ? c.dias_atraso : '—'}</TableCell>
                    <TableCell><Chip label={c.situacao} size="small" color={c.situacao === 'Vencido' ? 'error' : 'warning'} /></TableCell>
                    <TableCell className="no-print">
                      {(c.whatsapp || c.telefone) && (
                        <Tooltip title="Enviar cobrança WhatsApp">
                          <IconButton size="small" color="success" onClick={() => enviarWhatsApp(c)}>
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

function RelatorioCreditoCliente({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ status: '', busca: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtros.status) params.status = filtros.status;
      if (filtros.busca) params.busca = filtros.busca;
      const r = await axiosInstance.get('/relatorios/clientes/credito-cliente/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const exportarPDF = () => {
    if (!dados) return;
    gerarPDF(
      'Relatório - Créditos de Clientes',
      ['#', 'Cliente', 'CPF/CNPJ', 'Valor Original', 'Utilizado', 'Saldo', 'Data', 'Validade', 'Status'],
      dados.creditos.map((c, i) => [i + 1, c.nome_cliente, c.cpf_cnpj, fmtMoeda(c.valor_original), fmtMoeda(c.valor_utilizado), fmtMoeda(c.saldo), fmtData(c.data_geracao), fmtData(c.data_validade), c.status]),
      `${dados.qtd_clientes} clientes | Total Créditos: ${fmtMoeda(dados.total_creditos)}`
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }} className="no-print" variant="outlined">
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={6} sm={3} md={2}>
            <TextField label="Buscar Nome/CPF" size="small" fullWidth value={filtros.busca} onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField label="Status" select size="small" fullWidth value={filtros.status} onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="disponivel">Disponível</MenuItem>
              <MenuItem value="utilizado">Utilizado</MenuItem>
              <MenuItem value="expirado">Expirado</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={buscar} disabled={loading} startIcon={<SearchIcon />}>Carregar Créditos</Button>
          {dados && <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PdfIcon />}>Salvar PDF</Button>}
        </Box>
      </Paper>
      {loading && <LinearProgress />}
      {dados && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`${dados.qtd_clientes} clientes`} color="primary" />
            <Chip label={`Total Créditos: ${fmtMoeda(dados.total_creditos)}`} color="success" />
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>#</TableCell><TableCell>Cliente</TableCell><TableCell>CPF/CNPJ</TableCell>
                <TableCell align="right">Valor Original</TableCell><TableCell align="right">Utilizado</TableCell>
                <TableCell align="right">Saldo</TableCell><TableCell>Data</TableCell>
                <TableCell>Validade</TableCell><TableCell>Status</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {dados.creditos.map((c, i) => (
                  <TableRow key={c.id_credito} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><strong>{c.nome_cliente}</strong></TableCell>
                    <TableCell>{c.cpf_cnpj}</TableCell>
                    <TableCell align="right">{fmtMoeda(c.valor_original)}</TableCell>
                    <TableCell align="right">{fmtMoeda(c.valor_utilizado)}</TableCell>
                    <TableCell align="right"><strong>{fmtMoeda(c.saldo)}</strong></TableCell>
                    <TableCell>{fmtData(c.data_geracao)}</TableCell>
                    <TableCell>{fmtData(c.data_validade)}</TableCell>
                    <TableCell><Chip label={c.status} size="small" color={c.status === 'disponivel' ? 'success' : 'default'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

function RelatorioContratos({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ status: '', busca: '', periodicidade: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtros.status) params.status = filtros.status;
      if (filtros.busca) params.busca = filtros.busca;
      if (filtros.periodicidade) params.periodicidade = filtros.periodicidade;
      const r = await axiosInstance.get('/relatorios/clientes/contratos/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const corStatus = (s) => {
    if (s === 'ATIVO') return 'success';
    if (s === 'SUSPENSO') return 'warning';
    if (s === 'CANCELADO') return 'error';
    return 'default';
  };

  const exportarPDF = () => {
    if (!dados) return;
    gerarPDF(
      'Relatório - Contratos de Recorrência',
      ['Nº', 'Cliente', 'Descrição', 'Valor Mensal', 'Periodicidade', 'Início', 'Fim', 'Próx. Fat.', 'Status'],
      dados.contratos.map(c => [c.numero, c.nome_cliente, c.descricao, fmtMoeda(c.valor_mensal), c.periodicidade, fmtData(c.data_inicio), fmtData(c.data_fim), fmtData(c.proximo_faturamento), c.status]),
      `${dados.resumo.total} contratos | ${dados.resumo.ativos} ativos | Mensal: ${fmtMoeda(dados.resumo.valor_mensal_total)}`
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }} className="no-print" variant="outlined">
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={6} sm={3} md={2}>
            <TextField label="Buscar Cliente/Desc." size="small" fullWidth value={filtros.busca} onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField label="Status" select size="small" fullWidth value={filtros.status} onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ATIVO">Ativo</MenuItem>
              <MenuItem value="SUSPENSO">Suspenso</MenuItem>
              <MenuItem value="CANCELADO">Cancelado</MenuItem>
              <MenuItem value="ENCERRADO">Encerrado</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField label="Periodicidade" select size="small" fullWidth value={filtros.periodicidade} onChange={e => setFiltros(p => ({ ...p, periodicidade: e.target.value }))}>
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="MENSAL">Mensal</MenuItem>
              <MenuItem value="BIMESTRAL">Bimestral</MenuItem>
              <MenuItem value="TRIMESTRAL">Trimestral</MenuItem>
              <MenuItem value="SEMESTRAL">Semestral</MenuItem>
              <MenuItem value="ANUAL">Anual</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={buscar} disabled={loading} startIcon={<SearchIcon />}>Buscar</Button>
          {dados && <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PdfIcon />}>Salvar PDF</Button>}
        </Box>
      </Paper>
      {loading && <LinearProgress />}
      {dados && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`${dados.resumo.total} contratos`} color="primary" />
            <Chip label={`${dados.resumo.ativos} ativos`} color="success" />
            <Chip label={`Mensal: ${fmtMoeda(dados.resumo.valor_mensal_total)}`} color="info" />
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>Nº</TableCell><TableCell>Cliente</TableCell><TableCell>Descrição</TableCell>
                <TableCell align="right">Valor Mensal</TableCell><TableCell>Periodicidade</TableCell>
                <TableCell>Início</TableCell><TableCell>Fim</TableCell>
                <TableCell>Próx. Fat.</TableCell><TableCell>Status</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {dados.contratos.map((c) => (
                  <TableRow key={c.id_contrato} hover>
                    <TableCell>{c.numero}</TableCell>
                    <TableCell><strong>{c.nome_cliente}</strong></TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.descricao}</TableCell>
                    <TableCell align="right">{fmtMoeda(c.valor_mensal)}</TableCell>
                    <TableCell>{c.periodicidade}</TableCell>
                    <TableCell>{fmtData(c.data_inicio)}</TableCell>
                    <TableCell>{fmtData(c.data_fim)}</TableCell>
                    <TableCell>{fmtData(c.proximo_faturamento)}</TableCell>
                    <TableCell><Chip label={c.status} size="small" color={corStatus(c.status)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

function RelatorioIndicacoes({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ meses: 12, potencial: '', cidade: '', estado: '', limite: 50, busca: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/clientes/indicacoes/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const corPotencial = (p) => p === 'Alto' ? 'success' : p === 'Médio' ? 'warning' : 'default';

  const exportarPDF = () => {
    if (!dados) return;
    gerarPDF(
      'Relatório - Ranking de Indicações',
      ['#', 'Potencial', 'Cliente', 'Cidade', 'Compras', 'Total', 'Última Compra', 'Score'],
      dados.clientes.map((c, i) => [i + 1, c.potencial, c.nome_cliente, c.cidade, c.qtd_compras, fmtMoeda(c.total_compras), fmtData(c.ultima_compra), c.score]),
      `Alto: ${dados.resumo.alto} | Médio: ${dados.resumo.medio} | Baixo: ${dados.resumo.baixo}`
    );
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Ranking de clientes com maior potencial para indicação, baseado em frequência, recência e valor de compras.
      </Alert>
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }} className="no-print" variant="outlined">
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={6} sm={3} md={2}>
            <TextField label="Buscar Nome/CPF" size="small" fullWidth value={filtros.busca} onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
          </Grid>
          <Grid item xs={4} sm={2} md={1.5}>
            <TextField label="Período (meses)" type="number" size="small" fullWidth value={filtros.meses} onChange={e => setFiltros(p => ({ ...p, meses: e.target.value }))} />
          </Grid>
          <Grid item xs={4} sm={2} md={1.5}>
            <TextField label="Potencial" select size="small" fullWidth value={filtros.potencial} onChange={e => setFiltros(p => ({ ...p, potencial: e.target.value }))}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Alto">Alto</MenuItem>
              <MenuItem value="Médio">Médio</MenuItem>
              <MenuItem value="Baixo">Baixo</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField label="Cidade" size="small" fullWidth value={filtros.cidade} onChange={e => setFiltros(p => ({ ...p, cidade: e.target.value }))} />
          </Grid>
          <Grid item xs={4} sm={2} md={1}>
            <TextField label="UF" select size="small" fullWidth value={filtros.estado} onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}>
              <MenuItem value="">Todos</MenuItem>
              {ESTADOS_BR.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={4} sm={2} md={1}>
            <TextField label="Limite" type="number" size="small" fullWidth value={filtros.limite} onChange={e => setFiltros(p => ({ ...p, limite: e.target.value }))} />
          </Grid>
        </Grid>
        <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={buscar} disabled={loading} startIcon={<SearchIcon />}>Gerar Ranking</Button>
          {dados && <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PdfIcon />}>Salvar PDF</Button>}
        </Box>
      </Paper>
      {loading && <LinearProgress />}
      {dados && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`Alto: ${dados.resumo.alto}`} color="success" />
            <Chip label={`Médio: ${dados.resumo.medio}`} color="warning" />
            <Chip label={`Baixo: ${dados.resumo.baixo}`} color="default" />
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>#</TableCell><TableCell>Potencial</TableCell><TableCell>Cliente</TableCell>
                <TableCell>Cidade</TableCell><TableCell align="center">Compras</TableCell>
                <TableCell align="right">Total</TableCell><TableCell>Última Compra</TableCell>
                <TableCell align="right">Score</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {dados.clientes.map((c, i) => (
                  <TableRow key={c.id_cliente} hover>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><Chip label={c.potencial} size="small" color={corPotencial(c.potencial)} /></TableCell>
                    <TableCell><strong>{c.nome_cliente}</strong></TableCell>
                    <TableCell>{c.cidade}</TableCell>
                    <TableCell align="center">{c.qtd_compras}</TableCell>
                    <TableCell align="right">{fmtMoeda(c.total_compras)}</TableCell>
                    <TableCell>{fmtData(c.ultima_compra)}</TableCell>
                    <TableCell align="right"><strong>{c.score}</strong></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

function RelatorioDadosCompletos({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [detalhe, setDetalhe] = useState(null);
  const [filtros, setFiltros] = useState({ busca: '', cidade: '', estado: '', ativo: '', sexo: '', ordenar_por: 'nome', limite: '' });

  const limparFiltros = () => setFiltros({ busca: '', cidade: '', estado: '', ativo: '', sexo: '', ordenar_por: 'nome', limite: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/clientes/dados-completos/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const sexoLabel = { M: 'Masculino', F: 'Feminino' };

  const exportarPDF = () => {
    if (!dados) return;
    gerarPDF(
      'Relatório - Dados Completos de Clientes',
      ['#', 'Nome / Razão Social', 'CPF/CNPJ', 'Cidade', 'UF', 'Telefone', 'WhatsApp', 'E-mail', 'Ativo'],
      dados.clientes.map((c, i) => [i + 1, c.nome_razao_social, c.cpf_cnpj, c.cidade, c.estado, c.telefone, c.whatsapp, c.email, c.ativo ? 'Sim' : 'Não']),
      `${dados.total} clientes encontrados`
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }} className="no-print">
        <Button size="small" startIcon={mostrarFiltros ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setMostrarFiltros(!mostrarFiltros)}>Filtros</Button>
      </Box>
      <Collapse in={mostrarFiltros}>
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }} className="no-print" variant="outlined">
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={6} sm={3} md={2.5}>
              <TextField label="Buscar Nome/CPF/Email/Tel" size="small" fullWidth value={filtros.busca} onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField label="Cidade" size="small" fullWidth value={filtros.cidade} onChange={e => setFiltros(p => ({ ...p, cidade: e.target.value }))} />
            </Grid>
            <Grid item xs={4} sm={2} md={1}>
              <TextField label="UF" select size="small" fullWidth value={filtros.estado} onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}>
                <MenuItem value="">Todos</MenuItem>
                {ESTADOS_BR.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4} sm={2} md={1.5}>
              <TextField label="Situação" select size="small" fullWidth value={filtros.ativo} onChange={e => setFiltros(p => ({ ...p, ativo: e.target.value }))}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="1">Ativo</MenuItem>
                <MenuItem value="0">Inativo</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={4} sm={2} md={1.5}>
              <TextField label="Sexo" select size="small" fullWidth value={filtros.sexo} onChange={e => setFiltros(p => ({ ...p, sexo: e.target.value }))}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="M">Masculino</MenuItem>
                <MenuItem value="F">Feminino</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={2} md={1.5}>
              <TextField label="Ordenar por" select size="small" fullWidth value={filtros.ordenar_por} onChange={e => setFiltros(p => ({ ...p, ordenar_por: e.target.value }))}>
                <MenuItem value="nome">Nome A-Z</MenuItem>
                <MenuItem value="cidade">Cidade</MenuItem>
                <MenuItem value="data_cadastro">Mais Recente</MenuItem>
                <MenuItem value="cpf_cnpj">CPF/CNPJ</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={3} sm={2} md={1}>
              <TextField label="Limite" type="number" size="small" fullWidth value={filtros.limite} onChange={e => setFiltros(p => ({ ...p, limite: e.target.value }))} placeholder="Todos" />
            </Grid>
            <Grid item xs={3} sm={1} md={0.5}>
              <Tooltip title="Limpar filtros"><IconButton onClick={limparFiltros} size="small"><ClearIcon /></IconButton></Tooltip>
            </Grid>
          </Grid>
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={buscar} disabled={loading} startIcon={<SearchIcon />}>Buscar</Button>
            {dados && <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PdfIcon />}>Salvar PDF</Button>}
          </Box>
        </Paper>
      </Collapse>
      {loading && <LinearProgress />}
      {dados && (
        <>
          <Chip label={`${dados.total} clientes encontrados`} color="primary" sx={{ mb: 2 }} />
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>#</TableCell><TableCell>Nome / Razão Social</TableCell><TableCell>CPF/CNPJ</TableCell>
                <TableCell>Cidade/UF</TableCell><TableCell>Telefone</TableCell><TableCell>WhatsApp</TableCell>
                <TableCell>E-mail</TableCell><TableCell>Situação</TableCell><TableCell></TableCell>
              </TableRow></TableHead>
              <TableBody>
                {dados.clientes.map((c, i) => (
                  <TableRow key={c.id_cliente} hover sx={{ bgcolor: !c.ativo ? '#fafafa' : 'inherit', opacity: c.ativo ? 1 : 0.7 }}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <strong>{c.nome_razao_social}</strong>
                      {c.nome_fantasia && <Typography variant="caption" display="block" color="text.secondary">{c.nome_fantasia}</Typography>}
                    </TableCell>
                    <TableCell>{c.cpf_cnpj}</TableCell>
                    <TableCell>{c.cidade}{c.estado ? `/${c.estado}` : ''}</TableCell>
                    <TableCell>{c.telefone}</TableCell>
                    <TableCell>{c.whatsapp}</TableCell>
                    <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</TableCell>
                    <TableCell><Chip label={c.ativo ? 'Ativo' : 'Inativo'} size="small" color={c.ativo ? 'success' : 'default'} /></TableCell>
                    <TableCell>
                      <Tooltip title="Ver detalhes">
                        <IconButton size="small" onClick={() => setDetalhe(c)}>
                          <PersonIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={!!detalhe} onClose={() => setDetalhe(null)} maxWidth="sm" fullWidth>
        {detalhe && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">{detalhe.nome_razao_social}</Typography>
                {detalhe.nome_fantasia && <Typography variant="body2" color="text.secondary">{detalhe.nome_fantasia}</Typography>}
              </Box>
              <IconButton onClick={() => setDetalhe(null)}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">CPF/CNPJ</Typography>
                  <Typography variant="body2"><strong>{detalhe.cpf_cnpj}</strong></Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Inscrição Estadual</Typography>
                  <Typography variant="body2">{detalhe.inscricao_estadual || '—'}</Typography>
                </Grid>
                <Grid item xs={12}><Divider /></Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Endereço</Typography>
                  <Typography variant="body2">
                    {detalhe.endereco}{detalhe.numero ? `, ${detalhe.numero}` : ''}{detalhe.bairro ? ` — ${detalhe.bairro}` : ''}
                  </Typography>
                  <Typography variant="body2">
                    {detalhe.cidade}{detalhe.estado ? `/${detalhe.estado}` : ''}{detalhe.cep ? ` — CEP: ${detalhe.cep}` : ''}
                  </Typography>
                  {detalhe.codigo_municipio_ibge && <Typography variant="caption" color="text.secondary">IBGE: {detalhe.codigo_municipio_ibge}</Typography>}
                </Grid>
                <Grid item xs={12}><Divider /></Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Telefone</Typography>
                  <Typography variant="body2">{detalhe.telefone || '—'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">WhatsApp</Typography>
                  <Typography variant="body2">{detalhe.whatsapp || '—'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">E-mail</Typography>
                  <Typography variant="body2">{detalhe.email || '—'}</Typography>
                </Grid>
                <Grid item xs={12}><Divider /></Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Sexo</Typography>
                  <Typography variant="body2">{sexoLabel[detalhe.sexo] || '—'}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Data Nascimento</Typography>
                  <Typography variant="body2">{fmtData(detalhe.data_nascimento)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Data Cadastro</Typography>
                  <Typography variant="body2">{fmtData(detalhe.data_cadastro)}</Typography>
                </Grid>
                <Grid item xs={12}><Divider /></Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Limite de Crédito</Typography>
                  <Typography variant="body2"><strong>{fmtMoeda(detalhe.limite_credito)}</strong></Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Situação</Typography>
                  <Box><Chip label={detalhe.ativo ? 'Ativo' : 'Inativo'} size="small" color={detalhe.ativo ? 'success' : 'error'} /></Box>
                </Grid>
                {!detalhe.ativo && detalhe.data_inativacao && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Data Inativação</Typography>
                      <Typography variant="body2">{fmtData(detalhe.data_inativacao)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Motivo</Typography>
                      <Typography variant="body2">{detalhe.motivo_inativacao || '—'}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}

// ==================== PÁGINA PRINCIPAL ====================

const relatorios = [
  { id: 'dados-completos', titulo: 'Dados Completos', descricao: 'Todos os dados cadastrais dos clientes em detalhes', icone: <PeopleIcon />, cor: '#1565c0' },
  { id: 'total-pagamentos', titulo: 'Total Pagamentos', descricao: 'Ranking de clientes por total de pagamentos recebidos', icone: <PaymentIcon />, cor: '#4caf50' },
  { id: 'extrato', titulo: 'Extrato Cliente', descricao: 'Extrato financeiro completo de um cliente específico', icone: <ReceiptIcon />, cor: '#1976d2' },
  { id: 'total-gastos', titulo: 'Total Gastos', descricao: 'Ranking de clientes por volume de compras realizadas', icone: <ShoppingCartIcon />, cor: '#ff9800' },
  { id: 'vendas-12-meses', titulo: 'Total Vendas 12 Meses', descricao: 'Evolução mensal de vendas dos últimos 12 meses', icone: <TrendingUpIcon />, cor: '#9c27b0' },
  { id: 'desempenho', titulo: 'Desempenho', descricao: 'Vendas, devoluções e margem líquida por cliente', icone: <TrendingUpIcon />, cor: '#d32f2f' },
  { id: 'tipo-cliente', titulo: 'Tipo Cliente (ABC)', descricao: 'Classificação ABC por volume de faturamento', icone: <CategoryIcon />, cor: '#0288d1' },
  { id: 'caracteristicas', titulo: 'Características', descricao: 'Dados demográficos: sexo, faixa etária, cidade, contato', icone: <PersonIcon />, cor: '#00897b' },
  { id: 'contratos', titulo: 'Contratos', descricao: 'Contratos de recorrência e assinaturas dos clientes', icone: <DescriptionIcon />, cor: '#5d4037' },
  { id: 'indicacoes', titulo: 'Indicações de Clientes', descricao: 'Ranking de potencial de indicação por frequência e valor', icone: <GroupIcon />, cor: '#e91e63' },
  { id: 'debito', titulo: 'Débito em Conta', descricao: 'Clientes com débitos pendentes e vencidos', icone: <AccountBalanceIcon />, cor: '#f44336' },
  { id: 'credito', titulo: 'Crédito Cliente', descricao: 'Clientes com créditos disponíveis para uso', icone: <StarIcon />, cor: '#7b1fa2' },
  { id: 'etiqueta', titulo: 'Etiquetas', descricao: 'Impressão de etiquetas de clientes', icone: <LabelIcon />, cor: '#455a64', link: '/etiquetas' },
];

export default function RelatoriosClientePage() {
  const { axiosInstance } = useAuth();
  const navigate = useNavigate();
  const [relatorioAtivo, setRelatorioAtivo] = useState(null);

  const abrirRelatorio = (rel) => {
    if (rel.link) {
      navigate(rel.link);
      return;
    }
    setRelatorioAtivo(rel);
  };

  const renderRelatorio = () => {
    if (!relatorioAtivo) return null;
    const props = { axiosInstance };
    switch (relatorioAtivo.id) {
      case 'dados-completos': return <RelatorioDadosCompletos {...props} />;
      case 'total-pagamentos': return <RelatorioTotalPagamentos {...props} />;
      case 'extrato': return <RelatorioExtratoCliente {...props} />;
      case 'total-gastos': return <RelatorioTotalGastos {...props} />;
      case 'vendas-12-meses': return <RelatorioVendas12Meses {...props} />;
      case 'desempenho': return <RelatorioDesempenho {...props} />;
      case 'tipo-cliente': return <RelatorioTipoCliente {...props} />;
      case 'caracteristicas': return <RelatorioCaracteristicas {...props} />;
      case 'contratos': return <RelatorioContratos {...props} />;
      case 'indicacoes': return <RelatorioIndicacoes {...props} />;
      case 'debito': return <RelatorioDebitoConta {...props} />;
      case 'credito': return <RelatorioCreditoCliente {...props} />;
      default: return null;
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        {relatorioAtivo && (
          <IconButton onClick={() => setRelatorioAtivo(null)} className="no-print">
            <ArrowBackIcon />
          </IconButton>
        )}
        <PeopleIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            {relatorioAtivo ? relatorioAtivo.titulo : 'Relatórios de Cliente'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {relatorioAtivo ? relatorioAtivo.descricao : 'Selecione o relatório desejado'}
          </Typography>
        </Box>
        {relatorioAtivo && (
          <Tooltip title="Imprimir">
            <IconButton onClick={() => window.print()} color="primary" className="no-print">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Cards de Relatórios */}
      {!relatorioAtivo && (
        <Grid container spacing={2}>
          {relatorios.map((rel) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={rel.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderTop: `4px solid ${rel.cor}`,
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onClick={() => abrirRelatorio(rel)}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ color: rel.cor }}>{rel.icone}</Box>
                    <Typography variant="subtitle1" fontWeight="bold">{rel.titulo}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">{rel.descricao}</Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" sx={{ color: rel.cor }}>Abrir</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Relatório Ativo */}
      {relatorioAtivo && (
        <Paper sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          {renderRelatorio()}
        </Paper>
      )}
    </Box>
  );
}
