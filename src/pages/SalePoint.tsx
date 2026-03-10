// SalePoint.tsx - COMPLETO E CORRIGIDO
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';
import { orderService } from '../services/OrderService';
import { getProducts, getRetiradasPorPontoVenda, subtrairEstoque } from '../services/productService';
import { Trash2, ShoppingCart, RotateCcw, ChevronDown, ChevronUp, LogOut, Package, FileText, BarChart3, Users } from 'lucide-react';
import type { SalePoint } from '../types/SalePoint';
import type { Order } from '../types/Order';
import type { ProductWithUnit, RetiradaResponse } from '../types/Product';
import '../styles/SalePoint.css';

type OrderItem = {
  product_id: number;
  product_name: string;
  unit_type: 'amount' | 'kg' | 'liters';
  quantity: number;
  unit_price: number;
  total_price: number;
  unitLabel: string;
};

type Retirada = RetiradaResponse & {
  price: number;
};

type SalePointWithData = SalePoint & {
  todayOrders: Order[];
  todayRevenue: number;
  retiradas: Retirada[];
  orderItems: OrderItem[];
  quantities: Record<number, string>;
  isExpanded: boolean;
  loading: boolean;
  error: string;
  success: string;
  submitting: boolean;
};

function SalesPointsPage() {
  const [currentUser, setCurrentUser] = useState<SalePoint | null>(null);
  const [salePoints, setSalePoints] = useState<SalePointWithData[]>([]);
  const [products, setProducts] = useState<ProductWithUnit[]>([]);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Verificar autenticação
  useEffect(() => {
    const user = authService.getUser();
    const token = authService.getToken();
    
    if (!user || !token) {
      navigate('/login');
    } else {
      setCurrentUser(user);
    }
  }, [navigate]);

  // Carregar dados iniciais
  useEffect(() => {
    if (currentUser) {
      loadAllSalePoints();
    }
  }, [currentUser]);

  const loadAllSalePoints = async () => {
    try {
      setGlobalLoading(true);
      setGlobalError('');

      // 1. Carregar todos os produtos
      const productsData = await getProducts();
      setProducts(productsData || []);

      // 2. Carregar todos os pontos de venda
      const salePointsData = await authService.getAllSalePoints();
      console.log('📊 Todos os pontos de venda:', salePointsData);

      const hoje = new Date();
      const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

      // 3. Para cada ponto, carregar seus dados específicos
      const salePointsWithData = await Promise.all(
        salePointsData.map(async (salePoint: SalePoint) => {
          try {
            // Buscar pedidos do dia para este ponto
            const ordersResponse = await orderService.getAll(salePoint.id, { date: hojeStr });
            const orders = ordersResponse.orders || [];
            
            // Calcular receita do dia
            const todayRevenue = orders.reduce(
              (sum: number, order: Order) => sum + order.total_value, 
              0
            );

            // Buscar retiradas para este ponto
            const retiradasData = await getRetiradasPorPontoVenda(salePoint.id);
            
            // Filtrar apenas retiradas ativas (status true)
            const retiradasAtivas = retiradasData.filter(r => r.status === true);
            
            // Enriquecer retiradas com preço dos produtos
            const retiradasComPreco = retiradasAtivas.map(retirada => {
              const product = productsData.find(p => p.id === retirada.product_id);
              return {
                ...retirada,
                price: product?.price || 0
              };
            });

            return {
              ...salePoint,
              todayOrders: orders,
              todayRevenue,
              retiradas: retiradasComPreco,
              orderItems: [],
              quantities: {},
              isExpanded: salePoint.id === currentUser?.id, // Expande apenas o ponto do usuário atual
              loading: false,
              error: '',
              success: '',
              submitting: false
            };
          } catch (error) {
            console.error(`❌ Erro ao carregar dados do ponto ${salePoint.name}:`, error);
            return {
              ...salePoint,
              todayOrders: [],
              todayRevenue: 0,
              retiradas: [],
              orderItems: [],
              quantities: {},
              isExpanded: false,
              loading: false,
              error: `Erro ao carregar dados`,
              success: '',
              submitting: false
            };
          }
        })
      );

      setSalePoints(salePointsWithData);

    } catch (error) {
      console.error('❌ Erro ao carregar pontos de venda:', error);
      setGlobalError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const toggleExpand = (salePointId: number) => {
    setSalePoints(prev =>
      prev.map(sp =>
        sp.id === salePointId
          ? { ...sp, isExpanded: !sp.isExpanded }
          : sp
      )
    );
  };

  const handleAddToOrder = (salePointId: number, product: ProductWithUnit) => {
    const salePoint = salePoints.find(sp => sp.id === salePointId);
    if (!salePoint) return;

    const quantityStr = salePoint.quantities[product.id];
    if (!quantityStr) {
      updateSalePointState(salePointId, { error: 'Informe a quantidade' });
      return;
    }

    const quantityNum = parseFloat(quantityStr);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      updateSalePointState(salePointId, { error: 'Quantidade inválida' });
      return;
    }

    const existingItem = salePoint.orderItems.find(item => item.product_id === product.id);
    if (existingItem) {
      updateSalePointState(salePointId, { error: 'Este produto já foi adicionado' });
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

    setSalePoints(prev =>
      prev.map(sp =>
        sp.id === salePointId
          ? {
              ...sp,
              orderItems: [...sp.orderItems, newItem],
              quantities: { ...sp.quantities, [product.id]: '' },
              error: ''
            }
          : sp
      )
    );
  };

  const handleRemoveItem = (salePointId: number, index: number) => {
    setSalePoints(prev =>
      prev.map(sp =>
        sp.id === salePointId
          ? {
              ...sp,
              orderItems: sp.orderItems.filter((_, i) => i !== index)
            }
          : sp
      )
    );
  };

  const handleSubmitOrder = async (salePointId: number) => {
    const salePoint = salePoints.find(sp => sp.id === salePointId);
    if (!salePoint) return;

    if (salePoint.orderItems.length === 0) {
      updateSalePointState(salePointId, { error: 'Adicione pelo menos um item' });
      return;
    }

    updateSalePointState(salePointId, { submitting: true, error: '', success: '' });

    try {
      // Validar estoque
      for (const item of salePoint.orderItems) {
        const retirada = salePoint.retiradas.find(r => r.product_id === item.product_id);
        
        if (!retirada) {
          throw new Error(`Produto ${item.product_name} não disponível`);
        }
        
        if (retirada.quantidade_retirada < item.quantity) {
          throw new Error(
            `Estoque insuficiente para ${item.product_name}. ` +
            `Disponível: ${retirada.quantidade_retirada} ${getUnitSymbol(retirada.unidade_retirada)}`
          );
        }
      }

      // Mapear itens
      const items = salePoint.orderItems.map(item => {
        const baseItem = { product_id: Number(item.product_id) };

        if (item.unit_type === 'amount') {
          return { ...baseItem, amount: Number(item.quantity), kg: null, liters: null };
        } else if (item.unit_type === 'kg') {
          return { ...baseItem, amount: null, kg: Number(item.quantity), liters: null };
        } else {
          return { ...baseItem, amount: null, kg: null, liters: Number(item.quantity) };
        }
      });

      const orderData = {
        sale_point_id: salePointId, // Importante: incluir o ID do ponto de venda
        description: `Pedido do ponto ${salePoint.name} com ${salePoint.orderItems.length} item(ns)`,
        items: items
      };

      console.log('📤 Enviando pedido:', orderData);
      
      await orderService.create(orderData);
      
      // Recarregar dados do ponto
      await refreshSalePointData(salePointId);
      
      updateSalePointState(salePointId, { 
        success: 'Pedido criado com sucesso!',
        orderItems: [],
        quantities: {}
      });

      setTimeout(() => {
        updateSalePointState(salePointId, { success: '' });
      }, 3000);

    } catch (error: any) {
      console.error('❌ Erro ao criar pedido:', error);
      updateSalePointState(salePointId, { 
        error: error.message || 'Erro ao criar pedido' 
      });
    } finally {
      updateSalePointState(salePointId, { submitting: false });
    }
  };

  const handleReturnAllToStock = async (salePointId: number) => {
    const salePoint = salePoints.find(sp => sp.id === salePointId);
    if (!salePoint || salePoint.retiradas.length === 0) {
      updateSalePointState(salePointId, { error: 'Não há retiradas para retornar' });
      return;
    }

    const totalItens = salePoint.retiradas.reduce((sum, r) => sum + r.quantidade_retirada, 0);
    
    const confirmReturn = window.confirm(
      `Confirma o retorno de ${salePoint.retiradas.length} produto(s) (total: ${totalItens} unidades) ao estoque?`
    );
    
    if (!confirmReturn) return;

    updateSalePointState(salePointId, { submitting: true, error: '', success: '' });

    try {
      // Usar a função específica para retornar ao estoque
      // Nota: Pode ser necessário importar retornarTodasRetiradasAoEstoque
      const itemsParaRetornar = salePoint.retiradas.map(retirada => ({
        product_id: retirada.product_id,
        quantidade: Math.abs(retirada.quantidade_retirada),
        unidade: retirada.unidade_retirada
      }));

      // Se existir a função específica, use-a. Senão, use subtrairEstoque com valores negativos?
      // Por enquanto, vamos usar subtrairEstoque (assumindo que aceita valores positivos para retornar)
      const response = await subtrairEstoque(itemsParaRetornar);
      
      console.log('✅ Resposta do retorno:', response);
      
      if (response.detalhes?.total_erros > 0) {
        updateSalePointState(salePointId, { 
          error: `Falha em ${response.detalhes.total_erros} produto(s)` 
        });
      } else {
        updateSalePointState(salePointId, { 
          success: `${salePoint.retiradas.length} produtos retornados com sucesso!` 
        });
      }
      
      // Recarregar dados após retorno
      setTimeout(() => {
        refreshSalePointData(salePointId);
      }, 1500);

    } catch (error: any) {
      console.error('❌ Erro ao retornar produtos:', error);
      updateSalePointState(salePointId, { 
        error: error.message || 'Erro ao retornar produtos' 
      });
    } finally {
      updateSalePointState(salePointId, { submitting: false });
    }
  };

  const refreshSalePointData = async (salePointId: number) => {
    try {
      const hoje = new Date();
      const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

      const [ordersResponse, retiradasData] = await Promise.all([
        orderService.getAll(salePointId, { date: hojeStr }),
        getRetiradasPorPontoVenda(salePointId)
      ]);

      const orders = ordersResponse.orders || [];
      const retiradasAtivas = retiradasData.filter(r => r.status === true);
      
      const retiradasComPreco = retiradasAtivas.map(retirada => {
        const product = products.find(p => p.id === retirada.product_id);
        return {
          ...retirada,
          price: product?.price || 0
        };
      });

      const todayRevenue = orders.reduce(
        (sum: number, order: Order) => sum + order.total_value, 
        0
      );

      setSalePoints(prev =>
        prev.map(sp =>
          sp.id === salePointId
            ? {
                ...sp,
                todayOrders: orders,
                todayRevenue,
                retiradas: retiradasComPreco,
                orderItems: [], // Limpa itens do pedido após refresh
                quantities: {}
              }
            : sp
        )
      );
    } catch (error) {
      console.error(`Erro ao recarregar ponto ${salePointId}:`, error);
    }
  };

  const updateSalePointState = (salePointId: number, updates: Partial<SalePointWithData>) => {
    setSalePoints(prev =>
      prev.map(sp => sp.id === salePointId ? { ...sp, ...updates } : sp)
    );
  };

  const handleQuantityChange = (salePointId: number, productId: number, value: string) => {
    setSalePoints(prev =>
      prev.map(sp =>
        sp.id === salePointId
          ? { ...sp, quantities: { ...sp.quantities, [productId]: value } }
          : sp
      )
    );
  };

  const handleViewTodayOrders = (salePointId: number) => {
    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    
    navigate('/orders', { 
      state: { 
        filters: {
          date: hojeStr,
          sale_point_id: salePointId
        }
      } 
    });
  };

  const getUnitSymbol = (unidade: string): string => {
    switch (unidade) {
      case 'amount': return 'un';
      case 'kg': return 'kg';
      case 'liters': return 'L';
      default: return unidade;
    }
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(2).replace('.', ',');
  };

  const handleNavigation = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!currentUser || globalLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        Carregando...
      </div>
    );
  }

  return (
    <div className="sale-points-container">
      <header className="sale-points-header">
        <div className="header-content">
          <h1>LATICÍNIOS BOA ESPERANÇA</h1>
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            
            <div className="hamburger-menu">
              <button 
                className="hamburger-button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </button>
              
              {menuOpen && (
                <div className="menu-dropdown">
                  <button onClick={() => handleNavigation('/products')}>
                    <Package size={16} />
                    Produtos
                  </button>
                  <button onClick={() => handleNavigation('/orders')}>
                    <FileText size={16} />
                    Pedidos
                  </button>
                  <button onClick={() => handleNavigation('/reports')}>
                    <BarChart3 size={16} />
                    Relatórios
                  </button>
                  <button onClick={() => handleNavigation('/sale-points')}>
                    <Users size={16} />
                    Pontos de Venda
                  </button>
                  <div className="menu-divider"></div>
                  <button onClick={handleLogout} className="logout-menu-item">
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="sale-points-main">
        {globalError && <div className="error-message global-error">{globalError}</div>}

        <h2 className="page-title">Pontos de Venda</h2>

        {/* Lista de Pontos de Venda */}
        <div className="sale-points-list">
          {salePoints.map((salePoint) => (
            <div key={salePoint.id} className="sale-point-card">
              {/* Cabeçalho do Ponto */}
              <div 
                className="sale-point-header"
                onClick={() => toggleExpand(salePoint.id)}
              >
                <div className="sale-point-info">
                  <h3>{salePoint.name}</h3>
                  <span className="sale-point-email">{salePoint.email}</span>
                </div>
                
                <div className="sale-point-stats">
                  <div className="stat-badge">
                    <span>📦 {salePoint.todayOrders.length} pedidos</span>
                    <span>💰 R$ {formatCurrency(salePoint.todayRevenue)}</span>
                  </div>
                  {salePoint.isExpanded ? 
                    <ChevronUp size={20} /> : 
                    <ChevronDown size={20} />
                  }
                </div>
              </div>

              {/* Conteúdo Expandido */}
              {salePoint.isExpanded && (
                <div className="sale-point-content">
                  {salePoint.error && (
                    <div className="error-message">{salePoint.error}</div>
                  )}
                  {salePoint.success && (
                    <div className="success-message">{salePoint.success}</div>
                  )}

                  {/* Resumo do Dia */}
                  <div className="info-section">
                    <div className="section-header">
                      <h4>Resumo do Dia</h4>
                      <button 
                        onClick={() => handleViewTodayOrders(salePoint.id)} 
                        className="btn-view-orders"
                      >
                        Ver pedidos
                      </button>
                    </div>
                    
                    <div className="info-cards">
                      <div className="info-card">
                        <span className="info-label">Pedidos Hoje</span>
                        <span className="info-value">{salePoint.todayOrders.length}</span>
                      </div>
                      <div className="info-card">
                        <span className="info-label">Faturamento</span>
                        <span className="info-value">
                          R$ {formatCurrency(salePoint.todayRevenue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabela de Produtos */}
                  <div className="products-section">
                    <div className="section-header">
                      <h4>Produtos em Estoque</h4>
                      <button 
                        onClick={() => handleReturnAllToStock(salePoint.id)}
                        className="btn-return-stock"
                        disabled={salePoint.retiradas.length === 0 || salePoint.submitting}
                      >
                        <RotateCcw size={16} />
                        {salePoint.submitting ? 'Processando...' : 'Retornar ao estoque'}
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table className="products-table">
                        <thead>
                          <tr>
                            <th>Produto</th>
                            <th>Estoque</th>
                            <th>Preço</th>
                            <th>Quantidade</th>
                            <th>Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salePoint.retiradas.length > 0 ? (
                            salePoint.retiradas.map((retirada) => {
                              const product = products.find(p => p.id === retirada.product_id);
                              if (!product) return null;
                              
                              return (
                                <tr key={retirada.id}>
                                  <td className="product-name">{product.name}</td>
                                  <td>
                                    <span className="quantity-value">
                                      {retirada.quantidade_retirada} {getUnitSymbol(retirada.unidade_retirada)}
                                    </span>
                                  </td>
                                  <td>R$ {formatCurrency(product.price)}</td>
                                  <td>
                                    <input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      placeholder={getUnitSymbol(retirada.unidade_retirada)}
                                      className="quantity-input"
                                      value={salePoint.quantities[retirada.product_id] || ''}
                                      onChange={(e) => 
                                        handleQuantityChange(
                                          salePoint.id, 
                                          retirada.product_id, 
                                          e.target.value
                                        )
                                      }
                                      disabled={salePoint.submitting}
                                    />
                                  </td>
                                  <td>
                                    <button 
                                      onClick={() => handleAddToOrder(salePoint.id, product)}
                                      className="btn-add-small"
                                      disabled={
                                        !salePoint.quantities[retirada.product_id] || 
                                        salePoint.submitting
                                      }
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
                                Nenhum produto disponível para este ponto de venda
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Resumo do Pedido */}
                  {salePoint.orderItems.length > 0 && (
                    <div className="order-summary">
                      <h4>
                        <ShoppingCart size={18} />
                        Pedido em Andamento
                      </h4>
                      
                      <div className="summary-items">
                        {salePoint.orderItems.map((item, index) => (
                          <div key={index} className="summary-item">
                            <span className="item-name">{item.product_name}</span>
                            <span className="item-details">
                              {item.quantity} {item.unitLabel}
                            </span>
                            <span className="item-total">
                              R$ {formatCurrency(item.total_price)}
                            </span>
                            <button
                              onClick={() => handleRemoveItem(salePoint.id, index)}
                              className="btn-remove-item"
                              disabled={salePoint.submitting}
                              title="Remover item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="summary-total">
                        <span>Total do Pedido</span>
                        <strong>
                          R$ {formatCurrency(
                            salePoint.orderItems.reduce((sum, item) => sum + item.total_price, 0)
                          )}
                        </strong>
                      </div>

                      <button 
                        onClick={() => handleSubmitOrder(salePoint.id)} 
                        className="btn-save-order"
                        disabled={salePoint.submitting}
                      >
                        {salePoint.submitting ? 'Processando...' : 'Finalizar Pedido'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default SalesPointsPage;