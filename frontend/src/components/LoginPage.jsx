import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  InputAdornment,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Business as BusinessIcon,
  Computer as ComputerIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  backgroundColor: '#ffffff', // Forçar fundo preto
  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  borderRadius: theme.spacing(2),
  border: '1px solid rgba(0,0,0,0.1)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    margin: theme.spacing(1),
    borderRadius: theme.spacing(1),
  },
}));

const BackgroundBox = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 50%, #0a3d91 100%)', // Azul vibrante
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'rgba(255,255,255,0.9)', // Mais opaco e preto
  backdropFilter: 'blur(5px)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(credentials.username, credentials.password);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Erro ao fazer login. Verifique suas credenciais.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const features = [
    {
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      title: 'Gestéo Completa',
      description: 'Gerencie clientes, produtos e vendas em um só lugar'
    },
    {
      icon: <ComputerIcon sx={{ fontSize: 40 }} />,
      title: 'Interface Moderna',
      description: 'Design responsivo que funciona em qualquer dispositivo'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Seguro e Confiável',
      description: 'Seus dados protegidos com a melhor tecnologia'
    }
  ];

  return (
    <BackgroundBox>
      <Container
        maxWidth={false}
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: { xs: '100%', sm: '100%', md: '100%', lg: '90%', xl: '85%' },
          '@media (min-width: 3440px)': {
            maxWidth: '80%'
          },
          '@media (min-width: 5120px)': {
            maxWidth: '75%'
          }
        }}
      >
        <Grid container spacing={4} alignItems="center" sx={{
          minHeight: '100vh',
          '@media (min-width: 3440px)': {
            spacing: 6
          },
          '@media (min-width: 5120px)': {
            spacing: 8
          }
        }}>

          {/* Lado Esquerdo - Informações (apenas desktop) */}
          {!isMobile && (
            <Grid item xs={12} md={6}>
              <Box sx={{ color: 'white', mb: 4 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 'bold',
                    mb: 2,
                    background: 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  APERUS
                </Typography>
                <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                  A soluçéo completa para gestéo do seu negócio
                </Typography>

                <Grid container spacing={3}>
                  {features.map((feature, index) => (
                    <Grid item xs={12} key={index}>
                      <FeatureCard>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                          <Avatar
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.9)',
                              mr: 3,
                              width: 60,
                              height: 60,
                              color: '#000000'
                            }}
                          >
                            {React.cloneElement(feature.icon, { sx: { color: '#000000' } })}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#000000' }}>
                              {feature.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#000000' }}>
                              {feature.description}
                            </Typography>
                          </Box>
                        </CardContent>
                      </FeatureCard>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          )}

          {/* Lado Direito - Formulário de Login */}
          <Grid item xs={12} md={6}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: isMobile ? 'auto' : '100vh',
              py: { xs: 4, md: 0 }
            }}>
              <StyledPaper
                elevation={0}
                sx={{
                  maxWidth: 450,
                  backgroundColor: '#ffffff !important',
                  color: '#000000 !important',
                  '& .MuiInputBase-root': {
                    backgroundColor: '#ffffff !important',
                    color: '#000000 !important',
                  },
                  '& .MuiInputBase-input': {
                    color: '#000000 !important',
                  },
                  '& .MuiFormLabel-root': {
                    color: '#666666 !important',
                  },
                  '& .MuiTypography-root': {
                    color: '#000000 !important',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#666666 !important',
                  }
                }}
              >

                {/* Header Mobile */}
                {isMobile && (
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 2,
                        background: 'linear-gradient(45deg, #1976d2 30%, #0d47a1 90%)'
                      }}
                    >
                      <BusinessIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Typography
                      variant={isSmallScreen ? "h4" : "h3"}
                      sx={{
                        fontWeight: 'bold',
                        background: 'linear-gradient(45deg, #1976d2 30%, #0d47a1 90%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                      }}
                    >
                      APERUS
                    </Typography>
                  </Box>
                )}

                {/* Header Desktop */}
                {!isMobile && (
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Avatar
                      sx={{
                        width: 70,
                        height: 70,
                        mx: 'auto',
                        mb: 2,
                        background: 'linear-gradient(45deg, #1976d2 30%, #0d47a1 90%)'
                      }}
                    >
                      <BusinessIcon sx={{ fontSize: 35 }} />
                    </Avatar>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Bem-vindo!
                    </Typography>
                  </Box>
                )}

                <Typography
                  variant={isSmallScreen ? "body1" : "h6"}
                  color="text.secondary"
                  sx={{ textAlign: 'center', mb: 3 }}
                >
                  Faça login para continuar
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="Usuário"
                    name="username"
                    autoComplete="username"
                    autoFocus
                    value={credentials.username}
                    onChange={handleChange}
                    disabled={loading}
                    variant="outlined"
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={credentials.password}
                    onChange={handleChange}
                    disabled={loading}
                    variant="outlined"
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      mt: 2,
                      mb: 3,
                      py: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #1976d2 30%, #0d47a1 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1565c0 30%, #0a3d91 90%)',
                      },
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Features Mobile */}
                {isMobile && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold' }}>
                      Por que escolher nosso sistema?
                    </Typography>
                    {features.map((feature, index) => (
                      <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.9)', mr: 2, width: 40, height: 40 }}>
                            {React.cloneElement(feature.icon, { sx: { fontSize: 24, color: '#000000' } })}
                          </Avatar>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#000000' }}>
                            {feature.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#000000' }}>
                          {feature.description}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

              </StyledPaper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </BackgroundBox>
  );
};

export default LoginPage;