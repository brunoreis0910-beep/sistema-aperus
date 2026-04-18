import React from 'react';
import { Box, Paper, Typography, Chip, Avatar } from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

/**
 * Componente de Badge/Status moderno e consistente
 * 
 * @param {Object} props
 * @param {string} props.status - Status: "success", "warning", "error", "info", "neutral"
 * @param {string} props.label - Texto do badge
 * @param {string} props.variant - Variante: "filled", "outlined", "dot"
 * @param {string} props.size - Tamanho: "small", "medium", "large"
 * 
 * @example
 * <StatusBadge status="success" label="Ativo" />
 * <StatusBadge status="warning" label="Pendente" variant="outlined" />
 * <StatusBadge status="error" label="Vencido" variant="dot" />
 */
export const StatusBadge = ({
    status = 'neutral',
    label,
    variant = 'filled',
    size = 'medium',
    icon = false,
}) => {
    const colors = {
        success: {
            bg: '#E3FCEF',
            text: '#006644',
            border: '#79F2C0',
            icon: '#00875A',
        },
        warning: {
            bg: '#FFFAE6',
            text: '#974F0C',
            border: '#FFC400',
            icon: '#FF991F',
        },
        error: {
            bg: '#FFEBE6',
            text: '#BF2600',
            border: '#FF8F73',
            icon: '#DE350B',
        },
        info: {
            bg: '#DEEBFF',
            text: '#0747A6',
            border: '#4C9AFF',
            icon: '#0065FF',
        },
        neutral: {
            bg: '#F4F5F7',
            text: '#5E6C84',
            border: '#DFE1E6',
            icon: '#5E6C84',
        },
    };

    const icons = {
        success: <CheckIcon sx={{ fontSize: 16 }} />,
        warning: <WarningIcon sx={{ fontSize: 16 }} />,
        error: <ErrorIcon sx={{ fontSize: 16 }} />,
        info: <InfoIcon sx={{ fontSize: 16 }} />,
        neutral: null,
    };

    const color = colors[status] || colors.neutral;

    if (variant === 'dot') {
        return (
            <Box display="flex" alignItems="center" gap={1}>
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: color.icon,
                    }}
                />
                <Typography variant={size === 'small' ? 'caption' : 'body2'} color={color.text}>
                    {label}
                </Typography>
            </Box>
        );
    }

    return (
        <Chip
            label={label}
            icon={icon ? icons[status] : undefined}
            size={size}
            sx={{
                backgroundColor: variant === 'outlined' ? 'transparent' : color.bg,
                color: color.text,
                border: variant === 'outlined' ? `2px solid ${color.border}` : 'none',
                fontWeight: 500,
                '& .MuiChip-icon': {
                    color: color.icon,
                },
            }}
        />
    );
};

/**
 * Card de métrica/KPI moderno
 * 
 * @example
 * <MetricCard
 *   title="Vendas do Mês"
 *   value="R$ 45.320,00"
 *   trend={12.5}
 *   icon={<MoneyIcon />}
 *   color="success"
 * />
 */
export const MetricCard = ({
    title,
    value,
    subtitle,
    trend,
    icon,
    color = 'primary',
}) => {
    const colors = {
        primary: '#0052CC',
        success: '#00875A',
        warning: '#FF991F',
        error: '#DE350B',
        info: '#0065FF',
        neutral: '#5E6C84',
    };

    const bgColors = {
        primary: '#DEEBFF',
        success: '#E3FCEF',
        warning: '#FFFAE6',
        error: '#FFEBE6',
        info: '#DEEBFF',
        neutral: '#F4F5F7',
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                border: '1px solid #DFE1E6',
                borderRadius: 3,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    borderColor: colors[color],
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
                    transform: 'translateY(-2px)',
                },
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                {icon && (
                    <Avatar
                        sx={{
                            backgroundColor: bgColors[color],
                            color: colors[color],
                            width: 48,
                            height: 48,
                        }}
                    >
                        {icon}
                    </Avatar>
                )}
                {trend !== undefined && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                        {trend > 0 ? (
                            <TrendingUpIcon sx={{ fontSize: 20, color: '#00875A' }} />
                        ) : (
                            <TrendingDownIcon sx={{ fontSize: 20, color: '#DE350B' }} />
                        )}
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            color={trend > 0 ? '#00875A' : '#DE350B'}
                        >
                            {Math.abs(trend)}%
                        </Typography>
                    </Box>
                )}
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
            </Typography>

            <Typography variant="h4" fontWeight={700} color={colors[color]} mb={0.5}>
                {value}
            </Typography>

            {subtitle && (
                <Typography variant="caption" color="text.secondary">
                    {subtitle}
                </Typography>
            )}
        </Paper>
    );
};

/**
 * Header de página padronizado
 * 
 * @example
 * <PageHeader
 *   title="Clientes"
 *   subtitle="Gerencie seus clientes cadastrados"
 *   action={<Button>Novo Cliente</Button>}
 * />
 */
export const PageHeader = ({ title, subtitle, breadcrumbs, action, tabs }) => {
    return (
        <Box mb={3}>
            {breadcrumbs && (
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    {breadcrumbs}
                </Typography>
            )}

            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={2}
                mb={subtitle || tabs ? 2 : 0}
            >
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom={!!subtitle}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>

                {action && <Box>{action}</Box>}
            </Box>

            {tabs && <Box mt={2}>{tabs}</Box>}
        </Box>
    );
};

/**
 * Empty state ilustrado
 * 
 * @example
 * <EmptyState
 *   icon={<InboxIcon />}
 *   title="Nenhum cliente encontrado"
 *   message="Comece adicionando seu primeiro cliente"
 *   action={<Button>Adicionar Cliente</Button>}
 * />
 */
export const EmptyState = ({ icon, title, message, action }) => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={8}
            px={3}
            textAlign="center"
        >
            {icon && (
                <Box
                    sx={{
                        fontSize: 80,
                        color: '#DFE1E6',
                        mb: 2,
                        '& > svg': {
                            fontSize: 'inherit',
                        },
                    }}
                >
                    {icon}
                </Box>
            )}

            <Typography variant="h6" fontWeight={600} gutterBottom>
                {title}
            </Typography>

            {message && (
                <Typography variant="body2" color="text.secondary" mb={3} maxWidth={400}>
                    {message}
                </Typography>
            )}

            {action && <Box mt={2}>{action}</Box>}
        </Box>
    );
};

/**
 * Seção com título e divider
 * 
 * @example
 * <Section title="Informações Pessoais">
 *   <TextField label="Nome" />
 *   <TextField label="Email" />
 * </Section>
 */
export const Section = ({ title, subtitle, action, children, noDivider = false }) => {
    return (
        <Box mb={4}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                pb={noDivider ? 0 : 1.5}
                borderBottom={noDivider ? 'none' : '2px solid #DFE1E6'}
            >
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                {action && <Box>{action}</Box>}
            </Box>
            {children}
        </Box>
    );
};

export default {
    StatusBadge,
    MetricCard,
    PageHeader,
    EmptyState,
    Section,
};
