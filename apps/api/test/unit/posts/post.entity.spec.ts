import { Post } from '@api/modules/posts/domain/entities/post.entity';
import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { InvalidPostStatusTransitionError } from '@api/modules/posts/domain/errors/invalid-post-status-transition.error';
import { PostContentInvalidError } from '@api/modules/posts/domain/errors/post-content-invalid.error';
import { PostEditNotAllowedError } from '@api/modules/posts/domain/errors/post-edit-not-allowed.error';
import { PostNotReadyForPublicationError } from '@api/modules/posts/domain/errors/post-not-ready-for-publication.error';

const CREATED_AT = new Date('2026-08-16T10:00:00.000Z');
const CONTENT = {
  content: [{ content: [{ text: 'Conteúdo', type: 'text' }], type: 'paragraph' }],
  type: 'doc',
};
const EMPTY_CONTENT = { content: [], type: 'doc' };

function createPost(overrides: Partial<Parameters<typeof Post.create>[0]> = {}): Post {
  return Post.create({
    authorId: 'ad4ce1ef-339f-45dc-bb91-a2f7ffbf3026',
    content: CONTENT,
    contentSchemaVersion: 1,
    currentSlug: 'primeiro-artigo',
    excerpt: 'Resumo do artigo.',
    id: '957c8388-cb96-4f0c-98b3-56b84c1fe67e',
    now: CREATED_AT,
    readingTimeMinutes: 1,
    title: 'Primeiro artigo',
    ...overrides,
  });
}

