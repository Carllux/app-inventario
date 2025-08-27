// frontend/src/hooks/useProfile.js
import { useState, useEffect, useCallback } from 'react';
import { fetchCurrentUser, updateProfile, changePassword } from '../services/auth'; // Precisaremos criar/usar estas funções
import { handleApiError } from '../utils/errorUtils';
import toast from 'react-hot-toast';

export function useProfile() {
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', re_new_password: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null); // NOVO: Estado para o arquivo
  const [avatarPreview, setAvatarPreview] = useState(null); // NOVO: Estado para o preview
  const [errors, setErrors] = useState({});

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchCurrentUser(); // Busca dados do /api/me/
      setUserProfile(data);
      // Preenche o formulário de dados pessoais com os dados atuais
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone_number: data.profile?.phone_number || '',
        preferred_theme: data.profile?.preferred_theme || 'SYSTEM',
        default_items_per_page: data.profile?.default_items_per_page || 25,
        table_density: data.profile?.table_density || 'COMFORTABLE',
        job_title: data.profile?.job_title || '' 
      });
      setAvatarPreview(data.profile?.avatar || null);
    } catch (error) {
      toast.error("Não foi possível carregar os dados do perfil.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const updatedUser = await updateProfile(formData, avatarFile);
      setUserProfile(updatedUser); // Atualiza os dados exibidos
      setAvatarFile(null); // Limpa o arquivo após o envio
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      if (error.response?.status === 400) setErrors(error.response.data);
      handleApiError(error, "Falha ao atualizar o perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      await changePassword(passwordData);
      toast.success("Senha alterada com sucesso!");
      setPasswordData({ current_password: '', new_password: '', re_new_password: '' }); // Limpa o formulário
    } catch (error) {
      if (error.response?.status === 400) setErrors(error.response.data);
      handleApiError(error, "Falha ao alterar a senha.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    userProfile,
    formData,
    passwordData,
    isLoading,
    isSubmitting,
    errors,
    handleChange,
    handlePasswordChange,
    handleSubmitProfile,
    handleSubmitPassword,
    avatarPreview,
    handleAvatarChange,
  };
}