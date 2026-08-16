# ProfilesModule

O `ProfilesModule` concentra a leitura e a manutenção do perfil ligado ao usuário autenticado. O UUID recebido no JWT do Supabase Auth é o mesmo usado em `Profile.id`; email e senha continuam fora desse domínio.

## Endpoints

Todos os endpoints exigem `Authorization: Bearer <access-token>`:

| Método | Rota | Resultado |
| --- | --- | --- |
| `GET` | `/api/v1/profiles/me` | Retorna nome, avatar público, role e datas do perfil. |
| `PATCH` | `/api/v1/profiles/me` | Atualiza `displayName`. |
| `PUT` | `/api/v1/profiles/me/avatar` | Envia ou substitui o campo multipart `file`. |
| `DELETE` | `/api/v1/profiles/me/avatar` | Remove o avatar e responde `204`. |
| `DELETE` | `/api/v1/profiles/me` | Exige `{"confirmation":"EXCLUIR MINHA CONTA"}` e responde `204`. |

`role` nunca é recebida do cliente. A URL do avatar também não é persistida: `Profile.avatarPath` guarda apenas o caminho do objeto e a API deriva `avatarUrl` ao montar a resposta.

## Bucket de avatares

Crie no Supabase Storage um bucket público cujo nome corresponda a `SUPABASE_AVATARS_BUCKET` (`avatars` por padrão). Configure no bucket o limite de 2 MB e permita somente:

- `image/jpeg`;
- `image/png`;
- `image/webp`.

A API repete essas validações e verifica a assinatura binária do arquivo. Upload e remoção usam a `SUPABASE_SERVICE_ROLE_KEY`, exclusiva do backend; o navegador não recebe essa chave nem grava diretamente no bucket. Cada objeto usa o caminho `<profileId>/<uuid>.<extensão>`.

O bucket precisa ser público porque `ProfileResponseDto.avatarUrl` é uma URL pública derivada por `getPublicUrl`. Se futuramente os avatares se tornarem privados, o contrato deve migrar para URLs assinadas.

Referências oficiais: [upload de arquivo](https://supabase.com/docs/reference/javascript/storage-from-upload), [remoção de arquivo](https://supabase.com/docs/reference/javascript/storage-from-remove) e [URL pública](https://supabase.com/docs/reference/javascript/storage-from-getpublicurl).

## Consistência do avatar

Ao substituir um avatar, a API envia o novo objeto, persiste seu caminho e só então tenta remover o anterior. Se a persistência falhar, o objeto recém-enviado é removido para não criar uma mídia órfã. A falha posterior ao remover o avatar antigo é registrada, mas não desfaz o caminho novo já persistido.

Ao excluir somente o avatar, o caminho é removido do Profile antes da limpeza do objeto. Assim, uma falha do Storage não deixa a aplicação apontando para um arquivo indisponível.

## Exclusão de conta

O fluxo executa as seguintes ações:

1. remove o avatar existente;
2. apaga reactions e bookmarks em uma transação do Prisma;
3. anonimiza o Profile com `deletedAt`, nome neutro e `avatarPath` nulo;
4. exclui a identidade por meio da API administrativa do Supabase Auth.

Posts e revisões permanecem preservados. Comentários mantêm a consistência prevista no modelo de dados. A remoção administrativa exige a service role e só pode ser executada em servidor. Uma identidade já ausente é tratada como sucesso para permitir repetição segura após respostas de rede ambíguas.

Referência oficial: [exclusão administrativa de usuário](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser).
