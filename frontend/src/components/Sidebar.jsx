import React, { useState, useEffect } from 'react'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Badge from '@mui/material/Badge'
import HomeIcon from '@mui/icons-material/Home'
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import DescriptionIcon from '@mui/icons-material/Description'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import GavelIcon from '@mui/icons-material/Gavel'
import AssignmentIcon from '@mui/icons-material/Assignment'
import SettingsIcon from '@mui/icons-material/Settings'
import BackupIcon from '@mui/icons-material/Backup'
import PetsIcon from '@mui/icons-material/Pets'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import AgricultureIcon from '@mui/icons-material/Agriculture'
import ReceiptIcon from '@mui/icons-material/Receipt'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import BadgeIcon from '@mui/icons-material/Badge'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const drawerWidth = 240

export default function Sidebar() {
  const { user, axiosInstance } = useAuth();
  const [pendentesCount, setPendentesCount] = useState(0);

  // Buscar quantidade de aprovações pendentes (apenas para supervisores/staff)
  useEffect(() => {
    const carregarPendentes = async () => {
      if (user && user.is_staff) {
        try {
          const response = await axiosInstance.get('/solicitacoes/pendentes/');
          setPendentesCount(response.data.length);
        } catch (error) {
          console.error('Erro ao carregar pendentes:', error);
        }
      }
    };

    carregarPendentes();
    // Atualiza a cada 30 segundos
    const interval = setInterval(carregarPendentes, 30000);
    return () => clearInterval(interval);
  }, [user, axiosInstance]);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <List>
        <ListItem button component={RouterLink} to="/clientes">
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Clientes" />
        </ListItem>
        <ListItem button component={RouterLink} to="/fornecedores">
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Fornecedores" />
        </ListItem>
        <ListItem button component={RouterLink} to="/produtos">
          <ListItemIcon><InventoryIcon /></ListItemIcon>
          <ListItemText primary="Produtos" />
        </ListItem>
        <ListItem button component={RouterLink} to="/cadastro-turbo">
          <ListItemIcon><FlashOnIcon color="warning" /></ListItemIcon>
          <ListItemText primary="Cadastro Turbo" secondary="< 5 seg" />
        </ListItem>
        <ListItem button component={RouterLink} to="/vendas">
          <ListItemIcon><ShoppingCartIcon /></ListItemIcon>
          <ListItemText primary="Vendas" />
        </ListItem>
        
        {/* Faturamento */}
        <ListItem button component={RouterLink} to="/faturamento">
          <ListItemIcon><RequestQuoteIcon /></ListItemIcon>
          <ListItemText primary="Faturamento" />
        </ListItem>
        
        {/* Documentos Fiscais - Link único para o Painel Geral */}
        <ListItem button component={RouterLink} to="/documentos-fiscais">
          <ListItemIcon><DescriptionIcon /></ListItemIcon>
          <ListItemText primary="Documentos Fiscais" />
        </ListItem>

        <ListItem button component={RouterLink} to="/compras">
          <ListItemIcon><ReceiptLongIcon /></ListItemIcon>
          <ListItemText primary="Compras" />
        </ListItem>
        <ListItem button component={RouterLink} to="/financeiro">
          <ListItemIcon><AccountBalanceIcon /></ListItemIcon>
          <ListItemText primary="Financeiro" />
        </ListItem>
        
        {/* PDV / Caixa */}
        <ListItem button component={RouterLink} to="/pdv-nfce">
          <ListItemIcon><PointOfSaleIcon /></ListItemIcon>
          <ListItemText primary="PDV / Caixa" />
        </ListItem>

        {/* Clínica Veterinária */}
        <ListItem button component={RouterLink} to="/clinica-veterinaria">
          <ListItemIcon><PetsIcon /></ListItemIcon>
          <ListItemText primary="Clínica Veterinária" />
        </ListItem>

        {/* Agro Operacional */}
        <ListItem button component={RouterLink} to="/agro/operacional">
          <ListItemIcon><AgricultureIcon /></ListItemIcon>
          <ListItemText primary="Agro Operacional" />
        </ListItem>

        {/* WhatsApp */}
        <ListItem button component={RouterLink} to="/whatsapp">
          <ListItemIcon><WhatsAppIcon /></ListItemIcon>
          <ListItemText primary="WhatsApp" />
        </ListItem>

        {/* Manifestação NF-e */}
        <ListItem button component={RouterLink} to="/manifestacao-destinatario">
          <ListItemIcon><ReceiptIcon /></ListItemIcon>
          <ListItemText primary="Manifestação NF-e" />
        </ListItem>
        
        {/* Aprovações - apenas para supervisores/staff */}
        {user && user.is_staff && (
          <ListItem button component={RouterLink} to="/aprovacoes">
            <ListItemIcon>
              <Badge badgeContent={pendentesCount} color="error">
                <GavelIcon />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Aprovações" />
          </ListItem>
        )}
        
        {/* Minhas Solicitações - para todos os usuários */}
        <ListItem button component={RouterLink} to="/minhas-solicitacoes">
          <ListItemIcon><AssignmentIcon /></ListItemIcon>
          <ListItemText primary="Minhas Solicitações" />
        </ListItem>
        
        {/* Novos módulos */}
        <ListItem button component={RouterLink} to="/crm">
          <ListItemIcon><PeopleAltIcon sx={{ color: '#1565C0' }} /></ListItemIcon>
          <ListItemText primary="CRM" secondary="Pipeline de Vendas" />
        </ListItem>
        <ListItem button component={RouterLink} to="/rh">
          <ListItemIcon><BadgeIcon sx={{ color: '#2E7D32' }} /></ListItemIcon>
          <ListItemText primary="Recursos Humanos" />
        </ListItem>
        <ListItem button component={RouterLink} to="/ponto">
          <ListItemIcon><AccessTimeIcon sx={{ color: '#1565C0' }} /></ListItemIcon>
          <ListItemText primary="Terminal de Ponto" />
        </ListItem>
        <ListItem button component={RouterLink} to="/pix">
          <ListItemIcon><QrCode2Icon sx={{ color: '#00897B' }} /></ListItemIcon>
          <ListItemText primary="Pix Dinâmico" />
        </ListItem>
        <ListItem button component={RouterLink} to="/recorrencia">
          <ListItemIcon><AutorenewIcon sx={{ color: '#6A1B9A' }} /></ListItemIcon>
          <ListItemText primary="Recorrência" />
        </ListItem>
        <ListItem button component={RouterLink} to="/churn">
          <ListItemIcon><TrendingDownIcon sx={{ color: '#C62828' }} /></ListItemIcon>
          <ListItemText primary="Análise de Churn" />
        </ListItem>

        <ListItem button component={RouterLink} to="/configuracoes">
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="Configurações" />
        </ListItem>
        <ListItem button component={RouterLink} to="/backup">
          <ListItemIcon><BackupIcon /></ListItemIcon>
          <ListItemText primary="Backup" />
        </ListItem>
      </List>
    </Drawer>
  )
}
