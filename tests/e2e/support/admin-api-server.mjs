// Local contract double only. Never connects to Supabase, PostgreSQL or Storage.
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';

const host = '127.0.0.1';
const port = 4102;
const origin = 'http://127.0.0.1:3102';
const now = () => new Date().toISOString();
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const posts = new Map();

const admin = {
  email: 'admin-e2e@example.test',
  id: '019c2d62-6e90-7000-8000-000000000001',
  password: 'Admin@E2E123',
};
const profile = {
  avatarUrl: null,
  createdAt: now(),
  displayName: 'Admin E2E',
  id: admin.id,
  role: 'ADMIN',
  updatedAt: now(),
};
const identity = {
  app_metadata: { provider: 'email', providers: ['email'] },
  aud: 'authenticated',
  created_at: now(),
  email: admin.email,
  email_confirmed_at: now(),
  id: admin.id,
  role: 'authenticated',
  user_metadata: { display_name: profile.displayName },
};
const sessions = new Map();

function createSession() {
  const sessionId = randomUUID();
  const token = [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({
      aud: 'authenticated',
      email: admin.email,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      role: 'authenticated',
      session_id: sessionId,
      sub: admin.id,
    }),
    encode('local-test-signature'),
  ].join('.');
  const session = {
    access_token: token,
    expires_in: 3600,
    refresh_token: randomUUID(),
    token_type: 'bearer',
    user: identity,
  };
  sessions.set(token, session);
  return session;
}

function responseHeaders(contentType = 'application/json; charset=utf-8') {
  return {
    'Access-Control-Allow-Headers':
      'authorization,apikey,content-type,x-client-info,x-supabase-api-version',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Origin': origin,
    'Content-Type': contentType,
  };
}

function json(response, statusCode, body) {
  response.writeHead(statusCode, responseHeaders());
  response.end(statusCode === 204 ? undefined : JSON.stringify(body));
}

function isAuthenticated(request) {
  const token = request.headers.authorization?.replace(/^Bearer /u, '');
  return typeof token === 'string' && sessions.has(token);
}

function tagsFrom(names) {
  return names.map((name, index) => ({
    id: `019c2d62-6e90-7000-8000-${String(index + 100).padStart(12, '0')}`,
    name,
    publishedPostCount: 0,
    slug: name
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/gu, '')
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/gu, '-'),
  }));
}

function newPost(title = '') {
  const timestamp = now();
  return {
    archivedAt: null,
    author: { displayName: profile.displayName, id: profile.id },
    content: { content: [{ type: 'paragraph' }], type: 'doc' },
    contentSchemaVersion: 1,
    coverAlt: null,
    coverMediaId: null,
    coverPositionX: 50,
    coverPositionY: 50,
    coverScale: 100,
    coverUrl: null,
    createdAt: timestamp,
    editedAt: null,
    excerpt: null,
    hasPendingChanges: false,
    id: randomUUID(),
    pendingEditedAt: null,
    publishedAt: null,
    readingTimeMinutes: 1,
    seoDescription: null,
    seoTitle: null,
    slug: null,
    status: 'DRAFT',
    tagNames: [],
    tags: [],
    title,
    updatedAt: timestamp,
    viewCount: 0,
  };
}

function summary(post) {
  const { author, editedAt, id, publishedAt, slug, status, title, updatedAt } = post;
  return { author, editedAt, id, publishedAt, slug, status, title, updatedAt };
}

