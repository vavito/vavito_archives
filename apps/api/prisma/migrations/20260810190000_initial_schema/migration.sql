-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'SPAM', 'DELETED');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'DISLIKE');

-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('UPLOADING', 'READY', 'FAILED', 'ORPHANED');

-- CreateEnum
CREATE TYPE "MediaUsageType" AS ENUM ('COVER', 'CONTENT');

-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('PENDING', 'CONFIRMED', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'DELIVERY_DELAYED', 'BOUNCED', 'COMPLAINED', 'FAILED', 'SUPPRESSED');

-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('RECEIVED', 'READ', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "displayName" VARCHAR(120) NOT NULL,
    "avatarPath" VARCHAR(1024),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "excerpt" TEXT,
    "content" JSONB NOT NULL,
    "contentSchemaVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "seoTitle" VARCHAR(70),
    "seoDescription" VARCHAR(160),
    "readingTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),
    "editedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostSlug" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "retiredAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostSlug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostRevision" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "editorId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTag" (
    "postId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("postId","tagId")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "storagePath" VARCHAR(1024) NOT NULL,
    "mimeType" VARCHAR(127) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT NOT NULL,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'UPLOADING',
    "failureReason" TEXT,
    "orphanedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostMediaAsset" (
    "postId" UUID NOT NULL,
    "mediaAssetId" UUID NOT NULL,
    "usage" "MediaUsageType" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostMediaAsset_pkey" PRIMARY KEY ("postId","mediaAssetId","usage")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "authorId" UUID,
    "parentId" UUID,
    "content" TEXT,
    "status" "CommentStatus" NOT NULL DEFAULT 'VISIBLE',
    "moderationReason" TEXT,
    "editedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostView" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "fingerprintHash" VARCHAR(128) NOT NULL,
    "bucketDate" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'PENDING',
    "consentSource" VARCHAR(32) NOT NULL,
    "consentedAt" TIMESTAMPTZ(3) NOT NULL,
    "confirmationTokenHash" VARCHAR(128),
    "confirmationExpiresAt" TIMESTAMPTZ(3),
    "unsubscribeTokenHash" VARCHAR(128) NOT NULL,
    "confirmedAt" TIMESTAMPTZ(3),
    "unsubscribedAt" TIMESTAMPTZ(3),
    "bouncedAt" TIMESTAMPTZ(3),
    "complainedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "previewText" VARCHAR(255) NOT NULL,
    "htmlSnapshot" TEXT NOT NULL,
    "postSnapshot" JSONB NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "audienceCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" UUID,
    "resendId" VARCHAR(255),
    "failureReason" TEXT,
    "sendStartedAt" TIMESTAMPTZ(3),
    "sentAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDelivery" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "subscriberId" UUID NOT NULL,
    "providerEmailId" VARCHAR(255),
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "lastEventAt" TIMESTAMPTZ(3),
    "failureCode" VARCHAR(100),
    "failureReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" UUID NOT NULL,
    "providerEventId" VARCHAR(255) NOT NULL,
    "deliveryId" UUID,
    "type" VARCHAR(100) NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "payloadHash" VARCHAR(128) NOT NULL,
    "processedAt" TIMESTAMPTZ(3),
    "processingError" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'RECEIVED',
    "readAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_status_publishedAt_id_idx" ON "Post"("status", "publishedAt" DESC, "id");

-- CreateIndex
CREATE INDEX "Post_status_viewsCount_id_idx" ON "Post"("status", "viewsCount" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "PostSlug_slug_key" ON "PostSlug"("slug");

-- CreateIndex
CREATE INDEX "PostSlug_postId_isCurrent_idx" ON "PostSlug"("postId", "isCurrent");

-- CreateIndex
CREATE INDEX "PostRevision_postId_createdAt_idx" ON "PostRevision"("postId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostRevision_postId_version_key" ON "PostRevision"("postId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storagePath_key" ON "MediaAsset"("storagePath");

-- CreateIndex
CREATE INDEX "MediaAsset_status_orphanedAt_idx" ON "MediaAsset"("status", "orphanedAt");

-- CreateIndex
CREATE INDEX "PostMediaAsset_mediaAssetId_idx" ON "PostMediaAsset"("mediaAssetId");

-- CreateIndex
CREATE INDEX "Comment_postId_parentId_createdAt_id_idx" ON "Comment"("postId", "parentId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Comment_status_createdAt_idx" ON "Comment"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_id_postId_key" ON "Comment"("id", "postId");

-- CreateIndex
CREATE INDEX "Reaction_postId_type_idx" ON "Reaction"("postId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_profileId_postId_key" ON "Reaction"("profileId", "postId");

-- CreateIndex
CREATE INDEX "Bookmark_profileId_createdAt_id_idx" ON "Bookmark"("profileId", "createdAt" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_profileId_postId_key" ON "Bookmark"("profileId", "postId");

-- CreateIndex
CREATE INDEX "PostView_createdAt_idx" ON "PostView"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostView_postId_fingerprintHash_bucketDate_key" ON "PostView"("postId", "fingerprintHash", "bucketDate");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_confirmationTokenHash_key" ON "NewsletterSubscriber"("confirmationTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeTokenHash_key" ON "NewsletterSubscriber"("unsubscribeTokenHash");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_status_createdAt_id_idx" ON "NewsletterSubscriber"("status", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaign_idempotencyKey_key" ON "EmailCampaign"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaign_resendId_key" ON "EmailCampaign"("resendId");

-- CreateIndex
CREATE INDEX "EmailCampaign_status_createdAt_id_idx" ON "EmailCampaign"("status", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDelivery_providerEmailId_key" ON "EmailDelivery"("providerEmailId");

-- CreateIndex
CREATE INDEX "EmailDelivery_campaignId_status_idx" ON "EmailDelivery"("campaignId", "status");

-- CreateIndex
CREATE INDEX "EmailDelivery_subscriberId_createdAt_idx" ON "EmailDelivery"("subscriberId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDelivery_campaignId_subscriberId_key" ON "EmailDelivery"("campaignId", "subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_providerEventId_key" ON "WebhookEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "ContactMessage_status_createdAt_id_idx" ON "ContactMessage"("status", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostSlug" ADD CONSTRAINT "PostSlug_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostRevision" ADD CONSTRAINT "PostRevision_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostRevision" ADD CONSTRAINT "PostRevision_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMediaAsset" ADD CONSTRAINT "PostMediaAsset_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMediaAsset" ADD CONSTRAINT "PostMediaAsset_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_postId_fkey" FOREIGN KEY ("parentId", "postId") REFERENCES "Comment"("id", "postId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostView" ADD CONSTRAINT "PostView_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "NewsletterSubscriber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "EmailDelivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Regras do domínio que não são expressáveis no schema Prisma estável.

-- Apenas um slug atual pode existir por post.
CREATE UNIQUE INDEX "PostSlug_one_current_per_post_key"
ON "PostSlug" ("postId")
WHERE "isCurrent" = true;

-- Apenas uma capa pode existir por post; mídias de conteúdo continuam reutilizáveis.
CREATE UNIQUE INDEX "PostMediaAsset_one_cover_per_post_key"
ON "PostMediaAsset" ("postId")
WHERE "usage" = 'COVER';

ALTER TABLE "Post"
ADD CONSTRAINT "Post_contentSchemaVersion_check" CHECK ("contentSchemaVersion" > 0),
ADD CONSTRAINT "Post_readingTimeMinutes_check" CHECK ("readingTimeMinutes" >= 0),
ADD CONSTRAINT "Post_viewsCount_check" CHECK ("viewsCount" >= 0),
ADD CONSTRAINT "Post_status_dates_check" CHECK (
  ("status" = 'DRAFT' AND "publishedAt" IS NULL AND "archivedAt" IS NULL)
  OR ("status" = 'PUBLISHED' AND "publishedAt" IS NOT NULL AND "archivedAt" IS NULL)
  OR ("status" = 'ARCHIVED' AND "archivedAt" IS NOT NULL)
);

ALTER TABLE "PostSlug"
ADD CONSTRAINT "PostSlug_retirement_check" CHECK (
  ("isCurrent" = true AND "retiredAt" IS NULL)
  OR ("isCurrent" = false AND "retiredAt" IS NOT NULL)
);

ALTER TABLE "PostRevision"
ADD CONSTRAINT "PostRevision_version_check" CHECK ("version" > 0);

ALTER TABLE "MediaAsset"
ADD CONSTRAINT "MediaAsset_sizeBytes_check" CHECK ("sizeBytes" > 0),
ADD CONSTRAINT "MediaAsset_width_check" CHECK ("width" IS NULL OR "width" > 0),
ADD CONSTRAINT "MediaAsset_height_check" CHECK ("height" IS NULL OR "height" > 0),
ADD CONSTRAINT "MediaAsset_status_fields_check" CHECK (
  ("status" <> 'FAILED' OR NULLIF(BTRIM("failureReason"), '') IS NOT NULL)
  AND ("status" <> 'ORPHANED' OR "orphanedAt" IS NOT NULL)
);

ALTER TABLE "Comment"
ADD CONSTRAINT "Comment_content_check" CHECK (
  "status" = 'DELETED'
  OR NULLIF(BTRIM("content"), '') IS NOT NULL
);

ALTER TABLE "NewsletterSubscriber"
ADD CONSTRAINT "NewsletterSubscriber_status_fields_check" CHECK (
  ("status" <> 'PENDING' OR (
    "confirmationTokenHash" IS NOT NULL
    AND "confirmationExpiresAt" IS NOT NULL
  ))
  AND ("status" <> 'CONFIRMED' OR "confirmedAt" IS NOT NULL)
  AND ("status" <> 'UNSUBSCRIBED' OR "unsubscribedAt" IS NOT NULL)
  AND ("status" <> 'BOUNCED' OR "bouncedAt" IS NOT NULL)
  AND ("status" <> 'COMPLAINED' OR "complainedAt" IS NOT NULL)
);

ALTER TABLE "EmailCampaign"
ADD CONSTRAINT "EmailCampaign_audienceCount_check" CHECK ("audienceCount" >= 0),
ADD CONSTRAINT "EmailCampaign_status_fields_check" CHECK (
  "status" = 'DRAFT'
  OR ("status" = 'SENDING' AND "idempotencyKey" IS NOT NULL AND "sendStartedAt" IS NOT NULL)
  OR ("status" = 'SENT'
    AND "idempotencyKey" IS NOT NULL
    AND "sendStartedAt" IS NOT NULL
    AND "resendId" IS NOT NULL
    AND "sentAt" IS NOT NULL)
  OR ("status" = 'FAILED'
    AND "idempotencyKey" IS NOT NULL
    AND "sendStartedAt" IS NOT NULL
    AND NULLIF(BTRIM("failureReason"), '') IS NOT NULL)
);

-- O índice de busca textual de posts será incluído junto da consulta da Task 4.7.
