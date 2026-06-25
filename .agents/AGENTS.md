# Regras do Projeto - Aperus

- **Alterações Centralizadas na Mãe (aperus_mae)**: Todas as modificações de código, correções de bugs e novas funcionalidades devem ser feitas exclusivamente no repositório mãe (`C:\APERUS\aperus_mae`). Nunca faça alterações diretamente nas pastas ou bancos de dados dos clientes (sistemas filhos) a menos que explicitamente solicitado para fins de testes isolados.
- **Distribuição de Funcionalidades**: O repositório `aperus_mae` é o único responsável por receber atualizações e distribuí-las aos clientes (sistemas filhos) através da centralização das rotinas de atualização.
- **Cuidado com Git Stashes**: Ao realizar atualizações automatizadas ou comandos que criem stashes locais do Git, certifique-se de que os stashes sejam aplicados/popados de forma limpa e que nenhum código (frontend ou backend) seja deixado oculto ou descartado.
