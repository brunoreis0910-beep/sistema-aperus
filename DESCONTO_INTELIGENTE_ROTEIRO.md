# 🚀 Roteiro de Implementação: Módulo de Descontos Inteligentes para Aperus

## 📋 Status da Implementação

### ✅ Fase 1: Banco de Dados (Django) - **CONCLUÍDA**

**Campos adicionados ao modelo `Cliente`:**

```python
# Tipos de desconto
tipo_desconto = CharField(
    choices=[('FIXO', 'Fixo (R$)'), ('PERCENTUAL', 'Percentual (%)')],
    default='PERCENTUAL'
)

# Valor do desconto
valor_desconto = DecimalField(max_digits=10, decimal_places=2, default=0.00)

# Margem de arredondamento (Safe Margin)
percentual_arredondamento = DecimalField(max_digits=5, decimal_places=2, default=0.00)

# Exceções por grupo
grupos_excecao = ManyToManyField('GrupoProduto', related_name='clientes_com_excecao')

# Prioridade do desconto
priorizar_desconto_cliente = BooleanField(default=False)
```

**Próximo passo:** Executar migração
```bash
python manage.py migrate api
```

---

### ✅ Fase 2: Lógica de Negócio (Django Backend) - **CONCLUÍDA**

**Arquivo: `api/logic/descontos.py`**

Funções disponíveis:

1. **`calcular_preco_final(produto, cliente, valor_tabela)`**
   - Calcula o preço final respeitando hierarquia de regras
   - Retorna: `{preco, desconto_aplicado, desconto_percentual, travado, motivo, grupo_excecao}`

2. **`validar_desconto(cliente, produto, desconto_proposto)`**
   - Valida se um desconto proposto é permitido
   - Retorna: `{permitido, mensagem, desconto_maximo, requer_aprovacao}`

3. **`gerar_resumo_desconto_cliente(cliente)`**
   - Gera resumo legível das regras para exibição na UI
   - Retorna: Dicionário com descrição formatada

**Hierarquia de aplicação:**
1. **Exceção por Grupo:** Se produto está em grupo de exceção do cliente → sem desconto
2. **Desconto do Cliente:** Se cliente tem desconto configurado → aplica desconto
3. **Safe Margin:** Se margen de arredondamento permitida → arredonda para valor mais próximo
4. **Fallback:** Sem regra aplicada → retorna preço de tabela

---

### ✅ Fase 3: API REST (Django Endpoints) - **CONCLUÍDA**

**Arquivo: `api/views_descontos.py`**

#### Endpoint 1: Simular Desconto
```
POST /api/descontos/simular/
Authorization: Bearer {token}

Body:
{
    "id_cliente": 123,
    "id_produto": 456,
    "valor_tabela": 99.90
}

Response (200 OK):
{
    "success": true,
    "preco": 89.91,
    "desconto_aplicado": 9.99,
    "desconto_percentual": 10.0,
    "travado": true,
    "motivo": "Desconto de Cliente: PERCENTUAL - 10",
    "mensagem_tooltip": "Desconto de 10% aplicado automaticamente...",
    "cliente_nome": "Empresa XYZ",
    "produto_nome": "Produto ABC"
}
```

#### Endpoint 2: Validar Desconto Proposto
```
POST /api/descontos/validar/
Authorization: Bearer {token}

Body:
{
    "id_cliente": 123,
    "id_produto": 456,
    "desconto_proposto": 15.50
}

Response (200 OK):
{
    "success": true,
    "permitido": true,
    "requer_aprovacao": true,
    "mensagem": "Atenção: Desconto proposto (R$ 15.50) excede o automático (R$ 10.00). Requer aprovação",
    "desconto_automatico": 10.0,
    "desconto_proposto": 15.5
}
```

#### Endpoint 3: Obter Config do Cliente
```
GET /api/descontos/cliente/{cliente_id}/
Authorization: Bearer {token}

Response (200 OK):
{
    "success": true,
    "cliente_id": 123,
    "cliente_nome": "Empresa XYZ",
    "tem_desconto": true,
    "tipo": "PERCENTUAL",
    "valor": "10.00",
    "prioridade": true,
    "grupos_excecao": ["Ferramentas", "Eletrônicos"],
    "margem_arredondamento": "0.50",
    "descricao": "Desconto de 10% para este cliente. Excluídos: Ferramentas, Eletrônicos (Prioridade: Bloqueia alterações)"
}
```

