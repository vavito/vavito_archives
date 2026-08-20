import { Prisma } from '@api/generated/prisma/client';

interface PostSearchIdRecord {
  id: string;
}

function escapeLikePattern(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

export function buildPostSearchQuery(query: string, limit: number): Prisma.Sql {
  const pattern = `%${escapeLikePattern(query)}%`;

  return Prisma.sql`
    WITH "matches" AS (
      SELECT
        "post"."id",
        3 + similarity(lower("post"."title"), ${query}) AS "score"
      FROM "Post" AS "post"
      WHERE
        "post"."status" = 'PUBLISHED'::"PostStatus"
        AND lower("post"."title") LIKE ${pattern} ESCAPE '\'

      UNION ALL

      SELECT
        "post"."id",
        1 + similarity(lower(COALESCE("post"."excerpt", '')), ${query}) AS "score"
      FROM "Post" AS "post"
      WHERE
        "post"."status" = 'PUBLISHED'::"PostStatus"
        AND lower(COALESCE("post"."excerpt", '')) LIKE ${pattern} ESCAPE '\'

      UNION ALL

      SELECT
        "post"."id",
        2 + similarity(lower("tag"."name"), ${query}) AS "score"
      FROM "Tag" AS "tag"
      INNER JOIN "PostTag" AS "post_tag" ON "post_tag"."tagId" = "tag"."id"
      INNER JOIN "Post" AS "post" ON "post"."id" = "post_tag"."postId"
      WHERE
        "post"."status" = 'PUBLISHED'::"PostStatus"
        AND lower("tag"."name") LIKE ${pattern} ESCAPE '\'
    ),
    "ranked" AS (
      SELECT "id", max("score") AS "score"
      FROM "matches"
      GROUP BY "id"
    )
    SELECT "ranked"."id"
    FROM "ranked"
    INNER JOIN "Post" AS "post" ON "post"."id" = "ranked"."id"
    ORDER BY
      "ranked"."score" DESC,
      "post"."publishedAt" DESC,
      "ranked"."id" ASC
    LIMIT ${limit}
  `;
}

export type { PostSearchIdRecord };
