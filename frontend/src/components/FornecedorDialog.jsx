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
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import TabPanel from './TabPanel';
import { useAuth } from '../context/AuthContext';

function FornecedorDialog({ open, onClose, onSaveSuccess, fornecedorToEdit }) {

  const { axiosInstance } = useAuth();

  const [formData, setFormData] = useState({
    nome_razao_social: '', nome_fantasia: '', cpf_cnpj: '', inscricao_estadual: '',
    endereco: '', numero: '', bairro: '', cidade: '', estado: '', cep: '',
    telefone: '', email: '', limite_credito: 0, logo_url: ''
  });

  const [saving, setSaving] = useState(false);
  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    setTabValue(0);
    if (fornecedorToEdit) {
      setFormData({
        nome_razao_social: fornecedorToEdit.nome_razao_social || '',
        nome_fantasia: fornecedorToEdit.nome_fantasia || '',
        cpf_cnpj: fornecedorToEdit.cpf_cnpj || '',
        inscricao_estadual: fornecedorToEdit.inscricao_estadual || '',
        endereco: fornecedorToEdit.endereco || '',
        numero: fornecedorToEdit.numero || '',
        bairro: fornecedorToEdit.bairro || '',
        cidade: fornecedorToEdit.cidade || '',
        estado: fornecedorToEdit.estado || '',
        cep: fornecedorToEdit.cep || '',
        telefone: fornecedorToEdit.telefone || '',
        email: fornecedorToEdit.email || '',
        limite_credito: fornecedorToEdit.limite_credito || 0,
        logo_url: fornecedorToEdit.logo_url || ''
      });
    } else {
      setFormData({ nome_razao_social: '', nome_fantasia: '', cpf_cnpj: '', inscricao_estadual: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '', cep: '', telefone: '', email: '', limite_credito: 0, logo_url: '' });
    }
  }, [fornecedorToEdit, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (event, newValue) => { setTabValue(newValue); };

  const handleBuscaCNPJ = async () => {
    const cnpj = formData.cpf_cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) { alert('Digite CNPJ com 14 números.'); return; }
    setLoadingCNPJ(true);
    try {
      const dados = await buscarCNPJ(cnpj);
      setFormData(p => ({ 
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
      setLoadingCNPJ(false);
    }
  };

  const handleBuscaCEP = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) { alert('Digite CEP com 8 números.'); return; }
    setLoadingCEP(true);
    try {
      const res = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      const d = res.data;
      if (d.erro) { alert('CEP não encontrado.'); }
      else {
        setFormData(p => ({ ...p, endereco: d.logradouro || '', bairro: d.bairro || '', cidade: d.localidade || '', estado: d.uf || '', }));
        alert('Endereço carregado!');
        document.getElementsByName("numero")[0]?.focus();
      }
    } catch (e) {
      alert('não foi possível buscar os dados do CEP.');
    } finally {
      setLoadingCEP(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...formData, limite_credito: parseFloat(formData.limite_credito) || 0, cpf_cnpj: formData.cpf_cnpj.replace(/\D/g, ''), cep: formData.cep.replace(/\D/g, ''), telefone: formData.telefone.replace(/\D/g, ''), logo_url: formData.logo_url || null };
    try {
      if (fornecedorToEdit) {
        await axiosInstance.put(`/fornecedores/${fornecedorToEdit.id_fornecedor}/`, data);
        alert('Fornecedor atualizado!');
      } else {
        await axiosInstance.post('/fornecedores/', data);
        alert('Fornecedor cadastrado!');
      }
      onSaveSuccess();
      onClose();
    } catch (error) {
      let msg = 'Erro ao salvar fornecedor.';
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
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{fornecedorToEdit ? `Editando: ${fornecedorToEdit.nome_razao_social}` : 'Adicionar Novo Fornecedor'}</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Paper elevation={0} sx={{ width: '100%' }}>
            <Box component="form" onSubmit={handleSave}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                  <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Dados Principais" />
                    <Tab label="Endereço" />
                    <Tab label="Logotipo" />
                  </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}><TextField name="nome_razao_social" label="Nome / Razéo Social" value={formData.nome_razao_social} onChange={handleChange} disabled={!!saving} required fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="nome_fantasia" label="Nome Fantasia" value={formData.nome_fantasia} onChange={handleChange} disabled={!!saving} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="cpf_cnpj" label="CPF / CNPJ" value={formData.cpf_cnpj} onChange={handleChange} disabled={!!(saving || loadingCNPJ)} required fullWidth InputProps={{ endAdornment: ( <InputAdornment position="end"> <span> <IconButton aria-label="buscar cnpj" onClick={handleBuscaCNPJ} disabled={!!(loadingCNPJ || (formData.cpf_cnpj && formData.cpf_cnpj.replace(/\D/g, '').length !== 14))} edge="end"> {loadingCNPJ ? <CircularProgress size={20} /> : <SearchIcon />} </IconButton> </span> </InputAdornment> ), }}/></Grid>
                    <Grid item xs={12} sm={6}><TextField name="inscricao_estadual" label="Inscriçéo Estadual" value={formData.inscricao_estadual} onChange={handleChange} disabled={!!saving} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="telefone" label="Telefone" value={formData.telefone} onChange={handleChange} disabled={!!saving} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="email" label="Email" type="email" value={formData.email} onChange={handleChange} disabled={!!saving} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="limite_credito" label="Limite de Crédito" type="number" value={formData.limite_credito} onChange={handleChange} disabled={!!saving} fullWidth InputProps={{ inputProps: { min: 0, step: 0.01 } }}/></Grid>
                  </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}><TextField name="cep" label="CEP" value={formData.cep} onChange={handleChange} disabled={!!(saving || loadingCEP)} fullWidth InputProps={{ endAdornment: ( <InputAdornment position="end"> <span> <IconButton aria-label="buscar cep" onClick={handleBuscaCEP} disabled={!!(loadingCEP || (formData.cep && formData.cep.replace(/\D/g, '').length !== 8))} edge="end"> {loadingCEP ? <CircularProgress size={20} /> : <SearchIcon />} </IconButton> </span> </InputAdornment> ), }}/></Grid>
                    <Grid item xs={12} sm={6}><TextField name="endereco" label="Endereço (Logradouro)" value={formData.endereco} onChange={handleChange} disabled={!!saving} fullWidth /></Grid>
                    <Grid item xs={12} sm={2}><TextField name="numero" label="Número" value={formData.numero} onChange={handleChange} disabled={!!saving} fullWidth /></Grid>
                    <Grid item xs={12} sm={5}><TextField name="bairro" label="Bairro" value={formData.bairro} onChange={handleChange} disabled={!!saving} fullWidth /></Grid>
                    <Grid item xs={12} sm={5}><TextField name="cidade" label="Cidade" value={formData.cidade} onChange={handleChange} disabled={!!saving} fullWidth /></Grid>
                    <Grid item xs={12} sm={2}><TextField name="estado" label="UF" value={formData.estado} onChange={handleChange} disabled={!!saving} fullWidth inputProps={{ maxLength: 2 }}/></Grid>
                  </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={8}><TextField name="logo_url" label="URL do Logotipo" value={formData.logo_url} onChange={handleChange} disabled={!!saving} fullWidth helperText="Insira a URL de uma imagem para o logotipo."/></Grid>
                    <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                      {formData.logo_url ? (<Avatar src={formData.logo_url} alt="Logo" sx={{ width: 80, height: 80, border: '1px solid #ddd' }} />) : (<Avatar sx={{ width: 80, height: 80, bgcolor: 'grey.300' }}><PersonIcon sx={{ fontSize: 50, color: 'grey.600' }} /></Avatar>)}
                    </Grid>
                  </Grid>
                </TabPanel>
            </Box>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button startIcon={<CloseIcon />} onClick={onClose} disabled={!!saving}>Cancelar</Button>
          <Button
            type="submit"
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!!saving}
          >
              {saving ? <CircularProgress size={24} /> : (fornecedorToEdit ? 'Salvar Alterações' : 'Salvar Novo Fornecedor')}
          </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FornecedorDialog;
