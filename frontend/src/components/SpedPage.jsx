import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Download as DownloadIcon, Save as SaveIcon, Email as EmailIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const SpedPage = () => {
  const { axiosInstance } = useAuth();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [diretorio, setDiretorio] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [versao, setVersao] = useState('020');
  const [conjuntos, setConjuntos] = useState([]);
  const [conjuntosSelecionados, setConjuntosSelecionados] = useState([]);
  const [blocos, setBlocos] = useState({
    C: true,
    D: false,
    E: true,
    G: false,
    H: false,
    K: false
  });
  const [exportarXml, setExportarXml] = useState(true);
  const [gerarRelatorio, setGerarRelatorio] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [contadorEmail, setContadorEmail] = useState('');
  const [contadorNome, setContadorNome] = useState('');
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [spedFilepath, setSpedFilepath] = useState('');
  const [spedPeriodo, setSpedPeriodo] = useState('');

  useEffect(() => {
    console.log('⚡ useEffect inicial executando - vai chamar carregarDados()');
    carregarDados();
  }, []);

  useEffect(() => {
    console.log('🔄 Estado conjuntosSelecionados mudou:', conjuntosSelecionados);
  }, [conjuntosSelecionados]);

  useEffect(() => {
    // Calcular mês anterior
    const hoje = new Date();
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    
    const formatarData = (data) => {
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    };
    
    setDataInicio(formatarData(mesAnterior));
    setDataFim(formatarData(ultimoDiaMesAnterior));
  }, []);

  const carregarDados = async () => {
    console.log('🚀 INÍCIO carregarDados()');
    try {
      setLoading(true);
      console.log('🔄 Loading definido como true');
      
      // Carregar configurações da empresa
      console.log('📡 Fazendo requisição para /api/empresa/');
      const configResponse = await axiosInstance.get('/empresa/');
      console.log('🌐 Resposta da API /empresa/:', configResponse.data);
      
      // Normalizar resposta (array direto ou paginado)
      let empresas = [];
      if (Array.isArray(configResponse.data)) {
        empresas = configResponse.data;
      } else if (configResponse.data?.results && Array.isArray(configResponse.data.results)) {
        empresas = configResponse.data.results;
      } else if (configResponse.data?.id_empresa) {
        empresas = [configResponse.data];
      }
      // Pegar o registro mais recente (maior id_empresa), mesma lógica do EmpresaConfig.jsx
      empresas = [...empresas].sort((a, b) => b.id_empresa - a.id_empresa);

      if (empresas.length > 0) {
        const cfg = empresas[0];
        console.log('🔍 Configuração carregada:', cfg);
        console.log('📦 Campo sped_conjuntos_selecionados:', cfg.sped_conjuntos_selecionados);
        console.log('📦 Tipo do campo:', typeof cfg.sped_conjuntos_selecionados);
        console.log('📦 Valor raw:', JSON.stringify(cfg.sped_conjuntos_selecionados));
        
        setConfig(cfg);
        setDiretorio(cfg.sped_diretorio_saida || 'C:\\SPED\\');
        setContadorEmail(cfg.contador_email || '');
        setContadorNome(cfg.contador_nome || '');
        
        // Se houver conjuntos salvos, define como selecionados
        if (cfg.sped_conjuntos_selecionados) {
          console.log('✅ Tem conjuntos! Processando...');
          const ids = cfg.sped_conjuntos_selecionados.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
          console.log('✅ IDs de conjuntos processados:', ids);
          console.log('✅ Quantidade:', ids.length);
          setConjuntosSelecionados(ids);
        } else {
          console.log('⚠️ Campo sped_conjuntos_selecionados está vazio/null/undefined');
          console.log('⚠️ Valor booleano:', !!cfg.sped_conjuntos_selecionados);
        }
        
        // Carregar blocos salvos
        setBlocos({
          C: cfg.sped_gerar_bloco_c ?? true,
          D: cfg.sped_gerar_bloco_d ?? false,
          E: cfg.sped_gerar_bloco_e ?? true,
          G: cfg.sped_gerar_bloco_g ?? false,
          H: cfg.sped_gerar_bloco_h ?? false,
          K: cfg.sped_gerar_bloco_k ?? false
        });
      }
      
      // Carregar conjuntos de operação
      console.log('📡 Fazendo requisição para /api/conjuntos-operacoes/');
      const conjuntosResponse = await axiosInstance.get('/conjuntos-operacoes/');
      console.log('📋 Conjuntos carregados:', conjuntosResponse.data);
      const conjuntosData = conjuntosResponse.data;
      const conjuntosLista = Array.isArray(conjuntosData) ? conjuntosData : (conjuntosData?.results || []);
      setConjuntos(conjuntosLista);
      
      // Se nenhum conjunto foi salvo nas configs, selecionar todos disponíveis
      if (conjuntosLista.length > 0) {
        setConjuntosSelecionados(prev => {
          if (prev.length === 0) {
            const todosIds = conjuntosLista.map(c => c.id_conjunto);
            console.log('✅ Nenhum conjunto salvo — selecionando todos:', todosIds);
            return todosIds;
          }
          return prev;
        });
      }
      console.log('✅ carregarDados() concluído com sucesso');
      
    } catch (err) {
      console.error('❌ ERRO ao carregar dados:', err);
      console.error('❌ Mensagem:', err.message);
      console.error('❌ Stack:', err.stack);
      if (err.response) {
        console.error('❌ Response data:', err.response.data);
        console.error('❌ Response status:', err.response.status);
      }
      setError('Erro ao carregar configurações');
    } finally {
      console.log('🏁 carregarDados() finally - definindo loading = false');
      setLoading(false);
    }
  };

  const handleBlocoChange = (bloco) => {
    setBlocos(prev => ({
      ...prev,
      [bloco]: !prev[bloco]
    }));
  };

  const gerarSped = async () => {
    setError('');
    setSuccess('');
    
    if (!diretorio || diretorio.trim() === '') {
      setError('⚠️ Informe o diretório onde o arquivo será salvo');
      return;
    }
    if (!dataInicio || !dataFim) {
      setError('Preencha as datas de início e fim');
      return;
    }
    // Usa todos os conjuntos disponíveis se nenhum foi salvo explicitamente nas configurações
    const conjuntosParaUsar = conjuntosSelecionados.length > 0
      ? conjuntosSelecionados
      : conjuntos.map(c => c.id_conjunto);
    if (conjuntosParaUsar.length === 0) {
      setError('❌ Nenhum conjunto de operação disponível. Cadastre conjuntos em: Documentos Fiscais → Conjunto de Operação');
      return;
    }
    const blocosSelecionados = Object.keys(blocos).filter(key => blocos[key]);
    if (blocosSelecionados.length === 0) {
      setError('Selecione pelo menos um bloco para gerar');
      return;
    }
    try {
      setLoading(true);
      const response = await axiosInstance.post('/sped/gerar/', {
        versao,
        conjuntos: conjuntosParaUsar,
        blocos: blocosSelecionados,
        data_inicio: dataInicio,
        data_fim: dataFim,
        diretorio,
        exportar_xml: exportarXml,
        gerar_relatorio: gerarRelatorio
      });
      if (response.data && response.data.success) {
        let msg = `✅ ${response.data.message}\n📁 Salvo em: ${response.data.filepath}`;
        if (response.data.xml_export) {
          const x = response.data.xml_export;
          msg += `\n\n📦 XMLs: Total ${x.total}${x.nfe > 0 ? ` | NFe ${x.nfe}` : ''}${x.nfce > 0 ? ` | NFCe ${x.nfce}` : ''}${x.cte > 0 ? ` | CTe ${x.cte}` : ''}`;
        }
        if (response.data.relatorio?.success) msg += `\n📊 Relatório: ${response.data.relatorio.filepath}`;
        setSuccess(msg);
        const filepath = response.data.filepath || '';
        setSpedFilepath(filepath);
        setSpedPeriodo(`${dataInicio} a ${dataFim}`);
        await salvarConfig(conjuntosParaUsar);
        if (contadorEmail) {
          setOpenEmailDialog(true);
        }
      } else {
        setSuccess('Arquivo SPED gerado com sucesso!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao gerar arquivo SPED');
    } finally {
      setLoading(false);
    }
  };

  const salvarConfig = async (conjuntosOverride) => {
    if (!diretorio || diretorio.trim() === '') {
      setError('Informe o diretório de saída.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const blocosSelecionados = Object.keys(blocos).filter(k => blocos[k]);
      const conjuntosParaSalvar = conjuntosOverride || conjuntosSelecionados;
      await axiosInstance.post('/sped/salvar-config/', {
        conjuntos: conjuntosParaSalvar,
        diretorio: diretorio,
        blocos: blocosSelecionados,
        exportar_xml: exportarXml,
        gerar_relatorio: gerarRelatorio,
        versao: versao,
      });
      setSuccess('Configurações salvas com sucesso!');
    } catch (err) {
      setError('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  const enviarEmailContador = async () => {
    setEnviandoEmail(true);
    try {
      const resp = await axiosInstance.post('/sped/enviar-email/', {
        filepath: spedFilepath,
        email: contadorEmail,
        periodo: spedPeriodo,
        contador_nome: contadorNome,
      });
      if (resp.data.success) {
        setSuccess(prev => prev + `\n📧 E-mail enviado com sucesso para ${contadorEmail}`);
      } else {
        setError('Erro ao enviar e-mail: ' + resp.data.error);
      }
    } catch (err) {
      setError('Erro ao enviar e-mail: ' + (err.response?.data?.error || err.message));
    } finally {
      setEnviandoEmail(false);
      setOpenEmailDialog(false);
    }
  };

  if (loading && !config) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📊 SPED Fiscal (EFD ICMS/IPI)
      </Typography>
      
      {conjuntos.length === 0 && !loading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⚠️ Nenhum conjunto cadastrado. Crie em: <strong>Documentos Fiscais → Conjunto de Operação</strong>
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, whiteSpace: 'pre-line' }} onClose={() => setSuccess('')}>{success}</Alert>}
      
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Período */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Data Início"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Primeiro dia do período"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Data Fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Último dia do período"
            />
          </Grid>

          {/* Versão */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Versão do Layout</InputLabel>
              <Select
                value={versao}
                label="Versão do Layout"
                onChange={(e) => setVersao(e.target.value)}
              >
                <MenuItem value="020">020 (Atual)</MenuItem>
                <MenuItem value="019">019</MenuItem>
                <MenuItem value="018">018</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Diretório */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="📁 Diretório de Saída (arquivo será salvo aqui)"
              value={diretorio}
              onChange={(e) => setDiretorio(e.target.value)}
              placeholder="Ex: C:\SPED\"
              helperText="O arquivo SPED será salvo neste diretório no servidor"
              required
            />
          </Grid>
          
          {/* Conjuntos de Operação - Somente Leitura */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                📋 Conjuntos de Operação (configurados em Documentos Fiscais):
              </Typography>
              {(() => {
                // Mostra os explicitamente selecionados; se nenhum, mostra todos disponíveis
                const conjuntosParaExibir = conjuntosSelecionados.length > 0
                  ? conjuntos.filter(c => conjuntosSelecionados.includes(c.id_conjunto))
                  : conjuntos;
                return conjuntosParaExibir.length > 0 ? (
                  <Box>
                    {conjuntosSelecionados.length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        (Todos os conjuntos disponíveis serão utilizados)
                      </Typography>
                    )}
                    {conjuntosParaExibir.map(conjunto => (
                      <Box key={conjunto.id_conjunto} sx={{ mb: 1 }}>
                        <Typography variant="body2" color="primary" fontWeight="bold">
                          ✓ {conjunto.nome_conjunto}
                        </Typography>
                        {conjunto.operacoes && conjunto.operacoes.length > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                            Operações: {conjunto.operacoes.map(op => `${op.id_operacao}-${op.nome_operacao}`).join(', ')}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Nenhum conjunto cadastrado. Crie em: <strong>Documentos Fiscais → Conjunto de Operação</strong>
                  </Alert>
                );
              })()}
            </Paper>
          </Grid>
          
          {/* Blocos */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Blocos a Gerar:
            </Typography>
            <FormGroup row>
              <FormControlLabel
                control={<Checkbox checked={blocos.C} onChange={() => handleBlocoChange('C')} />}
                label="Bloco C (Documentos Fiscais)"
              />
              <FormControlLabel
                control={<Checkbox checked={blocos.D} onChange={() => handleBlocoChange('D')} />}
                label="Bloco D (Serviços)"
              />
              <FormControlLabel
                control={<Checkbox checked={blocos.E} onChange={() => handleBlocoChange('E')} />}
                label="Bloco E (Apuração ICMS/IPI)"
              />
              <FormControlLabel
                control={<Checkbox checked={blocos.G} onChange={() => handleBlocoChange('G')} />}
                label="Bloco G (CIAP)"
              />
              <FormControlLabel
                control={<Checkbox checked={blocos.H} onChange={() => handleBlocoChange('H')} />}
                label="Bloco H (Inventário)"
              />
              <FormControlLabel
                control={<Checkbox checked={blocos.K} onChange={() => handleBlocoChange('K')} />}
                label="Bloco K (Estoque/Produção)"
              />
            </FormGroup>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 Os blocos selecionados serão salvos automaticamente ao gerar o SPED
            </Typography>
          </Grid>
          
          {/* Opções de Exportação */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              📦 Opções Adicionais:
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={exportarXml} 
                    onChange={(e) => setExportarXml(e.target.checked)} 
                    color="primary"
                  />
                }
                label="📄 Exportar XMLs dos documentos (separados por tipo: NFe, NFCe, CTe)"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={gerarRelatorio} 
                    onChange={(e) => setGerarRelatorio(e.target.checked)}
                    color="primary"
                  />
                }
                label="📊 Gerar Relatório PDF (agrupado por CFOP, CST, PIS, COFINS, IPI)"
              />
            </FormGroup>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 Os arquivos serão salvos no mesmo diretório especificado acima
            </Typography>
          </Grid>
          
          {/* Botões */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={salvarConfig}
                disabled={loading}
              >
                Salvar Configurações
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{ flex: 1 }}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                onClick={gerarSped}
                disabled={loading}
              >
                {loading ? 'Gerando SPED...' : 'Gerar Arquivo SPED'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>📋 Importante:</strong><br/>
            • O arquivo será salvo no diretório especificado<br/>
            • Arquivo gerado deve ser validado no PVA (Programa Validador e Assinador) da Receita Federal<br/>
            • Suas configurações (conjuntos e blocos) são salvas automaticamente
          </Typography>
        </Alert>
      </Box>

      {/* Dialog: enviar SPED por e-mail ao contador */}
      <Dialog open={openEmailDialog} onClose={() => setOpenEmailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📧 Enviar SPED ao Contador?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Deseja enviar o arquivo SPED por e-mail para o contador?
          </Typography>
          <Typography sx={{ fontWeight: 'bold', mt: 1 }}>
            📧 {contadorEmail}
          </Typography>
          {contadorNome && (
            <Typography variant="body2" color="text.secondary">
              {contadorNome}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            📁 Arquivo: {spedFilepath}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmailDialog(false)} disabled={enviandoEmail}>
            Fechar
          </Button>
          <Button
            variant="contained"
            onClick={enviarEmailContador}
            disabled={enviandoEmail}
            startIcon={enviandoEmail ? <CircularProgress size={16} color="inherit" /> : <EmailIcon />}
          >
            {enviandoEmail ? 'Enviando...' : 'Enviar E-mail'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SpedPage;
