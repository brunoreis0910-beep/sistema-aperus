import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import useImpressaoVenda from '../hooks/useImpressaoVenda';

const TestImpressao = () => {
  const { gerarPDF, imprimirDireto, compartilharWhatsApp, loading } = useImpressaoVenda();

  // Dados de teste para simular uma venda
  const vendaTeste = {
    numero_documento: "VENDA-001",
    data_venda: "2024-11-01",
    valor_total: "1250.75", // String para testar conversão
    nome_cliente: "AMERPUS INFORMATICA LTDA",
    nome_vendedor: "Joéo Vendedor",
    itens: [
      {
        nome_produto: "Notebook Dell",
        quantidade: 1,
        valor_unitario: "2500.00", // String para testar
        subtotal: "2500.00"
      },
      {
        nome_produto: "Mouse Gamer",
        quantidade: 2,
        valor_unitario: "125.50",
        subtotal: "251.00"
      }
    ]
  };

  // Dados problemáticos para testar robustez
  const vendaProblematica = {
    numero_documento: "VENDA-002",
    data_venda: null, // Data nula
    valor_total: undefined, // Valor undefined
    nome_cliente: null,
    nome_vendedor: "",
    itens: [
      {
        nome_produto: "Produto Teste",
        quantidade: "abc", // Quantidade inválida
        valor_unitario: null, // Valor nulo
        subtotal: "não é número"  // String inválida
      }
    ]
  };

  const testarImpressao = async () => {
    console.log("🖨️ Testando impressão com dados válidos...");
    const resultado = await imprimirDireto(vendaTeste);
    console.log("Resultado:", resultado);
  };

  const testarPDF = async () => {
    console.log("📄 Testando PDF com dados válidos...");
    const resultado = await gerarPDF(vendaTeste);
    console.log("Resultado:", resultado);
  };

  const testarWhatsApp = () => {
    console.log("📱 Testando WhatsApp com dados válidos...");
    const resultado = compartilharWhatsApp(vendaTeste);
    console.log("Resultado:", resultado);
  };

  const testarRobustez = async () => {
    console.log("🛡️ Testando robustez com dados problemáticos...");

    try {
      const resultadoImpressao = await imprimirDireto(vendaProblematica);
      console.log("Impressão robusta:", resultadoImpressao);

      const resultadoPDF = await gerarPDF(vendaProblematica);
      console.log("PDF robusto:", resultadoPDF);

      const resultadoWhatsApp = compartilharWhatsApp(vendaProblematica);
      console.log("WhatsApp robusto:", resultadoWhatsApp);

      console.log("✅ Todos os testes de robustez passaram!");
    } catch (error) {
      console.error("❌ Erro nos testes de robustez:", error);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        🧪 Teste de Funções de Impressão
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Teste com Dados Válidos
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            onClick={testarImpressao}
            disabled={loading}
          >
            🖨️ Testar Impressão
          </Button>
          <Button
            variant="contained"
            onClick={testarPDF}
            disabled={loading}
          >
            📄 Testar PDF
          </Button>
          <Button
            variant="contained"
            onClick={testarWhatsApp}
            disabled={loading}
          >
            📱 Testar WhatsApp
          </Button>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Teste de Robustez (Dados Problemáticos)
        </Typography>
        <Button
          variant="outlined"
          color="warning"
          onClick={testarRobustez}
          disabled={loading}
        >
          🛡️ Testar Robustez
        </Button>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Este teste verifica se as funções lidam corretamente com dados nulos, undefined, strings inválidas, etc.
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: 'grey.100' }}>
        <Typography variant="subtitle2" gutterBottom>
          📊 Dados de Teste Válidos:
        </Typography>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(vendaTeste, null, 2)}
        </pre>
      </Paper>

      <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: 'warning.light' }}>
        <Typography variant="subtitle2" gutterBottom>
          ⚠️ Dados de Teste Problemáticos:
        </Typography>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(vendaProblematica, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
};

export default TestImpressao;