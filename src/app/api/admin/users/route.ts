import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, validationError } from "@/lib/api";
import { assertAdmin, requireApiUser } from "@/lib/auth";
import { listAdminUsers } from "@/lib/user-service";
import { adminUserQuerySchema, searchParamsToObject } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    assertAdmin(await requireApiUser(request));
    const parsed = adminUserQuerySchema.safeParse(searchParamsToObject(request.nextUrl.searchParams));
    if (!parsed.success) return validationError(parsed.error);
    return NextResponse.json({ data: await listAdminUsers(parsed.data) });
  } catch (error) {
    return handleRouteError(error);
  }
}
