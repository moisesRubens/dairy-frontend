// ProductsPage.tsx - Corrigido com a função de reserva usando o endpoint /retirar
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import type { ProductWithUnit } from "../types/Product";
import { authService } from '../services/AuthService';
import { retirarProdutos } from '../services/productService'; // Importando a função
import React from "react";
import { useReserva } from '../contexts/ReservaContext';
import { 
  Package, 
  ShoppingBag, 
  TrendingUp,
  Plus,
  ArrowLeft,
  CalendarClock
} from 'lucide-react';
import '../styles/Product.css';

export default function ProductsPage() {
  const { notificarNovaReserva } = useReserva();
  const [products, setProducts] = useState<ProductWithUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(authService.getUser());
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithUnit | null>(null);
  const [reserveQuantity, setReserveQuantity] = useState('');
  const [reserveObservation, setReserveObservation] = useState(''); // Campo de observação
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = authService.getToken();
    const currentUser = authService.getUser();
    
    if (!currentUser || !token) {
      navigate('/login');
      return;
    }

    setUser(currentUser);
    carregarProdutos();
  }, [navigate]);

  const carregarProdutos = async () => {
    setLoading(true);
    try {
      const token = authService.getToken();
      
      const response = await fetch('http://localhost:8000/produto/', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });
      
      const data = await response.json();
      
      // Calcula a unidade para cada produto
      const produtosComUnidade = (data.products || []).map((product: any) => {
        const amount = product.amount ?? 0;
        const kg = product.kg ?? 0;
        const liters = product.liters ?? 0;
        
        let unitIcon = '📦';
        let unitLabel = 'Sem unidade';
        
        if (amount > 0) {
          unitIcon = '📦';
          unitLabel = `${amount} unidade${amount > 1 ? 's' : ''}`;
        } else if (liters > 0) {
          unitIcon = '💧';
          unitLabel = `${liters} litro${liters > 1 ? 's' : ''}`;
        } else if (kg > 0) {
          unitIcon = '⚖️';
          unitLabel = `${kg} quilo${kg > 1 ? 's' : ''}`;
        }
        
        return {
          ...product,
          amount,
          kg,
          liters,
          unitIcon,
          unitLabel
        };
      });
      
      setProducts(produtosComUnidade);
      
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

  const handleReserveClick = (product: ProductWithUnit) => {
    setSelectedProduct(product);
    setReserveQuantity('');
    setReserveObservation('');
    setError('');
    setSuccess('');
    setShowReserveModal(true);
  };

  const getUnitType = (product: ProductWithUnit): string => {
    if (product.amount && product.amount > 0) return 'unidades';
    if (product.kg && product.kg > 0) return 'kg';
    if (product.liters && product.liters > 0) return 'litros';
    return 'unidades';
  };

  const getUnitSymbol = (product: ProductWithUnit): string => {
    if (product.amount && product.amount > 0) return 'un';
    if (product.kg && product.kg > 0) return 'kg';
    if (product.liters && product.liters > 0) return 'L';
    return 'un';
  };

  const getAvailableStock = (product: ProductWithUnit): number => {
    if (product.amount && product.amount > 0) return product.amount;
    if (product.kg && product.kg > 0) return product.kg;
    if (product.liters && product.liters > 0) return product.liters;
    return 0;
  };

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !reserveQuantity) {
      setError('Preencha a quantidade');
      return;
    }

    const quantity = parseFloat(reserveQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError('Quantidade inválida');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      let unidade = 'amount';
      if (selectedProduct.kg && selectedProduct.kg > 0) {
        unidade = 'kg';
      } else if (selectedProduct.liters && selectedProduct.liters > 0) {
        unidade = 'liters';
      }

      const produtos = [{
        product_id: selectedProduct.id,
        quantidade: quantity,
        unidade: unidade
      }];

      const observacao = reserveObservation.trim() || `Reserva de ${selectedProduct.name}`;

      console.log('📤 Enviando requisição para /retirar:', {
        produtos,
        observacao
      });

      const response = await retirarProdutos(produtos, observacao);
      
      console.log('✅ Resposta do servidor:', response);

      if (response.detalhes?.total_erros > 0) {
        const erroMsg = response.detalhes.erros[0]?.erro || 'Erro ao reservar produto';
        setError(erroMsg);
      } else {
        setSuccess(`✅ Produto reservado com sucesso!`);
        
        // 🔥 NOTIFICA A HOME QUE UMA NOVA RESERVA FOI FEITA
        notificarNovaReserva();
        
        // Atualiza a lista de produtos
        setTimeout(() => {
          carregarProdutos();
        }, 1500);
      }

      if (response.detalhes?.total_erros === 0) {
        setTimeout(() => {
          setShowReserveModal(false);
          setSelectedProduct(null);
          setReserveQuantity('');
          setReserveObservation('');
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao reservar produto:', error);
      setError(error.message || 'Erro ao reservar produto. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
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
            {products.map((product) => {
              const availableStock = getAvailableStock(product);
              const isOutOfStock = availableStock <= 0;
              
              return (
                <div key={product.id} className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
                  <div className="product-image">
                    <div className="product-unit-badge">
                      <span className="unit-icon">{product.unitIcon}</span>
                      <span className="unit-value">{product.unitLabel}</span>
                    </div>
                    {isOutOfStock && (
                      <div className="out-of-stock-badge">ESGOTADO</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    
                    <div className="product-price-section">
                      <p className="product-price">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </p>
                      <button 
                        className="product-action" 
                        title="Adicionar ao carrinho"
                        disabled={isOutOfStock}
                      >
                        <ShoppingBag size={20} />
                      </button>
                    </div>

                    {/* Botão Reservar */}
                    <button 
                      className="product-reserve-btn"
                      onClick={() => handleReserveClick(product)}
                      disabled={isOutOfStock || submitting}
                      title={isOutOfStock ? "Produto esgotado" : "Reservar produto"}
                    >
                      <CalendarClock size={16} />
                      <span>Reservar</span>
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* Modal de Reserva */}
      {showReserveModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Reservar Produto</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="modal-product-info">
              <span className="modal-product-name">{selectedProduct.name}</span>
              <span className="modal-product-price">
                R$ {selectedProduct.price.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="stock-info">
              <span className="stock-label">Disponível em estoque:</span>
              <span className="stock-value">
                {getAvailableStock(selectedProduct)} {getUnitSymbol(selectedProduct)}
              </span>
            </div>

            <form onSubmit={handleReserveSubmit}>
              <div className="form-group">
                <label htmlFor="quantity" className="form-label">
                  Quantidade ({getUnitType(selectedProduct)})
                </label>
                <input
                  type="number"
                  id="quantity"
                  className="form-input"
                  value={reserveQuantity}
                  onChange={(e) => setReserveQuantity(e.target.value)}
                  placeholder={`Ex: 5 ${getUnitType(selectedProduct)}`}
                  min="0.01"
                  max={getAvailableStock(selectedProduct)}
                  step="0.01"
                  required
                  disabled={submitting}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="observation" className="form-label">
                  Observação (opcional)
                </label>
                <textarea
                  id="observation"
                  className="form-textarea"
                  value={reserveObservation}
                  onChange={(e) => setReserveObservation(e.target.value)}
                  placeholder="Ex: Reserva para o cliente X"
                  rows={3}
                  disabled={submitting}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="modal-btn modal-btn-secondary"
                  onClick={() => setShowReserveModal(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="modal-btn modal-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Processando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}