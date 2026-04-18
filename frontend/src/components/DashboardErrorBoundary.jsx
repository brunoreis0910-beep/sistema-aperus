import React from 'react';
import {
  Alert,
  Box,
  Button,
  Typography,
  Paper
} from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Dashboard Error Boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}>
            <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />

            <Typography variant="h4" gutterBottom color="error.main">
              Erro no Dashboard
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Ocorreu um erro inesperado ao carregar o dashboard.
              Isso pode ser devido a dados ausentes ou problemas de conexéo.
            </Typography>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Erro:</strong> {this.state.error && this.state.error.toString()}
              </Typography>
              {this.state.errorInfo && (
                <Typography variant="caption" component="pre" sx={{ mt: 1, display: 'block' }}>
                  {this.state.errorInfo.componentStack}
                </Typography>
              )}
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleRetry}
                color="primary"
              >
                Recarregar Dashboard
              </Button>

              <Button
                variant="outlined"
                onClick={() => window.location.href = '/login-clean'}
              >
                Voltar ao Login
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
              Se o problema persistir, verifique a conexéo com o banco de dados ou entre em contato com o suporte.
            </Typography>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;