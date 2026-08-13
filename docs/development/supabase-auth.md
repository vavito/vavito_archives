# Supabase Auth

O Supabase Auth administra cadastro, login, confirmação de email, recuperação de senha e sessões. A API NestJS não recebe nem persiste senhas; ela apenas validará os access tokens emitidos pelo Supabase.

## Configuração do projeto

Em **Authentication → Sign In / Providers → Email**:

- o provedor de email fica habilitado;
- novos cadastros ficam permitidos;
- a confirmação de email fica obrigatória;
- login por telefone, login anônimo e provedores sociais permanecem desabilitados na V1 inicial.

Em **Authentication → Sessions**:

- o access token JWT expira em `3600` segundos;
- sessão limitada por tempo permanece desabilitada;
- timeout por inatividade permanece desabilitado;
- sessão única por usuário permanece desabilitada.

O refresh token mantém a sessão e permite renovar o access token. As configurações mais restritivas de sessão podem ser reavaliadas após existir telemetria de uso.

## Validação dos access tokens na API

A API valida o access token recebido em `Authorization: Bearer <token>` usando o endpoint JWKS público do Supabase. A validação exige:

- assinatura correspondente a uma chave pública do projeto;
- `iss` igual a `<SUPABASE_URL>/auth/v1`;
- `aud` e `role` iguais a `authenticated`;
- token dentro do período de validade definido por `exp`;
- `sub` no formato UUID e `email` presentes.

As chaves JWKS ficam em cache na instância da API por até 10 minutos, com timeout de 5 segundos na consulta ao Supabase. Tokens ausentes, malformados, expirados ou inválidos recebem `401 UNAUTHENTICATED` e não alcançam o controller protegido.

Após a validação, a API disponibiliza apenas `sub` como `AuthenticatedUser.id` e a claim `email` como `AuthenticatedUser.email`. Claims de metadata não concedem autorização; a role de negócio continua sendo lida do `Profile`.

## Profile criado no cadastro

O cadastro pode enviar o nome público no metadata `display_name`. Após a criação de uma identidade em `auth.users`, um trigger versionado cria o `Profile` correspondente com o mesmo UUID.

O metadata é tratado apenas como origem do nome público: não é fonte confiável de autorização. A role do `Profile` sempre nasce do padrão `USER` definido no banco, mesmo que o cliente envie um campo `role` no cadastro. Nomes ausentes ou inválidos recebem o fallback `Leitor` e podem ser alterados posteriormente pelo endpoint de perfil.

## URLs autorizadas

Durante o desenvolvimento, a **Site URL** é:

```text
http://localhost:3000
```

A lista de **Redirect URLs** contém:

```text
http://localhost:3000/**
```

Esse padrão cobre os callbacks que serão implementados no frontend, incluindo confirmação de email, retorno de autenticação e redefinição de senha.

Quando os ambientes forem publicados, devem ser adicionadas as URLs exatas de produção:

```text
https://vavitoarchives.com.br/auth/confirm
https://vavitoarchives.com.br/auth/callback
https://vavitoarchives.com.br/auth/reset-password
```

Para previews da Vercel, deve ser adicionado o padrão correspondente à conta ou ao time responsável pelo deploy:

```text
https://*-<slug-da-conta-ou-time>.vercel.app/**
```

A **Site URL** só deve mudar para `https://vavitoarchives.com.br` quando o frontend de produção estiver disponível. Produção deve usar URLs exatas; curingas ficam limitados a desenvolvimento e previews.

## Política de senha

A política funcional da aplicação exige:

- no mínimo 8 caracteres;
- ao menos uma letra minúscula;
- ao menos uma letra maiúscula;
- ao menos um número;
- ao menos um símbolo.

O frontend deverá validar e explicar esses critérios antes de enviar o cadastro. O Supabase permanece como autoridade sobre a credencial e pode aplicar apenas os controles disponíveis no plano contratado.

A proteção automática contra senhas conhecidas em vazamentos não está disponível no plano Free. Ela fica registrada como melhoria futura e deve ser habilitada se o projeto migrar para um plano compatível.

## SMTP de autenticação

Os emails do Supabase Auth são enviados pelo Resend por meio da integração SMTP do projeto.

- o domínio de envio é `auth.vavitoarchives.com.br`;
- o remetente é `Vavito Archives <no-reply@auth.vavitoarchives.com.br>`;
- os registros SPF e DKIM do domínio estão verificados;
- os templates básicos de confirmação de cadastro e recuperação de senha estão personalizados no Supabase;
- a credencial SMTP é administrada pela integração entre Resend e Supabase e não deve ser versionada no repositório.

## Teste manual de desenvolvimento

Para validar a configuração antes da implementação completa do fluxo de autenticação, é possível cadastrar um usuário pelo endpoint público do Supabase Auth e manter o frontend local em execução para receber o redirecionamento. Valide:

1. cadastrar um endereço de email autorizado usando uma senha que atenda à política;
2. confirmar que o Supabase cria o usuário ainda não confirmado;
3. abrir o email de confirmação;
4. confirmar que o link retorna para uma Redirect URL autorizada;
5. confirmar que o usuário passa a constar como verificado;
6. entrar com email e senha e confirmar a criação da sessão.

A configuração foi validada em desenvolvimento com os fluxos de confirmação de cadastro e recuperação de senha. Nos dois casos, o Resend entregou o email autenticado pelo domínio e o Supabase redirecionou o navegador para uma URL local autorizada. As páginas que concluem esses fluxos no frontend serão implementadas em tasks posteriores.

## Dados sensíveis

- `SUPABASE_SERVICE_ROLE_KEY` é exclusiva da API e nunca pode chegar ao navegador.
- O frontend usará somente a URL pública do projeto e a publishable key.
- Credenciais reais ficam em arquivos locais ignorados pelo Git ou nas variáveis protegidas do provedor de deploy.
