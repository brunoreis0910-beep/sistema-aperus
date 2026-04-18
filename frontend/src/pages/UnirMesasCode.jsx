// ========== CÓDIGO PARA ADICIONAR NO ComandasPage.jsx ==========

// PARTE 1: Adicionar estes import se ainda não existirem (topo do arquivo):
import { MergeType as UnirIcon } from '@mui/icons-material';

// PARTE 2: Adicionar estes estados (linha ~41, após [transferDialog, setTransferDialog]):
const [unirMesasDialog, setUnirMesasDialog] = useState(false);
const [mesasSelecionadasUnir, setMesasSelecionadasUnir] = useState([]);
const [mesaDestinoUniao, setMesaDestinoUniao] = useState(null);

// PARTE 3: Adicionar estas funções (linha ~280, após handleTransferirMesa):

const handleUnirMesas = async () => {
  if (!comandaSelecionada) {
    alert('Selecione uma comanda principal');
    return;
  }

  if (mesasSelecionadasUnir.length === 0) {
    alert('Selecione pelo menos uma mesa para unir');
    return;
  }

  try {
    setLoading(true);
    
    // Busca os IDs das comandas das mesas selecionadas
    const comandasParaUnir = comandas.filter(c => 
      mesasSelecionadasUnir.includes(c.mesa) && 
      c.status === 'Aberta' && 
      c.id !== comandaSelecionada.id
    ).map(c => c.id);

    if (comandasParaUnir.length === 0) {
      alert('Nenhuma comanda ativa encontrada nas mesas selecionadas');
      return;
    }

    const response = await axiosInstance.post(
      `/comandas/comandas/${comandaSelecionada.id}/unir_comandas/`,
      {
        comandas_ids: comandasParaUnir,
        mesa_final_id: mesaDestinoUniao || comandaSelecionada.mesa
      }
    );

    alert(response.data.message || 'Mesas unidas com sucesso!');
    
    // Atualiza os dados
    fetchComandas();
    fetchMesas();
    
    // Fecha o diálogo e limpa seleções
    setUnirMesasDialog(false);
    setMesasSelecionadasUnir([]);
    setMesaDestinoUniao(null);
    setComandaSelecionada(null);
    
  } catch (error) {
    console.error('Erro ao unir mesas:', error);
    alert('Erro ao unir mesas: ' + (error.response?.data?.error || error.message));
  } finally {
    setLoading(false);
  }
};

const toggleMesaSelecao = (mesaId) => {
  setMesasSelecionadasUnir(prev => {
    if (prev.includes(mesaId)) {
      return prev.filter(id => id !== mesaId);
    } else {
      return [...prev, mesaId];
    }
  });
};

// PARTE 4: Adicionar este botão na tabela de Comandas Abertas (Tab 1)
// Localizar: <Tooltip title="Transferir Mesa"> (linha ~940)
// Adicionar DEPOIS dele:

<Tooltip title="Unir Mesas">
  <IconButton
    size="small"
    color="secondary"
    onClick={() => {
      setComandaSelecionada(comanda);
      setUnirMesasDialog(true);
    }}
  >
    <PessoasIcon />
  </IconButton>
</Tooltip>

// PARTE 5: Adicionar este Dialog ANTES do último </Box> do componente:
