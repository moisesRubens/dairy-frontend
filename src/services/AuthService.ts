import { jwtDecode } from 'jwt-decode';  // ✅ Importação correta
import type { SalePoint } from '../types/SalePoint';

const API_URL = 'http://localhost:8000';

interface TokenPayload {
  sub: string;
  exp: number;
}

export const authService = {
  // POST /auth/login - Fazer login
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao fazer login');
    }
    
    return response.json();
  },

  // 🔥 Decodificar token e extrair ID
  getUserFromToken(token: string): SalePoint | null {
    try {
      console.log('🔑 Token recebido:', token);
      
      // Decodifica o token
      const decoded = jwtDecode<TokenPayload>(token);
      console.log('🔓 Token decodificado:', decoded);
      
      // Extrai o ID do campo 'sub'
      const userId = parseInt(decoded.sub);
      console.log('🆔 ID extraído do token:', userId);
      
      if (isNaN(userId) || userId === 0) {
        console.error('❌ ID inválido');
        return null;
      }
      
      // Retorna o usuário com o ID correto
      return {
        id: userId,
        name: "Usuário", // O nome virá de outra requisição depois
        email: ""
      };
    } catch (error) {
      console.error('❌ Erro ao decodificar token:', error);
      return null;
    }
  },

  // 🔥 Salvar token e usuário
  saveToken(token: string): void {
    console.log('💾 Salvando token:', token);
    localStorage.setItem('token', token);
    
    // Extrai usuário do token
    const user = this.getUserFromToken(token);
    console.log('👤 Usuário extraído:', user);
    
    if (user) {
      this.saveUser(user);
      console.log('✅ Usuário salvo com ID:', user.id);
    } else {
      console.error('❌ Falha ao extrair usuário');
    }
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  saveUser(user: SalePoint): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser(): SalePoint | null {
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user);
    }
    return null;
  },

  async logoutApi(token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Erro ao fazer logout');
    }
    
    return response.json();
  },

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.logoutApi(token).catch(error => {
        console.error('Erro ao fazer logout na API:', error);
      });
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async getAllSalePoints() {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${API_URL}/auth/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao buscar pontos de venda');
    }

    return response.json();
  }
};