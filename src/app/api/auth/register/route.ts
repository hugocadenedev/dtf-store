import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide." },
        { status: 400 }
      );
    }

    // Sanitize name (strip HTML/script tags)
    const sanitizedName = name.replace(/<[^>]*>/g, "").trim();
    if (!sanitizedName || sanitizedName.length > 100) {
      return NextResponse.json(
        { error: "Nom invalide (maximum 100 caractères)." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.customer.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const customer = await prisma.customer.create({
      data: { email: normalizedEmail, name: sanitizedName, passwordHash },
    });

    // Link any existing orders with the same email
    await prisma.order.updateMany({
      where: { customerEmail: normalizedEmail, customerId: null },
      data: { customerId: customer.id },
    });

    const token = await signToken({
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      role: customer.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription." },
      { status: 500 }
    );
  }
}
