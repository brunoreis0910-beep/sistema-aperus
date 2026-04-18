import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Button,
    TextField,
    Alert,
    Card,
    CardContent,
    Divider,
    Stack,
    Chip,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Collapse
} from '@mui/material';
import {
    BugReport as BugIcon,
    Refresh as RefreshIcon,
    NetworkCheck as NetworkIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';

const DebugConexaoPage = () => {
    const [serverUrl, setServerUrl] = useState('http://localhost:8005');
    const [loading, setLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [connectionInfo, setConnectionInfo] = useState({});
    const [expandedSections, setExpandedSections] = useState({
        device: true,
        network: true,
        api: true,
        errors: true
    });

    useEffect(() => {
        loadDeviceInfo();
        loadNetworkInfo();
    }, []);

    const loadDeviceInfo = () => {
        const info = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            online: navigator.onLine,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            isCapacitor: !!(window.Capacitor),
            timestamp: new Date().toISOString()
        };
        setConnectionInfo(prev => ({ ...prev, device: info }));
    };

    const loadNetworkInfo = async () => {
        const info = {
            currentUrl: window.location.href,
            origin: window.location.origin,
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            port: window.location.port
        };

        // Tentar detectar IP local
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            info.publicIp = data.ip;
        } catch (error) {
            info.publicIp = 'Não detectado';
        }

        setConnectionInfo(prev => ({ ...prev, network: info }));
    };

    const testConnection = async () => {
        setLoading(true);
        setTestResult(null);

        const tests = [];

        // Teste 1: Ping básico
        try {
            const startTime = Date.now();
            const response = await axios.get(`${serverUrl}/api/`, { timeout: 5000 });
            const endTime = Date.now();
            tests.push({
                name: 'Ping API Base',
                status: 'success',
                message: `Conectado! Tempo: ${endTime - startTime}ms`,
                data: response.data
            });
        } catch (error) {
            tests.push({
                name: 'Ping API Base',
                status: 'error',
                message: error.message,
                details: {
                    code: error.code,
                    response: error.response?.data,
                    status: error.response?.status,
                    url: error.config?.url
                }
            });
        }

        // Teste 2: Endpoint de produtos
        try {
            const startTime = Date.now();
            const response = await axios.get(`${serverUrl}/api/produtos/`, { 
                timeout: 5000,
                params: { limit: 1 }
            });
            const endTime = Date.now();
            tests.push({
                name: 'Endpoint Produtos',
                status: 'success',
                message: `${response.data.length || response.data.results?.length || 0} produtos. Tempo: ${endTime - startTime}ms`
            });
        } catch (error) {
            tests.push({
                name: 'Endpoint Produtos',
                status: 'error',
                message: error.message,
                details: {
                    code: error.code,
                    response: error.response?.data,
                    status: error.response?.status
                }
            });
        }

        // Teste 3: Endpoint de clientes
        try {
            const startTime = Date.now();
            const response = await axios.get(`${serverUrl}/api/clientes/`, { 
                timeout: 5000,
                params: { limit: 1 }
            });
            const endTime = Date.now();
            tests.push({
                name: 'Endpoint Clientes',
                status: 'success',
                message: `${response.data.length || response.data.results?.length || 0} clientes. Tempo: ${endTime - startTime}ms`
            });
        } catch (error) {
            tests.push({
                name: 'Endpoint Clientes',
                status: 'error',
                message: error.message,
                details: {
                    code: error.code,
                    response: error.response?.data,
                    status: error.response?.status
                }
            });
        }

        setTestResult({
            timestamp: new Date().toISOString(),
            serverUrl,
            tests,
            summary: {
                total: tests.length,
                success: tests.filter(t => t.status === 'success').length,
                errors: tests.filter(t => t.status === 'error').length
            }
        });

        setLoading(false);
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const getSuggestions = () => {
        if (!testResult) return [];

        const suggestions = [];
        const hasErrors = testResult.summary.errors > 0;

        if (hasErrors) {
            const firstError = testResult.tests.find(t => t.status === 'error');
            
            if (firstError?.details?.code === 'ERR_NETWORK') {
                suggestions.push({
                    type: 'error',
                    title: 'Erro de Rede',
                    messages: [
                        'O servidor não está acessível na rede',
                        'Verifique se o Django está rodando',
                        'Verifique se o celular está na mesma rede WiFi do servidor',
                        `Confirme que o IP está correto: ${serverUrl}`
                    ]
                });
            }

            if (firstError?.details?.code === 'ECONNABORTED') {
                suggestions.push({
                    type: 'warning',
                    title: 'Timeout de Conexão',
                    messages: [
                        'A conexão está muito lenta ou travou',
                        'Verifique a qualidade do sinal WiFi',
                        'O servidor pode estar sobrecarregado'
                    ]
                });
            }

            if (firstError?.details?.status === 404) {
                suggestions.push({
                    type: 'warning',
                    title: 'Endpoint não encontrado',
                    messages: [
                        'O servidor está respondendo, mas a URL está incorreta',
                        'Verifique se a API está configurada corretamente'
                    ]
                });
            }

            if (firstError?.details?.status === 500) {
                suggestions.push({
                    type: 'error',
                    title: 'Erro no Servidor',
                    messages: [
                        'O servidor Django está com erro interno',
                        'Verifique os logs do Django no terminal'
                    ]
                });
            }
        } else if (testResult.summary.success === testResult.summary.total) {
            suggestions.push({
                type: 'success',
                title: 'Conexão OK!',
                messages: [
                    'Todos os testes passaram com sucesso',
                    'O sistema está pronto para uso',
                    'Você pode fazer login normalmente'
                ]
            });
        }

        return suggestions;
    };

    return (
        <Container maxWidth="md" sx={{ py: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                {/* Cabeçalho */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <BugIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Debug de Conexão
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Diagnóstico de problemas de rede e API
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Configuração do Servidor */}
                <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            <NetworkIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                            Endereço do Servidor
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="URL do Servidor"
                                value={serverUrl}
                                onChange={(e) => setServerUrl(e.target.value)}
                                placeholder="http://localhost:8005"
                                helperText="Use localhost ou o IP da rede local onde o Django está rodando"
                            />
                            <Button
                                variant="contained"
                                onClick={testConnection}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                                sx={{ minWidth: 120 }}
                            >
                                {loading ? 'Testando...' : 'Testar'}
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Sugestões */}
                {testResult && getSuggestions().map((suggestion, index) => (
                    <Alert 
                        key={index}
                        severity={suggestion.type} 
                        sx={{ mb: 2 }}
                        icon={suggestion.type === 'success' ? <CheckIcon /> : <ErrorIcon />}
                    >
                        <Typography variant="subtitle2" fontWeight="bold">
                            {suggestion.title}
                        </Typography>
                        <List dense>
                            {suggestion.messages.map((msg, i) => (
                                <ListItem key={i} sx={{ py: 0 }}>
                                    <ListItemText primary={`• ${msg}`} />
                                </ListItem>
                            ))}
                        </List>
                    </Alert>
                ))}

                {/* Resultados dos Testes */}
                {testResult && (
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Resultados dos Testes
                                </Typography>
                                <Box>
                                    <Chip 
                                        label={`${testResult.summary.success} OK`} 
                                        color="success" 
                                        size="small" 
                                        sx={{ mr: 1 }}
                                    />
                                    <Chip 
                                        label={`${testResult.summary.errors} Erros`} 
                                        color="error" 
                                        size="small" 
                                    />
                                </Box>
                            </Box>

                            <List>
                                {testResult.tests.map((test, index) => (
                                    <ListItem
                                        key={index}
                                        sx={{
                                            bgcolor: test.status === 'success' ? 'success.lighter' : 'error.lighter',
                                            borderRadius: 1,
                                            mb: 1
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {test.status === 'success' ? 
                                                        <CheckIcon color="success" sx={{ mr: 1 }} /> : 
                                                        <ErrorIcon color="error" sx={{ mr: 1 }} />
                                                    }
                                                    <Typography fontWeight="bold">
                                                        {test.name}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography variant="body2">
                                                        {test.message}
                                                    </Typography>
                                                    {test.details && (
                                                        <Box sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                                            <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                                {JSON.stringify(test.details, null, 2)}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                )}

                {/* Informações do Dispositivo */}
                {connectionInfo.device && (
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Box 
                                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                onClick={() => toggleSection('device')}
                            >
                                <Typography variant="h6">
                                    <InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                    Informações do Dispositivo
                                </Typography>
                                <IconButton size="small">
                                    <ExpandMoreIcon 
                                        sx={{ 
                                            transform: expandedSections.device ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s'
                                        }} 
                                    />
                                </IconButton>
                            </Box>
                            <Collapse in={expandedSections.device}>
                                <List dense>
                                    <ListItem>
                                        <ListItemText 
                                            primary="Plataforma" 
                                            secondary={connectionInfo.device.platform} 
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary="Navegador" 
                                            secondary={connectionInfo.device.userAgent} 
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary="Status de Rede" 
                                            secondary={
                                                <Chip 
                                                    label={connectionInfo.device.online ? 'Online' : 'Offline'} 
                                                    color={connectionInfo.device.online ? 'success' : 'error'}
                                                    size="small"
                                                />
                                            } 
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary="Resolução" 
                                            secondary={`${connectionInfo.device.screenWidth} x ${connectionInfo.device.screenHeight}`} 
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary="É Capacitor?" 
                                            secondary={
                                                <Chip 
                                                    label={connectionInfo.device.isCapacitor ? 'Sim (App Mobile)' : 'Não (Web)'} 
                                                    color={connectionInfo.device.isCapacitor ? 'primary' : 'default'}
                                                    size="small"
                                                />
                                            } 
                                        />
                                    </ListItem>
                                </List>
                            </Collapse>
                        </CardContent>
                    </Card>
                )}

                {/* Informações de Rede */}
                {connectionInfo.network && (
                    <Card>
                        <CardContent>
                            <Box 
                                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                onClick={() => toggleSection('network')}
                            >
                                <Typography variant="h6">
                                    <NetworkIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                    Informações de Rede
                                </Typography>
                                <IconButton size="small">
                                    <ExpandMoreIcon 
                                        sx={{ 
                                            transform: expandedSections.network ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s'
                                        }} 
                                    />
                                </IconButton>
                            </Box>
                            <Collapse in={expandedSections.network}>
                                <List dense>
                                    <ListItem>
                                        <ListItemText 
                                            primary="URL Atual" 
                                            secondary={connectionInfo.network.currentUrl} 
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary="Protocolo" 
                                            secondary={connectionInfo.network.protocol} 
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary="Hostname" 
                                            secondary={connectionInfo.network.hostname} 
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary="Porta" 
                                            secondary={connectionInfo.network.port || 'Padrão'} 
                                        />
                                    </ListItem>
                                    {connectionInfo.network.publicIp && (
                                        <ListItem>
                                            <ListItemText 
                                                primary="IP Público" 
                                                secondary={connectionInfo.network.publicIp} 
                                            />
                                        </ListItem>
                                    )}
                                </List>
                            </Collapse>
                        </CardContent>
                    </Card>
                )}

                {/* Instruções */}
                <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                        Como usar:
                    </Typography>
                    <List dense>
                        <ListItem sx={{ py: 0 }}>
                            <ListItemText primary="1. Digite o IP do servidor Django (ex: http://localhost:8005)" />
                        </ListItem>
                        <ListItem sx={{ py: 0 }}>
                            <ListItemText primary="2. Clique em 'Testar' para verificar a conexão" />
                        </ListItem>
                        <ListItem sx={{ py: 0 }}>
                            <ListItemText primary="3. Analise os resultados e sugestões" />
                        </ListItem>
                        <ListItem sx={{ py: 0 }}>
                            <ListItemText primary="4. Certifique-se que o servidor Django está rodando com: python manage.py runserver 0.0.0.0:8005" />
                        </ListItem>
                    </List>
                </Alert>
            </Paper>
        </Container>
    );
};

export default DebugConexaoPage;
