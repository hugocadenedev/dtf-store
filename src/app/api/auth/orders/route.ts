import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customerId: customer.id },
        { customerEmail: customer.email },
      ],
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
