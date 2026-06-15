import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Grid, Button, TextField,
  CircularProgress, Alert, Card, CardContent, Divider, Stack
} from '@mui/material';
import {
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  ContactMail as ContactIcon,
  Home as AddressIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { cleanString, formatCNPJ, formatTelefone, formatCEP, buscarCNPJ, buscarCEP } from '../utils/cnpjCepUtils';
import { API_ENDPOINT } from '../config/api';

export default function CadastroClienteRemoto() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Controle de estados principais
  const [verificandoToken, setVerificandoToken] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [tokenMsgErro, setTokenMsgErro] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [msgErro, setMsgErro] = useState('');

  // Dados do formulário
  const [formData, setFormData] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    inscricao_estadual: '',
    proprietario: '',
    telefone: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    email_responsavel: '',
    data_nascimento_responsavel: ''
  });

  // Validar token ao montar o componente
  useEffect(() => {
    if (!token) {
      setTokenValido(false);
      setTokenMsgErro('Token de convite não encontrado na URL.');
      setVerificandoToken(false);
      return;
    }

    const API_URL = API_ENDPOINT;
    fetch(`${API_URL}/saas/validar-token-cadastro/?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.valido) {
          setTokenValido(true);
          // Pré-preenche o telefone enviado no convite
          setFormData(prev => ({
            ...prev,
            telefone: formatTelefone(data.whatsapp_cliente || '')
          }));
        } else {
          setTokenValido(false);
          setTokenMsgErro(data.error || 'Este convite expirou ou já foi utilizado.');
        }
      })
      .catch(err => {
        console.error(err);
        setTokenValido(false);
        setTokenMsgErro('Erro ao se conectar ao servidor da Central.');
      })
      .finally(() => {
        setVerificandoToken(false);
      });
  }, [token]);

  // Manipulação de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Máscaras em tempo real
    let formattedValue = value;
    if (name === 'cnpj') formattedValue = formatCNPJ(value);
    if (name === 'telefone') formattedValue = formatTelefone(value);
    if (name === 'cep') formattedValue = formatCEP(value);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  // Buscar CNPJ via API
  const handleBuscarCnpj = async () => {
    const cnpjLimpo = cleanString(formData.cnpj);
    if (cnpjLimpo.length !== 14) {
      setMsgErro('Digite um CNPJ válido com 14 dígitos.');
      return;
    }

    setBuscandoCnpj(true);
    setMsgErro('');

    try {
      const data = await buscarCNPJ(cnpjLimpo);
      
      // Auto-preenche as informações retornadas da API
      setFormData(prev => ({
        ...prev,
        razao_social: data.razao_social || prev.razao_social,
        nome_fantasia: data.nome_fantasia || prev.nome_fantasia,
        email: data.email || prev.email,
        telefone: prev.telefone ? prev.telefone : formatTelefone(data.telefone || ''),
        cep: formatCEP(data.cep || prev.cep),
        endereco: data.endereco || prev.endereco,
        numero: data.numero || prev.numero,
        complemento: data.complemento || prev.complemento,
        bairro: data.bairro || prev.bairro,
        cidade: data.cidade || prev.cidade,
        estado: data.estado || prev.estado
      }));
    } catch (err) {
      console.error(err);
      setMsgErro(err.message || 'Erro ao buscar o CNPJ na Receita Federal.');
    } finally {
      setBuscandoCnpj(false);
    }
  };

  // Buscar CEP via API
  const handleBuscarCep = async () => {
    const cepLimpo = cleanString(formData.cep);
    if (cepLimpo.length !== 8) return;

    try {
      const data = await buscarCEP(cepLimpo);
      setFormData(prev => ({
        ...prev,
        endereco: data.endereco || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.cidade || prev.cidade,
        estado: data.estado || prev.estado
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Enviar formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações obrigatórias
    if (!formData.cnpj || !formData.razao_social || !formData.proprietario || !formData.telefone || !formData.email) {
      setMsgErro('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    setSubmitting(true);
    setMsgErro('');

    const API_URL = API_ENDPOINT;
    try {
      const response = await fetch(`${API_URL}/saas/finalizar-cadastro-remoto/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          cnpj: cleanString(formData.cnpj),
          razao_social: formData.razao_social,
          nome_fantasia: formData.nome_fantasia,
          inscricao_estadual: formData.inscricao_estadual,
          proprietario: formData.proprietario,
          telefone: cleanString(formData.telefone),
          email: formData.email,
          cep: cleanString(formData.cep),
          endereco: formData.endereco,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          email_responsavel: formData.email_responsavel,
          data_nascimento_responsavel: formData.data_nascimento_responsavel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao finalizar cadastro.');
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setMsgErro(err.message || 'Erro ao enviar o formulário.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Tela de Carregamento Inicial
  if (verificandoToken) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        color: '#f8fafc',
        gap: 2
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#38bdf8' }} />
        <Typography variant="h6" fontWeight={500}>Verificando convite de segurança...</Typography>
      </Box>
    );
  }

  // 2. Tela de Token Inválido / Expirado
  if (!tokenValido) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        p: 3
      }}>
        <Card sx={{
          maxWidth: 500,
          borderRadius: 4,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          color: '#f8fafc',
          textAlign: 'center',
          p: 2
        }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex' }}>
              <ErrorIcon sx={{ fontSize: 64 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: -0.5 }}>
              Link Expirado ou Inválido
            </Typography>
            <Typography variant="body1" color="grey.400" sx={{ lineHeight: 1.6 }}>
              {tokenMsgErro || 'Este link de preenchimento não é mais válido.'}
            </Typography>
            <Typography variant="body2" color="grey.500" sx={{ mt: 1 }}>
              Por favor, solicite ao vendedor ou equipe de suporte do sistema Aperus que gere um novo link.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // 3. Tela de Cadastro com Sucesso
  if (success) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        p: 3
      }}>
        <Card sx={{
          maxWidth: 550,
          borderRadius: 5,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
          color: '#f8fafc',
          textAlign: 'center',
          p: 3
        }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex' }}>
              <CheckIcon sx={{ fontSize: 72 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -0.5, color: '#10b981' }}>
                Cadastro Recebido!
              </Typography>
              <Typography variant="h6" fontWeight={500} color="grey.300" gutterBottom>
                {formData.razao_social}
              </Typography>
            </Box>
            <Typography variant="body1" color="grey.400" sx={{ lineHeight: 1.6 }}>
              Muito obrigado por finalizar as suas informações cadastrais!
              <br /><br />
              Nossa equipe técnica foi notificada automaticamente e já está provisionando o banco de dados do seu sistema. Em alguns minutos, você receberá a confirmação e as credenciais de acesso diretamente no seu WhatsApp.
            </Typography>
            <Divider sx={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            <Button
              variant="contained"
              size="large"
              component="a"
              href="https://aperus.com.br"
              target="_blank"
              sx={{
                bgcolor: '#38bdf8',
                color: '#0f172a',
                fontWeight: 'bold',
                px: 5,
                borderRadius: 2.5,
                textTransform: 'none',
                '&:hover': { bgcolor: '#0ea5e9' }
              }}
            >
              Conhecer o site do Aperus
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // 4. Formulário do Cliente
  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      py: 6,
      px: 3,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Paper sx={{
        maxWidth: 850,
        width: '100%',
        borderRadius: 5,
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        p: { xs: 3, md: 5 }
      }}>
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" fontWeight={850} color="primary" gutterBottom sx={{ letterSpacing: -0.5 }}>
            Aperus
          </Typography>
          <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
            Ativação de Conta e Cadastro
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Insira suas informações cadastrais abaixo de forma rápida. Digite o CNPJ para preencher os dados automaticamente.
          </Typography>
        </Box>

        {msgErro && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {msgErro}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* SEÇÃO 1 - DADOS FISCAIS */}
          <Box mb={4}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
              <BusinessIcon color="primary" />
              <Typography variant="h6" fontWeight={700} color="text.primary">Dados da Empresa</Typography>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={3.5}>
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    required
                    label="CNPJ"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    fullWidth
                    disabled={buscandoCnpj}
                  />
                  <Button
                    variant="contained"
                    onClick={handleBuscarCnpj}
                    disabled={buscandoCnpj || cleanString(formData.cnpj).length !== 14}
                    sx={{ minWidth: 60, px: 2 }}
                  >
                    {buscandoCnpj ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
                  </Button>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Inscrição Estadual"
                  name="inscricao_estadual"
                  value={formData.inscricao_estadual}
                  onChange={handleChange}
                  placeholder="Isento ou Número"
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="Razão Social"
                  name="razao_social"
                  value={formData.razao_social}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nome Fantasia"
                  name="nome_fantasia"
                  value={formData.nome_fantasia}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>

          {/* SEÇÃO 2 - ENDEREÇO */}
          <Box mb={4}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
              <AddressIcon color="primary" />
              <Typography variant="h6" fontWeight={700} color="text.primary">Endereço da Empresa</Typography>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={3.5}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="CEP"
                  name="cep"
                  value={formData.cep}
                  onChange={handleChange}
                  onBlur={handleBuscarCep}
                  placeholder="00000-000"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Logradouro"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  label="Número"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Complemento"
                  name="complemento"
                  value={formData.complemento}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Bairro"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  label="Cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Estado (UF)"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  inputProps={{ maxLength: 2 }}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>

          {/* SEÇÃO 3 - PROPRIETÁRIO / CONTATO */}
          <Box mb={4}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
              <ContactIcon color="primary" />
              <Typography variant="h6" fontWeight={700} color="text.primary">Contato e Responsável</Typography>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={3.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="Nome do Proprietário / Responsável"
                  name="proprietario"
                  value={formData.proprietario}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data de Nascimento do Responsável"
                  name="data_nascimento_responsavel"
                  type="date"
                  value={formData.data_nascimento_responsavel}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="E-mail do Responsável"
                  name="email_responsavel"
                  type="email"
                  value={formData.email_responsavel || formData.email}
                  onChange={handleChange}
                  placeholder="responsavel@email.com"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="E-mail Geral da Empresa (Notas Fiscais)"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="empresa@email.com"
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="Telefone WhatsApp"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
            fullWidth
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            sx={{
              py: 2,
              borderRadius: 3,
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}
          >
            {submitting ? 'Finalizando Cadastro...' : 'Finalizar e Ativar Conta'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
