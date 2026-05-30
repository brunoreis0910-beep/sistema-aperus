import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Button, TextField,
  Card, CardContent, Divider, List, ListItem,
  ListItemText, InputAdornment, IconButton, Tab, Tabs
} from '@mui/material';
import {
  Save as SaveIcon, ContentCopy as CopyIcon, FormatBold as BoldIcon,
  FormatItalic as ItalicIcon, Title as TitleIcon, ViewHeadline as ParagraphIcon,
  FormatListBulleted as ListIcon, Refresh as RefreshIcon, Preview as PreviewIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export default function ConfigContratoPadraoPage() {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  
  const [titulo, setTitulo] = useState('Contrato Padrão de Prestação de Serviços - Aperus');
  const [versao, setVersao] = useState('1.0');
  const [conteudoHtml, setConteudoHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0 = Editar, 1 = Visualizar HTML Renderizado

  // Dicionário de variáveis para a barra lateral
  const variaveisDisponiveis = [
    { tag: '{{ cliente_razao_social }}', desc: 'Razão Social do cliente' },
    { tag: '{{ cliente_cnpj }}', desc: 'CNPJ do cliente formatado' },
    { tag: '{{ cliente_endereco }}', desc: 'Endereço completo do cliente' },
    { tag: '{{ cliente_responsavel_nome }}', desc: 'Nome do responsável legal' },
    { tag: '{{ cliente_responsavel_email }}', desc: 'E-mail do responsável legal' },
    { tag: '{{ cliente_valor_mensalidade }}', desc: 'Valor da mensalidade formatado' },
    { tag: '{{ cliente_dia_vencimento }}', desc: 'Dia do vencimento da mensalidade' },
    { tag: '{{ sua_empresa_razao }}', desc: 'Sua Razão Social (Suprema Informática)' },
    { tag: '{{ sua_empresa_cnpj }}', desc: 'Seu CNPJ' }
  ];

  const carregarContrato = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/saas/contrato-padrao/atual/');
      if (response.data.status === 'sucesso') {
        setTitulo(response.data.titulo);
        setVersao(response.data.versao);
        setConteudoHtml(response.data.conteudo_html);
      }
    } catch (err) {
      console.error('Erro ao buscar contrato padrão:', err);
      showToast('Nenhum contrato ativo. Crie um novo template.', 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarContrato();
  }, []);

  const handleSalvar = async () => {
    if (!conteudoHtml.trim()) {
      showToast('O conteúdo do contrato não pode ser vazio.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const response = await axiosInstance.post('/saas/contrato-padrao/salvar/', {
        titulo,
        versao,
        conteudo_html: conteudoHtml
      });
      if (response.data.status === 'sucesso') {
        showToast('Contrato padrão atualizado com sucesso!', 'success');
        carregarContrato();
      }
    } catch (err) {
      console.error('Erro ao salvar contrato padrão:', err);
      showToast('Erro ao salvar contrato padrão.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyTag = (tag) => {
    navigator.clipboard.writeText(tag);
    showToast(`Tag ${tag} copiada!`, 'success');
  };

  const insertTextAtCursor = (beforeText, afterText = '') => {
    const textarea = document.getElementById('contract-editor-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = beforeText + selected + afterText;

    setConteudoHtml(
      text.substring(0, start) +
      replacement +
      text.substring(end)
    );

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + beforeText.length, start + beforeText.length + selected.length);
    }, 0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="primary" fontWeight="bold">
          🖋️ Configurar Contrato Padrão SaaS
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSalvar}
          disabled={saving || loading}
        >
          {saving ? 'Salvando...' : 'Salvar Template'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Lado Esquerdo: Editor / Pré-visualização */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, minHeight: '500px' }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Título do Documento *"
                  fullWidth
                  size="small"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Versão *"
                  fullWidth
                  size="small"
                  value={versao}
                  onChange={(e) => setVersao(e.target.value)}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <Tabs
              value={tabValue}
              onChange={(e, v) => setTabValue(v)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab icon={<CodeIcon />} label="Editar HTML" iconPosition="start" />
              <Tab icon={<PreviewIcon />} label="Pré-Visualizar" iconPosition="start" />
            </Tabs>

            {tabValue === 0 ? (
              <Box>
                {/* Barra de Ferramentas de HTML */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    p: 1,
                    bgcolor: '#f8f9fa',
                    border: '1px solid #ced4da',
                    borderBottom: 'none',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    flexWrap: 'wrap'
                  }}
                >
                  <Tooltip title="Negrito">
                    <IconButton size="small" onClick={() => insertTextAtCursor('<strong>', '</strong>')}>
                      <BoldIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Itálico">
                    <IconButton size="small" onClick={() => insertTextAtCursor('<em>', '</em>')}>
                      <ItalicIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Título H1">
                    <IconButton size="small" onClick={() => insertTextAtCursor('<h1>', '</h1>')}>
                      <TitleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Parágrafo">
                    <IconButton size="small" onClick={() => insertTextAtCursor('<p>', '</p>')}>
                      <ParagraphIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Lista de Marcadores">
                    <IconButton size="small" onClick={() => insertTextAtCursor('<ul>\n  <li>', '</li>\n</ul>')}>
                      <ListIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Quebra de Linha">
                    <Button size="small" onClick={() => insertTextAtCursor('<br/>')} sx={{ fontSize: '0.75rem' }}>
                      &lt;br/&gt;
                    </Button>
                  </Tooltip>
                  <Tooltip title="Recarregar do Banco">
                    <IconButton size="small" color="secondary" onClick={carregarContrato} sx={{ ml: 'auto' }}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                <textarea
                  id="contract-editor-textarea"
                  style={{
                    width: '100%',
                    height: '400px',
                    padding: '16px',
                    borderColor: '#ced4da',
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  value={conteudoHtml}
                  onChange={(e) => setConteudoHtml(e.target.value)}
                  placeholder="Escreva ou cole seu contrato aqui em formato HTML..."
                  disabled={loading}
                />
              </Box>
            ) : (
              <Box
                className="contrato-html-preview"
                sx={{
                  border: '1px solid #ced4da',
                  borderRadius: 2,
                  p: 3,
                  minHeight: '400px',
                  bgcolor: '#ffffff',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  fontFamily: 'Georgia, serif',
                  lineHeight: 1.6,
                  textAlign: 'justify',
                  fontSize: '11pt',
                  '& h1, & h2': {
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    textTransform: 'uppercase',
                    mb: 2
                  },
                  '& p': {
                    mb: 2
                  }
                }}
                dangerouslySetInnerHTML={{
                  __html: conteudoHtml || '<p style="color: #999; text-align: center;">Nenhum conteúdo para visualizar.</p>'
                }}
              />
            )}
          </Paper>
        </Grid>

        {/* Lado Direito: Barra Lateral de Variáveis */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
                🏷️ Tags Disponíveis
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Copie e cole estas variáveis no texto do seu contrato. O sistema as substituirá automaticamente com as informações reais do cliente:
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List sx={{ p: 0 }}>
                {variaveisDisponiveis.map((v, i) => (
                  <ListItem
                    key={i}
                    secondaryAction={
                      <Tooltip title="Copiar variável">
                        <IconButton edge="end" onClick={() => handleCopyTag(v.tag)} size="small">
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                    sx={{
                      mb: 1,
                      bgcolor: '#f8f9fa',
                      borderRadius: 2,
                      border: '1px solid #f1f3f5',
                      '&:hover': { bgcolor: '#e9ecef' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <code style={{ color: '#d63384', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {v.tag}
                        </code>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {v.desc}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// Tooltip helper
function Tooltip({ children, title }) {
  const [show, setShow] = useState(false);
  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#333',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          zIndex: 100,
          marginBottom: '5px'
        }}>
          {title}
        </div>
      )}
    </div>
  );
}
