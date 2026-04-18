import React, { useState, useEffect } from 'react';
import {
    Box,
    Fab,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
    Paper,
    Stack,
    Alert,
    Button,
    Chip
} from '@mui/material';
import {
    QrCode2 as QrCodeIcon,
    Close as CloseIcon,
    ContentCopy as CopyIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

const QRCodeFloating = () => {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();

    const getAccessUrl = () => {
        // Sempre retornar o endereço da rede local
        return 'http://192.168.0.54:8005/';
    };

    const handleCopyUrl = () => {
        const url = getAccessUrl();
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpenFullPage = () => {
        setOpen(false);
        navigate('/acesso-mobile');
    };

    const accessUrl = getAccessUrl();
    const isNetworkUrl = !accessUrl.includes('localhost') && !accessUrl.includes('127.0.0.1');

    return (
        <>
            {/* Botão Flutuante */}
            <Fab
                color="primary"
                aria-label="qr-code"
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1000
                }}
                onClick={() => setOpen(true)}
            >
                <QrCodeIcon />
            </Fab>

            {/* Dialog com QR Code */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <QrCodeIcon color="primary" />
                        <Typography variant="h6">Acesso pelo Celular</Typography>
                    </Box>
                    <IconButton onClick={() => setOpen(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={3} alignItems="center">
                        {/* QR Code */}
                        <Paper
                            elevation={3}
                            sx={{
                                p: 2,
                                bgcolor: 'white',
                                borderRadius: 2,
                                display: 'inline-block'
                            }}
                        >
                            <QRCodeCanvas
                                value={accessUrl}
                                size={240}
                                level="H"
                                includeMargin={true}
                            />
                        </Paper>

                        {/* Status da URL */}
                        {isNetworkUrl ? (
                            <Alert severity="success" sx={{ width: '100%' }}>
                                <Typography variant="body2" fontWeight="bold">
                                    ✅ QR Code pronto para usar!
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mt: 0.5 }}>
                                    {accessUrl}
                                </Typography>
                            </Alert>
                        ) : (
                            <Alert severity="warning" sx={{ width: '100%' }}>
                                <Typography variant="body2">
                                    ⚠️ Você está em localhost. Acesse via IP da rede para usar o QR Code no celular.
                                </Typography>
                            </Alert>
                        )}

                        {/* Botões de ação */}
                        <Stack direction="row" spacing={2} width="100%">
                            <Button
                                variant="outlined"
                                startIcon={copied ? <CheckIcon /> : <CopyIcon />}
                                onClick={handleCopyUrl}
                                fullWidth
                                color={copied ? 'success' : 'primary'}
                            >
                                {copied ? 'Copiado!' : 'Copiar Link'}
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleOpenFullPage}
                                fullWidth
                            >
                                Ver Instruções
                            </Button>
                        </Stack>

                        {/* Dica rápida */}
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                bgcolor: 'primary.light',
                                width: '100%',
                                borderColor: 'primary.main'
                            }}
                        >
                            <Typography variant="body2" color="primary.contrastText" textAlign="center">
                                📱 <strong>Como usar:</strong> Abra a câmera do celular e aponte para o QR Code
                            </Typography>
                        </Paper>

                        {/* Features */}
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="caption" color="text.secondary" textAlign="center" display="block" gutterBottom>
                                Recursos disponíveis:
                            </Typography>
                            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" gap={0.5}>
                                <Chip label="PWA" size="small" variant="outlined" />
                                <Chip label="Offline" size="small" variant="outlined" />
                                <Chip label="Rápido" size="small" variant="outlined" />
                                <Chip label="Câmera" size="small" variant="outlined" />
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default QRCodeFloating;
