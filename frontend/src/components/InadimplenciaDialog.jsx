import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  List, ListItem, Divider, IconButton, Chip, CircularProgress,
  Alert, Collapse, Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  WhatsApp as WhatsAppIcon,
  MoneyOff as MoneyOffIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function InadimplenciaDialog({ open, onClose }) {
  const { axiosInstance } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandido, setExpandido] = useState({});

  useEffect(() => {
    if (open) {
      buscarInadimplencia();
    }
  }, [open]);

  const buscarInadimplencia = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/notificacoes/inadimplencia/');
      setClientes(response.data);
    } catch (err) {
      console.error('Erro ao buscar inadimplência:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandido = (id) => {
    setExpandido(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const enviarWhatsApp = (cliente) => {
    const telefone = cliente.whatsapp || cliente.telefone || '';
    if (!telefone) {
      alert('Cliente não possui WhatsApp ou telefone cadastrado!');
      return;
    }

    const totalFormatado = cliente.total_devido.toFixed(2).replace('.', ',');
    const parcelasTexto = cliente.parcelas
      .map(p => {
        const dt = new Date(p.data_vencimento).toLocaleDateString('pt-BR');
        return `  • R$ ${p.valor.toFixed(2).replace('.', ',')} - Venc: ${dt} (${p.dias_atraso} dias)`;
      })
      .join('\n');

    const mensagem =
      `Olá, *${cliente.nome_cliente}*!\n\n` +
      `Identificamos pendência(s) financeira(s) em seu cadastro:\n\n` +
      `💰 *Total em aberto: R$ ${totalFormatado}*\n\n` +
      `📋 Detalhamento:\n${parcelasTexto}\n\n` +
      `Por favor, entre em contato para regularizar sua situação.\n` +
      `Estamos à disposição! 😊\n\n` +
      `*APERUS*`;

    let tel = telefone.replace(/\D/g, '');
    if (tel.length === 10 || tel.length === 11) tel = '55' + tel;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const getCorChip = (dias) => {
    if (dias > 30) return 'error';
    if (dias > 15) return 'warning';
    return 'info';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyOffIcon sx={{ color: '#f44336' }} />
          <Typography variant="h6">Inadimplência - Contas Vencidas</Typography>
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

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!loading && !error && clientes.length === 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            🎉 Não há clientes inadimplentes!
          </Alert>
        )}

        {!loading && !error && clientes.length > 0 && (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              ⚠️ <strong>{clientes.length} cliente(s)</strong> com parcelas vencidas.
              Total geral: <strong>R$ {clientes.reduce((s, c) => s + c.total_devido, 0).toFixed(2).replace('.', ',')}</strong>
            </Alert>

            <List>
              {clientes.map((cliente, index) => {
                const temWhatsApp = cliente.whatsapp || cliente.telefone;
                const isExpandido = expandido[cliente.id_cliente];
                return (
                  <React.Fragment key={cliente.id_cliente}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 2, gap: 2, flexWrap: 'wrap' }}
                    >
                      <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => toggleExpandido(cliente.id_cliente)}>
                          {isExpandido ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          <Typography variant="subtitle1" fontWeight="bold">
                            {cliente.nome_cliente}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="error" sx={{ mt: 0.5, fontWeight: 'bold' }}>
                          💰 Total: R$ {cliente.total_devido.toFixed(2).replace('.', ',')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          📋 {cliente.parcelas.length} parcela(s) vencida(s)
                        </Typography>
                        {(cliente.whatsapp || cliente.telefone) && (
                          <Typography variant="body2" color="text.secondary">
                            📱 {cliente.whatsapp || cliente.telefone}
                          </Typography>
                        )}
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={`Maior atraso: ${Math.max(...cliente.parcelas.map(p => p.dias_atraso))} dias`}
                            color={getCorChip(Math.max(...cliente.parcelas.map(p => p.dias_atraso)))}
                            size="small"
                          />
                        </Box>

                        <Collapse in={isExpandido}>
                          <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid #eee' }}>
                            {cliente.parcelas.map((p, pi) => (
                              <Box key={pi} sx={{ mb: 1 }}>
                                <Typography variant="body2">
                                  <strong>R$ {p.valor.toFixed(2).replace('.', ',')}</strong>
                                  {' - Venc: '}{new Date(p.data_vencimento).toLocaleDateString('pt-BR')}
                                  {' ('}<Chip label={`${p.dias_atraso}d atraso`} color={getCorChip(p.dias_atraso)} size="small" sx={{ height: 20, fontSize: 11 }} />{')'}
                                </Typography>
                                {p.descricao && (
                                  <Typography variant="caption" color="text.secondary">
                                    {p.descricao} - Parcela {p.parcela}
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </Box>
                        </Collapse>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                        <Tooltip title={temWhatsApp ? 'Enviar cobrança via WhatsApp' : 'Cliente sem WhatsApp/Telefone'}>
                          <span>
                            <IconButton
                              onClick={() => enviarWhatsApp(cliente)}
                              disabled={!temWhatsApp}
                              sx={{
                                bgcolor: temWhatsApp ? '#25D366' : 'grey.300',
                                color: 'white',
                                '&:hover': { bgcolor: temWhatsApp ? '#20BA5A' : 'grey.400' },
                                '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                              }}
                            >
                              <WhatsAppIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
