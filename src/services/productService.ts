import { authService } from './AuthService';
import type { Product, ProductApiResponse, ProductWithUnit } from "../types/Product";

const API_URL = import.meta.env.VITE_API_URL as string;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}/produto${endpoint}`;
  
  const token = authService.getToken();

  const response = await fetch(url, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      "Content-Type": "application/json" 
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// Função para calcular a unidade do produto
const calculateProductUnit = (product: Product): ProductWithUnit => {
  const amount = product.amount ?? 0;
  const kg = product.kg ?? 0;
  const liters = product.liters ?? 0;
  
  if (amount > 0) {
    return {
      ...product,
      amount,
      kg,
      liters,
      unitValue: amount,
      unitType: 'un',
      unitIcon: '📦',
      unitLabel: `${amount} unidade${amount > 1 ? 's' : ''}`
    };
  } else if (liters > 0) {
    return {
      ...product,
      amount,
      kg,
      liters,
      unitValue: liters,
      unitType: 'L',
      unitIcon: '💧',
      unitLabel: `${liters} litro${liters > 1 ? 's' : ''}`
    };
  } else if (kg > 0) {
    return {
      ...product,
      amount,
      kg,
      liters,
      unitValue: kg,
      unitType: 'kg',
      unitIcon: '⚖️',
      unitLabel: `${kg} quilo${kg > 1 ? 's' : ''}`
    };
  }
  
  return {
    ...product,
    amount,
    kg,
    liters,
    unitValue: 0,
    unitType: '',
    unitIcon: '📦',
    unitLabel: 'Sem unidade'
  };
};

// GET /produto - Listar todos os produtos com unidade calculada
export async function getProducts(): Promise<ProductWithUnit[]> {
  try {
    const data = await request<ProductApiResponse>("/");
    console.log('📦 Resposta da API:', data);
    
    // 🔥 CORREÇÃO IMPORTANTE: data já é { products: [...] }
    const products = data.products || [];
    console.log('📋 Produtos:', products);
    
    return products.map(calculateProductUnit);
  } catch (error) {
    console.error('❌ Erro em getProducts:', error);
    return [];
  }
}

// GET /produto/{id} - Buscar produto por ID com unidade calculada
export async function getProductById(id: number): Promise<ProductWithUnit> {
  const data = await request<Product>(`/${id}`);
  return calculateProductUnit(data);
}

// POST /produto - Criar novo produto
export async function createProduct(product: Omit<Product, 'id'>): Promise<ProductWithUnit> {
  const data = await request<Product>("/", {
    method: 'POST',
    body: JSON.stringify(product),
  });
  return calculateProductUnit(data);
}

// PUT /produto/{id} - Atualizar produto
export async function updateProduct(id: number, product: Partial<Product>): Promise<ProductWithUnit> {
  const data = await request<Product>(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
  return calculateProductUnit(data);
}

// DELETE /produto/{id} - Deletar produto
export async function deleteProduct(id: number): Promise<void> {
  await request<void>(`/${id}`, {
    method: 'DELETE',
  });
}