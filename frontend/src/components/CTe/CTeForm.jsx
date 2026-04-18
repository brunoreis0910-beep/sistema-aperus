import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, Button, MenuItem, 
  Stepper, Step, StepLabel, Divider, CircularProgress, 
  Autocomplete, IconButton, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, InputAdornment,
  Card, CardContent, Alert, Collapse,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { 
    Save as SaveIcon, 
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Search as SearchIcon,
    CheckCircle as CheckCircleIcon,
    Clear as ClearIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import VeiculoDialog from '../VeiculoDialog';

// Steps definition
const STEPS = [
    'Dados Gerais',
    'Atores do Frete',
    'Transporte & Rota',
    'Carga',
    'Valores & Impostos',
    'Notas Fiscais',
    'Observações'
];

const CTeForm = ({ onClose, onSaveSuccess }) => {
    const { axiosInstance } = useAuth();
    const { showToast } = useToast();
    const [activeStep, setActiveStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [errorList, setErrorList] = useState([]); // List of validation errors
    
    // Dropdown Data
    const [clientes, setClientes] = useState([]);
    const [operacoes, setOperacoes] = useState([]);
    const [veiculosList, setVeiculosList] = useState([]);
    const [motoristasList, setMotoristasList] = useState([]);
    
    // UI States
    const [loadingData, setLoadingData] = useState(false);
    const [openVeiculoDialog, setOpenVeiculoDialog] = useState(false);
    const [openSearchModal, setOpenSearchModal] = useState(false); 
    
    // Search Notas UI
    const [openNotasDialog, setOpenNotasDialog] = useState(false);
    const [notasDisponiveis, setNotasDisponiveis] = useState([]);
    const [loadingNotas, setLoadingNotas] = useState(false);
    
    // Form Data
    const [formData, setFormData] = useState({
        // Step 0: Geral
        cfop: '5353',
        natureza_operacao: 'Transporte Rodoviário de Carga',
        modelo: '57',
        tipo_cte: 0,
        tipo_servico: 0,
        modal: '01',
        data_emissao: new Date().toISOString().split('T')[0],
        
        // Step 1: Atores (IDs)
        remetente: null,
        destinatario: null,
        expedidor: null,
        recebedor: null,
        tomador_servico: 0, 
        tomador_outros: null,

        // Step 2: Transporte
        rntrc: '',
        placa_veiculo: '',
        veiculo_uf: '',
        condutor_nome: '',
        condutor_cpf: '',
        
        cep_origem: '',
        cidade_origem_nome: '',
        cidade_origem_uf: '',
        cep_destino: '',
        cidade_destino_nome: '',
        cidade_destino_uf: '',

        // Step 3: Carga
        produto_predominante: 'Diversos',
        valor_carga: '',
        peso_bruto: '',
        peso_liquido: '',
        volumes: '',

        // Step 4: Valores
        valor_total_servico: '',
        valor_receber: '',
        componente_frete_valor: '',
        componente_frete_peso: '',
        componente_sec_cat: '',
        componente_pedagio: '',
        componente_outros: '',

        // Step 5: Documentos
        documentos: [], // { tipo_documento: 'NFE', chave_nfe: '' }
        
        // Step 6: Obs
        observacoes: ''
    });

    const [newDocKey, setNewDocKey] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoadingData(true);
        try {
            const [reqClientes, reqOperacoes, reqVeiculos, reqMotoristas] = await Promise.all([
                axiosInstance.get('clientes/'),
                axiosInstance.get('operacoes/'),
                axiosInstance.get('veiculos/'),
                axiosInstance.get('vendedores/?funcao=Motorista')
            ]);
            
            setClientes(reqClientes.data.results || reqClientes.data || []);
            setVeiculosList(reqVeiculos.data || []);
            setMotoristasList(reqMotoristas.data.results || reqMotoristas.data || []);
            
            // Filter Operations
            let ops = reqOperacoes.data.results || reqOperacoes.data || [];
            ops = ops.filter(op => ['57', '67'].includes(String(op.modelo_documento)) || !op.modelo_documento);
            setOperacoes(ops);

        } catch (error) {
            console.error("Erro ao carregar dados iniciais:", error);
            showToast('Falha ao carregar dados auxiliares.', 'error');
        } finally {
            setLoadingData(false);
        }
    };

    // --- Actions ---

    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCepBlur = async (e, type) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) return;
        
        try {
            showToast('Buscando CEP...', 'info');
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (!data.erro) {
                if (type === 'origem') {
                    setFormData(prev => ({ ...prev, cidade_origem_nome: data.localidade || '', cidade_origem_uf: data.uf || '' }));
                } else {
                    setFormData(prev => ({ ...prev, cidade_destino_nome: data.localidade || '', cidade_destino_uf: data.uf || '' }));
                }
            } else {
                showToast('CEP não encontrado.', 'warning');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddDocumento = () => {
        if (!newDocKey || newDocKey.length !== 44) {
             showToast('A chave deve ter 44 números.', 'warning');
             return;
        }
        if (formData.documentos.some(d => d.chave_nfe === newDocKey)) {
             showToast('Esta nota já está na lista.', 'warning');
             return;
        }
        setFormData(prev => ({
            ...prev,
            documentos: [...prev.documentos, { tipo_documento: 'NFE', chave_nfe: newDocKey }]
        }));
        setNewDocKey('');
    };

    const handleRemoveDocumento = (chave) => {
        setFormData(prev => ({
            ...prev,
            documentos: prev.documentos.filter(d => d.chave_nfe !== chave)
        }));
    };

    const handleSaveVeiculo = (veiculo) => {
        setVeiculosList(prev => [...prev, veiculo]);
        setFormData(prev => ({ 
            ...prev, 
            placa_veiculo: veiculo.placa, 
            veiculo_uf: veiculo.uf || '',
            rntrc: veiculo.rntrc || prev.rntrc || ''
        })); 
    };

    const handleOpenNotasSearch = async () => {
        setOpenNotasDialog(true);
        setLoadingNotas(true);
        try {
            const res = await axiosInstance.get('ctes/listar_notas_disponiveis/');
            setNotasDisponiveis(res.data);
        } catch (err) {
            console.error(err);
            showToast('Erro ao buscar notas disponíveis.', 'error');
        } finally {
            setLoadingNotas(false);
        }
    };

    const handleSelectNota = (nota) => {
        if (!formData.documentos.some(d => d.chave_nfe === nota.chave)) {
             setFormData(prev => ({
                ...prev,
                documentos: [...prev.documentos, { tipo_documento: 'NFE', chave_nfe: nota.chave }]
            }));
            
            // Auto-fill logic if empty
            // If data is empty, we can try to use NFe data
            // Note: nota object has { peso_bruto, peso_liquido, volumes, valor, ... }
            if (nota.peso_bruto && !formData.peso_bruto) {
                setFormData(prev => ({ 
                    ...prev, 
                    peso_bruto: nota.peso_bruto || '',
                    peso_liquido: nota.peso_liquido || prev.peso_liquido || '',
                    volumes: nota.volumes || prev.volumes || '',
                    valor_carga: nota.valor || prev.valor_carga || ''
                }));
            }
            
            showToast(`Nota ${nota.numero} adicionada!`, 'success');
        } else {
            showToast('Nota já adicionada.', 'warning');
        }
        setOpenNotasDialog(false);
    };

    // --- Submit Logic (Improved) ---

    const handleSubmit = async () => {
        setErrorList([]);
        setSaving(true);
        try {
            // Prepare payload
            const payload = {
                ...formData,
                valor_carga: Number(formData.valor_carga || 0),
                peso_bruto: Number(formData.peso_bruto || 0),
                peso_liquido: Number(formData.peso_liquido || 0),
                volumes: Number(formData.volumes || 0),
                valor_total_servico: Number(formData.valor_total_servico || 0),
                valor_receber: Number(formData.valor_receber || 0),
                componentes_valor: [
                    { nome: "Frete Valor", valor: Number(formData.componente_frete_valor || 0) },
                    { nome: "Frete Peso", valor: Number(formData.componente_frete_peso || 0) },
                    { nome: "Pedágio", valor: Number(formData.componente_pedagio || 0) },
                    { nome: "Sec/Cat", valor: Number(formData.componente_sec_cat || 0) },
                    { nome: "Outros", valor: Number(formData.componente_outros || 0) },
                ].filter(c => c.valor > 0)
            };
            
            // Backend call
            console.log("=== ENVIANDO CTE PARA API ===");
            console.log("URL:", 'ctes/');
            console.log("PAYLOAD:", JSON.stringify(payload));
            
            const response = await axiosInstance.post('ctes/', payload);
            
            console.log("=== RESPOSTA SUCESSO ===");
            showToast('CT-e Emitido com Sucesso!', 'success');
            if (onSaveSuccess) onSaveSuccess(response.data);
            
        } catch (error) {
            console.error("CTe Save Error:", error);
            
            // Extract detailed validation errors
            let messages = [];
            if (error.response && error.response.data) {
                console.log("=== ERRO BACKEND DETALHE ===", error.response.data);
                const data = error.response.data;
                Object.keys(data).forEach(key => {
                    const msg = Array.isArray(data[key]) ? data[key][0] : data[key];
                    messages.push(`${key.toUpperCase()}: ${msg}`);
                });
            } else {
                console.log("=== ERRO GENERICO ===", error);
                messages.push("Ocorreu um erro desconhecido no servidor.");
            }
            
            setErrorList(messages);
            showToast('Erro ao salvar CT-e. Verifique a lista de erros.', 'error');
            
            // Scroll to top to see errors
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSaving(false);
        }
    };

    // --- Render Steps ---

    const renderStep0_Geral = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                <TextField fullWidth type="date" label="Data Emissão" name="data_emissao" value={formData.data_emissao} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={8}>
                <Autocomplete
                    id="natureza-operacao-autocomplete"
                    options={operacoes}
                    getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        return option.nome_operacao || option.nome || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                         if (!value) return false;
                         return option.nome_operacao === value.nome_operacao;
                    }}
                    value={operacoes.find(op => (op.nome_operacao || op.nome) === formData.natureza_operacao) || null}
                    onChange={(e, val) => {
                        if (val) {
                             setFormData(prev => ({
                                 ...prev, 
                                 cfop: val.cfop || prev.cfop, 
                                 natureza_operacao: val.nome_operacao || val.nome || ''
                             }));
                        } else {
                             setFormData(prev => ({...prev, natureza_operacao: ''}));
                        }
                    }}
                    renderInput={(params) => <TextField {...params} label="Natureza da Operação" placeholder="Selecione..." />}
                />
            </Grid>
            <Grid item xs={6} md={3}>
                <TextField fullWidth label="CFOP" name="cfop" value={formData.cfop} onChange={handleChange} />
            </Grid>
             <Grid item xs={6} md={3}>
                <TextField select fullWidth label="Modelo" name="modelo" value={formData.modelo} onChange={handleChange}>
                    <MenuItem value="57">57 (CT-e)</MenuItem>
                    <MenuItem value="67">67 (CT-e OS)</MenuItem>
                </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
                 <TextField select fullWidth label="Tipo CT-e" name="tipo_cte" value={formData.tipo_cte} onChange={handleChange}>
                    <MenuItem value={0}>Normal</MenuItem>
                    <MenuItem value={1}>Complemento</MenuItem>
                    <MenuItem value={2}>Anulação</MenuItem>
                    <MenuItem value={3}>Substituto</MenuItem>
                </TextField>
            </Grid>
        </Grid>
    );

    const renderStep1_Atores = () => (
        <Grid container spacing={3}>
             {/* Remetente */}
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom color="primary">Remetente *</Typography>
                <Autocomplete
                    id="remetente-autocomplete"
                    options={clientes}
                    getOptionLabel={(option) => option.nome || option.nome_razao_social || ''}
                    isOptionEqualToValue={(option, value) => (option.id_cliente || option.id) === (value.id_cliente || value.id)}
                    value={clientes.find(c => (c.id_cliente || c.id) === formData.remetente) || null}
                    onChange={(e, val) => setFormData(prev => ({...prev, remetente: val ? (val.id_cliente || val.id) : null}))}
                    renderInput={(params) => <TextField {...params} placeholder="Pesquisar..." variant="outlined" />}
                />
            </Grid>
            {/* Destinatario */}
            <Grid item xs={12} md={6}>
                 <Typography variant="subtitle2" gutterBottom color="primary">Destinatário *</Typography>
                <Autocomplete
                    id="destinatario-autocomplete"
                    options={clientes}
                    getOptionLabel={(option) => option.nome || option.nome_razao_social || ''}
                    isOptionEqualToValue={(option, value) => (option.id_cliente || option.id) === (value.id_cliente || value.id)}
                    value={clientes.find(c => (c.id_cliente || c.id) === formData.destinatario) || null}
                    onChange={(e, val) => setFormData(prev => ({...prev, destinatario: val ? (val.id_cliente || val.id) : null}))}
                    renderInput={(params) => <TextField {...params} placeholder="Pesquisar..." variant="outlined" />}
                />
            </Grid>
            
            <Grid item xs={12}><Divider /></Grid>

            {/* Opcionais */}
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Expedidor (Redespacho)</Typography>
                 <Autocomplete
                    id="expedidor-autocomplete"
                    options={clientes}
                    getOptionLabel={(option) => option.nome || option.nome_razao_social || ''}
                    isOptionEqualToValue={(option, value) => (option.id_cliente || option.id) === (value.id_cliente || value.id)}
                    value={clientes.find(c => (c.id_cliente || c.id) === formData.expedidor) || null}
                    onChange={(e, val) => setFormData(prev => ({...prev, expedidor: val ? (val.id_cliente || val.id) : null}))}
                    renderInput={(params) => <TextField {...params} size="small" />}
                />
            </Grid>
             <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Recebedor (Redespacho)</Typography>
                 <Autocomplete
                    id="recebedor-autocomplete"
                    options={clientes}
                    getOptionLabel={(option) => option.nome || option.nome_razao_social || ''}
                    isOptionEqualToValue={(option, value) => (option.id_cliente || option.id) === (value.id_cliente || value.id)}
                    value={clientes.find(c => (c.id_cliente || c.id) === formData.recebedor) || null}
                    onChange={(e, val) => setFormData(prev => ({...prev, recebedor: val ? (val.id_cliente || val.id) : null}))}
                    renderInput={(params) => <TextField {...params} size="small" />}
                />
            </Grid>
            
             <Grid item xs={12} md={4}>
                 <TextField select fullWidth label="Tomador do Serviço" name="tomador_servico" value={formData.tomador_servico} onChange={handleChange} helperText="Quem paga o frete?">
                    <MenuItem value={0}>Remetente</MenuItem>
                    <MenuItem value={3}>Destinatário</MenuItem>
                    <MenuItem value={4}>Outros</MenuItem>
                </TextField>
            </Grid>
             {/* Tomador Outros */}
             {formData.tomador_servico === 4 && (
                <Grid item xs={12} md={8}>
                    <Typography variant="caption" color="error">Selecione o Tomador Pagador:</Typography>
                     <Autocomplete
                        id="tomador-outros-autocomplete"
                        options={clientes}
                        getOptionLabel={(option) => option.nome || option.nome_razao_social || ''}
                        isOptionEqualToValue={(option, value) => (option.id_cliente || option.id) === (value.id_cliente || value.id)}
                        value={clientes.find(c => (c.id_cliente || c.id) === formData.tomador_outros) || null}
                        onChange={(e, val) => setFormData(prev => ({...prev, tomador_outros: val ? (val.id_cliente || val.id) : null}))}
                        renderInput={(params) => <TextField {...params} />}
                    />
                </Grid>
             )}
        </Grid>
    );

    const renderStep2_Transporte = () => (
        <Grid container spacing={3}>
            {/* Veículo */}
             <Grid item xs={12} md={4}>
                <Box display="flex" gap={1} alignItems="flex-start">
                    <Autocomplete
                        id="veiculo-autocomplete"
                        fullWidth
                        options={veiculosList}
                        getOptionLabel={(v) => v.placa + (v.modelo ? ` - ${v.modelo}` : '')}
                        isOptionEqualToValue={(option, value) => option.placa === value.placa}
                        value={veiculosList.find(v => v.placa === formData.placa_veiculo) || null}
                        onChange={(e, val) => setFormData(prev => ({
                            ...prev, 
                            placa_veiculo: val ? val.placa : '', 
                            veiculo_uf: val ? (val.uf || '') : '',
                            rntrc: val ? (val.rntrc || '') : prev.rntrc
                        }))}
                        renderInput={(params) => <TextField {...params} label="Veículo (Placa)" placeholder="AAA-1234" />}
                    />
                    <IconButton color="primary" sx={{ mt: 1, bgcolor: '#e3f2fd' }} onClick={() => setOpenVeiculoDialog(true)}>
                        <AddIcon />
                    </IconButton>
                </Box>
            </Grid>
            <Grid item xs={6} md={2}>
                 <TextField fullWidth label="UF Veículo" name="veiculo_uf" value={formData.veiculo_uf} onChange={handleChange} />
            </Grid>
             <Grid item xs={6} md={3}>
                 <TextField fullWidth label="RNTRC" name="rntrc" value={formData.rntrc} onChange={handleChange} />
            </Grid>
             <Grid item xs={12} md={12}>
                <Autocomplete
                    id="condutor-autocomplete"
                    freeSolo
                    options={motoristasList}
                    getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        return option.nome || '';
                    }}
                    value={formData.condutor_nome || ''}
                    inputValue={formData.condutor_nome || ''}
                    onInputChange={(event, newInputValue) => {
                         // Updates the text while typing or selecting
                         setFormData(prev => ({ ...prev, condutor_nome: newInputValue }));
                    }}
                    onChange={(event, newValue) => {
                         // Handle selection of object or free text commit (Enter)
                         if (newValue && typeof newValue === 'object') {
                             setFormData(prev => ({ 
                                 ...prev, 
                                 condutor_nome: newValue.nome || '',
                                 condutor_cpf: newValue.cpf || prev.condutor_cpf || ''
                             }));
                         } else if (newValue === null) {
                             // Clear
                             setFormData(prev => ({ ...prev, condutor_nome: '' }));
                         }
                         // If string, onInputChange already handled it
                    }}
                    renderInput={(params) => <TextField {...params} label="Nome do Motorista" fullWidth />}
                />
            </Grid>

            <Grid item xs={12}><Divider textAlign="left">ITINERÁRIO</Divider></Grid>

             {/* Origem */}
             <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ bgcolor: '#fafafa' }}>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Origem (Coleta)</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <TextField size="small" fullWidth label="CEP" name="cep_origem" placeholder="00000-000" value={formData.cep_origem} onChange={handleChange} onBlur={(e) => handleCepBlur(e, 'origem')} />
                            </Grid>
                            <Grid item xs={8}>
                                <TextField size="small" fullWidth label="Cidade" name="cidade_origem_nome" value={formData.cidade_origem_nome} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField size="small" fullWidth label="UF" name="cidade_origem_uf" value={formData.cidade_origem_uf} onChange={handleChange} />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
             </Grid>

             {/* Destino */}
             <Grid item xs={12} md={6}>
                 <Card variant="outlined" sx={{ bgcolor: '#fafafa' }}>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Destino (Entrega)</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <TextField size="small" fullWidth label="CEP" name="cep_destino" placeholder="00000-000" value={formData.cep_destino} onChange={handleChange} onBlur={(e) => handleCepBlur(e, 'destino')} />
                            </Grid>
                            <Grid item xs={8}>
                                <TextField size="small" fullWidth label="Cidade" name="cidade_destino_nome" value={formData.cidade_destino_nome} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField size="small" fullWidth label="UF" name="cidade_destino_uf" value={formData.cidade_destino_uf} onChange={handleChange} />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
             </Grid>
        </Grid>
    );

    const renderStep3_Carga = () => (
        <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={8}>
                <TextField fullWidth label="Produto Predominante" name="produto_predominante" value={formData.produto_predominante} onChange={handleChange} helperText="Descrição principal da carga" />
            </Grid>
            <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                     <Grid item xs={6}>
                        <TextField fullWidth type="number" label="Valor da Carga (R$)" name="valor_carga" value={formData.valor_carga} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }} />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth type="number" label="Volumes (Qtd)" name="volumes" value={formData.volumes} onChange={handleChange} />
                    </Grid>
                     <Grid item xs={6}>
                        <TextField fullWidth type="number" label="Peso Bruto (KG)" name="peso_bruto" value={formData.peso_bruto} onChange={handleChange} />
                    </Grid>
                     <Grid item xs={6}>
                        <TextField fullWidth type="number" label="Peso Líquido (KG)" name="peso_liquido" value={formData.peso_liquido} onChange={handleChange} />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );

    const renderStep4_Valores = () => (
        <Box>
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                     <Typography variant="overline" display="block" color="text.secondary" gutterBottom>TOTALIZADORES DO SERVIÇO</Typography>
                     <Card elevation={0} sx={{ bgcolor: '#e1f5fe', mb: 2 }}>
                        <CardContent>
                            <TextField 
                                fullWidth 
                                label="Valor Total do Serviço (R$)" 
                                name="valor_total_servico" 
                                value={formData.valor_total_servico} 
                                onChange={handleChange} 
                                variant="standard"
                                InputProps={{ style: { fontSize: '1.5rem', fontWeight: 'bold', color: '#0277bd' } }}
                            />
                        </CardContent>
                     </Card>
                     <Card elevation={0} sx={{ bgcolor: '#e8f5e9' }}>
                         <CardContent>
                            <TextField 
                                fullWidth 
                                label="Valor a Receber (R$)" 
                                name="valor_receber" 
                                value={formData.valor_receber} 
                                onChange={handleChange} 
                                variant="standard"
                                InputProps={{ style: { fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' } }}
                            />
                        </CardContent>
                     </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography variant="overline" display="block" color="text.secondary" gutterBottom>COMPOSIÇÃO DO FRETE</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}><TextField fullWidth size="small" label="Frete Valor" name="componente_frete_valor" value={formData.componente_frete_valor} onChange={handleChange} /></Grid>
                        <Grid item xs={6}><TextField fullWidth size="small" label="Frete Peso" name="componente_frete_peso" value={formData.componente_frete_peso} onChange={handleChange} /></Grid>
                        <Grid item xs={6}><TextField fullWidth size="small" label="Pedágio" name="componente_pedagio" value={formData.componente_pedagio} onChange={handleChange} /></Grid>
                        <Grid item xs={6}><TextField fullWidth size="small" label="Sec/Cat" name="componente_sec_cat" value={formData.componente_sec_cat} onChange={handleChange} /></Grid>
                        <Grid item xs={6}><TextField fullWidth size="small" label="Outros" name="componente_outros" value={formData.componente_outros} onChange={handleChange} /></Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );

    const renderStep5_Notas = () => (
         <Box sx={{ minHeight: 400 }}>
            <Box display="flex" gap={2} mb={3} alignItems="center">
                <TextField 
                    fullWidth 
                    label="Chave de Acesso da NF-e (44 dígitos)" 
                    value={newDocKey} 
                    onChange={(e) => setNewDocKey(e.target.value.replace(/\D/g, '').slice(0,44))}
                    placeholder="00000000000000000000000000000000000000000000"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={handleOpenNotasSearch} color="primary" title="Pesquisar Nota Interna">
                                    <SearchIcon />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
                <Button variant="contained" size="large" onClick={handleAddDocumento} disabled={newDocKey.length !== 44}>
                    ADICIONAR
                </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead sx={{ bgcolor: '#eee' }}>
                        <TableRow>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Chave de Acesso</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {formData.documentos.map((doc, idx) => (
                            <TableRow key={idx}>
                                <TableCell><Chip label="NF-e" size="small" color="primary" /></TableCell>
                                <TableCell sx={{ fontFamily: 'monospace' }}>{doc.chave_nfe}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="error" onClick={() => handleRemoveDocumento(doc.chave_nfe)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                         {formData.documentos.length === 0 && (
                             <TableRow>
                                 <TableCell colSpan={3} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                     Nenhuma nota fiscal vinculada ainda.
                                 </TableCell>
                             </TableRow>
                         )}
                    </TableBody>
                </Table>
            </TableContainer>
         </Box>
    );
    
    const renderStep6_Obs = () => (
         <Grid container spacing={3}>
             <Grid item xs={12}>
                 <TextField
                    fullWidth
                    multiline
                    rows={8}
                    label="Observações Gerais (Inf. Adicionais de Interesse do Fisco)"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleChange}
                    placeholder="Digite aqui observações relevantes..."
                 />
             </Grid>
        </Grid>
    );

    // --- Main Layout ---

    return (
        <Paper 
            sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 0,
                position: 'relative'
            }}
            elevation={0}
        >
            {/* Header Fixo */}
            <Box sx={{ p: 2, borderBottom: '1px solid #ddd', bgcolor: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={onClose}><ArrowBackIcon /></IconButton>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Emissão de CT-e
                </Typography>
                <Chip label={`CT-e ${formData.modelo}`} color="primary" size="small" />
            </Box>

            {/* Stepper Header */}
            <Box sx={{ px: 4, py: 3, bgcolor: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
                </Stepper>
            </Box>

            {/* Content Body - Scrollable */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 4, bgcolor: '#fff' }}>
                {/* Error Banner */}
                <Collapse in={errorList.length > 0}>
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorList([])}>
                        <Typography variant="subtitle2" fontWeight="bold">Falha na validação:</Typography>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {errorList.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </Alert>
                </Collapse>

                 {activeStep === 0 && renderStep0_Geral()}
                 {activeStep === 1 && renderStep1_Atores()}
                 {activeStep === 2 && renderStep2_Transporte()}
                 {activeStep === 3 && renderStep3_Carga()}
                 {activeStep === 4 && renderStep4_Valores()}
                 {activeStep === 5 && renderStep5_Notas()}
                 {activeStep === 6 && renderStep6_Obs()}
            </Box>

            {/* Footer Actions */}
            <Box sx={{ p: 2, borderTop: '1px solid #ddd', bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                    disabled={activeStep === 0 || saving} 
                    onClick={handleBack}
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                >
                    Voltar
                </Button>
                
                <Box>
                    {activeStep === STEPS.length - 1 ? (
                        <Button
                            variant="contained"
                            color="success"
                            size="large"
                            onClick={handleSubmit}
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            sx={{ px: 4 }}
                        >
                            {saving ? 'Emitindo...' : 'Transmitir CT-e'}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleNext}
                            endIcon={<ArrowForwardIcon />}
                        >
                            Próximo: {STEPS[activeStep + 1]}
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Aux Dialogs */}
            <VeiculoDialog 
                open={openVeiculoDialog} 
                onClose={() => setOpenVeiculoDialog(false)} 
                onSave={handleSaveVeiculo} 
            />

            {/* Dialog de Pesquisa de Notas */}
            <Dialog 
                open={openNotasDialog} 
                onClose={() => setOpenNotasDialog(false)} 
                maxWidth="md" 
                fullWidth
            >
                <DialogTitle>Pesquisar Nota Fiscal (Modelo 55)</DialogTitle>
                <DialogContent dividers sx={{ minHeight: 400 }}>
                    {loadingNotas ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                <TableRow>
                                    <TableCell>Número</TableCell>
                                    <TableCell>Destinatário</TableCell>
                                    <TableCell>Emissão</TableCell>
                                    <TableCell>Valor</TableCell>
                                    <TableCell align="right">Ação</TableCell>
                                </TableRow>
                                </TableHead>
                                <TableBody>
                                {notasDisponiveis.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                            Nenhuma Nota Fiscal (NFe 55) disponível para vínculo encontrada.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    notasDisponiveis.map(nota => (
                                        <TableRow key={nota.id_venda || nota.chave} hover>
                                            <TableCell sx={{ fontWeight: 'bold' }}>{nota.numero}</TableCell>
                                            <TableCell>{nota.destinatario}</TableCell>
                                            <TableCell>{new Date(nota.data).toLocaleDateString()}</TableCell>
                                            <TableCell>R$ {parseFloat(nota.valor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</TableCell>
                                            <TableCell align="right">
                                                <Button 
                                                    size="small" 
                                                    variant="contained" 
                                                    onClick={() => handleSelectNota(nota)}
                                                    startIcon={<AddIcon />}
                                                >
                                                    Escolher
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNotasDialog(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default CTeForm;
