import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, CardActions,
  Button, Divider, Chip, CircularProgress, Alert, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, IconButton, Tabs, Tab,
  Tooltip, Collapse, MenuItem, LinearProgress
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  VerticalAlignCenter as MinMaxIcon,
  ListAlt as ListIcon,
  AssignmentReturn as ReturnIcon,
  ShoppingCart as CartIcon,
  AccountBalance as FiscalIcon,
  SwapHoriz as SwapIcon,
  Category as GroupIcon,
  EventBusy as ExpiryIcon,
  TrendingUp as ProfitIcon,
  Assessment as ValueIcon,
  Speed as SpeedIcon,
  EmojiEvents as TrophyIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  PictureAsPdf as PdfIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalOffer as TagIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { visualizarPDF, compartilharPDF } from '../utils/pdfDownload';

const fmtMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = (v, d = 2) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtData = (d) => { if (!d) return '—'; return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); };

function AtalhosPeriodo({ onSelect }) {
  const hoje = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const atalhos = [
    { label: '7 dias', fn: () => { const d = new Date(); d.setDate(d.getDate() - 7); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: '30 dias', fn: () => { const d = new Date(); d.setDate(d.getDate() - 30); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: '90 dias', fn: () => { const d = new Date(); d.setDate(d.getDate() - 90); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: '6 meses', fn: () => { const d = new Date(); d.setMonth(d.getMonth() - 6); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: '12 meses', fn: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
    { label: 'Ano atual', fn: () => { const d = new Date(hoje.getFullYear(), 0, 1); return { data_inicio: fmt(d), data_fim: fmt(hoje) }; } },
  ];
  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
      {atalhos.map(a => (
        <Chip key={a.label} label={a.label} size="small" variant="outlined" clickable onClick={() => onSelect(a.fn())} sx={{ fontSize: '0.7rem' }} />
      ))}
    </Box>
  );
}

function gerarPDF(titulo, colunas, linhas, resumo = null) {
  const doc = new jsPDF({ orientation: linhas[0]?.length > 6 ? 'landscape' : 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('APERUS', 14, 18);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(titulo, 14, 26);
  doc.setFontSize(8);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW - 14, 18, { align: 'right' });
  let startY = 32;
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

// Chip de nível
const nivelColor = { BAIXO: 'error', NORMAL: 'success', ALTO: 'warning', ABAIXO_MINIMO: 'error', ACIMA_MAXIMO: 'warning', SEM_LIMITE: 'default', OK: 'success', VENCIDO: 'error', PROXIMO: 'warning' };
const NivelChip = ({ nivel }) => <Chip label={nivel} size="small" color={nivelColor[nivel] || 'default'} />;

// ==================== RESUMO CARD ====================
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

// ==================== 1) NÍVEL DO ESTOQUE ====================
function RelNivelEstoque({ axiosInstance, depositos, grupos }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ id_deposito: '', id_grupo: '', nivel: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/nivel-estoque/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Depósito" value={filtros.id_deposito} onChange={e => setFiltros(f => ({ ...f, id_deposito: e.target.value }))}><MenuItem value="">Todos</MenuItem>{depositos.map(d => <MenuItem key={d.id_deposito} value={d.id_deposito}>{d.nome_deposito}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Grupo" value={filtros.id_grupo} onChange={e => setFiltros(f => ({ ...f, id_grupo: e.target.value }))}><MenuItem value="">Todos</MenuItem>{grupos.map(g => <MenuItem key={g.id_grupo} value={g.id_grupo}>{g.nome_grupo}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={3}><TextField select fullWidth size="small" label="Nível" value={filtros.nivel} onChange={e => setFiltros(f => ({ ...f, nivel: e.target.value }))}><MenuItem value="">Todos</MenuItem><MenuItem value="BAIXO">Baixo</MenuItem><MenuItem value="NORMAL">Normal</MenuItem><MenuItem value="ALTO">Alto</MenuItem></TextField></Grid>
        <Grid item xs={12} sm={1}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Total', value: dados.resumo.total },
          { label: 'Baixo', value: dados.resumo.baixo, color: '#ffebee' },
          { label: 'Normal', value: dados.resumo.normal, color: '#e8f5e9' },
          { label: 'Alto', value: dados.resumo.alto, color: '#fff3e0' },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Nível do Estoque', ['Código', 'Produto', 'Depósito', 'Qtd', 'Mín', 'Máx', 'Nível'], dados.itens.map(i => [i.codigo, i.nome, i.deposito, fmtNum(i.quantidade), fmtNum(i.quantidade_minima), fmtNum(i.quantidade_maxima), i.nivel]), `Total: ${dados.resumo.total} | Baixo: ${dados.resumo.baixo} | Normal: ${dados.resumo.normal} | Alto: ${dados.resumo.alto}`)}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Produto</TableCell><TableCell>Depósito</TableCell><TableCell align="right">Qtd</TableCell><TableCell align="right">Mín</TableCell><TableCell align="right">Máx</TableCell><TableCell>Nível</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} sx={{ bgcolor: i.nivel === 'BAIXO' ? '#ffebee' : i.nivel === 'ALTO' ? '#fff3e0' : 'inherit' }}>
                  <TableCell>{i.codigo}</TableCell><TableCell>{i.nome}</TableCell><TableCell>{i.deposito}</TableCell>
                  <TableCell align="right">{fmtNum(i.quantidade)}</TableCell><TableCell align="right">{fmtNum(i.quantidade_minima)}</TableCell><TableCell align="right">{fmtNum(i.quantidade_maxima)}</TableCell>
                  <TableCell><NivelChip nivel={i.nivel} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 2) CUSTO DO ESTOQUE ====================
function RelCustoEstoque({ axiosInstance, depositos, grupos }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ id_deposito: '', id_grupo: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/custo-estoque/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={5}><TextField select fullWidth size="small" label="Depósito" value={filtros.id_deposito} onChange={e => setFiltros(f => ({ ...f, id_deposito: e.target.value }))}><MenuItem value="">Todos</MenuItem>{depositos.map(d => <MenuItem key={d.id_deposito} value={d.id_deposito}>{d.nome_deposito}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={5}><TextField select fullWidth size="small" label="Grupo" value={filtros.id_grupo} onChange={e => setFiltros(f => ({ ...f, id_grupo: e.target.value }))}><MenuItem value="">Todos</MenuItem>{grupos.map(g => <MenuItem key={g.id_grupo} value={g.id_grupo}>{g.nome_grupo}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={2}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Total Itens', value: dados.resumo.total_itens },
          { label: 'Custo Total', value: fmtMoeda(dados.resumo.custo_total_estoque) },
          { label: 'Valor Venda Total', value: fmtMoeda(dados.resumo.valor_venda_total) },
          { label: 'Margem Média', value: fmtNum(dados.resumo.margem_media) + '%' },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Custo do Estoque', ['Código', 'Produto', 'Grupo', 'Depósito', 'Qtd', 'Custo Médio', 'Custo Total', 'Vl. Venda', 'Últ. Compra'], dados.itens.map(i => [i.codigo, i.nome, i.grupo, i.deposito, fmtNum(i.quantidade), fmtMoeda(i.custo_medio), fmtMoeda(i.custo_total), fmtMoeda(i.valor_venda), fmtMoeda(i.valor_ultima_compra)]), `Custo Total: ${fmtMoeda(dados.resumo.custo_total_estoque)} | Margem Média: ${fmtNum(dados.resumo.margem_media)}%`)}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Produto</TableCell><TableCell>Grupo</TableCell><TableCell>Depósito</TableCell><TableCell align="right">Qtd</TableCell><TableCell align="right">Custo Médio</TableCell><TableCell align="right">Custo Total</TableCell><TableCell align="right">Vl. Venda</TableCell><TableCell align="right">Últ. Compra</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell>{i.codigo}</TableCell><TableCell>{i.nome}</TableCell><TableCell>{i.grupo}</TableCell><TableCell>{i.deposito}</TableCell>
                  <TableCell align="right">{fmtNum(i.quantidade)}</TableCell><TableCell align="right">{fmtMoeda(i.custo_medio)}</TableCell><TableCell align="right">{fmtMoeda(i.custo_total)}</TableCell><TableCell align="right">{fmtMoeda(i.valor_venda)}</TableCell><TableCell align="right">{fmtMoeda(i.valor_ultima_compra)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 3) ESTOQUE MÍNIMO/MÁXIMO ====================
function RelEstoqueMinMax({ axiosInstance, depositos }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ id_deposito: '', filtro: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/estoque-min-max/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={5}><TextField select fullWidth size="small" label="Depósito" value={filtros.id_deposito} onChange={e => setFiltros(f => ({ ...f, id_deposito: e.target.value }))}><MenuItem value="">Todos</MenuItem>{depositos.map(d => <MenuItem key={d.id_deposito} value={d.id_deposito}>{d.nome_deposito}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={5}><TextField select fullWidth size="small" label="Situação" value={filtros.filtro} onChange={e => setFiltros(f => ({ ...f, filtro: e.target.value }))}><MenuItem value="">Todos</MenuItem><MenuItem value="abaixo_minimo">Abaixo do Mínimo</MenuItem><MenuItem value="acima_maximo">Acima do Máximo</MenuItem><MenuItem value="sem_limite">Sem Limite Definido</MenuItem></TextField></Grid>
        <Grid item xs={12} sm={2}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Total', value: dados.resumo.total },
          { label: 'Abaixo Mín.', value: dados.resumo.abaixo_minimo, color: '#ffebee' },
          { label: 'Acima Máx.', value: dados.resumo.acima_maximo, color: '#fff3e0' },
          { label: 'OK', value: dados.resumo.ok, color: '#e8f5e9' },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Estoque Mínimo/Máximo', ['Código', 'Produto', 'Depósito', 'Qtd', 'Mín', 'Máx', 'Situação'], dados.itens.map(i => [i.codigo, i.nome, i.deposito, fmtNum(i.quantidade), fmtNum(i.quantidade_minima), fmtNum(i.quantidade_maxima), i.situacao]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Produto</TableCell><TableCell>Depósito</TableCell><TableCell align="right">Qtd</TableCell><TableCell align="right">Mín</TableCell><TableCell align="right">Máx</TableCell><TableCell>Situação</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} sx={{ bgcolor: i.situacao === 'ABAIXO_MINIMO' ? '#ffebee' : i.situacao === 'ACIMA_MAXIMO' ? '#fff3e0' : 'inherit' }}>
                  <TableCell>{i.codigo}</TableCell><TableCell>{i.nome}</TableCell><TableCell>{i.deposito}</TableCell>
                  <TableCell align="right">{fmtNum(i.quantidade)}</TableCell><TableCell align="right">{fmtNum(i.quantidade_minima)}</TableCell><TableCell align="right">{fmtNum(i.quantidade_maxima)}</TableCell>
                  <TableCell><NivelChip nivel={i.situacao} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 4) LISTA DE PREÇO / ESTOQUE ATUAL ====================
function RelListaPreco({ axiosInstance, depositos, grupos }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ id_deposito: '', id_grupo: '', busca: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/lista-preco/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={3}><TextField fullWidth size="small" label="Busca" value={filtros.busca} onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))} /></Grid>
        <Grid item xs={12} sm={3}><TextField select fullWidth size="small" label="Depósito" value={filtros.id_deposito} onChange={e => setFiltros(f => ({ ...f, id_deposito: e.target.value }))}><MenuItem value="">Todos</MenuItem>{depositos.map(d => <MenuItem key={d.id_deposito} value={d.id_deposito}>{d.nome_deposito}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={3}><TextField select fullWidth size="small" label="Grupo" value={filtros.id_grupo} onChange={e => setFiltros(f => ({ ...f, id_grupo: e.target.value }))}><MenuItem value="">Todos</MenuItem>{grupos.map(g => <MenuItem key={g.id_grupo} value={g.id_grupo}>{g.nome_grupo}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={3}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <Typography variant="body2" sx={{ mb: 1 }}>{dados.total} produto(s) encontrado(s)</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Lista de Preço / Estoque Atual', ['Código', 'EAN', 'Produto', 'UN', 'Grupo', 'Qtd', 'Vl. Venda', 'Custo Médio', 'Últ. Compra'], dados.itens.map(i => [i.codigo, i.gtin, i.nome, i.unidade, i.grupo, fmtNum(i.quantidade), fmtMoeda(i.valor_venda), fmtMoeda(i.custo_medio), fmtMoeda(i.valor_ultima_compra)]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Código</TableCell><TableCell>EAN</TableCell><TableCell>Produto</TableCell><TableCell>UN</TableCell><TableCell>Grupo</TableCell><TableCell align="right">Qtd</TableCell><TableCell align="right">Vl. Venda</TableCell><TableCell align="right">Custo Médio</TableCell><TableCell align="right">Últ. Compra</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell>{i.codigo}</TableCell><TableCell sx={{ fontSize: '0.7rem' }}>{i.gtin}</TableCell><TableCell>{i.nome}</TableCell><TableCell>{i.unidade}</TableCell><TableCell>{i.grupo}</TableCell>
                  <TableCell align="right">{fmtNum(i.quantidade)}</TableCell><TableCell align="right">{fmtMoeda(i.valor_venda)}</TableCell><TableCell align="right">{fmtMoeda(i.custo_medio)}</TableCell><TableCell align="right">{fmtMoeda(i.valor_ultima_compra)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 5) DEVOLUÇÕES ====================
function RelDevolucoes({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', tipo: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/devolucoes/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={3}><TextField fullWidth size="small" type="date" label="Data Início" value={filtros.data_inicio} onChange={e => setFiltros(f => ({ ...f, data_inicio: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} sm={3}><TextField fullWidth size="small" type="date" label="Data Fim" value={filtros.data_fim} onChange={e => setFiltros(f => ({ ...f, data_fim: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} sm={3}><TextField select fullWidth size="small" label="Tipo" value={filtros.tipo} onChange={e => setFiltros(f => ({ ...f, tipo: e.target.value }))}><MenuItem value="">Todos</MenuItem><MenuItem value="venda">Venda</MenuItem><MenuItem value="compra">Compra</MenuItem></TextField></Grid>
        <Grid item xs={12} sm={3}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Devoluções', value: dados.resumo.total_devolucoes },
          { label: 'Itens', value: dados.resumo.total_itens },
          { label: 'Valor Total', value: fmtMoeda(dados.resumo.valor_total) },
        ]} />
        {dados.ranking?.length > 0 && <Paper sx={{ p: 1, mb: 1 }}><Typography variant="subtitle2" gutterBottom>Top Produtos Devolvidos</Typography>{dados.ranking.slice(0, 10).map((r, i) => <Chip key={i} label={`${r.produto}: ${fmtNum(r.quantidade)}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)}</Paper>}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Devoluções de Produtos', ['Nº', 'Data', 'Tipo', 'Status', 'Produto', 'Qtd', 'Vl. Unit.', 'Vl. Total'], dados.itens.map(i => [i.numero, fmtData(i.data), i.tipo, i.status, i.nome_produto, fmtNum(i.quantidade), fmtMoeda(i.valor_unitario), fmtMoeda(i.valor_total)]), `Total: ${fmtMoeda(dados.resumo.valor_total)}`)}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Nº</TableCell><TableCell>Data</TableCell><TableCell>Tipo</TableCell><TableCell>Status</TableCell><TableCell>Produto</TableCell><TableCell align="right">Qtd</TableCell><TableCell align="right">Vl. Unit.</TableCell><TableCell align="right">Vl. Total</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell>{i.numero}</TableCell><TableCell>{fmtData(i.data)}</TableCell><TableCell>{i.tipo}</TableCell><TableCell>{i.status}</TableCell><TableCell>{i.nome_produto}</TableCell>
                  <TableCell align="right">{fmtNum(i.quantidade)}</TableCell><TableCell align="right">{fmtMoeda(i.valor_unitario)}</TableCell><TableCell align="right">{fmtMoeda(i.valor_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 6) VALOR PRODUTOS X VENDAS ====================
function RelValorProdutosVendas({ axiosInstance, grupos }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', id_grupo: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/valor-vendas/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={3}><TextField fullWidth size="small" type="date" label="Data Início" value={filtros.data_inicio} onChange={e => setFiltros(f => ({ ...f, data_inicio: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} sm={3}><TextField fullWidth size="small" type="date" label="Data Fim" value={filtros.data_fim} onChange={e => setFiltros(f => ({ ...f, data_fim: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} sm={3}><TextField select fullWidth size="small" label="Grupo" value={filtros.id_grupo} onChange={e => setFiltros(f => ({ ...f, id_grupo: e.target.value }))}><MenuItem value="">Todos</MenuItem>{grupos.map(g => <MenuItem key={g.id_grupo} value={g.id_grupo}>{g.nome_grupo}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={3}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Produtos', value: dados.resumo.total_produtos },
          { label: 'Total Vendas', value: fmtMoeda(dados.resumo.valor_total_vendas) },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Valor Produtos X Vendas', ['Código', 'Produto', 'Grupo', 'Qtd Vendida', 'Total Vendas', 'Preço Médio', 'Nº Vendas', '% Part.'], dados.itens.map(i => [i.codigo, i.nome, i.grupo, fmtNum(i.qtd_vendida), fmtMoeda(i.total_vendas), fmtMoeda(i.preco_medio), i.num_vendas, fmtNum(i.participacao) + '%']), `Período: ${dados.resumo.periodo} | Total: ${fmtMoeda(dados.resumo.valor_total_vendas)}`)}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Produto</TableCell><TableCell>Grupo</TableCell><TableCell align="right">Qtd Vendida</TableCell><TableCell align="right">Total Vendas</TableCell><TableCell align="right">Preço Médio</TableCell><TableCell align="right">Nº Vendas</TableCell><TableCell align="right">% Part.</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell>{i.codigo}</TableCell><TableCell>{i.nome}</TableCell><TableCell>{i.grupo}</TableCell>
                  <TableCell align="right">{fmtNum(i.qtd_vendida)}</TableCell><TableCell align="right">{fmtMoeda(i.total_vendas)}</TableCell><TableCell align="right">{fmtMoeda(i.preco_medio)}</TableCell><TableCell align="right">{i.num_vendas}</TableCell><TableCell align="right">{fmtNum(i.participacao)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 7) PIS/COFINS ====================
function RelPisCofins({ axiosInstance, grupos }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ id_grupo: '', busca: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/pis-cofins/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Busca" value={filtros.busca} onChange={e => setFiltros(f => ({ ...f, busca: e.target.value }))} /></Grid>
        <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Grupo" value={filtros.id_grupo} onChange={e => setFiltros(f => ({ ...f, id_grupo: e.target.value }))}><MenuItem value="">Todos</MenuItem>{grupos.map(g => <MenuItem key={g.id_grupo} value={g.id_grupo}>{g.nome_grupo}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={4}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <Typography variant="body2" sx={{ mb: 1 }}>{dados.total} produto(s)</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('PIS/COFINS', ['Código', 'Produto', 'NCM', 'CEST', 'CST PIS/COF', 'PIS %', 'COFINS %', 'CST ICMS', 'ICMS %', 'CFOP'], dados.itens.map(i => [i.codigo, i.nome, i.ncm, i.cest, i.cst_pis_cofins, fmtNum(i.pis_aliquota), fmtNum(i.cofins_aliquota), i.cst_icms, fmtNum(i.icms_aliquota), i.cfop]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Produto</TableCell><TableCell>NCM</TableCell><TableCell>CEST</TableCell><TableCell>CST PIS/COF</TableCell><TableCell align="right">PIS %</TableCell><TableCell align="right">COFINS %</TableCell><TableCell>CST ICMS</TableCell><TableCell align="right">ICMS %</TableCell><TableCell>CFOP</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell>{i.codigo}</TableCell><TableCell>{i.nome}</TableCell><TableCell>{i.ncm}</TableCell><TableCell>{i.cest}</TableCell><TableCell>{i.cst_pis_cofins}</TableCell>
                  <TableCell align="right">{fmtNum(i.pis_aliquota)}</TableCell><TableCell align="right">{fmtNum(i.cofins_aliquota)}</TableCell><TableCell>{i.cst_icms}</TableCell><TableCell align="right">{fmtNum(i.icms_aliquota)}</TableCell><TableCell>{i.cfop}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 8) ENTRADAS/SAÍDAS/TRANSFERÊNCIA ====================
function RelEntradasSaidas({ axiosInstance, depositos }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', tipo: '', id_deposito: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/entradas-saidas/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" type="date" label="Data Início" value={filtros.data_inicio} onChange={e => setFiltros(f => ({ ...f, data_inicio: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" type="date" label="Data Fim" value={filtros.data_fim} onChange={e => setFiltros(f => ({ ...f, data_fim: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Tipo" value={filtros.tipo} onChange={e => setFiltros(f => ({ ...f, tipo: e.target.value }))}><MenuItem value="">Todos</MenuItem><MenuItem value="ENTRADA">Entrada</MenuItem><MenuItem value="SAIDA">Saída</MenuItem><MenuItem value="TRANSFERENCIA">Transferência</MenuItem><MenuItem value="AJUSTE">Ajuste</MenuItem></TextField></Grid>
        <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Depósito" value={filtros.id_deposito} onChange={e => setFiltros(f => ({ ...f, id_deposito: e.target.value }))}><MenuItem value="">Todos</MenuItem>{depositos.map(d => <MenuItem key={d.id_deposito} value={d.id_deposito}>{d.nome_deposito}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={2}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Movimentações', value: dados.resumo.total_movimentacoes },
          { label: 'Vl. Entradas', value: fmtMoeda(dados.resumo.valor_entradas), color: '#e8f5e9' },
          { label: 'Vl. Saídas', value: fmtMoeda(dados.resumo.valor_saidas), color: '#ffebee' },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Entradas/Saídas/Transferência', ['Data', 'Tipo', 'Doc.', 'Produto', 'Depósito', 'Qtd', 'Custo Unit.', 'Valor Total'], dados.itens.map(i => [i.data, i.tipo, i.documento_numero, i.produto_nome, i.deposito, fmtNum(i.quantidade), fmtMoeda(i.custo_unitario), fmtMoeda(i.valor_total)]), `Entradas: ${fmtMoeda(dados.resumo.valor_entradas)} | Saídas: ${fmtMoeda(dados.resumo.valor_saidas)}`)}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Data</TableCell><TableCell>Tipo</TableCell><TableCell>Doc.</TableCell><TableCell>Produto</TableCell><TableCell>Depósito</TableCell><TableCell align="right">Qtd</TableCell><TableCell align="right">Ant.</TableCell><TableCell align="right">Atual</TableCell><TableCell align="right">Valor</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} sx={{ bgcolor: i.tipo === 'ENTRADA' ? '#e8f5e9' : i.tipo === 'SAIDA' ? '#ffebee' : i.tipo === 'TRANSFERENCIA' ? '#e3f2fd' : 'inherit' }}>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{i.data}</TableCell><TableCell><Chip label={i.tipo} size="small" color={i.tipo === 'ENTRADA' ? 'success' : i.tipo === 'SAIDA' ? 'error' : 'info'} /></TableCell><TableCell>{i.documento_numero}</TableCell><TableCell>{i.produto_nome}</TableCell><TableCell>{i.deposito}</TableCell>
                  <TableCell align="right">{fmtNum(i.quantidade)}</TableCell><TableCell align="right">{fmtNum(i.qtd_anterior)}</TableCell><TableCell align="right">{fmtNum(i.qtd_atual)}</TableCell><TableCell align="right">{fmtMoeda(i.valor_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 9) GRUPO DE PRODUTOS ====================
function RelGrupoProdutos({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  const buscar = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get('/relatorios/produtos/grupo-produtos/');
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <Button variant="contained" onClick={buscar} disabled={loading} sx={{ mb: 1 }}>Carregar Grupos</Button>
      {loading && <LinearProgress />}
      {dados && <>
        <Typography variant="body2" sx={{ mb: 1 }}>{dados.total_grupos} grupo(s)</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Grupo de Produtos', ['Grupo', 'Descrição', 'Qtd Produtos', 'Qtd Estoque', 'Custo Total', 'Valor Venda Total'], dados.itens.map(i => [i.nome_grupo, i.descricao, i.qtd_produtos, fmtNum(i.qtd_estoque), fmtMoeda(i.custo_total), fmtMoeda(i.valor_venda_total)]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Grupo</TableCell><TableCell>Descrição</TableCell><TableCell align="right">Qtd Produtos</TableCell><TableCell align="right">Qtd Estoque</TableCell><TableCell align="right">Custo Total</TableCell><TableCell align="right">Valor Venda Total</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{i.nome_grupo}</TableCell><TableCell>{i.descricao}</TableCell>
                  <TableCell align="right">{i.qtd_produtos}</TableCell><TableCell align="right">{fmtNum(i.qtd_estoque)}</TableCell><TableCell align="right">{fmtMoeda(i.custo_total)}</TableCell><TableCell align="right">{fmtMoeda(i.valor_venda_total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 10) VENCIMENTO ESTOQUE ====================
function RelVencimentoEstoque({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ dias: '90', situacao: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/vencimento-estoque/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Dias p/ vencer" value={filtros.dias} onChange={e => setFiltros(f => ({ ...f, dias: e.target.value }))} /></Grid>
        <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Situação" value={filtros.situacao} onChange={e => setFiltros(f => ({ ...f, situacao: e.target.value }))}><MenuItem value="">Vencidos + Próximos</MenuItem><MenuItem value="vencido">Vencidos</MenuItem><MenuItem value="proximo">Próximos a Vencer</MenuItem><MenuItem value="ok">OK</MenuItem></TextField></Grid>
        <Grid item xs={12} sm={4}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Total', value: dados.resumo.total },
          { label: 'Vencidos', value: dados.resumo.vencidos, color: '#ffebee' },
          { label: 'Próximos', value: dados.resumo.proximos, color: '#fff3e0' },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Vencimento Estoque', ['Produto', 'Código', 'Lote', 'Fabricação', 'Validade', 'Qtd', 'Dias p/ Vencer', 'Situação'], dados.itens.map(i => [i.produto_nome, i.produto_codigo, i.numero_lote, fmtData(i.data_fabricacao), fmtData(i.data_validade), fmtNum(i.quantidade), i.dias_para_vencer, i.situacao]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Produto</TableCell><TableCell>Código</TableCell><TableCell>Lote</TableCell><TableCell>Fabricação</TableCell><TableCell>Validade</TableCell><TableCell align="right">Qtd</TableCell><TableCell align="right">Dias</TableCell><TableCell>Situação</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} sx={{ bgcolor: i.situacao === 'VENCIDO' ? '#ffebee' : i.situacao === 'PROXIMO' ? '#fff3e0' : 'inherit' }}>
                  <TableCell>{i.produto_nome}</TableCell><TableCell>{i.produto_codigo}</TableCell><TableCell>{i.numero_lote}</TableCell><TableCell>{fmtData(i.data_fabricacao)}</TableCell><TableCell>{fmtData(i.data_validade)}</TableCell>
                  <TableCell align="right">{fmtNum(i.quantidade)}</TableCell><TableCell align="right">{i.dias_para_vencer}</TableCell><TableCell><NivelChip nivel={i.situacao} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 11) LUCRO DO ESTOQUE ====================
function RelLucroEstoque({ axiosInstance, depositos, grupos }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ id_deposito: '', id_grupo: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/lucro-estoque/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={5}><TextField select fullWidth size="small" label="Depósito" value={filtros.id_deposito} onChange={e => setFiltros(f => ({ ...f, id_deposito: e.target.value }))}><MenuItem value="">Todos</MenuItem>{depositos.map(d => <MenuItem key={d.id_deposito} value={d.id_deposito}>{d.nome_deposito}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={5}><TextField select fullWidth size="small" label="Grupo" value={filtros.id_grupo} onChange={e => setFiltros(f => ({ ...f, id_grupo: e.target.value }))}><MenuItem value="">Todos</MenuItem>{grupos.map(g => <MenuItem key={g.id_grupo} value={g.id_grupo}>{g.nome_grupo}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={2}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Total Itens', value: dados.resumo.total_itens },
          { label: 'Custo Total', value: fmtMoeda(dados.resumo.custo_total) },
          { label: 'Lucro Total', value: fmtMoeda(dados.resumo.lucro_total), color: '#e8f5e9' },
          { label: 'Margem Média', value: fmtNum(dados.resumo.margem_media) + '%' },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Lucro do Estoque', ['Código', 'Produto', 'Grupo', 'Qtd', 'Custo Médio', 'Vl. Venda', 'Custo Total', 'Venda Total', 'Lucro', 'Margem %'], dados.itens.map(i => [i.codigo, i.nome, i.grupo, fmtNum(i.quantidade), fmtMoeda(i.custo_medio), fmtMoeda(i.valor_venda), fmtMoeda(i.custo_total), fmtMoeda(i.venda_total), fmtMoeda(i.lucro), fmtNum(i.margem) + '%']), `Custo: ${fmtMoeda(dados.resumo.custo_total)} | Lucro: ${fmtMoeda(dados.resumo.lucro_total)} | Margem: ${fmtNum(dados.resumo.margem_media)}%`)}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Produto</TableCell><TableCell>Grupo</TableCell><TableCell align="right">Qtd</TableCell><TableCell align="right">Custo Médio</TableCell><TableCell align="right">Vl. Venda</TableCell><TableCell align="right">Lucro</TableCell><TableCell align="right">Margem %</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} sx={{ bgcolor: i.lucro < 0 ? '#ffebee' : 'inherit' }}>
                  <TableCell>{i.codigo}</TableCell><TableCell>{i.nome}</TableCell><TableCell>{i.grupo}</TableCell>
                  <TableCell align="right">{fmtNum(i.quantidade)}</TableCell><TableCell align="right">{fmtMoeda(i.custo_medio)}</TableCell><TableCell align="right">{fmtMoeda(i.valor_venda)}</TableCell>
                  <TableCell align="right" sx={{ color: i.lucro >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>{fmtMoeda(i.lucro)}</TableCell>
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

// ==================== 12) VALOR DO ESTOQUE ====================
function RelValorEstoque({ axiosInstance, depositos }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ id_deposito: '', tipo_valor: 'custo' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/valor-estoque/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Depósito" value={filtros.id_deposito} onChange={e => setFiltros(f => ({ ...f, id_deposito: e.target.value }))}><MenuItem value="">Todos</MenuItem>{depositos.map(d => <MenuItem key={d.id_deposito} value={d.id_deposito}>{d.nome_deposito}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Tipo Valor" value={filtros.tipo_valor} onChange={e => setFiltros(f => ({ ...f, tipo_valor: e.target.value }))}><MenuItem value="custo">Custo Médio</MenuItem><MenuItem value="venda">Preço de Venda</MenuItem><MenuItem value="compra">Última Compra</MenuItem></TextField></Grid>
        <Grid item xs={12} sm={4}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Total Itens', value: dados.resumo.total_itens },
          { label: `Valor Total (${dados.resumo.tipo_valor})`, value: fmtMoeda(dados.resumo.valor_total) },
        ]} />
        {dados.resumo.por_grupo?.length > 0 && <Paper sx={{ p: 1, mb: 1 }}><Typography variant="subtitle2" gutterBottom>Por Grupo</Typography>{dados.resumo.por_grupo.slice(0, 10).map((g, i) => <Chip key={i} label={`${g.grupo}: ${fmtMoeda(g.valor)}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)}</Paper>}
        {dados.resumo.por_deposito?.length > 0 && <Paper sx={{ p: 1, mb: 1 }}><Typography variant="subtitle2" gutterBottom>Por Depósito</Typography>{dados.resumo.por_deposito.map((d, i) => <Chip key={i} label={`${d.deposito}: ${fmtMoeda(d.valor)}`} size="small" color="info" sx={{ mr: 0.5, mb: 0.5 }} />)}</Paper>}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Valor do Estoque', ['Código', 'Produto', 'Grupo', 'Depósito', 'Qtd', 'Vl. Unit.', 'Vl. Total', '% Part.'], dados.itens.map(i => [i.codigo, i.nome, i.grupo, i.deposito, fmtNum(i.quantidade), fmtMoeda(i.valor_unitario), fmtMoeda(i.valor_total), fmtNum(i.participacao) + '%']), `Valor Total: ${fmtMoeda(dados.resumo.valor_total)} (${dados.resumo.tipo_valor})`)}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Produto</TableCell><TableCell>Grupo</TableCell><TableCell>Depósito</TableCell><TableCell align="right">Qtd</TableCell><TableCell align="right">Vl. Unit.</TableCell><TableCell align="right">Vl. Total</TableCell><TableCell align="right">% Part.</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell>{i.codigo}</TableCell><TableCell>{i.nome}</TableCell><TableCell>{i.grupo}</TableCell><TableCell>{i.deposito}</TableCell>
                  <TableCell align="right">{fmtNum(i.quantidade)}</TableCell><TableCell align="right">{fmtMoeda(i.valor_unitario)}</TableCell><TableCell align="right">{fmtMoeda(i.valor_total)}</TableCell><TableCell align="right">{fmtNum(i.participacao)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 13) BAIXA ROTATIVIDADE ====================
function RelBaixaRotatividade({ axiosInstance, grupos }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ dias: '90', id_grupo: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/baixa-rotatividade/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Dias sem venda" value={filtros.dias} onChange={e => setFiltros(f => ({ ...f, dias: e.target.value }))} /></Grid>
        <Grid item xs={12} sm={4}><TextField select fullWidth size="small" label="Grupo" value={filtros.id_grupo} onChange={e => setFiltros(f => ({ ...f, id_grupo: e.target.value }))}><MenuItem value="">Todos</MenuItem>{grupos.map(g => <MenuItem key={g.id_grupo} value={g.id_grupo}>{g.nome_grupo}</MenuItem>)}</TextField></Grid>
        <Grid item xs={12} sm={4}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Produtos Parados', value: dados.resumo.total_produtos, color: '#fff3e0' },
          { label: 'Capital Parado', value: fmtMoeda(dados.resumo.valor_total_parado), color: '#ffebee' },
          { label: `Sem Venda há ${dados.resumo.dias_referencia}+ dias`, value: dados.resumo.total_produtos },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Produtos C/ Baixa Rotatividade', ['Código', 'Produto', 'Grupo', 'Qtd', 'Custo Médio', 'Vl. Venda', 'Capital Parado', 'Dias s/ Venda', 'Últ. Saída'], dados.itens.map(i => [i.codigo, i.nome, i.grupo, fmtNum(i.quantidade), fmtMoeda(i.custo_medio), fmtMoeda(i.valor_venda), fmtMoeda(i.valor_parado), i.dias_sem_venda, i.ultima_saida]), `Capital Parado: ${fmtMoeda(dados.resumo.valor_total_parado)}`)}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Produto</TableCell><TableCell>Grupo</TableCell><TableCell align="right">Qtd</TableCell><TableCell align="right">Custo Médio</TableCell><TableCell align="right">Capital Parado</TableCell><TableCell align="right">Dias s/ Venda</TableCell><TableCell>Últ. Saída</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell>{i.codigo}</TableCell><TableCell>{i.nome}</TableCell><TableCell>{i.grupo}</TableCell>
                  <TableCell align="right">{fmtNum(i.quantidade)}</TableCell><TableCell align="right">{fmtMoeda(i.custo_medio)}</TableCell><TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>{fmtMoeda(i.valor_parado)}</TableCell>
                  <TableCell align="right">{i.dias_sem_venda}</TableCell><TableCell>{i.ultima_saida}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 14) MAIS VENDIDOS ====================
function RelMaisVendidos({ axiosInstance, grupos }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', id_grupo: '', limite: '50' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/mais-vendidos/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" type="date" label="Data Início" value={filtros.data_inicio} onChange={e => setFiltros(f => ({ ...f, data_inicio: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" type="date" label="Data Fim" value={filtros.data_fim} onChange={e => setFiltros(f => ({ ...f, data_fim: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={6} sm={3}><TextField select fullWidth size="small" label="Grupo" value={filtros.id_grupo} onChange={e => setFiltros(f => ({ ...f, id_grupo: e.target.value }))}><MenuItem value="">Todos</MenuItem>{grupos.map(g => <MenuItem key={g.id_grupo} value={g.id_grupo}>{g.nome_grupo}</MenuItem>)}</TextField></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" type="number" label="Top N" value={filtros.limite} onChange={e => setFiltros(f => ({ ...f, limite: e.target.value }))} /></Grid>
        <Grid item xs={12} sm={3}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Produtos', value: dados.resumo.total_produtos },
          { label: 'Total Vendas', value: fmtMoeda(dados.resumo.valor_total_vendas) },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Produtos Mais Vendidos', ['#', 'Código', 'Produto', 'Grupo', 'UN', 'Qtd Vendida', 'Total Vendas', 'Preço Médio', '% Part.'], dados.itens.map(i => [i.ranking, i.codigo, i.nome, i.grupo, i.unidade, fmtNum(i.qtd_vendida), fmtMoeda(i.total_vendas), fmtMoeda(i.preco_medio), fmtNum(i.participacao) + '%']), `Período: ${dados.resumo.periodo} | Total: ${fmtMoeda(dados.resumo.valor_total_vendas)}`)}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>#</TableCell><TableCell>Código</TableCell><TableCell>Produto</TableCell><TableCell>Grupo</TableCell><TableCell>UN</TableCell><TableCell align="right">Qtd Vendida</TableCell><TableCell align="right">Total Vendas</TableCell><TableCell align="right">Preço Médio</TableCell><TableCell align="right">% Part.</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx} sx={{ bgcolor: idx < 3 ? '#fff8e1' : 'inherit' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{i.ranking}º</TableCell><TableCell>{i.codigo}</TableCell><TableCell>{i.nome}</TableCell><TableCell>{i.grupo}</TableCell><TableCell>{i.unidade}</TableCell>
                  <TableCell align="right">{fmtNum(i.qtd_vendida)}</TableCell><TableCell align="right">{fmtMoeda(i.total_vendas)}</TableCell><TableCell align="right">{fmtMoeda(i.preco_medio)}</TableCell><TableCell align="right">{fmtNum(i.participacao)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== 15) PRODUTOS ALTERADOS ====================
function RelProdutosAlterados({ axiosInstance }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '' });

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get('/relatorios/produtos/alterados/', { params });
      setDados(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Box>
      <AtalhosPeriodo onSelect={p => setFiltros(f => ({ ...f, ...p }))} />
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="date" label="Data Início" value={filtros.data_inicio} onChange={e => setFiltros(f => ({ ...f, data_inicio: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="date" label="Data Fim" value={filtros.data_fim} onChange={e => setFiltros(f => ({ ...f, data_fim: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} sm={4}><Button fullWidth variant="contained" onClick={buscar} disabled={loading} sx={{ height: 40 }}>Buscar</Button></Grid>
      </Grid>
      {loading && <LinearProgress />}
      {dados && <>
        <ResumoCards items={[
          { label: 'Produtos Alterados', value: dados.resumo.total_produtos_alterados },
        ]} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button size="small" startIcon={<PdfIcon />} onClick={() => gerarPDF('Produtos Alterados', ['Código', 'Produto', 'Grupo', 'Total Movim.', 'Entradas', 'Saídas', 'Ajustes', 'Transf.', 'Última Movim.'], dados.itens.map(i => [i.codigo, i.nome, i.grupo, i.total_movimentacoes, i.entradas, i.saidas, i.ajustes, i.transferencias, i.ultima_movimentacao]))}>PDF</Button>
        </Box>
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Produto</TableCell><TableCell>Grupo</TableCell><TableCell align="right">Total Movim.</TableCell><TableCell align="right">Entradas</TableCell><TableCell align="right">Saídas</TableCell><TableCell align="right">Ajustes</TableCell><TableCell align="right">Transf.</TableCell><TableCell>Última Movim.</TableCell></TableRow></TableHead>
            <TableBody>
              {dados.itens.map((i, idx) => (
                <TableRow key={idx}>
                  <TableCell>{i.codigo}</TableCell><TableCell>{i.nome}</TableCell><TableCell>{i.grupo}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{i.total_movimentacoes}</TableCell><TableCell align="right" sx={{ color: 'green' }}>{i.entradas}</TableCell><TableCell align="right" sx={{ color: 'red' }}>{i.saidas}</TableCell>
                  <TableCell align="right">{i.ajustes}</TableCell><TableCell align="right">{i.transferencias}</TableCell><TableCell sx={{ fontSize: '0.75rem' }}>{i.ultima_movimentacao}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>}
    </Box>
  );
}

// ==================== DEFINIÇÃO DOS RELATÓRIOS ====================
const RELATORIOS = [
  { key: 'nivel-estoque', label: 'Nível do Estoque', icon: <InventoryIcon />, color: '#1976d2', desc: 'Quantidade atual vs. mínimo e máximo por produto e depósito' },
  { key: 'custo-estoque', label: 'Custo do Estoque', icon: <MoneyIcon />, color: '#2e7d32', desc: 'Custo médio, total e margem de cada produto em estoque' },
  { key: 'estoque-min-max', label: 'Estoque Mínimo/Máximo', icon: <MinMaxIcon />, color: '#ed6c02', desc: 'Produtos abaixo do mínimo ou acima do máximo' },
  { key: 'lista-preco', label: 'Lista de Preço / Estoque Atual', icon: <ListIcon />, color: '#0288d1', desc: 'Listagem completa com preços de venda, custo e estoque' },
  { key: 'devolucoes', label: 'Devoluções', icon: <ReturnIcon />, color: '#d32f2f', desc: 'Devoluções de venda e compra com ranking de produtos' },
  { key: 'valor-vendas', label: 'Valor Produtos X Vendas', icon: <CartIcon />, color: '#7b1fa2', desc: 'Produtos vendidos por valor, quantidade e participação' },
  { key: 'pis-cofins', label: 'PIS/COFINS', icon: <FiscalIcon />, color: '#455a64', desc: 'Configuração tributária: NCM, CST, PIS, COFINS, ICMS, CFOP' },
  { key: 'entradas-saidas', label: 'Entradas/Saídas/Transferência', icon: <SwapIcon />, color: '#00838f', desc: 'Movimentações de estoque por período, tipo e depósito' },
  { key: 'grupo-produtos', label: 'Grupo de Produtos', icon: <GroupIcon />, color: '#6a1b9a', desc: 'Resumo de estoque e valor por grupo de produtos' },
  { key: 'vencimento-estoque', label: 'Vencimento Estoque', icon: <ExpiryIcon />, color: '#e65100', desc: 'Produtos com lotes vencidos ou próximos do vencimento' },
  { key: 'lucro-estoque', label: 'Lucro do Estoque', icon: <ProfitIcon />, color: '#1b5e20', desc: 'Lucro e margem por produto com base no custo médio' },
  { key: 'valor-estoque', label: 'Valor do Estoque', icon: <ValueIcon />, color: '#01579b', desc: 'Valor total do estoque por custo, venda ou última compra' },
  { key: 'baixa-rotatividade', label: 'Produtos C/ Baixa Rotatividade', icon: <SpeedIcon />, color: '#bf360c', desc: 'Produtos sem venda no período — capital parado' },
  { key: 'mais-vendidos', label: 'Produtos Mais Vendidos', icon: <TrophyIcon />, color: '#f9a825', desc: 'Ranking de produtos por quantidade e valor vendido' },
  { key: 'alterados', label: 'Produtos Alterados', icon: <HistoryIcon />, color: '#546e7a', desc: 'Produtos com movimentações recentes no período' },
];

// ==================== PÁGINA PRINCIPAL ====================
export default function RelatoriosProdutoPage() {
  const navigate = useNavigate();
  const { axiosInstance } = useAuth();
  const [relAtivo, setRelAtivo] = useState(null);
  const [depositos, setDepositos] = useState([]);
  const [grupos, setGrupos] = useState([]);

  // Carregar depósitos e grupos para os filtros
  useEffect(() => {
    axiosInstance.get('/depositos/').then(r => {
      const data = r.data?.results || r.data || [];
      setDepositos(Array.isArray(data) ? data : []);
    }).catch(() => {});
    axiosInstance.get('/grupos-produto/').then(r => {
      const data = r.data?.results || r.data || [];
      setGrupos(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const renderRelatorio = () => {
    const props = { axiosInstance, depositos, grupos };
    switch (relAtivo) {
      case 'nivel-estoque': return <RelNivelEstoque {...props} />;
      case 'custo-estoque': return <RelCustoEstoque {...props} />;
      case 'estoque-min-max': return <RelEstoqueMinMax {...props} />;
      case 'lista-preco': return <RelListaPreco {...props} />;
      case 'devolucoes': return <RelDevolucoes axiosInstance={axiosInstance} />;
      case 'valor-vendas': return <RelValorProdutosVendas {...props} />;
      case 'pis-cofins': return <RelPisCofins {...props} />;
      case 'entradas-saidas': return <RelEntradasSaidas {...props} />;
      case 'grupo-produtos': return <RelGrupoProdutos axiosInstance={axiosInstance} />;
      case 'vencimento-estoque': return <RelVencimentoEstoque axiosInstance={axiosInstance} />;
      case 'lucro-estoque': return <RelLucroEstoque {...props} />;
      case 'valor-estoque': return <RelValorEstoque {...props} />;
      case 'baixa-rotatividade': return <RelBaixaRotatividade {...props} />;
      case 'mais-vendidos': return <RelMaisVendidos {...props} />;
      case 'alterados': return <RelProdutosAlterados axiosInstance={axiosInstance} />;
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
        <TagIcon sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">Relatórios de Produto</Typography>
          <Typography variant="body2" color="text.secondary">15 relatórios disponíveis</Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {RELATORIOS.map(r => (
          <Grid item xs={12} sm={6} md={4} xl={3} key={r.key}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }} onClick={() => setRelAtivo(r.key)}>
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
