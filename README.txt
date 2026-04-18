╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                      SISTEMA APERUS - VERSÃO PRODUÇÃO                        ║
║                                                                              ║
║                            Versão 1.0 | Abril 2026                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝


═══════════════════════════════════════════════════════════════════════════════
  INSTALAÇÃO RÁPIDA
═══════════════════════════════════════════════════════════════════════════════

1. Clique 2x em: INSTALAR.bat

2. Escolha opção [A] - Instalação Completa

3. Aguarde terminar (30-45 minutos)

4. Clique 2x em: INICIAR.bat


═══════════════════════════════════════════════════════════════════════════════
  ARQUIVOS IMPORTANTES
═══════════════════════════════════════════════════════════════════════════════

📖 MANUAL_INSTALACAO.txt    → Manual completo passo a passo
🚀 INSTALAR.bat              → Instalador interativo
▶️  INICIAR.bat               → Iniciar o sistema
📝 requirements.txt          → Dependências Python
📦 frontend/package.json     → Dependências Node.js
⚙️  .env.example              → Modelo de configuração


═══════════════════════════════════════════════════════════════════════════════
  ESTRUTURA DA PASTA
═══════════════════════════════════════════════════════════════════════════════

SistemaAperus/
├── api/                     ← Código do backend Django
├── core/                    ← Configurações Django
├── frontend/                ← Código do frontend Vue.js
│   ├── src/                 ← Código fonte
│   ├── public/              ← Arquivos públicos
│   └── package.json         ← Dependências
├── static/                  ← Arquivos estáticos (CSS, JS)
├── media/                   ← Uploads (criado automaticamente)
├── .venv/                   ← Ambiente virtual (criado na instalação)
├── manage.py                ← Script Django
├── requirements.txt         ← Dependências Python
├── .env.example             ← Exemplo de configuração
├── MANUAL_INSTALACAO.txt    ← Manual completo
├── INSTALAR.bat             ← Instalador
├── INICIAR.bat              ← Inicializador
└── README.txt               ← Este arquivo


═══════════════════════════════════════════════════════════════════════════════
  REQUISITOS
═══════════════════════════════════════════════════════════════════════════════

✓ Windows Server 2016+ ou Windows 10/11
✓ Python 3.11 ou 3.12
✓ Node.js 18+ ou 20+
✓ PostgreSQL 14+ (JÁ DEVE ESTAR INSTALADO)
✓ 4 GB RAM (8 GB recomendado)
✓ 10 GB espaço em disco


═══════════════════════════════════════════════════════════════════════════════
  CONFIGURAÇÃO DO BANCO
═══════════════════════════════════════════════════════════════════════════════

Antes de iniciar, configure o arquivo .env com os dados do seu banco PostgreSQL:

1. Copie .env.example para .env
2. Edite .env e configure:
   - DB_NAME=aperus_producao
   - DB_USER=aperus_user
   - DB_PASSWORD=sua_senha
   - DB_HOST=localhost
   - DEBUG=False


═══════════════════════════════════════════════════════════════════════════════
  INICIANDO O SISTEMA
═══════════════════════════════════════════════════════════════════════════════

Após instalação completa:

1. Clique 2x em: INICIAR.bat

2. Acesse no navegador:
   - Sistema: http://localhost:8005/
   - Admin: http://localhost:8005/admin/


═══════════════════════════════════════════════════════════════════════════════
  COMANDOS ÚTEIS
═══════════════════════════════════════════════════════════════════════════════

Abra PowerShell nesta pasta e execute:

Ativar ambiente:
  .\.venv\Scripts\Activate.ps1

Iniciar sistema:
  python manage.py runserver 0.0.0.0:8005

Verificar sistema:
  python manage.py check

Criar backup:
  python manage.py dumpdata > backup.json

Executar migrações:
  python manage.py migrate


═══════════════════════════════════════════════════════════════════════════════
  SUPORTE
═══════════════════════════════════════════════════════════════════════════════

Para dúvidas ou problemas, consulte:

1. MANUAL_INSTALACAO.txt (manual completo)
2. Logs em: logs/error.log
3. Contate o suporte técnico


═══════════════════════════════════════════════════════════════════════════════

✓ Sistema pronto para produção!

Desenvolvido em 2026

═══════════════════════════════════════════════════════════════════════════════
