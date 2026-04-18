/**
 * Utilitários de validação de documentos brasileiros (CPF e CNPJ)
 * 
 * @module validators
 */

/**
 * Remove caracteres não numéricos de uma string
 * @param {string} str - String a ser limpa
 * @returns {string} String contendo apenas números
 */
const removerFormatacao = (str) => {
    return str.replace(/[^\d]/g, '');
};

/**
 * Valida um CPF brasileiro
 * @param {string} cpf - CPF a ser validado (com ou sem formatação)
 * @returns {boolean} true se o CPF for válido, false caso contrário
 * 
 * @example
 * validarCPF('123.456.789-09'); // true ou false
 * validarCPF('12345678909'); // true ou false
 */
export const validarCPF = (cpf) => {
    if (!cpf) return false;

    cpf = removerFormatacao(cpf);

    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1+$/.test(cpf)) return false;

    // Validação do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;

    return true;
};

/**
 * Valida um CNPJ brasileiro
 * @param {string} cnpj - CNPJ a ser validado (com ou sem formatação)
 * @returns {boolean} true se o CNPJ for válido, false caso contrário
 * 
 * @example
 * validarCNPJ('12.345.678/0001-90'); // true ou false
 * validarCNPJ('12345678000190'); // true ou false
 */
export const validarCNPJ = (cnpj) => {
    if (!cnpj) return false;

    cnpj = removerFormatacao(cnpj);

    // Verifica se tem 14 dígitos
    if (cnpj.length !== 14) return false;

    // Verifica se todos os dígitos são iguais (CNPJ inválido)
    if (/^(\d)\1+$/.test(cnpj)) return false;

    // Validação do primeiro dígito verificador
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    // Validação do segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) return false;

    return true;
};

/**
 * Valida CPF ou CNPJ automaticamente baseado no tamanho
 * @param {string} documento - CPF ou CNPJ a ser validado
 * @returns {boolean} true se o documento for válido, false caso contrário
 * 
 * @example
 * validarCPFouCNPJ('123.456.789-09'); // valida como CPF
 * validarCPFouCNPJ('12.345.678/0001-90'); // valida como CNPJ
 */
export const validarCPFouCNPJ = (documento) => {
    if (!documento) return false;

    const limpo = removerFormatacao(documento);

    if (limpo.length === 11) {
        return validarCPF(documento);
    } else if (limpo.length === 14) {
        return validarCNPJ(documento);
    }

    return false;
};

/**
 * Formata um CPF com máscara
 * @param {string} cpf - CPF a ser formatado
 * @returns {string} CPF formatado (XXX.XXX.XXX-XX)
 * 
 * @example
 * formatarCPF('12345678909'); // '123.456.789-09'
 */
export const formatarCPF = (cpf) => {
    if (!cpf) return '';

    cpf = removerFormatacao(cpf);

    if (cpf.length !== 11) return cpf;

    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata um CNPJ com máscara
 * @param {string} cnpj - CNPJ a ser formatado
 * @returns {string} CNPJ formatado (XX.XXX.XXX/XXXX-XX)
 * 
 * @example
 * formatarCNPJ('12345678000190'); // '12.345.678/0001-90'
 */
export const formatarCNPJ = (cnpj) => {
    if (!cnpj) return '';

    cnpj = removerFormatacao(cnpj);

    if (cnpj.length !== 14) return cnpj;

    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata CPF ou CNPJ automaticamente
 * @param {string} documento - CPF ou CNPJ a ser formatado
 * @returns {string} Documento formatado
 * 
 * @example
 * formatarCPFouCNPJ('12345678909'); // '123.456.789-09'
 * formatarCPFouCNPJ('12345678000190'); // '12.345.678/0001-90'
 */
export const formatarCPFouCNPJ = (documento) => {
    if (!documento) return '';

    const limpo = removerFormatacao(documento);

    if (limpo.length === 11) {
        return formatarCPF(documento);
    } else if (limpo.length === 14) {
        return formatarCNPJ(documento);
    }

    return documento;
};

/**
 * Valida um email
 * @param {string} email - Email a ser validado
 * @returns {boolean} true se o email for válido, false caso contrário
 * 
 * @example
 * validarEmail('usuario@exemplo.com'); // true
 */
export const validarEmail = (email) => {
    if (!email) return false;

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Valida um telefone brasileiro (com ou sem formatação)
 * @param {string} telefone - Telefone a ser validado
 * @returns {boolean} true se o telefone for válido, false caso contrário
 * 
 * @example
 * validarTelefone('(11) 98765-4321'); // true
 * validarTelefone('11987654321'); // true
 */
export const validarTelefone = (telefone) => {
    if (!telefone) return false;

    const limpo = removerFormatacao(telefone);

    // Aceita telefone com 10 dígitos (fixo) ou 11 dígitos (celular)
    return limpo.length === 10 || limpo.length === 11;
};

/**
 * Formata um telefone brasileiro
 * @param {string} telefone - Telefone a ser formatado
 * @returns {string} Telefone formatado
 * 
 * @example
 * formatarTelefone('11987654321'); // '(11) 98765-4321'
 * formatarTelefone('1133334444'); // '(11) 3333-4444'
 */
export const formatarTelefone = (telefone) => {
    if (!telefone) return '';

    const limpo = removerFormatacao(telefone);

    if (limpo.length === 11) {
        // Celular: (XX) 9XXXX-XXXX
        return limpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (limpo.length === 10) {
        // Fixo: (XX) XXXX-XXXX
        return limpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return telefone;
};

/**
 * Valida um CEP brasileiro
 * @param {string} cep - CEP a ser validado
 * @returns {boolean} true se o CEP for válido, false caso contrário
 * 
 * @example
 * validarCEP('12345-678'); // true
 * validarCEP('12345678'); // true
 */
export const validarCEP = (cep) => {
    if (!cep) return false;

    const limpo = removerFormatacao(cep);

    return limpo.length === 8;
};

/**
 * Formata um CEP brasileiro
 * @param {string} cep - CEP a ser formatado
 * @returns {string} CEP formatado (XXXXX-XXX)
 * 
 * @example
 * formatarCEP('12345678'); // '12345-678'
 */
export const formatarCEP = (cep) => {
    if (!cep) return '';

    const limpo = removerFormatacao(cep);

    if (limpo.length !== 8) return cep;

    return limpo.replace(/(\d{5})(\d{3})/, '$1-$2');
};
