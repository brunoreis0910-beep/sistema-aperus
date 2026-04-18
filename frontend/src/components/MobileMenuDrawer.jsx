import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';

const MobileMenuDrawer = ({ open, onClose, menuItems, currentTab, subMenuItems = {} }) => {
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleSubmenu = (key) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavigation = (item) => {
    if (item.hasSubmenu) {
      toggleSubmenu(item.key);
      return;
    }
    if (item.path) {
      if (item.isExternal) {
        window.location.href = item.path;
      } else {
        navigate(item.path);
        onClose();
      }
    }
  };

  const handleSubItemClick = (subItem) => {
    if (subItem.isExternal) {
      window.location.href = subItem.path;
    } else {
      navigate(subItem.path);
      onClose();
    }
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { 
          width: 300,
          background: '#1976d2'
        }
      }}
    >
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
          Menu
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#ffffff' }}>
          <CloseIcon sx={{ fontSize: '1.8rem' }} />
        </IconButton>
      </Box>
      <List sx={{ p: 1.5, overflow: 'auto' }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.key}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item)}
                selected={item.key === currentTab}
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  px: 2,
                  backgroundColor: 'transparent',
                  color: 'rgba(255, 255, 255, 0.85)',
                  transition: 'all 0.3s ease',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                    '& .MuiListItemIcon-root': {
                      color: '#ffffff'
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 50 }}>
                  {React.cloneElement(item.icon, { sx: { fontSize: '2.2rem' } })}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: item.key === currentTab ? 700 : 500,
                    fontSize: '1.15rem'
                  }}
                />
                {item.hasSubmenu && (
                  expandedMenus[item.key] ? 
                    <ExpandLess sx={{ color: 'rgba(255,255,255,0.7)' }} /> : 
                    <ExpandMore sx={{ color: 'rgba(255,255,255,0.7)' }} />
                )}
              </ListItemButton>
            </ListItem>

            {/* Sub-itens expansíveis */}
            {item.hasSubmenu && subMenuItems[item.key] && (
              <Collapse in={expandedMenus[item.key]} timeout="auto" unmountOnExit>
                <List disablePadding sx={{ pl: 2 }}>
                  {subMenuItems[item.key].map((subItem, idx) => (
                    <ListItem key={idx} disablePadding sx={{ mb: 0.3 }}>
                      <ListItemButton
                        onClick={() => handleSubItemClick(subItem)}
                        sx={{
                          borderRadius: '10px',
                          py: 1,
                          px: 2,
                          color: 'rgba(255, 255, 255, 0.75)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            color: '#ffffff',
                          }
                        }}
                      >
                        {subItem.icon && (
                          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                            {subItem.icon}
                          </ListItemIcon>
                        )}
                        <ListItemText
                          primary={subItem.label}
                          primaryTypographyProps={{ fontSize: '0.95rem' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </Drawer>
  );
};

export default MobileMenuDrawer;