#### Endpoint 4: Listar Clientes com Desconto
```
GET /api/descontos/clientes-com-desconto/?ativo=true&tipo_desconto=PERCENTUAL
Authorization: Bearer {token}

Response (200 OK):
{
    "success": true,
    "total": 5,
    "clientes": [
        {
            "id_cliente": 123,
            "nome": "Empresa XYZ",
            "tipo_desconto": "PERCENTUAL",
            "valor_desconto": "10.00",
            "prioridade": true,
            "grupos_excecao_count": 2,
            "ativo": true
        }
    ]
}
```

---

## 🎨 Fase 4: Interface do Usuário (React Frontend) - **INSTRUÇÕES**

### 4.1 Aba "Descontos" no Cadastro de Clientes

**Localização proposta:** `frontend/src/pages/ClienteCadastroPage.jsx`

**Componente sugerido:**

```jsx
// ClienteDescontosTab.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader,
  TextField, Select, MenuItem, Switch, FormControlLabel,
  Button, Alert, CircularProgress, Chip,
  FormGroup, FormLabel, Box, Grid, Tooltip, Typography
} from '@mui/material';
import { axiosInstance } from '../services/api'; // seu axios configurado
import InfoIcon from '@mui/icons-material/Info';

export function ClienteDescontosTab({ cliente, onChange }) {
  const [loading, setLoading] = useState(false);
  const [grupos, setGrupos] = useState([]);
  const [selectedGrupos, setSelectedGrupos] = useState([]);

  useEffect(() => {
    // Carregar grupos de produtos
    const carregarGrupos = async () => {
      try {
        const res = await axiosInstance.get('/api/grupos-produto/');
        setGrupos(res.data.results || res.data);
        // Pre-selecionar grupos de exceção
        if (cliente?.grupos_excecao?.length > 0) {
          setSelectedGrupos(cliente.grupos_excecao);
        }
      } catch (err) {
        console.error('Erro ao carregar grupos:', err);
      }
    };
    
    carregarGrupos();
  }, [cliente]);

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
    <Card sx={{ mt: 3 }}>
      <CardHeader 
        title="⚡ Configuração de Descontos"
        subheader="Regras de desconto inteligente para este cliente"
      />
      
      <CardContent>
        <Grid container spacing={3}>
          
          {/* Tipo de Desconto */}
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

          {/* Valor do Desconto */}
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

          {/* Margem de Arredondamento */}
          <Grid item xs={12} sm={6}>
            <Tooltip title="Percentual máximo de ajuste permitido para arredondamento (ex: 0.5%)">
              <TextField
                fullWidth
                label="Margem de Arredondamento (%)"
                type="number"
                inputProps={{ step: '0.01', min: '0', max: '5' }}
                value={cliente?.percentual_arredondamento || 0}
                onChange={(e) => handleDescontoChange('percentual_arredondamento', e.target.value)}
                helperText="Permite pequenos ajustes (Safe Margin)"
                InputProps={{
                  endAdornment: <InfoIcon sx={{ ml: 1, cursor: 'help' }} />
                }}
              />
            </Tooltip>
          </Grid>

          {/* Prioridade */}
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={cliente?.priorizar_desconto_cliente || false}
                  onChange={(e) => handleDescontoChange('priorizar_desconto_cliente', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Bloquear alterações em vendas</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Quando ativo, o vendedor não poderá mudar o desconto
                  </Typography>
                </Box>
              }
            />
          </Grid>

          {/* Grupos de Exceção */}
          <Grid item xs={12}>
            <FormLabel>Grupos de Produtos em Exceção (SEM desconto):</FormLabel>
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {grupos.map(grupo => (
                <Tooltip key={grupo.id_grupo} title={`Clique para incluir/excluir de ${grupo.nome_grupo}`}>
                  <Chip
                    label={grupo.nome_grupo}
                    onClick={() => handleGrupoToggle(grupo.id_grupo)}
                    variant={selectedGrupos.includes(grupo.id_grupo) ? 'filled' : 'outlined'}
                    color={selectedGrupos.includes(grupo.id_grupo) ? 'error' : 'default'}
                    icon={selectedGrupos.includes(grupo.id_grupo) ? '✓' : undefined}
                  />
                </Tooltip>
              ))}
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
              Produtos destes grupos não receberão o desconto automático
            </Typography>
          </Grid>

        </Grid>
      </CardContent>
    </Card>
  );
}
```

