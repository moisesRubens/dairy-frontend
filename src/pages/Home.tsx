// Home.tsx - Completo e corrigido
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';
import { orderService } from '../services/OrderService';
import { getProducts, getRetiradasPorPontoVenda, subtrairEstoque } from '../services/productService';
import { Trash2, ShoppingCart, RotateCcw } from 'lucide-react';
import type { SalePoint } from '../types/SalePoint';
import type { Order } from '../types/Order';
import type { ProductWithUnit, RetiradaResponse } from '../types/Product';
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

// Estendendo o tipo RetiradaResponse para garantir que price está presente
type Retirada = RetiradaResponse & {
  price: number;
};

function Home() {
  const [user, setUser] = useState<SalePoint | null>(null);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductWithUnit[]>([]);
  const [retiradas, setRetiradas] = useState<Retirada[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
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
      
      const [productsData, ordersResponse, retiradasData] = await Promise.all([
        getProducts(),
        orderService.getAll({ date: hojeStr }),
        getRetiradasPorPontoVenda()
      ]);
      
      console.log('📦 Produtos carregados:', productsData.length);
      console.log('📦 Pedidos carregados:', ordersResponse.orders?.length);
      console.log('📦 Retiradas carregadas:', retiradasData);
      
      // Enriquecer retiradas com o preço dos produtos
      const retiradasComPreco: Retirada[] = retiradasData.map(retirada => {
        const product = productsData.find(p => p.id === retirada.product_id);
        return {
          ...retirada,
          price: product?.price || 0
        };
      });
      
      setTodayOrders(ordersResponse.orders || []);
      setProducts(productsData || []);
      setRetiradas(retiradasComPreco);
      
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
    
    if (product.amount && product.amount > 0) {
      unitType = 'amount';
      unitLabel = 'Unidade(s)';
    } else if (product.kg && product.kg > 0) {
      unitType = 'kg';
      unitLabel = 'Quilos';
    } else if (product.liters && product.liters > 0) {
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
    setQuantities(prev => ({ ...prev, [product.id]: '' }));
    setError('');
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Home.tsx - Função handleSubmitOrder corrigida
  // Home.tsx - Função handleSubmitOrder corrigida com validações
  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      setError('Adicione pelo menos um item ao pedido');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!user?.id) {
        throw new Error('Usuário não identificado');
      }

      // Validar se todos os produtos têm estoque suficiente nas retiradas
      for (const item of orderItems) {
        const retirada = retiradas.find(r => r.product_id === item.product_id);
        
        if (!retirada) {
          throw new Error(`Produto ${item.product_name} não está disponível para retirada`);
        }
        
        if (retirada.quantidade_retirada < item.quantity) {
          throw new Error(
            `Estoque insuficiente para ${item.product_name}. ` +
            `Disponível: ${retirada.quantidade_retirada} ${getUnitSymbol(retirada.unidade_retirada)}`
          );
        }
      }

      // Mapeia os itens para o formato ItemOrderRequestDTO da API
      const items = orderItems.map(item => {
        const baseItem = {
          product_id: Number(item.product_id)
        };

        // Determina qual campo preencher baseado no tipo de unidade
        if (item.unit_type === 'amount') {
          return {
            ...baseItem,
            amount: Number(item.quantity),
            kg: null,
            liters: null
          };
        } else if (item.unit_type === 'kg') {
          return {
            ...baseItem,
            amount: null,
            kg: Number(item.quantity),
            liters: null
          };
        } else if (item.unit_type === 'liters') {
          return {
            ...baseItem,
            amount: null,
            kg: null,
            liters: Number(item.quantity)
          };
        }
        return null;
      }).filter(item => item !== null);

      // Monta o payload exatamente como a API espera (OrderRequestDTO)
      const orderData = {
        description: `Pedido com ${orderItems.length} item(ns)`,
        items: items
      };

      console.log('📤 Enviando pedido:', JSON.stringify(orderData, null, 2));
      
      const orderResponse = await orderService.create(orderData);
      console.log('✅ Pedido criado:', orderResponse);
      
      setSuccess('Pedido criado com sucesso!');
      setOrderItems([]);
      setQuantities({});
      
      await loadInitialData();
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error: any) {
      console.error('❌ Erro ao criar pedido:', error);
      
      // Mensagens de erro mais amigáveis
      if (error.message.includes('409')) {
        setError('Estoque insuficiente para um ou mais produtos');
      } else if (error.message.includes('invalid inputs')) {
        setError('Produto não disponível para retirada ou quantidade inválida');
      } else {
        setError(error.message || 'Erro ao criar pedido. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnAllToStock = async () => {
    if (retiradas.length === 0) {
      setError('Não há retiradas para retornar ao estoque');
      return;
    }
    const confirmReturn = window.confirm(
      `Confirma o retorno de ${retiradas.length} produto(s) ao estoque?`
    );
    if (!confirmReturn) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Retornando produtos ao estoque via /subtrair-estoque:', retiradas);

      // Prepara o payload para o endpoint /subtrair-estoque
      // A API espera um ARRAY DIRETAMENTE (List[ItemRetiradaDTO])
      // Usamos valores NEGATIVOS para ADICIONAR ao estoque
      const itemsParaRetornar = retiradas.map(retirada => ({
        product_id: retirada.product_id,
        quantidade: Math.abs(retirada.quantidade_retirada), // Valor negativo para adicionar ao estoque
        unidade: retirada.unidade_retirada
      }));

      console.log('📤 Enviando requisição para /subtrair-estoque (array direto):', itemsParaRetornar);

      // Usa o serviço subtrairEstoque que agora envia o array diretamente
      const response = await subtrairEstoque(itemsParaRetornar);
      
      console.log('✅ Resposta do servidor:', response);

      // Verifica se houve erros no processamento
      if (response.detalhes?.total_erros > 0) {
        console.warn('⚠️ Alguns produtos tiveram erro:', response.detalhes.erros);
        
        // Monta mensagem de erro detalhada
        const errosMsg = response.detalhes.erros
          .map(e => `• ${e.nome || `Produto ${e.product_id}`}: ${e.erro}`)
          .join('\n');
        
        setError(`Falha ao retornar ${response.detalhes.total_erros} produto(s):\n${errosMsg}`);
        
        if (response.detalhes.total_sucessos > 0) {
          setSuccess(`${response.detalhes.total_sucessos} produtos retornados com sucesso.`);
        }
      } else {
        setSuccess(`${retiradas.length} produtos retornados ao estoque com sucesso!`);
      }
      
      // Recarrega os dados para atualizar a lista de retiradas (que deve ficar vazia)
      setTimeout(() => {
        loadInitialData();
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ Erro ao retornar produtos:', error);
      setError(error.message || 'Erro ao retornar produtos ao estoque. Tente novamente.');
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
                    Produtos
                  </button>
                  <button onClick={() => handleNavigation('/orders')}>
                    Pedidos
                  </button>
                  <button onClick={() => handleNavigation('/reports')}>
                    Relatórios
                  </button>
                  <button onClick={() => handleNavigation('/sale-points')}>
                    Pontos de Venda
                  </button>
                  <div className="menu-divider"></div>
                  <button onClick={handleLogout} className="logout-menu-item">
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="home-main">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Resumo do Dia */}
        <div className="info-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Resumo do Dia</h3>
            <button onClick={handleViewTodayOrders} className="btn-view-orders">
              Visualizar pedidos
            </button>
          </div>
          <div className="info-cards">
            <div className="info-card">
              <span className="info-label">Pedidos</span>
              <span className="info-value">{todayOrders.length}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Faturamento</span>
              <span className="info-value">
                R$ {formatCurrency(todayRevenue)}
              </span>
            </div>
          </div>
        </div>

        {/* Card de Cadastro Rápido */}
        <div className="quick-order-card">
          <h4>Cadastro de pedidos</h4>

          {/* Tabela de Retiradas */}
          <div className="table-responsive">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <button 
                onClick={handleReturnAllToStock}
                className="btn-return-stock"
                disabled={retiradas.length === 0 || submitting}
                title="Retornar todos os produtos ao estoque"
              >
                <RotateCcw size={16} />
                {submitting ? 'Processando...' : 'Retornar produtos ao estoque'}
              </button>
            </div>
            
            <table className="products-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Em estoque</th>
                  <th>Preço</th>
                  <th>Quantidade</th>
                  <th>Adicionar ao pedido</th>
                </tr>
              </thead>
              <tbody>
                {retiradas.length > 0 ? (
                  retiradas.map((retirada) => {
                    const product = products.find(p => p.id === retirada.product_id);
                    if (!product) return null;
                    
                    return (
                      <tr key={retirada.id}>
                        <td className="product-name">{product.name}</td>
                        <td className="quantity-value">
                          {retirada.quantidade_retirada} {getUnitSymbol(retirada.unidade_retirada)}
                        </td>
                        <td>R$ {formatCurrency(product.price)}</td>
                        <td>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder={`${getUnitSymbol(retirada.unidade_retirada)}`}
                            className="quantity-input"
                            value={quantities[retirada.product_id] || ''}
                            onChange={(e) => handleQuantityChange(retirada.product_id, e.target.value)}
                          />
                        </td>
                        <td>
                          <button 
                            onClick={() => handleAddToOrder(product)}
                            className="btn-add-small"
                            disabled={!quantities[retirada.product_id] || submitting}
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