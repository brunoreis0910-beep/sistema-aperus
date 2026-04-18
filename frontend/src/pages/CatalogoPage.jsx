import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, MenuItem, Grid, IconButton, Paper, Card, CardContent, CardMedia, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Divider, Container, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../context/AuthContext';

function CatalogoPage() {
    const { axiosInstance, user, permissions, isLoading: authLoading } = useAuth();
    const [produtos, setProdutos] = useState([]);
    const [catalogos, setCatalogos] = useState([]);
    const [erro, setErro] = useState(null);
    const [sucesso, setSucesso] = useState(null);
    const [form, setForm] = useState({ nome_catalogo: '', descricao: '', itens: [] });
    const [modalProduto, setModalProduto] = useState(false);
    const [modalWhatsApp, setModalWhatsApp] = useState(false);
    const [catalogoSelecionado, setCatalogoSelecionado] = useState(null);
    const [numeroWhatsApp, setNumeroWhatsApp] = useState('');
    const [produtoSelecionado, setProdutoSelecionado] = useState({ id_produto: '', valor_catalogo: 0 });
    const [mostrarForm, setMostrarForm] = useState(false);
    const [previewCatalogo, setPreviewCatalogo] = useState(null);
    const [editando, setEditando] = useState(false);
    const [catalogoEditando, setCatalogoEditando] = useState(null);
    const [modalConfirmarExclusao, setModalConfirmarExclusao] = useState(false);
    const [catalogoParaExcluir, setCatalogoParaExcluir] = useState(null);

    useEffect(() => { carregarDados(); }, []);

    const carregarDados = async () => {
        try {
            const [resProdutos, resCatalogos] = await Promise.all([
                axiosInstance.get('/produtos/'),
                axiosInstance.get('/catalogos/')
            ]);
            
            // Garantir que sempre seja um array
            const produtosData = Array.isArray(resProdutos.data)
                ? resProdutos.data
                : (resProdutos.data?.results || []);
            setProdutos(produtosData);
            
            const catalogosData = Array.isArray(resCatalogos.data)
                ? resCatalogos.data
                : (resCatalogos.data?.results || []);
            setCatalogos(catalogosData);
        } catch (error) {
            setErro('Erro ao carregar dados');
        }
    };

    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!user?.is_staff && !permissions?.catalogo_acessar) {
        return (
            <Box p={3}>
                <Alert severity="warning">Você não tem permissão para acessar Catálogo.</Alert>
            </Box>
        );
    }

    const adicionarProduto = () => {
        const prod = produtos.find(p => p.id_produto === parseInt(produtoSelecionado.id_produto));
        if (prod) {
            setForm({
                ...form,
                itens: [...form.itens, {
                    id_produto: prod.id_produto,
                    nome_produto: prod.nome_produto,
                    imagem_url: prod.imagem_url || 'https://via.placeholder.com/150',
                    valor_catalogo: parseFloat(produtoSelecionado.valor_catalogo) || 0
                }]
            });
            setProdutoSelecionado({ id_produto: '', valor_catalogo: 0 });
            setModalProduto(false);
        }
    };

    const salvarCatalogo = async () => {
        try {
            if (editando && catalogoEditando) {
                await axiosInstance.put(`/catalogos/${catalogoEditando}/`, form);
                setSucesso('✅ Catálogo atualizado!');
                setEditando(false);
                setCatalogoEditando(null);
            } else {
                await axiosInstance.post('/catalogos/', form);
                setSucesso('✅ Catálogo salvo!');
            }
            setForm({ nome_catalogo: '', descricao: '', itens: [] });
            setMostrarForm(false);
            carregarDados();
        } catch (error) {
            setErro('❌ Erro ao salvar');
        }
    };

    const iniciarEdicao = (catalogo) => {
        setForm({
            nome_catalogo: catalogo.nome_catalogo,
            descricao: catalogo.descricao || '',
            itens: Array.isArray(catalogo.itens) ? catalogo.itens.map(item => ({
                id_produto: item.id_produto,
                nome_produto: item.nome_produto,
                imagem_url: item.imagem_url || 'https://via.placeholder.com/150',
                valor_catalogo: item.valor_catalogo || 0
            })) : []
        });
        setCatalogoEditando(catalogo.id);
        setEditando(true);
        setMostrarForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelarEdicao = () => {
        setForm({ nome_catalogo: '', descricao: '', itens: [] });
        setEditando(false);
        setCatalogoEditando(null);
        setMostrarForm(false);
    };

    const confirmarExclusao = (catalogo) => {
        setCatalogoParaExcluir(catalogo);
        setModalConfirmarExclusao(true);
    };

    const excluirCatalogo = async () => {
        try {
            await axiosInstance.delete(`/catalogos/${catalogoParaExcluir.id}/`);
            setSucesso('✅ Catálogo excluído com sucesso!');
            setModalConfirmarExclusao(false);
            setCatalogoParaExcluir(null);
            carregarDados();
        } catch (error) {
            setErro('❌ Erro ao excluir catálogo');
        }
    };

    const gerarPDF = async (catalogoId) => {
        try {
            const response = await axiosInstance.get(`/catalogos/${catalogoId}/gerar-pdf/`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `catalogo_${catalogoId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setSucesso(' PDF gerado com sucesso!');
        } catch (error) {
            setErro(' Erro ao gerar PDF');
        }
    };

    const abrirModalWhatsApp = (catalogo) => {
        setCatalogoSelecionado(catalogo);
        setModalWhatsApp(true);
    };

    const enviarWhatsApp = async () => {
        if (!numeroWhatsApp) {
            setErro('Digite um número válido');
            return;
        }
        try {
            const response = await axiosInstance.post(`/catalogos/${catalogoSelecionado.id}/enviar-whatsapp/`, {
                numero: numeroWhatsApp
            });
            if (response.data.whatsapp_url) {
                window.open(response.data.whatsapp_url, '_blank');
                setSucesso(' WhatsApp aberto com sucesso!');
                setModalWhatsApp(false);
                setNumeroWhatsApp('');
            }
        } catch (error) {
            setErro(' Erro ao enviar WhatsApp');
        }
    };

    return (
        <Box>
            {erro && <Alert severity="error" onClose={() => setErro(null)} sx={{ mb: 2 }}>{erro}</Alert>}
            {sucesso && <Alert severity="success" onClose={() => setSucesso(null)} sx={{ mb: 2 }}>{sucesso}</Alert>}

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        if (!mostrarForm) {
                            cancelarEdicao();
                        }
                        setMostrarForm(!mostrarForm);
                    }}
                >
                    {mostrarForm ? 'Ocultar Formulário' : 'Novo Catálogo'}
                </Button>
                {editando && (
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={cancelarEdicao}
                    >
                        Cancelar Ediçéo
                    </Button>
                )}
            </Box>

            {mostrarForm && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                        {editando ? '✏️ Editar Catálogo' : '📝 Novo Catálogo'}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Nome *"
                                value={form.nome_catalogo}
                                onChange={e => setForm({ ...form, nome_catalogo: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Descriçéo"
                                value={form.descricao}
                                onChange={e => setForm({ ...form, descricao: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                    <Button
                        startIcon={<AddIcon />}
                        variant="contained"
                        onClick={() => setModalProduto(true)}
                        sx={{ mt: 2 }}
                    >
                        Adicionar Produto
                    </Button>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        {Array.isArray(form.itens) && form.itens.map((item, i) => (
                            <Grid item xs={4} key={i}>
                                <Card>
                                    <CardMedia component="img" height="140" image={item.imagem_url} />
                                    <CardContent>
                                        <Typography variant="h6">{item.nome_produto}</Typography>
                                        <Chip label={`R$ ${item.valor_catalogo.toFixed(2)}`} color="success" />
                                        <IconButton
                                            color="error"
                                            onClick={() => setForm({ ...form, itens: form.itens.filter((_, idx) => idx !== i) })}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    {form.itens.length > 0 && (
                        <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={salvarCatalogo}
                            sx={{ mt: 2 }}
                        >
                            {editando ? 'Atualizar Catálogo' : 'Salvar Catálogo'}
                        </Button>
                    )}
                </Paper>
            )}

            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
                    Meus Catálogos ({catalogos.length})
                </Typography>

                {catalogos.length === 0 ? (
                    <Typography color="text.secondary">Nenhum catálogo criado ainda.</Typography>
                ) : (
                    <Grid container spacing={3}>
                        {Array.isArray(catalogos) && catalogos.map(catalogo => (
                            <Grid item xs={12} md={6} lg={4} key={catalogo.id}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" gutterBottom>
                                            {catalogo.nome_catalogo}
                                        </Typography>
                                        {catalogo.descricao && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {catalogo.descricao}
                                            </Typography>
                                        )}
                                        <Chip
                                            label={`${catalogo.itens?.length || 0} produtos`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={catalogo.ativo ? 'Ativo' : 'Inativo'}
                                            size="small"
                                            color={catalogo.ativo ? 'success' : 'default'}
                                            sx={{ ml: 1 }}
                                        />
                                    </CardContent>
                                    <Divider />
                                    <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <Button
                                            size="small"
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => setPreviewCatalogo(catalogo)}
                                            variant="contained"
                                            color="primary"
                                        >
                                            Visualizar
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => iniciarEdicao(catalogo)}
                                            variant="outlined"
                                            color="warning"
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => confirmarExclusao(catalogo)}
                                            variant="outlined"
                                            color="error"
                                        >
                                            Excluir
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<PictureAsPdfIcon />}
                                            onClick={() => gerarPDF(catalogo.id)}
                                            variant="outlined"
                                            color="error"
                                        >
                                            PDF
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<WhatsAppIcon />}
                                            onClick={() => abrirModalWhatsApp(catalogo)}
                                            variant="outlined"
                                            sx={{ color: '#25D366', borderColor: '#25D366' }}
                                        >
                                            WhatsApp
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Paper>

            <Dialog open={modalProduto} onClose={() => setModalProduto(false)}>
                <DialogTitle>Adicionar Produto</DialogTitle>
                <DialogContent>
                    <TextField
                        select
                        fullWidth
                        label="Produto"
                        value={produtoSelecionado.id_produto}
                        onChange={e => setProdutoSelecionado({ ...produtoSelecionado, id_produto: e.target.value })}
                        sx={{ mt: 2 }}
                    >
                        <MenuItem value="">Selecione...</MenuItem>
                        {Array.isArray(produtos) && produtos.map(p => (
                            <MenuItem key={p.id_produto} value={p.id_produto}>
                                {p.nome_produto}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth
                        type="number"
                        label="Valor"
                        value={produtoSelecionado.valor_catalogo}
                        onChange={e => setProdutoSelecionado({ ...produtoSelecionado, valor_catalogo: e.target.value })}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalProduto(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={adicionarProduto}>Adicionar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={modalWhatsApp} onClose={() => setModalWhatsApp(false)}>
                <DialogTitle> Enviar via WhatsApp</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Enviar catálogo: <strong>{catalogoSelecionado?.nome_catalogo}</strong>
                    </Typography>
                    <TextField
                        fullWidth
                        label="Número do WhatsApp"
                        placeholder="(11) 99999-9999"
                        value={numeroWhatsApp}
                        onChange={e => setNumeroWhatsApp(e.target.value)}
                        sx={{ mt: 2 }}
                        helperText="Digite o número com DDD"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalWhatsApp(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={enviarWhatsApp}
                        startIcon={<WhatsAppIcon />}
                        sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' } }}
                    >
                        Enviar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Preview do Catálogo - Estilo E-commerce */}
            <Dialog
                open={!!previewCatalogo}
                onClose={() => setPreviewCatalogo(null)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { minHeight: '80vh', bgcolor: '#f5f5f5' }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            {previewCatalogo?.nome_catalogo}
                        </Typography>
                        {previewCatalogo?.descricao && (
                            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                                {previewCatalogo.descricao}
                            </Typography>
                        )}
                    </Box>
                    <IconButton onClick={() => setPreviewCatalogo(null)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 4, bgcolor: '#f5f5f5' }}>
                    <Container maxWidth="lg">
                        <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
                            Produtos ({previewCatalogo?.itens?.length || 0})
                        </Typography>
                        <Grid container spacing={3}>
                            {previewCatalogo?.itens?.map((item, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                    <Card sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 6
                                        }
                                    }}>
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={item.imagem_url || 'https://via.placeholder.com/200'}
                                            alt={item.nome_produto}
                                            sx={{ objectFit: 'cover', bgcolor: '#f0f0f0' }}
                                        />
                                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <Typography
                                                variant="body1"
                                                fontWeight="500"
                                                sx={{
                                                    mb: 2,
                                                    minHeight: '48px',
                                                    display: '-webkit-box',
                                                    overflow: 'hidden',
                                                    WebkitBoxOrient: 'vertical',
                                                    WebkitLineClamp: 2
                                                }}
                                            >
                                                {item.nome_produto}
                                            </Typography>
                                            <Box>
                                                <Typography
                                                    variant="h5"
                                                    color="primary"
                                                    fontWeight="bold"
                                                    sx={{ mb: 1 }}
                                                >
                                                    R$ {item.valor_catalogo ? item.valor_catalogo.toFixed(2).replace('.', ',') : '0,00'}
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#00bcd4',
                                                        '&:hover': { bgcolor: '#0097a7' }
                                                    }}
                                                >
                                                    Ver detalhes
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Container>
                </DialogContent>
                <DialogActions sx={{ bgcolor: '#fff', p: 2 }}>
                    <Button onClick={() => setPreviewCatalogo(null)}>Fechar</Button>
                    <Button
                        variant="contained"
                        startIcon={<PictureAsPdfIcon />}
                        onClick={() => {
                            gerarPDF(previewCatalogo.id);
                            setPreviewCatalogo(null);
                        }}
                        color="error"
                    >
                        Baixar PDF
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<WhatsAppIcon />}
                        onClick={() => {
                            abrirModalWhatsApp(previewCatalogo);
                            setPreviewCatalogo(null);
                        }}
                        sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' } }}
                    >
                        Compartilhar WhatsApp
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Confirmação de Exclusão */}
            <Dialog
                open={modalConfirmarExclusao}
                onClose={() => setModalConfirmarExclusao(false)}
                maxWidth="sm"
            >
                <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
                    ⚠️ Confirmar Exclusão
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Tem certeza que deseja excluir o catálogo:
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                        {catalogoParaExcluir?.nome_catalogo}
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Esta ação não pode ser desfeita! O catálogo e todos os seus itens seréo removidos permanentemente.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setModalConfirmarExclusao(false)}
                        variant="outlined"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={excluirCatalogo}
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                    >
                        Excluir Catálogo
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default CatalogoPage;