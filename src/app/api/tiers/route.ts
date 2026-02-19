import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tiers?productId=xxx
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const tiers = await prisma.priceTier.findMany({
    where: { productId },
    orderBy: { minQty: "asc" },
  });

  return NextResponse.json(tiers);
}

// POST /api/tiers — create tier
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productId, minQty, maxQty, unitPrice, label } = body;

  if (!productId || minQty == null || maxQty == null || unitPrice == null) {
    return NextResponse.json(
      { error: "productId, minQty, maxQty, unitPrice required" },
      { status: 400 }
    );
  }

  const tier = await prisma.priceTier.create({
    data: {
      productId,
      minQty: parseFloat(minQty),
      maxQty: parseFloat(maxQty),
      unitPrice: parseFloat(unitPrice),
      label: label ?? "",
    },
  });

  return NextResponse.json(tier, { status: 201 });
}

// PUT /api/tiers — bulk update tiers for a product
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { productId, tiers } = body;

  if (!productId || !Array.isArray(tiers)) {
    return NextResponse.json(
      { error: "productId and tiers array required" },
      { status: 400 }
    );
  }

  // Delete existing tiers, then re-create
  await prisma.priceTier.deleteMany({ where: { productId } });

  const created = await Promise.all(
    tiers.map(
      (t: { minQty: number; maxQty: number; unitPrice: number; label?: string }) =>
        prisma.priceTier.create({
          data: {
            productId,
            minQty: t.minQty,
            maxQty: t.maxQty,
            unitPrice: t.unitPrice,
            label: t.label ?? "",
          },
        })
    )
  );

  return NextResponse.json(created);
}
