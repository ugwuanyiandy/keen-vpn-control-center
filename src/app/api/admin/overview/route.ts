import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { assertAdmin, requireApiUser } from "@/lib/auth";
import { getAdminOverview } from "@/lib/server-service";

export async function GET(request: NextRequest) {
  try {
    assertAdmin(await requireApiUser(request));
    return NextResponse.json({ data: await getAdminOverview() });
  } catch (error) {
    return handleRouteError(error);
  }
}
