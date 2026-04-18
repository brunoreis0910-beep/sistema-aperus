import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  Autocomplete,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocalOffer as PromoIcon,
  DateRange as DateIcon,
  AttachMoney as MoneyIcon,
  LocalFireDepartment as HighDemandIcon,
  WhatsApp as WhatsAppIcon,
  People as PeopleIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MapaPromocaoPage = () => {
  const { user, permissions, isLoading: authLoading } = useAuth();
  const [promocoes, setPromocoes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detalhesDialogOpen, setDetalhesDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  const [formData, setFormData] = useState({
    nome_promocao: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    tipo_desconto: 'percentual',
    valor_desconto: '',
    tipo_criterio: 'quantidade',
    status: 'ativa',
    produtos: [],
  });

  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [quantidadesProdutos, setQuantidadesProdutos] = useState({});
  const [descontosProdutos, setDescontosProdutos] = useState({});

  // Estado para WhatsApp
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [whatsappData, setWhatsappData] = useState(null);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [mensagemWhatsapp, setMensagemWhatsapp] = useState('');
  const [erroWhatsapp, setErroWhatsapp] = useState('');
  const [imagensCopiadas, setImagensCopiadas] = useState({});

  // Filtros do dialog de criação de promoção
  const [filtroMarcaDialog, setFiltroMarcaDialog] = useState('');
  const [filtroGrupoDialog, setFiltroGrupoDialog] = useState('');

  // WhatsApp: tipo de envio (marca | todos) e filtro de gênero
  const [tipoEnvioWhatsapp, setTipoEnvioWhatsapp] = useState('marca');
  const [filtroGeneroWhatsapp, setFiltroGeneroWhatsapp] = useState('todos');

  useEffect(() => {
    carregarPromocoes();
    carregarProdutos();
  }, []);

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user?.is_staff && !permissions?.mapa_promocao_acessar) {
    return (
      <Box p={3}>
        <Alert severity="warning">Você não tem permissão para acessar Mapa de Promoção.</Alert>
      </Box>
    );
  }

  const carregarPromocoes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/promocoes/');
      const _d = response.data;
      setPromocoes(Array.isArray(_d) ? _d : Array.isArray(_d?.results) ? _d.results : []);
    } catch (error) {
      console.error('Erro ao carregar promoções:', error);
      alert('Erro ao carregar promoções');
    } finally {
      setLoading(false);
    }
  };

  const carregarProdutos = async () => {
    try {
      const response = await api.get('/api/produtos/');
      const _d = response.data;
      setProdutos(Array.isArray(_d) ? _d : Array.isArray(_d?.results) ? _d.results : []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handleAbrirDialog = (promocao = null) => {
    if (promocao) {
      setFormData({
        nome_promocao: promocao.nome_promocao,
        descricao: promocao.descricao || '',
        data_inicio: promocao.data_inicio?.substring(0, 16) || '',
        data_fim: promocao.data_fim?.substring(0, 16) || '',
        tipo_desconto: promocao.tipo_desconto,
        valor_desconto: promocao.valor_desconto,
        tipo_criterio: promocao.tipo_criterio,
        status: promocao.status,
        produtos: [],
      });
      setSelectedPromotion(promocao);
    } else {
      setFormData({
        nome_promocao: '',
        descricao: '',
        data_inicio: '',
        data_fim: '',
        tipo_desconto: 'percentual',
        valor_desconto: '',
        tipo_criterio: 'quantidade',
        status: 'ativa',
        produtos: [],
      });
      setSelectedPromotion(null);
    }
    setProdutosSelecionados([]);
    setQuantidadesProdutos({});
    setDescontosProdutos({});
    setFiltroMarcaDialog('');
    setFiltroGrupoDialog('');
    setDialogOpen(true);
  };

  const handleSalvarPromocao = async () => {
    try {
      if (!formData.nome_promocao || !formData.data_inicio || !formData.data_fim || !formData.valor_desconto) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }

      const payload = {
        ...formData,
        valor_desconto: parseFloat(formData.valor_desconto),
        produtos: produtosSelecionados.map(p => {
          const produtoPayload = {
            id_produto: p.id_produto,
            quantidade_minima: parseInt(quantidadesProdutos[p.id_produto] || 1)
          };

          // Incluir desconto individual apenas se foi preenchido
          const descontoIndividual = descontosProdutos[p.id_produto];
          if (descontoIndividual !== undefined && descontoIndividual !== '' && descontoIndividual !== null) {
            produtoPayload.valor_desconto = parseFloat(descontoIndividual);
          }

          return produtoPayload;
        }),
      };

      if (selectedPromotion) {
        // Atualizar
        await api.put(`/promocoes/${selectedPromotion.id_promocao}/`, payload);
        alert('Promoção atualizada com sucesso!');
      } else {
        // Criar
        await api.post('/api/promocoes/', payload);
        alert('Promoção criada com sucesso!');
      }

      setDialogOpen(false);
      carregarPromocoes();
    } catch (error) {
      console.error('Erro ao salvar promoção:', error);

      // Extrair mensagens de erro detalhadas
      let errorMessage = 'Erro ao salvar promoção';

      if (error.response?.data) {
        const data = error.response.data;

        // Se for um objeto com campos, mostrar quais campos têm erro
        if (typeof data === 'object' && !Array.isArray(data)) {
          const fieldErrors = Object.entries(data)
            .filter(([key, val]) => Array.isArray(val) || typeof val === 'string')
            .map(([field, errors]) => {
              const msg = Array.isArray(errors) ? errors[0] : errors;
              return `${field}: ${msg}`;
            })
            .join('\n');

          if (fieldErrors) {
            errorMessage = `Erro ao salvar promoção:\n${fieldErrors}`;
          } else {
            errorMessage = `Erro ao salvar promoção: ${JSON.stringify(data)}`;
          }
        } else if (data.detail) {
          errorMessage = `Erro ao salvar promoção: ${data.detail}`;
        }
      } else {
        errorMessage = `Erro ao salvar promoção: ${error.message}`;
      }

      alert(errorMessage);
    }
  };

  const handleDeletarPromocao = async () => {
    try {
      await api.delete(`/promocoes/${selectedPromotion.id_promocao}/`);
      alert('Promoção deletada com sucesso!');
      setDeleteDialogOpen(false);
      carregarPromocoes();
    } catch (error) {
      console.error('Erro ao deletar promoção:', error);
      alert('Erro ao deletar promoção');
    }
  };

  const handleVerDetalhes = (promocao) => {
    setSelectedPromotion(promocao);
    setDetalhesDialogOpen(true);
  };

  const formatarData = (data) => {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const obterCorStatus = (status, estaAtiva) => {
    if (estaAtiva) return 'success';
    if (status === 'inativa') return 'default';
    return 'error';
  };

  const obterTextStatus = (status, estaAtiva) => {
    if (estaAtiva) return '✓ ATIVA';
    if (status === 'inativa') return 'Inativa';
    return 'Expirada';
  };

  const handleAbrirWhatsapp = async (promocao, tipoEnvio = 'marca') => {
    setSelectedPromotion(promocao);
    setWhatsappLoading(true);
    setWhatsappDialogOpen(true);
    setWhatsappData(null);
    setErroWhatsapp('');
    setTipoEnvioWhatsapp(tipoEnvio);
    setFiltroGeneroWhatsapp('todos');

    try {
      const response = await api.get(`/api/promocoes/${promocao.id_promocao}/clientes_por_marca/?tipo_envio=${tipoEnvio}`);
      const data = response.data;
      setWhatsappData(data);

      // Gerar mensagem padrão com produtos em promoção (apenas os da promoção)
      const marcas = data.marcas?.join(', ') || '';

      const linhasProdutos = (data.produtos_promocao || []).map(p => {
        const desconto =
          promocao.tipo_desconto === 'percentual'
            ? `${p.desconto}% OFF`
            : `R$ ${parseFloat(p.desconto).toFixed(2)} de desconto`;

        let linha = `• *${p.nome}*`;
        if (p.preco_original) {
          linha += ` — De R$ ${parseFloat(p.preco_original).toFixed(2)} por R$ ${parseFloat(p.preco_promocional || p.preco_original).toFixed(2)} (${desconto})`;
        } else {
          linha += ` — ${desconto}`;
        }
        if (p.imagem_url) {
          linha += `\n  📷 ${p.imagem_url}`;
        }
        return linha;
      }).join('\n');

      setMensagemWhatsapp(
        `Olá, {nome}! 👋\n\n` +
        `Temos uma promoção especial para você: *${promocao.nome_promocao}*! 🎉\n\n` +
        `Como cliente que já comprou produtos *${marcas}*, confira as ofertas exclusivas:\n\n` +
        `${linhasProdutos}\n\n` +
        `Promoção válida até ${formatarData(promocao.data_fim)}.\n\n` +
        `Aproveite! 😊`
      );
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      const detalhe = error.response?.data?.detail || error.response?.data?.error || error.message || 'Erro desconhecido';
      setErroWhatsapp(`Erro ao buscar clientes: ${detalhe}`);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleTrocarTipoEnvio = async (novoTipo) => {
    if (!selectedPromotion || novoTipo === tipoEnvioWhatsapp) return;
    setTipoEnvioWhatsapp(novoTipo);
    setWhatsappLoading(true);
    setErroWhatsapp('');
    setFiltroGeneroWhatsapp('todos');
    try {
      const response = await api.get(`/api/promocoes/${selectedPromotion.id_promocao}/clientes_por_marca/?tipo_envio=${novoTipo}`);
      setWhatsappData(response.data);
    } catch (error) {
      const detalhe = error.response?.data?.detail || error.response?.data?.error || error.message || 'Erro desconhecido';
      setErroWhatsapp(`Erro ao buscar clientes: ${detalhe}`);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const getClientesFiltrados = () => {
    if (!whatsappData?.clientes) return [];
    if (filtroGeneroWhatsapp === 'todos') return whatsappData.clientes;
    // Filtrar diretamente pelo sexo cadastrado no cliente
    const sexoMap = { 'masculino': 'M', 'feminino': 'F' };
    const sexoFiltro = sexoMap[filtroGeneroWhatsapp];
    if (!sexoFiltro) return whatsappData.clientes;
    return whatsappData.clientes.filter(c => c.sexo === sexoFiltro);
  };

  const limparTelefone = (tel) => {
    if (!tel) return '';
    return tel.replace(/\D/g, '');
  };

  // Baixar imagem do produto (funciona para base64 e URLs)
  const baixarImagem = (url, nome) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nome.replace(/[^a-z0-9]/gi, '_')}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copiar imagem para a área de transferência (base64 ou URL via fetch)
  const copiarImagemParaClipboard = async (url, idProduto) => {
    if (!url || !navigator.clipboard) return false;
    try {
      let blob;
      if (url.startsWith('data:')) {
        const [meta, b64] = url.split(',');
        const mime = meta.match(/:(.*?);/)[1];
        const bytes = atob(b64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        blob = new Blob([arr], { type: mime });
      } else {
        const resp = await fetch(url, { mode: 'cors' });
        blob = await resp.blob();
      }
      const pngBlob = blob.type === 'image/png' ? blob : await convertToBlob(blob);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      setImagensCopiadas(prev => ({ ...prev, [idProduto]: true }));
      setTimeout(() => setImagensCopiadas(prev => { const n = { ...prev }; delete n[idProduto]; return n; }), 2500);
      return true;
    } catch {
      return false;
    }
  };

  const convertToBlob = (blob) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob(b => { URL.revokeObjectURL(url); resolve(b); }, 'image/png');
      };
      img.src = url;
    });
  };

  const gerarLinkWhatsapp = (cliente) => {
    const numero = limparTelefone(cliente.whatsapp) || limparTelefone(cliente.telefone);
    if (!numero) return null;
    const numeroFinal = numero.startsWith('55') ? numero : `55${numero}`;
    const mensagem = mensagemWhatsapp.replace('{nome}', cliente.nome.split(' ')[0]);
    return `https://wa.me/${numeroFinal}?text=${encodeURIComponent(mensagem)}`;
  };

  // Abre WhatsApp e tenta copiar a primeira imagem disponível para a área de transferência
  const abrirWhatsappComImagem = async (cliente) => {
    const link = gerarLinkWhatsapp(cliente);
    if (!link) return;
    const primeiraImagem = whatsappData?.produtos_promocao?.find(p => p.imagem_url);
    if (primeiraImagem) {
      await copiarImagemParaClipboard(primeiraImagem.imagem_url, `wpp_${cliente.id_cliente}`);
    }
    window.open(link, '_blank');
  };

  const handleEnviarParaTodos = () => {
    const clientesFiltrados = getClientesFiltrados();
    if (!clientesFiltrados.length) return;
    const comContato = clientesFiltrados.filter(c => !!gerarLinkWhatsapp(c));
    if (comContato.length === 0) {
      alert('Nenhum cliente possui WhatsApp ou telefone cadastrado.');
      return;
    }
    const confirmar = window.confirm(
      `Isso vai abrir ${comContato.length} aba(s) do WhatsApp no seu navegador.\n\nContinuar?`
    );
    if (!confirmar) return;
    comContato.forEach((cliente, i) => {
      const link = gerarLinkWhatsapp(cliente);
      if (link) setTimeout(() => window.open(link, '_blank'), i * 600);
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          <PromoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Mapa de Promoção
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => handleAbrirDialog()}
        >
          Nova Promoção
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Promoções Ativas
              </Typography>
              <Typography variant="h5" sx={{ color: '#4caf50' }}>
                {promocoes.filter(p => p.esta_ativa).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Promoções Inativas
              </Typography>
              <Typography variant="h5" sx={{ color: '#f44336' }}>
                {promocoes.filter(p => !p.esta_ativa).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Produtos em Promoção
              </Typography>
              <Typography variant="h5" sx={{ color: '#2196f3' }}>
                {promocoes.reduce((acc, p) => acc + (p.promocao_produtos?.length || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Promoções
              </Typography>
              <Typography variant="h5" sx={{ color: '#ff9800' }}>
                {promocoes.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Período</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Desconto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Produtos</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {promocoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">Nenhuma promoção cadastrada</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                promocoes.map((promo) => (
                  <TableRow key={promo.id_promocao} hover>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {promo.nome_promocao}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ fontSize: '0.85rem' }}>
                        <Box>📅 {formatarData(promo.data_inicio)}</Box>
                        <Box>📅 {formatarData(promo.data_fim)}</Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          promo.tipo_desconto === 'percentual'
                            ? `${promo.valor_desconto}%`
                            : `R$ ${promo.valor_desconto}`
                        }
                        color={promo.tipo_desconto === 'percentual' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${promo.promocao_produtos?.length || 0} produtos`}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={obterTextStatus(promo.status, promo.esta_ativa)}
                        color={obterCorStatus(promo.status, promo.esta_ativa)}
                        size="small"
                        icon={promo.esta_ativa ? <HighDemandIcon /> : undefined}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Visualizar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleVerDetalhes(promo)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Notificar Clientes via WhatsApp">
                        <IconButton
                          size="small"
                          sx={{ color: '#25D366' }}
                          onClick={() => handleAbrirWhatsapp(promo)}
                        >
                          <WhatsAppIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleAbrirDialog(promo)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deletar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedPromotion(promo);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Dialog: Criar/Editar Promoção */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
          {selectedPromotion ? 'Editar Promoção' : 'Nova Promoção'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            {/* Nome */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome da Promoção *"
                value={formData.nome_promocao}
                onChange={(e) => setFormData({ ...formData, nome_promocao: e.target.value })}
                placeholder="ex: Liquidação de Verão"
                required
                error={!formData.nome_promocao}
                helperText={!formData.nome_promocao ? 'Campo obrigatório' : ''}
              />
            </Grid>

            {/* Descrição */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva os detalhes da promoção"
                multiline
                rows={2}
              />
            </Grid>

            {/* Data Início */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Data Início *"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                error={!formData.data_inicio}
                helperText={!formData.data_inicio ? 'Campo obrigatório' : ''}
              />
            </Grid>

            {/* Data Fim */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Data Fim *"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                error={!formData.data_fim}
                helperText={!formData.data_fim ? 'Campo obrigatório' : ''}
              />
            </Grid>

            {/* Tipo Desconto */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Desconto</InputLabel>
                <Select
                  value={formData.tipo_desconto}
                  label="Tipo de Desconto"
                  onChange={(e) => setFormData({ ...formData, tipo_desconto: e.target.value })}
                >
                  <MenuItem value="percentual">Percentual (%)</MenuItem>
                  <MenuItem value="unidade">Valor por Unidade (R$)</MenuItem>
                  <MenuItem value="valor">Valor Total (R$)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Valor Desconto */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label={
                  formData.tipo_desconto === 'percentual'
                    ? 'Percentual (%) *'
                    : 'Valor (R$) *'
                }
                value={formData.valor_desconto}
                onChange={(e) => setFormData({ ...formData, valor_desconto: e.target.value })}
                inputProps={{ step: '0.01', min: '0' }}
                required={true}
                error={!formData.valor_desconto}
                helperText={!formData.valor_desconto ? 'Campo obrigatório' : ''}
              />
            </Grid>

            {/* Tipo Critério */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Critério de Seleção</InputLabel>
                <Select
                  value={formData.tipo_criterio}
                  label="Critério de Seleção"
                  onChange={(e) => setFormData({ ...formData, tipo_criterio: e.target.value })}
                >
                  <MenuItem value="quantidade">Por Quantidade</MenuItem>
                  <MenuItem value="valor">Por Valor</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="ativa">Ativa</MenuItem>
                  <MenuItem value="inativa">Inativa</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Produtos */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Selecione Produtos
              </Typography>

              {/* Filtros de marca/grupo */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Filtrar por Marca</InputLabel>
                  <Select
                    value={filtroMarcaDialog}
                    label="Filtrar por Marca"
                    onChange={(e) => setFiltroMarcaDialog(e.target.value)}
                  >
                    <MenuItem value="">Todas as marcas</MenuItem>
                    {[...new Set(produtos.map(p => p.marca).filter(Boolean))].sort().map(m => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Filtrar por Grupo</InputLabel>
                  <Select
                    value={filtroGrupoDialog}
                    label="Filtrar por Grupo"
                    onChange={(e) => setFiltroGrupoDialog(e.target.value)}
                  >
                    <MenuItem value="">Todos os grupos</MenuItem>
                    {[...new Map(
                      produtos.filter(p => p.id_grupo).map(p => [String(p.id_grupo), p.grupo_nome || String(p.id_grupo)])
                    ).entries()].map(([id, nome]) => (
                      <MenuItem key={id} value={id}>{nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Autocomplete
                multiple
                options={produtos.filter(p => {
                  if (filtroMarcaDialog && p.marca !== filtroMarcaDialog) return false;
                  if (filtroGrupoDialog && String(p.id_grupo) !== filtroGrupoDialog) return false;
                  return true;
                })}
                getOptionLabel={(option) =>
                  `${option.codigo_produto} - ${option.nome_produto}${option.valor_venda ? ` | R$ ${parseFloat(option.valor_venda).toFixed(2)}` : ''}`
                }
                value={produtosSelecionados}
                onChange={(e, newValue) => {
                  setProdutosSelecionados(newValue);
                  // Inicializar quantidade e desconto para novos produtos
                  const novasQuantidades = { ...quantidadesProdutos };
                  const novosDescontos = { ...descontosProdutos };
                  newValue.forEach(prod => {
                    if (!novasQuantidades[prod.id_produto]) {
                      novasQuantidades[prod.id_produto] = 1;
                    }
                    if (!novosDescontos[prod.id_produto]) {
                      novosDescontos[prod.id_produto] = formData.valor_desconto;
                    }
                  });
                  setQuantidadesProdutos(novasQuantidades);
                  setDescontosProdutos(novosDescontos);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Adicionar produtos à promoção"
                    placeholder="Procurar produto..."
                  />
                )}
              />

              {/* Produtos Selecionados */}
              {produtosSelecionados.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                    {produtosSelecionados.length} Produto(s) Selecionado(s) - Configure Quantidade Mínima e Desconto:
                  </Typography>
                  <Grid container spacing={2}>
                    {produtosSelecionados.map((prod) => (
                      <Grid item xs={12} key={prod.id_produto}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                          <Typography sx={{ flex: 1, minWidth: 200 }}>
                            <strong>{prod.codigo_produto}</strong> - {prod.nome_produto}
                          </Typography>
                          <TextField
                            type="number"
                            label="Qtd. Mínima"
                            size="small"
                            inputProps={{ min: 1, step: 1 }}
                            value={quantidadesProdutos.hasOwnProperty(prod.id_produto) ? quantidadesProdutos[prod.id_produto] : 1}
                            onChange={(e) => {
                              const novoValor = e.target.value;
                              setQuantidadesProdutos({
                                ...quantidadesProdutos,
                                [prod.id_produto]: novoValor === '' ? '' : Math.max(1, parseInt(novoValor) || 1)
                              });
                            }}
                            onBlur={(e) => {
                              // Sempre garantir valor válido ao sair
                              const valor = quantidadesProdutos[prod.id_produto];
                              setQuantidadesProdutos({
                                ...quantidadesProdutos,
                                [prod.id_produto]: Math.max(1, parseInt(valor) || 1)
                              });
                            }}
                            sx={{ width: 120 }}
                          />
                          <TextField
                            type="number"
                            label={formData.tipo_desconto === 'percentual' ? 'Desconto % (opcional)' : 'Desconto R$ (opcional)'}
                            size="small"
                            inputProps={{ min: 0, step: 0.01 }}
                            value={descontosProdutos.hasOwnProperty(prod.id_produto) ? descontosProdutos[prod.id_produto] : ''}
                            onChange={(e) => {
                              const novoValor = e.target.value;
                              setDescontosProdutos({
                                ...descontosProdutos,
                                [prod.id_produto]: novoValor
                              });
                            }}
                            onBlur={(e) => {
                              // Se estiver vazio, remover do objeto (vai usar o padrão)
                              const valor = descontosProdutos[prod.id_produto];
                              if (valor === '' || valor === undefined || valor === null) {
                                const novosDescontos = { ...descontosProdutos };
                                delete novosDescontos[prod.id_produto];
                                setDescontosProdutos(novosDescontos);
                              } else {
                                // Se tiver valor, validar
                                setDescontosProdutos({
                                  ...descontosProdutos,
                                  [prod.id_produto]: Math.max(0, parseFloat(valor) || 0)
                                });
                              }
                            }}
                            sx={{ width: 160 }}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setProdutosSelecionados(
                                produtosSelecionados.filter((p) => p.id_produto !== prod.id_produto)
                              );
                              const novasQuantidades = { ...quantidadesProdutos };
                              const novosDescontos = { ...descontosProdutos };
                              delete novasQuantidades[prod.id_produto];
                              delete novosDescontos[prod.id_produto];
                              setQuantidadesProdutos(novasQuantidades);
                              setDescontosProdutos(novosDescontos);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSalvarPromocao}
            variant="contained"
            color="success"
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Detalhes */}
      {selectedPromotion && (
        <Dialog open={detalhesDialogOpen} onClose={() => setDetalhesDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 'bold' }}>
            Detalhes da Promoção
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {selectedPromotion.nome_promocao}
                </Typography>
                <Typography color="textSecondary">
                  {selectedPromotion.descricao}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  📅 Data Início
                </Typography>
                <Typography>{formatarData(selectedPromotion.data_inicio)}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  📅 Data Fim
                </Typography>
                <Typography>{formatarData(selectedPromotion.data_fim)}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  💰 Desconto
                </Typography>
                <Typography>
                  {selectedPromotion.tipo_desconto === 'percentual'
                    ? `${selectedPromotion.valor_desconto}%`
                    : formatarMoeda(selectedPromotion.valor_desconto)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  ✓ Status
                </Typography>
                <Chip
                  label={obterTextStatus(selectedPromotion.status, selectedPromotion.esta_ativa)}
                  color={obterCorStatus(selectedPromotion.status, selectedPromotion.esta_ativa)}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  📦 Produtos em Promoção
                </Typography>
                {selectedPromotion.promocao_produtos && selectedPromotion.promocao_produtos.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell>Código</TableCell>
                          <TableCell>Produto</TableCell>
                          <TableCell align="right">Valor Mín.</TableCell>
                          <TableCell align="right">Qtd. Mín.</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedPromotion.promocao_produtos.map((item) => (
                          <TableRow key={item.id_promocao_produto}>
                            <TableCell>{item.codigo_produto}</TableCell>
                            <TableCell>{item.nome_produto}</TableCell>
                            <TableCell align="right">
                              {item.valor_minimo_venda
                                ? formatarMoeda(item.valor_minimo_venda)
                                : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {item.quantidade_minima || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="textSecondary">Nenhum produto em promoção</Typography>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDetalhesDialogOpen(false)}>Fechar</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Dialog: Confirmar Exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja deletar a promoção "{selectedPromotion?.nome_promocao}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeletarPromocao} color="error" variant="contained">
            Deletar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Notificar Clientes via WhatsApp */}
      <Dialog
        open={whatsappDialogOpen}
        onClose={() => setWhatsappDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#25D366', color: 'white', fontWeight: 'bold' }}>
          <WhatsAppIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Notificar Clientes via WhatsApp — {selectedPromotion?.nome_promocao}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {whatsappLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress sx={{ color: '#25D366' }} />
              <Typography sx={{ ml: 2 }}>Buscando clientes...</Typography>
            </Box>
          ) : erroWhatsapp ? (
            <Alert severity="error" sx={{ m: 2 }}>{erroWhatsapp}</Alert>
          ) : whatsappData ? (
            <Grid container spacing={2}>
              {/* Resumo + Tipo de Envio + Filtro Gênero */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1, alignItems: 'center' }}>
                  <Chip
                    icon={<PeopleIcon />}
                    label={`${getClientesFiltrados().length} cliente(s)${filtroGeneroWhatsapp !== 'todos' ? ` (${filtroGeneroWhatsapp})` : ''}`}
                    color="primary"
                    variant="outlined"
                  />
                  {tipoEnvioWhatsapp === 'marca' && whatsappData.marcas?.map(marca => (
                    <Chip key={marca} label={`Marca: ${marca}`} color="success" size="small" />
                  ))}
                </Box>

                {/* Toggle tipo de envio */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ color: '#555', fontWeight: 600 }}>Enviar para:</Typography>
                  <ToggleButtonGroup
                    exclusive
                    value={tipoEnvioWhatsapp}
                    onChange={(e, v) => { if (v) handleTrocarTipoEnvio(v); }}
                    size="small"
                  >
                    <ToggleButton value="marca" sx={{ fontSize: '0.75rem', py: 0.4, px: 1.5 }}>
                      Clientes da Marca
                    </ToggleButton>
                    <ToggleButton value="todos" sx={{ fontSize: '0.75rem', py: 0.4, px: 1.5 }}>
                      Todos os Clientes
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {/* Filtro por sexo do cliente */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ color: '#555', fontWeight: 600 }}>Sexo do Cliente:</Typography>
                  {['todos', 'masculino', 'feminino'].map(g => (
                    <Chip
                      key={g}
                      label={g === 'todos' ? 'Todos' : g.charAt(0).toUpperCase() + g.slice(1)}
                      size="small"
                      color={filtroGeneroWhatsapp === g ? 'primary' : 'default'}
                      onClick={() => setFiltroGeneroWhatsapp(g)}
                      variant={filtroGeneroWhatsapp === g ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
                {whatsappData.aviso && (
                  <Alert severity="warning" sx={{ mb: 2 }}>{whatsappData.aviso}</Alert>
                )}
              </Grid>

              {/* Preview dos produtos em promoção */}
              {whatsappData.produtos_promocao?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    🛍️ Produtos desta promoção
                    <Typography component="span" variant="caption" sx={{ ml: 1, color: '#888', fontWeight: 400 }}>
                      — clique no ↓ para baixar ou no 📋 para copiar a imagem
                    </Typography>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {whatsappData.produtos_promocao.map(p => (
                      <Box
                        key={p.id_produto}
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          p: 1,
                          minWidth: 130,
                          maxWidth: 165,
                          textAlign: 'center',
                          backgroundColor: '#fafafa',
                          position: 'relative',
                        }}
                      >
                        {p.imagem_url ? (
                          <Box
                            component="img"
                            src={p.imagem_url}
                            alt={p.nome}
                            sx={{ width: 64, height: 64, objectFit: 'contain', mb: 0.5, cursor: 'pointer' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <Box sx={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 0.5, backgroundColor: '#eee', borderRadius: 1 }}>
                            <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>sem foto</Typography>
                          </Box>
                        )}
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, lineHeight: 1.2 }}>
                          {p.nome.length > 30 ? p.nome.substring(0, 28) + '...' : p.nome}
                        </Typography>
                        {p.preco_original && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#999', textDecoration: 'line-through', display: 'block' }}>
                              R$ {parseFloat(p.preco_original).toFixed(2)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#e53935', fontWeight: 700 }}>
                              R$ {parseFloat(p.preco_promocional || p.preco_original).toFixed(2)}
                            </Typography>
                          </Box>
                        )}
                        {p.imagem_url && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                            <Tooltip title="Baixar imagem">
                              <IconButton size="small" onClick={() => baixarImagem(p.imagem_url, p.nome)} sx={{ p: 0.3 }}>
                                <DownloadIcon sx={{ fontSize: 16, color: '#1976d2' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={imagensCopiadas[p.id_produto] ? 'Copiado!' : 'Copiar imagem para cole no WhatsApp'}>
                              <IconButton
                                size="small"
                                onClick={() => copiarImagemParaClipboard(p.imagem_url, p.id_produto)}
                                sx={{ p: 0.3 }}
                              >
                                {imagensCopiadas[p.id_produto]
                                  ? <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                                  : <CopyIcon sx={{ fontSize: 16, color: '#757575' }} />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                  <Alert severity="info" icon="💡" sx={{ mt: 1.5, py: 0.5, fontSize: '0.8rem' }}>
                    <strong>Como enviar a foto no WhatsApp:</strong> clique em 📋 para copiar a imagem &rarr; abra o WhatsApp pelo botão → cole a imagem (Ctrl+V) e envie junto com a mensagem.
                  </Alert>
                </Grid>
              )}

              {/* Template da mensagem */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  ✏️ Mensagem (use {'{nome}'} para o nome do cliente)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  value={mensagemWhatsapp}
                  onChange={(e) => setMensagemWhatsapp(e.target.value)}
                  variant="outlined"
                  InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    <PeopleIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Lista de Clientes
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    sx={{ backgroundColor: '#25D366', '&:hover': { backgroundColor: '#1ebe57' } }}
                    onClick={handleEnviarParaTodos}
                    disabled={!getClientesFiltrados().length}
                  >
                    Enviar para Todos
                  </Button>
                </Box>
              </Grid>

              {/* Lista de clientes */}
              <Grid item xs={12}>
                {getClientesFiltrados().length === 0 ? (
                  <Alert severity="info">
                    Nenhum cliente encontrado{filtroGeneroWhatsapp !== 'todos' ? ` para o gênero "${filtroGeneroWhatsapp}"` : ' que tenha comprado produtos das marcas desta promoção'}.
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 380 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>WhatsApp / Telefone</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Última Compra</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Produtos Comprados</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>Enviar</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getClientesFiltrados().map((cliente) => {
                          const link = gerarLinkWhatsapp(cliente);
                          const contato = cliente.whatsapp || cliente.telefone || '';
                          return (
                            <TableRow key={cliente.id_cliente} hover>
                              <TableCell sx={{ maxWidth: 180 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {cliente.nome}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ color: contato ? 'inherit' : '#ccc' }}>
                                  {contato || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{cliente.ultima_compra || '—'}</Typography>
                              </TableCell>
                              <TableCell sx={{ maxWidth: 220 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#555' }}>
                                  {cliente.produtos_comprados?.join(', ') || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title={gerarLinkWhatsapp(cliente) ? 'Copiar imagem e abrir WhatsApp' : 'Sem número cadastrado'}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={!gerarLinkWhatsapp(cliente)}
                                      sx={{ color: gerarLinkWhatsapp(cliente) ? '#25D366' : '#ccc' }}
                                      onClick={() => abrirWhatsappComImagem(cliente)}
                                    >
                                      {imagensCopiadas[`wpp_${cliente.id_cliente}`]
                                        ? <CheckCircleIcon sx={{ color: '#4caf50' }} />
                                        : <WhatsAppIcon />}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWhatsappDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MapaPromocaoPage;