describe('Post', () => {
  it('cria um rascunho sem datas de publicação, edição ou arquivamento', () => {
    const post = createPost();

    expect(post.status).toBe(PostStatus.DRAFT);
    expect(post.publishedAt).toBeNull();
    expect(post.archivedAt).toBeNull();
    expect(post.editedAt).toBeNull();
    expect(post.viewsCount).toBe(0);
    expect(post.createdAt).toEqual(CREATED_AT);
    expect(post.updatedAt).toEqual(CREATED_AT);
  });

  it('publica um rascunho completo', () => {
    const post = createPost();
    const publishedAt = new Date('2026-08-16T11:00:00.000Z');

    post.publish(publishedAt);

    expect(post.status).toBe(PostStatus.PUBLISHED);
    expect(post.publishedAt).toEqual(publishedAt);
    expect(post.updatedAt).toEqual(publishedAt);
  });

  it('rejeita publicação incompleta sem alterar o rascunho', () => {
    const post = createPost({
      content: EMPTY_CONTENT,
      currentSlug: null,
      excerpt: '   ',
      title: '',
    });

    expect(() => post.publish(new Date())).toThrow(PostNotReadyForPublicationError);

    expect(post.status).toBe(PostStatus.DRAFT);
    expect(post.publishedAt).toBeNull();
  });

  it('despublica um post e limpa publishedAt', () => {
    const post = createPost();
    post.publish(new Date('2026-08-16T11:00:00.000Z'));

    post.unpublish();

    expect(post.status).toBe(PostStatus.DRAFT);
    expect(post.publishedAt).toBeNull();
  });

  it('arquiva um rascunho', () => {
    const post = createPost();
    const archivedAt = new Date('2026-08-16T12:00:00.000Z');

    post.archive(archivedAt);

    expect(post.status).toBe(PostStatus.ARCHIVED);
    expect(post.archivedAt).toEqual(archivedAt);
    expect(post.publishedAt).toBeNull();
  });

  it('arquiva um post publicado e preserva publishedAt como histórico', () => {
    const post = createPost();
    const publishedAt = new Date('2026-08-16T11:00:00.000Z');
    const archivedAt = new Date('2026-08-16T12:00:00.000Z');
    post.publish(publishedAt);

    post.archive(archivedAt);

    expect(post.status).toBe(PostStatus.ARCHIVED);
    expect(post.publishedAt).toEqual(publishedAt);
    expect(post.archivedAt).toEqual(archivedAt);
  });

  it('restaura um post arquivado como rascunho e limpa as datas de estado', () => {
    const post = createPost();
    post.publish(new Date('2026-08-16T11:00:00.000Z'));
    post.archive(new Date('2026-08-16T12:00:00.000Z'));

    post.restoreAsDraft();

    expect(post.status).toBe(PostStatus.DRAFT);
    expect(post.publishedAt).toBeNull();
    expect(post.archivedAt).toBeNull();
  });

  it('atualiza o conteúdo de um rascunho sem registrar editedAt', () => {
    const post = createPost({ content: EMPTY_CONTENT, readingTimeMinutes: 0 });
    const updatedAt = new Date('2026-08-16T13:00:00.000Z');

    post.updateContent({
      content: CONTENT,
      contentSchemaVersion: 2,
      now: updatedAt,
      readingTimeMinutes: 3,
    });

    expect(post.content).toEqual(CONTENT);
    expect(post.contentSchemaVersion).toBe(2);
    expect(post.readingTimeMinutes).toBe(3);
    expect(post.updatedAt).toEqual(updatedAt);
    expect(post.editedAt).toBeNull();
  });

  it('registra editedAt ao atualizar o conteúdo publicado', () => {
    const post = createPost();
    post.publish(new Date('2026-08-16T11:00:00.000Z'));
    const editedAt = new Date('2026-08-16T13:00:00.000Z');

    post.updateContent({
      content: {
        content: [{ content: [{ text: 'Novo conteúdo', type: 'text' }], type: 'paragraph' }],
        type: 'doc',
      },
      contentSchemaVersion: 1,
      now: editedAt,
      readingTimeMinutes: 2,
    });

    expect(post.status).toBe(PostStatus.PUBLISHED);
    expect(post.editedAt).toEqual(editedAt);
  });

  it('não permite esvaziar o conteúdo de um post publicado', () => {
    const post = createPost();
    post.publish(new Date('2026-08-16T11:00:00.000Z'));

    expect(() =>
      post.updateContent({
        content: EMPTY_CONTENT,
        contentSchemaVersion: 1,
        now: new Date('2026-08-16T13:00:00.000Z'),
        readingTimeMinutes: 0,
      }),
    ).toThrow(PostContentInvalidError);

    expect(post.content).toEqual(CONTENT);
    expect(post.editedAt).toBeNull();
  });

  it('não permite editar um post arquivado', () => {
    const post = createPost();
    post.archive(new Date('2026-08-16T12:00:00.000Z'));

    expect(() =>
      post.updateContent({
        content: CONTENT,
        contentSchemaVersion: 1,
        now: new Date('2026-08-16T13:00:00.000Z'),
        readingTimeMinutes: 1,
      }),
    ).toThrow(PostEditNotAllowedError);
  });

  it.each([
    ['publicar novamente', (post: Post) => post.publish(new Date())],
    ['restaurar sem arquivar', (post: Post) => post.restoreAsDraft()],
  ])('rejeita a transição inválida ao %s', (_label, transition) => {
    const post = createPost();
    post.publish(new Date('2026-08-16T11:00:00.000Z'));

    expect(() => transition(post)).toThrow(InvalidPostStatusTransitionError);
    expect(post.status).toBe(PostStatus.PUBLISHED);
  });

  it('rejeita despublicar um rascunho', () => {
    const post = createPost();

    expect(() => post.unpublish()).toThrow(InvalidPostStatusTransitionError);
    expect(post.status).toBe(PostStatus.DRAFT);
  });

  it('rejeita arquivar um post já arquivado', () => {
    const post = createPost();
    const archivedAt = new Date('2026-08-16T12:00:00.000Z');
    post.archive(archivedAt);

    expect(() => post.archive(new Date('2026-08-16T13:00:00.000Z'))).toThrow(
      InvalidPostStatusTransitionError,
    );
    expect(post.archivedAt).toEqual(archivedAt);
  });

  it('protege conteúdo e datas contra mutação externa', () => {
    const content = structuredClone(CONTENT);
    const createdAt = new Date(CREATED_AT);
    const post = createPost({ content, now: createdAt });

    (content.content[0] as { type: string }).type = 'heading';
    createdAt.setUTCFullYear(2030);
    const returnedCreatedAt = post.createdAt;
    returnedCreatedAt.setUTCFullYear(2031);

    expect(post.content).toEqual(CONTENT);
    expect(post.createdAt).toEqual(CREATED_AT);
  });
});
