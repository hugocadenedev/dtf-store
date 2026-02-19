import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

// GET /api/admin/clients — all customers with their stats (admin only)
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      orders: {
        select: {
          id: true,
          totalAmount: true,
          paymentStatus: true,
          orderStatus: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              sizeLabel: true,
              quantity: true,
              totalPrice: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Compute per-customer stats
  const result = customers.map((c) => {
    const paidOrders = c.orders.filter((o) => o.paymentStatus === "paid");
    const totalSpent = paidOrders.reduce((s, o) => s + o.totalAmount, 0);
    return {
      id: c.id,
      email: c.email,
      name: c.name,
      role: c.role,
      createdAt: c.createdAt,
      orderCount: c.orders.length,
      paidOrderCount: paidOrders.length,
      totalSpent,
      orders: c.orders,
    };
  });

  return NextResponse.json(result);
}
