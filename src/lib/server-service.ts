import { AuditAction, UserRole } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { AppError } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeAuditLog, serializeServer } from "@/lib/serializers";

export type ServerListInput = {
  q: string;
  page: number;
  pageSize: number;
  sort: "latency" | "country" | "city" | "createdAt";
  order: "asc" | "desc";
  status?: "all" | "active" | "inactive";
};

function serverWhere(input: ServerListInput, admin: boolean): Prisma.ServerWhereInput {
  const statusFilter = admin
    ? input.status === "active"
      ? { active: true }
      : input.status === "inactive"
        ? { active: false }
        : {}
    : { active: true };

  return {
    ...statusFilter,
    ...(input.q
      ? {
          OR: [
            { country: { contains: input.q, mode: "insensitive" as const } },
            { city: { contains: input.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

function serverOrderBy(input: ServerListInput): Prisma.ServerOrderByWithRelationInput {
  const key = input.sort === "latency" ? "latencyMs" : input.sort;
  return { [key]: input.order } as Prisma.ServerOrderByWithRelationInput;
}

export async function listServers(input: ServerListInput, admin = false) {
  const where = serverWhere(input, admin);
  const [total, items] = await prisma.$transaction([
    prisma.server.count({ where }),
    prisma.server.findMany({
      where,
      orderBy: serverOrderBy(input),
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
  ]);

  return {
    items: items.map(serializeServer),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
    },
  };
}

export type ServerMutationInput = {
  country?: string;
  city?: string;
  hostname?: string;
  active?: boolean;
  latencyMs?: number;
};

function requireAdminActor(actor: AuthUser) {
  if (actor.role !== UserRole.ADMIN) {
    throw new AppError(403, "FORBIDDEN", "Administrator access is required.");
  }
}

export async function createServerAsActor(actor: AuthUser, input: Required<ServerMutationInput>) {
  requireAdminActor(actor);

  return prisma.$transaction(async (transaction) => {
    const server = await transaction.server.create({ data: input });
    await transaction.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        serverId: server.id,
        action: AuditAction.CREATED,
        afterState: serializeServer(server),
      },
    });
    return serializeServer(server);
  });
}

export async function updateServerAsActor(actor: AuthUser, id: string, input: ServerMutationInput) {
  requireAdminActor(actor);

  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.server.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, "SERVER_NOT_FOUND", "Server location was not found.");
    }

    const server = await transaction.server.update({ where: { id }, data: input });
    const action =
      input.active === undefined || input.active === existing.active
        ? AuditAction.UPDATED
        : input.active
          ? AuditAction.ENABLED
          : AuditAction.DISABLED;

    await transaction.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        serverId: server.id,
        action,
        beforeState: serializeServer(existing),
        afterState: serializeServer(server),
      },
    });
    return serializeServer(server);
  });
}

export async function deleteServerAsActor(actor: AuthUser, id: string) {
  requireAdminActor(actor);

  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.server.findUnique({
      where: { id },
      include: { _count: { select: { pinnedBy: true } } },
    });
    if (!existing) {
      throw new AppError(404, "SERVER_NOT_FOUND", "Server location was not found.");
    }

    const snapshot = serializeServer(existing);
    await transaction.server.delete({ where: { id } });
    await transaction.adminAuditLog.create({
      data: {
        actorUserId: actor.id,
        action: AuditAction.DELETED,
        beforeState: snapshot,
      },
    });

    return { server: snapshot, clearedPinnedUsers: existing._count.pinnedBy };
  });
}

export async function getAdminOverview() {
  const [total, active, inactive, totalUsers, recentLogs] = await prisma.$transaction([
    prisma.server.count(),
    prisma.server.count({ where: { active: true } }),
    prisma.server.count({ where: { active: false } }),
    prisma.user.count(),
    prisma.adminAuditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { email: true } },
        server: { select: { city: true, country: true, hostname: true } },
      },
    }),
  ]);

  return {
    counts: { total, active, inactive, users: totalUsers },
    database: "healthy" as const,
    recentActivity: recentLogs.map(serializeAuditLog),
  };
}
