import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Grid, Card, CardContent,
  IconButton, Tooltip, Checkbox, FormControlLabel, Stack, Chip, Paper, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, Alert, List, ListItem,
  ListItemText, ListItemSecondaryAction, Tabs, Tab, Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Visibility as PreviewIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function EtiquetasPage() {
  const { axiosInstance, user, permissions, isLoading: authLoading } = useAuth();

  // Estados
  const [layouts, setLayouts] = useState([]);
  const [camposDisponiveis, setCamposDisponiveis] = useState([]);
  const [layoutDialog, setLayoutDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [impressaoDialog, setImpressaoDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editandoLayout, setEditandoLayout] = useState(null);

  // Estados de impressão
  const [layoutSelecionado, setLayoutSelecionado] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('produto'); // produto, grupo, compra
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [busca, setBusca] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState('');
  const [compraFiltro, setCompraFiltro] = useState('');
  const [saltarEtiquetas, setSaltarEtiquetas] = useState(0);
  const [quantidadePorProduto, setQuantidadePorProduto] = useState({});
  
  // Configurações de impressora
  const [tipoImpressora, setTipoImpressora] = useState('padrao'); // padrao, zebra, elgin
  const [ipImpressora, setIpImpressora] = useState('');

  // Formulário de layout
  const [layoutForm, setLayoutForm] = useState({
    nome_layout: '',
    descricao: '',
    tamanho_papel: 'A4',
    largura_papel: 210,
    altura_papel: 297,
    largura_etiqueta: 50,
    altura_etiqueta: 30,
    colunas: 3,
    linhas: 10,
    margem_superior: 10,
    margem_inferior: 10,
    margem_esquerda: 5,
    margem_direita: 5,
    espaco_horizontal: 2,
    espaco_vertical: 2,
    campos_visiveis: {}
  });

  const [camposSelecionados, setCamposSelecionados] = useState({});

  // Carregar dados
  useEffect(() => {
    fetchLayouts();
    fetchCamposDisponiveis();
    fetchProdutos();
    fetchGrupos();
    fetchCompras();
  }, []);

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user?.is_staff && !permissions?.etiquetas_acessar) {
    return (
      <Box p={3}>
        <Alert severity="warning">Você não tem permissão para acessar Etiquetas.</Alert>
      </Box>
    );
  }

  const fetchLayouts = async () => {
    try {
      const response = await axiosInstance.get('/etiquetas/layouts/');
      // Garantir que sempre seja um array, tratando resposta paginada
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data?.value || []);
      setLayouts(data);
    } catch (error) {
      console.error('Erro ao buscar layouts:', error);
      setLayouts([]);
    }
  };

  const fetchCamposDisponiveis = async () => {
    try {
      const response = await axiosInstance.get('/etiquetas/layouts/campos_disponiveis/');
      // Garantir que sempre seja um array, tratando resposta paginada
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data?.value || []);
      setCamposDisponiveis(data);
    } catch (error) {
      console.error('Erro ao buscar campos:', error);
      setCamposDisponiveis([]);
    }
  };

  const fetchProdutos = async () => {
    try {
      const response = await axiosInstance.get('/produtos/');
      // Garantir que sempre seja um array, tratando resposta paginada
      const produtosData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data?.value || []);
      
      // Buscar também os dados de estoque para cada produto
      const produtosComEstoque = await Promise.all(
        produtosData.map(async (produto) => {
          try {
            const estoqueResponse = await axiosInstance.get(`/estoque/?id_produto=${produto.id_produto}`);
            const estoque = estoqueResponse.data[0] || {};
            return {
              ...produto,
              valor_venda: estoque.valor_venda || 0,
              custo_medio: estoque.custo_medio || 0,
              quantidade_estoque: estoque.quantidade || 0
            };
          } catch (error) {
            return produto;
          }
        })
      );
      setProdutos(produtosComEstoque);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const fetchGrupos = async () => {
    try {
      const response = await axiosInstance.get('/grupos-produto/');
      // Garantir que sempre seja um array, tratando resposta paginada
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data?.value || []);
      setGrupos(data);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
      setGrupos([]);
    }
  };

  const fetchCompras = async () => {
    try {
      const response = await axiosInstance.get('/compras/');
      // Garantir que sempre seja um array, tratando resposta paginada
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data?.value || []);
      setCompras(data);
    } catch (error) {
      console.error('Erro ao buscar compras:', error);
      setCompras([]);
      setCompras([]);
    }
  };

  // Tamanhos de papel predefinidos
  const tamanhosPapel = {
    'A4': { largura: 210, altura: 297 },
    'CARTA': { largura: 215.9, altura: 279.4 },
    '10X15': { largura: 100, altura: 150 },
    '5X5': { largura: 50, altura: 50 },
    '7X5': { largura: 70, altura: 50 },
    'CUSTOM': { largura: 0, altura: 0 }
  };

  const handleTamanhoPapelChange = (e) => {
    const tamanho = e.target.value;
    const dimensoes = tamanhosPapel[tamanho];

    setLayoutForm({
      ...layoutForm,
      tamanho_papel: tamanho,
      largura_papel: dimensoes.largura,
      altura_papel: dimensoes.altura
    });
  };

  const handleCampoToggle = (campoId) => {
    setCamposSelecionados(prev => {
      const isAtivo = !prev[campoId]?.ativo;

      // Se está ativando, calcula a próxima ordem
      let proximaOrdem = 1;
      if (isAtivo) {
        const ordensExistentes = Object.values(prev)
          .filter(config => config?.ativo)
          .map(config => config?.ordem || 0);
        proximaOrdem = ordensExistentes.length > 0 ? Math.max(...ordensExistentes) + 1 : 1;
      }

      return {
        ...prev,
        [campoId]: {
          ...prev[campoId],
          ativo: isAtivo,
          ordem: isAtivo ? proximaOrdem : 0,
          tamanho_fonte: prev[campoId]?.tamanho_fonte || 12,
          negrito: prev[campoId]?.negrito || false,
          italico: prev[campoId]?.italico || false
        }
      };
    });
  };

  const handleOrdemChange = (campoId, novaOrdem) => {
    setCamposSelecionados(prev => ({
      ...prev,
      [campoId]: {
        ...prev[campoId],
        ordem: parseInt(novaOrdem) || 1
      }
    }));
  };

  const handleSaveLayout = async () => {
    try {
      setLoading(true);

      const dados = {
        ...layoutForm,
        campos_visiveis: camposSelecionados
      };

      if (editandoLayout) {
        // Editar layout existente
        await axiosInstance.put(`/etiquetas/layouts/${editandoLayout.id}/`, dados);
        alert('Layout atualizado com sucesso!');
      } else {
        // Criar novo layout
        await axiosInstance.post('/etiquetas/layouts/', dados);
        alert('Layout criado com sucesso!');
      }

      setLayoutDialog(false);
      fetchLayouts();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar layout:', error);
      alert('Erro ao salvar layout!');
    } finally {
      setLoading(false);
    }
  };

  const abrirEdicao = (layout) => {
    setEditandoLayout(layout);
    setLayoutForm({
      nome_layout: layout.nome_layout,
      descricao: layout.descricao || '',
      tamanho_papel: layout.tamanho_papel,
      largura_papel: layout.largura_papel,
      altura_papel: layout.altura_papel,
      largura_etiqueta: layout.largura_etiqueta,
      altura_etiqueta: layout.altura_etiqueta,
      colunas: layout.colunas,
      linhas: layout.linhas,
      margem_superior: layout.margem_superior,
      margem_inferior: layout.margem_inferior,
      margem_esquerda: layout.margem_esquerda,
      margem_direita: layout.margem_direita,
      espaco_horizontal: layout.espaco_horizontal,
      espaco_vertical: layout.espaco_vertical,
      campos_visiveis: layout.campos_visiveis || {}
    });
    setCamposSelecionados(layout.campos_visiveis || {});
    setLayoutDialog(true);
  };

  const resetForm = () => {
    setEditandoLayout(null);
    setLayoutForm({
      nome_layout: '',
      descricao: '',
      tamanho_papel: 'A4',
      largura_papel: 210,
      altura_papel: 297,
      largura_etiqueta: 50,
      altura_etiqueta: 30,
      colunas: 3,
      linhas: 10,
      margem_superior: 10,
      margem_inferior: 10,
      margem_esquerda: 5,
      margem_direita: 5,
      espaco_horizontal: 2,
      espaco_vertical: 2,
      campos_visiveis: {}
    });
    setCamposSelecionados({});
  };

  const handleExcluirLayout = async (layoutId) => {
    if (!confirm('Tem certeza que deseja excluir este layout?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/etiquetas/layouts/${layoutId}/`);
      alert('Layout excluído com sucesso!');
      fetchLayouts();
    } catch (error) {
      console.error('Erro ao excluir layout:', error);
      alert('Erro ao excluir layout!');
    }
  };

  const abrirImpressao = (layout) => {
    setLayoutSelecionado(layout);
    setImpressaoDialog(true);
    setProdutosSelecionados([]);
    setQuantidadePorProduto({});
    setSaltarEtiquetas(0);
  };

  const handleProdutoToggle = (produtoId) => {
    if (produtosSelecionados.includes(produtoId)) {
      setProdutosSelecionados(produtosSelecionados.filter(id => id !== produtoId));
      const novaQuantidade = { ...quantidadePorProduto };
      delete novaQuantidade[produtoId];
      setQuantidadePorProduto(novaQuantidade);
    } else {
      setProdutosSelecionados([...produtosSelecionados, produtoId]);
      setQuantidadePorProduto({
        ...quantidadePorProduto,
        [produtoId]: 1
      });
    }
  };

  const handleQuantidadeChange = (produtoId, quantidade) => {
    setQuantidadePorProduto({
      ...quantidadePorProduto,
      [produtoId]: parseInt(quantidade) || 0
    });
  };

  const produtosFiltrados = () => {
    let resultado = produtos;

    // Filtro por busca
    if (busca) {
      resultado = resultado.filter(p =>
        p.nome_produto?.toLowerCase().includes(busca.toLowerCase()) ||
        p.codigo_produto?.toLowerCase().includes(busca.toLowerCase()) ||
        p.codigo_barras?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    // Filtro por grupo
    if (filtroTipo === 'grupo' && grupoFiltro) {
      resultado = resultado.filter(p => p.id_grupo === parseInt(grupoFiltro));
    }

    // Filtro por compra
    if (filtroTipo === 'compra' && compraFiltro) {
      // Aqui você precisaria buscar os produtos da compra via API
      // Por enquanto vou deixar preparado
    }

    return resultado;
  };

  const gerarEtiquetasParaImpressao = () => {
    const etiquetas = [];

    // Adiciona etiquetas vazias para saltar posições
    for (let i = 0; i < saltarEtiquetas; i++) {
      etiquetas.push({ vazia: true, index: i });
    }

    // Adiciona etiquetas dos produtos selecionados
    produtosSelecionados.forEach(produtoId => {
      const produto = produtos.find(p => p.id_produto === produtoId);
      const quantidade = quantidadePorProduto[produtoId] || 1;

      for (let i = 0; i < quantidade; i++) {
        etiquetas.push({ produto, index: etiquetas.length });
      }
    });

    return etiquetas;
  };

  const imprimirEtiquetas = async () => {
    const etiquetas = gerarEtiquetasParaImpressao();
    const layout = layoutSelecionado;

    // Se for impressora Zebra ou Elgin, usar API específica
    if (tipoImpressora === 'zebra' || tipoImpressora === 'elgin') {
      try {
        setLoading(true);
        
        // Preparar lista de produtos com quantidades
        const produtosParaImprimir = [];
        etiquetas.forEach(etiqueta => {
          if (!etiqueta.vazia && etiqueta.produto) {
            const existente = produtosParaImprimir.find(p => p.produto_id === etiqueta.produto.id_produto);
            if (existente) {
              existente.quantidade++;
            } else {
              produtosParaImprimir.push({
                produto_id: etiqueta.produto.id_produto,
                quantidade: 1
              });
            }
          }
        });

        if (produtosParaImprimir.length === 0) {
          alert('Nenhum produto selecionado para impressão');
          setLoading(false);
          return;
        }

        // Chamar endpoint de impressão em lote
        const response = await axiosInstance.post('/etiquetas/impressoes/imprimir_lote/', {
          produtos: produtosParaImprimir,
          layout_id: layout.id,
          tipo_impressora: tipoImpressora,
          ip_impressora: ipImpressora || null
        });

        if (response.data.sucesso) {
          alert(`${response.data.mensagem}\nTotal: ${response.data.quantidade_total} etiquetas`);
          
          // Mostrar código gerado em uma nova janela
          if (response.data.codigo_gerado) {
            const codigoWindow = window.open('', '_blank');
            codigoWindow.document.write(`
              <html>
                <head>
                  <title>Código ${tipoImpressora.toUpperCase()} Gerado</title>
                  <style>
                    body { font-family: monospace; padding: 20px; }
                    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
                    button { padding: 10px 20px; font-size: 14px; cursor: pointer; }
                  </style>
                </head>
                <body>
                  <h2>Código ${tipoImpressora.toUpperCase()} Gerado</h2>
                  <p>${ipImpressora ? 'Enviado para impressora: ' + ipImpressora : 'Copie o código abaixo para enviar manualmente:'}</p>
                  <button onclick="navigator.clipboard.writeText(document.querySelector('pre').textContent).then(() => alert('Código copiado!'))">
                    Copiar Código
                  </button>
                  <pre>${response.data.codigo_gerado}</pre>
                  <button onclick="window.print()">Imprimir Esta Página</button>
                </body>
              </html>
            `);
            codigoWindow.document.close();
          }
          
          if (response.data.erros && response.data.erros.length > 0) {
            console.warn('Erros na impressão:', response.data.erros);
            alert('Alguns produtos tiveram erros:\n' + response.data.erros.join('\n'));
          }
        } else {
          alert('Erro: ' + response.data.mensagem);
        }
      } catch (error) {
        console.error('Erro ao imprimir:', error);
        alert('Erro ao imprimir etiquetas: ' + (error.response?.data?.error || error.message));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Código original para impressão HTML/PDF
    // Calcula páginas necessárias
    const etiquetasPorPagina = layout.colunas * layout.linhas;
    const totalPaginas = Math.ceil(etiquetas.length / etiquetasPorPagina);

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiquetas - ${layout.nome_layout}</title>
        <style>
          @page {
            size: ${layout.largura_papel}mm ${layout.altura_papel}mm;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          
          .pagina {
            width: ${layout.largura_papel}mm;
            height: ${layout.altura_papel}mm;
            padding: ${layout.margem_superior}mm ${layout.margem_direita}mm ${layout.margem_inferior}mm ${layout.margem_esquerda}mm;
            box-sizing: border-box;
            page-break-after: always;
          }
          
          .pagina:last-child {
            page-break-after: auto;
          }
          
          .grid {
            display: grid;
            grid-template-columns: repeat(${layout.colunas}, ${layout.largura_etiqueta}mm);
            grid-template-rows: repeat(${layout.linhas}, ${layout.altura_etiqueta}mm);
            gap: ${layout.espaco_vertical}mm ${layout.espaco_horizontal}mm;
          }
          
          .etiqueta {
            width: ${layout.largura_etiqueta}mm;
            height: ${layout.altura_etiqueta}mm;
            border: 1px dashed #ccc;
            padding: 2mm;
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          
          .etiqueta.vazia {
            border: none;
          }
          
          .campo {
            margin-bottom: 1mm;
            line-height: 1.2;
          }
          
          @media print {
            .etiqueta {
              border: none;
            }
          }
        </style>
      </head>
      <body>
    `;

    // Gera páginas
    for (let pagina = 0; pagina < totalPaginas; pagina++) {
      html += '<div class="pagina"><div class="grid">';

      const inicio = pagina * etiquetasPorPagina;
      const fim = Math.min(inicio + etiquetasPorPagina, etiquetas.length);

      for (let i = inicio; i < fim; i++) {
        const etiqueta = etiquetas[i];

        if (etiqueta.vazia) {
          html += '<div class="etiqueta vazia"></div>';
        } else {
          const produto = etiqueta.produto;
          html += '<div class="etiqueta">';

          // Renderiza campos configurados na ordem especificada
          Object.entries(layout.campos_visiveis || {})
            .filter(([_, config]) => config.ativo)
            .sort(([aId, aConfig], [bId, bConfig]) => (aConfig.ordem || 999) - (bConfig.ordem || 999))
            .forEach(([campoId, config]) => {
              const campo = camposDisponiveis.find(c => c.id === campoId);
              let valor = produto[campoId] || '';

              // Formata valores especiais
              if (campo?.tipo === 'currency') {
                valor = `R$ ${parseFloat(valor || 0).toFixed(2)}`;
              } else if (campo?.tipo === 'barcode') {
                valor = `||||| ${valor} |||||`;
              }

              html += `
                <div class="campo" style="
                  font-size: ${config.tamanho_fonte || 12}pt;
                  font-weight: ${config.negrito ? 'bold' : 'normal'};
                  font-style: ${config.italico ? 'italic' : 'normal'};
                ">
                  ${valor}
                </div>
              `;
            });

          html += '</div>';
        }
      }

      // Preenche células vazias restantes da página
      for (let i = fim; i < inicio + etiquetasPorPagina; i++) {
        html += '<div class="etiqueta vazia"></div>';
      }

      html += '</div></div>';
    }

    html += '</body></html>';

    // Abre janela de impressão
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(html);
    janelaImpressao.document.close();
    janelaImpressao.focus();

    setTimeout(() => {
      janelaImpressao.print();
    }, 500);

    // Salva histórico de impressão
    salvarHistoricoImpressao();
  };

  const salvarHistoricoImpressao = async () => {
    try {
      const dados = {
        layout: layoutSelecionado.id,
        produtos: Array.isArray(produtosSelecionados) ? produtosSelecionados.map(id => ({
          id_produto: id,
          quantidade: quantidadePorProduto[id] || 1
        })) : [],
        quantidade_total: quantidadePorProduto && typeof quantidadePorProduto === 'object' 
          ? Object.values(quantidadePorProduto).reduce((a, b) => a + b, 0) 
          : 0
      };

      await axiosInstance.post('/etiquetas/impressoes/', dados);
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  };

  const gerarPreview = () => {
    // Gera visualização da etiqueta
    const etiquetasHtml = [];
    const totalEtiquetas = layoutForm.colunas * layoutForm.linhas;

    for (let i = 0; i < Math.min(totalEtiquetas, 6); i++) {
      etiquetasHtml.push(
        <Box
          key={i}
          sx={{
            width: `${layoutForm.largura_etiqueta}mm`,
            height: `${layoutForm.altura_etiqueta}mm`,
            border: '1px dashed #999',
            margin: `${layoutForm.espaco_vertical}mm ${layoutForm.espaco_horizontal}mm`,
            padding: '2mm',
            fontSize: '8pt',
            overflow: 'hidden',
            backgroundColor: '#fff'
          }}
        >
          {Object.entries(camposSelecionados)
            .filter(([_, config]) => config.ativo)
            .sort(([aId, aConfig], [bId, bConfig]) => (aConfig.ordem || 999) - (bConfig.ordem || 999))
            .map(([campoId, config]) => {
              const campo = camposDisponiveis.find(c => c.id === campoId);
              return (
                <Typography
                  key={campoId}
                  sx={{
                    fontSize: `${config.tamanho_fonte || 12}pt`,
                    fontWeight: config.negrito ? 'bold' : 'normal',
                    fontStyle: config.italico ? 'italic' : 'normal',
                    marginBottom: '1mm'
                  }}
                >
                  {campo?.label}: {campo?.tipo === 'barcode' ? '|||||||' : 'EXEMPLO'}
                </Typography>
              );
            })}
        </Box>
      );
    }

    return etiquetasHtml;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gerenciador de Etiquetas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setLayoutDialog(true)}
        >
          Nova Etiqueta
        </Button>
      </Box>

      {/* Lista de Layouts */}
      <Grid container spacing={3}>
        {Array.isArray(layouts) && layouts.map((layout) => (
          <Grid item xs={12} md={6} lg={4} key={layout.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box>
                    <Typography variant="h6">{layout.nome_layout}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {layout.descricao}
                    </Typography>
                  </Box>
                  <Chip
                    label={layout.ativo ? 'Ativo' : 'Inativo'}
                    color={layout.ativo ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Papel:</Typography>
                    <Typography variant="body2">{layout.tamanho_papel}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Etiqueta:</Typography>
                    <Typography variant="body2">{layout.largura_etiqueta}x{layout.altura_etiqueta}mm</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Layout:</Typography>
                    <Typography variant="body2">{layout.colunas}x{layout.linhas}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Total:</Typography>
                    <Typography variant="body2">{layout.colunas * layout.linhas} etiquetas</Typography>
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Tooltip title="Imprimir">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => abrirImpressao(layout)}
                    >
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Visualizar">
                    <IconButton size="small" color="info">
                      <PreviewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={() => abrirEdicao(layout)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleExcluirLayout(layout.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog: Criar/Editar Layout */}
      <Dialog open={layoutDialog} onClose={() => { setLayoutDialog(false); resetForm(); }} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editandoLayout ? `Editar Etiqueta: ${editandoLayout.nome_layout}` : 'Nova Etiqueta Personalizada'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Informações Básicas */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Informações Básicas</Typography>
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                label="Nome do Layout"
                value={layoutForm.nome_layout}
                onChange={(e) => setLayoutForm({ ...layoutForm, nome_layout: e.target.value })}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tamanho do Papel</InputLabel>
                <Select
                  value={layoutForm.tamanho_papel}
                  onChange={handleTamanhoPapelChange}
                  label="Tamanho do Papel"
                >
                  <MenuItem value="A4">A4 (210x297mm)</MenuItem>
                  <MenuItem value="CARTA">Carta (215.9x279.4mm)</MenuItem>
                  <MenuItem value="10X15">10x15cm</MenuItem>
                  <MenuItem value="5X5">5x5cm</MenuItem>
                  <MenuItem value="7X5">7x5cm</MenuItem>
                  <MenuItem value="CUSTOM">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Descrição"
                value={layoutForm.descricao}
                onChange={(e) => setLayoutForm({ ...layoutForm, descricao: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>

            {/* Dimensões do Papel */}
            {layoutForm.tamanho_papel === 'CUSTOM' && (
              <>
                <Grid item xs={12}>
                  <Divider><Typography variant="overline">Dimensões do Papel</Typography></Divider>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Largura do Papel (mm)"
                    type="number"
                    value={layoutForm.largura_papel}
                    onChange={(e) => setLayoutForm({ ...layoutForm, largura_papel: parseFloat(e.target.value) })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Altura do Papel (mm)"
                    type="number"
                    value={layoutForm.altura_papel}
                    onChange={(e) => setLayoutForm({ ...layoutForm, altura_papel: parseFloat(e.target.value) })}
                    fullWidth
                  />
                </Grid>
              </>
            )}

            {/* Dimensões da Etiqueta */}
            <Grid item xs={12}>
              <Divider><Typography variant="overline">Dimensões da Etiqueta</Typography></Divider>
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label="Largura (mm)"
                type="number"
                value={layoutForm.largura_etiqueta}
                onChange={(e) => setLayoutForm({ ...layoutForm, largura_etiqueta: parseFloat(e.target.value) })}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label="Altura (mm)"
                type="number"
                value={layoutForm.altura_etiqueta}
                onChange={(e) => setLayoutForm({ ...layoutForm, altura_etiqueta: parseFloat(e.target.value) })}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label="Colunas"
                type="number"
                value={layoutForm.colunas}
                onChange={(e) => setLayoutForm({ ...layoutForm, colunas: parseInt(e.target.value) })}
                fullWidth
                required
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label="Linhas"
                type="number"
                value={layoutForm.linhas}
                onChange={(e) => setLayoutForm({ ...layoutForm, linhas: parseInt(e.target.value) })}
                fullWidth
                required
                inputProps={{ min: 1, max: 50 }}
              />
            </Grid>

            {/* Margens */}
            <Grid item xs={12}>
              <Divider><Typography variant="overline">Margens (mm)</Typography></Divider>
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label="Superior"
                type="number"
                value={layoutForm.margem_superior}
                onChange={(e) => setLayoutForm({ ...layoutForm, margem_superior: parseFloat(e.target.value) })}
                fullWidth
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label="Inferior"
                type="number"
                value={layoutForm.margem_inferior}
                onChange={(e) => setLayoutForm({ ...layoutForm, margem_inferior: parseFloat(e.target.value) })}
                fullWidth
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label="Esquerda"
                type="number"
                value={layoutForm.margem_esquerda}
                onChange={(e) => setLayoutForm({ ...layoutForm, margem_esquerda: parseFloat(e.target.value) })}
                fullWidth
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label="Direita"
                type="number"
                value={layoutForm.margem_direita}
                onChange={(e) => setLayoutForm({ ...layoutForm, margem_direita: parseFloat(e.target.value) })}
                fullWidth
              />
            </Grid>

            {/* Espaçamentos */}
            <Grid item xs={12}>
              <Divider><Typography variant="overline">Espaçamento entre Etiquetas (mm)</Typography></Divider>
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Horizontal"
                type="number"
                value={layoutForm.espaco_horizontal}
                onChange={(e) => setLayoutForm({ ...layoutForm, espaco_horizontal: parseFloat(e.target.value) })}
                fullWidth
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Vertical"
                type="number"
                value={layoutForm.espaco_vertical}
                onChange={(e) => setLayoutForm({ ...layoutForm, espaco_vertical: parseFloat(e.target.value) })}
                fullWidth
              />
            </Grid>

            {/* Campos a Exibir */}
            <Grid item xs={12}>
              <Divider><Typography variant="overline">Selecione os Campos a Exibir</Typography></Divider>
              <Alert severity="info" sx={{ mt: 2 }}>
                Escolha quais informações do produto aparecerão na etiqueta
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Exibir</TableCell>
                    <TableCell>Ordem</TableCell>
                    <TableCell>Campo</TableCell>
                    <TableCell>Tamanho Fonte</TableCell>
                    <TableCell>Negrito</TableCell>
                    <TableCell>Itálico</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(camposDisponiveis) && camposDisponiveis.map((campo) => (
                    <TableRow key={campo.id}>
                      <TableCell>
                        <Checkbox
                          checked={camposSelecionados[campo.id]?.ativo || false}
                          onChange={() => handleCampoToggle(campo.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={camposSelecionados[campo.id]?.ordem || 1}
                          onChange={(e) => handleOrdemChange(campo.id, e.target.value)}
                          disabled={!camposSelecionados[campo.id]?.ativo}
                          inputProps={{ min: 1, max: 20 }}
                          sx={{ width: 70 }}
                          helperText={camposSelecionados[campo.id]?.ativo ? "1º, 2º..." : ""}
                        />
                      </TableCell>
                      <TableCell>{campo.label}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={camposSelecionados[campo.id]?.tamanho_fonte || 12}
                          onChange={(e) => setCamposSelecionados({
                            ...camposSelecionados,
                            [campo.id]: {
                              ...camposSelecionados[campo.id],
                              tamanho_fonte: parseInt(e.target.value)
                            }
                          })}
                          disabled={!camposSelecionados[campo.id]?.ativo}
                          inputProps={{ min: 6, max: 24 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={camposSelecionados[campo.id]?.negrito || false}
                          onChange={(e) => setCamposSelecionados({
                            ...camposSelecionados,
                            [campo.id]: {
                              ...camposSelecionados[campo.id],
                              negrito: e.target.checked
                            }
                          })}
                          disabled={!camposSelecionados[campo.id]?.ativo}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={camposSelecionados[campo.id]?.italico || false}
                          onChange={(e) => setCamposSelecionados({
                            ...camposSelecionados,
                            [campo.id]: {
                              ...camposSelecionados[campo.id],
                              italico: e.target.checked
                            }
                          })}
                          disabled={!camposSelecionados[campo.id]?.ativo}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Grid>

            {/* Preview */}
            <Grid item xs={12}>
              <Divider><Typography variant="overline">Pré-visualização</Typography></Divider>
              <Paper sx={{ p: 2, mt: 2, backgroundColor: '#f5f5f5', display: 'flex', flexWrap: 'wrap' }}>
                {gerarPreview()}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setLayoutDialog(false); resetForm(); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveLayout} disabled={loading}>
            {editandoLayout ? 'Atualizar Layout' : 'Salvar Layout'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Impressão de Etiquetas */}
      <Dialog open={impressaoDialog} onClose={() => setImpressaoDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Imprimir Etiquetas - {layoutSelecionado?.nome_layout}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Informações do Layout */}
            <Grid item xs={12}>
              <Alert severity="info">
                Layout: {layoutSelecionado?.colunas}x{layoutSelecionado?.linhas} = {layoutSelecionado?.colunas * layoutSelecionado?.linhas} etiquetas por página
              </Alert>
            </Grid>

            {/* Tipo de Impressora */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Impressora</InputLabel>
                <Select
                  value={tipoImpressora}
                  onChange={(e) => setTipoImpressora(e.target.value)}
                  label="Tipo de Impressora"
                >
                  <MenuItem value="padrao">Padrão (HTML/PDF)</MenuItem>
                  <MenuItem value="zebra">Zebra (ZPL)</MenuItem>
                  <MenuItem value="elgin">Elgin (ESC/POS)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* IP da Impressora (apenas para Zebra/Elgin) */}
            {(tipoImpressora === 'zebra' || tipoImpressora === 'elgin') && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="IP da Impressora (opcional)"
                  value={ipImpressora}
                  onChange={(e) => setIpImpressora(e.target.value)}
                  fullWidth
                  placeholder="Ex: 192.168.1.100"
                  helperText="Deixe vazio para gerar somente o código"
                />
              </Grid>
            )}

            {/* Alerta sobre impressoras Zebra/Elgin */}
            {(tipoImpressora === 'zebra' || tipoImpressora === 'elgin') && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  <strong>Modo {tipoImpressora === 'zebra' ? 'Zebra (ZPL)' : 'Elgin (ESC/POS)'}</strong>: 
                  {ipImpressora ? 
                    ` O código será enviado diretamente para a impressora em ${ipImpressora}` : 
                    ' Será gerado apenas o código para envio manual'
                  }
                </Alert>
              </Grid>
            )}

            {/* Opção: Saltar Etiquetas */}
            <Grid item xs={12}>
              <TextField
                label="Saltar Etiquetas"
                type="number"
                value={saltarEtiquetas}
                onChange={(e) => setSaltarEtiquetas(parseInt(e.target.value) || 0)}
                fullWidth
                helperText={`Deixa ${saltarEtiquetas} posições vazias antes de começar a imprimir. Use se já usou parte da folha.`}
                inputProps={{ min: 0, max: (layoutSelecionado?.colunas * layoutSelecionado?.linhas) - 1 }}
              />
            </Grid>

            {/* Tipo de Filtro */}
            <Grid item xs={12}>
              <Divider><Typography variant="overline">Selecionar Produtos</Typography></Divider>
            </Grid>

            <Grid item xs={12}>
              <Tabs value={filtroTipo} onChange={(e, v) => setFiltroTipo(v)}>
                <Tab label="Por Produto" value="produto" />
                <Tab label="Por Grupo" value="grupo" />
                <Tab label="Por Compra" value="compra" />
              </Tabs>
            </Grid>

            {/* Filtro por Produto */}
            {filtroTipo === 'produto' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="Buscar Produto"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Digite código, nome ou código de barras..."
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
                    <List>
                      {produtosFiltrados().map((produto) => (
                        <ListItem key={produto.id_produto}>
                          <Checkbox
                            checked={produtosSelecionados.includes(produto.id_produto)}
                            onChange={() => handleProdutoToggle(produto.id_produto)}
                          />
                          <ListItemText
                            primary={produto.nome_produto}
                            secondary={`Código: ${produto.codigo_produto} | Barras: ${produto.codigo_barras || 'N/A'}`}
                          />
                          {produtosSelecionados.includes(produto.id_produto) && (
                            <ListItemSecondaryAction>
                              <TextField
                                label="Qtd"
                                type="number"
                                value={quantidadePorProduto[produto.id_produto] || 1}
                                onChange={(e) => handleQuantidadeChange(produto.id_produto, e.target.value)}
                                size="small"
                                sx={{ width: 80 }}
                                inputProps={{ min: 1, max: 100 }}
                              />
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              </>
            )}

            {/* Filtro por Grupo */}
            {filtroTipo === 'grupo' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Selecione o Grupo</InputLabel>
                    <Select
                      value={grupoFiltro}
                      onChange={(e) => setGrupoFiltro(e.target.value)}
                      label="Selecione o Grupo"
                    >
                      <MenuItem value="">
                        <em>Todos</em>
                      </MenuItem>
                      {Array.isArray(grupos) && grupos.map((grupo) => (
                        <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                          {grupo.nome_grupo}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
                    <List>
                      {produtosFiltrados().map((produto) => (
                        <ListItem key={produto.id_produto}>
                          <Checkbox
                            checked={produtosSelecionados.includes(produto.id_produto)}
                            onChange={() => handleProdutoToggle(produto.id_produto)}
                          />
                          <ListItemText
                            primary={produto.nome_produto}
                            secondary={`Código: ${produto.codigo_produto}`}
                          />
                          {produtosSelecionados.includes(produto.id_produto) && (
                            <ListItemSecondaryAction>
                              <TextField
                                label="Qtd"
                                type="number"
                                value={quantidadePorProduto[produto.id_produto] || 1}
                                onChange={(e) => handleQuantidadeChange(produto.id_produto, e.target.value)}
                                size="small"
                                sx={{ width: 80 }}
                                inputProps={{ min: 1, max: 100 }}
                              />
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              </>
            )}

            {/* Filtro por Compra */}
            {filtroTipo === 'compra' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Selecione a Compra</InputLabel>
                    <Select
                      value={compraFiltro}
                      onChange={(e) => setCompraFiltro(e.target.value)}
                      label="Selecione a Compra"
                    >
                      <MenuItem value="">
                        <em>Selecione</em>
                      </MenuItem>
                      {Array.isArray(compras) && compras.map((compra) => (
                        <MenuItem key={compra.id_compra} value={compra.id_compra}>
                          Compra #{compra.id_compra} - {compra.fornecedor_nome || 'Fornecedor'} - {new Date(compra.data_compra).toLocaleDateString()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info">
                    Selecione uma compra para carregar seus produtos automaticamente
                  </Alert>
                </Grid>
              </>
            )}

            {/* Resumo */}
            <Grid item xs={12}>
              <Divider><Typography variant="overline">Resumo</Typography></Divider>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Produtos selecionados: {produtosSelecionados.length}
                </Typography>
                <Typography variant="body2">
                  Total de etiquetas: {Object.values(quantidadePorProduto).reduce((a, b) => a + b, 0)}
                </Typography>
                <Typography variant="body2">
                  Posições vazias: {saltarEtiquetas}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                  Total a imprimir: {saltarEtiquetas + Object.values(quantidadePorProduto).reduce((a, b) => a + b, 0)} posições
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImpressaoDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={imprimirEtiquetas}
            disabled={produtosSelecionados.length === 0}
          >
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
