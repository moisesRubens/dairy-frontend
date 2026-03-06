import type { Order } from '../types/Order';
import { authService } from './AuthService'; // 👈 IMPORTANTE: importar o authService

const API_URL = 'http://localhost:8000';

export const orderService = {
  // GET /pedidos - Buscar todos os pedidos
  async getAll(): Promise<{ orders: Order[] }> {
    const token = authService.getToken(); // 👈 PEGAR O TOKEN
    
    const response = await fetch(`${API_URL}/pedidos`, {
      headers: {
        'Authorization': `Bearer ${token}`, // 👈 ENVIAR O TOKEN
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Erro ao buscar pedidos');
    
    const data = await response.json();
    console.log('📦 Dados brutos da API:', data);
    
    return data;
  },

  // GET /pedidos/{id} - Buscar um pedido
  async getById(id: number): Promise<{ order: Order }> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/pedidos/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Pedido não encontrado');
    
    const data = await response.json();
    return data;
  },

  // POST /pedidos - Criar novo pedido
  async create(data: Omit<Order, 'id' | 'order_date'>): Promise<{ order: Order }> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error('Erro ao criar pedido');
    
    const result = await response.json();
    return result;
  },

  // PUT /pedidos/{id} - Atualizar pedido
  async update(id: number, data: Partial<Order>): Promise<{ order: Order }> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/pedidos/${id}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) throw new Error('Erro ao atualizar pedido');
    
    const result = await response.json();
    return result;
  },

  // DELETE /pedidos/{id} - Deletar pedido
  async delete(id: number): Promise<void> {
    const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/pedidos/${id}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
    });
    
    if (!response.ok) throw new Error('Erro ao deletar pedido');
  }
};