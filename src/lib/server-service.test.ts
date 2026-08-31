import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditAction, UserRole } from "@/generated/prisma/enums";

const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: { $transaction: mocks.transaction } }));

import { createServerAsActor, deleteServerAsActor } from "@/lib/server-service";

describe("server administration authorization", () => {
  beforeEach(() => mocks.transaction.mockReset());

  it("rejects a customer before attempting a database transaction", async () => {
    const operation = createServerAsActor(
      { id: "customer-id", fullName: "Customer User", email: "customer@example.com", role: UserRole.CUSTOMER },
      { country: "Nigeria", city: "Lagos", hostname: "los-02.keenvpn.net", active: true, latencyMs: 48 },
    );

    await expect(operation).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects customer deletion before attempting a database transaction", async () => {
    const operation = deleteServerAsActor(
      { id: "customer-id", fullName: "Customer User", email: "customer@example.com", role: UserRole.CUSTOMER },
      "server-id",
    );

    await expect(operation).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("deletes a server and records its snapshot in one transaction", async () => {
    const existing = {
      id: "server-id",
      country: "Nigeria",
      city: "Lagos",
      hostname: "los-01.keenvpn.net",
      active: false,
      latencyMs: 42,
      createdAt: new Date("2026-08-29T10:00:00.000Z"),
      updatedAt: new Date("2026-08-29T11:00:00.000Z"),
      _count: { pinnedBy: 2 },
    };
    const transaction = {
      server: { findUnique: vi.fn().mockResolvedValue(existing), delete: vi.fn().mockResolvedValue(existing) },
      adminAuditLog: { create: vi.fn().mockResolvedValue({ id: "audit-id" }) },
    };
    mocks.transaction.mockImplementationOnce(async (...args) => {
      const operation = args[0];
      expect(operation).toBeTypeOf("function");
      return operation(transaction);
    });

    const result = await deleteServerAsActor(
      { id: "admin-id", fullName: "Admin User", email: "admin@example.com", role: UserRole.ADMIN },
      existing.id,
    );

    expect(transaction.server.delete).toHaveBeenCalledWith({ where: { id: existing.id } });
    expect(transaction.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "admin-id",
        action: AuditAction.DELETED,
        beforeState: expect.objectContaining({ hostname: existing.hostname }),
      }),
    });
    expect(result.clearedPinnedUsers).toBe(2);
  });

  it("returns a not-found error when the server no longer exists", async () => {
    const transaction = {
      server: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    mocks.transaction.mockImplementationOnce(async (...args) => args[0](transaction));

    const operation = deleteServerAsActor(
      { id: "admin-id", fullName: "Admin User", email: "admin@example.com", role: UserRole.ADMIN },
      "missing-server",
    );

    await expect(operation).rejects.toMatchObject({ status: 404, code: "SERVER_NOT_FOUND" });
  });
});
