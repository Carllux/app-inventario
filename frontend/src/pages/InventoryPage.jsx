import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ItemCard from '../components/ItemCard'; // Importe o novo componente

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function InventoryPage() {
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
  }, []);

  if (isLoading) {
    return <p className="status-message">Carregando itens...</p>;
  }

  if (error) {
    return <p className="status-message error">Erro: {error}</p>;
  }
  
  return (
    <div className="inventory-page-content">
      <div className="page-header">
        <h1>Itens do Inventário</h1>
        <button className="button button-success">+ Adicionar Novo Item</button>
      </div>
      <p>Total de itens na base de dados: {items.length}</p>
      <hr />
      
      {items.length === 0 ? (
        <p className="status-message">Nenhum item encontrado no inventário.</p>
      ) : (
        <div className="item-list">
          {/* Aqui usamos o .map() para renderizar nosso novo componente ItemCard */}
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default InventoryPage;