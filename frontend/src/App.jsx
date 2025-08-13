// frontend/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Nossos componentes de proteção e de páginas
import PrivateRoute from './components/PrivateRoute';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import LoginPage from './pages/LoginPage';
import InventoryPage from './pages/InventoryPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* GRUPO DE ROTAS PRIVADAS */}
        {/* Todas as rotas aqui dentro serão protegidas e usarão o AuthenticatedLayout */}
        <Route element={ <PrivateRoute><AuthenticatedLayout /></PrivateRoute> }>
          
          <Route path="/inventory" element={<InventoryPage />} />
          
          {/* Futuramente, adicione outras páginas privadas aqui. Ex: */}
          {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
        </Route>

        {/* Rota Padrão: Redireciona a raiz para a página de inventário */}
        <Route path="/" element={<Navigate to="/inventory" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;