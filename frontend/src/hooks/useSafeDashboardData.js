import { useMemo } from 'react';

/**
 * Utilitário para formatar valores monetários de forma segura
 * DECLARADO PRIMEIRO para evitar TDZ (Temporal Dead Zone)
 */
export const formatCurrency = (value) => {
  const numValue = parseFloat(value);
  return (isNaN(numValue) ? 0 : numValue).toFixed(2);
};

/**
 * Utilitário para calcular porcentagem de forma segura
 * DECLARADO SEGUNDO para evitar TDZ (Temporal Dead Zone)
 */
export const calculatePercentage = (current, target) => {
  const numCurrent = parseFloat(current) || 0;
  const numTarget = parseFloat(target) || 0;

  if (!numTarget || numTarget === 0) return 0;
  return Math.min((numCurrent / numTarget) * 100, 100);
};

/**
 * Hook personalizado para garantir dados seguros do dashboard
 * Retorna valores padrão caso os dados estejam undefined/null
 * DECLARADO POR ÚLTIMO para garantir que todas as utilidades estejam disponíveis
 */
export const useSafeDashboardData = (dashboardData) => {
  return useMemo(() => {
    const defaultData = {
      vendas: { hoje: 0, total: 0, valor: 0, valorMes: 0 },
      clientes: { total: 0, novos: 0 },
      produtos: { total: 0, baixoEstoque: 0 },
      financeiro: { receitas: 0, receitasMes: 0, despesas: 0, saldo: 0 }
    };

    if (!dashboardData) return defaultData;

    return {
      vendas: {
        hoje: dashboardData.vendas?.hoje || 0,
        total: dashboardData.vendas?.total || 0,
        valor: dashboardData.vendas?.valor || 0,
        valorMes: dashboardData.vendas?.valorMes || 0
      },
      clientes: {
        total: dashboardData.clientes?.total || 0,
        novos: dashboardData.clientes?.novos || 0
      },
      produtos: {
        total: dashboardData.produtos?.total || 0,
        baixoEstoque: dashboardData.produtos?.baixoEstoque || 0
      },
      financeiro: {
        receitas: dashboardData.financeiro?.receitas || 0,
        receitasMes: dashboardData.financeiro?.receitasMes || 0,
        despesas: dashboardData.financeiro?.despesas || 0,
        saldo: dashboardData.financeiro?.saldo || 0
      }
    };
  }, [dashboardData]);
};