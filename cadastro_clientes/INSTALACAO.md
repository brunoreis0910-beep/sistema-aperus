# INSTRUÇÕES DE INSTALAÇÃO - Sistema de Cadastro de Clientes

## Passo a Passo para Ativar o Sistema

### 1. Instalar Dependências (se necessário)

```bash
pip install djangorestframework
pip install django-filter
```

### 2. Configurar o Django Settings

Abra o arquivo `settings.py` do seu projeto principal e adicione:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Django REST Framework
    'rest_framework',
    'django_filters',
    
    # Novo app de cadastro de clientes
    'cadastro_clientes',
    
    # ... seus outros apps
]

# Configurações do REST Framework (adicione ao final do arquivo)
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}
```

### 3. Configurar URLs do Projeto

Edite o arquivo `urls.py` principal do seu projeto Django:

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # URLs do sistema de cadastro de clientes
    path('cadastro/', include('cadastro_clientes.urls')),
    
    # ... suas outras URLs
]
```

### 4. Criar e Aplicar Migrações

Execute os seguintes comandos no terminal:

```bash
# Criar as migrações
python manage.py makemigrations cadastro_clientes

# Aplicar as migrações ao banco de dados
python manage.py migrate
```

### 5. Criar Superusuário (se ainda não tiver)

```bash
python manage.py createsuperuser
```

### 6. Iniciar o Servidor

```bash
python manage.py runserver
```

### 7. Acessar o Sistema

- **Admin:** http://localhost:8000/admin/
- **API Clientes:** http://localhost:8000/cadastro/api/clientes/
- **API Escritórios:** http://localhost:8000/cadastro/api/escritorios/

## Testando o Sistema

### Via Admin (Interface Web)

1. Acesse: http://localhost:8000/admin/
2. Faça login com o superusuário
3. Vá em "Cadastro de Clientes"
4. Cadastre primeiro um "Escritório de Contabilidade"
5. Depois cadastre "Clientes"

### Via API (Programaticamente)

#### Criar um Escritório:

```bash
curl -X POST http://localhost:8000/cadastro/api/escritorios/ \
  -H "Content-Type: application/json" \
  -d '{
    "cnpj": "12.345.678/0001-90",
    "razao_social": "Contabilidade XYZ Ltda",
    "telefone": "(11) 98765-4321",
    "contador": "João Silva",
    "email": "contato@contabilidadexyz.com.br"
  }'
```

#### Listar Escritórios:

```bash
curl http://localhost:8000/cadastro/api/escritorios/
```

#### Criar um Cliente:

```bash
curl -X POST http://localhost:8000/cadastro/api/clientes/ \
  -H "Content-Type: application/json" \
  -d '{
    "razao_social": "Empresa ABC Ltda",
    "nome_fantasia": "ABC Comércio",
    "cnpj": "98.765.432/0001-10",
    "inscricao_estadual": "123456789",
    "endereco": "Rua das Flores",
    "numero": "123",
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
    "escritorio": 1
  }'
```

## Estrutura de Arquivos Criados

```
cadastro_clientes/
├── __init__.py
├── admin.py          # Interface administrativa
├── apps.py           # Configuração do app
├── models.py         # Modelos de dados (Cliente e Escritório)
├── serializers.py    # Serializers para API REST
├── urls.py           # URLs do app
├── views.py          # Views da API
└── README.md         # Documentação completa
```

## Verificando se está Funcionando

Após seguir os passos acima, teste:

1. **Admin:** Acesse o admin e veja se aparecem as seções "Clientes" e "Escritórios de Contabilidade"

2. **API:** Acesse http://localhost:8000/cadastro/api/clientes/ no navegador - deve aparecer a interface do Django REST Framework

3. **Listagem:** Se tudo estiver correto, você verá uma lista vazia (ou os dados que cadastrou)

## Possíveis Problemas e Soluções

### Erro: "No module named 'rest_framework'"
**Solução:** 
```bash
pip install djangorestframework django-filter
```

### Erro: "Table doesn't exist"
**Solução:**
```bash
python manage.py makemigrations
python manage.py migrate
```

### Erro ao acessar API
**Solução:** Verifique se adicionou as URLs corretamente no `urls.py` principal

### Não aparece no Admin
**Solução:** Verifique se adicionou 'cadastro_clientes' no INSTALLED_APPS

## Próximos Passos

Após a instalação, você pode:

1. Personalizar os formulários
2. Adicionar mais validações
3. Criar relatórios
4. Integrar com outras partes do sistema
5. Adicionar autenticação e permissões na API

## Suporte

Para mais informações, consulte o arquivo [README.md](README.md) na pasta do app.
