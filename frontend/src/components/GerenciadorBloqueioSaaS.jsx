import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button, Slide, Fade, Alert, AlertTitle } from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Lock as LockIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  WarningAmber as WarningIcon,
  Info as InfoIcon,
  SentimentDissatisfied as SadIcon,
  CloudOff as CloudOffIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from './common/Toast';

export default function GerenciadorBloqueioSaaS({ children }) {
  const { axiosInstance, user, setModulosLiberados } = useAuth();
  const { showToast } = useToast();

  const [status, setStatus] = useState({
    bloquear_sistema: false,
    bloqueio_manual: false,
    alerta_estagio: 'em_dia',
    dias_atraso: 0,
    dias_restantes_carencia: 10
  });
  const [fatura, setFatura] = useState(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const checarStatusFinanceiro = async () => {
    if (checking) return;
    setChecking(true);
    try {
      // Endpoint local que sincroniza com a central
      const response = await axiosInstance.post('/licenca/verificar/');
      if (response.data) {
        setStatus(response.data);
        if (response.data.fatura_pendente) {
          setFatura(response.data.fatura_pendente);
        } else {
          setFatura(null);
        }
        if (response.data.modulos_liberados && setModulosLiberados) {
          setModulosLiberados(response.data.modulos_liberados);
          localStorage.setItem('modulos_liberados', JSON.stringify(response.data.modulos_liberados));
        }
      }
    } catch (error) {
      console.error("Erro ao verificar licença local:", error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Checa ao inicializar
    checarStatusFinanceiro();

    // Polling de 30 segundos
    const interval = setInterval(() => {
      checarStatusFinanceiro();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleCopiarPix = () => {
    if (fatura?.pix_copia_cola) {
      navigator.clipboard.writeText(fatura.pix_copia_cola);
      setCopied(true);
      showToast('Código PIX Copiado com Sucesso!', 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // 1. TELA DE BLOQUEIO MANUAL (FIM DE CONTRATO / SUSPENSÃO ADMINISTRATIVA)
  if (status.bloqueio_manual) {
    return (
      <Box
        sx={{
          background: 'radial-gradient(circle at center, #1b1b22 0%, #0d0d11 100%)',
          color: '#fff',
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          p: 3,
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 99999
        }}
      >
        <Fade in timeout={1000}>
          <Paper
            elevation={24}
            sx={{
              p: 5,
              borderRadius: 4,
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              maxWidth: 550,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(239, 83, 80, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                animation: 'pulse 2s infinite'
              }}
            >
              <LockIcon sx={{ color: '#ef5350', fontSize: 40 }} />
            </Box>
            <Typography variant="h4" fontWeight="800" sx={{ mb: 2, letterSpacing: '-0.5px' }}>
              ACESSO SUSPENSO
            </Typography>
            <Typography variant="body1" sx={{ color: '#aaa', mb: 4, lineHeight: 1.6 }}>
              Este sistema foi desativado devido ao encerramento do contrato de prestação de serviços. 
              Para reativação ou suporte administrativo, por favor entre em contato com o suporte da equipe do <strong>Aperus</strong>.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="large"
              onClick={checarStatusFinanceiro}
              disabled={checking}
              sx={{
                borderRadius: 2,
                px: 4,
                borderColor: 'rgba(239, 83, 80, 0.5)',
                '&:hover': {
                  borderColor: '#ef5350',
                  bgcolor: 'rgba(239, 83, 80, 0.05)'
                }
              }}
            >
              {checking ? 'Verificando...' : 'Re-verificar Licença'}
            </Button>
          </Paper>
        </Fade>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 83, 80, 0.4); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(239, 83, 80, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 83, 80, 0); }
          }
        `}} />
      </Box>
    );
  }

  // 2. TELA DE BLOQUEIO FINANCEIRO (INADIMPLÊNCIA > 10 DIAS)
  if (status.bloquear_sistema) {
    return (
      <Box
        sx={{
          background: 'linear-gradient(135deg, #f4f5f7 0%, #e2e5ea 100%)',
          height: '100vh',
          width: '100vw',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3,
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 99999
        }}
      >
        <Fade in timeout={800}>
          <Paper
            elevation={8}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              maxWidth: 500,
              width: '100%',
              textAlign: 'center',
              bgcolor: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                bgcolor: 'rgba(211, 47, 47, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <WarningIcon sx={{ color: '#d32f2f', fontSize: 36 }} />
            </Box>
            <Typography variant="h5" fontWeight="800" color="error" sx={{ mb: 1, letterSpacing: '-0.5px' }}>
              Assinatura Suspensa
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Identificamos uma pendência financeira na sua licença do Aperus vencida em <strong>{fatura?.vencimento || 'N/A'}</strong>.
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                width: '100%',
                bgcolor: '#fff9f9',
                borderColor: '#ffebee',
                borderRadius: 2,
                mb: 3,
                textAlign: 'center'
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 700, mb: 0.5 }}>
                Valor Pendente
              </Typography>
              <Typography variant="h4" fontWeight="900" color="error">
                R$ {fatura?.valor || '0,00'}
              </Typography>
            </Paper>

            {fatura?.pix_copia_cola ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mb: 3 }}>
                <Typography variant="body2" fontWeight="700" sx={{ mb: 1.5 }}>
                  Pague via PIX para liberação imediata:
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    bgcolor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: 2,
                    display: 'inline-block',
                    mb: 2
                  }}
                >
                  <QRCodeCanvas value={fatura.pix_copia_cola} size={180} level="M" includeMargin />
                </Paper>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={copied ? <CheckIcon /> : <CopyIcon />}
                  onClick={handleCopiarPix}
                  fullWidth
                  sx={{
                    borderRadius: 2.5,
                    py: 1.5,
                    fontWeight: 'bold',
                    boxShadow: 'none',
                    bgcolor: copied ? '#4caf50' : '#1976d2',
                    '&:hover': {
                      bgcolor: copied ? '#43a047' : '#1565c0',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {copied ? 'Copiado!' : 'Copiar Código PIX'}
                </Button>
              </Box>
            ) : (
              <Box sx={{ mb: 3 }}>
                <Alert severity="warning" sx={{ textAlign: 'left' }}>
                  Não foi possível carregar o QR Code do PIX. Por favor, utilize os outros meios de pagamento ou entre em contato.
                </Alert>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <span className="dot-pulse"></span>
              O sistema será desbloqueado em até 30 segundos após a confirmação do pagamento.
            </Typography>

            <Button
              variant="text"
              size="small"
              onClick={checarStatusFinanceiro}
              disabled={checking}
              sx={{ mt: 2 }}
            >
              {checking ? 'Verificando...' : 'Já efetuei o pagamento'}
            </Button>
          </Paper>
        </Fade>
        <style dangerouslySetInnerHTML={{__html: `
          .dot-pulse {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #757575;
            display: inline-block;
            animation: bounce 1.4s infinite ease-in-out both;
          }
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1.0); }
          }
        `}} />
      </Box>
    );
  }

  // 3. RENDERIZAÇÃO DOS BANNERS DE ALERTA DIRETO NO LAYOUT (SISTEMA LIBERADO)
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* 3.1 AVISO CRÍTICO: CARÊNCIA EM CURSO */}
      {status.alerta_estagio === 'critico' && (
        <Fade in timeout={500}>
          <Box
            sx={{
              bgcolor: '#fff3cd',
              color: '#856404',
              borderBottom: '1px solid #ffeeba',
              py: 1,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              position: 'sticky',
              top: 0,
              zIndex: 99999,
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}
          >
            <WarningIcon sx={{ fontSize: 20, color: '#856404' }} />
            <Typography variant="body2" fontWeight="bold">
              AVISO CRÍTICO: Sua assinatura possui pendências financeiras. O Aperus entrará em manutenção automática em {status.dias_restantes_carencia} dias.
            </Typography>
          </Box>
        </Fade>
      )}

      {/* 3.2 FIM DE SEMANA PROTEGIDO */}
      {status.alerta_estagio === 'fim_de_semana' && (
        <Fade in timeout={500}>
          <Box
            sx={{
              bgcolor: '#e2e3e5',
              color: '#383d41',
              borderBottom: '1px solid #d6d8db',
              py: 1.2,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              position: 'sticky',
              top: 0,
              zIndex: 99999,
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}
          >
            <InfoIcon sx={{ fontSize: 20, color: '#383d41' }} />
            <Typography variant="body2" fontWeight="bold">
              📢 NOTA: Identificamos um atraso financeiro. Em respeito à sua operação, o Aperus não realiza bloqueios aos finais de semana. Regularize seu saldo via PIX para evitar a suspensão nesta segunda-feira útil.
            </Typography>
          </Box>
        </Fade>
      )}

      {/* 3.3 MODO OFFLINE DE CONTINGÊNCIA */}
      {status.alerta_estagio === 'modo_offline' && (
        <Fade in timeout={500}>
          <Box
            sx={{
              bgcolor: '#0288d1',
              color: '#ffffff',
              py: 0.8,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}
          >
            <CloudOffIcon sx={{ fontSize: 18 }} />
            <Typography variant="caption" fontWeight="bold">
              ℹ️ Conexão com o servidor central indisponível. Trabalhando em Modo Offline de Contingência (Validade: {status.dias_restantes_carencia || '3'} dias).
            </Typography>
          </Box>
        </Fade>
      )}

      {children}
    </Box>
  );
}
