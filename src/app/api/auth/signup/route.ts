import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { UserRole } from "@/generated/prisma/enums";
import { assertSameOrigin, handleRouteError, parseJson, validationError } from "@/lib/api";
import { createSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { signupSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const parsed = signupSchema.safeParse(await parseJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const passwordHash = await hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: { fullName: parsed.data.fullName, email: parsed.data.email, passwordHash, role: UserRole.CUSTOMER },
      select: { id: true, fullName: true, email: true, role: true },
    });
    const session = await createSession(user.id);
    const response = NextResponse.json({ data: { user } }, { status: 201 });
    setSessionCookie(response, session.token, session.expiresAt);
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: { code: "EMAIL_IN_USE", message: "An account already exists for this email.", fieldErrors: { email: ["This email is already registered."] } } },
        { status: 409 },
      );
    }
    return handleRouteError(error);
  }
}
