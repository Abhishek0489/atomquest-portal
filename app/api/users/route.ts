import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { userCreateSchema } from "@/lib/validations/user.schema";

export async function GET() {
  const { error } = await requireSession(["ADMIN"]);
  if (error) return error;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const { error, session } = await requireSession(["ADMIN"]);
  if (error || !session) return error;

  const body = await request.json();
  const parsed = userCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  if (data.managerId) {
    const manager = await prisma.user.findUnique({
      where: { id: data.managerId },
    });
    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 400 });
    }
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      department: data.department || null,
      managerId: data.managerId || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
      createdAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "USER_CREATED",
      details: { userId: user.id, email: user.email, role: user.role },
    },
  });

  return NextResponse.json(user, { status: 201 });
}
