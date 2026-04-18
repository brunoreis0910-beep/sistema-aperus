// Nova função: retorna o status do produto para o depósito filtrado
const getStatusPorDeposito = (produto, depositoId) => {
  // Busca o registro do depósito na tabela de estoque do produto
  const estoques = produto?.estoques || produto?.estoque_por_deposito || produto?.saldos || produto?.saldos_depositos || produto?.estoque_depositos;
  if (Array.isArray(estoques) && depositoId) {
    const registro = estoques.find(it => String(it.id_deposito ?? it.deposito_id ?? it.id) === String(depositoId));
    if (registro) {
      const quantidade = Number(registro.quantidade ?? registro.saldo ?? registro.qtd ?? registro.quantidade_estoque ?? registro.estoque ?? 0);
      return quantidade > 0 ? 'Em Estoque' : 'Sem Estoque';
    }
    return 'Sem Estoque';
  }
  // Se não houver array, tenta campos diretos
  const quantidadeDireta = Number(produto?.quantidade ?? produto?.saldo ?? produto?.estoque ?? produto?.estoque_atual ?? produto?.quantidade_estoque ?? 0);
  return quantidadeDireta > 0 ? 'Em Estoque' : 'Sem Estoque';
};
// Em: src/pages/ProductPage.jsx
// Fase 3: Adicionada lógica de Solicitação de Exclusão

import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, Fade, CircularProgress,
  List, ListItem, ListItemText, IconButton, Divider, Grid,
  Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Tabs, Tab, Avatar, Paper, Tooltip
} from '@mui/material';
// Grid from @mui/material is used (Unstable_Grid2 not available in this environment)
// Ícones
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import LockIcon from '@mui/icons-material/Lock';
import GridOnIcon from '@mui/icons-material/GridOn';
// Helpers
import TabPanel from '../components/TabPanel';
import { useAuth } from '../context/AuthContext';
import { tryGetDepositos } from '../lib/depositosApi';
// --- 1. Importa o "Pedaço" (Popup) de Solicitação ---
import SolicitacaoDialog from '../components/SolicitacaoDialog';


