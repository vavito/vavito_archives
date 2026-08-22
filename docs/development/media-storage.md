# Storage de mídia editorial

A mídia editorial usa um bucket público separado dos avatares. O nome padrão é `media` e pode ser alterado por ambiente com `SUPABASE_MEDIA_BUCKET`.

## Configuração do bucket

Configure o bucket com estes valores:

| Propriedade | Valor |
| --- | --- |
| Público | Sim |
| Limite por arquivo | 10 MB (`10485760` bytes) |
| MIME types permitidos | `image/jpeg`, `image/png`, `image/webp` |

SVG e GIF não são aceitos na V1. A API também deve validar tamanho, extensão e assinatura real do arquivo antes de disponibilizar o objeto.

Cada ambiente usa seu próprio projeto Supabase e seu próprio bucket. Desenvolvimento, preview e produção não compartilham objetos nem credenciais, embora possam usar o mesmo nome lógico `media`.

## Acesso e policies

O bucket é público somente para leitura porque as imagens fazem parte dos artigos públicos. A URL é derivada de `MediaAsset.storagePath`; a aplicação não persiste a URL pública como fonte de verdade.

Não crie policies de `INSERT`, `UPDATE` ou `DELETE` em `storage.objects` para clientes autenticados ou anônimos. Uploads e remoções passam exclusivamente pela API, que usa `SUPABASE_SERVICE_ROLE_KEY` no servidor e autoriza previamente a role `ADMIN`. A service role nunca é enviada ao navegador.

O bucket público permite servir objetos, mas não libera escrita. Na ausência de policies de escrita, o RLS do Supabase bloqueia tentativas feitas com publishable/anon key.

## Paths

Objetos editoriais usam o formato:

```text
<ano>/<mês>/<uuid>.<extensão>
```

O UUID é gerado pelo backend e torna o path não previsível. Nome original, email, ID do usuário e outros dados pessoais não entram no path. O upload usa `upsert: false` para impedir sobrescrita silenciosa.

## Upload administrativo

O endpoint `POST /api/v1/admin/media` recebe `multipart/form-data` com os campos obrigatórios `file` e `altText`. Somente um perfil ativo com role `ADMIN` pode executar o upload.

Antes de chamar o Storage, a API:

1. rejeita arquivos vazios ou maiores que `10485760` bytes;
2. inspeciona os bytes com `sharp` para identificar o formato e as dimensões reais;
3. exige correspondência entre conteúdo real, MIME declarado e extensão do nome enviado;
4. aceita apenas JPEG (`.jpg` ou `.jpeg`), PNG (`.png`) e WebP (`.webp`);
5. normaliza o texto alternativo e exige que ele não seja vazio.

Arquivos acima do limite retornam `413 PAYLOAD_TOO_LARGE`. Conteúdo corrompido, formato não permitido ou divergência entre bytes, MIME e extensão retornam `415 UNSUPPORTED_MEDIA_TYPE`. O objeto só é enviado ao bucket depois dessas validações.

## Persistência e compensação

O `StorageService` centraliza as operações no provedor e o `MediaRepository` centraliza a persistência do agregado `MediaAsset`. O fluxo de upload segue esta ordem:

1. a API gera um path UUID e cria o registro como `UPLOADING`, reservando o path protegido pela constraint única do PostgreSQL;
2. o objeto é enviado ao bucket sem permitir `upsert`;
3. depois da confirmação do Storage, os metadados completos são persistidos e o ativo passa para `READY`;
4. se o upload falhar, o registro passa para `FAILED` com um motivo técnico seguro;
5. se a persistência de `READY` falhar depois do upload, a aplicação remove o objeto e registra o ativo como `FAILED`.

Storage e PostgreSQL não compartilham uma transação. Por isso, falha na remoção compensatória ou no registro de `FAILED` produz `MEDIA_STORAGE_INCONSISTENT` e um log que identifica o ativo para revisão operacional. Logs não incluem service role, tokens, buffers, URLs assinadas nem a mensagem bruta devolvida pelo provedor.

## Limpeza de órfãos

A duração do período seguro não é fixa na V1. Cada execução deve informá-la explicitamente com `--older-than-hours=<inteiro positivo>`. O comando usa dry run por padrão e limita cada fase a 100 registros, configurável com `--limit` até 500.

Na raiz do monorepo, simule uma janela de 24 horas:

```powershell
pnpm --filter @vavito/api run media:cleanup -- --older-than-hours=24
```

Revise o log estruturado `media_orphan_cleanup`. Para executar as alterações, repita a mesma janela e o mesmo limite com `--execute`:

```powershell
pnpm --filter @vavito/api run media:cleanup -- --older-than-hours=24 --execute
```

O processo possui duas fases e nunca marca e remove o mesmo asset na mesma execução:

1. `READY` criado antes do corte e sem associação é revalidado e marcado como `ORPHANED`;
2. `ORPHANED` cujo `orphanedAt` já ultrapassou uma segunda janela é revalidado, removido do Storage e só então excluído do PostgreSQL.

Se uma referência aparecer antes do purge, o asset volta para `READY`. Uma falha de Storage mantém o registro; uma falha ao excluir o registro após remover o objeto é reportada como inconsistência operacional. Falhas aparecem em `failedIds` e fazem o comando terminar com código diferente de zero. O log também informa os IDs que seriam marcados ou removidos no dry run, sem registrar credenciais ou respostas brutas do provedor.

## Verificação

Antes de concluir a configuração de um ambiente, confirme:

- o bucket está no projeto Supabase correto;
- leitura pela URL pública funciona;
- upload com publishable/anon key falha por ausência de policy de escrita;
- upload e remoção com a service role funcionam somente no backend;
- limite e MIME types coincidem com a tabela desta documentação.
