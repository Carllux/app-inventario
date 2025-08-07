import { useState } from 'react';
import { isAuthenticated, logout } from './services/auth';
import Login from './components/Login';
import InventoryPage from './pages/InventoryPage'; // Importe a nova página

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  const handleLogin = () => {
    setAuthenticated(true);
  };
  
  const handleLogout = () => {
    logout();
    setAuthenticated(false);
  };

  // Se não estiver autenticado, mostra a página de Login
  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Se estiver autenticado, mostra a página do Inventário
  return <InventoryPage onLogout={handleLogout} />;
}

export default App;