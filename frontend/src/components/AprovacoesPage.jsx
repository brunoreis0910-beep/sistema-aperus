import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import BotaoVoltarInicio from './BotaoVoltarInicio';

const AprovacoesPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Autorização
        </Typography>
        <BotaoVoltarInicio variant="buttons" />
      </Box>

      <Box>
        <Typography variant="body1">
          Página de Autorização em desenvolvimento...
        </Typography>
      </Box>

      {/* botão flutuante também disponível */}
      <BotaoVoltarInicio variant="fab" />
    </Container>
  );
};

export default AprovacoesPage;