import React from 'react';
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material';

/**
 * Componente de loading spinner reutilizável
 * 
 * @param {Object} props
 * @param {boolean} props.fullScreen - Se true, ocupa tela inteira com backdrop
 * @param {string} props.message - Mensagem a ser exibida (opcional)
 * @param {string} props.size - Tamanho do spinner: "small", "medium", "large" (padrão: "medium")
 * @param {string} props.color - Cor do spinner (padrão: "primary")
 * @param {number} props.minHeight - Altura mínima do container (padrão: 200)
 * 
 * @example
 * // Loading simples
 * {isLoading && <LoadingSpinner />}
 * 
 * // Loading com mensagem
 * <LoadingSpinner message="Carregando dados..." />
 * 
 * // Loading tela cheia
 * <LoadingSpinner fullScreen message="Processando..." />
 */
const LoadingSpinner = ({
    fullScreen = false,
    message = '',
    size = 'medium',
    color = 'primary',
    minHeight = 200,
}) => {
    const getSizeValue = () => {
        switch (size) {
            case 'small':
                return 30;
            case 'large':
                return 60;
            case 'medium':
            default:
                return 40;
        }
    };

    const content = (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight={fullScreen ? '100vh' : minHeight}
            gap={2}
        >
            <CircularProgress size={getSizeValue()} color={color} />
            {message && (
                <Typography variant="body2" color="text.secondary">
                    {message}
                </Typography>
            )}
        </Box>
    );

    if (fullScreen) {
        return (
            <Backdrop
                open={true}
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                }}
            >
                {content}
            </Backdrop>
        );
    }

    return content;
};

export default LoadingSpinner;

/**
 * Componente de loading inline (horizontal)
 * 
 * @param {Object} props
 * @param {string} props.message - Mensagem a ser exibida
 * @param {string} props.size - Tamanho do spinner
 * 
 * @example
 * <LoadingInline message="Salvando..." />
 */
export const LoadingInline = ({ message = 'Carregando...', size = 20 }) => {
    return (
        <Box display="flex" alignItems="center" gap={1.5} py={1}>
            <CircularProgress size={size} />
            <Typography variant="body2" color="text.secondary">
                {message}
            </Typography>
        </Box>
    );
};

/**
 * Componente de overlay de loading para cards ou containers
 * 
 * @param {Object} props
 * @param {boolean} props.loading - Se está carregando
 * @param {ReactNode} props.children - Conteúdo a ser exibido quando não estiver carregando
 * @param {string} props.message - Mensagem de loading
 * 
 * @example
 * <LoadingOverlay loading={isLoading} message="Carregando produtos...">
 *   <ProductList products={products} />
 * </LoadingOverlay>
 */
export const LoadingOverlay = ({ loading, children, message = '' }) => {
    if (loading) {
        return <LoadingSpinner message={message} minHeight={100} />;
    }
    return <>{children}</>;
};

/**
 * Componente de skeleton loader para tabelas
 * 
 * @param {Object} props
 * @param {number} props.rows - Número de linhas do skeleton (padrão: 5)
 * @param {number} props.columns - Número de colunas (padrão: 4)
 * 
 * @example
 * {isLoading ? <TableSkeleton rows={10} /> : <DataTable data={data} />}
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
    return (
        <Box sx={{ width: '100%' }}>
            {[...Array(rows)].map((_, rowIndex) => (
                <Box
                    key={rowIndex}
                    display="flex"
                    gap={2}
                    mb={1}
                    sx={{
                        animation: 'pulse 1.5s ease-in-out infinite',
                        '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.5 },
                        },
                    }}
                >
                    {[...Array(columns)].map((_, colIndex) => (
                        <Box
                            key={colIndex}
                            sx={{
                                flex: 1,
                                height: 40,
                                backgroundColor: 'action.hover',
                                borderRadius: 1,
                            }}
                        />
                    ))}
                </Box>
            ))}
        </Box>
    );
};

/**
 * Hook personalizado para gerenciar estado de loading
 * 
 * @param {boolean} initialState - Estado inicial (padrão: false)
 * @returns {Object} Objeto com estado e funções de controle
 * 
 * @example
 * const loading = useLoading();
 * 
 * const fetchData = async () => {
 *   loading.start();
 *   try {
 *     const data = await api.getData();
 *     setData(data);
 *   } finally {
 *     loading.stop();
 *   }
 * };
 * 
 * {loading.isLoading && <LoadingSpinner />}
 */
export const useLoading = (initialState = false) => {
    const [isLoading, setIsLoading] = React.useState(initialState);

    const start = React.useCallback(() => setIsLoading(true), []);
    const stop = React.useCallback(() => setIsLoading(false), []);
    const toggle = React.useCallback(() => setIsLoading((prev) => !prev), []);

    return {
        isLoading,
        start,
        stop,
        toggle,
        setIsLoading,
    };
};

/**
 * HOC para adicionar loading automático a componentes async
 * 
 * @param {ReactComponent} Component - Componente a ser envolvido
 * @param {Object} loadingProps - Props para o LoadingSpinner
 * @returns {ReactComponent} Componente com loading
 * 
 * @example
 * const ProductListWithLoading = withLoading(ProductList, { message: 'Carregando produtos...' });
 */
export const withLoading = (Component, loadingProps = {}) => {
    return function WithLoadingComponent({ isLoading, ...props }) {
        if (isLoading) {
            return <LoadingSpinner {...loadingProps} />;
        }
        return <Component {...props} />;
    };
};

/**
 * Componente de loading para botões
 * 
 * @param {Object} props
 * @param {boolean} props.loading - Se está carregando
 * @param {ReactNode} props.children - Conteúdo do botão
 * @param {string} props.loadingText - Texto durante loading (opcional)
 * 
 * @example
 * <Button>
 *   <ButtonLoading loading={saving} loadingText="Salvando...">
 *     Salvar
 *   </ButtonLoading>
 * </Button>
 */
export const ButtonLoading = ({ loading, children, loadingText = '' }) => {
    if (loading) {
        return (
            <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} color="inherit" />
                {loadingText || children}
            </Box>
        );
    }
    return <>{children}</>;
};
