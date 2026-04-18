// Em: src/components/EmpresaDialog.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Para o ViaCEP e BrasilAPI
import { buscarCNPJ } from '../utils/cnpjCepUtils';
import {
  Box, TextField, Button, Typography, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, 
  Tabs, Tab, Avatar, Grid, Checkbox, FormControlLabel, FormControl, InputLabel, Select, MenuItem,
  InputAdornment, IconButton
} from '@mui/material';
// Grid from @mui/material is used (Unstable_Grid2 not available in this environment)
// Ícones
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
// Helpers
import TabPanel from './TabPanel'; 
import { useAuth } from '../context/AuthContext'; 

function EmpresaDialog({ 
  open, 
  onClose, 
  onSaveSuccess 
}) {
  
  const { axiosInstance } = useAuth();

  // Estado do formulário
  const [empresaFormData, setEmpresaFormData] = useState({
    id_empresa: null, nome_razao_social: '', nome_fantasia: '', cpf_cnpj: '', 
    inscricao_estadual: '', endereco: '', numero: '', bairro: '', cidade: '', 
    estado: '', cep: '', telefone: '', email: '', logo_url: '',
    
    // SPED Fields
    sped_versao: '020',
    sped_finalidade: '0',
    sped_gerar_bloco_c_vazio: false,
    sped_verifica_contingencia: false,
    sped_aproveita_credito_icms: true,
    sped_gerar_bloco_c: true,
    sped_gerar_bloco_d: false,
    sped_gerar_bloco_e: true,
    sped_gerar_bloco_g: false,
    sped_gerar_bloco_h: false,
    sped_gerar_bloco_k: false,
    sped_operacao_entrada_bloco_0: '',
    sped_operacao_entrada_bloco_c: '',
    sped_operacao_entrada_bloco_d: '',
    sped_operacao_saida_bloco_0: '',
    sped_operacao_saida_bloco_c: '',
    sped_operacao_saida_bloco_d: '',
    sped_centro_custo_credito: '',
    sped_centro_custo_debito: '',
    sped_operacao_bloco_1: '',
    sped_bloco_k_deposito: '',
    sped_bloco_k_grupo: '',
    sped_bloco_k_preco: '',
    sped_bloco_k_leiaute: ''
  });
  
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [empresaTabValue, setEmpresaTabValue] = useState(0);
  const [loadingEmpresaCEP, setLoadingEmpresaCEP] = useState(false);
  const [loadingEmpresaCNPJ, setLoadingEmpresaCNPJ] = useState(false); 

  // Estado inicial de carregamento dos dados da empresa
  const [loadingData, setLoadingData] = useState(true);

  // Carrega os dados quando o popup abre
  useEffect(() => {
    if (open) {
      setEmpresaTabValue(0);
      setLoadingData(true); 
      
      const fetchEmpresaData = async () => {
        try {
          const response = await axiosInstance.get('/empresa/');
          if (response.data && response.data.length > 0) {
            const empresa = response.data[0]; 
            setEmpresaFormData({
              id_empresa: empresa.id_empresa,
              nome_razao_social: empresa.nome_razao_social || '',
              nome_fantasia: empresa.nome_fantasia || '',
              cpf_cnpj: empresa.cpf_cnpj || '',
              inscricao_estadual: empresa.inscricao_estadual || '',
              endereco: empresa.endereco || '',
              numero: empresa.numero || '',
              bairro: empresa.bairro || '',
              cidade: empresa.cidade || '',
              estado: empresa.estado || '',
              cep: empresa.cep || '',
              telefone: empresa.telefone || '',
              email: empresa.email || '',
              logo_url: empresa.logo_url || '',
              
              // SPED fields fetch
              sped_versao: empresa.sped_versao || '020',
              sped_finalidade: empresa.sped_finalidade || '0',
              sped_gerar_bloco_c_vazio: empresa.sped_gerar_bloco_c_vazio || false,
              sped_verifica_contingencia: empresa.sped_verifica_contingencia || false,
              sped_aproveita_credito_icms: empresa.sped_aproveita_credito_icms !== undefined ? empresa.sped_aproveita_credito_icms : true,
              sped_gerar_bloco_c: empresa.sped_gerar_bloco_c !== undefined ? empresa.sped_gerar_bloco_c : true,
              sped_gerar_bloco_d: empresa.sped_gerar_bloco_d || false,
              sped_gerar_bloco_e: empresa.sped_gerar_bloco_e !== undefined ? empresa.sped_gerar_bloco_e : true,
              sped_gerar_bloco_g: empresa.sped_gerar_bloco_g || false,
              sped_gerar_bloco_h: empresa.sped_gerar_bloco_h || false,
              sped_gerar_bloco_k: empresa.sped_gerar_bloco_k || false,
              sped_operacao_entrada_bloco_0: empresa.sped_operacao_entrada_bloco_0 || '',
              sped_operacao_entrada_bloco_c: empresa.sped_operacao_entrada_bloco_c || '',
              sped_operacao_entrada_bloco_d: empresa.sped_operacao_entrada_bloco_d || '',
              sped_operacao_saida_bloco_0: empresa.sped_operacao_saida_bloco_0 || '',
              sped_operacao_saida_bloco_c: empresa.sped_operacao_saida_bloco_c || '',
              sped_operacao_saida_bloco_d: empresa.sped_operacao_saida_bloco_d || '',
              sped_centro_custo_credito: empresa.sped_centro_custo_credito || '',
              sped_centro_custo_debito: empresa.sped_centro_custo_debito || '',
              sped_operacao_bloco_1: empresa.sped_operacao_bloco_1 || '',
              sped_bloco_k_deposito: empresa.sped_bloco_k_deposito || '',
              sped_bloco_k_grupo: empresa.sped_bloco_k_grupo || '',
              sped_bloco_k_preco: empresa.sped_bloco_k_preco || '',
              sped_bloco_k_leiaute: empresa.sped_bloco_k_leiaute || ''
            });
          } else {
            // Se não houver empresa, reseta para o estado inicial
            setEmpresaFormData({
              id_empresa: null, nome_razao_social: '', nome_fantasia: '', cpf_cnpj: '', 
              inscricao_estadual: '', endereco: '', numero: '', bairro: '', cidade: '', 
              estado: '', cep: '', telefone: '', email: '', logo_url: ''
            });
          }
        } catch (error) {
          alert('Erro ao buscar dados da empresa.');
          console.error("Erro ao buscar empresa:", error);
        } finally {
          setLoadingData(false);
        }
      };
      
      fetchEmpresaData();
    }
  }, [open, axiosInstance]); 

  // Funções de controle
  const handleEmpresaFormChange = (e) => { 
    const { name, value, type, checked } = e.target; 
    setEmpresaFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    })); 
  };
  const handleEmpresaTabChange = (event, newValue) => { setEmpresaTabValue(newValue); };
  
  const handleEmpresaBuscaCNPJ = async () => {
    const cnpj = empresaFormData.cpf_cnpj.replace(/\D/g, ''); 
    if (cnpj.length !== 14) { alert('Digite CNPJ com 14 números.'); return; } 
    setLoadingEmpresaCNPJ(true);
    try { 
      const dados = await buscarCNPJ(cnpj); 
      setEmpresaFormData(p => ({ 
        ...p, 
        nome_razao_social: dados.razao_social || '', 
        nome_fantasia: dados.nome_fantasia || '', 
        endereco: dados.endereco || '', 
        numero: dados.numero || '', 
        bairro: dados.bairro || '', 
        cidade: dados.cidade || '', 
        estado: dados.estado || '', 
        cep: (dados.cep || '').replace(/\D/g, ''), 
        telefone: dados.telefone || p.telefone || '', 
        email: dados.email || p.email || '', 
      })); 
      alert('Dados CNPJ carregados com sucesso!'); 
    } catch (e) { 
      alert(`Erro ao buscar CNPJ: ${e.message}`); 
    } finally { 
      setLoadingEmpresaCNPJ(false); 
    }
  };

  const handleEmpresaBuscaCEP = async () => {
    const cep = empresaFormData.cep.replace(/\D/g, ''); 
    if (cep.length !== 8) { alert('Digite CEP com 8 números.'); return; } 
    setLoadingEmpresaCEP(true);
    try { 
      const res = await axios.get(`https://viacep.com.br/ws/${cep}/json/`); const d = res.data; 
      if (d.erro) { alert('CEP não encontrado.'); } 
      else { setEmpresaFormData(p => ({ ...p, endereco: d.logradouro || '', bairro: d.bairro || '', cidade: d.localidade || '', estado: d.uf || '', })); 
      alert('Endereço carregado!'); } 
    } catch (e) { alert('não foi possível buscar os dados do CEP.'); } 
    finally { setLoadingEmpresaCEP(false); }
  };
  
  const handleSaveEmpresa = async () => {
    if (!empresaFormData.nome_razao_social || !empresaFormData.cpf_cnpj) {
      alert('Razéo Social e CNPJ são obrigatórios.'); return;
    }
    setSavingEmpresa(true);
    const data = {
      ...empresaFormData,
      cpf_cnpj: empresaFormData.cpf_cnpj.replace(/\D/g, ''),
      cep: empresaFormData.cep.replace(/\D/g, ''),
      telefone: empresaFormData.telefone.replace(/\D/g, ''),
      logo_url: empresaFormData.logo_url || null
    };
    
    try {
      if (empresaFormData.id_empresa) {
        await axiosInstance.put(`/empresa/${empresaFormData.id_empresa}/`, data);
        alert('Dados da Empresa atualizados com sucesso!');
      } else {
        delete data.id_empresa; 
        const response = await axiosInstance.post('/empresa/', data);
        alert('Dados da Empresa cadastrados com sucesso!');
        setEmpresaFormData(prev => ({...prev, id_empresa: response.data.id_empresa}));
      }
      onSaveSuccess();
      onClose();
    } catch (error) {
       let errorMsg = 'Erro ao salvar os dados da Empresa.';
       if (error.response && error.response.status === 400 && error.response.data) {
         try {
           const firstErrorKey = Object.keys(error.response.data)[0];
           const firstErrorMessage = error.response.data[firstErrorKey][0];
           errorMsg += `\nDetalhe: ${firstErrorKey} - ${firstErrorMessage}`;
         } catch (e) {
           errorMsg += `\nDetalhe: ${JSON.stringify(error.response.data)}`;
         }
       }
       alert(errorMsg);
    } finally {
      setSavingEmpresa(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Dados da Empresa</DialogTitle>
      <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSaveEmpresa(); }}>
        <DialogContent sx={{ p: 0 }}>
          {loadingData ? <CircularProgress sx={{ m: 4 }} /> : (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tabs value={empresaTabValue} onChange={handleEmpresaTabChange}>
                  <Tab label="Dados Principais" />
                  <Tab label="Endereço" />
                  <Tab label="Logotipo" />
                  <Tab label="SPED Icms" />
                </Tabs>
              </Box>
              
              <TabPanel value={empresaTabValue} index={0}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}><TextField name="nome_razao_social" label="Nome / Razéo Social" value={empresaFormData.nome_razao_social} onChange={handleEmpresaFormChange} disabled={savingEmpresa} required fullWidth /></Grid>
                  <Grid item xs={12} sm={6}><TextField name="nome_fantasia" label="Nome Fantasia" value={empresaFormData.nome_fantasia} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth /></Grid>
                  <Grid item xs={12} sm={6}><TextField name="cpf_cnpj" label="CPF / CNPJ" value={empresaFormData.cpf_cnpj} onChange={handleEmpresaFormChange} disabled={savingEmpresa || loadingEmpresaCNPJ} required fullWidth InputProps={{ endAdornment: ( <InputAdornment position="end"> <span> <IconButton aria-label="buscar cnpj" onClick={handleEmpresaBuscaCNPJ} disabled={loadingEmpresaCNPJ || (empresaFormData.cpf_cnpj && empresaFormData.cpf_cnpj.replace(/\D/g, '').length !== 14)} edge="end"> {loadingEmpresaCNPJ ? <CircularProgress size={20} /> : <SearchIcon />} </IconButton> </span> </InputAdornment> ), }}/></Grid>
                  <Grid item xs={12} sm={6}><TextField name="inscricao_estadual" label="Inscriçéo Estadual" value={empresaFormData.inscricao_estadual} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth /></Grid>
                  <Grid item xs={12} sm={6}><TextField name="telefone" label="Telefone" value={empresaFormData.telefone} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth /></Grid>
                  <Grid item xs={12} sm={6}><TextField name="email" label="Email" type="email" value={empresaFormData.email} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth /></Grid>
                </Grid>
              </TabPanel>
              
              <TabPanel value={empresaTabValue} index={1}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}><TextField name="cep" label="CEP" value={empresaFormData.cep} onChange={handleEmpresaFormChange} disabled={savingEmpresa || loadingEmpresaCEP} fullWidth InputProps={{ endAdornment: ( <InputAdornment position="end"> <span> <IconButton aria-label="buscar cep" onClick={handleEmpresaBuscaCEP} disabled={loadingEmpresaCEP || (empresaFormData.cep && empresaFormData.cep.replace(/\D/g, '').length !== 8)}> {loadingEmpresaCEP ? <CircularProgress size={20} /> : <SearchIcon />} </IconButton> </span> </InputAdornment> ), }}/></Grid>
                  <Grid item xs={12} sm={6}><TextField name="endereco" label="Endereço (Logradouro)" value={empresaFormData.endereco} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth /></Grid>
                  <Grid item xs={12} sm={2}><TextField name="numero" label="Número" value={empresaFormData.numero} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth /></Grid>
                  <Grid item xs={12} sm={5}><TextField name="bairro" label="Bairro" value={empresaFormData.bairro} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth /></Grid>
                  <Grid item xs={12} sm={5}><TextField name="cidade" label="Cidade" value={empresaFormData.cidade} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth /></Grid>
                  <Grid item xs={12} sm={2}><TextField name="estado" label="UF" value={empresaFormData.estado} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth inputProps={{ maxLength: 2 }}/></Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={empresaTabValue} index={2}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}><TextField name="logo_url" label="URL do Logotipo" value={empresaFormData.logo_url} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth helperText="Insira a URL de uma imagem para o logotipo."/></Grid>
                  <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                    {empresaFormData.logo_url ? (<Avatar src={empresaFormData.logo_url} alt="Logo" sx={{ width: 80, height: 80, border: '1px solid #ddd', variant: "rounded" }} />) : (<Avatar sx={{ width: 80, height: 80, bgcolor: 'grey.300', variant: "rounded" }}><BusinessIcon sx={{ fontSize: 50, color: 'grey.600' }} /></Avatar>)}
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={empresaTabValue} index={3}>
                <Box sx={{ p: 2, height: '60vh', overflowY: 'auto' }}>
                  {/* Dados */}
                  <Box sx={{ border: '1px solid #ccc', borderRadius: 1, mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ bgcolor: '#dcdcdc', px: 1, py: 0.5, fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                        Dados
                      </Typography>
                      <Grid container spacing={2} sx={{ p: 1 }} alignItems="center">
                        <Grid item xs={3}>
                          <TextField 
                            name="sped_versao" 
                            label="Versão" 
                            value={empresaFormData.sped_versao} 
                            onChange={handleEmpresaFormChange} 
                            disabled={savingEmpresa} 
                            fullWidth 
                            size="small" 
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item xs={5}>
                           <FormControl fullWidth size="small">
                              <InputLabel>Finalidade</InputLabel>
                              <Select 
                                name="sped_finalidade" 
                                value={empresaFormData.sped_finalidade} 
                                onChange={handleEmpresaFormChange} 
                                label="Finalidade" 
                                disabled={savingEmpresa}
                              >
                                 <MenuItem value="0">Nova Remessa</MenuItem>
                                 <MenuItem value="1">Retificadora</MenuItem>
                              </Select>
                           </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <FormControlLabel control={<Checkbox checked={empresaFormData.sped_gerar_bloco_c_vazio} onChange={handleEmpresaFormChange} name="sped_gerar_bloco_c_vazio" size="small"/>} label="Gerar Bloco C vazio" />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControlLabel control={<Checkbox checked={empresaFormData.sped_verifica_contingencia} onChange={handleEmpresaFormChange} name="sped_verifica_contingencia" size="small"/>} label="Verifica NFCe ou NFe em Contingência" />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel control={<Checkbox checked={empresaFormData.sped_aproveita_credito_icms} onChange={handleEmpresaFormChange} name="sped_aproveita_credito_icms" size="small"/>} label="Aproveita Icms ST e IPI" />
                                </Grid>
                            </Grid>
                        </Grid>
                      </Grid>
                  </Box>

                  {/* Operações Lado a Lado */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                      {/* Operação Entrada */}
                      <Grid item xs={12} md={6}>
                          <Box sx={{ border: '1px solid #ccc', borderRadius: 1, height: '100%' }}>
                              <Typography variant="subtitle2" sx={{ bgcolor: '#dcdcdc', px: 1, py: 0.5, fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                                Operação Entrada
                              </Typography>
                              <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                 <TextField name="sped_operacao_entrada_bloco_0" label="Bloco 0" value={empresaFormData.sped_operacao_entrada_bloco_0} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth size="small" placeholder="CJ SPED FISCAL (ENTRADAS)" />
                                 <TextField name="sped_operacao_entrada_bloco_c" label="Bloco C" value={empresaFormData.sped_operacao_entrada_bloco_c} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth size="small" placeholder="CJ SPED FISCAL (ENTRADAS)" />
                                 <TextField name="sped_operacao_entrada_bloco_d" label="Bloco D" value={empresaFormData.sped_operacao_entrada_bloco_d} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth size="small" placeholder="CJ SINTEGRA (ENTRADAS)" />
                              </Box>
                          </Box>
                      </Grid>
                      
                      {/* Operação Saída */}
                      <Grid item xs={12} md={6}>
                          <Box sx={{ border: '1px solid #ccc', borderRadius: 1, height: '100%' }}>
                              <Typography variant="subtitle2" sx={{ bgcolor: '#dcdcdc', px: 1, py: 0.5, fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                                Operação Saída
                              </Typography>
                              <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                 <TextField name="sped_operacao_saida_bloco_0" label="Bloco 0" value={empresaFormData.sped_operacao_saida_bloco_0} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth size="small" placeholder="CJ SINTEGRA FISCAL (SAÍDAS)" />
                                 <TextField name="sped_operacao_saida_bloco_c" label="Bloco C" value={empresaFormData.sped_operacao_saida_bloco_c} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth size="small" placeholder="CJ SINTEGRA FISCAL (SAÍDAS)" />
                                 <TextField name="sped_operacao_saida_bloco_d" label="Bloco D" value={empresaFormData.sped_operacao_saida_bloco_d} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth size="small" placeholder="CJ SINTEGRA FISCAL (SAÍDAS)" />
                              </Box>
                          </Box>
                      </Grid>
                  </Grid>

                  {/* Blocos */}
                  <Box sx={{ border: '1px solid #ccc', borderRadius: 1, mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ bgcolor: '#dcdcdc', px: 1, py: 0.5, fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                        Blocos
                      </Typography>
                      <Grid container sx={{ p: 1 }}>
                        <Grid item xs={2}><FormControlLabel control={<Checkbox checked={empresaFormData.sped_gerar_bloco_c} onChange={handleEmpresaFormChange} name="sped_gerar_bloco_c" size="small"/>} label="Bloco C" /></Grid>
                        <Grid item xs={2}><FormControlLabel control={<Checkbox checked={empresaFormData.sped_gerar_bloco_d} onChange={handleEmpresaFormChange} name="sped_gerar_bloco_d" size="small"/>} label="Bloco D" /></Grid>
                        <Grid item xs={2}><FormControlLabel control={<Checkbox checked={empresaFormData.sped_gerar_bloco_e} onChange={handleEmpresaFormChange} name="sped_gerar_bloco_e" size="small"/>} label="Bloco E" /></Grid>
                        <Grid item xs={2}><FormControlLabel control={<Checkbox checked={empresaFormData.sped_gerar_bloco_g} onChange={handleEmpresaFormChange} name="sped_gerar_bloco_g" size="small"/>} label="Bloco G" /></Grid>
                        <Grid item xs={2}><FormControlLabel control={<Checkbox checked={empresaFormData.sped_gerar_bloco_h} onChange={handleEmpresaFormChange} name="sped_gerar_bloco_h" size="small"/>} label="Bloco H" /></Grid>
                        <Grid item xs={2}><FormControlLabel control={<Checkbox checked={empresaFormData.sped_gerar_bloco_k} onChange={handleEmpresaFormChange} name="sped_gerar_bloco_k" size="small"/>} label="Bloco K" /></Grid>
                      </Grid>
                  </Box>

                  {/* Centro de Custo / Bloco 1 */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                     <Grid item xs={12} md={6}>
                       <Box sx={{ border: '1px solid #ccc', borderRadius: 1, height: '100%' }}>
                         <Typography variant="subtitle2" sx={{ bgcolor: '#dcdcdc', px: 1, py: 0.5, fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>Centro de Custo (Bloco 1)</Typography>
                         <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                             <TextField fullWidth name="sped_centro_custo_credito" label="Crédito" value={empresaFormData.sped_centro_custo_credito} onChange={handleEmpresaFormChange} disabled={savingEmpresa} margin="dense" size="small" placeholder="Selecione" />
                             <TextField fullWidth name="sped_centro_custo_debito" label="Débito" value={empresaFormData.sped_centro_custo_debito} onChange={handleEmpresaFormChange} disabled={savingEmpresa} margin="dense" size="small" placeholder="Selecione" />
                         </Box>
                       </Box>
                     </Grid>
                     <Grid item xs={12} md={6}>
                       <Box sx={{ border: '1px solid #ccc', borderRadius: 1, height: '100%' }}>
                         <Typography variant="subtitle2" sx={{ bgcolor: '#dcdcdc', px: 1, py: 0.5, fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>Operação (Bloco 1)</Typography>
                         <Box sx={{ p: 1 }}>
                             <TextField fullWidth name="sped_operacao_bloco_1" label="Selecione" value={empresaFormData.sped_operacao_bloco_1} onChange={handleEmpresaFormChange} disabled={savingEmpresa} margin="dense" size="small" />
                         </Box>
                       </Box>
                     </Grid>
                  </Grid>

                  {/* Bloco K */}
                  <Box sx={{ border: '1px solid #ccc', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ bgcolor: '#dcdcdc', px: 1, py: 0.5, fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                        Bloco K
                      </Typography>
                      <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <TextField name="sped_bloco_k_deposito" label="Depósito" value={empresaFormData.sped_bloco_k_deposito} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth size="small" placeholder="Selecione" />
                        <TextField name="sped_bloco_k_grupo" label="Grupo" value={empresaFormData.sped_bloco_k_grupo} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth size="small" placeholder="Selecione" />
                        <TextField name="sped_bloco_k_preco" label="Preço" value={empresaFormData.sped_bloco_k_preco} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth size="small" placeholder="Selecione" />
                        <TextField name="sped_bloco_k_leiaute" label="Leiaute" value={empresaFormData.sped_bloco_k_leiaute} onChange={handleEmpresaFormChange} disabled={savingEmpresa} fullWidth size="small" placeholder="Selecione" />
                      </Box>
                  </Box>

                </Box>
              </TabPanel>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CloseIcon />} onClick={onClose} disabled={savingEmpresa}>Cancelar</Button>
          <Button 
            startIcon={<SaveIcon />} 
            variant="contained" 
            disabled={savingEmpresa || loadingData}
            type="submit"
          >
            {savingEmpresa ? <CircularProgress size={24} /> : 'Salvar Dados da Empresa'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default EmpresaDialog;