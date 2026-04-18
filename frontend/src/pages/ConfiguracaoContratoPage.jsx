import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import api from '../services/api';

export default function ConfiguracaoContratoPage() {
  const [config, setConfig] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [salvando, setSalvando] = React.useState(false);
  const [sucesso, setSucesso] = React.useState('');
  const [erro, setErro] = React.useState('');

  React.useEffect(() => {
    carregarConfig();
  }, []);

  const carregarConfig = async () => {
    try {
      const res = await api.get('/api/configuracao-contratos/');
      const configs = Array.isArray(res.data) ? res.data : (res.data.results || []);
      
      // Busca config de aluguel
      const configAluguel = configs.find(c => c.tipo_contrato === 'aluguel');
      
      if (configAluguel) {
        setConfig(configAluguel);
      } else {
        setErro('Template de contrato não encontrado');
      }
    } catch (err) {
      console.error('Erro ao carregar configuração:', err);
      setErro('Erro ao carregar configuração de contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!config) return;

    setSalvando(true);
    setSucesso('');
    setErro('');

    try {
      await api.put(`/api/configuracao-contratos/${config.id_configuracao}/`, {
        tipo_contrato: config.tipo_contrato,
        titulo: config.titulo,
        template_html: config.template_html,
        ativo: config.ativo
      });

      setSucesso('Template salvo com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setErro('Erro ao salvar template');
    } finally {
      setSalvando(false);
    }
  };

  const handlePreview = () => {
    if (!config) return;

    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    const mockHtml = config.template_html
      .replace(/\{\{numero_aluguel\}\}/g, 'ALG2025001')
      .replace(/\{\{data_emissao\}\}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/\{\{data_inicio\}\}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/\{\{data_fim_prevista\}\}/g, new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString('pt-BR'))
      .replace(/\{\{cliente_nome\}\}/g, 'Nome do Cliente Exemplo')
      .replace(/\{\{cliente_cpf_cnpj\}\}/g, '123.456.789-00')
      .replace(/\{\{cliente_telefone\}\}/g, '(11) 98765-4321')
      .replace(/\{\{cliente_endereco\}\}/g, 'Rua Exemplo, 123')
      .replace(/\{\{cliente_cidade\}\}/g, 'São Paulo')
      .replace(/\{\{cliente_estado\}\}/g, 'SP')
      .replace(/\{\{empresa_nome\}\}/g, 'Sua Empresa')
      .replace(/\{\{empresa_cnpj\}\}/g, '12.345.678/0001-90')
      .replace(/\{\{empresa_telefone\}\}/g, '(11) 3333-4444')
      .replace(/\{\{empresa_endereco\}\}/g, 'Av. Principal, 1000')
      .replace(/\{\{valor_total\}\}/g, '1500.00')
      .replace(/\{\{valor_desconto\}\}/g, '0.00')
      .replace(/\{\{valor_final\}\}/g, '1500.00')
      .replace(/\{\{observacoes\}\}/g, 'Observações de exemplo')
      .replace(/\{\{total_itens\}\}/g, '2')
      .replace(/\{% for item in itens %\}[\s\S]*?\{% endfor %\}/g, `
        <tr><td>EQ001</td><td>Equipamento 1</td><td>5</td><td>R$ 150.00</td><td>20/12/2025</td><td>R$ 750.00</td></tr>
        <tr><td>EQ002</td><td>Equipamento 2</td><td>5</td><td>R$ 150.00</td><td>20/12/2025</td><td>R$ 750.00</td></tr>
      `)
      .replace(/\{% if observacoes %\}[\s\S]*?\{% endif %\}/g, `<div class='info-box'><h3>OBSERVAÇÕES</h3><p>Observações de exemplo</p></div>`)
      .replace(/\{% if valor_desconto > 0 %\}[\s\S]*?\{% endif %\}/g, '');

    previewWindow.document.write(mockHtml);
    previewWindow.document.close();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!config) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{erro || 'Template não encontrado'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Configuração do Contrato de Aluguel</Typography>

      {sucesso && <Alert severity="success" sx={{ mb: 2 }}>{sucesso}</Alert>}
      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          label="Título do Contrato"
          value={config.titulo}
          onChange={(e) => setConfig({ ...config, titulo: e.target.value })}
          sx={{ mb: 2 }}
        />

        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Variáveis Disponíveis</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                'numero_aluguel', 'data_emissao', 'data_inicio', 'data_fim_prevista',
                'cliente_nome', 'cliente_cpf_cnpj', 'cliente_telefone', 'cliente_endereco',
                'cliente_cidade', 'cliente_estado',
                'empresa_nome', 'empresa_cnpj', 'empresa_telefone', 'empresa_endereco',
                'valor_total', 'valor_desconto', 'valor_final', 'observacoes', 'total_itens'
              ].map(v => (
                <Chip
                  key={v}
                  label={`{{${v}}}`}
                  size="small"
                  onClick={() => {
                    const textarea = document.getElementById('template-textarea');
                    const cursorPos = textarea.selectionStart;
                    const textBefore = config.template_html.substring(0, cursorPos);
                    const textAfter = config.template_html.substring(cursorPos);
                    setConfig({
                      ...config,
                      template_html: textBefore + `{{${v}}}` + textAfter
                    });
                  }}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loop de itens: <code>{'{% for item in itens %}'}</code> ... <code>{'{% endfor %}'}</code>
              <br />
              Dentro do loop: item.codigo, item.nome, item.quantidade_dias, item.valor_diaria, item.data_devolucao_prevista, item.valor_total
            </Typography>
          </AccordionDetails>
        </Accordion>

        <TextField
          id="template-textarea"
          fullWidth
          multiline
          rows={20}
          label="Template HTML"
          value={config.template_html}
          onChange={(e) => setConfig({ ...config, template_html: e.target.value })}
          sx={{ mb: 2, fontFamily: 'monospace', fontSize: '12px' }}
          InputProps={{
            style: { fontFamily: 'Consolas, Monaco, "Courier New", monospace' }
          }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSalvar}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : 'Salvar Template'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={handlePreview}
          >
            Visualizar Exemplo
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
