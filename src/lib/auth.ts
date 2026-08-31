import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma/enums";
import { AppError } from "@/lib/api";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "keen_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type AuthUser = { id: string; fullName: string; email: string; role: UserRole };

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function shouldUseSecureCookies() {
  if (process.env.NODE_ENV !== "production") return false;
  if (!process.env.APP_ORIGIN) return true;

  try {
    return new URL(process.env.APP_ORIGIN).protocol === "https:";
  } catch {
    return true;
  }
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.session.create({
      data: { userId, tokenHash: hashSessionToken(token), expiresAt },
    }),
  ]);

  return { token, expiresAt };
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function getUserFromToken(token?: string): Promise<AuthUser | null> {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { select: { id: true, fullName: true, email: true, role: true } } },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return session.user;
}

export async function getPageUser() {
  const cookieStore = await cookies();
  return getUserFromToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function requireApiUser(request: NextRequest) {
  const user = await getUserFromToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    throw new AppError(401, "UNAUTHENTICATED", "Sign in to continue.");
  }
  return user;
}

export function assertAdmin(user: AuthUser) {
  if (user.role !== UserRole.ADMIN) {
    throw new AppError(403, "FORBIDDEN", "Administrator access is required.");
  }
  return user;
}

export async function revokeRequestSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }
}
