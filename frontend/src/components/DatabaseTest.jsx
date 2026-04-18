import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const DatabaseTest = () => {
  const { axiosInstance } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const testDatabaseConnections = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Testando conexões com banco de dados...');

      const hoje = new Date().toISOString().split('T')[0];
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      // Testar todas as endpoints principais
      const endpoints = [
        { name: 'Vendas Geral', endpoint: '/api/vendas/', params: { page_size: 20, ordering: '-id' } },
        { name: 'Vendas Hoje', endpoint: '/api/vendas/', params: { data_venda: hoje, page_size: 20, ordering: '-id' } },
        { name: 'Vendas Mês', endpoint: '/api/vendas/', params: { data_venda__gte: inicioMes, page_size: 100, ordering: '-id' } },
        { name: 'Clientes', endpoint: '/api/clientes/', params: { page_size: 20, ordering: '-id' } },
        { name: 'Produtos', endpoint: '/api/produtos/', params: { page_size: 20, ordering: '-id' } },
        { name: 'Fornecedores', endpoint: '/api/fornecedores/', params: { page_size: 10, ordering: '-id' } },
        { name: 'Categorias', endpoint: '/categorias/', params: { page_size: 10 } },
        { name: 'Usuarios', endpoint: '/api/usuarios/', params: { page_size: 5 } }
      ];

      const results = {};

      for (const { name, endpoint, params } of endpoints) {
        try {
          console.log(`📡 Testando: ${name} - ${endpoint}`);
          const response = await axiosInstance.get(endpoint, { params });

          const responseData = Array.isArray(response.data) ? response.data : response.data?.results || [];

          results[name] = {
            status: 'success',
            count: responseData.length,
            data: responseData.slice(0, 5), // Primeiros 5 itens para visualização
            total: response.data?.count || responseData.length,
            structure: responseData[0] ? Object.keys(responseData[0]) : [],
            url: `${endpoint}?${new URLSearchParams(params).toString()}`
          };

          console.log(`✅ ${name}: ${responseData.length} registros encontrados`);
        } catch (err) {
          console.error(`❌ Erro em ${name}:`, err);
          results[name] = {
            status: 'error',
            error: err.response?.data?.detail || err.message || 'Erro desconhecido',
            statusCode: err.response?.status
          };
        }
      }

      setData(results);
      console.log('📋 Resultados completos:', results);

    } catch (err) {
      console.error('❌ Erro geral no teste:', err);
      setError(`Erro geral: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testDatabaseConnections();
  }, []);

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'number' && value.toString().includes('.')) {
      return parseFloat(value).toFixed(2);
    }
    return value.toString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
        🧪 Teste de Conexéo com Banco de Dados
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Esta página testa todas as conexões com o banco de dados e mostra os dados reais disponíveis.
      </Typography>

      <Button
        variant="contained"
        onClick={testDatabaseConnections}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
        sx={{ mb: 3 }}
      >
        {loading ? 'Testando...' : 'Recarregar Testes'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {data && (
        <Grid container spacing={3}>
          {Object.entries(data).map(([endpointName, result]) => (
            <Grid item xs={12} md={6} key={endpointName}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      {endpointName}
                    </Typography>
                    <Chip
                      label={result.status === 'success' ? 'Sucesso' : 'Erro'}
                      color={result.status === 'success' ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>

                  {result.status === 'success' ? (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        📊 Registros encontrados: <strong>{result.count}</strong>
                        {result.total !== result.count && ` (Total: ${result.total})`}
                      </Typography>

                      {result.structure.length > 0 && (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            🗂️ Campos: {result.structure.join(', ')}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            🔗 URL: {result.url}
                          </Typography>
                        </>
                      )}                      {result.data.length > 0 && (
                        <>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                            Amostra de Dados:
                          </Typography>
                          <List dense>
                            {result.data.map((item, index) => (
                              <React.Fragment key={index}>
                                <ListItem>
                                  <ListItemText
                                    primary={`Registro ${index + 1}`}
                                    secondary={
                                      <Box component="span">
                                        {Object.entries(item).slice(0, 6).map(([key, value]) => (
                                          <Box key={key} component="span" sx={{ display: 'block' }}>
                                            <strong>{key}:</strong> {formatValue(value)}
                                          </Box>
                                        ))}
                                        {Object.keys(item).length > 6 && (
                                          <Typography variant="caption" color="text.secondary">
                                            ... e mais {Object.keys(item).length - 6} campos
                                          </Typography>
                                        )}
                                      </Box>
                                    }
                                  />
                                </ListItem>
                                {index < result.data.length - 1 && <Divider />}
                              </React.Fragment>
                            ))}
                          </List>
                        </>
                      )}
                    </>
                  ) : (
                    <Alert severity="error">
                      <Typography variant="body2">
                        <strong>Erro:</strong> {result.error}
                      </Typography>
                      {result.statusCode && (
                        <Typography variant="caption">
                          Status Code: {result.statusCode}
                        </Typography>
                      )}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default DatabaseTest;