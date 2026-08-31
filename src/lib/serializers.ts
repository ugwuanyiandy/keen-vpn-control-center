import type { AdminAuditLog, Server, Subscription, SubscriptionHistory } from "@/generated/prisma/client";

export type ServerDto = {
  id: string;
  country: string;
  city: string;
  hostname: string;
  active: boolean;
  latencyMs: number;
  createdAt: string;
  updatedAt: string;
};

export function serializeServer(server: Server): ServerDto {
  return {
    id: server.id,
    country: server.country,
    city: server.city,
    hostname: server.hostname,
    active: server.active,
    latencyMs: server.latencyMs,
    createdAt: server.createdAt.toISOString(),
    updatedAt: server.updatedAt.toISOString(),
  };
}

export function serializeSubscription(subscription: Subscription | null) {
  if (!subscription) {
    return { plan: null, status: "NO_SUBSCRIPTION" as const, currentPeriodEnd: null };
  }

  return {
    plan: subscription.plan,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
  };
}

export function serializeSubscriptionHistory(history: SubscriptionHistory) {
  return {
    id: history.id,
    plan: history.plan,
    status: history.status,
    previousPlan: history.previousPlan,
    previousStatus: history.previousStatus,
    periodStart: history.periodStart.toISOString(),
    periodEnd: history.periodEnd.toISOString(),
    source: history.source,
    createdAt: history.createdAt.toISOString(),
  };
}

export function serializeAuditLog(
  log: AdminAuditLog & { actor: { email: string }; server: { city: string; country: string; hostname: string } | null },
) {
  return {
    id: log.id,
    action: log.action,
    actorEmail: log.actor.email,
    serverId: log.serverId,
    server: log.server,
    beforeState: log.beforeState,
    afterState: log.afterState,
    createdAt: log.createdAt.toISOString(),
  };
}
