import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, IconButton, Stack, Tooltip, FormControl,
  InputLabel, Select, MenuItem, Badge, Alert
} from '@mui/material';
import {
  Add as AddIcon, Refresh as RefreshIcon, CheckCircle as CheckIcon,
  Warning as WarningIcon, Receipt as ReceiptIcon, Security as SecurityIcon,
  AccessTime as ClockIcon, PersonAdd as PersonAddIcon, Calculate as CalcIcon,
  Edit as EditIcon, Delete as DeleteIcon, EventBusy as OcorrenciaIcon,
  ThumbUp as AprovarIcon, ThumbDown as RejeitarIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { useNavigate } from 'react-router-dom';

const fmtMoeda = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

// ── Aba Funcionários ─────────────────────────────────────────────────────────
const AbaFuncionarios = () => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    nome_completo: '', matricula: '', cpf: '', rg: '', cargo: '',
    departamento: '', data_admissao: '', salario_base: '', email: '',
    telefone: '', pis_pasep: '', tipo_contrato: 'CLT',
  });

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/rh/funcionarios/');
      const arr = data?.results ?? data;
      setLista(Array.isArray(arr) ? arr : []);
    } catch { showToast('Erro ao carregar funcionários', 'error'); }
    finally { setLoading(false); }
  }, [axiosInstance, showToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async () => {
    setFormError('');
    if (!form.cpf.trim()) {
      setFormError('CPF é obrigatório.');
      return;
    }
    if (!form.nome_completo.trim()) {
      setFormError('Nome Completo é obrigatório.');
      return;
    }
    if (!form.cargo.trim()) {
      setFormError('Cargo é obrigatório.');
      return;
    }
    if (!form.data_admissao) {
      setFormError('Data de Admissão é obrigatória.');
      return;
    }
    if (!form.salario_base || Number(form.salario_base) < 0) {
      setFormError('Salário Base é obrigatório.');
      return;
    }
    try {
      await axiosInstance.post('/rh/funcionarios/', form);
      showToast('Funcionário cadastrado!', 'success');
      setDialog(false);
      setForm({
        nome_completo: '', matricula: '', cpf: '', rg: '', cargo: '',
        departamento: '', data_admissao: '', salario_base: '', email: '',
        telefone: '', pis_pasep: '', tipo_contrato: 'CLT',
      });
      carregar();
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Erro ao salvar.';
      if (data) {
        const firstKey = Object.keys(data)[0];
        const firstMsg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
        if (firstKey && firstMsg) msg = `${firstKey}: ${firstMsg}`;
      }
      setFormError(msg);
    }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setDialog(true)}>
          Novo Funcionário
        </Button>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Matrícula</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Cargo</TableCell>
                <TableCell>Depto</TableCell>
                <TableCell>Contrato</TableCell>
                <TableCell>Salário</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lista.map((f) => (
                <TableRow key={f.id_funcionario} hover>
                  <TableCell>{f.matricula}</TableCell>
                  <TableCell>{f.nome_completo}</TableCell>
                  <TableCell>{f.cargo}</TableCell>
                  <TableCell>{f.departamento}</TableCell>
                  <TableCell>{f.tipo_contrato}</TableCell>
                  <TableCell>{fmtMoeda(f.salario_base)}</TableCell>
                  <TableCell>
                    <Chip
                      label={f.ativo ? 'Ativo' : 'Inativo'}
                      color={f.ativo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialog} onClose={() => { setDialog(false); setFormError(''); }} maxWidth="md" fullWidth>
        <DialogTitle>Novo Funcionário</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }} onClose={() => setFormError('')}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2} mt={0}>
            {[
              { k: 'nome_completo', label: 'Nome Completo *', xs: 8 },
              { k: 'matricula', label: 'Matrícula', xs: 4 },
              { k: 'cpf', label: 'CPF *', xs: 4 },
              { k: 'rg', label: 'RG', xs: 4 },
              { k: 'pis_pasep', label: 'PIS/PASEP', xs: 4 },
              { k: 'cargo', label: 'Cargo *', xs: 6 },
              { k: 'departamento', label: 'Departamento', xs: 6 },
              { k: 'data_admissao', label: 'Admissão *', xs: 4, type: 'date' },
              { k: 'salario_base', label: 'Salário Base *', xs: 4, type: 'number' },
              { k: 'email', label: 'E-mail', xs: 6 },
              { k: 'telefone', label: 'Telefone', xs: 4 },
            ].map(({ k, label, xs, type }) => (
              <Grid item xs={xs || 6} key={k}>
                <TextField
                  label={label} fullWidth size="small" type={type || 'text'}
                  value={form[k]} onChange={f(k)}
                  InputLabelProps={type === 'date' ? { shrink: true } : undefined}
                  required={label.endsWith('*')}
                />
              </Grid>
            ))}
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Contrato</InputLabel>
                <Select value={form.tipo_contrato} onChange={f('tipo_contrato')} label="Contrato">
                  {['CLT', 'PJ', 'ESTAGIO', 'APRENDIZ', 'TEMPORARIO'].map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvar}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Aba Holerites ────────────────────────────────────────────────────────────
