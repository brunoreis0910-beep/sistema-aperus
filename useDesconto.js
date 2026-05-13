import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function useDesconto(cliente, produto, valorTabela) {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { axiosInstance } = useAuth();

  useEffect(() => {
    // Só dispara a simulação se tivermos os parâmetros essenciais
    if (!cliente?.id_cliente || !produto?.id_produto || valorTabela == null) {
      setResultado(null);
      return;
    }

    const calcular = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.post('/descontos/simular/', {
          id_cliente: cliente.id_cliente,
          id_produto: produto.id_produto,
          valor_tabela: parseFloat(valorTabela)
        });
        setResultado(res.data);
        setError(null);
      } catch (err) {
        console.error('Erro ao simular desconto:', err);
        setError(err.message || 'Erro ao calcular desconto');
        setResultado(null);
      } finally {
        setLoading(false);
      }
    };

    // Adiciona um pequeno debounce de 300ms para evitar chamadas excessivas durante a digitação
    const timeoutId = setTimeout(calcular, 300);
    return () => clearTimeout(timeoutId);
  }, [cliente?.id_cliente, produto?.id_produto, valorTabela, axiosInstance]);

  return { resultado, loading, error };
}