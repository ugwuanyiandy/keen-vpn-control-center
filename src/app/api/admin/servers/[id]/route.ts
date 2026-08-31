import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { assertSameOrigin, errorResponse, handleRouteError, parseJson, validationError } from "@/lib/api";
import { assertAdmin, requireApiUser } from "@/lib/auth";
import { deleteServerAsActor, updateServerAsActor } from "@/lib/server-service";
import { serverUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = assertAdmin(await requireApiUser(request));
    const parsed = serverUpdateSchema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const { id } = await params;
    const server = await updateServerAsActor(actor, id, parsed.data);
    return NextResponse.json({ data: { server } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse(409, "HOSTNAME_IN_USE", "A server with this hostname already exists.", { hostname: ["Hostname must be unique."] });
    }
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = assertAdmin(await requireApiUser(request));
    const { id } = await params;
    return NextResponse.json({ data: await deleteServerAsActor(actor, id) });
  } catch (error) {
    return handleRouteError(error);
  }
}
