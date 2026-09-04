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
5. solicita um email de despedida para o endereço autenticado, confirmando que a exclusão foi concluída.

Posts e revisões permanecem preservados. Comentários mantêm a consistência prevista no modelo de dados. A remoção administrativa exige a service role e só pode ser executada em servidor. Uma identidade já ausente é tratada como sucesso para permitir repetição segura após respostas de rede ambíguas.

O email é solicitado somente depois da exclusão da identidade. Uma falha de entrega é registrada, mas não transforma em erro uma exclusão que já foi concluída.

Referência oficial: [exclusão administrativa de usuário](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser).

## Experiência no frontend

A rota autenticada `/perfil` consulta o perfil pela API usando o access token da sessão validada no servidor. Visitantes são direcionados para `/auth?next=/perfil`, e a página não é indexada.

O leitor pode alterar o nome público, adicionar, substituir ou remover o avatar e acessar o fluxo de alteração de senha. As mutações são executadas por Server Actions autenticadas, que revalidam os dados recebidos e fazem a comunicação com a API no servidor do frontend. A interface repete as restrições de formato e tamanho do avatar antes do envio, apresenta feedback flutuante durante cada operação e atualiza os dados exibidos com a resposta da API. Enquanto a imagem é carregada, o avatar mantém um estado visual pulsante dentro de sua própria forma. Um novo carregamento sempre consulta novamente o perfil persistido. O envio do arquivo aceita uma janela de até 30 segundos, separada do limite menor aplicado às consultas de página, para absorver a latência do armazenamento sem apresentar uma falha antes da conclusão real da operação.

O cabeçalho acompanha a sessão validada no servidor: apresenta `Entrar` para visitantes e, para leitores autenticados, mostra avatar e nome com um menu não modal contendo `Minha Conta` e `Fazer Logout`. Se a consulta dos dados complementares falhar, a sessão autenticada continua sendo representada por um nome derivado do e-mail. A rota `/auth` redireciona leitores que já estão autenticados para `/perfil` ou para o destino interno solicitado pelo fluxo.

A zona de perigo exige que o leitor digite `EXCLUIR MINHA CONTA` antes de habilitar a exclusão. Depois da resposta `204`, a sessão local é encerrada e o navegador retorna à página inicial. Mensagens apresentadas ao leitor são amigáveis e não expõem detalhes internos da API ou dos provedores.
