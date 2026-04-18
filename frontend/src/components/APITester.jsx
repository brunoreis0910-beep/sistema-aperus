import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Collapse
} from '@mui/material';
import { ExpandMore, ExpandLess, PlayArrow } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const APITester = () => {
  const { axiosInstance } = useAuth();
  const [endpoint, setEndpoint] = useState('/api/vendas/');
  const [params, setParams] = useState('{"page_size": 10, "ordering": "-id"}');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});

  const commonEndpoints = [
    { name: 'Vendas', endpoint: '/api/vendas/', params: '{"page_size": 20, "ordering": "-id"}' },
    { name: 'Clientes', endpoint: '/api/clientes/', params: '{"page_size": 20, "ordering": "-id"}' },
    { name: 'Produtos', endpoint: '/api/produtos/', params: '{"page_size": 20, "ordering": "-id"}' },
    { name: 'Fornecedores', endpoint: '/api/fornecedores/', params: '{"page_size": 10, "ordering": "-id"}' },
    { name: 'Categorias', endpoint: '/categorias/', params: '{"page_size": 10}' },
    { name: 'Usuarios', endpoint: '/api/usuarios/', params: '{"page_size": 5}' }
  ];

  const testAPI = async () => {
    try {
      setLoading(true);
      setError('');

      console.log(`🧪 Testando: ${endpoint}`);
      console.log(`📋 Parâmetros: ${params}`);

      const parsedParams = JSON.parse(params || '{}');
      const result = await axiosInstance.get(endpoint, { params: parsedParams });

      console.log(`✅ Resposta:`, result.data);

      setResponse({
        status: result.status,
        data: result.data,
        headers: result.headers,
        url: result.config.url,
        fullUrl: `${result.config.baseURL}${result.config.url}?${new URLSearchParams(parsedParams).toString()}`
      });

    } catch (err) {
      console.error('❌ Erro na API:', err);
      setError(`Erro: ${err.response?.data?.detail || err.message}`);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const selectEndpoint = (endpointData) => {
    setEndpoint(endpointData.endpoint);
    setParams(endpointData.params);
  };

  const toggleExpanded = (index) => {
    setExpanded(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatJSON = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
        🔧 Testador de API
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Use esta ferramenta para testar diretamente os endpoints da API e verificar os dados retornados.
      </Typography>

      <Grid container spacing={3}>
        {/* Painel de Controle */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🎯 Configuração do Teste
            </Typography>

            {/* Endpoints Rápidos */}
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Endpoints Comuns:
            </Typography>
            <Box sx={{ mb: 3 }}>
              {commonEndpoints.map((ep, index) => (
                <Chip
                  key={index}
                  label={ep.name}
                  onClick={() => selectEndpoint(ep)}
                  sx={{ mr: 1, mb: 1 }}
                  color={endpoint === ep.endpoint ? 'primary' : 'default'}
                />
              ))}
            </Box>

            {/* Endpoint Manual */}
            <TextField
              fullWidth
              label="Endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="/api/vendas/"
            />

            {/* Parâmetros */}
            <TextField
              fullWidth
              label="Parâmetros (JSON)"
              value={params}
              onChange={(e) => setParams(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 3 }}
              placeholder='{"page_size": 10, "ordering": "-id"}'
            />

            <Button
              variant="contained"
              onClick={testAPI}
              disabled={loading}
              startIcon={loading ? null : <PlayArrow />}
              fullWidth
              size="large"
            >
              {loading ? 'Testando...' : 'Executar Teste'}
            </Button>
          </Paper>
        </Grid>

        {/* Resultados */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 Resultados
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {response && (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Status: {response.status} | URL: {response.fullUrl}
                </Alert>

                {/* Estatísticas */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    📊 Total de registros: {Array.isArray(response.data) ? response.data.length : response.data?.count || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    📄 Página atual: {response.data?.results ? response.data.results.length : 'N/A'} registros
                  </Typography>
                </Box>

                {/* Dados */}
                {response.data && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Dados Retornados:
                    </Typography>

                    {Array.isArray(response.data) || response.data?.results ? (
                      <List dense>
                        {(Array.isArray(response.data) ? response.data : response.data.results || []).slice(0, 5).map((item, index) => (
                          <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <ListItemText
                                primary={`Registro ${index + 1}`}
                                secondary={`ID: ${item.id || 'N/A'} | ${Object.keys(item).length} campos`}
                              />
                              <IconButton onClick={() => toggleExpanded(index)}>
                                {expanded[index] ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </Box>
                            <Collapse in={expanded[index]}>
                              <Card sx={{ mt: 1, bgcolor: 'grey.50' }}>
                                <CardContent>
                                  <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                                    {formatJSON(item)}
                                  </pre>
                                </CardContent>
                              </Card>
                            </Collapse>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Card sx={{ bgcolor: 'grey.50' }}>
                        <CardContent>
                          <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                            {formatJSON(response.data)}
                          </pre>
                        </CardContent>
                      </Card>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default APITester;