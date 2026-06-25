import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Container,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import { useToast } from '../components/common/Toast';

export default function MapeamentoTenantPage() {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showCustomConfig, setShowCustomConfig] = useState(false);
  const [customDiscoveryUrl, setCustomDiscoveryUrl] = useState('');
  const showToast = useToast();

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setLogs((prev) => [...prev, `[${timestamp}] [${type.toUpperCase()}] ${message}`]);
    console.log(`[DiagnosticLog] [${type.toUpperCase()}] ${message}`);
  };

  const handleLogoClick = () => {
    const clicks = logoClicks + 1;
    setLogoClicks(clicks);
    if (clicks === 5) {
      setShowCustomConfig(true);
      showToast.success('Configurações avançadas liberadas!');
      const savedCustom = localStorage.getItem('custom_discovery_url') || '';
      setCustomDiscoveryUrl(savedCustom);
    }
  };

  useEffect(() => {
    addLog('Página de Mapeamento inicializada.');
    addLog(`Protocolo: ${window.location.protocol}`);
    addLog(`Host: ${window.location.hostname}`);
    addLog(`Porta: ${window.location.port || 'nenhuma'}`);
    addLog(`URL completa: ${window.location.href}`);
    addLog(`Agente do Usuário: ${navigator.userAgent}`);
    
    const hasCapacitor = !!window.Capacitor;
    const isWV = navigator.userAgent.includes('; wv)');
    addLog(`Capacitor detectado na janela: ${hasCapacitor ? 'Sim' : 'Não'}`);
    addLog(`WebView detectada no UserAgent: ${isWV ? 'Sim' : 'Não'}`);
    addLog(`Lógica local isCapacitor avaliada: ${hasCapacitor || (window.location.hostname === 'localhost' && !window.location.port) || isWV ? 'Sim' : 'Não'}`);
    
    const savedCustom = localStorage.getItem('custom_discovery_url');
    if (savedCustom) {
      addLog(`URL de descoberta customizada configurada: ${savedCustom}`);
      setCustomDiscoveryUrl(savedCustom);
      setShowCustomConfig(true);
    }

    try {
      localStorage.setItem('__test_localstorage__', '1');
      localStorage.removeItem('__test_localstorage__');
      addLog('LocalStorage acessível: Sim');
    } catch (e) {
      addLog(`Erro ao acessar LocalStorage: ${e.message}`, 'error');
    }
  }, []);

  const formatCnpj = (value) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 2) return clean;
    if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
    if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
    if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
  };

  const handleCnpjChange = (e) => {
    setCnpj(formatCnpj(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      showToast.error('Por favor, informe um CNPJ válido com 14 dígitos.');
      addLog('Tentativa de conexão com CNPJ inválido ou incompleto.', 'warning');
      return;
    }

    setLoading(true);
    addLog(`Iniciando mapeamento para o CNPJ: ${cleanCnpj}`);
    try {
      // Detecta se está rodando dentro do Capacitor (app nativo)
      const isCapacitor = window.Capacitor || 
                          (window.location.hostname === 'localhost' && !window.location.port) || 
                          navigator.userAgent.includes('; wv)');

      // Endereço de descoberta central
      let discoveryUrl = `https://central.aperus.com.br/api/saas/mapear-tenant/?cnpj=${cleanCnpj}`;
      
      const savedCustom = localStorage.getItem('custom_discovery_url') || customDiscoveryUrl;
      if (savedCustom) {
        const baseUrl = savedCustom.endsWith('/') ? savedCustom : `${savedCustom}/`;
        discoveryUrl = `${baseUrl}api/saas/mapear-tenant/?cnpj=${cleanCnpj}`;
        addLog(`Usando URL de descoberta customizada: ${discoveryUrl}`);
      } else if (window.location.hostname === 'localhost' && window.location.port && !isCapacitor) {
        discoveryUrl = `${window.location.origin}/api/saas/mapear-tenant/?cnpj=${cleanCnpj}`;
      }

      addLog(`URL de descoberta gerada: ${discoveryUrl}`);
      addLog('Enviando requisição HTTP GET...');

      const response = await fetch(discoveryUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      addLog(`Resposta recebida. Status HTTP: ${response.status} (${response.statusText})`);

      if (!response.ok) {
        let errorMsg = 'Erro de requisição';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (parseErr) {
          addLog(`Erro ao decodificar JSON de erro: ${parseErr.message}`, 'warning');
          errorMsg = await response.text() || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      addLog(`JSON de sucesso decodificado: ${JSON.stringify(data)}`);

      if (data.url_api) {
        // Grava a URL de API e o CNPJ mapeado no cache
        localStorage.setItem('tenant_api_url', data.url_api);
        localStorage.setItem('tenant_cnpj', data.cnpj);
        localStorage.setItem('tenant_razao_social', data.razao_social);
        addLog('Mapeamento gravado com sucesso no LocalStorage.');
        
        showToast.success('Conexão realizada com sucesso!');
        setTimeout(() => {
          addLog('Recarregando janela para aplicar conexões...');
          window.location.reload();
        }, 1000);
      } else {
        throw new Error('URL de conexão não retornada pelo servidor.');
      }
    } catch (err) {
      addLog(`Ocorreu um erro no mapeamento: ${err.message}`, 'error');
      if (err.name === 'TypeError' && err.message.toLowerCase().includes('failed to fetch')) {
        addLog('DICA: O erro "Failed to fetch" geralmente indica:\n' +
               '  1. Falha física de internet ou servidor central offline.\n' +
               '  2. Erro de SSL: Se o seu servidor central usa HTTPS com um certificado inválido ou auto-assinado, a WebView do Android bloqueia silenciosamente a requisição.\n' +
               '  3. Bloqueio de CORS: O servidor central não retornou as origens CORS corretas (Access-Control-Allow-Origin) para capacitor://localhost.\n' +
               '  4. Tráfego inseguro (HTTP/Cleartext): Se a URL gerada for HTTP sem SSL, o Android bloqueia conexões inseguras por padrão.', 'warning');
      }
      showToast.error(err.message || 'Erro de comunicação com o servidor central.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
        position: 'relative',
        overflow: 'hidden',
        px: 2,
      }}
    >
      {/* Círculos de fundo com brilho blur */}
      <Box
        sx={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0) 70%)',
          top: '20%',
          left: '15%',
          filter: 'blur(40px)',
          animation: 'pulse 10s infinite alternate',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(236,72,153,0) 70%)',
          bottom: '15%',
          right: '10%',
          filter: 'blur(50px)',
          animation: 'pulse 12s infinite alternate-reverse',
        }}
      />

      <Container maxWidth="xs" sx={{ zIndex: 10 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            textAlign: 'center',
            color: '#fff',
          }}
        >
          {/* Logo / Ícone */}
          <Box
            onClick={handleLogoClick}
            sx={{
              display: 'inline-flex',
              p: 2,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              mb: 3,
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <BusinessIcon sx={{ fontSize: 40, color: '#fff' }} />
          </Box>

          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
            Aperus
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
            Bem-vindo ao Aperus. Para iniciar, informe o CNPJ da sua empresa.
          </Typography>

          <form onSubmit={handleSubmit}>
            {showCustomConfig && (
              <TextField
                fullWidth
                variant="outlined"
                label="URL do Servidor Central (Descoberta)"
                value={customDiscoveryUrl}
                onChange={(e) => {
                  setCustomDiscoveryUrl(e.target.value);
                  localStorage.setItem('custom_discovery_url', e.target.value);
                }}
                placeholder="http://192.168.1.4:8006"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#a855f7',
                    },
                    background: 'rgba(0, 0, 0, 0.2)',
                  },
                }}
                inputProps={{ style: { color: '#fff', fontSize: '0.9rem' } }}
                InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.5)' } }}
                helperText="Use HTTP e o IP local do computador (ex: http://192.168.1.4:8006)"
                FormHelperTextProps={{ style: { color: 'rgba(255, 255, 255, 0.5)' } }}
              />
            )}
            <TextField
              fullWidth
              variant="outlined"
              label="CNPJ da Empresa"
              value={cnpj}
              onChange={handleCnpjChange}
              placeholder="00.000.000/0000-00"
              disabled={loading}
              inputProps={{ maxLength: 18, style: { color: '#fff', textAlign: 'center', fontSize: '1.1rem', fontWeight: 600 } }}
              InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.5)' } }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                  },
                  background: 'rgba(0, 0, 0, 0.2)',
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Conectar Empresa'}
            </Button>
          </form>

          <Button
            variant="text"
            size="small"
            onClick={() => setShowLogs(!showLogs)}
            sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'none', '&:hover': { color: 'rgba(255, 255, 255, 0.7)' } }}
          >
            {showLogs ? 'Ocultar Logs de Diagnóstico' : 'Exibir Logs de Diagnóstico'}
          </Button>

          {showLogs && (
            <Box sx={{ mt: 2, textAlign: 'left' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                Logs de Diagnóstico de Conexão:
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 1.5,
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#a5f3fc',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  mb: 1.5
                }}
              >
                {logs.length > 0 ? logs.join('\n') : 'Nenhum log gerado.'}
              </Box>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => {
                  navigator.clipboard.writeText(logs.join('\n'));
                  showToast.success('Logs copiados para a área de transferência!');
                }}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    background: 'rgba(255, 255, 255, 0.05)',
                  }
                }}
              >
                Copiar Logs
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
