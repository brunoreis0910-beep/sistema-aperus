import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Autocomplete,
  Divider,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

const SpedContribuicoesPage = () => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [conjuntosSelecionados, setConjuntosSelecionados] = useState([]);
  const [conjuntosDisponiveis, setConjuntosDisponiveis] = useState([]);
  const [diretorio, setDiretorio] = useState('C:\\SPED\\CONTRIBUICOES\\');
  const [versao, setVersao] = useState('135'); // Versão 1.35
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [config, setConfig] = useState(null);
  
  // Blocos a gerar
  const [blocos, setBlocos] = useState({
    A: false,  // Documentos Fiscais - Serviços (ISS)
    C: true,   // Documentos Fiscais I - Mercadorias
    D: false,  // Documentos Fiscais II - Serviços (ICMS)
    F: false,  // Demais Documentos e Operações
    M: true,   // Apuração da Contribuição
    '1': false // Complemento da Escrituração
  });
  
  // Opções de exportação
  const [exportarXml, setExportarXml] = useState(false);
  const [gerarRelatorio, setGerarRelatorio] = useState(false);
  
  // Regime de apuração
  const [regimeApuracao, setRegimeApuracao] = useState('2');
  const [regimeCredito, setRegimeCredito] = useState('1');
  const [estatisticas, setEstatisticas] = useState(null);

  // Carregar configurações e conjuntos ao montar o componente
  useEffect(() => {
    carregarEmpresaConfig();
    carregarConjuntos();
    carregarConfig();
  }, []);

  const carregarEmpresaConfig  = async () => {
    try {
      const response = await axios.get('/api/empresa-config/');
      if (response.data && response.data.length > 0) {
        setConfig(response.data[0]);
      }
    } catch (err) {
      console.error('Erro carregando configuração:', err);
    }
  };

  const carregarConjuntos = async () => {
    try {
      const response = await axios.get('/api/conjuntos-operacoes/');
      const data = response.data;
      setConjuntosDisponiveis(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (err) {
      console.error('Erro carregando conjuntos:', err);
      setConjuntosDisponiveis([]);
    }
  };

  const carregarConfig = async () => {
    try {
      const response = await axios.get('/api/sped-contribuicoes/carregar-config/');
      const cfg = response.data;
      
      // Carregar conjuntos salvos
      if (cfg.conjuntos && cfg.conjuntos.length > 0) {
        setConjuntosSelecionados(cfg.conjuntos);
      }
      
      // Carregar diretório
      setDiretorio(cfg.diretorio || 'C:\\SPED\\CONTRIBUICOES\\');
      
      // Carregar blocos
      if (cfg.blocos && cfg.blocos.length > 0) {
        const blocosSalvos = {};
        cfg.blocos.forEach(b => {
          blocosSalvos[b] = true;
        });
        setBlocos(prev => ({ ...prev, ...blocosSalvos }));
      }
      
      // Carregar regimes
      setRegimeApuracao(cfg.regime_apuracao || '2');
      setRegimeCredito(cfg.regime_credito || '1');
      
    } catch (err) {
      console.error('Erro carregando configurações:', err);
    }
  };

  const salvarConfig = async () => {
    try {
      // Preparar blocos selecionados
      const blocosSelecionados = Object.keys(blocos).filter(b => blocos[b]);
      
      await axios.post('/api/sped-contribuicoes/salvar-config/', {
        conjuntos: conjuntosSelecionados,
        diretorio: diretorio,
        blocos: blocosSelecionados,
        regime_apuracao: regimeApuracao,
        regime_credito: regimeCredito
      });
      
      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro salvando configurações:', err);
      setError('Erro ao salvar configurações');
      setTimeout(() => setError(''), 3000);
    }
  };

  const gerarSped = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setEstatisticas(null);

    if (!dataInicio || !dataFim) {
      setError('Preencha as datas de início e fim');
      setLoading(false);
      return;
    }
    if (conjuntosSelecionados.length === 0) {
      setError('Selecione pelo menos um conjunto de operações');
      setLoading(false);
      return;
    }

    try {
      const blocosSelecionados = Object.keys(blocos).filter(b => blocos[b]);
      const response = await axios.post('/api/sped-contribuicoes/gerar/', {
        data_inicio: dataInicio,
        data_fim: dataFim,
        conjuntos: conjuntosSelecionados,
        versao,
        diretorio,
        blocos: blocosSelecionados,
        exportar_xml: exportarXml,
        gerar_relatorio: gerarRelatorio
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        if (response.data.estatisticas) setEstatisticas(response.data.estatisticas);
        await salvarConfig();
      } else {
        setError(response.data.error || 'Erro desconhecido');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao gerar arquivo SPED Contribuições');
    } finally {
      setLoading(false);
    }
  };

  const handleBlocoChange = (bloco) => {
    setBlocos(prev => ({ ...prev, [bloco]: !prev[bloco] }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon fontSize="large" />
          📊 SPED Contribuições (EFD-Contribuições - PIS/COFINS)
        </Typography>

        {config?.sped_contrib_conjuntos && (
          <Alert severity="info" sx={{ mb: 2 }}>
            ✅ Configurações salvas anteriormente encontradas
          </Alert>
        )}

        {!config?.sped_contrib_conjuntos && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ Nenhuma configuração salva - Configure e salve abaixo
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Período */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Data Início"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Data Fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </Grid>

          {/* Conjuntos de Operações */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={conjuntosDisponiveis}
              getOptionLabel={(option) => `${option.id_conjunto} - ${option.nome_conjunto}`}
              value={conjuntosDisponiveis.filter(c => conjuntosSelecionados.includes(c.id_conjunto))}
              onChange={(event, newValue) => {
                setConjuntosSelecionados(newValue.map(c => c.id_conjunto));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Conjuntos de Operações"
                  placeholder="Selecione os conjuntos"
                  helperText="Selecione quais conjuntos de operações incluir no SPED Contribuições"
                  size="small"
                />
              )}
            />
          </Grid>

          {/* Diretório */}
          <Grid item xs={12}>
            <TextField
              label="Diretório de Saída"
              value={diretorio}
              onChange={(e) => setDiretorio(e.target.value)}
              fullWidth
              size="small"
              placeholder="Ex: C:\\SPED\\CONTRIBUICOES\\"
              helperText="O arquivo SPED Contribuições será salvo neste diretório no servidor"
            />
          </Grid>

          {/* Regimes */}
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Regime de Apuração PIS/COFINS</FormLabel>
              <RadioGroup
                value={regimeApuracao}
                onChange={(e) => setRegimeApuracao(e.target.value)}
              >
                <FormControlLabel value="1" control={<Radio />} label="1 - Regime Cumulativo" />
                <FormControlLabel value="2" control={<Radio />} label="2 - Regime Não-Cumulativo" />
                <FormControlLabel value="3" control={<Radio />} label="3 - Ambos os Regimes" />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Regime de Crédito</FormLabel>
              <RadioGroup
                value={regimeCredito}
                onChange={(e) => setRegimeCredito(e.target.value)}
              >
                <FormControlLabel 
                  value="1" 
                  control={<Radio />} 
                  label="1 - Apuração Consolidada" 
                />
                <FormControlLabel 
                  value="2" 
                  control={<Radio />} 
                  label="2 - Apuração Individualizada" 
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Versão do Layout */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Versão do Layout"
              value={versao}
              onChange={(e) => setVersao(e.target.value)}
              select
              SelectProps={{ native: true }}
              fullWidth
              size="small"
              helperText="Versão do leiaute do SPED Contribuições"
            >
              <option value="135">Versão 1.35 (2024)</option>
              <option value="134">Versão 1.34</option>
              <option value="133">Versão 1.33</option>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              <SettingsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Blocos a Gerar
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Selecione quais blocos incluir no arquivo SPED Contribuições
            </Typography>

            <FormGroup row>
              <FormControlLabel
                control={<Checkbox checked={blocos.A} onChange={() => handleBlocoChange('A')} />}
                label="Bloco A - Serviços (ISS)"
              />
              <FormControlLabel
                control={<Checkbox checked={blocos.C} onChange={() => handleBlocoChange('C')} />}
                label="Bloco C - Mercadorias (ICMS/IPI)"
              />
              <FormControlLabel
                control={<Checkbox checked={blocos.D} onChange={() => handleBlocoChange('D')} />}
                label="Bloco D - Serviços (ICMS)"
              />
              <FormControlLabel
                control={<Checkbox checked={blocos.F} onChange={() => handleBlocoChange('F')} />}
                label="Bloco F - Demais Documentos"
              />
              <FormControlLabel
                control={<Checkbox checked={blocos.M} onChange={() => handleBlocoChange('M')} />}
                label="Bloco M - Apuração"
              />
              <FormControlLabel
                control={<Checkbox checked={blocos['1']} onChange={() => handleBlocoChange('1')} />}
                label="Bloco 1 - Complemento"
              />
            </FormGroup>

            <Alert severity="info" sx={{ mt: 2 }}>
              💡 Os blocos selecionados serão salvos automaticamente ao gerar o SPED
            </Alert>
          </Grid>

          {/* Opções Adicionais */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Opções Adicionais
            </Typography>

            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportarXml}
                    onChange={(e) => setExportarXml(e.target.checked)}
                  />
                }
                label="Exportar XMLs das Notas Fiscais junto com o SPED"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={gerarRelatorio}
                    onChange={(e) => setGerarRelatorio(e.target.checked)}
                  />
                }
                label="Gerar Relatório PDF Consolidado"
              />
            </FormGroup>
          </Grid>

          {/* Botões de Ação */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={salvarConfig}
                disabled={loading}
              >
                Salvar Configurações
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                onClick={gerarSped}
                disabled={loading}
              >
                {loading ? 'Gerando SPED Contribuições...' : 'Gerar SPED Contribuições'}
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Estatísticas */}
        {estatisticas && (
          <Card sx={{ mt: 3, bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>📊 Estatísticas da Geração</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Total de Vendas</Typography>
                  <Typography variant="h6">{estatisticas.total_vendas}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Base Cálculo PIS</Typography>
                  <Typography variant="h6">R$ {estatisticas.total_bc_pis?.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Total PIS</Typography>
                  <Typography variant="h6">R$ {estatisticas.total_pis?.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Total COFINS</Typography>
                  <Typography variant="h6">R$ {estatisticas.total_cofins?.toFixed(2)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Informações */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>📋 Sobre o SPED Contribuições (EFD-Contribuições):</strong>
            <br />
            • Escrituração Fiscal Digital da Contribuição para o PIS/Pasep e da Cofins
            <br />
            • Obrigatório para pessoas jurídicas de direito privado na escrituração da Contribuição para o PIS/Pasep e da Cofins
            <br />
            • Layout baseado na versão 1.35 (válido desde 01/01/2024)
            <br />
            • O arquivo gerado deve ser validado no PVA (Programa Validador e Assinador) da Receita Federal
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
};

export default SpedContribuicoesPage;
