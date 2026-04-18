import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

/**
 * Componente FilterDrawer - Sidebar lateral com filtros customizáveis
 * 
 * @param {boolean} open - Controla se o drawer está aberto
 * @param {function} onClose - Função chamada ao fechar o drawer
 * @param {function} onApplyFilters - Função chamada ao aplicar filtros
 * @param {object} filters - Objeto com valores atuais dos filtros
 * @param {function} onFilterChange - Função para atualizar valores dos filtros
 * @param {React.ReactNode} children - Filtros customizados adicionais
 * @param {string} title - Título do painel de filtros
 */
const FilterDrawer = ({
  open,
  onClose,
  onApplyFilters,
  filters,
  onFilterChange,
  children,
  title = 'Filtros'
}) => {
  const handleClearFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        search: '',
        dataInicio: '',
        dataFim: '',
        limit: 25
      });
    }
  };

  const activeFiltersCount = () => {
    if (!filters) return 0;
    let count = 0;
    if (filters.search) count++;
    if (filters.dataInicio) count++;
    if (filters.dataFim) count++;
    return count;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          p: 2
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color="primary" />
          <Typography variant="h6">{title}</Typography>
          {activeFiltersCount() > 0 && (
            <Chip 
              label={activeFiltersCount()} 
              size="small" 
              color="primary" 
            />
          )}
        </Box>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Filtros Padrão */}
      <Stack spacing={2}>
        {/* Pesquisa */}
        <TextField
          fullWidth
          size="small"
          label="Pesquisar"
          placeholder="Digite para buscar..."
          value={filters?.search || ''}
          onChange={(e) => onFilterChange && onFilterChange({ ...filters, search: e.target.value })}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />

        {/* Período */}
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Período
          </Typography>
          <Stack spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Data Início"
              value={filters?.dataInicio || ''}
              onChange={(e) => onFilterChange && onFilterChange({ ...filters, dataInicio: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Data Fim"
              value={filters?.dataFim || ''}
              onChange={(e) => onFilterChange && onFilterChange({ ...filters, dataFim: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </Box>

        {/* Quantidade de Registros */}
        <FormControl fullWidth size="small">
          <InputLabel>Registros por página</InputLabel>
          <Select
            value={filters?.limit || 25}
            onChange={(e) => onFilterChange && onFilterChange({ ...filters, limit: e.target.value })}
            label="Registros por página"
          >
            <MenuItem value={10}>10 registros</MenuItem>
            <MenuItem value={25}>25 registros</MenuItem>
            <MenuItem value={50}>50 registros</MenuItem>
            <MenuItem value={100}>100 registros</MenuItem>
            <MenuItem value={999999}>Todos os registros</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 1 }} />

        {/* Filtros Customizados */}
        {children}
      </Stack>

      {/* Footer - Botões de Ação */}
      <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.paper', pt: 2, mt: 'auto' }}>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<FilterIcon />}
            onClick={() => {
              if (onApplyFilters) onApplyFilters();
              onClose();
            }}
          >
            Aplicar Filtros
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
          >
            Limpar Filtros
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default FilterDrawer;
