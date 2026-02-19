import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

// GET /api/admin/stats — comprehensive dashboard stats (admin only)
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Run parallel queries
  const [
    totalOrders,
    paidOrders,
    totalCustomers,
    thisMonthOrders,
    lastMonthOrders,
    recentOrders,
    productCount,
    ordersByStatus,
  ] = await Promise.all([
    // Total orders
    prisma.order.count(),
    // Paid orders with revenue
    prisma.order.findMany({
      where: { paymentStatus: "paid" },
      select: { totalAmount: true, createdAt: true },
    }),
    // Total customers
    prisma.customer.count(),
    // This month paid orders
    prisma.order.findMany({
      where: {
        paymentStatus: "paid",
        createdAt: { gte: startOfMonth },
      },
      select: { totalAmount: true },
    }),
    // Last month paid orders
    prisma.order.findMany({
      where: {
        paymentStatus: "paid",
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      select: { totalAmount: true },
    }),
    // Recent 10 orders
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: true },
    }),
    // Active products count
    prisma.product.count({ where: { active: true } }),
    // Orders grouped by status
    prisma.order.groupBy({
      by: ["orderStatus"],
      _count: { id: true },
    }),
  ]);

  const totalRevenue = paidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const thisMonthRevenue = thisMonthOrders.reduce((s, o) => s + o.totalAmount, 0);
  const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + o.totalAmount, 0);
  const revenueGrowth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : thisMonthRevenue > 0 ? 100 : 0;

  // Average order value
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Revenue per day for last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const revenueByDay: Record<string, number> = {};
  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    revenueByDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const o of paidOrders) {
    const day = new Date(o.createdAt).toISOString().slice(0, 10);
    if (revenueByDay[day] !== undefined) {
      revenueByDay[day] += o.totalAmount;
    }
  }

  const statusCounts: Record<string, number> = {};
  for (const s of ordersByStatus) {
    statusCounts[s.orderStatus] = s._count.id;
  }

  return NextResponse.json({
    totalOrders,
    paidOrdersCount: paidOrders.length,
    totalRevenue,
    thisMonthRevenue,
    lastMonthRevenue,
    revenueGrowth,
    avgOrderValue,
    totalCustomers,
    productCount,
    revenueByDay,
    statusCounts,
    recentOrders,
  });
}
