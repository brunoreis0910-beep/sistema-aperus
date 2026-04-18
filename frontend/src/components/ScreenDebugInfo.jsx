import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useScreenSize } from '../hooks/useScreenSize';

const ScreenDebugInfo = ({ enabled = true }) => {
  const screenSize = useScreenSize();

  if (!enabled) return null;

  return (
    <Box
      className="screen-debug"
      sx={{
        position: 'fixed',
        top: 70,
        right: 20,
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        p: 1.5,
        borderRadius: 1,
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        zIndex: 9999,
        minWidth: 200,
        backdropFilter: 'blur(10px)'
      }}
    >
      <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', mb: 1 }}>
        🖥️ Monitor Info
      </Typography>

      <Typography variant="caption" sx={{ display: 'block' }}>
        resolução: {screenSize.width} × {screenSize.height}
      </Typography>

      <Typography variant="caption" sx={{ display: 'block' }}>
        Aspect Ratio: {(screenSize.width / screenSize.height).toFixed(2)}
      </Typography>

      <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
        DPI: {window.devicePixelRatio || 1}x
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Chip
          label={screenSize.isSuperWide ? 'Super Ultra-Wide' :
            screenSize.isUltraWide ? 'Ultra-Wide' : 'Standard'}
          color={screenSize.isSuperWide ? 'success' :
            screenSize.isUltraWide ? 'primary' : 'default'}
          size="small"
          sx={{ fontSize: '0.7rem', height: 20 }}
        />

        {screenSize.isSuperWide && (
          <Chip
            label="5120x1440 Otimizado"
            color="error"
            size="small"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        )}

        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
          Layout: {screenSize.isSuperWide ? '4 colunas' :
            screenSize.isUltraWide ? '3 colunas' : '2 colunas'}
        </Typography>
      </Box>
    </Box>
  );
};

export default ScreenDebugInfo;