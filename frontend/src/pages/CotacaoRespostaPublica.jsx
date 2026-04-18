import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Container,
  Grid
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import axios from 'axios';

export default function CotacaoRespostaPublica() {
  const { token } = useParams();
  const [cotacao, setCotacao] = useState(null);
  const [respostas, setRespostas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [respostasEnviadas, setRespostasEnviadas] = useState(false);

  useEffect(() => {
    carregarCotacao();
  }, [token]);

  const carregarCotacao = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || '';
      const response = await axios.get(`${API_URL}/api/cotacoes/responder/${token}/`);
      
      setCotacao(response.data.cotacao);
      setRespostasEnviadas(response.data.respostas_enviadas);
      
      // Inicializar respostas vazias
      const respostasIniciais = response.data.itens.map(item => ({
        id_cotacao_item: item.id_cotacao_item,
        valor_unitario: '',
        prazo_entrega_dias: '',
        observacoes: ''
      }));
      setRespostas(respostasIniciais);
    } catch (error) {
      console.error('Erro ao carregar cotação:', error);
      setErro('Token inválido ou cotação não encontrada');
    } finally {
      setLoading(false);
    }
  };

  const atualizarResposta = (index, campo, valor) => {
    const novasRespostas = [...respostas];
    novasRespostas[index][campo] = valor;
    setRespostas(novasRespostas);
  };

  const enviarRespostas = async () => {
    // Validação
    const respostasValidas = respostas.filter(r => r.valor_unitario !== '' && parseFloat(r.valor_unitario) > 0);
    
    if (respostasValidas.length === 0) {
      setErro('Informe o valor unitário de pelo menos um item');
      return;
    }

    try {
      setLoading(true);
      setErro('');
      
      const API_URL = process.env.REACT_APP_API_URL || '';
      
      // Enviar apenas respostas com valor preenchido
      const respostasParaEnviar = respostasValidas.map(r => ({
        id_cotacao_item: r.id_cotacao_item.toString(),
        valor_unitario: r.valor_unitario.toString(),
        prazo_entrega_dias: r.prazo_entrega_dias ? r.prazo_entrega_dias.toString() : null,
        observacoes: r.observacoes || ''
      }));

      await axios.post(`${API_URL}/api/cotacoes/responder/${token}/`, {
        respostas: respostasParaEnviar
      });
      
      setSucesso('Respostas enviadas com sucesso! Obrigado por participar da cotação.');
      setRespostasEnviadas(true);
    } catch (error) {
      console.error('Erro ao enviar respostas:', error);
      setErro(error.response?.data?.error || 'Erro ao enviar respostas');
    } finally {
      setLoading(false);
    }
  };

  const calcularTotal = (valorUnitario, quantidade) => {
    if (!valorUnitario || !quantidade) return 0;
    return parseFloat(valorUnitario) * parseFloat(quantidade);
  };

  if (loading && !cotacao) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5">Carregando...</Typography>
      </Container>
    );
  }

  if (erro && !cotacao) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{erro}</Alert>
      </Container>
    );
  }

  if (!cotacao) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Resposta de Cotação
        </Typography>

        {sucesso && <Alert severity="success" sx={{ mb: 3 }}>{sucesso}</Alert>}
        {erro && <Alert severity="error" sx={{ mb: 3 }}>{erro}</Alert>}

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Número:</strong> {cotacao.numero_cotacao}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Data:</strong> {new Date(cotacao.data_cotacao).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Prazo de Resposta:</strong> {new Date(cotacao.prazo_resposta).toLocaleDateString()}
            </Typography>
          </Grid>
          {cotacao.observacoes && (
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Observações:</strong> {cotacao.observacoes}
              </Typography>
            </Grid>
          )}
        </Grid>

        {respostasEnviadas ? (
          <Alert severity="info">
            Você já enviou suas respostas para esta cotação. Entre em contato caso precise fazer alguma alteração.
          </Alert>
        ) : (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Informe os valores para cada produto:
            </Typography>

            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell>Quantidade</TableCell>
                    <TableCell>Unidade</TableCell>
                    <TableCell>Valor Unitário (R$)</TableCell>
                    <TableCell>Valor Total (R$)</TableCell>
                    <TableCell>Prazo Entrega (dias)</TableCell>
                    <TableCell>Observações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {respostas.map((resposta, index) => {
                    const item = cotacao.itens?.[index];
                    if (!item) return null;

                    return (
                      <TableRow key={resposta.id_cotacao_item}>
                        <TableCell>{item.produto}</TableCell>
                        <TableCell>{item.quantidade_solicitada}</TableCell>
                        <TableCell>{item.unidade_medida}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={resposta.valor_unitario}
                            onChange={(e) => atualizarResposta(index, 'valor_unitario', e.target.value)}
                            size="small"
                            fullWidth
                            inputProps={{ step: '0.01', min: '0' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography>
                            {calcularTotal(resposta.valor_unitario, item.quantidade_solicitada).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={resposta.prazo_entrega_dias}
                            onChange={(e) => atualizarResposta(index, 'prazo_entrega_dias', e.target.value)}
                            size="small"
                            fullWidth
                            inputProps={{ min: '0' }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={resposta.observacoes}
                            onChange={(e) => atualizarResposta(index, 'observacoes', e.target.value)}
                            size="small"
                            fullWidth
                            multiline
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SendIcon />}
                onClick={enviarRespostas}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Respostas'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}
