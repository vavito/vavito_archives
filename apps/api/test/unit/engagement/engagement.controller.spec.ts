import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';

import { PUBLIC_ROUTE_METADATA_KEY } from '@api/core/auth/constants/auth.constants';
import { EngagementController } from '@api/modules/engagement/controllers/engagement.controller';
import { ReactionType } from '@api/modules/engagement/domain/enums/reaction-type.enum';
import type { BookmarksService } from '@api/modules/engagement/services/bookmarks.service';
import type {
  ReactionState,
  ReactionsService,
} from '@api/modules/engagement/services/reactions.service';

const PROFILE_ID = '3d46ab51-60b3-4604-a5f1-e2c403cb75f8';
const POST_ID = '9de46532-a170-46c0-90dd-0b3cbf7794be';
const USER = { email: 'reader@example.com', id: PROFILE_ID };

function services() {
  const set = jest.fn<Promise<ReactionState>, [string, string, ReactionType]>();
  const removeReaction = jest.fn<Promise<ReactionState>, [string, string]>();
  const list = jest.fn();
  const save = jest.fn();
  const removeBookmark = jest.fn();

  return {
    bookmarksService: {
      list,
      remove: removeBookmark,
      save,
    } as unknown as BookmarksService,
    list,
    reactionsService: { remove: removeReaction, set } as unknown as ReactionsService,
    removeBookmark,
    removeReaction,
    save,
    set,
  };
}

describe('EngagementController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('mantém todas as operações protegidas pelo guard global', () => {
    expect(Reflect.getMetadata(PUBLIC_ROUTE_METADATA_KEY, EngagementController)).not.toBe(true);

    for (const method of [
      'setReaction',
      'removeReaction',
      'listBookmarks',
      'saveBookmark',
      'removeBookmark',
    ] as const) {
      expect(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        Reflect.getMetadata(PUBLIC_ROUTE_METADATA_KEY, EngagementController.prototype[method]),
      ).not.toBe(true);
    }
  });

  it('define uma reação e expõe o contrato público de estado e contadores', async () => {
    const mocks = services();
    const controller = new EngagementController(mocks.reactionsService, mocks.bookmarksService);
    mocks.set.mockResolvedValue({
      counts: { dislike: 1, like: 4 },
      currentType: ReactionType.LIKE,
    });

    await expect(
      controller.setReaction(USER, POST_ID, { type: ReactionType.LIKE }),
    ).resolves.toEqual({
      counts: { dislike: 1, like: 4 },
      reaction: ReactionType.LIKE,
    });
    expect(mocks.set).toHaveBeenCalledWith(PROFILE_ID, POST_ID, ReactionType.LIKE);
  });

  it('remove a reação com status 204 e ignora o estado interno retornado', async () => {
    const mocks = services();
    const controller = new EngagementController(mocks.reactionsService, mocks.bookmarksService);
    mocks.removeReaction.mockResolvedValue({
      counts: { dislike: 1, like: 3 },
      currentType: null,
    });

    await expect(controller.removeReaction(USER, POST_ID)).resolves.toBeUndefined();
    expect(mocks.removeReaction).toHaveBeenCalledWith(PROFILE_ID, POST_ID);
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Reflect.getMetadata(HTTP_CODE_METADATA, EngagementController.prototype.removeReaction),
    ).toBe(HttpStatus.NO_CONTENT);
  });

  it('lista somente os bookmarks do usuário autenticado', async () => {
    const mocks = services();
    const controller = new EngagementController(mocks.reactionsService, mocks.bookmarksService);
    const response = { items: [], meta: { limit: 12, page: 2, total: 0, totalPages: 0 } };
    mocks.list.mockResolvedValue(response);

    await expect(controller.listBookmarks(USER, { limit: 12, page: 2 })).resolves.toBe(response);
    expect(mocks.list).toHaveBeenCalledWith(PROFILE_ID, { limit: 12, page: 2 });
  });

  it('salva e remove bookmark com respostas idempotentes', async () => {
    const mocks = services();
    const controller = new EngagementController(mocks.reactionsService, mocks.bookmarksService);
    mocks.save.mockResolvedValue({});
    mocks.removeBookmark.mockResolvedValue(undefined);

    await expect(controller.saveBookmark(USER, POST_ID)).resolves.toEqual({ bookmarked: true });
    await expect(controller.removeBookmark(USER, POST_ID)).resolves.toBeUndefined();
    expect(mocks.save).toHaveBeenCalledWith(PROFILE_ID, POST_ID);
    expect(mocks.removeBookmark).toHaveBeenCalledWith(PROFILE_ID, POST_ID);
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Reflect.getMetadata(HTTP_CODE_METADATA, EngagementController.prototype.removeBookmark),
    ).toBe(HttpStatus.NO_CONTENT);
  });
});
