import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AuthProvider } from './context/AuthContext'
import responsiveTheme from './theme/responsiveTheme'
import axios from 'axios'

// Aumenta timeout global do axios durante desenvolvimento para evitar erros
// prematuros de timeout quando o backend está um pouco mais lento.
axios.defaults.timeout = 40000 // 40s

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={responsiveTheme}>
      <CssBaseline />
      <BrowserRouter
        future={{
          // Flags de compatibilidade futura do React Router v7
          // Eliminam avisos de deprecação no console
          v7_startTransition: true,      // Usa React.startTransition para state updates
          v7_relativeSplatPath: true     // Nova resolução relativa de rotas Splat
        }}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)