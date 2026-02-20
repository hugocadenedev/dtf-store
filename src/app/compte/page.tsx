"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  LogOut,
  User,
  Calendar,
  ChevronRight,
  Ruler,
  FileText,
  X,
  CreditCard,
  Truck,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Particles } from "@/components/animations/Particles";
import type { Order } from "@/lib/types";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  received: { label: "Reçue", color: "bg-blue-100 text-blue-700" },
  producing: { label: "En production", color: "bg-amber-100 text-amber-700" },
  delivered: { label: "Livrée", color: "bg-emerald-100 text-emerald-700" },
};

const PAYMENT_MAP: Record<string, { label: string; color: string }> = {
  paid: { label: "Payé", color: "bg-emerald-100 text-emerald-700" },
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  failed: { label: "Échoué", color: "bg-red-100 text-red-700" },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ═══════════════════════════════════════════════════════════ */
/*  Order Detail Modal                                        */
/* ═══════════════════════════════════════════════════════════ */
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const status = STATUS_MAP[order.orderStatus] ?? STATUS_MAP.received;
  const payment = PAYMENT_MAP[order.paymentStatus] ?? PAYMENT_MAP.pending;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/50 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center">
                <Package size={15} className="text-white" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">Détail de commande</h2>
            </div>
            <p className="text-[10px] text-muted font-mono mt-1">{order.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-foreground/5 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Info */}
          <div className="px-6 py-5 grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0">
                <Calendar size={13} className="text-muted" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Date</p>
                <p className="text-sm font-semibold mt-0.5">{formatDateTime(order.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0">
                <CreditCard size={13} className="text-muted" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Paiement</p>
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${payment.color}`}>
                  {payment.label}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 col-span-2">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0">
                <Truck size={13} className="text-muted" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Statut</p>
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="px-6 pb-5">
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
              Articles ({order.items.length})
            </p>
            <div className="border border-border/50 rounded-xl overflow-hidden">
              {order.items.map((item, i) => (
                <div
                  key={item.id}
                  className={`px-4 py-4 ${i < order.items.length - 1 ? "border-b border-border/40" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Ruler size={12} className="text-muted shrink-0" />
                        <span className="text-sm font-bold">{item.sizeLabel}</span>
                        <span className="text-xs text-muted">× {item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span>
                          Unitaire : <strong className="text-foreground">{formatCurrency(item.unitPrice)}</strong>
                        </span>
                        <span>
                          Total : <strong className="text-foreground">{formatCurrency(item.totalPrice)}</strong>
                        </span>
                      </div>
                      {item.fileName && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <FileText size={11} className="text-muted" />
                          <span className="text-xs text-muted truncate">{item.fileName}</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with total */}
        <div className="px-6 py-4 border-t border-border/50 bg-foreground/[0.02] shrink-0 flex items-center justify-between">
          <span className="text-xs text-muted font-semibold uppercase tracking-wider">Total</span>
          <span className="text-xl font-bold">{formatCurrency(order.totalAmount)}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Main Dashboard                                            */
/* ═══════════════════════════════════════════════════════════ */
export default function ComptePage() {
  const { customer, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !customer) {
      router.push("/compte/connexion");
    }
  }, [authLoading, customer, router]);

  // Load orders
  useEffect(() => {
    if (!customer) return;
    fetch("/api/auth/orders")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setOrders(data);
        setLoadingOrders(false);
      })
      .catch(() => setLoadingOrders(false));
  }, [customer]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (authLoading) {
    return (
      <section className="bg-white -mt-[3.75rem] sm:-mt-[4.25rem] pt-0">
        <div className="p-4 sm:p-5 md:p-8 pt-7 sm:pt-8">
          <div className="hero-gradient relative w-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center" style={{ minHeight: "calc(100vh - 3rem)" }}>
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (!customer) return null;

  return (
    <section className="bg-white -mt-[3.75rem] sm:-mt-[4.25rem] pt-0">
      <div className="p-4 sm:p-5 md:p-8 pt-7 sm:pt-8">
        <div className="hero-gradient relative w-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem]" style={{ minHeight: "calc(100vh - 3rem)" }}>
          <Particles count={25} />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-24 sm:py-28">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="glass-strong rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center">
                <User size={22} className="text-foreground/70" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Bonjour, {customer.name}
                </h1>
                <p className="text-sm text-muted mt-0.5">{customer.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              <LogOut size={15} />
              Déconnexion
            </button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8"
        >
          <div className="glass rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-xs text-muted mt-1 font-medium">Commandes</p>
          </div>
          <div className="glass rounded-2xl p-5 text-center">
            <p className="text-2xl font-bold">
              {orders.filter((o) => o.orderStatus !== "delivered").length}
            </p>
            <p className="text-xs text-muted mt-1 font-medium">En cours</p>
          </div>
          <div className="glass rounded-2xl p-5 text-center hidden sm:block">
            <p className="text-2xl font-bold">
              {formatCurrency(orders.reduce((s, o) => s + o.totalAmount, 0))}
            </p>
            <p className="text-xs text-muted mt-1 font-medium">Total dépensé</p>
          </div>
        </motion.div>

        {/* Orders */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <ShoppingBag size={18} />
              Mes commandes
            </h2>
            <Link
              href="/configure/metre"
              className="btn-primary text-xs px-4 py-2"
            >
              Nouvelle commande
            </Link>
          </div>

          {loadingOrders ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-2xl p-5 h-20 shimmer" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="glass-strong rounded-3xl p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-4">
                <Package size={26} className="text-muted" />
              </div>
              <p className="text-sm font-semibold">Aucune commande pour le moment</p>
              <p className="text-sm text-muted mt-1">
                Vos commandes apparaîtront ici une fois passées.
              </p>
              <Link href="/configure/metre" className="btn-primary mt-6 inline-flex text-sm">
                Commander maintenant
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, i) => {
                const status = STATUS_MAP[order.orderStatus] ?? STATUS_MAP.received;
                return (
                  <motion.button
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full glass rounded-2xl px-5 py-4 flex items-center justify-between text-left hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0 group-hover:bg-foreground/10 transition-colors">
                        <Package size={16} className="text-muted" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="text-sm font-bold">
                            {order.items.length} article{order.items.length > 1 ? "s" : ""}
                          </p>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {formatDate(order.createdAt)}
                          <span className="mx-1.5">·</span>
                          {order.items.map((it) => it.sizeLabel).join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold">{formatCurrency(order.totalAmount)}</span>
                      <ChevronRight size={16} className="text-muted group-hover:text-foreground transition-colors" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            key={selectedOrder.id}
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
