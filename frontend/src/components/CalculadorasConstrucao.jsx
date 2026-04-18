import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Grid,
  Box,
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Close as CloseIcon,
  ColorLens as ColorLensIcon,
  Scale as ScaleIcon
} from '@mui/icons-material';
import axios from 'axios';

// =============================================
// CALCULADORA DE REVESTIMENTO (m²)
// =============================================
export const CalculadoraRevestimento = ({ produto, onCalculado, open, onClose }) => {
  const [comprimento, setComprimento] = useState('');
  const [largura, setLargura] = useState('');
  const [margemQuebra, setMargemQuebra] = useState(10);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  // Limpar estado quando o modal fecha
  useEffect(() => {
    if (!open) {
      setComprimento('');
      setLargura('');
      setMargemQuebra(10);
      setResultado(null);
      setErro('');
    }
  }, [open]);

  const calcular = () => {
    const c = parseFloat(comprimento);
    const l = parseFloat(largura);
    const margem = parseFloat(margemQuebra) || 0;
    const metCaixa = parseFloat(produto.metragem_caixa);

    if (!c || !l) {
      setErro('Preencha comprimento e largura');
      return;
    }
    if (!metCaixa || metCaixa <= 0) {
      setErro('Produto não possui metragem de caixa configurada');
      return;
    }

    setErro('');
    const unidade = (produto.unidade_medida || produto.unidade || 'cx').toLowerCase();
    const vendePorMetro = unidade === 'm2' || unidade === 'm²' || unidade === 'm';

    const areaTotal = parseFloat((c * l).toFixed(2));
    const areaComMargem = parseFloat((areaTotal * (1 + margem / 100)).toFixed(2));
    const quantidadeCalculada = areaComMargem / metCaixa;
    const quantidadeCaixas = Math.ceil(quantidadeCalculada);

    // Se o produto é vendido em m², a quantidade da venda é a área com margem
    // Se é vendido em caixas/unidades, a quantidade é o número de caixas
    const quantidadeVenda = vendePorMetro ? areaComMargem : quantidadeCaixas;

    setResultado({
      area_total: areaTotal,
      area_com_margem: areaComMargem,
      metragem_caixa: metCaixa,
      margem_quebra_utilizada: margem,
      quantidade_calculada: parseFloat(quantidadeCalculada.toFixed(2)),
      quantidade_caixas: quantidadeCaixas,
      quantidade_venda: quantidadeVenda,
      vende_por_metro: vendePorMetro,
      unidade_venda: vendePorMetro ? 'm²' : (produto.unidade_medida || 'cx'),
    });
  };

  const adicionarAoCarrinho = () => {
    if (resultado && onCalculado) {
      onCalculado({
        produto: produto,
        quantidade: resultado.quantidade_venda,
        qtd_caixas: resultado.quantidade_caixas,
        area_m2: resultado.area_com_margem,
        metragem_caixa: resultado.metragem_caixa,
        obs: `Área: ${resultado.area_total}m² + ${resultado.margem_quebra_utilizada}% margem = ${resultado.area_com_margem}m² (${resultado.quantidade_caixas} cx de ${resultado.metragem_caixa}m²)`
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setComprimento('');
    setLargura('');
    setMargemQuebra(10);
    setResultado(null);
    setErro('');
    onClose();
  };

  // Proteção: não renderizar se produto não existe
  if (!produto || !produto.id_produto) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">🏗️ Calculadora de Revestimento</Typography>
            <Typography variant="caption" color="text.secondary">
              {produto?.nome_produto || produto?.nome || produto?.descricao}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {erro && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {erro}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Comprimento (m)"
                type="number"
                value={comprimento}
                onChange={(e) => setComprimento(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                autoFocus
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Largura (m)"
                type="number"
                value={largura}
                onChange={(e) => setLargura(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Margem de Quebra (%)"
                type="number"
                value={margemQuebra}
                onChange={(e) => setMargemQuebra(e.target.value)}
                inputProps={{ min: 0, max: 100, step: 0.5 }}
                helperText="Margem adicional para compensar quebras e recortes"
              />
            </Grid>
          </Grid>

          {resultado && (
            <Box sx={{ mt: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
              <Typography variant="h6" color="success.main" gutterBottom>
              ✅ Resultado do Cálculo
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Área total:</Typography>
                  <Typography variant="body1" fontWeight="bold">{resultado.area_total} m²</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Com margem ({resultado.margem_quebra_utilizada}%):</Typography>
                  <Typography variant="body1" fontWeight="bold">{resultado.area_com_margem} m²</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Metragem/caixa:</Typography>
                  <Typography variant="body1" fontWeight="bold">{resultado.metragem_caixa} m²</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Qtd. em caixas:</Typography>
                  <Typography variant="body1" fontWeight="bold">{resultado.quantidade_caixas} cx</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Chip
                    label={resultado.vende_por_metro
                      ? `Serão adicionados ${resultado.quantidade_venda} m² (${resultado.quantidade_caixas} caixas de ${resultado.metragem_caixa}m²)`
                      : `Serão adicionadas ${resultado.quantidade_caixas} caixas à venda`
                    }
                    color="success"
                    size="large"
                    sx={{ mt: 1, fontSize: '0.95rem', fontWeight: 'bold', height: 'auto', py: 0.5 }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        {!resultado ? (
          <Button
            variant="contained"
            onClick={calcular}
            startIcon={<CalculateIcon />}
          >
            Calcular
          </Button>
        ) : (
          <>
            <Button onClick={() => setResultado(null)}>Recalcular</Button>
            <Button
              variant="contained"
              color="success"
              onClick={adicionarAoCarrinho}
              startIcon={<CalculateIcon />}
            >
              Adicionar ao Carrinho
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

// =============================================
// CALCULADORA DE TINTA
// =============================================
export const CalculadoraTinta = ({ produto, onCalculado, open, onClose }) => {
  const [areaPintar, setAreaPintar] = useState('');
  const [demaos, setDemaos] = useState(2);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  const calcular = () => {
    const area = parseFloat(areaPintar);
    const nd = parseInt(demaos) || 1;
    const rendimento = parseFloat(produto.rendimento_m2);

    if (!area || area <= 0) {
      setErro('Preencha a área a pintar');
      return;
    }
    if (!rendimento || rendimento <= 0) {
      setErro('Produto não possui rendimento m² configurado');
      return;
    }

    setErro('');
    const areaTotal = parseFloat((area * nd).toFixed(2));
    const quantidadeCalculada = areaTotal / rendimento;
    const quantidadeUnidades = Math.ceil(quantidadeCalculada);

    setResultado({
      area_pintar: area,
      demaos: nd,
      area_total: areaTotal,
      rendimento_unidade: rendimento,
      quantidade_calculada: parseFloat(quantidadeCalculada.toFixed(2)),
      quantidade_unidades: quantidadeUnidades,
    });
  };

  const adicionarAoCarrinho = () => {
    if (resultado && onCalculado) {
      onCalculado({
        produto: produto,
        quantidade: resultado.quantidade_unidades,
        obs: `Área: ${resultado.area_pintar}m² × ${resultado.demaos} demão(s) = ${resultado.area_total}m²`
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setAreaPintar('');
    setDemaos(2);
    setResultado(null);
    setErro('');
    onClose();
  };

  // Proteção: não renderizar se produto não existe
  if (!produto || !produto.id_produto) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">🎨 Calculadora de Tinta</Typography>
            <Typography variant="caption" color="text.secondary">
              {produto?.nome_produto || produto?.nome || produto?.descricao}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {erro && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {erro}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Área a pintar (m²)"
                type="number"
                value={areaPintar}
                onChange={(e) => setAreaPintar(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                autoFocus
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Número de demãos"
                type="number"
                value={demaos}
                onChange={(e) => setDemaos(e.target.value)}
                inputProps={{ min: 1, max: 10, step: 1 }}
                helperText="Normalmente 2 demãos para ambientes internos"
              />
            </Grid>
          </Grid>

          {resultado && (
            <Box sx={{ mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                ✅ Resultado do Cálculo
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Área a pintar:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {resultado.area_pintar} m²
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Demãos:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {resultado.demaos}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Área total:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {resultado.area_total} m²
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Rendimento:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {resultado.rendimento_unidade} m²/{resultado.produto?.unidade || produto?.unidade_medida || 'unid'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Chip
                    label={`Você precisa de ${resultado.quantidade_unidades} ${resultado.produto?.unidade || produto?.unidade_medida || 'latas'}`}
                    color="primary"
                    size="large"
                    sx={{ mt: 1, fontSize: '1.1rem', fontWeight: 'bold' }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        {!resultado ? (
          <Button
            variant="contained"
            onClick={calcular}
            startIcon={<ColorLensIcon />}
          >
            Calcular
          </Button>
        ) : (
          <>
            <Button onClick={() => setResultado(null)}>Recalcular</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={adicionarAoCarrinho}
              startIcon={<ColorLensIcon />}
            >
              Adicionar ao Carrinho
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

// =============================================
// BADGE DE PESO TOTAL
// =============================================
export const PesoTotalBadge = ({ itens, axiosInstance }) => {
  const [pesoTotal, setPesoTotal] = useState(0);
  const [sugestaoVeiculo, setSugestaoVeiculo] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (itens && itens.length > 0) {
      calcularPeso();
    } else {
      setPesoTotal(0);
      setSugestaoVeiculo('');
    }
  }, [itens]);

  const calcularPeso = async () => {
    setLoading(true);
    try {
      const payload = {
        itens: itens.map(item => ({
          id_produto: item.id_produto || item.produto?.id_produto,
          quantidade: item.quantidade || 1
        }))
      };

      const response = await axiosInstance.post('/calculadoras/peso/', payload);
      
      setPesoTotal(response.data.peso_total);
      setSugestaoVeiculo(response.data.sugestao_veiculo);
    } catch (error) {
      console.error('Erro ao calcular peso:', error);
      setPesoTotal(0);
      setSugestaoVeiculo('');
    } finally {
      setLoading(false);
    }
  };

  if (pesoTotal === 0 || loading) return null;

  const corChip = pesoTotal > 1000 ? 'warning' : 'default';

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
      <Chip
        icon={<ScaleIcon />}
        label={`Peso Total: ${pesoTotal.toFixed(2)} kg`}
        color={corChip}
        variant="outlined"
      />
      {sugestaoVeiculo && (
        <Chip
          label={`🚚 ${sugestaoVeiculo}`}
          color={corChip}
          variant="filled"
        />
      )}
    </Box>
  );
};

// =============================================
// BOTÕES DE AÇÃO PARA PRODUTOS
// =============================================
export const BotoesCalculadora = ({ produto, onCalcularRevestimento, onCalcularTinta, parametros }) => {
  // Só mostra os botões se o usuário tiver habilitado
  const mostrarRevestimento = parametros?.habilitar_calc_revestimento && produto?.metragem_caixa;
  const mostrarTinta = parametros?.habilitar_calc_tinta && produto?.rendimento_m2;

  if (!mostrarRevestimento && !mostrarTinta) return null;

  return (
    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
      {mostrarRevestimento && (
        <Button
          size="small"
          variant="outlined"
          color="success"
          startIcon={<CalculateIcon />}
          onClick={() => onCalcularRevestimento(produto)}
        >
          Calcular m²
        </Button>
      )}
      {mostrarTinta && (
        <Button
          size="small"
          variant="outlined"
          color="primary"
          startIcon={<ColorLensIcon />}
          onClick={() => onCalcularTinta(produto)}
        >
          Calcular Tinta
        </Button>
      )}
    </Box>
  );
};

export default {
  CalculadoraRevestimento,
  CalculadoraTinta,
  PesoTotalBadge,
  BotoesCalculadora
};
