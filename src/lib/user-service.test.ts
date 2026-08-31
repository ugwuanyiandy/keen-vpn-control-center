import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  userCount: vi.fn(),
  userFindMany: vi.fn(),
  userFindUnique: vi.fn(),
  historyCount: vi.fn(),
  historyFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: mocks.transaction,
    user: { count: mocks.userCount, findMany: mocks.userFindMany, findUnique: mocks.userFindUnique },
    subscriptionHistory: { count: mocks.historyCount, findMany: mocks.historyFindMany },
  },
}));

import { getAdminUser, listAdminUsers } from "@/lib/user-service";

const publicUser = {
  id: "user-id",
  fullName: "Amara Okafor",
  email: "amara@example.com",
  role: "CUSTOMER" as const,
  createdAt: new Date("2026-08-01T00:00:00.000Z"),
  subscription: null,
  pinnedServer: null,
};

describe("admin user directory", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.userCount.mockResolvedValue(1);
    mocks.userFindMany.mockResolvedValue([publicUser]);
    mocks.transaction.mockImplementation(async (operations) => Promise.all(operations));
  });

  it("searches and filters users while selecting public fields only", async () => {
    const result = await listAdminUsers({ q: "amara", status: "none", role: "customer", page: 1, pageSize: 12, sort: "fullName", order: "asc" });
    const query = mocks.userFindMany.mock.calls[0][0];
    expect(query.where).toMatchObject({ role: "CUSTOMER", subscription: { is: null } });
    expect(query.where.OR).toHaveLength(2);
    expect(query.take).toBe(12);
    expect(query.select).toMatchObject({ id: true, fullName: true, email: true, role: true, createdAt: true });
    expect(query.select).not.toHaveProperty("passwordHash");
    expect(result.items[0]).toEqual(expect.objectContaining({ fullName: "Amara Okafor", subscription: { status: "NO_SUBSCRIPTION", plan: null, currentPeriodEnd: null } }));
    expect(result.items[0]).not.toHaveProperty("passwordHash");
  });

  it("returns a not-found error for a missing detail account", async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    await expect(getAdminUser("missing")).rejects.toMatchObject({ status: 404, code: "USER_NOT_FOUND" });
  });
});
