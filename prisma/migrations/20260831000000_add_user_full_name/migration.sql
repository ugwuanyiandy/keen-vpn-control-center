ALTER TABLE "users" ADD COLUMN "full_name" TEXT;

-- Existing accounts predate name collection. Demo accounts receive their
-- specific names during the idempotent seed that follows deployment.
UPDATE "users" SET "full_name" = 'Keen VPN User' WHERE "full_name" IS NULL;

ALTER TABLE "users" ALTER COLUMN "full_name" SET NOT NULL;
