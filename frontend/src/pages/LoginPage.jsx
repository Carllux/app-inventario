import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
// 1. Importe os estilos do módulo
import styles from './LoginPage.module.css';

function LoginPage() { 
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || "/inventory";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // 2. Aplique as classes do módulo
    <div className={styles.pageContainer}>
      <div className={styles.banner}>
        {/* Futuro banner aqui */}
      </div>

      {/* Note que podemos combinar classes globais (.card) com classes do módulo */}
      <div className={`card ${styles.loginCard}`}>
        <h2>Login</h2>
        {error && <p className={styles.loginError}>{error}</p>}
        
        <form onSubmit={handleSubmit}>
          {/* As classes globais .form-group e .button continuam funcionando */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">Usuário</label>
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
            <label className="form-label" htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <button type="submit" className="button button-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;