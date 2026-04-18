// Em: src/components/ClientDialog.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { buscarCNPJ } from '../utils/cnpjCepUtils';
import {
  Box, TextField, Button, Typography, CircularProgress,
  InputAdornment, 
  Tabs, Tab, Avatar, Paper,
  Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Grid
} from '@mui/material';
// Grid from @mui/material is used (Unstable_Grid2 not available in this environment)
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person'; 
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import TabPanel from './TabPanel'; 
import { useAuth } from '../context/AuthContext';

function ClientDialog({ open, onClose, onSaveSuccess, clientToEdit }) {
  
  const { axiosInstance } = useAuth();

  const [clientFormData, setClientFormData] = useState({
    nome_razao_social: '', nome_fantasia: '', cpf_cnpj: '', inscricao_estadual: '',
    endereco: '', numero: '', bairro: '', cidade: '', estado: '', cep: '',
    telefone: '', email: '', limite_credito: 0, logo_url: '', sexo: ''
  });
  
  const [savingClient, setSavingClient] = useState(false);
  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [clientTabValue, setClientTabValue] = useState(0); 

  useEffect(() => {
    setClientTabValue(0);
    if (clientToEdit) {
      setClientFormData({
        nome_razao_social: clientToEdit.nome_razao_social || '',
        nome_fantasia: clientToEdit.nome_fantasia || '',
        cpf_cnpj: clientToEdit.cpf_cnpj || '',
        inscricao_estadual: clientToEdit.inscricao_estadual || '',
        endereco: clientToEdit.endereco || '',
        numero: clientToEdit.numero || '',
        bairro: clientToEdit.bairro || '',
        cidade: clientToEdit.cidade || '',
        estado: clientToEdit.estado || '',
        cep: clientToEdit.cep || '',
        telefone: clientToEdit.telefone || '',
        email: clientToEdit.email || '',
        limite_credito: clientToEdit.limite_credito || 0,
        logo_url: clientToEdit.logo_url || '',
        sexo: clientToEdit.sexo || ''
      });
    } else {
      // Limpa o form para "Adicionar Novo"
      setClientFormData({
        nome_razao_social: '', nome_fantasia: '', cpf_cnpj: '', inscricao_estadual: '',
        endereco: '', numero: '', bairro: '', cidade: '', estado: '', cep: '',
        telefone: '', email: '', limite_credito: 0, logo_url: '', sexo: ''
      });
    }
  }, [clientToEdit, open]);

  const handleClientFormChange = (e) => { 
    const { name, value } = e.target; 
    setClientFormData(prev => ({ ...prev, [name]: value })); 
  };
  
  const handleClientTabChange = (event, newValue) => { setClientTabValue(newValue); };
  
  const handleBuscaCNPJ = async () => {
    const cnpj = clientFormData.cpf_cnpj.replace(/\D/g, ''); 
    if (cnpj.length !== 14) { alert('Digite CNPJ com 14 números.'); return; } 
    setLoadingCNPJ(true);
    try { 
      const dados = await buscarCNPJ(cnpj); 
      setClientFormData(p => ({ 
        ...p, 
        nome_razao_social: dados.razao_social || '', 
        nome_fantasia: dados.nome_fantasia || '', 
        endereco: dados.endereco || '',  // Agora vem do backend
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
      setLoadingCNPJ(false); 
    }
  };
  
  const handleBuscaCEP = async () => {
    const cep = clientFormData.cep.replace(/\D/g, ''); 
    if (cep.length !== 8) { alert('Digite CEP com 8 números.'); return; } 
    setLoadingCEP(true);
    try { 
      const res = await axios.get(`https://viacep.com.br/ws/${cep}/json/`); 
      const d = res.data; 
      if (d.erro) { alert('CEP não encontrado.'); } 
      else { 
        setClientFormData(p => ({ ...p, endereco: d.logradouro || '', bairro: d.bairro || '', cidade: d.localidade || '', estado: d.uf || '', })); 
        alert('Endereço carregado!'); 
        document.getElementsByName("numero")[0]?.focus(); 
      } 
    } catch (e) { 
      alert('não foi possível buscar os dados do CEP.'); 
    } finally { 
      setLoadingCEP(false); 
    }
  };
  
  const handleSaveClient = async (e) => {
    e.preventDefault(); 
    setSavingClient(true); 
    const data = { ...clientFormData, limite_credito: parseFloat(clientFormData.limite_credito) || 0, cpf_cnpj: clientFormData.cpf_cnpj.replace(/\D/g, ''), cep: clientFormData.cep.replace(/\D/g, ''), telefone: clientFormData.telefone.replace(/\D/g, ''), logo_url: clientFormData.logo_url || null };
    try { 
      if (clientToEdit) { 
        await axiosInstance.put(`/clientes/${clientToEdit.id_cliente}/`, data); 
        alert('Cliente atualizado!'); 
      } else { 
        await axiosInstance.post('/clientes/', data); 
        alert('Cliente cadastrado!'); 
      } 
      onSaveSuccess(); // Avisa a ClientPage para recarregar a lista
      onClose(); // Fecha o popup
    } catch (error) { 
      let msg = 'Erro ao salvar cliente.'; 
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
      setSavingClient(false); 
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{clientToEdit ? `Editando: ${clientToEdit.nome_razao_social}` : 'Adicionar Novo Cliente'}</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Paper elevation={0} sx={{ width: '100%' }}>
            <Box component="form" onSubmit={handleSaveClient}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                  <Tabs value={clientTabValue} onChange={handleClientTabChange}>
                    <Tab label="Dados Principais" />
                    <Tab label="Endereço" />
                    <Tab label="Logotipo" />
                  </Tabs>
                </Box>
                
                <TabPanel value={clientTabValue} index={0}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}><TextField name="nome_razao_social" label="Nome / Razéo Social" value={clientFormData.nome_razao_social} onChange={handleClientFormChange} disabled={savingClient} required fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="nome_fantasia" label="Nome Fantasia" value={clientFormData.nome_fantasia} onChange={handleClientFormChange} disabled={savingClient} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="cpf_cnpj" label="CPF / CNPJ" value={clientFormData.cpf_cnpj} onChange={handleClientFormChange} disabled={savingClient || loadingCNPJ} required fullWidth InputProps={{ endAdornment: ( <InputAdornment position="end"> <span> <IconButton aria-label="buscar cnpj" onClick={handleBuscaCNPJ} disabled={loadingCNPJ || Boolean(clientFormData.cpf_cnpj && clientFormData.cpf_cnpj.replace(/\D/g, '').length !== 14)} edge="end"> {loadingCNPJ ? <CircularProgress size={20} /> : <SearchIcon />} </IconButton> </span> </InputAdornment> ), }}/></Grid>       
                    <Grid item xs={12} sm={6}><TextField name="inscricao_estadual" label="Inscriçéo Estadual" value={clientFormData.inscricao_estadual} onChange={handleClientFormChange} disabled={savingClient} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="telefone" label="Telefone" value={clientFormData.telefone} onChange={handleClientFormChange} disabled={savingClient} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="email" label="Email" type="email" value={clientFormData.email} onChange={handleClientFormChange} disabled={savingClient} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="limite_credito" label="Limite de Crédito" type="number" value={clientFormData.limite_credito} onChange={handleClientFormChange} disabled={savingClient} fullWidth InputProps={{ inputProps: { min: 0, step: 0.01 } }}/></Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Sexo</InputLabel>
                        <Select name="sexo" value={clientFormData.sexo} onChange={handleClientFormChange} label="Sexo" disabled={savingClient}>
                          <MenuItem value="">Não informado</MenuItem>
                          <MenuItem value="M">Masculino</MenuItem>
                          <MenuItem value="F">Feminino</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </TabPanel>
                
                <TabPanel value={clientTabValue} index={1}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}><TextField name="cep" label="CEP" value={clientFormData.cep} onChange={handleClientFormChange} disabled={savingClient || loadingCEP} fullWidth InputProps={{ endAdornment: ( <InputAdornment position="end"> <span> <IconButton aria-label="buscar cep" onClick={handleBuscaCEP} disabled={loadingCEP || Boolean(clientFormData.cep && clientFormData.cep.replace(/\D/g, '').length !== 8)} edge="end"> {loadingCEP ? <CircularProgress size={20} /> : <SearchIcon />} </IconButton> </span> </InputAdornment> ), }}/></Grid>
                    <Grid item xs={12} sm={6}><TextField name="endereco" label="Endereço (Logradouro)" value={clientFormData.endereco} onChange={handleClientFormChange} disabled={savingClient} fullWidth /></Grid>
                    <Grid item xs={12} sm={2}><TextField name="numero" label="Número" value={clientFormData.numero} onChange={handleClientFormChange} disabled={savingClient} fullWidth /></Grid>
                    <Grid item xs={12} sm={5}><TextField name="bairro" label="Bairro" value={clientFormData.bairro} onChange={handleClientFormChange} disabled={savingClient} fullWidth /></Grid>
                    <Grid item xs={12} sm={5}><TextField name="cidade" label="Cidade" value={clientFormData.cidade} onChange={handleClientFormChange} disabled={savingClient} fullWidth /></Grid>
                    <Grid item xs={12} sm={2}><TextField name="estado" label="UF" value={clientFormData.estado} onChange={handleClientFormChange} disabled={savingClient} fullWidth inputProps={{ maxLength: 2 }}/></Grid>
                  </Grid>
                </TabPanel>

                <TabPanel value={clientTabValue} index={2}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={8}><TextField name="logo_url" label="URL do Logotipo" value={clientFormData.logo_url} onChange={handleClientFormChange} disabled={savingClient} fullWidth helperText="Insira a URL de uma imagem para o logotipo."/></Grid>
                    <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                      {clientFormData.logo_url ? (<Avatar src={clientFormData.logo_url} alt="Logo" sx={{ width: 80, height: 80, border: '1px solid #ddd' }} />) : (<Avatar sx={{ width: 80, height: 80, bgcolor: 'grey.300' }}><PersonIcon sx={{ fontSize: 50, color: 'grey.600' }} /></Avatar>)}
                    </Grid>
                  </Grid>
                </TabPanel>
            </Box>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={onClose} disabled={savingClient}>Cancelar</Button>
          <Button 
            type="submit" // Para acionar o onSubmit do <Box component="form">
            onClick={handleSaveClient} // Garante o clique
            variant="contained" 
            startIcon={<SaveIcon />} 
            disabled={savingClient}
          >
              {savingClient ? <CircularProgress size={24} /> : (clientToEdit ? 'Salvar Alterações' : 'Salvar Novo Cliente')}
          </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ClientDialog;