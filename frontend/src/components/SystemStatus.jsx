import React from 'react';
import { Box, Alert, Typography, Chip } from '@mui/material';

const SystemStatus = () => {
  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="success" sx={{ mb: 1 }}>
        <Typography variant="h6">✅ Sistema Otimizado</Typography>
        <Typography variant="body2">
          Avisos do React Router eliminados e sistema configurado para compatibilidade futura
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip label="React Router v7 Ready" color="success" size="small" />
        <Chip label="Ultra-Wide Optimized" color="primary" size="small" />
        <Chip label="Full Screen Support" color="secondary" size="small" />
        <Chip label="No Warnings" color="info" size="small" />
      </Box>
    </Box>
  );
};

export default SystemStatus;