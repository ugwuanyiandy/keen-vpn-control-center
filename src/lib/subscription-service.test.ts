import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@/generated/prisma/enums";

const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { $transaction: mocks.transaction } }));

import { activatePlan } from "@/lib/subscription-service";

const customer = { id: "customer-id", fullName: "Amara Okafor", email: "amara@example.com", role: UserRole.CUSTOMER };
const now = new Date("2026-08-31T12:00:00.000Z");

describe("subscription activation", () => {
  beforeEach(() => mocks.transaction.mockReset());

  it("rejects administrators and invalid plans before opening a transaction", async () => {
    await expect(activatePlan({ ...customer, role: UserRole.ADMIN }, "keen-plus", now)).rejects.toMatchObject({ status: 403 });
    await expect(activatePlan(customer, "not-a-plan", now)).rejects.toMatchObject({ status: 400, code: "INVALID_PLAN" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("atomically replaces the current plan and appends its previous snapshot", async () => {
    const current = { id: "sub-id", userId: customer.id, plan: "Keen Trial", status: "TRIAL", currentPeriodEnd: new Date("2026-09-03T12:00:00.000Z"), createdAt: now, updatedAt: now } as const;
    const next = { ...current, plan: "Keen Plus", status: "ACTIVE" as const, currentPeriodEnd: new Date("2026-09-30T12:00:00.000Z") };
    const history = { id: "history-id", userId: customer.id, plan: next.plan, status: next.status, previousPlan: current.plan, previousStatus: current.status, periodStart: now, periodEnd: next.currentPeriodEnd, source: "SELF_SERVICE" as const, sourceKey: null, createdAt: now };
    const transaction = {
      subscription: { findUnique: vi.fn().mockResolvedValue(current), upsert: vi.fn().mockResolvedValue(next) },
      subscriptionHistory: { create: vi.fn().mockResolvedValue(history) },
    };
    mocks.transaction.mockImplementationOnce(async (operation) => operation(transaction));

    const result = await activatePlan(customer, "keen-plus", now);
    expect(transaction.subscription.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: expect.objectContaining({ plan: "Keen Plus", status: "ACTIVE" }) }));
    expect(transaction.subscriptionHistory.create).toHaveBeenCalledWith({ data: expect.objectContaining({ previousPlan: "Keen Trial", previousStatus: "TRIAL", source: "SELF_SERVICE" }) });
    expect(result.subscription.plan).toBe("Keen Plus");
  });

  it("returns a conflict when the requested plan is already active", async () => {
    const transaction = { subscription: { findUnique: vi.fn().mockResolvedValue({ plan: "Keen Plus", status: "ACTIVE", currentPeriodEnd: new Date("2026-09-10T00:00:00.000Z") }) } };
    mocks.transaction.mockImplementationOnce(async (operation) => operation(transaction));
    await expect(activatePlan(customer, "keen-plus", now)).rejects.toMatchObject({ status: 409, code: "PLAN_ALREADY_ACTIVE" });
  });
});
