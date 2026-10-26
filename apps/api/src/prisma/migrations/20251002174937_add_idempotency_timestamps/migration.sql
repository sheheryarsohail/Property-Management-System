-- Add createdAt if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='IdempotencyKey' AND column_name='createdAt'
  ) THEN
    ALTER TABLE "IdempotencyKey" ADD COLUMN "createdAt" TIMESTAMPTZ;
  END IF;
END
$$;

-- Add updatedAt if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='IdempotencyKey' AND column_name='updatedAt'
  ) THEN
    ALTER TABLE "IdempotencyKey" ADD COLUMN "updatedAt" TIMESTAMPTZ;
  END IF;
END
$$;

-- Backfill NULLs with now()
UPDATE "IdempotencyKey" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;
UPDATE "IdempotencyKey" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- Enforce NOT NULL and defaults
ALTER TABLE "IdempotencyKey" 
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT NOW();

ALTER TABLE "IdempotencyKey" 
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT NOW();
