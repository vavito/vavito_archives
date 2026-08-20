import { PostSlugInvalidError } from '@api/modules/posts/domain/errors/post-slug-invalid.error';
import {
  MAX_POST_SLUG_LENGTH,
  Slug,
} from '@api/modules/posts/domain/value-objects/slug.value-object';

describe('Slug', () => {
  it.each([
    ['  Primeiro Artigo  ', 'primeiro-artigo'],
    ['Café com AÇÚCAR', 'cafe-com-acucar'],
    ["D'água & código", 'dagua-codigo'],
    ['muitos---separadores___aqui', 'muitos-separadores-aqui'],
  ])('normaliza %s para o formato canônico', (input, expected) => {
    expect(Slug.create(input).value).toBe(expected);
  });

  it('compara slugs pelo valor normalizado', () => {
    expect(Slug.create('Meu Artigo').equals(Slug.create('meu-artigo'))).toBe(true);
  });

  it.each(['', '   ', '!!!', '😀'])('rejeita slug sem caracteres canônicos: %s', (value) => {
    expect(() => Slug.create(value)).toThrow(PostSlugInvalidError);
  });

  it('rejeita slug acima do limite persistido', () => {
    expect(() => Slug.create('a'.repeat(MAX_POST_SLUG_LENGTH + 1))).toThrow(PostSlugInvalidError);
  });
});
