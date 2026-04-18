import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardActions,
  Button, Chip, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, MenuItem, LinearProgress,
  Collapse, Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, FormControlLabel, Alert, Autocomplete, CircularProgress,
  Link as MuiLink, Divider,
} from '@mui/material';
import {
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  History as HistoryIcon,
  TrendingUp as ProfitIcon,
  CalendarToday as CalendarIcon,
  ReceiptLong as ReceiptIcon,
  Assignment as AssignmentIcon,
  ShoppingCart as CartIcon,
  PendingActions as PendingIcon,
  MonetizationOn as MoneyIcon,
  People as PeopleIcon,
  LocationCity as CityIcon,
  PersonSearch as PersonSearchIcon,
  Category as CategoryIcon,
  PersonOff as PersonOffIcon,
  CreditCard as CardIcon,
  LocalShipping as ShippingIcon,
  ArrowBack as ArrowBackIcon,
  PictureAsPdf as PdfIcon,
  Storefront as StorefrontIcon,
  Discount as DiscountIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { visualizarPDF, compartilharPDF, visualizarPDFBlob, compartilharPDFBlob } from '../utils/pdfDownload';

const fmtMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = (v, d = 2) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

// ==================== HOOKS COMPARTILHADOS ====================
function useFilterData(axiosInstance) {
  const [vendedores, setVendedores] = useState([]);
  const [operacoes, setOperacoes] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const load = async () => {
      try {
        const [rv, ro, rg] = await Promise.all([
          axiosInstance.get('/vendedores/').catch(() => ({ data: { results: [] } })),
          axiosInstance.get('/operacoes/').catch(() => ({ data: { results: [] } })),
          axiosInstance.get('/grupos-produto/').catch(() => ({ data: { results: [] } })),
        ]);
        const operacoesRaw = Array.isArray(ro.data) ? ro.data : ro.data.results || [];
        const operacoesSaida = operacoesRaw.filter((o) => (o?.transacao || '').toLowerCase().includes('saida'));
        setVendedores(Array.isArray(rv.data) ? rv.data : rv.data.results || []);
        setOperacoes(operacoesSaida);
        setGrupos(Array.isArray(rg.data) ? rg.data : rg.data.results || []);
      } catch (e) { console.error('Erro ao carregar filtros:', e); }
      setLoaded(true);
    };
    load();
  }, [axiosInstance, loaded]);

  return { vendedores, operacoes, grupos };
}

