import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, List, ListItem, ListItemText,
  Divider, IconButton, Chip, CircularProgress, Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  WhatsApp as WhatsAppIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

/**
 * Dialog que mostra todos os cashbacks prestes a vencer
 * e permite enviar mensagem de WhatsApp para os clientes
 */
export default function CashbacksVencendoDialog({ open, onClose }) {
  const { axiosInstance } = useAuth();
  const [cashbacks, setCashbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      buscarCashbacksVencendo();
    }
  }, [open]);

  const buscarCashbacksVencendo = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/notificacoes/cashbacks-vencendo/');
      setCashbacks(response.data);
    } catch (err) {
      console.error('Erro ao buscar cashbacks:', err);
      setError('Erro ao carregar cashbacks. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const enviarWhatsApp = (cashback) => {
    const telefone = cashback.whatsapp_cliente || cashback.telefone_cliente || '';
    
    if (!telefone) {
      alert('Cliente não possui WhatsApp ou telefone cadastrado!');
      return;
    }

    // Formatar data
    const dataValidade = new Date(cashback.data_validade);
    const dataFormatada = dataValidade.toLocaleDateString('pt-BR');

    // Montar mensagem
    const mensagem = `🎉 *Olá, ${cashback.nome_cliente}!*\n\n` +
      `Você tem um *CASHBACK* disponível:\n\n` +
      `💰 Valor: *R$ ${parseFloat(cashback.saldo).toFixed(2).replace('.', ',')}*\n` +
      `📅 Válido até: *${dataFormatada}*\n\n` +
      `⏰ *Aproveite antes que expire!*\n` +
      `Use seu cashback na próxima compra e economize! 😊`;

    // Limpar telefone
    let telefoneFormatado = telefone.replace(/\D/g, '');
    
    // Adicionar código do Brasil se necessário (55)
    if (telefoneFormatado.length === 11 || telefoneFormatado.length === 10) {
      telefoneFormatado = '55' + telefoneFormatado;
    }

    // Abrir WhatsApp
    const url = `https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const getDiasRestantes = (dataValidade) => {
    const hoje = new Date();
    const validade = new Date(dataValidade);
    const diffTime = validade - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCorChip = (diasRestantes) => {
    if (diasRestantes <= 2) return 'error'; // Vermelho
    if (diasRestantes <= 5) return 'warning'; // Amarelo
    return 'info'; // Azul
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalOfferIcon sx={{ color: '#4CAF50' }} />
          <Typography variant="h6">Cashbacks Vencendo</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && cashbacks.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            🎉 Não há cashbacks vencendo nos próximos 7 dias!
          </Alert>
        )}

        {!loading && !error && cashbacks.length > 0 && (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
              📢 <strong>{cashbacks.length} cashback(s)</strong> prestes a vencer. 
              Envie uma mensagem para avisar os clientes!
            </Alert>

            <List>
              {cashbacks.map((cashback, index) => {
                const diasRestantes = getDiasRestantes(cashback.data_validade);
                const dataValidade = new Date(cashback.data_validade).toLocaleDateString('pt-BR');
                const temWhatsApp = cashback.whatsapp_cliente || cashback.telefone_cliente;

                return (
                  <React.Fragment key={cashback.id_cashback}>
                    {index > 0 && <Divider />}
                    
                    <ListItem
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        py: 2,
                        gap: 2
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {cashback.nome_cliente}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          💰 Saldo: <strong>R$ {parseFloat(cashback.saldo).toFixed(2).replace('.', ',')}</strong>
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">
                          📅 Válido até: {dataValidade}
                        </Typography>

                        {cashback.whatsapp_cliente && (
                          <Typography variant="body2" color="text.secondary">
                            📱 WhatsApp: {cashback.whatsapp_cliente}
                          </Typography>
                        )}

                        {!cashback.whatsapp_cliente && cashback.telefone_cliente && (
                          <Typography variant="body2" color="text.secondary">
                            📞 Telefone: {cashback.telefone_cliente}
                          </Typography>
                        )}

                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={`Vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`}
                            color={getCorChip(diasRestantes)}
                            size="small"
                          />
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                        <IconButton
                          color="success"
                          onClick={() => enviarWhatsApp(cashback)}
                          disabled={!temWhatsApp}
                          sx={{
                            bgcolor: temWhatsApp ? '#25D366' : 'grey.300',
                            color: 'white',
                            '&:hover': { 
                              bgcolor: temWhatsApp ? '#20BA5A' : 'grey.400'
                            },
                            '&.Mui-disabled': {
                              bgcolor: 'grey.300',
                              color: 'grey.500'
                            }
                          }}
                          title={temWhatsApp ? "Enviar WhatsApp" : "Cliente sem WhatsApp/Telefone"}
                        >
                          <WhatsAppIcon />
                        </IconButton>
                        
                        {!temWhatsApp && (
                          <Typography 
                            variant="caption" 
                            color="error" 
                            sx={{ maxWidth: 80, textAlign: 'center', fontSize: '0.65rem' }}
                          >
                            Sem contato
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
