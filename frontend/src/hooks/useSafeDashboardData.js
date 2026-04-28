import { useMemo } from 'react';

// LOG: Arquivo carregado
console.log('📦 [useSafeDashboardData.js] CARREGANDO módulo - INÍCIO');
console.log('📦 [useSafeDashboardData.js] Versão: v2.0 - Com logs detalhados');

/**
 * Utilitário para formatar valores monetários de forma segura
 * DECLARADO PRIMEIRO para evitar TDZ (Temporal Dead Zone)
 */
console.log('📦 [useSafeDashboardData.js] Declarando formatCurrency...');
export const formatCurrency = (value) => {
  console.log('💰 formatCurrency chamado com:', value);
  const numValue = parseFloat(value);
  const result = (isNaN(numValue) ? 0 : numValue).toFixed(2);
  console.log('💰 formatCurrency retornando:', result);
  return result;
};
console.log('✅ [useSafeDashboardData.js] formatCurrency DECLARADO');

/**
 * Utilitário para calcular porcentagem de forma segura
 * DECLARADO SEGUNDO para evitar TDZ (Temporal Dead Zone)
 */
console.log('📦 [useSafeDashboardData.js] Declarando calculatePercentage...');
export const calculatePercentage = (current, target) => {
  console.log('📊 calculatePercentage chamado com:', { current, target });
  const numCurrent = parseFloat(current) || 0;
  const numTarget = parseFloat(target) || 0;

  if (!numTarget || numTarget === 0) {
    console.log('📊 calculatePercentage: target é 0, retornando 0');
    return 0;
  }
  const result = Math.min((numCurrent / numTarget) * 100, 100);
  console.log('📊 calculatePercentage retornando:', result);
  return result;
};
console.log('✅ [useSafeDashboardData.js] calculatePercentage DECLARADO');

/**
 * Hook personalizado para garantir dados seguros do dashboard
 * Retorna valores padrão caso os dados estejam undefined/null
 * DECLARADO POR ÚLTIMO para garantir que todas as utilidades estejam disponíveis
 */
console.log('📦 [useSafeDashboardData.js] Declarando useSafeDashboardData...');
export const useSafeDashboardData = (dashboardData) => {
  console.log('🎯 useSafeDashboardData chamado com:', dashboardData);
  return useMemo(() => {
    console.log('🔄 useSafeDashboardData: executando useMemo');
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
console.log('✅ [useSafeDashboardData.js] useSafeDashboardData DECLARADO');
console.log('✅ [useSafeDashboardData.js] Módulo COMPLETAMENTE CARREGADO - Todas exports disponíveis');