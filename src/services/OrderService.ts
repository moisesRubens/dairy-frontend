import type { Order, ItemOrder } from '../types/Order';

// URL da sua API (ajuste conforme sua configuração)
const API_URL = 'http://localhost:8000'; // ou a URL da sua API

export const orderService = {
  // GET /orders - Buscar todos os pedidos
  async getAll(): Promise<Order[]> {
    const response = await fetch(`${API_URL}/orders`);
    if (!response.ok) throw new Error('Erro ao buscar pedidos');
    return response.json();
  },

  // GET /orders/{id} - Buscar um pedido
  async getById(id: number): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/${id}`);
    if (!response.ok) throw new Error('Pedido não encontrado');
    return response.json();
  },

  // POST /orders - Criar novo pedido
  async create(data: Omit<Order, 'id' | 'order_date'>): Promise<Order> {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao criar pedido');
    return response.json();
  },

  // PUT /orders/{id} - Atualizar pedido
  async update(id: number, data: Partial<Order>): Promise<Order> {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao atualizar pedido');
    return response.json();
  },

  // DELETE /orders/{id} - Deletar pedido
  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao deletar pedido');
  }
};