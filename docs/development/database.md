# Banco de dados

O Prisma administra somente as tabelas da aplicação no schema PostgreSQL `public`. As identidades, emails e senhas continuam sob responsabilidade do Supabase Auth no schema `auth`.

## Criação automática de Profile

A migration `20260813101000_create_auth_user_profile_trigger` instala um trigger em `auth.users`. Cada nova identidade cria, na mesma transação, um `Profile` com o mesmo UUID e a role padrão `USER`.

O trigger aceita somente `raw_user_meta_data.display_name` textual, normaliza espaços e limita o valor a 120 caracteres. Metadata ausente, vazio ou de outro tipo produz o nome seguro `Leitor`. Campos de autorização presentes no metadata, como `role`, são ignorados.

A função usa `SECURITY DEFINER` com `search_path` vazio e referências de schema explícitas. Sua execução direta é revogada de `PUBLIC`; ela é chamada apenas pelo trigger. Se a criação do `Profile` falhar, a inserção em `auth.users` participa do mesmo rollback e o cadastro não fica incompleto.

## Migrations

Consulte o estado das migrations sem alterar o banco:

```bash
corepack pnpm --filter @vavito/api prisma:migrate:status
```

Aplique somente migrations pendentes:

```bash
corepack pnpm --filter @vavito/api prisma:migrate:deploy
```

O Prisma usa `DIRECT_URL` para esses comandos. Nunca aponte essa variável para produção durante o desenvolvimento.

## Seed administrativo

O seed não cria identidade nem recebe senha. Antes de executá-lo:

1. Crie ou confirme o usuário no Supabase Auth.
2. Copie o UUID desse usuário para `ADMIN_USER_ID` no `.env`.
3. Defina `ADMIN_DISPLAY_NAME` no `.env`.
4. Execute:

```bash
corepack pnpm --filter @vavito/api prisma:seed
```

O seed confirma diretamente em `auth.users` que o UUID pertence a um usuário ativo. Em seguida, cria o `Profile` correspondente ou altera somente sua função para `ADMIN`. Executar o mesmo comando novamente preserva o mesmo perfil e informa que ele já era administrador.

O seed encerra com erro sem modificar perfis quando o UUID está ausente, possui formato inválido ou não corresponde a uma identidade ativa.
