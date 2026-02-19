"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  Eye,
  Clock,
  CheckCircle2,
  Truck,
} from "lucide-react";

interface StatsData {
  totalOrders: number;
  paidOrdersCount: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  avgOrderValue: number;
  totalCustomers: number;
  productCount: number;
  revenueByDay: Record<string, number>;
  statusCounts: Record<string, number>;
  recentOrders: Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    paymentStatus: string;
    orderStatus: string;
    totalAmount: number;
    createdAt: string;
    items: Array<{ id: string; sizeLabel: string; quantity: number }>;
  }>;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function formatDateFull(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
  received: { label: "Reçue", icon: Clock, cls: "bg-blue-50 text-blue-600" },
  preparing: { label: "En préparation", icon: Package, cls: "bg-amber-50 text-amber-600" },
  shipped: { label: "Expédiée", icon: Truck, cls: "bg-emerald-50 text-emerald-600" },
};

const PAYMENT_CONFIG: Record<string, { label: string; cls: string }> = {
  paid: { label: "Payé", cls: "bg-emerald-50 text-emerald-600" },
  pending: { label: "En attente", cls: "bg-amber-50 text-amber-600" },
  failed: { label: "Échoué", cls: "bg-red-50 text-red-600" },
};

/* ─── Mini chart (sparkline) ─────────────────────────────── */
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 120;
  const h = 32;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(" L ")}`;

  return (
    <svg width={w} height={h} className="text-foreground/20">
      <path d={pathD} fill="none" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Dashboard                                                     */
/* ═══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 shimmer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 shimmer rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-64 shimmer rounded-2xl" />
          <div className="h-64 shimmer rounded-2xl" />
        </div>
      </div>
    );
  }

  const revenueValues = Object.values(stats.revenueByDay);
  const growthPositive = stats.revenueGrowth >= 0;

  const kpis = [
    {
      label: "Chiffre d'affaires",
      value: formatCurrency(stats.totalRevenue),
      subValue: `${growthPositive ? "+" : ""}${stats.revenueGrowth.toFixed(1)}% ce mois`,
      icon: DollarSign,
      trend: growthPositive,
      accent: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: "Commandes payées",
      value: stats.paidOrdersCount.toString(),
      subValue: `${stats.totalOrders} total`,
      icon: ShoppingCart,
      trend: true,
      accent: "from-blue-500 to-indigo-500",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      label: "Clients inscrits",
      value: stats.totalCustomers.toString(),
      subValue: "comptes créés",
      icon: Users,
      trend: true,
      accent: "from-purple-500 to-pink-500",
      bg: "bg-purple-50",
      text: "text-purple-600",
    },
    {
      label: "Panier moyen",
      value: formatCurrency(stats.avgOrderValue),
      subValue: `${stats.productCount} produits actifs`,
      icon: Package,
      trend: true,
      accent: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Vue d&apos;ensemble de votre activité
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="card p-5 relative overflow-hidden hover:shadow-lg"
          >
            <div
              className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-bl ${kpi.accent} opacity-[0.06] rounded-full`}
            />
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center`}
              >
                <kpi.icon size={16} className={kpi.text} />
              </div>
              {kpi.trend !== undefined && (
                <div
                  className={`flex items-center gap-0.5 text-[10px] font-bold ${
                    kpi.trend ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {kpi.trend ? (
                    <TrendingUp size={10} />
                  ) : (
                    <TrendingDown size={10} />
                  )}
                </div>
              )}
            </div>
            <p className="text-xl font-bold tracking-tight">{kpi.value}</p>
            <p className="text-[11px] text-muted mt-0.5">{kpi.subValue}</p>
          </motion.div>
        ))}
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2 card p-6 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold">Revenus (30 jours)</h2>
              <p className="text-xs text-muted mt-0.5">
                {formatCurrency(stats.thisMonthRevenue)} ce mois
              </p>
            </div>
            <Sparkline data={revenueValues} />
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-[2px] h-32 mt-2">
            {revenueValues.map((val, i) => {
              const max = Math.max(...revenueValues, 1);
              const height = (val / max) * 100;
              const date = Object.keys(stats.revenueByDay)[i];
              return (
                <div
                  key={i}
                  className="flex-1 relative group"
                  title={`${formatDate(date)} : ${formatCurrency(val)}`}
                >
                  <div
                    className="w-full bg-foreground/[0.08] hover:bg-foreground/20 rounded-t-sm transition-colors duration-200"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[9px] text-muted">
            <span>{formatDate(Object.keys(stats.revenueByDay)[0])}</span>
            <span>
              {formatDate(
                Object.keys(stats.revenueByDay)[
                  Object.keys(stats.revenueByDay).length - 1
                ]
              )}
            </span>
          </div>
        </motion.div>

        {/* Order status breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card p-6 hover:shadow-lg"
        >
          <h2 className="text-sm font-bold mb-4">Statut des commandes</h2>
          <div className="space-y-3">
            {(["received", "preparing", "shipped"] as const).map((status) => {
              const count = stats.statusCounts[status] || 0;
              const total = stats.totalOrders || 1;
              const pct = Math.round((count / total) * 100);
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg ${config.cls} flex items-center justify-center`}
                      >
                        <Icon size={12} />
                      </div>
                      <span className="text-sm font-semibold">
                        {config.label}
                      </span>
                    </div>
                    <span className="text-sm font-bold">{count}</span>
                  </div>
                  <div className="h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                      className="h-full bg-foreground/20 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Total commandes</span>
              <span className="text-lg font-bold">{stats.totalOrders}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent orders */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="card overflow-hidden hover:shadow-lg"
      >
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-sm font-bold">Dernières commandes</h2>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-muted hover:text-foreground transition-colors flex items-center gap-1"
          >
            Tout voir <ArrowUpRight size={12} />
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted">Aucune commande pour le moment.</p>
          </div>
        ) : (
          <div>
            {stats.recentOrders.map((order, i) => {
              const payment = PAYMENT_CONFIG[order.paymentStatus] ?? PAYMENT_CONFIG.pending;
              const statusCfg = STATUS_CONFIG[order.orderStatus] ?? STATUS_CONFIG.received;
              return (
                <Link
                  key={order.id}
                  href="/admin/orders"
                  className="px-6 py-3.5 flex items-center justify-between border-b border-border/30 last:border-0 hover:bg-foreground/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
                      <Package size={14} className="text-muted" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {order.customerName}
                      </p>
                      <p className="text-[11px] text-muted">
                        {formatDateFull(order.createdAt)}
                        <span className="mx-1">·</span>
                        {order.items.length} article
                        {order.items.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusCfg.cls}`}
                    >
                      {statusCfg.label}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${payment.cls}`}
                    >
                      {payment.label}
                    </span>
                    <span className="text-sm font-bold w-20 text-right">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
