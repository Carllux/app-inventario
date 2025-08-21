// frontend/src/components/Modal.jsx
import React, { useEffect } from 'react';
import styles from './Modal.module.css';
import { FiX } from 'react-icons/fi'; // Usando ícone para o botão de fechar

function Modal({ isOpen, onClose, title, children }) {
  // Efeito para lidar com a tecla "Escape" para fechar o modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      // Adiciona o listener quando o modal abre
      window.addEventListener('keydown', handleKeyDown);
    }

    // Função de limpeza: remove o listener quando o modal fecha ou o componente é desmontado
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]); // Dependências do efeito

  // Se não estiver aberto, não renderiza nada
  if (!isOpen) {
    return null;
  }

  // Impede que o clique dentro do modal feche o modal (propagação)
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={handleModalContentClick}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Fechar modal">
            <FiX />
          </button>
        </div>
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default React.memo(Modal);