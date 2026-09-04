// Local contract double only. Never used by the application or connected to real accounts.
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';

const users = new Map();
const sessions = new Map();
const comments = [];
const origin = 'http://127.0.0.1:3101';
const publicApi = 'http://127.0.0.1:4100';
const now = () => new Date().toISOString();
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

function sessionFor(user) {
  const id = randomUUID();
  const token = [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({
      sub: user.id,
      email: user.email,
      aud: 'authenticated',
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      session_id: id,
    }),
    encode('local-test-signature'),
  ].join('.');
  const session = {
    access_token: token,
    refresh_token: randomUUID(),
    token_type: 'bearer',
    expires_in: 3600,
    user: user.identity,
  };
  sessions.set(token, { ...session, userId: user.id, revoked: false });
  return session;
}

function json(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers':
      'authorization,apikey,content-type,x-client-info,x-supabase-api-version',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  });
  res.end(code === 204 ? undefined : JSON.stringify(body));
}

function page(items) {
  return {
    items,
    meta: { page: 1, limit: 20, total: items.length, totalPages: items.length ? 1 : 0 },
  };
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1:4101');
    const path = url.pathname;
    if (req.method === 'OPTIONS') return json(res, 204);
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    const token = req.headers.authorization?.replace(/^Bearer /u, '');
    const session = sessions.get(token);
    const user = session ? users.get(session.userId) : null;

    if (path === '/health') return json(res, 200, { status: 'ok' });
    if (path === '/__test/users' && req.method === 'POST') {
      const id = randomUUID();
      const email = `reader-${id}@example.test`;
      const password = 'Teste@Senha123';
      const profile = {
        id,
        displayName: 'Leitor de teste',
        avatarUrl: null,
        role: 'USER',
        createdAt: now(),
        updatedAt: now(),
      };
      const identity = {
        id,
        email,
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { display_name: profile.displayName },
        created_at: now(),
        email_confirmed_at: now(),
      };
      users.set(id, {
        id,
        email,
        password,
        profile,
        identity,
        bookmarks: new Set(),
        reactions: new Map(),
        failLogout: false,
      });
      return json(res, 201, { id, email, password });
    }
    if (path.startsWith('/__test/fail-logout/') && req.method === 'POST') {
      const target = users.get(path.split('/').at(-1));
      if (!target) return json(res, 404, {});
      target.failLogout = true;
      return json(res, 204);
    }
    if (path === '/auth/v1/token') {
      const target =
        url.searchParams.get('grant_type') === 'refresh_token'
          ? [...sessions.values()].find(
              (item) => item.refresh_token === body.refresh_token && !item.revoked,
            )
          : null;
      const account = target
        ? users.get(target.userId)
        : [...users.values()].find(
            (item) => item.email === body.email && item.password === body.password,
          );
      if (!account)
        return json(res, 400, {
          code: 'invalid_credentials',
          error_code: 'invalid_credentials',
          msg: 'Invalid credentials',
        });
      return json(res, 200, sessionFor(account));
    }
    if (path.startsWith('/auth/v1/')) {
      if (!user) return json(res, 401, { code: 'session_not_found', msg: 'Session missing' });
      if (path === '/auth/v1/user') {
        if (req.method === 'PUT') user.password = body.password;
        // Existing JWTs can remain valid after global logout, until their expiry.
        return json(res, 200, user.identity);
      }
      if (path === '/auth/v1/logout') {
        if (user.failLogout) {
          user.failLogout = false;
          return json(res, 422, { code: 'test_logout_failure', msg: 'Controlled failure' });
        }
        for (const [key, item] of sessions) {
          if (
            (url.searchParams.get('scope') === 'global' && item.userId === user.id) ||
            key === token
          )
            item.revoked = true;
        }
        return json(res, 204);
      }
    }
    if (path === '/api/v1/profiles/me') {
      if (!user) return json(res, 401, { message: 'Unauthorized' });
      if (req.method === 'PATCH') user.profile.displayName = body.displayName;
      return json(res, 200, user.profile);
    }
    const engagement = path.match(/^\/api\/v1\/posts\/([^/]+)\/(bookmark|reaction)$/u);
    if (engagement) {
      if (!user) return json(res, 401, {});
      const [, id, action] = engagement;
      if (action === 'bookmark') {
        if (req.method === 'DELETE') user.bookmarks.delete(id);
        else user.bookmarks.add(id);
        return json(res, req.method === 'DELETE' ? 204 : 200, {
          bookmarked: user.bookmarks.has(id),
        });
      }
      if (req.method === 'DELETE') user.reactions.delete(id);
      else user.reactions.set(id, body.type);
      return json(res, req.method === 'DELETE' ? 204 : 200, {
        reaction: user.reactions.get(id) ?? null,
        counts: counts(id),
      });
    }
    if (path === '/api/v1/bookmarks') {
      if (!user) return json(res, 401, {});
      const all = await fetch(`${publicApi}/api/v1/posts`).then((r) => r.json());
      return json(res, 200, page(all.items.filter((post) => user.bookmarks.has(post.id))));
    }
    const thread = path.match(/^\/api\/v1\/posts\/([^/]+)\/comments$/u);
    if (thread) {
      if (req.method === 'POST') {
        if (!user) return json(res, 401, {});
        const post = await fetch(`${publicApi}/api/v1/posts/${thread[1]}`).then((r) => r.json());
        const comment = {
          id: randomUUID(),
          postId: post.id,
          slug: thread[1],
          parentId: body.parentId ?? null,
          content: body.content,
          status: 'VISIBLE',
          author: user.profile,
          edited: false,
          editedAt: null,
          createdAt: now(),
          replies: [],
        };
        comments.push(comment);
        return json(res, 201, comment);
      }
      return json(
        res,
        200,
        page(
          comments
            .filter((item) => item.slug === thread[1] && !item.parentId)
            .map((item) => ({
              ...item,
              replies: comments.filter((reply) => reply.parentId === item.id),
            })),
        ),
      );
    }
    const commentId = path.match(/^\/api\/v1\/comments\/([^/]+)$/u);
    if (commentId) {
      const comment = comments.find((item) => item.id === commentId[1]);
      if (!user || comment?.author.id !== user.id) return json(res, 403, {});
      if (req.method === 'DELETE') {
        comment.status = 'DELETED';
        comment.content = null;
        return json(res, 204);
      }
      comment.content = body.content;
      comment.edited = true;
      comment.editedAt = now();
      return json(res, 200, comment);
    }
    const upstream = await fetch(`${publicApi}${path}${url.search}`, { method: req.method });
    if (upstream.status === 204) return json(res, 204);
    const data = await upstream.json();
    if (/^\/api\/v1\/posts\/[^/]+$/u.test(path) && data.id) {
      data.viewer = user
        ? { bookmarked: user.bookmarks.has(data.id), reaction: user.reactions.get(data.id) ?? null }
        : null;
      data.reactionCounts = counts(data.id);
    }
    return json(res, upstream.status, data);
  } catch {
    return json(res, 500, { message: 'Fixture failure' });
  }
});

function counts(id) {
  const values = [...users.values()].map((user) => user.reactions.get(id));
  return {
    like: values.filter((value) => value === 'LIKE').length,
    dislike: values.filter((value) => value === 'DISLIKE').length,
  };
}
server.listen(4101, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit(0)));
