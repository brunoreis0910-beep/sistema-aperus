import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AcessoNegado = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        p: 4
      }}
    >
      <LockIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
        Acesso Negado
      </Typography>
      <Typography variant="body1" sx={{ color: '#666', mb: 3, maxWidth: 400 }}>
        Você não tem permissão para acessar esta página. 
        Entre em contato com o administrador para solicitar acesso.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/home')}
        sx={{ textTransform: 'none' }}
      >
        Voltar ao Início
      </Button>
    </Box>
  );
};

export default AcessoNegado;
