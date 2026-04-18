import React from 'react';
import { useNavigation } from './NavigationContext';

const BotaoVoltarInicial = ({ className = '', showText = true }) => {
  const { voltarParaInicial, paginaAtual } = useNavigation();

  // não mostrar o botão se já estiver na página inicial
  if (paginaAtual === 'inicial') {
    return null;
  }

  return (
    <button
      className={`btn-voltar-inicial ${className}`}
      onClick={voltarParaInicial}
      title="Voltar para a página inicial"
    >
      <span className="icon">🏠</span>
      {showText && <span className="text">Início</span>}
    </button>
  );
};

export default BotaoVoltarInicial;