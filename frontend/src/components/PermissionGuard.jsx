import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Componente que renderiza seus children apenas se o usuário tiver a permissão
 * 
 * Exemplos de uso:
 * 
 * <PermissionGuard permission="clientes_criar">
 *   <Button>Criar Cliente</Button>
 * </PermissionGuard>
 * 
 * <PermissionGuard permissions={['produtos_editar', 'produtos_excluir']} requireAll={false}>
 *   <Button>Editar ou Excluir</Button>
 * </PermissionGuard>
 */
const PermissionGuard = ({
  permission,      // Uma única permissão
  permissions,     // Array de permissões
  requireAll,      // Se true, requer todas as permissões. Se false, requer apenas uma
  fallback,        // Componente a renderizar se não tiver permissão
  children
}) => {
  const { can, canAny, canAll } = usePermissions();

  let hasPermission = false;

  if (permission) {
    // Verifica uma única permissão
    hasPermission = can(permission);
  } else if (permissions && Array.isArray(permissions)) {
    // Verifica múltiplas permissões
    hasPermission = requireAll ? canAll(permissions) : canAny(permissions);
  } else {
    // Sem permissões especificadas, não renderiza
    return fallback || null;
  }

  if (!hasPermission) {
    return fallback || null;
  }

  return <>{children}</>;
};

export default PermissionGuard;
