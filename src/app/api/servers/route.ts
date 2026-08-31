import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, validationError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { listServers } from "@/lib/server-service";
import { searchParamsToObject, serverQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);
    const parsed = serverQuerySchema.safeParse(searchParamsToObject(request.nextUrl.searchParams));
    if (!parsed.success) return validationError(parsed.error);
    const data = await listServers(parsed.data, false);
    return NextResponse.json({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}
