import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

const VALID_ORDER_STATUSES = ["received", "preparing", "shipped", "delivered", "cancelled"];

// PUT /api/orders/[id] — update order status (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { orderStatus } = body;

  if (!orderStatus || !VALID_ORDER_STATUSES.includes(orderStatus)) {
    return NextResponse.json(
      { error: `orderStatus must be one of: ${VALID_ORDER_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const order = await prisma.order.update({
    where: { id },
    data: { orderStatus },
    include: { items: true },
  });

  return NextResponse.json(order);
}

// GET /api/orders/[id] (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
