import { Post } from '@api/modules/posts/domain/entities/post.entity';
import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { InvalidPostStatusTransitionError } from '@api/modules/posts/domain/errors/invalid-post-status-transition.error';
import { PostContentInvalidError } from '@api/modules/posts/domain/errors/post-content-invalid.error';
import { PostDeleteNotAllowedError } from '@api/modules/posts/domain/errors/post-delete-not-allowed.error';
import { PostEditNotAllowedError } from '@api/modules/posts/domain/errors/post-edit-not-allowed.error';
import { PostNotReadyForPublicationError } from '@api/modules/posts/domain/errors/post-not-ready-for-publication.error';
import { PostContent } from '@api/modules/posts/domain/value-objects/post-content.value-object';
import { Slug } from '@api/modules/posts/domain/value-objects/slug.value-object';

const CREATED_AT = new Date('2026-08-16T10:00:00.000Z');
const CONTENT_DOCUMENT = {
  content: [{ content: [{ text: 'Conteúdo', type: 'text' }], type: 'paragraph' }],
  type: 'doc',
};
const CONTENT = PostContent.create(CONTENT_DOCUMENT, 1);
const EMPTY_CONTENT = PostContent.create({ content: [], type: 'doc' }, 1);

function createPost(overrides: Partial<Parameters<typeof Post.create>[0]> = {}): Post {
  return Post.create({
    authorId: 'ad4ce1ef-339f-45dc-bb91-a2f7ffbf3026',
    content: CONTENT,
    currentSlug: Slug.create('primeiro-artigo'),
    excerpt: 'Resumo do artigo.',
    id: '957c8388-cb96-4f0c-98b3-56b84c1fe67e',
    now: CREATED_AT,
    readingTimeMinutes: 1,
    title: 'Primeiro artigo',
    ...overrides,
  });
}

function createPostInStatus(status: PostStatus): Post {
  const post = createPost();

  if (status === PostStatus.PUBLISHED) {
    post.publish(new Date('2026-08-16T11:00:00.000Z'));
  } else if (status === PostStatus.ARCHIVED) {
    post.archive(new Date('2026-08-16T12:00:00.000Z'));
  }

  return post;
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
      now: updatedAt,
      readingTimeMinutes: 3,
    });

    expect(post.content.document).toEqual(CONTENT_DOCUMENT);
    expect(post.contentSchemaVersion).toBe(1);
    expect(post.readingTimeMinutes).toBe(3);
    expect(post.updatedAt).toEqual(updatedAt);
    expect(post.editedAt).toBeNull();
  });

  it('registra editedAt ao atualizar o conteúdo publicado', () => {
    const post = createPost();
    post.publish(new Date('2026-08-16T11:00:00.000Z'));
    const editedAt = new Date('2026-08-16T13:00:00.000Z');

    post.updateContent({
      content: PostContent.create(
        {
          content: [{ content: [{ text: 'Novo conteúdo', type: 'text' }], type: 'paragraph' }],
          type: 'doc',
        },
        1,
      ),
      now: editedAt,
      readingTimeMinutes: 2,
    });

    expect(post.status).toBe(PostStatus.PUBLISHED);
    expect(post.editedAt).toEqual(editedAt);
  });

  it('edita os campos do rascunho de forma atômica', () => {
    const post = createPost();
    const updatedAt = new Date('2026-08-16T14:00:00.000Z');

    post.edit({
      currentSlug: Slug.create('artigo-revisado'),
      excerpt: 'Novo resumo.',
      now: updatedAt,
      seoDescription: null,
      seoTitle: 'SEO revisado',
      title: 'Artigo revisado',
    });

    expect(post.title).toBe('Artigo revisado');
    expect(post.currentSlug?.value).toBe('artigo-revisado');
    expect(post.excerpt).toBe('Novo resumo.');
    expect(post.seoTitle).toBe('SEO revisado');
    expect(post.seoDescription).toBeNull();
    expect(post.updatedAt).toEqual(updatedAt);
    expect(post.editedAt).toBeNull();
  });

  it('não deixa uma edição tornar o post publicado incompleto', () => {
    const post = createPost();
    post.publish(new Date('2026-08-16T11:00:00.000Z'));

    expect(() => post.edit({ now: new Date(), title: '' })).toThrow(
      PostNotReadyForPublicationError,
    );
    expect(post.title).toBe('Primeiro artigo');
    expect(post.editedAt).toBeNull();
  });

  it('não permite esvaziar o conteúdo de um post publicado', () => {
    const post = createPost();
    post.publish(new Date('2026-08-16T11:00:00.000Z'));

    expect(() =>
      post.updateContent({
        content: EMPTY_CONTENT,
        now: new Date('2026-08-16T13:00:00.000Z'),
        readingTimeMinutes: 0,
      }),
    ).toThrow(PostContentInvalidError);

    expect(post.content.document).toEqual(CONTENT_DOCUMENT);
    expect(post.editedAt).toBeNull();
  });

  it('não permite editar um post arquivado', () => {
    const post = createPost();
    post.archive(new Date('2026-08-16T12:00:00.000Z'));

    expect(() =>
      post.updateContent({
        content: CONTENT,
        now: new Date('2026-08-16T13:00:00.000Z'),
        readingTimeMinutes: 1,
      }),
    ).toThrow(PostEditNotAllowedError);
  });

  it('não permite excluir permanentemente um post publicado', () => {
    const post = createPost();
    post.publish(new Date('2026-08-16T11:00:00.000Z'));

    expect(() => post.ensureCanDelete()).toThrow(PostDeleteNotAllowedError);
  });

  it.each([
    ['publicar', PostStatus.PUBLISHED, (post: Post) => post.publish(new Date())],
    ['publicar', PostStatus.ARCHIVED, (post: Post) => post.publish(new Date())],
    ['despublicar', PostStatus.DRAFT, (post: Post) => post.unpublish()],
    ['despublicar', PostStatus.ARCHIVED, (post: Post) => post.unpublish()],
    ['restaurar', PostStatus.DRAFT, (post: Post) => post.restoreAsDraft()],
    ['restaurar', PostStatus.PUBLISHED, (post: Post) => post.restoreAsDraft()],
    ['arquivar', PostStatus.ARCHIVED, (post: Post) => post.archive(new Date())],
  ] as const)(
    'rejeita %s quando o post está em %s sem alterar o estado',
    (_action, status, transition) => {
      const post = createPostInStatus(status);

      expect(() => transition(post)).toThrow(InvalidPostStatusTransitionError);
      expect(post.status).toBe(status);
    },
  );

  it('protege conteúdo e datas contra mutação externa', () => {
    const contentDocument = structuredClone(CONTENT_DOCUMENT);
    const content = PostContent.create(contentDocument, 1);
    const createdAt = new Date(CREATED_AT);
    const post = createPost({ content, now: createdAt });

    contentDocument.content[0]!.type = 'heading';
    createdAt.setUTCFullYear(2030);
    const returnedCreatedAt = post.createdAt;
    returnedCreatedAt.setUTCFullYear(2031);

    expect(post.content.document).toEqual(CONTENT_DOCUMENT);
    expect(post.createdAt).toEqual(CREATED_AT);
  });
});
