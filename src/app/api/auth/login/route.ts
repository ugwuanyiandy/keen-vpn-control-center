import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, assertSameOrigin, handleRouteError, parseJson, validationError } from "@/lib/api";
import { createSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const parsed = loginSchema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    const validPassword = user ? await compare(parsed.data.password, user.passwordHash) : false;
    if (!user || !validPassword) {
      return errorResponse(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }

    const session = await createSession(user.id);
    const response = NextResponse.json({ data: { user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } } });
    setSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
