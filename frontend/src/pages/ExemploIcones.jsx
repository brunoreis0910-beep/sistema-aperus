/**
 * Exemplo de Uso de Ícones Padronizados
 * 
 * Demonstra como usar o sistema de ícones do projeto
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import AppIcon, { AppIconWithText, AppIconGroup } from '../components/common/AppIcon';
import { iconsByCategory, getAvailableIcons } from '../config/iconMapping';

function ExemploIcones() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Exemplos de Ícones Padronizados
      </Typography>

      {/* Exemplo 1: Tamanhos */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          1. Tamanhos de Ícones
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ textAlign: 'center' }}>
            <AppIcon name="venda" size="small" />
            <Typography variant="caption" display="block">Small (20px)</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <AppIcon name="venda" size="medium" />
            <Typography variant="caption" display="block">Medium (24px)</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <AppIcon name="venda" size="large" />
            <Typography variant="caption" display="block">Large (32px)</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <AppIcon name="venda" size="xlarge" />
            <Typography variant="caption" display="block">XLarge (48px)</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <AppIcon name="venda" size="xxlarge" />
            <Typography variant="caption" display="block">XXLarge (64px)</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Exemplo 2: Cores */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          2. Cores dos Ícones
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ textAlign: 'center' }}>
            <AppIcon name="cliente" size="large" color="primary" />
            <Typography variant="caption" display="block">Primary</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <AppIcon name="cliente" size="large" color="secondary" />
            <Typography variant="caption" display="block">Secondary</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <AppIcon name="cliente" size="large" color="success" />
            <Typography variant="caption" display="block">Success</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <AppIcon name="cliente" size="large" color="error" />
            <Typography variant="caption" display="block">Error</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <AppIcon name="cliente" size="large" color="warning" />
            <Typography variant="caption" display="block">Warning</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <AppIcon name="cliente" size="large" color="info" />
            <Typography variant="caption" display="block">Info</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Exemplo 3: Ícones com Texto */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          3. Ícones com Texto
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <AppIconWithText iconName="venda" text="Vendas" iconColor="primary" />
          <AppIconWithText iconName="cliente" text="Clientes" iconColor="secondary" />
          <AppIconWithText iconName="produto" text="Produtos" iconColor="success" iconPosition="right" />
          <AppIconWithText iconName="financeiro" text="Financeiro" iconColor="warning" iconSize="large" />
        </Box>
      </Paper>

      {/* Exemplo 4: Em Botões */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          4. Ícones em Botões
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AppIcon name="salvar" />}
          >
            Salvar
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<AppIcon name="excluir" />}
          >
            Excluir
          </Button>
          <Button
            variant="outlined"
            startIcon={<AppIcon name="imprimir" />}
          >
            Imprimir
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={<AppIcon name="whatsapp" />}
          >
            WhatsApp
          </Button>
        </Box>
      </Paper>

      {/* Exemplo 5: Em Listas */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          5. Ícones em Listas
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <AppIcon name="home" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Página Inicial" secondary="Dashboard principal" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AppIcon name="venda" color="success" />
            </ListItemIcon>
            <ListItemText primary="Vendas" secondary="Gerenciar vendas" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <AppIcon name="cliente" color="info" />
            </ListItemIcon>
            <ListItemText primary="Clientes" secondary="Cadastro de clientes" />
          </ListItem>
        </List>
      </Paper>

      {/* Exemplo 6: Galeria de Ícones por Categoria */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          6. Galeria de Ícones Disponíveis
        </Typography>

        {Object.entries(iconsByCategory).map(([categoria, icones]) => (
          <Box key={categoria} sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {icones.map(iconName => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={iconName}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 3,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <AppIcon name={iconName} size="large" color="primary" />
                    <Typography variant="caption" display="block" mt={1}>
                      {iconName}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Paper>

      {/* Exemplo 7: Código de Uso */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.100' }}>
        <Typography variant="h6" gutterBottom>
          📝 Como Usar no Seu Componente
        </Typography>
        <Typography variant="body2" component="pre" sx={{
          fontFamily: 'monospace',
          bgcolor: 'white',
          p: 2,
          borderRadius: 1,
          overflow: 'auto'
        }}>
          {`import AppIcon from '../components/common/AppIcon';

// Ícone simples
<AppIcon name="venda" />

// Ícone colorido e grande
<AppIcon name="cliente" size="large" color="primary" />

// Ícone em botão
<Button startIcon={<AppIcon name="salvar" />}>
  Salvar
</Button>

// Com texto
import { AppIconWithText } from '../components/common/AppIcon';
<AppIconWithText iconName="venda" text="Vendas" />`}
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          🎯 Ícones Disponíveis (Total: {getAvailableIcons().length})
        </Typography>
        <Typography variant="body2" component="div" sx={{
          fontFamily: 'monospace',
          bgcolor: 'white',
          p: 2,
          borderRadius: 1,
          overflow: 'auto',
          maxHeight: 200
        }}>
          {getAvailableIcons().sort().map((icon, index) => (
            <span key={icon}>
              {icon}
              {index < getAvailableIcons().length - 1 ? ', ' : ''}
            </span>
          ))}
        </Typography>
      </Paper>
    </Box>
  );
}

export default ExemploIcones;
