// frontend/src/utils/formatters.js

/**
 * Aplica a máscara de CNPJ (XX.XXX.XXX/XXXX-XX) a uma string.
 * @param {string} value - A string a ser formatada, contendo apenas números ou um CNPJ já formatado.
 * @returns {string} O valor com a máscara de CNPJ aplicada.
 */
export const formatCnpj = (value) => {
  if (!value) return '';

  // 1. Remove tudo que não for dígito
  const onlyDigits = value.replace(/[^\d]/g, '');

  // 2. Limita a 14 dígitos
  const truncatedValue = onlyDigits.slice(0, 14);

  // 3. Aplica a máscara de CNPJ usando expressões regulares
  return truncatedValue
    .replace(/(\d{2})(\d)/, '$1.$2')       // Coloca o primeiro ponto
    .replace(/(\d{3})(\d)/, '$1.$2')       // Coloca o segundo ponto
    .replace(/(\d{3})(\d)/, '$1/$2')       // Coloca a barra
    .replace(/(\d{4})(\d{2})/, '$1-$2'); // Coloca o traço
};