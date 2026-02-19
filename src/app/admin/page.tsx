"use client";

import { useEffect, useState } from "react";
import type { Product, Order } from "@/lib/types";
import { motion } from "framer-motion";
import { Package, CreditCard, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
    ]).then(([p, o]) => {
      setProducts(p);
      setOrders(o);
      setLoading(false);
    });
  }, []);

  const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
  const revenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 shimmer" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-28 shimmer" />
          <div className="h-28 shimmer" />
          <div className="h-28 shimmer" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Produits actifs",
      value: products.filter((p) => p.active).length,
      icon: Package,
      color: "from-indigo-500 to-blue-500",
      bg: "bg-indigo-50",
      text: "text-indigo-600",
    },
    {
      label: "Commandes payees",
      value: paidOrders.length,
      icon: CreditCard,
      color: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: "Chiffre d'affaires",
      value: new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(revenue),
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500",
      bg: "bg-purple-50",
      text: "text-purple-600",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="card p-6 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${kpi.color} opacity-5 rounded-bl-[40px]`} />
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
              <kpi.icon size={18} className={kpi.text} />
            </div>
            <p className="text-xs font-semibold text-muted mb-1">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-4">Dernieres commandes</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-muted">Aucune commande.</p>
      ) : (
        <div className="card overflow-hidden">
          {orders.slice(0, 10).map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="px-5 py-3.5 flex items-center justify-between text-sm border-b border-border/40 last:border-0"
            >
              <div>
                <span className="font-semibold">{order.customerName}</span>
                <span className="text-muted ml-2 text-xs">{order.customerEmail}</span>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    order.paymentStatus === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : order.paymentStatus === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {order.paymentStatus}
                </span>
                <span className="font-bold">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(order.totalAmount)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
