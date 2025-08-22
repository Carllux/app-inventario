import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiChevronDown } from 'react-icons/fi';
import classNames from 'classnames';
import styles from './Sidebar.module.css'; // Reutilizaremos o CSS da Sidebar

function NavDropdown({ menu, isCollapsed }) {
  const location = useLocation();
  // Verifica se alguma sub-rota está ativa para manter o menu aberto
  const isAnySubLinkActive = menu.subLinks.some(sub => location.pathname.startsWith(sub.to));
  
  const [isOpen, setIsOpen] = useState(isAnySubLinkActive);

  const toggleMenu = () => {
    if (!isCollapsed) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <li className={classNames({ [styles.menuOpen]: isOpen })}>
      <button 
        className={classNames(styles.navLink, styles.menuButton, { [styles.active]: isAnySubLinkActive })}
        onClick={toggleMenu}
      >
        <span className={styles.icon}>{menu.icon}</span>
        {!isCollapsed && <span className={styles.text}>{menu.text}</span>}
        {!isCollapsed && <FiChevronDown className={styles.chevron} />}
      </button>

      {!isCollapsed && isOpen && (
        <ul className={styles.subList}>
          {menu.subLinks.map((subLink) => (
            <li key={subLink.to}>
              <NavLink
                to={subLink.to}
                className={({ isActive }) => classNames(styles.subLink, { [styles.active]: isActive })}
              >
                {subLink.text}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default NavDropdown;