// Em: src/components/VendedorDialog.jsx

import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Grid,
  Dialog, DialogActions, DialogContent, DialogTitle, 
  Tabs, Tab, OutlinedInput, Chip
} from '@mui/material';
// Grid from @mui/material is used (Unstable_Grid2 not available in this environment)
// Ícones
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
// Helpers
import TabPanel from './TabPanel'; 
import { useAuth } from '../context/AuthContext'; 

function VendedorDialog({ 
  open, 
  onClose, 
  onSaveSuccess, 
  vendedorToEdit,
  funcoes, // Lista de todas as funções disponíveis
  vendedores // Lista de todos os vendedores (para validação)
}) {
  
  const { axiosInstance } = useAuth();

  const [vendedorFormData, setVendedorFormData] = useState({
    cpf: '', nome: '', nome_reduzido: '', telefone: '', cep: '',
    logradouro: '', numero: '', bairro: '', cidade: '', estado: '',
    percentual_comissao: 0,
    id_user: '', 
    funcoes_ids: []
  });
  const [savingVendedor, setSavingVendedor] = useState(false);
  const [vendedorTabValue, setVendedorTabValue] = useState(0); 

  useEffect(() => {
    setVendedorTabValue(0);
    if (vendedorToEdit) {
      setVendedorFormData({
        cpf: vendedorToEdit.cpf || '',
        nome: vendedorToEdit.nome || '',
        nome_reduzido: vendedorToEdit.nome_reduzido || '',
        telefone: vendedorToEdit.telefone || '',
        cep: vendedorToEdit.cep || '',
        logradouro: vendedorToEdit.logradouro || '',
        numero: vendedorToEdit.numero || '',
        bairro: vendedorToEdit.bairro || '',
        cidade: vendedorToEdit.cidade || '',
        estado: vendedorToEdit.estado || '',
        percentual_comissao: vendedorToEdit.percentual_comissao || 0,
        id_user: vendedorToEdit.id_user || '',
        funcoes_ids: vendedorToEdit.funcoes ? vendedorToEdit.funcoes.map(f => f.id_funcao) : []
      });
    } else {
      // Limpa o form
      setVendedorFormData({
        cpf: '', nome: '', nome_reduzido: '', telefone: '', cep: '',
        logradouro: '', numero: '', bairro: '', cidade: '', estado: '',
        percentual_comissao: 0,
        id_user: '', 
        funcoes_ids: []
      });
    }
  }, [vendedorToEdit, open]);

  const handleVendedorFormChange = (e) => { 
    const { name, value } = e.target; 
    setVendedorFormData(prev => ({ ...prev, [name]: value })); 
  };
  
  const handleVendedorTabChange = (event, newValue) => { 
    setVendedorTabValue(newValue); 
  };

  const handleFuncoesChange = (event) => {
    const { value } = event.target;
    setVendedorFormData(prev => ({
        ...prev,
        funcoes_ids: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleSaveVendedor = async (e) => {
    e.preventDefault();
    if (!vendedorFormData.nome || !vendedorFormData.cpf) {
      alert('Nome e CPF são obrigatórios.');
      return;
    }
    setSavingVendedor(true);

    const data = {
      ...vendedorFormData,
      percentual_comissao: parseFloat(vendedorFormData.percentual_comissao) || 0,
      id_user: vendedorFormData.id_user ? parseInt(vendedorFormData.id_user) : null
    };

    try {
      if (vendedorToEdit) {
        await axiosInstance.put(`/vendedores/${vendedorToEdit.id_vendedor}/`, data);
        alert('Vendedor atualizado!');
      } else {
        await axiosInstance.post('/vendedores/', data);
        alert('Vendedor cadastrado!');
      }
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar vendedor:", error.response?.data || error.message);
      let msg = "Erro ao salvar vendedor."
      if (error.response?.data) {
        const errors = error.response.data;
        if (errors.cpf) {
          msg = `Erro: ${errors.cpf[0]}`;
        } else if (typeof errors === 'string') {
          msg = errors;
        } else {
          msg = JSON.stringify(errors);
        }
      }
      alert(msg);
    } finally {
      setSavingVendedor(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{vendedorToEdit ? `Editar Vendedor: ${vendedorToEdit.nome}` : 'Adicionar Novo Vendedor'}</DialogTitle>
      <Box component="form" onSubmit={handleSaveVendedor}>
        <DialogContent sx={{ p: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
              <Tabs value={vendedorTabValue} onChange={handleVendedorTabChange}>
                <Tab label="Dados Principais" />
                <Tab label="Endereço" />
                <Tab label="Comissão e Funções" />
              </Tabs>
            </Box>

            <TabPanel value={vendedorTabValue} index={0}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField name="nome" label="Nome Completo" value={vendedorFormData.nome} onChange={handleVendedorFormChange} disabled={savingVendedor} required fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField name="cpf" label="CPF" value={vendedorFormData.cpf} onChange={handleVendedorFormChange} disabled={savingVendedor} required fullWidth />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField name="nome_reduzido" label="Nome Reduzido (Apelido)" value={vendedorFormData.nome_reduzido} onChange={handleVendedorFormChange} disabled={savingVendedor} fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField name="telefone" label="Telefone" value={vendedorFormData.telefone} onChange={handleVendedorFormChange} disabled={savingVendedor} fullWidth />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={vendedorTabValue} index={1}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}><TextField name="cep" label="CEP" value={vendedorFormData.cep} onChange={handleVendedorFormChange} disabled={savingVendedor} fullWidth /></Grid>
                <Grid item xs={12} sm={8}><TextField name="logradouro" label="Endereço (Logradouro)" value={vendedorFormData.logradouro} onChange={handleVendedorFormChange} disabled={savingVendedor} fullWidth /></Grid>
                <Grid item xs={12} sm={3}><TextField name="numero" label="Número" value={vendedorFormData.numero} onChange={handleVendedorFormChange} disabled={savingVendedor} fullWidth /></Grid>
                <Grid item xs={12} sm={5}><TextField name="bairro" label="Bairro" value={vendedorFormData.bairro} onChange={handleVendedorFormChange} disabled={savingVendedor} fullWidth /></Grid>
                <Grid item xs={12} sm={4}><TextField name="cidade" label="Cidade" value={vendedorFormData.cidade} onChange={handleVendedorFormChange} disabled={savingVendedor} fullWidth /></Grid>
                <Grid item xs={12} sm={2}><TextField name="estado" label="UF" value={vendedorFormData.estado} onChange={handleVendedorFormChange} disabled={savingVendedor} fullWidth inputProps={{ maxLength: 2 }}/></Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={vendedorTabValue} index={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    name="percentual_comissao" 
                    label="Percentual Comissão (%)" 
                    type="number"
                    value={vendedorFormData.percentual_comissao} 
                    onChange={handleVendedorFormChange} 
                    disabled={savingVendedor} 
                    fullWidth 
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="funcoes-label">Funções</InputLabel>
                    <Select
                      labelId="funcoes-label"
                      name="funcoes_ids"
                      multiple
                      value={vendedorFormData.funcoes_ids}
                      onChange={handleFuncoesChange}
                      input={<OutlinedInput label="Funções" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const funcao = funcoes.find(f => f.id_funcao === value);
                            return <Chip key={value} label={funcao ? funcao.nome_funcao : value} />;
                          })}
                        </Box>
                      )}
                    >
                      {funcoes.map((funcao) => (
                        <MenuItem
                          key={funcao.id_funcao}
                          value={funcao.id_funcao}
                        >
                          {funcao.nome_funcao}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </TabPanel>

        </DialogContent>
        <DialogActions>
          <Button startIcon={<CloseIcon />} onClick={onClose} disabled={savingVendedor}>Cancelar</Button>
          <Button 
            type="submit" 
            variant="contained" 
            startIcon={<SaveIcon />} 
            disabled={savingVendedor}
          >
            {savingVendedor ? <CircularProgress size={24} /> : 'Salvar Vendedor'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default VendedorDialog;