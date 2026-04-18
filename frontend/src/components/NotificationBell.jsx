import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import InventoryIcon from '@mui/icons-material/Inventory';
import InfoIcon from '@mui/icons-material/Info';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CakeIcon from '@mui/icons-material/Cake';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CashbacksVencendoDialog from './CashbacksVencendoDialog';
import InadimplenciaDialog from './InadimplenciaDialog';
import EstoqueCriticoDialog from './EstoqueCriticoDialog';
import FornecedoresCotacaoDialog from './FornecedoresCotacaoDialog';

const iconMap = {
  MoneyOff: <MoneyOffIcon color="error" />,
  EventBusy: <EventBusyIcon color="warning" />,
  Inventory: <InventoryIcon color="info" />,
  LocalOffer: <LocalOfferIcon color="success" />,
  Cake: <CakeIcon color="secondary" />
};

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificacoes, setNotificacoes] = useState([]);
  const [cashbackDialogOpen, setCashbackDialogOpen] = useState(false);
  const [inadimplenciaDialogOpen, setInadimplenciaDialogOpen] = useState(false);
  const [estoqueCriticoDialogOpen, setEstoqueCriticoDialogOpen] = useState(false);
  const [fornecedoresDialogOpen, setFornecedoresDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { axiosInstance } = useAuth();

  console.log('🔔 NotificationBell renderizado!');

  useEffect(() => {
    console.log('🔔 Buscando notificações...');
    axiosInstance.get('/notificacoes/')
      .then(res => {
        console.log('✅ Notificações recebidas:', res.data);
        if (Array.isArray(res.data)) {
          setNotificacoes(res.data);
        } else {
            console.error('❌ Resposta de notificações não é um array:', res.data);
            setNotificacoes([]);
        }
      })
      .catch(err => {
        console.error("❌ Erro ao buscar notificações", err);
        setNotificacoes([]);
      });
  }, [axiosInstance]);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNotificacaoClick = (notificacao) => {
    handleClose();
    
    // Se for notificação de cashback, abre o dialog especial
    if (notificacao.icon === 'LocalOffer' || notificacao.title === 'Cashback Vencendo') {
      setCashbackDialogOpen(true);
    } else if (notificacao.icon === 'MoneyOff' || notificacao.title?.includes('Inadimpl')) {
      setInadimplenciaDialogOpen(true);
    } else if (notificacao.icon === 'Inventory' || notificacao.title?.includes('Estoque')) {
      setEstoqueCriticoDialogOpen(true);
    } else if (notificacao.link) {
      // Outras notificações navegam normalmente
      navigate(notificacao.link);
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick} sx={{ ml: 1, mr: 1 }}>
        <Badge badgeContent={notificacoes.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: { maxHeight: 400, width: '360px' },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Avisos do Sistema</Typography>
        </Box>
        <Divider />
        
        {(!Array.isArray(notificacoes) || notificacoes.length === 0) ? (
          <MenuItem disabled>
            <ListItemText primary="Oba! Tudo sob controle." />
          </MenuItem>
        ) : (
          notificacoes.map((notif) => (
            <MenuItem key={notif.id} onClick={() => handleNotificacaoClick(notif)} sx={{ whiteSpace: 'normal', py: 1.5 }}>
              <ListItemIcon>
                {iconMap[notif.icon] || <InfoIcon />}
              </ListItemIcon>
              <ListItemText 
                primary={notif.title} 
                secondary={notif.message} 
                primaryTypographyProps={{ fontWeight: 'bold' }}
              />
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Dialog de Cashbacks Vencendo */}
      <CashbacksVencendoDialog 
        open={cashbackDialogOpen}
        onClose={() => setCashbackDialogOpen(false)}
      />

      {/* Dialog de Inadimplência */}
      <InadimplenciaDialog
        open={inadimplenciaDialogOpen}
        onClose={() => setInadimplenciaDialogOpen(false)}
      />

      {/* Dialog de Estoque Crítico */}
      <EstoqueCriticoDialog
        open={estoqueCriticoDialogOpen}
        onClose={() => setEstoqueCriticoDialogOpen(false)}
        onAbrirFornecedores={() => setFornecedoresDialogOpen(true)}
      />

      {/* Dialog de Fornecedores para Cotação */}
      <FornecedoresCotacaoDialog
        open={fornecedoresDialogOpen}
        onClose={() => setFornecedoresDialogOpen(false)}
      />
    </>
  );
}
