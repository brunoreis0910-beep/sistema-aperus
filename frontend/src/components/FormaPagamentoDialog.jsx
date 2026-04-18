import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Grid } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function FormaPagamentoDialog({ open, onClose, onSaveSuccess, itemToEdit, departamentos = [], centrosCusto = [], contasBancarias = [] }) {
  const { axiosInstance } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: '', quantidade_dias: 0, id_conta_padrao: null, id_centro_custo: null, id_departamento: null });

  useEffect(() => {
    if (itemToEdit) {
      const raw = itemToEdit.raw || itemToEdit;
      setForm({
        nome: itemToEdit.nome || raw.nome_forma || raw.nome || raw.descricao || '',
        quantidade_dias: itemToEdit.quantidade_dias ?? (raw.quantidade_dias ?? raw.dias ?? raw.qtd_dias ?? raw.dias_vencimento ?? 0),
        id_conta_padrao: (raw.id_conta_padrao !== undefined && raw.id_conta_padrao !== null) ? raw.id_conta_padrao : (raw.id_conta_padrao || null),
        id_centro_custo: (raw.id_centro_custo !== undefined && raw.id_centro_custo !== null) ? raw.id_centro_custo : (raw.id_centro_custo || null),
        id_departamento: (raw.id_departamento !== undefined && raw.id_departamento !== null) ? raw.id_departamento : (raw.id_departamento || null),
      });
    } else {
      setForm({ nome: '', quantidade_dias: 0, id_conta_padrao: null, id_centro_custo: null, id_departamento: null });
    }
  }, [itemToEdit, open]);

  const handleChange = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nome_forma: form.nome,
        quantidade_dias: form.quantidade_dias,
        dias_vencimento: form.quantidade_dias,
        id_conta_padrao: form.id_conta_padrao || null,
        id_centro_custo: form.id_centro_custo || null,
        id_departamento: form.id_departamento || null,
      };

      if (itemToEdit && (itemToEdit.id || itemToEdit.id_forma_pagamento)) {
        const id = itemToEdit.id || itemToEdit.id_forma_pagamento;
        const res = await axiosInstance.put(`/formas-pagamento/${id}/`, payload);
        onSaveSuccess && onSaveSuccess(res.data);
      } else {
        const res = await axiosInstance.post('/formas-pagamento/', payload);
        onSaveSuccess && onSaveSuccess(res.data);
      }
      onClose && onClose();
    } catch (err) {
      console.error('Erro ao salvar FormaPagamento', err);
      // Mostrar detalhes do erro retornado pelo backend, se houver
      const serverData = err?.response?.data;
      console.error('Resposta do servidor:', serverData);
      try {
        alert('Erro ao salvar Forma de Pagamento: ' + JSON.stringify(serverData));
      } catch (e) {
        alert('Erro ao salvar Forma de Pagamento. Veja console para detalhes.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Forma de Pagamento</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField label="Nome" fullWidth value={form.nome} onChange={handleChange('nome')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Dias (venc.)" type="number" fullWidth value={form.quantidade_dias} onChange={handleChange('quantidade_dias')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Departamento" fullWidth value={form.id_departamento ?? ''} onChange={handleChange('id_departamento')}>
              <MenuItem value="">—</MenuItem>
              {departamentos.map(d => (<MenuItem key={d.id_departamento || d.id} value={d.id_departamento ?? d.id}>{d.nome_departamento || d.nome}</MenuItem>))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Centro de Custo" fullWidth value={form.id_centro_custo ?? ''} onChange={handleChange('id_centro_custo')}>
              <MenuItem value="">—</MenuItem>
              {centrosCusto.map(c => (<MenuItem key={c.id_centro_custo || c.id} value={c.id_centro_custo ?? c.id}>{c.nome_centro_custo || c.nome}</MenuItem>))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField select label="Conta padréo (baixa)" fullWidth value={form.id_conta_padrao ?? ''} onChange={handleChange('id_conta_padrao')}>
              <MenuItem value="">—</MenuItem>
              {contasBancarias.map(cb => (<MenuItem key={cb.id_conta_bancaria || cb.id} value={cb.id_conta_bancaria ?? cb.id}>{cb.nome_conta || cb.nome}</MenuItem>))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={!!saving}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={!!saving}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}
