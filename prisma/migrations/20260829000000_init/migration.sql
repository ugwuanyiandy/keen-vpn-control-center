CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'EXPIRED');
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'ENABLED', 'DISABLED');

CREATE TABLE "servers" (
  "id" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "hostname" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "latency_ms" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
  "pinned_server_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL,
  "current_period_end" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
  "id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_audit_logs" (
  "id" TEXT NOT NULL,
  "actor_user_id" TEXT NOT NULL,
  "server_id" TEXT,
  "action" "AuditAction" NOT NULL,
  "before_state" JSONB,
  "after_state" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_pinned_server_id_idx" ON "users"("pinned_server_id");
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");
CREATE UNIQUE INDEX "servers_hostname_key" ON "servers"("hostname");
CREATE INDEX "servers_active_country_city_idx" ON "servers"("active", "country", "city");
CREATE INDEX "servers_country_idx" ON "servers"("country");
CREATE INDEX "servers_city_idx" ON "servers"("city");
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
CREATE INDEX "admin_audit_logs_actor_user_id_idx" ON "admin_audit_logs"("actor_user_id");
CREATE INDEX "admin_audit_logs_server_id_idx" ON "admin_audit_logs"("server_id");
CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at" DESC);

ALTER TABLE "users" ADD CONSTRAINT "users_pinned_server_id_fkey" FOREIGN KEY ("pinned_server_id") REFERENCES "servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
