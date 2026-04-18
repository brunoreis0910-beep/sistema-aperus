import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Container,
} from '@mui/material';
import {
  Agriculture,
  Handshake, // Verify availability or use alternative
  Scale, // Verify availability
  Grass
} from '@mui/icons-material';

const AgroPage = () => {
  const navigate = useNavigate();

  const menuItems = [
    { 
      title: 'Gestão de Safras',
      subtitle: 'Cadastre e gerencie períodos de safras',
      icon: <Grass sx={{ fontSize: 60, color: '#2e7d32' }} />,
      path: '/agro/safras',
      color: '#f1f8e9' 
    },
    { 
      title: 'Contratos / Barter',
      subtitle: 'Contratos de troca e compra futura / fixação',
      icon: <Handshake sx={{ fontSize: 60, color: '#f57f17' }} />,
      path: '/agro/contratos',
      color: '#fff8e1'
    },
    { 
      title: 'Conversão de Unidades',
      subtitle: 'Tabela de conversão (Saca x Kg x Ton)',
      icon: <Scale sx={{ fontSize: 60, color: '#0288d1' }} />,
      path: '/agro/conversoes',
      color: '#e1f5fe'
    },
    { 
      title: 'Gestão Operacional',
      subtitle: 'Talhões, Despesas, Mão de Obra e Maquinário',
      icon: <Agriculture sx={{ fontSize: 60, color: '#b71c1c' }} />,
      path: '/agro/operacional',
      color: '#fce4ec'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#2e7d32' }}>
        <Agriculture fontSize="large" /> Módulo Agro
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {menuItems.map((item, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                bgcolor: item.color,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
              }}
            >
              <CardActionArea 
                onClick={() => navigate(item.path)}
                sx={{ height: '100%', p: 2, textAlign: 'center' }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>{item.icon}</Box>
                  <Typography variant="h5" component="div" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.subtitle}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AgroPage;
