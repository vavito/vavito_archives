ALTER TABLE "Post"
ADD COLUMN "pendingDraft" JSONB,
ADD COLUMN "pendingEditedAt" TIMESTAMPTZ(3);

ALTER TABLE "PostMediaAsset"
ADD COLUMN "displayScale" INTEGER NOT NULL DEFAULT 100,
ADD CONSTRAINT "PostMediaAsset_displayScale_check" CHECK ("displayScale" BETWEEN 100 AND 160);
