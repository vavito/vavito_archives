import { Bookmark } from '@api/modules/engagement/domain/entities/bookmark.entity';

const CREATED_AT = new Date('2026-08-24T10:00:00.000Z');

describe('Bookmark', () => {
  it('cria um artigo salvo vinculado ao perfil e ao post', () => {
    const bookmark = Bookmark.create({
      id: 'bookmark-id',
      now: CREATED_AT,
      postId: 'post-id',
      profileId: 'profile-id',
    });

    expect(bookmark).toMatchObject({
      id: 'bookmark-id',
      postId: 'post-id',
      profileId: 'profile-id',
    });
    expect(bookmark.createdAt).toEqual(CREATED_AT);
  });

  it('protege a data interna contra mutações externas', () => {
    const bookmark = Bookmark.restore({
      createdAt: CREATED_AT,
      id: 'bookmark-id',
      postId: 'post-id',
      profileId: 'profile-id',
    });
    const exposedDate = bookmark.createdAt;

    exposedDate.setUTCFullYear(2030);

    expect(bookmark.createdAt).toEqual(CREATED_AT);
  });
});
