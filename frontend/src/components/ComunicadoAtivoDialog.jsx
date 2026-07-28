import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  Divider, IconButton, Button, Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  Campaign as CampaignIcon
} from '@mui/icons-material';

export default function ComunicadoAtivoDialog({ open, onClose, comunicado, onRefreshNotificacoes }) {
  if (!comunicado) return null;

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  };

  const handleCiente = () => {
    const lidos = JSON.parse(localStorage.getItem('comunicados_lidos') || '[]');
    if (!lidos.includes(comunicado.id)) {
      lidos.push(comunicado.id);
      localStorage.setItem('comunicados_lidos', JSON.stringify(lidos));
    }
    if (onRefreshNotificacoes) {
      onRefreshNotificacoes();
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          pb: 1.5,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CampaignIcon sx={{ fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold">Comunicado Oficial</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: { xs: 3, md: 4 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={comunicado.tipo === 'TEXTO' ? 12 : 7}>
              <Box sx={{ pr: { md: 2 } }}>
                <Typography 
                  variant="h5" 
                  component="h2" 
                  sx={{ 
                    fontWeight: 800, 
                    mb: 2,
                    color: '#1e293b',
                    letterSpacing: '-0.5px'
                  }}
                >
                  {comunicado.titulo}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#475569',
                    lineHeight: 1.6,
                    fontSize: '1.05rem',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {comunicado.texto}
                </Typography>
              </Box>
            </Grid>

            {comunicado.tipo !== 'TEXTO' && (
              <Grid item xs={12} md={5}>
                <Box 
                  sx={{ 
                    borderRadius: 2, 
                    overflow: 'hidden', 
                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    minHeight: comunicado.tipo === 'VIDEO' ? '220px' : 'auto'
                  }}
                >
                  {comunicado.tipo === 'IMAGEM' && comunicado.url && (
                    <Box
                      component="img"
                      src={comunicado.url}
                      alt={comunicado.titulo}
                      sx={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                  )}
                  {comunicado.tipo === 'VIDEO' && comunicado.url && (
                    <Box
                      component="iframe"
                      src={getYouTubeEmbedUrl(comunicado.url)}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none'
                      }}
                    />
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ borderRadius: '8px', px: 3 }}
            >
              Fechar
            </Button>
            <Button
              variant="contained"
              onClick={handleCiente}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                fontWeight: 'bold',
                px: 4,
                borderRadius: '8px',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                }
              }}
            >
              Ciente, fechar
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
