# Padrão de emails do Vavito Archives

Todos os emails do produto usam a mesma moldura visual: fundo neutro, cartão branco de até `680 px`, tipografia segura para clientes de email, CTA escura arredondada e assinatura do Vavito Archives. A marca usa `#18191b`, `#f4f4f5`, `#0369a1` e o símbolo público em `/brand/vavito-symbol.png`.

## Emails enviados pela API

O arquivo `apps/api/src/core/mail/templates/vavito-email.template.ts` é a fonte compartilhada para moldura, marca, CTA, escape de HTML e comportamento responsivo. Novos templates da API devem compor esse arquivo em vez de repetir uma página HTML própria.

O padrão já cobre:

- aviso administrativo de novo comentário;
- mensagem recebida pelo formulário de contato;
- confirmação de exclusão da conta;
- confirmação da newsletter;
- campanha editorial com um ou mais artigos;
- boas-vindas depois da primeira confirmação da conta.

As boas-vindas são solicitadas quando a inscrição vinculada à conta passa pela primeira vez para `CONFIRMED`. A confirmação aguarda o pedido ao provedor e, durante as 24 horas seguintes, a página final pode repetir o envio para absorver uma falha ou timeout no callback. A chave `welcome/<subscriberId>` torna essas tentativas idempotentes dentro da janela correspondente do Resend. Falha na entrega não invalida a conta nem sua inscrição.

Em desenvolvimento, imagens incorporadas em um email não conseguem carregar de `localhost` no dispositivo destinatário. Elas passam a funcionar quando `FRONTEND_URL` aponta para a aplicação publicada. Como campanhas armazenam um snapshot, uma campanha criada com URL local precisa ser recriada depois da configuração de produção.

## Emails enviados pelo Supabase Auth

Confirmação de cadastro e recuperação de senha são enviadas diretamente pelo Supabase Auth, usando o Resend apenas como SMTP. Por isso, esses emails não executam o template TypeScript da API.

As versões aprovadas ficam em:

- `docs/development/supabase-email-templates/confirmation.html`;
- `docs/development/supabase-email-templates/recovery.html`.

No projeto hospedado, copie cada HTML em **Authentication → Email Templates** e use os assuntos:

- Confirm signup: `Confirme seu email no Vavito Archives`;
- Reset password: `Redefina sua senha no Vavito Archives`.

Os arquivos usam `{{ .TokenHash }}` com os callbacks `/auth/confirm` para confirmação e recuperação, evitando depender do verificador PKCE armazenado no navegador que iniciou o fluxo. `{{ .SiteURL }}` aponta para o endereço configurado no Supabase. O domínio público precisa servir `/brand/vavito-symbol.png`. Ao habilitar futuramente convite, magic link, troca de email, reautenticação ou notificações de segurança, o novo template deve repetir esta moldura e usar as variáveis específicas documentadas pelo Supabase.

Alterar os arquivos no repositório não atualiza sozinho um projeto Supabase hospedado. A publicação é feita pelo Dashboard ou pela Management API com um token de acesso da conta; a `service_role` da aplicação não possui essa autoridade.

## Regras de conteúdo

- Estilos críticos permanecem inline; media query é apenas um aprimoramento.
- Dados externos são escapados antes de entrar no HTML.
- Links aceitam somente destinos esperados e usam o endereço configurado da aplicação.
- Emails da API mantêm versão textual equivalente.
- Mensagens transacionais não incluem conteúdo promocional ou consentimento implícito.
- A identidade visual aparece depois da ação ou do conteúdo principal, sem competir com a mensagem.
