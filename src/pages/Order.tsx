import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Order } from '../types/Order';
import type { OrderResponseDTO, ItemOrderResponseDTO } from '../types/Order';
import { orderService } from '../services/OrderService';
import { authService } from '../services/AuthService';
import '../styles/Base.css';
import '../styles/Order.css';

export function OrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para armazenar os detalhes do pedido selecionado
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderResponseDTO | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  
  // Estados para filtros - simplificado para usar os parâmetros da API
  const [filters, setFilters] = useState(() => {
    const stateFilters = location.state?.filters;
    return {
      date: stateFilters?.date || '',
      description: '',
      status: '' // 'true' ou 'false' como string
    };
  });
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    if (location.state?.filters) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    loadOrders();
  }, [filters]); // Recarrega quando os filtros mudam

  const loadOrders = async () => {
    try {
      const user = authService.getUser();
      setLoading(true);
      
      // Prepara os filtros para enviar à API
      const apiFilters: any = {};
      if (filters.date) apiFilters.date = filters.date;
      if (filters.description) apiFilters.description = filters.description;
      if (filters.status) apiFilters.status = filters.status;
      
      console.log('🔍 Aplicando filtros:', apiFilters);
      
      const response = await orderService.getAll(user?.id, apiFilters);
      console.log('📦 Pedidos recebidos:', response.orders);
      
      setOrders(response.orders);
      setTotalPages(Math.ceil(response.orders.length / itemsPerPage));
      setCurrentPage(1);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setError('Erro ao carregar pedidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      date: '',
      description: '',
      status: ''
    });
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleViewOrderDetails = async (orderId: number) => {
    console.log('🔵 FUNÇÃO CHAMADA - orderId:', orderId);
    
    try {
      if (expandedOrderId === orderId) {
        console.log('🔽 Fechando detalhes do pedido', orderId);
        setExpandedOrderId(null);
        setSelectedOrderDetails(null);
        return;
      }
      
      setLoadingDetails(true);
      setExpandedOrderId(orderId);
      
      const response = await orderService.getOrder(orderId);
      console.log('✅ Resposta RAW:', response);
      
      // Pega os dados (se veio como {order} ou direto)
      const apiData = response.order || response;
      console.log('📦 apiData:', apiData);
      
      if (!apiData) {
        throw new Error('Dados não encontrados');
      }
      
      // DEBUG: Ver o que tem no apiData
      console.log('🔍 Chaves do apiData:', Object.keys(apiData));
      console.log('🔍 apiData.item_order:', apiData.item_order);
      
      // ADAPTADOR CORRIGIDO - usa item_order em vez de items
      const adaptedOrder: OrderResponseDTO = {
        id: apiData.id,
        status: apiData.status,
        total_value: apiData.total_value,
        description: apiData.description || '',
        order_date: apiData.date || apiData.order_date || new Date().toISOString(),
        items: Array.isArray(apiData.item_order) ? apiData.item_order.map((item: any) => ({
          product_id: item.product_id,
          item_price: item.price || item.item_price || 0,
          amount: item.amount,
          kg: item.kg,
          liters: item.liters
        })) : []
      };
      
      console.log('✅ Dados adaptados:', adaptedOrder);
      console.log('✅ Itens adaptados:', adaptedOrder.items);
      
      setSelectedOrderDetails(adaptedOrder);
      
    } catch (error) {
      console.error('❌ Erro:', error);
      setError('Erro ao carregar detalhes do pedido. Tente novamente.');
      setExpandedOrderId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEditOrder = (id: number) => {
    navigate(`/orders/${id}/edit`);
  };

  const handleDeleteOrder = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
      try {
        await orderService.delete(id);
        // Se o pedido excluído estava expandido, limpa os detalhes
        if (expandedOrderId === id) {
          setExpandedOrderId(null);
          setSelectedOrderDetails(null);
        }
        loadOrders();
      } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        setError('Erro ao excluir pedido. Tente novamente.');
      }
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Adapta o status boolean para exibição
  const getStatusBadge = (status: boolean) => {
    if (status) {
      return <span className="status-badge status-pending">Pago</span>;
    } else {
      return <span className="status-badge status-cancelled">Pendente</span>;
    }
  };

  // Componente para exibir os itens do pedido
  // Componente para exibir os itens do pedido - CORRIGIDO
  // Componente TEMPORÁRIO para teste - substitua o OrderDetails atual
  const OrderDetails = ({ order, items }: { order: OrderResponseDTO, items: ItemOrderResponseDTO[] }) => {
    console.log('🔥🔥🔥 OrderDetails FOI RENDERIZADO!');
    console.log('📦 order recebido:', order);
    console.log('📦 items recebidos:', items);
    console.log('📦 items length:', items?.length);
    
    return (
      <div style={{ 
        backgroundColor: 'red', 
        color: 'white', 
        padding: '20px',
        margin: '10px 0',
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        {items && items.length > 0 ? (
          <div>
            <h3 style={{ color: 'yellow' }}>ITENS ENCONTRADOS! {items.length} itens</h3>
            <pre style={{ color: 'white', fontSize: '14px' }}>
              {JSON.stringify(items, null, 2)}
            </pre>
          </div>
        ) : (
          <div>
            <h3 style={{ color: 'yellow' }}>⚠️ NENHUM ITEM ENCONTRADO!</h3>
            <p>order.id: {order?.id}</p>
            <p>order.date: {order?.date}</p>
            <p>order.total_value: {order?.total_value}</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <p>Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="container header-content">
          <h1 className="page-title">LATICÍNIOS BOA ESPERANÇA</h1>
          <div className="user-info">
            <span className="user-name">Bem-vindo!</span>
            <button onClick={handleLogout} className="logout-button">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Pedidos</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Total: {orders.length} pedidos encontrados</p>
          </div>
        </div>

        <div className="filters-section">
          <h3>Filtros</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Data</label>
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label>Descrição</label>
              <input
                type="text"
                name="description"
                value={filters.description}
                onChange={handleFilterChange}
                placeholder="Buscar por descrição..."
              />
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">Todos</option>
                <option value="true">Pago</option>
                <option value="false">Pendente</option>
              </select>
            </div>
          </div>

          {Object.values(filters).some(value => value !== '') && (
            <div className="filters-actions">
              <button onClick={clearFilters} className="btn-link">
                Limpar Filtros
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Nº Pedido</th>
                <th>Data</th>
                <th>Valor Total</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-table">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                currentOrders.map((order) => (
                  <>
                    <tr key={order.id} className={expandedOrderId === order.id ? 'order-row-expanded' : ''}>
                      <td className="order-id">#{order.id}</td>
                      <td>{formatDateTime(order.order_date)}</td>
                      <td className="order-value">{formatCurrency(order.total_value)}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleViewOrderDetails(order.id)}
                            className={`btn-icon ${expandedOrderId === order.id ? 'btn-view-active' : 'btn-view'}`}
                            title={expandedOrderId === order.id ? "Ocultar detalhes" : "Ver detalhes"}
                          >
                            {expandedOrderId === order.id ? '▼' : '▶'} Detalhes
                          </button>
                          <button
                            onClick={() => handleEditOrder(order.id)}
                            className="btn-icon btn-edit"
                            title="Editar"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="btn-icon btn-delete"
                            title="Excluir"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedOrderId === order.id && (
                      <tr className="order-details-row">
                        <td colSpan={5} className="order-details-cell">
                          {loadingDetails ? (
                            <div className="loading-details">Carregando itens...</div>
                          ) : selectedOrderDetails ? (
                            <>
                              <div style={{ backgroundColor: 'blue', color: 'white', padding: '5px' }}>
                                DEBUG: selectedOrderDetails.id = {selectedOrderDetails.id}
                              </div>
                              <OrderDetails 
                                order={selectedOrderDetails} 
                                items={selectedOrderDetails.items} 
                              />
                            </>
                          ) : (
                            <div style={{ backgroundColor: 'orange', padding: '20px' }}>
                              selectedOrderDetails é null
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>

          {orders.length > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, orders.length)} de {orders.length} resultados
              </div>
              <div className="pagination-controls">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Anterior
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => paginate(pageNumber)}
                      className={`pagination-button ${currentPage === pageNumber ? 'active' : ''}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}