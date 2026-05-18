import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { userUpdateSchema } from "@/lib/validations/user.schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { error, session } = await requireSession(["ADMIN"]);
  if (error || !session) return error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = userUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data = parsed.data;

  if (data.email && data.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailTaken) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
  }

  if (data.managerId) {
    if (data.managerId === id) {
      return NextResponse.json(
        { error: "User cannot be their own manager" },
        { status: 400 }
      );
    }
    const manager = await prisma.user.findUnique({
      where: { id: data.managerId },
    });
    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 400 });
    }
  }

  const updateData: {
    name?: string;
    email?: string;
    password?: string;
    role?: typeof data.role;
    department?: string | null;
    managerId?: string | null;
  } = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.managerId !== undefined) updateData.managerId = data.managerId;
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
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
      action: "USER_UPDATED",
      details: { userId: id, changes: data },
    },
  });

  return NextResponse.json(user);
}
