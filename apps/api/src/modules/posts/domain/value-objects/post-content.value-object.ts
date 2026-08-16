import { PostContentInvalidError } from '@api/modules/posts/domain/errors/post-content-invalid.error';

export const CURRENT_POST_CONTENT_SCHEMA_VERSION = 1;
export const SUPPORTED_POST_CONTENT_SCHEMA_VERSIONS = new Set<number>([
  CURRENT_POST_CONTENT_SCHEMA_VERSION,
]);

export type TiptapDocument = Readonly<{
  content: readonly TiptapNode[];
  type: 'doc';
}> &
  Readonly<Record<string, unknown>>;

export type TiptapNode = Readonly<Record<string, unknown>>;

const MEANINGFUL_ATOMIC_NODE_TYPES = new Set(['audio', 'embed', 'image', 'video', 'youtube']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value) as { constructor?: { name?: string } } | null;

  return prototype === null || prototype.constructor?.name === 'Object';
}

function isJsonValue(value: unknown, ancestors = new Set<object>()): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return true;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    if (ancestors.has(value)) {
      return false;
    }

    ancestors.add(value);
    const valid = value.every((item) => isJsonValue(item, ancestors));
    ancestors.delete(value);
    return valid;
  }
  if (!isPlainObject(value) || ancestors.has(value)) {
    return false;
  }

  ancestors.add(value);
  const valid = Object.values(value).every((item) => isJsonValue(item, ancestors));
  ancestors.delete(value);
  return valid;
}

function isTiptapNode(value: unknown): value is TiptapNode {
  if (!isPlainObject(value) || typeof value['type'] !== 'string') {
    return false;
  }
  if (value['type'].trim().length === 0) {
    return false;
  }
  if (value['text'] !== undefined && typeof value['text'] !== 'string') {
    return false;
  }
  if (value['content'] === undefined) {
    return true;
  }

  return Array.isArray(value['content']) && value['content'].every(isTiptapNode);
}

function isTiptapDocument(value: unknown): value is TiptapDocument {
  return (
    isPlainObject(value) &&
    value['type'] === 'doc' &&
    Array.isArray(value['content']) &&
    value['content'].every(isTiptapNode)
  );
}

function hasMeaningfulContent(node: TiptapNode): boolean {
  const text = node['text'];
  if (typeof text === 'string' && text.trim().length > 0) {
    return true;
  }

  const type = node['type'];
  if (typeof type === 'string' && MEANINGFUL_ATOMIC_NODE_TYPES.has(type)) {
    return true;
  }

  const children = node['content'];
  return Array.isArray(children) && children.some(hasMeaningfulContent);
}

function cloneDocument(document: TiptapDocument): TiptapDocument {
  return structuredClone(document);
}

export class PostContent {
  private readonly storedDocument: TiptapDocument;

  private constructor(
    document: TiptapDocument,
    readonly schemaVersion: number,
  ) {
    this.storedDocument = cloneDocument(document);
  }

  static create(document: unknown, schemaVersion: number): PostContent {
    if (
      !SUPPORTED_POST_CONTENT_SCHEMA_VERSIONS.has(schemaVersion) ||
      !isJsonValue(document) ||
      !isTiptapDocument(document)
    ) {
      throw new PostContentInvalidError();
    }

    return new PostContent(document, schemaVersion);
  }

  get document(): TiptapDocument {
    return cloneDocument(this.storedDocument);
  }

  get isEmpty(): boolean {
    return !this.storedDocument.content.some(hasMeaningfulContent);
  }
}
