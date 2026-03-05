import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';
import type { SalePoint } from '../types/SalePoint';
import '../styles/Home.css';

function Home() {
  const [user, setUser] = useState<SalePoint | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se usuário está logado
    const currentUser = authService.getUser();
    const token = authService.getToken();
    
    if (!currentUser || !token) {
      // Se não estiver logado, volta para o login
      navigate('/login');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    authService.logout(); // Limpa localStorage (token e user)
    navigate('/login'); // Volta para tela de login
  };

  if (!user) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <h1>LATICÍNIOS BOA ESPERANÇA</h1>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <button onClick={handleLogout} className="logout-button">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="home-main">
        {/* Cards de Navegação - Grid 4 colunas no PC */}
        <div className="cards-grid">
          <div className="card" onClick={() => navigate('/products')}>
            <div className="card-icon">📦</div>
            <h3>Produtos</h3>
            <p>Gerenciar produtos cadastrados</p>
          </div>

          <div className="card" onClick={() => navigate('/orders')}>
            <div className="card-icon">📋</div>
            <h3>Pedidos</h3>
            <p>Visualizar e criar pedidos</p>
          </div>

          <div className="card" onClick={() => navigate('/reports')}>
            <div className="card-icon">📊</div>
            <h3>Relatórios</h3>
            <p>Acessar relatórios e análises</p>
          </div>

          {/* Card: Outros Pontos de Venda */}
          <div className="card" onClick={() => navigate('/sale-points')}>
            <div className="card-icon">🏪</div>
            <h3>Outros Pontos de Venda</h3>
            <p>Visualizar e gerenciar pontos de venda</p>
          </div>
        </div>

        {/* Informações Rápidas */}
        <div className="info-section">
          <h3>Resumo do Dia</h3>
          <div className="info-cards">
            <div className="info-card">
              <span className="info-label">Pedidos Hoje</span>
              <span className="info-value">12</span>
            </div>
            <div className="info-card">
              <span className="info-label">Faturamento</span>
              <span className="info-value">R$ 1.234,56</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;