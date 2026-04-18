import React from 'react';
import { useNavigation } from './NavigationContext';

const NavegacaoControles = () => {
  const { voltarParaInicial, voltarPagina, podeVoltar, paginaAtual } = useNavigation();

  return (
    <div className="navegacao-controles">
      {podeVoltar && (
        <button
          className="btn-navegacao btn-voltar"
          onClick={voltarPagina}
          title="Voltar página anterior"
        >
          <span className="icon">←</span>
          <span className="text">Voltar</span>
        </button>
      )}

      {paginaAtual !== 'inicial' && (
        <button
          className="btn-navegacao btn-inicial"
          onClick={voltarParaInicial}
          title="Ir para página inicial"
        >
          <span className="icon">🏠</span>
          <span className="text">Início</span>
        </button>
      )}
    </div>
  );
};

export default NavegacaoControles;