/**
 * Componentes de Proteção de UI
 * Exibe ou esconde elementos baseado em permissões
 */

import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { Box, Tooltip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

/**
 * Componente que exibe o conteúdo apenas se o usuário tiver a permissão
 * @param {Object} props
 * @param {string} props.permission - Nome da permissão requerida
 * @param {React.ReactNode} props.children - Elementos filhos
 * @param {React.ReactNode} props.fallback - Elemento a exibir se não tiver permissão
 * @returns {React.ReactElement|null}
 */
export const HasPermission = ({ permission, children, fallback = null }) => {
  const { can } = usePermissions();

  if (!can(permission)) {
    return fallback;
  }

  return <>{children}</>;
};

/**
 * Componente que exibe o conteúdo se tiver QUALQUER UMA das permissões
 * @param {Object} props
 * @param {string[]} props.permissions - Array de permissões
 * @param {React.ReactNode} props.children - Elementos filhos
 * @param {React.ReactNode} props.fallback - Elemento a exibir se não tiver permissão
 */
export const HasAnyPermission = ({ permissions, children, fallback = null }) => {
  const { canAny } = usePermissions();

  if (!canAny(permissions)) {
    return fallback;
  }

  return <>{children}</>;
};

/**
 * Componente que exibe o conteúdo se tiver TODAS as permissões
 * @param {Object} props
 * @param {string[]} props.permissions - Array de permissões
 * @param {React.ReactNode} props.children - Elementos filhos
 * @param {React.ReactNode} props.fallback - Elemento a exibir se não tiver permissão
 */
export const HasAllPermissions = ({ permissions, children, fallback = null }) => {
  const { canAll } = usePermissions();

  if (!canAll(permissions)) {
    return fallback;
  }

  return <>{children}</>;
};

/**
 * Componente que desabilita elementos se não tiver permissão
 * Exibe um tooltip explicativo quando desabilitado
 * @param {Object} props
 * @param {string} props.permission - Nome da permissão requerida
 * @param {React.ReactNode} props.children - Elementos filhos (deve aceitar disabled prop)
 * @param {string} props.message - Mensagem do tooltip quando desabilitado
 */
export const DisableIfNoPermission = ({ 
  permission, 
  children, 
  message = 'Você não tem permissão para esta ação' 
}) => {
  const { can } = usePermissions();
  const hasPermission = can(permission);

  if (!hasPermission) {
    return (
      <Tooltip title={message} arrow>
        <span>
          {React.cloneElement(children, { 
            disabled: true,
            sx: { 
              ...children.props.sx,
              opacity: 0.5,
              cursor: 'not-allowed',
              pointerEvents: 'auto' // Permite hover para mostrar tooltip
            }
          })}
        </span>
      </Tooltip>
    );
  }

  return <>{children}</>;
};

/**
 * Componente que exibe ícone de cadeado e mensagem quando não tem permissão
 * @param {Object} props
 * @param {string} props.permission - Nome da permissão requerida
 * @param {React.ReactNode} props.children - Elementos filhos
 * @param {string} props.message - Mensagem a exibir
 * @param {boolean} props.showIcon - Se deve mostrar ícone de cadeado
 */
export const LockedContent = ({ 
  permission, 
  children, 
  message = 'Conteúdo restrito',
  showIcon = true 
}) => {
  const { can } = usePermissions();

  if (!can(permission)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          minHeight: 200,
          textAlign: 'center',
          gap: 2
        }}
      >
        {showIcon && <LockIcon sx={{ fontSize: 48, color: 'text.secondary' }} />}
        <Box sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>
          {message}
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
};

/**
 * Higher Order Component (HOC) para proteger componentes inteiros
 * @param {React.Component} Component - Componente a ser protegido
 * @param {string} permission - Permissão requerida
 * @param {React.Component} FallbackComponent - Componente alternativo
 */
export const withPermission = (Component, permission, FallbackComponent = null) => {
  return (props) => {
    const { can } = usePermissions();

    if (!can(permission)) {
      if (FallbackComponent) {
        return <FallbackComponent {...props} />;
      }
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <LockIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Box sx={{ color: 'text.secondary' }}>
            Você não tem permissão para acessar este conteúdo
          </Box>
        </Box>
      );
    }

    return <Component {...props} />;
  };
};

/**
 * Componente para exibir diferentes conteúdos baseado em permissões
 * Similar ao switch/case
 * @param {Object} props
 * @param {Object} props.cases - Objeto mapeando permissões para componentes
 * @param {React.ReactNode} props.default - Componente padrão quando nenhuma permissão corresponde
 */
export const PermissionSwitch = ({ cases, default: defaultComponent = null }) => {
  const { can } = usePermissions();

  for (const [permission, component] of Object.entries(cases)) {
    if (can(permission)) {
      return <>{component}</>;
    }
  }

  return defaultComponent;
};

/**
 * Componente que exibe conteúdo apenas para superusuários
 * @param {Object} props
 * @param {React.ReactNode} props.children - Elementos filhos
 * @param {React.ReactNode} props.fallback - Elemento alternativo
 */
export const SuperUserOnly = ({ children, fallback = null }) => {
  const { isSuperuser } = usePermissions();

  if (!isSuperuser) {
    return fallback;
  }

  return <>{children}</>;
};

/**
 * Componente que exibe Conteúdo apenas para staff
 * @param {Object} props
 * @param {React.ReactNode} props.children - Elementos filhos
 * @param {React.ReactNode} props.fallback - Elemento alternativo
 */
export const StaffOnly = ({ children, fallback = null }) => {
  const { user } = useAuth();

  if (!user?.is_staff && !user?.is_superuser) {
    return fallback;
  }

  return <>{children}</>;
};

export default HasPermission;
