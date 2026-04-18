import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function CotacaoPageTest() {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    console.log('CotacaoPageTest carregada');
    console.log('location.state:', location.state);
  }, [location]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ✅ Página de Cotação Carregada!
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Se você vê esta mensagem, a navegação funcionou corretamente.
      </Typography>
      
      <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
        {JSON.stringify(location.state, null, 2)}
      </pre>

      <Button 
        variant="contained" 
        sx={{ mt: 2 }}
        onClick={() => navigate('/compras')}
      >
        ← Voltar para Compras
      </Button>
    </Box>
  );
}
