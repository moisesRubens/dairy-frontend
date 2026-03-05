import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import type { Product } from "../types/Product";
import { getProducts } from "../services/productService";
import { authService } from '../services/AuthService';
import React from "react";
import { 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  DollarSign,
  Star,
  Truck,
  Clock,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import '../styles/Product.css';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(authService.getUser());
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se usuário está logado
    const token = authService.getToken();
    if (!user || !token) {
      navigate('/login');
      return;
    }

    loadProducts();
  }, [navigate, user]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const totalValue = products.reduce((acc, p) => acc + p.price, 0);

  if (loading) {
    return <div className="loading">Carregando produtos...</div>;
  }

  return (
    <div className="products-container">
      {/* Header */}
      <header className="products-header">
        <div className="header-content">
          <div className="header-left">
            <ShoppingBag className="header-icon" />
            <div>
              <h1 className="page-title">Produtos</h1>
              <p className="header-subtitle">Gerencie seu catálogo de produtos</p>
            </div>
          </div>
          
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <button onClick={handleLogout} className="logout-button">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <Package className="stat-icon" />
          <div>
            <span className="stat-label">Total Produtos</span>
            <span className="stat-value">{products.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <DollarSign className="stat-icon" />
          <div>
            <span className="stat-label">Valor Total</span>
            <span className="stat-value">R$ {totalValue.toFixed(2)}</span>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp className="stat-icon" />
          <div>
            <span className="stat-label">Mais Vendido</span>
            <span className="stat-value">Leite</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="products-main">
        {/* Filters Bar */}
        <div className="filters-bar">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="search-input"
            />
          </div>
          
          <div className="filters-actions">
            <select className="filter-select">
              <option>Todos os produtos</option>
              <option>Mais vendidos</option>
              <option>Em promoção</option>
            </select>
            
            <button className="btn-primary">
              <Plus className="w-5 h-5" />
              <span>Adicionar Produto</span>
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="products-grid">
            {products.map((product, index) => (
              <div key={product.id} className="product-card">
                {/* Product Image Placeholder */}
                <div className="product-image">
                  {index === 0 && (
                    <div className="product-badge">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Destaque
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="product-info">
                  <div className="product-header">
                    <h3 className="product-name">{product.name}</h3>
                    <span className="stock-badge">Em estoque</span>
                  </div>

                  <div className="product-price-section">
                    <div>
                      <p className="product-price">
                        R$ {product.price.toFixed(2)}
                      </p>
                      <p className="product-installment">
                        ou 3x de R$ {(product.price / 3).toFixed(2)}
                      </p>
                    </div>
                    
                    <button className="product-action">
                      <ShoppingBag className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Additional Info */}
                  <div className="product-meta">
                    <div className="meta-item">
                      <Truck className="meta-icon" />
                      <span>Frete grátis</span>
                    </div>
                    <div className="meta-item">
                      <Clock className="meta-icon" />
                      <span>Entrega 24h</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Package className="empty-icon" />
            <h3 className="empty-title">Nenhum produto encontrado</h3>
            <p className="empty-text">Comece adicionando seu primeiro produto</p>
            <button className="btn-primary">
              <Plus className="w-5 h-5" />
              Adicionar Produto
            </button>
          </div>
        )}

        {/* Pagination */}
        {products.length > 0 && (
          <div className="pagination">
            <p className="pagination-info">
              Mostrando <span className="font-medium">1</span> a{' '}
              <span className="font-medium">{Math.min(8, products.length)}</span> de{' '}
              <span className="font-medium">{products.length}</span> produtos
            </p>
            <div className="pagination-controls">
              <button className="pagination-button" disabled>
                Anterior
              </button>
              <button className="pagination-button active">1</button>
              <button className="pagination-button">2</button>
              <button className="pagination-button">3</button>
              <button className="pagination-button">
                Próxima
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}