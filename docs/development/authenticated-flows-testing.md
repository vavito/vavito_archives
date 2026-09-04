# Testes dos fluxos autenticados

A Task 11.7 combina componentes e serviços em Vitest com fluxos reais do frontend no Playwright. As contas dos testes são descartáveis e exclusivas de cada cenário.

## Execução

- `pnpm test:web`: componentes e integração do frontend.
- `pnpm test:e2e:auth`: fluxos autenticados em Chromium desktop/mobile e WebKit com emulação de iPhone.
- `pnpm test:e2e:public`: regressão da navegação pública.
- Primeira execução: `pnpm --filter @vavito/e2e exec playwright install chromium webkit`.

O Playwright inicia e encerra seus próprios servidores locais. A suíte autenticada usa as portas 3101 (frontend), 4101 (Auth/API controlados) e 4100 (conteúdo público). A pública usa 3100 e 4100. Não executar as duas suítes simultaneamente. Nenhuma ocupa a porta 3000.

Ambas usam `.next-e2e`, separado do diretório de desenvolvimento habitual. Não reutilizam servidores existentes. Não necessitam de banco, senha, email real ou chaves do Supabase/Resend. Os valores de conexão são substituídos apenas nos processos de teste.

## Cobertura

- Login pela interface, cookies, consulta e edição do nome do perfil.
- Logout pelo perfil no mobile e pelo menu da conta no desktop, seguido de acesso negado à rota privada; o botão do perfil fica oculto no desktop.
- Criação, edição e exclusão de comentário; indicação de edição.
- Reação persistida após recarregar e remoção ao repetir a ação.
- Salvamento persistido, isolamento entre leitores e biblioteca vazia após remoção.
- Orientação ao visitante antes de salvar ou reagir.
- Troca de senha, nova entrada e rejeição da renovação de outra sessão.
- Falha parcial após alterar senha, feedback e repetição somente do logout.
- Componentes também validam loading, falha de rede, validações e bloqueio durante operações.
- Comentários sem `crypto.randomUUID`, reproduzindo a ausência dessa função no acesso mobile por HTTP local.
- Comentário e resposta com 1.900 caracteres sem espaços: quebra de texto, ausência de overflow horizontal e crescimento controlado do campo.
- Autor com nome/foto pública (ou iniciais), quatro ordenações, busca na mesma origem, cópia sem compartilhamento nativo e progresso fixo da leitura.

## Refinamentos de leitura e conversa

O detalhe público expõe apenas `author.displayName` e `author.avatarUrl`. O avatar reutiliza o componente de perfil. A barra de leitura fica em um portal no `body`, fora das transformações de entrada da página, e calcula o avanço pelo conteúdo do artigo, sem incluir comentários e rodapé.

Os campos de comentário, edição e resposta crescem com os primeiros 1.000 caracteres e depois usam rolagem interna. Tanto no desktop quanto no mobile, o crescimento acompanha novas linhas visuais (quebra automática ou Enter), apenas quando o conteúdo ultrapassa a altura disponível. A medição usa a largura e a fonte reais do campo, sem interferência da animação de entrada ou de uma barra de rolagem prematura. Há um teto de 640px para conteúdos com muitas quebras de linha; o redimensionamento manual fica desativado. O limite de envio continua em 2.000 caracteres.

A leitura usa o centro vertical da tela como referência. O progresso começa quando o início do conteúdo chega a essa linha e termina quando o fim passa por ela. Quando o texto já começa acima do centro na abertura, a contagem começa em zero no topo da página. Resultados de busca entram com fade e pequeno deslocamento vertical, respeitando movimento reduzido; o hover não desloca a caixa horizontalmente.

## Limites

O frontend Next.js, o SDK Supabase, os cookies e as Server Actions são reais. Os serviços HTTP em `tests/e2e/support` são dublês locais dos contratos do Auth e da API, não instâncias de Supabase ou NestJS. Essa suíte não demonstra por si só a segurança do provedor, persistência PostgreSQL ou entrega de emails. Essas verificações continuam nas suítes da API e nos testes manuais com o provedor.

O dublê modela refresh tokens revogados sem prometer invalidação imediata dos access tokens. Cada teste cria uma identidade única. O processo descartado elimina seus dados. Endpoints `/__test/*` existem somente nesse servidor de teste, nunca no backend da aplicação.

## CI

O job Web executa a suíte autenticada após a pública. Falhas geram screenshot e trace locais em `tests/e2e/test-results`. Não usar credenciais reais nesses testes nem publicar traces de sessões reais.
