// Utilitários para consulta de CNPJ e CEP
import { API_ENDPOINT } from '../config/api';

// função para limpar strings (remove caracteres especiais)
export const cleanString = (str) => {
  return str ? str.replace(/\D/g, '') : '';
};

// função para formatar CNPJ
export const formatCNPJ = (value) => {
  const v = cleanString(value);
  if (v.length <= 14) {
    return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  return v;
};

// função para formatar CPF
export const formatCPF = (value) => {
  const v = cleanString(value);
  return v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
};

// função para formatar telefone
export const formatTelefone = (value) => {
  const v = cleanString(value);
  if (v.length <= 10) {
    return v.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
};

// função para formatar CEP
export const formatCEP = (value) => {
  const v = cleanString(value);
  return v.replace(/^(\d{5})(\d{3})$/, '$1-$2');
};

// Validação de CNPJ
export const isValidCNPJ = (cnpj) => {
  const cleanCNPJ = cleanString(cnpj);

  if (cleanCNPJ.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  // Validação dos dígitos verificadores
  let tamanho = cleanCNPJ.length - 2;
  let numeros = cleanCNPJ.substring(0, tamanho);
  let digitos = cleanCNPJ.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(0)) return false;

  tamanho = tamanho + 1;
  numeros = cleanCNPJ.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado != digitos.charAt(1)) return false;

  return true;
};

// Validação de CPF
export const isValidCPF = (cpf) => {
  const cleanCPF = cleanString(cpf);

  if (cleanCPF.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validação dos dígitos verificadores
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }

  let digito1 = 11 - (soma % 11);
  if (digito1 > 9) digito1 = 0;

  if (parseInt(cleanCPF.charAt(9)) !== digito1) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }

  let digito2 = 11 - (soma % 11);
  if (digito2 > 9) digito2 = 0;

  if (parseInt(cleanCPF.charAt(10)) !== digito2) return false;

  return true;
};

// Validação de email
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// função para buscar CNPJ na Receita Federal (via Backend com Fallback)
export const buscarCNPJ = async (cnpj) => {
  try {
    const cnpjLimpo = cleanString(cnpj);

    if (cnpjLimpo.length !== 14) {
      throw new Error('CNPJ deve ter 14 dígitos');
    }

    if (!isValidCNPJ(cnpjLimpo)) {
      throw new Error('CNPJ inválido');
    }

    // Chamar o endpoint do backend que já tem lógica de fallback e tratamento robusto
    const API_URL = API_ENDPOINT;
    const token = localStorage.getItem('access_token');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar token JWT se disponível  
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/consultar-cnpj/${cnpjLimpo}/`, {
      method: 'GET',
      headers: headers,
    });

    console.log('🔍 Resposta da API CNPJ:', {
      status: response.status,
      contentType: response.headers.get('content-type'),
      url: response.url
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('CNPJ não encontrado nas bases de dados');
      }
      if (response.status === 401) {
        throw new Error('Não autorizado. Faça login novamente.');
      }
      if (response.status === 500) {
        // Tentar ler a mensagem de erro do backend
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro no servidor. Tente novamente.');
        } catch {
          throw new Error('Erro no servidor. Tente novamente em alguns instantes.');
        }
      }
      throw new Error(`Erro ao consultar CNPJ: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('❌ Resposta não-JSON recebida:', textResponse.substring(0, 200));
      throw new Error('Resposta inválida do servidor. Verifique se o backend está funcionando corretamente.');
    }

    const data = await response.json();
    console.log('✅ Dados do CNPJ recebidos:', data);

    // Retornar dados padronizados diretamente da API de CNPJ
    // O backend já prioriza ReceitaWS que tem endereço completo da Receita Federal
    return {
      cnpj: data.cnpj || cnpjLimpo,
      razao_social: data.razao_social || '',
      nome_fantasia: data.nome_fantasia || '',
      inscricao_estadual: data.inscricao_estadual || '',
      email: data.email || '',
      telefone: data.telefone || '',
      cep: data.cep || '',
      endereco: data.logradouro || '', // Backend retorna como 'logradouro'
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      cidade: data.cidade || data.municipio || '',
      estado: data.uf || '',
      atividade_principal: data.atividade_principal || '',
      data_abertura: data.data_abertura || '',
      situacao: data.situacao || '',
      fonte: data.fonte || '', // Indica qual API foi usada (ReceitaWS, BrasilAPI, etc.)
    };

  } catch (error) {
    console.error('❌ Erro ao buscar CNPJ:', error);
    
    // Melhorar mensagens de erro para o usuário
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Erro de conexão. Verifique se o backend está rodando.');
    }
    
    if (error.message.includes('JSON.parse')) {
      throw new Error('Erro ao processar resposta do servidor. O backend pode estar retornando dados inválidos.');
    }
    
    // Se já é um erro customizado, repassar
    throw error;
  }
};