function ProductPage() {
  const { user, permissions, axiosInstance, isLoading: authLoading } = useAuth();

  // --- Estados de Produtos ---
  const [produtos, setProdutos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormData, setProductFormData] = useState({
    codigo_produto: '', nome_produto: '', descricao: '', unidade_medida: 'UN',
    id_grupo: '', marca: '', classificacao: 'Revenda', ncm: '',
    id_deposito: '', valor_custo: 0, valor_compra: 0, valor_venda: 0, observacoes: '',
    imagem_url: ''
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [productTabValue, setProductTabValue] = useState(0);

  // Estados para o popup de Grupo
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({ nome_grupo: '' });
  const [savingGroup, setSavingGroup] = useState(false);

  // --- 2. ESTADOS DA SOLICITação (Fase 3) ---
  const [showSolicitacao, setShowSolicitacao] = useState(false);
  const [itemParaSolicitar, setItemParaSolicitar] = useState(null);
  const [supervisores, setSupervisores] = useState([]);

  // --- 3. ESTADOS DE PRODUTO EM GRADE ---
  const [configProduto, setConfigProduto] = useState({ produto_em_grade: false });
  const [tamanhos, setTamanhos] = useState([]);
  const [cores, setCores] = useState([]);
  const [tamanhoInput, setTamanhoInput] = useState('');
  const [corInput, setCorInput] = useState('');

  // --- Funções de Busca ---
  const fetchProducts = async () => {
    setLoadingProdutos(true);
    try {
      const res = await axiosInstance.get('/produtos/');
      setProdutos(res.data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoadingProdutos(false);
    }
  };

  const fetchProductGroups = async () => {
    try {
      const res = await axiosInstance.get('/grupos-produto/');
      setGrupos(res.data);
    } catch (error) {
      console.error("Erro ao buscar grupos de produto", error);
    }
  };

  const fetchDepositos = async () => {
    try {
      const res = await tryGetDepositos(axiosInstance);
      const data = res?.data;
      const normalizeDep = (it) => ({
        id: it.id_deposito || it.id_conta_bancaria || it.id || it.pk || null,
        nome: it.nome_deposito || it.nome_conta || it.nome_razao_social || it.nome || it.descricao || '—',
        raw: it
      });
      setDepositos(Array.isArray(data) ? data.map(normalizeDep) : []);
    } catch (error) {
      console.error('Erro ao buscar depósitos:', error?.message || error);
      if (error?.attempts) console.debug('Tentativas de endpoint:', error.attempts);
      setDepositos([]);
    }
  };

  const fetchSupervisores = async () => {
    try {
      const res = await axiosInstance.get('/usuarios/?is_staff=True');
      setSupervisores(res.data);
    } catch (error) {
      console.error("Erro ao buscar supervisores:", error);
    }
  };

  const fetchConfigProduto = async () => {
    try {
      const res = await axiosInstance.get('/api/config-produto/');
      const config = Array.isArray(res.data) ? res.data[0] : res.data;
      console.log('📥 Configuração de Produto carregada:', config);
      setConfigProduto(config || { produto_em_grade: false });
    } catch (error) {
      console.error('Erro ao carregar configuração de produto:', error);
      setConfigProduto({ produto_em_grade: false });
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (permissions.produtos_acessar || user.is_staff) {
        fetchProducts();
        fetchProductGroups();
        fetchDepositos();
        fetchConfigProduto(); // Busca configuração de produto em grade
        if (!user.is_staff) { // Se não for admin, busca supervisores
          fetchSupervisores();
        }
      } else {
        setLoadingProdutos(false); // Para o loading se não tiver acesso
      }
    }
  }, [authLoading, user, permissions]);

  // --- Funções do Formulário de Produto ---
  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewProductClick = () => {
    setEditingProduct(null);
    setProductTabValue(0);
    setProductFormData({ codigo_produto: '', nome_produto: '', descricao: '', unidade_medida: 'UN', id_grupo: '', id_deposito: '', marca: '', classificacao: 'Revenda', ncm: '', valor_custo: 0, valor_compra: 0, valor_venda: 0, observacoes: '', imagem_url: '' });
    // Limpa os campos de grade
    setTamanhos([]);
    setCores([]);
    setTamanhoInput('');
    setCorInput('');
    setShowProductForm(true);
  };

  const handleAddProductGradeClick = () => {
    setEditingProduct(null);
    setProductTabValue(4); // Abre diretamente na aba de Variações (índice 4)
    setProductFormData({ codigo_produto: '', nome_produto: '', descricao: '', unidade_medida: 'UN', id_grupo: '', id_deposito: '', marca: '', classificacao: 'Revenda', ncm: '', valor_custo: 0, valor_compra: 0, valor_venda: 0, observacoes: '', imagem_url: '' });
    // Limpa os campos de grade
    setTamanhos([]);
    setCores([]);
    setTamanhoInput('');
    setCorInput('');
    setShowProductForm(true);
  };

  const handleEditProductClick = (p) => {
    if (!(permissions.produtos_editar || user.is_staff)) {
      alert('Você não tem permissão para editar produtos.');
      return;
    }
    setEditingProduct(p);
    setProductTabValue(0);
    setProductFormData({ codigo_produto: p.codigo_produto || '', nome_produto: p.nome_produto || '', descricao: p.descricao || '', unidade_medida: p.unidade_medida || 'UN', id_grupo: p.id_grupo || '', id_deposito: p.id_deposito || '', marca: p.marca || '', classificacao: p.classificacao || 'Revenda', ncm: p.ncm || '', valor_custo: p.valor_custo || 0, valor_compra: p.valor_compra || 0, valor_venda: p.valor_venda || 0, observacoes: p.observacoes || '', imagem_url: p.imagem_url || '' });
    setShowProductForm(true);
  };

  const handleCancelEditProduct = () => { setShowProductForm(false); setEditingProduct(null); };
  const handleProductTabChange = (event, newValue) => { setProductTabValue(newValue); };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!(editingProduct ? permissions.produtos_editar : permissions.produtos_criar) && !user.is_staff) {
      alert('Você não tem permissão para salvar produtos.');
      return;
    }

    setSavingProduct(true);
    const data = { ...productFormData, id_grupo: productFormData.id_grupo ? parseInt(productFormData.id_grupo) : null, valor_custo: parseFloat(productFormData.valor_custo) || 0, valor_compra: parseFloat(productFormData.valor_compra) || 0, valor_venda: parseFloat(productFormData.valor_venda) || 0, imagem_url: productFormData.imagem_url || null };
    // Tratamento do depósito (se informado)
    if (productFormData.id_deposito) data.id_deposito = parseInt(productFormData.id_deposito);
    if (!data.id_grupo) { delete data.id_grupo; }

    // Se produto em grade estiver habilitado e houver variações
    if (configProduto.produto_em_grade && !editingProduct && (tamanhos.length > 0 || cores.length > 0)) {
      data.variacoes = [];
      if (tamanhos.length > 0 && cores.length > 0) {
        // Combinar tamanhos e cores
        tamanhos.forEach(tamanho => {
          cores.forEach(cor => {
            data.variacoes.push({ tamanho, cor });
          });
        });
      } else if (tamanhos.length > 0) {
        // Apenas tamanhos
        tamanhos.forEach(tamanho => {
          data.variacoes.push({ tamanho, cor: null });
        });
      } else if (cores.length > 0) {
        // Apenas cores
        cores.forEach(cor => {
          data.variacoes.push({ tamanho: null, cor });
        });
      }
      console.log('📦 Salvando produto em grade com variações:', data.variacoes);
    }

    try {
      if (editingProduct) {
        await axiosInstance.put(`/api/produtos/${editingProduct.id_produto}/`, data);
        alert('Produto atualizado!');
      } else {
        await axiosInstance.post('/produtos/', data);
        if (data.variacoes && data.variacoes.length > 0) {
          alert(`Produto em grade cadastrado! Total de ${data.variacoes.length} variações criadas.`);
        } else {
          alert('Produto cadastrado!');
        }
      }
      setShowProductForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      let msg = 'Erro ao salvar produto.';
      if (error.response && error.response.data) {
        const err = error.response.data;
        const key = Object.keys(err)[0];
        if (key && Array.isArray(err[key])) {
          msg += `\n${key} - ${err[key][0]}`;
        } else if (err.detail) {
          msg = err.detail;
        }
      }
      alert(msg);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProductClick = async (id) => {
    if (!window.confirm('Excluir este produto?')) return;
    setLoadingProdutos(true);
    try {
      await axiosInstance.delete(`/api/produtos/${id}/`);
      alert('Produto excluído!');
      fetchProducts();
    } catch (error) {
      alert('Erro ao excluir produto.');
      setLoadingProdutos(false);
    }
  };

  // --- 3. NOVA função: Solicitar Exclusão ---
  const handleRequestExclusion = (produto) => {
    // Adapta o objeto 'produto' para o formato genérico do popup
    const itemFormatado = {
      id_cliente: produto.id_produto, // Usa o ID do produto
      nome_razao_social: produto.nome_produto, // Usa o nome do produto
      cpf_cnpj: produto.codigo_produto // Usa o código do produto
    };
    setItemParaSolicitar(itemFormatado);
    setShowSolicitacao(true);
  };

  // --- Funções do Popup de Grupo de Produto ---
  const handleOpenGroupForm = (grupo = null) => {
    if (grupo) {
      setEditingGroup(grupo);
      setGroupFormData({ nome_grupo: grupo.nome_grupo });
    } else {
      setEditingGroup(null);
      setGroupFormData({ nome_grupo: '' });
    }
    setShowGroupForm(true);
  };

  const handleCloseGroupForm = () => { setShowGroupForm(false); setEditingGroup(null); };

  const handleSaveGroup = async () => {
    if (groupFormData.nome_grupo.trim() === '') { alert('Nome do grupo é obrigatório.'); return; }
    setSavingGroup(true);
    const data = { nome_grupo: groupFormData.nome_grupo };
    try {
      if (editingGroup) {
        await axiosInstance.put(`/grupos-produto/${editingGroup.id_grupo}/`, data);
        alert('Grupo atualizado!');
      } else {
        await axiosInstance.post('/grupos-produto/', data);
        alert('Grupo criado!');
      }
      handleCloseGroupForm();
      fetchProductGroups();
    } catch (error) {
      alert('Erro ao salvar grupo.');
    } finally {
      setSavingGroup(false);
    }
  };

  const getGroupName = (groupId) => {
    const grupo = grupos.find(g => g.id_grupo === groupId);
    return grupo ? grupo.nome_grupo : 'Sem Grupo';
  };

  const getDepositoName = (depositoId) => {
    if (!depositoId) return '—';
    const d = depositos.find(x => x.id === depositoId || x.id === Number(depositoId));
    return d ? (d.nome || '—') : '—';
  };

  const getProdutoQuantidade = (produto, depositoId) => {
    // tenta campos diretos
    const maybeNumber = (v) => (v === undefined || v === null) ? null : Number(v);
    const direct = produto?.estoque ?? produto?.estoque_total ?? produto?.quantidade ?? produto?.saldo ?? produto?.estoque_atual ?? produto?.quantidade_estoque;
    if (direct !== undefined && direct !== null) return String(direct);

    // se houver um array com saldos por depósito, tenta localizar pelo id
    const candidates = produto?.estoques || produto?.estoque_por_deposito || produto?.saldos || produto?.saldos_depositos || produto?.estoque_depositos;
    if (Array.isArray(candidates) && depositoId) {
      const found = candidates.find(it => (it.id_deposito && String(it.id_deposito) === String(depositoId)) || (it.deposito_id && String(it.deposito_id) === String(depositoId)) || (it.id && String(it.id) === String(depositoId)));
      if (found) {
        return String(found.quantidade ?? found.saldo ?? found.qtd ?? found.quantidade_estoque ?? found.estoque ?? '0');
      }
    }

    // tenta campos nomeados alternativos no próprio objeto de produto
    if (produto?.quantidade !== undefined) return String(produto.quantidade);
    if (produto?.saldo !== undefined) return String(produto.saldo);

    return '—';
  };


  // --- Renderização ---

  if (authLoading || loadingProdutos) {
    return <CircularProgress />;
  }

  if (!user.is_staff && !permissions.produtos_acessar) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>
          <LockIcon sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
          Acesso Negado
        </Typography>
        <Typography variant="body1">
          Você não tem permissão para acessar o módulo de Produtos.
        </Typography>
      </Box>
    )
  }

  return (
    <React.Fragment> {/* Adicionado Fragmento */}
      <Fade in={true} timeout={500}>
        <Box sx={{ width: '100%' }}>

          {/* Botões de Adicionar Produto */}
          {(permissions.produtos_criar || user.is_staff) && (
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color={showProductForm ? "warning" : "primary"}
                onClick={showProductForm ? handleCancelEditProduct : handleAddNewProductClick}
                startIcon={showProductForm ? <CloseIcon /> : <AddIcon />}
              >
                {showProductForm ? 'Cancelar' : 'Adicionar Novo Produto'}
              </Button>
              
              {/* Botão padrão, condicional à configuração */}
              {configProduto.produto_em_grade && !showProductForm && (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleAddProductGradeClick}
                  startIcon={<GridOnIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
                    boxShadow: '0 3px 5px 2px rgba(156, 39, 176, .3)',
                  }}
                >
                  Produto em Grade
                </Button>
              )}
            </Box>
          )}

          {/* Formulário de Produto (condicional) */}
          {showProductForm && (
            <Fade in={showProductForm} timeout={300}>
              <Paper elevation={3} sx={{ mb: 4, border: '1px solid #ddd', bgcolor: 'background.paper', width: '100%' }}>
                <Box component="form" onSubmit={handleSaveProduct}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 3, pb: 0 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                      {editingProduct ? `Editando: ${editingProduct.nome_produto}` : 'Adicionar Novo Produto'}
                    </Typography>
                    {configProduto.produto_em_grade && !editingProduct && productTabValue === 4 && (
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          bgcolor: 'secondary.main',
                          color: 'white',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                        }}
                      >
                        <GridOnIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        MODO GRADE
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ borderBottom: 1, borderColor: 'divider', m: 3, mb: 0 }}>
                    <Tabs value={productTabValue} onChange={handleProductTabChange}>
                      <Tab label="Dados Básicos" />
                      <Tab label="Valores e Tributos" />
                      <Tab label="Observações" />
                      <Tab label="Imagens" />
                      {configProduto.produto_em_grade && !editingProduct && (
                        <Tab label="Variações (Grade)" />
                      )}
                    </Tabs>
                  </Box>

                  <TabPanel value={productTabValue} index={0}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}><TextField name="codigo_produto" label="Código do Produto" value={productFormData.codigo_produto} onChange={handleProductFormChange} disabled={savingProduct} required fullWidth /></Grid>
                      <Grid item xs={12} sm={8}><TextField name="nome_produto" label="Nome do Produto" value={productFormData.nome_produto} onChange={handleProductFormChange} disabled={savingProduct} required fullWidth /></Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FormControl fullWidth sx={{ flexGrow: 1 }}>
                            <InputLabel id="grupo-produto-label">Grupo do Produto</InputLabel>
                            <Select labelId="grupo-produto-label" id="id_grupo" name="id_grupo" value={productFormData.id_grupo} label="Grupo do Produto" onChange={handleProductFormChange} disabled={savingProduct}>
                              <MenuItem value=""><em>Nenhum</em></MenuItem>
                              {grupos.map((g) => (<MenuItem key={g.id_grupo} value={g.id_grupo}>{g.nome_grupo}</MenuItem>))}
                            </Select>
                          </FormControl>

                          {(permissions.config_apoio_criar || user.is_staff) && (
                            <IconButton color="primary" aria-label="adicionar novo grupo" onClick={() => handleOpenGroupForm(null)} disabled={savingProduct} sx={{ flexShrink: 0 }}><AddIcon /></IconButton>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel id="deposito-label">Depósito</InputLabel>
                          <Select labelId="deposito-label" id="id_deposito" name="id_deposito" value={productFormData.id_deposito} label="Depósito" onChange={handleProductFormChange} disabled={savingProduct || !!editingProduct}>
                            <MenuItem value=""><em>Nenhum</em></MenuItem>
                            {depositos.map((d) => (
                              <MenuItem key={d.id ?? JSON.stringify(d)} value={d.id}>{d.nome ?? d.descricao ?? '—'}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {/* Exibe o depósito selecionado e a quantidade disponível (se houver) */}
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {productFormData.id_deposito ? `Depósito: ${getDepositoName(productFormData.id_deposito)} | Qtd: ${getProdutoQuantidade(editingProduct ?? {}, productFormData.id_deposito)}` : 'Depósito não selecionado'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}><TextField name="marca" label="Marca" value={productFormData.marca} onChange={handleProductFormChange} disabled={savingProduct} fullWidth /></Grid>
                      <Grid item xs={12} sm={6}><TextField name="unidade_medida" label="Un. Medida (ex: UN, CX, KG)" value={productFormData.unidade_medida} onChange={handleProductFormChange} disabled={savingProduct} fullWidth /></Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel id="classificacao-label">Classificação</InputLabel>
                          <Select labelId="classificacao-label" id="classificacao" name="classificacao" value={productFormData.classificacao} label="Classificação" onChange={handleProductFormChange} disabled={savingProduct}>
                            <MenuItem value="Revenda">Revenda</MenuItem><MenuItem value="Materia-Prima">Matéria-Prima</MenuItem><MenuItem value="Imobilizado">Imobilizado</MenuItem><MenuItem value="Insumo">Insumo</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </TabPanel>
                  <TabPanel value={productTabValue} index={1}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}><TextField name="ncm" label="NCM" value={productFormData.ncm} onChange={handleProductFormChange} disabled={savingProduct} fullWidth /></Grid>
                      <Grid item xs={12} sm={4}><TextField name="valor_compra" label="Valor Compra (R$)" type="number" value={productFormData.valor_compra} onChange={handleProductFormChange} disabled={savingProduct} fullWidth InputProps={{ inputProps: { min: 0, step: 0.01 } }} /></Grid>
                      <Grid item xs={12} sm={4}><TextField name="valor_custo" label="Valor Custo (R$)" type="number" value={productFormData.valor_custo} onChange={handleProductFormChange} disabled={savingProduct} fullWidth InputProps={{ inputProps: { min: 0, step: 0.01 } }} /></Grid>
                      <Grid item xs={12} sm={4}><TextField name="valor_venda" label="Valor Venda (R$)" type="number" value={productFormData.valor_venda} onChange={handleProductFormChange} disabled={savingProduct} required fullWidth InputProps={{ inputProps: { min: 0, step: 0.01 } }} /></Grid>
                    </Grid>
                  </TabPanel>
                  <TabPanel value={productTabValue} index={2}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}><TextField name="descricao" label="Descriçéo / Detalhes" value={productFormData.descricao} onChange={handleProductFormChange} disabled={savingProduct} fullWidth multiline rows={4} /></Grid>
                      <Grid item xs={12}><TextField name="observacoes" label="Observações" value={productFormData.observacoes} onChange={handleProductFormChange} disabled={savingProduct} fullWidth multiline rows={4} /></Grid>
                    </Grid>
                  </TabPanel>
                  <TabPanel value={productTabValue} index={3}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={8}><TextField name="imagem_url" label="URL da Imagem do Produto" value={productFormData.imagem_url} onChange={handleProductFormChange} disabled={savingProduct} fullWidth helperText="Insira a URL de uma imagem para o logotipo." /></Grid>
                      <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                        {productFormData.imagem_url ? (<Box component="img" src={productFormData.imagem_url} alt="Imagem do Produto" sx={{ maxWidth: 120, maxHeight: 120, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 1 }} />) : (<Box sx={{ width: 120, height: 120, bgcolor: 'grey.300', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}><InventoryIcon sx={{ fontSize: 60, color: 'grey.600' }} /></Box>)}
                      </Grid>
                    </Grid>
                  </TabPanel>
                  {configProduto.produto_em_grade && !editingProduct && (
                    <TabPanel value={productTabValue} index={4}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        🎯 Modo Grade: Adicione tamanhos e/ou cores para criar automaticamente múltiplas variações do produto.
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Paper elevation={1} sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>Tamanhos</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                              <TextField
                                size="small"
                                label="Adicionar Tamanho"
                                value={tamanhoInput}
                                onChange={(e) => setTamanhoInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && tamanhoInput.trim()) {
                                    e.preventDefault();
                                    if (!tamanhos.includes(tamanhoInput.trim())) {
                                      setTamanhos([...tamanhos, tamanhoInput.trim()]);
                                      setTamanhoInput('');
                                    }
                                  }
                                }}
                                fullWidth
                                placeholder="Ex: P, M, G, GG"
                              />
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                  if (tamanhoInput.trim() && !tamanhos.includes(tamanhoInput.trim())) {
                                    setTamanhos([...tamanhos, tamanhoInput.trim()]);
                                    setTamanhoInput('');
                                  }
                                }}
                              >
                                <AddIcon />
                              </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {tamanhos.map((t, idx) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    bgcolor: 'primary.light',
                                    color: 'primary.contrastText',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1,
                                  }}
                                >
                                  <Typography variant="body2">{t}</Typography>
                                  <IconButton
                                    size="small"
                                    sx={{ ml: 0.5, color: 'inherit' }}
                                    onClick={() => setTamanhos(tamanhos.filter((_, i) => i !== idx))}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              ))}
                            </Box>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Paper elevation={1} sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>Cores</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                              <TextField
                                size="small"
                                label="Adicionar Cor"
                                value={corInput}
                                onChange={(e) => setCorInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && corInput.trim()) {
                                    e.preventDefault();
                                    if (!cores.includes(corInput.trim())) {
                                      setCores([...cores, corInput.trim()]);
                                      setCorInput('');
                                    }
                                  }
                                }}
                                fullWidth
                                placeholder="Ex: Vermelho, Azul, Preto"
                              />
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                  if (corInput.trim() && !cores.includes(corInput.trim())) {
                                    setCores([...cores, corInput.trim()]);
                                    setCorInput('');
                                  }
                                }}
                              >
                                <AddIcon />
                              </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {cores.map((c, idx) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    bgcolor: 'secondary.light',
                                    color: 'secondary.contrastText',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1,
                                  }}
                                >
                                  <Typography variant="body2">{c}</Typography>
                                  <IconButton
                                    size="small"
                                    sx={{ ml: 0.5, color: 'inherit' }}
                                    onClick={() => setCores(cores.filter((_, i) => i !== idx))}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              ))}
                            </Box>
                          </Paper>
                        </Grid>
                        {(tamanhos.length > 0 || cores.length > 0) && (
                          <Grid item xs={12}>
                            <Paper elevation={2} sx={{ p: 2, bgcolor: 'info.light' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                📊 Prévia das Variações
                              </Typography>
                              <Typography variant="body2">
                                {tamanhos.length > 0 && cores.length > 0
                                  ? `Serão criados ${tamanhos.length * cores.length} produtos (${tamanhos.length} tamanhos × ${cores.length} cores)`
                                  : tamanhos.length > 0
                                  ? `Serão criados ${tamanhos.length} produtos com tamanhos diferentes`
                                  : `Serão criados ${cores.length} produtos com cores diferentes`}
                              </Typography>
                              {tamanhos.length > 0 && cores.length > 0 && (
                                <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                                  <Typography variant="caption" component="div">
                                    Exemplos:
                                  </Typography>
                                  {tamanhos.slice(0, 2).map(t => (
                                    cores.slice(0, 3).map(c => (
                                      <Typography key={`${t}-${c}`} variant="caption" component="div">
                                        • {productFormData.nome_produto || 'Produto'} - {t} - {c}
                                      </Typography>
                                    ))
                                  ))}
                                  {(tamanhos.length * cores.length) > 6 && (
                                    <Typography variant="caption" color="text.secondary">
                                      ... e mais {(tamanhos.length * cores.length) - 6} variações
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Paper>
                          </Grid>
                        )}
                      </Grid>
                    </TabPanel>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, p: 3, pt: 0 }}>
                    <Button startIcon={<CloseIcon />} onClick={handleCancelEditProduct} disabled={savingProduct} sx={{ mr: 1 }}>Cancelar</Button>
                    <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={savingProduct}>
                      {savingProduct ? <CircularProgress size={24} /> : (editingProduct ? 'Salvar Alterações' : 'Salvar Novo Produto')}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Fade>
          )}

          {/* Área da Lista de Produtos */}
          {!showProductForm && (
            <>
              <Typography variant="h6" sx={{ mt: 3, alignSelf: 'flex-start' }}>Lista de Produtos:</Typography>
              {loadingProdutos ? (<CircularProgress sx={{ mt: 2 }} />)
                : produtos.length === 0 ? (<Typography sx={{ mt: 2 }}>(Nenhum produto cadastrado)</Typography>)
                  : (
                    <List sx={{ width: '100%', bgcolor: 'background.paper', mt: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                      {produtos.map((produto, index) => (
                        <React.Fragment key={produto.id_produto}>
                          <ListItem secondaryAction={
                            <>
                              {/* 1. botão EDITAR */}
                              {(permissions.produtos_editar || user.is_staff) && (
                                <IconButton edge="end" aria-label="edit" onClick={() => handleEditProductClick(produto)}>
                                  <EditIcon />
                                </IconButton>
                              )}

                              {/* 2. botão EXCLUIR/SOLICITAR (Fase 3) */}
                              {(permissions.produtos_excluir || user.is_staff) ? (
                                <IconButton edge="end" aria-label="delete" sx={{ ml: 1 }} onClick={() => handleDeleteProductClick(produto.id_produto)}>
                                  <DeleteIcon color="error" />
                                </IconButton>
                              ) : (
                                <Tooltip title="Solicitar Exclusão">
                                  <IconButton edge="end" aria-label="request-delete" sx={{ ml: 1 }} onClick={() => handleRequestExclusion(produto)}>
                                    <LockIcon fontSize="small" color="error" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          }>
                            <Avatar variant="square" src={produto.imagem_url} alt="Img" sx={{ width: 40, height: 40, mr: 2 }}>{!produto.imagem_url && <InventoryIcon />}</Avatar>
                            <ListItemText
                              primary={`${produto.nome_produto} (${produto.codigo_produto || 'S/C'})`}
                              secondary={`Venda: R$ ${produto.valor_venda} | Depósito: ${getDepositoName(depositoSelecionado)} | Qtd: ${getProdutoQuantidade(produto, depositoSelecionado)} | Status: ${getStatusPorDeposito(produto, depositoSelecionado)} | Grupo: ${getGroupName(produto.id_grupo)}`}
                            />
                          </ListItem>
                          {index < produtos.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
            </>
          )}
        </Box>
      </Fade>

      {/* Popup (Modal) para Cadastro de Grupo (necessário para o atalho do form) */}
      <Dialog open={showGroupForm} onClose={handleCloseGroupForm} fullWidth maxWidth="sm">
        <DialogTitle>{editingGroup ? 'Editar Grupo' : 'Adicionar Novo Grupo'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus margin="dense" name="nome_grupo"
            label={'Nome do Grupo'}
            type="text" fullWidth variant="standard"
            value={groupFormData.nome_grupo}
            onChange={(e) => setGroupFormData({ nome_grupo: e.target.value })}
            disabled={savingGroup}
          />
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CloseIcon />} onClick={handleCloseGroupForm} disabled={savingGroup}>Cancelar</Button>
          <Button startIcon={<SaveIcon />} onClick={handleSaveGroup} variant="contained" disabled={savingGroup}>
            {savingGroup ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- 4. Popup de Solicitação (Fase 3) --- */}
      <SolicitacaoDialog
        open={showSolicitacao}
        onClose={() => setShowSolicitacao(false)}
        itemParaSolicitar={itemParaSolicitar} // Usa o nome genérico
        tipoAcao="EXCLUIR_PRODUTO"
        supervisores={supervisores}
      />

    </React.Fragment>
  );
}

export default ProductPage;