---

### 4.2 Componente de Venda Dinâmico (VendaRápida)

**Localização proposta:** `frontend/src/components/DescontoItem.jsx`

**Integração no arquivo:** `frontend/src/pages/VendaRapidaPage.jsx`

```jsx
// Hook customizado para cálculo de desconto
const useCalculoDesconto = (cliente, produto, valorTabela) => {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const { axiosInstance } = useAuth();

  useEffect(() => {
    if (cliente?.id_cliente && produto?.id_produto && valorTabela) {
      setLoading(true);
      
      axiosInstance.post('/api/descontos/simular/', {
        id_cliente: cliente.id_cliente,
        id_produto: produto.id_produto,
        valor_tabela: parseFloat(valorTabela)
      })
      .then(res => setResultado(res.data))
      .catch(err => {
        console.error('Erro ao calcular desconto:', err);
        setResultado(null);
      })
      .finally(() => setLoading(false));
    }
  }, [cliente?.id_cliente, produto?.id_produto, valorTabela]);

  return { resultado, loading };
};

// Uso no componente de venda:
function AdicionarItemVenda() {
  const { axiosInstance } = useAuth();
  const { resultado: descontoCalc, loading: loadingDesc } = useCalculoDesconto(
    cliente, 
    produtoSelecionado, 
    precoBase
  );

  return (
    <Box>
      {/* Campo de Preço com Desconto */}
      <TextField
        label="Preço Unitário"
        value={descontoCalc?.preco || precoBase}
        disabled={descontoCalc?.travado || loadingDesc}
        helperText={descontoCalc?.mensagem_tooltip}
        InputProps={{
          startAdornment: descontoCalc?.travado && <LockIcon sx={{ mr: 1 }} />
        }}
      />

      {/* Campo de Desconto Travado */}
      {descontoCalc?.travado && (
        <Tooltip title={descontoCalc.mensagem_tooltip}>
          <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 1 }}>
            Desconto automático: R$ {descontoCalc.desconto_aplicado.toFixed(2)}
            {descontoCalc.desconto_percentual > 0 && ` (${descontoCalc.desconto_percentual}%)`}
          </Alert>
        </Tooltip>
      )}

      {/* Campo de Desconto Editável */}
      {!descontoCalc?.travado && (
        <TextField
          label="Desconto (R$)"
          type="number"
          value={desconto}
          onChange={(e) => {
            const novoDesconto = parseFloat(e.target.value);
            
            // Validar se necessita aprovação
            axiosInstance.post('/api/descontos/validar/', {
              id_cliente: cliente.id_cliente,
              id_produto: produtoSelecionado.id_produto,
              desconto_proposto: novoDesconto
            })
            .then(res => {
              if (!res.data.permitido) {
                setError(`Desconto não permitido: ${res.data.mensagem}`);
              } else if (res.data.requer_aprovacao) {
                // Mostrar modal de aprovação
                abrirModalAprovacao(res.data);
              }
              setDesconto(novoDesconto);
            });
          }}
        />
      )}
    </Box>
  );
}
```

---

### 4.3 Visualização de Desconto na Aba do Cliente

**Adicionar em `ClienteCadastroPage.jsx`:**

```jsx
useEffect(() => {
  if (cliente?.id_cliente) {
    // Carregar config de desconto do cliente
    axiosInstance.get(`/api/descontos/cliente/${cliente.id_cliente}/`)
      .then(res => {
        setConfigDesconto(res.data);
      })
      .catch(err => console.error('Erro ao carregar desconto:', err));
  }
}, [cliente?.id_cliente]);

// Exibir badge na aba:
{configDesconto?.tem_desconto && (
  <Chip 
    label={`${configDesconto.valor}${configDesconto.tipo === 'PERCENTUAL' ? '%' : ' R$'}`}
    color="success"
    size="small"
  />
)}
```

---

## 🔌 Guia de Integração React

### Passo 1: Adicionar Endpoints ao seu Cliente Axios

