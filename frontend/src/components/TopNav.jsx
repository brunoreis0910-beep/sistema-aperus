import React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { Link as RouterLink } from 'react-router-dom'
import { useMenuState } from '../context/MenuStateContext'

export default function TopNav() {
  const { menusDesabilitados } = useMenuState()

  const menuStyle = {
    pointerEvents: menusDesabilitados ? 'none' : 'auto',
    opacity: menusDesabilitados ? 0.5 : 1,
    transition: 'opacity 0.2s ease'
  }

  return (
    <AppBar position="static" sx={{ mb: 2 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          APERUS
        </Typography>
        <Button
          color="inherit"
          component={RouterLink}
          to="/"
          style={menuStyle}
        >
          Início
        </Button>
        <Button
          color="inherit"
          component={RouterLink}
          to="/clientes"
          style={menuStyle}
        >
          Clientes
        </Button>
        <Button
          color="inherit"
          component={RouterLink}
          to="/fornecedores"
          style={menuStyle}
        >
          Fornecedores
        </Button>
        <Button
          color="inherit"
          component={RouterLink}
          to="/produtos"
          style={menuStyle}
        >
          Produtos
        </Button>
        <Button
          color="inherit"
          component={RouterLink}
          to="/vendas"
          style={menuStyle}
        >
          Vendas
        </Button>
        <Button
          color="inherit"
          component={RouterLink}
          to="/compras"
          style={menuStyle}
        >
          Compras
        </Button>
        <Button
          color="inherit"
          component={RouterLink}
          to="/financeiro"
          style={menuStyle}
        >
          Financeiro
        </Button>
        <Button
          color="inherit"
          component={RouterLink}
          to="/aprovacoes"
          style={menuStyle}
        >
          Autorização
        </Button>
        <Button
          color="inherit"
          component={RouterLink}
          to="/configuracoes"
          style={menuStyle}
        >
          Configurações
        </Button>
      </Toolbar>
    </AppBar>
  )
}
