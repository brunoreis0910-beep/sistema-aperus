import { useAuth } from '../context/AuthContext';

/**
 * Hook personalizado para verificar permissões
 * Uso: const { can } = usePermissions();
 * Exemplo: can('clientes_criar') ou can('produtos_excluir')
 */
export const usePermissions = () => {
  const { user, permissions } = useAuth();

  /**
   * Verifica se o usuário tem uma permissão específica
   * @param {string} permission - Nome da permissão (ex: 'clientes_criar', 'vendas_excluir')
   * @returns {boolean} - true se tem permissão, false caso contrário
   */
  const can = (permission) => {
    // Superusuário tem acesso a tudo
    if (user?.is_superuser) {
      // console.log(`👑 Superusuário detectado - acesso total a "${permission}"`);
      return true;
    }

    // Se não passou permissão, nega acesso
    if (!permission) return false;

    // Se não tem permissões carregadas, nega acesso
    if (!permissions || Object.keys(permissions).length === 0) {
      // console.warn(`⚠️ Permissões vazias ou não carregadas. User:`, user, 'Permissions:', permissions);
      return false;
    }

    // Verifica a permissão específica (aceita boolean ou número 1)
    const permValue = permissions[permission];
    return permValue === true || permValue === 1 || permValue === '1';
  };

  /**
   * Verifica se o usuário tem ALGUMA das permissões listadas
   * @param {string[]} permissionList - Array de permissões
   * @returns {boolean}
   */
  const canAny = (permissionList) => {
    return permissionList.some(perm => can(perm));
  };

  /**
   * Verifica se o usuário tem TODAS as permissões listadas
   * @param {string[]} permissionList - Array de permissões
   * @returns {boolean}
   */
  const canAll = (permissionList) => {
    return permissionList.every(perm => can(perm));
  };

  /**
   * Atalhos para ações comuns em um módulo
   * Uso: const clientePerms = module('clientes');
   * Retorna: { canView, canCreate, canEdit, canDelete }
   */
  const module = (moduleName) => ({
    canView: can(`${moduleName}_acessar`),
    canCreate: can(`${moduleName}_criar`),
    canEdit: can(`${moduleName}_editar`),
    canDelete: can(`${moduleName}_excluir`),
  });

  return {
    can,
    canAny,
    canAll,
    module,
    isSuperuser: user?.is_superuser || false,
  };
};

export default usePermissions;
