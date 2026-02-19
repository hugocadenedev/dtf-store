import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/orders
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const where: Record<string, unknown> = {};
  if (status) where.orderStatus = status;

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
