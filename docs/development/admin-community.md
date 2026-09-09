# Moderação e campanhas no frontend

A administração oferece `/admin/comments` para a fila de comentários e `/admin/campaigns`
para a newsletter. A navegação compartilhada conecta essas áreas à gestão de artigos.
Todas as rotas e ações exigem uma sessão com perfil administrativo validado no servidor.
Os dados de negócio passam pelo cliente tipado e pela API NestJS.

## Comentários

A fila possui paginação e filtros por visível, oculto, spam e excluído. Comentários são públicos
desde a criação; aprovar restaura um comentário ocultado ou marcado como spam. A interface pede
confirmação e permite registrar um motivo de até 500 caracteres. Comentários excluídos não
oferecem ações de moderação.

O conteúdo original de uma exclusão passa a ser preservado para auditoria e continua visível apenas no painel. A resposta pública mantém o conteúdo oculto. **Ver artigo** abre a página pública quando o post está publicado e usa o preview protegido quando ele está em rascunho ou arquivado.

Após a resposta, a fila e as páginas de artigos são revalidadas. Conflitos de estado orientam a
atualizar a lista, sem assumir uma alteração que a API não confirmou.

## Campanhas

O painel lista campanhas da mais recente para a mais antiga, por estado e página. A criação permite buscar e selecionar de um a cinco artigos
publicados, preencher assunto e texto de prévia, e abrir o rascunho para revisão. O HTML exibido é o
snapshot produzido pela API, isolado em um iframe sem permissões de scripts, formulários ou acesso
à página administrativa. O cancelamento é personalizado por destinatário durante o envio.

Assunto e texto de prévia podem ser editados enquanto a campanha está em rascunho. Alterações
pendentes precisam ser salvas antes da confirmação de envio. O preview mostra a versão salva.

## Envio único e resultado incerto

O envio exige confirmação explícita. O servidor gera uma chave UUID ao abrir a campanha; o painel
reutiliza essa chave em novas tentativas da mesma operação. Quando a API já possui uma chave
persistida, ela é retomada. A exclusão mútua e a idempotência definitivas permanecem na API,
inclusive para abas ou dispositivos diferentes.

A requisição de envio permite até 60 segundos porque a API aguarda o processamento dos
destinatários. Se o resultado não for confirmado, o painel bloqueia novas ações até uma consulta
bem-sucedida por **Atualizar estado**. Um timeout não é apresentado como prova de que nenhum email
foi enviado.

Campanhas em envio, aceitas ou com falha não oferecem edição nem novo envio. **Envio aceito** não
garante chegada à caixa de entrada. Esta interface segue a implementação descrita em
[Campanhas da newsletter](newsletter-campaigns.md): não oferece retry automático de campanhas
parcialmente aceitas, embora o modelo conceitual original mencione uma transição de retry.

## Validação

Os testes de componentes e integração cobrem autorização das ações, conflitos de moderação,
campos permitidos, filtros, paginação, confirmação de envio, duplo clique, preservação da chave,
timeout e bloqueio de campanhas iniciadas. O transporte HTTP é exercitado com respostas
controladas; esses testes não enviam emails reais nem alteram comentários de produção.
