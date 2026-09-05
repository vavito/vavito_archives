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

## Formatação e atalhos

A barra principal mantém as ações editoriais visíveis. Ao selecionar texto, uma barra contextual
oferece negrito, itálico, link e código em linha; em um parágrafo vazio, a barra de blocos oferece
H2, H3, citação e bloco de código. Todos os botões expõem nome, estado ativo e atalho ao navegador.

O editor preserva os atalhos do `StarterKit`, incluindo `Ctrl/⌘ + B` para negrito,
`Ctrl/⌘ + I` para itálico e `Ctrl/⌘ + Alt + 2` ou `3` para títulos. `Ctrl/⌘ + K` abre o campo de
link. Endereços sem protocolo recebem `https://`; protocolos não reconhecidos não são executados
como esquemas e também são tratados como endereços HTTPS.

## Imagens e capa

Imagens inseridas no corpo pertencem ao JSON do conteúdo. A capa não é um node do documento: ela é
um `MediaAsset` associado ao post como `COVER` e enviado à API por `coverMediaId`. Essa separação
permite usar a capa na listagem, nos artigos relacionados, na página de leitura e nos metadados
sociais sem interpretar o conteúdo do editor.

O schema já reconhece nodes de imagem. O upload e a inserção do arquivo no editor serão conectados
ao `MediaController` na Task 12.3, incluindo progresso, remoção em caso de falha e texto alternativo
obrigatório.

### Upload no corpo do artigo

O botão de imagem abre um formulário no próprio editor. Antes do envio, o frontend exige um arquivo
JPEG, PNG ou WebP de até 10 MB e uma descrição acessível não vazia. A API repete todas as validações
como fonte de verdade.

O navegador envia o `multipart/form-data` diretamente ao endpoint administrativo autenticado para
acompanhar o progresso real da transferência. A interface mantém percentual, estado ocupado e
mensagem segura de falha; cancelar o formulário interrompe a requisição em andamento.

Depois da resposta `READY`, o editor insere no JSON um node `image` com URL pública, descrição,
largura e altura disponíveis. A leitura pública usa os mesmos atributos. Selecionar a imagem no
editor oferece a ação de removê-la do documento. Essa remoção não apaga imediatamente o objeto do
Storage: enquanto não houver uma associação persistida com um post, o ciclo de limpeza de mídia
órfã permanece responsável por sua remoção segura.
