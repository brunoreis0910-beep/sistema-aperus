import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  List, ListItem, Divider, IconButton, Chip, CircularProgress,
  Alert, Collapse, Tooltip, Button
} from '@mui/material';
import {
  Close as CloseIcon,
  WhatsApp as WhatsAppIcon,
  MoneyOff as MoneyOffIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SendOutlined as SendIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function InadimplenciaDialog({ open, onClose }) {
  const { axiosInstance } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandido, setExpandido] = useState({});
  const [sendingMode, setSendingMode] = useState('unificado');

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
      setClientes(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Erro ao buscar inadimplência:', err);
      setError('Erro ao carregar dados. Tente novamente.');
      setClientes([]);
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

    let parcelasTexto = '';
    
    if (sendingMode === 'individual') {
      parcelasTexto = cliente.parcelas.map((p) => {
        const dt = new Date(p.data_vencimento).toLocaleDateString('pt-BR');
        const prodsText = p.produtos && p.produtos.length > 0 ? `\n    🛍️ _Produtos: ${p.produtos.join(', ')}_` : '';
        const docText = p.documento ? ` [Doc: ${p.documento}]` : '';
        const linkText = p.link_fatura ? `\n    🔗 *Link para Pagamento:* ${p.link_fatura}` : '';
        return `  • *R$ ${p.valor.toFixed(2).replace('.', ',')}* - Venc: ${dt} (${p.dias_atraso} dias de atraso)${docText}${prodsText}${linkText}`;
      }).join('\n\n');
    } else {
      parcelasTexto = cliente.parcelas.map((p) => {
        const dt = new Date(p.data_vencimento).toLocaleDateString('pt-BR');
        const prodsText = p.produtos && p.produtos.length > 0 ? `\n    🛍️ _Produtos: ${p.produtos.join(', ')}_` : '';
        const docText = p.documento ? ` [Doc: ${p.documento}]` : '';
        return `  • *R$ ${p.valor.toFixed(2).replace('.', ',')}* - Venc: ${dt} (${p.dias_atraso} dias de atraso)${docText}${prodsText}`;
      }).join('\n\n');
    }

    const totalFormatado = cliente.total_devido.toFixed(2).replace('.', ',');
    let linkUnificadoText = '';
    if (sendingMode === 'unificado' && cliente.link_fatura_unificada) {
      linkUnificadoText = `\n\n🔗 *Link de Pagamento Unificado (Pix):*\n${cliente.link_fatura_unificada}`;
    }

    const mensagem =
      `Olá, *${cliente.nome_cliente}*!\n\n` +
      `Identificamos pendência(s) financeira(s) em seu cadastro:\n\n` +
      `💰 *Total em aberto: R$ ${totalFormatado}*\n\n` +
      `📋 Detalhes das Parcelas:\n\n${parcelasTexto}` +
      `${linkUnificadoText}\n\n` +
      (sendingMode === 'texto' 
        ? `Por favor, entre em contato para regularizar sua situação.\n\n` 
        : `Por favor, acesse o(s) link(s) acima para realizar o pagamento via Pix ou regularizar sua situação.\n\n`) +
      `Estamos à disposição! 😊\n\n` +
      `*APERUS*`;

    let tel = telefone.replace(/\D/g, '');
    if (tel.length === 10 || tel.length === 11) tel = '55' + tel;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const enviarWhatsAppParaTodos = () => {
    const clientesComContato = clientes.filter(c => c.whatsapp || c.telefone);
    if (clientesComContato.length === 0) {
      alert('Nenhum cliente possui WhatsApp ou telefone cadastrado!');
      return;
    }
    const confirmado = window.confirm(
      `Serão abertas ${clientesComContato.length} janela(s) do WhatsApp para envio de cobranças.\n\nPermita popups no navegador se necessário.\n\nContinuar?`
    );
    if (!confirmado) return;
    clientesComContato.forEach((cliente, i) => {
      setTimeout(() => enviarWhatsApp(cliente), i * 1500);
    });
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  ⚠️ <strong>{clientes.length} cliente(s)</strong> com parcelas vencidas.
                  Total geral: <strong>R$ {clientes.reduce((s, c) => s + c.total_devido, 0).toFixed(2).replace('.', ',')}</strong>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SendIcon />}
                  onClick={enviarWhatsAppParaTodos}
                  sx={{
                    bgcolor: '#25D366',
                    color: 'white',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    '&:hover': { bgcolor: '#20BA5A' },
                  }}
                >
                  Enviar WhatsApp para Todos ({clientes.filter(c => c.whatsapp || c.telefone).length})
                </Button>
              </Box>
            </Alert>

            {/* Seletor de Modo de Envio */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1.5}>
                ⚙️ Configuração de Envio das Cobranças (WhatsApp):
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box 
                  onClick={() => setSendingMode('unificado')}
                  sx={{ 
                    flex: 1, minWidth: 160, p: 1.5, borderRadius: 2, cursor: 'pointer', border: '2px solid',
                    borderColor: sendingMode === 'unificado' ? 'primary.main' : '#cbd5e1',
                    bgcolor: sendingMode === 'unificado' ? 'rgba(79, 70, 229, 0.04)' : 'white',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                >
                  <Typography variant="body2" fontWeight="bold" color={sendingMode === 'unificado' ? 'primary.main' : 'text.primary'} mb={0.5}>
                    🔗 Link Único Unificado
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                    Gera um único link somando todas as parcelas e listando os itens.
                  </Typography>
                </Box>

                <Box 
                  onClick={() => setSendingMode('individual')}
                  sx={{ 
                    flex: 1, minWidth: 160, p: 1.5, borderRadius: 2, cursor: 'pointer', border: '2px solid',
                    borderColor: sendingMode === 'individual' ? 'primary.main' : '#cbd5e1',
                    bgcolor: sendingMode === 'individual' ? 'rgba(79, 70, 229, 0.04)' : 'white',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                >
                  <Typography variant="body2" fontWeight="bold" color={sendingMode === 'individual' ? 'primary.main' : 'text.primary'} mb={0.5}>
                    🔗 Links Individuais
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                    Envia links individuais para o cliente pagar cada nota separadamente.
                  </Typography>
                </Box>

                <Box 
                  onClick={() => setSendingMode('texto')}
                  sx={{ 
                    flex: 1, minWidth: 160, p: 1.5, borderRadius: 2, cursor: 'pointer', border: '2px solid',
                    borderColor: sendingMode === 'texto' ? 'primary.main' : '#cbd5e1',
                    bgcolor: sendingMode === 'texto' ? 'rgba(79, 70, 229, 0.04)' : 'white',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                >
                  <Typography variant="body2" fontWeight="bold" color={sendingMode === 'texto' ? 'primary.main' : 'text.primary'} mb={0.5}>
                    💬 Apenas Texto
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                    Envia o relatório detalhado das parcelas e produtos, sem link.
                  </Typography>
                </Box>
              </Box>
            </Box>

            <List>
              {Array.isArray(clientes) && clientes.map((cliente, index) => {
                const temWhatsApp = cliente.whatsapp || cliente.telefone;
                const isExpandido = expandido[cliente.id_cliente];
                const parcelas = Array.isArray(cliente.parcelas) ? cliente.parcelas : [];
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
                          📋 {parcelas.length} parcela(s) vencida(s)
                        </Typography>
                        {(cliente.whatsapp || cliente.telefone) && (
                          <Typography variant="body2" color="text.secondary">
                            📱 {cliente.whatsapp || cliente.telefone}
                          </Typography>
                        )}
                        {cliente.link_fatura_unificada && (
                          <Typography variant="body2" color="secondary.main" sx={{ mt: 0.5, fontWeight: 'bold' }}>
                            🔗 Link Unificado: <a href={cliente.link_fatura_unificada} target="_blank" rel="noopener noreferrer">{cliente.link_fatura_unificada}</a>
                          </Typography>
                        )}
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={`Maior atraso: ${parcelas.length > 0 ? Math.max(...parcelas.map(p => p.dias_atraso)) : 0} dias`}
                            color={getCorChip(parcelas.length > 0 ? Math.max(...parcelas.map(p => p.dias_atraso)) : 0)}
                            size="small"
                          />
                        </Box>

                        <Collapse in={isExpandido}>
                          <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid #eee' }}>
                            {parcelas.map((p, pi) => (
                              <Box key={pi} sx={{ mb: 1.5 }}>
                                <Typography variant="body2">
                                  <strong>R$ {p.valor.toFixed(2).replace('.', ',')}</strong>
                                  {' - Venc: '}{new Date(p.data_vencimento).toLocaleDateString('pt-BR')}
                                  {' ('}<Chip label={`${p.dias_atraso}d atraso`} color={getCorChip(p.dias_atraso)} size="small" sx={{ height: 20, fontSize: 11 }} />{')'}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5, pl: 1 }}>
                                  {p.documento && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                      📄 Doc: {p.documento}
                                    </Typography>
                                  )}
                                  {p.produtos && p.produtos.length > 0 && (
                                    <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                                      🛍️ Produtos: {p.produtos.join(', ')}
                                    </Typography>
                                  )}
                                  {p.link_fatura && (
                                    <Typography variant="caption" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                                      🔗 Link de Pagamento: <a href={p.link_fatura} target="_blank" rel="noopener noreferrer">{p.link_fatura}</a>
                                    </Typography>
                                  )}
                                  {p.descricao && (
                                    <Typography variant="caption" color="text.secondary">
                                      ℹ️ {p.descricao} - Parcela {p.parcela}
                                    </Typography>
                                  )}
                                </Box>
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
