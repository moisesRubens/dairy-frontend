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

export async function getProducts(forceRefresh: boolean = false): Promise<ProductWithUnit[]> {
  try {
    console.log('🔍 Chamando getProducts...');
    const token = authService.getToken();
    
    // SEMPRE ADICIONA TIMESTAMP PARA EVITAR CACHE
    const timestamp = new Date().getTime();
    let url = `${API_URL}/produto/`;
    
    if (forceRefresh) {
      url += `?_=${timestamp}`;
    }
    
    console.log('📤 URL:', url);
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        "Content-Type": "application/json",
        'Cache-Control': forceRefresh ? 'no-cache, no-store, must-revalidate' : 'default',
        'Pragma': forceRefresh ? 'no-cache' : '',
        'Expires': forceRefresh ? '0' : ''
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Erro HTTP: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    console.log('📦 Dados recebidos da API:', data);
    
    const products = data.products || [];
    return products.map(calculateProductUnit);
    
  } catch (error) {
    console.error('❌ Erro em getProducts:', error);
    return [];
  }
}

export async function getRetiradasPorPontoVenda(salePointId?: number, forceRefresh: boolean = false): Promise<RetiradaResponse[]> {
  try {
    console.log(`\n=== getRetiradasPorPontoVenda(${salePointId || 'usuário logado'}) ===`);
    
    const token = authService.getToken();
    
    if (!token) {
      console.error('❌ Token não encontrado!');
      return [];
    }
    
    // ADICIONA TIMESTAMP PARA EVITAR CACHE
    const timestamp = new Date().getTime();
    
    let url = `${API_URL}/auth/${salePointId}/outbounds`;
    const params = new URLSearchParams();
    
    if (salePointId) {
      params.append('sale_point_id', salePointId.toString());
    }
    
    // ADICIONA FILTRO DE DATA
    const dataHoje = new Date().toISOString().split('T')[0];
    params.append('data', dataHoje);
    console.log(`📅 Filtrando retiradas para data: ${dataHoje}`);
    
    // ADICIONA PARÂMETRO ANTI-CACHE SE FORCE_REFRESH FOR TRUE
    if (forceRefresh) {
      params.append('_', timestamp.toString());
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    console.log('📤 URL:', url);
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': forceRefresh ? 'no-cache, no-store, must-revalidate' : 'default',
        'Pragma': forceRefresh ? 'no-cache' : '',
        'Expires': forceRefresh ? '0' : ''
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Erro ${response.status} ao buscar retiradas`);
      return [];
    }
    
    const data = await response.json();
    console.log('📦 Dados brutos da API:', data);
    
    if (data && data.retiradas && Array.isArray(data.retiradas)) {
      const retiradas = data.retiradas;
      console.log(`📦 Encontradas ${retiradas.length} retiradas`);
      
      return retiradas.map((item: any) => {
        const quantidadeDisponivel = (item.taken_quantity || 0) - (item.sold_quantity || 0);
        
        return {
          id: item.id,
          product_id: item.product_id,
          name: item.name || item.nome || '',
          price: 0,
          quantidade_retirada: quantidadeDisponivel,
          remaining_quantity: item.remaining_quantity || quantidadeDisponivel,
          unidade_retirada: item.unidade || 'amount',
          data_retirada: item.data || new Date().toISOString(),
          observacao: item.observacao || null,
          sale_point_id: item.sale_point_id || salePointId || 0,
          status: item.status || false
        };
      });
    }
    
    console.log('⚠️ Formato de resposta inesperado:', data);
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

export async function subtrairEstoque(
  items: ItemRetiradaDTO[]
): Promise<SubtrairEstoqueResponse> {
  try {
    console.log('📤 Chamando /subtrair-estoque com items:', items);
    
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

export async function retornarTodasRetiradasAoEstoque(salePointId?: number): Promise<any> {
  try {
    console.log(`📤 Chamando /produto/retornar-ao-estoque para ponto: ${salePointId || 'usuário logado'}`);
    
    const token = authService.getToken();
    
    let url = `${API_URL}/produto/retornar-ao-estoque`;
    if (salePointId) {
      url += `?sale_point_id=${salePointId}`;
    }
    
    console.log('📤 URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resposta de erro:', response.status, errorText);
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Resposta de retornar-ao-estoque:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao retornar produtos ao estoque:', error);
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