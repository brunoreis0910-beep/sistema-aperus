import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  TextField,
  Avatar,
  Fab,
  Collapse,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  Divider,
  Button,
  Drawer,
  Card,
  CardContent,
  CardActions,
  LinearProgress
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Psychology as BrainIcon,
  TrendingUp as TrendingIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Restaurant as RestaurantIcon,
  LocalShipping as CTeIcon,
  Receipt as NFeIcon,
  Assessment as RelatorioIcon,
  OpenInNew as OpenInNewIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  DeleteSweep as DeleteSweepIcon,
  AutoAwesome as InsightIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  GraphicEq as GraphicEqIcon,
  StopCircle as StopCircleIcon
} from '@mui/icons-material';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { API_ENDPOINT } from '../config/api';

const API_BASE_URL = API_ENDPOINT;

// Sugestões rápidas
const SUGESTOES_RAPIDAS = [
  { icon: <MoneyIcon fontSize="small" />, texto: 'Quanto vendemos este mês?', tipo: 'vendas' },
  { icon: <TrendingIcon fontSize="small" />, texto: 'Como está o financeiro?', tipo: 'financeiro' },
  { icon: <CTeIcon fontSize="small" />, texto: 'Relatório de CT-e este mês', tipo: 'cte' },
  { icon: <NFeIcon fontSize="small" />, texto: 'Qual o NCM de laranja? 🌐', tipo: 'ncm_web' },
  { icon: <RelatorioIcon fontSize="small" />, texto: 'Gerar relatório PDF de vendas', tipo: 'pdf' },
  { icon: <InventoryIcon fontSize="small" />, texto: 'Produtos com estoque baixo', tipo: 'estoque' },
  { icon: <PeopleIcon fontSize="small" />, texto: 'Erro NF-e código 539', tipo: 'erro_fiscal' }
];

