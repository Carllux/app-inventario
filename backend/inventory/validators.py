# inventory/validators.py
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

def calculate_digit(cnpj, weights):
    """Calcula um dígito verificador do CNPJ usando uma lista de pesos."""
    total = sum(int(d) * w for d, w in zip(cnpj, weights))
    remainder = total % 11
    return 0 if remainder < 2 else 11 - remainder

def validate_cnpj_format(cnpj):
    """
    Valida o formato do CNPJ (XX.XXX.XXX/XXXX-XX ou apenas números)
    e também os dígitos verificadores usando o algoritmo oficial.
    """
    if not cnpj or not cnpj.strip():
        return cnpj

    cnpj_clean = re.sub(r'[^0-9]', '', cnpj)

    if len(cnpj_clean) != 14 or cnpj_clean == cnpj_clean[0] * 14:
        raise ValidationError(_("CNPJ deve ter 14 dígitos e não podem ser todos iguais."))

    try:
        # --- Cálculo do 1º Dígito Verificador ---
        soma = 0
        pesos = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        for i in range(12):
            soma += int(cnpj_clean[i]) * pesos[i]
        
        resto = soma % 11
        dv1 = 0 if resto < 2 else 11 - resto

        if dv1 != int(cnpj_clean[12]):
            raise ValidationError(_("CNPJ inválido: primeiro dígito verificador incorreto."))

        # --- Cálculo do 2º Dígito Verificador ---
        soma = 0
        pesos = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        for i in range(13):
            soma += int(cnpj_clean[i]) * pesos[i]
            
        resto = soma % 11
        dv2 = 0 if resto < 2 else 11 - resto

        if dv2 != int(cnpj_clean[13]):
            raise ValidationError(_("CNPJ inválido: segundo dígito verificador incorreto."))

    except (ValueError, IndexError):
        # Captura qualquer erro de conversão ou acesso, por segurança
        raise ValidationError(_("Formato de CNPJ inválido."))

    # Se passou por todas as validações, retorna o valor original
    return cnpj

def validate_cnpj_or_empty(value):
    """
    Validador que permite campo vazio ou CNPJ válido
    """
    if not value or value.strip() == '':
        return value
    return validate_cnpj_format(value)