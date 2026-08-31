CREATE TYPE "SubscriptionHistorySource" AS ENUM ('SELF_SERVICE', 'SEED', 'MIGRATION');

CREATE TABLE "subscription_history" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL,
  "previous_plan" TEXT,
  "previous_status" "SubscriptionStatus",
  "period_start" TIMESTAMP(3) NOT NULL,
  "period_end" TIMESTAMP(3) NOT NULL,
  "source" "SubscriptionHistorySource" NOT NULL,
  "source_key" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_history_source_key_key" ON "subscription_history"("source_key");
CREATE INDEX "subscription_history_user_id_created_at_idx" ON "subscription_history"("user_id", "created_at" DESC);
CREATE INDEX "subscription_history_status_idx" ON "subscription_history"("status");

ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "subscription_history" (
  "id", "user_id", "plan", "status", "period_start", "period_end", "source", "source_key", "created_at"
)
SELECT
  'migration_' || "id",
  "user_id",
  "plan",
  "status",
  "created_at",
  COALESCE("current_period_end", "updated_at" + INTERVAL '30 days'),
  'MIGRATION'::"SubscriptionHistorySource",
  'migration:' || "id",
  "updated_at"
FROM "subscriptions"
ON CONFLICT ("source_key") DO NOTHING;
