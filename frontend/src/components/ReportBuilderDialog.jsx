import React, { useState, useEffect } from 'react';
import {
    Box, Dialog, Typography, IconButton, Stack, TextField,
    FormControl, InputLabel, Select, MenuItem, Switch, Button
} from '@mui/material';
import {
    Close as CloseIcon,
    Save as SaveIcon
} from '@mui/icons-material';

const CAMPOS_DISPONIVEIS = [
    // Empresa
    { label: "Logomarca da Empresa", chave: "empresa.logomarca" },
    { label: "Razão Social da Empresa", chave: "empresa.razao_social" },
    { label: "Nome Fantasia da Empresa", chave: "empresa.nome_fantasia" },
    { label: "CNPJ da Empresa", chave: "empresa.cnpj" },
    { label: "Inscrição Estadual da Empresa", chave: "empresa.inscricao_estadual" },
    { label: "Telefone da Empresa", chave: "empresa.telefone" },
    { label: "E-mail da Empresa", chave: "empresa.email" },
    { label: "Endereço da Empresa", chave: "empresa.endereco" },
    { label: "CEP da Empresa", chave: "empresa.cep" },

    // Cliente
    { label: "Nome do Cliente", chave: "cliente.nome" },
    { label: "CPF/CNPJ Cliente", chave: "cliente.doc" },
    { label: "Telefone Cliente", chave: "cliente.telefone" },
    { label: "Endereço Cliente", chave: "cliente.endereco" },
    { label: "RG/IE do Cliente", chave: "cliente.rg_ie" },
    { label: "E-mail do Cliente", chave: "cliente.email" },
    { label: "Bairro do Cliente", chave: "cliente.bairro" },
    { label: "Cidade do Cliente", chave: "cliente.cidade" },
    { label: "UF do Cliente", chave: "cliente.uf" },
    { label: "CEP do Cliente", chave: "cliente.cep" },
    { label: "Complemento do Cliente", chave: "cliente.complemento" },

    // Venda
    { label: "Número da Venda", chave: "venda.numero" },
    { label: "Data da Venda", chave: "venda.data" },
    { label: "Total da Venda", chave: "venda.total" },
    { label: "Subtotal Venda", chave: "venda.subtotal" },
    { label: "Desconto Venda", chave: "venda.desconto" },
    { label: "Frete da Venda", chave: "venda.frete" },
    { label: "Forma de Pagamento", chave: "venda.forma_pagamento" },

    // Produto
    { label: "Código do Produto", chave: "produto.codigo" },
    { label: "Descrição do Produto", chave: "produto.descricao" },
    { label: "Valor Unitário", chave: "produto.valor_unit" },
    { label: "Quantidade", chave: "produto.quantidade" },
    { label: "Subtotal do Item", chave: "produto.subtotal" },
    { label: "Código de Barras", chave: "produto.codigo_barras" },
    { label: "Unidade do Produto", chave: "produto.unidade" },
    { label: "NCM do Produto", chave: "produto.ncm" },
    { label: "Grupo do Produto", chave: "produto.grupo" },
    { label: "Marca do Produto", chave: "produto.marca" },
    { label: "Preço de Custo", chave: "produto.preco_custo" },
    { label: "Peso Líquido", chave: "produto.peso_liquido" },
    { label: "Peso Bruto", chave: "produto.peso_bruto" },

    // Ordem de Serviço
    { label: "Número da OS", chave: "os.numero" },
    { label: "Data Abertura OS", chave: "os.data_abertura" },
    { label: "Previsão/Fechamento OS", chave: "os.data_fechamento" },
    { label: "Status da OS", chave: "os.status" },
    { label: "Técnico Responsável", chave: "os.tecnico" },
    { label: "Defeitos OS", chave: "os.defeitos" },
    { label: "Laudo Técnico OS", chave: "os.laudo_tecnico" },
    { label: "Observações OS", chave: "os.observacoes" },
    { label: "Solicitante OS", chave: "os.solicitante" },
    { label: "Total Produtos OS", chave: "os.total_produtos" },
    { label: "Total Serviços OS", chave: "os.total_servicos" },
    { label: "Total Geral OS", chave: "os.total_geral" },
    { label: "Desconto OS", chave: "os.desconto" },
    { label: "Subtotal OS", chave: "os.subtotal" },
    { label: "Tabela de Itens (OS/Venda)", chave: "os.itens_tabela" },

    // Veículo
    { label: "Placa do Veículo", chave: "veiculo.placa" },
    { label: "Marca do Veículo", chave: "veiculo.marca" },
    { label: "Modelo do Veículo", chave: "veiculo.modelo" },
    { label: "Ano do Veículo", chave: "veiculo.ano" },
    { label: "Cor do Veículo", chave: "veiculo.cor" },
    { label: "Chassi do Veículo", chave: "veiculo.chassi" },
    { label: "UF do Veículo", chave: "veiculo.uf" },
    { label: "Observações do Veículo", chave: "veiculo.observacoes" },

    // Equipamento
    { label: "Código Equipamento", chave: "equipamento.codigo" },
    { label: "Nome Equipamento", chave: "equipamento.nome" },
    { label: "Descrição Equipamento", chave: "equipamento.descricao" },
    { label: "Categoria Equipamento", chave: "equipamento.categoria" },
    { label: "Marca Equipamento", chave: "equipamento.marca" },
    { label: "Modelo Equipamento", chave: "equipamento.modelo" },
    { label: "Série Equipamento", chave: "equipamento.numero_serie" },
    { label: "Status Equipamento", chave: "equipamento.status" },
    { label: "Observações Equipamento", chave: "equipamento.observacoes" },

    // Animal / Pet
    { label: "Nome do Pet/Animal", chave: "animal.nome" },
    { label: "Raça do Pet/Animal", chave: "animal.raca" },
    { label: "Sexo do Pet/Animal", chave: "animal.sexo" },
    { label: "Peso do Pet/Animal", chave: "animal.peso" },
    { label: "Cor do Pet/Animal", chave: "animal.cor" },
    { label: "Observações do Pet/Animal", chave: "animal.observacoes" },
];

const migrateLayoutToBanded = (layout) => {
    if (!layout) {
        return {
            configuracao_faixas: { header_height: 120, detail_height: 40, summary_height: 60, footer_height: 80 },
            elementos: []
        };
    }
    if (!Array.isArray(layout)) {
        if (layout.configuracao_faixas && layout.elementos) {
            return layout;
        }
        return {
            configuracao_faixas: { header_height: 120, detail_height: 40, summary_height: 60, footer_height: 80 },
            elementos: []
        };
    }
    
    // Flat array layout conversion
    const inferSection = (chave) => {
        if (!chave) return 'header';
        if (chave.startsWith('produto.') || chave === 'venda.itens_tabela' || chave === 'os.itens_tabela') {
            return 'detail';
        }
        if (['venda.total', 'venda.subtotal', 'venda.desconto', 'venda.frete', 'venda.forma_pagamento', 'venda.total_geral', 'venda.total_desconto', 'venda.total_frete', 'os.total_produtos', 'os.total_servicos', 'os.total_geral', 'os.desconto', 'os.subtotal'].includes(chave)) {
            return 'summary';
        }
        if (chave.startsWith('empresa.') || chave.startsWith('cliente.') || chave.startsWith('veiculo.') || chave.startsWith('equipamento.') || chave.startsWith('animal.') || ['venda.numero', 'venda.data', 'os.numero', 'os.data_abertura', 'os.data_fechamento', 'os.status', 'os.tecnico', 'os.defeitos', 'os.laudo_tecnico', 'os.observacoes', 'os.solicitante'].includes(chave)) {
            return 'header';
        }
        return 'header';
    };

    const grouped = { header: [], detail: [], summary: [], footer: [] };
    layout.forEach(el => {
        const sec = el.secao || inferSection(el.campo_origem);
        grouped[sec].push(el);
    });

    const configuracao_faixas = {
        header_height: 120,
        detail_height: 40,
        summary_height: 60,
        footer_height: 80
    };

    const elementos_novos = [];

    ['header', 'detail', 'summary', 'footer'].forEach(sec => {
        const els = grouped[sec];
        if (els.length === 0) return;
        
        // Find minimum absolute y to determine start relative y
        const minY = Math.min(...els.map(e => e.y));
        
        // Convert y to relative
        els.forEach(el => {
            const relY = Math.max(0, el.y - minY);
            elementos_novos.push({
                ...el,
                secao: sec,
                y: relY
            });
        });

        // Determine band height
        const maxRelYWithHeight = Math.max(...els.map(e => (e.y - minY) + (e.altura || 30)));
        const defaultHeight = sec === 'header' ? 120 : (sec === 'detail' ? 40 : (sec === 'summary' ? 60 : 80));
        configuracao_faixas[`${sec}_height`] = Math.max(defaultHeight, maxRelYWithHeight + 10);
    });

    return {
        configuracao_faixas,
        elementos: elementos_novos
    };
};

