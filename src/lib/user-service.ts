import { Prisma } from "@/generated/prisma/client";
import { AppError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { serializeServer, serializeSubscription, serializeSubscriptionHistory } from "@/lib/serializers";

export type AdminUserListInput = {
  q: string;
  status: "all" | "active" | "trial" | "expired" | "none";
  role: "all" | "customer" | "admin";
  page: number;
  pageSize: number;
  sort: "fullName" | "email" | "createdAt";
  order: "asc" | "desc";
};

function userWhere(input: AdminUserListInput): Prisma.UserWhereInput {
  const statusWhere: Prisma.UserWhereInput =
    input.status === "none"
      ? { subscription: { is: null } }
      : input.status === "all"
        ? {}
        : { subscription: { is: { status: input.status.toUpperCase() as "ACTIVE" | "TRIAL" | "EXPIRED" } } };

  return {
    ...statusWhere,
    ...(input.role === "all" ? {} : { role: input.role.toUpperCase() as "CUSTOMER" | "ADMIN" }),
    ...(input.q
      ? {
          OR: [
            { fullName: { contains: input.q, mode: "insensitive" } },
            { email: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function serializePublicUser(user: {
  id: string;
  fullName: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  createdAt: Date;
  subscription: Parameters<typeof serializeSubscription>[0];
  pinnedServer: Parameters<typeof serializeServer>[0] | null;
}) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    joinedAt: user.createdAt.toISOString(),
    pinnedServer: user.pinnedServer ? serializeServer(user.pinnedServer) : null,
    subscription: serializeSubscription(user.subscription),
  };
}

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  createdAt: true,
  subscription: true,
  pinnedServer: true,
} satisfies Prisma.UserSelect;

export async function listAdminUsers(input: AdminUserListInput) {
  const where = userWhere(input);
  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: publicUserSelect,
      orderBy: { [input.sort]: input.order },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
  ]);

  return {
    items: users.map(serializePublicUser),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
    },
  };
}

export async function getAdminUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User account was not found.");
  return serializePublicUser(user);
}

export async function listSubscriptionHistory(userId: string, page: number, pageSize: number) {
  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!exists) throw new AppError(404, "USER_NOT_FOUND", "User account was not found.");

  const where = { userId };
  const [total, items] = await prisma.$transaction([
    prisma.subscriptionHistory.count({ where }),
    prisma.subscriptionHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return {
    items: items.map(serializeSubscriptionHistory),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}
