import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiGrid, FiPackage, FiUsers, FiSettings,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import classNames from 'classnames';
import styles from './Sidebar.module.css';
import NavDropdown from './NavDropdown'; // ✅ 1. Importar o novo componente

// ✅ 2. A nova estrutura de dados aninhada que definimos no Passo 1
const navLinks = [
  { type: 'link', to: "/dashboard", icon: <FiGrid />, text: "Dashboard" },
  {
    type: 'menu', icon: <FiPackage />, text: "Catálogo",
    subLinks: [
      { to: "/inventory", text: "Itens" },
      { to: "/categories", text: "Categorias" },
      { to: "/settings/movement-types", text: "Tipos de Movimento" },
    ]
  },
  {
    type: 'menu', icon: <FiUsers />, text: "Cadastros",
    subLinks: [
      { to: "/suppliers", text: "Fornecedores" },
      { to: "/locations", text: "Locações" },
    ]
  },
  {
    type: 'menu', icon: <FiSettings />, text: "Configurações",
    subLinks: [
      { to: "/settings/branches", text: "Filiais" },
      { to: "/settings/sectors", text: "Setores" },
    ]
  },
];

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <aside className={classNames(styles.sidebar, { [styles.collapsed]: isCollapsed })}>
      
      <div className={styles.header}>
        {!isCollapsed && <span className={styles.logo}>📦</span>}
        {!isCollapsed && <h1 className={styles.title}>Inventário</h1>}
      </div>

      <button 
        onClick={toggleSidebar}
        className={styles.toggle}
        aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {isCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
      </button>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {/* ✅ 3. Lógica de renderização atualizada */}
          {navLinks.map((item) => {
            if (item.type === 'link') {
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/dashboard"}
                    className={({ isActive }) => classNames(styles.navLink, { [styles.active]: isActive })}
                  >
                    <span className={styles.icon}>{item.icon}</span>
                    {!isCollapsed && <span className={styles.text}>{item.text}</span>}
                  </NavLink>
                </li>
              );
            }
            if (item.type === 'menu') {
              return <NavDropdown key={item.text} menu={item} isCollapsed={isCollapsed} />;
            }
            return null;
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default React.memo(Sidebar);