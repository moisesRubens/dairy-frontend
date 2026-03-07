import { authService } from './AuthService';
import type { 
  Product, 
  RetiradaResponse, 
  ProductWithUnit,
  RetiradaPorPonto,
  RetirarProdutosResponse 
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


export async function getProducts(): Promise<ProductWithUnit[]> {
  try {
    console.log('🔍 Chamando getProducts...');
    const token = authService.getToken();
    const url = `${API_URL}/produto/`;
    
    console.log('📡 URL:', url);
    console.log('🔑 Token:', token ? 'presente' : 'ausente');
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        "Content-Type": "application/json" 
      }
    });
    
    console.log('📊 Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resposta de erro:', errorText);
      return [];
    }
    
    const data = await response.json();
    console.log('📦 Dados recebidos (produtos):', data);
    
    // A API retorna { products: [...] }
    const products = data.products || [];
    console.log('📋 Produtos encontrados:', products.length);
    
    return products.map(calculateProductUnit);
    
  } catch (error) {
    console.error('❌ Erro em getProducts:', error);
    return [];
  }
}


// productService.ts - CORRIGIDO!
// Adicione no productService.ts, na função getRetiradasPorPontoVenda:
export async function getRetiradasPorPontoVenda(): Promise<RetiradaResponse[]> {
  try {
    console.log('🔍 Buscando retiradas do ponto de venda logado');
    
    const token = authService.getToken();
    console.log('🔑 Token usado:', token ? `${token.substring(0, 20)}...` : 'NULO');
    
    if (!token) {
      console.error('❌ Token não encontrado!');
      return [];
    }
    
    const url = `${API_URL}/produto/retiradas`;
    console.log('📡 URL:', url);
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        "Content-Type": "application/json" 
      }
    });
    
    console.log('📊 Status da resposta:', response.status);
    
    if (response.status === 401) {
      console.error('❌ Token inválido ou expirado');
      // Redirecionar para login?
      return [];
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na resposta:', errorText);
      return [];
    }
    
    const data = await response.json();
    console.log('📦 Dados recebidos da API:', data);
    
    return data.retiradas || [];
    
  } catch (error) {
    console.error('❌ Erro ao buscar retiradas:', error);
    return [];
  }
}

// ✅ NOVO: POST /produto/retirar - Retirar produtos do estoque
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
    console.log('📦 Resultado da retirada:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao retirar produtos:', error);
    throw error;
  }
}

// GET /produto/{id} - Buscar produto por ID com unidade calculada
export async function getProductById(id: number): Promise<ProductWithUnit> {
  const data = await request<Product>(`/${id}`);
  return calculateProductUnit(data);
}

// POST /produto/cadastrar - Criar novo produto
export async function createProduct(product: Omit<Product, 'id'>): Promise<ProductWithUnit> {
  const data = await request<Product>("/cadastrar", {
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