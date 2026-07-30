import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Chip, Stack, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, IconButton, 
  Tooltip, CircularProgress, MenuItem, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const DEFAULT_TEMPLATE = `TERMO DE RESPONSABILIDADE E PRESTAÇÃO DE SERVIÇOS DE SOFTWARE

Pelo presente instrumento, o cliente declara e assume inteira responsabilidade civil e criminal pela veracidade de todas as informações inseridas e transmitidas por meio do software Aperus.

O cliente declara-se ciente de que:
1. O software Aperus é uma ferramenta de apoio à gestão comercial e fiscal, sendo o cliente o único responsável pela parametrização fiscal e emissão de seus documentos junto à SEFAZ.
2. A guarda dos dados de acesso (usuários e senhas) é de responsabilidade exclusiva do cliente.
3. Este termo entra em vigor imediatamente após a confirmação e assinatura digital.

Por estar de acordo, o declarante assina digitalmente este termo.`;

export default function ContratoResponsabilidadePage() {
  const { axiosInstance } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  const [openCreate, setOpenCreate] = useState(false);
  const [novoContrato, setNovoContrato] = useState({
    cliente_nome: '',
    cliente_documento: '',
    cliente_whatsapp: '',
    cliente_email: '',
    texto_contrato: DEFAULT_TEMPLATE
  });
  const [submitting, setSubmitting] = useState(false);

  const [openView, setOpenView] = useState(false);
  const [contratoSelecionado, setContratoSelecionado] = useState(null);

  const carregarContratos = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/contratos-responsabilidade/');
      const data = res.data;
      const list = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
      setContratos(list);
    } catch (err) {
      showToast('Erro ao carregar contratos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarContratos();
  }, []);

  const handleCreate = async () => {
    if (!novoContrato.cliente_nome || !novoContrato.cliente_documento || !novoContrato.cliente_email || !novoContrato.texto_contrato) {
      showToast('Nome, CPF/CNPJ, E-mail e Conteúdo do contrato são obrigatórios.', 'warning');
      return;
    }
    
    try {
      setSubmitting(true);
      await axiosInstance.post('/contratos-responsabilidade/', {
        cliente_nome: novoContrato.cliente_nome,
        cliente_documento: novoContrato.cliente_documento,
        cliente_whatsapp: novoContrato.cliente_whatsapp,
        cliente_email: novoContrato.cliente_email,
        texto_contrato: novoContrato.texto_contrato
      });
      showToast('Contrato de responsabilidade criado com sucesso!', 'success');
      setOpenCreate(false);
      setNovoContrato({
        cliente_nome: '',
        cliente_documento: '',
        cliente_whatsapp: '',
        cliente_email: '',
        texto_contrato: DEFAULT_TEMPLATE
      });
      carregarContratos();
    } catch (err) {
      showToast('Erro ao criar contrato.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este contrato?')) return;
    try {
      await axiosInstance.delete(`/contratos-responsabilidade/${id}/`);
      showToast('Contrato excluído com sucesso!', 'success');
      carregarContratos();
    } catch (err) {
      showToast('Erro ao excluir contrato.', 'error');
    }
  };

  const getAssinarUrl = (uuid) => {
    const origin = window.location.origin;
    return `${origin}/assinar-contrato/${uuid}`;
  };

  const handleCopiarLink = (uuid) => {
    const url = getAssinarUrl(uuid);
    navigator.clipboard.writeText(url);
    showToast('Link de assinatura copiado!', 'success');
  };

  const handleEnviarWhatsApp = (contrato) => {
    if (!contrato.cliente_whatsapp) {
      showToast('WhatsApp do cliente não cadastrado.', 'warning');
      return;
    }
    const tel = contrato.cliente_whatsapp.replace(/\D/g, '');
    const ddi = tel.startsWith('55') ? tel : `55${tel}`;
    const urlAssinatura = getAssinarUrl(contrato.uuid);
    
    const texto = `Olá ${contrato.cliente_nome}! Segue o link para leitura e assinatura eletrônica do nosso Contrato de Responsabilidade e Licenciamento Aperus: ${urlAssinatura}`;
    const waUrl = `https://api.whatsapp.com/send?phone=${ddi}&text=${encodeURIComponent(texto)}`;
    window.open(waUrl, '_blank');
  };

  const handlePrint = (contrato) => {
    if (!contrato) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Contrato Assinado - ${contrato.cliente_nome}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px; text-transform: uppercase; }
            .divider { border-bottom: 1px solid #cbd5e1; margin: 20px 0; }
            .text { white-space: pre-wrap; margin-bottom: 40px; font-size: 14px; text-align: justify; font-family: monospace; }
            .signature-box { border: 1px solid #cbd5e1; padding: 20px; border-radius: 6px; background-color: #f8fafc; max-width: 500px; margin-top: 30px; page-break-inside: avoid; }
            .signature-img { max-height: 70px; display: block; margin-bottom: 15px; border-bottom: 1px solid #94a3b8; padding-bottom: 10px; }
            .meta { font-size: 12px; color: #475569; }
            .meta p { margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="header">Termo de Responsabilidade e Prestação de Serviços</div>
          <div class="divider"></div>
          <div class="text">${contrato.texto_contrato}</div>
          <div class="divider"></div>
          <div class="signature-box">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 10px;">Assinado Eletronicamente por:</div>
            \${contrato.assinatura_desenho ? \`<img src="\${contrato.assinatura_desenho}" class="signature-img" />\` : '<div class="signature-img" style="height: 40px; line-height: 40px; font-style: italic;">Assinado Eletronicamente</div>'}
            <div class="meta">
              <p><strong>Nome:</strong> \${contrato.assinado_por_nome}</p>
              <p><strong>CPF/CNPJ:</strong> \${contrato.assinado_por_cpf}</p>
              <p><strong>Data/Hora:</strong> \${new Date(contrato.assinado_em).toLocaleString('pt-BR')}</p>
              <p><strong>IP de Assinatura:</strong> \${contrato.ip_assinatura}</p>
              <p><strong>ID de Autenticidade:</strong> \${contrato.uuid}</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const contratosFiltrados = Array.isArray(contratos) ? contratos.filter(c => {
    const bateBusca = c.cliente_nome?.toLowerCase().includes(busca.toLowerCase()) || 
                      c.cliente_documento?.includes(busca);
    const bateStatus = filtroStatus === 'TODOS' || c.status === filtroStatus;
    return bateBusca && bateStatus;
  }) : [];

  const fmtMoeda = (val) => {
    if (!val) return 'R$ 0,00';
    return parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Contratos de Responsabilidade
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gere links de termos de responsabilidade e envie para assinatura digital via WhatsApp
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
          sx={{ borderRadius: 2 }}
        >
          Novo Contrato
        </Button>
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Buscar por cliente ou documento"
                fullWidth
                size="small"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Filtrar por Status"
                fullWidth
                size="small"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="PENDENTE">Pendente</MenuItem>
                <MenuItem value="ASSINADO">Assinado</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell align="center">Criado em</TableCell>
                <TableCell align="center">Assinado em</TableCell>
                <TableCell align="center">Situação</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contratosFiltrados.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Typography fontWeight={600} variant="body2">{c.cliente_nome}</Typography>
                    {c.cliente_documento && (
                      <Typography variant="caption" color="text.secondary">
                        Doc: {c.cliente_documento}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.cliente_whatsapp && (
                      <Typography variant="body2">{c.cliente_whatsapp}</Typography>
                    )}
                    {c.cliente_email && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {c.cliente_email}
                      </Typography>
                    )}
                    {!c.cliente_whatsapp && !c.cliente_email && 'Não informado'}
                  </TableCell>
                  <TableCell align="center">
                    {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell align="center">
                    {c.assinado_em ? new Date(c.assinado_em).toLocaleString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {c.status === 'ASSINADO' ? (
                      <Chip 
                        icon={<CheckCircleIcon />} 
                        label="Assinado" 
                        color="success" 
                        size="small" 
                        sx={{ fontWeight: 'bold' }} 
                      />
                    ) : (
                      <Chip 
                        icon={<AccessTimeIcon />} 
                        label="Pendente" 
                        color="warning" 
                        size="small" 
                        sx={{ fontWeight: 'bold' }} 
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Copiar Link de Assinatura">
                        <IconButton size="small" onClick={() => handleCopiarLink(c.uuid)}>
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Enviar por WhatsApp">
                        <IconButton 
                          size="small" 
                          color="success" 
                          onClick={() => handleEnviarWhatsApp(c)}
                          disabled={!c.cliente_whatsapp}
                        >
                          <SendIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {c.status === 'ASSINADO' && (
                        <Tooltip title="Visualizar Assinatura">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => {
                              setContratoSelecionado(c);
                              setOpenView(true);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Excluir Contrato">
                        <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {contratosFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    Nenhum contrato localizado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Novo Contrato de Responsabilidade</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nome do Cliente *"
                fullWidth
                size="small"
                value={novoContrato.cliente_nome}
                onChange={(e) => setNovoContrato({ ...novoContrato, cliente_nome: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="CPF ou CNPJ"
                fullWidth
                size="small"
                value={novoContrato.cliente_documento}
                onChange={(e) => setNovoContrato({ ...novoContrato, cliente_documento: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="WhatsApp do Cliente"
                fullWidth
                size="small"
                value={novoContrato.cliente_whatsapp}
                onChange={(e) => setNovoContrato({ ...novoContrato, cliente_whatsapp: e.target.value })}
                placeholder="Ex: 34999999999"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="E-mail do Cliente *"
                fullWidth
                size="small"
                value={novoContrato.cliente_email}
                onChange={(e) => setNovoContrato({ ...novoContrato, cliente_email: e.target.value })}
                placeholder="Ex: cliente@email.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Conteúdo do Contrato/Termo *"
                multiline
                rows={10}
                fullWidth
                value={novoContrato.texto_contrato}
                onChange={(e) => setNovoContrato({ ...novoContrato, texto_contrato: e.target.value })}
                sx={{ fontFamily: 'monospace' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Salvando...' : 'Gerar Contrato'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Visualização de Contrato Assinado</span>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => handlePrint(contratoSelecionado)}>
            Imprimir / Salvar PDF
          </Button>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'grey.100', py: 4 }}>
          {contratoSelecionado && (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 5, 
                mx: 'auto', 
                maxWidth: '800px', 
                boxShadow: 2, 
                bgcolor: '#FFF', 
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight="bold" align="center" sx={{ textTransform: 'uppercase', mb: 3 }}>
                  Termo de Responsabilidade e Prestação de Serviços
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-wrap', 
                    textAlign: 'justify', 
                    fontFamily: 'monospace', 
                    fontSize: '0.85rem', 
                    lineHeight: 1.6,
                    mb: 4 
                  }}
                >
                  {contratoSelecionado.texto_contrato}
                </Typography>
              </Box>

              <Box>
                <Divider sx={{ my: 3 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box 
                      sx={{ 
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2, 
                        bgcolor: '#F8FAFC',
                        p: 3,
                        maxWidth: '500px'
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                        Assinado Eletronicamente por:
                      </Typography>
                      {contratoSelecionado.assinatura_desenho ? (
                        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1.5, mb: 1.5 }}>
                          <img 
                            src={contratoSelecionado.assinatura_desenho} 
                            alt="Assinatura" 
                            style={{ maxHeight: '60px', width: 'auto', display: 'block' }} 
                          />
                        </Box>
                      ) : (
                        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1.5, mb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Assinatura Eletrônica Registrada
                          </Typography>
                        </Box>
                      )}
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Nome:</strong> {contratoSelecionado.assinado_por_nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>CPF/CNPJ:</strong> {contratoSelecionado.assinado_por_cpf}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Data/Hora:</strong> {new Date(contratoSelecionado.assinado_em).toLocaleString('pt-BR')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>IP de Assinatura:</strong> {contratoSelecionado.ip_assinatura}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                          <strong>Autenticidade (UUID):</strong> {contratoSelecionado.uuid}
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenView(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
