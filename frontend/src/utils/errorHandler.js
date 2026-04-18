/**
 * Utilitário para tratamento padronizado de erros da API
 * 
 * @module errorHandler
 */

/**
 * Extrai mensagem de erro amigável de um erro do Axios
 * 
 * @param {Error} error - Objeto de erro retornado pelo Axios
 * @param {string} defaultMessage - Mensagem padrão se não houver mensagem específica
 * @returns {string} Mensagem de erro formatada
 * 
 * @example
 * try {
 *   await axiosInstance.post('/api/endpoint', data);
 * } catch (error) {
 *   const message = getErrorMessage(error, 'Erro ao salvar');
 *   setSnackbar({ open: true, message, severity: 'error' });
 * }
 */
export const getErrorMessage = (error, defaultMessage = 'Erro ao processar solicitação') => {
    // Sem resposta do servidor (erro de rede)
    if (!error.response) {
        if (error.message === 'Network Error') {
            return 'Erro de conexão. Verifique sua internet e tente novamente.';
        }
        return error.message || defaultMessage;
    }

    const { status, data } = error.response;

    // Erros por código de status HTTP
    switch (status) {
        case 400:
            // Bad Request - dados inválidos
            if (data?.detail) return data.detail;
            if (data?.message) return data.message;
            if (data?.error) return data.error;

            // Se há múltiplos erros de campo
            if (typeof data === 'object' && !Array.isArray(data)) {
                const fieldErrors = Object.entries(data)
                    .map(([field, errors]) => {
                        const errorMsg = Array.isArray(errors) ? errors.join(', ') : errors;
                        return `${field}: ${errorMsg}`;
                    })
                    .join('\n');
                return fieldErrors || 'Dados inválidos enviados';
            }

            return 'Dados inválidos. Verifique os campos e tente novamente.';

        case 401:
            // Não autenticado
            return 'Sessão expirada. Por favor, faça login novamente.';

        case 403:
            // Sem permissão
            return 'Você não tem permissão para realizar esta ação.';

        case 404:
            // Não encontrado
            return data?.detail || 'Recurso não encontrado.';

        case 409:
            // Conflito
            return data?.detail || 'Conflito de dados. O registro já existe.';

        case 422:
            // Unprocessable Entity
            return data?.detail || 'Dados não processáveis. Verifique as informações.';

        case 500:
            // Erro interno do servidor
            return 'Erro interno do servidor. Tente novamente mais tarde.';

        case 502:
            // Bad Gateway
            return 'Serviço temporariamente indisponível. Tente novamente.';

        case 503:
            // Service Unavailable
            return 'Serviço em manutenção. Tente novamente em alguns minutos.';

        default:
            // Outros erros
            if (data?.detail) return data.detail;
            if (data?.message) return data.message;
            if (data?.error) return data.error;
            return defaultMessage;
    }
};

/**
 * Extrai múltiplos erros de validação de campo
 * 
 * @param {Error} error - Objeto de erro retornado pelo Axios
 * @returns {Object} Objeto com erros por campo { campo: 'mensagem de erro' }
 * 
 * @example
 * const fieldErrors = getFieldErrors(error);
 * // { cpf: 'CPF inválido', email: 'Email já cadastrado' }
 */
export const getFieldErrors = (error) => {
    if (!error.response?.data) return {};

    const { data } = error.response;

    // Se data já é um objeto de erros de campo
    if (typeof data === 'object' && !Array.isArray(data) && !data.detail && !data.message) {
        const fieldErrors = {};
        Object.entries(data).forEach(([field, errors]) => {
            fieldErrors[field] = Array.isArray(errors) ? errors[0] : errors;
        });
        return fieldErrors;
    }

    return {};
};

/**
 * Verifica se o erro é de autenticação (401)
 * 
 * @param {Error} error - Objeto de erro
 * @returns {boolean} true se for erro de autenticação
 */
export const isAuthError = (error) => {
    return error.response?.status === 401;
};

/**
 * Verifica se o erro é de permissão (403)
 * 
 * @param {Error} error - Objeto de erro
 * @returns {boolean} true se for erro de permissão
 */
export const isPermissionError = (error) => {
    return error.response?.status === 403;
};

/**
 * Verifica se o erro é de validação (400)
 * 
 * @param {Error} error - Objeto de erro
 * @returns {boolean} true se for erro de validação
 */
