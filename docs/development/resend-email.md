# Resend e entrega de emails

O Resend atende três fluxos separados do Vavito Archives. A separação por subdomínio reduz o acoplamento operacional e permite acompanhar a reputação de autenticação, notificações e newsletter de forma independente.

## Domínios

| Finalidade | Domínio | Região | Estado |
| --- | --- | --- | --- |
| Autenticação do Supabase | `auth.vavitoarchives.com.br` | São Paulo (`sa-east-1`) | SPF e DKIM verificados |
| Contato e notificações administrativas | `contact.vavitoarchives.com.br` | São Paulo (`sa-east-1`) | SPF e DKIM verificados |
| Newsletter | `newsletter.vavitoarchives.com.br` | São Paulo (`sa-east-1`) | SPF e DKIM verificados |

O domínio raiz possui DMARC inicialmente em modo de observação:

```text
v=DMARC1; p=none;
```

A política não deve ser promovida para `quarantine` ou `reject` antes de confirmar em produção que todas as fontes legítimas estão alinhadas com SPF ou DKIM.

## Remetentes e Reply-To

| Fluxo | From | Reply-To |
| --- | --- | --- |
| Confirmação e recuperação do Supabase Auth | `Vavito Archives <no-reply@auth.vavitoarchives.com.br>` | Não definido |
| Novo comentário e notificações administrativas | `Vavito Archives <notifications@contact.vavitoarchives.com.br>` | Endereço monitorado definido em `MAIL_REPLY_TO` |
| Mensagem enviada pelo formulário de contato | `Vavito Archives <notifications@contact.vavitoarchives.com.br>` | Email validado do visitante |
| Confirmação e campanhas da newsletter | `Vavito Archives <newsletter@newsletter.vavitoarchives.com.br>` | Endereço monitorado definido em `MAIL_REPLY_TO` |

O endereço informado pelo visitante nunca deve ser usado como `From`, pois ele não pertence a um domínio autenticado pela aplicação. No formulário de contato, esse endereço é usado somente como `Reply-To` depois da validação do DTO.

## Variáveis locais e de deploy

```env
RESEND_API_KEY=re_replace_with_api_key
MAIL_CONTACT_FROM="Vavito Archives <notifications@contact.vavitoarchives.com.br>"
MAIL_NEWSLETTER_FROM="Vavito Archives <newsletter@newsletter.vavitoarchives.com.br>"
MAIL_ADMIN_RECIPIENT=replace_with_admin_email
MAIL_REPLY_TO=replace_with_monitored_reply_email
```

- `RESEND_API_KEY` usa uma chave privada com permissão somente de envio para os domínios da aplicação.
- `MAIL_ADMIN_RECIPIENT` recebe notificações internas de comentário e contato.
- `MAIL_REPLY_TO` precisa apontar para uma caixa postal acompanhada pelo administrador.
- valores reais ficam no `.env` local ou nas variáveis protegidas do provedor de deploy e nunca são versionados.
- a chave usada pela integração SMTP do Supabase Auth permanece separada da chave usada pela API.

## Ambiente de teste

Em desenvolvimento, os envios manuais usam apenas o endereço configurado em `MAIL_ADMIN_RECIPIENT`. Não utilizar a lista real de assinantes para testes.

A configuração inicial foi validada com dois envios independentes aceitos pelo Resend:

- notificação transacional enviada por `notifications@contact.vavitoarchives.com.br`;
- mensagem de newsletter enviada por `newsletter@newsletter.vavitoarchives.com.br`.

A confirmação final da entrega deve ser feita na caixa postal do destinatário. O aceite da API do Resend demonstra que domínio, remetente e chave foram aceitos, mas não substitui a confirmação de recebimento.

## Referências oficiais

- [Gerenciamento e verificação de domínios](https://resend.com/docs/dashboard/domains/introduction)
- [Configuração de DMARC](https://resend.com/docs/dashboard/domains/dmarc)
- [Envio de email pela API](https://resend.com/docs/api-reference/emails/send-email)
