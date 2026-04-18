// Em: frontend/src/components/AlertaPromoVenda.jsx

import React from 'react';
import {
  Alert,
  Box,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import {
  LocalOffer as PromoIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

/**
 * Componente de alerta para mostrar promoções aplicadas na venda
 * 
 * Props:
 * - resultado: objeto com itens_com_desconto, itens_sem_desconto, valores totais
 * - onDismiss: função chamada ao fechar o alerta
 */
const AlertaPromoVenda = ({ resultado, onDismiss }) => {
  const [open, setOpen] = React.useState(true);

  if (!resultado || resultado.itens_com_desconto.length === 0) {
    return null;
  }

  const handleClose = () => {
    setOpen(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  return (
    <Collapse in={open} sx={{ mb: 2 }}>
      <Paper
        sx={{
          backgroundColor: '#e8f5e9',
          border: '2px solid #4caf50',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            backgroundColor: '#4caf50',
            color: 'white',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PromoIcon fontSize="large" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              ✓ PRODUTO(S) EM PROMOÇÃO!
            </Typography>
          </Box>
          <Button
            size="small"
            color="inherit"
            onClick={handleClose}
            startIcon={<CloseIcon />}
          >
            Fechar
          </Button>
        </Box>

        {/* Conteúdo */}
        <Box sx={{ p: 2 }}>
          {/* Alerta */}
          <Alert severity="success" sx={{ mb: 2 }}>
            {resultado.alerta || 'Desconto será aplicado automaticamente no checkout!'}
          </Alert>

          {/* Tabela de Descontos */}
          {resultado.itens_com_desconto.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                <CheckIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#4caf50' }} />
                Itens com Desconto:
              </Typography>

              <List sx={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
                {resultado.itens_com_desconto.map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: index < resultado.itens_com_desconto.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <ListItemText
                        primary={`Produto #${item.id_produto}`}
                        secondary={`Promoção: ${item.promocao}`}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                        <Typography variant="body2" color="textSecondary">
                          <s>{formatarMoeda(item.valor_original)}</s>
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                          {formatarMoeda(item.valor_final)}
                        </Typography>
                      </Box>

                      <Chip
                        label={`-${item.percentual_aplicado.toFixed(1)}%`}
                        color="success"
                        size="small"
                        sx={{ minWidth: 60, fontWeight: 'bold' }}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Resumo de Valores */}
          <Paper
            sx={{
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              mt: 2,
            }}
          >
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography color="textSecondary">Valor Original:</Typography>
                <Typography variant="body1">
                  {formatarMoeda(resultado.valor_total_original)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography color="textSecondary">Total Desconto:</Typography>
                <Typography
                  variant="body1"
                  sx={{ color: '#4caf50', fontWeight: 'bold' }}
                >
                  -{formatarMoeda(resultado.valor_total_desconto)}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ borderTop: '2px solid #1976d2', pt: 1 }}>
                  <Typography color="textSecondary">Valor Final:</Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: '#1976d2', fontWeight: 'bold' }}
                  >
                    {formatarMoeda(resultado.valor_total_final)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Dias Restantes */}
          {resultado.itens_com_desconto.some(item => item.dias_restantes !== undefined) && (
            <Box sx={{ mt: 2, p: 1, backgroundColor: '#fff3e0', borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary">
                ⏰ Promoção válida por{' '}
                <strong>
                  {Math.max(...resultado.itens_com_desconto.map(i => i.dias_restantes || 0))} dias
                </strong>
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Collapse>
  );
};

export default AlertaPromoVenda;
