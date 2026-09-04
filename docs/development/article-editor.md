# Editor de artigos

## Schema do conteúdo

O editor administrativo usa Tiptap e persiste o documento em JSON. A configuração inicial reúne:

- `StarterKit`, com títulos `H2` e `H3`, parágrafos, listas ordenadas e não ordenadas, citação, código em linha e bloco de código;
- links normalizados com `https` como protocolo padrão;
- imagens editoriais por nodes `image`, sem aceitar conteúdo em base64;
- placeholder exclusivamente visual, sem entrar no JSON persistido.

O frontend envia o documento junto de `contentSchemaVersion: 1`. Essa versão corresponde a
`CURRENT_POST_CONTENT_SCHEMA_VERSION` no backend e deve ser alterada de forma coordenada quando uma
mudança incompatível for introduzida.

No Next.js, o Tiptap fica restrito ao Client Component do editor e usa `immediatelyRender: false`
para evitar divergências de hidratação. Páginas e layouts administrativos continuam Server
Components sempre que não precisarem de interação.

## Imagens e capa

Imagens inseridas no corpo pertencem ao JSON do conteúdo. A capa não é um node do documento: ela é
um `MediaAsset` associado ao post como `COVER` e enviado à API por `coverMediaId`. Essa separação
permite usar a capa na listagem, nos artigos relacionados, na página de leitura e nos metadados
sociais sem interpretar o conteúdo do editor.

O schema já reconhece nodes de imagem. O upload e a inserção do arquivo no editor serão conectados
ao `MediaController` na Task 12.3, incluindo progresso, remoção em caso de falha e texto alternativo
obrigatório.
