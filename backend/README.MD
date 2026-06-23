📈 Melhorias Futuras para o Backend

1. Paginação e Filtros
   Implementar paginação (limit, offset ou page, perPage) nas rotas de listagem (notas, entregas, usuários, logs).
   Adicionar filtros por campos relevantes (ex: data, status, usuário, etc).

2. Testes Automatizados
   Criar testes unitários para controllers, services e middlewares (Jest).
   Implementar testes de integração para as rotas principais (Supertest).

3. Exportação de Dados
   Endpoints para exportar dados em CSV ou Excel (notas, entregas, logs).
   Possibilidade de exportar relatórios filtrados.

4. Notificações
   Integração para envio de e-mails (ex: entrega realizada, erro, alerta administrativo).
   Futuro: integração com push notifications para mobile.

5. Rate Limiting e Segurança
   Adicionar rate limiting para evitar abuso de endpoints sensíveis.
   Melhorar tratamento de erros e mensagens para o cliente.
   Monitoramento de tentativas de login e bloqueio temporário após X falhas.

6. Melhorias de Auditoria
   Permitir busca e filtro nos logs de auditoria.
   Adicionar logs para tentativas de acesso negado.

7. CI/CD e Deploy
   Configurar pipeline de integração contínua (CI) para rodar testes automaticamente.
   Automatizar deploy para ambiente de produção.

8. Documentação
   Manter o Swagger sempre atualizado.
   Adicionar exemplos de respostas e erros nos schemas.
