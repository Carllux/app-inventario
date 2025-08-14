import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiGrid, FiBox, FiTruck, FiMapPin,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import classNames from 'classnames';
import styles from './Sidebar.module.css'; // ✅ Importe os estilos

const navLinks = [
  { to: "/dashboard", icon: <FiGrid />, text: "Dashboard" },
  { to: "/inventory", icon: <FiBox />, text: "Inventário" },
  { to: "/suppliers", icon: <FiTruck />, text: "Fornecedores" },
  { to: "/locations", icon: <FiMapPin />, text: "Locações" },
];

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <aside className={classNames(styles.sidebar, { [styles.collapsed]: isCollapsed })}>
      
      <div className={styles.header}>
        {!isCollapsed &&<span className={styles.logo}>📦</span>}
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
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/dashboard"}
                className={({ isActive }) => classNames(styles.navLink, { [styles.active]: isActive })}
              >
                <span className={styles.icon}>{link.icon}</span>
                {!isCollapsed && <span className={styles.text}>{link.text}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default React.memo(Sidebar);