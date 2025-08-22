// frontend/src/components/CnpjInput.jsx
import React from 'react';
import { formatCnpj } from '../utils/formatters';

function CnpjInput({ value, onChange, ...rest }) {

  const handleChange = (e) => {
    // Aplica a formatação ao valor do input
    const formattedValue = formatCnpj(e.target.value);

    // Cria um "evento sintético" para passar para o handler do formulário pai,
    // garantindo que ele receba o valor já formatado.
    const syntheticEvent = {
      target: {
        ...e.target,
        name: e.target.name,
        value: formattedValue,
      },
    };

    // Chama a função onChange do formulário pai (ex: o 'handleChange' do hook)
    onChange(syntheticEvent);
  };

  return (
    <input
      type="text"
      value={value || ''}
      onChange={handleChange}
      placeholder="00.000.000/0000-00"
      maxLength="18" // Comprimento máximo do CNPJ formatado
      {...rest} // Passa outras props como 'name', 'disabled', etc.
    />
  );
}

export default CnpjInput;