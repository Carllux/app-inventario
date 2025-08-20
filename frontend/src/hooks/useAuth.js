import { useContext } from 'react';
// Importa o AuthContext, mas não o provider
import { AuthContext } from '../context/AuthContext'; 

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}