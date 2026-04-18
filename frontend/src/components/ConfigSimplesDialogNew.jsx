import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, CircularProgress, Typography
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function ConfigSimplesDialog({ open, onClose, onSaveSuccess, itemToEdit, configTipo, depositosEndpoint }) {
  const { axiosInstance } = useAuth();
  const [name, setName] = useState('');
  const [quantidadeDias, setQuantidadeDias] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (itemToEdit) {
        setName(itemToEdit.nome_funcao || itemToEdit.nome_grupo || itemToEdit.nome_departamento || itemToEdit.nome_centro_custo || itemToEdit.nome_conta || itemToEdit.nome_forma_pagamento || itemToEdit.nome || itemToEdit.descricao || '');
        setQuantidadeDias(itemToEdit.quantidade_dias !== undefined ? itemToEdit.quantidade_dias : 0);
      } else {
        setName('');
        setQuantidadeDias(0);
      }
    }
  }, [open, itemToEdit]);

  const getEndpointForTipo = (tipo) => {
    switch (tipo) {
      case 'Funcao': return '/api/funcoes/';
      case 'Grupo': return '/api/grupos-produto/';
      case 'Departamento': return '/api/departamentos/';
      case 'CentroCusto': return '/api/centro-custo/';
      case 'ContaBancaria': return '/api/contas-bancarias/';
      case 'FormaPagamento': return '/api/formas-pagamento/';
      case 'Deposito': return '/api/depositos/';
      default: return null;
    }
  };

  const buildPayload = (tipo) => {
  if (tipo === 'FormaPagamento') return { nome_forma_pagamento: name, nome_forma: name, nome: name, quantidade_dias: Number(quantidadeDias), dias: Number(quantidadeDias) };
    if (tipo === 'Funcao') return { nome_funcao: name };
    if (tipo === 'Grupo') return { nome_grupo: name };
    if (tipo === 'Departamento') return { nome_departamento: name };
    if (tipo === 'CentroCusto') return { nome_centro_custo: name };
    if (tipo === 'ContaBancaria') return { nome_conta: name };
    if (tipo === 'Deposito') return { nome_deposito: name, nome: name };
    return { nome: name };
  };

  const handleSave = async () => {
    const endpoint = getEndpointForTipo(configTipo);
    if (!endpoint) return alert('Tipo não suportado.');

    if (!name || name.trim() === '') return alert('Nome é obrigatório.');
    if (configTipo === 'FormaPagamento' && (isNaN(quantidadeDias) || Number(quantidadeDias) < 0)) return alert('Quantidade de dias inválida.');

    setSaving(true);
    try {
      const payload = buildPayload(configTipo);
      let responseData = null;
      if (itemToEdit && configTipo === 'Deposito') {
        // Editando depósito: precisamos descobrir qual endpoint o backend oferece
        try {
          const { tryGetDepositos, tryPutDeposito } = await import('../lib/depositosApi');
          let resolved = null;
          try {
            const getRes = await tryGetDepositos(axiosInstance, depositosEndpoint);
            resolved = getRes?.endpoint || null;
          } catch (e) { resolved = null; }

          // Extrai id do itemToEdit (pode ser raw ou já normalizado)
          const raw = itemToEdit.raw || itemToEdit;
          const id = raw.id_deposito || raw.id_conta_bancaria || raw.id || raw.pk;

          const isContaEndpoint = resolved && (resolved.includes('contas') || resolved.includes('conta'));
          if (isContaEndpoint) {
            // Atualiza como conta
            const contaPayload = { nome_conta: name, nome: name };
            await axiosInstance.put(`${resolved}${id}/`, contaPayload);
            // persiste override para futuras operações
            try { localStorage.setItem('depositosEndpointOverride', resolved); } catch (e) {}
            responseData = { ...contaPayload, id };
            alert('Depósito (Conta) atualizado com sucesso (fallback).');
          } else {
            // Tenta put via helper (que tentará endpoints candidatos)
            const resObj = await tryPutDeposito(axiosInstance, id, payload, depositosEndpoint);
            responseData = resObj?.data || null;
          }
        } catch (putErr) {
          console.error('Erro ao atualizar depósito:', putErr);
          throw putErr;
        }
      } else if (itemToEdit && (itemToEdit.id_forma_pagamento || itemToEdit.id || itemToEdit.id_funcao || itemToEdit.id_grupo || itemToEdit.id_departamento || itemToEdit.id_centro_custo || itemToEdit.id_conta_bancaria)) {
        const id = itemToEdit.id_forma_pagamento || itemToEdit.id || itemToEdit.id_funcao || itemToEdit.id_grupo || itemToEdit.id_departamento || itemToEdit.id_centro_custo || itemToEdit.id_conta_bancaria;
        const res = await axiosInstance.put(`${endpoint}${id}/`, payload);
        responseData = res?.data || null;
        alert('Atualizado com sucesso.');
      } else {
        // Para Deposito, tentamos múltiplos endpoints possíveis
        if (configTipo === 'Deposito') {
          try {
            const { tryGetDepositos, tryPostDeposito } = await import('../lib/depositosApi');
            // Primeiro detecta qual endpoint existe para leitura
            let resolved;
            try {
              const getRes = await tryGetDepositos(axiosInstance, depositosEndpoint);
              resolved = getRes?.endpoint || null;
            } catch (e) {
              // não conseguiu detectar via GET, continua para tentar POST direto
              resolved = null;
            }

            // Se o endpoint resolvido for de contas, criamos uma conta como fallback
            const isContaEndpoint = resolved && (resolved.includes('contas') || resolved.includes('conta'));
            if (isContaEndpoint) {
              // mapeia o payload para o formato de conta bancária
              const contaPayload = { nome_conta: name, nome: name };
              const resConta = await axiosInstance.post(resolved, contaPayload);
              responseData = resConta?.data || null;
              // persistir override para que futuras operações usem esse endpoint
              try { localStorage.setItem('depositosEndpointOverride', resolved); } catch (e) {}
              alert('Depósito criado como Conta (fallback): o backend expõe apenas endpoint de contas.');
            } else {
              // Caso contrário, tenta criar como depósito normalmente (helper tentará os candidatos)
              const resObj = await tryPostDeposito(axiosInstance, payload, depositosEndpoint);
              responseData = resObj?.data || null;
            }
          } catch (postErr) {
            console.error('Erro ao criar depósito (tentativas):', postErr?.attempts || postErr?.message || postErr);
            const attempts = postErr?.attempts || [];
            const attemptsText = attempts.length ? attempts.map(a => `${a.endpoint} => ${a.status || 'err'}`).join('\n') : (postErr?.message || String(postErr));
            alert(`Erro ao salvar configuração simples: ${postErr?.message || String(postErr)}\nTentativas:\n${attemptsText}`);
            throw postErr;
          }
        } else {
          const res = await axiosInstance.post(endpoint, payload);
          responseData = res?.data || null;
        }
        alert('Criado com sucesso.');
      }
      onSaveSuccess && onSaveSuccess(responseData);
      onClose && onClose();
    } catch (err) {
      console.error('Erro ao salvar configuração simples:', err);
      // Mensagem mais amigável para 403 (acesso negado)
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        // Se for forbidden, mostra instruçéo clara
        if (status === 403) {
          let detailsText = '';
          try { detailsText = typeof data === 'string' ? data : JSON.stringify(data); } catch (e) { detailsText = String(data); }
          alert(`ação recusada: você não tem permissão para realizar essa operação. (HTTP 403)\n${detailsText}`);
        } else {
          try {
            const details = typeof data === 'string' ? data : JSON.stringify(data);
            alert(`Erro ao salvar. Status: ${status}. Detalhes: ${details}`);
          } catch (e) {
            alert(`Erro ao salvar. Status: ${status}.`);
          }
        }
      } else {
        alert('Erro ao salvar. Verifique a conexéo ou tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{itemToEdit ? 'Editar' : 'Adicionar'} {configTipo === 'FormaPagamento' ? 'Forma de Pagamento' : configTipo}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} fullWidth />

          {configTipo === 'FormaPagamento' && (
            <TextField
              label="Quantidade de dias (0 = hoje)"
              type="number"
              value={quantidadeDias}
              onChange={(e) => setQuantidadeDias(e.target.value)}
              inputProps={{ min: 0 }}
              helperText="Se 0, o vencimento será hoje; se >0, vence em hoje + quantidade de dias"
            />
          )}

          <Typography variant="caption" color="text.secondary">Salve para aplicar as alterações.</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : null}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
