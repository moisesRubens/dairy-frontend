import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';
import { orderService } from '../services/OrderService';
import type { SalePoint } from '../types/SalePoint';
import type { Order } from '../types/Order';
import '../styles/Home.css';

function Home() {
  const [user, setUser] = useState<SalePoint | null>(null);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getUser();
    const token = authService.getToken();
    
    if (!currentUser || !token) {
      navigate('/login');
    } else {
      setUser(currentUser);
      loadTodayOrders();
    }
  }, [navigate]);

  const loadTodayOrders = async () => {
    try {
      const response = await orderService.getAll();
      
      // Pega a data de HOJE no formato YYYY-MM-DD (data local)
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const hojeStr = `${ano}-${mes}-${dia}`;
      
      const filteredOrders = response.orders.filter(order => {
        // Pega só a data (YYYY-MM-DD) do pedido
        const dataPedido = order.order_date.split('T')[0];
        return dataPedido === hojeStr;
      });
      
      setTodayOrders(filteredOrders);
      
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setTodayOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total_value, 0);

  if (!user || loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="home-container">
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

      <main className="home-main">
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

          <div className="card" onClick={() => navigate('/sale-points')}>
            <div className="card-icon">🏪</div>
            <h3>Outros Pontos de Venda</h3>
            <p>Visualizar e gerenciar pontos de venda</p>
          </div>
        </div>

        <div className="info-section">
          <h3>Resumo do Dia</h3>
          <div className="info-cards">
            <div className="info-card">
              <span className="info-label">Pedidos</span>
              <span className="info-value">{todayOrders.length}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Faturamento</span>
              <span className="info-value">
                R$ {todayRevenue.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;