// função para buscar CEP nos Correios
export const buscarCEP = async (cep) => {
  try {
    const cepLimpo = cleanString(cep);

    if (cepLimpo.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    // Primeira tentativa: ViaCEP
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

      if (response.ok) {
        const data = await response.json();

        if (data.erro) {
          throw new Error('CEP não encontrado');
        }

        return {
          cep: data.cep,
          endereco: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
          complemento: data.complemento || '',
          ibge: data.ibge || '',
          gia: data.gia || '',
          ddd: data.ddd || '',
          siafi: data.siafi || ''
        };
      }
    } catch (viacepError) {
      console.warn('ViaCEP falhou, tentando BrasilAPI:', viacepError);
    }

    // Segunda tentativa: BrasilAPI
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);

      if (response.ok) {
        const data = await response.json();

        return {
          cep: data.cep,
          endereco: data.street,
          bairro: data.neighborhood,
          cidade: data.city,
          estado: data.state,
          complemento: '',
          ibge: data.cityIbge || '',
          gia: '',
          ddd: '',
          siafi: ''
        };
      }
    } catch (brasilApiError) {
      console.warn('BrasilAPI CEP falhou:', brasilApiError);
    }

    throw new Error('Serviços de consulta CEP indisponíveis no momento');

  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
};

// Lista de estados brasileiros
export const ESTADOS_BRASIL = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhéo' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'são Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];

// função para obter nome completo do estado pela sigla
export const getEstadoNome = (sigla) => {
  const estado = ESTADOS_BRASIL.find(e => e.value === sigla);
  return estado ? estado.label : sigla;
};

// função para debounce (útil para buscas automáticas)
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// função para normalizar dados de API
export const normalizeClienteData = (data) => {
  // Tentar múltiplas possibilidades para o ID
  const id = data.id || data.pk || data.cliente_id || data.id_cliente || data.codigo || null;

  console.log('🔧 normalizeClienteData - dados de entrada:', data);
  console.log('🔧 ID encontrado:', id, 'de', Object.keys(data));

  return {
    id: id,
    nome: data.nome || data.nome_razao_social || data.name || '',
    razao_social: data.razao_social || data.nome_razao_social || data.company_name || '',
    nome_fantasia: data.nome_fantasia || data.trade_name || data.fantasy_name || '',
    // Mapear cpf_cnpj do backend para cnpj no frontend
    cnpj: (() => {
      const cpfCnpj = data.cpf_cnpj || data.cnpj || data.cpf || '';
      if (!cpfCnpj) return '';
      const numbers = cpfCnpj.replace(/\D/g, '');
      if (numbers.length === 11) return formatCPF(cpfCnpj);
      if (numbers.length === 14) return formatCNPJ(cpfCnpj);
      return cpfCnpj;
    })(),
    inscricao_estadual: data.inscricao_estadual || data.state_registration || '',
    telefone: data.telefone ? formatTelefone(data.telefone) : '',
    whatsapp: data.whatsapp ? formatTelefone(data.whatsapp) : '',
    email: data.email || '',
    cep: data.cep ? formatCEP(data.cep) : '',
    endereco: data.endereco || data.logradouro || data.street || '',
    numero: data.numero || data.number || '',
    complemento: data.complemento || data.complement || '',
    bairro: data.bairro || data.neighborhood || '',
    cidade: data.cidade || data.city || data.localidade || '',
    estado: data.estado || data.state || data.uf || '',
    data_aniversario: data.data_nascimento || data.data_aniversario || data.birthday || '',
    observacoes: data.observacoes || data.notes || '',
    limite_credito: data.limite_credito || 0,
    ativo: data.ativo !== undefined ? data.ativo : true,
    data_inativacao: data.data_inativacao || null,
    motivo_inativacao: data.motivo_inativacao || '',
    created_at: data.created_at || data.createdAt,
    updated_at: data.updated_at || data.updatedAt,
    sexo: data.sexo || ''
  };
};

