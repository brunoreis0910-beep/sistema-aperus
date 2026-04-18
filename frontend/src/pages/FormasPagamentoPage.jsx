import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  Chip
} from '@mui/material'
import { Save as SaveIcon, Payment as PaymentIcon } from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'

function FormaPagamentoRow({ forma, onSave }) {
  const [taxa, setTaxa] = useState(forma.taxa_operadora || '0.00')
  const [dias, setDias] = useState(forma.dias_repasse || 1)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(forma.id_forma_pagamento, {
        taxa_operadora: parseFloat(taxa),
        dias_repasse: parseInt(dias)
      })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = 
    parseFloat(taxa) !== parseFloat(forma.taxa_operadora || 0) ||
    parseInt(dias) !== parseInt(forma.dias_repasse || 1)

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentIcon color="primary" />
          <Typography variant="body1" fontWeight={500}>
            {forma.nome_forma}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Chip 
          label={forma.codigo_t_pag || '99'} 
          size="small" 
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <TextField
          type="number"
          value={taxa}
          onChange={(e) => setTaxa(e.target.value)}
          size="small"
          inputProps={{ min: 0, max: 99.99, step: 0.01 }}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>
          }}
          sx={{ width: 120 }}
        />
      </TableCell>
      <TableCell>
        <TextField
          type="number"
          value={dias}
          onChange={(e) => setDias(e.target.value)}
          size="small"
          inputProps={{ min: 0, max: 365 }}
          InputProps={{
            startAdornment: <InputAdornment position="start">D+</InputAdornment>
          }}
          sx={{ width: 100 }}
        />
      </TableCell>
      <TableCell>
        {taxa > 0 ? (
          <Chip label="Gera Recebível" color="success" size="small" />
        ) : (
          <Chip label="Não Gera" color="default" size="small" variant="outlined" />
        )}
      </TableCell>
      <TableCell align="center">
        <Tooltip title={hasChanges ? "Salvar alterações" : "Sem alterações"}>
          <span>
            <IconButton
              color="primary"
              onClick={handleSave}
              disabled={!hasChanges || saving}
              size="small"
            >
              {saving ? <CircularProgress size={20} /> : <SaveIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}

export default function FormasPagamentoPage() {
  const { axiosInstance } = useAuth()
  const [formas, setFormas] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    buscarFormas()
  }, [])

  const buscarFormas = async () => {
    try {
      setLoading(true)
      setErro('')
      const r = await axiosInstance.get('/formas_pagamento/')
      
      let dados = []
      if (Array.isArray(r.data)) {
        dados = r.data
      } else if (r.data?.results) {
        dados = r.data.results
      }
      
      setFormas(dados)
    } catch (err) {
      console.error('Erro ao buscar formas:', err)
      setErro('Erro ao carregar formas de pagamento')
    } finally {
      setLoading(false)
    }
  }

  const handleSalvarForma = async (id, dados) => {
    try {
      setErro('')
      setSucesso('')
      
      await axiosInstance.patch(`/formas_pagamento/${id}/`, dados)
      
      setSucesso('Taxa atualizada com sucesso!')
      setTimeout(() => setSucesso(''), 3000)
      
      // Atualiza a lista
      await buscarFormas()
    } catch (err) {
      console.error('Erro ao salvar:', err)
      setErro('Erro ao salvar as alterações')
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <PaymentIcon color="primary" fontSize="large" />
            Formas de Pagamento - Taxas de Cartão
          </Typography>

          {erro && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
              {erro}
            </Alert>
          )}

          {sucesso && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSucesso('')}>
              {sucesso}
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={500} gutterBottom>
              ℹ️ Configure as taxas das operadoras de cartão:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li>
                <strong>Taxa Operadora (%)</strong>: Percentual cobrado (ex: 1.5% para débito, 3.5% para crédito)
              </li>
              <li>
                <strong>Dias Repasse (D+X)</strong>: Prazo para receber (ex: D+1 = amanhã, D+30 = 30 dias)
              </li>
              <li>
                <strong>Recebível</strong>: Se taxa {'>'} 0, o sistema gera automaticamente recebíveis de cartão
              </li>
            </ul>
          </Alert>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Forma de Pagamento</strong></TableCell>
                  <TableCell><strong>Código SEFAZ</strong></TableCell>
                  <TableCell><strong>Taxa Operadora</strong></TableCell>
                  <TableCell><strong>Dias Repasse</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="center"><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        Nenhuma forma de pagamento cadastrada
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  formas.map(forma => (
                    <FormaPagamentoRow
                      key={forma.id_forma_pagamento}
                      forma={forma}
                      onSave={handleSalvarForma}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}
