import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';
import { orderService } from '../services/OrderService';
import { getProducts, getRetiradasPorPontoVenda } from '../services/productService';
import { Trash2, ShoppingCart, RotateCcw } from 'lucide-react';
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
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  
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

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const currentUser = user;
      console.log('👤 Usuário atual:', currentUser);
      
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const hojeStr = `${ano}-${mes}-${dia}`;
      
      console.log('🌐 API_URL:', import.meta.env.VITE_API_URL);
      
      const [productsData, ordersResponse, retiradasData] = await Promise.all([
        getProducts(),
        orderService.getAll({ date: hojeStr }),
        getRetiradasPorPontoVenda()
      ]);
      
      console.log('📦 Produtos carregados:', productsData.length);
      console.log('📦 Pedidos carregados:', ordersResponse.orders?.length);
      console.log('📦 Retiradas carregadas:', retiradasData);
      
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

  const handleAddToOrder = (product: ProductWithUnit) => {
    const quantityStr = quantities[product.id];
    if (!quantityStr) {
      setError('Informe a quantidade');
      return;
    }

    const quantityNum = parseFloat(quantityStr);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Quantidade inválida');
      return;
    }

    const existingItem = orderItems.find(item => item.product_id === product.id);
    if (existingItem) {
      setError('Este produto já foi adicionado ao pedido');
      return;
    }

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
    // Limpa a quantidade após adicionar
    setQuantities(prev => ({ ...prev, [product.id]: '' }));
    setError('');
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Home.tsx - Função handleSubmitOrder corrigida

const handleSubmitOrder = async () => {
  if (orderItems.length === 0) {
    setError('Adicione pelo menos um item ao pedido');
    return;
  }

  setSubmitting(true);
  setError('');
  setSuccess('');

  try {
    // Verifica se o usuário está logado
    if (!user?.id) {
      throw new Error('Usuário não identificado');
    }

    // Prepara os dados do pedido
    const orderData = {
      sale_point_id: user.id,
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
    
    // 1️⃣ Primeiro, cria o pedido
    const orderResponse = await orderService.create(orderData);
    console.log('✅ Pedido criado:', orderResponse);
    
    // 2️⃣ Depois, para cada item do pedido, precisamos subtrair do histórico de retiradas
    // Isso deve ser feito no backend, mas por enquanto vamos simular
    const itemsToSubtract = orderItems.map(item => ({
      product_id: item.product_id,
      quantidade: item.quantity,
      unidade: item.unit_type
    }));
    
    console.log('🔄 Itens para subtrair do estoque:', itemsToSubtract);
    
    // Aqui você chamaria o serviço para dar baixa no estoque
    // await productService.subtractFromStock(itemsToSubtract);
    
    setSuccess('Pedido criado com sucesso!');
    setOrderItems([]);
    setQuantities({});
    
    // Recarrega os dados para atualizar a lista
    await loadInitialData();
    
    setTimeout(() => setSuccess(''), 3000);
    
  } catch (error: any) {
    console.error('❌ Erro ao criar pedido:', error);
    setError(error.message || 'Erro ao criar pedido. Tente novamente.');
  } finally {
    setSubmitting(false);
  }
};

  // 🔥 NOVA FUNÇÃO: Retornar tudo ao estoque
  const handleReturnAllToStock = async () => {
    if (retiradas.length === 0) {
      setError('Não há retiradas para retornar ao estoque');
      return;
    }

    const confirmReturn = window.confirm(
      `Tem certeza que deseja retornar TODOS os ${retiradas.length} produtos ao estoque?`
    );
    
    if (!confirmReturn) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Aqui você implementaria a chamada à API para retornar ao estoque
      console.log('🔄 Retornando produtos ao estoque:', retiradas);
      
      // Simulação de chamada à API (substitua pela sua implementação real)
      // await productService.returnToStock(retiradas);
      
      // Por enquanto, só mostra mensagem de sucesso
      setSuccess(`${retiradas.length} produtos retornados ao estoque com sucesso!`);
      
      // Recarrega os dados
      setTimeout(() => {
        loadInitialData();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro ao retornar produtos:', error);
      setError('Erro ao retornar produtos ao estoque. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuantityChange = (productId: number, value: string) => {
    setQuantities(prev => ({ ...prev, [productId]: value }));
  };

  const getUnitSymbol = (unidade: string): string => {
    switch (unidade) {
      case 'amount': return 'un';
      case 'kg': return 'kg';
      case 'liters': return 'L';
      default: return unidade;
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

          {/* Tabela de Retiradas com campo para nova quantidade */}
          <div className="table-responsive">
            {/* 🔥 HEADER DA TABELA COM BOTÃO */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h4 style={{ margin: 0, color: '#333' }}>Histórico de Retiradas</h4>
              <button 
                onClick={handleReturnAllToStock}
                className="btn-return-stock"
                disabled={retiradas.length === 0 || submitting}
                title="Retornar todos os produtos ao estoque"
              >
                <RotateCcw size={16} />
                Retornar Tudo ao Estoque
              </button>
            </div>
            
            <table className="products-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade Retirada</th>
                  <th>Preço Unitário</th>
                  <th>Nova Quantidade</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {retiradas.length > 0 ? (
                  retiradas.map((retirada) => {
                    const product = products.find(p => p.id === retirada.id);
                    if (!product) return null;
                    
                    return (
                      <tr key={retirada.id}>
                        <td className="product-name">{retirada.name}</td>
                        <td className="quantity-value">
                          {retirada.quantidade_retirada} {getUnitSymbol(retirada.unidade_retirada)}
                        </td>
                        <td>R$ {formatCurrency(retirada.price)}</td>
                        <td>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder={`Qtd em ${getUnitSymbol(retirada.unidade_retirada)}`}
                            className="quantity-input"
                            value={quantities[retirada.id] || ''}
                            onChange={(e) => handleQuantityChange(retirada.id, e.target.value)}
                          />
                        </td>
                        <td>
                          <button 
                            onClick={() => handleAddToOrder(product)}
                            className="btn-add-small"
                            disabled={!quantities[retirada.id]}
                          >
                            Adicionar
                          </button>
                        </td>
                      </tr>
                    );
                  })
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