const AIChat = () => {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [inputMensagem, setInputMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [aiDisponivel, setAiDisponivel] = useState(null);
  const [erro, setErro] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null); // Referência ao Audio() atual (Google TTS)

  // Estados de voz
  const [gravando, setGravando] = useState(false);
  const [audioAtivado, setAudioAtivado] = useState(false);
  const [falando, setFalando] = useState(false);
  const [gerandoAudio, setGerandoAudio] = useState(false);

  // Estado do Drawer de Análise de Negócio
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [analiseIA, setAnaliseIA] = useState(null);
  const [carregandoAnalise, setCarregandoAnalise] = useState(false);

  // Debug: Log quando componente renderiza
  useEffect(() => {
    console.log('🤖 AIChat montado! Botão deve estar visível no canto inferior direito.');
  }, []);

  // Verifica status da IA ao abrir
  useEffect(() => {
    if (aberto && aiDisponivel === null) {
      verificarStatusIA();
    }
  }, [aberto]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    scrollParaFinal();
  }, [mensagens]);

  const scrollParaFinal = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const verificarStatusIA = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/ai/status/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiDisponivel(response.data.disponivel);
      
      if (!response.data.disponivel) {
        setErro('Serviço de IA não configurado. Configure GEMINI_API_KEY no arquivo .env do servidor.');
      }
    } catch (err) {
      console.error('Erro ao verificar status IA:', err);
      setErro('Erro ao conectar com serviço de IA');
      setAiDisponivel(false);
    }
  };

  const baixarPDF = async (tipoPDF, periodo) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/ai/gerar-pdf/`,
        { tipo: tipoPDF, periodo: periodo || {} },
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'  // Importante para downloads
        }
      );
      
      // Cria link de download temporário
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${tipoPDF}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      setErro(err.response?.data?.mensagem || 'Erro ao gerar PDF');
    }
  };

  const limparConversa = () => {
    if (window.confirm('Deseja limpar todo o histórico de conversas?')) {
      setMensagens([]);
      setErro(null);
    }
  };

  // ----- VOZ: Microfone (Speech Recognition — Chrome/Edge) -----------------
  // ----- VOZ: Microfone Fallback (MediaRecorder — Firefox/Safari) ----------
  const iniciarGravacao = async () => {
    setErro(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // Modo 1: Web Speech API (Chrome / Edge — transcrição local, instantânea)
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onstart = () => setGravando(true);
      recognition.onend = () => setGravando(false);
      recognition.onerror = (e) => {
        setGravando(false);
        if (e.error !== 'no-speech') setErro('Erro no microfone: ' + e.error);
      };
      recognition.onresult = (e) => {
        const texto = e.results[0][0].transcript;
        enviarMensagem(texto);
      };
      recognitionRef.current = recognition;
      recognition.start();
      return;
    }

    // Modo 2: MediaRecorder + transcrição via Gemini (Firefox / Safari / outros)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Escolher o melhor formato suportado
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/mp4'];
      const supportedMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
      const recorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : {});

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setGravando(false);
        const mimeUsed = recorder.mimeType || supportedMime || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeUsed });
        try {
          setCarregando(true);
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const formData = new FormData();
          formData.append('audio', blob, 'gravacao.webm');
          const { data } = await axios.post(`${API_BASE_URL}/ai/transcribe/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
          });
          if (data.sucesso && data.texto) {
            enviarMensagem(data.texto);
          } else {
            setErro('Não foi possível transcrever o áudio.');
          }
        } catch (err) {
          const msg = err.response?.data?.mensagem || err.message || '';
          if (msg.includes('Limite diário') || msg.includes('cota') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
            setErro('⚠️ Limite diário de transcrições atingido. Por favor, digite sua mensagem no campo de texto.');
          } else {
            setErro('Erro ao transcrever: ' + msg);
          }
        } finally {
          setCarregando(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setGravando(true);
    } catch (err) {
      setErro('Sem acesso ao microfone: ' + err.message);
    }
  };

  const pararGravacao = () => {
    // Para Web Speech API
    recognitionRef.current?.stop();
    // Para MediaRecorder
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setGravando(false);
  };

  // ----- VOZ: Google Cloud TTS Neural2 (pt-BR) -----
  const falarTexto = async (texto) => {
    // Para áudio anterior se estiver tocando
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();

    // Limpa markdown antes de enviar ao TTS
    const textoLimpo = texto
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[-*+]\s/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim()
      .slice(0, 4000);

    if (!textoLimpo) return;

    setGerandoAudio(true);
    setFalando(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const { data } = await axios.post(
        `${API_BASE_URL}/ai/tts/`,
        { texto: textoLimpo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.sucesso && data.audio_base64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
        audioRef.current = audio;
        audio.onended = () => { setFalando(false); audioRef.current = null; };
        audio.onerror = () => { setFalando(false); audioRef.current = null; };
        await audio.play();
      } else {
        setFalando(false);
      }
    } catch (err) {
      console.error('Erro TTS:', err);
      // Fallback: usa SpeechSynthesis nativo do browser
      if (window.speechSynthesis && textoLimpo) {
        const utterance = new SpeechSynthesisUtterance(textoLimpo);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.05;
        utterance.onend = () => setFalando(false);
        utterance.onerror = () => setFalando(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setFalando(false);
      }
    } finally {
      setGerandoAudio(false);
    }
  };

  const pararFala = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setFalando(false);
    setGerandoAudio(false);
  };

  const enviarMensagem = async (mensagemTexto = null) => {
    const texto = mensagemTexto || inputMensagem.trim();
    
    if (!texto) return;
    
    // Adiciona mensagem do usuário
    const novaMensagemUsuario = {
      tipo: 'usuario',
      conteudo: texto,
      timestamp: new Date()
    };
    
    setMensagens(prev => [...prev, novaMensagemUsuario]);
    setInputMensagem('');
    setCarregando(true);
    setErro(null);
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/ai/chat/`,
        { mensagem: texto },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.sucesso) {
        const novaMensagemIA = {
          tipo: 'ia',
          conteudo: response.data.resposta,
          dados: response.data.dados,
          tipoAnalise: response.data.tipo,
          acaoNavegar: response.data.acao_navegar || null,
          acaoPDF: response.data.acao_pdf || null,
          // NOVO: Suporte para Agente de Execução (dispatcher)
          modoAgente: response.data.modo === 'agente_execucao',
          arquivoUrl: response.data.url || null,
          arquivoFormato: response.data.formato || null,
          arquivoTitulo: response.data.titulo || null,
          timestamp: new Date()
        };
        setMensagens(prev => [...prev, novaMensagemIA]);
        if (audioAtivado) falarTexto(response.data.resposta);
      } else {
        setErro(response.data.mensagem || 'Erro ao processar mensagem');
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setErro(err.response?.data?.mensagem || 'Erro ao comunicar com IA');
    } finally {
      setCarregando(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  const renderMensagem = (msg, index) => {
    const isUsuario = msg.tipo === 'usuario';
    
    return (
      <Box
        key={index}
        sx={{
          display: 'flex',
          justifyContent: isUsuario ? 'flex-end' : 'flex-start',
          mb: 2,
          gap: 1
        }}
      >
        {!isUsuario && (
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <BrainIcon fontSize="small" />
          </Avatar>
        )}
        
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            maxWidth: '75%',
            bgcolor: isUsuario ? 'primary.main' : 'background.paper',
            color: isUsuario ? 'primary.contrastText' : 'text.primary',
            borderRadius: isUsuario ? '12px 12px 0 12px' : '12px 12px 12px 0'
          }}
        >
          {isUsuario ? (
            <Typography variant="body2">{msg.conteudo}</Typography>
          ) : (
            <Box>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <Typography variant="body2" paragraph>{children}</Typography>,
                  strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                  ul: ({ children }) => <ul style={{ marginLeft: '1.2em', marginTop: '0.5em' }}>{children}</ul>,
                  li: ({ children }) => <li style={{ marginBottom: '0.3em' }}><Typography variant="body2" component="span">{children}</Typography></li>
                }}
              >
                {msg.conteudo}
              </ReactMarkdown>
              
              {msg.dados && Object.keys(msg.dados).length > 0 && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    📊 Dados detalhados
                  </Typography>
                  <pre style={{ fontSize: '0.75rem', margin: 0, overflow: 'auto' }}>
                    {JSON.stringify(msg.dados, null, 2)}
                  </pre>
                </Box>
              )}

              {msg.acaoNavegar && (
                <Button
                  variant="contained"
                  size="small"
                  endIcon={<OpenInNewIcon />}
                  sx={{ mt: 1.5, textTransform: 'none', borderRadius: 2 }}
                  onClick={() => {
                    navigate(msg.acaoNavegar.rota);
                    setAberto(false);
                  }}
                >
                  {msg.acaoNavegar.label}
                </Button>
              )}

              {msg.acaoPDF && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PdfIcon />}
                  endIcon={<DownloadIcon />}
                  sx={{ mt: 1.5, textTransform: 'none', borderRadius: 2, ml: msg.acaoNavegar ? 1 : 0 }}
                  onClick={() => baixarPDF(msg.acaoPDF.tipo_relatorio, msg.acaoPDF.periodo)}
                >
                  Baixar PDF
                </Button>
              )}

              {/* NOVO: Botão de download direto para Agente de Execução */}
              {msg.modoAgente && msg.arquivoUrl && (
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  startIcon={<PdfIcon />}
                  endIcon={<DownloadIcon />}
                  sx={{ mt: 1.5, textTransform: 'none', borderRadius: 2 }}
                  onClick={() => {
                    window.open(`${API_BASE_URL}${msg.arquivoUrl}`, '_blank');
                  }}
                >
                  {msg.arquivoTitulo || 'Baixar Relatório PDF'}
                </Button>
              )}
            </Box>
          )}
          
          {isUsuario ? (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7, fontSize: '0.65rem' }}>
              {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              <Tooltip title={gerandoAudio ? 'Gerando áudio...' : 'Ouvir resposta (Neural TTS)'} placement="top">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => falarTexto(msg.conteudo)}
                    disabled={gerandoAudio}
                    sx={{ p: 0.3 }}
                  >
                    {gerandoAudio
                      ? <CircularProgress size={12} />
                      : <VolumeUpIcon sx={{ fontSize: 14, opacity: 0.55 }} />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          )}
        </Paper>
        
        {isUsuario && (
          <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
            <Typography variant="caption">U</Typography>
          </Avatar>
        )}
      </Box>
    );
  };

  const buscarAnaliseNegocio = async () => {
    setCarregandoAnalise(true);
    setDrawerAberto(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/ai/analise-negocio/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnaliseIA(response.data);
    } catch (err) {
      console.error('Erro ao buscar análise de negócio:', err);
      setAnaliseIA({
        sucesso: false,
        mensagem: err.response?.data?.mensagem || 'Falha ao conectar com a IA.',
      });
    } finally {
      setCarregandoAnalise(false);
    }
  };

  return (
    <>
      {/* Botão Flutuante — Análise do Negócio IA */}
      <Tooltip title="Análise Estratégica IA" placement="left">
        <Fab
          size="medium"
          sx={{
            position: 'fixed',
            bottom: 90,
            right: 96,
            zIndex: 9999,
            bgcolor: 'success.main',
            color: 'white',
            boxShadow: 3,
            '&:hover': { bgcolor: 'success.dark', boxShadow: 6, transform: 'scale(1.1)', transition: 'all 0.2s' }
          }}
          onClick={buscarAnaliseNegocio}
        >
          <InsightIcon />
        </Fab>
      </Tooltip>

      {/* Drawer — Análise Estratégica do Negócio */}
      <Drawer
        anchor="right"
        open={drawerAberto}
        onClose={() => setDrawerAberto(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 2 } }}
      >
        {/* Header do Drawer */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InsightIcon color="success" />
            <Typography variant="h6" fontWeight="bold">Análise do Negócio</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Atualizar análise">
              <span>
                <IconButton size="small" onClick={buscarAnaliseNegocio} disabled={carregandoAnalise}>
                  <InsightIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <IconButton size="small" onClick={() => setDrawerAberto(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {carregandoAnalise && <LinearProgress color="success" sx={{ mb: 2, borderRadius: 1 }} />}

        {!carregandoAnalise && !analiseIA && (
          <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
            Clique no botão verde para gerar a análise estratégica.
          </Typography>
        )}

        {analiseIA && !analiseIA.sucesso && (
          <Alert severity="error" sx={{ mb: 2 }}>{analiseIA.mensagem}</Alert>
        )}

        {analiseIA && analiseIA.sucesso && (
          <>
            {/* Cards de Insights */}
            {(analiseIA.insights || []).map((ins, idx) => (
              <Card
                key={idx}
                variant="outlined"
                sx={{
                  mb: 1.5,
                  borderLeft: 4,
                  borderColor:
                    ins.tipo === 'error' ? 'error.main' :
                    ins.tipo === 'warning' ? 'warning.main' :
                    ins.tipo === 'success' ? 'success.main' : 'info.main',
                }}
              >
                <CardContent sx={{ pb: '8px !important' }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {ins.icone} {ins.titulo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{ins.texto}</Typography>
                </CardContent>
                {ins.acao && ins.rota && (
                  <CardActions sx={{ pt: 0 }}>
                    <Button size="small" onClick={() => { navigate(ins.rota); setDrawerAberto(false); }}>
                      {ins.acao}
                    </Button>
                  </CardActions>
                )}
              </Card>
            ))}

            <Divider sx={{ my: 2 }} />

            {/* Resumo Markdown completo */}
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Análise completa gerada por IA
            </Typography>
            <Box sx={{ fontSize: 14, lineHeight: 1.7, '& h2,& h3': { mt: 1.5, mb: 0.5 }, '& p': { mb: 1 }, '& ul': { pl: 2 } }}>
              <ReactMarkdown>{analiseIA.resumo_markdown || ''}</ReactMarkdown>
            </Box>
          </>
        )}
      </Drawer>

      {/* Botão Flutuante */}
      <Tooltip title="Assistente de IA" placement="left">
        <Fab
          color="secondary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 104, // Aumentado espaçamento do QR Code (que está em right: 24)
            zIndex: 9999,
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
              transform: 'scale(1.1)',
              transition: 'all 0.2s'
            }
          }}
          onClick={() => {
            console.log('🤖 Botão IA clicado!');
            setAberto(!aberto);
          }}
        >
          {aberto ? <CloseIcon /> : <AIIcon />}
        </Fab>
      </Tooltip>

      {/* Janela de Chat */}
      <Collapse in={aberto}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 24,
            width: 420,
            maxWidth: 'calc(100vw - 48px)',
            height: 600,
            maxHeight: 'calc(100vh - 200px)',
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BrainIcon />
              <Box>
                <Typography variant="h6">Assistente IA</Typography>
                <Typography variant="caption">
                  {aiDisponivel === null ? 'Verificando...' : 
                   aiDisponivel ? 'Online' : 'Offline'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              {(gerandoAudio || falando) && (
                <Tooltip title={gerandoAudio ? 'Gerando áudio...' : 'Parar fala'}>
                  <IconButton size="small" onClick={pararFala} sx={{ color: 'warning.light' }}>
                    {gerandoAudio
                      ? <CircularProgress size={16} sx={{ color: 'warning.light' }} />
                      : <StopCircleIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={audioAtivado ? 'Desativar resposta em áudio' : 'Ativar resposta em áudio'}>
                <IconButton
                  size="small"
                  onClick={() => { if (falando) pararFala(); setAudioAtivado(v => !v); }}
                  sx={{ color: audioAtivado ? 'warning.light' : 'inherit' }}
                >
                  {audioAtivado ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Limpar conversas">
                <IconButton size="small" onClick={limparConversa} sx={{ color: 'inherit' }}>
                  <DeleteSweepIcon />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => setAberto(false)} sx={{ color: 'inherit' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Área de Mensagens */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              bgcolor: 'grey.50'
            }}
          >
            {mensagens.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <BrainIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Olá! Sou seu assistente inteligente
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Pergunte sobre vendas, estoque, financeiro e mais!
                </Typography>
                
                <Divider sx={{ my: 2 }}>
                  <Chip label="Sugestões" size="small" />
                </Divider>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  {SUGESTOES_RAPIDAS.map((sugestao, idx) => (
                    <Chip
                      key={idx}
                      icon={sugestao.icon}
                      label={sugestao.texto}
                      onClick={() => enviarMensagem(sugestao.texto)}
                      clickable
                      variant="outlined"
                      sx={{ justifyContent: 'flex-start' }}
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <>
                {mensagens.map((msg, idx) => renderMensagem(msg, idx))}
                {carregando && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      <BrainIcon fontSize="small" />
                    </Avatar>
                    <Paper elevation={1} sx={{ p: 1.5 }}>
                      <CircularProgress size={20} />
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        Analisando...
                      </Typography>
                    </Paper>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </Box>

          {/* Área de Input */}
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
            {erro && (
              <Alert severity="error" sx={{ mb: 1 }} onClose={() => setErro(null)}>
                {erro}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                size="small"
                placeholder={gravando ? '🎤 Ouvindo...' : 'Digite ou fale sua pergunta...'}
                value={inputMensagem}
                onChange={(e) => setInputMensagem(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={carregando || !aiDisponivel}
                multiline
                maxRows={3}
                sx={gravando ? { '& .MuiOutlinedInput-root': { borderColor: 'error.main', bgcolor: 'error.50' } } : {}}
              />
              <Tooltip title={gravando ? 'Parar gravação' : 'Falar pergunta (microfone)'} placement="top">
                <span>
                  <IconButton
                    color={gravando ? 'error' : 'default'}
                    onClick={gravando ? pararGravacao : iniciarGravacao}
                    disabled={carregando || !aiDisponivel}
                    sx={gravando ? { animation: 'pulse 1s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } } } : {}}
                  >
                    {gravando ? <GraphicEqIcon /> : <MicIcon />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Enviar" placement="top">
                <span>
                  <IconButton
                    color="primary"
                    onClick={() => enviarMensagem()}
                    disabled={!inputMensagem.trim() || carregando || !aiDisponivel}
                  >
                    <SendIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
};

export default AIChat;
