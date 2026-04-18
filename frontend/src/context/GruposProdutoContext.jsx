import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const GruposProdutoContext = createContext();

export const useGruposProduto = () => {
  const context = useContext(GruposProdutoContext);
  if (!context) {
    throw new Error('useGruposProduto deve ser usado dentro de GruposProdutoProvider');
  }
  return context;
};

export const GruposProdutoProvider = ({ children }) => {
  const { axiosInstance, user, isLoading } = useAuth();
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Grupos padréo iniciais
  const gruposIniciais = [
    { id: 1, nome: 'Informática', ativo: true, descricao: 'Produtos de informática e tecnologia' },
    { id: 2, nome: 'Celulares', ativo: true, descricao: 'Smartphones e acessórios' },
    { id: 3, nome: 'Vestuário', ativo: true, descricao: 'Roupas e acessórios de vestuário' },
    { id: 4, nome: 'Móveis', ativo: true, descricao: 'Móveis e decoração' },
    { id: 5, nome: 'Decoração', ativo: true, descricao: 'Artigos de decoração' },
    { id: 6, nome: 'Ferramentas', ativo: true, descricao: 'Ferramentas e equipamentos' },
    { id: 7, nome: 'Livros', ativo: true, descricao: 'Livros e material educativo' },
    { id: 8, nome: 'Outros', ativo: true, descricao: 'Outros produtos diversos' }
  ];

  // Só carregar quando usuário estiver logado e não estiver mais carregando
  // IMPORTANTE: axiosInstance foi removido das deps — ele é estável (useMemo no AuthContext)
  // Incluí-lo causava re-execução do effect a cada render do AuthProvider → requests duplicados
  useEffect(() => {
    if (!isLoading && user && axiosInstance) {
      const controller = new AbortController();
      carregarGrupos(controller.signal);
      return () => controller.abort(); // cancela requisição se componente desmontar
    }
  }, [user, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const carregarGrupos = async (signal = null) => {
    try {
      setLoading(true);

      if (!axiosInstance) {
        console.log('⏳ AuthContext ainda não está pronto, aguardando...');
        return;
      }

      console.log('📡 Carregando grupos de produtos da API...');
      const config = signal ? { signal } : {};
      const response = await axiosInstance.get('/grupos-produto/', config);

      // Verificar se a resposta é um array direto ou objeto paginado
      let gruposData = [];
      if (Array.isArray(response.data)) {
        gruposData = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        gruposData = response.data.results;
      } else if (response.data?.value && Array.isArray(response.data.value)) {
        gruposData = response.data.value;
      }

      console.log('📦 Dados recebidos da API:', gruposData);

      // Mapear para o formato esperado pelo componente
      const gruposFormatados = Array.isArray(gruposData) ? gruposData.map(grupo => ({
        id: grupo.id_grupo,
        nome: grupo.nome_grupo,
        ativo: true, // API não tem campo ativo, assumir true
        descricao: grupo.descricao || `Grupo ${grupo.nome_grupo}` // API não tem descrição
      })) : [];

      setGrupos(gruposFormatados);
      console.log('✅ Grupos carregados da API:', gruposFormatados);

    } catch (error) {
      // Ignorar erros de abort (componente desmontou antes da resposta)
      if (error?.code === 'ERR_CANCELED' || error?.name === 'AbortError' || error?.name === 'CanceledError') {
        return;
      }
      console.error('❌ Erro ao carregar grupos da API:', error);

      // Em caso de erro, usar grupos do localStorage como fallback
      const gruposSalvos = localStorage.getItem('grupos_produto');
      if (gruposSalvos) {
        setGrupos(JSON.parse(gruposSalvos));
        console.log('📦 Usando grupos do localStorage como fallback');
      } else {
        // Se não há grupos salvos e API falhou, usar grupos iniciais
        const gruposIniciais = [
          { id: 1, nome: 'TENIS', ativo: true, descricao: 'Grupo TENIS' },
          { id: 2, nome: 'Informática', ativo: true, descricao: 'Produtos de informática e tecnologia' },
          { id: 3, nome: 'Celulares', ativo: true, descricao: 'Smartphones e acessórios' }
        ];
        setGrupos(gruposIniciais);
        console.log('🆕 Usando grupos iniciais como fallback');
      }
    } finally {
      setLoading(false);
    }
  };

  const adicionarGrupo = async (grupoData) => {
    try {
      if (!axiosInstance) {
        throw new Error('AuthContext não está pronto');
      }

      const dadosParaEnvio = {
        nome_grupo: grupoData.nome
      };

      console.log('📤 Criando novo grupo via API:', dadosParaEnvio);
      const response = await axiosInstance.post('/grupos-produto/', dadosParaEnvio);

      // Recarregar grupos após criação
      await carregarGrupos();

      console.log('✅ Grupo criado com sucesso via API');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao adicionar grupo via API:', error);

      // Fallback para localStorage em caso de erro
      const novoGrupo = {
        id: Date.now(),
        ...grupoData,
        ativo: true
      };

      const novosGrupos = [...grupos, novoGrupo];
      setGrupos(novosGrupos);
      localStorage.setItem('grupos_produto', JSON.stringify(novosGrupos));

      return novoGrupo;
    }
  };

  const editarGrupo = async (id, grupoData) => {
    try {
      if (!axiosInstance) {
        throw new Error('AuthContext não está pronto');
      }

      const dadosParaEnvio = {
        nome_grupo: grupoData.nome
      };
      if (grupoData.descricao !== undefined) {
        dadosParaEnvio.descricao = grupoData.descricao;
      }

      console.log('📤 Editando grupo via API:', dadosParaEnvio, 'ID:', id);
      await axiosInstance.patch(`/grupos-produto/${id}/`, dadosParaEnvio);

      // Recarregar grupos após edição
      await carregarGrupos();

      console.log('✅ Grupo editado com sucesso via API');
      return grupos.find(g => g.id === id);
    } catch (error) {
      console.error('❌ Erro ao editar grupo via API:', error);
      throw error;
    }
  };

  const excluirGrupo = async (id) => {
    try {
      if (!axiosInstance) {
        throw new Error('AuthContext não está pronto');
      }

      console.log('🗑️ Excluindo grupo via API:', id);
      await axiosInstance.delete(`/grupos-produto/${id}/`);

      // Recarregar grupos após exclusão
      await carregarGrupos();

      console.log('✅ Grupo excluído com sucesso via API');
    } catch (error) {
      console.error('❌ Erro ao excluir grupo via API:', error);

      // Fallback para localStorage em caso de erro
      const novosGrupos = grupos.filter(grupo => grupo.id !== id);
      setGrupos(novosGrupos);
      localStorage.setItem('grupos_produto', JSON.stringify(novosGrupos));
    }
  };

  const ativarDesativarGrupo = async (id, ativo) => {
    try {
      // Como a API não tem campo 'ativo', apenas atualizar localmente
      const novosGrupos = grupos.map(grupo =>
        grupo.id === id ? { ...grupo, ativo } : grupo
      );

      setGrupos(novosGrupos);
      localStorage.setItem('grupos_produto', JSON.stringify(novosGrupos));

      console.log(`✅ Grupo ${ativo ? 'ativado' : 'desativado'} localmente:`, id);
    } catch (error) {
      console.error('Erro ao ativar/desativar grupo:', error);
      throw error;
    }
  };

  // Filtrar apenas grupos ativos para uso nos selects
  const gruposAtivos = grupos.filter(grupo => grupo.ativo);

  const value = {
    grupos,
    gruposAtivos,
    loading,
    carregarGrupos,
    adicionarGrupo,
    editarGrupo,
    excluirGrupo,
    ativarDesativarGrupo
  };

  return (
    <GruposProdutoContext.Provider value={value}>
      {children}
    </GruposProdutoContext.Provider>
  );
};