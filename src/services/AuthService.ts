import type { SalePoint } from '../types/SalePoint';

const API_URL = 'http://localhost:8000'; // Ajuste para sua URL

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

  // POST /auth/cadastrar - Criar novo usuário
  async register(name: string, email: string, password: string): Promise<{ "sale point": SalePoint }> {
    const params = new URLSearchParams();
    params.append('name', name);
    params.append('password', password);
    if (email) params.append('email', email);

    const response = await fetch(`${API_URL}/auth/cadastrar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao cadastrar');
    }
    
    return response.json();
  },

  // GET /auth/ - Listar todos
  async getAll(token: string): Promise<SalePoint[]> {
    const response = await fetch(`${API_URL}/auth/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar usuários');
    }
    
    return response.json();
  },

  // GET /auth/{id} - Buscar por ID
  async getById(id: number, token: string): Promise<{ sale_points: SalePoint }> {
    const response = await fetch(`${API_URL}/auth/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Usuário não encontrado');
    }
    
    return response.json();
  },

  // POST /auth/logout - Fazer logout na API
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

  // DELETE /auth/{id} - Deletar usuário
  async delete(id: number, token: string): Promise<{ "sale point deleted": SalePoint }> {
    const response = await fetch(`${API_URL}/auth/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Erro ao deletar usuário');
    }
    
    return response.json();
  },

  // Utilitários para localStorage
  saveToken(token: string): void {
    localStorage.setItem('token', token);
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  saveUser(user: SalePoint): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser(): SalePoint | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Método de logout completo (limpa localStorage e chama API)
  logout(): void {
    const token = this.getToken();
    if (token) {
      // Tenta fazer logout na API (mas não impede o logout local)
      this.logoutApi(token).catch(error => {
        console.error('Erro ao fazer logout na API:', error);
      });
    }
    // Sempre limpa o localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};