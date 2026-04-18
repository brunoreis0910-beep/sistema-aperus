# Exemplos de Uso - API de Cadastro de Clientes

Este arquivo contém exemplos práticos de como usar a API.

## 📋 Índice

1. [Escritórios de Contabilidade](#escritórios-de-contabilidade)
2. [Clientes](#clientes)
3. [Buscas e Filtros](#buscas-e-filtros)
4. [Relatórios](#relatórios)

---

## Escritórios de Contabilidade

### Criar um Escritório

```json
POST /cadastro/api/escritorios/

{
    "cnpj": "12.345.678/0001-90",
    "razao_social": "Contabilidade Exemplo Ltda",
    "telefone": "(11) 98765-4321",
    "contador": "João da Silva",
    "email": "contato@exemplocontabil.com.br",
    "ativo": true
}
```

### Listar Todos os Escritórios

```
GET /cadastro/api/escritorios/
```

### Buscar Escritório Específico

```
GET /cadastro/api/escritorios/1/
```

### Atualizar Escritório

```json
PATCH /cadastro/api/escritorios/1/

{
    "telefone": "(11) 99999-8888",
    "email": "novoemail@exemplocontabil.com.br"
}
```

### Listar Clientes de um Escritório

```
GET /cadastro/api/escritorios/1/clientes/
```

### Ativar/Desativar Escritório

```
POST /cadastro/api/escritorios/1/ativar/
POST /cadastro/api/escritorios/1/desativar/
```

---

## Clientes

### Criar um Cliente Completo

```json
POST /cadastro/api/clientes/

{
    "razao_social": "Comércio de Alimentos ABC Ltda",
    "nome_fantasia": "Supermercado ABC",
    "cnpj": "98.765.432/0001-10",
    "inscricao_estadual": "123.456.789.012",
    "endereco": "Avenida Principal",
    "numero": "1000",
    "complemento": "Loja 1",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567",
    "proprietario": "Maria Santos Costa",
    "data_nascimento": "1985-03-15",
    "cpf": "123.456.789-00",
    "telefone": "(11) 91234-5678",
    "email": "maria@supermercadoabc.com.br",
    "regime_tributario": "SIMPLES",
    "escritorio": 1,
    "observacoes": "Cliente desde 2020",
    "ativo": true
}
```

### Cliente no Lucro Real

```json
POST /cadastro/api/clientes/

{
    "razao_social": "Indústria de Máquinas XYZ S.A.",
    "nome_fantasia": "XYZ Máquinas",
    "cnpj": "11.222.333/0001-44",
    "inscricao_estadual": "987.654.321.098",
    "endereco": "Rua Industrial",
    "numero": "500",
    "bairro": "Distrito Industrial",
    "cidade": "Guarulhos",
    "estado": "SP",
    "cep": "07000-000",
    "proprietario": "Carlos Eduardo Souza",
    "data_nascimento": "1975-08-22",
    "cpf": "987.654.321-00",
    "telefone": "(11) 94567-8901",
    "email": "carlos@xyzmaquinas.com.br",
    "regime_tributario": "LUCRO_REAL",
    "escritorio": 1,
    "ativo": true
}
```

### MEI (Microempreendedor Individual)

```json
POST /cadastro/api/clientes/

{
    "razao_social": "José Carlos ME",
    "nome_fantasia": "Barbearia do Zé",
    "cnpj": "33.444.555/0001-66",
    "endereco": "Rua das Palmeiras",
    "numero": "45",
    "bairro": "Vila Nova",
    "cidade": "Osasco",
    "estado": "SP",
    "cep": "06000-000",
    "proprietario": "José Carlos Oliveira",
    "data_nascimento": "1990-12-05",
    "cpf": "456.789.012-34",
    "telefone": "(11) 96789-0123",
    "email": "ze@barbearia.com",
    "regime_tributario": "MEI",
    "escritorio": 1,
    "ativo": true
}
```

### Listar Todos os Clientes

```
GET /cadastro/api/clientes/
```

### Buscar Cliente Específico

```
GET /cadastro/api/clientes/1/
```

**Resposta:**
```json
{
    "id": 1,
    "razao_social": "Comércio de Alimentos ABC Ltda",
    "nome_fantasia": "Supermercado ABC",
    "cnpj": "98.765.432/0001-10",
    "inscricao_estadual": "123.456.789.012",
    "endereco": "Avenida Principal",
    "numero": "1000",
    "complemento": "Loja 1",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567",
    "endereco_completo": "Avenida Principal, 1000, Loja 1 - Centro, São Paulo/SP - CEP: 01234-567",
    "proprietario": "Maria Santos Costa",
    "data_nascimento": "1985-03-15",
    "cpf": "123.456.789-00",
    "telefone": "(11) 91234-5678",
    "email": "maria@supermercadoabc.com.br",
    "regime_tributario": "SIMPLES",
    "regime_tributario_display": "Simples Nacional",
    "escritorio": 1,
    "escritorio_detalhes": {
        "id": 1,
        "cnpj": "12.345.678/0001-90",
        "razao_social": "Contabilidade Exemplo Ltda",
        "telefone": "(11) 98765-4321",
        "contador": "João da Silva",
        "email": "contato@exemplocontabil.com.br",
        "ativo": true
    },
    "observacoes": "Cliente desde 2020",
    "ativo": true,
    "criado_em": "2025-12-13T10:30:00Z",
    "atualizado_em": "2025-12-13T10:30:00Z"
}
```

### Atualizar Cliente

```json
PATCH /cadastro/api/clientes/1/

{
    "telefone": "(11) 99999-9999",
    "email": "novoemail@supermercadoabc.com.br",
    "observacoes": "Cliente VIP - pagamento sempre em dia"
}
```

### Ativar/Desativar Cliente

```
POST /cadastro/api/clientes/1/ativar/
POST /cadastro/api/clientes/1/desativar/
```

---

## Buscas e Filtros

### Buscar por Nome/Razão Social

```
GET /cadastro/api/clientes/?search=ABC
```

### Filtrar por Regime Tributário

```
GET /cadastro/api/clientes/?regime_tributario=SIMPLES
GET /cadastro/api/clientes/?regime_tributario=LUCRO_REAL
GET /cadastro/api/clientes/?regime_tributario=MEI
```

### Filtrar por Cidade

```
GET /cadastro/api/clientes/?cidade=São Paulo
```

### Filtrar por Estado

```
GET /cadastro/api/clientes/?estado=SP
```

### Filtrar por Escritório

```
GET /cadastro/api/clientes/?escritorio=1
```

### Filtrar Apenas Ativos

```
GET /cadastro/api/clientes/?ativo=true
```

### Busca Combinada

```
GET /cadastro/api/clientes/?regime_tributario=SIMPLES&cidade=São Paulo&ativo=true
```

### Busca Avançada

```
GET /cadastro/api/clientes/busca_avancada/?nome=ABC&escritorio_id=1
GET /cadastro/api/clientes/busca_avancada/?cnpj=98.765.432
GET /cadastro/api/clientes/busca_avancada/?cpf=123.456.789
```

### Ordenação

```
GET /cadastro/api/clientes/?ordering=razao_social
GET /cadastro/api/clientes/?ordering=-criado_em  (mais recentes primeiro)
GET /cadastro/api/clientes/?ordering=cidade
```

---

## Relatórios

### Clientes por Regime Tributário

```
GET /cadastro/api/clientes/por_regime/
```

**Resposta:**
```json
[
    {
        "regime_tributario": "SIMPLES",
        "total": 45
    },
    {
        "regime_tributario": "LUCRO_REAL",
        "total": 12
    },
    {
        "regime_tributario": "LUCRO_PRESUMIDO",
        "total": 8
    },
    {
        "regime_tributario": "MEI",
        "total": 23
    }
]
```

### Clientes por Cidade

```
GET /cadastro/api/clientes/por_cidade/
```

**Resposta:**
```json
[
    {
        "cidade": "São Paulo",
        "estado": "SP",
        "total": 65
    },
    {
        "cidade": "Guarulhos",
        "estado": "SP",
        "total": 12
    },
    {
        "cidade": "Osasco",
        "estado": "SP",
        "total": 11
    }
]
```

---

## Usando com Python

### Exemplo com requests

```python
import requests

# URL base da API
BASE_URL = "http://localhost:8000/cadastro/api"

# Criar um escritório
escritorio_data = {
    "cnpj": "12.345.678/0001-90",
    "razao_social": "Contabilidade Python Ltda",
    "telefone": "(11) 98765-4321",
    "contador": "João Python",
    "email": "contato@pythoncontabil.com.br"
}

response = requests.post(f"{BASE_URL}/escritorios/", json=escritorio_data)
escritorio = response.json()
print(f"Escritório criado: ID {escritorio['id']}")

# Criar um cliente
cliente_data = {
    "razao_social": "Empresa Python Ltda",
    "nome_fantasia": "Python Store",
    "cnpj": "98.765.432/0001-10",
    "endereco": "Rua Python",
    "numero": "123",
    "bairro": "Tech",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567",
    "proprietario": "Dev Python",
    "data_nascimento": "1990-01-01",
    "cpf": "123.456.789-00",
    "telefone": "(11) 91234-5678",
    "email": "dev@pythonstore.com",
    "regime_tributario": "SIMPLES",
    "escritorio": escritorio['id']
}

response = requests.post(f"{BASE_URL}/clientes/", json=cliente_data)
cliente = response.json()
print(f"Cliente criado: ID {cliente['id']}")

# Listar todos os clientes
response = requests.get(f"{BASE_URL}/clientes/")
clientes = response.json()
print(f"Total de clientes: {len(clientes['results'])}")

# Buscar cliente específico
response = requests.get(f"{BASE_URL}/clientes/{cliente['id']}/")
cliente_detalhes = response.json()
print(f"Cliente: {cliente_detalhes['razao_social']}")
print(f"Endereço: {cliente_detalhes['endereco_completo']}")
```

---

## Usando com JavaScript/Fetch

```javascript
// URL base da API
const BASE_URL = "http://localhost:8000/cadastro/api";

// Criar um escritório
async function criarEscritorio() {
    const escritorioData = {
        cnpj: "12.345.678/0001-90",
        razao_social: "Contabilidade JS Ltda",
        telefone: "(11) 98765-4321",
        contador: "João JavaScript",
        email: "contato@jscontabil.com.br"
    };

    const response = await fetch(`${BASE_URL}/escritorios/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(escritorioData)
    });

    const escritorio = await response.json();
    console.log("Escritório criado:", escritorio);
    return escritorio;
}

// Criar um cliente
async function criarCliente(escritorioId) {
    const clienteData = {
        razao_social: "Empresa JS Ltda",
        nome_fantasia: "JS Store",
        cnpj: "98.765.432/0001-10",
        endereco: "Rua JavaScript",
        numero: "456",
        bairro: "Frontend",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01234-567",
        proprietario: "Dev JavaScript",
        data_nascimento: "1995-05-15",
        cpf: "123.456.789-00",
        telefone: "(11) 91234-5678",
        email: "dev@jsstore.com",
        regime_tributario: "SIMPLES",
        escritorio: escritorioId
    };

    const response = await fetch(`${BASE_URL}/clientes/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(clienteData)
    });

    const cliente = await response.json();
    console.log("Cliente criado:", cliente);
    return cliente;
}

// Listar clientes
async function listarClientes() {
    const response = await fetch(`${BASE_URL}/clientes/`);
    const data = await response.json();
    console.log("Clientes:", data.results);
    return data.results;
}

// Usar as funções
(async () => {
    const escritorio = await criarEscritorio();
    const cliente = await criarCliente(escritorio.id);
    const clientes = await listarClientes();
})();
```

---

## Paginação

Por padrão, a API retorna 10 resultados por página. Para navegar:

```
GET /cadastro/api/clientes/?page=1
GET /cadastro/api/clientes/?page=2
```

**Resposta com paginação:**
```json
{
    "count": 150,
    "next": "http://localhost:8000/cadastro/api/clientes/?page=2",
    "previous": null,
    "results": [
        { ... clientes ... }
    ]
}
```
