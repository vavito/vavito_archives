import type {
  AdminPostDetail,
  AdminPostStatus,
  AdminPostSummary,
  AdminPostsPage,
} from '../types/admin-post.types';

const postStatuses = new Set<AdminPostStatus>(['ARCHIVED', 'DRAFT', 'PUBLISHED']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function normalizeAuthor(value: unknown): AdminPostSummary['author'] | null {
  if (!isRecord(value)) return null;
  const id = requiredString(value['id']);
  const displayName = requiredString(value['displayName']);
  return id && displayName ? { displayName, id } : null;
}

export function normalizeAdminPostSummary(value: unknown): AdminPostSummary {
  if (!isRecord(value)) throw new Error('Não foi possível confirmar os dados do artigo.');

  const author = normalizeAuthor(value['author']);
  const id = requiredString(value['id']);
  const status = value['status'];
  const title = typeof value['title'] === 'string' ? value['title'] : null;
  const updatedAt = requiredString(value['updatedAt']);

  if (
    !author ||
    !id ||
    !postStatuses.has(status as AdminPostStatus) ||
    title === null ||
    !updatedAt
  ) {
    throw new Error('Não foi possível confirmar os dados do artigo.');
  }

  return {
    author,
    editedAt: nullableString(value['editedAt']),
    id,
    publishedAt: nullableString(value['publishedAt']),
    slug: nullableString(value['slug']),
    status: status as AdminPostStatus,
    title,
    updatedAt,
  };
}

export function normalizeAdminPostDetail(value: unknown): AdminPostDetail {
  const summary = normalizeAdminPostSummary(value);

  if (
    !isRecord(value) ||
    !isRecord(value['content']) ||
    !Number.isInteger(value['contentSchemaVersion']) ||
    !Number.isInteger(value['readingTimeMinutes']) ||
    !Number.isInteger(value['viewCount']) ||
    !Array.isArray(value['tags']) ||
    !requiredString(value['createdAt'])
  ) {
    throw new Error('Não foi possível confirmar os dados completos do artigo.');
  }

  return {
    ...summary,
    archivedAt: nullableString(value['archivedAt']),
    content: value['content'],
    contentSchemaVersion: value['contentSchemaVersion'] as number,
    coverAlt: nullableString(value['coverAlt']),
    coverMediaId: nullableString(value['coverMediaId']),
    coverPositionX: typeof value['coverPositionX'] === 'number' ? value['coverPositionX'] : 50,
    coverPositionY: typeof value['coverPositionY'] === 'number' ? value['coverPositionY'] : 50,
    coverScale: typeof value['coverScale'] === 'number' ? value['coverScale'] : 100,
    coverUrl: nullableString(value['coverUrl']),
    createdAt: value['createdAt'] as string,
    excerpt: nullableString(value['excerpt']),
    hasPendingChanges: value['hasPendingChanges'] === true,
    readingTimeMinutes: value['readingTimeMinutes'] as number,
    seoDescription: nullableString(value['seoDescription']),
    seoTitle: nullableString(value['seoTitle']),
    tagNames: Array.isArray(value['tagNames'])
      ? value['tagNames'].filter((name): name is string => typeof name === 'string')
      : (value['tags'] as AdminPostDetail['tags']).map(({ name }) => name),
    tags: value['tags'] as AdminPostDetail['tags'],
    viewCount: value['viewCount'] as number,
  };
}

export function normalizeAdminPostsPage(
  value: unknown,
  filters: AdminPostsPage['filters'],
): AdminPostsPage {
  if (!isRecord(value) || !Array.isArray(value['items']) || !isRecord(value['meta'])) {
    throw new Error('Não foi possível confirmar a listagem de artigos.');
  }

  const { limit, page, total, totalPages } = value['meta'];
  if (![limit, page, total, totalPages].every(Number.isInteger)) {
    throw new Error('Não foi possível confirmar a paginação dos artigos.');
  }

  return {
    filters,
    items: value['items'].map((item) => normalizeAdminPostSummary(item)),
    meta: {
      limit: limit as number,
      page: page as number,
      total: total as number,
      totalPages: totalPages as number,
    },
  };
}
