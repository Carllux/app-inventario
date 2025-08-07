import React from 'react';
import { Link } from 'react-router-dom'; // Usaremos para navegação no futuro

function Navbar({ onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        {/* Link para a página inicial */}
        <Link to="/" className="navbar-item">
          <strong>App de Inventário</strong>
        </Link>
      </div>

      <div className="navbar-menu">
        <div className="navbar-end">
          <div className="navbar-item">
            <div className="buttons">
              {/* O botão de Sair agora vive aqui */}
              <button onClick={onLogout} className="button is-light">
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