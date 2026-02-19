import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/orders/[id] — update order status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { orderStatus } = body;

  if (!orderStatus) {
    return NextResponse.json({ error: "orderStatus required" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { orderStatus },
    include: { items: true },
  });

  return NextResponse.json(order);
}

// GET /api/orders/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
