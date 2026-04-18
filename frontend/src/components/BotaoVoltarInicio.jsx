import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Fab } from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';

const BotaoVoltarInicio = ({ variant = 'button', size = 'medium', sx = {} }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // não mostrar na página inicial
  if (location.pathname === '/' || location.pathname === '/home') {
    return null;
  }

  const handleVoltarInicio = () => {
    navigate('/');
  };

  const handleVoltarPagina = () => {
    navigate(-1);
  };

  if (variant === 'fab') {
    return (
      <Fab
        color="primary"
        size={size}
        onClick={handleVoltarInicio}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          ...sx
        }}
        title="Voltar ao início"
      >
        <Home />
      </Fab>
    );
  }

  if (variant === 'buttons') {
    return (
      <div style={{ display: 'flex', gap: '8px', ...sx }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handleVoltarPagina}
          size={size}
        >
          Voltar
        </Button>
        <Button
          variant="contained"
          startIcon={<Home />}
          onClick={handleVoltarInicio}
          size={size}
        >
          Início
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="contained"
      startIcon={<Home />}
      onClick={handleVoltarInicio}
      size={size}
      sx={sx}
    >
      Início
    </Button>
  );
};

export default BotaoVoltarInicio;