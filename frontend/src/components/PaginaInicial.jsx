import React from 'react';
import { useNavigation } from './NavigationContext';

const PaginaInicial = () => {
  const { navegarPara } = useNavigation();

  const quickActions = [
    {
      id: 'nova-venda',
      title: 'Nova Venda',
      description: 'Registrar uma nova venda',
      icon: '🛒',
      action: () => navegarPara('venda')
    },
    {
      id: 'nova-compra',
      title: 'Nova Compra',
      description: 'Registrar uma nova compra',
      icon: '📦',
      action: () => navegarPara('compra')
    },
    {
      id: 'clientes',
      title: 'Clientes',
      description: 'Gerenciar clientes',
      icon: '👥',
      action: () => navegarPara('cliente')
    },
    {
      id: 'produtos',
      title: 'Produtos',
      description: 'Gerenciar produtos',
      icon: '📋',
      action: () => navegarPara('produto')
    },
    {
      id: 'financeiro',
      title: 'Financeiro',
      description: 'Relatórios financeiros',
      icon: '💰',
      action: () => navegarPara('financeiro')
    },
    {
      id: 'configuracoes',
      title: 'Configurações',
      description: 'Configurações do sistema',
      icon: '⚙️',
      action: () => navegarPara('configuracoes')
    }
  ];

  const stats = [
    { label: 'Vendas Hoje', value: '15', change: '+12%', color: 'green' },
    { label: 'Faturamento', value: 'R$ 2.450,00', change: '+8%', color: 'blue' },
    { label: 'Clientes Ativos', value: '89', change: '+5%', color: 'purple' },
    { label: 'Produtos em Estoque', value: '342', change: '-2%', color: 'orange' }
  ];

  return (
    <div className="pagina-inicial">
      <div className="welcome-section">
        <h1>Bem-vindo ao APERUS</h1>
        <p>Gerencie seu negócio de forma eficiente e organizada</p>
        <div className="current-date">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <div className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <h2>Ações Rápidas</h2>
        <div className="actions-grid">
          {quickActions.map((action) => (
            <div
              key={action.id}
              className="action-card"
              onClick={action.action}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="recent-activity">
        <h2>Atividade Recente</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">🛒</div>
            <div className="activity-content">
              <div className="activity-title">Nova venda registrada</div>
              <div className="activity-time">Há 15 minutos</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">👥</div>
            <div className="activity-content">
              <div className="activity-title">Cliente Joéo Silva cadastrado</div>
              <div className="activity-time">Há 1 hora</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">📦</div>
            <div className="activity-content">
              <div className="activity-title">Estoque atualizado</div>
              <div className="activity-time">Há 2 horas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaginaInicial;