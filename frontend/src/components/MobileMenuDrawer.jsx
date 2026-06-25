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

const MobileMenuDrawer = ({ open, onClose, menuItems, currentTab, subMenuItems = {}, isModuleLocked, onLockClick }) => {
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
    if (isModuleLocked && isModuleLocked(item.key)) {
      if (onLockClick) onLockClick(item.key);
      onClose();
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
    if (isModuleLocked && isModuleLocked(subItem.path)) {
      if (onLockClick) onLockClick(subItem.path);
      onClose();
      return;
    }
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
        {menuItems.map((item) => {
          const isItemLocked = isModuleLocked && isModuleLocked(item.key);
          return (
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
                    opacity: isItemLocked ? 0.7 : 1,
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
                    {React.cloneElement(item.icon, { sx: { fontSize: '2.2rem', opacity: isItemLocked ? 0.6 : 1 } })}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      isItemLocked ? (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {item.label} 🔒
                        </Box>
                      ) : (
                        item.label
                      )
                    }
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
                    {subMenuItems[item.key].map((subItem, idx) => {
                      const isSubItemLocked = isModuleLocked && isModuleLocked(subItem.path);
                      return (
                        <ListItem key={idx} disablePadding sx={{ mb: 0.3 }}>
                          {subItem.isDisabledHeader ? (
                            <Box sx={{ py: 1, px: 2, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                              {subItem.label}
                            </Box>
                          ) : (
                            <ListItemButton
                              onClick={() => handleSubItemClick(subItem)}
                              sx={{
                                borderRadius: '10px',
                                py: 1,
                                px: 2,
                                color: 'rgba(255, 255, 255, 0.75)',
                                opacity: isSubItemLocked ? 0.7 : 1,
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
                                primary={
                                  isSubItemLocked ? (
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                      {subItem.label} 🔒
                                    </Box>
                                  ) : (
                                    subItem.label
                                  )
                                }
                                primaryTypographyProps={{ fontSize: '0.95rem' }}
                              />
                            </ListItemButton>
                          )}
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
      </List>
    </Drawer>
  );
};

export default MobileMenuDrawer;
