-- Mantém tópicos no banco após a exclusão de artigos, controlando separadamente sua exibição pública.
ALTER TABLE "Tag" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Tag_isPublic_idx" ON "Tag"("isPublic");
