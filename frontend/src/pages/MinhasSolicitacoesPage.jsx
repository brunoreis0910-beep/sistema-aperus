import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  PendingActions as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const MinhasSolicitacoesPage = () => {
  const { axiosInstance } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [dialogDetalhes, setDialogDetalhes] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);

  const carregarSolicitacoes = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/solicitacoes/minhas_solicitacoes/');
      setSolicitacoes(response.data);
      setMensagem({ tipo: '', texto: '' });
    } catch (error) {
      console.error('Erro ao carregar minhas solicitações:', error);
      setMensagem({
        tipo: 'error',
        texto: 'Erro ao carregar suas solicitações'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarSolicitacoes();
  }, []);

  const visualizarDetalhes = (solicitacao) => {
    setSolicitacaoSelecionada(solicitacao);
    setDialogDetalhes(true);
  };

  const formatarData = (dataString) => {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  };

  const getChipConfig = (status) => {
    switch (status) {
      case 'Pendente':
        return { color: 'warning', icon: <PendingIcon />, label: 'Pendente' };
      case 'Aprovada':
        return { color: 'success', icon: <ApprovedIcon />, label: 'Aprovada' };
      case 'Rejeitada':
        return { color: 'error', icon: <RejectedIcon />, label: 'Rejeitada' };
      default:
        return { color: 'default', icon: null, label: status };
    }
  };

  const renderDadosSolicitacao = (dados) => {
    if (!dados) return 'Sem dados';

    try {
      const dadosObj = typeof dados === 'string' ? JSON.parse(dados) : dados;
      return (
        <Box>
          {Object.entries(dadosObj).map(([chave, valor]) => (
            <Typography key={chave} variant="body2" sx={{ mb: 0.5 }}>
              <strong>{chave}:</strong> {JSON.stringify(valor)}
            </Typography>
          ))}
        </Box>
      );
    } catch (error) {
      return <Typography variant="body2">{dados}</Typography>;
    }
  };

  const getBorderColor = (status) => {
    switch (status) {
      case 'Pendente':
        return 'warning.main';
      case 'Aprovada':
        return 'success.main';
      case 'Rejeitada':
        return 'error.main';
      default:
        return 'grey.300';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          p: 3,
          mb: 3,
          color: 'white'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Minhas Solicitações
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
              Acompanhe o status das suas solicitações de aprovação
            </Typography>
          </Box>
          <Tooltip title="Atualizar">
            <IconButton
              onClick={carregarSolicitacoes}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Estatísticas Rápidas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ backgroundColor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="warning.dark">
                {solicitacoes.filter(s => s.status === 'Pendente').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pendentes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ backgroundColor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="success.dark">
                {solicitacoes.filter(s => s.status === 'Aprovada').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Aprovadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ backgroundColor: '#ffebee', borderLeft: '4px solid #f44336' }}>
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="error.dark">
                {solicitacoes.filter(s => s.status === 'Rejeitada').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Rejeitadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mensagens */}
      {mensagem.texto && (
        <Alert
          severity={mensagem.tipo}
          onClose={() => setMensagem({ tipo: '', texto: '' })}
          sx={{ mb: 2 }}
        >
          {mensagem.texto}
        </Alert>
      )}

      {/* Lista de Solicitações */}
      {solicitacoes.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" color="textSecondary" align="center" py={3}>
              Você ainda não possui solicitações
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {solicitacoes.map((solicitacao) => {
            const chipConfig = getChipConfig(solicitacao.status);
            return (
              <Grid item xs={12} md={6} key={solicitacao.id_solicitacao}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    borderLeft: '4px solid',
                    borderLeftColor: getBorderColor(solicitacao.status),
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardContent>
                    {/* Cabeçalho do Card */}
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {solicitacao.tipo_solicitacao.toUpperCase()}
                        </Typography>
                        <Chip
                          label={chipConfig.label}
                          color={chipConfig.color}
                          icon={chipConfig.icon}
                          size="small"
                        />
                      </Box>
                      <Tooltip title="Ver Detalhes">
                        <IconButton
                          size="small"
                          onClick={() => visualizarDetalhes(solicitacao)}
                          sx={{ color: 'primary.main' }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Informações */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        <strong>Supervisor:</strong>{' '}
                        {solicitacao.supervisor?.first_name} {solicitacao.supervisor?.last_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        <strong>Data Solicitação:</strong> {formatarData(solicitacao.data_solicitacao)}
                      </Typography>
                      {solicitacao.data_aprovacao && (
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          <strong>Data Resposta:</strong> {formatarData(solicitacao.data_aprovacao)}
                        </Typography>
                      )}
                      {solicitacao.observacao_solicitante && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          <strong>Sua Observação:</strong> {solicitacao.observacao_solicitante}
                        </Typography>
                      )}
                      {solicitacao.observacao_supervisor && (
                        <Box
                          sx={{
                            mt: 1,
                            p: 1,
                            backgroundColor: 'grey.100',
                            borderRadius: 1
                          }}
                        >
                          <Typography variant="body2" color="textSecondary">
                            <strong>Resposta do Supervisor:</strong>
                          </Typography>
                          <Typography variant="body2">
                            {solicitacao.observacao_supervisor}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Dialog de Detalhes */}
      <Dialog
        open={dialogDetalhes}
        onClose={() => setDialogDetalhes(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalhes da Solicitação</DialogTitle>
        <DialogContent>
          {solicitacaoSelecionada && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {solicitacaoSelecionada.tipo_solicitacao.toUpperCase()}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Supervisor:</strong>
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {solicitacaoSelecionada.supervisor?.first_name}{' '}
                    {solicitacaoSelecionada.supervisor?.last_name}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Status:</strong>
                  </Typography>
                  <Chip
                    label={solicitacaoSelecionada.status}
                    color={getChipConfig(solicitacaoSelecionada.status).color}
                    icon={getChipConfig(solicitacaoSelecionada.status).icon}
                    sx={{ mt: 0.5 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Data Solicitação:</strong>
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {formatarData(solicitacaoSelecionada.data_solicitacao)}
                  </Typography>
                </Grid>

                {solicitacaoSelecionada.data_aprovacao && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Data Resposta:</strong>
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {formatarData(solicitacaoSelecionada.data_aprovacao)}
                    </Typography>
                  </Grid>
                )}

                {solicitacaoSelecionada.observacao_solicitante && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Sua Observação:</strong>
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {solicitacaoSelecionada.observacao_solicitante}
                    </Typography>
                  </Grid>
                )}

                {solicitacaoSelecionada.observacao_supervisor && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Resposta do Supervisor:</strong>
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        p: 2,
                        backgroundColor: 'grey.100',
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="body1">
                        {solicitacaoSelecionada.observacao_supervisor}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Dados da Solicitação:</strong>
                  </Typography>
                  <Box
                    sx={{
                      mt: 1,
                      p: 2,
                      backgroundColor: 'grey.100',
                      borderRadius: 1,
                      maxHeight: 300,
                      overflow: 'auto'
                    }}
                  >
                    {renderDadosSolicitacao(solicitacaoSelecionada.dados_solicitacao)}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDetalhes(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MinhasSolicitacoesPage;
