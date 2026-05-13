import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Box,
  Grid,
  Tooltip,
  Typography,
  FormLabel
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { useAuth } from '../context/AuthContext';

export default function ClienteDescontosTab({ cliente, onChange }) {
  const [grupos, setGrupos] = useState([]);
  const [selectedGrupos, setSelectedGrupos] = useState([]);
  const { axiosInstance } = useAuth();

  useEffect(() => {
    const carregarGrupos = async () => {
      try {
        const res = await axiosInstance.get('/grupos-produto/');
        setGrupos(res.data.results || res.data);
        if (cliente?.grupos_excecao?.length > 0) {
          // Se a API retornar objetos populados, pegue o ID. Se já for array de IDs, use-o.
          const ids = cliente.grupos_excecao.map(g => typeof g === 'object' ? g.id_grupo : g);
          setSelectedGrupos(ids);
        }
      } catch (err) {
        console.error('Erro ao carregar grupos de produtos:', err);
      }
    };
    carregarGrupos();
  }, [cliente, axiosInstance]);

  const handleDescontoChange = (field, value) => {
    onChange({
      ...cliente,
      [field]: value
    });
  };

  const handleGrupoToggle = (grupoId) => {
    const updated = selectedGrupos.includes(grupoId)
      ? selectedGrupos.filter(id => id !== grupoId)
      : [...selectedGrupos, grupoId];

    setSelectedGrupos(updated);
    onChange({
      ...cliente,
      grupos_excecao: updated
    });
  };

  return (
    <Card sx={{ mt: 3, boxShadow: 2 }}>
      <CardHeader
        title="⚡ Configuração de Descontos Inteligentes"
        subheader="Defina regras de desconto automáticas exclusivas para este cliente."
        sx={{ bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}
      />
      <CardContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Select
              fullWidth
              label="Tipo de Desconto"
              value={cliente?.tipo_desconto || 'PERCENTUAL'}
              onChange={(e) => handleDescontoChange('tipo_desconto', e.target.value)}
            >
              <MenuItem value="FIXO">Fixo (R$)</MenuItem>
              <MenuItem value="PERCENTUAL">Percentual (%)</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={`Valor do Desconto (${cliente?.tipo_desconto === 'FIXO' ? 'R$' : '%'})`}
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={cliente?.valor_desconto || 0}
              onChange={(e) => handleDescontoChange('valor_desconto', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Tooltip title="Percentual máximo de ajuste permitido para arredondamento (ex: 0.5%)">
              <TextField
                fullWidth
                label="Margem de Arredondamento (%)"
                type="number"
                inputProps={{ step: '0.01', min: '0', max: '5' }}
                value={cliente?.percentual_arredondamento || 0}
                onChange={(e) => handleDescontoChange('percentual_arredondamento', e.target.value)}
                helperText="Permite pequenos ajustes para arredondar o preço (Safe Margin)"
                InputProps={{
                  endAdornment: <InfoIcon sx={{ ml: 1, cursor: 'help', color: 'text.secondary' }} />
                }}
              />
            </Tooltip>
          </Grid>

          <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={cliente?.priorizar_desconto_cliente || false}
                  onChange={(e) => handleDescontoChange('priorizar_desconto_cliente', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight="medium">Travar Desconto na Venda</Typography>
                  <Typography variant="caption" color="textSecondary">
                    O vendedor não poderá alterar este desconto.
                  </Typography>
                </Box>
              }
            />
          </Grid>

          <Grid item xs={12}>
            <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
              🚫 Grupos de Produtos em Exceção (SEM desconto):
            </FormLabel>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
              {grupos.map(grupo => {
                const isSelected = selectedGrupos.includes(grupo.id_grupo);
                return (
                  <Tooltip key={grupo.id_grupo} title={isSelected ? `Remover exceção para ${grupo.nome_grupo}` : `Adicionar ${grupo.nome_grupo} às exceções`}>
                    <Chip
                      label={grupo.nome_grupo}
                      onClick={() => handleGrupoToggle(grupo.id_grupo)}
                      variant={isSelected ? 'filled' : 'outlined'}
                      color={isSelected ? 'error' : 'default'}
                      icon={isSelected ? <span style={{ paddingLeft: '8px' }}>✓</span> : undefined}
                      sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}
                    />
                  </Tooltip>
                );
              })}
              {grupos.length === 0 && <Typography variant="body2" color="textSecondary">Nenhum grupo cadastrado.</Typography>}
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Clique nos grupos acima. Os produtos pertencentes aos grupos em vermelho <b>não receberão</b> o desconto automático.
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}