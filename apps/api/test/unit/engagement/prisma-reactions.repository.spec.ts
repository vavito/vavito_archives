import type { PrismaService } from '@api/core/database/prisma.service';
import {
  type Prisma,
  type Reaction as PrismaReaction,
  ReactionType as PrismaReactionType,
} from '@api/generated/prisma/client';
import { Reaction } from '@api/modules/engagement/domain/entities/reaction.entity';
import { ReactionType } from '@api/modules/engagement/domain/enums/reaction-type.enum';
import { PrismaReactionsRepository } from '@api/modules/engagement/repositories/prisma-reactions.repository';

const PROFILE_ID = '3d46ab51-60b3-4604-a5f1-e2c403cb75f8';
const POST_ID = '9de46532-a170-46c0-90dd-0b3cbf7794be';
const REACTION_ID = 'df23c92d-71e4-400b-805e-975bbc3e1788';
const CREATED_AT = new Date('2026-08-23T10:00:00.000Z');
const UPDATED_AT = new Date('2026-08-23T11:00:00.000Z');

interface ReactionCountRecord {
  _count: { _all: number };
  type: PrismaReactionType;
}

type TransactionCallback = (transaction: Prisma.TransactionClient) => Promise<unknown>;

function reactionRecord(
  type: PrismaReactionType = PrismaReactionType.LIKE,
  updatedAt: Date = CREATED_AT,
): PrismaReaction {
  return {
    createdAt: CREATED_AT,
    id: REACTION_ID,
    postId: POST_ID,
    profileId: PROFILE_ID,
    type,
    updatedAt,
  };
}

function reaction(type: ReactionType = ReactionType.LIKE): Reaction {
  return Reaction.create({
    id: REACTION_ID,
    now: UPDATED_AT,
    postId: POST_ID,
    profileId: PROFILE_ID,
    type,
  });
}

describe('PrismaReactionsRepository', () => {
  const postFindFirst = jest.fn<Promise<{ id: string } | null>, [Prisma.PostFindFirstArgs]>();
  const findUnique = jest.fn<Promise<PrismaReaction | null>, [Prisma.ReactionFindUniqueArgs]>();
  const create = jest.fn<Promise<PrismaReaction>, [Prisma.ReactionCreateArgs]>();
  const update = jest.fn<Promise<PrismaReaction>, [Prisma.ReactionUpdateArgs]>();
  const deleteMany = jest.fn<Promise<{ count: number }>, [Prisma.ReactionDeleteManyArgs]>();
  const groupBy = jest.fn<Promise<ReactionCountRecord[]>, [Prisma.ReactionGroupByArgs]>();
  const transactionClient = {
    post: { findFirst: postFindFirst },
    reaction: { create, deleteMany, findUnique, groupBy, update },
  } as unknown as Prisma.TransactionClient;
  const transaction = jest.fn<
    Promise<unknown>,
    [TransactionCallback, { isolationLevel: 'Serializable' }?]
  >();
  const prisma = { $transaction: transaction } as unknown as PrismaService;
  const repository = new PrismaReactionsRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.mockImplementation((operation) => operation(transactionClient));
    postFindFirst.mockResolvedValue({ id: POST_ID });
    groupBy.mockResolvedValue([
      { _count: { _all: 3 }, type: PrismaReactionType.LIKE },
      { _count: { _all: 1 }, type: PrismaReactionType.DISLIKE },
    ]);
  });

  it('cria a primeira reação e retorna os contadores na mesma transação', async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue(reactionRecord());

    await expect(repository.set(reaction())).resolves.toMatchObject({
      counts: { dislike: 1, like: 3 },
      postExists: true,
      reaction: { type: ReactionType.LIKE },
    });
    expect(create.mock.calls[0]?.[0].data).toMatchObject({
      postId: POST_ID,
      profileId: PROFILE_ID,
      type: PrismaReactionType.LIKE,
    });
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });

  it('não grava novamente quando a mesma reação já está ativa', async () => {
    findUnique.mockResolvedValue(reactionRecord());

    await expect(repository.set(reaction())).resolves.toMatchObject({
      reaction: { type: ReactionType.LIKE, updatedAt: CREATED_AT },
    });
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('troca o tipo sem criar um segundo registro', async () => {
    findUnique.mockResolvedValue(reactionRecord(PrismaReactionType.DISLIKE));
    update.mockResolvedValue(reactionRecord(PrismaReactionType.LIKE, UPDATED_AT));

    await expect(repository.set(reaction(ReactionType.LIKE))).resolves.toMatchObject({
      reaction: { id: REACTION_ID, type: ReactionType.LIKE, updatedAt: UPDATED_AT },
    });
    expect(create).not.toHaveBeenCalled();
    expect(update.mock.calls[0]?.[0]).toEqual({
      data: { type: PrismaReactionType.LIKE, updatedAt: UPDATED_AT },
      where: { id: REACTION_ID },
    });
  });

  it('remove a reação de forma idempotente e recalcula os contadores', async () => {
    deleteMany.mockResolvedValue({ count: 0 });
    groupBy.mockResolvedValue([]);

    await expect(repository.remove(PROFILE_ID, POST_ID)).resolves.toEqual({
      counts: { dislike: 0, like: 0 },
      postExists: true,
      reaction: null,
    });
    expect(deleteMany).toHaveBeenCalledWith({ where: { postId: POST_ID, profileId: PROFILE_ID } });
  });

  it('não permite reação em post ausente ou não publicado', async () => {
    postFindFirst.mockResolvedValue(null);

    await expect(repository.set(reaction())).resolves.toEqual({
      counts: { dislike: 0, like: 0 },
      postExists: false,
      reaction: null,
    });
    expect(findUnique).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(groupBy).not.toHaveBeenCalled();
  });

  it('repete a transação serializável quando o PostgreSQL informa conflito', async () => {
    transaction.mockRejectedValueOnce({ code: 'P2034' });
    findUnique.mockResolvedValue(reactionRecord());

    await expect(repository.set(reaction())).resolves.toMatchObject({ postExists: true });
    expect(transaction).toHaveBeenCalledTimes(2);
  });
});
