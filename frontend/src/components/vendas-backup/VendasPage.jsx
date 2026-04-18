import React, { useState } from 'react';
import { useMenu } from './MenuContext';
import BotaoVoltarInicial from './BotaoVoltarInicial';

const VendasPage = () => {
  const [mostrarModalVenda, setMostrarModalVenda] = useState(false);
  const { menusHabilitados, habilitarMenus, desabilitarMenus } = useMenu();

  const abrirModalVenda = () => {
    desabilitarMenus(); // Desabilita os menus ao abrir
    setMostrarModalVenda(true);
  };

  const fecharModalVenda = () => {
    setMostrarModalVenda(false);
    habilitarMenus(); // CORREÇéO: Reabilita os menus ao fechar
  };

  return (
    <div className="pagina-vendas">
      <div className="page-header">
        <div className="page-title">
          <h1>Vendas</h1>
        </div>
        <BotaoVoltarInicial />
      </div>
      
      <div className="page-content">
        <button className="btn btn-primary" onClick={abrirModalVenda}>
          Mostrar Venda
        </button>
      </div>

      {/* Modal de Venda */}
      {mostrarModalVenda && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Detalhes da Venda</h2>
              <button 
                className="btn-fechar"
                onClick={fecharModalVenda}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Conteúdo da venda aqui */}
              <p>Informações da venda...</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={fecharModalVenda}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendasPage;