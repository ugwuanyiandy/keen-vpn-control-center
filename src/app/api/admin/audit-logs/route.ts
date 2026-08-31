import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, validationError } from "@/lib/api";
import { assertAdmin, requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeAuditLog } from "@/lib/serializers";
import { auditQuerySchema, searchParamsToObject } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    assertAdmin(await requireApiUser(request));
    const parsed = auditQuerySchema.safeParse(searchParamsToObject(request.nextUrl.searchParams));
    if (!parsed.success) return validationError(parsed.error);
    const where = {};
    const [total, items] = await prisma.$transaction([
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.findMany({
        where,
        skip: (parsed.data.page - 1) * parsed.data.pageSize,
        take: parsed.data.pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          actor: { select: { email: true } },
          server: { select: { city: true, country: true, hostname: true } },
        },
      }),
    ]);
    return NextResponse.json({
      data: {
        items: items.map(serializeAuditLog),
        pagination: {
          page: parsed.data.page,
          pageSize: parsed.data.pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / parsed.data.pageSize)),
        },
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
