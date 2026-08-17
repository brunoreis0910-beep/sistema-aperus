import React, { useState, useEffect } from 'react';
import {
    Box,
    Fab,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
    Button,
    Paper,
    Chip,
    Stack
} from '@mui/material';
import {
    BugReport as BugIcon,
    Close as CloseIcon,
    ContentCopy as CopyIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

// Sistema de Log Global
class Logger {
    constructor() {
        this.logs = [];
        this.listeners = [];
        this.maxLogs = 200;

        // Intercepta console.log, console.error, console.warn
        this.interceptConsole();

        // Intercepta erros não tratados
        window.addEventListener('error', (event) => {
            this.error('ERRO NÃO TRATADO', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Intercepta rejeições de promises
        window.addEventListener('unhandledrejection', (event) => {
            this.error('PROMISE REJEITADA', {
                reason: event.reason,
                promise: event.promise
            });
        });
    }

    interceptConsole() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            originalLog.apply(console, args);
            this.info('Console', args);
        };

        console.error = (...args) => {
            originalError.apply(console, args);
            this.error('Console Error', args);
        };

        console.warn = (...args) => {
            originalWarn.apply(console, args);
            this.warn('Console Warning', args);
        };
    }

    log(level, title, data) {
        const entry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            level,
            title,
            data: this.formatData(data),
            raw: data
        };

        this.logs.push(entry);

        // Limita o número de logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Notifica listeners de forma assíncrona para não disparar setState durante render
        const logsSnapshot = [...this.logs];
        setTimeout(() => {
            this.listeners.forEach(listener => listener(logsSnapshot));
        }, 0);

        // Salva no localStorage para persistência
        this.saveLogs();
    }

    formatData(data) {
        try {
            if (typeof data === 'object') {
                return JSON.stringify(data, null, 2);
            }
            return String(data);
        } catch (e) {
            return '[Erro ao formatar dados]';
        }
    }

    info(title, data) {
        this.log('INFO', title, data);
    }

    warn(title, data) {
        this.log('WARN', title, data);
    }

    error(title, data) {
        this.log('ERROR', title, data);
    }

    success(title, data) {
        this.log('SUCCESS', title, data);
    }

    network(title, data) {
        this.log('NETWORK', title, data);
    }

    subscribe(listener) {
        this.listeners.push(listener);
        // Retorna função para cancelar inscrição
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    clear() {
        this.logs = [];
        localStorage.removeItem('debug_logs');
        this.listeners.forEach(listener => listener(this.logs));
    }

    saveLogs() {
        try {
            const logsToSave = this.logs.slice(-50); // Salva apenas os últimos 50
            localStorage.setItem('debug_logs', JSON.stringify(logsToSave));
        } catch (e) {
            console.error('Erro ao salvar logs:', e);
        }
    }

    loadLogs() {
        try {
            const saved = localStorage.getItem('debug_logs');
            if (saved) {
                this.logs = JSON.parse(saved);
                this.listeners.forEach(listener => listener(this.logs));
            }
        } catch (e) {
            console.error('Erro ao carregar logs:', e);
        }
    }

    getLogs() {
        return this.logs;
    }

    exportLogs() {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            device: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                online: navigator.onLine,
                url: window.location.href,
                isCapacitor: !!window.Capacitor
            },
            logs: this.logs
        }, null, 2);
    }
}

// Instância global do logger
export const logger = new Logger();

// Log informações do ambiente na inicialização
logger.info('APP INICIADO', {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    isCapacitor: !!window.Capacitor,
    userAgent: navigator.userAgent,
    online: navigator.onLine
});

// Carrega logs salvos
logger.loadLogs();

