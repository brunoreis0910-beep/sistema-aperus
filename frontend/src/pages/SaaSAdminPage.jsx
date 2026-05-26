import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Chip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, IconButton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert,
  FormControl, InputLabel, Select, MenuItem, Tooltip, Tabs, Tab, Card, CardContent, Divider,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Refresh as RefreshIcon,
  CheckCircle as PaidIcon, Cancel as CancelIcon, ReceiptLong as InvoiceIcon,
  Description as ContractIcon, Fingerprint as SignIcon, QrCode as QrIcon,
  ContentCopy as CopyIcon, MonetizationOn as MoneyIcon, Business as ClientIcon,
  Warning as WarningIcon, Launch as LaunchIcon, Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { buscarCNPJ, buscarCEP } from '../utils/cnpjCepUtils';


const fmtMoeda = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtData = (d) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—';

const fmtDataHora = (d) =>
  d ? new Date(d).toLocaleString('pt-BR') : '—';

const StatusLicencaChip = ({ status }) => {
  const map = {
    ATIVO: { label: 'Ativo', color: 'success' },
    BLOQUEADO: { label: 'Bloqueado', color: 'error' },
    DEMO: { label: 'Demonstração', color: 'info' },
  };
  const info = map[status] || { label: status, color: 'default' };
  return <Chip label={info.label} color={info.color} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
};

const StatusPagamentoChip = ({ status }) => {
  const map = {
    PENDENTE: { label: 'Pendente', color: 'warning' },
    PAGO: { label: 'Pago', color: 'success' },
    VENCIDO: { label: 'Vencido', color: 'error' },
    CANCELADO: { label: 'Cancelado', color: 'default' },
  };
  const info = map[status] || { label: status, color: 'default' };
  return <Chip label={info.label} color={info.color} size="small" sx={{ borderRadius: 1 }} />;
};

