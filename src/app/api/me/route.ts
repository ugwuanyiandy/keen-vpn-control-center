import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeServer, serializeSubscription } from "@/lib/serializers";

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireApiUser(request);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: authUser.id },
      include: { subscription: true, pinnedServer: true },
    });
    return NextResponse.json({
      data: {
        user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
        subscription: serializeSubscription(user.subscription),
        pinnedServer: user.pinnedServer ? serializeServer(user.pinnedServer) : null,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
