import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
  Autocomplete,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  PlayArrow as TestIcon,
  Refresh as RefreshIcon,
  Scale as ScaleIcon,
} from '@mui/icons-material';
import api from '../services/api';

const BalancasPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [configuracoes, setConfiguracoes] = useState([]);
  const [produtosBalanca, setProdutosBalanca] = useState([]);
  const [exportacoes, setExportacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openProdutosDialog, setOpenProdutosDialog] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  
  // Filtros de produtos
  const [filtrosProdutos, setFiltrosProdutos] = useState({
    grupo: '',
    marca: '',
    codigo: '',
    nome: '',
  });
  
  // Form states
  const [formData, setFormData] = useState({
    nome_configuracao: '',
    tipo_balanca: 'checkout',
    modelo_balanca: 'toledo',
    porta_serial: '',
    baud_rate: 9600,
    ip_balanca: '',
    porta_rede: 9100,
    formato_exportacao: 'toledo_mgv6',
    codigo_inicial_plu: 1,
    usar_codigo_barras: true,
    tamanho_nome_produto: 50,
    apenas_produtos_peso: true,
    ativo: true,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    carregarConfiguracoes();
    carregarProdutos();
    carregarGrupos();
  }, []);

  useEffect(() => {
    if (selectedConfig) {
      carregarProdutosBalanca(selectedConfig.id);
    }
  }, [selectedConfig]);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/balancas/configuracoes/');
      // Trata resposta paginada ou array direto
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setConfiguracoes(data);
    } catch (error) {
      mostrarSnackbar('Erro ao carregar configurações', 'error');
      setConfiguracoes([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarProdutos = async () => {
    try {
      const response = await api.get('/api/produtos/');
      // Trata resposta paginada ou array direto
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setProdutos(data);
      setProdutosFiltrados(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProdutos([]);
      setProdutosFiltrados([]);
    }
  };

  const carregarGrupos = async () => {
    try {
      const response = await api.get('/api/grupos-produto/');
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setGrupos(data);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      setGrupos([]);
    }
  };

  const carregarProdutosBalanca = async (configId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/balancas/produtos/?configuracao=${configId}`);
      // Trata resposta paginada ou array direto
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setProdutosBalanca(data);
    } catch (error) {
      mostrarSnackbar('Erro ao carregar produtos da balança', 'error');
      setProdutosBalanca([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarExportacoes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/balancas/exportacoes/');
      // Trata resposta paginada ou array direto
      const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setExportacoes(data);
    } catch (error) {
      mostrarSnackbar('Erro ao carregar exportações', 'error');
      setExportacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const mostrarSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 4) {
      carregarExportacoes();
    }
  };

  const handleOpenDialog = (config = null) => {
    if (config) {
      setFormData(config);
      setSelectedConfig(config);
    } else {
      setFormData({
        nome_configuracao: '',
        tipo_balanca: 'checkout',
        modelo_balanca: 'toledo',
        porta_serial: '',
        baud_rate: 9600,
        ip_balanca: '',
        porta_rede: 9100,
        formato_exportacao: 'toledo_mgv6',
        codigo_inicial_plu: 1,
        usar_codigo_barras: true,
        tamanho_nome_produto: 50,
        apenas_produtos_peso: true,
        ativo: true,
      });
      setSelectedConfig(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedConfig(null);
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      if (selectedConfig) {
        await api.put(`/api/balancas/configuracoes/${selectedConfig.id}/`, formData);
        mostrarSnackbar('Configuração atualizada com sucesso!');
      } else {
        await api.post('/api/balancas/configuracoes/', formData);
        mostrarSnackbar('Configuração criada com sucesso!');
      }
      handleCloseDialog();
      carregarConfiguracoes();
    } catch (error) {
      mostrarSnackbar('Erro ao salvar configuração', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta configuração?')) return;
    
    try {
      setLoading(true);
      await api.delete(`/api/balancas/configuracoes/${id}/`);
      mostrarSnackbar('Configuração excluída com sucesso!');
      carregarConfiguracoes();
    } catch (error) {
      mostrarSnackbar('Erro ao excluir configuração', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProdutosDialog = (config) => {
    setSelectedConfig(config);
    setProdutosSelecionados([]);
    setFiltrosProdutos({ grupo: '', marca: '', codigo: '', nome: '' });
    setProdutosFiltrados(produtos);
    setOpenProdutosDialog(true);
  };

  const handleCloseProdutosDialog = () => {
    setOpenProdutosDialog(false);
    setProdutosSelecionados([]);
    setFiltrosProdutos({ grupo: '', marca: '', codigo: '', nome: '' });
    setProdutosFiltrados(produtos);
  };

  const handleFiltrarProdutos = () => {
    let produtosFilt = [...produtos];

    if (filtrosProdutos.grupo) {
      produtosFilt = produtosFilt.filter(p => p.id_grupo === parseInt(filtrosProdutos.grupo));
    }

    if (filtrosProdutos.marca) {
      produtosFilt = produtosFilt.filter(p => 
        p.marca && p.marca.toLowerCase().includes(filtrosProdutos.marca.toLowerCase())
      );
    }

    if (filtrosProdutos.codigo) {
      produtosFilt = produtosFilt.filter(p => 
        p.codigo_produto && p.codigo_produto.toLowerCase().includes(filtrosProdutos.codigo.toLowerCase())
      );
    }

    if (filtrosProdutos.nome) {
      produtosFilt = produtosFilt.filter(p => 
        p.nome_produto && p.nome_produto.toLowerCase().includes(filtrosProdutos.nome.toLowerCase())
      );
    }

    setProdutosFiltrados(produtosFilt);
    mostrarSnackbar(`${produtosFilt.length} produto(s) encontrado(s)`, 'info');
  };

  const handleLimparFiltros = () => {
    setFiltrosProdutos({ grupo: '', marca: '', codigo: '', nome: '' });
    setProdutosFiltrados(produtos);
  };

  const handleAdicionarTodosOsFiltrados = async () => {
    if (produtosFiltrados.length === 0) {
      mostrarSnackbar('Nenhum produto para adicionar', 'warning');
      return;
    }

    if (!window.confirm(`Deseja adicionar todos os ${produtosFiltrados.length} produtos filtrados à balança?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        `/api/balancas/configuracoes/${selectedConfig.id}/adicionar_produtos/`,
        {
          produtos: produtosFiltrados.map(p => p.id_produto),
        }
      );
      
      const { adicionados, ja_existem, erros } = response.data;
      
      let mensagens = [];
      if (adicionados > 0) mensagens.push(`${adicionados} produto(s) adicionado(s)`);
      if (ja_existem > 0) mensagens.push(`${ja_existem} já existente(s)`);
      if (erros > 0) mensagens.push(`${erros} erro(s)`);
      
      mostrarSnackbar(mensagens.join(', '), adicionados > 0 ? 'success' : 'warning');
      carregarProdutosBalanca(selectedConfig.id);
      handleCloseProdutosDialog();
    } catch (error) {
      mostrarSnackbar('Erro ao adicionar produtos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarProdutos = async () => {
    if (produtosSelecionados.length === 0) {
      mostrarSnackbar('Selecione pelo menos um produto', 'warning');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        `/api/balancas/configuracoes/${selectedConfig.id}/adicionar_produtos/`,
        {
          produtos: produtosSelecionados.map(p => p.id_produto),
          validade_dias: 3,
          tara: 0,
          departamento: 1,
        }
      );
      
      const { produtos_adicionados, produtos_existentes, erros } = response.data;
      
      let mensagem = '';
      if (produtos_adicionados > 0) {
        mensagem += `${produtos_adicionados} produto(s) adicionado(s)`;
      }
      if (produtos_existentes > 0) {
        mensagem += (mensagem ? ', ' : '') + `${produtos_existentes} já existia(m)`;
      }
      if (erros && erros.length > 0) {
        mensagem += (mensagem ? '. ' : '') + `${erros.length} erro(s)`;
        console.error('Erros ao adicionar produtos:', erros);
      }
      
      mostrarSnackbar(
        mensagem || 'Produtos processados',
        erros && erros.length > 0 ? 'warning' : 'success'
      );
      
      handleCloseProdutosDialog();
      carregarProdutosBalanca(selectedConfig.id);
    } catch (error) {
      console.error('Erro ao adicionar produtos:', error);
      const mensagem = error.response?.data?.detail || error.response?.data?.error || 'Erro ao adicionar produtos';
      mostrarSnackbar(mensagem, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = async (config) => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/balancas/configuracoes/${config.id}/exportar/`,
        { responseType: 'blob' }
      );
      
      // Verifica se é um erro JSON (blob de erro)
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        mostrarSnackbar(errorData.error || 'Erro ao exportar dados', 'error');
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `balanca_${config.nome_configuracao}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      mostrarSnackbar('Arquivo exportado com sucesso!');
    } catch (error) {
      console.error('Erro na exportação:', error);
      
      // Tenta extrair mensagem de erro do backend
      let mensagem = 'Erro ao exportar dados';
      if (error.response?.data) {
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            mensagem = errorData.error || errorData.detail || mensagem;
          } catch (e) {
            // Mantém mensagem padrão
          }
        } else if (typeof error.response.data === 'object') {
          mensagem = error.response.data.error || error.response.data.detail || mensagem;
        }
      }
      
      mostrarSnackbar(mensagem, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestarConexao = async (config) => {
    try {
      setLoading(true);
      const response = await api.post(
        `/api/balancas/configuracoes/${config.id}/testar_conexao/`
      );
      setTestResult(response.data);
      mostrarSnackbar(
        response.data.mensagem || (response.data.sucesso ? 'Conexão bem-sucedida!' : 'Falha na conexão'),
        response.data.sucesso ? 'success' : 'error'
      );
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      const mensagem = error.response?.data?.error || error.response?.data?.detail || 'Erro ao testar conexão';
      mostrarSnackbar(mensagem, 'error');
      setTestResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLerPeso = async (config) => {
    try {
      setLoading(true);
      const response = await api.post('/api/balancas/leitura/ler_peso/', {
        configuracao_id: config.id,
      });
      
      if (response.data.sucesso) {
        mostrarSnackbar(
          `Peso: ${response.data.peso} ${response.data.unidade}`,
          'success'
        );
      } else {
        mostrarSnackbar(response.data.mensagem || 'Erro ao ler peso', 'error');
      }
    } catch (error) {
      console.error('Erro ao ler peso:', error);
      const mensagem = error.response?.data?.mensagem || error.response?.data?.error || error.response?.data?.detail || 'Erro ao ler peso';
      mostrarSnackbar(mensagem, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Renderiza aba de configurações
  const renderConfiguracoesTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Configurações de Balanças</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Configuração
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Modelo</TableCell>
              <TableCell>Formato</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configuracoes.map((config) => (
              <TableRow key={config.id}>
                <TableCell>{config.nome_configuracao}</TableCell>
                <TableCell>
                  <Chip
                    label={config.tipo_balanca_display}
                    color={config.tipo_balanca === 'integrada' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{config.modelo_balanca_display}</TableCell>
                <TableCell>{config.formato_exportacao_display}</TableCell>
                <TableCell>
                  <Chip
                    label={config.ativo ? 'Ativo' : 'Inativo'}
                    color={config.ativo ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(config)}
                    title="Editar"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteConfig(config.id)}
                    title="Excluir"
                  >
                    <DeleteIcon />
                  </IconButton>
                  {config.tipo_balanca === 'integrada' && (
                    <IconButton
                      size="small"
                      onClick={() => handleTestarConexao(config)}
                      title="Testar Conexão"
                    >
                      <TestIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // Renderiza aba de produtos
  const renderProdutosTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Produtos na Balança</Typography>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Selecionar Configuração</InputLabel>
          <Select
            value={selectedConfig?.id || ''}
            onChange={(e) => {
              const config = configuracoes.find(c => c.id === e.target.value);
              setSelectedConfig(config);
            }}
            label="Selecionar Configuração"
          >
            {configuracoes.map((config) => (
              <MenuItem key={config.id} value={config.id}>
                {config.nome_configuracao}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedConfig && (
        <>
          <Box display="flex" gap={2} mb={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenProdutosDialog(selectedConfig)}
            >
              Adicionar Produtos
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => carregarProdutosBalanca(selectedConfig.id)}
            >
              Atualizar
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>PLU</TableCell>
                  <TableCell>Produto</TableCell>
                  <TableCell>Preço</TableCell>
                  <TableCell>Validade (dias)</TableCell>
                  <TableCell>Tara (kg)</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Exportado em</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {produtosBalanca.map((pb) => (
                  <TableRow key={pb.id}>
                    <TableCell>{pb.codigo_plu}</TableCell>
                    <TableCell>{pb.produto_nome}</TableCell>
                    <TableCell>R$ {pb.produto_preco}</TableCell>
                    <TableCell>{pb.validade_dias}</TableCell>
                    <TableCell>{pb.tara}</TableCell>
                    <TableCell>{pb.departamento}</TableCell>
                    <TableCell>
                      <Chip
                        label={pb.ativo ? 'Ativo' : 'Inativo'}
                        color={pb.ativo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {pb.exportado_em
                        ? new Date(pb.exportado_em).toLocaleString()
                        : 'Nunca'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );

  // Renderiza aba de exportação
  const renderExportacaoTab = () => (
    <Box>
      <Typography variant="h5" mb={2}>
        Exportar Dados para Balança
      </Typography>

      <Grid container spacing={2}>
        {configuracoes
          .filter(c => c.tipo_balanca === 'checkout')
          .map((config) => (
            <Grid item xs={12} md={6} key={config.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{config.nome_configuracao}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {config.modelo_balanca_display} - {config.formato_exportacao_display}
                  </Typography>
                  
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExportar(config)}
                      fullWidth
                    >
                      Exportar Produtos
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {configuracoes.filter(c => c.tipo_balanca === 'checkout').length === 0 && (
        <Alert severity="info">
          Nenhuma balança de checkout configurada. Configure uma balança na aba "Configurações".
        </Alert>
      )}
    </Box>
  );

  // Renderiza aba de teste
  const renderTesteTab = () => (
    <Box>
      <Typography variant="h5" mb={2}>
        Testar Balança Integrada
      </Typography>

      <Grid container spacing={2}>
        {configuracoes
          .filter(c => c.tipo_balanca === 'integrada')
          .map((config) => (
            <Grid item xs={12} md={6} key={config.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{config.nome_configuracao}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {config.modelo_balanca_display}
                  </Typography>
                  <Typography variant="body2">
                    {config.porta_serial && `Serial: ${config.porta_serial} (${config.baud_rate} baud)`}
                    {config.ip_balanca && `Rede: ${config.ip_balanca}:${config.porta_rede}`}
                  </Typography>
                  
                  <Box mt={2} display="flex" gap={2}>
                    <Button
                      variant="contained"
                      startIcon={<TestIcon />}
                      onClick={() => handleTestarConexao(config)}
                      fullWidth
                    >
                      Testar Conexão
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ScaleIcon />}
                      onClick={() => handleLerPeso(config)}
                      fullWidth
                    >
                      Ler Peso
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {configuracoes.filter(c => c.tipo_balanca === 'integrada').length === 0 && (
        <Alert severity="info">
          Nenhuma balança integrada configurada. Configure uma balança na aba "Configurações".
        </Alert>
      )}

      {testResult && (
        <Box mt={2}>
          <Alert severity={testResult.sucesso ? 'success' : 'error'}>
            {testResult.mensagem}
            {testResult.peso && ` - Peso: ${testResult.peso} ${testResult.unidade}`}
          </Alert>
        </Box>
      )}
    </Box>
  );

  // Renderiza aba de histórico
  const renderHistoricoTab = () => (
    <Box>
      <Typography variant="h5" mb={2}>
        Histórico de Exportações
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Configuração</TableCell>
              <TableCell>Arquivo</TableCell>
              <TableCell>Formato</TableCell>
              <TableCell>Produtos</TableCell>
              <TableCell>Tamanho</TableCell>
              <TableCell>Usuário</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exportacoes.map((exp) => (
              <TableRow key={exp.id}>
                <TableCell>{new Date(exp.data_exportacao).toLocaleString()}</TableCell>
                <TableCell>{exp.configuracao_nome}</TableCell>
                <TableCell>{exp.arquivo_gerado}</TableCell>
                <TableCell>{exp.formato}</TableCell>
                <TableCell>{exp.quantidade_produtos}</TableCell>
                <TableCell>{(exp.tamanho_bytes / 1024).toFixed(2)} KB</TableCell>
                <TableCell>{exp.usuario_nome}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={async () => {
                      const response = await api.get(
                        `/api/balancas/exportacoes/${exp.id}/baixar/`,
                        { responseType: 'blob' }
                      );
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', exp.arquivo_gerado);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    }}
                    title="Baixar"
                  >
                    <DownloadIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Gerenciamento de Balanças
      </Typography>

      <Card>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Configurações" />
          <Tab label="Produtos" />
          <Tab label="Exportar Dados" />
          <Tab label="Testar Balança" />
          <Tab label="Histórico" />
        </Tabs>

        <CardContent>
          {loading && (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          )}

          {!loading && (
            <>
              {tabValue === 0 && renderConfiguracoesTab()}
              {tabValue === 1 && renderProdutosTab()}
              {tabValue === 2 && renderExportacaoTab()}
              {tabValue === 3 && renderTesteTab()}
              {tabValue === 4 && renderHistoricoTab()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Configuração */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedConfig ? 'Editar Configuração' : 'Nova Configuração'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome da Configuração"
                value={formData.nome_configuracao}
                onChange={(e) =>
                  setFormData({ ...formData, nome_configuracao: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Balança</InputLabel>
                <Select
                  value={formData.tipo_balanca}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo_balanca: e.target.value })
                  }
                  label="Tipo de Balança"
                >
                  <MenuItem value="checkout">Balança de Checkout</MenuItem>
                  <MenuItem value="integrada">Balança Integrada</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Modelo</InputLabel>
                <Select
                  value={formData.modelo_balanca}
                  onChange={(e) =>
                    setFormData({ ...formData, modelo_balanca: e.target.value })
                  }
                  label="Modelo"
                >
                  <MenuItem value="toledo">Toledo</MenuItem>
                  <MenuItem value="filizola">Filizola</MenuItem>
                  <MenuItem value="urano">Urano</MenuItem>
                  <MenuItem value="elgin">Elgin</MenuItem>
                  <MenuItem value="balmak">Balmak</MenuItem>
                  <MenuItem value="generica">Genérica</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.tipo_balanca === 'checkout' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Formato de Exportação</InputLabel>
                  <Select
                    value={formData.formato_exportacao}
                    onChange={(e) =>
                      setFormData({ ...formData, formato_exportacao: e.target.value })
                    }
                    label="Formato de Exportação"
                  >
                    <MenuItem value="toledo_mgv6">Toledo MGV6</MenuItem>
                    <MenuItem value="filizola_smart">Filizola Smart</MenuItem>
                    <MenuItem value="urano_pop">Urano POP</MenuItem>
                    <MenuItem value="texto_padrao">Texto Padrão</MenuItem>
                    <MenuItem value="csv">CSV</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {formData.tipo_balanca === 'integrada' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Porta Serial (ex: COM1)"
                    value={formData.porta_serial}
                    onChange={(e) =>
                      setFormData({ ...formData, porta_serial: e.target.value })
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Baud Rate"
                    value={formData.baud_rate}
                    onChange={(e) =>
                      setFormData({ ...formData, baud_rate: parseInt(e.target.value) })
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="IP da Balança"
                    value={formData.ip_balanca}
                    onChange={(e) =>
                      setFormData({ ...formData, ip_balanca: e.target.value })
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Porta de Rede"
                    value={formData.porta_rede}
                    onChange={(e) =>
                      setFormData({ ...formData, porta_rede: parseInt(e.target.value) })
                    }
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Código PLU Inicial"
                value={formData.codigo_inicial_plu}
                onChange={(e) =>
                  setFormData({ ...formData, codigo_inicial_plu: parseInt(e.target.value) })
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Tamanho do Nome"
                value={formData.tamanho_nome_produto}
                onChange={(e) =>
                  setFormData({ ...formData, tamanho_nome_produto: parseInt(e.target.value) })
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.usar_codigo_barras}
                    onChange={(e) =>
                      setFormData({ ...formData, usar_codigo_barras: e.target.checked })
                    }
                  />
                }
                label="Usar Código de Barras"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.apenas_produtos_peso}
                    onChange={(e) =>
                      setFormData({ ...formData, apenas_produtos_peso: e.target.checked })
                    }
                  />
                }
                label="Apenas Produtos por Peso"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.ativo}
                    onChange={(e) =>
                      setFormData({ ...formData, ativo: e.target.checked })
                    }
                  />
                }
                label="Ativo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveConfig} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Adição de Produtos */}
      <Dialog
        open={openProdutosDialog}
        onClose={handleCloseProdutosDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Adicionar Produtos à Balança</DialogTitle>
        <DialogContent>
          {/* Filtros */}
          <Box mb={2} mt={1}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Filtros de Produtos
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Grupo</InputLabel>
                  <Select
                    value={filtrosProdutos.grupo}
                    onChange={(e) => setFiltrosProdutos({ ...filtrosProdutos, grupo: e.target.value })}
                    label="Grupo"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {grupos.map((grupo) => (
                      <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                        {grupo.nome_grupo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Marca"
                  value={filtrosProdutos.marca}
                  onChange={(e) => setFiltrosProdutos({ ...filtrosProdutos, marca: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Código"
                  value={filtrosProdutos.codigo}
                  onChange={(e) => setFiltrosProdutos({ ...filtrosProdutos, codigo: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nome"
                  value={filtrosProdutos.nome}
                  onChange={(e) => setFiltrosProdutos({ ...filtrosProdutos, nome: e.target.value })}
                />
              </Grid>
            </Grid>
            <Box mt={2} display="flex" gap={1}>
              <Button
                variant="outlined"
                onClick={handleFiltrarProdutos}
                size="small"
              >
                Filtrar
              </Button>
              <Button
                variant="text"
                onClick={handleLimparFiltros}
                size="small"
              >
                Limpar Filtros
              </Button>
              <Box flexGrow={1} />
              <Chip 
                label={`${produtosFiltrados.length} produto(s)`} 
                color="primary" 
                size="small"
              />
            </Box>
          </Box>

          {/* Seleção de produtos */}
          <Autocomplete
            multiple
            options={produtosFiltrados}
            getOptionLabel={(option) =>
              `${option.codigo_produto} - ${option.nome_produto}`
            }
            value={produtosSelecionados}
            onChange={(event, newValue) => {
              setProdutosSelecionados(newValue);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Selecione os produtos" margin="normal" />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body2">
                    {option.codigo_produto} - {option.nome_produto}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.marca && `Marca: ${option.marca} | `}
                    {option.preco_venda ? `R$ ${option.preco_venda}` : 'Sem preço'}
                  </Typography>
                </Box>
              </li>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProdutosDialog}>Cancelar</Button>
          <Button 
            onClick={handleAdicionarTodosOsFiltrados} 
            variant="outlined"
            color="secondary"
            disabled={produtosFiltrados.length === 0}
          >
            Adicionar Todos Filtrados ({produtosFiltrados.length})
          </Button>
          <Button 
            onClick={handleAdicionarProdutos} 
            variant="contained"
            disabled={produtosSelecionados.length === 0}
          >
            Adicionar Selecionados ({produtosSelecionados.length})
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BalancasPage;
