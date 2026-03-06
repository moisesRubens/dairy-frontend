import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Adicione useLocation
import type { Order } from '../types/Order';
import { orderService } from '../services/OrderService';
import { authService } from '../services/AuthService';
import '../styles/Base.css';
import '../styles/Order.css';

export function OrdersPage() {
  const location = useLocation(); // Para acessar o state passado na navegação
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para filtros - inicializa com o state da navegação se existir
  const [filters, setFilters] = useState(() => {
    // Verifica se veio algum filtro da Home
    const stateFilters = location.state?.filters;
    return {
      orderNumber: '',
      customerName: '',
      status: '',
      dateFrom: stateFilters?.dateFrom || '',
      dateTo: stateFilters?.dateTo || ''
    };
  });
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Efeito para limpar o state da navegação depois de usar
  useEffect(() => {
    if (location.state?.filters) {
      // Opcional: limpar o state para não reaplicar em atualizações
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  // ... resto do código igual (loadOrders, applyFilters, etc)

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAll();
      setOrders(response.orders);
      setFilteredOrders(response.orders);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setError('Erro ao carregar pedidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (filters.orderNumber) {
      filtered = filtered.filter(order => 
        order.id.toString().includes(filters.orderNumber)
      );
    }

    if (filters.customerName) {
      filtered = filtered.filter(order =>
        order.customer_name.toLowerCase().includes(filters.customerName.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      dateFrom.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.order_date);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate >= dateFrom;
      });
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate <= dateTo;
      });
    }

    setFilteredOrders(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
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
      orderNumber: '',
      customerName: '',
      status: '',
      dateFrom: '',
      dateTo: ''
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
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; text: string }> = {
      pending: { className: 'status-badge status-pending', text: 'Pendente' },
      approved: { className: 'status-badge status-approved', text: 'Aprovado' },
      delivered: { className: 'status-badge status-delivered', text: 'Entregue' },
      cancelled: { className: 'status-badge status-cancelled', text: 'Cancelado' }
    };
    
    const config = statusConfig[status] || { className: 'status-badge', text: status };
    
    return (
      <span className={config.className}>
        {config.text}
      </span>
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
      {/* Header - usando classes do base.css */}
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

      {/* Main Content */}
      <main className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        {/* Header with Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Pedidos</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Total: {filteredOrders.length} pedidos encontrados</p>
          </div>
          <button
            onClick={() => navigate('/orders/new')}
            className="btn-primary"
          >
            + Novo Pedido
          </button>
        </div>

        {/* Filters Section - usando estilos locais do Order.css */}
        <div className="filters-section">
          <h3>Filtros</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Nº Pedido</label>
              <input
                type="text"
                name="orderNumber"
                value={filters.orderNumber}
                onChange={handleFilterChange}
                placeholder="Buscar por número..."
              />
            </div>

            <div className="filter-group">
              <label>Cliente</label>
              <input
                type="text"
                name="customerName"
                value={filters.customerName}
                onChange={handleFilterChange}
                placeholder="Nome do cliente..."
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
                <option value="pending">Pendente</option>
                <option value="approved">Aprovado</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Data Inicial</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label>Data Final</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
              />
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

        {/* Error Message - usando classe do base.css */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Table */}
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
                    <td>{order.customer_name}</td>
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

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredOrders.length)} de {filteredOrders.length} resultados
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