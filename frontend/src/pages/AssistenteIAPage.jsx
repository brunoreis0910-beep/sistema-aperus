import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, IconButton, Typography, TextField, Avatar,
  CircularProgress, Alert, Tooltip, Button
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as BrainIcon,
  Delete as DeleteIcon,
  VolumeUp as VolumeUpIcon,
  Mic as MicIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { API_ENDPOINT } from '../config/api';

const API_BASE_URL = API_ENDPOINT;

const SUGESTOES = [
  'Qual foi o faturamento do mês atual?',
  'Quais produtos têm estoque baixo?',
  'Mostre os clientes inadimplentes',
  'Como está o fluxo de caixa?'
];

export default function AssistenteIAPage() {
  const navigate = useNavigate();
  const [mensagens, setMensagens] = useState([]);
  const [inputMensagem, setInputMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [aiDisponivel, setAiDisponivel] = useState(null);
  const [erro, setErro] = useState(null);
  const [gravando, setGravando] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    verificarStatusIA();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const verificarStatusIA = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/ai/status/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiDisponivel(response.data.disponivel);
    } catch {
      setAiDisponivel(false);
    }
  };

  const enviarMensagem = async (texto = null) => {
    const msg = texto || inputMensagem.trim();
    if (!msg) return;

    const novaMensagemUsuario = { tipo: 'usuario', conteudo: msg, timestamp: new Date() };
    setMensagens(prev => [...prev, novaMensagemUsuario]);
    setInputMensagem('');
    setCarregando(true);
    setErro(null);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/ai/chat/`,
        { mensagem: msg },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.sucesso) {
        setMensagens(prev => [...prev, {
          tipo: 'ia',
          conteudo: response.data.resposta,
          dados: response.data.dados,
          acaoNavegar: response.data.acao_navegar || null,
          timestamp: new Date()
        }]);
      } else {
        setErro(response.data.mensagem || 'Erro ao processar mensagem');
      }
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro ao comunicar com IA');
    } finally {
      setCarregando(false);
    }
  };

  const iniciarVoz = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setErro('Reconhecimento de voz não suportado neste navegador.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setGravando(true);
    recognition.onend = () => setGravando(false);
    recognition.onerror = (e) => { setGravando(false); if (e.error !== 'no-speech') setErro('Erro no microfone: ' + e.error); };
    recognition.onresult = (e) => enviarMensagem(e.results[0][0].transcript);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const pararVoz = () => { recognitionRef.current?.stop(); setGravando(false); };

  const renderMensagem = (msg, index) => {
    const isUsuario = msg.tipo === 'usuario';
    return (
      <Box key={index} sx={{ display: 'flex', justifyContent: isUsuario ? 'flex-end' : 'flex-start', mb: 2, gap: 1 }}>
        {!isUsuario && (
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            <BrainIcon fontSize="small" />
          </Avatar>
        )}
        <Paper elevation={2} sx={{
          p: 2, maxWidth: '75%',
          bgcolor: isUsuario ? 'primary.main' : 'background.paper',
          color: isUsuario ? 'primary.contrastText' : 'text.primary',
          borderRadius: isUsuario ? '16px 16px 4px 16px' : '16px 16px 16px 4px'
        }}>
          {isUsuario ? (
            <Typography variant="body1">{msg.conteudo}</Typography>
          ) : (
            <Box sx={{ '& p': { mb: 1 }, '& ul': { pl: 2 }, '& li': { mb: 0.5 } }}>
              <ReactMarkdown>{msg.conteudo}</ReactMarkdown>
              {msg.acaoNavegar && (
                <Button variant="contained" size="small" sx={{ mt: 1, textTransform: 'none' }}
                  onClick={() => navigate(msg.acaoNavegar.rota)}>
                  {msg.acaoNavegar.label}
                </Button>
              )}
            </Box>
          )}
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.6, fontSize: '0.65rem' }}>
            {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Paper>
        {isUsuario && (
          <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
            <Typography variant="caption" fontWeight="bold">Eu</Typography>
          </Avatar>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', p: 2, gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 42, height: 42 }}>
            <BrainIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">Assistente IA</Typography>
            <Typography variant="caption" color={aiDisponivel ? 'success.main' : aiDisponivel === false ? 'error.main' : 'text.secondary'}>
              {aiDisponivel === null ? 'Verificando...' : aiDisponivel ? '● Online' : '● Offline'}
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Limpar conversa">
          <IconButton onClick={() => { if (window.confirm('Limpar histórico?')) setMensagens([]); }}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {aiDisponivel === false && (
        <Alert severity="warning">IA não configurada. Configure GEMINI_API_KEY no servidor.</Alert>
      )}

      {/* Área de mensagens */}
      <Paper elevation={1} sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
        {mensagens.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <BrainIcon sx={{ fontSize: 64, color: 'primary.light', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>Olá! Como posso ajudar?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Pergunte sobre vendas, estoque, financeiro e muito mais.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {SUGESTOES.map((s, i) => (
                <Button key={i} variant="outlined" size="small" sx={{ textTransform: 'none', borderRadius: 3 }}
                  onClick={() => enviarMensagem(s)}>
                  {s}
                </Button>
              ))}
            </Box>
          </Box>
        )}
        {mensagens.map(renderMensagem)}
        {carregando && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 1, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              <BrainIcon fontSize="small" />
            </Avatar>
            <Paper elevation={1} sx={{ p: 1.5, borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <CircularProgress size={12} />&nbsp;
              <Typography variant="body2" color="text.secondary">Processando...</Typography>
            </Paper>
          </Box>
        )}
        {erro && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setErro(null)}>{erro}</Alert>}
        <div ref={messagesEndRef} />
      </Paper>

      {/* Input */}
      <Paper elevation={2} sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Digite sua pergunta..."
          value={inputMensagem}
          onChange={(e) => setInputMensagem(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem(); } }}
          disabled={carregando}
          variant="outlined"
          size="small"
        />
        <Tooltip title={gravando ? 'Parar gravação' : 'Falar'}>
          <IconButton color={gravando ? 'error' : 'default'} onClick={gravando ? pararVoz : iniciarVoz}>
            {gravando ? <StopIcon /> : <MicIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Enviar">
          <span>
            <IconButton color="primary" onClick={() => enviarMensagem()} disabled={carregando || !inputMensagem.trim()}>
              <SendIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Paper>
    </Box>
  );
}
