// productService.ts
import { authService } from './AuthService';
import type { 
  Product, 
  RetiradaResponse, 
  ProductWithUnit,
  RetirarProdutosResponse,
  SubtrairEstoqueResponse,
  ItemRetiradaDTO
} from "../types/Product";

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
      unitType: 'amount',
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
      unitType: 'liters',
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

export async function getProducts(): Promise<ProductWithUnit[]> {
  try {
    console.log('🔍 Chamando getProducts...');
    const token = authService.getToken();
    const url = `${API_URL}/produto/`;
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        "Content-Type": "application/json" 
      }
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    // A API retorna { products: [...] }
    const products = data.products || [];
    return products.map(calculateProductUnit);
    
  } catch (error) {
    console.error('❌ Erro em getProducts:', error);
    return [];
  }
}

export async function getRetiradasPorPontoVenda(): Promise<RetiradaResponse[]> {
  try {
    console.log('🔍 Buscando retiradas do ponto de venda logado');
    
    const token = authService.getToken();
    
    if (!token) {
      console.error('❌ Token não encontrado!');
      return [];
    }
    
    const url = `${API_URL}/produto/retiradas`;
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        "Content-Type": "application/json" 
      }
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    console.log('📦 Dados recebidos da API:', data);
    
    // A API retorna um array direto de retiradas
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.nome || item.name || '',
        price: 0, // Será preenchido com o preço do produto
        quantidade_retirada: item.quantidade || 0,
        unidade_retirada: item.unidade || 'amount',
        data_retirada: item.data_retirada || item.data || new Date().toISOString(),
        observacao: item.observacao || null,
        sale_point_id: item.sale_point_id || 0
      }));
    }
    
    // Se a API retorna { retiradas: [...] }
    if (data.retiradas && Array.isArray(data.retiradas)) {
      return data.retiradas.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.nome || item.name || '',
        price: 0,
        quantidade_retirada: item.quantidade || 0,
        unidade_retirada: item.unidade || 'amount',
        data_retirada: item.data_retirada || item.data || new Date().toISOString(),
        observacao: item.observacao || null,
        sale_point_id: item.sale_point_id || 0
      }));
    }
    
    return [];
    
  } catch (error) {
    console.error('❌ Erro ao buscar retiradas:', error);
    return [];
  }
}

export async function retirarProdutos(
  produtos: Array<{ product_id: number; quantidade: number; unidade: string }>,
  observacao?: string
): Promise<RetirarProdutosResponse> {
  try {
    const data = await request<RetirarProdutosResponse>("/retirar", {
      method: 'POST',
      body: JSON.stringify({
        produtos,
        observacao
      }),
    });
    return data;
  } catch (error) {
    console.error('❌ Erro ao retirar produtos:', error);
    throw error;
  }
}

/**
 * Subtrai (ou adiciona) quantidade do estoque de produtos
 * @param items Array de itens com product_id, quantidade (positivo para subtrair, negativo para adicionar) e unidade
 * @returns Resposta da API
 */
export async function subtrairEstoque(
  items: ItemRetiradaDTO[]
): Promise<SubtrairEstoqueResponse> {
  try {
    console.log('📤 Chamando /subtrair-estoque com items:', items);
    
    // A API espera um ARRAY DIRETAMENTE (List[ItemRetiradaDTO])
    const data = await request<SubtrairEstoqueResponse>("/subtrair-estoque", {
      method: 'POST',
      body: JSON.stringify(items),
    });
    
    console.log('✅ Resposta de /subtrair-estoque:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao subtrair estoque:', error);
    throw error;
  }
}

export async function getProductById(id: number): Promise<ProductWithUnit> {
  const data = await request<Product>(`/${id}`);
  return calculateProductUnit(data);
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<ProductWithUnit> {
  const data = await request<Product>("/cadastrar", {
    method: 'POST',
    body: JSON.stringify(product),
  });
  return calculateProductUnit(data);
}

export async function updateProduct(id: number, product: Partial<Product>): Promise<ProductWithUnit> {
  const data = await request<Product>(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
  return calculateProductUnit(data);
}

export async function deleteProduct(id: number): Promise<void> {
  await request<void>(`/${id}`, {
    method: 'DELETE',
  });
}