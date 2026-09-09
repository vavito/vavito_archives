import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';

const host = '127.0.0.1';
const port = Number(process.env.E2E_API_PORT ?? 4100);
const contactMessages = [];
const newsletterSubscriptions = new Map();
const newsletterToken = () => randomBytes(32).toString('base64url');

const tags = [
  {
    id: '019c2d62-6e90-7000-8000-000000000011',
    name: 'TypeScript',
    publishedPostCount: 2,
    slug: 'typescript',
  },
  {
    id: '019c2d62-6e90-7000-8000-000000000012',
    name: 'Prisma',
    publishedPostCount: 1,
    slug: 'prisma',
  },
];

const posts = [
  {
    coverAlt: null,
    coverUrl: null,
    excerpt: 'Uma visão prática para organizar módulos e dependências.',
    id: '019c2d62-6e90-7000-8000-000000000020',
    publishedAt: '2026-08-20T12:00:00.000Z',
    readingTimeMinutes: 6,
    slug: 'arquitetura-nestjs',
    tags: [tags[0]],
    title: 'Arquitetura NestJS',
    viewCount: 128,
  },
  {
    coverAlt: null,
    coverUrl: null,
    excerpt: 'Modelagem e consultas seguras com Prisma e PostgreSQL.',
    id: '019c2d62-6e90-7000-8000-000000000021',
    publishedAt: '2026-08-19T12:00:00.000Z',
    readingTimeMinutes: 5,
    slug: 'prisma-com-postgresql',
    tags: [tags[0], tags[1]],
    title: 'Prisma com PostgreSQL',
    viewCount: 96,
  },
];

const articleContent = {
  content: [
    {
      content: [
        {
          text: 'Este conteúdo confirma que a leitura completa foi carregada.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
  ],
  type: 'doc',
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Origin': 'http://127.0.0.1:3100',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let raw = '';
  for await (const chunk of request) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function sendFailure(response, path, statusCode = 503) {
  sendJson(response, statusCode, {
    code: 'TEST_SERVER_UNAVAILABLE',
    details: null,
    message: 'Servidor de teste indisponível.',
    path,
    requestId: 'e2e-request-id',
    statusCode,
    timestamp: '2026-08-31T12:00:00.000Z',
  });
}

function listPosts(url) {
  const tag = url.searchParams.get('tag');
  const sort = url.searchParams.get('sort');
  const limit = Math.max(1, Number(url.searchParams.get('limit') ?? 12));
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const filteredPosts = tag
    ? posts.filter((post) => post.tags.some((postTag) => postTag.slug === tag))
    : posts;
  const orderedPosts = [...filteredPosts].sort((left, right) =>
    sort === 'popular'
      ? right.viewCount - left.viewCount
      : sort === 'least-viewed'
        ? left.viewCount - right.viewCount
        : sort === 'oldest'
          ? left.publishedAt.localeCompare(right.publishedAt)
          : right.publishedAt.localeCompare(left.publishedAt),
  );
  const start = (page - 1) * limit;

  return {
    items: orderedPosts.slice(start, start + limit),
    meta: {
      limit,
      page,
      total: orderedPosts.length,
      totalPages: Math.ceil(orderedPosts.length / limit),
    },
  };
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${host}:${port}`);

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Origin': 'http://127.0.0.1:3100',
      });
      response.end();
      return;
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { status: 'ok' });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/__test/contact-messages') {
      sendJson(response, 200, contactMessages);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/__test/newsletter-subscriptions') {
      const email = url.searchParams.get('email');
      sendJson(response, 200, newsletterSubscriptions.get(email) ?? null);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/v1/contact') {
      const body = await readJson(request);
      contactMessages.push({ id: randomUUID(), ...body });
      sendJson(response, 202, {
        message: 'Mensagem recebida. Retornaremos assim que possível.',
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/v1/newsletter/subscriptions') {
      const body = await readJson(request);
      const subscription = {
        email: body.email,
        status: 'PENDING',
        confirmationToken: newsletterToken(),
        unsubscribeToken: newsletterToken(),
      };
      newsletterSubscriptions.set(body.email, subscription);
      sendJson(response, 202, {
        message: 'Confira seu email para confirmar a inscrição.',
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/v1/newsletter/subscriptions/confirm') {
      const body = await readJson(request);
      const subscription = [...newsletterSubscriptions.values()].find(
        (item) => item.confirmationToken === body.token,
      );
      if (!subscription) {
        sendFailure(response, url.pathname, 400);
        return;
      }
      subscription.status = 'ACTIVE';
      sendJson(response, 200, { message: 'Inscrição confirmada.' });
      return;
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/api/v1/newsletter/subscriptions/unsubscribe'
    ) {
      const body = await readJson(request);
      const subscription = [...newsletterSubscriptions.values()].find(
        (item) => item.unsubscribeToken === body.token,
      );
      if (!subscription) {
        sendFailure(response, url.pathname, 400);
        return;
      }
      subscription.status = 'UNSUBSCRIBED';
      sendJson(response, 204);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/tags') {
      sendJson(response, 200, tags);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/posts/search') {
      const query = (url.searchParams.get('q') ?? '').toLocaleLowerCase('pt-BR');
      const results = posts.filter((post) =>
        [post.title, post.excerpt, ...post.tags.map((tag) => tag.name)]
          .join(' ')
          .toLocaleLowerCase('pt-BR')
          .includes(query),
      );

      sendJson(response, 200, results);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/v1/posts') {
      if (url.searchParams.get('tag') === 'erro') {
        sendFailure(response, url.pathname);
        return;
      }

      sendJson(response, 200, listPosts(url));
      return;
    }

    const articleMatch = url.pathname.match(/^\/api\/v1\/posts\/([^/]+)$/u);

    if (request.method === 'GET' && articleMatch) {
      const slug = decodeURIComponent(articleMatch[1] ?? '');

      if (slug === 'falha') {
        sendFailure(response, url.pathname);
        return;
      }

      const post =
        slug === 'leitura-longa'
          ? { ...posts[0], slug, title: 'Leitura longa' }
          : posts.find((candidate) => candidate.slug === slug);

      if (!post) {
        sendFailure(response, url.pathname, 404);
        return;
      }

      sendJson(response, 200, {
        ...post,
        content:
          slug === 'leitura-longa'
            ? {
                type: 'doc',
                content: Array.from({ length: 35 }, (_, index) => ({
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: `Etapa ${index + 1}. ${'Uma pausa para observar, registrar ideias e continuar aprendendo. '.repeat(8)}`,
                    },
                  ],
                })),
              }
            : articleContent,
        contentSchemaVersion: 1,
        author: { avatarUrl: null, displayName: 'João Victor' },
        reactionCounts: { dislike: 0, like: 4 },
        seoDescription: null,
        seoTitle: null,
        viewer: null,
      });
      return;
    }

    if (request.method === 'POST' && /^\/api\/v1\/posts\/[^/]+\/views$/u.test(url.pathname)) {
      response.writeHead(204, {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:3100',
      });
      response.end();
      return;
    }

    sendFailure(response, url.pathname, 404);
  } catch {
    sendFailure(response, request.url ?? '/', 500);
  }
});

server.listen(port, host, () => {
  process.stdout.write(`API pública de teste em http://${host}:${port}\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