async function requestBody(request) {
  if (!request.headers['content-type']?.includes('application/json')) return {};
  let raw = '';
  for await (const chunk of request) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${host}:${port}`);
    const path = url.pathname;

    if (request.method === 'OPTIONS') return json(response, 204);
    if (request.method === 'GET' && path === '/health')
      return json(response, 200, { status: 'ok' });

    if (request.method === 'GET' && path === '/media/cover.png') {
      const image = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      );
      response.writeHead(200, responseHeaders('image/png'));
      return response.end(image);
    }

    const body = await requestBody(request);

    if (request.method === 'POST' && path === '/auth/v1/token') {
      if (body.email !== admin.email || body.password !== admin.password) {
        return json(response, 400, {
          code: 'invalid_credentials',
          error_code: 'invalid_credentials',
          msg: 'Invalid credentials',
        });
      }
      return json(response, 200, createSession());
    }

    if (path === '/auth/v1/user') {
      if (!isAuthenticated(request)) {
        return json(response, 401, { code: 'session_not_found', msg: 'Session missing' });
      }
      return json(response, 200, identity);
    }

    if (path === '/api/v1/profiles/me') {
      if (!isAuthenticated(request)) return json(response, 401, { message: 'Unauthorized' });
      return json(response, 200, profile);
    }

    if (path === '/api/v1/admin/media' && request.method === 'POST') {
      if (!isAuthenticated(request)) return json(response, 401, { message: 'Unauthorized' });
      return json(response, 201, {
        altText: 'Capa do fluxo editorial',
        createdAt: now(),
        height: 630,
        id: '019c2d62-6e90-7000-8000-000000000030',
        mimeType: 'image/png',
        path: 'e2e/cover.png',
        sizeBytes: 68,
        status: 'READY',
        url: `http://${host}:${port}/media/cover.png`,
        width: 1200,
      });
    }

    if (path.startsWith('/__test/posts/') && request.method === 'GET') {
      return json(response, 200, posts.get(path.split('/').at(-1)) ?? null);
    }

    if (!isAuthenticated(request)) return json(response, 401, { message: 'Unauthorized' });

    if (path === '/api/v1/admin/tags' && request.method === 'GET') {
      const tags = new Map();
      for (const post of posts.values()) {
        for (const tag of post.tags) {
          const existing = tags.get(tag.slug);
          tags.set(tag.slug, {
            ...tag,
            isPublic: true,
            publishedPostCount:
              (existing?.publishedPostCount ?? 0) + (post.status === 'PUBLISHED' ? 1 : 0),
          });
        }
      }
      return json(response, 200, [...tags.values()]);
    }

    if (path === '/api/v1/admin/posts' && request.method === 'GET') {
      const query = (url.searchParams.get('q') ?? '').toLowerCase();
      const status = url.searchParams.get('status');
      const items = [...posts.values()]
        .filter(
          (post) => !query || `${post.title} ${post.slug ?? ''}`.toLowerCase().includes(query),
        )
        .filter((post) => !status || post.status === status)
        .map(summary);
      return json(response, 200, {
        items,
        meta: { limit: 20, page: 1, total: items.length, totalPages: items.length ? 1 : 0 },
      });
    }

    if (path === '/api/v1/admin/posts' && request.method === 'POST') {
      const post = newPost(typeof body.title === 'string' ? body.title : '');
      posts.set(post.id, post);
      return json(response, 201, post);
    }

    const postRoute = path.match(/^\/api\/v1\/admin\/posts\/([^/]+)(?:\/(publish))?$/u);
    if (postRoute) {
      const post = posts.get(postRoute[1]);
      if (!post) return json(response, 404, { message: 'Not found' });

      if (request.method === 'GET' && !postRoute[2]) return json(response, 200, post);

      if (request.method === 'PATCH' && !postRoute[2]) {
        Object.assign(post, body, {
          excerpt: typeof body.excerpt === 'string' ? body.excerpt : post.excerpt,
          slug: typeof body.slug === 'string' ? body.slug : post.slug,
          tagNames: Array.isArray(body.tagNames) ? body.tagNames : post.tagNames,
          title: typeof body.title === 'string' ? body.title : post.title,
          updatedAt: now(),
        });
        post.tags = tagsFrom(post.tagNames);
        if (body.coverMediaId) {
          post.coverUrl = `http://${host}:${port}/media/cover.png`;
        }
        return json(response, 200, post);
      }

      if (request.method === 'POST' && postRoute[2] === 'publish') {
        post.status = 'PUBLISHED';
        post.publishedAt = now();
        post.updatedAt = now();
        return json(response, 200, post);
      }
    }

    return json(response, 404, { message: 'Fixture route not found' });
  } catch (error) {
    return json(response, 500, {
      message: error instanceof Error ? error.message : 'Fixture failure',
    });
  }
});

server.listen(port, host, () => {
  process.stdout.write(`Auth e API administrativos de teste em http://${host}:${port}\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
