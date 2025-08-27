import api from './api'; 

// Função para fazer o login
export const login = async (username, password) => {
  try {
    const response = await api.post(`/login/`, {
      username,
      password,
    });

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Armazena o objeto de usuário completo, que agora inclui o perfil
      localStorage.setItem('user', JSON.stringify(response.data.user));
      api.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
    }
    return response.data;
  } catch (error) {
    console.error("Falha no login:", error.response?.data?.error || "Erro desconhecido");
    throw new Error(error.response?.data?.error || 'Não foi possível fazer o login.');
  }
};

// Função para fazer logout
export const logout = async () => {
  try {
    // Chama o endpoint do backend para invalidar o token no servidor
    await api.post(`/logout/`);
  } catch (error) {
    console.error("Erro ao fazer logout no servidor (o token será removido localmente de qualquer forma):", error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  }
};

export const fetchCurrentUser = async () => {
    const response = await api.get(`/me/`);
    // Atualiza os dados do usuário no localStorage
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
};

// ✅ NOVO: Função para atualizar os dados do perfil
export const updateProfile = async (profileData, avatarFile) => {
  try {
    const dataToSend = new FormData();

    // Adiciona os campos de texto ao FormData
    for (const key in profileData) {
      if (profileData[key] !== null && profileData[key] !== undefined) {
        dataToSend.append(key, profileData[key]);
      }
    }

    // Se houver um arquivo de avatar, adiciona ao FormData
    if (avatarFile) {
      dataToSend.append('avatar', avatarFile);
    }

    // A API agora envia multipart/form-data
    const response = await api.patch(`/me/`, dataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar o perfil:", error);
    throw error;
  }
};

// ✅ NOVO: Função para alterar a senha
export const changePassword = async (passwordData) => {
  try {
    // O endpoint exato pode variar (ex: '/auth/password/change/'), ajuste conforme seu urls.py
    const response = await api.post('/auth/password/change/', passwordData);
    return response.data;
  } catch (error) {
    console.error("Erro ao alterar a senha:", error);
    throw error;
  }
};