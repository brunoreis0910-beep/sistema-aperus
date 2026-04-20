import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, 
  CircularProgress, Alert, Grid, Card, CardMedia,
  CardContent, Chip, Autocomplete, Divider, IconButton,
  Tooltip, InputAdornment
} from '@mui/material';
import {
  QrCodeScanner, Save, Refresh, AttachMoney,
  Category, Info, CheckCircle, Error as ErrorIcon, Search
} from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function CadastroTurboProduto() {
  const navigate = useNavigate();
  const [ean, setEan] = useState('');
  const [loading, setLoading] = useState(false);
  const [dadosProduto, setDadosProduto] = useState(null);
  const [produtoExistente, setProdutoExistente] = useState(false);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);
  const [gruposDisponiveis, setGruposDisponiveis] = useState([]);
  const gruposDisponiveisRef = useRef([]);
  const [classificandoIA, setClassificandoIA] = useState(false);
  const [isProdutoGenerico, setIsProdutoGenerico] = useState(false);
  const [precosRegionais, setPrecosRegionais] = useState(null);
  const [loadingPrecos, setLoadingPrecos] = useState(false);
  const [mensagemApi, setMensagemApi] = useState('');
  const [fonteApi, setFonteApi] = useState('');
  
  const inputRef = useRef(null);
  const nomeRef = useRef(null);

  // Foco automático no campo EAN ao carregar
  useEffect(() => {
    inputRef.current?.focus();
    carregarCategorias();
    carregarGrupos();
    
    // 🌟 BUSCA AUTOMÁTICA: Detectar EAN vindo de importação de XML
    const eanAuto = sessionStorage.getItem('cadastro_turbo_ean_auto');
    const dadosXMLStr = sessionStorage.getItem('cadastro_turbo_dados_xml');
    
    if (eanAuto) {
      console.log('🎯 EAN automático detectado:', eanAuto);
      
      // 🔥 NOVO: Verificar se há dados completos do XML
      let dadosXML = null;
      if (dadosXMLStr) {
        try {
          dadosXML = JSON.parse(dadosXMLStr);
          console.log('📄 Dados do XML recebidos:', dadosXML);
        } catch (e) {
          console.error('Erro ao parsear dados XML:', e);
        }
      }
      
      // Definir o EAN e fazer busca automática
      setEan(eanAuto);
      
      // Fazer busca após um pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => {
        buscarProdutoPorEan(eanAuto, dadosXML);
      }, 100);
      
      // Limpar sessionStorage após usar
      sessionStorage.removeItem('cadastro_turbo_ean_auto');
      sessionStorage.removeItem('cadastro_turbo_dados_xml');
      
      toast.info(dadosXML ? '📦 Carregando dados do XML...' : '🔍 Buscando produto automaticamente...', {
        autoClose: 2000
      });
    } else {
      // Turbo aberto diretamente (menu/link) — limpa dados de compra SOMENTE
      // se não veio de uma navegação do compra_form (flag 'voltando' não existe)
      const voltandoDeCompra = sessionStorage.getItem('cadastro_turbo_voltando');
      if (!voltandoDeCompra) {
        sessionStorage.removeItem('cadastro_turbo_origem');
        sessionStorage.removeItem('cadastro_turbo_item_index');
      }
    }
  }, []);

  const carregarCategorias = async () => {
    try {
      const response = await api.get('/api/categorias-mercadologicas/?nivel=3');
      if (response.data.sucesso) {
        const categorias = response.data.categorias || [];
        setCategoriasDisponiveis(Array.isArray(categorias) ? categorias : []);
      } else {
        setCategoriasDisponiveis([]);
      }
    } catch (error) {
      // Falha silenciosa — categorias são opcionais, não bloqueia o uso da tela
      console.warn('Não foi possível carregar categorias mercadológicas:', error?.message);
      setCategoriasDisponiveis([]);
    }
  };

  const carregarGrupos = async () => {
    try {
      // CORREÇÃO: endpoint correto é 'grupos-produto' (singular) e não 'grupos-produtos'
      const response = await api.get('/api/grupos-produto/');
      if (response.data) {
        // Se a API retornar paginação, pega os results, senão pega direto
        const grupos = Array.isArray(response.data) ? response.data : (response.data.results || []);
        
        // Ordenar alfabeticamente para facilitar encontrar
        grupos.sort((a, b) => (a.nome_grupo || '').localeCompare(b.nome_grupo || ''));
        
        gruposDisponiveisRef.current = grupos;
        setGruposDisponiveis(grupos);
      }
    } catch (error) {
      console.warn('Erro ao carregar grupos:', error?.message);
      // Fallback: Tenta carregar sem paginação se falhar
      if (error?.response?.status === 404) {
          console.log("Tentando endpoint alternativo...");
      }
    }
  };

  const buscarProdutoPorEan = async (eanParam = null, dadosXML = null) => {
    // Usa o EAN passado como parâmetro ou o do estado
    const eanBusca = eanParam || ean;
    
    // Evita busca vazia ou curta
    if (!eanBusca || eanBusca.length < 8) return;

    setLoading(true);
    try {
      console.log('[GTIN] ===== INICIANDO BUSCA EAN =====');
      console.log('[GTIN] eanParam:', eanParam, '| ean (estado):', ean, '| eanBusca:', eanBusca);
      console.log('[GTIN] dadosXML:', dadosXML);
      // Passa nome do XML ao backend para busca de imagem mesmo em produtos genéricos
      const nomeSugerido = dadosXML?.nome ? encodeURIComponent(dadosXML.nome) : '';
      const urlTurbo = nomeSugerido
        ? `/api/produtos/cadastro-turbo/?ean=${eanBusca}&nome_sugerido=${nomeSugerido}`
        : `/api/produtos/cadastro-turbo/?ean=${eanBusca}`;
      console.log('[GTIN] URL:', urlTurbo);
      const response = await api.get(urlTurbo);
      console.log('[GTIN] Resposta HTTP status:', response.status);
      console.log('[GTIN] Resposta completa:', JSON.stringify(response.data));
      console.log('[GTIN] fonte:', response.data.fonte, '| is_generic:', response.data.is_generic);
      console.log('[GTIN] dados.gtin:', response.data.dados?.gtin, '| dados.nome_produto:', response.data.dados?.nome_produto);
      
      // Auto-focus if generic
      const isGeneric = response.data.is_generic === true;
      const fonteResposta = response.data.fonte || '';
      setFonteApi(fonteResposta);
      setMensagemApi(response.data.mensagem || '');

      if (response.data.produto_existente) {
        toast.info('⚠️ Produto já cadastrado!');
        setProdutoExistente(true);
        setIsProdutoGenerico(false);
      } else {
        setIsProdutoGenerico(isGeneric);
        setProdutoExistente(false);
        if (isGeneric) {
          toast.warning('📝 EAN não encontrado. Preencha os dados.');
        } else if (fonteResposta === 'GEMINI_IA') {
          toast.info('🤖 Produto identificado via IA — confira os dados antes de salvar.');
        } else {
          toast.success('✅ Produto encontrado!');
        }
      }
      
      const dados = response.data.dados || {};
      
      // Se há dados do XML: sempre mescla campos fiscais e preço de custo real da NF
      if (dadosXML) {
        // Dados tributários do XML (sempre aplicar, independente de genérico)
        dados.cfop = dadosXML.cfop || dados.cfop || '';
        dados.cst_icms = dadosXML.cst || dados.cst_icms || '';
        dados.csosn = dadosXML.csosn || dados.csosn || '';
        dados.aliquota_icms = dadosXML.picms || dados.aliquota_icms || '';
        dados.base_icms = dadosXML.vbc_icms || dados.base_icms || '';
        dados.valor_icms = dadosXML.vicms || dados.valor_icms || '';
        dados.valor_ipi = dadosXML.vipi || dados.valor_ipi || '';
        dados.valor_pis = dadosXML.vpis || dados.valor_pis || '';
        dados.valor_cofins = dadosXML.vcofins || dados.valor_cofins || '';
        // Preço de custo real da NF (prioridade sobre o da API)
        if (dadosXML.valor_unitario) {
          dados.preco_custo = parseFloat(dadosXML.valor_unitario);
        }
        // Calcular margem e preço de venda sugerido (50% de margem sobre custo)
        if (dados.preco_custo > 0 && !dados.preco_venda) {
          dados.preco_venda = parseFloat((dados.preco_custo * 1.5).toFixed(2));
        }
      }

      // 🔥 Se produto genérico (não encontrado na API), mescla também nome/ncm do XML
      if (dadosXML && isGeneric) {
        console.log('📦 Mesclando dados do XML com resposta da API (produto genérico)...');
        dados.gtin = dadosXML.gtin || eanBusca || dados.gtin || '';
        dados.nome_produto = dadosXML.nome || dados.nome_produto || '';
        dados.ncm = dadosXML.ncm || dados.ncm || '';
        dados.unidade_medida = dadosXML.unidade || dados.unidade_medida || 'UN';
        
        toast.success('📄 Dados do XML carregados com sucesso!', {
          autoClose: 3000
        });
      }
      
      // Se nome genérico E NÃO TEM DADOS DO XML, limpa para o user digitar
      if (isGeneric && !dadosXML) {
        dados.nome_produto = '';
        dados.marca = '';
      }

      // ===== POLLING DE IMAGEM (se backend retornou job_id) — armazena no state =====
      const jobId = response.data.imagem_job_id;
      if (jobId) {
        dados.imagem_job_id = jobId;  // Enviado ao backend no save para checar cache
      }

      // Libera a tela imediatamente com os dados do produto
      setDadosProduto(dados);
      if (isGeneric && !dadosXML) {
        setTimeout(() => nomeRef.current?.focus(), 100);
      }

      // ===== BUSCA PREÇOS REGIONAIS + IA EM PARALELO (não bloqueia o formulário) =====
      const buscarPrecosBackground = async () => {
        if (!eanBusca) return;
        setLoadingPrecos(true);
        try {
          // Passa o nome do produto para o serviço usar caso não encontre via EAN
          const nomeParaPreco = dados.nome_produto || '';
          const nomeParam = nomeParaPreco ? `&nome=${encodeURIComponent(nomeParaPreco)}` : '';
          const resPrecos = await api.get(`/api/produtos/precos-regiao/?ean=${eanBusca}&raio=20${nomeParam}`);
          if (resPrecos.data.sucesso) {
            setPrecosRegionais(resPrecos.data);
            if ((!dados.preco_venda || dados.preco_venda === 0) && resPrecos.data.estatisticas?.media) {
               const precoSugerido = parseFloat(resPrecos.data.estatisticas.media);
               setDadosProduto(prev => ({
                 ...prev,
                 preco_venda: precoSugerido,
                 preco_custo: prev?.preco_custo || parseFloat((precoSugerido * 0.65).toFixed(2))
               }));
               const fonteTexto = resPrecos.data.fonte === 'PESQUISA_WEB' ? 'Pesquisa Internet' : 'Média da Região';
               toast.info(`💰 Preço sugerido: R$ ${precoSugerido.toFixed(2)} (${fonteTexto})`);
            }
          } else {
            setPrecosRegionais(null);
          }
        } catch (err) {
          console.warn('❌ [PREÇOS] Erro ao buscar preços regionais:', err?.response?.data || err?.message);
          setPrecosRegionais(null);
        } finally {
          setLoadingPrecos(false);
        }
      };

      const classificarBackground = () => {
        // 🔥 Se veio do XML, SEMPRE classifica para preencher grupo e categoria
        // Se não veio do XML, só classifica se estiver faltando dados
        if (dados.nome_produto && (dadosXML || !dados.id_grupo || !dados.ncm || !dados.classificacao)) {
          autoClassificarComIA(dados.nome_produto);
        }
      };

      // Dispara ambos em paralelo sem await (background)
      buscarPrecosBackground();
      classificarBackground();

      // ===== POLLING DE IMAGEM em background (atualiza state quando pronto) =====
      if (jobId && !dados.imagem_url_externa) {
        const MAX_TENTATIVAS = 8;
        let tentativa = 0;
        const pollImagem = async () => {
          if (tentativa >= MAX_TENTATIVAS) return;
          tentativa++;
          try {
            const resJob = await api.get(`/api/produtos/imagem-job/?job_id=${jobId}`);
            if (resJob.data.ready && resJob.data.imagem_url) {
              setDadosProduto(prev => prev ? { ...prev, imagem_url_externa: resJob.data.imagem_url } : prev);
              console.log('[TURBO] Imagem carregada em background:', resJob.data.imagem_url.slice(0, 60));
              return;
            }
          } catch (_) {}
          setTimeout(pollImagem, 3000);
        };
        setTimeout(pollImagem, 3000);
      }

    } catch (error) {
      console.error('[GTIN] ===== ERRO NA BUSCA =====');
      console.error('[GTIN] EAN buscado:', eanBusca);
      console.error('[GTIN] HTTP status:', error?.response?.status);
      console.error('[GTIN] Resposta de erro:', JSON.stringify(error?.response?.data));
      console.error('[GTIN] Mensagem:', error?.message);
      console.error('[GTIN] Stack:', error?.stack);
      toast.error(`[GTIN ERRO] ${error?.response?.data?.mensagem || error?.message || 'Erro desconhecido'}`);
      setDadosProduto(null);
    } finally {
      setLoading(false);
    }
  };

  const autoClassificarComIA = async (nome) => {
    try {
        toast.info("🤖 IA analisando produto para preenchimento automático...");
        const response = await api.post('/api/intelligence/classificar/', { nome_produto: nome });
        
        console.log('🤖 [IA] Resposta completa:', JSON.stringify(response.data));
        
        // Compatível com ambos os formatos:
        // Formato novo: { sucesso: true, sugestoes: { grupo_sugerido: ..., ... } }
        // Formato antigo: { grupo_sugerido: ..., ... } (resposta direta)
        const sugestoes = response.data.sugestoes || response.data;
        
        // Verifica se tem dados úteis (pelo menos grupo_sugerido)
        if (sugestoes && sugestoes.grupo_sugerido) {
            console.log('🤖 [IA] Sugestões extraídas:', JSON.stringify(sugestoes));
            
            // Lógica para resolver o ID do grupo (buscar existente ou criar novo)
            let idGrupoResolvido = null;
            let nomeGrupoResolvido = '';
            let grupoFoiCriadoAgora = false;
            
            if (sugestoes.grupo_sugerido) {
                // 1. Tentar encontrar grupo existente (usa ref para evitar closure stale)
                const grupoEncontrado = gruposDisponiveisRef.current.find(g => 
                    g.nome_grupo.toLowerCase().includes(sugestoes.grupo_sugerido.toLowerCase()) ||
                    sugestoes.grupo_sugerido.toLowerCase().includes(g.nome_grupo.toLowerCase())
                );
                
                if (grupoEncontrado) {
                    idGrupoResolvido = grupoEncontrado.id_grupo;
                    nomeGrupoResolvido = grupoEncontrado.nome_grupo;
                } else {
                    // 2. Se não encontrar, criar automaticamente
                    console.log("Grupo sugerido não encontrado. Criando automaticamente:", sugestoes.grupo_sugerido);
                    try {
                       const resNovoGrupo = await api.post('/api/grupos-produto/', { nome_grupo: sugestoes.grupo_sugerido });
                       if (resNovoGrupo.data && resNovoGrupo.data.id_grupo) {
                           const novoGrupo = resNovoGrupo.data;
                           idGrupoResolvido = novoGrupo.id_grupo;
                           nomeGrupoResolvido = novoGrupo.nome_grupo;
                           grupoFoiCriadoAgora = true;
                           
                           // Atualizar lista de grupos disponíveis
                           const novosGrupos = [...gruposDisponiveisRef.current, novoGrupo].sort((a,b)=>a.nome_grupo.localeCompare(b.nome_grupo));
                           gruposDisponiveisRef.current = novosGrupos;
                           setGruposDisponiveis(novosGrupos);
                           toast.success(`✨ Grupo criado automaticamente: ${novoGrupo.nome_grupo}`, { autoClose: 4000 });
                       }
                    } catch (errCriacao) {
                       console.error("Erro ao criar grupo automático:", errCriacao);
                       toast.warning(`Não foi possível criar o grupo '${sugestoes.grupo_sugerido}' automaticamente.`);
                    }
                }
            }

            console.log('🤖 [IA] Grupo resolvido:', { idGrupoResolvido, nomeGrupoResolvido, grupoFoiCriadoAgora });
            
            setDadosProduto(prev => {
                let novosDados = { ...prev };
                let alterado = false;

                // 1. Aplicar Grupo (se resolvido e campo vazio)
                if (!novosDados.id_grupo && idGrupoResolvido) {
                    novosDados.id_grupo = idGrupoResolvido;
                    // Se não foi criado agora (já existia), avisa que foi selecionado
                    if (!grupoFoiCriadoAgora) {
                         toast.success(`🤖 Grupo definido como: ${nomeGrupoResolvido}`, { autoClose: 3000 });
                    }
                    alterado = true;
                }

                // 2. Preencher NCM se vazio
                if (!novosDados.ncm && sugestoes.ncm_provavel) {
                    novosDados.ncm = sugestoes.ncm_provavel;
                    toast.success(`🤖 NCM preenchido: ${sugestoes.ncm_provavel}`, { autoClose: 3000 });
                    alterado = true;
                }

                // 3. Categoria (texto livre) - IGNORADO pois agora usamos categoria_mercadologica_id
                // if (!novosDados.categoria && sugestoes.categoria) {
                //    novosDados.categoria = sugestoes.categoria;
                //    alterado = true;
                // }
                
                // 3. Classificação Fiscal (Tipo do Item)
                // A IA pode retornar "00" ou "Mercadoria para Revenda" ou não retornar
                const classificacaoIA = sugestoes.classificacao_tipo_item || sugestoes.classificacao;
                if (!novosDados.classificacao && classificacaoIA) {
                     let codigoClassificacao = String(classificacaoIA);
                     if (codigoClassificacao.length > 2) {
                        if (codigoClassificacao.toLowerCase().includes("revenda")) codigoClassificacao = "00";
                        else if (codigoClassificacao.toLowerCase().includes("matéria")) codigoClassificacao = "01";
                        else if (codigoClassificacao.toLowerCase().includes("consumo")) codigoClassificacao = "07";
                        else codigoClassificacao = "00"; // Padrão para varejo
                     }
                     novosDados.classificacao = codigoClassificacao;
                     toast.success(`🤖 Classificação: ${codigoClassificacao}`, { autoClose: 3000 });
                     alterado = true;
                } else if (!novosDados.classificacao) {
                     // Fallback: se IA não retornou classificação, usa 00 (Mercadoria para Revenda)
                     novosDados.classificacao = "00";
                     alterado = true;
                }
                
                // 4. Preencher Categoria — salva o nome no campo 'categoria' do produto (texto)
                if (!novosDados.categoria) {
                    let catEncontrada = null;
                    
                    // Prioridade 1: IA retornou o ID diretamente da lista de categorias
                    const categoriaIdIA = sugestoes.categoria_id;
                    if (categoriaIdIA) {
                        catEncontrada = categoriasDisponiveis.find(c => c.id === categoriaIdIA);
                    }
                    
                    // Prioridade 2: Fallback - buscar pelo nome sugerido
                    if (!catEncontrada) {
                        const categoriaSugerida = sugestoes.categoria_sugerida || sugestoes.categoria;
                        if (categoriaSugerida) {
                            const termo = categoriaSugerida.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                            catEncontrada = categoriasDisponiveis.find(c => {
                                const nome = (c.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                                const caminho = (c.caminho_completo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                                return nome === termo || caminho.includes(termo) || termo.includes(nome);
                            });
                        }
                    }
                    
                    if (catEncontrada) {
                        novosDados.categoria_mercadologica_id = catEncontrada.id;
                        novosDados.categoria = catEncontrada.nome;
                        novosDados.confianca_ia = categoriaIdIA ? 0.95 : 0.80;
                        toast.success(`🤖 Categoria definida: ${catEncontrada.caminho_completo || catEncontrada.nome}`, { autoClose: 3000 });
                        alterado = true;
                    }
                }

                console.log('🤖 [IA] Resultado aplicação:', { alterado, grupo: novosDados.id_grupo, classificacao: novosDados.classificacao, ncm: novosDados.ncm, categoria: novosDados.categoria_mercadologica_id });
                return alterado ? novosDados : prev;
            });
        } else {
            console.warn('🤖 [IA] Resposta sem grupo_sugerido. Dados recebidos:', JSON.stringify(sugestoes));
        }
    } catch (error) {
        const status = error?.response?.status;
        const erroMsg = error?.response?.data?.erro || error?.message || '';
        console.error("❌ [IA] Erro na auto-classificação:", status, error?.response?.data || error?.message);
        
        if (erroMsg.includes('429') || erroMsg.includes('RESOURCE_EXHAUSTED') || erroMsg.includes('quota')) {
            toast.warning(
                "⚠️ Limite da IA atingido (quota diária). Tente novamente em alguns minutos ou preencha manualmente.",
                { autoClose: 8000 }
            );
        } else {
            toast.error("Erro ao classificar com IA: " + erroMsg);
        }
    }
  };

  const classificarComIA = async (nome, descricao = '') => {
    setClassificandoIA(true);
    try {
      // 1. Classificar categoria mercadológica via endpoint dedicado
      const response = await api.post('/api/produtos/classificar-ia/', {
        nome,
        descricao
      });
      
      if (response.data.sucesso) {
        // Encontra o nome da categoria pelo ID para salvar no campo 'categoria' (texto)
        const catObj = categoriasDisponiveis.find(c => c.id === response.data.subcategoria_id);
        setDadosProduto(prev => ({
          ...prev,
          categoria_mercadologica_id: response.data.subcategoria_id,
          categoria: catObj?.nome || response.data.caminho?.split(' > ').pop() || '',
          categoria_sugerida: response.data.caminho,
          confianca_ia: response.data.confianca
        }));
        
        toast.info(
          `🤖 IA classificou como: ${response.data.caminho} (${Math.round(response.data.confianca * 100)}% confiança)`,
          { autoClose: 5000 }
        );
      }

      // 2. Também preenche Grupo, NCM e Classificação via Gemini 
      await autoClassificarComIA(nome);

    } catch (error) {
      console.error('Erro ao classificar com IA:', error);
    } finally {
      setClassificandoIA(false);
    }
  };

  const usarProdutoExistente = () => {
    // Produto já existe — apenas vincula e volta para a compra sem salvar
    const origem = sessionStorage.getItem('cadastro_turbo_origem');
    const itemIndex = sessionStorage.getItem('cadastro_turbo_item_index');

    if (origem === 'compra_form' && itemIndex !== null) {
      sessionStorage.setItem('cadastro_turbo_produto_cadastrado', dadosProduto.gtin || dadosProduto.ean || ean || '');
      sessionStorage.setItem('cadastro_turbo_item_index_retorno', itemIndex);
    }

    sessionStorage.removeItem('cadastro_turbo_origem');
    sessionStorage.removeItem('cadastro_turbo_item_index');
    sessionStorage.removeItem('cadastro_turbo_ean_auto');
    
    // Sinalizar que está voltando do turbo para mudar para aba Produtos
    if (origem === 'compra_form') {
      sessionStorage.setItem('cadastro_turbo_voltando', 'true');
    }

    toast.success('✅ Produto vinculado!', { autoClose: 1500 });
    setTimeout(() => navigate(origem === 'compra_form' ? '/compras' : '/produtos'), 1000);
  };

  const salvarProduto = async () => {
    // Validações obrigatórias (iguais do Cadastro Normal)
    if (!dadosProduto.nome_produto) {
      toast.error('❌ Nome do produto é obrigatório');
      return;
    }
    
    // Validação de Grupo (Obrigatório)
    if (!dadosProduto.id_grupo) {
       toast.warning('⚠️ O campo "Grupo" é obrigatório.');
       // Tenta focar ou destacar o campo se possível
       return; 
    }

    // Validação de NCM (Obrigatório para emissão fiscal)
    if (!dadosProduto.ncm || dadosProduto.ncm.length < 2) {
       toast.warning('⚠️ O campo "NCM" é obrigatório para notas fiscais.');
       return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/produtos/salvar-turbo/', dadosProduto);
      
      if (response.data.sucesso) {
        toast.success(`✅ ${response.data.mensagem}`, { autoClose: 2000 });
        
        // Verificar de onde veio para voltar para o lugar correto
        const origem = sessionStorage.getItem('cadastro_turbo_origem');
        const itemIndex = sessionStorage.getItem('cadastro_turbo_item_index');
        
        // Salvar informações do produto cadastrado para seleção automática
        if (origem === 'compra_form' && itemIndex !== null) {
          // dadosProduto vem do backend com campo 'gtin', não 'ean'
          sessionStorage.setItem('cadastro_turbo_produto_cadastrado', dadosProduto.gtin || dadosProduto.ean || ean || '');
          sessionStorage.setItem('cadastro_turbo_item_index_retorno', itemIndex);
        }
        
        // Limpar sessionStorage de origem
        sessionStorage.removeItem('cadastro_turbo_origem');
        sessionStorage.removeItem('cadastro_turbo_item_index');
        sessionStorage.removeItem('cadastro_turbo_ean_auto');
        
        // Aguardar um momento e ir para tela de Produtos
        setTimeout(() => {
          console.log('🚀 [TURBO] Navegando para: /produtos');
          navigate('/produtos');
        }, 1500);
      }
      
    } catch (error) {
      const erros = error.response?.data?.erros;
      if (erros) {
        Object.entries(erros).forEach(([campo, mensagens]) => {
          toast.error(`${campo}: ${mensagens.join(', ')}`);
        });
      } else {
        toast.error('Erro ao salvar produto');
      }
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setEan('');
    setDadosProduto(null);
    setProdutoExistente(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscarProdutoPorEan();
    }
  };

  // Auto-trigger search when EAN has sufficient length (bar code readers usually are fast)
  useEffect(() => {
    if (ean.length >= 8) {
       console.log('[GTIN] useEffect disparado - ean:', ean, '| length:', ean.length);
       // Debounce para evitar múltiplas buscas enquanto digita/bipe
       // Não bloqueia por 'loading' - se o usuário escaneou um novo EAN, busca imediatamente após debounce
       const timer = setTimeout(() => {
           console.log('[GTIN] Debounce concluído - chamando buscarProdutoPorEan com ean:', ean);
           buscarProdutoPorEan(ean);
       }, 500); 
       return () => clearTimeout(timer);
    }
  }, [ean]);

  const atualizarCampo = (campo, valor) => {
    setDadosProduto(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Quando o nome do produto muda (produto genérico), auto-classifica via IA após 1.5s de pausa
  useEffect(() => {
    if (!dadosProduto?.nome_produto || dadosProduto.nome_produto.length < 5) return;
    if (!isProdutoGenerico) return; // Só para genéricos — normal já roda na busca EAN
    // Só se faltar grupo, classificação ou NCM
    if (dadosProduto.id_grupo && dadosProduto.classificacao && dadosProduto.ncm) return;
    
    const timer = setTimeout(() => {
      autoClassificarComIA(dadosProduto.nome_produto);
    }, 1500);
    return () => clearTimeout(timer);
  }, [dadosProduto?.nome_produto]);

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <QrCodeScanner sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <div>
          <Typography variant="h4" gutterBottom>
            Cadastro Turbo de Produtos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bipe o código de barras para cadastro automático com IA
          </Typography>
        </div>
      </Box>

      {/* Campo de busca por EAN */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Código de Barras (EAN/GTIN)"
              placeholder="Bipe o código ou digite manualmente"
              value={ean}
              onChange={(e) => setEan(e.target.value)}
              onKeyPress={handleKeyPress}
              inputRef={inputRef}
              autoFocus
              disabled={loading}
              InputProps={{
                style: { fontSize: 20, fontWeight: 'bold' }
              }}
              helperText="Pressione Enter após digitar ou aguarde o bipe"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => buscarProdutoPorEan()}
              disabled={loading || !ean}
              sx={{ height: 56 }}
              startIcon={loading ? <CircularProgress size={20} /> : <QrCodeScanner />}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Resultado da busca */}
      {dadosProduto && (
        <Card sx={{ mb: 3 }}>
          <Grid container>
            {/* Imagem do produto em destaque */}
            <Grid item xs={12} md={3} sx={{ bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(dadosProduto.imagem_url_externa || dadosProduto.imagem_url) ? (
                <CardMedia
                  component="img"
                  image={dadosProduto.imagem_url_externa || dadosProduto.imagem_url}
                  alt={dadosProduto.nome_produto}
                  sx={{
                    height: 300,
                    width: '100%',
                    objectFit: 'contain',
                    p: 2
                  }}
                />
              ) : (
                <Box sx={{ p:5, textAlign:'center', color: '#999' }}>
                    <Category sx={{ fontSize: 60 }} />
                    <Typography>Sem Imagem</Typography>
                </Box>
              )}
            </Grid>

            {/* Dados do produto */}
            <Grid item xs={12} md={9}>
              <CardContent>
                {/* Cabeçalho */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    {dadosProduto.nome_produto || 'Nome não disponível'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      icon={<QrCodeScanner />}
                      label={`EAN: ${dadosProduto.gtin}`}
                      color="primary"
                    />
                    {dadosProduto.marca && (
                      <Chip label={`Marca: ${dadosProduto.marca}`} />
                    )}
                    {dadosProduto.ncm && (
                      <Chip label={`NCM: ${dadosProduto.ncm}`} variant="outlined" />
                    )}
                  </Box>

                  {produtoExistente && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <strong>Produto já existe no sistema!</strong><br />
                      Código: {dadosProduto.codigo_produto}
                    </Alert>
                  )}

                  {/* Alerta quando produto não foi identificado pela API */}
                  {isProdutoGenerico && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <strong>EAN não encontrado nas bases de dados</strong><br />
                      Preencha o nome abaixo para cadastrar o produto manualmente.
                      Após salvar, ele ficará disponível no sistema.
                    </Alert>
                  )}

                  {/* Alerta quando dados vieram do Gemini IA */}
                  {!isProdutoGenerico && fonteApi === 'GEMINI_IA' && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <strong>🤖 Dados identificados por Inteligência Artificial</strong><br />
                      Nome, marca e categoria foram preenchidos automaticamente via IA.
                      Confira as informações antes de salvar.
                    </Alert>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Quando produto já existe e veio de compra: botão para vincular e voltar */}
                {produtoExistente && (() => {
                  const origemCompra = sessionStorage.getItem('cadastro_turbo_origem') === 'compra_form';
                  if (origemCompra) {
                    return (
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                        <Button variant="outlined" onClick={limparFormulario} disabled={loading}>
                          Cancelar
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          size="large"
                          startIcon={<CheckCircle />}
                          onClick={usarProdutoExistente}
                          disabled={loading}
                        >
                          Usar este produto
                        </Button>
                      </Box>
                    );
                  }
                  return null;
                })()}

                {/* Formulário de edição */}
                {!produtoExistente && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        inputRef={nomeRef}
                        label="Nome do Produto *"
                        value={dadosProduto.nome_produto || ''}
                        onChange={(e) => atualizarCampo('nome_produto', e.target.value)}
                        error={isProdutoGenerico && !dadosProduto.nome_produto}
                        helperText={isProdutoGenerico && !dadosProduto.nome_produto ? 'Digite o nome do produto' : ''}
                        autoFocus={isProdutoGenerico}
                        sx={isProdutoGenerico ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'warning.main', borderWidth: 2 } } : {}}
                      />
                    </Grid>

                    {/* Categoria com IA */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Autocomplete
                          fullWidth
                          options={Array.isArray(categoriasDisponiveis) ? categoriasDisponiveis : []}
                          getOptionLabel={(option) => option?.caminho_completo || option?.nome || ''}
                          value={
                            Array.isArray(categoriasDisponiveis) 
                              ? categoriasDisponiveis.find(
                                  c => c?.id === dadosProduto?.categoria_mercadologica_id
                                ) || null
                              : null
                          }
                          onChange={(e, newValue) => {
                            atualizarCampo('categoria_mercadologica_id', newValue?.id);
                            atualizarCampo('categoria', newValue?.nome || '');
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Categoria Mercadológica"
                              helperText={
                                dadosProduto?.confianca_ia
                                  ? `Sugerido por IA (${Math.round(dadosProduto.confianca_ia * 100)}% confiança)`
                                  : 'Classificação mercadológica do produto'
                              }
                            />
                          )}
                          renderOption={(props, option) => {
                            if (!option) return null;
                            return (
                              <li {...props} key={option.id}>
                                <Box>
                                  <Typography variant="body2">
                                    {option.nome || 'Sem nome'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {option.caminho_completo || ''}
                                  </Typography>
                                </Box>
                              </li>
                            );
                          }}
                          loading={classificandoIA}
                        />
                        
                        <Tooltip title="Classificar com IA novamente">
                          <span>
                            <IconButton
                              color="primary"
                              onClick={() => classificarComIA(dadosProduto.nome_produto, dadosProduto.descricao)}
                              disabled={classificandoIA || !dadosProduto.nome_produto}
                            >
                              {classificandoIA ? <CircularProgress size={24} /> : <Refresh />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Peso Unitário (kg)"
                        value={dadosProduto.peso_unitario || ''}
                        onChange={(e) => atualizarCampo('peso_unitario', e.target.value)}
                        inputProps={{ step: 0.001 }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="GTIN / EAN"
                        value={dadosProduto.gtin || ''}
                        onChange={(e) => atualizarCampo('gtin', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && dadosProduto.gtin) {
                            buscarProdutoPorEan(dadosProduto.gtin);
                          }
                        }}
                        helperText="Código de barras do produto"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Tooltip title="Buscar dados na API Cosmos">
                                <IconButton
                                  edge="end"
                                  disabled={loading || !dadosProduto.gtin}
                                  onClick={() => buscarProdutoPorEan(dadosProduto.gtin)}
                                >
                                  {loading ? <CircularProgress size={18} /> : <Search />}
                                </IconButton>
                              </Tooltip>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Marca"
                        value={dadosProduto.marca || ''}
                        onChange={(e) => atualizarCampo('marca', e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="NCM *"
                        error={!dadosProduto.ncm}
                        helperText={!dadosProduto.ncm ? 'Obrigatório para emissão fiscal' : ''}
                        value={dadosProduto.ncm || ''}
                        onChange={(e) => atualizarCampo('ncm', e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Classificação *"
                        value={dadosProduto.classificacao || ''}
                        onChange={(e) => atualizarCampo('classificacao', e.target.value)}
                        SelectProps={{ native: true }}
                      >
                        <option value=""></option>
                        <option value="00">00 - Mercadoria para Revenda</option>
                        <option value="01">01 - Matéria-Prima</option>
                        <option value="02">02 - Embalagem</option>
                        <option value="03">03 - Produto em Processo</option>
                        <option value="04">04 - Produto Acabado</option>
                        <option value="05">05 - Subproduto</option>
                        <option value="06">06 - Produto Intermediário</option>
                        <option value="07">07 - Material de Uso e Consumo</option>
                        <option value="08">08 - Ativo Imobilizado</option>
                        <option value="09">09 - Serviços</option>
                        <option value="99">99 - Outros</option>
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Unidade"
                        value={dadosProduto.unidade_medida || 'UN'}
                        onChange={(e) => atualizarCampo('unidade_medida', e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Autocomplete
                        id="combo-box-grupos"
                        options={gruposDisponiveis}
                        getOptionLabel={(option) => option.nome_grupo || ''}
                        value={gruposDisponiveis.find(g => g.id_grupo === dadosProduto.id_grupo) || null}
                        isOptionEqualToValue={(option, value) => option.id_grupo === value.id_grupo}
                        onChange={(event, newValue) => {
                          atualizarCampo('id_grupo', newValue ? newValue.id_grupo : null);
                        }}
                        renderInput={(params) => (
                          <TextField 
                             {...params} 
                             label="Grupo *" 
                             error={!dadosProduto.id_grupo}
                             helperText={!dadosProduto.id_grupo ? 'Obrigatório' : ''}
                          />
                        )}
                        renderOption={(props, option) => {
                            const { key, ...otherProps } = props;
                            return (
                              <li key={option.id_grupo} {...otherProps}>
                                {option.nome_grupo}
                              </li>
                            );
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Preço Venda (R$)"
                        type="number"
                        value={dadosProduto.preco_venda || ''}
                        onChange={(e) => atualizarCampo('preco_venda', e.target.value)}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Preço Custo (R$)"
                        type="number"
                        value={dadosProduto.preco_custo || ''}
                        onChange={(e) => atualizarCampo('preco_custo', e.target.value)}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Descrição"
                        value={dadosProduto.descricao || ''}
                        onChange={(e) => atualizarCampo('descricao', e.target.value)}
                      />
                    </Grid>

                    {/* Preços da Concorrência */}
                    {(loadingPrecos || (precosRegionais && precosRegionais.precos?.length > 0)) && (
                      <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AttachMoney color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" fontWeight="bold">
                              {precosRegionais?.fonte === 'PESQUISA_WEB' ? 'Preços Pesquisados na Internet' : 'Preços na Região (Raio 20km)'}
                            </Typography>
                            {loadingPrecos && <CircularProgress size={20} sx={{ ml: 2 }} />}
                          </Box>

                          {precosRegionais && precosRegionais.estatisticas && (
                             <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                               <Chip label={`Média: R$ ${precosRegionais.estatisticas.media}`} color="primary" variant="outlined" />
                               <Chip label={`Mínimo: R$ ${precosRegionais.estatisticas.minimo}`} color="success" variant="outlined" />
                               <Chip label={`Máximo: R$ ${precosRegionais.estatisticas.maximo}`} color="error" variant="outlined" />
                             </Box>
                          )}

                          <Grid container spacing={1}>
                            {precosRegionais?.precos?.map((p, index) => (
                              <Grid item xs={12} sm={6} md={4} key={index}>
                                <Box sx={{ 
                                  borderLeft: '4px solid', 
                                  borderColor: (precosRegionais?.estatisticas?.media && p.valor < precosRegionais.estatisticas.media) ? 'success.main' : 'warning.main',
                                  pl: 1, py: 0.5, bgcolor: 'white', ml: 0.5 
                                }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {p.loja}
                                  </Typography>
                                  <Typography variant="body2">
                                    R$ {p.valor.toFixed(2)} {p.distancia_km != null && <span style={{ color: '#666', fontSize: '0.8em' }}>({p.distancia_km}km)</span>}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Paper>
                      </Grid>
                    )}

                    {/* Botões de ação */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={limparFormulario}
                          disabled={loading}
                        >
                          Cancelar
                        </Button>
                        
                        <Button
                          variant="contained"
                          color="success"
                          size="large"
                          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                          onClick={salvarProduto}
                          disabled={loading || !dadosProduto.nome_produto}
                        >
                          {loading ? 'Salvando...' : 'Salvar Produto'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Card de ajuda */}
      {!dadosProduto && (
        <Paper sx={{ p: 3, bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.light' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Info color="info" />
            <div>
              <Typography variant="h6" gutterBottom>
                Como funciona o Cadastro Turbo?
              </Typography>
              <Typography variant="body2" component="div">
                <p>1. <strong>Bipe o código de barras</strong> ou digite o EAN manualmente</p>
                <p>2. O sistema busca dados em <strong>APIs externas</strong> (Cosmos, GS1)</p>
                <p>3. A <strong>IA classifica automaticamente</strong> na categoria correta</p>
                <p>4. Confira os dados e clique em <strong>Salvar</strong></p>
                <p>5. Produto cadastrado em <strong>menos de 5 segundos!</strong></p>
              </Typography>
              <Alert severity="success" icon={<CheckCircle />}>
                Cadastro <strong>10x mais rápido</strong> que o método tradicional!
              </Alert>
            </div>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
