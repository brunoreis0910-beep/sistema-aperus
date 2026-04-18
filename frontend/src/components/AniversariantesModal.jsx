import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  TextField,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  CakeOutlined as CakeIcon,
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  SendOutlined as SendIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const AniversariantesModal = ({ open, onClose }) => {
  const { axiosInstance } = useAuth();
  const [aniversariantes, setAniversariantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState({});
  const [mensagensPersonalizadas, setMensagensPersonalizadas] = useState({});
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (open) {
      carregarAniversariantes();
    }
  }, [open]);

  const carregarAniversariantes = async () => {
    try {
      setLoading(true);
      setErro(null);
      const response = await axiosInstance.get('/aniversariantes/');
      setAniversariantes(response.data.aniversariantes || []);
    } catch (err) {
      console.error('Erro ao carregar aniversariantes:', err);
      setErro('Erro ao carregar aniversariantes. Verifique se o campo data_nascimento existe na tabela clientes.');
    } finally {
      setLoading(false);
    }
  };

  const enviarMensagem = async (aniversariante) => {
    try {
      setEnviando(prev => ({ ...prev, [aniversariante.id_cliente]: true }));

      const mensagem = mensagensPersonalizadas[aniversariante.id_cliente] || '';

      const response = await axiosInstance.post('/aniversariantes/enviar/', {
        id_cliente: aniversariante.id_cliente,
        telefone: aniversariante.telefone,
        nome: aniversariante.nome,
        mensagem: mensagem
      });

      if (response.data.sucesso) {
        // Abrir WhatsApp em nova aba
        window.open(response.data.whatsapp_url, '_blank');
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      alert('Erro ao enviar mensagem: ' + (err.response?.data?.mensagem || err.message));
    } finally {
      setEnviando(prev => ({ ...prev, [aniversariante.id_cliente]: false }));
    }
  };

  const handleMensagemChange = (id_cliente, value) => {
    setMensagensPersonalizadas(prev => ({
      ...prev,
      [id_cliente]: value
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CakeIcon />
          <Typography variant="h6">
            🎉 Aniversariantes do Dia!
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        )}

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        {!loading && !erro && aniversariantes.length === 0 && (
          <Box textAlign="center" py={4}>
            <CakeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhum aniversariante hoje
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Não há clientes fazendo aniversário hoje.
            </Typography>
          </Box>
        )}

        {!loading && !erro && aniversariantes.length > 0 && (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
              {aniversariantes.length} {aniversariantes.length === 1 ? 'cliente fazendo' : 'clientes fazendo'} aniversário hoje! 🎂
            </Typography>

            <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {aniversariantes.map((aniversariante, index) => (
                <React.Fragment key={aniversariante.id_cliente}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      py: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <CakeIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {aniversariante.nome}
                            </Typography>
                            {aniversariante.idade && (
                              <Chip
                                label={`${aniversariante.idade} anos`}
                                size="small"
                                color="primary"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            📞 {aniversariante.telefone || 'Sem telefone'}
                          </Typography>
                        }
                      />
                    </Box>

                    {aniversariante.telefone && (
                      <Box sx={{ ml: 7 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          size="small"
                          placeholder="Mensagem personalizada (opcional - deixe em branco para usar a mensagem padrão)"
                          value={mensagensPersonalizadas[aniversariante.id_cliente] || ''}
                          onChange={(e) => handleMensagemChange(aniversariante.id_cliente, e.target.value)}
                          sx={{ mb: 1 }}
                        />
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={enviando[aniversariante.id_cliente] ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
                          onClick={() => enviarMensagem(aniversariante)}
                          disabled={enviando[aniversariante.id_cliente]}
                          fullWidth
                        >
                          {enviando[aniversariante.id_cliente] ? 'Enviando...' : 'Enviar Mensagem pelo WhatsApp'}
                        </Button>
                      </Box>
                    )}

                    {!aniversariante.telefone && (
                      <Alert severity="warning" sx={{ ml: 7 }}>
                        Cliente não possui telefone cadastrado
                      </Alert>
                    )}
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AniversariantesModal;
