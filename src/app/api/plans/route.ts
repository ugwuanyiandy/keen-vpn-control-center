import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { PLAN_CATALOG } from "@/lib/plans";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser(request);
    return NextResponse.json({ data: { plans: PLAN_CATALOG } });
  } catch (error) {
    return handleRouteError(error);
  }
}
