import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactCountryFlag from 'react-country-flag';
import api from '../services/api';
import styles from './CountrySelect.module.css';
import toast from 'react-hot-toast';

// Componente memoizado para bandeiras
const MemoizedFlag = React.memo(({ countryCode }) => (
  <ReactCountryFlag
    countryCode={countryCode}
    svg
    style={{ width: '24px', height: '18px', flexShrink: 0 }}
    title={countryCode}
  />
));

function CountrySelect({ value, onChange, disabled, name = 'country' }) {
  const [countries, setCountries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Buscar lista de países apenas uma vez
  useEffect(() => {
    let isMounted = true;
    
    const fetchCountries = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/utils/countries/');
        if (isMounted) {
          setCountries(response.data);
        }
      } catch (error) {
        if (isMounted) {
          toast.error("Não foi possível carregar a lista de países.");
          setCountries([
            { code: 'BR', name: 'Brasil' },
            { code: 'US', name: 'Estados Unidos' },
          ]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchCountries();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Memoizar país selecionado
  const selectedCountry = useMemo(() => 
    countries.find(c => c.code === value),
    [countries, value]
  );

  // Memoizar países filtrados
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return countries;
    
    const term = searchTerm.toLowerCase();
    return countries.filter(c => 
      c.name.toLowerCase().includes(term)
    );
  }, [countries, searchTerm]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, true);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]);

  const handleSelect = useCallback((countryCode) => {
    onChange({ target: { name, value: countryCode } });
    setIsOpen(false);
    setSearchTerm('');
  }, [onChange, name]);

  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev);
    }
  }, [disabled]);

  if (isLoading) {
    return <div className={styles.loading}>Carregando países...</div>;
  }

  return (
    <div className={styles.countrySelect} ref={dropdownRef}>
      <div 
        className={`${styles.selectedValue} ${disabled ? styles.disabled : ''}`} 
        onClick={toggleDropdown}
      >
        {selectedCountry ? (
          <>
            <MemoizedFlag countryCode={selectedCountry.code} />
            <span className={styles.countryName}>{selectedCountry.name}</span>
          </>
        ) : (
          <span className={styles.placeholder}>Selecione um país...</span>
        )}
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && !disabled && (
        <div className={styles.dropdown}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Pesquisar país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <ul className={styles.countryList}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map(country => (
                <li 
                  key={country.code} 
                  onClick={() => handleSelect(country.code)}
                  className={value === country.code ? styles.selected : ''}
                >
                  <MemoizedFlag countryCode={country.code} />
                  <span className={styles.countryName}>{country.name}</span>
                </li>
              ))
            ) : (
              <li className={styles.noResults}>Nenhum país encontrado</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default React.memo(CountrySelect);