// Componente de UI
const DebugLogger = () => {
    const [open, setOpen] = useState(false);
    const [logs, setLogs] = useState(logger.getLogs());
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        const unsubscribe = logger.subscribe((newLogs) => {
            setLogs([...newLogs]);
        });

        return unsubscribe;
    }, []);

    const filteredLogs = logs.filter(log => {
        if (filter === 'ALL') return true;
        return log.level === filter;
    });

    const handleCopy = () => {
        const text = logger.exportLogs();
        navigator.clipboard.writeText(text);
        logger.success('Logs copiados', 'Logs copiados para a área de transferência');
    };

    const handleClear = () => {
        logger.clear();
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'ERROR': return 'error';
            case 'WARN': return 'warning';
            case 'SUCCESS': return 'success';
            case 'NETWORK': return 'info';
            default: return 'default';
        }
    };

    const getFilterCount = (level) => {
        return logs.filter(log => log.level === level).length;
    };

    // Só mostra o botão se estiver no Capacitor ou localhost
    const showDebugButton = window.Capacitor || window.location.hostname === 'localhost';

    if (!showDebugButton) return null;

    return (
        <>
            {/* Botão Flutuante */}
            <Fab
                color="error"
                aria-label="debug"
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    left: 24,
                    zIndex: 1000
                }}
                onClick={() => setOpen(true)}
            >
                <BugIcon />
            </Fab>

            {/* Dialog com Logs */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen
            >
                <DialogTitle sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'error.main',
                    color: 'white'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BugIcon />
                        <Typography variant="h6">Debug Logger</Typography>
                        <Chip
                            label={`${logs.length} logs`}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                    </Box>
                    <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    {/* Barra de Filtros */}
                    <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'grey.300' }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                            <Chip
                                label={`Todos (${logs.length})`}
                                onClick={() => setFilter('ALL')}
                                color={filter === 'ALL' ? 'primary' : 'default'}
                                variant={filter === 'ALL' ? 'filled' : 'outlined'}
                            />
                            <Chip
                                label={`Erros (${getFilterCount('ERROR')})`}
                                onClick={() => setFilter('ERROR')}
                                color={filter === 'ERROR' ? 'error' : 'default'}
                                variant={filter === 'ERROR' ? 'filled' : 'outlined'}
                            />
                            <Chip
                                label={`Avisos (${getFilterCount('WARN')})`}
                                onClick={() => setFilter('WARN')}
                                color={filter === 'WARN' ? 'warning' : 'default'}
                                variant={filter === 'WARN' ? 'filled' : 'outlined'}
                            />
                            <Chip
                                label={`Rede (${getFilterCount('NETWORK')})`}
                                onClick={() => setFilter('NETWORK')}
                                color={filter === 'NETWORK' ? 'info' : 'default'}
                                variant={filter === 'NETWORK' ? 'filled' : 'outlined'}
                            />
                            <Chip
                                label={`Sucesso (${getFilterCount('SUCCESS')})`}
                                onClick={() => setFilter('SUCCESS')}
                                color={filter === 'SUCCESS' ? 'success' : 'default'}
                                variant={filter === 'SUCCESS' ? 'filled' : 'outlined'}
                            />
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            <Button
                                startIcon={<CopyIcon />}
                                onClick={handleCopy}
                                variant="outlined"
                                size="small"
                            >
                                Copiar Logs
                            </Button>
                            <Button
                                startIcon={<DeleteIcon />}
                                onClick={handleClear}
                                variant="outlined"
                                color="error"
                                size="small"
                            >
                                Limpar
                            </Button>
                        </Stack>
                    </Box>

                    {/* Lista de Logs */}
                    <Box sx={{ p: 2, maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
                        {filteredLogs.length === 0 ? (
                            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                                Nenhum log encontrado
                            </Typography>
                        ) : (
                            <Stack spacing={1}>
                                {[...filteredLogs].reverse().map(log => (
                                    <Paper
                                        key={log.id}
                                        sx={{
                                            p: 1.5,
                                            borderLeft: 4,
                                            borderColor: `${getLevelColor(log.level)}.main`
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Chip
                                                label={log.level}
                                                size="small"
                                                color={getLevelColor(log.level)}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                                            </Typography>
                                        </Box>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            {log.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            component="pre"
                                            sx={{
                                                mt: 1,
                                                p: 1,
                                                bgcolor: 'grey.100',
                                                borderRadius: 1,
                                                fontSize: '0.75rem',
                                                overflow: 'auto',
                                                maxHeight: 200,
                                                fontFamily: 'monospace'
                                            }}
                                        >
                                            {log.data}
                                        </Typography>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DebugLogger;
