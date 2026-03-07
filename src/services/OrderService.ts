import type { Order } from '../types/Order';
import { authService } from './AuthService';

const API_URL = 'http://localhost:8000';

export const orderService = {
  async getAll(filters?: {
    date?: string;
    description?: string;
    status?: string;
  }): Promise<{ orders: Order[] }> {
    const token = authService.getToken();
    let url = `${API_URL}/pedidos`;
    
    if (filters) {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.description) params.append('description', filters.description);
      if (filters.status !== undefined) params.append('status', filters.status);
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    console.log('📤 Requisição para:', url);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Erro ao buscar pedidos');
    const data = await response.json();
    console.log('📦 Dados recebidos:', data);
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

  // POST /pedidos/cadastrar - Criar novo pedido
  async create(data: any): Promise<{ order: Order }> {
    const token = authService.getToken();
    
    console.log('📤 OrderService.create - Dados recebidos:', data);
    console.log('📤 OrderService.create - Token:', token ? 'presente' : 'ausente');
    
    const response = await fetch(`${API_URL}/pedidos/cadastrar`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(data),
    });
    
    console.log('📥 OrderService.create - Status da resposta:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OrderService.create - Erro:', errorText);
      throw new Error(`Erro ao criar pedido: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ OrderService.create - Resposta:', result);
    return result;
  },

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