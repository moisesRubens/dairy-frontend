import type { Order, ItemOrder } from '../types/Order';

const API_URL = 'http://localhost:8000';

export const orderService = {
  // GET /pedidos - Buscar todos os pedidos
  async getAll(): Promise<{ orders: Order[] }> {  // 👈 Retorno corrigido
    const response = await fetch(`${API_URL}/pedidos`);
    if (!response.ok) throw new Error('Erro ao buscar pedidos');
    
    const data = await response.json();
    console.log('📦 Dados brutos da API:', data); // Para debug
    
    // A API retorna { orders: [...] }
    return data; // 👈 Retorna o objeto completo
  },

  // GET /pedidos/{id} - Buscar um pedido
  async getById(id: number): Promise<{ order: Order }> {  // 👈 Retorno corrigido
    const response = await fetch(`${API_URL}/pedidos/${id}`);
    if (!response.ok) throw new Error('Pedido não encontrado');
    
    const data = await response.json();
    console.log(`📦 Pedido ${id}:`, data);
    
    return data; // 👈 Retorna o objeto completo
  },

  // POST /pedidos - Criar novo pedido
  async create(data: Omit<Order, 'id' | 'order_date'>): Promise<{ order: Order }> {
    const response = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao criar pedido');
    
    const result = await response.json();
    return result; // 👈 Retorna o objeto completo
  },

  // PUT /pedidos/{id} - Atualizar pedido
  async update(id: number, data: Partial<Order>): Promise<{ order: Order }> {
    const response = await fetch(`${API_URL}/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao atualizar pedido');
    
    const result = await response.json();
    return result;
  },

  // DELETE /pedidos/{id} - Deletar pedido
  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/pedidos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao deletar pedido');
  }
};