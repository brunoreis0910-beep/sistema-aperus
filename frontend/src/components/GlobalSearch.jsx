import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  InputAdornment,
  Divider,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate } from 'react-router-dom'

// Catálogo completo de destinos com palavras-chave para busca
const CATALOG = [
  // ── Dashboard ──────────────────────────────────────────────────────────────
  { label: 'Dashboard', path: '/home', category: 'Principal', keywords: 'inicio home painel resumo' },
  { label: 'Dashboard BI', path: '/dashboard-bi', category: 'Principal', keywords: 'bi analytics indicadores graficos' },

  // ── Vendas ─────────────────────────────────────────────────────────────────
  { label: 'Vendas', path: '/vendas', category: 'Vendas', keywords: 'venda pedido orcamento cliente vender' },
  { label: 'Venda Rápida', path: '/venda-rapida', category: 'Vendas', keywords: 'venda rapida balcao caixa pdv' },
  { label: 'Faturamento', path: '/faturamento', category: 'Vendas', keywords: 'fatura faturar nota fiscal emitir' },
  { label: 'Entregas', path: '/entregas', category: 'Vendas', keywords: 'entrega despacho logistica envio' },
  { label: 'Comandas / Mesas', path: '/comandas', category: 'Vendas', keywords: 'comanda mesa restaurante bar pedido' },
  { label: 'Cotação', path: '/cotacao', category: 'Vendas', keywords: 'cotacao orcamento preco fornecedor' },

  // ── Cadastros ──────────────────────────────────────────────────────────────
  { label: 'Clientes', path: '/clientes', category: 'Cadastros', keywords: 'cliente cadastro pessoa fisica juridica cpf cnpj' },
  { label: 'Produtos', path: '/produtos', category: 'Cadastros', keywords: 'produto item mercadoria codigo ean gtin' },
  { label: 'Cadastro Turbo ⚡', path: '/cadastro-turbo', category: 'Cadastros', keywords: 'cadastro turbo rapido produto rapido' },
  { label: 'Fornecedores', path: '/fornecedores', category: 'Cadastros', keywords: 'fornecedor parceiro compra CNPJ' },
  { label: 'Veículos', path: '/veiculos', category: 'Cadastros', keywords: 'veiculo carro moto placa frota' },
  { label: 'Equipamentos', path: '/equipamentos', category: 'Cadastros', keywords: 'equipamento maquina ativo ferramenta' },

  // ── Fiscal ─────────────────────────────────────────────────────────────────
  { label: 'NF-e', path: '/nfe', category: 'Fiscal', keywords: 'nfe nota fiscal eletronica emissao xml danfe' },
  { label: 'NFC-e', path: '/nfce', category: 'Fiscal', keywords: 'nfce nota fiscal consumidor cupom pdv' },
  { label: 'CT-e', path: '/cte', category: 'Fiscal', keywords: 'cte conhecimento transporte frete' },
  { label: 'MDF-e', path: '/mdfe', category: 'Fiscal', keywords: 'mdfe manifesto documentos fiscais' },
  { label: 'Manifestação NF-e', path: '/manifestacao-destinatario', category: 'Fiscal', keywords: 'manifestacao destinatario ciencia nota fiscal aceite' },
  { label: 'SPED ICMS', path: '/sped', category: 'Fiscal', keywords: 'sped icms efd escrituracao fiscal' },
  { label: 'SPED PIS/COFINS', path: '/sped-contribuicoes', category: 'Fiscal', keywords: 'sped pis cofins contribuicoes apuracao' },
  { label: 'Documentos Fiscais', path: '/documentos-fiscais', category: 'Fiscal', keywords: 'documentos fiscais xml importar' },

  // ── Compras ────────────────────────────────────────────────────────────────
  { label: 'Compras', path: '/compras', category: 'Compras', keywords: 'compra entrada nfe xml nota fiscal fornecedor' },
  { label: 'Consulta Estoque', path: '/consulta-estoque', category: 'Compras', keywords: 'estoque saldo quantidade deposito valor venda consulta' },
  { label: 'Projeção de Compras', path: '/relatorios/projecao-compra', category: 'Compras', keywords: 'projecao compra previsao ressuprimento' },

  // ── Estoque ────────────────────────────────────────────────────────────────
  { label: 'Ajustar Estoque', path: '/estoque-config', category: 'Estoque', keywords: 'ajuste estoque inventario saldo corrigir deposito' },
  { label: 'Tabela Comercial', path: '/tabela-comercial', category: 'Estoque', keywords: 'tabela comercial preco lista preco venda' },
  { label: 'Mapa de Promoção', path: '/mapa-promocao', category: 'Estoque', keywords: 'promocao desconto mapa oferta' },
  { label: 'Etiquetas', path: '/etiquetas', category: 'Estoque', keywords: 'etiqueta preco codigo barras imprimir gerar' },
  { label: 'Catálogos', path: '/catalogos', category: 'Estoque', keywords: 'catalogo pdf lista produtos' },

  // ── Financeiro ─────────────────────────────────────────────────────────────
  { label: 'Financeiro', path: '/financeiro', category: 'Financeiro', keywords: 'financeiro contas pagar receber fluxo caixa' },
  { label: 'Bancário', path: '/bancario', category: 'Financeiro', keywords: 'bancario banco extrato transferencia conta corrente' },
  { label: 'Boletos', path: '/boletos', category: 'Financeiro', keywords: 'boleto cobranca emitir pagar vencimento' },
  { label: 'Cheques', path: '/cheques', category: 'Financeiro', keywords: 'cheque compensar emitir receber' },
  { label: 'Cartões', path: '/cartoes', category: 'Financeiro', keywords: 'cartao credito debito maquina bandeira' },
  { label: 'Conciliação', path: '/conciliacao', category: 'Financeiro', keywords: 'conciliacao bancaria extrato reconciliar' },
  { label: 'Pix Dinâmico', path: '/pix', category: 'Financeiro', keywords: 'pix qr code pagamento instantaneo' },
  { label: 'Contratos de Recorrência', path: '/recorrencia', category: 'Financeiro', keywords: 'recorrencia assinatura mensalidade contrato' },
  { label: 'Aluguel', path: '/alugueis', category: 'Financeiro', keywords: 'aluguel locacao contrato mensal' },
  { label: 'Contas e Serviços', path: '/contas-servicos', category: 'Financeiro', keywords: 'contas servicos despesas fixas' },
  { label: 'Formas de Pagamento', path: '/formas-pagamento', category: 'Financeiro', keywords: 'forma pagamento dinheiro credito debito' },

  // ── Operações ──────────────────────────────────────────────────────────────
  { label: 'Ordem de Serviço', path: '/ordem-servico', category: 'Operações', keywords: 'ordem servico os tecnico assistencia' },
  { label: 'Status Ordem de Serviço', path: '/status-ordem-servico', category: 'Operações', keywords: 'status ordem servico kanban etapa' },
  { label: 'Trocas', path: '/trocas', category: 'Operações', keywords: 'troca devolucao produto cliente' },
  { label: 'Devoluções', path: '/devolucoes', category: 'Operações', keywords: 'devolucao retorno produto cliente' },
  { label: 'Produção', path: '/producao', category: 'Operações', keywords: 'producao pcp fabricacao insumo ordem producao' },
  { label: 'Mapa de Carga', path: '/mapa-carga', category: 'Operações', keywords: 'mapa carga rota entrega logistica' },
  { label: 'Balanças', path: '/balancas', category: 'Operações', keywords: 'balanca peso pesagem Toledo' },

  // ── Relatórios ─────────────────────────────────────────────────────────────
  { label: 'Relatórios', path: '/relatorios', category: 'Relatórios', keywords: 'relatorio analise exportar excel pdf' },
  { label: 'Gráficos', path: '/graficos', category: 'Relatórios', keywords: 'graficos charts analytics visual' },
  { label: 'Relatório de Vendas', path: '/relatorios/vendas', category: 'Relatórios', keywords: 'relatorio vendas faturamento periodo' },
  { label: 'Relatório de Estoque', path: '/relatorios?categoria=estoque', category: 'Relatórios', keywords: 'relatorio estoque inventario saldo' },
  { label: 'Relatório Financeiro', path: '/relatorios?categoria=financeiro', category: 'Relatórios', keywords: 'relatorio financeiro caixa fluxo' },
  { label: 'Relatório de Clientes', path: '/relatorios?categoria=clientes', category: 'Relatórios', keywords: 'relatorio cliente ranking compra' },
  { label: 'Relatório de Comissões', path: '/relatorios/comissoes', category: 'Relatórios', keywords: 'comissao vendedor relatorio' },
  { label: 'Relatório DRE', path: '/relatorios/dre', category: 'Relatórios', keywords: 'dre demonstrativo resultado exercicio lucro' },
  { label: 'Relatório de Lucratividade', path: '/relatorios/lucratividade', category: 'Relatórios', keywords: 'lucratividade margem lucro produto' },
  { label: 'Relatório de Inventário', path: '/relatorios/inventario', category: 'Relatórios', keywords: 'inventario contagem estoque relatorio' },
  { label: 'Ficha de Produto', path: '/relatorios/ficha-produto', category: 'Relatórios', keywords: 'ficha produto movimentacao historico' },

  // ── CRM ────────────────────────────────────────────────────────────────────
  { label: 'CRM — Pipeline', path: '/crm', category: 'CRM', keywords: 'crm pipeline lead funil vendas relacionamento' },
  { label: 'Análise de Churn', path: '/churn', category: 'CRM', keywords: 'churn cancelamento perda cliente analise' },

  // ── RH ─────────────────────────────────────────────────────────────────────
  { label: 'Recursos Humanos', path: '/rh', category: 'RH', keywords: 'rh recursos humanos funcionario colaborador folha' },
  { label: 'Terminal de Ponto', path: '/ponto', category: 'RH', keywords: 'ponto batida frequencia hora trabalho' },

  // ── Pet / Clínica ──────────────────────────────────────────────────────────
  { label: 'Pet Shop', path: '/pet-shop', category: 'Pet Shop', keywords: 'pet shop banho tosa animal' },
  { label: 'Clínica Veterinária', path: '/clinica-veterinaria', category: 'Pet Shop', keywords: 'veterinario clinica animal consulta' },
  { label: 'Agenda', path: '/agenda', category: 'Pet Shop', keywords: 'agenda agendamento horario consulta' },

  // ── Agro ───────────────────────────────────────────────────────────────────
  { label: 'Gestão Agro', path: '/agro', category: 'Agro', keywords: 'agro agricultura rural fazenda' },
  { label: 'Agro — Safras', path: '/agro/safras', category: 'Agro', keywords: 'safra plantio colheita ciclo' },
  { label: 'Agro — Contratos', path: '/agro/contratos', category: 'Agro', keywords: 'contrato agro insumo fornecedor' },
  { label: 'Agro — Operacional', path: '/agro/operacional', category: 'Agro', keywords: 'operacional agro safra maquina' },

  // ── IA ─────────────────────────────────────────────────────────────────────
  { label: 'Assistente IA', path: '/assistente-ia', category: 'IA', keywords: 'ia inteligencia artificial assistente chat gpt gemini' },
  { label: 'Consultor de Negócios IA', path: '/consultor-negocios', category: 'IA', keywords: 'consultor negocios ia analise gestao' },

  // ── Configurações ──────────────────────────────────────────────────────────
  { label: 'Configurações', path: '/configuracoes', category: 'Config', keywords: 'configuracao sistema empresa parametro' },
  { label: 'Aprovações / Autorização', path: '/aprovacoes', category: 'Config', keywords: 'aprovacao autorizacao solicitacao gerente' },
  { label: 'Minhas Solicitações', path: '/minhas-solicitacoes', category: 'Config', keywords: 'solicitacao minhas aprovacao pendente' },
  { label: 'Config. Contrato', path: '/configuracao-contrato', category: 'Config', keywords: 'contrato configuracao modelo' },
  { label: 'Acesso Mobile (QR)', path: '/acesso-mobile', category: 'Config', keywords: 'mobile qr code acesso app celular' },
  { label: 'Backup', path: '/backup', category: 'Config', keywords: 'backup restaurar dados seguranca' },
  { label: 'WhatsApp em Massa', path: '/whatsapp', category: 'Config', keywords: 'whatsapp mensagem envio massa marketing' },
]

