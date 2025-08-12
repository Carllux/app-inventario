// frontend/src/pages/LoginPage.jsx

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// 1. Importamos o nosso novo hook 'useAuth'
import { useAuth } from '../context/AuthContext';

function LoginPage() { 
  const navigate = useNavigate();
  const location = useLocation();
  
  // 2. Usamos o hook para pegar a função 'login' do nosso contexto
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redireciona o usuário para a página que ele tentou acessar, ou para o inventário
  const from = location.state?.from?.pathname || "/inventory";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      // 3. Chamamos a função 'login' do contexto
      await login(username, password);
      navigate(from, { replace: true }); // Navega para a página de destino
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card card">
        <h2>Login</h2>
        {error && <p className="login-error">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuário:</label>
            <input 
              id="username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          
          {/* Usamos o estado 'isSubmitting' para desabilitar o botão durante o login */}
          <button type="submit" className="button button-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;