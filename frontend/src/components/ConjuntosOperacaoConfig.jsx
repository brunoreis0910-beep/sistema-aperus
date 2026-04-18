import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Paper, Typography, Button, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, Alert, CircularProgress, Tooltip,
  Autocomplete, Switch, FormControlLabel, Divider,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Settings as SettingsIcon, CheckCircle, Cancel,
} from '@mui/icons-material';

const API = '/api';

const empty = { nome_conjunto: '', descricao: '', operacoes_ids: [], ativo: true };

export default function ConjuntosOperacaoConfig() {
  const [conjuntos, setConjuntos] = useState([]);
  const [operacoes, setOperacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = novo, objeto = editar
  const [form, setForm] = useState(empty);
  const [selectedOps, setSelectedOps] = useState([]); // objetos Operacao selecionados

  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cR, oR] = await Promise.all([
        axios.get(`${API}/conjuntos-operacoes/`),
        axios.get(`${API}/operacoes/`),
      ]);
      setConjuntos(Array.isArray(cR.data) ? cR.data : (cR.data?.results ?? []));
      setOperacoes(Array.isArray(oR.data) ? oR.data : (oR.data?.results ?? []));
    } catch (e) {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditing(null);
    setForm(empty);
    setSelectedOps([]);
    setOpen(true);
  };

  const handleEdit = (conj) => {
    setEditing(conj);
    setForm({
      nome_conjunto: conj.nome_conjunto,
      descricao: conj.descricao || '',
      ativo: conj.ativo,
    });
    // operacoes já vêm como objetos completos do serializer
    setSelectedOps(conj.operacoes || []);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setForm(empty);
    setSelectedOps([]);
  };

  const handleSave = async () => {
    if (!form.nome_conjunto.trim()) {
      setError('Nome do conjunto é obrigatório.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        nome_conjunto: form.nome_conjunto.trim(),
        descricao: form.descricao.trim(),
        ativo: form.ativo,
        operacoes_ids: selectedOps.map(o => o.id_operacao),
      };
      if (editing) {
        await axios.patch(`${API}/conjuntos-operacoes/${editing.id_conjunto}/`, payload);
        setSuccess('Conjunto atualizado com sucesso!');
      } else {
        await axios.post(`${API}/conjuntos-operacoes/`, payload);
        setSuccess('Conjunto criado com sucesso!');
      }
      handleClose();
      fetchAll();
    } catch (e) {
      setError('Erro ao salvar: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/conjuntos-operacoes/${id}/`);
      setSuccess('Conjunto excluído.');
      setConfirmDelete(null);
      fetchAll();
    } catch (e) {
      setError('Erro ao excluir.');
    }
  };

  const handleToggleAtivo = async (conj) => {
    try {
      await axios.patch(`${API}/conjuntos-operacoes/${conj.id_conjunto}/`, { ativo: !conj.ativo });
      fetchAll();
    } catch (e) {
      setError('Erro ao alterar status.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon /> Conjuntos de Operações
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNew}>
          Novo Conjunto
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Alert severity="info" sx={{ mb: 2 }}>
        Os conjuntos criados aqui ficam disponíveis para seleção no SPED Contribuições (PIS/COFINS).
        Agrupe operações (ex: Vendas, Devoluções) em um conjunto para gerar o arquivo de cada grupo.
      </Alert>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Nome do Conjunto</b></TableCell>
                <TableCell><b>Descrição</b></TableCell>
                <TableCell><b>Operações</b></TableCell>
                <TableCell align="center"><b>Ativo</b></TableCell>
                <TableCell align="center"><b>Ações</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conjuntos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                    Nenhum conjunto cadastrado. Clique em "Novo Conjunto" para criar.
                  </TableCell>
                </TableRow>
              ) : conjuntos.map(conj => (
                <TableRow key={conj.id_conjunto} hover>
                  <TableCell>{conj.id_conjunto}</TableCell>
                  <TableCell><b>{conj.nome_conjunto}</b></TableCell>
                  <TableCell sx={{ color: 'text.secondary', maxWidth: 200 }}>
                    {conj.descricao || <i>—</i>}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(conj.operacoes || []).length === 0
                        ? <Chip label="Nenhuma" size="small" variant="outlined" />
                        : (conj.operacoes || []).map(op => (
                          <Chip key={op.id_operacao} label={op.nome_operacao} size="small" color="primary" variant="outlined" />
                        ))
                      }
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={conj.ativo ? 'Clique para desativar' : 'Clique para ativar'}>
                      <IconButton size="small" onClick={() => handleToggleAtivo(conj)}>
                        {conj.ativo
                          ? <CheckCircle color="success" />
                          : <Cancel color="disabled" />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleEdit(conj)}><EditIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton size="small" color="error" onClick={() => setConfirmDelete(conj)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Criar/Editar */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? `Editar: ${editing.nome_conjunto}` : 'Novo Conjunto de Operações'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nome do Conjunto *"
              value={form.nome_conjunto}
              onChange={e => setForm(f => ({ ...f, nome_conjunto: e.target.value }))}
              fullWidth
              size="small"
              placeholder="Ex: Vendas Varejo, Entradas, Devoluções..."
            />
            <TextField
              label="Descrição"
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={2}
              placeholder="Descreva o propósito deste conjunto..."
            />
            <Divider />
            <Autocomplete
              multiple
              options={operacoes}
              getOptionLabel={op => `${op.nome_operacao}${op.abreviacao ? ' (' + op.abreviacao + ')' : ''}`}
              value={selectedOps}
              onChange={(_, newVal) => setSelectedOps(newVal)}
              isOptionEqualToValue={(opt, val) => opt.id_operacao === val.id_operacao}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Operações do Conjunto"
                  placeholder="Selecione as operações..."
                  size="small"
                  helperText="Operações que farão parte deste conjunto"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((op, index) => (
                  <Chip
                    key={op.id_operacao}
                    label={op.nome_operacao}
                    size="small"
                    color="primary"
                    variant="outlined"
                    {...getTagProps({ index })}
                  />
                ))
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.ativo}
                  onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                  color="success"
                />
              }
              label={form.ativo ? 'Ativo' : 'Inativo'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !form.nome_conjunto.trim()}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? 'Salvando...' : (editing ? 'Salvar Alterações' : 'Criar Conjunto')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja excluir o conjunto <b>{confirmDelete?.nome_conjunto}</b>?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button
            onClick={() => handleDelete(confirmDelete?.id_conjunto)}
            variant="contained"
            color="error"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