const SaaSAdminPage = () => {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Data lists
  const [clientes, setClientes] = useState([]);
  const [mensalidades, setMensalidades] = useState([]);
  
  // KPI stats
  const [stats, setStats] = useState({ activeClients: 0, overduePayments: 0, mrr: 0 });
  
  // Selected customer for details
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Modals status
  const [clientModal, setClientModal] = useState({ open: false, mode: 'create', data: null });
  const [billingModal, setBillingModal] = useState({ open: false, clientId: null, meses: 6 });
  const [contractModal, setContractModal] = useState({ open: false, clientId: null, texto: '' });
  const [paymentModal, setPaymentModal] = useState({ open: false, payment: null });
  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [modalTab, setModalTab] = useState(0);
  
  // Client forms
  const [clientForm, setClientForm] = useState({
    cnpj: '', razao_social: '', nome_fantasia: '', inscricao_estadual: '',
    proprietario: '', telefone: '', email: '', vendedor: '',
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    dia_vencimento: 10, valor_mensalidade: '', emite_nota: false, status_licenca: 'ATIVO', data_reajuste: '',
    schema_name: '', db_host: 'localhost', db_port: '8005', is_test_environment: false
  });

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [resCli, resMens] = await Promise.all([
        axiosInstance.get('/saas-clientes/'),
        axiosInstance.get('/saas-mensalidades/')
      ]);
      
      const clientsData = resCli.data?.results ?? resCli.data ?? [];
      const billingData = resMens.data?.results ?? resMens.data ?? [];
      
      setClientes(clientsData);
      setMensalidades(billingData);
      
      // Calculate Stats
      const active = clientsData.filter(c => c.status_licenca === 'ATIVO').length;
      const overdue = billingData.filter(m => m.status_pagamento === 'PENDENTE' && new Date(m.data_vencimento) < new Date()).length;
      const mrrVal = clientsData.reduce((acc, c) => acc + parseFloat(c.valor_mensalidade || 0), 0);
      
      setStats({ activeClients: active, overduePayments: overdue, mrr: mrrVal });
      
      // Update selected client if open
      if (selectedClient) {
        const updated = clientsData.find(c => c.id_saas_cliente === selectedClient.id_saas_cliente);
        if (updated) setSelectedClient(updated);
      }
      
    } catch (e) {
      showToast('Erro ao carregar os dados do SaaS.', 'error');
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, showToast, selectedClient]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenClientModal = (mode, data = null) => {
    setModalTab(0);
    if (mode === 'create') {
      setClientForm({
        cnpj: '', razao_social: '', nome_fantasia: '', inscricao_estadual: '',
        proprietario: '', telefone: '', email: '', vendedor: '',
        cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
        dia_vencimento: 10, valor_mensalidade: '', emite_nota: false, status_licenca: 'ATIVO', data_reajuste: '',
        schema_name: '', db_host: 'localhost', db_port: '8005', is_test_environment: false
      });
    } else {
      setClientForm({
        cnpj: data.cnpj,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || '',
        inscricao_estadual: data.inscricao_estadual || '',
        proprietario: data.proprietario || '',
        telefone: data.telefone || '',
        email: data.email || '',
        vendedor: data.vendedor || '',
        cep: data.cep || '',
        endereco: data.endereco || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.cidade || '',
        estado: data.estado || '',
        dia_vencimento: data.dia_vencimento,
        valor_mensalidade: data.valor_mensalidade,
        emite_nota: data.emite_nota,
        status_licenca: data.status_licenca,
        data_reajuste: data.data_reajuste || '',
        schema_name: data.schema_name || '',
        db_host: data.db_host || 'localhost',
        db_port: data.db_port || '8005',
        is_test_environment: data.is_test_environment || false
      });
    }
    setClientModal({ open: true, mode, data });
  };

  const handleBuscaCNPJ = async () => {
    const cnpj = clientForm.cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      showToast('Digite um CNPJ com 14 números.', 'warning');
      return;
    }
    setLoadingCNPJ(true);
    try {
      const dados = await buscarCNPJ(cnpj);
      setClientForm(p => {
        const baseName = dados.nome_fantasia || dados.razao_social || '';
        const suggestedSchema = baseName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9_-]/g, '')
          .substring(0, 30);
        
        return {
          ...p,
          razao_social: dados.razao_social || '',
          nome_fantasia: dados.nome_fantasia || '',
          inscricao_estadual: dados.inscricao_estadual || '',
          telefone: dados.telefone || '',
          email: dados.email || '',
          cep: dados.cep || '',
          endereco: dados.endereco || '',
          numero: dados.numero || '',
          complemento: dados.complemento || '',
          bairro: dados.bairro || '',
          cidade: dados.cidade || '',
          estado: dados.estado || '',
          schema_name: p.schema_name || suggestedSchema
        };
      });
      showToast('Dados do CNPJ carregados com sucesso!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao buscar CNPJ.', 'error');
    } finally {
      setLoadingCNPJ(false);
    }
  };

  const handleBuscaCEP = async () => {
    const cep = clientForm.cep.replace(/\D/g, '');
    if (cep.length !== 8) {
      showToast('Digite um CEP com 8 números.', 'warning');
      return;
    }
    setLoadingCEP(true);
    try {
      const dados = await buscarCEP(cep);
      setClientForm(p => ({
        ...p,
        endereco: dados.endereco || '',
        bairro: dados.bairro || '',
        cidade: dados.cidade || '',
        estado: dados.estado || ''
      }));
      showToast('Endereço carregado com sucesso!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao buscar CEP.', 'error');
    } finally {
      setLoadingCEP(false);
    }
  };

  const handleSaveClient = async () => {
    if (!clientForm.cnpj || !clientForm.razao_social || !clientForm.valor_mensalidade || !clientForm.schema_name) {
      showToast('Por favor, preencha todos os campos obrigatórios (incluindo o Identificador).', 'warning');
      return;
    }
    
    // Clean CNPJ from masks and format schema_name as slug
    const cleanForm = { 
      ...clientForm, 
      cnpj: clientForm.cnpj.replace(/\D/g, ''),
      schema_name: clientForm.schema_name.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    };

    try {
      if (clientModal.mode === 'create') {
        await axiosInstance.post('/saas-clientes/', cleanForm);
        showToast('Cliente cadastrado com sucesso!', 'success');
      } else {
        await axiosInstance.put(`/saas-clientes/${clientModal.data.id_saas_cliente}/`, cleanForm);
        showToast('Cliente atualizado com sucesso!', 'success');
      }
      setClientModal({ open: false, mode: 'create', data: null });
      carregarDados();
    } catch (e) {
      let errorMsg = 'Erro ao salvar cliente.';
      if (e.response?.data) {
        if (typeof e.response.data === 'string') {
          errorMsg = e.response.data;
        } else if (e.response.data.error) {
          errorMsg = e.response.data.error;
        } else {
          // Extrai o primeiro erro de qualquer campo retornado pelo Django REST Framework
          const fieldErrors = Object.entries(e.response.data)
            .map(([field, errs]) => {
              const msg = Array.isArray(errs) ? errs[0] : errs;
              return `${field}: ${msg}`;
            });
          if (fieldErrors.length > 0) {
            errorMsg = fieldErrors.join(' | ');
          }
        }
      }
      showToast(errorMsg, 'error');
    }
  };

  const handleGerarMensalidades = async () => {
    try {
      await axiosInstance.post(`/saas-clientes/${billingModal.clientId}/gerar_mensalidades/`, {
        meses: billingModal.meses
      });
      showToast(`Mensalidades geradas com sucesso!`, 'success');
      setBillingModal({ open: false, clientId: null, meses: 6 });
      carregarDados();
    } catch (e) {
      showToast('Erro ao gerar mensalidades.', 'error');
    }
  };

  const handleGerarContrato = async () => {
    if (!contractModal.texto) {
      showToast('Informe os termos do contrato.', 'warning');
      return;
    }
    try {
      await axiosInstance.post(`/saas-contratos/`, {
        saas_cliente: contractModal.clientId,
        texto_contrato: contractModal.texto,
        assinado: false
      });
      showToast('Contrato gerado com sucesso!', 'success');
      setContractModal({ open: false, clientId: null, texto: '' });
      carregarDados();
    } catch (e) {
      showToast('Erro ao gerar contrato.', 'error');
    }
  };

  const handleConfirmarPagamento = async (statusPagamento) => {
    try {
      const payload = {
        status_pagamento: statusPagamento,
      };
      if (statusPagamento === 'PAGO') {
        payload.data_pagamento = new Date().toISOString().split('T')[0];
      } else {
        payload.data_pagamento = null;
      }
      await axiosInstance.patch(`/saas-mensalidades/${paymentModal.payment.id_mensalidade}/`, payload);
      showToast(`Situação da mensalidade atualizada!`, 'success');
      setPaymentModal({ open: false, payment: null });
      carregarDados();
    } catch (e) {
      showToast('Erro ao atualizar mensalidade.', 'error');
    }
  };

  const copiarPix = (payload) => {
    navigator.clipboard.writeText(payload);
    showToast('Pix Copia e Cola copiado!', 'success');
  };

  return (
    <Box sx={{ p: 3, minHeight: '85vh' }}>
      
      {/* HEADER & METRICS */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary" sx={{ letterSpacing: -0.5 }}>
            Aperus Central SaaS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administração, Faturamento e Licenciamento das instâncias de clientes
          </Typography>
        </Box>
        <IconButton onClick={carregarDados} disabled={loading} color="primary" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
        </IconButton>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'success.light', color: 'success.dark', display: 'flex' }}>
                <ClientIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Clientes Ativos</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.activeClients}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'primary.light', color: 'primary.dark', display: 'flex' }}>
                <MoneyIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Recorrência Mensal (MRR)</Typography>
                <Typography variant="h5" fontWeight={700}>{fmtMoeda(stats.mrr)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 3, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'error.light', color: 'error.dark', display: 'flex' }}>
                <WarningIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Mensalidades Atrasadas</Typography>
                <Typography variant="h5" fontWeight={700} color="error.main">{stats.overduePayments}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* TABS CONTAINER */}
      <Paper sx={{ borderRadius: 4, overflow: 'hidden', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label="Clientes SaaS" icon={<ClientIcon />} iconPosition="start" />
          <Tab label="Faturamento e Cobranças" icon={<InvoiceIcon />} iconPosition="start" />
        </Tabs>

        {/* TAB 0 - CLIENTES */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>Lista de Contratantes</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenClientModal('create')}>
                Novo Cliente
              </Button>
            </Box>

            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell fontWeight={600}>Razão Social / CNPJ</TableCell>
                    <TableCell align="center">Vencimento (Dia)</TableCell>
                    <TableCell align="right">Valor Mensalidade</TableCell>
                    <TableCell align="center">Emissão NF</TableCell>
                    <TableCell align="center">Situação</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientes.map((c) => (
                    <TableRow key={c.id_saas_cliente} hover onClick={() => setSelectedClient(c)} sx={{ cursor: 'pointer', bgcolor: selectedClient?.id_saas_cliente === c.id_saas_cliente ? 'action.selected' : 'inherit' }}>
                      <TableCell>
                        <Typography fontWeight={600} variant="body2">{c.razao_social}</Typography>
                        <Typography variant="caption" color="text.secondary">CNPJ: {c.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}</Typography>
                      </TableCell>
                      <TableCell align="center">Dia {c.dia_vencimento}</TableCell>
                      <TableCell align="right"><b>{fmtMoeda(c.valor_mensalidade)}</b></TableCell>
                      <TableCell align="center">
                        <Chip label={c.emite_nota ? 'Sim' : 'Não'} size="small" color={c.emite_nota ? 'primary' : 'default'} />
                      </TableCell>
                      <TableCell align="center">
                        <StatusLicencaChip status={c.status_licenca} />
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Editar Dados">
                            <IconButton size="small" onClick={() => handleOpenClientModal('edit', c)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Gerar Lote de Cobranças">
                            <IconButton size="small" color="primary" onClick={() => setBillingModal({ open: true, clientId: c.id_saas_cliente, meses: 6 })}>
                              <InvoiceIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Gerar Termo/Contrato">
                            <IconButton size="small" color="secondary" onClick={() => setContractModal({ open: true, clientId: c.id_saas_cliente, texto: '' })}>
                              <ContractIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {clientes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        Nenhum cliente cadastrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* SELECTION DETAIL DRAWER / SUB PANEL */}
            {selectedClient && (
              <Box sx={{ mt: 4, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Detalhes do Cliente: {selectedClient.razao_social}
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>Mensalidades Relacionadas</Typography>
                        <Divider sx={{ mb: 1.5 }} />
                        <TableContainer sx={{ maxHeight: 220 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Vencimento</TableCell>
                                <TableCell align="right">Valor</TableCell>
                                <TableCell align="center">Situação</TableCell>
                                <TableCell align="center">Ação</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedClient.mensalidades?.map(m => (
                                <TableRow key={m.id_mensalidade} hover>
                                  <TableCell>{fmtData(m.data_vencimento)}</TableCell>
                                  <TableCell align="right">{fmtMoeda(m.valor)}</TableCell>
                                  <TableCell align="center"><StatusPagamentoChip status={m.status_pagamento} /></TableCell>
                                  <TableCell align="center">
                                    <IconButton size="small" onClick={() => setPaymentModal({ open: true, payment: m })}>
                                      <MoneyIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {(!selectedClient.mensalidades || selectedClient.mensalidades.length === 0) && (
                                <TableRow>
                                  <TableCell colSpan={4} align="center">Nenhuma mensalidade gerada.</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>Contratos e Termos Aceites</Typography>
                        <Divider sx={{ mb: 1.5 }} />
                        <TableContainer sx={{ maxHeight: 220 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Data Geração</TableCell>
                                <TableCell align="center">Assinado</TableCell>
                                <TableCell>IP / Usuário Assinatura</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedClient.contratos?.map(contr => (
                                <TableRow key={contr.id_contrato}>
                                  <TableCell>{fmtDataHora(contr.data_geracao)}</TableCell>
                                  <TableCell align="center">
                                    <Chip label={contr.assinado ? 'Assinado' : 'Pendente'} color={contr.assinado ? 'success' : 'default'} size="small" />
                                  </TableCell>
                                  <TableCell>
                                    {contr.assinado ? (
                                      <Box>
                                        <Typography variant="caption" display="block">IP: {contr.ip_assinatura || '—'}</Typography>
                                        <Typography variant="caption" display="block">Por: {contr.usuario_assinou || '—'}</Typography>
                                        <Typography variant="caption" display="block">Em: {fmtDataHora(contr.data_assinatura)}</Typography>
                                      </Box>
                                    ) : '—'}
                                  </TableCell>
                                </TableRow>
                              ))}
                              {(!selectedClient.contratos || selectedClient.contratos.length === 0) && (
                                <TableRow>
                                  <TableCell colSpan={3} align="center">Nenhum contrato gerado.</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        )}

        {/* TAB 1 - GENERAL BILLING */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Lançamentos de Cobranças Globais</Typography>
            
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell fontWeight={600}>Cliente</TableCell>
                    <TableCell>Nosso Número</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell align="center">Situação</TableCell>
                    <TableCell align="center">Data Pagamento</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mensalidades.map((m) => {
                    const cli = clientes.find(c => c.id_saas_cliente === m.saas_cliente);
                    return (
                      <TableRow key={m.id_mensalidade} hover>
                        <TableCell>
                          <Typography fontWeight={600} variant="body2">{cli ? cli.razao_social : 'Carregando...'}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{m.nosso_numero}</TableCell>
                        <TableCell>{fmtData(m.data_vencimento)}</TableCell>
                        <TableCell align="right"><b>{fmtMoeda(m.valor)}</b></TableCell>
                        <TableCell align="center">
                          <StatusPagamentoChip status={m.status_pagamento} />
                        </TableCell>
                        <TableCell align="center">{m.data_pagamento ? fmtData(m.data_pagamento) : '—'}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Detalhes do Pagamento / Baixa Manual">
                            <IconButton size="small" color="primary" onClick={() => setPaymentModal({ open: true, payment: m })}>
                              <MoneyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {mensalidades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        Nenhuma cobrança registrada no sistema.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* DIALOGS */}

      {/* 1. CLIENT MODAL */}
      <Dialog open={clientModal.open} onClose={() => setClientModal({ ...clientModal, open: false })} maxWidth="md" fullWidth>
        <DialogTitle>{clientModal.mode === 'create' ? 'Cadastrar Novo Cliente' : 'Editar Dados do Cliente'}</DialogTitle>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={modalTab} onChange={(e, v) => setModalTab(v)} variant="fullWidth">
            <Tab label="Dados Básicos" />
            <Tab label="Endereço" />
            <Tab label="Contrato & Conexão" />
          </Tabs>
        </Box>
        <DialogContent dividers sx={{ minHeight: '340px' }}>
          {modalTab === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="CNPJ *" fullWidth size="small"
                  value={clientForm.cnpj} onChange={(e) => setClientForm({ ...clientForm, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  disabled={loadingCNPJ}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <span>
                          <IconButton
                            aria-label="buscar cnpj"
                            onClick={handleBuscaCNPJ}
                            disabled={loadingCNPJ || Boolean(clientForm.cnpj && clientForm.cnpj.replace(/\D/g, '').length !== 14)}
                            edge="end"
                            size="small"
                          >
                            {loadingCNPJ ? <CircularProgress size={20} /> : <SearchIcon />}
                          </IconButton>
                        </span>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Razão Social *" fullWidth size="small"
                  value={clientForm.razao_social} onChange={(e) => setClientForm({ ...clientForm, razao_social: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nome Fantasia" fullWidth size="small"
                  value={clientForm.nome_fantasia} onChange={(e) => setClientForm({ ...clientForm, nome_fantasia: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Inscrição Estadual" fullWidth size="small"
                  value={clientForm.inscricao_estadual} onChange={(e) => setClientForm({ ...clientForm, inscricao_estadual: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Proprietário / Responsável" fullWidth size="small"
                  value={clientForm.proprietario} onChange={(e) => setClientForm({ ...clientForm, proprietario: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Vendedor / Representante" fullWidth size="small"
                  value={clientForm.vendedor} onChange={(e) => setClientForm({ ...clientForm, vendedor: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Telefone" fullWidth size="small"
                  value={clientForm.telefone} onChange={(e) => setClientForm({ ...clientForm, telefone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="E-mail" fullWidth size="small"
                  value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                />
              </Grid>
            </Grid>
          )}

          {modalTab === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="CEP" fullWidth size="small"
                  value={clientForm.cep} onChange={(e) => setClientForm({ ...clientForm, cep: e.target.value })}
                  placeholder="00000-000"
                  disabled={loadingCEP}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <span>
                          <IconButton
                            aria-label="buscar cep"
                            onClick={handleBuscaCEP}
                            disabled={loadingCEP || Boolean(clientForm.cep && clientForm.cep.replace(/\D/g, '').length !== 8)}
                            edge="end"
                            size="small"
                          >
                            {loadingCEP ? <CircularProgress size={20} /> : <SearchIcon />}
                          </IconButton>
                        </span>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Logradouro" fullWidth size="small"
                  value={clientForm.endereco} onChange={(e) => setClientForm({ ...clientForm, endereco: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Número" fullWidth size="small"
                  value={clientForm.numero} onChange={(e) => setClientForm({ ...clientForm, numero: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Complemento" fullWidth size="small"
                  value={clientForm.complemento} onChange={(e) => setClientForm({ ...clientForm, complemento: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Bairro" fullWidth size="small"
                  value={clientForm.bairro} onChange={(e) => setClientForm({ ...clientForm, bairro: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Cidade" fullWidth size="small"
                  value={clientForm.cidade} onChange={(e) => setClientForm({ ...clientForm, cidade: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  label="UF" fullWidth size="small"
                  value={clientForm.estado} onChange={(e) => setClientForm({ ...clientForm, estado: e.target.value })}
                  inputProps={{ maxLength: 2 }}
                />
              </Grid>
            </Grid>
          )}

          {modalTab === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Identificador (Schema Name) *" fullWidth size="small"
                  value={clientForm.schema_name} onChange={(e) => setClientForm({ ...clientForm, schema_name: e.target.value })}
                  placeholder="ex: testes"
                  helperText="Deve ser único (letras, números, - ou _)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Host do Banco (db_host) *" fullWidth size="small"
                  value={clientForm.db_host} onChange={(e) => setClientForm({ ...clientForm, db_host: e.target.value })}
                  placeholder="localhost"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Porta do Banco (db_port) *" fullWidth size="small"
                  value={clientForm.db_port} onChange={(e) => setClientForm({ ...clientForm, db_port: e.target.value })}
                  placeholder="8005"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Ambiente de Teste?</InputLabel>
                  <Select
                    value={clientForm.is_test_environment}
                    onChange={(e) => setClientForm({ ...clientForm, is_test_environment: e.target.value === 'true' || e.target.value === true })}
                    label="Ambiente de Teste?"
                  >
                    <MenuItem value={true}>Sim</MenuItem>
                    <MenuItem value={false}>Não</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Dia do Vencimento *" type="number" fullWidth size="small"
                  value={clientForm.dia_vencimento} onChange={(e) => setClientForm({ ...clientForm, dia_vencimento: parseInt(e.target.value) || 10 })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Valor da Mensalidade (R$) *" type="number" fullWidth size="small"
                  value={clientForm.valor_mensalidade} onChange={(e) => setClientForm({ ...clientForm, valor_mensalidade: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Situação da Licença</InputLabel>
                  <Select
                    value={clientForm.status_licenca}
                    onChange={(e) => setClientForm({ ...clientForm, status_licenca: e.target.value })}
                    label="Situação da Licença"
                  >
                    <MenuItem value="ATIVO">Ativo</MenuItem>
                    <MenuItem value="BLOQUEADO">Bloqueado</MenuItem>
                    <MenuItem value="DEMO">Demonstração</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Próximo Reajuste" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
                  value={clientForm.data_reajuste} onChange={(e) => setClientForm({ ...clientForm, data_reajuste: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Emite Notas Fiscais?</InputLabel>
                  <Select
                    value={clientForm.emite_nota}
                    onChange={(e) => setClientForm({ ...clientForm, emite_nota: e.target.value === 'true' || e.target.value === true })}
                    label="Emite Notas Fiscais?"
                  >
                    <MenuItem value={true}>Sim</MenuItem>
                    <MenuItem value={false}>Não</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClientModal({ ...clientModal, open: false })}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveClient}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* 2. BATCH BILLING MODAL */}
      <Dialog open={billingModal.open} onClose={() => setBillingModal({ open: false, clientId: null, meses: 6 })} maxWidth="xs" fullWidth>
        <DialogTitle>Gerar Lote de Mensalidades</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={2}>
            Gere cobranças recorrentes subsequentes para o cliente selecionado automaticamente.
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Quantidade de meses</InputLabel>
            <Select
              value={billingModal.meses}
              onChange={(e) => setBillingModal({ ...billingModal, meses: parseInt(e.target.value) || 1 })}
              label="Quantidade de meses"
            >
              <MenuItem value={1}>1 Mês</MenuItem>
              <MenuItem value={3}>3 Meses</MenuItem>
              <MenuItem value={6}>6 Meses (Semestral)</MenuItem>
              <MenuItem value={12}>12 Meses (Anual)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBillingModal({ open: false, clientId: null, meses: 6 })}>Cancelar</Button>
          <Button variant="contained" onClick={handleGerarMensalidades}>Gerar Cobranças</Button>
        </DialogActions>
      </Dialog>

      {/* 3. CONTRACT MODAL */}
      <Dialog open={contractModal.open} onClose={() => setContractModal({ open: false, clientId: null, texto: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Gerar Contrato de Prestação de Serviços</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={2}>
            Insira o texto completo do termo ou contrato a ser aceito digitalmente pela instância do cliente.
          </Typography>
          <TextField
            label="Conteúdo do Contrato"
            multiline
            rows={10}
            fullWidth
            value={contractModal.texto}
            onChange={(e) => setContractModal({ ...contractModal, texto: e.target.value })}
            placeholder="Cláusula 1ª: O presente termo de adesão rege a utilização do sistema Aperus..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContractModal({ open: false, clientId: null, texto: '' })}>Cancelar</Button>
          <Button variant="contained" onClick={handleGerarContrato}>Publicar Contrato</Button>
        </DialogActions>
      </Dialog>

      {/* 4. PAYMENT DETAIL / ACTION MODAL */}
      <Dialog open={paymentModal.open} onClose={() => setPaymentModal({ open: false, payment: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Faturamento — Nosso Número: {paymentModal.payment?.nosso_numero}</DialogTitle>
        <DialogContent dividers>
          {paymentModal.payment && (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">Valor da Cobrança</Typography>
                <Typography variant="h5" fontWeight={700} color="primary">{fmtMoeda(paymentModal.payment.valor)}</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Vencimento</Typography>
                  <Typography variant="body1" fontWeight={500}>{fmtData(paymentModal.payment.data_vencimento)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Situação</Typography>
                  <Box mt={0.5}>
                    <StatusPagamentoChip status={paymentModal.payment.status_pagamento} />
                  </Box>
                </Grid>
              </Grid>

              {paymentModal.payment.status_pagamento !== 'PAGO' && (
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>Meios de Pagamento Integrados (Simulado)</Typography>
                  <Stack spacing={1.5}>
                    {paymentModal.payment.url_boleto && (
                      <Button
                        variant="outlined"
                        startIcon={<LaunchIcon />}
                        href={paymentModal.payment.url_boleto}
                        target="_blank"
                        size="small"
                        fullWidth
                      >
                        Visualizar Boleto Bancário
                      </Button>
                    )}
                    {paymentModal.payment.pix_copia_cola && (
                      <Stack direction="row" spacing={1}>
                        <TextField
                          label="Pix Copia e Cola"
                          value={paymentModal.payment.pix_copia_cola}
                          fullWidth
                          size="small"
                          InputProps={{ readOnly: true }}
                        />
                        <Button variant="contained" size="small" onClick={() => copiarPix(paymentModal.payment.pix_copia_cola)}>
                          Copiar
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </Box>
              )}

              {paymentModal.payment.data_pagamento && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Liquidado em</Typography>
                  <Typography variant="body1" fontWeight={500}>{fmtData(paymentModal.payment.data_pagamento)}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
          <Box>
            {paymentModal.payment?.status_pagamento !== 'PAGO' && (
              <Button color="success" variant="contained" startIcon={<PaidIcon />} onClick={() => handleConfirmarPagamento('PAGO')}>
                Confirmar Pagamento
              </Button>
            )}
            {paymentModal.payment?.status_pagamento === 'PAGO' && (
              <Button color="warning" variant="outlined" onClick={() => handleConfirmarPagamento('PENDENTE')}>
                Estornar para Pendente
              </Button>
            )}
          </Box>
          <Box>
            {paymentModal.payment?.status_pagamento !== 'CANCELADO' && paymentModal.payment?.status_pagamento !== 'PAGO' && (
              <Button color="error" variant="text" startIcon={<CancelIcon />} onClick={() => handleConfirmarPagamento('CANCELADO')} sx={{ mr: 1 }}>
                Cancelar Cobrança
              </Button>
            )}
            <Button onClick={() => setPaymentModal({ open: false, payment: null })}>Fechar</Button>
          </Box>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default SaaSAdminPage;
