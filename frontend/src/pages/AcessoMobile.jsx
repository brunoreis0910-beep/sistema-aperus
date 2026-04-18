import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Button,
    Card,
    CardContent,
    Divider,
    Stack,
    Alert,
    IconButton,
    Tooltip,
    Chip
} from '@mui/material';
import {
    QrCode2 as QrCodeIcon,
    Smartphone as SmartphoneIcon,
    ContentCopy as CopyIcon,
    CheckCircle as CheckIcon,
    Download as DownloadIcon,
    Wifi as WifiIcon
} from '@mui/icons-material';
import { QRCodeCanvas } from 'qrcode.react';
import { API_BASE_URL } from '../config/api';

const AcessoMobile = () => {
    const [url, setUrl] = useState(window.location.origin || API_BASE_URL);
    const [ipLocal, setIpLocal] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Detectar URL atual (localhost ou IP da rede)
        const currentUrl = window.location.origin || API_BASE_URL;
        setUrl(currentUrl);

        // Tentar detectar IP local da rede
        detectLocalIP();
    }, []);

    const detectLocalIP = async () => {
        try {
            // Método 1: Via RTCPeerConnection (funciona na maioria dos navegadores)
            const pc = new RTCPeerConnection({ iceServers: [] });
            pc.createDataChannel('');

            const offerPromise = pc.createOffer();
            offerPromise.then(offer => {
                pc.setLocalDescription(offer);
            }).catch(err => {
                console.error('Erro ao criar oferta:', err);
            });

            pc.onicecandidate = (ice) => {
                if (!ice || !ice.candidate || !ice.candidate.candidate) return;
                const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                const match = ipRegex.exec(ice.candidate.candidate);
                if (match) {
                    const detectedIP = match[1];
                    // Verificar se é IP local (192.168.x.x ou 10.x.x.x ou 172.16-31.x.x)
                    if (detectedIP.startsWith('192.168.') ||
                        detectedIP.startsWith('10.') ||
                        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(detectedIP)) {
                        setIpLocal(detectedIP);
                        pc.close();
                    }
                }
            };

            // Timeout de segurança - fechar após 5 segundos
            setTimeout(() => {
                try {
                    pc.close();
                } catch (e) {
                    // Ignora erro se já fechou
                }
            }, 5000);
        } catch (error) {
            console.error('Erro ao detectar IP local:', error);
        }
    };

    const getAccessUrl = () => {
        const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
        // Usa o IP local detectado via WebRTC (acesso pelo celular na mesma rede)
        if (ipLocal) {
            return `http://${ipLocal}:${port}/`;
        }
        // Se o hostname não for localhost, usa a URL atual (acesso já via IP/hostname externo)
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return window.location.origin + '/';
        }
        // Fallback: URL atual (localhost - não funciona no celular, mas exibe enquanto detecta)
        return window.location.origin + '/';
    };

    const handleCopyUrl = () => {
        const accessUrl = getAccessUrl();
        navigator.clipboard.writeText(accessUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadQR = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'qrcode-sistema-petshop.png';
            link.href = url;
            link.click();
        }
    };

    const accessUrl = getAccessUrl();

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                {/* Cabeçalho */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <SmartphoneIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        Acesse pelo Smartphone
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Use o QR Code abaixo para acessar o sistema no seu celular
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* QR Code */}
                <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            {/* QR Code Canvas */}
                            <Box
                                sx={{
                                    p: 3,
                                    bgcolor: 'white',
                                    borderRadius: 2,
                                    boxShadow: 2
                                }}
                            >
                                <QRCodeCanvas
                                    value={accessUrl}
                                    size={280}
                                    level="H"
                                    includeMargin={true}
                                    imageSettings={{
                                        src: '/icons/icon-192x192.png',
                                        height: 40,
                                        width: 40,
                                        excavate: true,
                                    }}
                                />
                            </Box>

                            {/* URL do QR Code */}
                            <Alert severity={ipLocal ? "success" : "warning"} sx={{ width: '100%', maxWidth: 400 }}>
                                <Typography variant="body2" fontWeight="bold" gutterBottom>
                                    {ipLocal ? 'QR Code configurado para:' : 'Detectando IP da rede...'}
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                    {accessUrl}
                                </Typography>
                            </Alert>

                            {/* Botões de ação */}
                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={handleDownloadQR}
                                >
                                    Baixar QR Code
                                </Button>
                            </Stack>
                        </Box>
                    </CardContent>
                </Card>

                {/* URL para copiar */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">
                            Ou copie o link:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    flex: 1,
                                    p: 1.5,
                                    bgcolor: 'grey.50',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem',
                                    overflow: 'auto'
                                }}
                            >
                                {accessUrl}
                            </Paper>
                            <Tooltip title={copied ? 'Copiado!' : 'Copiar link'}>
                                <IconButton
                                    color={copied ? 'success' : 'primary'}
                                    onClick={handleCopyUrl}
                                    sx={{ flexShrink: 0 }}
                                >
                                    {copied ? <CheckIcon /> : <CopyIcon />}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </CardContent>
                </Card>

                {/* Instruções */}
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Como acessar pelo celular:
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                        <Typography variant="body2">
                            1. <strong>Abra a câmera</strong> do seu smartphone
                        </Typography>
                        <Typography variant="body2">
                            2. <strong>Aponte para o QR Code</strong> acima
                        </Typography>
                        <Typography variant="body2">
                            3. <strong>Toque na notificação</strong> que aparecer
                        </Typography>
                        <Typography variant="body2">
                            4. <strong>Faça login</strong> com suas credenciais
                        </Typography>
                        <Typography variant="body2">
                            5. <strong>Adicione à tela inicial</strong> para acesso rápido (PWA)
                        </Typography>
                    </Stack>
                </Alert>

                {/* Requisitos de rede */}
                {ipLocal ? (
                    <Alert severity="success" icon={<WifiIcon />}>
                        <Typography variant="body2">
                            <strong>Wi-Fi detectado!</strong> Seu celular precisa estar na mesma rede Wi-Fi deste computador.
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            IP da rede: {ipLocal}
                        </Typography>
                    </Alert>
                ) : (
                    <Alert severity="warning" icon={<WifiIcon />}>
                        <Typography variant="body2">
                            <strong>Importante:</strong> Certifique-se de que seu celular está na mesma rede Wi-Fi deste computador.
                        </Typography>
                    </Alert>
                )}

                {/* Recursos PWA */}
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        🎉 Recursos disponíveis no celular:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Chip label="Funciona Offline" color="primary" variant="outlined" />
                        <Chip label="Instalar como App" color="primary" variant="outlined" />
                        <Chip label="Notificações" color="primary" variant="outlined" />
                        <Chip label="Câmera" color="primary" variant="outlined" />
                        <Chip label="Rápido" color="primary" variant="outlined" />
                    </Stack>
                </Box>

                {/* Dica adicional */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                    <Typography variant="body2" color="primary.contrastText" textAlign="center">
                        💡 <strong>Dica:</strong> Após acessar pelo celular, clique em "Adicionar à tela inicial"
                        no menu do navegador para ter o ícone do app na tela do seu smartphone!
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default AcessoMobile;
