import { NextRequest, NextResponse } from "next/server";
import { AppError, assertSameOrigin, handleRouteError, parseJson, validationError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeServer } from "@/lib/serializers";
import { pinnedServerSchema } from "@/lib/validation";

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(request);
    const parsed = pinnedServerSchema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const pinnedServer = await prisma.$transaction(async (transaction) => {
      if (!parsed.data.serverId) {
        await transaction.user.update({ where: { id: user.id }, data: { pinnedServerId: null } });
        return null;
      }

      const server = await transaction.server.findFirst({
        where: { id: parsed.data.serverId, active: true },
      });
      if (!server) {
        throw new AppError(409, "SERVER_UNAVAILABLE", "That server is no longer available. Choose another location.");
      }
      await transaction.user.update({ where: { id: user.id }, data: { pinnedServerId: server.id } });
      return server;
    });

    return NextResponse.json({ data: { pinnedServer: pinnedServer ? serializeServer(pinnedServer) : null } });
  } catch (error) {
    return handleRouteError(error);
  }
}
