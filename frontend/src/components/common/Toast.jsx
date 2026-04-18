/**
 * Sistema de Notificações Toast
 * 
 * Componente reutilizável para exibir mensagens de feedback ao usuário
 * (sucesso, erro, aviso, informação)
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertTitle, IconButton, Slide } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// Contexto do Toast
const ToastContext = createContext(null);

// Transição de slide
function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

/**
 * Provider do Toast - deve envolver toda a aplicação
 */
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info', // 'success' | 'error' | 'warning' | 'info'
    title: '',
    duration: 4000,
    position: { vertical: 'bottom', horizontal: 'right' }
  });

  /**
   * Mostra uma notificação toast
   * 
   * @param {string} message - Mensagem a ser exibida
   * @param {object} options - Opções adicionais
   * @param {string} options.severity - Tipo de alerta: 'success' | 'error' | 'warning' | 'info'
   * @param {string} options.title - Título opcional
   * @param {number} options.duration - Duração em ms (default: 4000)
   * @param {object} options.position - Posição: { vertical: 'top'|'bottom', horizontal: 'left'|'center'|'right' }
   */
  const showToast = useCallback((message, options = {}) => {
    setToast({
      open: true,
      message,
      severity: options.severity || 'info',
      title: options.title || '',
      duration: options.duration !== undefined ? options.duration : 4000,
      position: options.position || { vertical: 'bottom', horizontal: 'right' }
    });
  }, []);

  /**
   * Atalhos para tipos específicos de toast
   */
  const showSuccess = useCallback((message, options = {}) => {
    showToast(message, { ...options, severity: 'success' });
  }, [showToast]);

  const showError = useCallback((message, options = {}) => {
    showToast(message, { ...options, severity: 'error' });
  }, [showToast]);

  const showWarning = useCallback((message, options = {}) => {
    showToast(message, { ...options, severity: 'warning' });
  }, [showToast]);

  const showInfo = useCallback((message, options = {}) => {
    showToast(message, { ...options, severity: 'info' });
  }, [showToast]);

  /**
   * Fecha o toast
   */
  const hideToast = useCallback((event, reason) => {
    // Não fechar se o usuário clicou fora
    if (reason === 'clickaway') {
      return;
    }
    setToast(prev => ({ ...prev, open: false }));
  }, []);

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      <Snackbar
        open={toast.open}
        autoHideDuration={toast.duration}
        onClose={hideToast}
        anchorOrigin={toast.position}
        TransitionComponent={SlideTransition}
        sx={{
          // Garantir que fique acima de modais
          zIndex: (theme) => theme.zIndex.snackbar
        }}
      >
        <Alert
          onClose={hideToast}
          severity={toast.severity}
          variant="filled"
          elevation={6}
          sx={{
            width: '100%',
            minWidth: 300,
            maxWidth: 500,
            fontSize: '0.95rem',
            alignItems: 'center'
          }}
          action={
            <IconButton
              size="small"
              aria-label="fechar"
              color="inherit"
              onClick={hideToast}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

/**
 * Hook para usar o Toast em qualquer componente
 * 
 * @returns {object} Funções para exibir toasts
 * 
 * @example
 * const { showSuccess, showError } = useToast();
 * 
 * // Mostrar sucesso
 * showSuccess('Salvo com sucesso!');
 * 
 * // Mostrar erro
 * showError('Erro ao salvar', { title: 'Atenção!' });
 * 
 * // Toast personalizado
 * showToast('Mensagem', { 
 *   severity: 'warning',
 *   duration: 6000,
 *   position: { vertical: 'top', horizontal: 'center' }
 * });
 */
export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }

  return context;
};

export default ToastProvider;
