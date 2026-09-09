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

Na leitura e no preview, links inseridos no conteúdo abrem em uma nova guia com `noopener noreferrer`.

## Imagens e capa

No painel, a seção **Capa do artigo** fica entre os dados editoriais e o conteúdo. Ela permite
adicionar, trocar ou remover a capa e editar sua descrição. Um clique duplo ativa o ajuste direto:
arrastar reposiciona a imagem horizontal e verticalmente dentro da moldura; os controles `−/+`, a
roda do mouse e as teclas `−/+` ajustam o zoom entre 100% e 160%. As setas reposicionam a capa pelo
teclado. A prévia mantém a proporção `16:9` e inclui escala e posição no mesmo autosave do rascunho.
O envio exige a mesma validação de formato, tamanho e descrição acessível usada pelas imagens do
corpo.

Imagens inseridas no corpo pertencem ao JSON do conteúdo. A capa não é um node do documento: ela é
um `MediaAsset` associado ao post como `COVER` e enviado à API por `coverMediaId`. Essa separação
permite usar a capa na listagem, nos artigos relacionados, na página de leitura e nos metadados
sociais sem interpretar o conteúdo do editor.

O schema reconhece nodes de imagem. O upload e a inserção do arquivo usam o `MediaController`,
incluindo progresso, cancelamento em caso de falha e texto alternativo obrigatório.

### Upload no corpo do artigo

O botão de imagem abre um formulário no próprio editor. Antes do envio, o frontend exige um arquivo
JPEG, PNG ou WebP de até 10 MB e uma descrição acessível não vazia. A API repete todas as validações
como fonte de verdade.

O navegador envia o `multipart/form-data` diretamente ao endpoint administrativo autenticado para
acompanhar o progresso real da transferência. A interface mantém percentual, estado ocupado e
mensagem segura de falha; cancelar o formulário interrompe a requisição em andamento.

Depois da resposta `READY`, o editor insere no JSON um node `image` com URL pública, descrição,
largura e altura disponíveis. A leitura pública usa os mesmos atributos. Selecionar a imagem no
editor permite alterar sua descrição, ajustar sua largura ou removê-la do documento. Essa remoção não apaga imediatamente o objeto do
Storage: enquanto não houver uma associação persistida com um post, o ciclo de limpeza de mídia
órfã permanece responsável por sua remoção segura.

## Autosave de rascunho

O editor mantém um único salvamento em andamento. Alterações de título, resumo, endereço, capa e conteúdo
aguardam 800 ms sem nova digitação antes de serem enviadas; se outra alteração acontecer durante a
requisição, ela permanece pendente e é salva depois, sem concorrer com a versão anterior. Assim, a
última versão editada no navegador é a última enviada ao servidor.

Em artigos já publicados, o autosave grava uma versão pendente separada. O conteúdo que os leitores
veem não muda durante a escrita; o cabeçalho informa a pendência e oferece **Publicar alterações**
para promover a versão salva e registrar a revisão do conteúdo público anterior. A ação **Descartar
alterações** remove integralmente essa versão pendente e recupera no editor o conteúdo ainda público.

Os tópicos são informados no próprio editor e só viram chips depois de confirmados com vírgula,
`Enter` ou ao sair do campo; digitar parcialmente não cria uma tag. O frontend os envia em
`tagNames`; a API normaliza, reutiliza ou cria as tags e a interface pública as apresenta como
hashtags que também funcionam como filtros da listagem.

Na primeira alteração, o frontend cria um `DRAFT` e guarda somente seu identificador no
armazenamento local do navegador. Ao reabrir `/admin`, esse identificador consulta novamente a API,
que continua sendo a fonte de verdade do conteúdo. Um identificador que já não existe é descartado
com segurança.

O cabeçalho anuncia os estados de recuperação, alterações pendentes, salvamento, sucesso e falha.
Falhas não descartam a versão local ainda aberta: a ação **Tentar novamente** envia o conteúdo mais
recente. Rascunhos não geram `PostRevision` a cada autosave, conforme a regra do modelo de dados.

## Administração e preview

A rota protegida `/admin/posts` lista conteúdos de todos os estados com busca, paginação e filtro por
`DRAFT`, `PUBLISHED` ou `ARCHIVED`. Abrir um item leva o identificador à rota `/admin`, que recupera
o documento administrativo completo e passa a tratá-lo como o rascunho ativo daquele navegador.
Solicitar um novo artigo limpa apenas essa referência local; nenhum conteúdo existente é apagado.

O preview usa `GET /admin/posts/:id` e permanece dentro do grupo administrativo. Ele renderiza o
mesmo JSON Tiptap da leitura pública, mas não depende do endpoint público nem torna um rascunho
acessível fora da sessão de administrador. A tela deixa explícito que se trata de uma visualização
privada e não registra visualização, comentário ou reação.

O endereço editorial pode ser ajustado no editor e participa do autosave. Um conflito
`SLUG_ALREADY_EXISTS` mantém o conteúdo pendente, destaca o campo correspondente e oferece a mesma
tentativa manual usada pelas demais falhas de salvamento.

## Transições editoriais

A listagem, o preview e o cabeçalho do editor conectam as ações de publicar, despublicar, arquivar e
restaurar como rascunho aos endpoints administrativos específicos. Cada transição exige confirmação
e mantém os controles ocupados enquanto o servidor processa a solicitação. A interface só assume o
novo estado depois da resposta da API e apresenta um feedback flutuante de sucesso ou falha.

Publicar exige título, resumo, endereço e conteúdo preenchidos. Conflitos `409` são traduzidos em
orientações amigáveis, incluindo os campos ainda incompletos ou a necessidade de atualizar um estado
que mudou. Artigos arquivados permanecem visíveis para administração e preview, mas o editor bloqueia
alterações até que sejam restaurados como rascunho.

Depois de uma transição, o frontend revalida a Home, a listagem pública, a gestão administrativa, o
preview e a URL pública conhecida do artigo. Assim, o estado renderizado volta a ser obtido da API no
mesmo fluxo da ação.
