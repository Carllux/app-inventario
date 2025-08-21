// frontend/src/components/LocationFormModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getLocationById, createLocation, updateLocation } from '../services/locationService';
import { useAuth } from '../hooks/useAuth';
import Modal from './Modal';
import FormGroup from './FormGroup';
import styles from './LocationFormModal.module.css';
import toast from 'react-hot-toast';

const initialState = {
  name: '',
  location_code: '',
  branch: '',
};

function LocationFormModal({ isOpen, onClose, onSuccess, locationId }) {
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { branches, selectedBranch } = useAuth();
  const isEditing = !!locationId;

  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({});
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (isEditing) {
      const fetchLocation = async () => {
        setIsLoading(true);
        try {
          const data = await getLocationById(locationId);
          setFormData({
            name: data.name || '',
            location_code: data.location_code || '',
            // Ajustar o serializer no backend para retornar branch_id é o ideal
            branch: data.branch_id || (branches.find(b => b.name === data.branch)?.id || ''),
          });
        } catch (error) {
          toast.error("Falha ao carregar dados da locação.");
          console.error(error); // Logar o erro completo para debug
          onClose();
        } finally {
          setIsLoading(false);
        }
      };
      fetchLocation();
    } else {
      // ✅ CORREÇÃO: Lógica de pré-seleção mais robusta
      // Se o usuário só tem uma filial, usa essa por padrão.
      if (branches.length === 1) {
        setFormData(prev => ({ ...prev, branch: branches[0].id }));
      } 
      // Senão, usa a filial do filtro global, se houver.
      else if (selectedBranch) {
        setFormData(prev => ({ ...prev, branch: selectedBranch.id }));
      }
    }
  }, [locationId, isEditing, isOpen, onClose, resetForm, selectedBranch, branches]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (isEditing) {
        await updateLocation(locationId, formData);
        toast.success("Locação atualizada com sucesso!");
        onSuccess(); // No modo de edição, não precisa passar dados
      } else {
        // ✅ 1. Captura os dados da nova locação retornada pela API
        const newLocation = await createLocation(formData);
        toast.success("Locação criada com sucesso!");
        // ✅ 2. Passa a nova locação para a página pai
        onSuccess(newLocation); 
      }
      onClose();
    } catch (error) {
      toast.error("Ocorreu um erro. Verifique os campos.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Locação" : "Adicionar Locação"}>
      <form onSubmit={handleSubmit}>
        {isLoading && <div className="loadingState">Carregando...</div>}
        {!isLoading && (
          <>
            <FormGroup label="Nome da Locação" error={errors.name}>
              <input
                type="text" name="name" value={formData.name}
                onChange={handleChange} required
                placeholder="Ex: Prateleira A-01"
              />
            </FormGroup>

            <FormGroup label="Código da Locação" error={errors.location_code}>
              <input
                type="text" name="location_code" value={formData.location_code}
                onChange={handleChange} required
                placeholder="Ex: P-A01"
              />
            </FormGroup>
            
            <FormGroup label="Filial" error={errors.branch}>
              <select 
                name="branch" 
                value={formData.branch} 
                onChange={handleChange} 
                required
                disabled={branches.length === 1}
              >
                <option value="">Selecione uma filial...</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </FormGroup>

            <div className={styles.modalFooter}>
              <button type="button" className="button button-outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </button>
              <button type="submit" className="button button-primary" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

export default LocationFormModal;