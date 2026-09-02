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

## Proteção de rotas e decorators

O `SupabaseAuthGuard` é registrado globalmente, portanto uma rota nova exige JWT válido por padrão. Os decorators de autenticação deixam as exceções e necessidades de autorização explícitas no controller:

- `@Public()` dispensa a autenticação da rota ou de todo o controller;
- `@Roles(...roles)` registra as roles de `Profile` aceitas para leitura posterior pelo `RolesGuard`;
- `@CurrentUser()` extrai de `request.user` o `AuthenticatedUser` produzido pela validação do JWT.

`@Roles()` declara os metadados interpretados pelo `RolesGuard`. O guard consulta a role persistida de um `Profile` ativo e responde `403 FORBIDDEN` quando o perfil não existe, está excluído ou não possui uma das roles aceitas. A decisão nunca usa `user_metadata` nem outras claims controláveis pelo cliente.

O `RolesGuard` é executado globalmente depois do `SupabaseAuthGuard`. Rotas sem `@Roles()` exigem apenas autenticação; rotas públicas ignoram ambos os controles. A consulta de role não usa cache nesta etapa, evitando manter permissões desatualizadas após uma alteração administrativa. Um cache curto e com invalidação explícita poderá ser avaliado posteriormente se houver necessidade comprovada.

Endpoints protegidos também usam `@ApiBearerAuth('supabase-jwt')` para que o Swagger mostre o esquema de autenticação. Exemplo:

```ts
@ApiBearerAuth('supabase-jwt')
@Roles(UserRole.ADMIN)
@Post(':id/publish')
publish(
  @Param('id', ParseUUIDPipe) id: string,
  @CurrentUser() user: AuthenticatedUser,
) {
  return this.postsService.publish(id, user.id);
}
```

Rotas públicas usam `@Public()` e não declaram `@ApiBearerAuth`, mantendo o contrato OpenAPI sem requisito de Bearer token para aquela operação.

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

A configuração foi validada em desenvolvimento com os fluxos de confirmação de cadastro e recuperação de senha. Nos dois casos, o Resend entregou o email autenticado pelo domínio e o Supabase redirecionou o navegador para uma URL local autorizada.

## Dados sensíveis

- `SUPABASE_SERVICE_ROLE_KEY` é exclusiva da API e nunca pode chegar ao navegador.
- O frontend usará somente a URL pública do projeto e a publishable key.
- Credenciais reais ficam em arquivos locais ignorados pelo Git ou nas variáveis protegidas do provedor de deploy.

## Clientes SSR do frontend

O frontend usa `@supabase/ssr` com o fluxo PKCE e mantém a sessão em cookies compartilhados entre navegador e servidor. O ambiente de `apps/web` exige somente:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Os clientes ficam separados por runtime em `apps/web/src/lib/auth/supabase`:

- `client.ts` cria o cliente usado por Client Components;
- `server.ts` cria um cliente novo por requisição e integra o `cookies()` assíncrono do Next.js;
- `proxy.ts` valida as claims e replica cookies e cabeçalhos de cache produzidos pela renovação da sessão.

O arquivo `apps/web/src/proxy.ts` executa essa renovação antes da renderização e exclui apenas assets estáticos. Ele não concede autorização de negócio nem substitui a validação do JWT feita pela API NestJS.

Os callbacks públicos são:

- `GET /auth/callback`, que troca o código PKCE pela sessão;
- `GET /auth/confirm`, que valida o `token_hash` de confirmação, convite, magic link ou recuperação.

O parâmetro opcional `next` aceita somente caminhos internos. Respostas que gravam ou renovam cookies de autenticação usam cache privado para impedir que uma sessão seja reutilizada por outro visitante.

## Cadastro e entrada no frontend

A rota `/auth` reúne cadastro e entrada em um formulário acessível e responsivo. O cadastro envia `display_name` como metadata para a criação segura do `Profile`, valida a política de senha antes da requisição e direciona a confirmação para `/auth/callback`, onde o código PKCE é trocado pela sessão.

O feedback de cadastro não revela se o email já pertence a outra conta. Falhas de entrada também são convertidas em mensagens estáveis e amigáveis, sem repassar textos técnicos do provedor. Após a autenticação, somente um caminho interno validado pode ser usado como destino.

## Recuperação e alteração de senha no frontend

A entrada oferece acesso a `/auth/forgot-password`, onde o leitor informa o email para solicitar a recuperação. A resposta exibida é a mesma quando a conta existe ou não, evitando confirmar publicamente quais endereços estão cadastrados.

O email direciona primeiro para um callback autorizado. O callback valida o código PKCE ou o token de recuperação, estabelece uma sessão temporária em cookies privados e permite seguir apenas para o caminho interno `/auth/reset-password`. Links inválidos ou expirados produzem feedback amigável e não expõem detalhes do provedor.

Na redefinição, a nova senha precisa atender à política da aplicação e ser confirmada antes do envio. A alteração é aceita somente quando há uma sessão válida; depois do sucesso, a sessão local é encerrada e o leitor deve entrar novamente com a nova senha.

O fluxo manual esperado em ambiente real é:

1. solicitar a recuperação usando um email cadastrado;
2. abrir o link entregue pelo Resend;
3. definir e confirmar uma nova senha;
4. confirmar o retorno para a entrada com mensagem de sucesso;
5. entrar com a nova senha e confirmar que a anterior não é mais aceita.
