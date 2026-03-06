import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Order } from '../types/Order';
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
      setLoading(true);
      
      // Prepara os filtros para enviar à API
      const apiFilters: any = {};
      if (filters.date) apiFilters.date = filters.date;
      if (filters.description) apiFilters.description = filters.description;
      if (filters.status) apiFilters.status = filters.status;
      
      console.log('🔍 Aplicando filtros:', apiFilters);
      
      const response = await orderService.getAll(apiFilters);
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

  const handleViewOrder = (id: number) => {
    navigate(`/orders/${id}`);
  };

  const handleEditOrder = (id: number) => {
    navigate(`/orders/${id}/edit`);
  };

  const handleDeleteOrder = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
      try {
        await orderService.delete(id);
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
      return <span className="status-badge status-pending">Pendente</span>;
    } else {
      return <span className="status-badge status-cancelled">Cancelado</span>;
    }
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
          <button
            onClick={() => navigate('/orders/new')}
            className="btn-primary"
          >
            + Novo Pedido
          </button>
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
                <option value="true">Pendente</option>
                <option value="false">Cancelado</option>
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
                <th>Cliente</th>
                <th>Data</th>
                <th>Valor Total</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-table">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                currentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id">#{order.id}</td>
                    <td>{order.customer_name || '—'}</td>
                    <td>{formatDateTime(order.order_date)}</td>
                    <td className="order-value">{formatCurrency(order.total_value)}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="btn-icon btn-view"
                          title="Visualizar"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleEditOrder(order.id)}
                          className="btn-icon btn-edit"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="btn-icon btn-delete"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
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