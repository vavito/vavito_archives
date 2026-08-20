CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Post_published_title_trgm_idx"
ON "Post" USING GIN (lower("title") gin_trgm_ops)
WHERE "status" = 'PUBLISHED'::"PostStatus";

CREATE INDEX "Post_published_excerpt_trgm_idx"
ON "Post" USING GIN (lower(COALESCE("excerpt", '')) gin_trgm_ops)
WHERE "status" = 'PUBLISHED'::"PostStatus";

CREATE INDEX "Tag_name_trgm_idx"
ON "Tag" USING GIN (lower("name") gin_trgm_ops);

CREATE INDEX "PostTag_tagId_idx" ON "PostTag"("tagId");
