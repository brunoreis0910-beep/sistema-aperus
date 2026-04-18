import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

/**
 * Dialog para envio de Carta de Correção Eletrônica (CC-e) de NFe
 * 
 * Props:
 *   - open: boolean - se o diálogo está aberto
 *   - onClose: function - callback ao fechar
 *   - venda: object - objeto da venda com NFe autorizada
 */
export default function CartaCorrecaoDialog({ open, onClose, venda }) {
  const { axiosInstance } = useAuth();
  const [textoCorrecao, setTextoCorrecao] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [historico, setHistorico] = useState([]);
  const [podeEnviarNova, setPodeEnviarNova] = useState(true);

  // Estado do diálogo de edição/reenvio
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCarta, setEditingCarta] = useState(null);
  const [editTexto, setEditTexto] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editErro, setEditErro] = useState('');

  // Detectar o ID da venda (pode ser id_venda ou id)
  const vendaId = venda?.id_venda || venda?.id;

  // Buscar histórico de CC-e ao abrir
  useEffect(() => {
    if (open && vendaId) {
      buscarHistorico();
    } else {
      // Limpar ao fechar
      setTextoCorrecao('');
      setErro('');
      setSucesso('');
    }
  }, [open, vendaId]);

  const buscarHistorico = async () => {
    if (!vendaId) {
      console.error('ID da venda não encontrado:', venda);
      return;
    }
    setLoadingHistorico(true);
    try {
      const response = await axiosInstance.get(
        `/vendas/${vendaId}/carta_correcao_nfe/`
      );
      if (response.data.sucesso) {
        setHistorico(response.data.cartas_correcao || []);
        setPodeEnviarNova(response.data.pode_enviar_nova !== false);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de CC-e:', error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleEnviar = async () => {
    setErro('');
    setSucesso('');

    // Validações
    if (!textoCorrecao.trim()) {
      setErro('Digite o texto da correção.');
      return;
    }

    if (textoCorrecao.trim().length < 15) {
      setErro('O texto da correção deve ter no mínimo 15 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post(
        `/vendas/${vendaId}/carta_correcao_nfe/`,
        {
          texto_correcao: textoCorrecao.trim(),
        }
      );

      if (response.data.sucesso) {
        setSucesso(response.data.mensagem || 'Carta de Correção enviada com sucesso!');
        setTextoCorrecao('');
        // Recarregar histórico
        await buscarHistorico();
      } else {
        console.error('CC-e falhou:', response.data);
        setErro(response.data.mensagem || 'Erro ao enviar Carta de Correção.');
      }
    } catch (error) {
      console.error('Erro ao enviar CC-e:', error);
      console.error('Detalhes do erro:', error.response?.data);
      
      let mensagemErro = '';
      
      if (error.response?.data) {
        // Construir mensagem de erro detalhada
        const status = error.response.status;
        const data = error.response.data;
        
        mensagemErro = `ERRO HTTP ${status}\n\n`;
        
        if (data.mensagem) {
          mensagemErro += `Mensagem: ${data.mensagem}\n\n`;
        }
        if (data.error) {
          mensagemErro += `Erro: ${data.error}\n\n`;
        }
        if (data.detail) {
          mensagemErro += `Detalhe: ${data.detail}\n\n`;
        }
        
        // Se não há campos específicos, mostrar tudo como JSON
        if (!data.mensagem && !data.error && !data.detail) {
          mensagemErro += `Resposta: ${JSON.stringify(data, null, 2)}`;
        }
      } else if (error.message) {
        mensagemErro = `Erro de conexão: ${error.message}\n\nVerifique se o servidor Django está rodando.`;
      } else {
        mensagemErro = 'Erro desconhecido ao enviar Carta de Correção.';
      }
      
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarAbrir = (carta) => {
    setEditingCarta(carta);
    setEditTexto(carta.texto_correcao || '');
    setEditErro('');
    setEditDialogOpen(true);
  };

  const handleEditarEnviar = async () => {
    setEditErro('');
    if (!editTexto.trim()) {
      setEditErro('Digite o texto da correção.');
      return;
    }
    if (editTexto.trim().length < 15) {
      setEditErro('O texto deve ter no mínimo 15 caracteres.');
      return;
    }
    setEditLoading(true);
    try {
      const response = await axiosInstance.post(
        `/vendas/${vendaId}/carta_correcao_nfe/`,
        { texto_correcao: editTexto.trim() }
      );
      if (response.data.sucesso) {
        setEditDialogOpen(false);
        setSucesso(response.data.mensagem || 'Carta de Correção reenviada com sucesso!');
        await buscarHistorico();
      } else {
        setEditErro(response.data.mensagem || 'Erro ao reenviar Carta de Correção.');
      }
    } catch (error) {
      const data = error.response?.data;
      setEditErro(
        data?.mensagem || data?.error || data?.detail ||
        `Erro HTTP ${error.response?.status || ''}`
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleDownloadXML = async (carta) => {
    try {
      const response = await axiosInstance.get(
        `/vendas/${vendaId}/carta_correcao_nfe/${carta.id_carta_correcao}/xml/`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/xml' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `CCe_${vendaId}_seq${carta.numero_sequencial}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const msg = error.response?.data?.erro || 'XML não disponível para esta carta de correção.';
      setErro(msg);
    }
  };

  const handleExcluir = async (carta) => {
    if (!window.confirm(`Deseja excluir a CC-e #${carta.numero_sequencial} (${carta.status})?`)) return;
    try {
      await axiosInstance.delete(
        `/vendas/${vendaId}/carta_correcao_nfe/${carta.id_carta_correcao}/excluir/`
      );
      await buscarHistorico();
    } catch (error) {
      const msg = error.response?.data?.erro || 'Erro ao excluir carta de correção.';
      setErro(msg);
    }
  };

  const handleImprimir = async (carta) => {
    try {
      const response = await axiosInstance.get(
        `/vendas/${vendaId}/carta_correcao_nfe/${carta.id_carta_correcao}/imprimir/`,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'text/html; charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, '_blank', 'width=900,height=700,scrollbars=yes');
      // Revogar URL após a janela carregar
      if (win) {
        win.addEventListener('load', () => window.URL.revokeObjectURL(url));
      }
    } catch (error) {
      setErro('Não foi possível abrir a impressão da CC-e.');
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      PENDENTE: { label: 'Pendente', color: 'default' },
      REGISTRADO: { label: 'Registrado', color: 'success' },
      REJEITADO: { label: 'Rejeitado', color: 'error' },
      ERRO: { label: 'Erro', color: 'error' },
    };

    const config = statusMap[status] || { label: status, color: 'default' };

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.color === 'success' ? <CheckIcon /> : config.color === 'error' ? <ErrorIcon /> : undefined}
      />
    );
  };

  if (!venda) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SendIcon />
          Carta de Correção Eletrônica (CC-e)
        </Box>
        <Typography variant="caption" color="textSecondary">
          NFe: {venda.numero_nfe || venda.id_venda} | Chave: {venda.chave_nfe?.substring(0, 10)}...
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Alertas */}
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        {sucesso && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSucesso('')}>
            {sucesso}
          </Alert>
        )}

        {/* Informações importantes */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>A Carta de Correção (CC-e) pode ser usada para corrigir:</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
            <li>Erros de digitação em campos de texto</li>
            <li>Dados do destinatário (endereço,  contato)</li>
            <li>Informações complementares</li>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>NÃO pode corrigir:</strong> valores, impostos, produtos, quantidades ou CNPJ/CPF.
          </Typography>
        </Alert>

        {/* Formulário de nova CC-e */}
        {podeEnviarNova ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Nova Carta de Correção
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Texto da Correção"
              placeholder="Descreva a correção a ser realizada (mínimo 15 caracteres)..."
              value={textoCorrecao}
              onChange={(e) => setTextoCorrecao(e.target.value)}
              helperText={`${textoCorrecao.length} caracteres (mínimo: 15)`}
              disabled={loading}
            />
          </Box>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta NFe já atingiu o limite máximo de 20 Cartas de Correção permitidas pela SEFAZ.
          </Alert>
        )}

        {/* Histórico de CC-e */}
        {historico.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <HistoryIcon fontSize="small" />
              <Typography variant="subtitle2">
                Histórico de Correções ({historico.length})
              </Typography>
            </Box>

            {loadingHistorico ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <List dense>
                {historico.map((carta, index) => (
                  <ListItem
                    key={carta.id_carta_correcao}
                    divider={index < historico.length - 1}
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      bgcolor: index === 0 ? 'action.hover' : 'transparent',
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
                      <Typography variant="body2" fontWeight="bold">
                        CC-e #{carta.numero_sequencial}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {getStatusChip(carta.status)}
                        {carta.status === 'REGISTRADO' && (
                          <>
                            <Tooltip title="Imprimir CC-e">
                              <IconButton size="small" onClick={() => handleImprimir(carta)}>
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download XML">
                              <IconButton size="small" onClick={() => handleDownloadXML(carta)}>
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {(carta.status === 'REJEITADO' || carta.status === 'ERRO') && (
                          <>
                            <Tooltip title="Editar e Reenviar">
                              <IconButton size="small" color="primary" onClick={() => handleEditarAbrir(carta)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <IconButton size="small" color="error" onClick={() => handleExcluir(carta)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {carta.texto_correcao}
                    </Typography>

                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Typography variant="caption" color="text.secondary">
                        Enviada em: {new Date(carta.data_envio).toLocaleString('pt-BR')}
                      </Typography>
                      {carta.usuario_nome && (
                        <Typography variant="caption" color="text.secondary">
                          Por: {carta.usuario_nome}
                        </Typography>
                      )}
                      {carta.protocolo && (
                        <Typography variant="caption" color="text.secondary">
                          Protocolo: {carta.protocolo}
                        </Typography>
                      )}
                    </Box>

                    {carta.mensagem_retorno && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                        {carta.mensagem_retorno}
                      </Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Fechar
        </Button>
        {podeEnviarNova && (
          <Button
            onClick={handleEnviar}
            variant="contained"
            color="primary"
            disabled={loading || !textoCorrecao.trim() || textoCorrecao.trim().length < 15}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {loading ? 'Enviando...' : 'Enviar CC-e'}
          </Button>
        )}
      </DialogActions>

      {/* Diálogo de edição/reenvio */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon />
            Editar e Reenviar CC-e #{editingCarta?.numero_sequencial}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {editErro && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEditErro('')}>
              {editErro}
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Texto da Correção"
            value={editTexto}
            onChange={(e) => setEditTexto(e.target.value)}
            helperText={`${editTexto.length} caracteres (mínimo: 15)`}
            disabled={editLoading}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={editLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleEditarEnviar}
            variant="contained"
            color="primary"
            disabled={editLoading || editTexto.trim().length < 15}
            startIcon={editLoading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {editLoading ? 'Enviando...' : 'Reenviar CC-e'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
