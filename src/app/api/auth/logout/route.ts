import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, handleRouteError } from "@/lib/api";
import { clearSessionCookie, revokeRequestSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await revokeRequestSession(request);
    const response = NextResponse.json({ data: { success: true } });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
