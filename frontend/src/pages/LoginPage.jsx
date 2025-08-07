import { useState } from 'react';
import { login } from '../services/auth';

// Recebemos a prop 'onLogin'
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      // AVISAMOS AO COMPONENTE PAI QUE O LOGIN FOI UM SUCESSO!
      onLogin(); 
    } catch (err) {
      setError(err.message); // Exibe o erro na tela
    }
  };

  return (
    <div className="login-form">
      <h2>Login</h2>
      {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        {/* ... seu formulário continua o mesmo ... */}
        <div>
          <label>Usuário:</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Senha:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default Login;