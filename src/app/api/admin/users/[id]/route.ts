import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { assertAdmin, requireApiUser } from "@/lib/auth";
import { getAdminUser } from "@/lib/user-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertAdmin(await requireApiUser(request));
    const { id } = await params;
    return NextResponse.json({ data: { user: await getAdminUser(id) } });
  } catch (error) {
    return handleRouteError(error);
  }
}
