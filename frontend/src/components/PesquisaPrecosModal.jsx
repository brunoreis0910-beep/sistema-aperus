import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Card, CardContent, Grid, Alert, IconButton,
  Tooltip, Divider
} from '@mui/material';
import {
  TrendingUp, TrendingDown, Remove, Refresh,
 AttachMoney, Store, LocationOn, Schedule
} from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function PesquisaPrecosModal({ open, onClose, ean, nomeProduto }) {
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState(null);
  const [raio, setRaio] = useState(5);

  useEffect(() => {
    if (open && ean) {
      pesquisar();
    }
  }, [open, ean]);

  const pesquisar = async (novoRaio = raio) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/produtos/precos-regiao/`, {
        params: { ean, raio: novoRaio }
      });
      
      if (response.data.sucesso) {
        setDados(response.data);
        
        if (response.data.precos.length === 0) {
          toast.info(`Nenhum preço encontrado num raio de ${novoRaio}km 😕`);
        } else {
          toast.success(`${response.data.precos.length} preços encontrados!`);
        }
      } else {
        toast.warning(response.data.mensagem);
        setDados(null);
      }
    } catch (error) {
      const mensagem = error.response?.data?.mensagem || 'Erro ao consultar preços';
      toast.error(mensagem);
      setDados(null);
    } finally {
      setLoading(false);
    }
  };

  const getIndicador = (valor, media) => {
    const percentual = (valor / media - 1) * 100;
    
    if (percentual < -5) {
      return {
        icon: <TrendingDown />,
        color: 'success',
        label: `${Math.abs(percentual).toFixed(0)}% mais barato`
      };
    } else if (percentual > 5) {
      return {
        icon: <TrendingUp />,
        color: 'error',
        label: `${percentual.toFixed(0)}% mais caro`
      };
    } else {
      return {
        icon: <Remove />,
        color: 'info',
        label: 'Preço médio'
      };
    }
  };

  const formatarData = (dataISO) => {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney color="primary" />
            <div>
              <Typography variant="h6">
                Inteligência de Preços - Raio de {raio}km
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {nomeProduto}
              </Typography>
            </div>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[3, 5, 10].map(r => (
              <Chip
                key={r}
                label={`${r}km`}
                onClick={() => {
                  setRaio(r);
                  pesquisar(r);
                }}
                color={raio === r ? 'primary' : 'default'}
                variant={raio === r ? 'filled' : 'outlined'}
              />
            ))}
            
            <Tooltip title="Atualizar">
              <IconButton onClick={() => pesquisar()} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress size={60} />
            <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
              Consultando concorrência num raio de {raio}km...
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Isso pode levar alguns segundos
            </Typography>
          </Box>
        )}

        {!loading && dados && dados.sucesso && (
          <>
            {/* Cards de estatísticas */}
            {dados.estatisticas && dados.estatisticas.total_amostras > 0 ? (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'success.lighter', border: '1px solid', borderColor: 'success.light' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="overline" color="success.dark">
                          Mínimo
                        </Typography>
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          R$ {dados.estatisticas.minimo.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Melhor preço encontrado
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'primary.lighter', border: '1px solid', borderColor: 'primary.light' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="overline" color="primary.dark">
                          Média
                        </Typography>
                        <Typography variant="h4" color="primary.main" fontWeight="bold">
                          R$ {dados.estatisticas.media.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Preço médio regional
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="overline" color="error.dark">
                          Máximo
                        </Typography>
                        <Typography variant="h4" color="error.main" fontWeight="bold">
                          R$ {dados.estatisticas.maximo.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Preço mais alto
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.light' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="overline" color="warning.dark">
                          Moda
                        </Typography>
                        <Typography variant="h4" color="warning.dark" fontWeight="bold">
                          R$ {dados.estatisticas.moda?.toFixed(2) || '--'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Preço mais comum
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Informações adicionais */}
                <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<Store />}
                    label={`${dados.estatisticas.total_amostras} amostras coletadas`}
                    color="primary"
                  />
                  <Chip
                    icon={<LocationOn />}
                    label={`Raio de ${raio}km`}
                  />
                  {dados.fonte && (
                    <Chip
                      label={`Fonte: ${dados.fonte}`}
                      variant="outlined"
                    />
                  )}
                  {dados.cache_hit && (
                    <Chip
                      icon={<Schedule />}
                      label="Dados em cache (últimas 24h)"
                      size="small"
                      color="info"
                    />
                  )}
                </Box>

                {/* Tabela de preços */}
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Loja Concorrente</strong></TableCell>
                      <TableCell align="right"><strong>Preço</strong></TableCell>
                      <TableCell align="center"><strong>Distância</strong></TableCell>
                      <TableCell align="center"><strong>Tendência</strong></TableCell>
                      {dados.precos[0]?.data_coleta && (
                        <TableCell align="center"><strong>Coletado em</strong></TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dados.precos.map((preco, i) => {
                      const indicador = getIndicador(preco.valor, dados.estatisticas.media);
                      
                      return (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Store fontSize="small" color="action" />
                              {preco.loja || `Concorrente ${i + 1}`}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight="bold">
                              R$ {preco.valor.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={<LocationOn />}
                              label={`${preco.distancia_km?.toFixed(1)} km`}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={indicador.label}>
                              <Chip
                                icon={indicador.icon}
                                label={indicador.label}
                                color={indicador.color}
                                size="small"
                              />
                            </Tooltip>
                          </TableCell>
                          {preco.data_coleta && (
                            <TableCell align="center">
                              <Typography variant="caption" color="text.secondary">
                                {formatarData(preco.data_coleta)}
                              </Typography>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Recomendação de preço */}
                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    💡 Recomendação de Precificação:
                  </Typography>
                  <Typography variant="body2">
                    • <strong>Preço competitivo:</strong> R$ {(dados.estatisticas.media * 0.98).toFixed(2)} (2% abaixo da média)<br />
                    • <strong>Preço médio:</strong> R$ {dados.estatisticas.media.toFixed(2)}<br />
                    • <strong>Preço premium:</strong> R$ {(dados.estatisticas.media * 1.05).toFixed(2)} (5% acima da média)
                  </Typography>
                </Alert>
              </>
            ) : (
              <Alert severity="warning">
                <Typography variant="subtitle2">
                  Nenhum preço encontrado num raio de {raio}km
                </Typography>
                <Typography variant="body2">
                  Tente aumentar o raio de busca ou verifique se o produto possui EAN cadastrado.
                </Typography>
              </Alert>
            )}
          </>
        )}

        {!loading && !dados && (
          <Alert severity="error">
            Erro ao carregar dados de preços. Tente novamente.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
