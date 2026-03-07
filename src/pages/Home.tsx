import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';
import { orderService } from '../services/OrderService';
import { getProducts, getRetiradasPorPontoVenda } from '../services/productService';
import { Trash2, ShoppingCart } from 'lucide-react';
import type { SalePoint } from '../types/SalePoint';
import type { Order } from '../types/Order';
import type { ProductWithUnit } from '../types/Product';
import '../styles/Home.css';

type OrderItem = {
  product_id: number;
  product_name: string;
  unit_type: 'amount' | 'kg' | 'liters';
  quantity: number;
  unit_price: number;
  total_price: number;
  unitLabel: string;
};

// Tipo para as retiradas
type Retirada = {
  id: number;
  name: string;
  price: number;
  amount: number | null;
  kg: number | null;
  liters: number | null;
  quantidade_retirada: number;
  unidade_retirada: string;
  data_retirada: string;
  observacao: string | null;
};

function Home() {
  const [user, setUser] = useState<SalePoint | null>(null);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductWithUnit[]>([]);
  const [retiradas, setRetiradas] = useState<Retirada[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Estado para os itens do pedido
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
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
    }
  }, [navigate]);

  // 🔥 SEPAREI O CARREGAMENTO DOS DADOS EM UM useEffect SEPARADO
  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // 🔥 PEGA O USUÁRIO DIRETAMENTE DO STATE (garantido)
      const currentUser = user;
      console.log('👤 Usuário atual:', currentUser);
      console.log('🆔 ID do usuário:', currentUser?.id);
      
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const hojeStr = `${ano}-${mes}-${dia}`;
      
      console.log('📅 Carregando dados...');
      
      // 🔥 AGORA O currentUser.id EXISTE COM CERTEZA
      let retiradasData: Retirada[] = [];
      
      if (currentUser?.id) {
        console.log('🔍 Chamando getRetiradasPorPontoVenda com ID:', currentUser.id);
        retiradasData = await getRetiradasPorPontoVenda(currentUser.id);
        console.log('📦 Retiradas carregadas:', retiradasData);
      } else {
        console.log('⚠️ ID do usuário não disponível');
      }
      
      // Carrega produtos e pedidos
      const [productsData, ordersResponse] = await Promise.all([
        getProducts(),
        orderService.getAll({ date: hojeStr })
      ]);
      
      console.log('📦 Produtos carregados:', productsData.length);
      console.log('📦 Pedidos carregados:', ordersResponse.orders?.length);
      
      setTodayOrders(ordersResponse.orders || []);
      setProducts(productsData || []);
      setRetiradas(retiradasData || []);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
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
          date: hojeStr
        }
      } 
    });
  };

  const handleAddToOrder = () => {
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

    // Verifica se o produto já está no pedido
    const existingItem = orderItems.find(item => item.product_id === product.id);
    if (existingItem) {
      setError('Este produto já foi adicionado ao pedido');
      return;
    }

    // Determina a unidade do produto
    let unitType: 'amount' | 'kg' | 'liters' = 'amount';
    let unitLabel = '';
    
    if (product.amount > 0) {
      unitType = 'amount';
      unitLabel = 'Unidade(s)';
    } else if (product.kg > 0) {
      unitType = 'kg';
      unitLabel = 'Quilos';
    } else if (product.liters > 0) {
      unitType = 'liters';
      unitLabel = 'Litros';
    }

    const newItem: OrderItem = {
      product_id: product.id,
      product_name: product.name,
      unit_type: unitType,
      quantity: quantityNum,
      unit_price: product.price,
      total_price: quantityNum * product.price,
      unitLabel: unitLabel
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProduct('');
    setQuantity('');
    setError('');
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      setError('Adicione pelo menos um item ao pedido');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const orderData = {
        sale_point_id: user?.id,
        items: orderItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })),
        total_value: orderItems.reduce((sum, item) => sum + item.total_price, 0),
        status: true,
        description: `Pedido com ${orderItems.length} item(ns)`
      };

      console.log('📤 Enviando pedido:', orderData);
      
      await orderService.create(orderData);
      
      setSuccess('Pedido criado com sucesso!');
      setOrderItems([]);
      loadInitialData();
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Erro ao criar pedido:', error);
      setError('Erro ao criar pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Função para obter a unidade de medida da retirada
  const getRetiradaUnit = (unidade: string): string => {
    switch (unidade) {
      case 'amount': return 'Unidade(s)';
      case 'kg': return 'Quilos (kg)';
      case 'liters': return 'Litros (L)';
      default: return unidade;
    }
  };

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total_value, 0);
  const orderTotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);

  const handleNavigation = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace('.', ',');
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
        {/* Mensagens de feedback */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Resumo do Dia */}
        <div className="info-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Resumo do Dia</h3>
            <button onClick={handleViewTodayOrders} className="btn-view-orders">
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
                R$ {formatCurrency(todayRevenue)}
              </span>
            </div>
          </div>
        </div>

        {/* Card de Cadastro Rápido */}
        <div className="quick-order-card">
          <h3>Cadastro Rápido de Pedido</h3>
          
          {/* Select e Input para adicionar produtos */}
          <div className="add-product-row">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value ? Number(e.target.value) : '')}
              className="product-select"
            >
              <option value="">Selecione um produto</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - R$ {formatCurrency(product.price)}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Quantidade"
              step="0.01"
              min="0.01"
              className="quantity-input"
            />

            <button onClick={handleAddToOrder} className="btn-add">
              Adicionar
            </button>
          </div>

          {/* Tabela de Retiradas */}
          <div className="table-responsive">
            <h4 style={{ margin: '20px 0 10px 0', color: '#333' }}>Histórico de Retiradas</h4>
            <table className="products-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Unidade</th>
                  <th>Preço</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {retiradas.length > 0 ? (
                  retiradas.map((retirada, index) => (
                    <tr key={index}>
                      <td className="product-name">{retirada.name}</td>
                      <td className="quantity-value">{retirada.quantidade_retirada}</td>
                      <td>{getRetiradaUnit(retirada.unidade_retirada)}</td>
                      <td>R$ {formatCurrency(retirada.price)}</td>
                      <td className="date-cell">{formatDate(retirada.data_retirada)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty-table-message">
                      Nenhuma retirada encontrada para este ponto de venda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Resumo do Pedido */}
          {orderItems.length > 0 && (
            <div className="order-summary">
              <h4>
                <ShoppingCart size={18} />
                Resumo do Pedido
              </h4>
              
              <div className="summary-items">
                {orderItems.map((item, index) => (
                  <div key={index} className="summary-item">
                    <span className="item-name">{item.product_name}</span>
                    <span className="item-details">
                      {item.quantity} {item.unitLabel} x R$ {formatCurrency(item.unit_price)}
                    </span>
                    <span className="item-total">R$ {formatCurrency(item.total_price)}</span>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="btn-remove-item"
                      title="Remover item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="summary-total">
                <span>Total do Pedido:</span>
                <strong>R$ {formatCurrency(orderTotal)}</strong>
              </div>

              <button 
                onClick={handleSubmitOrder}
                className="btn-save-order"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Salvar Pedido'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Home;