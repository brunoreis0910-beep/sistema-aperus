# Sistema de Cadastro de Clientes

Sistema completo para cadastro e gerenciamento de clientes com integração a escritórios de contabilidade.

## 📋 Características

### Cadastro de Clientes
- **Dados da Empresa:**
  - Razão Social
  - Nome Fantasia
  - CNPJ (com validação)
  - Inscrição Estadual
  - Regime Tributário (Simples Nacional, Lucro Real, Lucro Presumido, MEI, Imunes e Isentas)

- **Endereço Completo:**
  - Endereço
  - Número
  - Complemento
  - Bairro
  - Cidade
  - Estado
  - CEP (com validação)

- **Dados do Proprietário:**
  - Nome do Proprietário
  - Data de Nascimento
  - CPF (com validação)
  - Telefone
  - E-mail

### Cadastro de Escritórios de Contabilidade
- CNPJ (com validação)
- Razão Social
- Nome do Contador
- Telefone
- E-mail

## 🚀 Instalação

### 1. Adicionar ao INSTALLED_APPS

Edite o arquivo `settings.py` do seu projeto Django e adicione:

```python
INSTALLED_APPS = [
    # ... outros apps
    'rest_framework',
    'django_filters',
    'cadastro_clientes',
]
```

### 2. Configurar URLs

Edite o arquivo `urls.py` principal do projeto:

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('cadastro/', include('cadastro_clientes.urls')),
]
```

### 3. Criar Migrações

Execute os comandos:

```bash
python manage.py makemigrations cadastro_clientes
python manage.py migrate
```

### 4. Criar Superusuário (se necessário)

```bash
python manage.py createsuperuser
```

## 📚 API Endpoints

### Escritórios de Contabilidade

- `GET /cadastro/api/escritorios/` - Lista todos os escritórios
- `POST /cadastro/api/escritorios/` - Cria novo escritório
- `GET /cadastro/api/escritorios/{id}/` - Detalhes de um escritório
- `PUT /cadastro/api/escritorios/{id}/` - Atualiza escritório completo
- `PATCH /cadastro/api/escritorios/{id}/` - Atualização parcial
- `DELETE /cadastro/api/escritorios/{id}/` - Remove escritório
- `GET /cadastro/api/escritorios/{id}/clientes/` - Lista clientes do escritório
- `POST /cadastro/api/escritorios/{id}/ativar/` - Ativa escritório
- `POST /cadastro/api/escritorios/{id}/desativar/` - Desativa escritório

### Clientes

- `GET /cadastro/api/clientes/` - Lista todos os clientes
- `POST /cadastro/api/clientes/` - Cria novo cliente
- `GET /cadastro/api/clientes/{id}/` - Detalhes de um cliente
- `PUT /cadastro/api/clientes/{id}/` - Atualiza cliente completo
- `PATCH /cadastro/api/clientes/{id}/` - Atualização parcial
- `DELETE /cadastro/api/clientes/{id}/` - Remove cliente
- `GET /cadastro/api/clientes/por_regime/` - Agrupa clientes por regime tributário
- `GET /cadastro/api/clientes/por_cidade/` - Agrupa clientes por cidade
- `GET /cadastro/api/clientes/busca_avancada/` - Busca avançada com múltiplos critérios
- `POST /cadastro/api/clientes/{id}/ativar/` - Ativa cliente
- `POST /cadastro/api/clientes/{id}/desativar/` - Desativa cliente

## 🔍 Filtros e Busca

### Escritórios
- **Filtros:** `ativo`
- **Busca:** razão social, CNPJ, contador, email
- **Ordenação:** razão social, data de criação

### Clientes
- **Filtros:** regime tributário, escritório, ativo, cidade, estado
- **Busca:** razão social, nome fantasia, CNPJ, proprietário, CPF, email, telefone
- **Ordenação:** razão social, data de criação, cidade

## 📝 Exemplos de Uso

### Criar um Escritório de Contabilidade

```bash
POST /cadastro/api/escritorios/
Content-Type: application/json

