ALTER TABLE "PostMediaAsset"
ADD COLUMN "displayPositionX" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "displayPositionY" INTEGER NOT NULL DEFAULT 50,
ADD CONSTRAINT "PostMediaAsset_displayPositionX_check" CHECK ("displayPositionX" BETWEEN 0 AND 100),
ADD CONSTRAINT "PostMediaAsset_displayPositionY_check" CHECK ("displayPositionY" BETWEEN 0 AND 100);
