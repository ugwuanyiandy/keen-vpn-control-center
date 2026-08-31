import { UserRole } from "@/generated/prisma/enums";
import { AppError } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { findPlan } from "@/lib/plans";
import { serializeSubscription, serializeSubscriptionHistory } from "@/lib/serializers";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function activatePlan(actor: AuthUser, planId: string, now = new Date()) {
  if (actor.role !== UserRole.CUSTOMER) {
    throw new AppError(403, "CUSTOMER_ONLY", "Only customer accounts can activate a plan.");
  }

  const plan = findPlan(planId);
  if (!plan) {
    throw new AppError(400, "INVALID_PLAN", "Choose a valid KeenVPN plan.", {
      planId: ["Choose a valid KeenVPN plan."],
    });
  }

  return prisma.$transaction(async (transaction) => {
    const current = await transaction.subscription.findUnique({ where: { userId: actor.id } });
    if (
      current?.status === "ACTIVE" &&
      current.plan === plan.name &&
      current.currentPeriodEnd &&
      current.currentPeriodEnd > now
    ) {
      throw new AppError(409, "PLAN_ALREADY_ACTIVE", `${plan.name} is already your active plan.`);
    }

    const periodEnd = new Date(now.getTime() + plan.durationDays * DAY_MS);
    const subscription = await transaction.subscription.upsert({
      where: { userId: actor.id },
      create: {
        userId: actor.id,
        plan: plan.name,
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan: plan.name,
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
      },
    });
    const history = await transaction.subscriptionHistory.create({
      data: {
        userId: actor.id,
        plan: plan.name,
        status: "ACTIVE",
        previousPlan: current?.plan ?? null,
        previousStatus: current?.status ?? null,
        periodStart: now,
        periodEnd,
        source: "SELF_SERVICE",
      },
    });

    return {
      subscription: serializeSubscription(subscription),
      history: serializeSubscriptionHistory(history),
    };
  });
}
