import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  List, ListItem, Divider, IconButton, Chip, CircularProgress,
  Alert, Collapse, Button, Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Store as StoreIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function FornecedoresCotacaoDialog({ open, onClose }) {
  const { axiosInstance } = useAuth();
  const [dados, setDados] = useState({ fornecedores: [], sem_fornecedor: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandido, setExpandido] = useState({});

  useEffect(() => {
    if (open) {
      buscarFornecedores();
    }
  }, [open]);

  const buscarFornecedores = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/notificacoes/fornecedores-estoque-critico/');
      setDados(response.data);
    } catch (err) {
      console.error('Erro ao buscar fornecedores:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandido = (id) => {
    setExpandido(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const enviarEmailCotacao = (fornecedor) => {
    if (!fornecedor.email) {
      alert('Fornecedor não possui e-mail cadastrado!');
      return;
    }

    const itensTexto = fornecedor.produtos
      .map(p => `- ${p.nome_produto} (Cód: ${p.codigo_produto}) - Qtd sugerida: ${p.sugestao_compra}`)
      .join('\n');

    const assunto = encodeURIComponent('Solicitação de Cotação - APERUS');
    const corpo = encodeURIComponent(
      `Prezado(a) ${fornecedor.nome},\n\n` +
      `Gostaríamos de solicitar cotação para os seguintes produtos:\n\n` +
      `${itensTexto}\n\n` +
      `Favor enviar valores, prazo de entrega e condições de pagamento.\n\n` +
      `Atenciosamente,\nAPERUS`
    );

    window.open(`mailto:${fornecedor.email}?subject=${assunto}&body=${corpo}`, '_blank');
  };

  const enviarWhatsAppCotacao = (fornecedor) => {
    const telefone = fornecedor.whatsapp || fornecedor.telefone || '';
    if (!telefone) {
      alert('Fornecedor não possui WhatsApp ou telefone cadastrado!');
      return;
    }

    const itensTexto = fornecedor.produtos
      .map(p => `  • ${p.nome_produto} (Cód: ${p.codigo_produto}) - Qtd: ${p.sugestao_compra}`)
      .join('\n');

    const mensagem =
      `Olá, *${fornecedor.nome}*!\n\n` +
      `Gostaríamos de solicitar *cotação* para os seguintes produtos:\n\n` +
      `${itensTexto}\n\n` +
      `Por favor, envie valores, prazo de entrega e condições de pagamento.\n\n` +
      `*APERUS*`;

    let tel = telefone.replace(/\D/g, '');
    if (tel.length === 10 || tel.length === 11) tel = '55' + tel;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const totalFornecedores = dados.fornecedores.length;
  const totalProdutos = dados.fornecedores.reduce((s, f) => s + f.produtos.length, 0) + dados.sem_fornecedor.length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StoreIcon sx={{ color: '#2196f3' }} />
          <Typography variant="h6">Fornecedores - Cotação Estoque Crítico</Typography>
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

        {!loading && !error && totalProdutos === 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✅ Nenhum produto com estoque crítico!
          </Alert>
        )}

        {!loading && !error && totalProdutos > 0 && (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              📦 <strong>{totalProdutos} produto(s)</strong> com estoque crítico de <strong>{totalFornecedores} fornecedor(es)</strong>.
              Envie cotações por e-mail ou WhatsApp!
            </Alert>

            <List>
              {dados.fornecedores.map((forn, index) => {
                const isExpandido = expandido[forn.id_fornecedor];
                const temEmail = !!forn.email;
                const temWhatsApp = forn.whatsapp || forn.telefone;
                return (
                  <React.Fragment key={forn.id_fornecedor}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 2, gap: 2, flexWrap: 'wrap' }}
                    >
                      <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => toggleExpandido(forn.id_fornecedor)}>
                          {isExpandido ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          <Typography variant="subtitle1" fontWeight="bold">
                            {forn.nome}
                          </Typography>
                          <Chip label={`${forn.produtos.length} produto(s)`} size="small" color="primary" variant="outlined" />
                        </Box>

                        {forn.email && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            ✉️ {forn.email}
                          </Typography>
                        )}
                        {(forn.whatsapp || forn.telefone) && (
                          <Typography variant="body2" color="text.secondary">
                            📱 {forn.whatsapp || forn.telefone}
                          </Typography>
                        )}
                        <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                          💰 Valor estimado: R$ {forn.valor_estimado.toFixed(2).replace('.', ',')}
                        </Typography>

                        <Collapse in={isExpandido}>
                          <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid #eee' }}>
                            {forn.produtos.map((p, pi) => (
                              <Box key={pi} sx={{ mb: 1 }}>
                                <Typography variant="body2">
                                  <strong>{p.nome_produto}</strong> (Cód: {p.codigo_produto})
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Estoque: {p.estoque_atual} | Média/mês: {p.media_mensal} | Sugestão: <strong>{p.sugestao_compra}</strong>
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Collapse>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                        <Tooltip title={temEmail ? 'Enviar cotação por e-mail' : 'Fornecedor sem e-mail'}>
                          <span>
                            <IconButton
                              onClick={() => enviarEmailCotacao(forn)}
                              disabled={!temEmail}
                              sx={{
                                bgcolor: temEmail ? '#1976d2' : 'grey.300',
                                color: 'white',
                                '&:hover': { bgcolor: temEmail ? '#1565c0' : 'grey.400' },
                                '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                              }}
                            >
                              <EmailIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={temWhatsApp ? 'Enviar cotação via WhatsApp' : 'Fornecedor sem WhatsApp'}>
                          <span>
                            <IconButton
                              onClick={() => enviarWhatsAppCotacao(forn)}
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

              {dados.sem_fornecedor.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, mb: 1 }}>
                    ⚠️ Produtos sem fornecedor identificado ({dados.sem_fornecedor.length}):
                  </Typography>
                  {dados.sem_fornecedor.map((p, pi) => (
                    <ListItem key={pi} sx={{ py: 0.5 }}>
                      <Typography variant="body2">
                        {p.nome_produto} (Cód: {p.codigo_produto}) - Estoque: {p.estoque_atual} | Sugestão: {p.sugestao_compra}
                      </Typography>
                    </ListItem>
                  ))}
                </>
              )}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
