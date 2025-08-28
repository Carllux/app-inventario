// src/components/ActivityTimeline/ActivityTimeline.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import styles from './ActivityTimeline.module.css';
import { FaPlusCircle, FaExchangeAlt, FaTruck, FaEdit, FaTrash } from 'react-icons/fa';
import Spinner from '../Spinner'; // Reutilizamos o Spinner

// Mapeamento de ícones mais completo
const iconMap = {
  CREATED: <FaPlusCircle color="var(--color-success)" />,
  UPDATED: <FaEdit color="var(--color-primary)" />,
  DELETED: <FaTrash color="var(--color-danger)" />,
};

const ActivityTimeline = () => {
  const [logs, setLogs] = useState([]);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchLogs = useCallback(async (url) => {
    // Define o estado de loading correto (inicial ou "carregar mais")
    url.endsWith('/?page=1') ? setIsLoading(true) : setIsLoadingMore(true);
    
    try {
      const response = await api.get(url);
      // Adiciona os novos logs aos existentes se for "carregar mais"
      setLogs(prevLogs => url.endsWith('/?page=1') ? response.data.results : [...prevLogs, ...response.data.results]);
      setNextPageUrl(response.data.next); // Armazena a URL da próxima página
    } catch (error) {
      console.error("Falha ao buscar histórico de atividade", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    // Busca a primeira página ao montar o componente
    fetchLogs('/me/activity-log/?page=1');
  }, [fetchLogs]);

  if (isLoading) {
    return <div className={styles.centered}><Spinner /></div>;
  }
  
  if (logs.length === 0) {
      return <div className={styles.centered}><p>Nenhuma atividade recente encontrada.</p></div>
  }

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timeline}>
        {logs.map((log, index) => {
          const action = log.action_type.split('_').pop(); // Ex: 'CREATED'
          return (
            <div key={index} className={styles.timelineItem}>
              <div className={styles.timelineIcon}>{iconMap[action] || '?'}</div>
              <div className={styles.timelineContent}>
                <span className={styles.timestamp}>
                  {new Date(log.timestamp).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}
                  {' - '}<span className={styles.user}>{log.user}</span>
                </span>
                <p className={styles.description}>
                  {log.description}
                  {log.target_url && <Link to={log.target_url} className={styles.detailsLink}>Ver detalhes</Link>}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {nextPageUrl && (
        <div className={styles.loadMoreContainer}>
          <button onClick={() => fetchLogs(nextPageUrl)} disabled={isLoadingMore} className="button">
            {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;