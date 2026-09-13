-- A exclusão permanente de um artigo remove sua conversa e preserva campanhas pelo snapshot.
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_postId_fkey";
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_postId_fkey";
ALTER TABLE "EmailCampaign" DROP CONSTRAINT "EmailCampaign_postId_fkey";

ALTER TABLE "EmailCampaign" ALTER COLUMN "postId" DROP NOT NULL;

ALTER TABLE "Comment"
ADD CONSTRAINT "Comment_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment"
ADD CONSTRAINT "Comment_parentId_postId_fkey"
FOREIGN KEY ("parentId", "postId") REFERENCES "Comment"("id", "postId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailCampaign"
ADD CONSTRAINT "EmailCampaign_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
