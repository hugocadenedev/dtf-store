import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

// GET /api/products?type=metre|logo
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

  const where: Record<string, unknown> = { active: true };
  if (type) where.type = type;

  const products = await prisma.product.findMany({
    where,
    include: { tiers: { orderBy: { minQty: "asc" } } },
  });

  return NextResponse.json(products);
}

// POST /api/products — create a new product (admin only)
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, name, description } = body;

  if (!type || !name) {
    return NextResponse.json({ error: "type and name required" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: { type, name, description: description ?? "" },
    include: { tiers: true },
  });

  return NextResponse.json(product, { status: 201 });
}
