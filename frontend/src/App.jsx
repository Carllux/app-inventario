import { useState, useEffect } from 'react';
import axios from 'axios';
import { isAuthenticated, logout } from './services/auth';
import Login from './components/Login';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(isAuthenticated()); // Inicia o estado corretamente

  useEffect(() => {
    if (!authenticated) return; // Não faz nada se não estiver autenticado

    const controller = new AbortController();

    const fetchItems = async () => {
      // O header de autorização já foi configurado pelo auth.js!
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/api/items/`, {
          signal: controller.signal,
        });
        setItems(response.data.results || response.data); // Suporta paginação
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError('Sua sessão pode ter expirado. Tente fazer o login novamente.');
          console.error(err);
          // Opcional: fazer logout se o token for inválido (erro 401)
          if (err.response && err.response.status === 401) {
            handleLogout();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();

    return () => controller.abort();
  }, [authenticated]);

  const handleLogin = () => {
    setAuthenticated(true);
  };
  
  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setItems([]);
  };

  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Seu código de renderização aqui (o mesmo da mensagem anterior)
  return (
    <div className="inventory-app">
       <button onClick={handleLogout} style={{float: 'right'}}>Sair</button>
       <h1>App de Inventário</h1>
       {/* ... seu código para mostrar loading, erro ou a lista de itens */}
    </div>
  );
}

export default App;