const AbaHolerites = () => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const [lista, setLista] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [funcId, setFuncId] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [h, f] = await Promise.all([
        axiosInstance.get(`/rh/holerites/?mes=${mes}&ano=${ano}`),
        axiosInstance.get('/rh/funcionarios/'),
      ]);
      const hArr = h.data?.results ?? h.data;
      const fArr = f.data?.results ?? f.data;
      setLista(Array.isArray(hArr) ? hArr : []);
      setFuncionarios(Array.isArray(fArr) ? fArr : []);
    } catch {
      // Tenta carregar funcionários mesmo se holerites falhar
      try {
        const f = await axiosInstance.get('/rh/funcionarios/');
        const fArr = f.data?.results ?? f.data;
        setFuncionarios(Array.isArray(fArr) ? fArr : []);
      } catch { /* ignore */ }
      showToast('Erro ao carregar holerites', 'error');
    }
    finally { setLoading(false); }
  }, [axiosInstance, showToast, mes, ano]);

  useEffect(() => { carregar(); }, [carregar]);

  const calcular = async () => {
    if (!funcId) return showToast('Selecione um funcionário', 'warning');
    try {
      await axiosInstance.post('/rh/holerites/calcular/', {
        funcionario_id: funcId, mes, ano,
      });
      showToast('Holerite calculado!', 'success');
      carregar();
    } catch (e) { showToast(e.response?.data?.erro || 'Erro', 'error'); }
  };

  const aprovar = async (id) => {
    try {
      await axiosInstance.post(`/rh/holerites/${id}/aprovar/`);
      showToast('Holerite aprovado!', 'success');
      carregar();
    } catch (e) { showToast(e.response?.data?.erro || 'Erro', 'error'); }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <InputLabel>Mês</InputLabel>
          <Select value={mes} onChange={(e) => setMes(e.target.value)} label="Mês">
            {[...Array(12)].map((_, i) => (
              <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Ano" type="number" size="small" value={ano}
          onChange={(e) => setAno(e.target.value)} sx={{ width: 90 }}
        />
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Funcionário</InputLabel>
          <Select value={funcId} onChange={(e) => setFuncId(e.target.value)} label="Funcionário">
            <MenuItem value="">— todos —</MenuItem>
            {funcionarios.map((f) => (
              <MenuItem key={f.id_funcionario} value={f.id_funcionario}>{f.nome_completo}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<CalcIcon />} onClick={calcular}>
          Calcular
        </Button>
        <IconButton onClick={carregar} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
        </IconButton>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Funcionário</TableCell>
              <TableCell>Competência</TableCell>
              <TableCell align="right">Salário</TableCell>
              <TableCell align="right">INSS</TableCell>
              <TableCell align="right">IRRF</TableCell>
              <TableCell align="right">FGTS</TableCell>
              <TableCell align="right">Líquido</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lista.map((h) => (
              <TableRow key={h.id_holerite} hover>
                <TableCell>{h.funcionario_nome}</TableCell>
                <TableCell>{h.competencia || `${String(h.mes).padStart(2,'0')}/${h.ano}`}</TableCell>
                <TableCell align="right">{fmtMoeda(h.salario_base)}</TableCell>
                <TableCell align="right">{fmtMoeda(h.inss)}</TableCell>
                <TableCell align="right">{fmtMoeda(h.irrf)}</TableCell>
                <TableCell align="right">{fmtMoeda(h.fgts)}</TableCell>
                <TableCell align="right"><b>{fmtMoeda(h.salario_liquido)}</b></TableCell>
                <TableCell>
                  <Chip
                    label={h.status}
                    color={h.status === 'APROVADO' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {h.status !== 'APROVADO' && (
                    <Tooltip title="Aprovar">
                      <IconButton size="small" color="success" onClick={() => aprovar(h.id_holerite)}>
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// ── Aba EPI ──────────────────────────────────────────────────────────────────
const EPI_FORM_VAZIO = {
  nome: '', ca: '', categoria: '', descricao: '',
  validade_dias: 365, estoque_atual: 0, estoque_minimo: 1, ativo: true,
};
const AbaEPI = () => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const [epis, setEpis] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [editando, setEditando] = useState(null); // id ou null
  const [form, setForm] = useState(EPI_FORM_VAZIO);
  const [formError, setFormError] = useState('');
  const [entregaDialog, setEntregaDialog] = useState(false);
  const [funcionarios, setFuncionarios] = useState([]);
  const [entregaForm, setEntregaForm] = useState({
    funcionario: '', epi: '', quantidade: 1,
    data_entrega: new Date().toISOString().slice(0, 10), observacao: '',
  });

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [e, a, c, f] = await Promise.all([
        axiosInstance.get('/rh/epis/'),
        axiosInstance.get('/rh/epis/alertas_estoque/').catch(() => ({ data: [] })),
        axiosInstance.get('/rh/categorias-epi/'),
        axiosInstance.get('/rh/funcionarios/'),
      ]);
      setEpis(Array.isArray(e.data?.results ?? e.data) ? (e.data?.results ?? e.data) : []);
      setAlertas(Array.isArray(a.data) ? a.data : []);
      setCategorias(Array.isArray(c.data?.results ?? c.data) ? (c.data?.results ?? c.data) : []);
      setFuncionarios(Array.isArray(f.data?.results ?? f.data) ? (f.data?.results ?? f.data) : []);
    } catch { showToast('Erro ao carregar EPIs', 'error'); }
    finally { setLoading(false); }
  }, [axiosInstance, showToast]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNovo = () => { setEditando(null); setForm(EPI_FORM_VAZIO); setFormError(''); setDialog(true); };
  const abrirEditar = (epi) => {
    setEditando(epi.id_epi);
    setForm({
      nome: epi.nome || '', ca: epi.ca || '',
      categoria: epi.categoria || '', descricao: epi.descricao || '',
      validade_dias: epi.validade_dias || 365,
      estoque_atual: epi.estoque_atual ?? 0,
      estoque_minimo: epi.estoque_minimo ?? 1,
      ativo: epi.ativo ?? true,
    });
    setFormError('');
    setDialog(true);
  };

  const salvar = async () => {
    setFormError('');
    if (!form.nome.trim()) { setFormError('Nome é obrigatório.'); return; }
    try {
      const payload = { ...form, categoria: form.categoria || null };
      if (editando) {
        await axiosInstance.put(`/rh/epis/${editando}/`, payload);
        showToast('EPI atualizado!', 'success');
      } else {
        await axiosInstance.post('/rh/epis/', payload);
        showToast('EPI cadastrado!', 'success');
      }
      setDialog(false);
      carregar();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const k = Object.keys(data)[0];
        setFormError(`${k}: ${Array.isArray(data[k]) ? data[k][0] : data[k]}`);
      } else {
        setFormError('Erro ao salvar.');
      }
    }
  };

  const excluir = async (id) => {
    if (!window.confirm('Excluir este EPI?')) return;
    try {
      await axiosInstance.delete(`/rh/epis/${id}/`);
      showToast('EPI excluído.', 'success');
      carregar();
    } catch { showToast('Erro ao excluir.', 'error'); }
  };

  const registrarEntrega = async () => {
    if (!entregaForm.funcionario || !entregaForm.epi) {
      showToast('Selecione funcionário e EPI.', 'warning'); return;
    }
    try {
      await axiosInstance.post('/rh/entregas-epi/', entregaForm);
      showToast('Entrega registrada!', 'success');
      setEntregaDialog(false);
      setEntregaForm({ funcionario: '', epi: '', quantidade: 1,
        data_entrega: new Date().toISOString().slice(0, 10), observacao: '' });
      carregar();
    } catch (err) {
      const data = err.response?.data;
      const k = data && Object.keys(data)[0];
      showToast(k ? `${k}: ${Array.isArray(data[k]) ? data[k][0] : data[k]}` : 'Erro ao registrar.', 'error');
    }
  };

  const fe = (k) => (ev) => setForm(p => ({ ...p, [k]: ev.target.value }));

  return (
    <Box>
      {/* Alertas de estoque */}
      {alertas.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
          <b>{alertas.length} EPI(s)</b> com estoque abaixo do mínimo:{' '}
          {alertas.map((e) => e.nome).join(', ')}
        </Alert>
      )}

      {/* Barra de ações */}
      <Box display="flex" justifyContent="flex-end" gap={1} mb={1}>
        <Button variant="outlined" startIcon={<SecurityIcon />}
          onClick={() => setEntregaDialog(true)}>
          Registrar Entrega
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
          Novo EPI
        </Button>
        <IconButton onClick={carregar} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
        </IconButton>
      </Box>

      {/* Tabela */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>EPI</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Nº CA</TableCell>
              <TableCell align="right">Estoque</TableCell>
              <TableCell align="right">Mínimo</TableCell>
              <TableCell align="right">Validade (dias)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {epis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  Nenhum EPI cadastrado. Clique em "Novo EPI" para começar.
                </TableCell>
              </TableRow>
            ) : epis.map((e) => (
              <TableRow key={e.id_epi} hover>
                <TableCell><b>{e.nome}</b></TableCell>
                <TableCell>{e.categoria_nome || '—'}</TableCell>
                <TableCell>{e.ca || '—'}</TableCell>
                <TableCell
                  align="right"
                  sx={{ color: e.estoque_atual <= e.estoque_minimo ? 'error.main' : 'success.main', fontWeight: 700 }}
                >
                  {e.estoque_atual}
                </TableCell>
                <TableCell align="right">{e.estoque_minimo}</TableCell>
                <TableCell align="right">{e.validade_dias || '—'}</TableCell>
                <TableCell>
                  <Chip label={e.ativo ? 'Ativo' : 'Inativo'} color={e.ativo ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => abrirEditar(e)}>
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton size="small" color="error" onClick={() => excluir(e.id_epi)}>
                      <WarningIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Novo/Editar EPI */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editando ? 'Editar EPI' : 'Novo EPI'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, mt: 1 }} onClose={() => setFormError('')}>{formError}</Alert>}
          <Grid container spacing={2} mt={0}>
            {[
              { k: 'nome', label: 'Nome do EPI *', xs: 8 },
              { k: 'ca', label: 'Nº CA', xs: 4 },
              { k: 'validade_dias', label: 'Validade (dias)', xs: 4, type: 'number' },
              { k: 'estoque_atual', label: 'Estoque Atual', xs: 4, type: 'number' },
              { k: 'estoque_minimo', label: 'Estoque Mínimo', xs: 4, type: 'number' },
            ].map(({ k, label, xs, type }) => (
              <Grid item xs={xs} key={k}>
                <TextField label={label} fullWidth size="small" type={type || 'text'}
                  value={form[k]} onChange={fe(k)} required={label.endsWith('*')} />
              </Grid>
            ))}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select value={form.categoria} onChange={fe('categoria')} label="Categoria">
                  <MenuItem value="">— sem categoria —</MenuItem>
                  {categorias.map((c) => (
                    <MenuItem key={c.id_categoria} value={c.id_categoria}>{c.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Descrição" fullWidth size="small" multiline rows={2}
                value={form.descricao} onChange={fe('descricao')} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={form.ativo} onChange={(e) => setForm(p => ({ ...p, ativo: e.target.value }))} label="Status">
                  <MenuItem value={true}>Ativo</MenuItem>
                  <MenuItem value={false}>Inativo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvar}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Registrar Entrega */}
      <Dialog open={entregaDialog} onClose={() => setEntregaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Entrega de EPI</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Funcionário *</InputLabel>
                <Select value={entregaForm.funcionario}
                  onChange={(e) => setEntregaForm(p => ({ ...p, funcionario: e.target.value }))}
                  label="Funcionário *">
                  {funcionarios.map((f) => (
                    <MenuItem key={f.id_funcionario} value={f.id_funcionario}>{f.nome_completo}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>EPI *</InputLabel>
                <Select value={entregaForm.epi}
                  onChange={(e) => setEntregaForm(p => ({ ...p, epi: e.target.value }))}
                  label="EPI *">
                  {epis.map((e) => (
                    <MenuItem key={e.id_epi} value={e.id_epi}>{e.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField label="Quantidade" type="number" fullWidth size="small"
                value={entregaForm.quantidade}
                onChange={(e) => setEntregaForm(p => ({ ...p, quantidade: e.target.value }))} />
            </Grid>
            <Grid item xs={8}>
              <TextField label="Data da Entrega" type="date" fullWidth size="small"
                value={entregaForm.data_entrega}
                onChange={(e) => setEntregaForm(p => ({ ...p, data_entrega: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Observação" fullWidth size="small" value={entregaForm.observacao}
                onChange={(e) => setEntregaForm(p => ({ ...p, observacao: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEntregaDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={registrarEntrega}>Registrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Aba Ocorrências ──────────────────────────────────────────────────────────
const TIPO_OCORRENCIA = [
  { key: 'FALTA',             label: 'Falta',                  cor: 'error' },
  { key: 'FALTA_JUSTIFICADA', label: 'Falta Justificada',      cor: 'warning' },
  { key: 'ATESTADO',          label: 'Atestado Médico',        cor: 'info' },
  { key: 'ATESTADO_ODONTO',   label: 'Atestado Odontológico',  cor: 'info' },
  { key: 'AFASTAMENTO',       label: 'Afastamento INSS',       cor: 'secondary' },
  { key: 'FERIAS',            label: 'Férias',                 cor: 'success' },
  { key: 'LICENCA',           label: 'Licença',                cor: 'default' },
  { key: 'ATRASO',            label: 'Atraso',                 cor: 'warning' },
  { key: 'SAIDA_ANTECIPADA',  label: 'Saída Antecipada',       cor: 'warning' },
  { key: 'OUTROS',            label: 'Outros',                 cor: 'default' },
];

const STATUS_OC_COR = { PENDENTE: 'warning', APROVADO: 'success', REJEITADO: 'error' };

const AbaOcorrencias = () => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  const hojeStr = new Date().toISOString().slice(0, 10);

  const [lista, setLista] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState({ funcionario: '', tipo: '', status: '' });
  const [dialog, setDialog] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    funcionario: '', tipo: 'FALTA', data_inicio: hojeStr, data_fim: hojeStr,
    dias: 1, descricao: '', desconta_salario: false, status: 'PENDENTE',
  });
  const [formError, setFormError] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtro.funcionario) params.set('funcionario', filtro.funcionario);
      if (filtro.tipo) params.set('tipo', filtro.tipo);
      if (filtro.status) params.set('status', filtro.status);
      const { data } = await axiosInstance.get(`/rh/ocorrencias/?${params}`);
      const arr = data?.results ?? data;
      setLista(Array.isArray(arr) ? arr : []);
    } catch { showToast('Erro ao carregar ocorrências', 'error'); }
    finally { setLoading(false); }
  }, [axiosInstance, showToast, filtro]);

  useEffect(() => {
    axiosInstance.get('/rh/funcionarios/')
      .then(({ data }) => { const arr = data?.results ?? data; setFuncionarios(Array.isArray(arr) ? arr : []); })
      .catch(() => {});
  }, [axiosInstance]);

  useEffect(() => { carregar(); }, [carregar]);

  const setDatas = (campo, valor) => {
    setForm(prev => {
      const atualizado = { ...prev, [campo]: valor };
      const ini = new Date(atualizado.data_inicio);
      const fim = new Date(atualizado.data_fim);
      if (fim >= ini) atualizado.dias = Math.floor((fim - ini) / 86400000) + 1;
      return atualizado;
    });
  };

  const abrirNova = () => {
    setEditando(null);
    setForm({ funcionario: '', tipo: 'FALTA', data_inicio: hojeStr, data_fim: hojeStr,
      dias: 1, descricao: '', desconta_salario: false, status: 'PENDENTE' });
    setFormError('');
    setDialog(true);
  };

  const abrirEditar = (oc) => {
    setEditando(oc.id_ocorrencia);
    setForm({ funcionario: oc.funcionario, tipo: oc.tipo, data_inicio: oc.data_inicio,
      data_fim: oc.data_fim, dias: oc.dias, descricao: oc.descricao || '',
      desconta_salario: oc.desconta_salario, status: oc.status });
    setFormError('');
    setDialog(true);
  };

  const salvar = async () => {
    setFormError('');
    if (!form.funcionario) { setFormError('Selecione o funcionário.'); return; }
    if (!form.data_inicio || !form.data_fim) { setFormError('Datas são obrigatórias.'); return; }
    try {
      if (editando) {
        await axiosInstance.put(`/rh/ocorrencias/${editando}/`, form);
        showToast('Ocorrência atualizada!', 'success');
      } else {
        await axiosInstance.post('/rh/ocorrencias/', form);
        showToast('Ocorrência registrada!', 'success');
      }
      setDialog(false);
      carregar();
    } catch (e) {
      setFormError(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Erro ao salvar.');
    }
  };

  const excluir = async (id) => {
    if (!window.confirm('Excluir esta ocorrência?')) return;
    try {
      await axiosInstance.delete(`/rh/ocorrencias/${id}/`);
      showToast('Excluído!', 'success');
      carregar();
    } catch { showToast('Erro ao excluir', 'error'); }
  };

  const mudarStatus = async (id, acao) => {
    try {
      await axiosInstance.post(`/rh/ocorrencias/${id}/${acao}/`);
      showToast(acao === 'aprovar' ? 'Aprovado!' : 'Rejeitado!', 'success');
      carregar();
    } catch { showToast('Erro', 'error'); }
  };

  const tipoInfo = (key) => TIPO_OCORRENCIA.find(t => t.key === key) || { label: key, cor: 'default' };

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700}>Ocorrências / Atestados / Faltas</Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<RefreshIcon />} onClick={carregar} variant="outlined">Atualizar</Button>
          <Button size="small" startIcon={<AddIcon />} onClick={abrirNova} variant="contained">Nova Ocorrência</Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }} elevation={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Funcionário</InputLabel>
            <Select value={filtro.funcionario}
              onChange={(e) => setFiltro(p => ({ ...p, funcionario: e.target.value }))} label="Funcionário">
              <MenuItem value="">Todos</MenuItem>
              {funcionarios.map((f) => (
                <MenuItem key={f.id_funcionario} value={f.id_funcionario}>{f.nome_completo}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={filtro.tipo} onChange={(e) => setFiltro(p => ({ ...p, tipo: e.target.value }))} label="Tipo">
              <MenuItem value="">Todos</MenuItem>
              {TIPO_OCORRENCIA.map(t => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filtro.status} onChange={(e) => setFiltro(p => ({ ...p, status: e.target.value }))} label="Status">
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="PENDENTE">Pendente</MenuItem>
              <MenuItem value="APROVADO">Aprovado</MenuItem>
              <MenuItem value="REJEITADO">Rejeitado</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
      ) : lista.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={4}>Nenhuma ocorrência encontrada.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                <TableCell><b>Funcionário</b></TableCell>
                <TableCell><b>Tipo</b></TableCell>
                <TableCell><b>Período</b></TableCell>
                <TableCell><b>Dias</b></TableCell>
                <TableCell><b>Desconta</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Descrição</b></TableCell>
                <TableCell align="right"><b>Ações</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lista.map((oc) => {
                const t = tipoInfo(oc.tipo);
                return (
                  <TableRow key={oc.id_ocorrencia} hover>
                    <TableCell>{oc.funcionario_nome}</TableCell>
                    <TableCell><Chip label={t.label} color={t.cor} size="small" /></TableCell>
                    <TableCell>
                      {fmtData(oc.data_inicio)}{oc.data_fim !== oc.data_inicio ? ` → ${fmtData(oc.data_fim)}` : ''}
                    </TableCell>
                    <TableCell>{oc.dias}</TableCell>
                    <TableCell>
                      <Chip label={oc.desconta_salario ? 'Sim' : 'Não'}
                        color={oc.desconta_salario ? 'error' : 'default'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={oc.status_display || oc.status}
                        color={STATUS_OC_COR[oc.status] || 'default'} size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 180 }}>
                      <Typography variant="caption" noWrap>{oc.descricao || '—'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {oc.status === 'PENDENTE' && (
                          <>
                            <Tooltip title="Aprovar">
                              <IconButton size="small" color="success"
                                onClick={() => mudarStatus(oc.id_ocorrencia, 'aprovar')}>
                                <AprovarIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Rejeitar">
                              <IconButton size="small" color="error"
                                onClick={() => mudarStatus(oc.id_ocorrencia, 'rejeitar')}>
                                <RejeitarIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => abrirEditar(oc)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton size="small" color="error" onClick={() => excluir(oc.id_ocorrencia)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editando ? 'Editar Ocorrência' : 'Nova Ocorrência'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} mt={0}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Funcionário *</InputLabel>
                <Select value={form.funcionario}
                  onChange={(e) => setForm(p => ({ ...p, funcionario: e.target.value }))} label="Funcionário *">
                  {funcionarios.map(f => (
                    <MenuItem key={f.id_funcionario} value={f.id_funcionario}>{f.nome_completo}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo *</InputLabel>
                <Select value={form.tipo}
                  onChange={(e) => setForm(p => ({ ...p, tipo: e.target.value }))} label="Tipo *">
                  {TIPO_OCORRENCIA.map(t => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={form.status}
                  onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))} label="Status">
                  <MenuItem value="PENDENTE">Pendente</MenuItem>
                  <MenuItem value="APROVADO">Aprovado</MenuItem>
                  <MenuItem value="REJEITADO">Rejeitado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={5}>
              <TextField label="Data Início *" type="date" fullWidth size="small"
                value={form.data_inicio} onChange={(e) => setDatas('data_inicio', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={5}>
              <TextField label="Data Fim *" type="date" fullWidth size="small"
                value={form.data_fim} onChange={(e) => setDatas('data_fim', e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={2}>
              <TextField label="Dias" type="number" fullWidth size="small"
                value={form.dias} onChange={(e) => setForm(p => ({ ...p, dias: Number(e.target.value) }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Descrição / Observação" fullWidth size="small" multiline rows={2}
                value={form.descricao} onChange={(e) => setForm(p => ({ ...p, descricao: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Desconta salário?</InputLabel>
                <Select value={form.desconta_salario}
                  onChange={(e) => setForm(p => ({ ...p, desconta_salario: e.target.value }))}
                  label="Desconta salário?">
                  <MenuItem value={false}>Não (Justificado / Atestado)</MenuItem>
                  <MenuItem value={true}>Sim (Falta injustificada)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvar}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Página Principal ──────────────────────────────────────────────────────────
const RHPage = () => {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        Recursos Humanos
      </Typography>
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<PersonAddIcon />} label="Funcionários" iconPosition="start" />
          <Tab icon={<ReceiptIcon />} label="Holerites" iconPosition="start" />
          <Tab icon={<OcorrenciaIcon />} label="Ocorrências" iconPosition="start" />
          <Tab icon={<SecurityIcon />} label="EPIs" iconPosition="start" />
          <Tab icon={<ClockIcon />} label="Ponto" iconPosition="start" />
        </Tabs>
      </Paper>
      {tab === 0 && <AbaFuncionarios />}
      {tab === 1 && <AbaHolerites />}
      {tab === 2 && <AbaOcorrencias />}
      {tab === 3 && <AbaEPI />}
      {tab === 4 && (
        <Box textAlign="center" py={4}>
          <ClockIcon sx={{ fontSize: 64, color: '#1565C0', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} mb={1}>Controle de Ponto</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Registre entradas, saídas e almoço direto pelo app mobile com captura de GPS.
          </Typography>
          <Button variant="contained" size="large" startIcon={<ClockIcon />}
            onClick={() => navigate('/ponto')}
            sx={{ borderRadius: 3, px: 4, py: 1.5, fontWeight: 700 }}>
            Abrir Terminal de Ponto
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default RHPage;
