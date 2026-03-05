import type { Product, ProductApiResponse, ProductWithUnit } from "../types/Product";

const API_URL = import.meta.env.VITE_API_URL as string;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}/produto${endpoint}`;

  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
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
  if (product.amount > 0) {
    return {
      ...product,
      unitValue: product.amount,
      unitType: 'un',
      unitIcon: '📦',
      unitLabel: `${product.amount} unidade${product.amount > 1 ? 's' : ''}`
    };
  } else if (product.liters > 0) {
    return {
      ...product,
      unitValue: product.liters,
      unitType: 'L',
      unitIcon: '💧',
      unitLabel: `${product.liters} litro${product.liters > 1 ? 's' : ''}`
    };
  } else if (product.kg > 0) {
    return {
      ...product,
      unitValue: product.kg,
      unitType: 'kg',
      unitIcon: '⚖️',
      unitLabel: `${product.kg} quilo${product.kg > 1 ? 's' : ''}`
    };
  }
  
  return {
    ...product,
    unitValue: 0,
    unitType: '',
    unitIcon: '📦',
    unitLabel: 'Sem unidade'
  };
};

// GET /produto - Listar todos os produtos com unidade calculada
export async function getProducts(): Promise<ProductWithUnit[]> {
  const data = await request<ProductApiResponse>("/");
  const products = data.products || [];
  
  // Aplica o cálculo de unidade em cada produto
  return products.map(calculateProductUnit);
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