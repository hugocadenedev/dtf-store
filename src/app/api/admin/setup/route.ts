import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setSessionCookie } from "@/lib/auth";

// GET — check if any admin exists
export async function GET() {
  const adminCount = await prisma.customer.count({ where: { role: "admin" } });
  return NextResponse.json({ hasAdmin: adminCount > 0 });
}

// POST — create the first admin account (only works if no admin exists)
export async function POST(req: NextRequest) {
  const adminCount = await prisma.customer.count({ where: { role: "admin" } });
  if (adminCount > 0) {
    return NextResponse.json(
      { error: "Un compte administrateur existe déjà." },
      { status: 403 }
    );
  }

  const { email, name, password } = await req.json();

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: "Tous les champs sont requis." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists as customer → promote to admin
  const existing = await prisma.customer.findUnique({ where: { email: normalizedEmail } });
  
  let customer;
  if (existing) {
    customer = await prisma.customer.update({
      where: { id: existing.id },
      data: { role: "admin", passwordHash: await bcrypt.hash(password, 12) },
    });
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    customer = await prisma.customer.create({
      data: { email: normalizedEmail, name, passwordHash, role: "admin" },
    });
  }

  const token = await signToken({
    customerId: customer.id,
    email: customer.email,
    name: customer.name,
    role: customer.role,
  });

  await setSessionCookie(token);

  return NextResponse.json({ success: true });
}
