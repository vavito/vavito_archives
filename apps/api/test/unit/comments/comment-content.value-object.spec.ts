import { CommentContentInvalidError } from '@api/modules/comments/domain/errors/comment-content-invalid.error';
import {
  CommentContent,
  MAX_COMMENT_CONTENT_LENGTH,
} from '@api/modules/comments/domain/value-objects/comment-content.value-object';

describe('CommentContent', () => {
  it('normaliza espaços externos e preserva o conteúdo válido', () => {
    const content = CommentContent.create('  Comentário válido.  ');

    expect(content.value).toBe('Comentário válido.');
    expect(content.toString()).toBe('Comentário válido.');
  });

  it.each(['', '   ', '\n\t'])('rejeita conteúdo vazio após normalização', (value) => {
    expect(() => CommentContent.create(value)).toThrow(CommentContentInvalidError);
  });

  it('aceita conteúdo no limite configurado', () => {
    const content = CommentContent.create('a'.repeat(MAX_COMMENT_CONTENT_LENGTH));

    expect(content.value).toHaveLength(MAX_COMMENT_CONTENT_LENGTH);
  });

  it('rejeita conteúdo acima do limite configurado', () => {
    expect(() => CommentContent.create('a'.repeat(MAX_COMMENT_CONTENT_LENGTH + 1))).toThrow(
      CommentContentInvalidError,
    );
  });
});
