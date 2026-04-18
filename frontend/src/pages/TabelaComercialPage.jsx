import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Grid,
    Alert,
    CircularProgress,
    Chip,
    Stack,
    InputAdornment,
    IconButton,
    Tooltip,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../context/AuthContext';

const TabelaComercialPage = () => {
    const { axiosInstance } = useAuth();
    const [tabelas, setTabelas] = useState([]);
    const [novaTabela, setNovaTabela] = useState({ nome: '', percentual: '' });
    const [editando, setEditando] = useState(null);
    const [tabelaEditada, setTabelaEditada] = useState({ nome: '', percentual: '', perguntar_ao_vender: false });
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');

    useEffect(() => {
        carregarTabelas();
    }, []);

    const carregarTabelas = async () => {
        setLoading(true);
        try {
            console.log('💰 Carregando tabelas da API...');
            const response = await axiosInstance.get('/tabelas-comerciais/');
            console.log('✅ Resposta da API:', response.data);
            console.log('📊 Tipo de response.data:', typeof response.data, Array.isArray(response.data));

            // Garantir que sempre seja um array
            const tabelasData = Array.isArray(response.data)
                ? response.data
                : (response.data?.results || []);

            console.log('✅ Tabelas carregadas:', tabelasData);
            setTabelas(tabelasData);
        } catch (error) {
            console.error('❌ Erro ao carregar tabelas:', error);
            setErro('Erro ao carregar tabelas: ' + (error.response?.data?.detail || error.message));
            setTabelas([]); // Garantir que sempre seja array mesmo em erro
        } finally {
            setLoading(false);
        }
    };

    const handleAdicionarTabela = async () => {
        try {
            if (!novaTabela.nome.trim()) {
                alert('⚠️ Digite um nome para a tabela!');
                return;
            }

            const percentual = parseFloat(novaTabela.percentual);
            if (isNaN(percentual)) {
                alert('⚠️ Digite um percentual válido!');
                return;
            }

            setLoading(true);
            console.log('➕ Adicionando tabela:', novaTabela);

            const response = await axiosInstance.post('/tabelas-comerciais/', {
                nome: novaTabela.nome.trim(),
                percentual: percentual,
                ativo: true,
                padrao: false
            });

            console.log('✅ Tabela adicionada:', response.data);
            setNovaTabela({ nome: '', percentual: '' });
            setSucesso('✅ Tabela adicionada com sucesso!');
            setTimeout(() => setSucesso(''), 3000);

            // Recarregar lista
            carregarTabelas();

        } catch (error) {
            console.error('❌ Erro ao adicionar tabela:', error);
            setErro('Erro ao adicionar tabela: ' + (error.response?.data?.nome?.[0] || error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleRemoverTabela = async (id, tabela) => {
        // Não permitir remover a tabela padrão
        if (tabela && tabela.padrao) {
            alert('⚠️ A tabela "Valor Atual" não pode ser removida!');
            return;
        }

        if (!confirm('⚠️ Tem certeza que deseja remover esta tabela?')) {
            return;
        }

        try {
            setLoading(true);
            console.log('🗑️ Removendo tabela:', id);

            await axiosInstance.delete(`/tabelas-comerciais/${id}/`);

            console.log('✅ Tabela removida com sucesso');
            setSucesso('✅ Tabela removida com sucesso!');
            setTimeout(() => setSucesso(''), 3000);

            // Recarregar lista
            carregarTabelas();

        } catch (error) {
            console.error('❌ Erro ao remover tabela:', error);
            setErro('Erro ao remover tabela: ' + (error.response?.data?.error || error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleIniciarEdicao = (tabela) => {
        if (tabela.padrao) {
            alert('⚠️ A tabela "Valor Atual" não pode ser editada!');
            return;
        }
        setEditando(tabela.id_tabela_comercial);
        setTabelaEditada({
            nome: tabela.nome,
            percentual: tabela.percentual,
            perguntar_ao_vender: tabela.perguntar_ao_vender || false
        });
    };

    const handleCancelarEdicao = () => {
        setEditando(null);
        setTabelaEditada({ nome: '', percentual: '', perguntar_ao_vender: false });
    };

    const handleSalvarEdicao = async () => {
        try {
            if (!tabelaEditada.nome.trim()) {
                alert('⚠️ Digite um nome para a tabela!');
                return;
            }

            const percentual = parseFloat(tabelaEditada.percentual);
            if (isNaN(percentual)) {
                alert('⚠️ Digite um percentual válido!');
                return;
            }

            setLoading(true);
            console.log('💾 Salvando edição:', editando, tabelaEditada);

            const response = await axiosInstance.put(`/tabelas-comerciais/${editando}/`, {
                nome: tabelaEditada.nome.trim(),
                percentual: percentual,
                ativo: true,
                perguntar_ao_vender: Boolean(tabelaEditada.perguntar_ao_vender)
            });

            console.log('✅ Tabela atualizada com sucesso', response.data);
            console.log('🔄 Saindo do modo de edição...');
            setEditando(null);
            setTabelaEditada({ nome: '', percentual: '', perguntar_ao_vender: false });
            setSucesso('✅ Tabela atualizada com sucesso!');
            setTimeout(() => setSucesso(''), 3000);

            // Recarregar lista
            carregarTabelas();

        } catch (error) {
            console.error('❌ Erro ao editar tabela:', error);
            setErro('Erro ao editar tabela: ' + (error.response?.data?.nome?.[0] || error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePerguntarVender = async (id, valor) => {
        try {
            console.log(`🔄 Alterando perguntar_ao_vender da tabela ${id} para ${valor}`);

            const tabelaAtual = tabelas.find(t => t.id_tabela_comercial === id);
            if (!tabelaAtual) return;

            await axiosInstance.patch(`/tabelas-comerciais/${id}/`, {
                perguntar_ao_vender: valor
            });

            console.log('✅ Campo perguntar_ao_vender atualizado');

            // Atualizar localmente
            setTabelas(tabelas.map(t =>
                t.id_tabela_comercial === id
                    ? { ...t, perguntar_ao_vender: valor }
                    : t
            ));

        } catch (error) {
            console.error('❌ Erro ao atualizar campo:', error);
            setErro('Erro ao atualizar: ' + (error.response?.data?.detail || error.message));
            // Recarregar para garantir sincronização
            carregarTabelas();
        }
    };

    const calcularPrecoComTabela = (precoBase, percentual) => {
        const preco = parseFloat(precoBase) || 0;
        const perc = parseFloat(percentual) || 0;
        const ajuste = preco * (perc / 100);
        return preco + ajuste;
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    💰 Tabelas Comerciais de Preço
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Crie tabelas de preço que serão aplicadas automaticamente na hora da venda, sem alterar o preço cadastrado do produto
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

                {/* Formulário para adicionar nova tabela */}
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
                    <Typography variant="h6" gutterBottom>
                        ➕ Nova Tabela de Preço
                    </Typography>

                    <Grid container spacing={2} alignItems="flex-end">
                        <Grid item xs={12} md={5}>
                            <TextField
                                fullWidth
                                label="Nome da Tabela"
                                placeholder="Ex: Atacado, Varejo, Promoção..."
                                value={novaTabela.nome}
                                onChange={(e) => setNovaTabela({ ...novaTabela, nome: e.target.value })}
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Percentual de Ajuste"
                                placeholder="Ex: 10 ou -15"
                                value={novaTabela.percentual}
                                onChange={(e) => setNovaTabela({ ...novaTabela, percentual: e.target.value })}
                                type="number"
                                size="small"
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                }}
                                helperText="Positivo aumenta, negativo diminui"
                            />
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAdicionarTabela}
                                disabled={loading}
                                fullWidth
                                startIcon={<AddIcon />}
                            >
                                Adicionar Tabela
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Lista de Tabelas Criadas */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    📋 Tabelas Cadastradas ({tabelas.length})
                </Typography>

                {tabelas.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                        <Typography color="text.secondary">
                            Nenhuma tabela cadastrada ainda. Crie sua primeira tabela acima!
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Nome da Tabela</strong></TableCell>
                                    <TableCell align="center"><strong>Ajuste</strong></TableCell>
                                    <TableCell align="center"><strong>Perguntar ao Vender</strong></TableCell>
                                    <TableCell align="right"><strong>Exemplo: R$ 100,00 →</strong></TableCell>
                                    <TableCell align="center"><strong>Ações</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tabelas.map((tabela) => {
                                    const precoExemplo = 100;
                                    const precoComAjuste = calcularPrecoComTabela(precoExemplo, tabela.percentual);
                                    const diferenca = precoComAjuste - precoExemplo;

                                    const estaEditando = editando === tabela.id_tabela_comercial;

                                    return (
                                        <TableRow key={tabela.id_tabela_comercial} hover>
                                            <TableCell>
                                                {estaEditando ? (
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        value={tabelaEditada.nome}
                                                        onChange={(e) => setTabelaEditada({ ...tabelaEditada, nome: e.target.value })}
                                                        placeholder="Nome da tabela"
                                                    />
                                                ) : (
                                                    <>
                                                        <Typography fontWeight="bold">{tabela.nome}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Criada em: {new Date(tabela.data_criacao).toLocaleDateString('pt-BR')}
                                                        </Typography>
                                                    </>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {estaEditando ? (
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        value={tabelaEditada.percentual}
                                                        onChange={(e) => setTabelaEditada({ ...tabelaEditada, percentual: e.target.value })}
                                                        InputProps={{
                                                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                                        }}
                                                        sx={{ width: 120 }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        label={`${tabela.percentual > 0 ? '+' : ''}${tabela.percentual}%`}
                                                        color={tabela.percentual >= 0 ? 'success' : 'error'}
                                                        size="medium"
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                {estaEditando ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                        <Checkbox
                                                            checked={Boolean(tabelaEditada.perguntar_ao_vender)}
                                                            onChange={(e) => {
                                                                setTabelaEditada({ ...tabelaEditada, perguntar_ao_vender: e.target.checked });
                                                            }}
                                                            color="primary"
                                                            size="small"
                                                        />
                                                        <Chip
                                                            label={Boolean(tabelaEditada.perguntar_ao_vender) ? 'Sim' : 'Não'}
                                                            color={Boolean(tabelaEditada.perguntar_ao_vender) ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                            (Clique no 💾 para salvar)
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                        <Checkbox
                                                            checked={Boolean(tabela.perguntar_ao_vender)}
                                                            onChange={(e) => {
                                                                handleTogglePerguntarVender(tabela.id_tabela_comercial, e.target.checked);
                                                            }}
                                                            color="primary"
                                                            size="small"
                                                        />
                                                        <Chip
                                                            label={Boolean(tabela.perguntar_ao_vender) ? 'Sim' : 'Não'}
                                                            color={Boolean(tabela.perguntar_ao_vender) ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                                    <Typography variant="body2" color="text.secondary">
                                                        R$ {precoExemplo.toFixed(2)}
                                                    </Typography>
                                                    <Typography variant="body2">→</Typography>
                                                    <Typography
                                                        variant="body1"
                                                        fontWeight="bold"
                                                        color={tabela.percentual >= 0 ? 'success.main' : 'error.main'}
                                                    >
                                                        R$ {precoComAjuste.toFixed(2)}
                                                    </Typography>
                                                    <Chip
                                                        label={`${diferenca >= 0 ? '+' : ''}R$ ${diferenca.toFixed(2)}`}
                                                        color={diferenca >= 0 ? 'success' : 'error'}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="center">
                                                {tabela.padrao ? (
                                                    <Chip label="Padrão" size="small" color="default" />
                                                ) : estaEditando ? (
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        <Tooltip title="Salvar">
                                                            <IconButton
                                                                color="success"
                                                                onClick={handleSalvarEdicao}
                                                                disabled={loading}
                                                                size="small"
                                                            >
                                                                <SaveIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Cancelar">
                                                            <IconButton
                                                                color="default"
                                                                onClick={handleCancelarEdicao}
                                                                size="small"
                                                            >
                                                                <CancelIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                ) : (
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        <Tooltip title="Editar Tabela">
                                                            <IconButton
                                                                color="primary"
                                                                onClick={() => handleIniciarEdicao(tabela)}
                                                                size="small"
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Remover Tabela">
                                                            <IconButton
                                                                color="error"
                                                                onClick={() => handleRemoverTabela(tabela.id_tabela_comercial, tabela)}
                                                                size="small"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.primary">
                        💡 <strong>Como Funciona:</strong>
                        <br />
                        • As tabelas criadas aqui estarão disponíveis na tela de vendas
                        <br />
                        • Ao selecionar uma tabela durante a venda, o preço será calculado automaticamente
                        <br />
                        • O preço original do produto NÃO é alterado, apenas o valor na venda
                        <br />
                        • Use percentuais positivos para aumentar (ex: 10%) ou negativos para descontos (ex: -15%)
                        <br />
                        <br />
                        <strong>🔔 Perguntar ao Vender:</strong>
                        <br />
                        • <strong>SIM</strong>: Pergunta ao adicionar produto E ao gerar financeiro (2 vezes)
                        <br />
                        • <strong>NÃO</strong>: Pergunta apenas ao adicionar o primeiro produto (1 vez)
                        <br />
                        <br />
                        <strong>Exemplos de Uso:</strong>
                        <br />
                        • <strong>Atacado (-10%)</strong>: Para vendas em grande quantidade
                        <br />
                        • <strong>Varejo (0%)</strong>: Preço normal de tabela
                        <br />
                        • <strong>Promoção (-20%)</strong>: Para períodos promocionais
                        <br />
                        • <strong>Premium (+15%)</strong>: Para serviços especiais ou delivery
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default TabelaComercialPage;
