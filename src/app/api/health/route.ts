import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ data: { status: "ok", database: "reachable", timestamp: new Date().toISOString() } });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVICE_UNAVAILABLE", message: "The service is temporarily unavailable." }, data: { status: "degraded", database: "unreachable", timestamp: new Date().toISOString() } },
      { status: 503 },
    );
  }
}
