import type { Product } from "../types/Product";
// Função para pegar a URL base do .env
const API_URL = import.meta.env.VITE_API_URL as string;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;

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


export function getProducts(): Promise<Product[]> {
  return request<Product[]>("/products");
}