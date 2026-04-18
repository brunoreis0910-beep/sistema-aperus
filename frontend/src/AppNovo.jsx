import React from 'react';
import { MenuProvider } from './components/MenuContext';
import { NavigationProvider, useNavigation } from './components/NavigationContext';
import MenuPrincipal from './components/MenuPrincipal';
import NavegacaoControles from './components/NavegacaoControles';
import PaginaInicial from './components/PaginaInicial';
import VendasPage from './components/VendasPage';
import ClientePage from './components/ClientePage';
import ProdutoPage from './components/ProdutoPage';
import FinanceiroPage from './components/FinanceiroPage';
import ChequesPage from './pages/ChequesPage';
import './App.css';

const AppContent = () => {
  const { paginaAtual } = useNavigation();

  const renderPagina = () => {
    switch (paginaAtual) {
      case 'inicial':
        return <PaginaInicial />;
      case 'venda':
        return <VendasPage />;
      case 'cliente':
        return <ClientePage />;
      case 'produto':
        return <ProdutoPage />;
      case 'financeiro':
        return <FinanceiroPage />;
      case 'cheques':
        return <ChequesPage />;
      case 'cadastro':
        return (
          <div className="pagina-generica">
            <div className="page-header">
              <h1>Cadastro</h1>
              <NavegacaoControles />
            </div>
            <div className="page-content">
              <p>Página de Cadastro em desenvolvimento...</p>
            </div>
          </div>
        );
      case 'autorizacao':
        return (
          <div className="pagina-generica">
            <div className="page-header">
              <h1>Autorização</h1>
              <NavegacaoControles />
            </div>
            <div className="page-content">
              <p>Página de Autorização em desenvolvimento...</p>
            </div>
          </div>
        );
      case 'configuracoes':
        return (
          <div className="pagina-generica">
            <div className="page-header">
              <h1>Configurações</h1>
              <NavegacaoControles />
            </div>
            <div className="page-content">
              <p>Página de Configurações em desenvolvimento...</p>
            </div>
          </div>
        );
      case 'compra':
        return (
          <div className="pagina-generica">
            <div className="page-header">
              <h1>Compras</h1>
              <NavegacaoControles />
            </div>
            <div className="page-content">
              <p>Página de Compras em desenvolvimento...</p>
            </div>
          </div>
        );
      default:
        return <PaginaInicial />;
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>APERUS</h1>
        <MenuPrincipal />
      </header>
      
      <main className="app-main">
        {renderPagina()}
      </main>
    </div>
  );
};

function App() {
  return (
    <NavigationProvider>
      <MenuProvider>
        <AppContent />
      </MenuProvider>
    </NavigationProvider>
  );
}

export default App;