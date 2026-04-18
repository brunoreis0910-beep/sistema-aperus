import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    InputAdornment,
    Typography,
    Box,
    Fade,
    Paper,
    Divider,
    IconButton,
    MenuItem
} from '@mui/material';

const UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO'
];

import { 
    Close as CloseIcon,
    Save as SaveIcon,
    DirectionsCar as CarIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from './common/Toast';

const VeiculoDialog = ({ open, onClose, onSave, veiculoToEdit = null }) => {
    const { axiosInstance } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const initialFormData = {
        placa: '',
        uf: '',
        rntrc: '',
        marca: '',
        modelo: '',
        ano: '',
        cor: '',
        chassi: '',
        observacoes: '',
        // Campos para MDF-e
        tipo_rodado: '03',
        tipo_carroceria: '02',
        tipo_propriedade: '1',
        tara_kg: '',
        capacidade_kg: ''
    };

    const [formData, setFormData] = useState(initialFormData);

    // Normaliza valores null/undefined para strings vazias (necessário para Select do MUI)
    const normalizeFormData = (data) => {
        const normalized = { ...data };
        // Campos Select que precisam ser strings
        const selectFields = ['tipo_rodado', 'tipo_carroceria', 'tipo_propriedade', 'uf'];
        selectFields.forEach(field => {
            if (normalized[field] === null || normalized[field] === undefined) {
                normalized[field] = '';
            }
        });
        // Converte outros campos null para string vazia
        Object.keys(normalized).forEach(key => {
            if (normalized[key] === null || normalized[key] === undefined) {
                normalized[key] = '';
            }
        });
        return normalized;
    };

    useEffect(() => {
        if (veiculoToEdit) {
           setFormData(normalizeFormData(veiculoToEdit));
        } else {
           setFormData(initialFormData);
        }
    }, [veiculoToEdit, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const needsUpper = ['placa', 'chassi'].includes(name);
        setFormData(prev => ({
            ...prev,
            [name]: needsUpper ? value.toUpperCase() : value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.placa) {
            showToast('Placa é obrigatória', 'error');
            return;
        }
        setLoading(true);
        try {
            let response;
            if (veiculoToEdit && veiculoToEdit.id_veiculo) {
                response = await axiosInstance.put(`veiculos/${veiculoToEdit.id_veiculo}/`, formData);
                showToast('Veículo atualizado!', 'success');
            } else {
                response = await axiosInstance.post('veiculos/', formData);
                showToast('Veículo salvo!', 'success');
            }
            if (onSave) onSave(response.data);
            handleClose();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showToast('Erro ao salvar veículo.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!veiculoToEdit) setFormData(initialFormData);
        onClose();
    };

    // Componente Visual da Placa Mercosul
    const PlacaVisualizer = ({ placa }) => (
        <Paper elevation={3} sx={{ 
            width: 200, 
            height: 65, 
            bgcolor: 'white', 
            borderRadius: 1, 
            border: '2px solid #000', 
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Box sx={{ bgcolor: '#003399', height: '25%', width: '100%', display: 'flex', justifyContent: 'space-between', px: 0.5, alignItems: 'center' }}>
                <Typography sx={{ color: 'white', fontSize: 8, fontWeight: 'bold' }}>BRASIL</Typography>
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2e/Mercosul_flag.jpg" alt="br" style={{ height: 10, width: 14 }} onError={(e) => e.target.style.display='none'}/>
            </Box>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ 
                    fontFamily: 'Consolas, monospace', // Fallback for FE-Schrift
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    letterSpacing: 2,
                    color: '#000'
                }}>
                    {placa || 'ABC1D23'}
                </Typography>
            </Box>
        </Paper>
    );

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="md"
            fullWidth
            TransitionComponent={Fade}
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold">
                        {veiculoToEdit ? 'Editar Veículo' : 'Cadastro de Frota'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerencie os dados do veículo para emissão
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            
            <Divider />

            <DialogContent sx={{ py: 3 }}>
                <Grid container spacing={4}>
                    {/* Coluna Esquerda: Identificação Visual */}
                    <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderRight: { md: '1px solid #eee' } }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            VISUALIZAÇÃO
                        </Typography>
                        
                        <PlacaVisualizer placa={formData.placa} />
                        
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <CarIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.2 }} />
                            <Typography variant="caption" display="block" color="text.secondary">
                                Transporte Rodoviário de Carga
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Coluna Direita: Formulário */}
                    <Grid item xs={12} md={8}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'primary.main' }}>
                                    DADOS OBRIGATÓRIOS
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={5}>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    label="Placa do Veículo"
                                    name="placa"
                                    value={formData.placa}
                                    onChange={handleChange}
                                    required
                                    placeholder="AAA-0000"
                                    inputProps={{ maxLength: 8, style: { textTransform: 'uppercase', fontWeight: 'bold' } }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    select
                                    fullWidth
                                    label="UF"
                                    name="uf"
                                    value={formData.uf || ''}
                                    onChange={handleChange}
                                    required
                                >
                                    {UFS.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="RNTRC"
                                    name="rntrc"
                                    value={formData.rntrc || ''}
                                    onChange={handleChange}
                                    placeholder="00000000"
                                />
                            </Grid>
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    fullWidth
                                    label="Marca / Fabricante"
                                    name="marca"
                                    value={formData.marca}
                                    onChange={handleChange}
                                    placeholder="Ex: SCANIA"
                                />
                            </Grid>
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    fullWidth
                                    label="Modelo"
                                    name="modelo"
                                    value={formData.modelo}
                                    onChange={handleChange}
                                    placeholder="Ex: R450 6x2"
                                />
                            </Grid>
                             <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Ano"
                                    name="ano"
                                    type="number"
                                    value={formData.ano}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'text.secondary' }}>
                                    OPCIONAIS
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Número Chassi"
                                    name="chassi"
                                    value={formData.chassi}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Cor Predominante"
                                    name="cor"
                                    value={formData.cor}
                                    onChange={handleChange}
                                />
                            </Grid>
                             <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Observações Internas"
                                    name="observacoes"
                                    value={formData.observacoes}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'text.secondary' }}>
                                    DADOS PARA MDF-e
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    select
                                    label="Tipo de Rodado"
                                    name="tipo_rodado"
                                    value={formData.tipo_rodado || ''}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="01">01 - Truck</MenuItem>
                                    <MenuItem value="02">02 - Toco</MenuItem>
                                    <MenuItem value="03">03 - Cavalo Mecânico</MenuItem>
                                    <MenuItem value="04">04 - VAN</MenuItem>
                                    <MenuItem value="05">05 - Utilitário</MenuItem>
                                    <MenuItem value="06">06 - Outros</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    select
                                    label="Tipo de Carroceria"
                                    name="tipo_carroceria"
                                    value={formData.tipo_carroceria || ''}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="00">00 - Não Aplicável</MenuItem>
                                    <MenuItem value="01">01 - Aberta</MenuItem>
                                    <MenuItem value="02">02 - Fechada/Baú</MenuItem>
                                    <MenuItem value="03">03 - Graneleira</MenuItem>
                                    <MenuItem value="04">04 - Porta Container</MenuItem>
                                    <MenuItem value="05">05 - Sider</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Tara (kg)"
                                    name="tara_kg"
                                    type="number"
                                    value={formData.tara_kg}
                                    onChange={handleChange}
                                    placeholder="Peso vazio do veículo"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Capacidade (kg)"
                                    name="capacidade_kg"
                                    type="number"
                                    value={formData.capacidade_kg}
                                    onChange={handleChange}
                                    placeholder="Capacidade de carga"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    select
                                    label="Tipo de Propriedade/Vínculo"
                                    name="tipo_propriedade"
                                    value={formData.tipo_propriedade || ''}
                                    onChange={handleChange}
                                    helperText="Tipo de vinculação do veículo (para MDF-e)"
                                >
                                    <MenuItem value="0">0 - TAC Agregado</MenuItem>
                                    <MenuItem value="1">1 - TAC Independente</MenuItem>
                                    <MenuItem value="2">2 - Outros</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>
            
            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fafafa', borderTop: '1px solid #eee' }}>
                <Button onClick={handleClose} color="inherit">
                    Cancelar
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    color="primary"
                    disabled={loading}
                    startIcon={!loading && <SaveIcon />}
                    sx={{ px: 4, fontWeight: 'bold' }}
                >
                    {loading ? 'Salvando...' : 'Confirmar Cadastro'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VeiculoDialog;