{
    "cnpj": "12.345.678/0001-90",
    "razao_social": "Contabilidade XYZ Ltda",
    "telefone": "(11) 98765-4321",
    "contador": "João Silva",
    "email": "contato@contabilidadexyz.com.br",
    "ativo": true
}
```

### Criar um Cliente

```bash
POST /cadastro/api/clientes/
Content-Type: application/json

{
    "razao_social": "Empresa ABC Ltda",
    "nome_fantasia": "ABC Comércio",
    "cnpj": "98.765.432/0001-10",
    "inscricao_estadual": "123456789",
    "endereco": "Rua das Flores",
    "numero": "123",
    "complemento": "Sala 4",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567",
    "proprietario": "Maria Santos",
    "data_nascimento": "1980-05-15",
    "cpf": "123.456.789-00",
    "telefone": "(11) 91234-5678",
    "email": "maria@empresaabc.com.br",
    "regime_tributario": "SIMPLES",
    "escritorio": 1,
    "observacoes": "Cliente VIP",
    "ativo": true
}
```

### Buscar Clientes

```bash
# Busca simples
GET /cadastro/api/clientes/?search=ABC

# Filtrar por regime tributário
GET /cadastro/api/clientes/?regime_tributario=SIMPLES

# Filtrar por cidade e estado
GET /cadastro/api/clientes/?cidade=São Paulo&estado=SP

# Busca avançada
GET /cadastro/api/clientes/busca_avancada/?nome=ABC&escritorio_id=1
```

## 🎨 Interface Admin

O sistema inclui uma interface administrativa completa acessível em:

```
http://localhost:8000/admin/
```

Features do Admin:
- Listagem com filtros avançados
- Busca por múltiplos campos
- Formulários organizados por seções
- Campos de auditoria (criado_em, atualizado_em)
- Visualização do endereço completo formatado

## 🔒 Validações

O sistema inclui validações para:

- **CNPJ:** Formato XX.XXX.XXX/XXXX-XX (14 dígitos)
- **CPF:** Formato XXX.XXX.XXX-XX (11 dígitos)
- **CEP:** Formato XXXXX-XXX (8 dígitos)
- **Telefone:** Formato (XX) XXXXX-XXXX
- **Email:** Validação padrão de email

## 🛠️ Tecnologias Utilizadas

- Django 4.x+
- Django REST Framework
- django-filter
- Python 3.8+

## 📊 Modelos de Dados

### EscritorioContabilidade
- `id` (AutoField)
- `cnpj` (CharField, unique)
- `razao_social` (CharField)
- `telefone` (CharField)
- `contador` (CharField)
- `email` (EmailField)
- `ativo` (BooleanField)
- `criado_em` (DateTimeField, auto)
- `atualizado_em` (DateTimeField, auto)

### Cliente
- `id` (AutoField)
- `razao_social` (CharField)
- `nome_fantasia` (CharField)
- `cnpj` (CharField, unique)
- `inscricao_estadual` (CharField, opcional)
- `endereco` (CharField)
- `numero` (CharField)
- `complemento` (CharField, opcional)
- `bairro` (CharField)
- `cidade` (CharField)
- `estado` (CharField)
- `cep` (CharField)
- `proprietario` (CharField)
- `data_nascimento` (DateField)
- `cpf` (CharField)
- `telefone` (CharField)
- `email` (EmailField)
- `regime_tributario` (CharField, choices)
- `escritorio` (ForeignKey)
- `observacoes` (TextField, opcional)
- `ativo` (BooleanField)
- `criado_em` (DateTimeField, auto)
- `atualizado_em` (DateTimeField, auto)

## 🤝 Relacionamentos

- Um **Escritório de Contabilidade** pode ter múltiplos **Clientes**
- Um **Cliente** pertence a um único **Escritório de Contabilidade**
- Relacionamento protegido (PROTECT) - não é possível excluir um escritório que possui clientes

## 📄 Licença

Este projeto está sob licença MIT.
