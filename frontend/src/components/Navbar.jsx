// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// O Navbar agora recebe o objeto 'user' e a função 'onLogout'
function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/inventory" className="navbar-item">
          <strong>App de Inventário</strong>
        </Link>
      </div>

      <div className="navbar-menu">
        <div className="navbar-end">
          <div className="navbar-item">
            {/* Mostra o nome do usuário se ele existir */}
            {user && <span className="navbar-user">Olá, {user.username}</span>}
          </div>
          <div className="navbar-item">
            <div className="buttons">
              <button onClick={onLogout} className="button button-light">
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;