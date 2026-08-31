import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, handleRouteError, parseJson, validationError } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { activatePlan } from "@/lib/subscription-service";
import { planActivationSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser(request);
    const parsed = planActivationSchema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);
    return NextResponse.json({ data: await activatePlan(user, parsed.data.planId) });
  } catch (error) {
    return handleRouteError(error);
  }
}
