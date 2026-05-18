import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: Request) {
  const { error } = await requireSession(["ADMIN"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const action = searchParams.get("action");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: {
    userId?: string;
    action?: { contains: string; mode: "insensitive" };
    timestamp?: { gte?: Date; lte?: Date };
  } = {};

  if (userId) where.userId = userId;
  if (action) where.action = { contains: action, mode: "insensitive" };
  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.timestamp.lte = end;
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      goal: { select: { id: true, title: true } },
    },
    orderBy: { timestamp: "desc" },
    take: 500,
  });

  return NextResponse.json({ logs });
}
