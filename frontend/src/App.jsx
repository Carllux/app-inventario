import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from './components/PrivateRoute';
import AuthenticatedLayout from './components/AuthenticatedLayout'; // Importamos o novo Layout
import LoginPage from './pages/LoginPage';
import InventoryPage from './pages/InventoryPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* GRUPO DE ROTAS PRIVADAS */}
        <Route element={ <PrivateRoute><AuthenticatedLayout /></PrivateRoute> }>
          {/* Todas as rotas declaradas aqui dentro estarão protegidas
              e usarão o AuthenticatedLayout com o Navbar */}
          
          <Route path="/inventory" element={<InventoryPage />} />
          
          {/* Se você criar uma página de Dashboard, basta adicionar a linha abaixo */}
          {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
        </Route>

        {/* Rota Padrão */}
        <Route path="*" element={<Navigate to="/inventory" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;