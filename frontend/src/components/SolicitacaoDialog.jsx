// Em: src/components/SolicitacaoDialog.jsx

import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, CircularProgress, Grid,
  Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
// Ícones
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send'; 
// Helpers
import { useAuth } from '../context/AuthContext'; // Pega o Gerenciador

function SolicitacaoDialog({ 
  open, 
  onClose, 
  itemParaSolicitar, // O objeto (ex: cliente)
  tipoAcao, // Ex: "EXCLUIR_CLIENTE"
  supervisores // Lista de supervisores (admins)
}) {
  
  const { user, axiosInstance } = useAuth();

  // Estado do formulário
  const [supervisorId, setSupervisorId] = useState(''); 
  const [justificativa, setJustificativa] = useState('');
  const [saving, setSaving] = useState(false);

  // Carrega os dados quando o popup abre
  useEffect(() => {
    if (open) {
      setJustificativa('');
      // Define o primeiro admin como padréo se a lista não for vazia
      if (supervisores && supervisores.length > 0) {
        setSupervisorId(supervisores[0].id); 
      } else {
        setSupervisorId(''); // Limpa se não houver supervisores
      }
    }
  }, [open, supervisores]);

  const handleSendSolicitacao = async () => {
    if (!justificativa.trim()) {
        alert("A justificativa é obrigatória.");
        return;
    }
    if (!supervisorId) {
        alert("Selecione um supervisor para aprovação.");
        return;
    }

    setSaving(true);
    try {
        const data = {
            id_usuario_supervisor: parseInt(supervisorId),
            tipo_solicitacao: tipoAcao, // Ex: "EXCLUIR_CLIENTE"
            id_registro: itemParaSolicitar.id_cliente, // Usa o ID genérico
            observacao_solicitante: justificativa,
            // Dados Adicionais para o supervisor saber o que está sendo excluído
            dados_solicitacao: JSON.stringify({ 
                nome: itemParaSolicitar.nome_razao_social, 
                identificador: itemParaSolicitar.cpf_cnpj 
            }) 
        };

        await axiosInstance.post('/solicitacoes/', data);
        alert('Solicitação enviada para aprovação!');
        onClose(); // Fecha o popup
    } catch (error) {
        console.error("Erro ao enviar solicitação:", error);
        alert('Erro ao enviar solicitação.');
    } finally {
        setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Solicitar Aprovação ({tipoAcao})</DialogTitle>
      <DialogContent dividers>
          <Typography sx={{mb: 2}}>
              Você não tem permissão direta para esta ação. Por favor, solicite a aprovação do seu supervisor.
          </Typography>
          <Typography variant="h6" gutterBottom>
              Item: **{itemParaSolicitar?.nome_razao_social}**
          </Typography>
          <Grid container spacing={2} sx={{mt: 1}}>
              <Grid item xs={12}>
                  <FormControl fullWidth required>
                      <InputLabel id="supervisor-label">Supervisor para Aprovação</InputLabel>
                      <Select
                          labelId="supervisor-label"
                          value={supervisorId}
                          label="Supervisor para Aprovação"
                          onChange={(e) => setSupervisorId(e.target.value)}
                      >
                          {supervisores.map((s) => (
                              <MenuItem key={s.id} value={s.id}>
                                  {s.first_name || s.username}
                              </MenuItem>
                          ))}
                      </Select>
                  </FormControl>
              </Grid>
              <Grid item xs={12}>
                  <TextField
                      label="Justificativa (Obrigatório)"
                      multiline
                      rows={3}
                      fullWidth
                      required
                      value={justificativa}
                      onChange={(e) => setJustificativa(e.target.value)}
                      helperText="Explique por que esta ação é necessária."
                  />
              </Grid>
          </Grid>
      </DialogContent>
      <DialogActions>
          <Button onClick={onClose} startIcon={<CloseIcon />}>Cancelar</Button>
          <Button onClick={handleSendSolicitacao} variant="contained" color="primary" startIcon={<SendIcon />} disabled={saving}>
              {saving ? <CircularProgress size={24} /> : 'Enviar Solicitação'}
          </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SolicitacaoDialog;