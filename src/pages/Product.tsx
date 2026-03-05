import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import type { ProductWithUnit } from "../types/Product";
import { getProducts } from "../services/productService";
import { authService } from '../services/AuthService';
import React from "react";
import { 
  Package, 
  ShoppingBag, 
  TrendingUp,
  Plus,
  ArrowLeft
} from 'lucide-react';
import '../styles/Product.css';

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(authService.getUser());
  const navigate = useNavigate();

  useEffect(() => {
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
      // Agora já vem com a unidade calculada!
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

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <div className="loading">Carregando produtos...</div>;
  }

  return (
    <div className="products-container">
      <header className="products-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={handleGoBack} className="back-button" title="Voltar">
              <ArrowLeft size={20} />
              <span>Voltar</span>
            </button>
            <h1>LATICÍNIOS BOA ESPERANÇA</h1>
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <button onClick={handleLogout} className="logout-button">
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="stats-container">
        <div className="stat-card">
          <Package className="stat-icon" />
          <div>
            <span className="stat-label">Total Produtos</span>
            <span className="stat-value">{products.length}</span>
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

      <main className="products-main">
        {products.length > 0 ? (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <div className="product-unit-badge">
                    <span className="unit-icon">{product.unitIcon}</span>
                    <span className="unit-value">{product.unitLabel}</span>
                  </div>
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  
                  <div className="product-price-section">
                    <p className="product-price">
                      R$ {product.price.toFixed(2)}
                    </p>
                    <button className="product-action" title="Adicionar ao carrinho">
                      <ShoppingBag size={20} />
                    </button>
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
              <Plus size={20} />
              <span>Adicionar Produto</span>
            </button>
          </div>
        )}

        {products.length > 0 && (
          <div className="pagination">
            <p className="pagination-info">
              Mostrando <span className="font-medium">1</span> a{' '}
              <span className="font-medium">{Math.min(8, products.length)}</span> de{' '}
              <span className="font-medium">{products.length}</span> produtos
            </p>
            <div className="pagination-controls">
              <button className="pagination-button" disabled>Anterior</button>
              <button className="pagination-button active">1</button>
              <button className="pagination-button">2</button>
              <button className="pagination-button">3</button>
              <button className="pagination-button">Próxima</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}