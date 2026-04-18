import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Card,
  CardContent, Typography, Alert, FormControl, InputLabel, Select, MenuItem, Divider
} from '@mui/material';
import { PeopleAlt as PessoasIcon } from '@mui/icons-material';

const UnirMesasDialog = ({
  open,
  onClose,
  comandaSelecionada,
  mesas,
  comandas,
  mesasSelecionadasUnir,
  toggleMesaSelecao,
  mesaDestinoUniao,
  setMesaDestinoUniao,
  handleUnirMesas,
  loading
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>Unir Mesas - Comanda {comandaSelecionada?.numero}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Mesa Principal: <strong>Mesa {mesas.find(m => m.id === comandaSelecionada?.mesa)?.numero}</strong>
          </Typography>
          <Typography variant="body2">
            Total Atual: <strong>R$ {parseFloat(comandaSelecionada?.total || 0).toFixed(2)}</strong>
          </Typography>
        </Alert>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Selecione as mesas para unir:
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {mesas
            .filter(m => 
              m.status === 'Ocupada' && 
              m.id !== comandaSelecionada?.mesa &&
              comandas.some(c => c.mesa === m.id && c.status === 'Aberta')
            )
            .map((mesa) => {
              const comandaMesa = comandas.find(c => c.mesa === mesa.id && c.status === 'Aberta');
              const isSelected = mesasSelecionadasUnir.includes(mesa.id);
              
              return (
                <Grid item xs={6} sm={4} md={3} key={mesa.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      bgcolor: isSelected ? '#1976d2' : '#f5f5f5',
                      color: isSelected ? 'white' : 'inherit',
                      border: isSelected ? '2px solid #1565c0' : '2px solid transparent',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => toggleMesaSelecao(mesa.id)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h5" fontWeight="bold">
                        Mesa {mesa.numero}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Comanda: {comandaMesa?.numero}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                        R$ {parseFloat(comandaMesa?.total || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {comandaMesa?.itens?.length || 0} itens
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
        </Grid>

        {mesasSelecionadasUnir.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Mesa de destino (opcional):
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Mesa Final</InputLabel>
              <Select
                value={mesaDestinoUniao || ''}
                onChange={(e) => setMesaDestinoUniao(e.target.value)}
                label="Mesa Final"
              >
                <MenuItem value="">
                  <em>Manter na mesa principal ({mesas.find(m => m.id === comandaSelecionada?.mesa)?.numero})</em>
                </MenuItem>
                {mesas
                  .filter(m => 
                    m.id === comandaSelecionada?.mesa || 
                    mesasSelecionadasUnir.includes(m.id)
                  )
                  .map(m => (
                    <MenuItem key={m.id} value={m.id}>
                      Mesa {m.numero}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>{mesasSelecionadasUnir.length}</strong> mesa(s) selecionada(s)
              </Typography>
              <Typography variant="body2">
                Total estimado após união: <strong>R$ {(
                  parseFloat(comandaSelecionada?.total || 0) +
                  comandas
                    .filter(c => mesasSelecionadasUnir.includes(c.mesa) && c.status === 'Aberta')
                    .reduce((sum, c) => sum + parseFloat(c.total || 0), 0)
                ).toFixed(2)}</strong>
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleUnirMesas} 
          variant="contained" 
          color="primary"
          disabled={loading || mesasSelecionadasUnir.length === 0}
          startIcon={<PessoasIcon />}
        >
          Unir Mesas
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnirMesasDialog;
