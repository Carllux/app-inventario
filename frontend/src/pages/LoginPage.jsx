import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';

function LoginPage() { 
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/home'); // Navega após o sucesso
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    // Contêiner principal para centralizar tudo na página
    <div className="login-page-container">
      
      {/* Espaço reservado para um futuro banner ou logo */}
      <div className="login-banner">
        {/* Você pode colocar um <img> ou um <h1> aqui no futuro */}
      </div>

      {/* O "cartão" que conterá o formulário */}
      <div className="login-card">
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
            />
          </div>
          
          <button type="submit" className="login-button">Entrar</button>

        </form>
      </div>
    </div>
  );
}

export default LoginPage;