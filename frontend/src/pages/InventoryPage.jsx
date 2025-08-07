import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Recebe a função de logout como prop
function InventoryPage({ onLogout }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchItems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/api/items/`, {
          signal: controller.signal,
        });
        setItems(response.data.results || response.data);
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError('Sua sessão pode ter expirado ou falhou ao carregar os itens.');
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();

    return () => controller.abort();
  }, []); // Array vazio, pois este componente só renderiza quando já está autenticado

  // --- LÓGICA DE RENDERIZAÇÃO COMPLETA ---
  if (isLoading) {
    return <p>Carregando itens...</p>;
  }

  if (error) {
    return <p className="error" style={{ color: 'red' }}>Erro: {error}</p>;
  }

  return (
    <div className="inventory-app">
      <button onClick={onLogout} style={{ float: 'right' }}>Sair</button>
      <h1>App de Inventário</h1>
      <p>Total de itens na base de dados: {items.length}</p>
      <hr />

      {items.length === 0 ? (
        <p>Nenhum item encontrado no inventário.</p>
      ) : (
        <div className="item-list">
          {items.map(item => (
            <div key={item.id} className="item-card">
              {item.photo && <img src={item.photo} alt={item.name} />}
              <h2>{item.name}</h2>
              <p><strong>Marca:</strong> {item.brand || 'N/D'}</p>
              <p><strong>Quantidade:</strong> {item.quantity}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InventoryPage;