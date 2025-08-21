// frontend/src/utils/errorUtils.js
import toast from 'react-hot-toast';

/**
 * Processa um objeto de erro da API (Axios) e exibe um toast formatado.
 * @param {Error} error - O objeto de erro capturado no bloco catch.
 * @param {string} genericMessage - Uma mensagem genérica para usar como fallback.
 */
export const handleApiError = (error, genericMessage = "Ocorreu um erro desconhecido.") => {
  // O console.error é importante para o desenvolvedor ver o erro completo
  console.error("API Error:", error);

  // Verifica se o erro tem a resposta da API com os dados de validação
  if (error.response && error.response.data) {
    const errorData = error.response.data;
    let messages = [];

    // Itera sobre os erros retornados pelo Django REST Framework
    for (const key in errorData) {
      const errorMessages = Array.isArray(errorData[key]) ? errorData[key] : [errorData[key]];
      // Formata a mensagem. Ex: "Nome: Este campo é obrigatório."
      const formattedKey = key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
      
      if (key === 'non_field_errors' || key === 'detail') {
        messages.push(...errorMessages);
      } else {
        messages.push(`${formattedKey}: ${errorMessages.join(' ')}`);
      }
    }

    if (messages.length > 0) {
      toast.error(messages.join('\n'));
      return;
    }
  }

  // Fallback para erros de rede ou outros problemas
  toast.error(error.message || genericMessage);
};