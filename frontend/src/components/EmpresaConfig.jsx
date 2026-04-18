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
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Business as BusinessIcon,
  UploadFile as UploadFileIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const EmpresaConfig = () => {
  const { axiosInstance } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [buscandoCnpjEmpresa, setBuscandoCnpjEmpresa] = useState(false);
  const [buscandoCnpjContador, setBuscandoCnpjContador] = useState(false);
  const [empresaData, setEmpresaData] = useState({
    id: null,
    // Dados básicos
    nome_razao_social: '',
    nome_fantasia: '',
    cpf_cnpj: '',
    inscricao_estadual: '',
    inscricao_municipal: '',

    // Endereço
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',

    // Contato
    telefone: '',
    celular: '',
    email: '',
    website: '',

    // Configurações
    logo_url: '',
    regimeTributario: '',
    observacoes: '',

    // NFC-e
    certificado_digital: '',
    senha_certificado: '',
    csc_token_id: '',
    csc_token_codigo: '',
    ambiente_nfce: '2', // 1=Produção, 2=Homologação

    // Configurações Fiscais Adicionais
    ambiente_nfe: '2',
    ambiente_cte: '2',
    ambiente_mdfe: '2',
    ambiente_nfse: '2',
    
    // MDF-e
    rntrc_empresa: '',
    serie_mdfe: '1',
    ultimo_numero_mdfe: '0',
    
    cpf_responsavel: '',
    ind_atividade: '1',
    ind_perfil: 'A',
    ind_nat_pj: '00',
    natureza_juridica: '',
    cnae: '',
    suframa: '',
    crt: '3', // Regime Normal por padrão
    
    // Contador
    contador_cnpj: '',
    contador_nome: '',
    contador_cpf: '',
    contador_crc: '',
    contador_cep: '',
    contador_endereco: '',
    contador_numero: '',
    contador_complemento: '',
    contador_bairro: '',
    contador_fone: '',
    contador_fax: '',
    contador_email: '',
    contador_cod_mun: '',
    
    // Outros
    valor_maximo_nfce: '',
    controle_de_caixa: false,
    serie_dps: '1',
    ultimo_numero_dps: '',
    codigo_municipio_ibge: ''
  });

  useEffect(() => {
    carregarDadosEmpresa();
  }, []);

  const carregarDadosEmpresa = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/empresa/');
      console.log('📡 Resposta da API empresa:', response.data);

      // Verificar se a resposta é um array direto, objeto paginado ou objeto único
      let empresas = [];
      if (Array.isArray(response.data)) {
        empresas = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        empresas = response.data.results;
      } else if (response.data?.value && Array.isArray(response.data.value)) {
        empresas = response.data.value;
      } else if (response.data && typeof response.data === 'object' && response.data.id_empresa) {
        // Se retornou um objeto único (não array)
        empresas = [response.data];
      }

      console.log('📦 Empresas processadas:', empresas);

      if (empresas.length > 0) {
        // Obter último registro para garantir que estamos vendo a mais recente (caso existam duplicatas)
        // Idealmente o backend deveria retornar apenas uma, ou a correta.
        // Vamos ordenar por ID decrescente localmente para pegar a mais nova
        const empresasOrdenadas = [...empresas].sort((a, b) => b.id_empresa - a.id_empresa);
        const empresa = empresasOrdenadas[0]; 
        console.log('🏢 Dados da empresa (mais recente):', empresa);

        setEmpresaData({
          id: empresa.id_empresa,
          nome_razao_social: empresa.nome_razao_social || '',
          nome_fantasia: empresa.nome_fantasia || '',
          cpf_cnpj: empresa.cpf_cnpj || '',
          inscricao_estadual: empresa.inscricao_estadual || '',
          inscricao_municipal: empresa.inscricao_municipal || '',
          endereco: empresa.endereco || '',
          numero: empresa.numero || '',
          complemento: empresa.complemento || '',
          bairro: empresa.bairro || '',
          cidade: empresa.cidade || '',
          estado: empresa.estado || '',
          cep: empresa.cep || '',
          telefone: empresa.telefone || '',
          celular: '', // Campo não existe na API, manter vazio
          email: empresa.email || '',
          website: '', // Campo não existe na API, manter vazio
          logo_url: empresa.logo_url || '',
          regimeTributario: empresa.regime_tributario || '', 
          observacoes: '', // Campo não existe na API, manter vazio
          
          // NFC-e
          certificado_digital: empresa.certificado_digital || '',
          senha_certificado: empresa.senha_certificado || '',
          csc_token_id: empresa.csc_token_id || '',
          csc_token_codigo: empresa.csc_token_codigo || '',
          ambiente_nfce: empresa.ambiente_nfce || '2',
          
          // Campos Adicionais de Documentos Fiscais (Resgatados do legado)
          cpf_responsavel: empresa.cpf_responsavel || '',
          ind_atividade: empresa.ind_atividade || '1',
          ind_perfil: empresa.ind_perfil || 'A',
          ind_nat_pj: empresa.ind_nat_pj || '00',
          natureza_juridica: empresa.natureza_juridica || '',
          cnae: empresa.cnae || '',
          suframa: empresa.suframa || '',
          crt: empresa.crt || '1', // 1=Simples, 2=Simples Excesso, 3=Normal

          // Contador
          contador_cnpj: empresa.contador_cnpj || '',
          contador_nome: empresa.contador_nome || '',
          contador_cpf: empresa.contador_cpf || '',
          contador_crc: empresa.contador_crc || '',
          contador_cep: empresa.contador_cep || '',
          contador_endereco: empresa.contador_endereco || '',
          contador_numero: empresa.contador_numero || '',
          contador_complemento: empresa.contador_complemento || '',
          contador_bairro: empresa.contador_bairro || '',
          contador_fone: empresa.contador_fone || '',
          contador_fax: empresa.contador_fax || '',
          contador_email: empresa.contador_email || '',
          contador_cod_mun: empresa.contador_cod_mun || '',

          // Ambientes Específicos
          ambiente_nfe: empresa.ambiente_nfe || '2',
          ambiente_cte: empresa.ambiente_cte || '2',
          ambiente_mdfe: empresa.ambiente_mdfe || '2',
          ambiente_nfse: empresa.ambiente_nfse || '2',

          // MDF-e
          rntrc_empresa: empresa.rntrc_empresa || '',
          serie_mdfe: empresa.serie_mdfe || '1',
          ultimo_numero_mdfe: empresa.ultimo_numero_mdfe || '0',

          // Configs Específicas
          valor_maximo_nfce: empresa.valor_maximo_nfce || '',
          controle_de_caixa: empresa.controle_de_caixa || false,
          serie_dps: empresa.serie_dps || '1',
          ultimo_numero_dps: empresa.ultimo_numero_dps || '',
          codigo_municipio_ibge: empresa.codigo_municipio_ibge || '',
        });
      }
      setError(null);
    } catch (err) {
      console.error('❌ Erro ao carregar dados da empresa:', err);
      setError('Erro ao carregar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEmpresaData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validação básica
    if (!empresaData.nome_razao_social || !empresaData.nome_razao_social.trim()) {
      setError('O campo "Razão Social" é obrigatório. Preencha na aba Dados Gerais.');
      setTabValue(0);
      return;
    }
    try {
      setLoading(true);

      // Preparar dados para envio (remover campos que não existem na API)
      const dadosParaEnvio = {
        nome_razao_social: empresaData.nome_razao_social,
        nome_fantasia: empresaData.nome_fantasia,
        cpf_cnpj: empresaData.cpf_cnpj ? empresaData.cpf_cnpj.replace(/\D/g, '') : '', 
        inscricao_estadual: empresaData.inscricao_estadual,
        endereco: empresaData.endereco,
        numero: empresaData.numero,
        bairro: empresaData.bairro,
        cidade: empresaData.cidade,
        estado: empresaData.estado,
        cep: empresaData.cep ? empresaData.cep.replace(/\D/g, '') : '',
        telefone: empresaData.telefone ? empresaData.telefone.replace(/\D/g, '') : '',
        email: empresaData.email,
        logo_url: empresaData.logo_url,
        regime_tributario: empresaData.regimeTributario,
        
        // NFC-e
        certificado_digital: empresaData.certificado_digital,
        senha_certificado: empresaData.senha_certificado,
        csc_token_id: empresaData.csc_token_id,
        csc_token_codigo: empresaData.csc_token_codigo,
        ambiente_nfce: empresaData.ambiente_nfce,

        // Campos Adicionais
        cpf_responsavel: empresaData.cpf_responsavel,
        ind_atividade: empresaData.ind_atividade,
        ind_perfil: empresaData.ind_perfil,
        ind_nat_pj: empresaData.ind_nat_pj,
        natureza_juridica: empresaData.natureza_juridica,
        cnae: empresaData.cnae,
        suframa: empresaData.suframa,
        crt: empresaData.crt,

        // Contador
        contador_cnpj: empresaData.contador_cnpj,
        contador_nome: empresaData.contador_nome,
        contador_cpf: empresaData.contador_cpf,
        contador_crc: empresaData.contador_crc,
        contador_cep: empresaData.contador_cep,
        contador_endereco: empresaData.contador_endereco,
        contador_numero: empresaData.contador_numero,
        contador_complemento: empresaData.contador_complemento,
        contador_bairro: empresaData.contador_bairro,
        contador_fone: empresaData.contador_fone,
        contador_fax: empresaData.contador_fax,
        contador_email: empresaData.contador_email,
        contador_cod_mun: empresaData.contador_cod_mun,

        // Ambientes Específicos
        ambiente_nfe: empresaData.ambiente_nfe,
        ambiente_cte: empresaData.ambiente_cte,
        ambiente_nfse: empresaData.ambiente_nfse,

        // Configs Específicas
        valor_maximo_nfce: empresaData.valor_maximo_nfce || null,
        controle_de_caixa: empresaData.controle_de_caixa,
        serie_dps: empresaData.serie_dps,
        ultimo_numero_dps: empresaData.ultimo_numero_dps || null,
        codigo_municipio_ibge: empresaData.codigo_municipio_ibge
      };

      console.log('📤 Dados que seréo enviados para a API:', dadosParaEnvio);

      if (empresaData.id) {
        // Atualizar dados existentes usando PATCH no ID carregado
        console.log(`💾 Atualizando empresa existente ID: ${empresaData.id}`);
        await axiosInstance.patch(`/empresa/${empresaData.id}/`, dadosParaEnvio);
        console.log('💾 Dados da empresa atualizados via API');
      } else {
        // Criar nova empresa
        console.log('💾 Criando nova empresa...');
        await axiosInstance.post('/empresa/', dadosParaEnvio);
        console.log('💾 Nova empresa criada via API');
      }

      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setError(null);

      // Recarregar dados atualizados
      await carregarDadosEmpresa();

    } catch (err) {
      console.error('❌ Erro ao salvar dados da empresa:', err);
      console.error('❌ Detalhes do erro:', err.response?.data);
      console.error('❌ Status:', err.response?.status);
      // Extrair mensagem legível do erro
      let errMsg = err.message;
      if (err.response?.data) {
        const d = err.response.data;
        if (d.detail) {
          errMsg = d.detail;
        } else if (typeof d === 'object') {
          const fields = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
          errMsg = fields.join(' | ');
        } else {
          errMsg = String(d);
        }
      }
      setError('Erro ao salvar dados da empresa: ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Recarregar dados da API
    carregarDadosEmpresa();
    setIsEditing(false);
    setError(null);
    setLogoPreview(null);
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato de arquivo não suportado. Use PNG, JPG ou GIF.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Tamanho máximo: 5MB');
      return;
    }

    try {
      setUploadingLogo(true);
      setError(null);

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Preparar para upload
      const formData = new FormData();
      formData.append('logo', file);

      // Fazer upload para o backend
      const response = await axiosInstance.post('/empresa/upload-logo/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Atualizar o campo logo_url com o nome do arquivo
      const logoFileName = response.data.filename || file.name;
      handleInputChange('logo_url', logoFileName);

      console.log('✅ Logo enviada com sucesso:', logoFileName);
      
    } catch (err) {
      console.error('❌ Erro ao fazer upload da logo:', err);
      
      // Se o endpoint não existir, salvar o arquivo localmente no frontend
      if (err.response?.status === 404 || err.response?.status === 405) {
        console.log('ℹ️ Endpoint de upload não disponível, salvando nome do arquivo localmente');
        
        // Apenas salvar o nome do arquivo
        const fileName = `logo.${file.type.split('/')[1]}`;
        handleInputChange('logo_url', fileName);
        
        setError('⚠️ Salve a configuração e depois copie manualmente a logo para: frontend/public/logos/' + fileName);
      } else {
        setError('Erro ao fazer upload da logo: ' + (err.response?.data?.detail || err.message));
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoverLogo = () => {
    handleInputChange('logo_url', '');
    setLogoPreview(null);
  };

  const handleCertificadoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Converter para Base64 para salvar no banco (campo TextField)
    const reader = new FileReader();
    reader.onload = (e) => {
      // Pega apenas a parte Base64 (remove "data:application/x-pkcs12;base64,")
      // Mas para salvar no banco e reutilizar, talvez seja melhor salvar com o cabeçalho ou tratar no backend
      // Aqui vamos salvar tudo para garantir
      handleInputChange('certificado_digital', e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const buscarCnpjEmpresa = async () => {
    const cnpj = empresaData.cpf_cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      setError('CNPJ da empresa inválido. Preencha o CNPJ na aba Dados Gerais.');
      return;
    }
    try {
      setBuscandoCnpjEmpresa(true);
      setError(null);
      const response = await axiosInstance.get(`/consultar-cnpj/${cnpj}/`);
      const data = response.data;
      setEmpresaData(prev => ({
        ...prev,
        codigo_municipio_ibge: data.codigo_municipio_ibge || prev.codigo_municipio_ibge,
        cnae: data.cnae_fiscal || prev.cnae,
      }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      setError('Erro ao buscar dados via CNPJ: ' + (err.response?.data?.error || err.message));
    } finally {
      setBuscandoCnpjEmpresa(false);
    }
  };

  const buscarCnpjContador = async () => {
    const cnpj = empresaData.contador_cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      setError('CNPJ do contador inválido. Preencha o CNPJ do escritório contábil.');
      return;
    }
    try {
      setBuscandoCnpjContador(true);
      setError(null);
      const response = await axiosInstance.get(`/consultar-cnpj/${cnpj}/`);
      const data = response.data;
      setEmpresaData(prev => ({
        ...prev,
        contador_nome: data.razao_social || prev.contador_nome,
        contador_endereco: data.logradouro || prev.contador_endereco,
        contador_numero: data.numero || prev.contador_numero,
        contador_bairro: data.bairro || prev.contador_bairro,
        contador_cep: data.cep || prev.contador_cep,
        contador_fone: data.telefone || prev.contador_fone,
        contador_cod_mun: data.codigo_municipio_ibge || prev.contador_cod_mun,
      }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      setError('Erro ao buscar dados do contador: ' + (err.response?.data?.error || err.message));
    } finally {
      setBuscandoCnpjContador(false);
    }
  };

  const formatCNPJ = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 14) {
      return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const formatCEP = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 8) {
      return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  const formatTelefone = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 11) {
      if (cleanValue.length <= 10) {
        return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      } else {
        return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
    }
    return value;
  };

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const regimesTributarios = [
    { value: 'SIMPLES', label: 'Simples Nacional' },
    { value: 'MEI', label: 'MEI' },
    { value: 'NORMAL', label: 'Regime Normal' },
    { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' }
  ];

  const ambientesNfce = [
    { value: '1', label: 'Produção' },
    { value: '2', label: 'Homologação' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Loading Backdrop */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Configurações da empresa salvas com sucesso!
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
              <BusinessIcon />
            </Avatar>
          }
          title="Configurações da Empresa"
          subheader="Gerencie as informações da sua empresa"
          action={
            !isEditing ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
              >
                Editar
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Salvar
                </Button>
              </Box>
            )
          }
        />

        <CardContent>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Dados Gerais" />
            <Tab label="Endereço" />
            <Tab label="Contato" />
            <Tab label="Configurações" />
            <Tab label="NFC-e (Cupom)" />
            <Tab label="NF-e (Modelo 55)" />
            <Tab label="CT-e (Transporte)" />
            <Tab label="MDF-e (Manifesto)" />
            <Tab label="NFS-e (Serviço)" />
            <Tab label="Fiscal & Contador" />
          </Tabs>

          {/* Dados Gerais - Aba 0 */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Dados Básicos
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Razéo Social"
                  value={empresaData.nome_razao_social}
                  onChange={(e) => handleInputChange('nome_razao_social', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome Fantasia"
                  value={empresaData.nome_fantasia}
                  onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="CNPJ"
                  value={empresaData.cpf_cnpj}
                  onChange={(e) => handleInputChange('cpf_cnpj', formatCNPJ(e.target.value))}
                  disabled={!isEditing}
                  variant="outlined"
                  placeholder="00.000.000/0000-00"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Inscriçéo Estadual"
                  value={empresaData.inscricao_estadual}
                  onChange={(e) => handleInputChange('inscricao_estadual', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Inscriçéo Municipal"
                  value={empresaData.inscricao_municipal}
                  onChange={(e) => handleInputChange('inscricao_municipal', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          )}

          {/* Endereço - Aba 1 */}
          {tabValue === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Endereço
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Endereço"
                  value={empresaData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Número"
                  value={empresaData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="CEP"
                  value={empresaData.cep}
                  onChange={(e) => handleInputChange('cep', formatCEP(e.target.value))}
                  disabled={!isEditing}
                  variant="outlined"
                  placeholder="00000-000"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Complemento"
                  value={empresaData.complemento}
                  onChange={(e) => handleInputChange('complemento', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Bairro"
                  value={empresaData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={empresaData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={1}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={empresaData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    label="Estado"
                  >
                    {estados.map((estado) => (
                      <MenuItem key={estado} value={estado}>
                        {estado}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {/* Contato - Aba 2 */}
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Contato
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={empresaData.telefone}
                  onChange={(e) => handleInputChange('telefone', formatTelefone(e.target.value))}
                  disabled={!isEditing}
                  variant="outlined"
                  placeholder="(00) 0000-0000"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Celular"
                  value={empresaData.celular}
                  onChange={(e) => handleInputChange('celular', formatTelefone(e.target.value))}
                  disabled={!isEditing}
                  variant="outlined"
                  placeholder="(00) 00000-0000"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="E-mail"
                  type="email"
                  value={empresaData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Website"
                  value={empresaData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  placeholder="https://www.empresa.com.br"
                />
              </Grid>
            </Grid>
          )}

          {/* Configurações - Aba 3 */}
          {tabValue === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Configurações
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Upload de Logo */}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Logomarca da Empresa
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<PhotoCameraIcon />}
                      disabled={!isEditing || uploadingLogo}
                    >
                      {uploadingLogo ? 'Enviando...' : 'Selecionar Logo'}
                      <input
                        type="file"
                        hidden
                        accept="image/png,image/jpeg,image/jpg,image/gif"
                        onChange={handleLogoUpload}
                      />
                    </Button>

                    {empresaData.logo_url && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleRemoverLogo}
                        disabled={!isEditing}
                      >
                        Remover Logo
                      </Button>
                    )}
                  </Box>

                  {empresaData.logo_url && (
                    <TextField
                      fullWidth
                      label="Nome do Arquivo"
                      value={empresaData.logo_url}
                      disabled
                      variant="outlined"
                      size="small"
                      helperText="Arquivo salvo em: frontend/public/logos/"
                    />
                  )}

                  {/* Preview da Logo */}
                  {(logoPreview || empresaData.logo_url) && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                        Preview:
                      </Typography>
                      <Box
                        sx={{
                          border: '2px dashed #ccc',
                          borderRadius: 2,
                          p: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: 150,
                          bgcolor: '#f5f5f5'
                        }}
                      >
                        <img
                          src={logoPreview || `/logos/${empresaData.logo_url}`}
                          alt="Logo Preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 150,
                            objectFit: 'contain'
                          }}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="50%" y="50%" text-anchor="middle" fill="%23999">Logo não encontrada</text></svg>';
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Regime Tributário</InputLabel>
                  <Select
                    value={empresaData.regimeTributario}
                    onChange={(e) => handleInputChange('regimeTributario', e.target.value)}
                    label="Regime Tributário"
                  >
                    {regimesTributarios.map((regime) => (
                      <MenuItem key={regime.value} value={regime.value}>
                        {regime.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  multiline
                  rows={4}
                  value={empresaData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  placeholder="Informações adicionais sobre a empresa..."
                />
              </Grid>
            </Grid>
          )}

          {/* NFC-e - Aba 4 */}
          {tabValue === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Configuração NFC-e (Cupom Fiscal)
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Ambiente (NFC-e)</InputLabel>
                  <Select
                    value={empresaData.ambiente_nfce}
                    onChange={(e) => handleInputChange('ambiente_nfce', e.target.value)}
                    label="Ambiente (NFC-e)"
                  >
                    {ambientesNfce.map((amb) => (
                      <MenuItem key={amb.value} value={amb.value}>
                        {amb.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                 <TextField
                  fullWidth
                  label="Valor Máximo sem Identificação (R$)"
                  value={empresaData.valor_maximo_nfce}
                  onChange={(e) => handleInputChange('valor_maximo_nfce', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  type="number"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={empresaData.controle_de_caixa}
                      onChange={(e) => handleInputChange('controle_de_caixa', e.target.checked)}
                      disabled={!isEditing}
                    />
                  }
                  label="Ativar Controle de Caixa (Abertura/Fechamento/Sangria/Suprimento)"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>
                  Credenciais CSC (Código de Segurança do Contribuinte)
                </Typography>
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="ID Token CSC"
                  value={empresaData.csc_token_id}
                  onChange={(e) => handleInputChange('csc_token_id', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  placeholder="Ex: 000001"
                  helperText="ID numérico sequencial"
                />
              </Grid>

              <Grid item xs={12} md={10}>
                <TextField
                  fullWidth
                  label="Código CSC"
                  value={empresaData.csc_token_codigo}
                  onChange={(e) => handleInputChange('csc_token_codigo', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  placeholder="Código alfanumérico fornecido pela SEFAZ"
                  type="password"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
                  Certificado Digital (A1)
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadFileIcon />}
                    disabled={!isEditing}
                  >
                    Localizar Certificado (.pfx)
                    <input
                      type="file"
                      hidden
                      accept=".pfx,.p12"
                      onChange={handleCertificadoUpload}
                    />
                  </Button>
                  
                  {empresaData.certificado_digital && (
                    <Typography variant="body2" color="success.main">
                      ✅ Certificado Carregado
                    </Typography>
                  )}
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  O certificado será salvo no sistema para emissão de notas.
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Senha do Certificado"
                  value={empresaData.senha_certificado}
                  onChange={(e) => handleInputChange('senha_certificado', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  type="password"
                />
              </Grid>
            </Grid>
          )}

          {/* NF-e - Aba 5 */}
          {tabValue === 5 && (
            <Grid container spacing={3}>
               <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Configuração NF-e (Modelo 55 - Nota Grande)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Alert severity="info" sx={{ mb: 2 }}>
                  Você pode configurar o ambiente da NF-e separadamente da NFC-e.
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Ambiente (NF-e)</InputLabel>
                  <Select
                    value={empresaData.ambiente_nfe}
                    onChange={(e) => handleInputChange('ambiente_nfe', e.target.value)}
                    label="Ambiente (NF-e)"
                  >
                    {ambientesNfce.map((amb) => (
                      <MenuItem key={amb.value} value={amb.value}>
                        {amb.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {/* CT-e - Aba 6 */}
          {tabValue === 6 && (
            <Grid container spacing={3}>
               <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Configuração CT-e (Conhecimento de Transporte)
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Ambiente (CT-e)</InputLabel>
                  <Select
                    value={empresaData.ambiente_cte}
                    onChange={(e) => handleInputChange('ambiente_cte', e.target.value)}
                    label="Ambiente (CT-e)"
                  >
                    {ambientesNfce.map((amb) => (
                      <MenuItem key={amb.value} value={amb.value}>
                        {amb.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {/* MDF-e - Aba 7 */}
          {tabValue === 7 && (
            <Grid container spacing={3}>
               <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Configuração MDF-e (Manifesto de Documentos Fiscais)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>MDF-e</strong> é obrigatório para transportadoras e empresas que realizam transporte de cargas com mais de um documento fiscal (NF-e/CT-e) no mesmo veículo.
                  </Typography>
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Ambiente (MDF-e)</InputLabel>
                  <Select
                    value={empresaData.ambiente_mdfe}
                    onChange={(e) => handleInputChange('ambiente_mdfe', e.target.value)}
                    label="Ambiente (MDF-e)"
                  >
                    {ambientesNfce.map((amb) => (
                      <MenuItem key={amb.value} value={amb.value}>
                        {amb.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="RNTRC (Registro Nacional de Transportadores)"
                  value={empresaData.rntrc_empresa}
                  onChange={(e) => handleInputChange('rntrc_empresa', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  placeholder="Ex: 12345678"
                  helperText="Obrigatório para transportadoras. Código de 8 dígitos."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Série MDF-e"
                  value={empresaData.serie_mdfe}
                  onChange={(e) => handleInputChange('serie_mdfe', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  type="number"
                  placeholder="1"
                  helperText="Série para numeração do MDF-e (geralmente 1)"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Último Número MDF-e Emitido"
                  value={empresaData.ultimo_numero_mdfe}
                  onChange={(e) => handleInputChange('ultimo_numero_mdfe', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  type="number"
                  helperText="Número do último MDF-e emitido - você pode editar para ajustar a numeração"
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>Importante:</strong> Para emitir MDF-e em produção, você precisa de:
                    <ul style={{ marginTop: 8, marginBottom: 0 }}>
                      <li>Certificado Digital A1 ou A3 configurado</li>
                      <li>RNTRC válido para transportadoras</li>
                      <li>Ambiente configurado como "Produção" após testes</li>
                    </ul>
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}

          {/* NFS-e - Aba 8 */}
          {tabValue === 8 && (
            <Grid container spacing={3}>
               <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Configuração NFS-e (Nota Fiscal de Serviço)
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Ambiente (NFS-e)</InputLabel>
                  <Select
                    value={empresaData.ambiente_nfse}
                    onChange={(e) => handleInputChange('ambiente_nfse', e.target.value)}
                    label="Ambiente (NFS-e)"
                  >
                    {ambientesNfce.map((amb) => (
                      <MenuItem key={amb.value} value={amb.value}>
                        {amb.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
               <Grid item xs={12} md={6}>
                 <TextField
                  fullWidth
                  label="Código Município IBGE"
                  value={empresaData.codigo_municipio_ibge}
                  onChange={(e) => handleInputChange('codigo_municipio_ibge', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  placeholder="Ex: 3550308"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                 <TextField
                  fullWidth
                  label="Série DPS"
                  value={empresaData.serie_dps}
                  onChange={(e) => handleInputChange('serie_dps', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                 <TextField
                  fullWidth
                  label="Último Número DPS"
                  value={empresaData.ultimo_numero_dps}
                  onChange={(e) => handleInputChange('ultimo_numero_dps', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  type="number"
                />
              </Grid>
            </Grid>
          )}

          {/* Fiscal & Contador - Aba 9 */}
          {tabValue === 9 && (
            <Grid container spacing={3}>
               <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Dados Fiscais & Contador (SPED)
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Botão buscar dados fiscais via CNPJ da empresa */}
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={buscandoCnpjEmpresa ? <CircularProgress size={16} /> : <SearchIcon />}
                  onClick={buscarCnpjEmpresa}
                  disabled={!isEditing || buscandoCnpjEmpresa}
                  size="small"
                >
                  {buscandoCnpjEmpresa ? 'Buscando...' : 'Buscar Cód. IBGE e CNAE via CNPJ da Empresa'}
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Código Município IBGE"
                  value={empresaData.codigo_municipio_ibge}
                  onChange={(e) => handleInputChange('codigo_municipio_ibge', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                  helperText="Ex: 3550308 para São Paulo/SP"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CPF do Responsável"
                  value={empresaData.cpf_responsavel}
                  onChange={(e) => handleInputChange('cpf_responsavel', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CNAE"
                  value={empresaData.cnae}
                  onChange={(e) => handleInputChange('cnae', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Natureza Jurídica (IBGE)"
                  value={empresaData.natureza_juridica}
                  onChange={(e) => handleInputChange('natureza_juridica', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SUFRAMA"
                  value={empresaData.suframa}
                  onChange={(e) => handleInputChange('suframa', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>
              
               <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Indicador de Atividade</InputLabel>
                  <Select
                    value={empresaData.ind_atividade}
                    onChange={(e) => handleInputChange('ind_atividade', e.target.value)}
                    label="Indicador de Atividade"
                  >
                    <MenuItem value="0">0 - Industrial / Equiparado</MenuItem>
                    <MenuItem value="1">1 - Outros</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
               <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Perfil SPED</InputLabel>
                  <Select
                    value={empresaData.ind_perfil}
                    onChange={(e) => handleInputChange('ind_perfil', e.target.value)}
                    label="Perfil SPED"
                  >
                    <MenuItem value="A">Perfil A</MenuItem>
                    <MenuItem value="B">Perfil B</MenuItem>
                    <MenuItem value="C">Perfil C</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Natureza PJ</InputLabel>
                  <Select
                    value={empresaData.ind_nat_pj}
                    onChange={(e) => handleInputChange('ind_nat_pj', e.target.value)}
                    label="Natureza PJ"
                  >
                    <MenuItem value="00">Não informado</MenuItem>
                    <MenuItem value="01">01 - Atividade Imobiliária</MenuItem>
                    <MenuItem value="02">02 - Entidade PIS/PASEP</MenuItem>
                    <MenuItem value="03">03 - Cooperativa</MenuItem>
                    <MenuItem value="04">04 - Sociedade Empresarial</MenuItem>
                    <MenuItem value="05">05 - Outros</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

               <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>CRT (Regime Tributário)</InputLabel>
                  <Select
                    value={empresaData.crt}
                    onChange={(e) => handleInputChange('crt', e.target.value)}
                    label="CRT (Regime Tributário)"
                  >
                    <MenuItem value="1">1 - Simples Nacional</MenuItem>
                    <MenuItem value="2">2 - Simples Excesso Sublimite</MenuItem>
                    <MenuItem value="3">3 - Regime Normal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle2">
                    Dados do Contador
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Nome do Contador / Razão Social"
                  value={empresaData.contador_nome}
                  onChange={(e) => handleInputChange('contador_nome', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    label="CNPJ Escritório"
                    value={empresaData.contador_cnpj}
                    onChange={(e) => handleInputChange('contador_cnpj', e.target.value)}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                  <Button
                    variant="outlined"
                    onClick={buscarCnpjContador}
                    disabled={!isEditing || buscandoCnpjContador}
                    sx={{ minWidth: 'auto', px: 1.5, height: 56, flexShrink: 0 }}
                    title="Buscar dados do contador via CNPJ"
                  >
                    {buscandoCnpjContador ? <CircularProgress size={16} /> : <SearchIcon />}
                  </Button>
                </Box>
              </Grid>
              
               <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="CPF Contador"
                  value={empresaData.contador_cpf}
                  onChange={(e) => handleInputChange('contador_cpf', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>
              
               <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="CRC"
                  value={empresaData.contador_crc}
                  onChange={(e) => handleInputChange('contador_crc', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>
              
               <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="CEP"
                  value={empresaData.contador_cep}
                  onChange={(e) => handleInputChange('contador_cep', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>
              
               <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Código Município (Contador)"
                  value={empresaData.contador_cod_mun}
                  onChange={(e) => handleInputChange('contador_cod_mun', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Endereço Contador"
                  value={empresaData.contador_endereco}
                  onChange={(e) => handleInputChange('contador_endereco', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Número"
                  value={empresaData.contador_numero}
                  onChange={(e) => handleInputChange('contador_numero', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Bairro"
                  value={empresaData.contador_bairro}
                  onChange={(e) => handleInputChange('contador_bairro', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>
              
               <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Email Contador"
                  value={empresaData.contador_email}
                  onChange={(e) => handleInputChange('contador_email', e.target.value)}
                  disabled={!isEditing}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          )}

        </CardContent>
      </Card>
    </Box>
  );
};

export default EmpresaConfig;