import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Block in production entirely
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Seed disabled in production" }, { status: 403 });
  }

  // Require admin auth even in dev
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Clean existing data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.priceTier.deleteMany();
    await prisma.product.deleteMany();

    // ── DTF au Mètre ────────────────────────────────────────────
    const metre = await prisma.product.create({
      data: {
        type: "metre",
        name: "DTF au Mètre",
        description:
          "Transfert DTF en rouleau continu (largeur 60cm). Idéal pour les grandes séries. Impression haute définition 300 dpi.",
        active: true,
      },
    });

    await prisma.priceTier.createMany({
      data: [
        { productId: metre.id, minQty: 0.5, maxQty: 0.99, unitPrice: 25.0, label: "" },
        { productId: metre.id, minQty: 1, maxQty: 4.99, unitPrice: 20.0, label: "" },
        { productId: metre.id, minQty: 5, maxQty: 9.99, unitPrice: 15.0, label: "" },
        { productId: metre.id, minQty: 10, maxQty: 24.99, unitPrice: 12.0, label: "" },
        { productId: metre.id, minQty: 25, maxQty: 99999, unitPrice: 10.0, label: "" },
      ],
    });

    // ── DTF au Logo ─────────────────────────────────────────────
    const logo = await prisma.product.create({
      data: {
        type: "logo",
        name: "DTF au Logo",
        description:
          "Transferts DTF découpés à la forme. Choisissez votre format et votre quantité. Qualité professionnelle.",
        active: true,
      },
    });

    // 10x10cm tiers
    await prisma.priceTier.createMany({
      data: [
        { productId: logo.id, minQty: 1, maxQty: 9, unitPrice: 3.5, label: "10×10cm" },
        { productId: logo.id, minQty: 10, maxQty: 49, unitPrice: 2.8, label: "10×10cm" },
        { productId: logo.id, minQty: 50, maxQty: 99, unitPrice: 2.2, label: "10×10cm" },
        { productId: logo.id, minQty: 100, maxQty: 499, unitPrice: 1.8, label: "10×10cm" },
        { productId: logo.id, minQty: 500, maxQty: 99999, unitPrice: 1.4, label: "10×10cm" },
      ],
    });

    // A4 tiers
    await prisma.priceTier.createMany({
      data: [
        { productId: logo.id, minQty: 1, maxQty: 9, unitPrice: 6.0, label: "A4" },
        { productId: logo.id, minQty: 10, maxQty: 49, unitPrice: 4.8, label: "A4" },
        { productId: logo.id, minQty: 50, maxQty: 99, unitPrice: 3.8, label: "A4" },
        { productId: logo.id, minQty: 100, maxQty: 499, unitPrice: 3.0, label: "A4" },
        { productId: logo.id, minQty: 500, maxQty: 99999, unitPrice: 2.4, label: "A4" },
      ],
    });

    // A3 tiers
    await prisma.priceTier.createMany({
      data: [
        { productId: logo.id, minQty: 1, maxQty: 9, unitPrice: 10.0, label: "A3" },
        { productId: logo.id, minQty: 10, maxQty: 49, unitPrice: 8.0, label: "A3" },
        { productId: logo.id, minQty: 50, maxQty: 99, unitPrice: 6.5, label: "A3" },
        { productId: logo.id, minQty: 100, maxQty: 499, unitPrice: 5.0, label: "A3" },
        { productId: logo.id, minQty: 500, maxQty: 99999, unitPrice: 4.0, label: "A3" },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Database seeded with DTF au Mètre + DTF au Logo",
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
