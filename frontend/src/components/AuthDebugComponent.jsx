import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import axios from 'axios';

const AuthDebugComponent = () => {
  const [credentials, setCredentials] = useState({ username: 'admin', password: 'admin123' });
  const [authStatus, setAuthStatus] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Verificar status de autenticação atual
  const verificarAuth = () => {
    const possibleTokenKeys = [
      'accessToken', 'access_token', 'token', 'authToken', 'access', 'jwt', 'user_token',
      'auth_token', 'sessionToken', 'bearer_token', 'apiToken', 'refreshToken'
    ];

    let validToken = null;
    let tokenSource = null;

    // Buscar token nas chaves diretas
    for (const key of possibleTokenKeys) {
      const token = localStorage.getItem(key);
      if (token && token !== 'null' && token !== 'undefined' && token.length > 10) {
        validToken = token;
        tokenSource = key;
        break;
      }
    }

    // Buscar token dentro do objeto user
    if (!validToken) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.token && user.token.length > 10) {
            validToken = user.token;
            tokenSource = 'user.token';
          }
        } catch (e) {
          console.log('Erro ao parsear user:', e);
        }
      }
    }

    setAuthStatus({
      isAuthenticated: !!validToken,
      token: validToken,
      tokenSource: tokenSource,
      localStorageKeys: Object.keys(localStorage)
    });

    return !!validToken;
  };

  // Fazer login
  const fazerLogin = async () => {
    try {
      setLoading(true);

      const response = await axios.post('http://127.0.0.1:8005/api/token/', credentials);

      // Salvar token no localStorage (várias chaves para compatibilidade)
      sessionStorage.setItem('access_token', response.data.access);
      sessionStorage.setItem('accessToken', response.data.access);
      sessionStorage.setItem('token', response.data.access);
      sessionStorage.setItem('refreshToken', response.data.refresh);

      // Salvar no formato user também
      localStorage.setItem('user', JSON.stringify({
        token: response.data.access,
        refresh: response.data.refresh,
        username: credentials.username
      }));

      alert('✅ Login realizado com sucesso!');
      verificarAuth();
      await buscarProdutosReais();

    } catch (error) {
      alert('❌ Erro no login: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Buscar produtos reais
  const buscarProdutosReais = async () => {
    try {
      const token = sessionStorage.getItem('access_token') || sessionStorage.getItem('accessToken');
      if (!token) {
        alert('❌ Sem token! Faça login primeiro.');
        return;
      }

      const response = await axios.get('http://127.0.0.1:8005/api/produtos/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProdutos(response.data);
      alert(`✅ ${response.data.length} produtos reais carregados!`);

    } catch (error) {
      alert('❌ Erro ao buscar produtos: ' + error.message);
    }
  };

  // Limpar autenticação
  const logout = () => {
    localStorage.clear();
    setAuthStatus(null);
    setProdutos([]);
    alert('🚪 Logout realizado!');
  };

  useEffect(() => {
    verificarAuth();
  }, []);

  return (
    <Box p={3} maxWidth={800}>
      <Typography variant="h4" gutterBottom>
        🔐 Debug de Autenticação e Produtos
      </Typography>

      {/* Status de Autenticação */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Status Atual
          </Typography>

          {authStatus ? (
            <Alert severity={authStatus.isAuthenticated ? "success" : "warning"}>
              {authStatus.isAuthenticated ? (
                <>
                  ✅ <strong>Autenticado!</strong><br />
                  Fonte: {authStatus.tokenSource}<br />
                  Token: {authStatus.token?.substring(0, 30)}...
                </>
              ) : (
                <>
                  ⚠️ <strong>não autenticado!</strong><br />
                  Chaves no localStorage: {authStatus.localStorageKeys.join(', ')}
                </>
              )}
            </Alert>
          ) : (
            <Alert severity="info">Verificando...</Alert>
          )}

          <Box mt={2} display="flex" gap={2}>
            <Button onClick={verificarAuth} variant="outlined">
              🔍 Verificar Auth
            </Button>
            <Button onClick={logout} variant="outlined" color="warning">
              🚪 Logout
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Login */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Login no Sistema
          </Typography>

          <Box display="flex" gap={2} mb={2}>
            <TextField
              label="Usuário"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              size="small"
            />
            <TextField
              label="Senha"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              size="small"
            />
          </Box>

          <Button
            onClick={fazerLogin}
            variant="contained"
            disabled={loading}
          >
            {loading ? '⏳ Fazendo login...' : '🔐 Fazer Login'}
          </Button>
        </CardContent>
      </Card>

      {/* Produtos */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Produtos Reais do Banco de Dados
          </Typography>

          <Button
            onClick={buscarProdutosReais}
            variant="outlined"
            sx={{ mb: 2 }}
          >
            📦 Buscar Produtos Reais
          </Button>

          {produtos.length > 0 ? (
            <List>
              {produtos.map((produto) => (
                <ListItem key={produto.id_produto} divider>
                  <ListItemText
                    primary={produto.nome_produto}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Código: {produto.codigo_produto} |
                          Preço: R$ {parseFloat(produto.valor_venda || 0).toFixed(2)} |
                          Estoque: {produto.estoque_atual}
                        </Typography>
                        <Chip
                          label={`ID: ${produto.id_produto}`}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              Nenhum produto carregado. Faça login e clique em "Buscar Produtos Reais".
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthDebugComponent;