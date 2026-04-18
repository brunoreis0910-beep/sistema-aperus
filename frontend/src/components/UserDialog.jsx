// Em: src/components/UserDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Grid,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Tabs, Tab, Paper,
  FormControlLabel, Checkbox, FormGroup, Alert
} from '@mui/material';
// Grid from @mui/material is used (Unstable_Grid2 not available in this environment)
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import TabPanel from './TabPanel';
import { useAuth } from '../context/AuthContext';

function UserDialog({ open, onClose, onSaveSuccess, userToEdit, vendedores = [], clientes = [], operacoes = [], grupos = [] }) {
  const { axiosInstance } = useAuth();
  // Define todas as permissões usadas no formulário com valor padréo false.
  const basePermissoes = {
    clientes_acessar: false, clientes_criar: false, clientes_editar: false, clientes_excluir: false,
    produtos_acessar: false, produtos_criar: false, produtos_editar: false, produtos_excluir: false,
    fornecedores_acessar: false, fornecedores_criar: false, fornecedores_editar: false, fornecedores_excluir: false,
    financeiro_acessar: false, financeiro_criar: false, financeiro_editar: false, financeiro_excluir: false, financeiro_baixar: false,
    bancario_acessar: false, bancario_criar: false, bancario_editar: false, bancario_excluir: false,
    cheques_acessar: false, cheques_criar: false, cheques_editar: false, cheques_excluir: false,
    config_acessar: false, config_empresa_editar: false, config_usuarios_acessar: false, config_vendedores_acessar: false, config_operacoes_acessar: false, config_apoio_acessar: false,
    config_apoio_criar: false, config_apoio_editar: false, config_apoio_excluir: false,
    config_vendedores_criar: false, config_vendedores_editar: false, config_vendedores_excluir: false,
    config_operacoes_criar: false, config_operacoes_editar: false, config_operacoes_excluir: false,
    config_usuarios_criar: false, config_usuarios_editar: false, config_usuarios_excluir: false,
    vendas_acessar: false, vendas_criar: false, vendas_editar: false, vendas_excluir: false, vendas_cancelar: false,
    venda_rapida_acessar: false,
    compras_acessar: false, compras_criar: false, compras_editar: false, compras_excluir: false,
    trocas_acessar: false, trocas_criar: false, trocas_editar: false, trocas_excluir: false,
    ordens_acessar: false, ordens_criar: false, ordens_editar: false, ordens_excluir: false,
    cotacoes_acessar: false, cotacoes_criar: false, cotacoes_editar: false, cotacoes_excluir: false,
    devolucoes_acessar: false, devolucoes_criar: false, devolucoes_editar: false, devolucoes_excluir: false,
    comandas_acessar: false, comandas_criar: false, comandas_editar: false, comandas_excluir: false,
    petshop_acessar: false, petshop_criar: false, petshop_editar: false, petshop_excluir: false,
    clinica_veterinaria_acessar: false, clinica_veterinaria_criar: false, clinica_veterinaria_editar: false, clinica_veterinaria_excluir: false,
    veiculos_acessar: false, veiculos_criar: false, veiculos_editar: false, veiculos_excluir: false,
    equipamentos_acessar: false, equipamentos_criar: false, equipamentos_editar: false, equipamentos_excluir: false,
    alugueis_acessar: false, alugueis_criar: false, alugueis_editar: false, alugueis_excluir: false,
    catalogo_acessar: false, catalogo_editar: false,
    etiquetas_acessar: false, etiquetas_criar: false, etiquetas_editar: false, etiquetas_excluir: false,
    estoque_acessar: false, estoque_ajustar: false, estoque_transferir: false, estoque_inventariar: false,
    tabela_comercial_acessar: false, tabela_comercial_criar: false, tabela_comercial_editar: false, tabela_comercial_excluir: false,
    relatorios_acessar: false, relatorios_exportar: false,
    graficos_acessar: false,
    mapa_promocao_acessar: false, mapa_promocao_criar: false, mapa_promocao_editar: false, mapa_promocao_excluir: false,
    documentos_fiscais_acessar: false, documentos_fiscais_visualizar: false, documentos_fiscais_cancelar: false, documentos_fiscais_inutilizar: false,
    nfce_acessar: false, nfce_emitir: false, nfce_cancelar: false, nfce_visualizar: false,
    nfe_acessar: false, nfe_emitir: false, nfe_cancelar: false, nfe_visualizar: false, nfe_inutilizar: false,
    cte_acessar: false, cte_emitir: false, cte_cancelar: false, cte_visualizar: false,
    manifestacao_acessar: false, manifestacao_manifestar: false, manifestacao_visualizar: false,
    sped_acessar: false, sped_gerar: false, sped_exportar: false, sped_visualizar: false,
    sped_contribuicoes_acessar: false, sped_contribuicoes_gerar: false, sped_contribuicoes_exportar: false, sped_contribuicoes_visualizar: false,
    aprovacoes_acessar: false, aprovacoes_aprovar: false, aprovacoes_rejeitar: false, aprovacoes_visualizar: false,
    backup_acessar: false, backup_criar: false, backup_restaurar: false, backup_agendar: false,
    agro_acessar: false,
    agro_safras_acessar: false, agro_safras_criar: false, agro_safras_editar: false, agro_safras_excluir: false,
    agro_contratos_acessar: false, agro_contratos_criar: false, agro_contratos_editar: false, agro_contratos_excluir: false,
    agro_conversoes_acessar: false, agro_conversoes_criar: false, agro_conversoes_editar: false, agro_conversoes_excluir: false,
    agro_operacional_acessar: false, agro_operacional_criar: false, agro_operacional_editar: false, agro_operacional_excluir: false,
    dashboard_acessar: false,
    ver_valores_reais: false,
    ver_custos: false,
    alterar_preco_venda: false,
    auditoria_acessar: false, auditoria_visualizar: false, auditoria_exportar: false, auditoria_excluir: false,
    aut_desconto: false,
    aut_cancelar_venda: false,
  };

  // Estado inicial do formulário do usuário. Mantemos pelo menos `permissoes` como objeto para evitar undefined.
  const [userFormData, setUserFormData] = useState({
    permissoes: { ...basePermissoes },
    id_vendedor_venda: null,
    id_operacao_venda: null,
    id_vendedor_os: null,
    id_operacao_os: null,
    mostrar_lucratividade: false,
    habilitar_calc_revestimento: false,
    habilitar_calc_tinta: false,
    habilitar_controle_peso: false,
    habilitar_produto_variacao: false,
    margem_quebra_padrao: 10.00
  });
  const [savingUser, setSavingUser] = useState(false);
  const [userTabValue, setUserTabValue] = useState(0);

  useEffect(() => {
    // Quando o diálogo abre, popula o formulário com os dados do usuário (se existir)
    if (open) {
      if (userToEdit) {
        console.log('UserDialog - Dados recebidos:', userToEdit);
        console.log('UserDialog - Parametros:', userToEdit.parametros);
        // Garante que as permissões existam mesclando com os padrões
        setUserFormData(prev => ({
          ...prev,
          ...userToEdit,
          permissoes: { ...basePermissoes, ...(userToEdit.permissoes || {}) },
          // Campos de Venda Rápida (aba 1)
          id_cliente_padrao: userToEdit.parametros?.id_cliente_padrao || null,
          id_operacao_padrao: userToEdit.parametros?.id_operacao_padrao || null,
          id_vendedor_padrao: userToEdit.parametros?.id_vendedor_padrao || null,
          id_grupo_padrao: userToEdit.parametros?.id_grupo_padrao || null,
          id_tabela_comercial: userToEdit.parametros?.id_tabela_comercial || null,
          // Novos campos de Vendas e OS (aba 2)
          id_vendedor_venda: userToEdit.parametros?.id_vendedor_venda || null,
          id_operacao_venda: userToEdit.parametros?.id_operacao_venda || null,
          id_vendedor_os: userToEdit.parametros?.id_vendedor_os || null,
          id_operacao_os: userToEdit.parametros?.id_operacao_os || null,
          mostrar_lucratividade: userToEdit.parametros?.mostrar_lucratividade || false,
          // Calculadoras de Construção
          habilitar_calc_revestimento: userToEdit.parametros?.habilitar_calc_revestimento || false,
          habilitar_calc_tinta: userToEdit.parametros?.habilitar_calc_tinta || false,
          habilitar_controle_peso: userToEdit.parametros?.habilitar_controle_peso || false,
          habilitar_produto_variacao: userToEdit.parametros?.habilitar_produto_variacao || false,
          margem_quebra_padrao: userToEdit.parametros?.margem_quebra_padrao || 10.00,
          whatsapp_supervisor: userToEdit.parametros?.whatsapp_supervisor || ''
        }));
      } else {
        // Novo usuário: limpa formulário mas mantém permissoes padréo
        setUserFormData({
          permissoes: { ...basePermissoes },
          id_vendedor_venda: null,
          id_operacao_venda: null,
          id_vendedor_os: null,
          id_operacao_os: null,
          mostrar_lucratividade: false,
          habilitar_calc_revestimento: false,
          habilitar_calc_tinta: false,
          habilitar_controle_peso: false,
          habilitar_produto_variacao: false,
          margem_quebra_padrao: 10.00,
          whatsapp_supervisor: ''
        });
      }
    }
  }, [userToEdit, open]);

  const handleUserFormChange = (e) => {
    const { name, value, checked, type } = e.target;

    // Se for checkbox de permissão (começa com perm_)
    if (name.startsWith('perm_')) {
      const permKey = name.replace('perm_', '');
      setUserFormData(prev => ({
        ...prev,
        permissoes: { ...prev.permissoes, [permKey]: checked }
      }));
    } else {
      // Campo normal (texto, select, etc)
      setUserFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  const handleUserTabChange = (event, newValue) => { setUserTabValue(newValue); };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);

    try {
      // Prepara os parâmetros do usuário
      const parametros = {
        id_cliente_padrao: userFormData.id_cliente_padrao || null,
        id_operacao_padrao: userFormData.id_operacao_padrao || null,
        id_vendedor_padrao: userFormData.id_vendedor_padrao || null,
        id_grupo_padrao: userFormData.id_grupo_padrao || null,
        id_tabela_comercial: userFormData.id_tabela_comercial || null,
        // NOVOS CAMPOS
        id_vendedor_venda: userFormData.id_vendedor_venda || null,
        id_operacao_venda: userFormData.id_operacao_venda || null,
        id_vendedor_os: userFormData.id_vendedor_os || null,
        id_operacao_os: userFormData.id_operacao_os || null,
        mostrar_lucratividade: userFormData.mostrar_lucratividade || false,
        // CALCULADORAS DE CONSTRUÇÃO
        habilitar_calc_revestimento: userFormData.habilitar_calc_revestimento || false,
        habilitar_calc_tinta: userFormData.habilitar_calc_tinta || false,
        habilitar_controle_peso: userFormData.habilitar_controle_peso || false,
        habilitar_produto_variacao: userFormData.habilitar_produto_variacao || false,
        margem_quebra_padrao: parseFloat(userFormData.margem_quebra_padrao) || 10.00,
        whatsapp_supervisor: userFormData.whatsapp_supervisor || ''
      };

      const payload = {
        username: userFormData.username,
        email: userFormData.email || '',
        first_name: userFormData.first_name || '',
        last_name: userFormData.last_name || '',
        is_active: userFormData.is_active !== undefined ? userFormData.is_active : true,
        is_staff: userFormData.is_staff || false,
        id_vendedor: userFormData.id_vendedor || null,
        parametros: parametros,
        permissoes: userFormData.permissoes || {}
      };

      if (!userToEdit && userFormData.password) {
        payload.password = userFormData.password;
      }

      if (userToEdit && userToEdit.id) {
        await axiosInstance.put(`/usuarios/${userToEdit.id}/`, payload);
      } else {
        await axiosInstance.post('/usuarios/', payload);
      }

      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      alert('Erro ao salvar usuário: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSavingUser(false);
    }
  };

  // O JSX DESTE COMPONENTE É O QUE ESTAVA DANDO ERRO. 
  // Ele está correto e completo abaixo:

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{userToEdit ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</DialogTitle>
      <DialogContent sx={{ p: 0, minHeight: '500px', maxHeight: '70vh', overflow: 'auto' }}>
        <Box component="form" onSubmit={handleSaveUser}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
            <Tabs value={userTabValue} onChange={handleUserTabChange}>
              <Tab label="Login e Acesso" />
              <Tab label="Venda Rápida" />
              <Tab label="Vendas e OS" />
              <Tab label="Permissões de Acesso" />
            </Tabs>
          </Box>

          {/* Aba 0: Login e Acesso */}
          <TabPanel value={userTabValue} index={0}>
              <Typography variant="h6" gutterBottom>
                Dados Básicos
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nome de Usuário"
                    name="username"
                    value={userFormData.username || ''}
                    onChange={handleUserFormChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={userFormData.email || ''}
                    onChange={handleUserFormChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nome"
                    name="first_name"
                    value={userFormData.first_name || ''}
                    onChange={handleUserFormChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Sobrenome"
                    name="last_name"
                    value={userFormData.last_name || ''}
                    onChange={handleUserFormChange}
                    fullWidth
                  />
                </Grid>
                {!userToEdit && (
                  <Grid item xs={12}>
                    <TextField
                      label="Senha"
                      name="password"
                      type="password"
                      value={userFormData.password || ''}
                      onChange={handleUserFormChange}
                      fullWidth
                      required
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="is_active"
                        checked={userFormData.is_active !== undefined ? userFormData.is_active : true}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      />
                    }
                    label="Usuário Ativo"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="is_staff"
                        checked={userFormData.is_staff || false}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, is_staff: e.target.checked }))}
                      />
                    }
                    label="Acesso Admin"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Vincular a Vendedor</InputLabel>
                    <Select
                      name="id_vendedor"
                      value={userFormData.id_vendedor || ''}
                      onChange={handleUserFormChange}
                      label="Vincular a Vendedor"
                    >
                      <MenuItem value="">
                        <em>Nenhum</em>
                      </MenuItem>
                      {vendedores && vendedores.map(vend => (
                        <MenuItem key={vend.id_vendedor} value={vend.id_vendedor}>
                          {vend.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
          </TabPanel>

          {/* Aba 1: Venda Rápida */}
          <TabPanel value={userTabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Parâmetros de Venda Rápida
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure os valores padrão que serão utilizados na venda rápida
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Cliente Padrão</InputLabel>
                    <Select
                      name="id_cliente_padrao"
                      value={userFormData.id_cliente_padrao || ''}
                      onChange={handleUserFormChange}
                      label="Cliente Padrão"
                    >
                      <MenuItem value="">
                        <em>Nenhum</em>
                      </MenuItem>
                      {clientes && clientes.map(cli => (
                        <MenuItem key={cli.id_cliente} value={cli.id_cliente}>
                          {cli.nome_razao_social}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Operação Padrão</InputLabel>
                    <Select
                      name="id_operacao_padrao"
                      value={userFormData.id_operacao_padrao || ''}
                      onChange={handleUserFormChange}
                      label="Operação Padrão"
                    >
                      <MenuItem value="">
                        <em>Nenhuma</em>
                      </MenuItem>
                      {operacoes && operacoes.map(op => (
                        <MenuItem key={op.id_operacao} value={op.id_operacao}>
                          {op.nome_operacao}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Vendedor Padrão</InputLabel>
                    <Select
                      name="id_vendedor_padrao"
                      value={userFormData.id_vendedor_padrao || ''}
                      onChange={handleUserFormChange}
                      label="Vendedor Padrão"
                    >
                      <MenuItem value="">
                        <em>Nenhum</em>
                      </MenuItem>
                      {vendedores && vendedores.map(vend => (
                        <MenuItem key={vend.id_vendedor} value={vend.id_vendedor}>
                          {vend.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Grupo Padrão</InputLabel>
                    <Select
                      name="id_grupo_padrao"
                      value={userFormData.id_grupo_padrao || ''}
                      onChange={handleUserFormChange}
                      label="Grupo Padrão"
                    >
                      <MenuItem value="">
                        <em>Nenhum</em>
                      </MenuItem>
                      {grupos && grupos.map(grp => (
                        <MenuItem key={grp.id_grupo} value={grp.id_grupo}>
                          {grp.nome_grupo}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Tabela Comercial Padrão (ID)"
                    name="id_tabela_comercial"
                    type="number"
                    value={userFormData.id_tabela_comercial || ''}
                    onChange={handleUserFormChange}
                    fullWidth
                  />
                </Grid>
              </Grid>
          </TabPanel>

          {/* Aba 2: Vendas e OS - NOVA */}
          <TabPanel value={userTabValue} index={2}>
              <Alert severity="warning" sx={{ mb: 3, bgcolor: '#ff0000', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>
                🔴 ABA "VENDAS E OS" ESTÁ RENDERIZANDO - SE VOCÊ VÊ ISSO, A ABA FUNCIONA!
              </Alert>
              
              {/* MOVIDO PARA O TOPO: Calculadoras de Construção - BEM VISÍVEL */}
              <Paper elevation={4} sx={{ p: 4, mb: 3, bgcolor: '#ffebee', border: '4px solid #f44336' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#c62828' }}>
                  🏗️ CALCULADORAS PARA MATERIAL DE CONSTRUÇÃO
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Habilite calculadoras especializadas para agilizar vendas no balcão
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={userFormData.habilitar_calc_revestimento || false}
                            onChange={(e) => setUserFormData(prev => ({ ...prev, habilitar_calc_revestimento: e.target.checked }))}
                          />
                        }
                        label="Calculadora de Revestimento (m²)"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                        Converte área em quantidade de caixas de piso/azulejo
                      </Typography>
                    </FormGroup>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={userFormData.habilitar_calc_tinta || false}
                            onChange={(e) => setUserFormData(prev => ({ ...prev, habilitar_calc_tinta: e.target.checked }))}
                          />
                        }
                        label="Calculadora de Tintas"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                        Calcula quantidade baseada em rendimento e demãos
                      </Typography>
                    </FormGroup>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={userFormData.habilitar_controle_peso || false}
                            onChange={(e) => setUserFormData(prev => ({ ...prev, habilitar_controle_peso: e.target.checked }))}
                          />
                        }
                        label="Controle de Peso Total"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                        Soma peso dos produtos e sugere veículo adequado
                      </Typography>
                    </FormGroup>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={userFormData.habilitar_produto_variacao || false}
                            onChange={(e) => setUserFormData(prev => ({ ...prev, habilitar_produto_variacao: e.target.checked }))}
                          />
                        }
                        label="Produtos com Variações (Grade)"
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                        Grade de medidas/cores do mesmo produto (canos, tintas)
                      </Typography>
                    </FormGroup>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Margem de Quebra Padrão (%)"
                      name="margem_quebra_padrao"
                      type="number"
                      value={userFormData.margem_quebra_padrao || 10}
                      onChange={handleUserFormChange}
                      fullWidth
                      inputProps={{ min: 0, max: 100, step: 0.5 }}
                      helperText="Margem de segurança para cálculo de revestimentos (padrão: 10%)"
                      sx={{ bgcolor: '#fff3e0', '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#f57c00' } } }}
                    />
                  </Grid>
                </Grid>
              </Paper>
              
              <Typography variant="h6" gutterBottom>
                Parâmetros Padrão para Vendas e Ordem de Serviço
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Defina vendedor e operação padrão que serão sugeridos automaticamente ao criar vendas ou ordens de serviço
              </Typography>

              <Grid container spacing={3}>
                {/* Seção: Vendas */}
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Vendas
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Vendedor Padrão (Vendas)</InputLabel>
                          <Select
                            name="id_vendedor_venda"
                            value={userFormData.id_vendedor_venda || ''}
                            onChange={handleUserFormChange}
                            label="Vendedor Padrão (Vendas)"
                          >
                            <MenuItem value="">
                              <em>Nenhum</em>
                            </MenuItem>
                            {vendedores && vendedores.map(vend => (
                              <MenuItem key={vend.id_vendedor} value={vend.id_vendedor}>
                                {vend.nome}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Operação Padrão (Vendas)</InputLabel>
                          <Select
                            name="id_operacao_venda"
                            value={userFormData.id_operacao_venda || ''}
                            onChange={handleUserFormChange}
                            label="Operação Padrão (Vendas)"
                          >
                            <MenuItem value="">
                              <em>Nenhuma</em>
                            </MenuItem>
                            {operacoes && operacoes.map(op => (
                              <MenuItem key={op.id_operacao} value={op.id_operacao}>
                                {op.nome_operacao}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Seção: Ordem de Serviço */}
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Ordem de Serviço
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Vendedor Padrão (OS)</InputLabel>
                          <Select
                            name="id_vendedor_os"
                            value={userFormData.id_vendedor_os || ''}
                            onChange={handleUserFormChange}
                            label="Vendedor Padrão (OS)"
                          >
                            <MenuItem value="">
                              <em>Nenhum</em>
                            </MenuItem>
                            {vendedores && vendedores.map(vend => (
                              <MenuItem key={vend.id_vendedor} value={vend.id_vendedor}>
                                {vend.nome}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Operação Padrão (OS)</InputLabel>
                          <Select
                            name="id_operacao_os"
                            value={userFormData.id_operacao_os || ''}
                            onChange={handleUserFormChange}
                            label="Operação Padrão (OS)"
                          >
                            <MenuItem value="">
                              <em>Nenhuma</em>
                            </MenuItem>
                            {operacoes && operacoes.map(op => (
                              <MenuItem key={op.id_operacao} value={op.id_operacao}>
                                {op.nome_operacao}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Seção: Configurações de Visibilidade */}
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Configurações de Visibilidade
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={userFormData.mostrar_lucratividade || false}
                            onChange={(e) => setUserFormData(prev => ({ ...prev, mostrar_lucratividade: e.target.checked }))}
                          />
                        }
                        label="Mostrar Lucratividade (Custo, Lucro e Margem) em Vendas e OS"
                      />
                    </FormGroup>
                  </Paper>
                </Grid>
              </Grid>
          </TabPanel>

          <TabPanel value={userTabValue} index={3}>
            <Typography variant="body2" sx={{ mb: 2 }}>Controle fino do que o usuário pode fazer. (Administradores ignoram isso).</Typography>
            <Grid container spacing={2}>
              {/* Módulo Clientes */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Clientes</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_clientes_acessar" checked={!!userFormData.permissoes?.clientes_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_clientes_criar" checked={!!userFormData.permissoes?.clientes_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_clientes_editar" checked={!!userFormData.permissoes?.clientes_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_clientes_excluir" checked={!!userFormData.permissoes?.clientes_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Módulo Produtos */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Produtos</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_produtos_acessar" checked={!!userFormData.permissoes?.produtos_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_produtos_criar" checked={!!userFormData.permissoes?.produtos_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_produtos_editar" checked={!!userFormData.permissoes?.produtos_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_produtos_excluir" checked={!!userFormData.permissoes?.produtos_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Módulo Financeiro */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Financeiro</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_financeiro_acessar" checked={!!userFormData.permissoes?.financeiro_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_financeiro_criar" checked={!!userFormData.permissoes?.financeiro_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_financeiro_editar" checked={!!userFormData.permissoes?.financeiro_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_financeiro_excluir" checked={!!userFormData.permissoes?.financeiro_excluir} onChange={handleUserFormChange} />} label="Excluir" /><FormControlLabel control={<Checkbox name="perm_financeiro_baixar" checked={!!userFormData.permissoes?.financeiro_baixar} onChange={handleUserFormChange} />} label="Dar Baixa" /></FormGroup></Paper></Grid>
              {/* Módulo Configurações */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Configurações</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_config_acessar" checked={!!userFormData.permissoes?.config_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_config_empresa_editar" checked={!!userFormData.permissoes?.config_empresa_editar} onChange={handleUserFormChange} />} label="Editar Empresa" /><FormControlLabel control={<Checkbox name="perm_config_usuarios_acessar" checked={!!userFormData.permissoes?.config_usuarios_acessar} onChange={handleUserFormChange} />} label="Acessar Usuários" /><FormControlLabel control={<Checkbox name="perm_config_vendedores_acessar" checked={!!userFormData.permissoes?.config_vendedores_acessar} onChange={handleUserFormChange} />} label="Acessar Vendedores" /><FormControlLabel control={<Checkbox name="perm_config_operacoes_acessar" checked={!!userFormData.permissoes?.config_operacoes_acessar} onChange={handleUserFormChange} />} label="Acessar Operações" /><FormControlLabel control={<Checkbox name="perm_config_apoio_acessar" checked={!!userFormData.permissoes?.config_apoio_acessar} onChange={handleUserFormChange} />} label="Acessar Cadastros Apoio" /></FormGroup></Paper></Grid>
              {/* Módulo Vendas */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Vendas</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_vendas_acessar" checked={!!userFormData.permissoes?.vendas_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_vendas_criar" checked={!!userFormData.permissoes?.vendas_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_vendas_editar" checked={!!userFormData.permissoes?.vendas_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_vendas_excluir" checked={!!userFormData.permissoes?.vendas_excluir} onChange={handleUserFormChange} />} label="Excluir" /><FormControlLabel control={<Checkbox name="perm_vendas_cancelar" checked={!!userFormData.permissoes?.vendas_cancelar} onChange={handleUserFormChange} />} label="Cancelar" /></FormGroup></Paper></Grid>
              {/* Fornecedores */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Fornecedores</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_fornecedores_acessar" checked={!!userFormData.permissoes?.fornecedores_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_fornecedores_criar" checked={!!userFormData.permissoes?.fornecedores_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_fornecedores_editar" checked={!!userFormData.permissoes?.fornecedores_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_fornecedores_excluir" checked={!!userFormData.permissoes?.fornecedores_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Compras */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Compras</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_compras_acessar" checked={!!userFormData.permissoes?.compras_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_compras_criar" checked={!!userFormData.permissoes?.compras_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_compras_editar" checked={!!userFormData.permissoes?.compras_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_compras_excluir" checked={!!userFormData.permissoes?.compras_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Trocas */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Trocas</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_trocas_acessar" checked={!!userFormData.permissoes?.trocas_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_trocas_criar" checked={!!userFormData.permissoes?.trocas_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_trocas_editar" checked={!!userFormData.permissoes?.trocas_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_trocas_excluir" checked={!!userFormData.permissoes?.trocas_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Ordens de Serviço */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Ordens de Serviço</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_ordens_acessar" checked={!!userFormData.permissoes?.ordens_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_ordens_criar" checked={!!userFormData.permissoes?.ordens_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_ordens_editar" checked={!!userFormData.permissoes?.ordens_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_ordens_excluir" checked={!!userFormData.permissoes?.ordens_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Cotações */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Cotações</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_cotacoes_acessar" checked={!!userFormData.permissoes?.cotacoes_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_cotacoes_criar" checked={!!userFormData.permissoes?.cotacoes_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_cotacoes_editar" checked={!!userFormData.permissoes?.cotacoes_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_cotacoes_excluir" checked={!!userFormData.permissoes?.cotacoes_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Devoluções */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Devoluções</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_devolucoes_acessar" checked={!!userFormData.permissoes?.devolucoes_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_devolucoes_criar" checked={!!userFormData.permissoes?.devolucoes_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_devolucoes_editar" checked={!!userFormData.permissoes?.devolucoes_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_devolucoes_excluir" checked={!!userFormData.permissoes?.devolucoes_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Comandas */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Comandas</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_comandas_acessar" checked={!!userFormData.permissoes?.comandas_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_comandas_criar" checked={!!userFormData.permissoes?.comandas_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_comandas_editar" checked={!!userFormData.permissoes?.comandas_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_comandas_excluir" checked={!!userFormData.permissoes?.comandas_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Pet Shop */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Pet Shop</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_petshop_acessar" checked={!!userFormData.permissoes?.petshop_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_petshop_criar" checked={!!userFormData.permissoes?.petshop_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_petshop_editar" checked={!!userFormData.permissoes?.petshop_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_petshop_excluir" checked={!!userFormData.permissoes?.petshop_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Clínica Veterinária */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Clínica Veterinária</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_clinica_veterinaria_acessar" checked={!!userFormData.permissoes?.clinica_veterinaria_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_clinica_veterinaria_criar" checked={!!userFormData.permissoes?.clinica_veterinaria_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_clinica_veterinaria_editar" checked={!!userFormData.permissoes?.clinica_veterinaria_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_clinica_veterinaria_excluir" checked={!!userFormData.permissoes?.clinica_veterinaria_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Veículos */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Veículos</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_veiculos_acessar" checked={!!userFormData.permissoes?.veiculos_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_veiculos_criar" checked={!!userFormData.permissoes?.veiculos_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_veiculos_editar" checked={!!userFormData.permissoes?.veiculos_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_veiculos_excluir" checked={!!userFormData.permissoes?.veiculos_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Equipamentos */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Equipamentos</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_equipamentos_acessar" checked={!!userFormData.permissoes?.equipamentos_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_equipamentos_criar" checked={!!userFormData.permissoes?.equipamentos_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_equipamentos_editar" checked={!!userFormData.permissoes?.equipamentos_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_equipamentos_excluir" checked={!!userFormData.permissoes?.equipamentos_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Aluguéis */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Aluguéis</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_alugueis_acessar" checked={!!userFormData.permissoes?.alugueis_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_alugueis_criar" checked={!!userFormData.permissoes?.alugueis_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_alugueis_editar" checked={!!userFormData.permissoes?.alugueis_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_alugueis_excluir" checked={!!userFormData.permissoes?.alugueis_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Bancário */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Bancário</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_bancario_acessar" checked={!!userFormData.permissoes?.bancario_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_bancario_criar" checked={!!userFormData.permissoes?.bancario_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_bancario_editar" checked={!!userFormData.permissoes?.bancario_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_bancario_excluir" checked={!!userFormData.permissoes?.bancario_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Cheques */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Cheques</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_cheques_acessar" checked={!!userFormData.permissoes?.cheques_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_cheques_criar" checked={!!userFormData.permissoes?.cheques_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_cheques_editar" checked={!!userFormData.permissoes?.cheques_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_cheques_excluir" checked={!!userFormData.permissoes?.cheques_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Estoque */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Estoque</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_estoque_acessar" checked={!!userFormData.permissoes?.estoque_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_estoque_ajustar" checked={!!userFormData.permissoes?.estoque_ajustar} onChange={handleUserFormChange} />} label="Ajustar" /><FormControlLabel control={<Checkbox name="perm_estoque_transferir" checked={!!userFormData.permissoes?.estoque_transferir} onChange={handleUserFormChange} />} label="Transferir" /><FormControlLabel control={<Checkbox name="perm_estoque_inventariar" checked={!!userFormData.permissoes?.estoque_inventariar} onChange={handleUserFormChange} />} label="Inventariar" /></FormGroup></Paper></Grid>
              {/* Tabela Comercial */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Tabela Comercial</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_tabela_comercial_acessar" checked={!!userFormData.permissoes?.tabela_comercial_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_tabela_comercial_criar" checked={!!userFormData.permissoes?.tabela_comercial_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_tabela_comercial_editar" checked={!!userFormData.permissoes?.tabela_comercial_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_tabela_comercial_excluir" checked={!!userFormData.permissoes?.tabela_comercial_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Catálogo */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Catálogo</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_catalogo_acessar" checked={!!userFormData.permissoes?.catalogo_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_catalogo_editar" checked={!!userFormData.permissoes?.catalogo_editar} onChange={handleUserFormChange} />} label="Editar" /></FormGroup></Paper></Grid>
              {/* Etiquetas */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Etiquetas</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_etiquetas_acessar" checked={!!userFormData.permissoes?.etiquetas_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_etiquetas_criar" checked={!!userFormData.permissoes?.etiquetas_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_etiquetas_editar" checked={!!userFormData.permissoes?.etiquetas_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_etiquetas_excluir" checked={!!userFormData.permissoes?.etiquetas_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Relatórios */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Relatórios</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_relatorios_acessar" checked={!!userFormData.permissoes?.relatorios_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_relatorios_exportar" checked={!!userFormData.permissoes?.relatorios_exportar} onChange={handleUserFormChange} />} label="Exportar" /></FormGroup></Paper></Grid>
              {/* Gráficos */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Gráficos</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_graficos_acessar" checked={!!userFormData.permissoes?.graficos_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /></FormGroup></Paper></Grid>
              {/* Mapa de Promoção */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Mapa de Promoção</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_mapa_promocao_acessar" checked={!!userFormData.permissoes?.mapa_promocao_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_mapa_promocao_criar" checked={!!userFormData.permissoes?.mapa_promocao_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_mapa_promocao_editar" checked={!!userFormData.permissoes?.mapa_promocao_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_mapa_promocao_excluir" checked={!!userFormData.permissoes?.mapa_promocao_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Venda Rápida */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Venda Rápida</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_venda_rapida_acessar" checked={!!userFormData.permissoes?.venda_rapida_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /></FormGroup></Paper></Grid>
              {/* Documentos Fiscais */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Documentos Fiscais</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_documentos_fiscais_acessar" checked={!!userFormData.permissoes?.documentos_fiscais_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_documentos_fiscais_visualizar" checked={!!userFormData.permissoes?.documentos_fiscais_visualizar} onChange={handleUserFormChange} />} label="Visualizar" /><FormControlLabel control={<Checkbox name="perm_documentos_fiscais_cancelar" checked={!!userFormData.permissoes?.documentos_fiscais_cancelar} onChange={handleUserFormChange} />} label="Cancelar" /><FormControlLabel control={<Checkbox name="perm_documentos_fiscais_inutilizar" checked={!!userFormData.permissoes?.documentos_fiscais_inutilizar} onChange={handleUserFormChange} />} label="Inutilizar" /></FormGroup></Paper></Grid>
              {/* NFC-e */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>NFC-e</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_nfce_acessar" checked={!!userFormData.permissoes?.nfce_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_nfce_emitir" checked={!!userFormData.permissoes?.nfce_emitir} onChange={handleUserFormChange} />} label="Emitir" /><FormControlLabel control={<Checkbox name="perm_nfce_cancelar" checked={!!userFormData.permissoes?.nfce_cancelar} onChange={handleUserFormChange} />} label="Cancelar" /><FormControlLabel control={<Checkbox name="perm_nfce_visualizar" checked={!!userFormData.permissoes?.nfce_visualizar} onChange={handleUserFormChange} />} label="Visualizar" /></FormGroup></Paper></Grid>
              {/* NF-e */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>NF-e</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_nfe_acessar" checked={!!userFormData.permissoes?.nfe_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_nfe_emitir" checked={!!userFormData.permissoes?.nfe_emitir} onChange={handleUserFormChange} />} label="Emitir" /><FormControlLabel control={<Checkbox name="perm_nfe_cancelar" checked={!!userFormData.permissoes?.nfe_cancelar} onChange={handleUserFormChange} />} label="Cancelar" /><FormControlLabel control={<Checkbox name="perm_nfe_visualizar" checked={!!userFormData.permissoes?.nfe_visualizar} onChange={handleUserFormChange} />} label="Visualizar" /><FormControlLabel control={<Checkbox name="perm_nfe_inutilizar" checked={!!userFormData.permissoes?.nfe_inutilizar} onChange={handleUserFormChange} />} label="Inutilizar" /></FormGroup></Paper></Grid>
              {/* CT-e */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>CT-e</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_cte_acessar" checked={!!userFormData.permissoes?.cte_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_cte_emitir" checked={!!userFormData.permissoes?.cte_emitir} onChange={handleUserFormChange} />} label="Emitir" /><FormControlLabel control={<Checkbox name="perm_cte_cancelar" checked={!!userFormData.permissoes?.cte_cancelar} onChange={handleUserFormChange} />} label="Cancelar" /><FormControlLabel control={<Checkbox name="perm_cte_visualizar" checked={!!userFormData.permissoes?.cte_visualizar} onChange={handleUserFormChange} />} label="Visualizar" /></FormGroup></Paper></Grid>
              {/* Manifestação */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Manifestação</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_manifestacao_acessar" checked={!!userFormData.permissoes?.manifestacao_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_manifestacao_manifestar" checked={!!userFormData.permissoes?.manifestacao_manifestar} onChange={handleUserFormChange} />} label="Manifestar" /><FormControlLabel control={<Checkbox name="perm_manifestacao_visualizar" checked={!!userFormData.permissoes?.manifestacao_visualizar} onChange={handleUserFormChange} />} label="Visualizar" /></FormGroup></Paper></Grid>
              {/* SPED Fiscal */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>SPED Fiscal</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_sped_acessar" checked={!!userFormData.permissoes?.sped_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_sped_gerar" checked={!!userFormData.permissoes?.sped_gerar} onChange={handleUserFormChange} />} label="Gerar" /><FormControlLabel control={<Checkbox name="perm_sped_exportar" checked={!!userFormData.permissoes?.sped_exportar} onChange={handleUserFormChange} />} label="Exportar" /><FormControlLabel control={<Checkbox name="perm_sped_visualizar" checked={!!userFormData.permissoes?.sped_visualizar} onChange={handleUserFormChange} />} label="Visualizar" /></FormGroup></Paper></Grid>
              {/* SPED Contribuições */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>SPED Contribuições</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_sped_contribuicoes_acessar" checked={!!userFormData.permissoes?.sped_contribuicoes_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_sped_contribuicoes_gerar" checked={!!userFormData.permissoes?.sped_contribuicoes_gerar} onChange={handleUserFormChange} />} label="Gerar" /><FormControlLabel control={<Checkbox name="perm_sped_contribuicoes_exportar" checked={!!userFormData.permissoes?.sped_contribuicoes_exportar} onChange={handleUserFormChange} />} label="Exportar" /><FormControlLabel control={<Checkbox name="perm_sped_contribuicoes_visualizar" checked={!!userFormData.permissoes?.sped_contribuicoes_visualizar} onChange={handleUserFormChange} />} label="Visualizar" /></FormGroup></Paper></Grid>
              {/* Aprovações */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Aprovações</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_aprovacoes_acessar" checked={!!userFormData.permissoes?.aprovacoes_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_aprovacoes_aprovar" checked={!!userFormData.permissoes?.aprovacoes_aprovar} onChange={handleUserFormChange} />} label="Aprovar" /><FormControlLabel control={<Checkbox name="perm_aprovacoes_rejeitar" checked={!!userFormData.permissoes?.aprovacoes_rejeitar} onChange={handleUserFormChange} />} label="Rejeitar" /><FormControlLabel control={<Checkbox name="perm_aprovacoes_visualizar" checked={!!userFormData.permissoes?.aprovacoes_visualizar} onChange={handleUserFormChange} />} label="Visualizar" /></FormGroup></Paper></Grid>
              {/* Backup */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Backup</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_backup_acessar" checked={!!userFormData.permissoes?.backup_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_backup_criar" checked={!!userFormData.permissoes?.backup_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_backup_restaurar" checked={!!userFormData.permissoes?.backup_restaurar} onChange={handleUserFormChange} />} label="Restaurar" /><FormControlLabel control={<Checkbox name="perm_backup_agendar" checked={!!userFormData.permissoes?.backup_agendar} onChange={handleUserFormChange} />} label="Agendar" /></FormGroup></Paper></Grid>
              {/* Módulo Agro */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Agro</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_agro_acessar" checked={!!userFormData.permissoes?.agro_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /></FormGroup></Paper></Grid>
              {/* Agro - Safras */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Agro - Safras</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_agro_safras_acessar" checked={!!userFormData.permissoes?.agro_safras_acessar} onChange={handleUserFormChange} />} label="Acessar" /><FormControlLabel control={<Checkbox name="perm_agro_safras_criar" checked={!!userFormData.permissoes?.agro_safras_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_agro_safras_editar" checked={!!userFormData.permissoes?.agro_safras_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_agro_safras_excluir" checked={!!userFormData.permissoes?.agro_safras_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Agro - Contratos */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Agro - Contratos</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_agro_contratos_acessar" checked={!!userFormData.permissoes?.agro_contratos_acessar} onChange={handleUserFormChange} />} label="Acessar" /><FormControlLabel control={<Checkbox name="perm_agro_contratos_criar" checked={!!userFormData.permissoes?.agro_contratos_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_agro_contratos_editar" checked={!!userFormData.permissoes?.agro_contratos_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_agro_contratos_excluir" checked={!!userFormData.permissoes?.agro_contratos_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Agro - Conversões */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Agro - Conversões</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_agro_conversoes_acessar" checked={!!userFormData.permissoes?.agro_conversoes_acessar} onChange={handleUserFormChange} />} label="Acessar" /><FormControlLabel control={<Checkbox name="perm_agro_conversoes_criar" checked={!!userFormData.permissoes?.agro_conversoes_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_agro_conversoes_editar" checked={!!userFormData.permissoes?.agro_conversoes_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_agro_conversoes_excluir" checked={!!userFormData.permissoes?.agro_conversoes_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Agro - Operacional */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Agro - Operacional</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_agro_operacional_acessar" checked={!!userFormData.permissoes?.agro_operacional_acessar} onChange={handleUserFormChange} />} label="Acessar" /><FormControlLabel control={<Checkbox name="perm_agro_operacional_criar" checked={!!userFormData.permissoes?.agro_operacional_criar} onChange={handleUserFormChange} />} label="Criar" /><FormControlLabel control={<Checkbox name="perm_agro_operacional_editar" checked={!!userFormData.permissoes?.agro_operacional_editar} onChange={handleUserFormChange} />} label="Editar" /><FormControlLabel control={<Checkbox name="perm_agro_operacional_excluir" checked={!!userFormData.permissoes?.agro_operacional_excluir} onChange={handleUserFormChange} />} label="Excluir" /></FormGroup></Paper></Grid>
              {/* Permissões Especiais */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Especiais</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_dashboard_acessar" checked={!!userFormData.permissoes?.dashboard_acessar} onChange={handleUserFormChange} />} label="Dashboard" /><FormControlLabel control={<Checkbox name="perm_ver_valores_reais" checked={!!userFormData.permissoes?.ver_valores_reais} onChange={handleUserFormChange} />} label="Ver Valores Reais" /><FormControlLabel control={<Checkbox name="perm_ver_custos" checked={!!userFormData.permissoes?.ver_custos} onChange={handleUserFormChange} />} label="Ver Custos" /><FormControlLabel control={<Checkbox name="perm_alterar_preco_venda" checked={!!userFormData.permissoes?.alterar_preco_venda} onChange={handleUserFormChange} />} label="Alterar Preço na Venda" /></FormGroup></Paper></Grid>
              {/* Log de Auditoria */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Log de Auditoria</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_auditoria_acessar" checked={!!userFormData.permissoes?.auditoria_acessar} onChange={handleUserFormChange} />} label="Acessar Módulo" /><FormControlLabel control={<Checkbox name="perm_auditoria_visualizar" checked={!!userFormData.permissoes?.auditoria_visualizar} onChange={handleUserFormChange} />} label="Visualizar Logs" /><FormControlLabel control={<Checkbox name="perm_auditoria_exportar" checked={!!userFormData.permissoes?.auditoria_exportar} onChange={handleUserFormChange} />} label="Exportar Relatórios" /><FormControlLabel control={<Checkbox name="perm_auditoria_excluir" checked={!!userFormData.permissoes?.auditoria_excluir} onChange={handleUserFormChange} />} label="Excluir Logs" /></FormGroup></Paper></Grid>
              {/* Autorizações Especiais */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Autorizações</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_aut_desconto" checked={!!userFormData.permissoes?.aut_desconto} onChange={handleUserFormChange} />} label="Autorizar Descontos" /><FormControlLabel control={<Checkbox name="perm_aut_cancelar_venda" checked={!!userFormData.permissoes?.aut_cancelar_venda} onChange={handleUserFormChange} />} label="Autorizar Cancelamentos" /></FormGroup><TextField fullWidth size="small" label="WhatsApp do Supervisor" name="whatsapp_supervisor" value={userFormData.whatsapp_supervisor || ''} onChange={handleUserFormChange} placeholder="5511999999999" helperText="Número para receber aprovações de desconto via WhatsApp" sx={{ mt: 1 }} /></Paper></Grid>
              {/* Permissões de Config Apoio (Detalhado) */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Cadastros de Apoio</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_config_apoio_criar" checked={!!userFormData.permissoes?.config_apoio_criar} onChange={handleUserFormChange} />} label="Criar (Grupos, Deptos, etc)" /><FormControlLabel control={<Checkbox name="perm_config_apoio_editar" checked={!!userFormData.permissoes?.config_apoio_editar} onChange={handleUserFormChange} />} label="Editar (Grupos, Deptos, etc)" /><FormControlLabel control={<Checkbox name="perm_config_apoio_excluir" checked={!!userFormData.permissoes?.config_apoio_excluir} onChange={handleUserFormChange} />} label="Excluir (Grupos, Deptos, etc)" /></FormGroup></Paper></Grid>
              {/* Permissões de Config Vendedores (Detalhado) */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Vendedores (Permissões)</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_config_vendedores_criar" checked={!!userFormData.permissoes?.config_vendedores_criar} onChange={handleUserFormChange} />} label="Criar Vendedores" /><FormControlLabel control={<Checkbox name="perm_config_vendedores_editar" checked={!!userFormData.permissoes?.config_vendedores_editar} onChange={handleUserFormChange} />} label="Editar Vendedores" /><FormControlLabel control={<Checkbox name="perm_config_vendedores_excluir" checked={!!userFormData.permissoes?.config_vendedores_excluir} onChange={handleUserFormChange} />} label="Excluir Vendedores" /></FormGroup></Paper></Grid>
              {/* Permissões de Config Operações (Detalhado) */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Operações (Permissões)</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_config_operacoes_criar" checked={!!userFormData.permissoes?.config_operacoes_criar} onChange={handleUserFormChange} />} label="Criar Operações" /><FormControlLabel control={<Checkbox name="perm_config_operacoes_editar" checked={!!userFormData.permissoes?.config_operacoes_editar} onChange={handleUserFormChange} />} label="Editar Operações" /><FormControlLabel control={<Checkbox name="perm_config_operacoes_excluir" checked={!!userFormData.permissoes?.config_operacoes_excluir} onChange={handleUserFormChange} />} label="Excluir Operações" /></FormGroup></Paper></Grid>
              {/* Permissões de Config Usuários (Detalhado) */}
              <Grid item xs={12} sm={4} md={3}><Paper variant="outlined" sx={{ p: 2, height: '100%' }}><Typography variant="h6" gutterBottom>Usuários (Permissões)</Typography><FormGroup><FormControlLabel control={<Checkbox name="perm_config_usuarios_criar" checked={!!userFormData.permissoes?.config_usuarios_criar} onChange={handleUserFormChange} />} label="Criar Usuários" /><FormControlLabel control={<Checkbox name="perm_config_usuarios_editar" checked={!!userFormData.permissoes?.config_usuarios_editar} onChange={handleUserFormChange} />} label="Editar Usuários" /><FormControlLabel control={<Checkbox name="perm_config_usuarios_excluir" checked={!!userFormData.permissoes?.config_usuarios_excluir} onChange={handleUserFormChange} />} label="Excluir Usuários" /></FormGroup></Paper></Grid>
            </Grid>
          </TabPanel>

        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button startIcon={<CloseIcon />} onClick={onClose} disabled={savingUser}>Cancelar</Button>
        <Button
          startIcon={<SaveIcon />}
          onClick={handleSaveUser}
          variant="contained"
          disabled={savingUser}
          type="submit"
        >
          {savingUser ? <CircularProgress size={24} /> : 'Salvar Usuário'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UserDialog;