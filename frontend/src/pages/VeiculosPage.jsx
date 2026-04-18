import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    DirectionsCar as CarIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import VeiculoDialog from '../components/VeiculoDialog';
import { useToast } from '../components/common/Toast';

const VeiculosPage = () => {
    const { axiosInstance } = useAuth();
    const { showToast } = useToast();
    
    const [veiculos, setVeiculos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [veiculoToEdit, setVeiculoToEdit] = useState(null);

    useEffect(() => {
        carregarVeiculos();
    }, []);

    const carregarVeiculos = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('veiculos/');
            const data = response.data;
            setVeiculos(Array.isArray(data) ? data : (data.results || []));
        } catch (error) {
            console.error('Erro ao carregar veículos:', error);
            showToast('Erro ao carregar lista de veículos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleNovo = () => {
        setVeiculoToEdit(null);
        setDialogOpen(true);
    };

    const handleEditar = (veiculo) => {
        setVeiculoToEdit(veiculo);
        setDialogOpen(true);
    };

    const handleExcluir = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este veículo?')) return;
        
        try {
            await axiosInstance.delete(`veiculos/${id}/`);
            showToast('Veículo excluído com sucesso', 'success');
            carregarVeiculos();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            showToast('Erro ao excluir veículo', 'error');
        }
    };

    const handleSaveCallback = () => {
        carregarVeiculos();
        setDialogOpen(false);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                    <CarIcon fontSize="large" color="primary" />
                    <Typography variant="h4" component="h1">
                        Gerenciar Veículos
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleNovo}
                >
                    Novo Veículo
                </Button>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            ) : veiculos.length === 0 ? (
                <Alert severity="info">
                    Nenhum veículo cadastrado. Clique em "Novo Veículo" para começar.
                </Alert>
            ) : (
                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell>Placa</TableCell>
                                <TableCell>UF</TableCell>
                                <TableCell>RNTRC</TableCell>
                                <TableCell>Marca/Modelo</TableCell>
                                <TableCell>Ano</TableCell>
                                <TableCell>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {veiculos.map((v) => (
                                <TableRow key={v.id_veiculo} hover>
                                    <TableCell sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                                        {v.placa}
                                    </TableCell>
                                     <TableCell>
                                        {v.uf && <Chip label={v.uf} size="small" variant="outlined" />}
                                    </TableCell>
                                    <TableCell>{v.rntrc || '-'}</TableCell>
                                    <TableCell>
                                        {v.marca || '-'} {v.modelo ? `/ ${v.modelo}` : ''}
                                    </TableCell>
                                    <TableCell>{v.ano || '-'}</TableCell>
                                    <TableCell>
                                        <IconButton 
                                            size="small" 
                                            color="primary" 
                                            onClick={() => handleEditar(v)}
                                            title="Editar"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            color="error" 
                                            onClick={() => handleExcluir(v.id_veiculo)}
                                            title="Excluir"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <VeiculoDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSaveCallback}
                veiculoToEdit={veiculoToEdit}
            />
        </Container>
    );
};

export default VeiculosPage;
