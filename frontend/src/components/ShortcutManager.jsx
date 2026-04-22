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
const ROUTES = [
  // Principais
  { label: 'Dashboard', path: '/home' },
  { label: 'Dashboard BI', path: '/dashboard-bi' },
  // Vendas
  { label: 'Vendas', path: '/vendas' },
  { label: 'Venda Rápida', path: '/venda-rapida' },
  { label: 'Entregas', path: '/entregas' },
  { label: 'Comandas / Mesas', path: '/comandas' },
  { label: 'Faturamento', path: '/faturamento' },
  // Fiscal
  { label: 'NFC-e', path: '/nfce' },
  { label: 'NF-e', path: '/nfe' },
  { label: 'CT-e', path: '/cte' },
  { label: 'MDF-e', path: '/mdfe' },
  { label: 'Manifestação NF-e', path: '/manifestacao-destinatario' },
  { label: 'SPED ICMS', path: '/sped' },
  { label: 'SPED PIS/COFINS', path: '/sped-contribuicoes' },
  // Cadastros
  { label: 'Clientes', path: '/clientes' },
  { label: 'Produtos', path: '/produtos' },
  { label: 'Cadastro Turbo ⚡', path: '/cadastro-turbo' },
  { label: 'Fornecedores', path: '/fornecedores' },
  { label: 'Veículos', path: '/veiculos' },
  { label: 'Equipamentos', path: '/equipamentos' },
  // Operações
  { label: 'Compras', path: '/compras' },
  { label: 'Ordem de Serviço', path: '/ordem-servico' },
  { label: 'Trocas (Listar)', path: '/trocas' },
  { label: 'Nova Troca', path: '/trocas/nova' },
  { label: 'Devoluções (Listar)', path: '/devolucoes' },
  { label: 'Nova Devolução', path: '/devolucoes/nova' },
  { label: 'Produção', path: '/producao' },
  { label: 'Mapa de Carga', path: '/mapa-carga' },
  // Financeiro
  { label: 'Financeiro', path: '/financeiro' },
  { label: 'Bancário', path: '/bancario' },
  { label: 'Boletos', path: '/boletos' },
  { label: 'Cheques', path: '/cheques' },
  { label: 'Cartões', path: '/cartoes' },
  { label: 'Conciliação', path: '/conciliacao' },
  { label: 'Pix Dinâmico', path: '/pix' },
  { label: 'Contratos de Recorrência', path: '/recorrencia' },
  { label: 'Aluguel', path: '/alugueis' },
  { label: 'Contas e Serviços', path: '/contas-servicos' },
  { label: 'Formas de Pagamento', path: '/formas-pagamento' },
  // Relatórios
  { label: 'Relatórios', path: '/relatorios' },
  { label: 'Gráficos', path: '/graficos' },
  { label: 'Relatório de Vendas', path: '/relatorios/vendas' },
  { label: 'Relatório de Estoque', path: '/relatorios?categoria=estoque' },
  { label: 'Relatório Financeiro', path: '/relatorios?categoria=financeiro' },
  { label: 'Relatório de Clientes', path: '/relatorios?categoria=clientes' },
  { label: 'Relatório de Produtos', path: '/relatorios?categoria=produtos' },
  { label: 'Relatório de Comissões', path: '/relatorios/comissoes' },
  { label: 'Relatório DRE', path: '/relatorios/dre' },
  { label: 'Relatório de Lucratividade', path: '/relatorios/lucratividade' },
  { label: 'Relatório de Inventário', path: '/relatorios/inventario' },
  { label: 'Relatório Cashback', path: '/relatorios/cashback' },
  { label: 'Relatório CT-e', path: '/relatorios/cte' },
  { label: 'Relatório MDF-e', path: '/relatorios/mdfe' },
  { label: 'Projeção de Compras', path: '/relatorios/projecao-compra' },
  { label: 'Ficha de Produto', path: '/relatorios/ficha-produto' },
  // Estoque
  { label: 'Ajustar Estoque', path: '/estoque-config' },
  { label: 'Tabela Comercial', path: '/tabela-comercial' },
  { label: 'Mapa de Promoção', path: '/mapa-promocao' },
  { label: 'Etiquetas', path: '/etiquetas' },
  { label: 'Catálogos', path: '/catalogos' },
  // CRM e Gestão
  { label: 'CRM — Pipeline', path: '/crm' },
  { label: 'Cotação', path: '/cotacao' },
  { label: 'Análise de Churn', path: '/churn' },
  { label: 'Assistente IA', path: '/assistente-ia' },
  { label: 'Consultor de Negócios IA', path: '/consultor-negocios' },
  // RH e Pessoal
  { label: 'Recursos Humanos', path: '/rh' },
  { label: 'Terminal de Ponto', path: '/ponto' },
  // Pet Shop / Clínica
  { label: 'Pet Shop', path: '/pet-shop' },
  { label: 'Clínica Veterinária', path: '/clinica-veterinaria' },
  { label: 'Agenda', path: '/agenda' },
  // Agro
  { label: 'Gestão Agro', path: '/agro' },
  { label: 'Agro — Safras', path: '/agro/safras' },
  { label: 'Agro — Contratos', path: '/agro/contratos' },
  { label: 'Agro — Conversões', path: '/agro/conversoes' },
  { label: 'Agro — Operacional', path: '/agro/operacional' },
  // Fiscal Especial
  { label: 'Balanças', path: '/balancas' },
  // Configurações
  { label: 'Configurações', path: '/configuracoes' },
  { label: 'Aprovações / Autorização', path: '/aprovacoes' },
  { label: 'Minhas Solicitações', path: '/minhas-solicitacoes' },
  { label: 'Status Ordem de Serviço', path: '/status-ordem-servico' },
  { label: 'Config. Contrato', path: '/configuracao-contrato' },
  { label: 'Acesso Mobile (QR)', path: '/acesso-mobile' },
  { label: 'Backup', path: '/backup' },
  // WhatsApp
  { label: 'WhatsApp em Massa', path: '/whatsapp' },
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
