import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';
import { orderService } from '../services/OrderService';
import { getProducts } from '../services/productService';
import type { SalePoint } from '../types/SalePoint';
import type { Order } from '../types/Order';
import type { ProductWithUnit } from '../types/Product';
import '../styles/Home.css';

function Home() {
  const [user, setUser] = useState<SalePoint | null>(null);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductWithUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | ''>('');
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getUser();
    const token = authService.getToken();
    
    if (!currentUser || !token) {
      navigate('/login');
    } else {
      setUser(currentUser);
      loadInitialData();
    }
  }, [navigate]);

  const loadInitialData = async () => {
    try {
      // Pega a data de HOJE no formato YYYY-MM-DD
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const hojeStr = `${ano}-${mes}-${dia}`;
      
      console.log('📅 Carregando pedidos do dia:', hojeStr);
      
      // Carrega produtos e pedidos de hoje usando o filtro da API
      const [productsData, ordersResponse] = await Promise.all([
        getProducts(),
        orderService.getAll({ date: hojeStr })
      ]);
      
      setTodayOrders(ordersResponse.orders);
      setProducts(productsData || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setTodayOrders([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleViewTodayOrders = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const hojeStr = `${ano}-${mes}-${dia}`;
    
    navigate('/orders', { 
      state: { 
        filters: {
          date: hojeStr  // Mudou de dateFrom/dateTo para apenas 'date'
        }
      } 
    });
  };

  const handleQuickOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !quantity) {
      setError('Selecione um produto e informe a quantidade');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Quantidade inválida');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Status é booleano no banco: true = pendente
      const orderData = {
        sale_point_id: user?.id,
        items: [{
          product_id: selectedProduct,
          quantity: quantityNum,
          unit_price: product.price,
          total_price: quantityNum * product.price
        }],
        total_value: quantityNum * product.price,
        status: true, // true = pendente
        description: `Pedido de ${product.name} - ${quantityNum}`
      };

      console.log('📤 Enviando pedido:', orderData);
      
      await orderService.create(orderData);
      
      setSuccess('Pedido criado com sucesso!');
      setSelectedProduct('');
      setQuantity('');
      
      // Recarrega os pedidos do dia
      loadInitialData();
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Erro ao criar pedido:', error);
      setError('Erro ao criar pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total_value, 0);

  const handleNavigation = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

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
            
            <div className="hamburger-menu">
              <button 
                className="hamburger-button"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </button>
              
              {menuOpen && (
                <div className="menu-dropdown">
                  <button onClick={() => handleNavigation('/products')}>
                    📦 Produtos
                  </button>
                  <button onClick={() => handleNavigation('/orders')}>
                    📋 Pedidos
                  </button>
                  <button onClick={() => handleNavigation('/reports')}>
                    📊 Relatórios
                  </button>
                  <button onClick={() => handleNavigation('/sale-points')}>
                    🏪 Pontos de Venda
                  </button>
                  <div className="menu-divider"></div>
                  <button onClick={handleLogout} className="logout-menu-item">
                    🚪 Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="home-main">
        <div className="info-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Resumo do Dia</h3>
            <button 
              onClick={handleViewTodayOrders} 
              className="btn-view-orders"
            >
              Visualizar
            </button>
          </div>
          <div className="info-cards">
            <div className="info-card">
              <span className="info-label">Pedidos Hoje</span>
              <span className="info-value">{todayOrders.length}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Faturamento Hoje</span>
              <span className="info-value">
                R$ {todayRevenue.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        <div className="quick-order-section">
          <h3>Cadastro Rápido de Pedido</h3>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleQuickOrder} className="quick-order-form">
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="product">Produto</label>
                <select
                  id="product"
                  value={selectedProduct}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedProduct(value ? Number(value) : '');
                  }}
                  disabled={submitting}
                >
                  <option value="">Selecione um produto</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - R$ {product.price.toFixed(2).replace('.', ',')} 
                      {product.unitLabel && ` (${product.unitLabel})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="quantity">Quantidade</label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  disabled={submitting}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Criando...' : 'Criar Pedido'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Home;