// ==================== COMPONENTES COMPARTILHADOS ====================
function AtalhosPeriodo({ onSelect }) {
  const hoje = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const atalhos = [
    { label: 'Hoje', fn: () => ({ data_inicio: fmt(hoje), data_fim: fmt(hoje) }) },
    { label: '7 dias', fn: () => { const d = new Date(); d.setDate(d.getDate() - 7); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: '15 dias', fn: () => { const d = new Date(); d.setDate(d.getDate() - 15); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: '30 dias', fn: () => { const d = new Date(); d.setDate(d.getDate() - 30); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: '60 dias', fn: () => { const d = new Date(); d.setDate(d.getDate() - 60); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: '90 dias', fn: () => { const d = new Date(); d.setDate(d.getDate() - 90); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: 'Mês atual', fn: () => { const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: 'Mês anterior', fn: () => { const d1 = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1); const d2 = new Date(hoje.getFullYear(), hoje.getMonth(), 0); return { data_inicio: fmt(d1), data_fim: fmt(d2) }; } },
    { label: 'Ano atual', fn: () => { const d = new Date(hoje.getFullYear(), 0, 1); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: '12 meses', fn: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
  ];
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
      {atalhos.map(a => (
        <Chip key={a.label} label={a.label} size="small" variant="outlined" clickable onClick={() => onSelect(a.fn())} sx={{ fontSize: '0.7rem' }} />
      ))}
    </Box>
  );
}

function FiltrosDatas({ filtros, setFiltros }) {
  return <>
    <Grid item xs={6} sm={3} md={2}>
      <TextField fullWidth size="small" type="date" label="Data Início" value={filtros.data_inicio || ''} onChange={e => setFiltros(f => ({ ...f, data_inicio: e.target.value }))} InputLabelProps={{ shrink: true }} />
    </Grid>
    <Grid item xs={6} sm={3} md={2}>
      <TextField fullWidth size="small" type="date" label="Data Fim" value={filtros.data_fim || ''} onChange={e => setFiltros(f => ({ ...f, data_fim: e.target.value }))} InputLabelProps={{ shrink: true }} />
    </Grid>
  </>;
}

function VendedorSelect({ vendedores, value, onChange }) {
  return (
    <TextField fullWidth size="small" select label="Vendedor" value={value || ''} onChange={e => onChange(e.target.value)}>
      <MenuItem value="">Todos</MenuItem>
      {vendedores.map(v => <MenuItem key={v.id_vendedor} value={v.id_vendedor}>{v.nome_reduzido || v.nome}</MenuItem>)}
    </TextField>
  );
}

function OperacaoSelect({ operacoes, value, onChange, filtros, setFiltros }) {
  const valorAtual = value ?? filtros?.id_operacao ?? '';
  const handleChange = (novoValor) => {
    if (onChange) {
      onChange(novoValor);
      return;
    }
    if (setFiltros) {
      setFiltros((f) => ({ ...f, id_operacao: novoValor }));
    }
  };

  return (
    <TextField fullWidth size="small" select label="Operação" value={valorAtual} onChange={e => handleChange(e.target.value)}>
      <MenuItem value="">Todas</MenuItem>
      {operacoes.map(o => <MenuItem key={o.id_operacao} value={o.id_operacao}>{o.nome_operacao}</MenuItem>)}
    </TextField>
  );
}

function OrigemSelect({ value, onChange }) {
  return (
    <TextField fullWidth size="small" select label="Origem" value={value || ''} onChange={e => onChange(e.target.value)}>
      <MenuItem value="">Todas</MenuItem>
      <MenuItem value="PDV">PDV</MenuItem>
      <MenuItem value="ECOM">E-commerce</MenuItem>
      <MenuItem value="WHATSAPP">WhatsApp</MenuItem>
    </TextField>
  );
}

function FormaSelect({ value, onChange }) {
  return (
    <TextField fullWidth size="small" select label="Forma Pgto" value={value === '' || value === undefined ? '' : value} onChange={e => onChange(e.target.value)}>
      <MenuItem value="">Todas</MenuItem>
      <MenuItem value="1">À Vista</MenuItem>
      <MenuItem value="0">A Prazo</MenuItem>
    </TextField>
  );
}

function GrupoSelect({ grupos, value, onChange }) {
  return (
    <TextField fullWidth size="small" select label="Grupo" value={value || ''} onChange={e => onChange(e.target.value)}>
      <MenuItem value="">Todos</MenuItem>
      {grupos.map(g => <MenuItem key={g.id_grupo} value={g.id_grupo}>{g.nome_grupo}</MenuItem>)}
    </TextField>
  );
}

function StatusNfeSelect({ value, onChange }) {
  return (
    <TextField fullWidth size="small" select label="Status NF-e" value={value || ''} onChange={e => onChange(e.target.value)}>
      <MenuItem value="">Todos</MenuItem>
      <MenuItem value="EMITIDA">Emitida</MenuItem>
      <MenuItem value="PENDENTE">Pendente</MenuItem>
      <MenuItem value="CANCELADA">Cancelada</MenuItem>
    </TextField>
  );
}

function BotaoBuscar({ onClick, loading }) {
  return (
    <Button fullWidth variant="contained" onClick={onClick} disabled={loading} startIcon={<SearchIcon />} sx={{ height: 40 }}>
      Buscar
    </Button>
  );
}

function FiltrosAvancados({ children, label = 'Filtros Avançados' }) {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ mb: 1 }}>
      <Button size="small" startIcon={<FilterIcon />} endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => setOpen(!open)} sx={{ mb: 0.5, textTransform: 'none' }}>
        {label}
      </Button>
      <Collapse in={open}>
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {children}
        </Grid>
      </Collapse>
    </Box>
  );
}

function gerarPDF(titulo, colunas, linhas, resumo = null) {
  const doc = new jsPDF({ orientation: linhas[0]?.length > 6 ? 'landscape' : 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.text(titulo, 14, 18);
  doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW - 14, 18, { align: 'right' });
  let startY = 26;
  if (resumo) { doc.setFontSize(9); doc.text(resumo, 14, startY); startY += 8; }
  autoTable(doc, {
    head: [colunas], body: linhas, startY,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 },
  });
  
  // Usar função que funciona tanto no navegador quanto no Capacitor
  const filename = `${titulo.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}`;
  visualizarPDF(doc, filename);
}

function ResumoCards({ items }) {
  return (
    <Grid container spacing={1} sx={{ mb: 2 }}>
      {items.map((it, i) => (
        <Grid item xs={6} sm={3} key={i}>
          <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: it.color || '#f5f5f5' }}>
            <Typography variant="caption" color="text.secondary">{it.label}</Typography>
            <Typography variant="h6" fontWeight="bold">{it.value}</Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

// ==================== 1) HISTÓRICO DE VENDAS ====================
function RelHistoricoVendas({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', id_vendedor: '', status_nfe: '', origem: '', forma: '', id_operacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/historico/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <FiltrosDatas filtros={filtros} setFiltros={setFiltros} />
        <Grid item xs={6} sm={3} md={2}><VendedorSelect vendedores={filterData.vendedores} value={filtros.id_vendedor} onChange={v => setFiltros(f => ({ ...f, id_vendedor: v }))} /></Grid>
        <Grid item xs={6} sm={3} md={2}><StatusNfeSelect value={filtros.status_nfe} onChange={v => setFiltros(f => ({ ...f, status_nfe: v }))} /></Grid>
        <Grid item xs={6} sm={3} md={2}><OrigemSelect value={filtros.origem} onChange={v => setFiltros(f => ({ ...f, origem: v }))} /></Grid>
        <Grid item xs={6} sm={3} md={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      <FiltrosAvancados>
        <Grid item xs={6} sm={3}><FormaSelect value={filtros.forma} onChange={v => setFiltros(f => ({ ...f, forma: v }))} /></Grid>
        <Grid item xs={6} sm={3}><OperacaoSelect operacoes={filterData.operacoes} value={filtros.id_operacao} onChange={v => setFiltros(f => ({ ...f, id_operacao: v }))} /></Grid>
      </FiltrosAvancados>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Total Vendas', value: dados.resumo.total_vendas },
          { label: 'Valor Total', value: fmtMoeda(dados.resumo.valor_total) },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Histórico de Vendas', ['Nº', 'Data', 'Cliente', 'Vendedor', 'Operação', 'Forma', 'Origem', 'NF-e', 'Valor'], dados.itens.map(i => [i.numero, i.data, i.cliente, i.vendedor, i.operacao, i.forma, i.origem, i.status_nfe, fmtMoeda(i.valor_total)]), `Período: ${dados.resumo.periodo} | Total: ${fmtMoeda(dados.resumo.valor_total)}`)}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Nº</TableCell><TableCell>Data</TableCell><TableCell>Cliente</TableCell><TableCell>Vendedor</TableCell><TableCell>Operação</TableCell><TableCell>Forma</TableCell><TableCell>Origem</TableCell><TableCell>NF-e</TableCell><TableCell align="right">Valor</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{i.numero}</TableCell><TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{i.data}</TableCell><TableCell>{i.cliente}</TableCell><TableCell>{i.vendedor}</TableCell>
                  <TableCell>{i.operacao}</TableCell><TableCell><Chip label={i.forma} size="small" variant="outlined" color={i.forma === 'À Vista' ? 'success' : 'info'} /></TableCell>
                  <TableCell>{i.origem && <Chip label={i.origem} size="small" variant="outlined" />}</TableCell>
                  <TableCell><Chip label={i.status_nfe || 'PENDENTE'} size="small" color={i.status_nfe === 'EMITIDA' ? 'success' : i.status_nfe === 'CANCELADA' ? 'error' : 'default'} /></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fmtMoeda(i.valor_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 2) LUCRO ====================
function RelLucro({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', id_vendedor: '', id_operacao: '', origem: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/lucro/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <FiltrosDatas filtros={filtros} setFiltros={setFiltros} />
        <Grid item xs={6} sm={3} md={2}><VendedorSelect vendedores={filterData.vendedores} value={filtros.id_vendedor} onChange={v => setFiltros(f => ({ ...f, id_vendedor: v }))} /></Grid>
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={6} sm={3} md={2}><OrigemSelect value={filtros.origem} onChange={v => setFiltros(f => ({ ...f, origem: v }))} /></Grid>
        <Grid item xs={6} sm={3} md={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Vendas', value: fmtMoeda(dados.resumo.total_vendas) },
          { label: 'Custo', value: fmtMoeda(dados.resumo.total_custo) },
          { label: 'Lucro', value: fmtMoeda(dados.resumo.total_lucro), color: dados.resumo.total_lucro >= 0 ? '#e8f5e9' : '#ffebee' },
          { label: 'Margem Média', value: fmtNum(dados.resumo.margem_media) + '%' },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Lucro por Venda', ['Nº', 'Data', 'Cliente', 'Vendedor', 'Venda', 'Custo', 'Lucro', 'Margem'], dados.itens.map(i => [i.numero, i.data, i.cliente, i.vendedor, fmtMoeda(i.valor_venda), fmtMoeda(i.custo), fmtMoeda(i.lucro), fmtNum(i.margem) + '%']), `Período: ${dados.resumo.periodo} | Lucro Total: ${fmtMoeda(dados.resumo.total_lucro)}`)}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Nº</TableCell><TableCell>Data</TableCell><TableCell>Cliente</TableCell><TableCell>Vendedor</TableCell><TableCell align="right">Venda</TableCell><TableCell align="right">Custo</TableCell><TableCell align="right">Lucro</TableCell><TableCell align="right">Margem</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{i.numero}</TableCell><TableCell>{i.data}</TableCell><TableCell>{i.cliente}</TableCell><TableCell>{i.vendedor}</TableCell>
                  <TableCell align="right">{fmtMoeda(i.valor_venda)}</TableCell><TableCell align="right">{fmtMoeda(i.custo)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: i.lucro >= 0 ? 'green' : 'red' }}>{fmtMoeda(i.lucro)}</TableCell>
                  <TableCell align="right">{fmtNum(i.margem)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 3) AGRUPADO POR DIA ====================
function RelAgrupadoDia({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', id_operacao: '', id_vendedor: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/agrupado-dia/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <FiltrosDatas filtros={filtros} setFiltros={setFiltros} />
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={6} sm={3} md={2}><VendedorSelect vendedores={filterData.vendedores} value={filtros.id_vendedor} onChange={v => setFiltros(f => ({ ...f, id_vendedor: v }))} /></Grid>
        <Grid item xs={12} sm={3} md={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Total Dias', value: dados.resumo.total_dias },
          { label: 'Total Vendas', value: dados.resumo.total_vendas },
          { label: 'Valor Total', value: fmtMoeda(dados.resumo.valor_total) },
          { label: 'Média Diária', value: fmtMoeda(dados.resumo.media_diaria) },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Vendas Agrupado por Dia', ['Dia', 'Dia Semana', 'Qtd Vendas', 'Valor Total', 'Ticket Médio'], dados.itens.map(i => [i.dia, i.dia_semana, i.qtd_vendas, fmtMoeda(i.valor_total), fmtMoeda(i.ticket_medio)]), `Período: ${dados.resumo.periodo}`)}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Dia</TableCell><TableCell>Dia da Semana</TableCell><TableCell align="right">Qtd Vendas</TableCell><TableCell align="right">Valor Total</TableCell><TableCell align="right">Ticket Médio</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{i.dia}</TableCell><TableCell>{i.dia_semana}</TableCell>
                  <TableCell align="right">{i.qtd_vendas}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fmtMoeda(i.valor_total)}</TableCell>
                  <TableCell align="right">{fmtMoeda(i.ticket_medio)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 4) AGRUPADO POR DIA C/ DESC/ENCAM ====================
function RelAgrupadoDiaDesc({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', id_operacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/agrupado-dia-desc/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <FiltrosDatas filtros={filtros} setFiltros={setFiltros} />
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={12} sm={3} md={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Valor Bruto', value: fmtMoeda(dados.resumo.valor_bruto) },
          { label: 'Descontos', value: fmtMoeda(dados.resumo.desconto_total), color: '#fff3e0' },
          { label: 'Valor Líquido', value: fmtMoeda(dados.resumo.valor_liquido), color: '#e8f5e9' },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Vendas por Dia c/ Desc. e Encam.', ['Dia', 'Qtd Vendas', 'Bruto', 'Desconto', 'Líquido', 'Taxa Entrega'], dados.itens.map(i => [i.dia, i.qtd_vendas, fmtMoeda(i.valor_bruto), fmtMoeda(i.desconto_total), fmtMoeda(i.valor_liquido), fmtMoeda(i.taxa_entrega)]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Dia</TableCell><TableCell align="right">Qtd</TableCell><TableCell align="right">Bruto</TableCell><TableCell align="right">Desconto</TableCell><TableCell align="right">Líquido</TableCell><TableCell align="right">Taxa Entrega</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{i.dia}</TableCell><TableCell align="right">{i.qtd_vendas}</TableCell>
                  <TableCell align="right">{fmtMoeda(i.valor_bruto)}</TableCell>
                  <TableCell align="right" sx={{ color: 'orange' }}>{fmtMoeda(i.desconto_total)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'green' }}>{fmtMoeda(i.valor_liquido)}</TableCell>
                  <TableCell align="right">{fmtMoeda(i.taxa_entrega)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 5) RECIBOS GERADOS ====================
function RelRecibos({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', id_operacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/recibos/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <FiltrosDatas filtros={filtros} setFiltros={setFiltros} />
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={12} sm={3} md={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Notas Emitidas', value: dados.resumo.total_notas },
          { label: 'Valor Total', value: fmtMoeda(dados.resumo.valor_total) },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Recibos / Notas Fiscais Emitidas', ['Nº NF-e', 'Série', 'Data', 'Cliente', 'Valor', 'Protocolo'], dados.itens.map(i => [i.numero_nfe, i.serie, i.data, i.cliente, fmtMoeda(i.valor_total), i.protocolo]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Nº NF-e</TableCell><TableCell>Série</TableCell><TableCell>Data</TableCell><TableCell>Cliente</TableCell><TableCell align="right">Valor</TableCell><TableCell>Protocolo</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{i.numero_nfe}</TableCell><TableCell>{i.serie}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{i.data}</TableCell><TableCell>{i.cliente}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fmtMoeda(i.valor_total)}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>{i.protocolo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 6) PED. VENDA / O.S. POR DATA ====================
function RelPedidosPorData({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', id_vendedor: '', id_operacao: '', origem: '', forma: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/pedidos-por-data/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <FiltrosDatas filtros={filtros} setFiltros={setFiltros} />
        <Grid item xs={6} sm={3} md={2}><VendedorSelect vendedores={filterData.vendedores} value={filtros.id_vendedor} onChange={v => setFiltros(f => ({ ...f, id_vendedor: v }))} /></Grid>
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={6} sm={3} md={2}><OrigemSelect value={filtros.origem} onChange={v => setFiltros(f => ({ ...f, origem: v }))} /></Grid>
        <Grid item xs={6} sm={3} md={2}><FormaSelect value={filtros.forma} onChange={v => setFiltros(f => ({ ...f, forma: v }))} /></Grid>
        <Grid item xs={6} sm={3} md={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Total Pedidos', value: dados.resumo.total_pedidos },
          { label: 'Valor Total', value: fmtMoeda(dados.resumo.valor_total) },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Pedidos de Venda / O.S. por Data', ['Nº', 'Data', 'Cliente', 'Vendedor', 'Operação', 'Itens', 'Forma', 'NF-e', 'Valor'], dados.itens.map(i => [i.numero, i.data, i.cliente, i.vendedor, i.operacao, i.qtd_itens, i.forma, i.status_nfe, fmtMoeda(i.valor_total)]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Nº</TableCell><TableCell>Data</TableCell><TableCell>Cliente</TableCell><TableCell>Vendedor</TableCell><TableCell>Operação</TableCell><TableCell align="right">Itens</TableCell><TableCell>Forma</TableCell><TableCell>NF-e</TableCell><TableCell align="right">Valor</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{i.numero}</TableCell><TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{i.data}</TableCell><TableCell>{i.cliente}</TableCell><TableCell>{i.vendedor}</TableCell>
                  <TableCell>{i.operacao}</TableCell><TableCell align="right">{i.qtd_itens}</TableCell>
                  <TableCell><Chip label={i.forma} size="small" variant="outlined" color={i.forma === 'À Vista' ? 'success' : 'info'} /></TableCell>
                  <TableCell><Chip label={i.status_nfe} size="small" color={i.status_nfe === 'EMITIDA' ? 'success' : 'default'} /></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fmtMoeda(i.valor_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 7) TOTAL VENDAS C/ QUANTIDADE ====================
function RelTotalQuantidade({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', id_grupo: '', id_operacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/total-quantidade/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <FiltrosDatas filtros={filtros} setFiltros={setFiltros} />
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={6} sm={3} md={2}><GrupoSelect grupos={filterData.grupos} value={filtros.id_grupo} onChange={v => setFiltros(f => ({ ...f, id_grupo: v }))} /></Grid>
        <Grid item xs={6} sm={3} md={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Produtos Distintos', value: dados.resumo.total_produtos },
          { label: 'Total Quantidade', value: fmtNum(dados.resumo.total_quantidade, 0) },
          { label: 'Valor Total', value: fmtMoeda(dados.resumo.valor_total) },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Total Vendas com Quantidade', ['Código', 'Produto', 'UN', 'Grupo', 'Qtd Vendida', 'Nº Vendas', 'Preço Médio', 'Desconto', 'Valor Total'], dados.itens.map(i => [i.codigo, i.nome, i.unidade, i.grupo, fmtNum(i.qtd_vendida), i.num_vendas, fmtMoeda(i.preco_medio), fmtMoeda(i.desconto_total), fmtMoeda(i.valor_total)]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Produto</TableCell><TableCell>UN</TableCell><TableCell>Grupo</TableCell><TableCell align="right">Qtd</TableCell><TableCell align="right">Vendas</TableCell><TableCell align="right">Preço Médio</TableCell><TableCell align="right">Desconto</TableCell><TableCell align="right">Valor Total</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{i.codigo}</TableCell><TableCell>{i.nome}</TableCell><TableCell>{i.unidade}</TableCell><TableCell>{i.grupo}</TableCell>
                  <TableCell align="right">{fmtNum(i.qtd_vendida)}</TableCell><TableCell align="right">{i.num_vendas}</TableCell>
                  <TableCell align="right">{fmtMoeda(i.preco_medio)}</TableCell><TableCell align="right" sx={{ color: 'orange' }}>{fmtMoeda(i.desconto_total)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fmtMoeda(i.valor_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 8) PED. VENDA / O.S. ABERTA ====================
function RelPedidosAbertos({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ id_vendedor: '', id_operacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/pedidos-abertos/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { buscar(); }, []);

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={6} sm={4}><VendedorSelect vendedores={filterData.vendedores} value={filtros.id_vendedor} onChange={v => setFiltros(f => ({ ...f, id_vendedor: v }))} /></Grid>
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={6} sm={4}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Pedidos Abertos', value: dados.resumo.total_abertos },
          { label: 'Valor Total', value: fmtMoeda(dados.resumo.valor_total) },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Pedidos de Venda / O.S. Abertos', ['Nº', 'Data', 'Cliente', 'Vendedor', 'Operação', 'Dias Aberto', 'Forma', 'Valor'], dados.itens.map(i => [i.numero, i.data, i.cliente, i.vendedor, i.operacao, i.dias_aberto, i.forma, fmtMoeda(i.valor_total)]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Nº</TableCell><TableCell>Data</TableCell><TableCell>Cliente</TableCell><TableCell>Vendedor</TableCell><TableCell>Operação</TableCell><TableCell align="right">Dias</TableCell><TableCell>Forma</TableCell><TableCell align="right">Valor</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{i.numero}</TableCell><TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{i.data}</TableCell><TableCell>{i.cliente}</TableCell><TableCell>{i.vendedor}</TableCell>
                  <TableCell>{i.operacao}</TableCell>
                  <TableCell align="right"><Chip label={`${i.dias_aberto}d`} size="small" color={i.dias_aberto > 30 ? 'error' : i.dias_aberto > 7 ? 'warning' : 'success'} /></TableCell>
                  <TableCell><Chip label={i.forma} size="small" variant="outlined" color={i.forma === 'À Vista' ? 'success' : 'info'} /></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fmtMoeda(i.valor_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 9) COBRANÇAS PENDENTES ====================
function RelCobrancas({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ status: 'aberto', id_operacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/cobrancas/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { buscar(); }, []);

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={6} sm={3}>
          <TextField fullWidth size="small" select label="Status" value={filtros.status} onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}>
            <MenuItem value="aberto">Aberto</MenuItem>
            <MenuItem value="vencido">Vencido</MenuItem>
            <MenuItem value="pago">Pago</MenuItem>
            <MenuItem value="">Todos</MenuItem>
          </TextField>
        </Grid>
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={6} sm={3}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Registros', value: dados.resumo.total_registros },
          { label: 'Valor Total', value: fmtMoeda(dados.resumo.valor_total) },
          { label: 'Vencido', value: fmtMoeda(dados.resumo.valor_vencido), color: '#ffebee' },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Cobranças Pendentes', ['Doc.', 'Cliente', 'Parcela', 'Valor', 'Vencimento', 'Pgto', 'Status', 'Atraso'], dados.itens.map(i => [i.documento, i.cliente, i.parcela, fmtMoeda(i.valor), i.data_vencimento, i.data_pagamento || '—', i.status, i.dias_atraso ? i.dias_atraso + 'd' : '—']))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Doc.</TableCell><TableCell>Cliente</TableCell><TableCell>Descrição</TableCell><TableCell>Parcela</TableCell><TableCell align="right">Valor</TableCell><TableCell>Vencimento</TableCell><TableCell>Forma Pgto</TableCell><TableCell>Status</TableCell><TableCell align="right">Atraso</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover sx={{ bgcolor: i.vencido ? '#fff3e0' : 'inherit' }}>
                  <TableCell>{i.documento}</TableCell><TableCell>{i.cliente}</TableCell><TableCell sx={{ fontSize: '0.75rem' }}>{i.descricao}</TableCell><TableCell>{i.parcela}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fmtMoeda(i.valor)}</TableCell>
                  <TableCell>{i.data_vencimento}</TableCell><TableCell>{i.forma_pagamento}</TableCell>
                  <TableCell><Chip label={i.status} size="small" color={i.status === 'pago' ? 'success' : i.vencido ? 'error' : 'warning'} /></TableCell>
                  <TableCell align="right">{i.dias_atraso > 0 ? <Chip label={`${i.dias_atraso}d`} size="small" color="error" /> : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 10) VENDAS POR CLIENTE ====================
function RelVendasPorCliente({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', limite: '50', id_operacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/por-cliente/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <FiltrosDatas filtros={filtros} setFiltros={setFiltros} />
        <Grid item xs={6} sm={3} md={2}>
          <TextField fullWidth size="small" select label="Top N" value={filtros.limite} onChange={e => setFiltros(f => ({ ...f, limite: e.target.value }))}>
            <MenuItem value="10">Top 10</MenuItem>
            <MenuItem value="20">Top 20</MenuItem>
            <MenuItem value="50">Top 50</MenuItem>
            <MenuItem value="100">Top 100</MenuItem>
            <MenuItem value="500">Top 500</MenuItem>
          </TextField>
        </Grid>
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={6} sm={3} md={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Clientes', value: dados.resumo.total_clientes },
          { label: 'Valor Total', value: fmtMoeda(dados.resumo.valor_total) },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Vendas por Cliente', ['Cliente', 'CPF/CNPJ', 'Cidade', 'Vendas', 'Valor Total', 'Ticket Médio', 'Part. %', 'Última Compra'], dados.itens.map(i => [i.nome, i.cpf_cnpj, i.cidade, i.qtd_vendas, fmtMoeda(i.valor_total), fmtMoeda(i.ticket_medio), fmtNum(i.participacao) + '%', i.ultima_compra]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Cliente</TableCell><TableCell>CPF/CNPJ</TableCell><TableCell>Cidade</TableCell><TableCell align="right">Vendas</TableCell><TableCell align="right">Valor Total</TableCell><TableCell align="right">Ticket Médio</TableCell><TableCell align="right">Part. %</TableCell><TableCell>Última Compra</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{i.nome}</TableCell><TableCell sx={{ fontSize: '0.75rem' }}>{i.cpf_cnpj}</TableCell><TableCell>{i.cidade}</TableCell>
                  <TableCell align="right">{i.qtd_vendas}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fmtMoeda(i.valor_total)}</TableCell>
                  <TableCell align="right">{fmtMoeda(i.ticket_medio)}</TableCell>
                  <TableCell align="right">{fmtNum(i.participacao)}%</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{i.ultima_compra}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 11) VENDAS POR CIDADE/VENDEDOR ====================
function RelVendasCidadeVendedor({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', agrupar: 'cidade', id_operacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/cidade-vendedor/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <FiltrosDatas filtros={filtros} setFiltros={setFiltros} />
        <Grid item xs={6} sm={3} md={2}>
          <TextField fullWidth size="small" select label="Agrupar por" value={filtros.agrupar} onChange={e => setFiltros(f => ({ ...f, agrupar: e.target.value }))}>
            <MenuItem value="cidade">Cidade</MenuItem>
            <MenuItem value="vendedor">Vendedor</MenuItem>
          </TextField>
        </Grid>
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={6} sm={3} md={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: `Total ${dados.resumo.agrupamento === 'vendedor' ? 'Vendedores' : 'Cidades'}`, value: dados.resumo.total_grupos },
          { label: 'Valor Total', value: fmtMoeda(dados.resumo.valor_total) },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF(`Vendas por ${dados.resumo.agrupamento === 'vendedor' ? 'Vendedor' : 'Cidade'}`, [dados.resumo.agrupamento === 'vendedor' ? 'Vendedor' : 'Cidade', 'Qtd Vendas', 'Valor Total', 'Ticket Médio', 'Part. %'], dados.itens.map(i => [i.grupo, i.qtd_vendas, fmtMoeda(i.valor_total), fmtMoeda(i.ticket_medio), fmtNum(i.participacao) + '%']))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>{dados.resumo.agrupamento === 'vendedor' ? 'Vendedor' : 'Cidade'}</TableCell><TableCell align="right">Vendas</TableCell><TableCell align="right">Valor Total</TableCell><TableCell align="right">Ticket Médio</TableCell><TableCell align="right">Part. %</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{i.grupo}</TableCell>
                  <TableCell align="right">{i.qtd_vendas}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fmtMoeda(i.valor_total)}</TableCell>
                  <TableCell align="right">{fmtMoeda(i.ticket_medio)}</TableCell>
                  <TableCell align="right">{fmtNum(i.participacao)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 12) LUCRO POR VENDA/VENDEDOR ====================
function RelLucroVendedor({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', id_operacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/lucro-vendedor/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <FiltrosDatas filtros={filtros} setFiltros={setFiltros} />
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={12} sm={3} md={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Total Vendas', value: fmtMoeda(dados.resumo.total_vendas) },
          { label: 'Total Custo', value: fmtMoeda(dados.resumo.total_custo) },
          { label: 'Total Lucro', value: fmtMoeda(dados.resumo.total_lucro), color: dados.resumo.total_lucro >= 0 ? '#e8f5e9' : '#ffebee' },
          { label: 'Margem Média', value: fmtNum(dados.resumo.margem_media) + '%' },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Lucro por Venda/Vendedor', ['Vendedor', 'Vendas', 'Valor Vendas', 'Custo', 'Lucro', 'Margem', 'Comissão %', 'Vlr Comissão'], dados.itens.map(i => [i.vendedor, i.qtd_vendas, fmtMoeda(i.valor_vendas), fmtMoeda(i.custo_total), fmtMoeda(i.lucro), fmtNum(i.margem) + '%', fmtNum(i.comissao_perc) + '%', fmtMoeda(i.valor_comissao)]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Vendedor</TableCell><TableCell align="right">Vendas</TableCell><TableCell align="right">Valor Vendas</TableCell><TableCell align="right">Custo</TableCell><TableCell align="right">Lucro</TableCell><TableCell align="right">Margem</TableCell><TableCell align="right">Comissão %</TableCell><TableCell align="right">Vlr Comissão</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{i.vendedor}</TableCell><TableCell align="right">{i.qtd_vendas}</TableCell>
                  <TableCell align="right">{fmtMoeda(i.valor_vendas)}</TableCell><TableCell align="right">{fmtMoeda(i.custo_total)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: i.lucro >= 0 ? 'green' : 'red' }}>{fmtMoeda(i.lucro)}</TableCell>
                  <TableCell align="right">{fmtNum(i.margem)}%</TableCell>
                  <TableCell align="right">{fmtNum(i.comissao_perc)}%</TableCell>
                  <TableCell align="right">{fmtMoeda(i.valor_comissao)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 13) VENDAS POR CARACTERÍSTICA ====================
function RelVendasCaracteristica({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', id_operacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/por-caracteristica/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <FiltrosDatas filtros={filtros} setFiltros={setFiltros} />
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={12} sm={3} md={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Grupos', value: dados.resumo.total_grupos },
          { label: 'Valor Total', value: fmtMoeda(dados.resumo.valor_total) },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Vendas por Característica/Grupo', ['Grupo', 'Produtos', 'Qtd Vendida', 'Nº Vendas', 'Desconto', 'Valor Total', 'Part. %'], dados.itens.map(i => [i.grupo, i.qtd_produtos, fmtNum(i.qtd_vendida), i.num_vendas, fmtMoeda(i.desconto_total), fmtMoeda(i.valor_total), fmtNum(i.participacao) + '%']))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Grupo/Característica</TableCell><TableCell align="right">Produtos</TableCell><TableCell align="right">Qtd Vendida</TableCell><TableCell align="right">Nº Vendas</TableCell><TableCell align="right">Desconto</TableCell><TableCell align="right">Valor Total</TableCell><TableCell align="right">Part. %</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{i.grupo}</TableCell><TableCell align="right">{i.qtd_produtos}</TableCell>
                  <TableCell align="right">{fmtNum(i.qtd_vendida)}</TableCell><TableCell align="right">{i.num_vendas}</TableCell>
                  <TableCell align="right" sx={{ color: 'orange' }}>{fmtMoeda(i.desconto_total)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fmtMoeda(i.valor_total)}</TableCell>
                  <TableCell align="right">{fmtNum(i.participacao)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 14) ÚLTIMA COMPRA DO CLIENTE ====================
function RelUltimaCompra({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ dias: '90', busca: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/ultima-compra-cliente/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={4} sm={2}>
          <TextField fullWidth size="small" select label="Dias sem compra" value={filtros.dias} onChange={e => setFiltros(f => ({ ...f, dias: e.target.value }))}>
            <MenuItem value="15">15 dias</MenuItem>
            <MenuItem value="30">30 dias</MenuItem>
            <MenuItem value="60">60 dias</MenuItem>
            <MenuItem value="90">90 dias</MenuItem>
            <MenuItem value="120">120 dias</MenuItem>
            <MenuItem value="180">180 dias</MenuItem>
            <MenuItem value="365">1 ano</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={4} sm={4}><TextField fullWidth size="small" label="Buscar cliente (nome ou CPF/CNPJ)" value={filtros.busca} onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))} placeholder="Digite para filtrar..." /></Grid>
        <Grid item xs={4} sm={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Total Clientes', value: dados.resumo.total_clientes },
          { label: 'Ativos', value: dados.resumo.clientes_ativos, color: '#e8f5e9' },
          { label: 'Inativos', value: dados.resumo.clientes_inativos, color: '#ffebee' },
        ]} />

        {dados.itens_inativos?.length > 0 && <>
          <Typography variant="subtitle2" color="error" sx={{ mt: 2, mb: 1 }}>Clientes Inativos (sem compra há mais de {filtros.dias} dias)</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Última Compra - Clientes Inativos', ['Cliente', 'CPF/CNPJ', 'Cidade', 'Telefone', 'Compras', 'Valor Total', 'Última Compra', 'Dias'], dados.itens_inativos.map(i => [i.nome, i.cpf_cnpj, i.cidade, i.telefone, i.total_compras, fmtMoeda(i.valor_total), i.ultima_compra, i.dias_sem_compra]))}>PDF Inativos</Button>
          </Box>
          <TableContainer component={Paper} sx={{ maxHeight: 300, mb: 2 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow><TableCell>Cliente</TableCell><TableCell>Cidade</TableCell><TableCell>Telefone</TableCell><TableCell align="right">Compras</TableCell><TableCell align="right">Valor Total</TableCell><TableCell>Última Compra</TableCell><TableCell align="right">Dias</TableCell></TableRow></TableHead>
              <TableBody>
                {dados.itens_inativos.map((i, idx) => (
                  <TableRow key={idx} hover sx={{ bgcolor: '#fff8f8' }}>
                    <TableCell>{i.nome}</TableCell><TableCell>{i.cidade}</TableCell><TableCell>{i.telefone}</TableCell>
                    <TableCell align="right">{i.total_compras}</TableCell><TableCell align="right">{fmtMoeda(i.valor_total)}</TableCell>
                    <TableCell>{i.ultima_compra}</TableCell>
                    <TableCell align="right"><Chip label={`${i.dias_sem_compra}d`} size="small" color="error" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>}

        {dados.itens_recentes?.length > 0 && <>
          <Typography variant="subtitle2" color="success.main" sx={{ mt: 2, mb: 1 }}>Clientes Ativos</Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow><TableCell>Cliente</TableCell><TableCell>Cidade</TableCell><TableCell>Telefone</TableCell><TableCell align="right">Compras</TableCell><TableCell align="right">Valor Total</TableCell><TableCell>Última Compra</TableCell><TableCell align="right">Dias</TableCell></TableRow></TableHead>
              <TableBody>
                {dados.itens_recentes.map((i, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{i.nome}</TableCell><TableCell>{i.cidade}</TableCell><TableCell>{i.telefone}</TableCell>
                    <TableCell align="right">{i.total_compras}</TableCell><TableCell align="right">{fmtMoeda(i.valor_total)}</TableCell>
                    <TableCell>{i.ultima_compra}</TableCell>
                    <TableCell align="right"><Chip label={`${i.dias_sem_compra}d`} size="small" color="success" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>}
      </>}
    </Box>
  );
}

// ==================== 15) CUSTO VENDA CARTÃO ====================
function RelCustoCartao({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', tipo_cartao: '', bandeira: '', id_operacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/custo-cartao/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <FiltrosDatas filtros={filtros} setFiltros={setFiltros} />
        <Grid item xs={6} sm={3} md={2}>
          <TextField fullWidth size="small" select label="Tipo Cartão" value={filtros.tipo_cartao} onChange={e => setFiltros(f => ({ ...f, tipo_cartao: e.target.value }))}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="credito">Crédito</MenuItem>
            <MenuItem value="debito">Débito</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField fullWidth size="small" label="Bandeira" value={filtros.bandeira} onChange={e => setFiltros(f => ({ ...f, bandeira: e.target.value }))} placeholder="Ex: Visa, Master..." />
        </Grid>
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={6} sm={3} md={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Registros', value: dados.resumo.total_registros },
          { label: 'Valor Bruto', value: fmtMoeda(dados.resumo.total_bruto) },
          { label: 'Taxas', value: fmtMoeda(dados.resumo.total_taxa), color: '#ffebee' },
          { label: 'Valor Líquido', value: fmtMoeda(dados.resumo.total_liquido), color: '#e8f5e9' },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Custo Venda Cartão', ['Venda', 'Data', 'Bandeira', 'Tipo', 'NSU', 'Bruto', 'Taxa %', 'Vlr Taxa', 'Líquido', 'Status'], dados.itens.map(i => [i.id_venda, i.data_venda, i.bandeira, i.tipo_cartao, i.nsu, fmtMoeda(i.valor_bruto), fmtNum(i.taxa_percentual) + '%', fmtMoeda(i.valor_taxa), fmtMoeda(i.valor_liquido), i.status]), `Taxa Média: ${fmtNum(dados.resumo.taxa_media)}%`)}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Venda</TableCell><TableCell>Data</TableCell><TableCell>Bandeira</TableCell><TableCell>Tipo</TableCell><TableCell>NSU</TableCell><TableCell align="right">Bruto</TableCell><TableCell align="right">Taxa %</TableCell><TableCell align="right">Vlr Taxa</TableCell><TableCell align="right">Líquido</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{i.id_venda}</TableCell><TableCell sx={{ whiteSpace: 'nowrap' }}>{i.data_venda}</TableCell><TableCell>{i.bandeira}</TableCell><TableCell>{i.tipo_cartao}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>{i.nsu}</TableCell>
                  <TableCell align="right">{fmtMoeda(i.valor_bruto)}</TableCell>
                  <TableCell align="right">{fmtNum(i.taxa_percentual)}%</TableCell>
                  <TableCell align="right" sx={{ color: 'red' }}>{fmtMoeda(i.valor_taxa)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'green' }}>{fmtMoeda(i.valor_liquido)}</TableCell>
                  <TableCell><Chip label={i.status || '—'} size="small" color={i.status === 'pago' ? 'success' : 'warning'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 16) FRETE ====================
function RelFrete({ axiosInstance, filterData }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', tipo_frete: '', id_operacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v !== '' && v !== undefined) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/vendas/frete/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <FiltrosDatas filtros={filtros} setFiltros={setFiltros} />
        <Grid item xs={6} sm={3} md={2}>
          <TextField fullWidth size="small" select label="Tipo Frete" value={filtros.tipo_frete} onChange={e => setFiltros(f => ({ ...f, tipo_frete: e.target.value }))}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="0">Remetente (CIF)</MenuItem>
            <MenuItem value="1">Destinatário (FOB)</MenuItem>
            <MenuItem value="9">Sem Frete</MenuItem>
          </TextField>
        </Grid>
        <OperacaoSelect filtros={filtros} setFiltros={setFiltros} operacoes={filterData.operacoes} />
        <Grid item xs={6} sm={3} md={2}><BotaoBuscar onClick={buscar} loading={loading} /></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Vendas c/ Frete', value: dados.resumo.total_registros },
          { label: 'Total Frete', value: fmtMoeda(dados.resumo.total_frete) },
          { label: 'Peso Total (kg)', value: fmtNum(dados.resumo.total_peso) },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Relatório de Frete', ['Nº', 'Data', 'Cliente', 'Transportadora', 'Tipo Frete', 'Vlr Venda', 'Vlr Frete', 'Peso Bruto', 'Volumes', 'Placa'], dados.itens.map(i => [i.numero, i.data, i.cliente, i.transportadora, i.tipo_frete, fmtMoeda(i.valor_venda), fmtMoeda(i.valor_frete), fmtNum(i.peso_bruto), i.volumes, i.placa]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Nº</TableCell><TableCell>Data</TableCell><TableCell>Cliente</TableCell><TableCell>Transportadora</TableCell><TableCell>Tipo</TableCell><TableCell align="right">Vlr Venda</TableCell><TableCell align="right">Vlr Frete</TableCell><TableCell align="right">Peso (kg)</TableCell><TableCell align="right">Volumes</TableCell><TableCell>Placa</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{i.numero}</TableCell><TableCell sx={{ whiteSpace: 'nowrap' }}>{i.data}</TableCell><TableCell>{i.cliente}</TableCell><TableCell>{i.transportadora}</TableCell>
                  <TableCell>{i.tipo_frete}</TableCell>
                  <TableCell align="right">{fmtMoeda(i.valor_venda)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fmtMoeda(i.valor_frete)}</TableCell>
                  <TableCell align="right">{fmtNum(i.peso_bruto)}</TableCell>
                  <TableCell align="right">{i.volumes}</TableCell>
                  <TableCell>{i.placa}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== DIALOG RELATÓRIO COMPLETO ====================
const SECOES_RELATORIO = [
  { key: 'listagem', label: 'Listagem de Vendas', icon: '📋' },
  { key: 'pagamento', label: 'Resumo por Forma de Pagamento', icon: '💳' },
  { key: 'grupo', label: 'Resumo por Grupo de Produtos', icon: '📦' },
  { key: 'operacao', label: 'Resumo por Operação Fiscal', icon: '📄' },
  { key: 'cidade', label: 'Resumo por Cidade', icon: '🏙️' },
  { key: 'clientes', label: 'Top 10 Clientes', icon: '🏆' },
];

function RelatorioCompletoDialog({ open, onClose, axiosInstance, filterData }) {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [clienteId, setClienteId] = useState(null);
  const [clienteInput, setClienteInput] = useState('');
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [produtoId, setProdutoId] = useState(null);
  const [produtoInput, setProdutoInput] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [grupoId, setGrupoId] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [vendedorId, setVendedorId] = useState('');
  const [operacaoId, setOperacaoId] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [secoes, setSecoes] = useState(SECOES_RELATORIO.map(s => s.key));
  const [gerando, setGerando] = useState(false);

  // Busca clientes com debounce
  useEffect(() => {
    if (clienteInput.length < 2) { setClientes([]); return; }
    const t = setTimeout(async () => {
      setLoadingClientes(true);
      try {
        const r = await axiosInstance.get('/clientes/', { params: { search: clienteInput, page_size: 20 } });
        setClientes(Array.isArray(r.data) ? r.data : r.data.results || []);
      } catch { setClientes([]); }
      setLoadingClientes(false);
    }, 400);
    return () => clearTimeout(t);
  }, [clienteInput]);

  // Busca produtos com debounce
  useEffect(() => {
    if (produtoInput.length < 2) { setProdutos([]); return; }
    const t = setTimeout(async () => {
      setLoadingProdutos(true);
      try {
        const r = await axiosInstance.get('/produtos/', { params: { search: produtoInput, page_size: 20 } });
        setProdutos(Array.isArray(r.data) ? r.data : r.data.results || []);
      } catch { setProdutos([]); }
      setLoadingProdutos(false);
    }, 400);
    return () => clearTimeout(t);
  }, [produtoInput]);

  const toggleSecao = (key) => {
    setSecoes(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleGerarPDF = async () => {
    if (!dataInicio || !dataFim) return;
    setGerando(true);
    try {
      const params = {
        data_inicio: dataInicio,
        data_fim: dataFim,
        status: statusFiltro,
      };
      if (clienteId) params.cliente = clienteId;
      if (vendedorId) params.vendedor = vendedorId;
      if (operacaoId) params.operacao = operacaoId;
      if (secoes.length > 0 && secoes.length < SECOES_RELATORIO.length) {
        params.resumos = secoes.join(',');
      }
      const resp = await axiosInstance.get('/relatorios/vendas/pdf/', {
        params,
        responseType: 'blob',
      });
      
      // Usar função que funciona tanto no navegador quanto no Capacitor
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const filename = `Relatorio_Vendas_${dataInicio}_${dataFim}.pdf`;
      await visualizarPDFBlob(blob, filename);
      
      onClose();
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar relatório. Verifique os filtros e tente novamente.');
    }
    setGerando(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PdfIcon sx={{ color: '#1976d2' }} />
          <Typography variant="h6" fontWeight="bold">Relatório de Vendas</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {/* Banner info */}
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
          Configure os filtros para personalizar seu relatório
        </Alert>

        {/* Datas */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
          <TextField label="Data Início" type="date" fullWidth size="small"
            InputLabelProps={{ shrink: true }} value={dataInicio}
            onChange={e => setDataInicio(e.target.value)} />
          <TextField label="Data Fim" type="date" fullWidth size="small"
            InputLabelProps={{ shrink: true }} value={dataFim}
            onChange={e => setDataFim(e.target.value)} />
        </Box>

        {/* Cliente */}
        <Autocomplete size="small" sx={{ mb: 2.5 }}
          options={clientes}
          getOptionLabel={o => o.nome_razao_social || o.nome_fantasia || ''}
          filterOptions={x => x}
          loading={loadingClientes}
          onInputChange={(_, v) => setClienteInput(v)}
          onChange={(_, v) => setClienteId(v?.id_cliente || null)}
          renderInput={p => (
            <TextField {...p} label="Cliente" placeholder="Digite para buscar..."
              InputProps={{ ...p.InputProps, endAdornment: (<>{loadingClientes ? <CircularProgress size={18} /> : null}{p.InputProps.endAdornment}</>) }} />
          )}
        />

        {/* Produto */}
        <Autocomplete size="small" sx={{ mb: 2.5 }}
          options={produtos}
          getOptionLabel={o => o.descricao || o.nome || ''}
          filterOptions={x => x}
          loading={loadingProdutos}
          onInputChange={(_, v) => setProdutoInput(v)}
          onChange={(_, v) => setProdutoId(v?.id_produto || null)}
          renderInput={p => (
            <TextField {...p} label="Produto" placeholder="Digite para buscar..."
              InputProps={{ ...p.InputProps, endAdornment: (<>{loadingProdutos ? <CircularProgress size={18} /> : null}{p.InputProps.endAdornment}</>) }} />
          )}
        />

        {/* Grupo de Produtos */}
        <TextField select label="Grupo de Produtos" fullWidth size="small" sx={{ mb: 2.5 }}
          value={grupoId} onChange={e => setGrupoId(e.target.value)}>
          <MenuItem value="">Todos</MenuItem>
          {(filterData?.grupos || []).map(g => (
            <MenuItem key={g.id_grupo} value={g.id_grupo}>{g.nome_grupo}</MenuItem>
          ))}
        </TextField>

        {/* Status */}
        <TextField select label="Status" fullWidth size="small" sx={{ mb: 2.5 }}
          value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}>
          <MenuItem value="todos">Todos</MenuItem>
          <MenuItem value="aberta">Aberta</MenuItem>
          <MenuItem value="faturada">Faturada</MenuItem>
          <MenuItem value="cancelada">Cancelada</MenuItem>
        </TextField>

        {/* Vendedor */}
        <TextField select label="Vendedor" fullWidth size="small" sx={{ mb: 2.5 }}
          value={vendedorId} onChange={e => setVendedorId(e.target.value)}>
          <MenuItem value="">Todos</MenuItem>
          {(filterData?.vendedores || []).map(v => (
            <MenuItem key={v.id_vendedor} value={v.id_vendedor}>{v.nome || v.nome_reduzido}</MenuItem>
          ))}
        </TextField>

        {/* Operação */}
        <TextField select label="Operação" fullWidth size="small" sx={{ mb: 2.5 }}
          value={operacaoId} onChange={e => setOperacaoId(e.target.value)}>
          <MenuItem value="">Todas</MenuItem>
          {(filterData?.operacoes || []).map(o => (
            <MenuItem key={o.id_operacao} value={o.id_operacao}>{o.nome_operacao}</MenuItem>
          ))}
        </TextField>

        {/* Forma de Pagamento */}
        <TextField select label="Forma de Pagamento" fullWidth size="small" sx={{ mb: 3 }}
          value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
          <MenuItem value="">Todas</MenuItem>
          <MenuItem value="Dinheiro">Dinheiro</MenuItem>
          <MenuItem value="PIX">PIX</MenuItem>
          <MenuItem value="Cartão Crédito">Cartão Crédito</MenuItem>
          <MenuItem value="Cartão Débito">Cartão Débito</MenuItem>
          <MenuItem value="Boleto">Boleto</MenuItem>
          <MenuItem value="Transferência">Transferência</MenuItem>
          <MenuItem value="Cheque">Cheque</MenuItem>
          <MenuItem value="Crediário">Crediário</MenuItem>
        </TextField>

        {/* Seções do Relatório */}
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            📄 SEÇÕES DO RELATÓRIO
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <MuiLink component="button" variant="body2" underline="hover"
              onClick={() => setSecoes(SECOES_RELATORIO.map(s => s.key))}>Todas</MuiLink>
            <MuiLink component="button" variant="body2" underline="hover"
              onClick={() => setSecoes([])}>Nenhuma</MuiLink>
          </Box>
        </Box>
        {SECOES_RELATORIO.map(s => (
          <FormControlLabel key={s.key} sx={{ display: 'flex', ml: 0, mb: 0.5 }}
            control={<Checkbox checked={secoes.includes(s.key)} onChange={() => toggleSecao(s.key)} color="primary" />}
            label={<Typography variant="body2">{s.icon} {s.label}</Typography>}
          />
        ))}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancelar</Button>
        <Button onClick={handleGerarPDF} variant="contained" startIcon={gerando ? <CircularProgress size={18} color="inherit" /> : <PdfIcon />}
          disabled={!dataInicio || !dataFim || secoes.length === 0 || gerando}>
          {gerando ? 'Gerando...' : 'Gerar PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ==================== DEFINIÇÃO DOS RELATÓRIOS ====================
const RELATORIOS = [
  { key: 'vendas-completa', label: 'Vendas Completa', icon: <PdfIcon />, color: '#c62828', desc: 'Relatório completo em PDF com listagem, resumo por pagamento, grupo, operação, cidade e top clientes', dialog: true },
  { key: 'historico', label: 'Histórico de Vendas', icon: <HistoryIcon />, color: '#1976d2', desc: 'Listagem completa de vendas com filtros por período, vendedor, origem e NF-e' },
  { key: 'lucro', label: 'Lucro', icon: <ProfitIcon />, color: '#2e7d32', desc: 'Análise de lucro por venda com custo, margem e resultado líquido' },
  { key: 'agrupado-dia', label: 'Agrupado por Dia', icon: <CalendarIcon />, color: '#0288d1', desc: 'Total de vendas agrupado por dia com ticket médio e média diária' },
  { key: 'agrupado-dia-desc', label: 'Agrupado por Dia Desc. Encam.', icon: <DiscountIcon />, color: '#6a1b9a', desc: 'Vendas diárias com descontos, valores bruto/líquido e taxa de entrega' },
  { key: 'recibos', label: 'Recibos Gerados', icon: <ReceiptIcon />, color: '#00838f', desc: 'Notas fiscais (NF-e) emitidas no período com protocolo e chave' },
  { key: 'pedidos-data', label: 'Ped. Venda / O.S. - Por Data', icon: <AssignmentIcon />, color: '#455a64', desc: 'Pedidos de venda e ordens de serviço ordenados por data' },
  { key: 'total-quantidade', label: 'Total Vendas C/ Quantidade', icon: <CartIcon />, color: '#7b1fa2', desc: 'Ranking de produtos com quantidade vendida, preço médio e valor total' },
  { key: 'pedidos-abertos', label: 'Ped. Venda / O.S. - Aberta', icon: <PendingIcon />, color: '#e65100', desc: 'Pedidos em aberto aguardando NF-e ou processamento' },
  { key: 'cobrancas', label: 'Cobranças Pendentes', icon: <MoneyIcon />, color: '#d32f2f', desc: 'Contas a receber abertas, vencidas ou pagas com atraso' },
  { key: 'por-cliente', label: 'Vendas por Cliente', icon: <PeopleIcon />, color: '#1565c0', desc: 'Ranking de clientes por valor, quantidade e participação nas vendas' },
  { key: 'cidade-vendedor', label: 'Vendas por Cidade/Vendedor', icon: <CityIcon />, color: '#4527a0', desc: 'Vendas agrupadas por cidade ou vendedor com ticket médio' },
  { key: 'lucro-vendedor', label: 'Lucro por Venda/Vendedor', icon: <PersonSearchIcon />, color: '#1b5e20', desc: 'Lucro e comissão por vendedor com margem e custo detalhado' },
  { key: 'por-caracteristica', label: 'Vendas por Característica', icon: <CategoryIcon />, color: '#bf360c', desc: 'Vendas agrupadas por grupo/característica de produto com participação' },
  { key: 'ultima-compra', label: 'Última Compra do Cliente', icon: <PersonOffIcon />, color: '#ef6c00', desc: 'Clientes ativos e inativos baseado na data da última compra' },
  { key: 'custo-cartao', label: 'Custo Venda Cartão', icon: <CardIcon />, color: '#ad1457', desc: 'Taxas de operadoras de cartão por bandeira, tipo e valor líquido' },
  { key: 'frete', label: 'Frete', icon: <ShippingIcon />, color: '#37474f', desc: 'Relatório de fretes com transportadora, peso, volumes e valores' },
];

// ==================== PÁGINA PRINCIPAL ====================
export default function RelatoriosVendaPage() {
  const navigate = useNavigate();
  const { axiosInstance } = useAuth();
  const [relAtivo, setRelAtivo] = useState(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const filterData = useFilterData(axiosInstance);

  const renderRelatorio = () => {
    const props = { axiosInstance, filterData };
    switch (relAtivo) {
      case 'historico': return <RelHistoricoVendas {...props} />;
      case 'lucro': return <RelLucro {...props} />;
      case 'agrupado-dia': return <RelAgrupadoDia {...props} />;
      case 'agrupado-dia-desc': return <RelAgrupadoDiaDesc {...props} />;
      case 'recibos': return <RelRecibos {...props} />;
      case 'pedidos-data': return <RelPedidosPorData {...props} />;
      case 'total-quantidade': return <RelTotalQuantidade {...props} />;
      case 'pedidos-abertos': return <RelPedidosAbertos {...props} />;
      case 'cobrancas': return <RelCobrancas {...props} />;
      case 'por-cliente': return <RelVendasPorCliente {...props} />;
      case 'cidade-vendedor': return <RelVendasCidadeVendedor {...props} />;
      case 'lucro-vendedor': return <RelLucroVendedor {...props} />;
      case 'por-caracteristica': return <RelVendasCaracteristica {...props} />;
      case 'ultima-compra': return <RelUltimaCompra {...props} />;
      case 'custo-cartao': return <RelCustoCartao {...props} />;
      case 'frete': return <RelFrete {...props} />;
      default: return null;
    }
  };

  if (relAtivo) {
    const rel = RELATORIOS.find(r => r.key === relAtivo);
    return (
      <Box sx={{ p: { xs: 1, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton onClick={() => setRelAtivo(null)}><ArrowBackIcon /></IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: rel.color }}>{rel.icon}</Box>
            <Typography variant="h5" fontWeight="bold">{rel.label}</Typography>
          </Box>
        </Box>
        {renderRelatorio()}
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <StorefrontIcon sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">Relatórios de Venda</Typography>
          <Typography variant="body2" color="text.secondary">17 relatórios disponíveis</Typography>
        </Box>
      </Box>

      <RelatorioCompletoDialog open={dialogAberto} onClose={() => setDialogAberto(false)}
        axiosInstance={axiosInstance} filterData={filterData} />

      <Grid container spacing={2}>
        {RELATORIOS.map(r => (
          <Grid item xs={12} sm={6} md={4} xl={3} key={r.key}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }, ...(r.dialog ? { border: '2px solid', borderColor: r.color } : {}) }} onClick={() => r.dialog ? setDialogAberto(true) : setRelAtivo(r.key)}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ bgcolor: r.color, color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.icon}</Box>
                  <Typography variant="subtitle1" fontWeight="bold">{r.label}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">{r.desc}</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" sx={{ color: r.color }}>Abrir Relatório</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
