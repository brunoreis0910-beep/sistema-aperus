import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Stack,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { useGruposProduto } from '../context/GruposProdutoContext';

const GruposProdutoConfig = () => {
  const {
    grupos,
    loading,
    adicionarGrupo,
    editarGrupo,
    excluirGrupo,
    ativarDesativarGrupo
  } = useGruposProduto();

  // Debug: verificar estado dos grupos
  React.useEffect(() => {
    console.log('🔍 GruposProdutoConfig - grupos:', grupos);
    console.log('🔍 GruposProdutoConfig - loading:', loading);
    console.log('🔍 GruposProdutoConfig - grupos.length:', grupos?.length);
  }, [grupos, loading]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativo: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleOpenDialog = (grupo = null) => {
    setSelectedGrupo(grupo);
    setFormData(grupo || {
      nome: '',
      descricao: '',
      ativo: true
    });
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedGrupo(null);
    setFormData({
      nome: '',
      descricao: '',
      ativo: true
    });
    setError('');
  };

  const handleSave = async () => {
    try {
      setError('');

      if (!formData.nome.trim()) {
        setError('Nome do grupo é obrigatório');
        return;
      }

      // Verificar se já existe um grupo com o mesmo nome (exceto o atual)
      const nomeExiste = Array.isArray(grupos) && grupos.some(g =>
        g.nome.toLowerCase() === formData.nome.toLowerCase() &&
        g.id !== selectedGrupo?.id
      );

      if (nomeExiste) {
        setError('Já existe um grupo com este nome');
        return;
      }

      if (selectedGrupo) {
        await editarGrupo(selectedGrupo.id, formData);
        setSuccess('Grupo editado com sucesso!');
      } else {
        await adicionarGrupo(formData);
        setSuccess('Grupo adicionado com sucesso!');
      }

      handleCloseDialog();

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
      setError('Erro ao salvar grupo');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este grupo?')) {
      return;
    }

    try {
      await excluirGrupo(id);
      setSuccess('Grupo excluído com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      setError('Erro ao excluir grupo');
    }
  };

  const handleToggleAtivo = async (id, ativo) => {
    try {
      await ativarDesativarGrupo(id, ativo);
      setSuccess(`Grupo ${ativo ? 'ativado' : 'desativado'} com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erro ao alterar status do grupo:', error);
      setError('Erro ao alterar status do grupo');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Grupos de Produtos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Grupo
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Descriçéo</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : grupos.length > 0 ? (
              Array.isArray(grupos) && grupos.map((grupo) => (
                <TableRow key={grupo.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {grupo.nome}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {grupo.descricao}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={grupo.ativo}
                          onChange={(e) => handleToggleAtivo(grupo.id, e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Chip
                          label={grupo.ativo ? "Ativo" : "Inativo"}
                          color={grupo.ativo ? "success" : "default"}
                          size="small"
                        />
                      }
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleOpenDialog(grupo)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(grupo.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="h6" color="text.secondary">
                    Nenhum grupo cadastrado
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Adicionar/Editar Grupo */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedGrupo ? 'Editar Grupo' : 'Novo Grupo'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nome do Grupo"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              variant="outlined"
              required
              error={error.includes('Nome')}
              helperText={error.includes('Nome') ? error : ''}
            />

            <TextField
              fullWidth
              label="Descriçéo"
              multiline
              rows={3}
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              variant="outlined"
              placeholder="Descreva o tipo de produtos deste grupo..."
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  color="primary"
                />
              }
              label="Grupo ativo"
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GruposProdutoConfig;