export const isValidationError = (error) => {
    return error.response?.status === 400;
};

/**
 * Verifica se o erro é de rede (sem resposta do servidor)
 * 
 * @param {Error} error - Objeto de erro
 * @returns {boolean} true se for erro de rede
 */
export const isNetworkError = (error) => {
    return !error.response && error.message === 'Network Error';
};

/**
 * Handler global para erros da API
 * Exibe notificação automaticamente e trata casos especiais
 * 
 * @param {Error} error - Objeto de erro
 * @param {function} showSnackbar - Função para exibir snackbar
 * @param {string} defaultMessage - Mensagem padrão
 * @param {function} onAuthError - Callback para erro de autenticação (opcional)
 * 
 * @example
 * try {
 *   await axiosInstance.get('/api/data');
 * } catch (error) {
 *   handleApiError(error, setSnackbar, 'Erro ao carregar dados', logout);
 * }
 */
export const handleApiError = (
    error,
    showSnackbar,
    defaultMessage = 'Erro ao processar solicitação',
    onAuthError = null
) => {
    console.error('API Error:', error);

    // Erro de autenticação - executa callback se fornecido
    if (isAuthError(error) && onAuthError) {
        onAuthError();
        showSnackbar({
            open: true,
            message: 'Sessão expirada. Faça login novamente.',
            severity: 'warning',
        });
        return;
    }

    // Erro de rede
    if (isNetworkError(error)) {
        showSnackbar({
            open: true,
            message: 'Sem conexão com o servidor. Verifique sua internet.',
            severity: 'error',
        });
        return;
    }

    // Outros erros - extrai mensagem
    const message = getErrorMessage(error, defaultMessage);
    const severity = isPermissionError(error) ? 'warning' : 'error';

    showSnackbar({
        open: true,
        message,
        severity,
    });
};

/**
 * Formata erros de validação para exibição em formulários
 * 
 * @param {Error} error - Objeto de erro
 * @returns {string} Mensagem formatada com todos os erros
 * 
 * @example
 * const errorMessage = formatValidationErrors(error);
 * // "CPF: Campo obrigatório\nEmail: Email inválido"
 */
export const formatValidationErrors = (error) => {
    const fieldErrors = getFieldErrors(error);

    if (Object.keys(fieldErrors).length === 0) {
        return getErrorMessage(error);
    }

    return Object.entries(fieldErrors)
        .map(([field, message]) => `${field}: ${message}`)
        .join('\n');
};

/**
 * Cria um handler de erro específico para uma operação
 * 
 * @param {string} operation - Nome da operação ('criar', 'atualizar', 'excluir', etc)
 * @param {string} resource - Nome do recurso ('cliente', 'produto', 'venda', etc)
 * @returns {function} Handler de erro configurado
 * 
 * @example
 * const handleError = createErrorHandler('criar', 'cliente');
 * try {
 *   await createClient(data);
 * } catch (error) {
 *   handleError(error, setSnackbar);
 * }
 */
export const createErrorHandler = (operation, resource) => {
    const messages = {
        criar: `Erro ao criar ${resource}`,
        atualizar: `Erro ao atualizar ${resource}`,
        excluir: `Erro ao excluir ${resource}`,
        carregar: `Erro ao carregar ${resource}`,
        salvar: `Erro ao salvar ${resource}`,
        buscar: `Erro ao buscar ${resource}`,
    };

    const defaultMessage = messages[operation] || `Erro ao processar ${resource}`;

    return (error, showSnackbar, onAuthError = null) => {
        handleApiError(error, showSnackbar, defaultMessage, onAuthError);
    };
};

/**
 * Objeto com handlers de erro pré-configurados para operações comuns
 */
export const ErrorHandlers = {
    create: (resource) => createErrorHandler('criar', resource),
    update: (resource) => createErrorHandler('atualizar', resource),
    delete: (resource) => createErrorHandler('excluir', resource),
    fetch: (resource) => createErrorHandler('carregar', resource),
    save: (resource) => createErrorHandler('salvar', resource),
    search: (resource) => createErrorHandler('buscar', resource),
};

export default {
    getErrorMessage,
    getFieldErrors,
    isAuthError,
    isPermissionError,
    isValidationError,
    isNetworkError,
    handleApiError,
    formatValidationErrors,
    createErrorHandler,
    ErrorHandlers,
};
