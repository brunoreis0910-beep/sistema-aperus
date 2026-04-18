import React, { useState, useRef } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, IconButton,
  Chip, CircularProgress, Alert, Switch, FormControlLabel,
  List, ListItem, ListItemIcon, ListItemText, Divider,
  Tooltip
} from '@mui/material'
import {
  Email as EmailIcon,
  AttachFile as AttachFileIcon,
  Description as XmlIcon,
  PictureAsPdf as PdfIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  UploadFile as UploadIcon
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

/**
 * Dialog reutilizável para envio de e-mail de documentos fiscais (NF-e, CT-e, MDF-e).
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - tipo: 'nfe' | 'cte' | 'mdfe'
 *  - documentoId: number (id_venda, id_cte, id_mdfe)
 *  - numero: string/number (número do documento para exibição)
 *  - chave: string (chave de acesso)
 *  - emailDestinatario: string (pré-preenchido do cadastro do cliente)
 *  - nomeDestinatario: string
 *  - valorTotal: number
 *  - temXml: boolean (se true, permite anexar XML)
 *  - temPdf: boolean (se true, permite anexar PDF/DANFE/DACTE/DAMDFE)
 *  - onSuccess: (msg) => void
 *  - onError: (msg) => void
 */
export default function EmailDocumentoDialog({
  open,
  onClose,
  tipo = 'nfe',
  documentoId,
  numero,
  chave,
  emailDestinatario = '',
  nomeDestinatario = '',
  valorTotal,
  temXml = true,
  temPdf = true,
  onSuccess,
  onError
}) {
  const { axiosInstance } = useAuth()
  const fileInputRef = useRef(null)

  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [anexarXml, setAnexarXml] = useState(true)
  const [anexarPdf, setAnexarPdf] = useState(true)
  const [arquivosExtras, setArquivosExtras] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [alertMsg, setAlertMsg] = useState(null)

  // Labels por tipo
  const labels = {
    nfe:  { tipo: 'NF-e',  pdf: 'DANFE',  cor: '#1a237e' },
    cte:  { tipo: 'CT-e',  pdf: 'DACTE',  cor: '#00695c' },
    mdfe: { tipo: 'MDF-e', pdf: 'DAMDFE', cor: '#e65100' }
  }
  const label = labels[tipo] || labels.nfe

  // Reset ao abrir
  React.useEffect(() => {
    if (open) {
      setEmail(emailDestinatario || '')
      setNome(nomeDestinatario || '')
      setAssunto('')
      setMensagem('')
      setAnexarXml(true)
      setAnexarPdf(true)
      setArquivosExtras([])
      setAlertMsg(null)
    }
  }, [open, emailDestinatario, nomeDestinatario])

  const handleAddFiles = (e) => {
    const files = Array.from(e.target.files)
    setArquivosExtras(prev => [...prev, ...files])
    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveFile = (index) => {
    setArquivosExtras(prev => prev.filter((_, i) => i !== index))
  }

  const handleEnviar = async () => {
    if (!email || !email.includes('@')) {
      setAlertMsg({ type: 'error', msg: 'Informe um e-mail válido.' })
      return
    }

    setEnviando(true)
    setAlertMsg(null)

    try {
      const formData = new FormData()
      formData.append('tipo', tipo)
      formData.append('documento_id', documentoId)
      formData.append('destinatario_email', email)
      formData.append('destinatario_nome', nome)
      if (assunto) formData.append('assunto', assunto)
      if (mensagem) formData.append('mensagem', mensagem)
      formData.append('anexar_xml', anexarXml ? 'true' : 'false')
      formData.append('anexar_pdf', anexarPdf ? 'true' : 'false')

      arquivosExtras.forEach(arq => {
        formData.append('arquivos_extras', arq)
      })

      const res = await axiosInstance.post('/email/enviar-documento/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.success) {
        setAlertMsg({ type: 'success', msg: res.data.message })
        if (onSuccess) onSuccess(res.data.message)
        // Fecha após 1.5s
        setTimeout(() => { onClose() }, 1500)
      } else {
        setAlertMsg({ type: 'error', msg: res.data.message || 'Erro ao enviar' })
        if (onError) onError(res.data.message)
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erro ao enviar e-mail'
      setAlertMsg({ type: 'error', msg })
      if (onError) onError(msg)
    } finally {
      setEnviando(false)
    }
  }

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${label.cor} 0%, ${label.cor}dd 100%)`,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon />
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Enviar {label.tipo} por E-mail
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {label.tipo} Nº {numero || documentoId}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        {alertMsg && (
          <Alert severity={alertMsg.type} sx={{ mb: 2 }} onClose={() => setAlertMsg(null)}>
            {alertMsg.msg}
          </Alert>
        )}

        {/* Destinatário */}
        <TextField
          label="E-mail do Destinatário"
          type="email"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          size="small"
          sx={{ mb: 2 }}
          placeholder="cliente@email.com"
        />

        <TextField
          label="Nome do Destinatário"
          fullWidth
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          size="small"
          sx={{ mb: 2 }}
          placeholder="Nome do cliente"
        />

        {/* Assunto customizado */}
        <TextField
          label="Assunto (opcional)"
          fullWidth
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          size="small"
          sx={{ mb: 2 }}
          placeholder={`${label.tipo} ${numero || ''} - Sua Empresa`}
          helperText="Deixe em branco para usar o assunto padrão"
        />

        {/* Mensagem customizada */}
        <TextField
          label="Mensagem (opcional)"
          fullWidth
          multiline
          rows={3}
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          size="small"
          sx={{ mb: 2 }}
          placeholder="Digite uma mensagem personalizada ou deixe em branco para o padrão"
          helperText="Deixe em branco para usar a mensagem padrão"
        />

        <Divider sx={{ my: 1.5 }} />

        {/* Anexos do Documento */}
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
          Anexos do Documento
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
          {temXml && (
            <FormControlLabel
              control={<Switch checked={anexarXml} onChange={(e) => setAnexarXml(e.target.checked)} size="small" />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <XmlIcon fontSize="small" color="primary" />
                  <Typography variant="body2">XML</Typography>
                </Box>
              }
            />
          )}
          {temPdf && (
            <FormControlLabel
              control={<Switch checked={anexarPdf} onChange={(e) => setAnexarPdf(e.target.checked)} size="small" />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PdfIcon fontSize="small" color="error" />
                  <Typography variant="body2">{label.pdf}</Typography>
                </Box>
              }
            />
          )}
        </Box>

        {/* Chave de acesso */}
        {chave && (
          <Box sx={{ mb: 1.5, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Chave de Acesso:</strong> {chave}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Arquivos extras */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Anexos Adicionais
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ textTransform: 'none' }}
          >
            Anexar Arquivo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={handleAddFiles}
          />
        </Box>

        {arquivosExtras.length > 0 ? (
          <List dense sx={{ bgcolor: '#fafafa', borderRadius: 1, border: '1px solid #e0e0e0' }}>
            {arquivosExtras.map((arq, idx) => (
              <ListItem
                key={idx}
                secondaryAction={
                  <Tooltip title="Remover">
                    <IconButton edge="end" size="small" onClick={() => handleRemoveFile(idx)}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <AttachFileIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={arq.name}
                  secondary={formatBytes(arq.size)}
                  primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', py: 1 }}>
            Nenhum arquivo extra anexado
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={enviando} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleEnviar}
          disabled={enviando || !email}
          startIcon={enviando ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
          sx={{ 
            textTransform: 'none',
            bgcolor: label.cor,
            '&:hover': { bgcolor: label.cor + 'cc' }
          }}
        >
          {enviando ? 'Enviando...' : 'Enviar E-mail'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
