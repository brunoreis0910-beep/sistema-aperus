import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import { Description, Business } from '@mui/icons-material';
import EmpresaConfig from './EmpresaConfig';
import ConjuntosOperacaoConfig from './ConjuntosOperacaoConfig';

// Componente principal que gerencia as abas de configuração fiscal
const DocumentosFiscaisPage = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Description />
        Documentos Fiscais & Configurações
      </Typography>
      
      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab icon={<Business />} iconPosition="start" label="Empresa & Configurações (NFC-e / NF-e)" />
        <Tab label="Conjuntos de Operações" />
      </Tabs>

      {/* Aba 0: Configuração da Empresa (Inclui NFC-e, NF-e, Certificado) */}
      {tabIndex === 0 && <EmpresaConfig />}

      {/* Aba 1: Configuração de Conjuntos de Operações */}
      {tabIndex === 1 && <ConjuntosOperacaoConfig />}

    </Box>
  );
};

export default DocumentosFiscaisPage;

