# Usuários e acesso — etapa 3

Reservado a login já existente, perfis, vínculos e telas de autorização. Não criar contas, redefinir senhas nem alterar o Firebase nesta etapa de estrutura.

**Etapa 3.07:** a interface mínima de administração é uma página global protegida em `src/app/pages/UsersAdminPage.tsx` na rota `/usuarios`, fora do catálogo dos oito módulos do RPG. Este diretório continua reservado, sem lógica ou rotas próprias. A interface lê perfis/vínculos do Mestre sem gravação e possui simulador inteiramente local; nenhuma função de escrita Firebase foi ativada.
