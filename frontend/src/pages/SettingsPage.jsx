// Em: src/pages/SettingsPage.jsx
// --- VERsão FINAL FASE 2 (Estável e Desmembrada) ---

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Fade, CircularProgress,
  List, ListItem, ListItemText, IconButton, Divider, Grid,
  Paper, Button, Tooltip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
// Grid from @mui/material is used (Unstable_Grid2 not available in this environment)
// Ícones
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import ArticleIcon from '@mui/icons-material/Article';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import PeopleIcon from '@mui/icons-material/People';
import LockIcon from '@mui/icons-material/Lock';

// Helpers
import { useAuth } from '../context/AuthContext';
import { tryGetDepositos } from '../lib/depositosApi';
import { useNavigate } from 'react-router-dom';

// --- Importa os "Pedaços" (Popups) ---
import UserDialog from '../components/UserDialog';
import VendedorDialog from '../components/VendedorDialog';
import EmpresaDialog from '../components/EmpresaDialog';
import OperacaoDialog from '../components/OperacaoDialog';
import ConfigSimplesDialog from '../components/ConfigSimplesDialogNew';
import FormaPagamentoDialog from '../components/FormaPagamentoDialog';
import SolicitacaoDialog from '../components/SolicitacaoDialog';

// --- Componente Principal ---
function SettingsPage() {

  const { user, permissions, axiosInstance, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // --- Estados dos Dados ---
  const [grupos, setGrupos] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [centrosCusto, setCentrosCusto] = useState([]);
  const [contasBancarias, setContasBancarias] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [depositos, setDepositos] = useState([]);
  // O axiosInstance do AuthContext já tem baseURL '/api', entéo o endpoint deve ser relativo a isso
  const [depositosEndpoint, setDepositosEndpoint] = useState('/api/depositos/');
  const [depositosEndpointError, setDepositosEndpointError] = useState('');
  const [depositosAttempts, setDepositosAttempts] = useState([]);
  const [showDepositosAttemptsDialog, setShowDepositosAttemptsDialog] = useState(false);
  const [operacoes, setOperacoes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [supervisores, setSupervisores] = useState([]);

  // --- Estados de Controle dos Popups ---
  const [showConfigSimples, setShowConfigSimples] = useState(false);
  const [configSimplesTipo, setConfigSimplesTipo] = useState('');
  const [editingConfigSimples, setEditingConfigSimples] = useState(null);
  const [showOperacao, setShowOperacao] = useState(false);
  const [editingOperacao, setEditingOperacao] = useState(null);
  const [showEmpresa, setShowEmpresa] = useState(false);
  const [showVendedor, setShowVendedor] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState(null);
  const [showUser, setShowUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showSolicitacao, setShowSolicitacao] = useState(false);
  const [itemParaSolicitar, setItemParaSolicitar] = useState(null);
  const [tipoAcao, setTipoAcao] = useState('');

  // --- Funções de Busca ---

  const fetchAllSupportData = async () => {
    setLoadingConfig(true);
    try {
      const fetches = [
        axiosInstance.get('/grupos-produto/'),
        axiosInstance.get('/departamentos/'),
        axiosInstance.get('/centro-custo/'),
        axiosInstance.get('/contas-bancarias/'),
        axiosInstance.get('/operacoes/'),
        axiosInstance.get('/empresa/'),
        axiosInstance.get('/funcoes/'),
        axiosInstance.get('/vendedores/'),
        axiosInstance.get('/usuarios/'),
        axiosInstance.get('/clientes/'),
        // Removido: axiosInstance.get('/formas-pagamento/') 
      ];

      if (!user.is_staff) {
        fetches.push(axiosInstance.get('/usuarios/?is_staff=True'));
      }

      const results = await Promise.all(fetches);

      setGrupos(results[0].data);
      setDepartamentos(results[1].data);
      setCentrosCusto(results[2].data);
      setContasBancarias(results[3].data);
      setOperacoes(results[4].data);
      setEmpresas(results[5].data);
      setFuncoes(results[6].data);
      setVendedores(results[7].data);
      setUsuarios(results[8].data);
      setClientes(results[9].data);
      // Buscando formas de pagamento separadamente (evita deslocamento de índices caso haja fetches condicionais)
      try {
        const formasRes = await axiosInstance.get('/formas-pagamento/');
        // Normaliza os objetos retornados para uma forma consistente na UI
        const normalizeForma = (it) => ({
          id: it.id_forma_pagamento || it.id || it.pk || null,
          nome: it.nome_forma_pagamento || it.nome_forma || it.nome || it.descricao || '—',
          quantidade_dias: it.quantidade_dias ?? it.dias ?? it.qtd_dias ?? null,
          raw: it,
        });
        setFormasPagamento(Array.isArray(formasRes.data) ? formasRes.data.map(normalizeForma) : []);
      } catch (err) {
        console.error('Erro ao buscar formas de pagamento:', err?.message || err);
        setFormasPagamento([]);
      }
      // Busca depósitos (tenta múltiplos endpoints conhecidos)
      try {
        const resObj = await tryGetDepositos(axiosInstance, depositosEndpoint);
        const data = resObj?.data;
        const normalizeDep = (it) => ({
          id: it.id || it.pk || null,
          nome: it.nome || it.descricao || '—',
          raw: it
        });
        setDepositos(Array.isArray(data) ? data.map(normalizeDep) : []);
        setDepositosEndpointError('');
        setDepositosAttempts([]);
      } catch (err) {
        console.error('Erro ao buscar depósitos:', err?.message || err);
        setDepositos([]);
        setDepositosEndpointError(err?.message || String(err));
        setDepositosAttempts(err?.attempts || []);
      }
      if (!user.is_staff) {
        setSupervisores(results[10].data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de configuração:', error.message);
    }
    finally { setLoadingConfig(false); }
  };

  useEffect(() => {
    if (!authLoading) {
      if (permissions.config_acessar || user.is_staff) {
        fetchAllSupportData();
      } else {
        setLoadingConfig(false);
      }
    }
  }, [authLoading, user, permissions]);


  // --- Funções de Abrir Popups ---

  const handleOpenConfigSimples = (tipo, item = null) => {
    setConfigSimplesTipo(tipo);
    // Normalize item for dialog: some dialogs expect different field names depending on backend shape.
    if (item && tipo === 'FormaPagamento') {
      // item may be the normalized object (f) or raw. Create a composite object with common aliases so dialog can pick the field it expects.
      const raw = item.raw || item;
      const composite = {
        // ids
        id: item.id || raw.id || raw.id_forma_pagamento || raw.pk || null,
        id_forma_pagamento: item.id || raw.id || raw.id_forma_pagamento || raw.pk || null,
        // names
        nome: item.nome || item.nome_forma_pagamento || raw.nome || raw.nome_forma_pagamento || raw.descricao || '',
        nome_forma_pagamento: item.nome || item.nome_forma_pagamento || raw.nome || raw.nome_forma_pagamento || raw.descricao || '',
        descricao: raw.descricao || item.descricao || '',
        // quantidade dias aliases
        quantidade_dias: item.quantidade_dias ?? raw.quantidade_dias ?? raw.dias ?? raw.qtd_dias ?? null,
        dias: item.quantidade_dias ?? raw.dias ?? raw.quantidade_dias ?? raw.qtd_dias ?? null,
        qtd_dias: item.quantidade_dias ?? raw.qtd_dias ?? raw.dias ?? raw.quantidade_dias ?? null,
        // keep raw for backwards compatibility
        raw: raw,
        // preserve original normalized object too
        normalized: item
      };
      setEditingConfigSimples(composite);
    } else {
      setEditingConfigSimples(item);
    }
    setShowConfigSimples(true);
  };

  const handleOpenOperacaoForm = (op = null) => {
    setEditingOperacao(op);
    setShowOperacao(true);
  };

  const handleOpenEmpresaForm = () => {
    setShowEmpresa(true);
  };

  const handleOpenVendedorForm = (vendedor = null) => {
    setEditingVendedor(vendedor);
    setShowVendedor(true);
  };

  const handleOpenUserForm = (user = null) => {
    setEditingUser(user);
    setShowUser(true);
  };

  const handleRequestExclusion = (item, tipo) => {
    let itemFormatado;

    if (tipo === 'EXCLUIR_USUARIO') {
      itemFormatado = { id_cliente: item.id, nome_razao_social: item.username, cpf_cnpj: item.email || 'N/A' };
    } else if (tipo === 'EXCLUIR_VENDEDOR') {
      itemFormatado = { id_cliente: item.id_vendedor, nome_razao_social: item.nome, cpf_cnpj: item.cpf };
    } else if (tipo === 'EXCLUIR_OPERACAO') {
      itemFormatado = { id_cliente: item.id_operacao, nome_razao_social: item.nome_operacao, cpf_cnpj: `Mod: ${item.modelo_documento}` };
    } else {
      // Lógica genérica para cadastros simples
      const nomeKey = Object.keys(item).find(k => k.startsWith('nome_'));
      const idKey = Object.keys(item).find(k => k.startsWith('id_'));
      itemFormatado = { id_cliente: item[idKey], nome_razao_social: item[nomeKey], cpf_cnpj: `Tipo: ${tipo}` };
    }

    setItemParaSolicitar(itemFormatado);
    setTipoAcao(tipo);
    setShowSolicitacao(true);
  };


  // --- Funções de Excluir (Delete) ---

  const handleDeleteConfigClick = async (tipo, item) => {
    console.log('handleDeleteConfigClick called', tipo, item);
    let id = null; let nome = ''; let url = '';
    if (tipo === 'Grupo') { id = item.id_grupo; nome = item.nome_grupo; url = '/api/grupos-produto/'; }
    else if (tipo === 'Departamento') { id = item.id_departamento; nome = item.nome_departamento; url = '/api/departamentos/'; }
    else if (tipo === 'CentroCusto') { id = item.id_centro_custo; nome = item.nome_centro_custo; url = '/api/centro-custo/'; }
    else if (tipo === 'ContaBancaria') { id = item.id_conta_bancaria; nome = item.nome_conta; url = '/api/contas-bancarias/'; }
    else if (tipo === 'Funcao') { id = item.id_funcao; nome = item.nome_funcao; url = '/api/funcoes/'; }
    else if (tipo === 'FormaPagamento') { id = item.id_forma_pagamento || item.id; nome = item.nome_forma_pagamento || item.nome || item.descricao || 'Forma'; url = '/api/formas-pagamento/'; }
    else if (tipo === 'Deposito') {
      // item pode ser o objeto normalizado ou raw
      const raw = item.raw || item;
      id = raw.id || raw.pk || null;
      nome = raw.nome || raw.descricao || 'Depósito';
      // axiosInstance.baseURL já inclui '/api' — use endpoints relativos
      url = '/api/depositos/';
    }
    else { return; }

    if (!window.confirm(`Excluir ${tipo}: ${nome}? \n(Pode falhar se estiver em uso).`)) return;
    setLoadingConfig(true);
    try {
      if (tipo === 'Deposito') {
        if (!id) {
          alert('não foi possível identificar o ID deste depósito para exclusão.');
          setLoadingConfig(false);
          return;
        }
        const { tryDeleteDeposito } = await import('../lib/depositosApi');
        // Passa depositosEndpoint (pode ser null) para orientar o helper
        await tryDeleteDeposito(axiosInstance, id, depositosEndpoint);
      } else {
        await axiosInstance.delete(`${url}${id}/`);
      }
      alert(`${tipo} excluído com sucesso!`);
      fetchAllSupportData();
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      if (error?.attempts) console.debug('Tentativas de DELETE:', error.attempts);
      alert(`Erro ao excluir ${tipo}. Verifique se não está em uso.`);
      setLoadingConfig(false);
    }
  };

  const handleDeleteOperacaoClick = async (id) => {
    if (!window.confirm('Excluir esta operação? \n(Pode falhar se estiver em uso).')) return;
    setLoadingConfig(true);
    try {
      await axiosInstance.delete(`/operacoes/${id}/`);
      alert('Operação excluída!');
      fetchAllSupportData();
    }
    catch (error) {
      alert('Erro ao excluir operação. Verifique se não está em uso.');
      setLoadingConfig(false);
    }
  };

  const handleDeleteVendedorClick = async (id) => {
    if (!window.confirm('Excluir este vendedor?')) return;
    setLoadingConfig(true);
    try {
      await axiosInstance.delete(`/vendedores/${id}/`);
      alert('Vendedor excluído!');
      fetchAllSupportData();
    }
    catch (error) {
      alert('Erro ao excluir vendedor.');
      setLoadingConfig(false);
    }
  };

  const handleDeleteUserClick = async (id) => {
    if (id === user.id) {
      alert('Você não pode excluir o usuário que está logado.');
      return;
    }
    if (!window.confirm('Excluir este usuário? Esta ação é irreversível.')) return;
    setLoadingConfig(true);
    try {
      await axiosInstance.delete(`/usuarios/${id}/`);
      alert('Usuário excluído!');
      fetchAllSupportData();
    }
    catch (error) {
      alert('Erro ao excluir usuário.');
      setLoadingConfig(false);
    }
  };

  // --- Verificações de Loading e Permissão ---

  if (authLoading || loadingConfig) {
    return <CircularProgress />;
  }

  if (!user.is_staff && !permissions.config_acessar) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>
          <LockIcon sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
          Acesso Negado
        </Typography>
        <Typography variant="body1">
          Você não tem permissão para acessar o módulo de Configurações.
        </Typography>
      </Box>
    )
  }

  // --- Renderização Principal (Cards) ---
  return (
    <React.Fragment>
      <Fade in={true} timeout={500}>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ alignSelf: 'flex-start' }}>Configurações e Cadastros de Apoio</Typography>
            {(permissions.financeiro_acessar || user.is_staff) && (
              <Button variant="outlined" startIcon={<AccountBalanceIcon />} onClick={() => navigate('/bancario')}>
                Bancário
              </Button>
            )}
          </Box>

          <Grid container spacing={3}>

            {/* Card 0: Empresa */}
            {(permissions.config_empresa_editar || user.is_staff) && (
              <Box sx={{ width: { xs: '100%', md: '50%', lg: '33.333%' } }}>
                <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} /> Dados da Empresa</Typography>
                    <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={handleOpenEmpresaForm}>Editar</Button>
                  </Box>
                </Paper>
              </Box>
            )}

            {/* Card 1: Usuários */}
            {(permissions.config_usuarios_acessar || user.is_staff) && (
              <Box sx={{ width: { xs: '100%', md: '50%', lg: '33.333%' } }}>
                <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 200 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} /> Usuários</Typography>
                    {(permissions.config_usuarios_criar || user.is_staff) && (
                      <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenUserForm(null)}>Add</Button>
                    )}
                  </Box>
                  <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                    {usuarios.map((item) => (
                      <ListItem key={item.id} secondaryAction={
                        <>
                          {(permissions.config_usuarios_editar || user.is_staff) && (
                            <IconButton edge="end" size="small" onClick={() => handleOpenUserForm(item)}><EditIcon fontSize="small" /></IconButton>
                          )}
                          {(permissions.config_usuarios_excluir || user.is_staff) ? (
                            <IconButton edge="end" size="small" onClick={() => handleDeleteUserClick(item.id)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                          ) : (
                            <Tooltip title="Solicitar Exclusão">
                              <IconButton edge="end" size="small" onClick={() => handleRequestExclusion(item, 'EXCLUIR_USUARIO')}><LockIcon fontSize="small" color="error" /></IconButton>
                            </Tooltip>
                          )}
                        </>
                      }>
                        <ListItemText primary={item.username} secondary={item.is_staff ? "Administrador" : (item.email || "Usuário Padréo")} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            )}

            {/* Card 2: Vendedores */}
            {(permissions.config_vendedores_acessar || user.is_staff) && (
              <Box sx={{ width: { xs: '100%', md: '50%', lg: '33.333%' } }}>
                <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 200 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><BadgeIcon sx={{ mr: 1, color: 'text.secondary' }} /> Vendedores</Typography>
                    {(permissions.config_vendedores_criar || user.is_staff) && (
                      <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenVendedorForm(null)}>Add</Button>
                    )}
                  </Box>
                  <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                    {vendedores.map((item) => (
                      <ListItem key={item.id_vendedor} secondaryAction={
                        <>
                          {(permissions.config_vendedores_editar || user.is_staff) && (
                            <IconButton edge="end" size="small" onClick={() => handleOpenVendedorForm(item)}><EditIcon fontSize="small" /></IconButton>
                          )}
                          {(permissions.config_vendedores_excluir || user.is_staff) ? (
                            <IconButton edge="end" size="small" onClick={() => handleDeleteVendedorClick(item.id_vendedor)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                          ) : (
                            <Tooltip title="Solicitar Exclusão">
                              <IconButton edge="end" size="small" onClick={() => handleRequestExclusion(item, 'EXCLUIR_VENDEDOR')}><LockIcon fontSize="small" color="error" /></IconButton>
                            </Tooltip>
                          )}
                        </>
                      }>
                        <ListItemText primary={item.nome} secondary={item.username ? `Usuário: ${item.username}` : 'Sem usuário'} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            )}

            {/* Card 3: Operações */}
            {(permissions.config_operacoes_acessar || user.is_staff) && (
              <Box sx={{ width: { xs: '100%', md: '50%', lg: '33.333%' } }}>
                <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 200 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><ArticleIcon sx={{ mr: 1, color: 'text.secondary' }} /> Operações</Typography>
                    {(permissions.config_operacoes_criar || user.is_staff) && (
                      <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenOperacaoForm(null)}>Add</Button>
                    )}
                  </Box>
                  <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                    {operacoes.map((item) => (
                      <ListItem key={item.id_operacao} secondaryAction={
                        <>
                          {(permissions.config_operacoes_editar || user.is_staff) && (
                            <IconButton edge="end" size="small" onClick={() => handleOpenOperacaoForm(item)}><EditIcon fontSize="small" /></IconButton>
                          )}
                          {(permissions.config_operacoes_excluir || user.is_staff) ? (
                            <IconButton edge="end" size="small" onClick={() => handleDeleteOperacaoClick(item.id_operacao)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                          ) : (
                            <Tooltip title="Solicitar Exclusão">
                              <IconButton edge="end" size="small" onClick={() => handleRequestExclusion(item, 'EXCLUIR_OPERACAO')}><LockIcon fontSize="small" color="error" /></IconButton>
                            </Tooltip>
                          )}
                        </>
                      }>
                        <ListItemText primary={item.nome_operacao} secondary={`Mod: ${item.modelo_documento || '-'} | Estoque: ${item.tipo_estoque_baixa}`} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            )}

            {/* Cadastros de Apoio (Funções, Grupos, etc.) */}
            {(permissions.config_apoio_acessar || user.is_staff) && (
              <>
                {/* FUNÇÕES */}
                <Box sx={{ width: { xs: '100%', md: '50%', lg: '33.333%' } }}>
                  <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><AssignmentIndIcon sx={{ mr: 1, color: 'text.secondary' }} /> Funções</Typography>
                      {(permissions.config_apoio_criar || user.is_staff) && (
                        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenConfigSimples('Funcao', null)}>Add</Button>
                      )}
                    </Box>
                    <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                      {funcoes.map((item) => (
                        <ListItem key={item.id_funcao} secondaryAction={
                          <>
                            {(permissions.config_apoio_editar || user.is_staff) && (
                              <IconButton edge="end" size="small" onClick={() => handleOpenConfigSimples('Funcao', item)}><EditIcon fontSize="small" /></IconButton>
                            )}
                            {(permissions.config_apoio_excluir || user.is_staff) ? (
                              <IconButton edge="end" size="small" onClick={() => handleDeleteConfigClick('Funcao', item)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                            ) : (
                              <Tooltip title="Solicitar Exclusão">
                                <IconButton edge="end" size="small" onClick={() => handleRequestExclusion(item, 'EXCLUIR_FUNCAO')}><LockIcon fontSize="small" color="error" /></IconButton>
                              </Tooltip>
                            )}
                          </>
                        }>
                          <ListItemText primary={item.nome_funcao} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>

                {/* GRUPOS DE PRODUTO */}
                <Box sx={{ width: { xs: '100%', md: '50%', lg: '33.333%' } }}>
                  <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><FolderIcon sx={{ mr: 1, color: 'text.secondary' }} /> Grupos de Produto</Typography>
                      {(permissions.config_apoio_criar || user.is_staff) && (
                        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenConfigSimples('Grupo', null)}>Add</Button>
                      )}
                    </Box>
                    <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                      {grupos.map((item) => (
                        <ListItem key={item.id_grupo} secondaryAction={
                          <>
                            {(permissions.config_apoio_editar || user.is_staff) && (
                              <IconButton edge="end" size="small" onClick={() => handleOpenConfigSimples('Grupo', item)}><EditIcon fontSize="small" /></IconButton>
                            )}
                            {(permissions.config_apoio_excluir || user.is_staff) ? (
                              <IconButton edge="end" size="small" onClick={() => handleDeleteConfigClick('Grupo', item)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                            ) : (
                              <Tooltip title="Solicitar Exclusão">
                                <IconButton edge="end" size="small" onClick={() => handleRequestExclusion(item, 'EXCLUIR_GRUPO')}><LockIcon fontSize="small" color="error" /></IconButton>
                              </Tooltip>
                            )}
                          </>
                        }>
                          <ListItemText primary={item.nome_grupo} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>

                {/* DEPARTAMENTOS */}
                <Box sx={{ width: { xs: '100%', md: '50%', lg: '33.333%' } }}>
                  <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><BusinessCenterIcon sx={{ mr: 1, color: 'text.secondary' }} /> Departamentos</Typography>
                      {(permissions.config_apoio_criar || user.is_staff) && (
                        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenConfigSimples('Departamento', null)}>Add</Button>
                      )}
                    </Box>
                    <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                      {departamentos.map((item) => (
                        <ListItem key={item.id_departamento} secondaryAction={
                          <>
                            {(permissions.config_apoio_editar || user.is_staff) && (
                              <IconButton edge="end" size="small" onClick={() => handleOpenConfigSimples('Departamento', item)}><EditIcon fontSize="small" /></IconButton>
                            )}
                            {(permissions.config_apoio_excluir || user.is_staff) ? (
                              <IconButton edge="end" size="small" onClick={() => handleDeleteConfigClick('Departamento', item)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                            ) : (
                              <Tooltip title="Solicitar Exclusão">
                                <IconButton edge="end" size="small" onClick={() => handleRequestExclusion(item, 'EXCLUIR_DEPARTAMENTO')}><LockIcon fontSize="small" color="error" /></IconButton>
                              </Tooltip>
                            )}
                          </>
                        }>
                          <ListItemText primary={item.nome_departamento} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>

                {/* CENTROS DE CUSTO */}
                <Box sx={{ width: { xs: '100%', md: '50%', lg: '33.333%' } }}>
                  <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><DonutLargeIcon sx={{ mr: 1, color: 'text.secondary' }} /> Centros de Custo</Typography>
                      {(permissions.config_apoio_criar || user.is_staff) && (
                        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenConfigSimples('CentroCusto', null)}>Add</Button>
                      )}
                    </Box>
                    <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                      {centrosCusto.map((item) => (
                        <ListItem key={item.id_centro_custo} secondaryAction={
                          <>
                            {(permissions.config_apoio_editar || user.is_staff) && (
                              <IconButton edge="end" size="small" onClick={() => handleOpenConfigSimples('CentroCusto', item)}><EditIcon fontSize="small" /></IconButton>
                            )}
                            {(permissions.config_apoio_excluir || user.is_staff) ? (
                              <IconButton edge="end" size="small" onClick={() => handleDeleteConfigClick('CentroCusto', item)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                            ) : (
                              <Tooltip title="Solicitar Exclusão">
                                <IconButton edge="end" size="small" onClick={() => handleRequestExclusion(item, 'EXCLUIR_CENTROCUSTO')}><LockIcon fontSize="small" color="error" /></IconButton>
                              </Tooltip>
                            )}
                          </>
                        }>
                          <ListItemText primary={item.nome_centro_custo} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>

                {/* CONTAS BANCÁRIAS */}
                <Box sx={{ width: { xs: '100%', md: '50%', lg: '33.333%' } }}>
                  <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><AccountBalanceIcon sx={{ mr: 1, color: 'text.secondary' }} /> Contas (Caixa/Banco)</Typography>
                      {(permissions.config_apoio_criar || user.is_staff) && (
                        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenConfigSimples('ContaBancaria', null)}>Add</Button>
                      )}
                    </Box>
                    <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                      {contasBancarias.map((item) => (
                        <ListItem key={item.id_conta_bancaria} secondaryAction={
                          <>
                            {(permissions.config_apoio_editar || user.is_staff) && (
                              <IconButton edge="end" size="small" onClick={() => handleOpenConfigSimples('ContaBancaria', item)}><EditIcon fontSize="small" /></IconButton>
                            )}
                            {(permissions.config_apoio_excluir || user.is_staff) ? (
                              <IconButton edge="end" size="small" onClick={() => handleDeleteConfigClick('ContaBancaria', item)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                            ) : (
                              <Tooltip title="Solicitar Exclusão">
                                <IconButton edge="end" size="small" onClick={() => handleRequestExclusion(item, 'EXCLUIR_CONTABANCARIA')}><LockIcon fontSize="small" color="error" /></IconButton>
                              </Tooltip>
                            )}
                          </>
                        }>
                          <ListItemText primary={item.nome_conta} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>

                {/* DEPÓSITOS */}
                <Box sx={{ width: { xs: '100%', md: '50%', lg: '33.333%' } }}>
                  <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><AccountBalanceIcon sx={{ mr: 1, color: 'text.secondary' }} /> Depósitos</Typography>
                        {depositosEndpointError && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField size="small" label="Endpoint depósitos" value={depositosEndpoint} onChange={(e) => setDepositosEndpoint(e.target.value)} />
                            <Button size="small" variant="outlined" onClick={async () => {
                              try {
                                setLoadingConfig(true);
                                // Usa o helper para testar, assim as tentativas são registradas
                                const resObj = await tryGetDepositos(axiosInstance, depositosEndpoint);
                                const data = resObj?.data;
                                setDepositos(Array.isArray(data) ? data.map(it => ({ id: it.id || it.pk || null, nome: it.nome || it.descricao || '—', raw: it })) : []);
                                setDepositosEndpointError('');
                                setDepositosAttempts([]);
                                // Salva o endpoint testado como padréo para sessões futuras
                                try { localStorage.setItem('depositosEndpointOverride', depositosEndpoint); } catch (e) { /* ignore */ }
                              } catch (err) {
                                setDepositosEndpointError(err?.message || String(err));
                                setDepositosAttempts(err?.attempts || []);
                              } finally { setLoadingConfig(false); }
                            }}>Testar</Button>
                            {depositosAttempts.length > 0 && (
                              <Button size="small" onClick={() => setShowDepositosAttemptsDialog(true)} sx={{ ml: 1 }}>Mostrar tentativas</Button>
                            )}
                          </Box>
                        )}
                      </Box>
                      {(permissions.config_apoio_criar || user.is_staff) && (
                        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenConfigSimples('Deposito', null)}>Add</Button>
                      )}
                    </Box>
                    {depositosEndpointError && (
                      <Typography color="error" sx={{ px: 1, mb: 1 }}>{`Erro ao buscar depósitos: ${depositosEndpointError}`}</Typography>
                    )}
                    <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                      {depositos.map((item) => (
                        <ListItem key={item.id || JSON.stringify(item.raw)} secondaryAction={
                          <>
                            {(permissions.config_apoio_editar || user.is_staff) && (
                              <IconButton edge="end" size="small" onClick={() => handleOpenConfigSimples('Deposito', item)}><EditIcon fontSize="small" /></IconButton>
                            )}
                            {(permissions.config_apoio_excluir || user.is_staff) ? (
                              <IconButton edge="end" size="small" onClick={() => handleDeleteConfigClick('Deposito', item)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                            ) : (
                              <Tooltip title="Solicitar Exclusão">
                                <IconButton edge="end" size="small" onClick={() => handleRequestExclusion(item, 'EXCLUIR_DEPOSITO')}><LockIcon fontSize="small" color="error" /></IconButton>
                              </Tooltip>
                            )}
                          </>
                        }>
                          <ListItemText primary={item.nome} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>

                {/* FORMAS DE PAGAMENTO */}
                <Box sx={{ width: { xs: '100%', md: '50%', lg: '33.333%' } }}>
                  <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}><BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} /> Formas de Pagamento</Typography>
                      {(permissions.config_apoio_criar || user.is_staff) && (
                        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenConfigSimples('FormaPagamento', null)}>Add</Button>
                      )}
                    </Box>
                    <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                      {formasPagamento.map((f) => (
                        <ListItem key={f.id || JSON.stringify(f.raw)} secondaryAction={
                          <>
                            {(permissions.config_apoio_editar || user.is_staff) && (
                              <IconButton edge="end" size="small" onClick={() => handleOpenConfigSimples('FormaPagamento', f)}><EditIcon fontSize="small" /></IconButton>
                            )}
                            {(permissions.config_apoio_excluir || user.is_staff) ? (
                              <IconButton edge="end" size="small" onClick={() => handleDeleteConfigClick('FormaPagamento', f.raw)}><DeleteIcon fontSize="small" color="error" /></IconButton>
                            ) : (
                              <Tooltip title="Solicitar Exclusão">
                                <IconButton edge="end" size="small" onClick={() => handleRequestExclusion(f.raw, 'EXCLUIR_FORMAPAGAMENTO')}><LockIcon fontSize="small" color="error" /></IconButton>
                              </Tooltip>
                            )}
                          </>
                        }>
                          <ListItemText primary={f.nome} secondary={f.quantidade_dias !== null ? `Dias: ${f.quantidade_dias}` : ''} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>
              </>
            )}

          </Grid>

        </Box>
      </Fade>

      {/* --- Renderiza os Popups (Dialogs) --- */}

      {/* Popup de Configuração Simples */}
      {(permissions.config_apoio_criar || permissions.config_apoio_editar || user.is_staff) && (
        <>
          {configSimplesTipo === 'FormaPagamento' ? (
            <FormaPagamentoDialog
              open={showConfigSimples && configSimplesTipo === 'FormaPagamento'}
              onClose={() => setShowConfigSimples(false)}
              onSaveSuccess={(created) => {
                if (created) {
                  // normalize and update local list for responsive UX
                  const normalizeCreated = (it) => ({
                    id: it.id_forma_pagamento || it.id || it.pk || null,
                    nome: it.nome_forma_pagamento || it.nome_forma || it.nome || it.descricao || '—',
                    quantidade_dias: it.quantidade_dias ?? it.dias ?? it.qtd_dias ?? it.dias_vencimento ?? null,
                    raw: it,
                  });
                  const normalized = normalizeCreated(created);
                  setFormasPagamento(prev => {
                    const exists = prev.some(p => p.id && normalized.id && p.id === normalized.id);
                    if (exists) return prev;
                    return [normalized, ...prev];
                  });
                }
                fetchAllSupportData();
              }}
              itemToEdit={editingConfigSimples}
              departamentos={departamentos}
              centrosCusto={centrosCusto}
              contasBancarias={contasBancarias}
            />
          ) : (
            <ConfigSimplesDialog
              open={showConfigSimples}
              onClose={() => setShowConfigSimples(false)}
              onSaveSuccess={(created) => {
                // Se for uma FormaPagamento recém-criada, adiciona imediatamente à lista local para UX responsiva
                if (created && configSimplesTipo === 'FormaPagamento') {
                  const normalizeCreated = (it) => ({
                    id: it.id_forma_pagamento || it.id || it.pk || null,
                    nome: it.nome_forma_pagamento || it.nome_forma || it.nome || it.descricao || '—',
                    quantidade_dias: it.quantidade_dias ?? it.dias ?? it.qtd_dias ?? null,
                    raw: it,
                  });
                  const normalized = normalizeCreated(created);
                  setFormasPagamento(prev => {
                    const exists = prev.some(p => p.id && normalized.id && p.id === normalized.id);
                    if (exists) return prev;
                    return [normalized, ...prev];
                  });
                }
                // Se for um Depósito recém-criado, atualiza a lista local imediatamente
                if (created && configSimplesTipo === 'Deposito') {
                  const normalizeCreatedDep = (it) => ({
                    id: it.id || it.pk || null,
                    nome: it.nome || it.descricao || '—',
                    raw: it,
                  });
                  const normalizedDep = normalizeCreatedDep(created);
                  setDepositos(prev => {
                    const exists = prev.some(p => p.id && normalizedDep.id && p.id === normalizedDep.id);
                    if (exists) return prev;
                    return [normalizedDep, ...prev];
                  });
                }
                // Recarrega dados do servidor para garantir consistência
                fetchAllSupportData();
              }}
              itemToEdit={editingConfigSimples}
              configTipo={configSimplesTipo}
              depositosEndpoint={depositosEndpoint}
            />
          )}
        </>
      )}

      {/* Popup de Operação */}
      {(permissions.config_operacoes_criar || permissions.config_operacoes_editar || user.is_staff) && (
        <OperacaoDialog
          open={showOperacao}
          onClose={() => setShowOperacao(false)}
          onSaveSuccess={fetchAllSupportData}
          operacaoToEdit={editingOperacao}
          empresas={empresas}
        />
      )}

      {/* Popup de Empresa */}
      {(permissions.config_empresa_editar || user.is_staff) && (
        <EmpresaDialog
          open={showEmpresa}
          onClose={() => setShowEmpresa(false)}
          onSaveSuccess={fetchAllSupportData}
        />
      )}

      {/* Popup de Vendedor */}
      {(permissions.config_vendedores_criar || permissions.config_vendedores_editar || user.is_staff) && (
        <VendedorDialog
          open={showVendedor}
          onClose={() => setShowVendedor(false)}
          onSaveSuccess={fetchAllSupportData}
          vendedorToEdit={editingVendedor}
          funcoes={funcoes}
          vendedores={vendedores}
        />
      )}

      {/* Popup de Usuário */}
      {(permissions.config_usuarios_criar || permissions.config_usuarios_editar || user.is_staff) && (
        <UserDialog
          open={showUser}
          onClose={() => setShowUser(false)}
          onSaveSuccess={fetchAllSupportData}
          userToEdit={editingUser || { permissoes: {} }}
          vendedores={vendedores}
          clientes={clientes}
          operacoes={operacoes}
          grupos={grupos}
        />
      )}

      {/* Dialog com as tentativas de endpoint (diagnóstico) */}
      <Dialog open={showDepositosAttemptsDialog} onClose={() => setShowDepositosAttemptsDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>Detalhes das tentativas de endpoint</DialogTitle>
        <DialogContent>
          {depositosAttempts.length === 0 ? (
            <Typography>Nenhuma tentativa registrada.</Typography>
          ) : (
            <List>
              {depositosAttempts.map((a, idx) => (
                <ListItem key={idx} divider>
                  <ListItemText primary={a.endpoint} secondary={`status: ${a.status || 'err'} ${a.message ? `| msg: ${a.message}` : ''}`} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowDepositosAttemptsDialog(false); }}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Popup de Solicitação (Fase 3) */}
      <SolicitacaoDialog
        open={showSolicitacao}
        onClose={() => setShowSolicitacao(false)}
        itemParaSolicitar={itemParaSolicitar}
        tipoAcao={tipoAcao} // Envia o tipo da ação
        supervisores={supervisores}
      />

    </React.Fragment>
  );
}

export default SettingsPage;
