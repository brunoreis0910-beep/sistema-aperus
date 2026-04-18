import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { Wifi, Cable, Refresh, Save, CheckCircle } from '@mui/icons-material';

const ConfiguracaoIP = () => {
  const [ipServidor, setIpServidor] = useState('');
  const [ipAtual, setIpAtual] = useState('');
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    // Carrega o IP salvo ou usa localhost como padrão
    const ipSalvo = localStorage.getItem('servidor_ip') || 'localhost';
    setIpServidor(ipSalvo);
    setIpAtual(ipSalvo);

    // Auto-detecta na primeira vez se não houver IP salvo
    if (!localStorage.getItem('servidor_ip')) {
      console.log('🔍 Primeira vez - detectando IP automaticamente...');
      setTimeout(() => detectarIPAutomatico(), 500);
    }
  }, []);

  const testarConexao = async () => {
    setTestando(true);
    setResultado(null);

    try {
      const url = `http://${ipServidor}:8005/api/produtos/`;
      console.log('🔍 Testando conexão com:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 segundos timeout
      });

      if (response.ok) {
        setResultado({
          tipo: 'success',
          mensagem: `✅ Conexão OK! Servidor respondeu com status ${response.status}`
        });
      } else {
        setResultado({
          tipo: 'warning',
          mensagem: `⚠️ Servidor respondeu mas com erro ${response.status}`
        });
      }
    } catch (error) {
      console.error('❌ Erro ao testar:', error);
      setResultado({
        tipo: 'error',
        mensagem: `❌ Não foi possível conectar: ${error.message}`
      });
    } finally {
      setTestando(false);
    }
  };

  const salvarIP = () => {
    localStorage.setItem('servidor_ip', ipServidor);
    setIpAtual(ipServidor);

    // Força reload da página para aplicar o novo IP
    window.location.reload();
  };

  const detectarIPAutomatico = async () => {
    setTestando(true);
    setResultado(null);

    // Lista de IPs comuns para testar (localhost primeiro)
    const ipsParaTestar = [
      'localhost',     // Localhost (mais estável)
      '127.0.0.1',     // Localhost IP
      '192.168.1.4',   // IP atual da rede
      '192.168.0.3',   // Outra rede
      '10.0.0.1',      // Outras redes
    ];

    for (const ip of ipsParaTestar) {
      try {
        console.log(`🔍 Testando IP: ${ip}`);
        const response = await fetch(`http://${ip}:8005/api/produtos/`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });

        if (response.ok) {
          setIpServidor(ip);
          setResultado({
            tipo: 'success',
            mensagem: `✅ IP detectado automaticamente: ${ip}`
          });
          setTestando(false);
          return;
        }
      } catch (error) {
        // Continua testando o próximo IP
        console.log(`❌ IP ${ip} não respondeu`);
      }
    }

    setResultado({
      tipo: 'error',
      mensagem: '❌ Não foi possível detectar o IP automaticamente. Configure manualmente.'
    });
    setTestando(false);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Wifi /> Configuração do Servidor
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure o endereço IP do servidor para conexão via WiFi ou cabo de rede
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Card sx={{ mb: 3, bgcolor: 'info.light' }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              📱 IP atual em uso:
            </Typography>
            <Typography variant="h6" color="primary">
              {ipAtual}:8005
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="IP do Servidor"
            value={ipServidor}
            onChange={(e) => setIpServidor(e.target.value)}
            placeholder="localhost"
            helperText="Use 'localhost' ou '127.0.0.1' para servidor local"
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>http://</Typography>,
              endAdornment: <Typography sx={{ ml: 1 }}>:8005</Typography>,
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={detectarIPAutomatico}
            disabled={testando}
            fullWidth
          >
            {testando ? 'Detectando...' : 'Detectar Automaticamente'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<CheckCircle />}
            onClick={testarConexao}
            disabled={testando || !ipServidor}
            fullWidth
          >
            Testar Conexão
          </Button>
        </Box>

        {resultado && (
          <Alert severity={resultado.tipo} sx={{ mb: 2 }}>
            {resultado.mensagem}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<Save />}
          onClick={salvarIP}
          disabled={!ipServidor || ipServidor === ipAtual}
        >
          Salvar e Aplicar
        </Button>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            💡 Dicas:
          </Typography>
          <Typography variant="body2" component="div">
            • <strong>Servidor Local:</strong> localhost ou 127.0.0.1
            <br />
            • <strong>Rede WiFi:</strong> Use o IP da máquina (ex: 192.168.1.4)
            <br />
            • Use "Detectar Automaticamente" para encontrar o IP correto
            <br />
            • O servidor Django deve estar rodando na porta 8005
            <br />
            • Quando o IP mudar, basta detectar novamente
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ConfiguracaoIP;