```javascript
// services/api.js
export const descontosAPI = {
  simular: (clienteId, produtoId, valorTabela) =>
    axiosInstance.post('/api/descontos/simular/', {
      id_cliente: clienteId,
      id_produto: produtoId,
      valor_tabela: valorTabela
    }),
  
  validar: (clienteId, produtoId, descontoProposto) =>
    axiosInstance.post('/api/descontos/validar/', {
      id_cliente: clienteId,
      id_produto: produtoId,
      desconto_proposto: descontoProposto
    }),
  
  obterConfig: (clienteId) =>
    axiosInstance.get(`/api/descontos/cliente/${clienteId}/`),
  
  listarComDesconto: (filtros = {}) =>
    axiosInstance.get('/api/descontos/clientes-com-desconto/', { params: filtros })
};
```

### Passo 2: Hook Customizado para Desconto

```javascript
// hooks/useDesconto.js
import { useState, useEffect } from 'react';
import { descontosAPI } from '../services/api';

export function useDesconto(clienteId, produtoId, valorTabela) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clienteId || !produtoId || !valorTabela) return;

    const calcular = async () => {
      setLoading(true);
      try {
        const res = await descontosAPI.simular(clienteId, produtoId, valorTabela);
        setData(res.data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    calcular();
  }, [clienteId, produtoId, valorTabela]);

  return { data, loading, error };
}
```

### Passo 3: Usar no Componente de Venda

```jsx
import { useDesconto } from '../hooks/useDesconto';

function VendaItem() {
  const { data: desconto, loading } = useDesconto(
    cliente?.id_cliente,
    produto?.id_produto,
    precoTabela
  );

  return (
    <>
      <TextField
        label="Preço"
        value={desconto?.preco || precoTabela}
        disabled={desconto?.travado}
        variant="outlined"
        fullWidth
      />
      
      {desconto?.travado && (
        <Tooltip title={desconto.mensagem_tooltip}>
          <Typography variant="caption" color="info.main">
            🔒 Campo travado - Desconto automático aplicado
          </Typography>
        </Tooltip>
      )}
    </>
  );
}
```

---

## 📊 Checklist de Implementação

### Backend (Django)
- [x] Adicionar campos ao modelo Cliente
- [x] Criar lógica de cálculo em `logic/descontos.py`
- [x] Criar endpoints em `views_descontos.py`
- [x] Registrar URLs em `urls.py`
- [ ] Executar migração: `python manage.py migrate`
- [ ] Testar endpoints com Postman/Insomnia

### Frontend (React)
- [ ] Criar componente `ClienteDescontosTab`
- [ ] Adicionar hook `useDesconto`
- [ ] Integrar em `VendaRapidaPage`
- [ ] Integrar em `ClienteCadastroPage`
- [ ] Adicionar validações de desconto proposto
- [ ] Testar com cliente de teste

### Configuração Admin
- [ ] Criar super-usuário Django
- [ ] Acessar Django Admin para testar modelo
- [ ] Configurar alguns clientes com descontos
- [ ] Validar cálculos manualmente

---

## 💡 Dicas Importantes

### Safe Margin (Arredondamento Seguro)
A margem de arredondamento permite que preços como `99.92` sejam arredondados para `99.90` se o limite permitir. Isso melhora a experiência mas mantém a segurança.

### Hierarquia de Regras
1. **Maior prioridade:** Grupo em exceção (sem desconto)
2. **Prioridade média:** Desconto do cliente
3. **Prioridade baixa:** Operação padrão / Desconto do vendedor

### Performance
- Cache de config do cliente na sessão React
- Usar debounce ao calcular desconto dinamicamente
- Prefetch de dados ao selecionar cliente

### Segurança
- Todos os endpoints requerem autenticação
- Backend valida desconto proposto
- Log de todas as alterações de desconto

---

## 🧪 Testes Recomendados

### Backend
```bash
# Teste via curl/Postman
POST http://localhost:8005/api/descontos/simular/
{
  "id_cliente": 1,
  "id_produto": 1,
  "valor_tabela": 100.00
}
```

### Frontend
- Selecionar cliente com desconto → preço deve atualizar
- Selecionar cliente sem desconto → sem alteração
- Campo travado quando `travado: true`
- Tooltip exibindo motivo da regra

---

## 📞 Suporte

Para dúvidas ou melhorias sugeridas:
1. Verificar logs em `django/console` (backend)
2. Verificar console do navegador (frontend)
3. Validar banco de dados: `SELECT * FROM clientes WHERE valor_desconto > 0;`

---

**Versão:** 1.0  
**Última atualização:** 12 de maio de 2026  
**Status:** Implementação em progresso (Fase 3/4)
