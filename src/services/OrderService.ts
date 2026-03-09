// orderService.ts - CORRIGIDO
import type { Order } from '../types/Order';
import { authService } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL as string;

export const orderService = {
  /**
   * Busca todos os pedidos com filtros opcionais
   * @param filters Filtros para a busca (date, description, status)
   * @returns Lista de pedidos
   */
  async getAll(filters?: {
    date?: string;
    description?: string;
    status?: string;
  }): Promise<{ orders: Order[] }> {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Token não encontrado');
      }
      let url = `${API_URL}/pedidos/`;
    
      if(filters) {
        const params = new URLSearchParams();
        if (filters.date) params.append('date', filters.date);
        if (filters.description) params.append('description', filters.description);
        if (filters.status !== undefined) params.append('status', String(filters.status));
        
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }
      
      console.log('📤 GET - Requisição para:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Erro ao buscar pedidos: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📦 Dados recebidos:', data);
      
      return data;
      
    } catch (error) {
      console.error('❌ Erro em orderService.getAll:', error);
      return { orders: [] };
    }
  },

  /**
   * Busca um pedido específico por ID
   * @param id ID do pedido
   * @returns Pedido encontrado
   */
  async getOrdersBySalePoint(salePointId: number, date?: string): Promise<Order[]> {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Token não encontrado');
      }
      
      // Monta a URL com query parameters
      let url = `${API_URL}/auth/pedidos?sale_point_id=${salePointId}`;
      if (date) {
        url += `&date=${date}`;
      }
      
      console.log(`🔍 Buscando pedidos do ponto ${salePointId}${date ? ` na data ${date}` : ''}`);
      console.log('📤 URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar pedidos: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Encontrados ${data.length} pedidos`, data);
      
      return data; // A API retorna um array diretamente
      
    } catch (error) {
      console.error('❌ Erro em orderService.getOrdersBySalePoint:', error);
      throw error;
    }
  },

  /**
   * Deleta um pedido específico
   * @param id ID do pedido a ser deletado
   */
  async delete(id: number): Promise<void> {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Token não encontrado');
      }
      
      const response = await fetch(`${API_URL}/pedidos/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao deletar pedido: ${response.status} - ${errorText}`);
      }
      
      console.log(`✅ Pedido ${id} deletado com sucesso`);
      
    } catch (error) {
      console.error('❌ Erro em orderService.delete:', error);
      throw error;
    }
  },
  async create(data: {
    description?: string;
    items: Array<{
      product_id: number;
      amount?: number | null;
      kg?: number | null;
      liters?: number | null;
    }>;
  }): Promise<{ order: Order }> {
    try {
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('Token não encontrado');
      }
      
      console.log('📤 OrderService.create - Dados recebidos:', JSON.stringify(data, null, 2));
      console.log('📤 OrderService.create - Token:', token ? 'presente' : 'ausente');
      
      // URL CORRETA: /pedidos/cadastrar (como no backend)
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
      
    } catch (error) {
      console.error('❌ Erro em orderService.create:', error);
      throw error;
    }
  }
};