export default function ReportBuilderDialog({ open, onClose, onSave, initialData }) {
    const [nomeRelatorio, setNomeRelatorio] = useState('');
    const [tipoGabarito, setTipoGabarito] = useState('A4_RETRATO');
    const [larguraMm, setLarguraMm] = useState(210);
    const [alturaMm, setAlturaMm] = useState(297);
    const [elementosLayout, setElementosLayout] = useState([]);
    const [elementoSelecionado, setElementoSelecionado] = useState(null);
    const [gridSnap, setGridSnap] = useState(true);
    const [zoomScale, setZoomScale] = useState(1.0);
    
    // Alturas dinâmicas das faixas (Bands)
    const [alturas, setAlturas] = useState({
        header_height: 120,
        detail_height: 40,
        summary_height: 60,
        footer_height: 80
    });

    useEffect(() => {
        if (open && initialData) {
            setNomeRelatorio(initialData.nome_relatorio || '');
            setTipoGabarito(initialData.tipo_gabarito || 'A4_RETRATO');
            setLarguraMm(initialData.largura_gabarito_mm || 210);
            setAlturaMm(initialData.altura_gabarito_mm || 297);
            
            // Load and migrate layout to banded structure
            const banded = migrateLayoutToBanded(initialData.layout_json);
            setAlturas(banded.configuracao_faixas);
            setElementosLayout(banded.elementos);
            
            setElementoSelecionado(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleSalvar = () => {
        if (!nomeRelatorio.trim()) {
            alert('Por favor, informe o nome.');
            return;
        }
        onSave({
            nome_relatorio: nomeRelatorio,
            tipo_gabarito: tipoGabarito,
            largura_gabarito_mm: larguraMm,
            altura_gabarito_mm: alturaMm,
            layout_json: {
                configuracao_faixas: alturas,
                elementos: elementosLayout
            },
            ativo: true
        });
    };

    const inferDefaultSection = (chave) => {
        if (!chave) return 'header';
        if (chave.startsWith('produto.') || chave === 'venda.itens_tabela' || chave === 'os.itens_tabela') {
            return 'detail';
        }
        if (['venda.total', 'venda.subtotal', 'venda.desconto', 'venda.frete', 'venda.forma_pagamento', 'venda.total_geral', 'venda.total_desconto', 'venda.total_frete', 'os.total_produtos', 'os.total_servicos', 'os.total_geral', 'os.desconto', 'os.subtotal'].includes(chave)) {
            return 'summary';
        }
        if (chave.startsWith('empresa.') || chave.startsWith('cliente.') || chave.startsWith('veiculo.') || chave.startsWith('equipamento.') || chave.startsWith('animal.') || ['venda.numero', 'venda.data', 'os.numero', 'os.data_abertura', 'os.data_fechamento', 'os.status', 'os.tecnico', 'os.defeitos', 'os.laudo_tecnico', 'os.observacoes', 'os.solicitante'].includes(chave)) {
            return 'header';
        }
        return 'header';
    };

    const adicionarCampoAoLayout = (campo) => {
        const isShape = campo.chave.startsWith('forma.');
        const isTable = campo.chave === 'venda.itens_tabela' || campo.chave === 'os.itens_tabela';
        
        let defaultW = 180;
        let defaultH = undefined;
        
        if (campo.chave === 'forma.retangulo') {
            defaultW = 100;
            defaultH = 50;
        } else if (campo.chave === 'forma.linha_h') {
            defaultW = 200;
            defaultH = 2;
        } else if (campo.chave === 'forma.linha_v') {
            defaultW = 2;
            defaultH = 100;
        } else if (isTable) {
            defaultW = 500;
            defaultH = 150;
        }
        
        const targetSecao = inferDefaultSection(campo.chave);
        
        const novoElemento = {
            id: '_' + Math.random().toString(36).substr(2, 9),
            campo_origem: campo.chave,
            label: campo.label,
            x: 30,
            y: 10, // Posiciona em y=10 relativo ao topo da faixa
            font_size: isShape ? undefined : 14,
            largura: defaultW,
            altura: defaultH,
            bold: false,
            color: '#000000',
            secao: targetSecao,
            ...(campo.chave === 'texto.livre' ? { valor_customizado: 'Texto Livre' } : {})
        };
        setElementosLayout([...elementosLayout, novoElemento]);
        setElementoSelecionado(novoElemento);
    };

    const atualizarPosicao = (id, novaPosicao, draggingInfo = null) => {
        let updatedElement = null;
        setElementosLayout(prev => {
            const nextList = prev.map(el => {
                if (el.id === id) {
                    let x = novaPosicao.x;
                    let y = novaPosicao.y;
                    let secao = el.secao || 'header';
                    
                    if (draggingInfo) {
                        let sheetY = draggingInfo.sheetY;
                        
                        if (gridSnap) {
                            x = Math.round(x / 10) * 10;
                            sheetY = Math.round(sheetY / 10) * 10;
                        }
                        
                        const maxW = larguraMm * 3.779527559;
                        const elW = el.largura || 20;
                        const elH = el.altura || 20;
                        
                        x = Math.max(0, Math.min(x, maxW - elW));
                        
                        const headerH = alturas.header_height || 120;
                        const detailH = alturas.detail_height || 40;
                        const summaryH = alturas.summary_height || 60;
                        const footerH = alturas.footer_height || 80;
                        const totalH = headerH + detailH + summaryH + footerH;
                        
                        sheetY = Math.max(0, Math.min(sheetY, totalH - elH));
                        
                        if (sheetY < headerH) {
                            secao = 'header';
                            y = sheetY;
                        } else if (sheetY < headerH + detailH) {
                            secao = 'detail';
                            y = sheetY - headerH;
                        } else if (sheetY < headerH + detailH + summaryH) {
                            secao = 'summary';
                            y = sheetY - (headerH + detailH);
                        } else {
                            secao = 'footer';
                            y = sheetY - (headerH + detailH + summaryH);
                        }
                        
                        const bandH = alturas[`${secao}_height`] || 100;
                        y = Math.max(0, Math.min(y, bandH - elH));
                    } else {
                        if (gridSnap) {
                            x = Math.round(x / 10) * 10;
                            y = Math.round(y / 10) * 10;
                        }
                        const maxW = larguraMm * 3.779527559;
                        const bandType = el.secao || 'header';
                        const bandH = alturas[`${bandType}_height`] || 100;
                        const elW = el.largura || 20;
                        const elH = el.altura || 20;
                        x = Math.max(0, Math.min(x, maxW - elW));
                        y = Math.max(0, Math.min(y, bandH - elH));
                    }
                    
                    updatedElement = { ...el, x, y, secao };
                    return updatedElement;
                }
                return el;
            });
            return nextList;
        });
        
        if (updatedElement && elementoSelecionado && elementoSelecionado.id === id) {
            setElementoSelecionado(updatedElement);
        }
    };

    const atualizarPropriedades = (propriedade, valor) => {
        if (!elementoSelecionado) return;
        setElementosLayout(prev => prev.map(el => {
            if (el.id === elementoSelecionado.id) {
                let updated = { ...el, [propriedade]: valor };
                
                // Limita as coordenadas caso mudem ou mude a seção
                const maxW = larguraMm * 3.779527559;
                const bandType = updated.secao || 'header';
                const bandH = alturas[`${bandType}_height`] || 100;
                const elW = updated.largura || 20;
                const elH = updated.altura || 20;
                
                if (propriedade === 'x' || propriedade === 'largura') {
                    updated.x = Math.max(0, Math.min(updated.x, maxW - elW));
                }
                if (propriedade === 'y' || propriedade === 'altura' || propriedade === 'secao') {
                    updated.y = Math.max(0, Math.min(updated.y, bandH - elH));
                }
                
                setElementoSelecionado(updated);
                return updated;
            }
            return el;
        }));
    };

    const alterarAlturaFaixa = (faixaKey, novaAltura) => {
        const hVal = Math.max(20, parseInt(novaAltura) || 0);
        setAlturas(prev => {
            const nextAlturas = { ...prev, [faixaKey]: hVal };
            // Clampa os elementos dentro desta faixa
            setElementosLayout(prevEls => prevEls.map(el => {
                const elSecao = el.secao || 'header';
                if (`${elSecao}_height` === faixaKey) {
                    const elH = el.altura || 20;
                    const clampedY = Math.max(0, Math.min(el.y, hVal - elH));
                    const updated = { ...el, y: clampedY };
                    if (elementoSelecionado && elementoSelecionado.id === el.id) {
                        setElementoSelecionado(updated);
                    }
                    return updated;
                }
                return el;
            }));
            return nextAlturas;
        });
    };

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={onClose}
        >
            <Box display="flex" flexDirection="column" height="100vh" bgcolor="#f5f6f8" sx={{ overflow: 'hidden' }}>
                {/* Toolbar header */}
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    px={3}
                    py={1.5}
                    bgcolor="#ffffff"
                    borderBottom="1px solid"
                    borderColor="divider"
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <IconButton onClick={onClose} color="inherit">
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h6" fontWeight={700}>Aperus Report Builder</Typography>
                    </Stack>

                    <Stack direction="row" spacing={3} alignItems="center">
                        <TextField
                            size="small"
                            label="Nome"
                            value={nomeRelatorio}
                            onChange={(e) => setNomeRelatorio(e.target.value)}
                            sx={{ width: 220 }}
                        />

                        <FormControl size="small" sx={{ width: 180 }}>
                            <InputLabel>Tipo de Layout</InputLabel>
                            <Select
                                value={tipoGabarito}
                                label="Tipo de Layout"
                                disabled
                            >
                                <MenuItem value="ETIQUETA">Etiqueta Térmica</MenuItem>
                                <MenuItem value="A4_RETRATO">Relatório A4 Retrato</MenuItem>
                                <MenuItem value="A4_PAISAGEM">Relatório A4 Paisagem</MenuItem>
                                <MenuItem value="RECIBO">Recibo / Bobina 80mm</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            size="small"
                            type="number"
                            label="Largura (mm)"
                            value={larguraMm}
                            onChange={(e) => setLarguraMm(parseInt(e.target.value) || 0)}
                            sx={{ width: 100 }}
                        />

                        <TextField
                            size="small"
                            type="number"
                            label="Altura (mm)"
                            value={alturaMm}
                            onChange={(e) => setAlturaMm(parseInt(e.target.value) || 0)}
                            sx={{ width: 100 }}
                        />

                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="caption" fontWeight={600}>Grid Snap (10px)</Typography>
                            <Switch size="small" checked={gridSnap} onChange={(e) => setGridSnap(e.target.checked)} />
                        </Stack>
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mr: 2 }}>
                            <Typography variant="caption" color="text.secondary">Zoom: {Math.round(zoomScale * 100)}%</Typography>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={zoomScale}
                                onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                                style={{ width: 100 }}
                            />
                        </Stack>

                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<SaveIcon />}
                            onClick={handleSalvar}
                        >
                            Salvar Layout
                        </Button>
                    </Stack>
                </Box>

                {/* Canvas workspace */}
                <Box display="flex" flex={1} overflow="hidden">
                    {/* Left sidebar: available fields and Band Heights */}
                    <Box
                        width={280}
                        bgcolor="#ffffff"
                        borderRight="1px solid"
                        borderColor="divider"
                        p={2.5}
                        display="flex"
                        flexDirection="column"
                        overflow="auto"
                    >
                        <Typography variant="subtitle2" fontWeight={700} mb={1}>Altura das Faixas (px)</Typography>
                        <Stack spacing={1.5} mb={3}>
                            <TextField
                                size="small"
                                type="number"
                                label="Header (Cabeçalho)"
                                value={alturas.header_height}
                                onChange={(e) => alterarAlturaFaixa('header_height', e.target.value)}
                            />
                            <TextField
                                size="small"
                                type="number"
                                label="Detail (Corpo / Loop)"
                                value={alturas.detail_height}
                                onChange={(e) => alterarAlturaFaixa('detail_height', e.target.value)}
                            />
                            <TextField
                                size="small"
                                type="number"
                                label="Summary (Resumo)"
                                value={alturas.summary_height}
                                onChange={(e) => alterarAlturaFaixa('summary_height', e.target.value)}
                            />
                            <TextField
                                size="small"
                                type="number"
                                label="Footer (Rodapé)"
                                value={alturas.footer_height}
                                onChange={(e) => alterarAlturaFaixa('footer_height', e.target.value)}
                            />
                        </Stack>

                        <Typography variant="subtitle2" fontWeight={700} mb={1}>Texto e Formas</Typography>
                        <Stack spacing={1} mb={3}>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1, borderColor: 'grey.300', color: 'text.primary' }}
                                onClick={() => adicionarCampoAoLayout({ label: "Texto Livre", chave: "texto.livre" })}
                            >
                                Texto Livre (Estático)
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1, borderColor: 'grey.300', color: 'text.primary' }}
                                onClick={() => adicionarCampoAoLayout({ label: "Tabela de Produtos (Planilha)", chave: "venda.itens_tabela" })}
                            >
                                Planilha de Produtos
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1, borderColor: 'grey.300', color: 'text.primary' }}
                                onClick={() => adicionarCampoAoLayout({ label: "Retângulo / Borda", chave: "forma.retangulo" })}
                            >
                                Retângulo / Borda
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1, borderColor: 'grey.300', color: 'text.primary' }}
                                onClick={() => adicionarCampoAoLayout({ label: "Linha Horizontal", chave: "forma.linha_h" })}
                            >
                                Linha Horizontal
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1, borderColor: 'grey.300', color: 'text.primary' }}
                                onClick={() => adicionarCampoAoLayout({ label: "Linha Vertical", chave: "forma.linha_v" })}
                            >
                                Linha Vertical
                            </Button>
                        </Stack>

                        <Typography variant="subtitle2" fontWeight={700} mb={1}>Totais Gerais</Typography>
                        <Stack spacing={1} mb={3}>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1, borderColor: 'grey.300', color: 'text.primary' }}
                                onClick={() => adicionarCampoAoLayout({ label: "Total Geral", chave: "venda.total_geral" })}
                            >
                                Total Geral
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1, borderColor: 'grey.300', color: 'text.primary' }}
                                onClick={() => adicionarCampoAoLayout({ label: "Total Geral de Desconto", chave: "venda.total_desconto" })}
                            >
                                Total Geral de Desconto
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1, borderColor: 'grey.300', color: 'text.primary' }}
                                onClick={() => adicionarCampoAoLayout({ label: "Total Geral de Frete", chave: "venda.total_frete" })}
                            >
                                Total Geral de Frete
                            </Button>
                        </Stack>

                        <Typography variant="subtitle2" fontWeight={700} mb={1}>Campos Disponíveis</Typography>
                        <Typography variant="caption" color="text.secondary" mb={2}>
                            Clique em um campo abaixo para adicioná-lo ao layout de impressão.
                        </Typography>
                        <Stack spacing={1}>
                            {CAMPOS_DISPONIVEIS.map(campo => (
                                <Button
                                    key={campo.chave}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        justifyContent: 'flex-start',
                                        textTransform: 'none',
                                        textAlign: 'left',
                                        py: 1,
                                        borderColor: 'grey.300',
                                        color: 'text.primary',
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                            borderColor: 'primary.main',
                                        }
                                    }}
                                    onClick={() => adicionarCampoAoLayout(campo)}
                                >
                                    {campo.label}
                                </Button>
                            ))}
                        </Stack>
                    </Box>

                    {/* Center sheet editor */}
                    <Box
                        flex={1}
                        p={4}
                        display="flex"
                        justifyContent="center"
                        alignItems="flex-start"
                        overflow="auto"
                        sx={{ position: 'relative' }}
                    >
                        <Box
                            className="workspace-sheet-scale-wrapper"
                            style={{
                                transform: `scale(${zoomScale})`,
                                transformOrigin: 'top center',
                                transition: 'transform 0.1s ease-out'
                            }}
                        >
                            <Box
                                sx={{
                                    width: `${larguraMm}mm`,
                                    height: alturaMm > 0 ? `${alturaMm}mm` : 'auto',
                                    minHeight: alturaMm > 0 ? undefined : '160mm',
                                    bgcolor: '#ffffff',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                    border: '1px dashed #7f8c8d',
                                    position: 'relative',
                                    borderRadius: 1,
                                    overflow: 'visible', // Permite que as faixas transbordem visivelmente
                                    backgroundImage: 'radial-gradient(circle, #ccc 1px, transparent 1px)',
                                    backgroundSize: '10px 10px',
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        position: 'absolute',
                                        top: 4,
                                        left: 6,
                                        fontSize: '0.65rem',
                                        opacity: 0.6,
                                        userSelect: 'none',
                                        zIndex: 10
                                    }}
                                >
                                    Área de Impressão ({larguraMm}x{alturaMm}mm)
                                </Typography>

                                {['header', 'detail', 'summary', 'footer'].map(sec => {
                                    const bandHeight = alturas[`${sec}_height`] || 100;
                                    return (
                                        <Box
                                            key={sec}
                                            sx={{
                                                height: `${bandHeight}px`,
                                                position: 'relative',
                                                borderBottom: '2px dashed #3498db',
                                                bgcolor: sec === 'detail' ? '#fcfdfd' : '#ffffff',
                                                width: '100%',
                                                boxSizing: 'border-box',
                                                '&::after': {
                                                    content: `"${sec.toUpperCase()} BAND (${bandHeight}px)"`,
                                                    position: 'absolute',
                                                    bottom: 2,
                                                    left: 6,
                                                    fontSize: '9px',
                                                    fontWeight: 'bold',
                                                    color: '#3498db',
                                                    bgcolor: 'rgba(255,255,255,0.85)',
                                                    padding: '2px 4px',
                                                    borderRadius: '3px',
                                                    pointerEvents: 'none',
                                                    zIndex: 2
                                                }
                                            }}
                                        >
                                            {elementosLayout.filter(el => (el.secao || 'header') === sec).map(el => {
                                                const isSelected = elementoSelecionado?.id === el.id;
                                                const isShape = el.campo_origem.startsWith('forma.');
                                                const isTable = el.campo_origem === 'venda.itens_tabela' || el.campo_origem === 'os.itens_tabela';
                                                
                                                let borderStyle = isSelected ? '2px solid #3498db' : '1px dotted #95a5a6';
                                                let paddingStyle = '4px 24px 4px 6px';
                                                let bgColor = isSelected ? 'rgba(52, 152, 219, 0.05)' : 'rgba(255, 255, 255, 0.9)';
                                                let elHeight = el.altura ? `${el.altura}px` : 'auto';
                                                let elWidth = `${el.largura}px`;
                                                
                                                if (el.campo_origem === 'forma.retangulo') {
                                                    borderStyle = isSelected ? '2px solid #3498db' : `1px solid ${el.color || '#000000'}`;
                                                    bgColor = isSelected ? 'rgba(52, 152, 219, 0.05)' : 'transparent';
                                                    paddingStyle = '0px';
                                                } else if (el.campo_origem === 'forma.linha_h') {
                                                    borderStyle = 'none';
                                                    bgColor = isSelected ? '#3498db' : (el.color || '#000000');
                                                    elHeight = `${el.altura || 2}px`;
                                                    paddingStyle = '0px';
                                                } else if (el.campo_origem === 'forma.linha_v') {
                                                    borderStyle = 'none';
                                                    bgColor = isSelected ? '#3498db' : (el.color || '#000000');
                                                    elWidth = `${el.largura || 2}px`;
                                                    paddingStyle = '0px';
                                                } else if (isTable) {
                                                    borderStyle = isSelected ? '2px solid #3498db' : '1px solid #ccc';
                                                    bgColor = '#fcfcfc';
                                                    paddingStyle = '0px';
                                                }
                                                
                                                const fontStyle = {
                                                    fontWeight: el.bold ? 'bold' : 'normal',
                                                    color: el.color || '#000000',
                                                };

                                                return (
                                                    <Box
                                                        key={el.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setElementoSelecionado(el);
                                                        }}
                                                        sx={{
                                                            position: 'absolute',
                                                            left: `${el.x}px`,
                                                            top: `${el.y}px`,
                                                            fontSize: `${el.font_size || 14}px`,
                                                            width: elWidth,
                                                            height: elHeight,
                                                            border: borderStyle,
                                                            padding: paddingStyle,
                                                            bgcolor: bgColor,
                                                            borderRadius: (isShape || isTable) ? 0 : 1,
                                                            cursor: 'move',
                                                            userSelect: 'none',
                                                            boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'flex-start',
                                                            overflow: 'hidden',
                                                            whiteSpace: (isShape || isTable) ? 'normal' : 'nowrap', // Impede quebra de linha em arrastes
                                                            ...fontStyle
                                                        }}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            setElementoSelecionado(el);
                                                            const startX = e.clientX;
                                                            const startY = e.clientY;
                                                            const initialX = el.x;
                                                            
                                                            const initialSec = el.secao || 'header';
                                                            const headerH = alturas.header_height || 120;
                                                            const detailH = alturas.detail_height || 40;
                                                            const summaryH = alturas.summary_height || 60;
                                                            
                                                            let initialSheetY = el.y;
                                                            if (initialSec === 'detail') {
                                                                initialSheetY += headerH;
                                                            } else if (initialSec === 'summary') {
                                                                initialSheetY += headerH + detailH;
                                                            } else if (initialSec === 'footer') {
                                                                initialSheetY += headerH + detailH + summaryH;
                                                            }
                                                            
                                                            const moverMouse = (moveEvent) => {
                                                                const deltaX = (moveEvent.clientX - startX) / zoomScale;
                                                                const deltaY = (moveEvent.clientY - startY) / zoomScale;
                                                                atualizarPosicao(el.id, {
                                                                    x: initialX + deltaX,
                                                                    y: el.y
                                                                }, {
                                                                    sheetY: initialSheetY + deltaY
                                                                });
                                                            };
                                                            
                                                            const soltarMouse = () => {
                                                                document.removeEventListener('mousemove', moverMouse);
                                                                document.removeEventListener('mouseup', soltarMouse);
                                                            };
                                                            
                                                            document.addEventListener('mousemove', moverMouse);
                                                            document.addEventListener('mouseup', soltarMouse);
                                                        }}
                                                    >
                                                        {!isShape && !isTable && (el.campo_origem === 'texto.livre' ? (el.valor_customizado || '[Texto Livre]') : `[${el.label}]`)}
                                                        {isTable && (
                                                            <Box width="100%" height="100%" display="flex" flexDirection="column" fontSize="10px" sx={{ opacity: 0.6 }}>
                                                                <Box display="flex" bgcolor="#eee" fontWeight="bold" borderBottom="1px solid #ccc" p="2px">
                                                                    <Box flex={1}>Código</Box>
                                                                    <Box flex={3}>Descrição</Box>
                                                                    <Box flex={1}>Qtde</Box>
                                                                    <Box flex={1}>Total</Box>
                                                                </Box>
                                                                <Box p="2px">Item 01...</Box>
                                                                <Box p="2px">Item 02...</Box>
                                                            </Box>
                                                        )}
                                                        {el.campo_origem === 'forma.retangulo' && (
                                                            <Typography variant="caption" sx={{ opacity: 0.3, width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
                                                                Retângulo
                                                            </Typography>
                                                        )}
                                                        
                                                        {isSelected && (
                                                            <IconButton
                                                                size="small"
                                                                sx={{
                                                                    position: 'absolute',
                                                                    right: 2,
                                                                    top: 2,
                                                                    width: 18,
                                                                    height: 18,
                                                                    p: 0,
                                                                    color: 'error.light',
                                                                    bgcolor: 'rgba(255,255,255,0.8)',
                                                                    border: '1px solid',
                                                                    borderColor: 'divider',
                                                                    '&:hover': {
                                                                        color: 'error.main',
                                                                        bgcolor: 'rgba(255,255,255,0.9)'
                                                                    },
                                                                    zIndex: 10
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setElementoSelecionado(null);
                                                                    setElementosLayout(elementosLayout.filter(item => item.id !== el.id));
                                                                }}
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                            >
                                                                <CloseIcon sx={{ fontSize: 12 }} />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    </Box>

                    {/* Right sidebar: property editor */}
                    <Box
                        width={260}
                        bgcolor="#ffffff"
                        borderLeft="1px solid"
                        borderColor="divider"
                        p={2.5}
                        display="flex"
                        flexDirection="column"
                        overflow="auto"
                    >
                        <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Propriedades</Typography>
                        {elementoSelecionado ? (
                            <Stack spacing={2.5}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Campo no Banco</Typography>
                                    <Typography variant="body2" fontWeight={600}>{elementoSelecionado.campo_origem}</Typography>
                                </Box>

                                {elementoSelecionado.campo_origem === 'texto.livre' && (
                                    <TextField
                                        size="small"
                                        label="Texto Livre"
                                        multiline
                                        rows={4}
                                        value={elementoSelecionado.valor_customizado || ''}
                                        onChange={(e) => atualizarPropriedades('valor_customizado', e.target.value)}
                                        fullWidth
                                    />
                                )}

                                <FormControl size="small" fullWidth>
                                    <InputLabel>Seção do Relatório</InputLabel>
                                    <Select
                                        value={elementoSelecionado.secao || 'header'}
                                        label="Seção do Relatório"
                                        onChange={(e) => atualizarPropriedades('secao', e.target.value)}
                                    >
                                        <MenuItem value="header">Page Header (Cabeçalho)</MenuItem>
                                        <MenuItem value="detail">Detail (Corpo / Loop de Itens)</MenuItem>
                                        <MenuItem value="summary">Summary (Resumo / Subtotais)</MenuItem>
                                        <MenuItem value="footer">Report Footer (Rodapé Final)</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    size="small"
                                    type="number"
                                    label="Posição X (px)"
                                    value={elementoSelecionado.x}
                                    onChange={(e) => atualizarPropriedades('x', parseInt(e.target.value) || 0)}
                                />

                                <TextField
                                    size="small"
                                    type="number"
                                    label="Posição Y (px)"
                                    value={elementoSelecionado.y}
                                    onChange={(e) => atualizarPropriedades('y', parseInt(e.target.value) || 0)}
                                />

                                <TextField
                                    size="small"
                                    type="number"
                                    label="Largura do Bloco (px)"
                                    value={elementoSelecionado.largura}
                                    onChange={(e) => atualizarPropriedades('largura', parseInt(e.target.value) || 20)}
                                />

                                {(elementoSelecionado.altura !== undefined || elementoSelecionado.campo_origem.startsWith('forma.') || elementoSelecionado.campo_origem === 'venda.itens_tabela' || elementoSelecionado.campo_origem === 'os.itens_tabela') && (
                                    <TextField
                                        size="small"
                                        type="number"
                                        label="Altura (px)"
                                        value={elementoSelecionado.altura || 0}
                                        onChange={(e) => atualizarPropriedades('altura', parseInt(e.target.value) || 0)}
                                    />
                                )}

                                {!elementoSelecionado.campo_origem.startsWith('forma.') && (
                                    <TextField
                                        size="small"
                                        type="number"
                                        label="Tamanho da Fonte (px)"
                                        value={elementoSelecionado.font_size || 14}
                                        onChange={(e) => atualizarPropriedades('font_size', parseInt(e.target.value) || 8)}
                                    />
                                )}

                                {!elementoSelecionado.campo_origem.startsWith('forma.') && (
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="body2">Texto em Negrito</Typography>
                                        <Switch
                                            checked={elementoSelecionado.bold || false}
                                            onChange={(e) => atualizarPropriedades('bold', e.target.checked)}
                                        />
                                    </Stack>
                                )}

                                <Stack direction="row" spacing={1} alignItems="center">
                                    <TextField
                                        size="small"
                                        label="Cor (Hex)"
                                        value={elementoSelecionado.color || '#000000'}
                                        onChange={(e) => atualizarPropriedades('color', e.target.value)}
                                        sx={{ flex: 1 }}
                                    />
                                    <input
                                        type="color"
                                        value={elementoSelecionado.color || '#000000'}
                                        onChange={(e) => atualizarPropriedades('color', e.target.value)}
                                        style={{ width: 40, height: 40, border: '1px solid #ccc', borderRadius: 4, padding: 0, cursor: 'pointer' }}
                                    />
                                </Stack>

                                <Box bgcolor="info.light" p={1.5} borderRadius={1} sx={{ opacity: 0.85 }}>
                                    <Typography variant="caption" color="info.contrastText" display="block">
                                        Dica: Arraste o elemento na folha branca com o mouse ou digite as coordenadas precisas aqui.
                                    </Typography>
                                </Box>
                            </Stack>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Nenhum campo selecionado. Clique em um elemento na folha para editar.
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
}
