import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';
import '../styles/Login.css';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const token = authService.getToken();
    const user = authService.getUser();
    
    if (token && user && user.id > 0) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usuario || !senha) {
      setErro('Preencha todos os campos!');
      return;
    }

    setLoading(true);
    setErro('');
    
    try {
      // 1. Faz login
      const response = await authService.login(usuario, senha);
      console.log('✅ Token recebido:', response.access_token);
      
      // 2. DECODIFICA O TOKEN MANUALMENTE (MAIS CONFIÁVEL)
      const tokenParts = response.access_token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('🔓 Payload do token:', payload);
      
      // 3. Extrai o ID (deve ser "1" para o usuário "a")
      const userId = parseInt(payload.sub);
      console.log('🆔 ID do usuário:', userId);
      
      // 4. SALVA TUDO MANUALMENTE
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify({
        id: userId,
        name: usuario, // Salva o nome do usuário
        email: usuario
      }));
      
      console.log('✅ Login realizado com ID:', userId);
      
      // 5. Redireciona
      navigate('/');
      
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      setErro(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-left">
          <div className="login-brand">
            <h1>LATICÍNIOS BOA ESPERANÇA</h1>
            <p>Sistema de Gerenciamento</p>
          </div>
        </div>
        
        <div className="login-right">
          <div className="login-card">
            <h2 className="login-title">Entrar</h2>
            
            {erro && (
              <div className="error-message">
                {erro}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <label htmlFor="usuario">Usuário</label>
                <input
                  type="text"
                  id="usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Digite seu email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <label htmlFor="senha">Senha</label>
                <input
                  type="password"
                  id="senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="login-footer">
              <a href="#">Esqueceu a senha?</a>
              <a href="/cadastro">Criar conta</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;