import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography
} from '@mui/material';
import { getShortcutsLocal, saveShortcutsApi, fetchShortcutsApi } from '../services/shortcutService';

// Lista de destinos que o usuário pode escolher para os atalhos.
// Inclui as rotas principais do sistema — adicione aqui outras rotas conforme necessário.
const ROUTES = [
  { label: 'Dashboard', path: '/home' },
  { label: 'Vendas', path: '/vendas' },
  { label: 'Venda Rápida', path: '/venda-rapida' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Produtos', path: '/produtos' },
  { label: 'Fornecedores', path: '/fornecedores' },
  { label: 'Compras', path: '/compras' },
  { label: 'Ordem de Serviço', path: '/ordem-servico' },
  { label: 'Comandas / Mesas', path: '/comandas' },
  { label: 'Trocas (Listar)', path: '/trocas' },
  { label: 'Nova Troca', path: '/trocas/nova' },
  { label: 'Devoluções (Listar)', path: '/devolucoes' },
  { label: 'Nova Devolução', path: '/devolucoes/nova' },
  { label: 'Aprovações / Autorização', path: '/aprovacoes' },
  { label: 'Financeiro', path: '/financeiro' },
  { label: 'Configurações', path: '/configuracoes' },
  { label: 'Etiquetas', path: '/etiquetas' },
  { label: 'Ajustar Estoque', path: '/estoque-config' },
  { label: 'Tabela Comercial', path: '/tabela-comercial' },
  { label: 'Mapa de Promoção', path: '/mapa-promocao' },
  { label: 'Pet Shop', path: '/pet-shop' },
  { label: 'Clínica Veterinária', path: '/clinica-veterinaria' },
  { label: 'Status Ordem de Serviço', path: '/status-ordem-servico' },
  { label: 'Relatórios', path: '/relatorios' },
  { label: 'Gráficos', path: '/graficos' },
  { label: 'Catálogos', path: '/catalogos' },
  { label: 'Acesso Mobile (QR)', path: '/acesso-mobile' }
];

// Gera teclas F1..F12 automaticamente
const FUNCTION_KEYS = Array.from({ length: 12 }, (_, i) => `F${i + 1}`);

export default function ShortcutManager({ open, onClose }) {
  const [shortcuts, setShortcuts] = useState({});

  useEffect(() => {
    if (open) {
      // 1. Carrega local imediatamente
      const local = getShortcutsLocal();
      setShortcuts(local || {});
      
      // 2. Tenta buscar da API para garantir sincronia
      fetchShortcutsApi().then(apiData => {
        if (apiData && Object.keys(apiData).length > 0) {
           setShortcuts(apiData);
        }
      });
    }
  }, [open]);

  const handleChange = (key, value) => {
    const next = { ...shortcuts, [key]: value };
    setShortcuts(next);
  };

  const handleSave = () => {
    saveShortcutsApi(shortcuts);
    onClose();
  };

  const handleClear = () => {
    setShortcuts({});
    saveShortcutsApi({});
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Configurar Atalhos</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Atribua destinos para as teclas de função (F1–F12). Ao pressionar a tecla em qualquer tela, o sistema
          navegará para a rota configurada. Pressionar <strong>Esc</strong> volta para a tela anterior.
        </Typography>

        <Grid container spacing={2}>
          {FUNCTION_KEYS.map((fk) => (
            <Grid item xs={12} key={fk}>
              <FormControl fullWidth>
                <InputLabel id={`label-${fk}`}>{fk}</InputLabel>
                <Select
                  labelId={`label-${fk}`}
                  value={shortcuts[fk] || ''}
                  label={fk}
                  onChange={(e) => handleChange(fk, e.target.value)}
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  {ROUTES.map((r) => (
                    <MenuItem key={r.path} value={r.path}>{r.label} — {r.path}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClear}>Limpar</Button>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}
