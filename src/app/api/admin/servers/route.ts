import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { assertSameOrigin, errorResponse, handleRouteError, parseJson, validationError } from "@/lib/api";
import { assertAdmin, requireApiUser } from "@/lib/auth";
import { createServerAsActor, listServers } from "@/lib/server-service";
import { searchParamsToObject, serverCreateSchema, serverQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    assertAdmin(await requireApiUser(request));
    const parsed = serverQuerySchema.safeParse(searchParamsToObject(request.nextUrl.searchParams));
    if (!parsed.success) return validationError(parsed.error);
    return NextResponse.json({ data: await listServers(parsed.data, true) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const actor = assertAdmin(await requireApiUser(request));
    const parsed = serverCreateSchema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    const server = await createServerAsActor(actor, parsed.data);
    return NextResponse.json({ data: { server } }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse(409, "HOSTNAME_IN_USE", "A server with this hostname already exists.", { hostname: ["Hostname must be unique."] });
    }
    return handleRouteError(error);
  }
}
