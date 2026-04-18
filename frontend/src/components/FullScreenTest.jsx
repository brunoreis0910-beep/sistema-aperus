import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Chip
} from '@mui/material';
import { useScreenSize } from '../hooks/useScreenSize';

const FullScreenTest = () => {
  const screenSize = useScreenSize();

  const addDebugBorders = () => {
    document.body.classList.toggle('debug-borders');
  };

  return (
    <Box sx={{
      width: '100%',
      height: '100vh',
      p: 2,
      bgcolor: 'background.default'
    }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6">🖥️ Teste de Otimização de Tela Inteira</Typography>
        <Typography>
          resolução: {screenSize.width} × {screenSize.height} |
          Ratio: {screenSize.ratio.toFixed(2)}:1 |
          Tipo: {screenSize.isSuperWide ? 'Super Ultra-Wide' :
            screenSize.isUltraWide ? 'Ultra-Wide' : 'Standard'}
        </Typography>
      </Alert>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={addDebugBorders}>
          Toggle Debug Borders
        </Button>
        <Chip
          label={`ViewportWidth: ${window.innerWidth}px`}
          color="primary"
        />
        <Chip
          label={`BodyWidth: ${document.body.clientWidth}px`}
          color="secondary"
        />
      </Box>

      <Grid container spacing={2}>
        {/* Cards de teste */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
          <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={num}>
            <Card>
              <CardContent>
                <Typography variant="h6">Card {num}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Teste de largura e responsividade
                </Typography>
                <Typography variant="caption" display="block">
                  Width: {screenSize.width}px
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informações de Debug
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2">
              <strong>window.innerWidth:</strong> {window.innerWidth}px<br />
              <strong>window.innerHeight:</strong> {window.innerHeight}px<br />
              <strong>document.body.clientWidth:</strong> {document.body.clientWidth}px<br />
              <strong>document.documentElement.clientWidth:</strong> {document.documentElement.clientWidth}px
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2">
              <strong>Screen Type:</strong> {screenSize.isSuperWide ? 'Super Ultra-Wide (5120px+)' :
                screenSize.isUltraWide ? 'Ultra-Wide (3440px+)' : 'Standard'}<br />
              <strong>Ratio:</strong> {screenSize.ratio.toFixed(3)}:1<br />
              <strong>Ultra-Wide:</strong> {screenSize.isUltraWide ? '✅' : '❌'}<br />
              <strong>Super Wide:</strong> {screenSize.isSuperWide ? '✅' : '❌'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default FullScreenTest;