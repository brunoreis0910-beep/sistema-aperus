/**
 * Exemplo de Uso do Sistema Toast
 * 
 * Este arquivo demonstra como usar o Toast em diferentes cenários
 */

import React, { useState } from 'react';
import { Box, Button, Stack, Paper, Typography } from '@mui/material';
import { useToast } from '../components/common/Toast';

function ExemploToast() {
  const { showSuccess, showError, showWarning, showInfo, showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Exemplo 1: Sucesso simples
  const handleSuccess = () => {
    showSuccess('Operação realizada com sucesso!');
  };

  // Exemplo 2: Erro simples
  const handleError = () => {
    showError('Ocorreu um erro ao processar a solicitação.');
  };

  // Exemplo 3: Aviso
  const handleWarning = () => {
    showWarning('Atenção! Verifique os dados antes de continuar.');
  };

  // Exemplo 4: Informação
  const handleInfo = () => {
    showInfo('Esta é uma mensagem informativa.');
  };

  // Exemplo 5: Com título
  const handleComTitulo = () => {
    showError('Não foi possível salvar os dados no banco.', {
      title: 'Erro no Banco de Dados'
    });
  };

  // Exemplo 6: Duração customizada
  const handleDuracaoCustomizada = () => {
    showSuccess('Esta mensagem ficará visível por 8 segundos.', {
      duration: 8000
    });
  };

  // Exemplo 7: Posição customizada
  const handlePosicaoTopo = () => {
    showInfo('Esta mensagem aparece no topo!', {
      position: { vertical: 'top', horizontal: 'center' }
    });
  };

  // Exemplo 8: Simulação de salvamento com feedback
  const handleSalvarComFeedback = async () => {
    setLoading(true);

    try {
      // Simula uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simula sucesso ou erro aleatório
      if (Math.random() > 0.5) {
        showSuccess('Dados salvos com sucesso!', {
          title: 'Sucesso'
        });
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      showError('Não foi possível salvar os dados. Tente novamente.', {
        title: 'Erro ao Salvar',
        duration: 6000
      });
    } finally {
      setLoading(false);
    }
  };

  // Exemplo 9: Toast completamente customizado
  const handleCustomizado = () => {
    showToast('Mensagem totalmente customizada', {
      severity: 'warning',
      title: 'Customizado',
      duration: 5000,
      position: { vertical: 'bottom', horizontal: 'left' }
    });
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Exemplos de Uso do Toast
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tipos Básicos
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button variant="contained" color="success" onClick={handleSuccess}>
            Sucesso
          </Button>
          <Button variant="contained" color="error" onClick={handleError}>
            Erro
          </Button>
          <Button variant="contained" color="warning" onClick={handleWarning}>
            Aviso
          </Button>
          <Button variant="contained" color="info" onClick={handleInfo}>
            Info
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Customizações
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" onClick={handleComTitulo}>
            Com Título
          </Button>
          <Button variant="outlined" onClick={handleDuracaoCustomizada}>
            Duração 8s
          </Button>
          <Button variant="outlined" onClick={handlePosicaoTopo}>
            Posição Topo
          </Button>
          <Button variant="outlined" onClick={handleCustomizado}>
            Completamente Custom
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Caso Real: Salvar com Feedback
        </Typography>
        <Button
          variant="contained"
          onClick={handleSalvarComFeedback}
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar Dados (Simulação)'}
        </Button>
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.100' }}>
        <Typography variant="h6" gutterBottom>
          📝 Como Usar no Seu Componente
        </Typography>
        <Typography variant="body2" component="pre" sx={{
          fontFamily: 'monospace',
          bgcolor: 'white',
          p: 2,
          borderRadius: 1,
          overflow: 'auto'
        }}>
          {`import { useToast } from '../components/common/Toast';

function MeuComponente() {
  const { showSuccess, showError } = useToast();
  
  const salvar = async () => {
    try {
      await api.post('/dados', dados);
      showSuccess('Salvo com sucesso!');
    } catch (error) {
      showError('Erro ao salvar', { 
        title: 'Atenção!' 
      });
    }
  };
  
  return <Button onClick={salvar}>Salvar</Button>;
}`}
        </Typography>
      </Paper>
    </Box>
  );
}

export default ExemploToast;
