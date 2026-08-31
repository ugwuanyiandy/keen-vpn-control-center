import { redirect } from "next/navigation";
import { ServersClient } from "@/components/servers-client";
import { getPageUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listServers } from "@/lib/server-service";
import { serializeServer } from "@/lib/serializers";
import { UserRole } from "@/generated/prisma/enums";

export default async function ServersPage() {
  const user = await getPageUser();
  if (!user) redirect("/login");
  const isAdmin = user.role === UserRole.ADMIN;
  const [initialData, profile] = await Promise.all([
    listServers(
      { q: "", page: 1, pageSize: 12, sort: isAdmin ? "createdAt" : "latency", order: isAdmin ? "desc" : "asc", status: isAdmin ? "all" : "active" },
      isAdmin,
    ),
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { pinnedServer: true } }),
  ]);

  return (
    <ServersClient
      initialData={initialData}
      initialPinnedServer={profile.pinnedServer ? serializeServer(profile.pinnedServer) : null}
      isAdmin={isAdmin}
    />
  );
}
