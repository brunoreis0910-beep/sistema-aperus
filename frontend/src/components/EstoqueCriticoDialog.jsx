import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  List, ListItem, Divider, IconButton, Chip, CircularProgress,
  Alert, Tooltip, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Button
} from '@mui/material';
import {
  Close as CloseIcon,
  Inventory as InventoryIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function EstoqueCriticoDialog({ open, onClose, onAbrirFornecedores }) {
  const { axiosInstance } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      buscarEstoqueCritico();
    }
  }, [open]);

  const buscarEstoqueCritico = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/notificacoes/estoque-critico/');
      setProdutos(response.data);
    } catch (err) {
      console.error('Erro ao buscar estoque crítico:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getCorEstoque = (atual, minimo) => {
    if (atual <= 0) return 'error';
    if (atual <= minimo * 0.5) return 'error';
    return 'warning';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon sx={{ color: '#ff9800' }} />
          <Typography variant="h6">Estoque Crítico</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {onAbrirFornecedores && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<StoreIcon />}
              onClick={() => { onClose(); onAbrirFornecedores(); }}
            >
              Ver Fornecedores
            </Button>
          )}
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!loading && !error && produtos.length === 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✅ Todos os produtos estão com estoque dentro do normal!
          </Alert>
        )}

        {!loading && !error && produtos.length > 0 && (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ <strong>{produtos.length} produto(s)</strong> com estoque crítico.
              Verifique a sugestão de compra baseada na média de vendas dos últimos 90 dias.
            </Alert>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><strong>Produto</strong></TableCell>
                    <TableCell align="center"><strong>Estoque</strong></TableCell>
                    <TableCell align="center"><strong>Mínimo</strong></TableCell>
                    <TableCell align="center"><strong>Vend. 30d</strong></TableCell>
                    <TableCell align="center"><strong>Média/Mês</strong></TableCell>
                    <TableCell align="center"><strong>Sug. Compra</strong></TableCell>
                    <TableCell><strong>Fornecedor</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {produtos.map((prod) => (
                    <TableRow key={prod.id_produto} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {prod.nome_produto}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cód: {prod.codigo_produto} {prod.deposito && `| ${prod.deposito}`}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={prod.estoque_atual}
                          color={getCorEstoque(prod.estoque_atual, prod.estoque_minimo)}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell align="center">{prod.estoque_minimo}</TableCell>
                      <TableCell align="center">{prod.vendas_30_dias}</TableCell>
                      <TableCell align="center">{prod.media_mensal}</TableCell>
                      <TableCell align="center">
                        {prod.sugestao_compra > 0 ? (
                          <Chip label={prod.sugestao_compra} color="primary" size="small" variant="outlined" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {prod.fornecedor ? (
                          <Tooltip title={`${prod.fornecedor.email || 'Sem email'} | ${prod.fornecedor.whatsapp || prod.fornecedor.telefone || 'Sem telefone'}`}>
                            <Typography variant="body2" sx={{ cursor: 'pointer', textDecoration: 'underline dotted' }}>
                              {prod.fornecedor.nome}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">Sem fornecedor</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