// Normaliza texto para comparação (remove acentos, minúsculas)
const normalize = (str) =>
  (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Pontuação de relevância
const score = (item, query) => {
  const q = normalize(query)
  const label = normalize(item.label)
  const kw = normalize(item.keywords)
  const cat = normalize(item.category)
  if (label.startsWith(q)) return 100
  if (label.includes(q)) return 80
  if (kw.includes(q)) return 60
  if (cat.includes(q)) return 40
  return 0
}

// Ícones por categoria
const CATEGORY_ICONS = {
  Principal: '🏠',
  Vendas: '🛒',
  Cadastros: '📋',
  Fiscal: '📄',
  Compras: '📦',
  Estoque: '🏭',
  Financeiro: '💰',
  Operações: '⚙️',
  Relatórios: '📊',
  CRM: '🤝',
  RH: '👥',
  'Pet Shop': '🐾',
  Agro: '🌱',
  IA: '🤖',
  Config: '🔧',
}

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const results = React.useMemo(() => {
    if (!query.trim()) {
      // Sem busca: mostra os mais usados / principais
      return CATALOG.slice(0, 8)
    }
    return CATALOG
      .map((item) => ({ ...item, _score: score(item, query) }))
      .filter((item) => item._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 12)
  }, [query])

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Seleção por teclado
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[selected]) {
          navigate(results[selected].path)
          onClose()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [results, selected, navigate, onClose]
  )

  const handleSelect = (item) => {
    navigate(item.path)
    onClose()
  }

  // Scroll automático ao item selecionado
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  // Reset seleção ao mudar resultados
  useEffect(() => {
    setSelected(0)
  }, [results])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: 24,
          mt: { xs: 4, md: 10 },
          verticalAlign: 'top',
        },
      }}
      sx={{ alignItems: 'flex-start' }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Campo de busca */}
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            autoComplete="off"
            variant="outlined"
            placeholder="Pesquisar no sistema... (ex: clientes, compras, bancário)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: { fontSize: '1.05rem', borderRadius: 2 },
            }}
          />
        </Box>

        {/* Dica de uso */}
        <Box sx={{ px: 2, pb: 0.5, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {query.trim()
              ? `${results.length} resultado${results.length !== 1 ? 's' : ''}`
              : 'Sugestões rápidas'}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.disabled">
            ↑↓ navegar · Enter abrir · Esc fechar
          </Typography>
        </Box>

        <Divider />

        {/* Lista de resultados */}
        <List
          ref={listRef}
          dense
          disablePadding
          sx={{ maxHeight: 400, overflow: 'auto', py: 0.5 }}
        >
          {results.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
              <Typography variant="body2">Nenhum resultado para "{query}"</Typography>
            </Box>
          )}
          {results.map((item, idx) => (
            <ListItemButton
              key={item.path}
              data-idx={idx}
              selected={idx === selected}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelected(idx)}
              sx={{
                mx: 0.5,
                my: 0.2,
                borderRadius: 1.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.7)' },
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, fontSize: '1.2rem' }}>
                {CATEGORY_ICONS[item.category] || '📌'}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.category}
                primaryTypographyProps={{ fontWeight: idx === selected ? 600 : 400 }}
                secondaryTypographyProps={{ fontSize: '0.72rem' }}
              />
              {idx === selected && (
                <Chip
                  label="Enter"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'inherit',
                  }}
                />
              )}
            </ListItemButton>
          ))}
        </List>

        {/* Rodapé */}
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.disabled">
            Ctrl+K para abrir · F1–F12 para atalhos configuráveis
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
