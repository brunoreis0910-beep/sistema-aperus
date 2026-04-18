import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { ExitToApp, Close } from '@mui/icons-material';

const LogoutDialog = ({ open, onClose, onConfirm, userName }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ExitToApp sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="h6">
            Confirmar Logout
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          Tem certeza que deseja sair do sistema?
        </Typography>
        {userName && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Você está conectado como: <strong>{userName}</strong>
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Ao confirmar, você será redirecionado para a tela de login.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ mr: 1 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          startIcon={<ExitToApp />}
        >
          Confirmar Logout
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogoutDialog;