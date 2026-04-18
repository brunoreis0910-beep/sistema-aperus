/**
 * Componente de Rota Protegida com Verificação de Permissões
 * Extensão do ProtectedRoute original com suporte a permissões granulares
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Alert, AlertTitle, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Componente de rota protegida avançado
 * Verifica autenticação E permissões específicas
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteúdo da rota
 * @param {string} props.permission - Permissão requerida (opcional)
 * @param {string[]} props.anyPermissions - Lista de permissões (requer qualquer uma)
 * @param {string[]} props.allPermissions - Lista de permissões (requer todas)
 * @param {boolean} props.requireStaff - Se requer ser staff
 * @param {boolean} props.requireSuperuser - Se requer ser superusuário
 * @param {string} props.redirectTo - Rota para redirecionar se não autorizado
 * @param {React.ReactNode} props.fallback - Componente alternativo se não autorizado
 */
export const AdvancedProtectedRoute = ({ 
  children, 
  permission = null,
  anyPermissions = null,
  allPermissions = null,
  requireStaff = false,
  requireSuperuser = false,
  redirectTo = '/login',
  fallback = null
}) => {
  const { user, isLoading } = useAuth();
  const { can, canAny, canAll, isSuperuser } = usePermissions();
  const location = useLocation();

  // Aguardar carregamento
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#0d47a1'
      }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  // Verificar autenticação
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Verificar superusuário
  if (requireSuperuser && !isSuperuser) {
    return fallback || (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        gap: 2,
        p: 3
      }}>
        <LockIcon sx={{ fontSize: 64, color: 'error.main' }} />
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <AlertTitle>Acesso Negado</AlertTitle>
          Esta área é restrita apenas para superusuários.
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => window.history.back()}
        >
          Voltar
        </Button>
      </Box>
    );
  }

  // Verificar staff
  if (requireStaff && !user.is_staff && !isSuperuser) {
    return fallback || (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        gap: 2,
        p: 3
      }}>
        <LockIcon sx={{ fontSize: 64, color: 'warning.main' }} />
        <Alert severity="warning" sx={{ maxWidth: 600 }}>
          <AlertTitle>Acesso Restrito</AlertTitle>
          Esta área é restrita para membros da equipe.
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => window.history.back()}
        >
          Voltar
        </Button>
      </Box>
    );
  }

  // Verificar permissão única
  if (permission && !can(permission)) {
    return fallback || (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        gap: 2,
        p: 3
      }}>
        <LockIcon sx={{ fontSize: 64, color: 'error.main' }} />
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <AlertTitle>Sem Permissão</AlertTitle>
          Você não tem permissão para acessar esta página.
          <br />
          <small>Permissão necessária: <code>{permission}</code></small>
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => window.history.back()}
        >
          Voltar
        </Button>
      </Box>
    );
  }

  // Verificar qualquer permissão de uma lista
  if (anyPermissions && !canAny(anyPermissions)) {
    return fallback || (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        gap: 2,
        p: 3
      }}>
        <LockIcon sx={{ fontSize: 64, color: 'error.main' }} />
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <AlertTitle>Sem Permissão</AlertTitle>
          Você precisa de ao menos uma das seguintes permissões:
          <ul style={{ marginTop: 8 }}>
            {anyPermissions.map(perm => (
              <li key={perm}><code>{perm}</code></li>
            ))}
          </ul>
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => window.history.back()}
        >
          Voltar
        </Button>
      </Box>
    );
  }

  // Verificar todas as permissões de uma lista
  if (allPermissions && !canAll(allPermissions)) {
    return fallback || (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        gap: 2,
        p: 3
      }}>
        <LockIcon sx={{ fontSize: 64, color: 'error.main' }} />
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <AlertTitle>Sem Permissão</AlertTitle>
          Você precisa de TODAS as seguintes permissões:
          <ul style={{ marginTop: 8 }}>
            {allPermissions.map(perm => (
              <li key={perm}><code>{perm}</code></li>
            ))}
          </ul>
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => window.history.back()}
        >
          Voltar
        </Button>
      </Box>
    );
  }

  // Autorizado - Renderiza o conteúdo
  return <>{children}</>;
};

/**
 * Wrapper simples para rotas que exigem apenas autenticação
 * (Mantém compatibilidade com o ProtectedRoute original)
 */
export const ProtectedRoute = ({ children }) => {
  return (
    <AdvancedProtectedRoute>
      {children}
    </AdvancedProtectedRoute>
  );
};

/**
 * Rota que exige permissão específica
 */
export const PermissionRoute = ({ children, permission }) => {
  return (
    <AdvancedProtectedRoute permission={permission}>
      {children}
    </AdvancedProtectedRoute>
  );
};

/**
 * Rota que exige ser staff
 */
export const StaffRoute = ({ children }) => {
  return (
    <AdvancedProtectedRoute requireStaff>
      {children}
    </AdvancedProtectedRoute>
  );
};

/**
 * Rota que exige ser superusuário
 */
export const SuperUserRoute = ({ children }) => {
  return (
    <AdvancedProtectedRoute requireSuperuser>
      {children}
    </AdvancedProtectedRoute>
  );
};

export default AdvancedProtectedRoute;
