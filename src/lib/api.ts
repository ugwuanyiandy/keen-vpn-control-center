import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: FieldErrors,
) {
  return NextResponse.json(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status },
  );
}

export function validationError(error: ZodError) {
  return errorResponse(
    400,
    "VALIDATION_ERROR",
    "Please check the highlighted fields.",
    error.flatten().fieldErrors as FieldErrors,
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(error.status, error.code, error.message, error.fieldErrors);
  }

  console.error("Unexpected API error", error);
  return errorResponse(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
}

function canonicalOrigin(origin: string) {
  try {
    const url = new URL(origin);
    if (["127.0.0.1", "[::1]"].includes(url.hostname)) {
      url.hostname = "localhost";
    }
    return url.origin;
  } catch {
    return origin;
  }
}

export function assertSameOrigin(request: NextRequest) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    throw new AppError(403, "INVALID_ORIGIN", "Cross-site requests are not allowed.");
  }

  const origin = request.headers.get("origin");
  const allowedOrigin = process.env.APP_ORIGIN ?? request.nextUrl.origin;
  if (origin && canonicalOrigin(origin) !== canonicalOrigin(allowedOrigin)) {
    throw new AppError(403, "INVALID_ORIGIN", "Cross-site requests are not allowed.");
  }
}

export async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}
