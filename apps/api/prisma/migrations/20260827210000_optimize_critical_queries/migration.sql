-- Listagens administrativas de posts, com e sem filtro de status.
CREATE INDEX "Post_updatedAt_id_idx"
ON "Post"("updatedAt" DESC, "id");

CREATE INDEX "Post_status_updatedAt_id_idx"
ON "Post"("status", "updatedAt" DESC, "id");

-- Limpeza de mídia com limite e ordenação estável.
DROP INDEX "MediaAsset_status_orphanedAt_idx";

CREATE INDEX "MediaAsset_status_orphanedAt_id_idx"
ON "MediaAsset"("status", "orphanedAt", "id");

CREATE INDEX "MediaAsset_status_createdAt_id_idx"
ON "MediaAsset"("status", "createdAt", "id");

-- Moderação de comentários, com filtros opcionais por post ou status.
DROP INDEX "Comment_status_createdAt_idx";

CREATE INDEX "Comment_createdAt_id_idx"
ON "Comment"("createdAt" DESC, "id" DESC);

CREATE INDEX "Comment_postId_createdAt_id_idx"
ON "Comment"("postId", "createdAt" DESC, "id" DESC);

CREATE INDEX "Comment_status_createdAt_id_idx"
ON "Comment"("status", "createdAt" DESC, "id" DESC);

-- Listagem administrativa de campanhas, com e sem filtro de status.
DROP INDEX "EmailCampaign_status_createdAt_id_idx";

CREATE INDEX "EmailCampaign_createdAt_id_idx"
ON "EmailCampaign"("createdAt" DESC, "id");

CREATE INDEX "EmailCampaign_status_createdAt_id_idx"
ON "EmailCampaign"("status", "createdAt" DESC, "id");
