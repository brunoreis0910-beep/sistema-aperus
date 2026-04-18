import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent, Button, TextField, MenuItem,
  Stack, CircularProgress, Alert, Paper, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Grid, FormControl, InputLabel, Select, Autocomplete,
  Stepper, Step, StepLabel,
} from '@mui/material'
import {
  Add as AddIcon, Refresh as RefreshIcon, Search as SearchIcon,
  CheckCircle as AprIcon, Cancel as CancelIcon, LockClock as EncerrarIcon,
  Visibility as ViewIcon, LocalShipping as MDFeIcon, Delete as DeleteIcon,
  Print as PrintIcon, Send as SendIcon, WhatsApp as WhatsAppIcon,
  NavigateNext as NextIcon, NavigateBefore as BackIcon,
  LocalShipping, AltRoute as RouteIcon, Edit as EditIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/common/Toast'
import VeiculoDialog from '../components/VeiculoDialog'
import { buscarCEP, formatCEP } from '../utils/cnpjCepUtils'
import EmailDocumentoDialog from '../components/EmailDocumentoDialog'

const hoje = new Date()

const STATUS_COLORS = {
  'Autorizado': 'success',
  'AUTORIZADO': 'success',
  'Encerrado': 'info',
  'ENCERRADO': 'info',
  'Cancelado': 'error',
  'CANCELADO': 'error',
  'Pendente': 'warning',
  'PENDENTE': 'warning',
  'Rejeitado': 'error',
  'REJEITADO': 'error',
  'Erro': 'error',
  'ERRO': 'error',
  'Emitido': 'success',
  'EMITIDO': 'success',
}

const MESES = [
  {v:'',l:'Todos os meses'},
  {v:1,l:'Janeiro'},{v:2,l:'Fevereiro'},{v:3,l:'Março'},{v:4,l:'Abril'},
  {v:5,l:'Maio'},{v:6,l:'Junho'},{v:7,l:'Julho'},{v:8,l:'Agosto'},
  {v:9,l:'Setembro'},{v:10,l:'Outubro'},{v:11,l:'Novembro'},{v:12,l:'Dezembro'},
]

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function MDFePage() {
  const { axiosInstance } = useAuth()
  const { showToast } = useToast()
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)

  // Log para debug
  console.log('🚛 MDFePage montada!', { axiosInstance: !!axiosInstance })
  const [mes, setMes] = useState('')
  const [ano, setAno] = useState(hoje.getFullYear())
  const [filtroStatus, setFiltroStatus] = useState('')
  const [detalhe, setDetalhe] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [veiculosDisponiveis, setVeiculosDisponiveis] = useState([])
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null)
  const [buscandoVeiculos, setBuscandoVeiculos] = useState(false)
  
  // Estados para edição de veículo incompleto
  const [veiculoIncompleto, setVeiculoIncompleto] = useState(null)
  const [dialogVeiculoIncompleto, setDialogVeiculoIncompleto] = useState(false)
  const [dialogEditarVeiculo, setDialogEditarVeiculo] = useState(false)
  
  // Estados do formulário MDF-e
  const [form, setForm] = useState({
    carregamento_cep: '',
    carregamento_nome: '',
    carregamento_ibge: '',
    descarga_cep: '',
    descarga_nome: '',
    descarga_ibge: '',
    uf_inicio: '',
    uf_fim: '',
    placa_veiculo: '',
    uf_veiculo: '',
    condutor_nome: '',
    condutor_cpf: '',
    modal: '1', // 1=Rodoviário
    tipo_emissao: '1', // 1=Normal, 2=Contingência
    tipo_emitente: '1', // 1=Prestador de serviço, 2=Carga própria
    veiculo_tipo_rodado: '03', // 03=Cavalo Mecânico
    veiculo_tipo_carroceria: '02', // 02=Fechada/Baú
    veiculo_tipo_proprietario: '1', // 1=TAC Independente
    veiculo_tara_kg: '',
    veiculo_capacidade_kg: '',
    data_saida: new Date().toISOString().split('T')[0],
    hora_saida: new Date().toTimeString().slice(0, 5),
    rntrc_prestador: '',
    contratante_rntrc: '',
    contratante_cnpj: '',
    responsavel_seguro_cpf_cnpj: '',
    tipo_carga: '05', // 05=Carga geral
    produto_ncm: '',
    averbacao: '',
    tomador_servico: '',
    tomador_ind_ie: '',
    tomador_cpf_cnpj: '',
    tomador_nome: '',
    percursos: [],
    documentos: [],
  })
  
  const [percursoUF, setPercursoUF] = useState('')
  const [docsSelecionados, setDocsSelecionados] = useState([])
  const [docsDisponiveis, setDocsDisponiveis] = useState([])
  const [dialogRotas, setDialogRotas] = useState(false)
  const [rotasDisponiveis, setRotasDisponiveis] = useState([])
  
  // Estados para cancelamento de MDF-e
  const [dialogCancelar, setDialogCancelar] = useState(false)
  const [mdfeCancelar, setMdfeCancelar] = useState(null)
  const [justificativaCancelamento, setJustificativaCancelamento] = useState('')
  const [emailDialog, setEmailDialog] = useState({ open: false, mdfe: null })

  const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

  // Mapeamento de código IBGE (2 primeiros dígitos) para UF
  const IBGE_PARA_UF = {
    '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
    '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
    '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
    '41': 'PR', '42': 'SC', '43': 'RS',
    '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF'
  }

  // Função para obter UF a partir do código IBGE
  const getUfFromIbge = (ibge) => {
    if (!ibge || ibge.length < 2) return null
    const codigoEstado = ibge.substring(0, 2)
    return IBGE_PARA_UF[codigoEstado] || null
  }

  const ETAPAS_MDFE = ['Rota e Data', 'Veículo e Condutor', 'Informações Complementares', 'Documentos']

  // Grafo de fronteiras entre estados brasileiros (vizinhos diretos)
  const FRONTEIRAS_ESTADOS = {
    'AC': ['AM', 'RO'],
    'AL': ['BA', 'PE', 'SE'],
    'AP': ['PA'],
    'AM': ['AC', 'RO', 'RR', 'PA', 'MT'],
    'BA': ['AL', 'SE', 'PE', 'PI', 'TO', 'GO', 'MG', 'ES'],
    'CE': ['PI', 'RN', 'PB', 'PE'],
    'DF': ['GO'],
    'ES': ['BA', 'MG', 'RJ'],
    'GO': ['DF', 'TO', 'BA', 'MG', 'MS', 'MT'],
    'MA': ['PI', 'TO', 'PA'],
    'MT': ['AM', 'PA', 'TO', 'GO', 'MS', 'RO'],
    'MS': ['MT', 'GO', 'MG', 'SP', 'PR'],
    'MG': ['BA', 'ES', 'RJ', 'SP', 'MS', 'GO'],
    'PA': ['AM', 'RR', 'AP', 'MA', 'TO', 'MT'],
    'PB': ['RN', 'CE', 'PE'],
    'PR': ['SP', 'MS', 'SC'],
    'PE': ['CE', 'PB', 'RN', 'AL', 'BA', 'PI'],
    'PI': ['CE', 'PE', 'BA', 'TO', 'MA'],
    'RJ': ['ES', 'MG', 'SP'],
    'RN': ['CE', 'PB', 'PE'],
    'RS': ['SC'],
    'RO': ['AC', 'AM', 'MT'],
    'RR': ['AM', 'PA'],
    'SC': ['PR', 'RS'],
    'SP': ['MG', 'RJ', 'MS', 'PR'],
    'SE': ['AL', 'BA'],
    'TO': ['MA', 'PI', 'BA', 'GO', 'MT', 'PA']
  }

  const carregarVeiculos = async () => {
    setBuscandoVeiculos(true)
    try {
      // Usa o mesmo endpoint padrão que VeiculosPage.jsx e outras páginas
      const r = await axiosInstance.get('veiculos/')
      // Filtra apenas veículos ativos
      const veiculosAtivos = (r.data || []).filter(v => v.ativo !== false)
      setVeiculosDisponiveis(veiculosAtivos)
      return veiculosAtivos
    } catch (e) {
      console.error('Erro ao carregar veículos:', e)
      setErro('Erro ao carregar veículos: ' + (e.response?.data?.detail || e.message))
      return []
    } finally {
      setBuscandoVeiculos(false)
    }
  }

  // Valida se o veículo tem todos os campos obrigatórios para MDF-e
  const validarVeiculoCompleto = (veiculo) => {
    if (!veiculo) return true
    
    const camposObrigatorios = [
      { campo: 'tipo_rodado', nome: 'Tipo de Rodado' },
      { campo: 'tipo_carroceria', nome: 'Tipo de Carroceria' },
      { campo: 'tara_kg', nome: 'Tara (kg)' },
      { campo: 'capacidade_kg', nome: 'Capacidade (kg)' },
      { campo: 'tipo_propriedade', nome: 'Tipo de Propriedade' }
    ]
    
    const camposFaltantes = camposObrigatorios.filter(
      campo => !veiculo[campo.campo] && veiculo[campo.campo] !== 0
    )
    
    return camposFaltantes.length === 0
  }

  // Callback quando veículo é atualizado com sucesso
  const handleVeiculoAtualizado = async () => {
    const veiculoId = veiculoIncompleto?.id
    setDialogEditarVeiculo(false)
    setVeiculoIncompleto(null)
    
    // Recarrega lista de veículos e obtém a lista atualizada
    const veiculosAtualizados = await carregarVeiculos()
    
    // Busca o veículo atualizado na lista
    if (veiculoId && veiculosAtualizados) {
      const veiculoAtualizado = veiculosAtualizados.find(v => v.id === veiculoId)
      if (veiculoAtualizado && validarVeiculoCompleto(veiculoAtualizado)) {
        setVeiculoSelecionado(veiculoAtualizado)
        setForm(prev => ({
          ...prev,
          placa_veiculo: veiculoAtualizado.placa,
          uf_veiculo: veiculoAtualizado.uf,
          veiculo_tipo_rodado: veiculoAtualizado.tipo_rodado || '03',
          veiculo_tipo_carroceria: veiculoAtualizado.tipo_carroceria || '02',
          veiculo_tipo_proprietario: veiculoAtualizado.tipo_propriedade || '1',
          veiculo_tara_kg: veiculoAtualizado.tara_kg || '',
          veiculo_capacidade_kg: veiculoAtualizado.capacidade_kg || '',
        }))
      }
    }
  }

  const buscar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const params = {}
      if (mes) params.mes = mes
      if (ano) params.ano = ano
      if (filtroStatus) params.status = filtroStatus
      // FIX: Removido /api prefixo pois axiosInstance já tem baseURL configurada
      const r = await axiosInstance.get('/mdfe/', { params })
      const data = r.data
      console.log('📦 Lista MDF-e:', data)
      setLista(Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [])
    } catch (e) {
      if (e.response?.status === 404) {
        setErro('Módulo MDF-e ainda não configurado no servidor. Contate o suporte.')
      } else {
        setErro('Erro ao carregar MDF-e: ' + (e.response?.data?.detail || e.message))
      }
      setLista([])
    } finally {
      setLoading(false)
    }
  }, [mes, ano, filtroStatus, axiosInstance])

  useEffect(() => { 
    console.log('🚀 MDFePage useEffect executou! Buscando MDF-e...')
    buscar() 
  }, [buscar])

  const abrirModal = async () => {
    setModalOpen(true)
    setActiveStep(0)
    setVeiculoSelecionado(null)
    setForm({
      carregamento_cep: '',
      carregamento_nome: '',
      carregamento_ibge: '',
      descarga_cep: '',
      descarga_nome: '',
      descarga_ibge: '',
      uf_inicio: '',
      uf_fim: '',
      placa_veiculo: '',
      uf_veiculo: '',
      condutor_nome: '',
      condutor_cpf: '',
      modal: '1',
      tipo_emissao: '1',
      tipo_emitente: '1',
      veiculo_tipo_rodado: '03',
      veiculo_tipo_carroceria: '02',
      veiculo_tipo_proprietario: '1',
      veiculo_tara_kg: '',
      veiculo_capacidade_kg: '',
      data_saida: new Date().toISOString().split('T')[0],
      hora_saida: new Date().toTimeString().slice(0, 5),
      rntrc_prestador: '',
      contratante_rntrc: '',
      contratante_cnpj: '',
      responsavel_seguro_cpf_cnpj: '',
      tipo_carga: '05',
      produto_ncm: '',
      averbacao: '',
      tomador_servico: '',
      tomador_ind_ie: '',
      tomador_cpf_cnpj: '',
      tomador_nome: '',
      percursos: [],
      documentos: [],
    })
    setPercursoUF('')
    setDocsSelecionados([])
    
    // Carregar veículos disponíveis
    carregarVeiculos()
    
    // Carregar documentos disponíveis
    try {
      console.log('🔍 Buscando documentos disponíveis...')
      const r = await axiosInstance.get('/mdfe/listar_documentos_disponiveis/')
      console.log('📡 Resposta da API:', r.data)
      const dados = r.data || {}
      
      // Converter CT-es
      const ctes = (dados.ctes || []).map(c => ({
        tipo: 'CT-e',
        chave: c.chave_cte,
        numero: `${c.numero_cte}/${c.serie_cte || '1'}`,
        id: c.id_cte,
        destinatario: c.destinatario__nome_razao_social || 'Sem destinatário',
        valor: c.valor_total_servico,
      }))
      console.log('🚛 CT-e processados:', ctes.length, ctes)
      
      // Converter NF-es
      const nfes = (dados.nfes || []).map(n => ({
        tipo: 'NF-e',
        chave: n.chave_nfe,
        numero: `${n.numero_nfe}/${n.serie_nfe || '1'}`,
        id: n.id_venda,
        destinatario: n.id_cliente__nome_razao_social || 'Sem destinatário',
        valor: n.valor_total,
      }))
      console.log('📄 NF-e processadas:', nfes.length, nfes)
      
      const todosDocumentos = [...ctes, ...nfes]
      console.log('✅ Total de documentos disponíveis:', todosDocumentos.length, todosDocumentos)
      setDocsDisponiveis(todosDocumentos)
    } catch (e) {
      console.error('❌ ERRO ao carregar documentos:', e)
      console.error('Detalhes do erro:', e.response)
      setErro('Erro ao carregar documentos disponíveis: ' + (e.response?.data?.detail || e.message))
    }
  }

  const abrirModalParaEdicao = async (mdfe) => {
    setModalOpen(true)
    setActiveStep(0)
    setErro(null)
    
    // Configura o state form
    setForm({
      id_mdfe: mdfe.id_mdfe,
      carregamento_cep: mdfe.carregamentos?.[0]?.municipio_cep || '',
      carregamento_nome: mdfe.carregamentos?.[0]?.municipio_nome || '',
      carregamento_ibge: mdfe.carregamentos?.[0]?.municipio_codigo_ibge || '',
      descarga_cep: mdfe.descarregamentos?.[0]?.municipio_cep || '',
      descarga_nome: mdfe.descarregamentos?.[0]?.municipio_nome || '',
      descarga_ibge: mdfe.descarregamentos?.[0]?.municipio_codigo_ibge || '',
      uf_inicio: mdfe.uf_inicio || '',
      uf_fim: mdfe.uf_fim || '',
      placa_veiculo: mdfe.placa_veiculo || '',
      uf_veiculo: mdfe.uf_veiculo || '',
      condutor_nome: mdfe.condutor_nome || '',
      condutor_cpf: mdfe.condutor_cpf || '',
      modal: String(mdfe.modal || '1'),
      tipo_emissao: String(mdfe.tipo_emissao || '1'),
      tipo_emitente: String(mdfe.tipo_emitente || '1'),
      veiculo_tipo_rodado: mdfe.veiculo_tipo_rodado || '03',
      veiculo_tipo_carroceria: mdfe.veiculo_tipo_carroceria || '02',
      veiculo_tipo_proprietario: mdfe.veiculo_tipo_proprietario || '1',
      veiculo_tara_kg: mdfe.veiculo_tara_kg || '',
      veiculo_capacidade_kg: mdfe.veiculo_capacidade_kg || '',
      data_saida: mdfe.data_saida ? mdfe.data_saida.split('T')[0] : new Date().toISOString().split('T')[0],
      hora_saida: mdfe.hora_saida ? String(mdfe.hora_saida).substring(0, 5) : new Date().toTimeString().slice(0, 5),
      rntrc_prestador: mdfe.rntrc_prestador || '',
      contratante_rntrc: mdfe.contratante_rntrc || '',
      contratante_cnpj: mdfe.contratante_cnpj || '',
      responsavel_seguro_cpf_cnpj: mdfe.responsavel_seguro_cpf_cnpj || '',
      tipo_carga: mdfe.tipo_carga || '05',
      produto_ncm: mdfe.produto_ncm || '',
      averbacao: mdfe.averbacao || '',
      tomador_servico: String(mdfe.tomador_servico || ''),
      tomador_ind_ie: String(mdfe.tomador_ind_ie || ''),
      tomador_cpf_cnpj: mdfe.tomador_cpf_cnpj || '',
      tomador_nome: mdfe.tomador_nome || '',
      percursos: (mdfe.percursos || []).map(p => p.uf),
      documentos: [],
    })
    setPercursoUF('')
    
    // Carregar veiculos primeiro
    const veics = await carregarVeiculos()
    const found = veics.find(v => v.placa === mdfe.placa_veiculo)
    if (found) setVeiculoSelecionado(found)

    // Docs selecionados
    const docs = (mdfe.documentos_vinculados || []).map(d => ({
      tipo: d.tipo_documento === 'CTE' ? 'CT-e' : 'NF-e',
      chave: d.chave_acesso,
      numero: d.chave_acesso.slice(25, 34),
      valor: d.valor || 0,
      destinatario: '(Documento Vinculado)',
      id: d.id_doc
    }))
    setDocsSelecionados(docs)

    // Carregar disponíveis
    try {
      const r = await axiosInstance.get('/mdfe/listar_documentos_disponiveis/')
      const dados = r.data || {}
      const ctes = (dados.ctes || []).map(c => ({
        tipo: 'CT-e',
        chave: c.chave_cte,
        numero: `${c.numero_cte}/${c.serie_cte || '1'}`,
        id: c.id_cte,
        destinatario: c.destinatario__nome_razao_social || 'Sem destinatário',
        valor: c.valor_total_servico,
      }))
      const nfes = (dados.nfes || []).map(n => ({
        tipo: 'NF-e',
        chave: n.chave_nfe,
        numero: `${n.numero_nfe}/${n.serie_nfe || '1'}`,
        id: n.id_venda,
        destinatario: n.id_cliente__nome_razao_social || 'Sem destinatário',
        valor: n.valor_total,
      }))
      const todosDocumentos = [...ctes, ...nfes]
      setDocsDisponiveis(todosDocumentos)
    } catch (e) {
      console.error('Erro documentos:', e)
    }
  }

  const handleBuscaCepCarregamento = async () => {
    const cep = form.carregamento_cep?.replace(/\D/g, '')
    if (cep && cep.length === 8) {
      try {
        const res = await buscarCEP(cep)
        if (res && !res.erro) {
          setForm(prev => ({
            ...prev,
            carregamento_nome: res.cidade || prev.carregamento_nome,
            carregamento_ibge: res.ibge || prev.carregamento_ibge,
            uf_inicio: res.estado || prev.uf_inicio || ''
          }))
          showToast('Cidade encontrada', 'success')
        }
      } catch (err) {
        showToast('Erro ao buscar CEP', 'error')
      }
    }
  }

  const handleBuscaCepDescarga = async () => {
    const cep = form.descarga_cep?.replace(/\D/g, '')
    if (cep && cep.length === 8) {
      try {
        const res = await buscarCEP(cep)
        if (res && !res.erro) {
          setForm(prev => ({
            ...prev,
            descarga_nome: res.cidade || prev.descarga_nome,
            descarga_ibge: res.ibge || prev.descarga_ibge,
            uf_fim: res.estado || prev.uf_fim || ''
          }))
          showToast('Cidade de descarga encontrada', 'success')
        }
      } catch (err) {
        showToast('Erro ao buscar CEP de descarga', 'error')
      }
    }
  }

  const adicionarPercurso = () => {
    if (percursoUF && !form.percursos.includes(percursoUF)) {
      setForm(prev => ({ ...prev, percursos: [...prev.percursos, percursoUF] }))
      setPercursoUF('')
    }
  }

  const removerPercurso = (uf) => {
    setForm(prev => ({ ...prev, percursos: prev.percursos.filter(u => u !== uf) }))
  }

  // Calcula todas as rotas possíveis entre origem e destino
  const calcularRotasPossiveis = (origem, destino) => {
    if (!origem || !destino || origem === destino) return []
    
    const rotas = []
    const fila = [[origem]] // Fila de caminhos parciais
    const visitados = new Set()
    const maxRotas = 5 // Limita a 5 melhores rotas
    
    while (fila.length > 0 && rotas.length < maxRotas) {
      const caminho = fila.shift()
      const ultimo = caminho[caminho.length - 1]
      
      // Chegou ao destino
      if (ultimo === destino) {
        // Remove origem e destino do percurso (só estados intermediários)
        const percurso = caminho.slice(1, -1)
        rotas.push({
          caminho: caminho,
          percurso: percurso,
          distancia: caminho.length - 1
        })
        continue
      }
      
      // Evita caminhos muito longos (máximo 15 estados)
      if (caminho.length > 15) continue
      
      // Explora vizinhos
      const vizinhos = FRONTEIRAS_ESTADOS[ultimo] || []
      for (const vizinho of vizinhos) {
        // Evita voltar para estados já visitados neste caminho
        if (!caminho.includes(vizinho)) {
          fila.push([...caminho, vizinho])
        }
      }
    }
    
    // Ordena por menor distância
    return rotas.sort((a, b) => a.distancia - b.distancia)
  }

  const abrirCalculadoraRotas = () => {
    if (!form.uf_inicio || !form.uf_fim) {
      showToast('Selecione UF de Início e UF de Fim antes de calcular a rota', 'warning')
      return
    }
    
    if (form.uf_inicio === form.uf_fim) {
      showToast('UF de Início e Fim são iguais. Não há rota intermediária.', 'info')
      return
    }
    
    const rotas = calcularRotasPossiveis(form.uf_inicio, form.uf_fim)
    
    if (rotas.length === 0) {
      showToast('Não foi possível calcular rota entre esses estados', 'error')
      return
    }
    
    setRotasDisponiveis(rotas)
    setDialogRotas(true)
  }

  const selecionarRota = (rota) => {
    setForm(prev => ({ ...prev, percursos: [...rota.percurso] }))
    setDialogRotas(false)
    showToast(`Rota aplicada: ${rota.caminho.join(' → ')}`, 'success')
  }

  // --- AÇÕES DO MDF-e ---
  const emitirMDFe = async (id) => {
    if (!window.confirm('Confirma a emissão deste MDF-e para a SEFAZ?')) return
    setLoading(true)
    setErro(null)
    try {
      const r = await axiosInstance.post(`/mdfe/${id}/emitir/`)
      buscar()
      showToast(`MDF-e #${id} emitido com sucesso! Chave: ${r.data.chave_mdfe || 'Aguardando retorno SEFAZ'}`, 'success')
    } catch (e) {
      console.error('❌ Erro ao emitir MDF-e:', e.response?.data)
      const erro = e.response?.data?.error || e.response?.data?.detail || e.message
      setErro('Erro ao emitir MDF-e: ' + erro)
      showToast('Erro ao emitir MDF-e: ' + erro, 'error')
    } finally {
      setLoading(false)
    }
  }

  const imprimirDAMDFE = async (id) => {
    try {
      setLoading(true)
      const r = await axiosInstance.get(`/mdfe/${id}/imprimir_damdfe/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch (e) {
      setErro('Erro ao gerar DAMDFE: ' + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  const baixarXML = async (id, chave) => {
    try {
      setLoading(true)
      const r = await axiosInstance.get(`/mdfe/${id}/download_xml/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/xml' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${chave || id}-mdfe.xml`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (e) {
      setErro('Erro ao baixar XML: ' + (e.response?.data?.error || e.message))
      showToast('Erro ao baixar XML: ' + (e.response?.data?.error || e.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  const excluirMDFe = async (id) => {
    if (!window.confirm('Tem certeza que deseja EXCLUIR este MDF-e? Esta ação não pode ser desfeita.')) return
    setLoading(true)
    try {
      await axiosInstance.delete(`/mdfe/${id}/`)
      buscar()
      alert('MDF-e excluído com sucesso!')
    } catch (e) {
      setErro('Erro ao excluir: ' + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  const enviarWhatsApp = (mdfe) => {
    const texto = `Olá, segue o DAMDFE do Manifesto ${mdfe.numero_mdfe}.\nChave de Acesso: ${mdfe.chave_mdfe}`
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }

  // Função para encerrar MDF-e
  const encerrarMDFe = async (id) => {
    if (!window.confirm('Tem certeza que deseja ENCERRAR este MDF-e? Após encerrado, não será possível cancelar.')) return
    setLoading(true)
    try {
      await axiosInstance.post(`/mdfe/${id}/encerrar/`)
      showToast('MDF-e encerrado com sucesso!', 'success')
      buscar()
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data?.detail || e.message
      setErro('Erro ao encerrar MDF-e: ' + msg)
      showToast('Erro ao encerrar MDF-e: ' + msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Abrir dialog de cancelamento
  const abrirDialogCancelar = (mdfe) => {
    setMdfeCancelar(mdfe)
    setJustificativaCancelamento('')
    setDialogCancelar(true)
  }

  // Função para cancelar MDF-e
  const cancelarMDFe = async () => {
    if (!mdfeCancelar) return
    if (justificativaCancelamento.length < 15) {
      showToast('A justificativa deve ter pelo menos 15 caracteres', 'warning')
      return
    }
    setLoading(true)
    try {
      await axiosInstance.post(`/mdfe/${mdfeCancelar.id_mdfe}/cancelar/`, {
        justificativa: justificativaCancelamento
      })
      showToast('MDF-e cancelado com sucesso!', 'success')
      setDialogCancelar(false)
      setMdfeCancelar(null)
      setJustificativaCancelamento('')
      buscar()
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data?.detail || e.message
      setErro('Erro ao cancelar MDF-e: ' + msg)
      showToast('Erro ao cancelar MDF-e: ' + msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const salvarMDFe = async () => {
    setSalvando(true)
    setErro(null)
    try {
      // Validações básicas
      if (!form.uf_inicio || !form.uf_fim) {
        setErro('Informe UF de início e fim')
        setSalvando(false)
        return
      }
      if (!form.carregamento_ibge) {
        setErro('Informe o Município de Carregamento buscando pelo CEP')
        setSalvando(false)
        return
      }
      // Validação: UF início deve corresponder ao código IBGE do carregamento
      const ufFromIbge = getUfFromIbge(form.carregamento_ibge)
      if (ufFromIbge && ufFromIbge !== form.uf_inicio) {
        setErro(`A UF de Início (${form.uf_inicio}) não corresponde ao município de carregamento (${form.carregamento_nome}/${ufFromIbge}). Busque outro CEP ou altere a UF de Início.`)
        setSalvando(false)
        return
      }
      if (!form.descarga_ibge) {
        setErro('Informe o Município de Descarga buscando pelo CEP')
        setSalvando(false)
        return
      }
      // Validação: UF fim deve corresponder ao código IBGE da descarga
      const ufFimFromIbge = getUfFromIbge(form.descarga_ibge)
      if (ufFimFromIbge && ufFimFromIbge !== form.uf_fim) {
        setErro(`A UF de Fim (${form.uf_fim}) não corresponde ao município de descarga (${form.descarga_nome}/${ufFimFromIbge}). Busque outro CEP ou altere a UF de Fim.`)
        setSalvando(false)
        return
      }
      if (!form.placa_veiculo || !form.uf_veiculo) {
        setErro('Informe placa e UF do veículo')
        setSalvando(false)
        return
      }
      if (!form.condutor_nome || !form.condutor_cpf) {
        setErro('Informe nome e CPF do condutor')
        setSalvando(false)
        return
      }
      if (docsSelecionados.length === 0) {
        setErro('Selecione pelo menos 1 documento (NF-e ou CT-e)')
        setSalvando(false)
        return
      }
      if (!form.veiculo_tara_kg || !form.veiculo_capacidade_kg) {
        setErro('Informe a tara e capacidade do veículo')
        setSalvando(false)
        return
      }

      // Validações condicionais por tipo de transporte
      if (form.tipo_emitente === '1') {
        // PRESTADOR DE SERVIÇO - campos obrigatórios
        if (!form.rntrc_prestador) {
          setErro('RNTRC do Prestador é obrigatório para Prestador de Serviço de Transporte')
          setSalvando(false)
          return
        }
        if (!form.tomador_servico) {
          setErro('Tomador do Serviço é obrigatório para Prestador de Serviço de Transporte')
          setSalvando(false)
          return
        }
        if (!form.tomador_ind_ie) {
          setErro('Indicador de IE do Tomador é obrigatório para Prestador de Serviço de Transporte')
          setSalvando(false)
          return
        }
        // Se tomador = Outros (4), precisa de CPF/CNPJ e nome
        if (form.tomador_servico === '4') {
          if (!form.tomador_cpf_cnpj) {
            setErro('CPF/CNPJ do Tomador é obrigatório quando Tomador = Outros')
            setSalvando(false)
            return
          }
          if (!form.tomador_nome) {
            setErro('Nome do Tomador é obrigatório quando Tomador = Outros')
            setSalvando(false)
            return
          }
        }
      }

      // Criar MDF-e
      const payload = {
        uf_inicio: form.uf_inicio,
        uf_fim: form.uf_fim,
        placa_veiculo: form.placa_veiculo.toUpperCase(),
        uf_veiculo: form.uf_veiculo,
        condutor_nome: form.condutor_nome,
        condutor_cpf: form.condutor_cpf.replace(/\D/g, ''),
        modal: form.modal,
        tipo_emissao: parseInt(form.tipo_emissao),
        tipo_emitente: parseInt(form.tipo_emitente),
        veiculo_tipo_rodado: form.veiculo_tipo_rodado,
        veiculo_tipo_carroceria: form.veiculo_tipo_carroceria,
        veiculo_tara_kg: parseInt(form.veiculo_tara_kg),
        veiculo_capacidade_kg: parseInt(form.veiculo_capacidade_kg),
        data_saida: form.data_saida,
        hora_saida: form.hora_saida,
        rntrc_prestador: form.rntrc_prestador || null,
        contratante_rntrc: form.contratante_rntrc || null,
        contratante_cnpj: form.contratante_cnpj ? form.contratante_cnpj.replace(/\D/g, '') : null,
        responsavel_seguro_cpf_cnpj: form.responsavel_seguro_cpf_cnpj ? form.responsavel_seguro_cpf_cnpj.replace(/\D/g, '') : null,
        tipo_carga: form.tipo_carga,
        produto_ncm: form.produto_ncm || null,
        averbacao: form.averbacao || null,
        tomador_servico: form.tipo_emitente === '1' ? parseInt(form.tomador_servico) : null,
        tomador_ind_ie: form.tipo_emitente === '1' ? parseInt(form.tomador_ind_ie) : null,
        tomador_cpf_cnpj: form.tomador_cpf_cnpj ? form.tomador_cpf_cnpj.replace(/\D/g, '') : null,
        tomador_nome: form.tomador_nome || null,
        percursos: form.percursos.map((uf, idx) => ({ uf, ordem: idx + 1 })),
        documentos_vinculados: docsSelecionados.map(doc => ({
          tipo_documento: doc.tipo === 'CT-e' ? 'CTE' : 'NFE',
          chave_acesso: doc.chave,
        })),
        carregamentos: form.carregamento_ibge ? [{
          municipio_cep: form.carregamento_cep,
          municipio_nome: form.carregamento_nome,
          municipio_codigo_ibge: form.carregamento_ibge,
          uf: getUfFromIbge(form.carregamento_ibge) || form.uf_inicio // UF derivada do IBGE
        }] : [],
        descarregamentos: form.descarga_ibge ? [{
          municipio_cep: form.descarga_cep,
          municipio_nome: form.descarga_nome,
          municipio_codigo_ibge: form.descarga_ibge,
          uf: getUfFromIbge(form.descarga_ibge) || form.uf_fim // UF derivada do IBGE
        }] : [],
      }

      // FIX: Removido /api prefixo
      let r;
      if (form.id_mdfe) {
        console.log('📤 Atualizando MDF-e:', payload)
        r = await axiosInstance.put(`/mdfe/${form.id_mdfe}/`, payload)
        console.log('✅ MDF-e atualizado:', r.data)
        showToast(`MDF-e #${form.id_mdfe} atualizado com sucesso!`, 'success')
      } else {
        console.log('📤 Enviando MDF-e:', payload)
        r = await axiosInstance.post('/mdfe/', payload)
        console.log('✅ MDF-e criado:', r.data)
        showToast(`MDF-e #${r.data.id || r.data.id_mdfe} criado com sucesso! Clique em "Emitir" para enviar à SEFAZ.`, 'success')
      }
      
      setModalOpen(false)
      buscar()
    } catch (e) {
      console.error('❌ Erro ao salvar MDF-e:', e.response?.data)
      
      // Melhor formatação de erros
      let mensagemErro = 'Erro ao salvar:\n'
      if (e.response?.data) {
        const data = e.response.data
        if (typeof data === 'object' && data !== null) {
          // Formata erros de validação de campos
          const erros = Object.entries(data).map(([campo, msgs]) => {
            // Se é array de mensagens
            if (Array.isArray(msgs)) {
              const mensagens = msgs.map(m => {
                if (typeof m === 'object') {
                  return JSON.stringify(m, null, 2)
                }
                return String(m)
              }).join(', ')
              return `• ${campo}: ${mensagens}`
            }
            // Se é um objeto (erro complexo)
            if (typeof msgs === 'object') {
              return `• ${campo}: ${JSON.stringify(msgs, null, 2)}`
            }
            // String simples
            return `• ${campo}: ${msgs}`
          }).join('\n')
          mensagemErro += erros
        } else {
          mensagemErro += data.detail || data.error || String(data)
        }
      } else {
        mensagemErro += e.message
      }
      
      setErro(mensagemErro)
    } finally {
      setSalvando(false)
    }
  }

  const totais = {
    total: lista.length,
    autorizados: lista.filter(m => ['Autorizado', 'AUTORIZADO', 'Emitido', 'EMITIDO'].includes(m.status_mdfe)).length,
    encerrados: lista.filter(m => ['Encerrado', 'ENCERRADO'].includes(m.status_mdfe)).length,
    cancelados: lista.filter(m => ['Cancelado', 'CANCELADO'].includes(m.status_mdfe)).length,
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <MDFeIcon sx={{ color: '#FF6F00', fontSize: 32 }} />
            <Typography variant="h5" fontWeight={700} color="primary">MDF-e</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Manifesto de Documentos Fiscais Eletrônicos — Controle de cargas em trânsito
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar"><IconButton onClick={buscar} disabled={loading}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirModal}>
            Novo MDF-e
          </Button>
        </Stack>
      </Stack>

      {/* Cards resumo */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total', valor: totais.total, color: '#1565c0' },
          { label: 'Autorizados', valor: totais.autorizados, color: '#2e7d32' },
          { label: 'Encerrados', valor: totais.encerrados, color: '#0277bd' },
          { label: 'Cancelados', valor: totais.cancelados, color: '#c62828' },
        ].map(c => (
          <Card key={c.label} elevation={2} sx={{ flex: 1, borderLeft: `4px solid ${c.color}` }}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color: c.color }}>{c.valor}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Filtros */}
      <Card sx={{ mb: 3 }} elevation={1}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField select size="small" label="Mês" value={mes} onChange={e => setMes(e.target.value)} sx={{ minWidth: 160 }}>
              {MESES.map(m => <MenuItem key={m.v} value={m.v}>{m.l}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Ano" type="number" value={ano} onChange={e => setAno(e.target.value)} sx={{ width: 100 }} />
            <TextField select size="small" label="Status" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Autorizado">Autorizado</MenuItem>
              <MenuItem value="Encerrado">Encerrado</MenuItem>
              <MenuItem value="Cancelado">Cancelado</MenuItem>
              <MenuItem value="Pendente">Pendente</MenuItem>
            </TextField>
            <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={buscar} disabled={loading}>Buscar</Button>
          </Stack>
        </CardContent>
      </Card>

      {erro && <Alert severity="warning" sx={{ mb: 2 }}>{erro}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#FF6F00' }}>
                {['Número', 'Chave de Acesso', 'UF Início → Fim', 'Veículo', 'Emissão', 'Valor Carga', 'Status', 'Ações'].map(h => (
                  <TableCell key={h} sx={{ color: '#fff', fontWeight: 700, py: 1, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {lista.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <MDFeIcon sx={{ fontSize: 48, color: '#bdbdbd', mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color="text.secondary">Nenhum MDF-e encontrado para o período</Typography>
                    <Button variant="outlined" sx={{ mt: 2 }} startIcon={<AddIcon />} onClick={() => setDetalhe('novo')}>
                      Emitir primeiro MDF-e
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                lista.map((m, i) => (
                  <TableRow key={m.id_mdfe || i} hover>
                    <TableCell><Typography variant="body2" fontWeight={700}>{m.numero_mdfe || '—'}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                        {m.chave_mdfe ? `${m.chave_mdfe.slice(0, 20)}...` : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2">{m.uf_inicio} → {m.uf_fim}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{m.placa_veiculo || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{m.data_emissao ? new Date(m.data_emissao).toLocaleDateString('pt-BR') : '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{m.valor_total_carga ? fmt(m.valor_total_carga) : '—'}</Typography></TableCell>
                    <TableCell>
                      <Chip size="small" label={m.status_mdfe || 'Pendente'} color={STATUS_COLORS[m.status_mdfe] || 'default'} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Visualizar"><IconButton size="small" onClick={() => setDetalhe(m)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                        
                        {/* Ações Pendente/Erro - Emitir e Excluir */}
                        {['Pendente', 'PENDENTE', 'Erro', 'ERRO', 'Rejeitado'].includes(m.status_mdfe) && (
                          <>
                            <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => abrirModalParaEdicao(m)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Enviar/Emitir"><IconButton size="small" color="primary" onClick={() => emitirMDFe(m.id_mdfe)}><SendIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => excluirMDFe(m.id_mdfe)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                          </>
                        )}

                        {/* Ações Autorizado/Encerrado - Imprimir e WhatsApp */}
                        {(['Autorizado', 'AUTORIZADO', 'EMITIDO', 'Emitido', 'Encerrado', 'ENCERRADO'].includes(m.status_mdfe)) && (
                          <>
                            <Tooltip title="Imprimir DAMDFE"><IconButton size="small" color="secondary" onClick={() => imprimirDAMDFE(m.id_mdfe)}><PrintIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Baixar XML"><IconButton size="small" color="info" onClick={() => baixarXML(m.id_mdfe, m.chave_mdfe)}><DownloadIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="WhatsApp"><IconButton size="small" color="success" onClick={() => enviarWhatsApp(m)}><WhatsAppIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Enviar por E-mail"><IconButton size="small" color="primary" onClick={() => setEmailDialog({ open: true, mdfe: m })}><EmailIcon fontSize="small" /></IconButton></Tooltip>
                          </>
                        )}

                        {['Autorizado', 'AUTORIZADO', 'EMITIDO', 'Emitido'].includes(m.status_mdfe) && (
                          <>
                            <Tooltip title="Encerrar"><IconButton size="small" color="info" onClick={() => encerrarMDFe(m.id_mdfe)}><EncerrarIcon fontSize="small" /></IconButton></Tooltip>
                            <Tooltip title="Cancelar"><IconButton size="small" color="error" onClick={() => abrirDialogCancelar(m)}><CancelIcon fontSize="small" /></IconButton></Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo de criação de MDF-e */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <MDFeIcon sx={{ color: '#FF6F00' }} />
              <Typography variant="h6">Novo MDF-e</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Etapa {activeStep + 1} de {ETAPAS_MDFE.length}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro(null)}>{erro}</Alert>}
          
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {ETAPAS_MDFE.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 400 }}>
            {/* ETAPA 0: Rota e Data */}
            {activeStep === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>📍 Rota</Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={6}>
                  <FormControl fullWidth required>
                    <InputLabel>UF Início</InputLabel>
                    <Select value={form.uf_inicio} onChange={e => setForm({...form, uf_inicio: e.target.value})} label="UF Início">
                      {UFS.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6}>
                  <FormControl fullWidth required>
                    <InputLabel>UF Fim</InputLabel>
                    <Select value={form.uf_fim} onChange={e => setForm({...form, uf_fim: e.target.value})} label="UF Fim">
                      {UFS.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>📍 Local de Carregamento</Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField 
                    fullWidth 
                    label="CEP Carregamento" 
                    value={form.carregamento_cep || ''}
                    onChange={(e) => setForm({ ...form, carregamento_cep: formatCEP(e.target.value) })}
                    onBlur={handleBuscaCepCarregamento}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    required 
                    label="Município de Carregamento" 
                    value={form.carregamento_nome || ''} 
                    onChange={e => setForm({...form, carregamento_nome: e.target.value})} 
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField 
                    fullWidth 
                    required 
                    label="Código IBGE" 
                    value={form.carregamento_ibge || ''} 
                    onChange={e => setForm({...form, carregamento_ibge: e.target.value})} 
                  />
                </Grid>

                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>📍 Local de Descarga (Destino)</Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField 
                    fullWidth 
                    label="CEP Descarga" 
                    value={form.descarga_cep || ''}
                    onChange={(e) => setForm({ ...form, descarga_cep: formatCEP(e.target.value) })}
                    onBlur={handleBuscaCepDescarga}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    required 
                    label="Município de Descarga" 
                    value={form.descarga_nome || ''} 
                    onChange={e => setForm({...form, descarga_nome: e.target.value})} 
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField 
                    fullWidth 
                    required 
                    label="Código IBGE Descarga" 
                    value={form.descarga_ibge || ''} 
                    onChange={e => setForm({...form, descarga_ibge: e.target.value})} 
                  />
                </Grid>

                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FormControl fullWidth size="small">
                      <InputLabel>Percurso (UFs intermediárias)</InputLabel>
                      <Select value={percursoUF} onChange={e => setPercursoUF(e.target.value)} label="Percurso (UFs intermediárias)">
                        {UFS.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <Button variant="outlined" onClick={adicionarPercurso} disabled={!percursoUF}>Adicionar</Button>
                    <Button 
                      variant="contained" 
                      color="secondary" 
                      onClick={abrirCalculadoraRotas}
                      startIcon={<RouteIcon />}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Calcular Rota Auto
                    </Button>
                  </Stack>
                  {form.percursos.length > 0 && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                      {form.percursos.map(uf => (
                        <Chip key={uf} label={uf} onDelete={() => removerPercurso(uf)} size="small" color="primary" />
                      ))}
                    </Stack>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>📅 Data e Hora de Saída</Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="Data de Saída"
                    value={form.data_saida}
                    onChange={e => setForm({...form, data_saida: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    required
                    type="time"
                    label="Hora de Saída"
                    value={form.hora_saida}
                    onChange={e => setForm({...form, hora_saida: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            )}

            {/* ETAPA 1: Veículo e Condutor */}
            {activeStep === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>🚛 Veículo</Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    fullWidth
                    options={veiculosDisponiveis}
                    getOptionLabel={(opt) => {
                      // Monta descrição do veículo de forma robusta
                      const marca = opt.marca || '';
                      const modelo = opt.modelo || '';
                      const ano = opt.ano || '';
                      const placa = opt.placa || '';
                      const uf = opt.uf || '';
                      return `${placa} - ${marca} ${modelo} ${ano} (${uf})`.trim();
                    }}
                    value={veiculoSelecionado}
                    onChange={(e, newValue) => {
                      // Valida se o veículo está completo para MDF-e
                      if (newValue && !validarVeiculoCompleto(newValue)) {
                        setVeiculoIncompleto(newValue)
                        setDialogVeiculoIncompleto(true)
                        return
                      }
                      
                      setVeiculoSelecionado(newValue)
                      if (newValue) {
                        setForm(prev => ({
                          ...prev,
                          placa_veiculo: newValue.placa,
                          uf_veiculo: newValue.uf,
                          veiculo_tipo_rodado: newValue.tipo_rodado || '03',
                          veiculo_tipo_carroceria: newValue.tipo_carroceria || '02',
                          veiculo_tipo_proprietario: newValue.tipo_propriedade || '1',
                          veiculo_tara_kg: newValue.tara_kg || '',
                          veiculo_capacidade_kg: newValue.capacidade_kg || '',
                        }))
                      }
                    }}
                    loading={buscandoVeiculos}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Selecione o Veículo *"
                        placeholder="Busque por placa, marca ou modelo..."
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {buscandoVeiculos ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    noOptionsText={veiculosDisponiveis.length === 0 ? 
                      "Nenhum veículo cadastrado. Cadastre veículos primeiro." :
                      "Nenhum veículo corresponde à busca"
                    }
                  />
                  {veiculoSelecionado && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      ✅ Veículo selecionado: {veiculoSelecionado.marca} {veiculoSelecionado.modelo} {veiculoSelecionado.ano} - {veiculoSelecionado.uf}
                    </Alert>
                  )}
                </Grid>

                <Grid item xs={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Tipo de Rodado</InputLabel>
                    <Select 
                      value={form.veiculo_tipo_rodado} 
                      onChange={e => setForm({...form, veiculo_tipo_rodado: e.target.value})} 
                      label="Tipo de Rodado"
                      disabled={!!veiculoSelecionado}
                    >
                      <MenuItem value="01">01 - Truck</MenuItem>
                      <MenuItem value="02">02 - Toco</MenuItem>
                      <MenuItem value="03">03 - Cavalo Mecânico</MenuItem>
                      <MenuItem value="04">04 - VAN</MenuItem>
                      <MenuItem value="05">05 - Utilitário</MenuItem>
                      <MenuItem value="06">06 - Outros</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Tipo de Carroceria</InputLabel>
                    <Select 
                      value={form.veiculo_tipo_carroceria} 
                      onChange={e => setForm({...form, veiculo_tipo_carroceria: e.target.value})} 
                      label="Tipo de Carroceria"
                      disabled={!!veiculoSelecionado}
                    >
                      <MenuItem value="00">00 - Não aplicável</MenuItem>
                      <MenuItem value="01">01 - Aberta</MenuItem>
                      <MenuItem value="02">02 - Fechada/Baú</MenuItem>
                      <MenuItem value="03">03 - Graneleira</MenuItem>
                      <MenuItem value="04">04 - Porta Container</MenuItem>
                      <MenuItem value="05">05 - Sider</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Tara do Veículo (KG)"
                    value={form.veiculo_tara_kg}
                    onChange={e => setForm({...form, veiculo_tara_kg: e.target.value})}
                    placeholder="8000"
                    helperText="Peso do veículo vazio"
                    disabled={!!veiculoSelecionado}
                  /> 
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Capacidade (KG)"
                    value={form.veiculo_capacidade_kg}
                    onChange={e => setForm({...form, veiculo_capacidade_kg: e.target.value})}
                    placeholder="25000"
                    helperText="Capacidade máxima de carga"
                    disabled={!!veiculoSelecionado}
                  />
                </Grid>

                <Grid item xs={6}>
                  <FormControl fullWidth required>
                    <InputLabel>UF Veículo</InputLabel>
                    <Select 
                      value={form.uf_veiculo} 
                      onChange={e => setForm({...form, uf_veiculo: e.target.value})} 
                      label="UF Veículo"
                      disabled={!!veiculoSelecionado}
                    >
                      {UFS.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>👤 Condutor</Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    required
                    label="Nome do Condutor"
                    value={form.condutor_nome}
                    onChange={e => setForm({...form, condutor_nome: e.target.value})}
                    placeholder="João da Silva"
                  />
                </Grid>

                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    required
                    label="CPF do Condutor"
                    value={form.condutor_cpf}
                    onChange={e => setForm({...form, condutor_cpf: e.target.value})}
                    placeholder="000.000.000-00"
                    inputProps={{ maxLength: 14 }}
                  />
                </Grid>
              </Grid>
            )}

            {/* ETAPA 2: Informações Complementares */}
            {activeStep === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>📋 Informações da Carga</Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Tipo de Transporte</InputLabel>
                    <Select 
                      value={form.tipo_emitente} 
                      onChange={e => setForm({...form, tipo_emitente: e.target.value})} 
                      label="Tipo de Transporte"
                    >
                      <MenuItem value="1">PRESTADOR DE SERVIÇO DE TRANSPORTE</MenuItem>
                      <MenuItem value="2">TRANSPORTE DE CARGA PRÓPRIA</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Campos obrigatórios apenas para PRESTADOR DE SERVIÇO */}
                {form.tipo_emitente === '1' && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>👥 Tomador do Serviço (Obrigatório)</Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="caption">
                          Para Prestador de Serviço de Transporte, é obrigatório informar o Tomador do Serviço
                        </Typography>
                      </Alert>
                    </Grid>

                    <Grid item xs={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Tomador do Serviço</InputLabel>
                        <Select 
                          value={form.tomador_servico} 
                          onChange={e => setForm({...form, tomador_servico: e.target.value})} 
                          label="Tomador do Serviço"
                        >
                          <MenuItem value="0">0 - Remetente</MenuItem>
                          <MenuItem value="1">1 - Expedidor</MenuItem>
                          <MenuItem value="2">2 - Recebedor</MenuItem>
                          <MenuItem value="3">3 - Destinatário</MenuItem>
                          <MenuItem value="4">4 - Outros</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Indicador IE do Tomador</InputLabel>
                        <Select 
                          value={form.tomador_ind_ie} 
                          onChange={e => setForm({...form, tomador_ind_ie: e.target.value})} 
                          label="Indicador IE do Tomador"
                        >
                          <MenuItem value="1">1 - Contribuinte ICMS</MenuItem>
                          <MenuItem value="2">2 - Isento de Inscrição</MenuItem>
                          <MenuItem value="9">9 - Não Contribuinte</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Campos adicionais quando Tomador = Outros */}
                    {form.tomador_servico === '4' && (
                      <>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            required
                            label="CPF/CNPJ do Tomador"
                            value={form.tomador_cpf_cnpj}
                            onChange={e => setForm({...form, tomador_cpf_cnpj: e.target.value})}
                            placeholder="00.000.000/0000-00 ou 000.000.000-00"
                            helperText="Obrigatório quando Tomador = Outros"
                          />
                        </Grid>

                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            required
                            label="Nome/Razão Social do Tomador"
                            value={form.tomador_nome}
                            onChange={e => setForm({...form, tomador_nome: e.target.value})}
                            placeholder="Nome ou Razão Social"
                            helperText="Obrigatório quando Tomador = Outros"
                          />
                        </Grid>
                      </>
                    )}
                  </>
                )}

                {/* Alerta para CARGA PRÓPRIA */}
                {form.tipo_emitente === '2' && (
                  <Grid item xs={12}>
                    <Alert severity="success" sx={{ mb: 1 }}>
                      <Typography variant="caption">
                        ✅ Transporte de Carga Própria - Não é necessário informar Tomador do Serviço
                      </Typography>
                    </Alert>
                  </Grid>
                )}

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="RNTRC do Prestador (ANTT)"
                    value={form.rntrc_prestador}
                    onChange={e => setForm({...form, rntrc_prestador: e.target.value})}
                    placeholder="12345678"
                    required={form.tipo_emitente === '1'}
                    helperText={form.tipo_emitente === '1' ? 
                      'Obrigatório para Prestador de Serviço' : 
                      'Opcional para Carga Própria'}
                  />
                </Grid>

                <Grid item xs={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Tipo de Carga</InputLabel>
                    <Select 
                      value={form.tipo_carga} 
                      onChange={e => setForm({...form, tipo_carga: e.target.value})} 
                      label="Tipo de Carga"
                    >
                      <MenuItem value="01">01 - Granel sólido</MenuItem>
                      <MenuItem value="02">02 - Granel líquido</MenuItem>
                      <MenuItem value="03">03 - Frigorificada</MenuItem>
                      <MenuItem value="04">04 - Conteinerizada</MenuItem>
                      <MenuItem value="05">05 - Carga geral</MenuItem>
                      <MenuItem value="06">06 - Neogranel</MenuItem>
                      <MenuItem value="07">07 - Perigosa (granel sólido)</MenuItem>
                      <MenuItem value="08">08 - Perigosa (granel líquido)</MenuItem>
                      <MenuItem value="09">09 - Perigosa (carga frigorificada)</MenuItem>
                      <MenuItem value="10">10 - Perigosa (conteinerizada)</MenuItem>
                      <MenuItem value="11">11 - Perigosa (carga geral)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="NCM Predominante"
                    value={form.produto_ncm}
                    onChange={e => setForm({...form, produto_ncm: e.target.value})}
                    placeholder="01012100"
                    inputProps={{ maxLength: 8 }}
                    helperText="Código NCM do produto predominante"
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Número da Averbação"
                    value={form.averbacao}
                    onChange={e => setForm({...form, averbacao: e.target.value})}
                    placeholder="123456789"
                    helperText="Se houver seguro"
                  />
                </Grid>

                {/* Seção de Contratante - apenas para Prestador de Serviço */}
                {form.tipo_emitente === '1' && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>🏢 Contratante (Carga de Terceiro)</Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Preencha apenas se estiver transportando carga de terceiro
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="RNTRC do Contratante"
                        value={form.contratante_rntrc}
                        onChange={e => setForm({...form, contratante_rntrc: e.target.value})}
                        placeholder="87654321"
                        helperText="RNTRC da empresa contratante"
                      />
                    </Grid>

                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="CNPJ do Contratante"
                        value={form.contratante_cnpj}
                        onChange={e => setForm({...form, contratante_cnpj: e.target.value})}
                        placeholder="00.000.000/0000-00"
                        inputProps={{ maxLength: 18 }}
                        helperText="CNPJ da empresa contratante"
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="CPF/CNPJ Responsável Seguro"
                    value={form.responsavel_seguro_cpf_cnpj}
                    onChange={e => setForm({...form, responsavel_seguro_cpf_cnpj: e.target.value})}
                    placeholder="00.000.000/0000-00 ou 000.000.000-00"
                    helperText="CPF ou CNPJ do responsável pelo seguro da carga"
                  />
                </Grid>
              </Grid>
            )}

            {/* ETAPA 3: Documentos */}
            {activeStep === 3 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>📄 Documentos Fiscais (NF-e/CT-e)</Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    id="autocomplete-documentos-mdfe"
                    multiple
                    options={docsDisponiveis}
                    getOptionLabel={(opt) => `${opt.tipo} ${opt.numero} - ${opt.destinatario}`}
                    isOptionEqualToValue={(option, value) => option.chave === value.chave}
                    groupBy={(opt) => opt.tipo}
                    value={docsSelecionados}
                    onChange={(e, newVal) => setDocsSelecionados(newVal)}
                    renderInput={(params) => (
                      <TextField 
                        {...params}
                        id="textfield-documentos-mdfe"
                        label={`Documentos Selecionados (${docsSelecionados.length}) *`}
                        placeholder="Busque por número ou destinatário..." 
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip 
                          key={option.chave || index}
                          label={`${option.tipo} ${option.numero}`} 
                          {...getTagProps({ index })} 
                          size="small" 
                          color={option.tipo === 'CT-e' ? 'warning' : 'success'}
                        />
                      ))
                    }
                    renderOption={(props, option) => (
                      <li {...props} key={option.chave}>
                        <Box sx={{ width: '100%' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {option.tipo} {option.numero}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.destinatario}
                              </Typography>
                            </Box>
                            {option.valor && (
                              <Chip 
                                label={fmt(option.valor)} 
                                size="small" 
                                color={option.tipo === 'CT-e' ? 'warning' : 'success'}
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        </Box>
                      </li>
                    )}
                    noOptionsText={docsDisponiveis.length === 0 ? 
                      "Nenhum documento disponível para manifesto (emita CT-e ou NF-e primeiro)" :
                      "Nenhum documento corresponde à busca"
                    }
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {docsDisponiveis.length === 0 ? 
                      '⚠️ Nenhum CT-e ou NF-e disponível. Emita documentos fiscais primeiro.' :
                      `✅ ${docsDisponiveis.filter(d => d.tipo === 'CT-e').length} CT-e e ${docsDisponiveis.filter(d => d.tipo === 'NF-e').length} NF-e disponíveis`
                    }
                  </Typography>
                </Grid>

                {docsSelecionados.length > 0 && (
                  <Grid item xs={12}>
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <Typography variant="body2" fontWeight={600}>
                        ✅ {docsSelecionados.length} documento(s) selecionado(s)
                      </Typography>
                      <Typography variant="caption">
                        Revise os dados nas etapas anteriores e clique em "Criar MDF-e". Após criado, clique em "Emitir" na lista para enviar à SEFAZ.
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} disabled={salvando}>Cancelar</Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep > 0 && (
            <Button 
              startIcon={<BackIcon />}
              onClick={() => setActiveStep(prev => prev - 1)}
              disabled={salvando}
            >
              Voltar
            </Button>
          )}
          {activeStep < ETAPAS_MDFE.length - 1 ? (
            <Button 
              variant="contained" 
              endIcon={<NextIcon />}
              onClick={() => setActiveStep(prev => prev + 1)}
            >
              Próximo
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="success"
              onClick={salvarMDFe} 
              disabled={salvando} 
              startIcon={salvando ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {salvando ? 'Criando MDF-e...' : 'Criar MDF-e'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação - Veículo Incompleto */}
      <Dialog
        open={dialogVeiculoIncompleto}
        onClose={() => {
          setDialogVeiculoIncompleto(false)
          setVeiculoIncompleto(null)
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShipping color="warning" />
            <Typography variant="h6" component="span">
              Cadastro de Veículo Incompleto
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom fontWeight={600}>
              Este veículo não possui todos os dados obrigatórios para emissão de MDF-e:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              {veiculoIncompleto && !veiculoIncompleto.tipo_rodado && (
                <li>Tipo de Rodado</li>
              )}
              {veiculoIncompleto && !veiculoIncompleto.tipo_carroceria && (
                <li>Tipo de Carroceria</li>
              )}
              {veiculoIncompleto && !veiculoIncompleto.tara_kg && (
                <li>Tara (kg)</li>
              )}
              {veiculoIncompleto && !veiculoIncompleto.capacidade_kg && (
                <li>Capacidade (kg)</li>
              )}
              {veiculoIncompleto && (veiculoIncompleto.tipo_propriedade === null || veiculoIncompleto.tipo_propriedade === undefined) && (
                <li>Tipo de Propriedade/Vínculo</li>
              )}
            </Box>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Veículo selecionado: <strong>{veiculoIncompleto?.placa} - {veiculoIncompleto?.marca} {veiculoIncompleto?.modelo}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Deseja editar o cadastro deste veículo agora?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => {
              setDialogVeiculoIncompleto(false)
              setVeiculoIncompleto(null)
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setDialogVeiculoIncompleto(false)
              setDialogEditarVeiculo(true)
            }}
            startIcon={<LocalShipping />}
          >
            Editar Veículo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Edição de Veículo */}
      {dialogEditarVeiculo && veiculoIncompleto && (
        <VeiculoDialog
          open={dialogEditarVeiculo}
          onClose={() => {
            setDialogEditarVeiculo(false)
            setVeiculoIncompleto(null)
          }}
          veiculoToEdit={veiculoIncompleto}
          onSave={handleVeiculoAtualizado}
        />
      )}

      {/* Dialog de Seleção de Rotas Automáticas */}
      <Dialog 
        open={dialogRotas} 
        onClose={() => setDialogRotas(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <RouteIcon color="primary" />
            <Typography variant="h6">Selecione a Rota</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            De <strong>{form.uf_inicio}</strong> até <strong>{form.uf_fim}</strong>
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {rotasDisponiveis.length === 0 ? (
            <Alert severity="warning">Nenhuma rota encontrada</Alert>
          ) : (
            <Stack spacing={2}>
              {rotasDisponiveis.map((rota, idx) => (
                <Paper 
                  key={idx} 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      backgroundColor: 'action.hover',
                      transform: 'scale(1.02)'
                    }
                  }}
                  onClick={() => selecionarRota(rota)}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" fontWeight="bold">
                        Rota {idx + 1}
                      </Typography>
                      <Chip 
                        label={`${rota.distancia} ${rota.distancia === 1 ? 'estado' : 'estados'}`} 
                        color={idx === 0 ? 'success' : 'default'} 
                        size="small" 
                      />
                    </Stack>
                    
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {rota.caminho.map((uf, i) => (
                        <React.Fragment key={i}>
                          <Chip 
                            label={uf} 
                            color={
                              uf === form.uf_inicio ? 'primary' : 
                              uf === form.uf_fim ? 'error' : 
                              'default'
                            }
                            size="small"
                          />
                          {i < rota.caminho.length - 1 && (
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              →
                            </Typography>
                          )}
                        </React.Fragment>
                      ))}
                    </Stack>

                    {rota.percurso.length > 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Percurso intermediário:</strong> {rota.percurso.join(', ')}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="success.main">
                        ✓ Estados vizinhos - Sem percurso intermediário
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogRotas(false)} color="inherit">
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Cancelamento de MDF-e */}
      <Dialog open={dialogCancelar} onClose={() => setDialogCancelar(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CancelIcon sx={{ color: 'error.main' }} />
            <Typography variant="h6">Cancelar MDF-e</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Atenção: O cancelamento é irreversível. Após cancelado, o MDF-e não poderá ser utilizado.
          </Alert>
          {mdfeCancelar && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>MDF-e:</strong> {mdfeCancelar.numero_mdfe}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Chave:</strong> {mdfeCancelar.chave_mdfe}
              </Typography>
            </Box>
          )}
          <TextField
            label="Justificativa do Cancelamento"
            fullWidth
            required
            multiline
            rows={3}
            value={justificativaCancelamento}
            onChange={(e) => setJustificativaCancelamento(e.target.value)}
            error={justificativaCancelamento.length > 0 && justificativaCancelamento.length < 15}
            helperText={`Mínimo 15 caracteres (${justificativaCancelamento.length}/15)`}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCancelar(false)} color="inherit" disabled={loading}>
            Fechar
          </Button>
          <Button 
            onClick={cancelarMDFe} 
            color="error" 
            variant="contained"
            disabled={loading || justificativaCancelamento.length < 15}
            startIcon={loading ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            Cancelar MDF-e
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Enviar por E-mail */}
      <EmailDocumentoDialog
        open={emailDialog.open}
        onClose={() => setEmailDialog({ open: false, mdfe: null })}
        tipo="mdfe"
        documentoId={emailDialog.mdfe?.id_mdfe}
        numero={emailDialog.mdfe?.numero_mdfe}
        chave={emailDialog.mdfe?.chave_mdfe}
        emailDestinatario=""
        nomeDestinatario=""
        valorTotal={emailDialog.mdfe?.valor_total_carga}
        temXml={!!emailDialog.mdfe?.chave_mdfe}
        temPdf={!!emailDialog.mdfe?.chave_mdfe}
        onSuccess={(msg) => showToast(msg, 'success')}
        onError={(msg) => showToast(msg, 'error')}
      />
    </Box>
  )
}
