// Em: src/components/TabPanel.jsx

import React from 'react';
import { Box } from '@mui/material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      style={{ display: value !== index ? 'none' : 'block' }}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && ( 
        <Box sx={{ p: 3, pt: 2, width: '100%' }}> 
          {children}
        </Box>
      )}
    </div>
  );
}

export default TabPanel;