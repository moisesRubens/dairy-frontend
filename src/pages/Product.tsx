// src/pages/Product.tsx
import { useEffect, useState } from "react";
import type { Product } from "../types/Product";
import { getProducts } from "../services/productService";
import React from "react";
import { 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  DollarSign,
  Star,
  Truck,
  Clock
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts()
      .then(setProducts) // already an array
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Produtos</h1>
                <p className="text-blue-100 mt-1">Gerencie seu catálogo de produtos</p>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="flex space-x-4">
              <div className="bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                <p className="text-xs text-blue-200">Total Produtos</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                <p className="text-xs text-blue-200">Valor Total</p>
                <p className="text-2xl font-bold">
                  R${products.reduce((acc, p) => acc + p.price, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar produtos..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Todos os produtos</option>
              <option>Mais vendidos</option>
              <option>Em promoção</option>
            </select>
          </div>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Package className="w-5 h-5" />
            <span>Adicionar Produto</span>
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p, index) => (
            <div
              key={p.id}
              className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
            >
              {/* Product Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                {index === 0 && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Destaque
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {p.name}
                  </h3>
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                    Em estoque
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">
                      R${p.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      ou 3x de R${(p.price / 3).toFixed(2)}
                    </p>
                  </div>
                  
                  <button className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition-colors">
                    <ShoppingBag className="w-5 h-5" />
                  </button>
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Truck className="w-3 h-3 mr-1" />
                    <span>Frete grátis</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Entrega 24h</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500">Comece adicionando seu primeiro produto</p>
          </div>
        )}

        {/* Pagination */}
        {products.length > 0 && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500">
              Mostrando <span className="font-medium">1</span> a{' '}
              <span className="font-medium">{Math.min(8, products.length)}</span> de{' '}
              <span className="font-medium">{products.length}</span> produtos
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                Anterior
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                1
              </button>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                2
              </button>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                3
              </button>
              <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}