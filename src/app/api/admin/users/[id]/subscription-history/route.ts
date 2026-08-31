import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, validationError } from "@/lib/api";
import { assertAdmin, requireApiUser } from "@/lib/auth";
import { listSubscriptionHistory } from "@/lib/user-service";
import { searchParamsToObject, subscriptionHistoryQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertAdmin(await requireApiUser(request));
    const parsed = subscriptionHistoryQuerySchema.safeParse(searchParamsToObject(request.nextUrl.searchParams));
    if (!parsed.success) return validationError(parsed.error);
    const { id } = await params;
    return NextResponse.json({
      data: await listSubscriptionHistory(id, parsed.data.page, parsed.data.pageSize),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
