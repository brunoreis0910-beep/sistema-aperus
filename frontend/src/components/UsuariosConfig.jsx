import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  IconButton,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Backdrop,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Chip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  Storefront as VendedorIcon,
  AccountBalance as FinanceiroIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const UsuariosConfig = () => {
  const { axiosInstance } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [operacoes, setOperacoes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [currentUsuario, setCurrentUsuario] = useState({
    id: null,
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    is_staff: false,
    is_active: true,
    vendedor_id: null,
    password: '',
    parametros: {
      id_cliente_padrao: null,
      id_operacao_padrao: null,
      id_vendedor_padrao: null,
      id_grupo_padrao: null,
      id_tabela_comercial: null,
      id_cliente_nfce: null,
      id_operacao_nfce: null,
      id_vendedor_nfce: null
    },
    permissoes: {
      clientes_acessar: false,
      clientes_criar: false,
      clientes_editar: false,
      clientes_excluir: false,
      produtos_acessar: false,
      produtos_criar: false,
      produtos_editar: false,
      produtos_excluir: false,
      financeiro_acessar: false,
      financeiro_criar: false,
      financeiro_editar: false,
      financeiro_excluir: false,
      financeiro_baixar: false,
      config_acessar: false,
      config_empresa_editar: false,
      config_usuarios_acessar: false,
      config_usuarios_criar: false,
      config_usuarios_editar: false,
      config_usuarios_excluir: false,
      config_vendedores_acessar: false,
      config_vendedores_criar: false,
      config_vendedores_editar: false,
      config_vendedores_excluir: false,
      config_operacoes_acessar: false,
      config_operacoes_criar: false,
      config_operacoes_editar: false,
      config_operacoes_excluir: false,
      config_apoio_acessar: false,
      config_apoio_criar: false,
      config_apoio_editar: false,
      config_apoio_excluir: false,
      vendas_acessar: false,
      vendas_criar: false,
      vendas_editar: false,
      vendas_excluir: false,
      vendas_cancelar: false,
      compras_acessar: false,
      compras_criar: false,
      compras_editar: false,
      compras_excluir: false,
      trocas_acessar: false,
      trocas_criar: false,
      trocas_editar: false,
      trocas_excluir: false,
      ordens_acessar: false,
      ordens_criar: false,
      ordens_editar: false,
      ordens_excluir: false,
      cotacoes_acessar: false,
      cotacoes_criar: false,
      cotacoes_editar: false,
      cotacoes_excluir: false,
      devolucoes_acessar: false,
      devolucoes_criar: false,
      devolucoes_editar: false,
      devolucoes_excluir: false,
      comandas_acessar: false,
      comandas_criar: false,
      comandas_editar: false,
      comandas_excluir: false,
      petshop_acessar: false,
      petshop_criar: false,
      petshop_editar: false,
      petshop_excluir: false,
      catalogo_acessar: false,
      catalogo_editar: false,
      etiquetas_acessar: false,
      etiquetas_criar: false,
      etiquetas_editar: false,
      etiquetas_excluir: false,
      relatorios_acessar: false,
      relatorios_exportar: false,
      graficos_acessar: false,
      mapa_promocao_acessar: false,
      mapa_promocao_criar: false,
      mapa_promocao_editar: false,
      mapa_promocao_excluir: false,
      venda_rapida_acessar: false,
      nfce_acessar: false,
      nfce_criar: false,
      nfce_editar: false,
      nfce_excluir: false,
      nfe_acessar: false,
      nfe_criar: false,
      nfe_editar: false,
      nfe_excluir: false,
      cte_acessar: false,
      cte_criar: false,
      cte_editar: false,
      cte_excluir: false,
      mdfe_acessar: false,
      mdfe_criar: false,
      mdfe_editar: false,
      mdfe_excluir: false,
      fornecedores_acessar: false,
      fornecedores_criar: false,
      fornecedores_editar: false,
      fornecedores_excluir: false,
      agro_acessar: false,
      agro_criar: false,
      agro_editar: false,
      agro_excluir: false,
      sped_acessar: false,
      sped_contribuicoes_acessar: false,
      whatsapp_acessar: false,
      boletos_acessar: false,
      boletos_criar: false,
      boletos_editar: false,
      mapa_carga_acessar: false,
      mapa_carga_criar: false,
      mapa_carga_editar: false,
      producao_acessar: false,
      producao_criar: false,
      producao_editar: false,
      comissoes_acessar: false,
      conciliacao_acessar: false,
      cartoes_acessar: false,
      agenda_acessar: false,
      agenda_criar: false,
      agenda_editar: false,
      balancas_acessar: false,
      bancario_acessar: false,
      bancario_criar: false,
      bancario_editar: false,
      contas_servicos_acessar: false,
      aut_desconto: false,
      aut_cancelar_venda: false
    }
  });
  const [permissoesOriginais, setPermissoesOriginais] = useState([]);
  const [tabelasComerciais, setTabelasComerciais] = useState([]);
  const [novoVendedorDialog, setNovoVendedorDialog] = useState(false);
  const [novoVendedorNome, setNovoVendedorNome] = useState('');
  const [novoVendedorCpf, setNovoVendedorCpf] = useState('');
  const [novoVendedorTelefone, setNovoVendedorTelefone] = useState('');
  const [novoVendedorComissao, setNovoVendedorComissao] = useState('');

  useEffect(() => {
    carregarUsuarios();
    carregarDadosAuxiliares();
    carregarTabelasComerciais();
  }, []);

  // Debug: Log apenas quando o dialog abrir (não durante render)
  useEffect(() => {
    if (openDialog) {
      // Usar setTimeout para evitar setState durante render
      setTimeout(() => {
        console.log('🔍 [DIALOG ABERTO] Estado completo:');
        console.log('   isEditing:', isEditing);
        console.log('   currentUsuario:', currentUsuario);
        console.log('   currentUsuario.parametros:', currentUsuario.parametros);
        console.log('   id_tabela_comercial:', currentUsuario.parametros?.id_tabela_comercial);
        console.log('   Tipo:', typeof currentUsuario.parametros?.id_tabela_comercial);
        console.log('   Tabelas disponíveis:', tabelasComerciais.length);
      }, 0);
    }
  }, [openDialog]);

  const carregarDadosAuxiliares = async () => {
    try {
      const [resClientes, resOperacoes, resVendedores, resGrupos] = await Promise.all([
        axiosInstance.get('/clientes/?page_size=1000').catch(() => ({ data: [] })),
        axiosInstance.get('/operacoes/').catch(() => ({ data: [] })),
        axiosInstance.get('/vendedores/').catch(() => ({ data: [] })),
        axiosInstance.get('/grupos-produto/').catch(() => ({ data: [] }))
      ]);

      const clientesData = Array.isArray(resClientes.data) ? resClientes.data : (resClientes.data?.results || []);
      const operacoesData = Array.isArray(resOperacoes.data) ? resOperacoes.data : (resOperacoes.data?.results || []);
      const vendedoresData = Array.isArray(resVendedores.data) ? resVendedores.data : (resVendedores.data?.results || []);
      const gruposData = Array.isArray(resGrupos.data) ? resGrupos.data : (resGrupos.data?.results || []);

      setClientes(clientesData);
      setOperacoes(operacoesData);
      setVendedores(vendedoresData);
      setGrupos(gruposData);
    } catch (err) {
      console.error('❌ Erro ao carregar dados auxiliares:', err);
    }
  };

  const carregarTabelasComerciais = async () => {
    try {
      console.log('💰 Carregando tabelas comerciais da API...');
      const response = await axiosInstance.get('/tabelas-comerciais/?apenas_ativas=true');
      console.log('✅ Resposta da API:', response.data);

      // Garantir que sempre seja array
      const tabelasData = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);

      console.log('✅ Tabelas carregadas:', tabelasData);
      setTabelasComerciais(tabelasData);
    } catch (error) {
      console.error('❌ Erro ao carregar tabelas comerciais:', error);
    }
  };

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/usuarios/');
      console.log('📡 Resposta da API usuários:', response.data);

      let usuariosData = [];
      if (Array.isArray(response.data)) {
        usuariosData = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        usuariosData = response.data.results;
      } else if (response.data?.value && Array.isArray(response.data.value)) {
        usuariosData = response.data.value;
      }

      setUsuarios(usuariosData);
      setError(null);
    } catch (err) {
      console.error('❌ Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCurrentUsuario(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCurrentUsuario(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handlePermissionChange = (permission, value) => {
    setCurrentUsuario(prev => ({
      ...prev,
      permissoes: {
        ...prev.permissoes,
        [permission]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validações básicas
      if (!currentUsuario.username?.trim()) {
        setError('Nome de usuário é obrigatório');
        setLoading(false);
        return;
      }

      if (!currentUsuario.email?.trim()) {
        setError('Email é obrigatório');
        setLoading(false);
        return;
      }

      // Validar senha apenas para novos usuários
      if (!isEditing && !currentUsuario.password?.trim()) {
        setError('Senha é obrigatória para novos usuários');
        setLoading(false);
        return;
      }

      // Verificar se username já existe (apenas ao criar novo usuário)
      if (!isEditing) {
        const usuarioExistente = usuarios.find(
          u => u.username.toLowerCase() === currentUsuario.username.toLowerCase()
        );
        if (usuarioExistente) {
          setError('Nome de usuário já existe. Por favor, escolha outro nome.');
          setLoading(false);
          return;
        }
      }

      // Construir objeto de permissões a enviar.
      // Estratégia: ao editar, enviar APENAS as permissões que já existem no banco
      // Ao criar novo usuário, enviar todas as permissões (padrão False)
      let permissoesPayload = {};

      if (isEditing && permissoesOriginais && permissoesOriginais.length > 0) {
        // Editando: enviar APENAS as chaves que já existiam no registro original
        permissoesOriginais.forEach((k) => {
          // Converter boolean para 0/1 (modelo usa IntegerField)
          permissoesPayload[k] = currentUsuario.permissoes?.[k] ? 1 : 0;
        });
        console.log('🔒 Modo edição - Permissões originais:', permissoesOriginais);
        console.log('📤 Permissões a enviar (apenas existentes):', Object.keys(permissoesPayload));
      } else {
        // Novo usuário: enviar todas as permissões (serão criadas com valores iniciais)
        Object.keys(currentUsuario.permissoes || {}).forEach((k) => {
          permissoesPayload[k] = currentUsuario.permissoes[k] ? 1 : 0;
        });
        console.log('➕ Modo criação - Enviando todas as permissões padrão');
      }

      const dadosParaEnvio = {
        username: currentUsuario.username,
        email: currentUsuario.email,
        first_name: currentUsuario.first_name,
        last_name: currentUsuario.last_name,
        is_staff: currentUsuario.is_staff,
        is_active: currentUsuario.is_active,
        id_vendedor: currentUsuario.vendedor_id || null,
        parametros: {
          ...currentUsuario.parametros,
          controle_de_caixa: currentUsuario.parametros?.controle_de_caixa ? 1 : 0,
          mostrar_lucratividade: currentUsuario.parametros?.mostrar_lucratividade ? 1 : 0
        },
        permissoes: permissoesPayload
      };

      // Adicionar senha apenas se for um novo usuário ou se foi informada
      if (!isEditing || currentUsuario.password) {
        dadosParaEnvio.password = currentUsuario.password;
      }

      console.log('📤 Dados do usuário que serão enviados:', dadosParaEnvio);
      console.log('📋 Parâmetros específicos:', {
        id_tabela_comercial: currentUsuario.parametros?.id_tabela_comercial,
        id_cliente_padrao: currentUsuario.parametros?.id_cliente_padrao,
        id_operacao_padrao: currentUsuario.parametros?.id_operacao_padrao,
        id_vendedor_padrao: currentUsuario.parametros?.id_vendedor_padrao,
        id_grupo_padrao: currentUsuario.parametros?.id_grupo_padrao
      });

      if (isEditing && currentUsuario.id) {
        // Atualizar usuário existente
        await axiosInstance.patch(`/usuarios/${currentUsuario.id}/`, dadosParaEnvio);
        console.log('💾 Usuário atualizado via API');
      } else {
        // Criar novo usuário
        await axiosInstance.post('/usuarios/', dadosParaEnvio);
        console.log('💾 Novo usuário criado via API');
      }

      setOpenDialog(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setError(null);

      // Recarregar dados atualizados
      await carregarUsuarios();

    } catch (err) {
      console.error('❌ Erro ao salvar usuário:', err);
      console.error('❌ Detalhes do erro:', err.response?.data);
      
      // Tratamento específico para erro de usuário duplicado
      let mensagemErro = 'Erro ao salvar usuário';
      if (err.response?.data) {
        const erros = err.response.data;
        if (erros.username) {
          mensagemErro = 'Nome de usuário já existe. Por favor, escolha outro nome.';
        } else if (erros.email) {
          mensagemErro = 'Email já cadastrado. Por favor, use outro email.';
        } else if (erros.detail) {
          mensagemErro = erros.detail;
        } else {
          // Formatar múltiplos erros
          const mensagensErro = Object.entries(erros).map(([campo, msgs]) => {
            const mensagens = Array.isArray(msgs) ? msgs.join(', ') : msgs;
            return `${campo}: ${mensagens}`;
          }).join('; ');
          mensagemErro = mensagensErro || err.message;
        }
      } else {
        mensagemErro = err.message;
      }
      
      setError(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usuario) => {
    console.log('📝 Editando usuário:', usuario);
    console.log('📋 Parâmetros do usuário:', usuario.parametros);
    console.log('💰 Tabela comercial atual:', usuario.parametros?.id_tabela_comercial);
    console.log('📊 Tabelas comerciais disponíveis:', tabelasComerciais);

    setCurrentUsuario({
      ...usuario,
      password: '', // não carregar senha por segurança
      parametros: {
        id_cliente_padrao: usuario.parametros?.id_cliente_padrao || null,
        id_operacao_padrao: usuario.parametros?.id_operacao_padrao || null,
        id_vendedor_padrao: usuario.parametros?.id_vendedor_padrao || null,
        id_grupo_padrao: usuario.parametros?.id_grupo_padrao || null,
        // Garantir que o valor seja consistente (número ou vazio)
        id_tabela_comercial: usuario.parametros?.id_tabela_comercial
          ? Number(usuario.parametros.id_tabela_comercial)
          : null,
        // Controle de Caixa
        controle_de_caixa: Boolean(usuario.parametros?.controle_de_caixa),
        // Novos campos para Vendas e OS
        id_vendedor_venda: usuario.parametros?.id_vendedor_venda || null,
        id_operacao_venda: usuario.parametros?.id_operacao_venda || null,
        id_vendedor_os: usuario.parametros?.id_vendedor_os || null,
        id_operacao_os: usuario.parametros?.id_operacao_os || null,
        // Novos campos para NFC-e
        id_cliente_nfce: usuario.parametros?.id_cliente_nfce || null,
        id_vendedor_nfce: usuario.parametros?.id_vendedor_nfce || null,
        id_operacao_nfce: usuario.parametros?.id_operacao_nfce || null,
        // Visibilidade
        mostrar_lucratividade: Boolean(usuario.parametros?.mostrar_lucratividade)
      },
      permissoes: usuario.permissoes || {}
    });
    // Guardar as chaves de permissões que já existem no registro para o usuário
    setPermissoesOriginais(Object.keys(usuario.permissoes || {}));
    setIsEditing(true);
    setTabValue(0);
    setOpenDialog(true);
  };

  const handleNew = () => {
    setCurrentUsuario({
      id: null,
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      is_staff: false,
      is_active: true,
      vendedor_id: null,
      password: '',
      parametros: {
        id_cliente_padrao: null,
        id_operacao_padrao: null,
        id_vendedor_padrao: null,
        id_grupo_padrao: null,
        id_tabela_comercial: null,
        controle_de_caixa: false,
        id_cliente_nfce: null,
        id_operacao_nfce: null,
        id_vendedor_nfce: null,
        mostrar_lucratividade: false
      },
      permissoes: {
        clientes_acessar: false,
        clientes_criar: false,
        clientes_editar: false,
        clientes_excluir: false,
        produtos_acessar: false,
        produtos_criar: false,
        produtos_editar: false,
        produtos_excluir: false,
        financeiro_acessar: false,
        financeiro_criar: false,
        financeiro_editar: false,
        financeiro_excluir: false,
        financeiro_baixar: false,
        config_acessar: false,
        config_empresa_editar: false,
        config_usuarios_acessar: false,
        config_usuarios_criar: false,
        config_usuarios_editar: false,
        config_usuarios_excluir: false,
        config_vendedores_acessar: false,
        config_vendedores_criar: false,
        config_vendedores_editar: false,
        config_vendedores_excluir: false,
        config_operacoes_acessar: false,
        config_operacoes_criar: false,
        config_operacoes_editar: false,
        config_operacoes_excluir: false,
        config_apoio_acessar: false,
        config_apoio_criar: false,
        config_apoio_editar: false,
        config_apoio_excluir: false,
        vendas_acessar: false,
        vendas_criar: false,
        vendas_editar: false,
        vendas_excluir: false,
        vendas_cancelar: false,
        compras_acessar: false,
        compras_criar: false,
        compras_editar: false,
        compras_excluir: false,
        trocas_acessar: false,
        trocas_criar: false,
        trocas_editar: false,
        trocas_excluir: false,
        ordens_acessar: false,
        ordens_criar: false,
        ordens_editar: false,
        ordens_excluir: false,
        cotacoes_acessar: false,
        cotacoes_criar: false,
        cotacoes_editar: false,
        cotacoes_excluir: false,
        devolucoes_acessar: false,
        devolucoes_criar: false,
        devolucoes_editar: false,
        devolucoes_excluir: false,
        comandas_acessar: false,
        comandas_criar: false,
        comandas_editar: false,
        comandas_excluir: false,
        petshop_acessar: false,
        petshop_criar: false,
        petshop_editar: false,
        petshop_excluir: false,
        catalogo_acessar: false,
        catalogo_editar: false,
        etiquetas_acessar: false,
        etiquetas_criar: false,
        etiquetas_editar: false,
        etiquetas_excluir: false,
        relatorios_acessar: false,
        relatorios_exportar: false,
        graficos_acessar: false,
        mapa_promocao_acessar: false,
        mapa_promocao_criar: false,
        mapa_promocao_editar: false,
        mapa_promocao_excluir: false,
        venda_rapida_acessar: false,
        aut_desconto: false,
        aut_cancelar_venda: false
      }
    });
    setIsEditing(false);
    setTabValue(0);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        setLoading(true);
        await axiosInstance.delete(`/usuarios/${id}/`);
        console.log('🗑️ Usuário excluído');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        await carregarUsuarios();
      } catch (err) {
        console.error('❌ Erro ao excluir usuário:', err);
        setError('Erro ao excluir usuário: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  // Perfis de permissão rápida
  const aplicarPerfil = (perfil) => {
    const todasPermissoes = {};
    permissionsGroups.forEach(group => {
      group.permissions.forEach(p => {
        todasPermissoes[p.key] = false;
      });
    });

    if (perfil === 'administrador') {
      // Administrador: tudo habilitado
      Object.keys(todasPermissoes).forEach(k => { todasPermissoes[k] = true; });
    } else if (perfil === 'vendedor') {
      // Vendedor: vendas, clientes, produtos (visualizar), NFC-e, venda rápida, comandas, catálogo
      const vendedorPerms = [
        'vendas_acessar', 'vendas_criar', 'vendas_editar',
        'venda_rapida_acessar',
        'clientes_acessar', 'clientes_criar', 'clientes_editar',
        'produtos_acessar',
        'nfce_acessar', 'nfce_criar',
        'nfe_acessar', 'nfe_criar',
        'comandas_acessar', 'comandas_criar', 'comandas_editar',
        'catalogo_acessar',
        'trocas_acessar', 'trocas_criar',
        'devolucoes_acessar', 'devolucoes_criar',
        'etiquetas_acessar',
        'ordens_acessar', 'ordens_criar', 'ordens_editar',
        'relatorios_acessar',
        'graficos_acessar',
        'cotacoes_acessar', 'cotacoes_criar',
        'agenda_acessar', 'agenda_criar', 'agenda_editar',
        'comissoes_acessar',
      ];
      vendedorPerms.forEach(k => { if (k in todasPermissoes) todasPermissoes[k] = true; });
    } else if (perfil === 'financeiro') {
      // Financeiro: financeiro completo, bancário, boletos, conciliação, cartões, relatórios, contas
      const financeiroPerms = [
        'financeiro_acessar', 'financeiro_criar', 'financeiro_editar', 'financeiro_excluir', 'financeiro_baixar',
        'bancario_acessar', 'bancario_criar', 'bancario_editar',
        'boletos_acessar', 'boletos_criar', 'boletos_editar',
        'conciliacao_acessar',
        'cartoes_acessar',
        'contas_servicos_acessar',
        'relatorios_acessar', 'relatorios_exportar',
        'graficos_acessar',
        'clientes_acessar',
        'fornecedores_acessar',
        'vendas_acessar',
        'compras_acessar',
        'comissoes_acessar',
        'nfe_acessar',
        'nfce_acessar',
        'cte_acessar',
        'sped_acessar', 'sped_contribuicoes_acessar',
      ];
      financeiroPerms.forEach(k => { if (k in todasPermissoes) todasPermissoes[k] = true; });
    }

    setCurrentUsuario(prev => ({
      ...prev,
      permissoes: { ...prev.permissoes, ...todasPermissoes }
    }));
  };

  const handleCriarVendedor = async () => {
    if (!novoVendedorNome.trim()) {
      setError('Nome do vendedor é obrigatório');
      return;
    }
    try {
      setLoading(true);
      const res = await axiosInstance.post('/vendedores/', {
        nome: novoVendedorNome,
        cpf: novoVendedorCpf || null,
        telefone: novoVendedorTelefone || null,
        percentual_comissao: novoVendedorComissao ? parseFloat(novoVendedorComissao) : 0
      });
      const novoVendedor = res.data;
      setVendedores(prev => [...prev, novoVendedor]);
      setCurrentUsuario(prev => ({ ...prev, vendedor_id: novoVendedor.id_vendedor || novoVendedor.id }));
      setNovoVendedorDialog(false);
      setNovoVendedorNome('');
      setNovoVendedorCpf('');
      setNovoVendedorTelefone('');
      setNovoVendedorComissao('');
      setError(null);
    } catch (err) {
      console.error('Erro ao criar vendedor:', err);
      setError('Erro ao criar vendedor: ' + (err.response?.data?.detail || err.response?.data?.nome?.[0] || err.message));
    } finally {
      setLoading(false);
    }
  };

  const renderPermissionsGroup = (title, permissions) => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {permissions.map((permission) => (
            <Grid item xs={12} sm={6} md={4} key={permission.key}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentUsuario.permissoes[permission.key] || false}
                    onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                  />
                }
                label={permission.label}
              />
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  const permissionsGroups = [
    {
      title: 'Clientes',
      permissions: [
        { key: 'clientes_acessar', label: 'Acessar' },
        { key: 'clientes_criar', label: 'Criar' },
        { key: 'clientes_editar', label: 'Editar' },
        { key: 'clientes_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'Produtos',
      permissions: [
        { key: 'produtos_acessar', label: 'Acessar' },
        { key: 'produtos_criar', label: 'Criar' },
        { key: 'produtos_editar', label: 'Editar' },
        { key: 'produtos_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'Financeiro',
      permissions: [
        { key: 'financeiro_acessar', label: 'Acessar' },
        { key: 'financeiro_criar', label: 'Criar' },
        { key: 'financeiro_editar', label: 'Editar' },
        { key: 'financeiro_excluir', label: 'Excluir' },
        { key: 'financeiro_baixar', label: 'Baixar' }
      ]
    },
    {
      title: 'Vendas',
      permissions: [
        { key: 'vendas_acessar', label: 'Acessar' },
        { key: 'vendas_criar', label: 'Criar' },
        { key: 'vendas_editar', label: 'Editar' },
        { key: 'vendas_excluir', label: 'Excluir' },
        { key: 'vendas_cancelar', label: 'Cancelar' }
      ]
    },
    {
      title: 'Compras',
      permissions: [
        { key: 'compras_acessar', label: 'Acessar' },
        { key: 'compras_criar', label: 'Criar' },
        { key: 'compras_editar', label: 'Editar' },
        { key: 'compras_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'Trocas',
      permissions: [
        { key: 'trocas_acessar', label: 'Acessar' },
        { key: 'trocas_criar', label: 'Criar' },
        { key: 'trocas_editar', label: 'Editar' },
        { key: 'trocas_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'Ordens de Serviço',
      permissions: [
        { key: 'ordens_acessar', label: 'Acessar' },
        { key: 'ordens_criar', label: 'Criar' },
        { key: 'ordens_editar', label: 'Editar' },
        { key: 'ordens_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'Cotações',
      permissions: [
        { key: 'cotacoes_acessar', label: 'Acessar' },
        { key: 'cotacoes_criar', label: 'Criar' },
        { key: 'cotacoes_editar', label: 'Editar' },
        { key: 'cotacoes_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'Devoluções',
      permissions: [
        { key: 'devolucoes_acessar', label: 'Acessar' },
        { key: 'devolucoes_criar', label: 'Criar' },
        { key: 'devolucoes_editar', label: 'Editar' },
        { key: 'devolucoes_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'Comandas',
      permissions: [
        { key: 'comandas_acessar', label: 'Acessar' },
        { key: 'comandas_criar', label: 'Criar' },
        { key: 'comandas_editar', label: 'Editar' },
        { key: 'comandas_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'Pet Shop',
      permissions: [
        { key: 'petshop_acessar', label: 'Acessar' },
        { key: 'petshop_criar', label: 'Criar' },
        { key: 'petshop_editar', label: 'Editar' },
        { key: 'petshop_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'Catálogo',
      permissions: [
        { key: 'catalogo_acessar', label: 'Acessar' },
        { key: 'catalogo_editar', label: 'Editar' }
      ]
    },
    {
      title: 'Etiquetas',
      permissions: [
        { key: 'etiquetas_acessar', label: 'Acessar' },
        { key: 'etiquetas_criar', label: 'Criar' },
        { key: 'etiquetas_editar', label: 'Editar' },
        { key: 'etiquetas_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'Relatórios',
      permissions: [
        { key: 'relatorios_acessar', label: 'Acessar' },
        { key: 'relatorios_exportar', label: 'Exportar' }
      ]
    },
    {
      title: 'Gráficos',
      permissions: [
        { key: 'graficos_acessar', label: 'Acessar' }
      ]
    },
    {
      title: 'Mapa de Promoção',
      permissions: [
        { key: 'mapa_promocao_acessar', label: 'Acessar' },
        { key: 'mapa_promocao_criar', label: 'Criar' },
        { key: 'mapa_promocao_editar', label: 'Editar' },
        { key: 'mapa_promocao_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'Venda Rápida',
      permissions: [
        { key: 'venda_rapida_acessar', label: 'Acessar' }
      ]
    },
    {
      title: 'NFC-e',
      permissions: [
        { key: 'nfce_acessar', label: 'Acessar' },
        { key: 'nfce_criar', label: 'Criar' },
        { key: 'nfce_editar', label: 'Editar' },
        { key: 'nfce_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'NF-e',
      permissions: [
        { key: 'nfe_acessar', label: 'Acessar' },
        { key: 'nfe_criar', label: 'Criar' },
        { key: 'nfe_editar', label: 'Editar' },
        { key: 'nfe_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'CT-e',
      permissions: [
        { key: 'cte_acessar', label: 'Acessar' },
        { key: 'cte_criar', label: 'Criar' },
        { key: 'cte_editar', label: 'Editar' },
        { key: 'cte_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'MDF-e',
      permissions: [
        { key: 'mdfe_acessar', label: 'Acessar' },
        { key: 'mdfe_criar', label: 'Criar' },
        { key: 'mdfe_editar', label: 'Editar' },
        { key: 'mdfe_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'Fornecedores',
      permissions: [
        { key: 'fornecedores_acessar', label: 'Acessar' },
        { key: 'fornecedores_criar', label: 'Criar' },
        { key: 'fornecedores_editar', label: 'Editar' },
        { key: 'fornecedores_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'Gestão Agro',
      permissions: [
        { key: 'agro_acessar', label: 'Acessar' },
        { key: 'agro_criar', label: 'Criar' },
        { key: 'agro_editar', label: 'Editar' },
        { key: 'agro_excluir', label: 'Excluir' }
      ]
    },
    {
      title: 'SPED',
      permissions: [
        { key: 'sped_acessar', label: 'SPED ICMS' },
        { key: 'sped_contribuicoes_acessar', label: 'SPED PIS/COFINS' }
      ]
    },
    {
      title: 'WhatsApp',
      permissions: [
        { key: 'whatsapp_acessar', label: 'Acessar' }
      ]
    },
    {
      title: 'Boletos',
      permissions: [
        { key: 'boletos_acessar', label: 'Acessar' },
        { key: 'boletos_criar', label: 'Criar' },
        { key: 'boletos_editar', label: 'Editar' }
      ]
    },
    {
      title: 'Mapa de Carga',
      permissions: [
        { key: 'mapa_carga_acessar', label: 'Acessar' },
        { key: 'mapa_carga_criar', label: 'Criar' },
        { key: 'mapa_carga_editar', label: 'Editar' }
      ]
    },
    {
      title: 'Produção',
      permissions: [
        { key: 'producao_acessar', label: 'Acessar' },
        { key: 'producao_criar', label: 'Criar' },
        { key: 'producao_editar', label: 'Editar' }
      ]
    },
    {
      title: 'Comissões',
      permissions: [
        { key: 'comissoes_acessar', label: 'Acessar' }
      ]
    },
    {
      title: 'Conciliação',
      permissions: [
        { key: 'conciliacao_acessar', label: 'Acessar' }
      ]
    },
    {
      title: 'Cartões',
      permissions: [
        { key: 'cartoes_acessar', label: 'Acessar' }
      ]
    },
    {
      title: 'Agenda',
      permissions: [
        { key: 'agenda_acessar', label: 'Acessar' },
        { key: 'agenda_criar', label: 'Criar' },
        { key: 'agenda_editar', label: 'Editar' }
      ]
    },
    {
      title: 'Balanças',
      permissions: [
        { key: 'balancas_acessar', label: 'Acessar' }
      ]
    },
    {
      title: 'Bancário',
      permissions: [
        { key: 'bancario_acessar', label: 'Acessar' },
        { key: 'bancario_criar', label: 'Criar' },
        { key: 'bancario_editar', label: 'Editar' }
      ]
    },
    {
      title: 'Contas e Serviços',
      permissions: [
        { key: 'contas_servicos_acessar', label: 'Acessar' }
      ]
    },
    {
      title: 'Configurações',
      permissions: [
        { key: 'config_acessar', label: 'Acessar Config' },
        { key: 'config_empresa_editar', label: 'Editar Empresa' },
        { key: 'config_usuarios_acessar', label: 'Acessar Usuários' },
        { key: 'config_usuarios_criar', label: 'Criar Usuários' },
        { key: 'config_usuarios_editar', label: 'Editar Usuários' },
        { key: 'config_usuarios_excluir', label: 'Excluir Usuários' },
        { key: 'config_vendedores_acessar', label: 'Acessar Vendedores' },
        { key: 'config_vendedores_criar', label: 'Criar Vendedores' },
        { key: 'config_vendedores_editar', label: 'Editar Vendedores' },
        { key: 'config_vendedores_excluir', label: 'Excluir Vendedores' },
        { key: 'config_operacoes_acessar', label: 'Acessar Operações' },
        { key: 'config_operacoes_criar', label: 'Criar Operações' },
        { key: 'config_operacoes_editar', label: 'Editar Operações' },
        { key: 'config_operacoes_excluir', label: 'Excluir Operações' },
        { key: 'config_apoio_acessar', label: 'Acessar Apoio' },
        { key: 'config_apoio_criar', label: 'Criar Apoio' },
        { key: 'config_apoio_editar', label: 'Editar Apoio' },
        { key: 'config_apoio_excluir', label: 'Excluir Apoio' }
      ]
    },
    {
      title: 'Autorizações Especiais',
      permissions: [
        { key: 'aut_desconto', label: 'Autorizar Desconto' },
        { key: 'aut_cancelar_venda', label: 'Autorizar Cancelamento' }
      ]
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Loading Backdrop */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Usuário salvo com sucesso!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <PeopleIcon />
            </Avatar>
          }
          title="Gerenciamento de Usuários"
          subheader="Gerencie usuários e suas permissões"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNew}
            >
              Novo Usuário
            </Button>
          }
        />

        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Usuário</strong></TableCell>
                  <TableCell><strong>Nome</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Staff</strong></TableCell>
                  <TableCell><strong>Ativo</strong></TableCell>
                  <TableCell><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(usuarios) && usuarios.map((usuario) => (
                  <TableRow key={usuario.id} hover>
                    <TableCell>{usuario.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {usuario.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {`${usuario.first_name} ${usuario.last_name}`.trim() || 'N/A'}
                    </TableCell>
                    <TableCell>{usuario.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={usuario.is_staff ? 'Sim' : 'não'}
                        color={usuario.is_staff ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={usuario.is_active ? 'Ativo' : 'Inativo'}
                        color={usuario.is_active ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(usuario)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(usuario.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog para Editar/Criar Usuário */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
            <Tab label="Dados Básicos" />
            <Tab label="Permissões" />
            <Tab label="Venda Rápida" />
            <Tab label="Vendas e OS" />
            <Tab label="NFC-e" />
          </Tabs>

          {/* Aba Dados Básicos */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome de Usuário"
                  value={currentUsuario.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  variant="outlined"
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={currentUsuario.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={currentUsuario.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sobrenome"
                  value={currentUsuario.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={isEditing ? "Nova Senha (deixe vazio para manter)" : "Senha"}
                  type="password"
                  value={currentUsuario.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  variant="outlined"
                  required={!isEditing}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="vendedor-label">Vendedor</InputLabel>
                    <Select
                      labelId="vendedor-label"
                      value={currentUsuario.vendedor_id || ''}
                      onChange={(e) => handleInputChange('vendedor_id', e.target.value || null)}
                      label="Vendedor"
                    >
                      <MenuItem value="">
                        <em>Nenhum</em>
                      </MenuItem>
                      {vendedores.map((vendedor) => (
                        <MenuItem key={vendedor.id_vendedor || vendedor.id} value={vendedor.id_vendedor || vendedor.id}>
                          {vendedor.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    onClick={() => setNovoVendedorDialog(true)}
                    sx={{ minWidth: 42, height: 56, p: 0 }}
                    title="Cadastrar novo vendedor"
                  >
                    <PersonAddIcon />
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentUsuario.is_staff}
                      onChange={(e) => handleInputChange('is_staff', e.target.checked)}
                    />
                  }
                  label="Usuário Staff"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentUsuario.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    />
                  }
                  label="Usuário Ativo"
                />
              </Grid>
            </Grid>
          )}

          {/* Aba Permissões */}
          {tabValue === 1 && (
            <Box>
              {/* Perfis de Acesso Rápido */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', color: '#555' }}>
                  Perfil de Acesso Rápido
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<AdminIcon />}
                    onClick={() => aplicarPerfil('administrador')}
                    sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' }, textTransform: 'none' }}
                  >
                    Administrador
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<VendedorIcon />}
                    onClick={() => aplicarPerfil('vendedor')}
                    sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' }, textTransform: 'none' }}
                  >
                    Vendedor
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<FinanceiroIcon />}
                    onClick={() => aplicarPerfil('financeiro')}
                    sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' }, textTransform: 'none' }}
                  >
                    Financeiro
                  </Button>
                </Box>
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#888' }}>
                  Clique em um perfil para preencher automaticamente as permissões. Você pode ajustar individualmente depois.
                </Typography>
              </Box>

              {permissionsGroups.map((group, index) => (
                <Box key={`permission-group-${index}`}>
                  {renderPermissionsGroup(group.title, group.permissions)}
                </Box>
              ))}
            </Box>
          )}

          {/* Aba Venda Rápida */}
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Parâmetros de Venda Rápida
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Configure os valores padrão que serão utilizados na venda rápida
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Cliente Padrão</InputLabel>
                  <Select
                    value={currentUsuario.parametros?.id_cliente_padrao || ''}
                    onChange={(e) => handleInputChange('parametros.id_cliente_padrao', e.target.value || null)}
                    label="Cliente Padrão"
                  >
                    <MenuItem value="">
                      <em>Nenhum</em>
                    </MenuItem>
                    {Array.isArray(clientes) && clientes.map((cliente) => (
                      <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                        {cliente.nome_razao_social}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Operação Padrão</InputLabel>
                  <Select
                    value={currentUsuario.parametros?.id_operacao_padrao || ''}
                    onChange={(e) => handleInputChange('parametros.id_operacao_padrao', e.target.value || null)}
                    label="Operação Padrão"
                  >
                    <MenuItem value="">
                      <em>Nenhuma</em>
                    </MenuItem>
                    {Array.isArray(operacoes) && operacoes.map((operacao) => (
                      <MenuItem key={operacao.id_operacao} value={operacao.id_operacao}>
                        {operacao.nome_operacao}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Vendedor Padrão</InputLabel>
                  <Select
                    value={currentUsuario.parametros?.id_vendedor_padrao || ''}
                    onChange={(e) => handleInputChange('parametros.id_vendedor_padrao', e.target.value || null)}
                    label="Vendedor Padrão"
                  >
                    <MenuItem value="">
                      <em>Nenhum</em>
                    </MenuItem>
                    {Array.isArray(vendedores) && vendedores.map((vendedor) => (
                      <MenuItem key={vendedor.id_vendedor} value={vendedor.id_vendedor}>
                        {vendedor.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Grupo Padrão</InputLabel>
                  <Select
                    value={currentUsuario.parametros?.id_grupo_padrao || ''}
                    onChange={(e) => handleInputChange('parametros.id_grupo_padrao', e.target.value || null)}
                    label="Grupo Padrão"
                  >
                    <MenuItem value="">
                      <em>Nenhum</em>
                    </MenuItem>
                    {Array.isArray(grupos) && grupos.map((grupo) => (
                      <MenuItem key={grupo.id_grupo} value={grupo.id_grupo}>
                        {grupo.nome_grupo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>💰 Tabela Comercial Padrão</InputLabel>
                  <Select
                    value={(() => {
                      const valor = currentUsuario.parametros?.id_tabela_comercial || '';
                      console.log('🔍 [RENDER] Select value:', valor, 'Tipo:', typeof valor);
                      console.log('🔍 [RENDER] Tabelas disponíveis:', tabelasComerciais.map(t => ({
                        id: t.id_tabela_comercial,
                        tipo: typeof t.id_tabela_comercial,
                        nome: t.nome
                      })));
                      console.log('🔍 [RENDER] Encontrado:', tabelasComerciais.find(t =>
                        Number(t.id_tabela_comercial) === Number(valor)
                      )?.nome);
                      return valor;
                    })()}
                    onChange={(e) => {
                      const valor = e.target.value;
                      console.log('💰 Tabela selecionada:', valor, 'Tipo:', typeof valor);
                      handleInputChange('parametros.id_tabela_comercial', valor || null);
                    }}
                    label="💰 Tabela Comercial Padrão"
                  >
                    <MenuItem value="">
                      <em>Nenhuma (usar preço cadastrado)</em>
                    </MenuItem>
                    {Array.isArray(tabelasComerciais) && tabelasComerciais.map((tabela) => (
                      <MenuItem
                        key={tabela.id_tabela_comercial}
                        value={Number(tabela.id_tabela_comercial)}
                      >
                        {tabela.nome} ({tabela.percentual > 0 ? '+' : ''}{tabela.percentual}%)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentUsuario.parametros?.controle_de_caixa || false}
                      onChange={(e) => handleInputChange('parametros.controle_de_caixa', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Controle de Caixa? (Exige abertura/fechamento)"
                />
              </Grid>
            </Grid>
          )}

          {/* Aba Vendas e OS */}
          {tabValue === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Parâmetros Padrão para Vendas e Ordem de Serviço
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Defina vendedor e operação padrão que serão sugeridos automaticamente ao criar vendas ou ordens de serviço
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              {/* Seção Vendas */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Vendas
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Vendedor Padrão (Vendas)</InputLabel>
                        <Select
                          value={currentUsuario.parametros?.id_vendedor_venda || ''}
                          onChange={(e) => handleInputChange('parametros.id_vendedor_venda', e.target.value || null)}
                          label="Vendedor Padrão (Vendas)"
                        >
                          <MenuItem value="">
                            <em>Nenhum</em>
                          </MenuItem>
                          {Array.isArray(vendedores) && vendedores.map((vendedor) => (
                            <MenuItem key={vendedor.id_vendedor} value={vendedor.id_vendedor}>
                              {vendedor.nome}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Operação Padrão (Vendas)</InputLabel>
                        <Select
                          value={currentUsuario.parametros?.id_operacao_venda || ''}
                          onChange={(e) => handleInputChange('parametros.id_operacao_venda', e.target.value || null)}
                          label="Operação Padrão (Vendas)"
                        >
                          <MenuItem value="">
                            <em>Nenhuma</em>
                          </MenuItem>
                          {Array.isArray(operacoes) && operacoes.map((operacao) => (
                            <MenuItem key={operacao.id_operacao} value={operacao.id_operacao}>
                              {operacao.nome_operacao}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Seção Ordem de Serviço */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Ordem de Serviço
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Vendedor Padrão (OS)</InputLabel>
                        <Select
                          value={currentUsuario.parametros?.id_vendedor_os || ''}
                          onChange={(e) => handleInputChange('parametros.id_vendedor_os', e.target.value || null)}
                          label="Vendedor Padrão (OS)"
                        >
                          <MenuItem value="">
                            <em>Nenhum</em>
                          </MenuItem>
                          {Array.isArray(vendedores) && vendedores.map((vendedor) => (
                            <MenuItem key={vendedor.id_vendedor} value={vendedor.id_vendedor}>
                              {vendedor.nome}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Operação Padrão (OS)</InputLabel>
                        <Select
                          value={currentUsuario.parametros?.id_operacao_os || ''}
                          onChange={(e) => handleInputChange('parametros.id_operacao_os', e.target.value || null)}
                          label="Operação Padrão (OS)"
                        >
                          <MenuItem value="">
                            <em>Nenhuma</em>
                          </MenuItem>
                          {Array.isArray(operacoes) && operacoes.map((operacao) => (
                            <MenuItem key={operacao.id_operacao} value={operacao.id_operacao}>
                              {operacao.nome_operacao}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Seção Configurações de Visibilidade */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Configurações de Visibilidade
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!currentUsuario.parametros?.mostrar_lucratividade}
                          onChange={(e) => handleInputChange('parametros.mostrar_lucratividade', e.target.checked)}
                        />
                      }
                      label="Mostrar Lucratividade (Custo, Lucro e Margem) em Vendas e OS"
                    />
                  </FormGroup>
                </Paper>
              </Grid>
            </Grid>
          )}
          {tabValue === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Parâmetros de NFC-e
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Configure os valores padrão que serão preenchidos automaticamente na emissão de NFC-e
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                 <FormControl fullWidth variant="outlined">
                  <InputLabel>Vendedor Padrão (NFC-e)</InputLabel>
                  <Select
                    value={currentUsuario.parametros?.id_vendedor_nfce || ''}
                    onChange={(e) => handleInputChange('parametros.id_vendedor_nfce', e.target.value || null)}
                    label="Vendedor Padrão (NFC-e)"
                  >
                    <MenuItem value="">
                      <em>Nenhum</em>
                    </MenuItem>
                    {Array.isArray(vendedores) && vendedores.map((vendedor) => (
                      <MenuItem key={vendedor.id_vendedor} value={vendedor.id_vendedor}>
                        {vendedor.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Operação Padrão (NFC-e)</InputLabel>
                  <Select
                    value={currentUsuario.parametros?.id_operacao_nfce || ''}
                    onChange={(e) => handleInputChange('parametros.id_operacao_nfce', e.target.value || null)}
                    label="Operação Padrão (NFC-e)"
                  >
                    <MenuItem value="">
                      <em>Nenhuma</em>
                    </MenuItem>
                    {Array.isArray(operacoes) && operacoes.map((operacao) => (
                      <MenuItem key={operacao.id_operacao} value={operacao.id_operacao}>
                        {operacao.nome_operacao}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                 <FormControl fullWidth variant="outlined">
                  <InputLabel>Cliente Padrão (NFC-e)</InputLabel>
                  <Select
                    value={currentUsuario.parametros?.id_cliente_nfce || ''}
                    onChange={(e) => handleInputChange('parametros.id_cliente_nfce', e.target.value || null)}
                    label="Cliente Padrão (NFC-e)"
                  >
                    <MenuItem value="">
                      <em>Nenhum</em>
                    </MenuItem>
                    {Array.isArray(clientes) && clientes.map((cliente) => (
                      <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                        {cliente.nome_razao_social}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentUsuario.parametros?.controle_de_caixa || false}
                      onChange={(e) => handleInputChange('parametros.controle_de_caixa', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Controle de Caixa? (Exige abertura/fechamento)"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Criar Novo Vendedor */}
      <Dialog open={novoVendedorDialog} onClose={() => setNovoVendedorDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cadastrar Novo Vendedor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Vendedor"
                value={novoVendedorNome}
                onChange={(e) => setNovoVendedorNome(e.target.value)}
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CPF"
                value={novoVendedorCpf}
                onChange={(e) => setNovoVendedorCpf(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={novoVendedorTelefone}
                onChange={(e) => setNovoVendedorTelefone(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Comissão (%)"
                type="number"
                value={novoVendedorComissao}
                onChange={(e) => setNovoVendedorComissao(e.target.value)}
                inputProps={{ min: 0, max: 100, step: 0.5 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNovoVendedorDialog(false)}>Cancelar</Button>
          <Button onClick={handleCriarVendedor} variant="contained" startIcon={<PersonAddIcon />}>
            Cadastrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsuariosConfig;