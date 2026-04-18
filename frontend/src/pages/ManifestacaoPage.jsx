import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Tooltip, Grid,
  Alert, AlertTitle, Divider, FormControl, InputLabel, Select, MenuItem,
  Tabs, Tab, Badge, InputAdornment
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HelpOutline as HelpIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Send as SendIcon,
  CloudSync as CloudSyncIcon
} from '@mui/icons-material'
import api from '../services/api'

// ─── Constantes ──────────────────────────────────────────────────────────────

const TIPOS_EVENTO = {
  '210210': { label: 'Ciência da Operação',        color: 'info',    icon: <HelpIcon fontSize="small" /> },
  '210200': { label: 'Confirmação da Operação',    color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  '210240': { label: 'Desconhecimento da Operação',color: 'warning', icon: <HelpIcon fontSize="small" /> },
  '210220': { label: 'Operação não Realizada',     color: 'error',   icon: <BlockIcon fontSize="small" /> },
}

const STATUS_COLORS = {
  PENDENTE:   'default',
  AUTORIZADO: 'success',
  REJEITADO:  'error',
  ERRO:       'warning',
}

// ─── Formatadores ────────────────────────────────────────────────────────────

const fmtCNPJ = (v = '') =>
  v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')

const fmtMoeda = (v) =>
  v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtData = (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '—'

const fmtChave = (chave = '') =>
  chave.length === 44
    ? `${chave.slice(0, 8)}...${chave.slice(-8)}`
    : chave

// ─── Chip de tipo de evento ──────────────────────────────────────────────────

function TipoEventoChip({ tipo }) {
  const cfg = TIPOS_EVENTO[tipo] || { label: tipo, color: 'default', icon: null }
  return (
    <Chip
      size="small"
      color={cfg.color}
      icon={cfg.icon}
      label={cfg.label}
      sx={{ fontSize: '0.7rem' }}
    />
  )
}

// ─── Tab Panel ───────────────────────────────────────────────────────────────

function TabPanel({ children, value, index }) {
  return value === index ? <Box pt={2}>{children}</Box> : null
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ManifestacaoPage() {
  const [tab, setTab] = useState(0)

  // ── Estado: NF-es recebidas (DistDFe) ─────────────────────────
  const [nfesRecebidas, setNfesRecebidas]   = useState([])
  const [consultando, setConsultando]       = useState(false)
  const [ultNSU, setUltNSU]                 = useState('000000000000000')
  const [maxNSU, setMaxNSU]                 = useState('000000000000000')
  const [consultaMsg, setConsultaMsg]       = useState(null) // { tipo: 'success'|'error', texto }

  // ── Estado: Histórico ─────────────────────────────────────────
  const [historico, setHistorico]           = useState([])
  const [carregandoHist, setCarregandoHist] = useState(false)
  const [filtroTipo, setFiltroTipo]         = useState('')
  const [filtroStatus, setFiltroStatus]     = useState('')
  const [filtroTexto, setFiltroTexto]       = useState('')

  // ── Estado: Dialog de manifestação ───────────────────────────
  const [dialogAberto, setDialogAberto]     = useState(false)
  const [nfeParaManif, setNfeParaManif]     = useState(null)  // { chave_nfe, ... }
  const [tipoSelecionado, setTipoSelecionado] = useState('')
  const [justificativa, setJustificativa]   = useState('')
  const [enviando, setEnviando]             = useState(false)
  const [resultadoEnvio, setResultadoEnvio] = useState(null) // { sucesso, c_stat, x_motivo }

  // ── Estado: Dialog de XML ─────────────────────────────────────
  const [xmlDialog, setXmlDialog]           = useState({ aberto: false, titulo: '', conteudo: '' })

  // ─── Buscar histórico ───────────────────────────────────────────────────────

  const buscarHistorico = useCallback(async () => {
    setCarregandoHist(true)
    try {
      const params = {}
      if (filtroTipo)   params.tipo_evento = filtroTipo
      if (filtroStatus) params.status = filtroStatus
      if (filtroTexto)  params.q = filtroTexto
      const resp = await api.get('/api/manifestacao/', { params })
      const data = resp.data
      setHistorico(Array.isArray(data) ? data : (data?.results ?? []))
    } catch (err) {
      console.error('Erro ao buscar histórico:', err)
    } finally {
      setCarregandoHist(false)
    }
  }, [filtroTipo, filtroStatus, filtroTexto])

  useEffect(() => {
    buscarHistorico()
  }, [buscarHistorico])

  // ─── Consultar NF-es recebidas ──────────────────────────────────────────────

  const consultarNFes = async (nsuInicial = '000000000000000') => {
    setConsultando(true)
    setConsultaMsg(null)
    try {
      const resp = await api.post('/api/manifestacao/consultar-nfes/', { ult_nsu: nsuInicial })
      const data = resp.data
      if (data.sucesso) {
        const nfes = Array.isArray(data.nfes) ? data.nfes : []
        setNfesRecebidas(prev => nsuInicial === '000000000000000' ? nfes : [...prev, ...nfes])
        setUltNSU(data.ult_nsu)
        setMaxNSU(data.max_nsu)
        setConsultaMsg({
          tipo: 'success',
          texto: `${nfes.length} NF-e(s) recebida(s). NSU: ${data.ult_nsu}`
        })
      } else {
        const cStat = data.c_stat || data.cStat || ''
        const xMotivo = data.x_motivo || data.xMotivo || data.erro || data.detail
          || (cStat ? `Código SEFAZ: ${cStat}` : 'Não foi possível obter resposta da SEFAZ. Verifique o certificado digital e a conexão.')
        setConsultaMsg({
          tipo: cStat === '137' || cStat === '138' ? 'info' : 'error',
          texto: cStat ? `[${cStat}] ${xMotivo}` : xMotivo
        })
      }
    } catch (err) {
      setConsultaMsg({ tipo: 'error', texto: 'Erro ao consultar SEFAZ: ' + (err?.response?.data?.erro || err.message) })
    } finally {
      setConsultando(false)
    }
  }

  // ─── Abrir dialog de manifestação ──────────────────────────────────────────

  const abrirManifestacao = (nfe) => {
    setNfeParaManif(nfe)
    setTipoSelecionado('')
    setJustificativa('')
    setResultadoEnvio(null)
    setDialogAberto(true)
  }

  const fecharDialog = () => {
    if (enviando) return
    setDialogAberto(false)
    setNfeParaManif(null)
    setResultadoEnvio(null)
  }

  // ─── Enviar manifestação ──────────────────────────────────────────────────

  const enviarManifestacao = async () => {
    if (!tipoSelecionado) return
    if (tipoSelecionado === '210220' && justificativa.length < 15) return

    setEnviando(true)
    setResultadoEnvio(null)
    try {
      const resp = await api.post('/api/manifestacao/manifestar/', {
        chave_nfe: nfeParaManif.chave_nfe,
        tipo_evento: tipoSelecionado,
        justificativa: justificativa || undefined,
      })
      setResultadoEnvio(resp.data)
      if (resp.data.sucesso) {
        // Marca a NF-e como manifestada na lista local
        setNfesRecebidas(prev =>
          prev.map(n =>
            n.chave_nfe === nfeParaManif.chave_nfe
              ? { ...n, _manifestado: tipoSelecionado }
              : n
          )
        )
        // Recarrega histórico
        buscarHistorico()
      }
    } catch (err) {
      setResultadoEnvio({
        sucesso: false,
        x_motivo: err?.response?.data?.erro || err.message,
      })
    } finally {
      setEnviando(false)
    }
  }

  // ─── Visualizar XML ───────────────────────────────────────────────────────

  const verXML = async (id_manifestacao) => {
    try {
      const resp = await api.get(`/api/manifestacao/${id_manifestacao}/`)
      setXmlDialog({
        aberto: true,
        titulo: `XML — Manifestação #${id_manifestacao}`,
        conteudo: resp.data.xml_evento || '(vazio)',
        xml_retorno: resp.data.xml_retorno || '',
      })
    } catch (err) {
      console.error(err)
    }
  }

  // ─── render NF-es recebidas ───────────────────────────────────────────────

  const renderNFesRecebidas = () => (
    <Box>
      <Box display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
        <Button
          variant="contained"
          startIcon={consultando ? <CircularProgress size={16} color="inherit" /> : <CloudSyncIcon />}
          onClick={() => consultarNFes('000000000000000')}
          disabled={consultando}
        >
          Consultar SEFAZ
        </Button>
        {ultNSU !== '000000000000000' && ultNSU !== maxNSU && (
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => consultarNFes(ultNSU)}
            disabled={consultando}
          >
            Carregar mais (NSU {ultNSU})
          </Button>
        )}
        {(ultNSU !== '000000000000000') && (
          <Typography variant="caption" color="text.secondary">
            Último NSU: <b>{ultNSU}</b> / Máx: <b>{maxNSU}</b>
          </Typography>
        )}
      </Box>

      {consultaMsg && (
        <Alert severity={consultaMsg.tipo} sx={{ mb: 2 }} onClose={() => setConsultaMsg(null)}>
          {consultaMsg.texto}
        </Alert>
      )}

      {nfesRecebidas.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CloudSyncIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">
            Clique em "Consultar SEFAZ" para buscar NF-es recebidas.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Emitente</TableCell>
                <TableCell>CNPJ Emit.</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Emissão</TableCell>
                <TableCell>Chave NF-e</TableCell>
                <TableCell>Situação</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nfesRecebidas.map((nf, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{nf.emitente_nome || '—'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {nf.emitente_cnpj ? fmtCNPJ(nf.emitente_cnpj) : '—'}
                  </TableCell>
                  <TableCell align="right">{fmtMoeda(nf.valor_nfe)}</TableCell>
                  <TableCell>{fmtData(nf.data_emissao)}</TableCell>
                  <TableCell>
                    <Tooltip title={nf.chave_nfe}>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {fmtChave(nf.chave_nfe)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {nf._manifestado
                      ? <TipoEventoChip tipo={nf._manifestado} />
                      : <Chip label="Pendente" size="small" color="default" />
                    }
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Manifestar">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => abrirManifestacao(nf)}
                        disabled={!!nf._manifestado}
                      >
                        <SendIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )

  // ─── render Histórico ─────────────────────────────────────────────────────

  const renderHistorico = () => (
    <Box>
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={0} variant="outlined">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Evento</InputLabel>
              <Select value={filtroTipo} label="Tipo de Evento" onChange={e => setFiltroTipo(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(TIPOS_EVENTO).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={filtroStatus} label="Status" onChange={e => setFiltroStatus(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="AUTORIZADO">Autorizado</MenuItem>
                <MenuItem value="REJEITADO">Rejeitado</MenuItem>
                <MenuItem value="ERRO">Erro</MenuItem>
                <MenuItem value="PENDENTE">Pendente</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={5} md={4}>
            <TextField
              fullWidth size="small" label="Buscar emitente / chave"
              value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={3}>
            <Button
              fullWidth variant="outlined" startIcon={<RefreshIcon />}
              onClick={buscarHistorico} disabled={carregandoHist}
            >
              {carregandoHist ? 'Carregando...' : 'Atualizar'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {carregandoHist ? (
        <Box textAlign="center" py={4}><CircularProgress /></Box>
      ) : historico.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }} elevation={0} variant="outlined">
          <Typography color="text.secondary">Nenhuma manifestação registrada.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>#</TableCell>
                <TableCell>Emitente</TableCell>
                <TableCell>Chave NF-e</TableCell>
                <TableCell>Evento</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Protocolo</TableCell>
                <TableCell>C. Stat</TableCell>
                <TableCell>Data</TableCell>
                <TableCell align="center">XML</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historico.map(m => (
                <TableRow key={m.id_manifestacao} hover>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{m.id_manifestacao}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{m.emitente_nome || '—'}</Typography>
                    {m.emitente_cnpj && (
                      <Typography variant="caption" color="text.secondary">{fmtCNPJ(m.emitente_cnpj)}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={m.chave_nfe}>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {fmtChave(m.chave_nfe)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell><TipoEventoChip tipo={m.tipo_evento} /></TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={m.status}
                      color={STATUS_COLORS[m.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {m.protocolo || '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    <Tooltip title={m.x_motivo || ''}>
                      <span>{m.c_stat || '—'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{fmtData(m.criado_em)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver XML">
                      <IconButton size="small" onClick={() => verXML(m.id_manifestacao)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )

  // ─── render principal ────────────────────────────────────────────────────

  return (
    <Box p={3}>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={600}>Manifestação do Destinatário</Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie os eventos de manifestação das NF-es recebidas junto ao SEFAZ.
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} variant="outlined" sx={{ mb: 0 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab
            label={
              <Badge badgeContent={nfesRecebidas.filter(n => !n._manifestado).length || null} color="primary">
                NF-es Recebidas
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={historico.length || null} color="secondary" max={999}>
                Histórico
              </Badge>
            }
          />
        </Tabs>

        <Box p={2}>
          <TabPanel value={tab} index={0}>{renderNFesRecebidas()}</TabPanel>
          <TabPanel value={tab} index={1}>{renderHistorico()}</TabPanel>
        </Box>
      </Paper>

      {/* ── Dialog: Enviar manifestação ────────────────────────────────── */}
      <Dialog open={dialogAberto} onClose={fecharDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Manifestar Destinatário</DialogTitle>
        <DialogContent>
          {nfeParaManif && (
            <Box mb={2}>
              <Typography variant="subtitle2">NF-e</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {nfeParaManif.chave_nfe}
              </Typography>
              {nfeParaManif.emitente_nome && (
                <Typography variant="caption" color="text.secondary">
                  Emitente: {nfeParaManif.emitente_nome}
                  {nfeParaManif.emitente_cnpj ? ` — ${fmtCNPJ(nfeParaManif.emitente_cnpj)}` : ''}
                </Typography>
              )}
              <Divider sx={{ my: 1.5 }} />
            </Box>
          )}

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Tipo de Manifestação *</InputLabel>
            <Select
              value={tipoSelecionado}
              label="Tipo de Manifestação *"
              onChange={e => { setTipoSelecionado(e.target.value); setJustificativa('') }}
              disabled={enviando || !!resultadoEnvio?.sucesso}
            >
              {Object.entries(TIPOS_EVENTO).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {v.icon}
                    <Box>
                      <Typography variant="body2">{v.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{k}</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {tipoSelecionado === '210220' && (
            <TextField
              fullWidth multiline minRows={3} label="Justificativa *"
              helperText={`Mínimo 15 caracteres. ${justificativa.length} digitados.`}
              value={justificativa}
              onChange={e => setJustificativa(e.target.value)}
              error={justificativa.length > 0 && justificativa.length < 15}
              disabled={enviando || !!resultadoEnvio?.sucesso}
              sx={{ mb: 1 }}
            />
          )}

          {/* Resultado do envio */}
          {resultadoEnvio && (
            <Alert
              severity={resultadoEnvio.sucesso ? 'success' : 'error'}
              sx={{ mt: 1 }}
            >
              <AlertTitle>{resultadoEnvio.sucesso ? 'Manifestação autorizada!' : 'Falha no envio'}</AlertTitle>
              {resultadoEnvio.c_stat && <><b>cStat:</b> {resultadoEnvio.c_stat} — </>}
              {resultadoEnvio.x_motivo}
              {resultadoEnvio.protocolo && (
                <><br /><b>Protocolo:</b> {resultadoEnvio.protocolo}</>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharDialog} disabled={enviando}>
            {resultadoEnvio?.sucesso ? 'Fechar' : 'Cancelar'}
          </Button>
          {!resultadoEnvio?.sucesso && (
            <Button
              variant="contained"
              startIcon={enviando ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              onClick={enviarManifestacao}
              disabled={
                enviando ||
                !tipoSelecionado ||
                (tipoSelecionado === '210220' && justificativa.length < 15)
              }
            >
              {enviando ? 'Enviando...' : 'Enviar ao SEFAZ'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Visualizar XML ─────────────────────────────────────── */}
      <Dialog
        open={xmlDialog.aberto}
        onClose={() => setXmlDialog({ aberto: false, titulo: '', conteudo: '' })}
        maxWidth="md" fullWidth
      >
        <DialogTitle>{xmlDialog.titulo}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" mb={0.5}>XML do Evento</Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: 'grey.900', color: 'grey.100', p: 2, borderRadius: 1,
              overflow: 'auto', fontSize: '0.72rem', maxHeight: 300, whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}
          >
            {xmlDialog.conteudo}
          </Box>
          {xmlDialog.xml_retorno && (
            <>
              <Typography variant="subtitle2" mt={2} mb={0.5}>XML de Retorno</Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: 'grey.900', color: 'grey.100', p: 2, borderRadius: 1,
                  overflow: 'auto', fontSize: '0.72rem', maxHeight: 300, whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}
              >
                {xmlDialog.xml_retorno}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setXmlDialog({ aberto: false, titulo: '', conteudo: '' })}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
