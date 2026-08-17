import React from 'react';
import { Box, Paper, Typography, Button, Alert, Collapse } from '@mui/material';
import { Refresh as RefreshIcon, Home as HomeIcon, BugReport as BugReportIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[APERUS ERROR BOUNDARY] Erro interceptado:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, resetError: this.handleReset })
          : this.props.fallback;
      }

      const isMinimal = this.props.minimal;

      if (isMinimal) {
        return (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={this.handleReset}>
                Tentar novamente
              </Button>
            }
            sx={{ m: 1 }}
          >
            Não foi possível carregar este bloco temporariamente.
          </Alert>
        );
      }

      return (
        <Box
          sx={{
            p: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: this.props.inline ? 'auto' : '60vh'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: '100%',
              borderRadius: 3,
              textAlign: 'center',
              border: '1px solid #ffcdd2',
              bgcolor: '#fffbfb'
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#ffebee',
                color: '#d32f2f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}
            >
              <BugReportIcon sx={{ fontSize: 36 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#b71c1c', mb: 1 }}>
              {this.props.title || 'Algo inesperado aconteceu nesta tela'}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
              {this.props.message ||
                'O sistema interceptou uma falha de exibição e protegeu seus dados. Você pode tentar recarregar o módulo ou voltar para a tela inicial com segurança.'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap', mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={this.handleReset}
                sx={{ borderRadius: 2, fontWeight: 'bold' }}
              >
                Tentar Novamente
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
                sx={{ borderRadius: 2 }}
              >
                Tela Inicial
              </Button>
            </Box>

            <Button
              size="small"
              color="inherit"
              onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
              sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.75rem' }}
            >
              {this.state.showDetails ? 'Ocultar detalhes técnicos' : 'Exibir detalhes técnicos'}
            </Button>

            <Collapse in={this.state.showDetails}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mt: 2,
                  bgcolor: '#263238',
                  color: '#cfd8dc',
                  textAlign: 'left',
                  borderRadius: 2,
                  overflowX: 'auto',
                  maxHeight: 200,
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}
              >
                <div style={{ color: '#ff8a80', fontWeight: 'bold', marginBottom: 4 }}>
                  {this.state.error && this.state.error.toString()}
                </div>
                <div>{this.state.errorInfo && this.state.errorInfo.componentStack}</div>
              </Paper>
            </Collapse>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
