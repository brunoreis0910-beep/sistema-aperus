import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAuth } from '../context/AuthContext';

/**
 * Modal para solicitar aprovação do supervisor
 * 
 * @param {boolean} open - Controla se o modal está aberto
 * @param {function} onClose - Callback ao fechar o modal
 * @param {string} tipoSolicitacao - Tipo da solicitação (venda, compra, cliente, etc.)
 * @param {object} dados - Dados que serão enviados para aprovação
 * @param {function} onSuccess - Callback executado após sucesso
 * @param {string} titulo - Título customizado do modal
 * @param {string} mensagemMotivo - Mensagem explicando porque a aprovação é necessária
 */
const SolicitarAprovacaoModal = ({
  open,
  onClose,
  tipoSolicitacao,
  dados,
  onSuccess,
  titulo = 'Solicitação de Aprovação',
  mensagemMotivo = 'Esta ação requer aprovação do supervisor.'
}) => {
  const { axiosInstance } = useAuth();
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSolicitar = async () => {
    if (!observacao.trim()) {
      setErro('Por favor, informe o motivo da solicitação');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const response = await axiosInstance.post('/solicitacoes/', {
        tipo_solicitacao: tipoSolicitacao,
        dados_solicitacao: JSON.stringify(dados),
        observacao_solicitante: observacao
      }, { timeout: 90000 }); // 90s — análise Gemini + envio WhatsApp podem demorar

      // Callback de sucesso
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Limpar e fechar
      setObservacao('');
      onClose();
    } catch (error) {
      console.error('Erro ao solicitar aprovação:', error);
      setErro(
        error.response?.data?.detail ||
        error.response?.data?.error ||
        'Erro ao enviar solicitação. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setObservacao('');
      setErro('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningAmberIcon color="warning" />
          {titulo}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {mensagemMotivo}
        </Alert>

        <Typography variant="body2" color="textSecondary" paragraph>
          <strong>Tipo:</strong> {tipoSolicitacao}
        </Typography>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Motivo da Solicitação *"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Descreva o motivo pelo qual você está solicitando esta aprovação..."
          disabled={loading}
          required
          error={!!(erro && !observacao.trim())}
          helperText="Explique claramente o motivo da solicitação para ajudar o supervisor na análise."
        />

        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          A solicitação será enviada ao seu supervisor para análise. Você será notificado quando houver uma resposta.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSolicitar}
          variant="contained"
          color="primary"
          disabled={loading || !observacao.trim()}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Enviando...' : 'Solicitar Aprovação'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SolicitarAprovacaoModal;
