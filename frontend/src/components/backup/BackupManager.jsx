import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  LinearProgress,
  Chip,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Restore as RestoreIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import BackupScheduler from './BackupScheduler';

const BackupManager = () => {
  const [backups, setBackups] = useState([]);
  const [backupInfo, setBackupInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, backup: null });
  const [restoreDialog, setRestoreDialog] = useState({ open: false, backup: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    loadBackups();
    loadBackupInfo();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/comandas/backups/');
      if (response.data.success) {
        setBackups(response.data.backups);
      }
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
      showSnackbar('Erro ao carregar backups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBackupInfo = async () => {
    try {
      const response = await api.get('/api/comandas/backups/info/');
      if (response.data.success) {
        setBackupInfo(response.data.info);
      }
    } catch (error) {
      console.error('Erro ao carregar informações:', error);
    }
  };

  const createBackup = async () => {
    try {
      setCreating(true);
      showSnackbar('Criando backup... Isso pode levar alguns minutos.', 'info');

      const response = await api.post('/api/comandas/backups/', { compress: true });

      if (response.data.success) {
        showSnackbar('Backup criado com sucesso!', 'success');
        await loadBackups();
        await loadBackupInfo();
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      showSnackbar(
        error.response?.data?.error || 'Erro ao criar backup',
        'error'
      );
    } finally {
      setCreating(false);
    }
  };  const deleteBackup = async (filename) => {
    try {
      const response = await api.delete(`/api/comandas/backups/${filename}/`);

      if (response.data.success) {
        showSnackbar('Backup removido com sucesso!', 'success');
        await loadBackups();
        await loadBackupInfo();
      }
    } catch (error) {
      console.error('Erro ao remover backup:', error);
      showSnackbar(
        error.response?.data?.error || 'Erro ao remover backup',
        'error'
      );
    } finally {
      setDeleteDialog({ open: false, backup: null });
    }
  };  const restoreBackup = async (filename) => {
    try {
      showSnackbar('Restaurando backup... Aguarde.', 'info');

      const response = await api.post(`/api/comandas/backups/${filename}/restore/`);

      if (response.data.success) {
        showSnackbar(
          'Backup restaurado com sucesso! Recarregue a página.',
          'success'
        );
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      showSnackbar(
        error.response?.data?.error || 'Erro ao restaurar backup',
        'error'
      );
    } finally {
      setRestoreDialog({ open: false, backup: null });
    }
  };  const downloadBackup = async (filename) => {
    try {
      const response = await api.get(`/api/comandas/backups/${filename}/download/`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showSnackbar('Download iniciado!', 'success');
    } catch (error) {
      console.error('Erro ao baixar backup:', error);
      showSnackbar('Erro ao baixar backup', 'error');
    }
  };  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (sizeMb) => {
    if (sizeMb < 1) {
      return `${(sizeMb * 1024).toFixed(2)} KB`;
    }
    return `${sizeMb.toFixed(2)} MB`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Gerenciamento de Backups
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadBackups();
              loadBackupInfo();
            }}
            sx={{ mr: 1 }}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={createBackup}
            disabled={creating}
          >
            Criar Backup
          </Button>
        </Box>
      </Box>

      {/* Agendamento Automático */}
      <Box sx={{ mb: 4 }}>
        <BackupScheduler />
      </Box>

      {creating && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="info">
            Criando backup... Aguarde, isso pode levar alguns minutos.
          </Alert>
          <LinearProgress sx={{ mt: 1 }} />
        </Box>
      )}

      {backupInfo && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total de Backups
                </Typography>
                <Typography variant="h5">{backupInfo.total_backups}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Tamanho Total
                </Typography>
                <Typography variant="h5">{formatSize(backupInfo.total_size_mb)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Tipo de Banco
                </Typography>
                <Typography variant="h5">{backupInfo.database_type}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Último Backup
                </Typography>
                <Typography variant="h6" sx={{ fontSize: '0.9rem' }}>
                  {backupInfo.newest_backup
                    ? formatDate(backupInfo.newest_backup)
                    : 'Nenhum'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Backups Disponíveis
          </Typography>
          
          {loading ? (
            <LinearProgress />
          ) : backups.length === 0 ? (
            <Alert severity="info">
              Nenhum backup encontrado. Crie o primeiro backup clicando no botão acima.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome do Arquivo</TableCell>
                    <TableCell>Data/Hora</TableCell>
                    <TableCell>Tamanho</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.filename}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {backup.filename}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(backup.created_at)}</TableCell>
                      <TableCell>{formatSize(backup.size_mb)}</TableCell>
                      <TableCell>
                        <Chip
                          label={backup.compressed ? 'Comprimido' : 'Normal'}
                          size="small"
                          color={backup.compressed ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Download">
                          <IconButton
                            color="primary"
                            onClick={() => downloadBackup(backup.filename)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Restaurar">
                          <IconButton
                            color="warning"
                            onClick={() =>
                              setRestoreDialog({ open: true, backup: backup.filename })
                            }
                          >
                            <RestoreIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            color="error"
                            onClick={() =>
                              setDeleteDialog({ open: true, backup: backup.filename })
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, backup: null })}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o backup <strong>{deleteDialog.backup}</strong>?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, backup: null })}>
            Cancelar
          </Button>
          <Button
            onClick={() => deleteBackup(deleteDialog.backup)}
            color="error"
            variant="contained"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de restauração */}
      <Dialog
        open={restoreDialog.open}
        onClose={() => setRestoreDialog({ open: false, backup: null })}
      >
        <DialogTitle>Confirmar Restauração</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>ATENÇÃO:</strong> Restaurar um backup irá substituir todos os dados
              atuais do banco de dados. Um backup automático do estado atual será criado
              antes da restauração.
            </Alert>
            Deseja restaurar o backup <strong>{restoreDialog.backup}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog({ open: false, backup: null })}>
            Cancelar
          </Button>
          <Button
            onClick={() => restoreBackup(restoreDialog.backup)}
            color="warning"
            variant="contained"
          >
            Restaurar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensagens */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BackupManager;

