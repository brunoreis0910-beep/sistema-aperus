import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Typography,
    Box,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

/**
 * Componente de diálogo de confirmação reutilizável
 * 
 * @param {Object} props
 * @param {boolean} props.open - Controla se o diálogo está aberto
 * @param {function} props.onClose - Callback chamada ao fechar (cancelar)
 * @param {function} props.onConfirm - Callback chamada ao confirmar
 * @param {string} props.title - Título do diálogo
 * @param {string} props.message - Mensagem principal
 * @param {string} props.confirmText - Texto do botão de confirmação (padrão: "Confirmar")
 * @param {string} props.cancelText - Texto do botão de cancelar (padrão: "Cancelar")
 * @param {string} props.confirmColor - Cor do botão de confirmação (padrão: "error")
 * @param {string} props.severity - Nível de severidade: "warning", "error", "info" (padrão: "warning")
 * 
 * @example
 * <ConfirmDialog
 *   open={deleteDialog}
 *   onClose={() => setDeleteDialog(false)}
 *   onConfirm={handleDelete}
 *   title="Excluir Cliente"
 *   message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
 *   confirmText="Excluir"
 *   confirmColor="error"
 * />
 */
const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title = 'Confirmar Ação',
    message = 'Tem certeza que deseja realizar esta ação?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmColor = 'error',
    severity = 'warning',
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const getSeverityColor = () => {
        switch (severity) {
            case 'error':
                return '#d32f2f';
            case 'warning':
                return '#ed6c02';
            case 'info':
                return '#0288d1';
            default:
                return '#ed6c02';
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                },
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <WarningAmberIcon
                        sx={{
                            color: getSeverityColor(),
                            fontSize: 28,
                        }}
                    />
                    <Typography variant="h6" component="div">
                        {title}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                <DialogContentText sx={{ color: 'text.primary', fontSize: '0.95rem' }}>
                    {message}
                </DialogContentText>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    variant="outlined"
                    sx={{ minWidth: 100 }}
                >
                    {cancelText}
                </Button>
                <Button
                    onClick={handleConfirm}
                    color={confirmColor}
                    variant="contained"
                    sx={{ minWidth: 100 }}
                    autoFocus
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;

/**
 * Hook personalizado para gerenciar o estado do ConfirmDialog
 * 
 * @returns {Object} Objeto com estado e funções do diálogo
 * 
 * @example
 * const confirmDialog = useConfirmDialog();
 * 
 * // Abrir diálogo
 * confirmDialog.show({
 *   title: 'Excluir Item',
 *   message: 'Confirma exclusão?',
 *   onConfirm: () => deleteItem(id)
 * });
 * 
 * // No JSX
 * <ConfirmDialog {...confirmDialog.props} />
 */
export const useConfirmDialog = () => {
    const [state, setState] = React.useState({
        open: false,
        title: '',
        message: '',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        confirmColor: 'error',
        severity: 'warning',
        onConfirm: () => { },
    });

    const show = (config) => {
        setState({
            open: true,
            title: config.title || 'Confirmar Ação',
            message: config.message || 'Tem certeza?',
            confirmText: config.confirmText || 'Confirmar',
            cancelText: config.cancelText || 'Cancelar',
            confirmColor: config.confirmColor || 'error',
            severity: config.severity || 'warning',
            onConfirm: config.onConfirm || (() => { }),
        });
    };

    const hide = () => {
        setState((prev) => ({ ...prev, open: false }));
    };

    return {
        show,
        hide,
        props: {
            open: state.open,
            onClose: hide,
            onConfirm: state.onConfirm,
            title: state.title,
            message: state.message,
            confirmText: state.confirmText,
            cancelText: state.cancelText,
            confirmColor: state.confirmColor,
            severity: state.severity,
        },
    };
};
